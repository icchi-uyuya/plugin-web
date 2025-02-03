import { OpenAI } from "openai";
import { render } from "react-dom";
import { useState } from "react";
import {
  Typography,
  Autocomplete,
  TextField,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Container,
  Box,
  Stack,
} from "@mui/material";

//スタイルシートの読み込み

import { Prompt } from "./prompt";
import { BasicArticle } from "./article/basic_article";
import { Heading } from "./article/heading";

console.log("hello world! v0.1");

//FIXME 仮でハードコーディングしている
const API_RAW =
  "c2stcHJvai1iVTlhdGpVV3RWMWxXRGJVMjkxWHMwMVFaenZwZ3hhLW9YRnNKRWhiUG1WR295Xy1aMnBTYmRtNnNvRXREcXZVMGFUVi1PWWZfbVQzQmxia0ZKZGJDak1qUzcySkZjQ1dFTGltZ1BpMnZjcF9nQWtlTnB5VlFCV1dERFhTOGhyTFRoUzZrbi1HZ3lOeDIxQTlkajdCMENsNWZDa0E=";

const openai = new OpenAI({
  apiKey: atob(API_RAW),
  dangerouslyAllowBrowser: true,
});

const prompt = new Prompt(openai);

const article = new BasicArticle();

//TODO UIをMUIで統一したい
const App = () => {
  const [keywords, setKeywords] = useState(["ハンドメイド", "指輪"]);
  const [target, setTarget] = useState("カップル");
  const [title, setTitle] = useState("ハンドメイドの指輪の選び方! in 福岡");
  const [headings, setHeadings] = useState([]); //list[Heading]

  const [isGenerating, setIsGenerating] = useState(false);
  const [optTitles, setOptTitles] = useState([]);
  const [optHeadings, setOptHeadings] = useState([]);
  const [optGenerated, setOptGenerated] = useState([]);

  console.log(keywords, target, title, headings); //TODO デバッグ用
  console.log(optHeadings);

  const suggestTitles = async () => {
    const titles = await prompt.suggestTitles(keywords, target);
    setOptTitles(titles);
    console.log(titles);
  }

  const suggestHeadings = async () => {
    const headings = await prompt.suggestOutlines(title, keywords, target);
    setOptHeadings(headings);
    console.log(headings);
  };

  const addHeading = async (str) => {
    console.log(str);
    let sub = await prompt.suggestSubheadings(title, str);
    let h = new Heading(str, sub);
    console.log(`add heading: ${h.name} ${h.subs}`);
    setHeadings([...headings, h]);
  };

  const generateBody = async () => {
    //生成結果を初期化
    setIsGenerating(true);
    setOptGenerated([]);

    for (let h of headings) {
      let s = await prompt.generateBody(title, h.name, h.subs);
      setOptGenerated([...optGenerated, s]);
    }
    //生成完了の処理
    setIsGenerating(false);
  };

  return (
    <Container>
      <h2>キーワード</h2>
      <Autocomplete
        multiple
        freeSolo
        options={[]}
        value={keywords}
        onChange={(e, v) => setKeywords(v)}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="standard"
            placeholder="キーワードを入力しEnterで追加します"
          />
        )}
      />
      <h2>ターゲット</h2>
      <TextField
        variant="standard"
        placeholder="想定される記事の読者を入力してください (例: カップル)"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
      />
      <hr />

      <h2>タイトル</h2>
      <Stack alignItems={"flex-start"}>
        <Button variant="contained" onClick={suggestTitles}>
          タイトルを提案
        </Button>
        {optTitles.length > 0 && optTitles.map((v, i) => {
          const onClick = () => {
            setTitle(v);
            setOptTitles([]);
          }
          return <Chip key={i} label={v} onClick={onClick} />;
        })}
        {optTitles.length > 0 && 
          <Typography variant="caption">
            クリックで候補を採用します
          </Typography>}
        <TextField
          variant="standard"
          placeholder="記事のタイトルを入力してください"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Stack>
      <hr />

      <h2>見出し</h2>
      <Stack alignItems={"flex-start"}>
        <Button variant="contained" onClick={suggestHeadings}>
          タイトルから見出しを提案
        </Button>
        {optHeadings.length > 0 &&
          optHeadings.map((v, i) => {
            const onClick = () => {
              addHeading(v);
              setOptHeadings(optHeadings.filter((h) => h !== v));
            };
            return <Chip key={i} label={v} onClick={onClick} />;
          })}
        {optHeadings.length > 0 && 
          <Typography variant="caption">
            クリックで候補を採用します
          </Typography>}
      </Stack>
      <TextField
        variant="standard"
        placeholder="入力しEnderで手動で追加します"
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.target.value !== "") {
            addHeading(e.target.value);
            e.target.value = "";
          }
        }}
      />
      <hr />

      <h2>レイアウト</h2>
      <Typography variant="caption">
        見出しをもとに小見出しをいくつか提案しました。
        項目は自由に編集できるため、順序の変更や追加・削除、編集などを行ってから記事を生成してください。
      </Typography>
      {headings.length > 0 &&
        headings.map((v, i) => {
          return (
            <Accordion key={i} defaultExpanded>
              <AccordionSummary>
                <Typography>{v.name}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TextField multiline defaultValue={v.subs.join("\n")} />
              </AccordionDetails>
            </Accordion>
          );
        })}
      <Button variant="contained" onClick={generateBody}>
        記事を生成
      </Button>
      {isGenerating && <CircularProgress />}
      <hr />

      <h2>出力結果の確認</h2>
      {optGenerated.length > 0 &&
        optGenerated.map((v, i) => (
          <Box
            key={i}
            dangerouslyAllowBrowser
            dangerouslySetInnerHTML={{ __html: v }}
          />
        ))}
      <Button variant="contained" onClick={() => {}}>
        HTMLをコピー
      </Button>
    </Container>
  );
};

render(<App />, document.getElementById("app"));

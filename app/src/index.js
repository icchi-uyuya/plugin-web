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
  Slider
} from "@mui/material";

//スタイルシートの読み込み
//import "./scss/app.scss";
//import style from "./scss/app.module.css";

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
export const App = () => {
  const [refer, setRefer] = useState(""); //参考サイト
  const [keywords, setKeywords] = useState([]);
  const [target, setTarget] = useState("");
  const [title, setTitle] = useState("");
  const [headings, setHeadings] = useState([]); //list[Heading]

  const [isGenerating, setIsGenerating] = useState(false);
  const [optTitles, setOptTitles] = useState([]);
  const [optHeadings, setOptHeadings] = useState([]);
  const [optGenerated, setOptGenerated] = useState([]);

  console.log(keywords, target, title, headings, refer); //TODO デバッグ用
  console.log(optHeadings, optTitles);

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

    const res = [];
    for (let h of headings) {
      console.log("start generating", title, h.name, h.subs, h.length);
      let s = await prompt.generateBody(title, h.name, h.subs, h.length);
      res.push(s);
    }
    //生成完了の処理
    setOptGenerated(res);
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
      
      <h2>参考サイト</h2>
      <TextField
        variant="standard"
        placeholder="参考にするサイトのURLを入力してください"
        value={refer}
        onChange={(_, v) => setRefer(v)}
      />
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
        headings.map((head, i) => {
          return (
            <Accordion key={i} defaultExpanded>
              <AccordionSummary>
                <Typography>{head.name}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TextField 
                  multiline  //TODO コンポーネント化
                  defaultValue={head.subs.join("\n")} 
                  onChange={e => head.subs = e.target.value.split("\n")}
                />
                <Stack>
                  <Typography>文章の長さ</Typography>
                  <Slider 
                    defaultValue={500}
                    valueLabelDisplay="auto"
                    onChange={(_, v) => head.length = v}
                    step={100}
                    min={300}
                    max={1500}
                    marks
                  />
                </Stack>
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
      <Button variant="contained" onClick={() => {
        navigator.clipboard.writeText(optGenerated.join("\n"));
      }}>
        HTMLをコピー
      </Button>
    </Container>
  );
};

//render(<App />, document.getElementById("app"));

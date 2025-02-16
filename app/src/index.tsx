//基本モジュール
import { OpenAI } from "openai";
import { useRef, useState } from "react";

//Material UI
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
  Slider,
  Fab,
  Divider,
  List,
  ListItem,
  Backdrop
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

//スタイルシートの読み込み
import "./scss/app.scss";

import { Prompt } from "./prompt/prompt";
import { Heading } from "./article/heading";

console.log("hello world! v0.2");

//FIXME 仮でハードコーディングしている
const API_RAW: string =
  "c2stcHJvai1iVTlhdGpVV3RWMWxXRGJVMjkxWHMwMVFaenZwZ3hhLW9YRnNKRWhiUG1WR295Xy1aMnBTYmRtNnNvRXREcXZVMGFUVi1PWWZfbVQzQmxia0ZKZGJDak1qUzcySkZjQ1dFTGltZ1BpMnZjcF9nQWtlTnB5VlFCV1dERFhTOGhyTFRoUzZrbi1HZ3lOeDIxQTlkajdCMENsNWZDa0E=";

const openai = new OpenAI({
  apiKey: atob(API_RAW),
  dangerouslyAllowBrowser: true,
});

const prompt = new Prompt(openai);

//TODO UIをMUIで統一したい
export const App: React.FC = () => {
  const [refer, setRefer] = useState(""); //参考サイト
  const [keywords, setKeywords] = useState<string[]>([]);
  const [target, setTarget] = useState("");
  const [title, setTitle] = useState("");
  const [headings, setHeadings] = useState<Heading[]>([]); //list[Heading]

  const [isGenerating, setIsGenerating] = useState(false);
  const [optTitles, setOptTitles] = useState<string[]>([]);
  const [optHeadings, setOptHeadings] = useState<string[]>([]);
  const [optGenerated, setOptGenerated] = useState<string[]>([]);

  //内部状態
  const inputHeadingRef = useRef<HTMLInputElement>(null);
  const [selectedHeading, setSelectedHeading] = useState<Heading | undefined>();

  const suggestTitles = async () => {
    const titles = await prompt.suggestTitles(keywords, target);
    setOptTitles(titles);
  }

  const suggestHeadings = async () => {
    const headings = await prompt.suggestOutlines(title, keywords, target);
    setOptHeadings(headings);
  };

  const addHeading = async (str: string) => {
    let sub = await prompt.suggestSubheadings(title, str);
    sub.slice(0, 4)
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
      <Button onClick={() => {
        setKeywords(["プラチナ", "婚約", "指輪"]);
        setTarget("カップル");
        setTitle("カップル必見！プラチナ婚約指輪の魅力とは");
        setRefer("https://kazoku-wedding.jp/howto/party-platinumring/");
        setHeadings([
          new Heading("1. プラチナ婚約指輪とは？基本情報と特長",
            ["プラチナ婚約指輪の歴史と文化", "プラチナの持つ意味と象徴"]
          )
        ])
      }}>
        開発者モード
      </Button>
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
        onChange={e => setTarget(e.target.value)}
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
          onChange={e => setTitle(e.target.value)}
        />
      </Stack>
      <hr />

      <h2>参考サイト(実装中)</h2>
      <TextField
        variant="standard"
        placeholder="参考にするサイトのURLを入力してください"
        value={refer}
        onChange={e => setRefer(e.target.value)}
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
        inputRef={inputHeadingRef}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          const v = inputHeadingRef.current!!.value;
          console.log(v)
          if (e.key === "Enter" && v !== "") {
            e.preventDefault();
            inputHeadingRef.current!!.value = "";
            addHeading(v);
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
            <Accordion
              key={i}
              className="p-heading-form"
              defaultExpanded
            >
              <AccordionSummary>
                <Typography>{head.name}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Container>
                  <List>
                    {head.subs.map((v, i) => (
                      <div key={i}>
                        <ListItem 
                          className="sub-item" 
                          sx={{ margin: 0 }}
                        >
                          <Typography>{v}</Typography>
                        </ListItem>
                        {i < head.subs.length - 1 && <Divider />}
                      </div>
                    ))}
                  </List>
                  <Fab
                    variant="extended"
                    size="small"
                    color="primary"
                    className="add-button"
                    onClick={() => setSelectedHeading(head)}
                  >
                    <AddIcon/>
                    追加
                  </Fab>
                  <Backdrop //TODO ファイル分離
                    open={selectedHeading != undefined}
                    onClick={() => setSelectedHeading(undefined)}
                    sx={(theme) => ({ zIndex: theme.zIndex.drawer + 1 })}
                  >
                    <Container maxWidth="sm" className="p-heading-modal">
                      <h2>小見出しの追加(作成中)</h2>
                      <Typography variant="caption">
                        必要に応じて小見出しを追加します。
                        提案を使用するまたは手動で入力し小見出しのタイトルを決定してください。
                      </Typography>
                    </Container>
                  </Backdrop>
                </Container>
                <Stack>
                  <Typography>文章の長さ</Typography>
                  <Slider
                    defaultValue={500}
                    valueLabelDisplay="auto"
                    onChange={(_, v) => head.length = (v as number)}
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

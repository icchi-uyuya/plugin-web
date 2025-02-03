import { zodResponseFormat } from "openai/helpers/zod";
import { StringArray } from "./struct/response";

const LLM_MODEL = "gpt-4o-mini";

export class Prompt {
  constructor(client) {
    this.client = client;
  }

  async requestString(system_msg, user_msg) {
    let completion = await this.client.chat.completions.create({
      model: LLM_MODEL,
      messages: [
        { role: "system", content: system_msg },
        { role: "user", content: user_msg }
      ]
    })
    let res = completion.choices[0].message.content;
    if (res == undefined) {
      throw new Error("Can't parse to json");
    }
    return res;
  }

  async requestStringArray(system_msg, user_msg) {
    let completion = await this.client.beta.chat.completions.parse({
      model: LLM_MODEL,
      messages: [
        { role: "system", content: system_msg },
        { role: "user", content: user_msg }
      ],
      response_format: zodResponseFormat(StringArray, "event"),
    });
    let res = completion.choices[0].message.parsed;
    if (res == undefined) {
      throw new Error("Can't parse to json");
    }
    return res.array;
  }

  async suggestTitles(keywords, target) { //TODO typescriptに移行する
    let system_msg = "入力された要件に合うような、SEO最適化されたブログのタイトルを10個提案してください。";
    let user_msg = `
      キーワード:「${keywords.join(", ")}」 
      ターゲット: 「${target}」`;
    const res = await this.requestStringArray(system_msg, user_msg);
    return res;
  }

  async suggestSeoKeywords(keywords) {
    let system_msg = "入力された項目に関連するSEOキーワードを30個特定してください。";
    let user_msg = `キーワード:「${keywords.join(", ")}」`; 
    const res = await this.requestStringArray(system_msg, user_msg);
    return res;
  }

  async suggestOutlines(title, keywords, target) {
    let system_msg = "入力された項目を参考にして、ブログ記事のアウトラインの例を10個考えてください。";
    let user_msg = `
      記事のタイトル:「${title}」
      キーワード:「${keywords.join(", ")}」 
      ターゲット: 「${target}」`;
    const res = await this.requestStringArray(system_msg, user_msg);
    return res;
  }

  async suggestSubheadings(title, heading) {
    let system_msg = "入力された見出しに合うような、さらに内側の見出しの例を10個提案してください。";
    let user_msg = `
      記事のタイトル:「${title}」
      記事の見出し:「${heading}」`;
    const res = await this.requestStringArray(system_msg, user_msg);
    return res;
  }

  async generateBody(title, heading, subheadings) {
    let system_msg = `
      初心者を対象とした親しみやすく助けになる雰囲気で、SEOを意識した記事の本文を書いてください。
      文章は指定されたアウトラインの内容のみ書いてください。

      視点: 記事のライターとして、優しく親しみを得やすい文章を書く。

      出力: 
        - タグはマークアップ形式で出力してください。
        - 段落ごとに「p」タグで区切ってください。
        - 「##」の代わりに「h2」タグを、「###」の代わりに「h3」タグを使用してください。
        - マーカーを引きたいときは「strong」タグで囲ってください。
    `;
    let sub = subheadings.map(v => `### ${v}`).join("\n");
    let user_msg = `
      記事のタイトル:「${title}」
      アウトライン:
        ## ${heading}
        ${sub}
    `;
    const res = await this.requestString(system_msg, user_msg);
    return res;
  }

}
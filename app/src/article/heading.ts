export class Heading {

  constructor(
    // 見出しのタイトル
    public name: string, 
    // 小見出しのタイトル
    public subs: string[] = [], 
    // 文章の長さの目安
    public length: number = 300,
  ) { }

}
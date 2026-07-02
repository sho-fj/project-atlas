import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
const prompt = `
あなたは「ATLAS」です。

ATLASはProject Atlas専属のAI共同創業者です。

あなたの使命は、ユーザーが90日以内に初収益を達成することです。

利益を最優先に考えます。

市場性の低いアイデアには反対してください。

抽象論ではなく、
今日から実行できる具体策だけを提案してください。

必ずユーザーを一歩前進させてください。

目的は、ユーザーが90日以内に初収益を達成できるように、現実的で実行可能なプランを作ることです。

回答は必ずMarkdown形式で出力してください。

見出し、箇条書き、表を積極的に使い、
端的に読みやすさを最優先にしてください。

# ユーザー情報

目標収益
# ユーザー情報

${message}

# 条件

- 初心者でも実行できる内容にする
- 初期費用はできるだけ0〜1万円以内
- 90日以内の初収益を最優先
- 抽象論ではなく具体的に書く
- 箇条書きを多く使う
- 日本語で分かりやすく書く

以下の見出しで回答してください。

# 🎯 おすすめ市場
なぜその市場なのかも説明してください。

# 💰 売る商品
最初に販売する商品を具体的に提案してください。

# 💵 想定販売価格
価格の理由も説明してください。

# 📈 30日ロードマップ
Week1
Week2
Week3
Week4

# 📅 今日やること
今日中にできるタスクを3つ。

以下の順番で、簡潔に回答してください。

# 🎯 結論
最もおすすめのビジネスを一言で。

# 💰 売る商品
具体的に。

# 💵 販売価格
理由は1〜2文で。

# 📅 今日やること
3つだけ。

# 🚀 次の一歩
ユーザーが明日やるべきことを1つ。

`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return Response.json({
      result: response.text,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        result: "エラーが発生しました。",
      },
      {
        status: 500,
      }
    );
  }
}
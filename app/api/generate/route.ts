import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { goal, skill, time, interest } = await req.json();

const prompt = `
あなたは年商1億円以上の事業を複数立ち上げたAIビジネスコンサルタントです。

目的は、ユーザーが90日以内に初収益を達成できるように、現実的で実行可能なプランを作ることです。

# ユーザー情報

目標収益
${goal}

得意なこと
${skill}

使える時間
${time}

興味ジャンル
${interest}

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

# 📱 Threads投稿3本
そのまま投稿できるレベルで作成してください。

# 📝 note記事タイトル5本

# ⚠ 想定される失敗

# 🚀 次の一歩
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
import { GoogleGenAI } from "@google/genai";

type Verdict = "GO" | "HOLD" | "STOP";

type AtlasResult = {
  verdict: Verdict;
  conclusion: string;
  reasons: string[];
  decisionLog: string[];
  todayPlan: string[];
  sevenDayPlan: string[];
  ninetyDayPlan: string[];
  salesSimulation: {
    price: string;
    requiredSales: string;
    targetProfit: string;
  };
  dontDo: string[];
  todayMission: string[];
  atlasComment: string;
  atlasOneLine: string;
  nextStep: string;
};

type InterviewAnswerInput = {
  questionId: string;
  question: string;
  answer: string;
};

type AtlasProfileInput = {
  profileType: string;
  valueMap: Record<string, number>;
  strength: string[];
  weakness: string[];
  recommendedStrategy: string[];
  accuracy: number;
  version: string;
  updatedAt: string;
};

type GeneratePayload = {
  answers?: string[];
  welcomeChoice?: string;
  profile?: {
    name: string;
    targetRevenue: string;
    availableTime: string;
    currentJob: string;
    interests: string;
    startDate: string;
  };
  memory?: {
    goal: string;
    todayMission: string;
    trust: number;
    level: number;
    lastConversation: string;
    homework: string;
  };
  missions?: Array<{ id: string; label: string; done: boolean }>;
  missionHistory?: Array<{ date: string; mission: string; status: string; note: string }>;
  conversationHistory?: Array<{ date: string; content: string }>;
  atlasProfile?: AtlasProfileInput;
  interviewAnswers?: InterviewAnswerInput[];
};

const emptySalesSimulation: AtlasResult["salesSimulation"] = {
  price: "",
  requiredSales: "",
  targetProfit: "",
};

const defaultResult: AtlasResult = {
  verdict: "GO",
  conclusion: "Profileから逆算。今日60分で価格検証と販売接触を開始する。",
  reasons: ["短時間で検証できる。", "初期費用を抑えられる。", "90日以内の初収益に直結する。"],
  decisionLog: ["90日以内を優先", "販売前の作り込みを却下", "価格改善を採用", "60分以内で実行可能", "初期費用を抑える"],
  todayPlan: [
    "09:00〜09:15 競合価格を3件確認",
    "09:15〜09:35 提案価格と訴求を修正",
    "09:35〜10:00 見込み客3件へ送信",
  ],
  sevenDayPlan: [
    "Day1: 競合価格を3件確認",
    "Day2: 提案文を1本作成",
    "Day3: 見込み客3件へ送信",
    "Day4: 反応を記録",
    "Day5: 価格を修正",
    "Day6: 再送信",
    "Day7: 初回販売の可能性を判定",
  ],
  ninetyDayPlan: [
    "Phase1: 売れる可能性を確認する",
    "Phase2: 初回販売を取る",
    "Phase3: 再現性を上げる",
  ],
  salesSimulation: emptySalesSimulation,
  dontDo: ["ロゴ調整", "長期開発", "販売前の作り込み"],
  todayMission: ["競合価格を3件確認", "提案価格を修正", "3件へ送信"],
  atlasComment: "完成度より販売接触を優先。今回は売れるかどうかを最優先に変更しました。",
  atlasOneLine: "価格改善を採用。短時間で売上に近い検証から開始。",
  nextStep: "45分で価格を修正し、3件へ送信する。",
};

function buildSafeFallbackResult(
  reason: "missing_api_key" | "gemini_error" | "invalid_request",
  interviewAnswers: InterviewAnswerInput[] = [],
  atlasProfile?: AtlasProfileInput,
): AtlasResult {
  const reasonLabel = {
    missing_api_key: "GEMINI_API_KEY未設定",
    gemini_error: "AI応答エラー",
    invalid_request: "入力JSON解析エラー",
  } satisfies Record<typeof reason, string>;
  const decisionLog = buildDecisionLog(interviewAnswers, atlasProfile);

  return {
    ...defaultResult,
    salesSimulation: emptySalesSimulation,
    decisionLog: [`${reasonLabel[reason]}を検知`, ...decisionLog].slice(0, 5),
    atlasComment: `API応答を取得できません。${reasonLabel[reason]}のため、保存済みProfileと安全なfallbackから暫定Missionを生成しました。`,
    atlasOneLine: "暫定Mission。API状態を確認してから再生成。",
    nextStep: "API設定を確認し、暫定Missionとして競合価格を3件確認する。",
  };
}

function normalizeResult(
  text: string,
  interviewAnswers: InterviewAnswerInput[] = [],
  atlasProfile?: AtlasProfileInput,
): AtlasResult {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const fallbackDecisionLog = buildDecisionLog(interviewAnswers, atlasProfile);
  const fallbackAtlasComment = buildAtlasComment(interviewAnswers, atlasProfile);

  try {
    const parsed = JSON.parse(cleaned) as Partial<AtlasResult> & {
      salesSimulation?: Partial<AtlasResult["salesSimulation"]>;
      todayMission?: string | string[];
      dontDo?: string | string[];
      decisionLog?: string | string[];
    };
    const decisionLog = normalizeStringArray(parsed.decisionLog, fallbackDecisionLog);
    const todayMission = normalizeStringArray(parsed.todayMission, defaultResult.todayMission);
    const dontDo = normalizeStringArray(parsed.dontDo, defaultResult.dontDo);

    return {
      verdict: normalizeVerdict(parsed.verdict),
      conclusion: parsed.conclusion?.trim() || defaultResult.conclusion,
      reasons: normalizeStringArray(parsed.reasons, defaultResult.reasons).slice(0, 5),
      decisionLog: decisionLog.slice(0, 5),
      todayPlan: normalizeStringArray(parsed.todayPlan, defaultResult.todayPlan),
      sevenDayPlan: normalizeStringArray(parsed.sevenDayPlan, defaultResult.sevenDayPlan),
      ninetyDayPlan: normalizeStringArray(parsed.ninetyDayPlan, defaultResult.ninetyDayPlan),
      salesSimulation: {
        price: parsed.salesSimulation?.price?.trim() || defaultResult.salesSimulation.price,
        requiredSales: parsed.salesSimulation?.requiredSales?.trim() || defaultResult.salesSimulation.requiredSales,
        targetProfit: parsed.salesSimulation?.targetProfit?.trim() || defaultResult.salesSimulation.targetProfit,
      },
      dontDo,
      todayMission,
      atlasComment: parsed.atlasComment?.trim() || fallbackAtlasComment,
      atlasOneLine: parsed.atlasOneLine?.trim() || defaultResult.atlasOneLine,
      nextStep: parsed.nextStep?.trim() || defaultResult.nextStep,
    };
  } catch {
    return {
      ...defaultResult,
      salesSimulation: emptySalesSimulation,
      decisionLog: fallbackDecisionLog,
      atlasComment: fallbackAtlasComment,
    };
  }
}

function normalizeVerdict(value: unknown): Verdict {
  if (value === "HOLD" || value === "STOP") {
    return value;
  }

  return "GO";
}

function normalizeStringArray(value: unknown, fallback: string[]) {
  if (Array.isArray(value)) {
    const items = value.map((item) => String(item).trim()).filter(Boolean);
    return items.length > 0 ? items : fallback;
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return fallback;
}

function buildDecisionLog(
  interviewAnswers: InterviewAnswerInput[] = [],
  atlasProfile?: AtlasProfileInput,
) {
  const getAnswer = (ids: string[]) => interviewAnswers.find((entry) => ids.includes(entry.questionId))?.answer ?? "";
  const priority = getAnswer(["priority", "rePriority"]);
  const time = getAnswer(["weekdayTime", "reTime"]);
  const salesBlocker = getAnswer(["salesBlocker", "reSales"]);
  const cost = getAnswer(["initialCost"]);
  const aiExperience = getAnswer(["aiExperience"]);
  const continuity = getAnswer(["continuity"]);
  const logs: string[] = [];

  if (priority) {
    logs.push(`${priority}を優先条件として採用`);
  }

  if (time) {
    logs.push(`実行時間は${time}を前提に設計`);
  }

  if (salesBlocker) {
    logs.push(`${salesBlocker}の負荷を抑える`);
  }

  if (aiExperience) {
    logs.push(`AI経験: ${aiExperience}`);
  }

  if (continuity) {
    logs.push(`継続力: ${continuity}`);
  }

  if (cost) {
    logs.push(`初期費用: ${cost}`);
  }

  if (atlasProfile?.weakness.length) {
    logs.push(`弱点: ${atlasProfile.weakness.slice(0, 2).join(" / ")}を回避`);
  }

  return Array.from(new Set(logs.length > 0 ? logs : defaultResult.decisionLog)).slice(0, 5);
}

function buildAtlasComment(
  interviewAnswers: InterviewAnswerInput[] = [],
  atlasProfile?: AtlasProfileInput,
) {
  const answers = interviewAnswers.map((entry) => entry.answer);

  if (atlasProfile?.profileType) {
    return `${atlasProfile.profileType} Profileを確認。強みを使い、弱点を避ける形で本日の最適行動を生成しました。`;
  }

  if (answers.length > 0) {
    return "入力受信。面談回答から勝率の高い行動を優先しました。";
  }

  return defaultResult.atlasComment;
}

function buildPrompt(payload: GeneratePayload) {
  const interviewAnswers = payload.interviewAnswers ?? [];
  const atlasProfile = payload.atlasProfile;
  const missionHistory = payload.missionHistory ?? [];
  const missions = payload.missions ?? [];
  const conversationHistory = payload.conversationHistory ?? [];
  const summary = [payload.welcomeChoice, ...(payload.answers ?? []).filter(Boolean)].filter(Boolean).join("\n");

  return `
あなたはAtlas。チャットAIではなく、90日以内の初収益を目的にしたRevenue Operating System。
ユーザーに長文入力を求めず、面談回答とProfileから仮説を立て、理由、戦略、行動の順に返す。

出力はJSONのみ。Markdownは禁止。

必須JSON:
{
  "verdict": "GO or HOLD or STOP",
  "conclusion": "短い結論",
  "reasons": ["理由1", "理由2", "理由3"],
  "decisionLog": ["判断理由1", "判断理由2", "判断理由3", "判断理由4", "判断理由5"],
  "todayPlan": ["09:00〜09:20 行動", "09:20〜09:40 行動", "09:40〜10:00 行動"],
  "sevenDayPlan": ["Day1: 行動", "Day2: 行動", "Day3: 行動", "Day4: 行動", "Day5: 行動", "Day6: 行動", "Day7: 行動"],
  "ninetyDayPlan": ["Phase1: 行動", "Phase2: 行動", "Phase3: 行動"],
  "salesSimulation": { "price": "販売価格", "requiredSales": "必要販売数", "targetProfit": "利益" },
  "dontDo": ["やらないこと1", "やらないこと2", "やらないこと3"],
  "todayMission": ["60分以内の行動1", "60分以内の行動2", "60分以内の行動3"],
  "atlasComment": "今回なぜ優先順位を変更したか",
  "atlasOneLine": "短い一言",
  "nextStep": "次の一手"
}

判断ルール:
- 90日以内を優先
- 完成度より販売検証を優先
- 長期開発、ロゴ調整、販売前の作り込みは却下
- 今日のMissionは60分以内
- decisionLogはProfileと面談回答から判断した事実を書く
- 禁止語: いいですね、頑張りましょう、いかがでしょうか、一般的には、かもしれません

面談回答:
${interviewAnswers.length > 0 ? interviewAnswers.map((entry) => `${entry.question}: ${entry.answer}`).join("\n") : "未登録"}

Atlas Profile:
${atlasProfile ? `Type: ${atlasProfile.profileType}
Accuracy: ${atlasProfile.accuracy}%
Strength: ${atlasProfile.strength.join(" / ")}
Weakness: ${atlasProfile.weakness.join(" / ")}
Recommended Strategy: ${atlasProfile.recommendedStrategy.join(" / ")}
Updated At: ${atlasProfile.updatedAt}` : "未生成"}

ユーザー入力:
${summary || "未登録"}

Memory:
${payload.memory ? `Goal: ${payload.memory.goal}
Today Mission: ${payload.memory.todayMission}
Trust: ${payload.memory.trust}
Level: ${payload.memory.level}
Last Conversation: ${payload.memory.lastConversation}` : "未登録"}

Mission:
${missions.length > 0 ? missions.map((mission) => `${mission.label}: ${mission.done ? "完了" : "未完了"}`).join(" / ") : "未登録"}

Mission History:
${missionHistory.length > 0 ? missionHistory.slice(0, 8).map((entry) => `${entry.date} / ${entry.mission} / ${entry.status}`).join("\n") : "未登録"}

Conversation History:
${conversationHistory.length > 0 ? conversationHistory.slice(0, 5).map((entry) => `${entry.date}: ${entry.content}`).join("\n") : "未登録"}
`;
}

export async function POST(req: Request) {
  let payload: GeneratePayload;

  try {
    payload = (await req.json()) as GeneratePayload;
  } catch {
    return Response.json({
      result: buildSafeFallbackResult("invalid_request"),
      meta: {
        source: "fallback",
        reason: "invalid_request",
      },
    });
  }

  const interviewAnswers = payload.interviewAnswers ?? [];
  const atlasProfile = payload.atlasProfile;

  if (!process.env.GEMINI_API_KEY) {
    return Response.json({
      result: buildSafeFallbackResult("missing_api_key", interviewAnswers, atlasProfile),
      meta: {
        source: "fallback",
        reason: "missing_api_key",
      },
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: buildPrompt(payload),
    });

    return Response.json({
      result: normalizeResult(response.text ?? "", interviewAnswers, atlasProfile),
      meta: {
        source: "gemini",
      },
    });
  } catch {
    return Response.json({
      result: buildSafeFallbackResult("gemini_error", interviewAnswers, atlasProfile),
      meta: {
        source: "fallback",
        reason: "gemini_error",
      },
    });
  }
}

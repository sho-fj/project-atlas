import { GoogleGenAI } from "@google/genai";

type Verdict = "GO" | "HOLD" | "STOP";

type MissionDraft = {
  title: string;
  action?: string;
  deliverable?: string;
  doneCriteria?: string;
  timeEstimate?: string;
  example?: string;
};

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
  todayMission: MissionDraft[];
  atlasComment: string;
  atlasOneLine: string;
  nextStep: string;
  needsMoreInfo: boolean;
  followUpQuestions: string[];
};

type InterviewAnswerInput = {
  questionId: string;
  question: string;
  answer: string;
};

type FollowUpAnswerInput = {
  question: string;
  answer: string;
};

type ReadinessNeed = {
  key: "goal" | "customerProblem" | "offerOrStrength" | "availableTime" | "availableBudget";
  question: string;
};

const followUpQuestionConfig = {
  goal: {
    question: "何を目指していますか？",
    options: ["まず副収入を作りたい", "将来的に独立したい", "新しい可能性を探したい", "まだ分からない"],
  },
  customerProblem: {
    question: "誰のどんな悩みを扱いたいですか？",
    options: ["仕事で困っている人", "自分と似た悩みを持つ人", "身近な人", "まだ分からない"],
  },
  offerOrStrength: {
    question: "今、使えそうなものはありますか？",
    options: ["これまでの仕事経験", "人から頼まれること", "趣味や詳しいこと", "まだ分からない"],
  },
  availableTime: {
    question: "週にどれくらい時間を使えますか？",
    options: ["1時間未満", "1〜3時間", "4〜7時間", "8時間以上"],
  },
  availableBudget: {
    question: "最初に使える費用はどれくらいですか？",
    options: ["0円", "1万円まで", "5万円まで", "それ以上"],
  },
} satisfies Record<ReadinessNeed["key"], { question: string; options: string[] }>;

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
  missions?: Array<{
    id: string;
    label?: string;
    title?: string;
    done: boolean;
    action?: string;
    deliverable?: string;
    doneCriteria?: string;
    timeEstimate?: string;
    example?: string;
  }>;
  missionHistory?: Array<{ date: string; mission: string; status: string; note: string }>;
  conversationHistory?: Array<{ date: string; content: string }>;
  atlasProfile?: AtlasProfileInput;
  interviewAnswers?: InterviewAnswerInput[];
  followUpAnswers?: FollowUpAnswerInput[];
  missionContinuation?: {
    outcome: "できた" | "反応待ち" | "うまくいかなかった" | "別の発見があった";
    completedMissions: Array<{
      title: string;
      action?: string;
      deliverable?: string;
      doneCriteria?: string;
      timeEstimate?: string;
    }>;
  };
};

const emptySalesSimulation: AtlasResult["salesSimulation"] = {
  price: "",
  requiredSales: "",
  targetProfit: "",
};

const defaultResult: AtlasResult = {
  verdict: "GO",
  conclusion: "Profileから逆算。今日60分で販売接触を開始する。",
  reasons: ["入力負荷が低い。", "初期費用を抑えられる。", "90日以内の初収益に直結する。"],
  decisionLog: ["Profile条件を採用", "初期費用を抑える", "販売接触を優先", "60分以内で実行可能", "90日以内を優先"],
  todayPlan: [
    "09:00-09:20 Profile条件を1枚に整理",
    "09:20-09:40 買う可能性がある相手を10件抽出",
    "09:40-10:00 短い提案文を3件送信",
  ],
  sevenDayPlan: ["Day1: 候補10件抽出", "Day2: 提案文作成", "Day3: 5件送信"],
  ninetyDayPlan: ["Phase1: 売れる仮説を作る", "Phase2: 初回販売を取る", "Phase3: 再現性を上げる"],
  salesSimulation: emptySalesSimulation,
  dontDo: ["ロゴ調整", "長期開発", "販売前の作り込み"],
  todayMission: [
    {
      title: "競合価格を3件確認",
      action: "同じ悩みを解決している競合を3件探し、価格と提供内容を1行ずつ記録する",
      deliverable: "競合価格メモ3行",
      doneCriteria: "競合名、価格、提供内容が3件分そろっている",
      timeEstimate: "20分",
    },
    {
      title: "提案価格を修正",
      action: "競合価格メモを見て、今日送る提案価格を1つ決める",
      deliverable: "提案価格1つ",
      doneCriteria: "送信文に入れる価格が1つ決まっている",
      timeEstimate: "10分",
    },
    {
      title: "3件へ送信",
      action: "見込み客3人に短い提案文を送る",
      deliverable: "送信済み提案3件",
      doneCriteria: "3人に送信し、送信先と送信時刻を記録している",
      timeEstimate: "30分",
    },
  ],
  atlasComment: "完成度より販売接触を優先。売れるかどうかを最優先に変更しました。",
  atlasOneLine: "制約内で勝率が高い接触から開始。",
  nextStep: "今日60分で候補10件を抽出し、3件へ提案を送信する。",
  needsMoreInfo: false,
  followUpQuestions: [],
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
    needsMoreInfo: false,
    followUpQuestions: [],
  };
}

function normalizeResult(
  text: string,
  payload: GeneratePayload,
  interviewAnswers: InterviewAnswerInput[] = [],
  atlasProfile?: AtlasProfileInput,
): AtlasResult {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const fallbackDecisionLog = buildDecisionLog(interviewAnswers, atlasProfile);
  const fallbackAtlasComment = buildAtlasComment(interviewAnswers, atlasProfile);

  try {
    const parsed = JSON.parse(cleaned) as Partial<AtlasResult> & {
      salesSimulation?: Partial<AtlasResult["salesSimulation"]>;
      todayMission?: string | string[] | Partial<MissionDraft>[];
      dontDo?: string | string[];
      decisionLog?: string | string[];
      followUpQuestions?: string | string[];
    };
    const decisionLog = normalizeStringArray(parsed.decisionLog, fallbackDecisionLog);
    const todayMission = normalizeMissionArray(parsed.todayMission, defaultResult.todayMission);
    const dontDo = normalizeStringArray(parsed.dontDo, defaultResult.dontDo);
    const followUpQuestions = normalizeStringArray(parsed.followUpQuestions, []).slice(0, 3);

    const normalized = {
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
      needsMoreInfo: parsed.needsMoreInfo === true && followUpQuestions.length > 0,
      followUpQuestions,
    };
    return applyHardReadinessGate(payload, normalized);
  } catch {
    return applyHardReadinessGate(payload, {
      ...defaultResult,
      salesSimulation: emptySalesSimulation,
      decisionLog: fallbackDecisionLog,
      atlasComment: fallbackAtlasComment,
    });
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

function normalizeMissionArray(value: unknown, fallback: MissionDraft[]) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [];
    }

    const items = value
      .map((item): MissionDraft | null => {
        if (typeof item === "string" && item.trim()) {
          return { title: item.trim() };
        }

        if (!item || typeof item !== "object") {
          return null;
        }

        const mission = item as Partial<MissionDraft>;
        const title = mission.title?.trim();

        if (!title) {
          return null;
        }

        return {
          title,
          action: mission.action?.trim() || undefined,
          deliverable: mission.deliverable?.trim() || undefined,
          doneCriteria: mission.doneCriteria?.trim() || undefined,
          timeEstimate: mission.timeEstimate?.trim() || undefined,
          example: mission.example?.trim() || undefined,
        };
      })
      .filter((item): item is MissionDraft => Boolean(item));

    return items.length > 0 ? items : fallback;
  }

  if (typeof value === "string" && value.trim()) {
    return [{ title: value.trim() }];
  }

  return fallback;
}

function hasSubstance(value?: string) {
  if (!value) {
    return false;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[ 　\t\r\n]+/g, "")
    .replace(/[。．、，,!.！?？ー\-]/g, "");
  return Boolean(
    normalized &&
      ![
        "unknown",
        "未確認",
        "未設定",
        "未登録",
        "なし",
        "n/a",
        "分からない",
        "わからない",
        "未定",
        "まだ決めていない",
        "特になし",
        "その他",
        "なんとなく",
      ]
        .map((item) => item.toLowerCase().replace(/[ 　\t\r\n]+/g, ""))
        .includes(normalized),
  );
}

function collectUserEvidence(payload: GeneratePayload) {
  const answerValuesFromLegacyAnswers = (payload.answers ?? []).map((entry) => {
    const separatorIndex = entry.indexOf(":");
    return separatorIndex >= 0 ? entry.slice(separatorIndex + 1).trim() : entry.trim();
  });

  return {
    answerValues: [
      ...answerValuesFromLegacyAnswers,
      ...(payload.interviewAnswers ?? []).map((entry) => entry.answer),
      ...(payload.followUpAnswers ?? []).map((entry) => entry.answer),
    ].filter(hasSubstance),
    missionResultValues: (payload.missionHistory ?? [])
      .flatMap((entry) => [entry.mission, entry.note])
      .filter(hasSubstance),
    availableTime: payload.interviewAnswers?.find((entry) => ["weekdayTime", "reTime"].includes(entry.questionId))?.answer ?? "",
    goal:
      payload.interviewAnswers?.find((entry) => ["revenueTarget", "reMoney", "priority", "rePriority"].includes(entry.questionId))
        ?.answer ?? "",
    customerProblem:
      payload.interviewAnswers?.find((entry) => ["who", "customer", "problem", "customerProblem", "reCustomer"].includes(entry.questionId))
        ?.answer ?? "",
    offerOrStrength:
      payload.followUpAnswers?.find((entry) => hasSubstance(entry.answer) && /提供|できる|得意|経験|強み|スキル|価値/.test(entry.question))
        ?.answer ??
      payload.interviewAnswers?.find((entry) => ["value", "offer", "strength", "experience", "reOffer"].includes(entry.questionId))
        ?.answer ??
      "",
    availableBudget:
      payload.interviewAnswers?.find((entry) => ["initialCost", "budget", "reBudget"].includes(entry.questionId))?.answer ?? "",
    answeredFollowUpKeys: (payload.followUpAnswers ?? [])
      .map((entry) => entry.question as ReadinessNeed["key"])
      .filter((key): key is ReadinessNeed["key"] => key in followUpQuestionConfig),
  };
}

function containsConcreteOfferOrStrength(values: string[]) {
  return values.some((value) => {
    const normalized = value.trim();
    return hasSubstance(normalized) && normalized.length >= 4 && /経験|実績|得意|スキル|作れる|教えられる|支援|代行|改善|設計|分析|開発|営業|制作/.test(normalized);
  });
}

function detectReadinessNeeds(payload: GeneratePayload, result: AtlasResult): ReadinessNeed[] {
  const evidence = collectUserEvidence(payload);
  const hasGoal = hasSubstance(evidence.goal);
  const hasCustomerProblem = hasSubstance(evidence.customerProblem);
  const hasOfferOrStrength = containsConcreteOfferOrStrength([
    evidence.offerOrStrength,
    ...evidence.answerValues,
    ...evidence.missionResultValues,
  ]);
  const hasAvailableTime = hasSubstance(evidence.availableTime);
  const budgetRequiredByMission = result.todayMission.some((mission) =>
    [mission.title, mission.action, mission.deliverable, mission.doneCriteria]
      .filter(Boolean)
      .join(" ")
      .match(/広告|出稿|ツール|開発|制作|外注|仕入|購入|有料/),
  );
  const hasAvailableBudget = hasSubstance(evidence.availableBudget);

  const needs: ReadinessNeed[] = [];

  if (!hasGoal) {
    needs.push({ key: "goal", question: "何を目指していますか？" });
  }

  if (!hasCustomerProblem) {
    needs.push({ key: "customerProblem", question: "誰のどんな悩みを扱いたいですか？" });
  }

  if (!hasOfferOrStrength) {
    needs.push({ key: "offerOrStrength", question: "あなたが提供できそうなことは何ですか？" });
  }

  if (!hasAvailableTime) {
    needs.push({ key: "availableTime", question: "週に何時間使えますか？" });
  }

  if (budgetRequiredByMission && !hasAvailableBudget) {
    needs.push({ key: "availableBudget", question: "初期費用はいくらまで使えますか？" });
  }

  return needs.filter((need) => !evidence.answeredFollowUpKeys.includes(need.key));
}

function buildDiscoveryMission(unresolvedNeeds: ReadinessNeed["key"][]): MissionDraft[] {
  const missionMap: Partial<Record<ReadinessNeed["key"], MissionDraft>> = {
    goal: {
      title: "今の生活で変えたいことを3つ選ぶ",
      action: "今の生活や働き方で変えたいことを3つ箇条書きにする",
      deliverable: "変えたいこと3項目",
      doneCriteria: "3項目が短文で書き出せている",
      timeEstimate: "10分",
    },
    customerProblem: {
      title: "自分がよく知る3つの困りごとを書き出す",
      action: "自分や身近な人がよく困ることを3つ書き出す",
      deliverable: "困りごと3項目",
      doneCriteria: "3つの困りごとが具体的に並んでいる",
      timeEstimate: "10分",
    },
    offerOrStrength: {
      title: "人から頼まれたことを3つ振り返る",
      action: "これまで人から頼まれたことや感謝されたことを3つ書き出す",
      deliverable: "頼まれたこと3項目",
      doneCriteria: "3項目が思い出せている",
      timeEstimate: "10分",
    },
  };

  const first = unresolvedNeeds.find((need) => missionMap[need]);
  return first && missionMap[first] ? [missionMap[first] as MissionDraft] : [];
}

function applyHardReadinessGate(payload: GeneratePayload, result: AtlasResult) {
  const needs = detectReadinessNeeds(payload, result);
  const missionText = result.todayMission
    .flatMap((mission) => [mission.title, mission.action, mission.deliverable, mission.doneCriteria])
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const missionIsTooAggressive =
    /営業|価格|値付|広告|開発|実装|出稿|提案/.test(missionText) &&
    needs.some((need) => ["goal", "customerProblem", "offerOrStrength"].includes(need.key));

  if (needs.length === 0 && !missionIsTooAggressive) {
    return result;
  }

  const followUpQuestions = needs.slice(0, 3).map((need) => need.key);
  const discoveryMission = followUpQuestions.length === 0 ? buildDiscoveryMission(needs.map((need) => need.key)) : [];

  return {
    ...result,
    verdict: followUpQuestions.length > 0 ? ("HOLD" as const) : result.verdict,
    conclusion:
      followUpQuestions.length > 0
        ? "追加情報を確認してから次のMissionを判断します。"
        : "不明な項目を見つけるための小さなDiscovery Missionから始めます。",
    reasons: ["次のMission判断に必要な情報がまだ不足しています。", ...result.reasons].slice(0, 5),
    nextStep: discoveryMission[0]?.title ?? followUpQuestions[0] ?? result.nextStep,
    needsMoreInfo: followUpQuestions.length > 0,
    followUpQuestions,
    todayMission: followUpQuestions.length > 0 ? [] : discoveryMission.length > 0 ? discoveryMission : result.todayMission,
  };
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
    logs.push(`稼働時間は${time}を前提に設計`);
  }

  if (salesBlocker) {
    logs.push(`${salesBlocker}の壁を先に解消する`);
  }

  if (aiExperience) {
    logs.push(`AI活用経験: ${aiExperience}`);
  }

  if (continuity) {
    logs.push(`継続条件: ${continuity}`);
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
    return `${atlasProfile.profileType} Profileを前提に、強みを使い、弱点を避ける形で本日の優先順位を作成しました。`;
  }

  if (answers.length > 0) {
    return "入力内容と制約を踏まえ、売上に近い行動を優先して本日の優先順位を作成しました。";
  }

  return defaultResult.atlasComment;
}

function buildCurrentStateMap(payload: GeneratePayload) {
  const interviewAnswers = payload.interviewAnswers ?? [];
  const followUpAnswers = payload.followUpAnswers ?? [];
  const atlasProfile = payload.atlasProfile;
  const missionHistory = payload.missionHistory ?? [];
  const missions = payload.missions ?? [];
  const conversationHistory = payload.conversationHistory ?? [];
  const missionContinuation = payload.missionContinuation;
  const completedMissions = missionContinuation?.completedMissions ?? [];
  const summary = [payload.welcomeChoice, ...(payload.answers ?? []).filter(Boolean)].filter(Boolean);
  const memory = payload.memory;
  const recentMissionHistory = missionHistory.slice(-3);
  const recentConversationHistory = conversationHistory.slice(-3);

  return [
    "Current State Map:",
    "- Build this map before verdict or Mission generation.",
    "- Use only the provided Atlas Profile, Interview Answers, Follow Up Answers, completed Missions, Mission History, Conversation History, Summary, and Memory.",
    "- Do not invent facts the user did not say.",
    "- If a field is not supported by evidence, write unknown or 未確認.",
    "- Keep facts and inference separate. If you infer, say it is tentative.",
    "- Prefer newer actions, outcomes, and conversation over older summaries.",
    "- Mission generation must explicitly reference this Current State Map.",
    "- If missingCriticalInfo exists, do not rush into a definitive next step. Prefer a prerequisite or clarification Mission.",
    "- currentStage must be chosen only from: exploring, defining, validating, selling, repeating, optimizing, scaling, unknown.",
    "",
    "Current State Map fields to fill:",
    `goal: ${memory?.goal?.trim() || payload.profile?.targetRevenue?.trim() || "unknown"}`,
    "currentStage: choose from exploring, defining, validating, selling, repeating, optimizing, scaling, unknown based on evidence only",
    "decided: list only decisions already made and supported by evidence",
    "undecided: list what remains undecided based on conflicting, missing, or absent evidence",
    "constraints: summarize only explicit time, budget, job, environment, or capability constraints",
    `availableTime: ${payload.profile?.availableTime?.trim() || "unknown"}`,
    "availableBudget: use only explicit budget or cost information, otherwise unknown",
    `strengths: ${atlasProfile?.strength.length ? atlasProfile.strength.join(" / ") : "unknown"}`,
    "attemptedActions: summarize only actions already tried",
    "observedResults: summarize only observed outcomes from those actions",
    "biggestBlocker: the strongest current blocker supported by recent evidence, otherwise unknown",
    "missingCriticalInfo: the single most important missing information for the next decision, otherwise unknown",
    "",
    "Evidence for Current State Map:",
    `- Atlas Profile: ${atlasProfile ? `Type: ${atlasProfile.profileType}; Strength: ${atlasProfile.strength.join(" / ") || "unknown"}; Weakness: ${atlasProfile.weakness.join(" / ") || "unknown"}; Recommended Strategy: ${atlasProfile.recommendedStrategy.join(" / ") || "unknown"}; Updated At: ${atlasProfile.updatedAt}` : "未確認"}`,
    `- Interview Answers: ${interviewAnswers.length > 0 ? interviewAnswers.map((entry) => `${entry.question}: ${entry.answer}`).join(" | ") : "未確認"}`,
    `- Follow Up Answers: ${followUpAnswers.length > 0 ? followUpAnswers.map((entry) => `${entry.question}: ${entry.answer}`).join(" | ") : "未確認"}`,
    `- Completed Missions: ${completedMissions.length > 0 ? completedMissions.map((mission) => mission.title).join(" / ") : "未確認"}`,
    `- Mission History: ${recentMissionHistory.length > 0 ? recentMissionHistory.map((entry) => `${entry.date} / ${entry.mission} / ${entry.status}${entry.note ? ` / ${entry.note}` : ""}`).join(" | ") : "未確認"}`,
    `- Conversation History: ${recentConversationHistory.length > 0 ? recentConversationHistory.map((entry) => `${entry.date}: ${entry.content}`).join(" | ") : "未確認"}`,
    `- Summary: ${summary.length > 0 ? summary.join(" | ") : "未確認"}`,
    `- Memory: ${memory ? `Goal: ${memory.goal || "unknown"}; Today Mission: ${memory.todayMission || "unknown"}; Last Conversation: ${memory.lastConversation || "unknown"}; Homework: ${memory.homework || "unknown"}` : "未確認"}`,
    `- Active Missions: ${missions.length > 0 ? missions.map((mission) => `${mission.title ?? mission.label ?? "Mission"} (${mission.done ? "done" : "not done"})`).join(" / ") : "未確認"}`,
    `- Mission Outcome: ${missionContinuation?.outcome || "未確認"}`,
  ].join("\n");
}

function buildPrompt(payload: GeneratePayload) {
  const interviewAnswers = payload.interviewAnswers ?? [];
  const followUpAnswers = payload.followUpAnswers ?? [];
  const atlasProfile = payload.atlasProfile;
  const missionHistory = payload.missionHistory ?? [];
  const missions = payload.missions ?? [];
  const conversationHistory = payload.conversationHistory ?? [];
  const missionContinuation = payload.missionContinuation;
  const summary = [payload.welcomeChoice, ...(payload.answers ?? []).filter(Boolean)].filter(Boolean).join("\n");
  const currentStateMap = buildCurrentStateMap(payload);
  const exampleFormatting = [
    "Example Formatting:",
    "- Return example as plain text only.",
    "- Do not use Markdown markers such as **, __, #, -, or ` for styling.",
    "- Keep line breaks in the example body.",
    '- Write labels like "件名：" and "挨拶：" as normal text, not Markdown.',
  ].join("\n");

  const missionReadinessRules = [
    "Mission Readiness Rules:",
    "- Before creating todayMission, inspect Atlas Profile, Interview Answers, Follow Up Answers, Mission History, completed Missions, Memory, Summary, and Conversation History.",
    "- Build and review the Current State Map first, then use it as the main reference for verdict and Mission generation.",
    "- Decide todayMission in this order: 1) confirm what the user has already decided, 2) identify prerequisites for the next action, 3) if prerequisites are missing, assign the immediately previous prerequisite-building Mission, 4) only if prerequisites are ready, assign the smallest execution Mission.",
    "- The Mission must be doable today, preferably within 60 minutes, low risk, minimal in scope, and must not skip the previous stage.",
    "- Do not assign company sales outreach unless target customer, customer problem, and offered value are already clear.",
    "- Do not assign proposal-writing unless who receives it and what is offered are already clear.",
    "- Do not assign price-setting unless the offer or deliverable is already clear.",
    "- As a rule, do not assign development before demand has been checked.",
    "- Do not assign advertising before a small response test has been done.",
    "- Do not assign incorporation, hiring, tooling purchases, or other large investments before initial revenue validation.",
    "- If the user's current position is unclear, prefer a prerequisite Mission such as listing three values they can provide, choosing one smallest testable offer, or tentatively deciding whose problem they will solve.",
    "- Preserve the existing Mission detail structure: title, action, deliverable, doneCriteria, timeEstimate, example.",
  ].join("\n");
  const missionContinuationRules = missionContinuation
    ? [
        "Mission Continuation Rules:",
        "- This request is after Mission completion. Do not require a full Interview and do not ask interview questions.",
        "- Rejudge the user's current position using Mission Outcome, Completed Mission, Atlas Profile, Follow Up Answers, Mission History, and Conversation History.",
        "- Rebuild the Current State Map from the latest evidence before deciding GO or HOLD.",
        "- If the user can move now, return verdict GO and create the next smallest Mission in todayMission using the existing fields: title, action, deliverable, doneCriteria, timeEstimate, example.",
        "- If the user should not move now, return verdict HOLD, return todayMission as an empty array, set conclusion to a short waiting judgment, put the reason in reasons[0], and put the restart condition in nextStep.",
        "- For outcome '反応待ち', prefer HOLD unless there is a low-risk preparation task that does not skip the waiting step.",
        "- For outcome 'うまくいかなかった' or '別の発見があった', use the result as evidence and choose either a smaller correction Mission or HOLD if more observation is needed.",
      ].join("\n")
    : "";

  return `${exampleFormatting}

あなたはAtlas。ユーザーの制約を踏まえて、今日そのまま着手できるMissionを返します。
出力はJSONのみ。Markdownは禁止。

JSON:
{
  "verdict": "GO or HOLD or STOP",
  "conclusion": "短い結論",
  "reasons": ["理由1", "理由2", "理由3"],
  "decisionLog": ["判断材料1", "判断材料2", "判断材料3", "判断材料4", "判断材料5"],
  "todayPlan": ["09:00-09:20 行動", "09:20-09:40 行動", "09:40-10:00 行動"],
  "sevenDayPlan": ["Day1: 行動", "Day2: 行動", "Day3: 行動"],
  "ninetyDayPlan": ["Phase1: 行動", "Phase2: 行動", "Phase3: 行動"],
  "salesSimulation": { "price": "販売価格", "requiredSales": "必要販売数", "targetProfit": "利益" },
  "dontDo": ["やらないこと1", "やらないこと2", "やらないこと3"],
  "todayMission": [
    {
      "title": "動詞 + 成果物を含むMission名",
      "action": "何をするかを具体的に書く",
      "deliverable": "何を作るかを書く",
      "doneCriteria": "どこまでやれば完了かを書く",
      "timeEstimate": "何分でやるかを書く",
      "example": "成果物そのものだけを書く。改行を含め、そのままコピーして少し書き換えれば使える本文にする"
    }
  ],
  "atlasComment": "今回なぜ優先順位を変更したか",
  "atlasOneLine": "短い一言",
  "nextStep": "次の一手",
  "needsMoreInfo": false,
  "followUpQuestions": ["短く具体的な質問1", "短く具体的な質問2"]
}

判断ルール:
- todayMissionは可能な限りオブジェクト配列で返す
- 各Missionは title, action, deliverable, doneCriteria, timeEstimate を持つ
- Missionは「動詞 + 成果物 + 完了条件」が分かる内容にする
- actionは最初に何をするかが分かる実行指示にする
- deliverableは完成物そのものを書く
- doneCriteriaは数や状態で判定できる完了条件にする
- timeEstimateは「20分」「45分」のように短く書く
- exampleは成果物そのものだけを書く。説明文やメタ文は入れない
- exampleは改行を含めてよく、そのままコピーして自分用に少し書き換えれば使える形にする
- exampleを自然に作れないMissionではexampleを省略してよい
- ユーザーが提供していない実績、顧客名、導入事例、売上実績を捏造しない
- 必要な固有名詞がない場合は「相手A」「○○」「△△」などの仮名を使う

- needsMoreInfoは、現在の判断を大きく左右する重要情報が不足している時だけtrueにする
- 情報が十分なら needsMoreInfo は false、followUpQuestions は [] にする
- followUpQuestionsは最大3問
- 質問は、そのユーザーの不足情報だけを聞く。既にProfile、Interview、History、Memoryで分かっていることは聞かない
- 1問は短く、答えやすく、長文入力を前提にしない
- 一般論の質問や広すぎる質問はしない
- missingCriticalInfo が次の判断に重要なら、その不足だけを具体的に質問する
${missionReadinessRules}
${missionContinuationRules ? `\n${missionContinuationRules}` : ""}

${currentStateMap}

Interview Answers:
${interviewAnswers.length > 0 ? interviewAnswers.map((entry) => `${entry.question}: ${entry.answer}`).join("\n") : "未登録"}

Follow Up Answers:
${followUpAnswers.length > 0 ? followUpAnswers.map((entry) => `${entry.question}: ${entry.answer}`).join("\n") : "未登録"}

Atlas Profile:
${atlasProfile ? `Type: ${atlasProfile.profileType}
Accuracy: ${atlasProfile.accuracy}%
Strength: ${atlasProfile.strength.join(" / ")}
Weakness: ${atlasProfile.weakness.join(" / ")}
Recommended Strategy: ${atlasProfile.recommendedStrategy.join(" / ")}
Updated At: ${atlasProfile.updatedAt}` : "未登録"}

Summary:
${summary || "未登録"}

Memory:
${payload.memory ? `Goal: ${payload.memory.goal}
Today Mission: ${payload.memory.todayMission}
Trust: ${payload.memory.trust}
Level: ${payload.memory.level}
Last Conversation: ${payload.memory.lastConversation}` : "未登録"}

Mission:
${missions.length > 0 ? missions.map((mission) => `${mission.title ?? mission.label ?? "Mission"}: ${mission.done ? "完了" : "未完了"}`).join(" / ") : "未登録"}

Mission Outcome:
${missionContinuation ? missionContinuation.outcome : "未登録"}

Completed Mission Detail:
${missionContinuation?.completedMissions.length ? missionContinuation.completedMissions.map((mission) => [
  `Title: ${mission.title}`,
  mission.action ? `Action: ${mission.action}` : "",
  mission.deliverable ? `Deliverable: ${mission.deliverable}` : "",
  mission.doneCriteria ? `Done Criteria: ${mission.doneCriteria}` : "",
  mission.timeEstimate ? `Time Estimate: ${mission.timeEstimate}` : "",
].filter(Boolean).join(" / ")).join("\n") : "未登録"}

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
      result: normalizeResult(response.text ?? "", payload, interviewAnswers, atlasProfile),
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

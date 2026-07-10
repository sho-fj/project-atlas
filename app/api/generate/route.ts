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

type CurrentStage =
  | "exploring"
  | "defining"
  | "validating"
  | "selling"
  | "repeating"
  | "optimizing"
  | "scaling"
  | "unknown";

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
  currentStage: CurrentStage,
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
    return applyEvidenceQualityGate(
      payload,
      applyStageFitGate(payload, applyHardReadinessGate(payload, normalized), currentStage),
    );
  } catch {
    return applyEvidenceQualityGate(
      payload,
      applyStageFitGate(payload, applyHardReadinessGate(payload, {
        ...defaultResult,
        salesSimulation: emptySalesSimulation,
        decisionLog: fallbackDecisionLog,
        atlasComment: fallbackAtlasComment,
      }), currentStage),
    );
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

function stripMarkdown(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/^\s*[-*#]\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/[`]/g, "")
    .trim();
}

function buildMissionExample(mission: Pick<MissionDraft, "title" | "action" | "deliverable" | "doneCriteria">) {
  const title = mission.title.trim();
  const action = mission.action?.trim();
  const deliverable = mission.deliverable?.trim();
  const doneCriteria = mission.doneCriteria?.trim();
  const lower = `${title} ${action ?? ""} ${deliverable ?? ""}`.toLowerCase();

  if (/価格|競合/.test(lower)) {
    return stripMarkdown(
      "競合A 30000円 週1回相談\n競合B 50000円 チャット相談付き\n競合C 20000円 単発アドバイス",
    );
  }

  if (/提案|送信|営業|連絡|メッセージ/.test(lower)) {
    return stripMarkdown(
      "相手Aさん\n突然のご連絡失礼します。\n○○の課題を見て、△△でお手伝いできると思いご連絡しました。\n必要であれば、まずは短く状況を伺えます。",
    );
  }

  if (/困りごと|悩み|書き出/.test(lower)) {
    return stripMarkdown("1. 毎日の作業が手間\n2. 情報整理に時間がかかる\n3. 続け方が分からない");
  }

  if (/頼まれたこと|振り返/.test(lower)) {
    return stripMarkdown("1. 資料を見やすく整える\n2. 手順を分かりやすく説明する\n3. 作業の進め方を整理する");
  }

  if (/変えたいこと|選ぶ/.test(lower)) {
    return stripMarkdown("1. 収入源を増やしたい\n2. 時間の使い方を改善したい\n3. 将来の選択肢を増やしたい");
  }

  return stripMarkdown(
    [
      title,
      action ? `やること: ${action}` : "",
      deliverable ? `完成物: ${deliverable}` : "",
      doneCriteria ? `完了条件: ${doneCriteria}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
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
          example: stripMarkdown(mission.example?.trim() || "") || buildMissionExample({
            title,
            action: mission.action?.trim() || undefined,
            deliverable: mission.deliverable?.trim() || undefined,
            doneCriteria: mission.doneCriteria?.trim() || undefined,
          }),
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

type EvidenceContext = {
  statedFacts: string[];
  statedIntent: string[];
  observedResults: string[];
  unverifiedHypotheses: string[];
  availableTime: string;
  availableBudget: string;
  goal: string;
  customerProblem: string;
  offerOrStrength: string;
  answeredFollowUpKeys: ReadinessNeed["key"][];
};

function dedupeEvidence(values: string[]) {
  const unique = new Set<string>();

  values.forEach((value) => {
    const normalized = value.trim();
    if (hasSubstance(normalized)) {
      unique.add(normalized);
    }
  });

  return [...unique];
}

function extractAnswerValue(entry: string) {
  const separatorIndex = entry.indexOf(":");
  return separatorIndex >= 0 ? entry.slice(separatorIndex + 1).trim() : entry.trim();
}

function collectStructuredEvidence(payload: GeneratePayload): EvidenceContext {
  const answerValuesFromLegacyAnswers = (payload.answers ?? []).map((entry) => extractAnswerValue(entry));
  const interviewAnswers = payload.interviewAnswers ?? [];
  const followUpAnswers = payload.followUpAnswers ?? [];
  const missionHistory = payload.missionHistory ?? [];
  const statedFacts = dedupeEvidence([
    ...answerValuesFromLegacyAnswers,
    ...interviewAnswers
      .filter((entry) => ["weekdayTime", "reTime", "initialCost", "budget", "reBudget", "value", "offer", "strength", "experience", "reOffer"].includes(entry.questionId))
      .map((entry) => entry.answer),
    ...followUpAnswers
      .filter((entry) => /経験|使える時間|予算|使える金額|提供できる|できること|得意|スキル|価値|実績/.test(entry.question))
      .map((entry) => entry.answer),
  ]);
  const intentCandidates = dedupeEvidence([
    payload.welcomeChoice ?? "",
    ...interviewAnswers
      .filter((entry) => ["revenueTarget", "reMoney", "priority", "rePriority", "who", "customer", "problem", "customerProblem", "reCustomer"].includes(entry.questionId))
      .map((entry) => entry.answer),
    ...followUpAnswers
      .filter((entry) => !/経験|使える時間|予算|使える金額|提供できる|できること|得意|スキル|価値|実績/.test(entry.question))
      .map((entry) => entry.answer),
  ]);
  const observedResults = dedupeEvidence([
    ...missionHistory.flatMap((entry) => [entry.note, `${entry.status}${entry.note ? `: ${entry.note}` : ""}`]),
    ...(payload.missionContinuation?.outcome ? [payload.missionContinuation.outcome] : []),
  ]);
  const unverifiedHypotheses = dedupeEvidence(
    intentCandidates.filter((entry) => /はず|かもしれない|需要|ニーズ|売れる|刺さる|悩み/.test(entry)),
  );

  return {
    statedFacts,
    statedIntent: dedupeEvidence(intentCandidates.filter((entry) => !unverifiedHypotheses.includes(entry))),
    observedResults,
    unverifiedHypotheses,
    availableTime: interviewAnswers.find((entry) => ["weekdayTime", "reTime"].includes(entry.questionId))?.answer ?? "",
    availableBudget: interviewAnswers.find((entry) => ["initialCost", "budget", "reBudget"].includes(entry.questionId))?.answer ?? "",
    goal: interviewAnswers.find((entry) => ["revenueTarget", "reMoney", "priority", "rePriority"].includes(entry.questionId))?.answer ?? "",
    customerProblem:
      interviewAnswers.find((entry) => ["who", "customer", "problem", "customerProblem", "reCustomer"].includes(entry.questionId))?.answer ?? "",
    offerOrStrength:
      followUpAnswers.find((entry) => hasSubstance(entry.answer) && /提供|できる|得意|経験|強み|スキル|価値/.test(entry.question))
        ?.answer ??
      interviewAnswers.find((entry) => ["value", "offer", "strength", "experience", "reOffer"].includes(entry.questionId))?.answer ??
      "",
    answeredFollowUpKeys: followUpAnswers
      .map((entry) => entry.question as ReadinessNeed["key"])
      .filter((key): key is ReadinessNeed["key"] => key in followUpQuestionConfig),
  };
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

function deriveCurrentStage(payload: GeneratePayload): CurrentStage {
  const evidence = collectStructuredEvidence(payload);
  const userFacts = [
    evidence.goal,
    evidence.customerProblem,
    evidence.offerOrStrength,
    evidence.availableTime,
    evidence.availableBudget,
    ...evidence.statedFacts,
    ...evidence.statedIntent,
    ...evidence.observedResults,
  ]
    .filter(hasSubstance)
    .join(" ")
    .toLowerCase();
  const completedCount = (payload.missionHistory ?? []).filter((entry) => entry.status === "完了").length;

  if (/拡大した|採用した|チームを増やした|広告を拡大|スケールしている/.test(userFacts)) {
    return "scaling";
  }

  if (/改善している|効率化している|利益率を上げたい|最適化している/.test(userFacts)) {
    return "optimizing";
  }

  if (completedCount >= 2 && /販売できた|受注できた|継続できた|繰り返している|再現/.test(userFacts)) {
    return "repeating";
  }

  if (/提案を送った|営業した|販売した|受注した|売れた/.test(userFacts)) {
    return "selling";
  }

  if (/ヒアリングした|反応を見た|テストした|検証した|試した/.test(userFacts)) {
    return "validating";
  }

  if (hasSubstance(evidence.customerProblem) || hasSubstance(evidence.offerOrStrength)) {
    return "defining";
  }

  if (hasSubstance(evidence.goal) || hasSubstance(evidence.availableTime) || evidence.statedFacts.length > 0) {
    return "exploring";
  }

  return "unknown";
}

function containsConcreteOfferOrStrength(values: string[]) {
  return values.some((value) => {
    const normalized = value.trim();
    return hasSubstance(normalized) && normalized.length >= 4 && /経験|実績|得意|スキル|作れる|教えられる|支援|代行|改善|設計|分析|開発|営業|制作/.test(normalized);
  });
}

function detectReadinessNeeds(payload: GeneratePayload, result: AtlasResult): ReadinessNeed[] {
  const evidence = collectStructuredEvidence(payload);
  const hasGoal = hasSubstance(evidence.goal);
  const hasCustomerProblem = hasSubstance(evidence.customerProblem);
  const hasOfferOrStrength = containsConcreteOfferOrStrength([
    evidence.offerOrStrength,
    ...evidence.statedFacts,
    ...evidence.observedResults,
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

function buildStageSafeMission(stage: CurrentStage, payload: GeneratePayload): MissionDraft[] {
  const strengths = payload.followUpAnswers?.map((entry) => entry.answer).find(hasSubstance)
    || payload.interviewAnswers?.map((entry) => entry.answer).find(hasSubstance)
    || "自分の経験";

  const safeMissionMap: Record<Exclude<CurrentStage, "unknown" | "optimizing" | "scaling">, MissionDraft> = {
    exploring: {
      title: "自分の経験と興味を3つ整理する",
      action: `これまでの経験や気になる分野から、使えそうなものを3つ書き出す`,
      deliverable: "経験と興味の候補3項目",
      doneCriteria: "3項目が短文で整理されている",
      timeEstimate: "10分",
      example: `1. ${strengths}\n2. 人から頼まれたこと\n3. 気になっている分野`,
    },
    defining: {
      title: "対象者と悩みを1組に絞る",
      action: "助けたい相手を1人のイメージで決め、その人の悩みを1つ書く",
      deliverable: "対象者1人と悩み1つ",
      doneCriteria: "誰のどんな悩みかが1文で書けている",
      timeEstimate: "10分",
      example: "対象者: 忙しくて発信が止まりがちな個人事業主\n悩み: 何を書けばいいか毎回止まる",
    },
    validating: {
      title: "小さな確認メモを1本作る",
      action: "相手の悩みと仮の価値提案を1本の短い確認文にまとめる",
      deliverable: "確認メモ1本",
      doneCriteria: "悩みと提案が3行以内でまとまっている",
      timeEstimate: "15分",
      example: "相手: 発信が止まりがちな個人事業主\n悩み: 毎回ネタ出しで止まる\n仮提案: 発信テーマを一緒に整理して1週間分の下書きを作る",
    },
    selling: {
      title: "小さな提案文を1本作る",
      action: "仮の価格と提供内容を入れた短い提案文を1本書く",
      deliverable: "提案文1本",
      doneCriteria: "誰向けに何をいくらで提案するかが入っている",
      timeEstimate: "15分",
      example: "○○で困っている方向けに、1週間分の発信テーマ整理を5000円でお手伝いします。必要なら現状を10分だけ伺います。",
    },
    repeating: {
      title: "販売手順を3ステップで書く",
      action: "受注までにやった流れを3ステップで整理する",
      deliverable: "販売手順3ステップ",
      doneCriteria: "同じ流れを次回も使える形で書けている",
      timeEstimate: "15分",
      example: "1. 相手の悩みを聞く\n2. 小さく提案する\n3. 実施後に次回提案へつなぐ",
    },
  };

  if (stage === "optimizing" || stage === "scaling" || stage === "unknown") {
    return [];
  }

  return [safeMissionMap[stage]];
}

function detectStageLeap(stage: CurrentStage, result: AtlasResult) {
  const missionText = result.todayMission
    .flatMap((mission) => [mission.title, mission.action, mission.deliverable, mission.doneCriteria])
    .filter(Boolean)
    .join(" ");

  const rules: Record<Exclude<CurrentStage, "optimizing" | "scaling" | "unknown">, RegExp | null> = {
    exploring: /営業|顧客|送信|価格|広告|開発|法人化|投資|拡大/,
    defining: /広告|本格開発|開発|法人化|拡大|投資/,
    validating: /拡大|採用|大規模広告|本格開発|投資/,
    selling: /拡大|採用|大規模広告/,
    repeating: null,
  };

  const rule = stage === "optimizing" || stage === "scaling" || stage === "unknown" ? null : rules[stage];
  return rule ? rule.test(missionText) : false;
}

function applyStageFitGate(payload: GeneratePayload, result: AtlasResult, currentStage: CurrentStage) {
  if (result.needsMoreInfo) {
    return result;
  }

  if (currentStage === "unknown" || currentStage === "optimizing" || currentStage === "scaling") {
    return result;
  }

  if (!detectStageLeap(currentStage, result)) {
    return result;
  }

  const safeMission = buildStageSafeMission(currentStage, payload);

  return {
    ...result,
    verdict: "HOLD" as const,
    conclusion: `現在段階 ${currentStage} に合わせて、先に安全なMissionへ調整しました。`,
    reasons: [`現在段階 ${currentStage} より先の行動が含まれていたため、段階に合うMissionへ置き換えました。`, ...result.reasons].slice(0, 5),
    todayMission: safeMission.length > 0 ? safeMission : result.todayMission,
    nextStep: safeMission[0]?.title ?? result.nextStep,
  };
}

function normalizeEvidenceComparable(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[ 　\t\r\n]+/g, "")
    .replace(/[。．、，,!.！?？ー\-:：]/g, "");
}

function evidenceHasKeywordSupport(
  values: string[],
  keywords: string[],
  excludedPatterns: RegExp[] = [],
) {
  return values.some((value) => {
    const normalized = normalizeEvidenceComparable(value);
    if (excludedPatterns.some((pattern) => pattern.test(normalized))) {
      return false;
    }
    return keywords.some((keyword) => normalized.includes(normalizeEvidenceComparable(keyword)));
  });
}

function sanitizeStrengthAssertion(text: string, evidence: EvidenceContext) {
  const strengthKeywords = ["仮説", "営業", "分析", "設計", "開発", "制作", "提案", "整理", "発信", "相談", "販売", "スキル", "経験"];
  const negativeStrengthPatterns = [/苦手/, /できない/, /経験がない/, /自信がない/, /未経験/, /分からない/, /わからない/];
  if (evidenceHasKeywordSupport(evidence.statedFacts, strengthKeywords, negativeStrengthPatterns)) {
    return text;
  }

  return text
    .replace(/あなたの強みである([^。、「」]+?)を活かす/g, "今ある情報を整理して$1を試す")
    .replace(/あなたは([^。、「」]+?)が得意/g, "$1をどう活かせるか確認する")
    .replace(/([^。、「」]+?)のスキルを活かせる/g, "$1をどう活かせるか確認する")
    .replace(/強みを活かす/g, "今ある情報を整理して進める");
}

function sanitizeObservedResultAssertion(text: string, evidence: EvidenceContext) {
  const resultKeywords = ["聞いた", "返信", "反応", "売れ", "販売", "受注", "契約", "申し込み", "購入", "相談"];
  const notExecutedPatterns = [/やりたい/, /予定/, /これから/, /試したい/, /まだやっていない/, /未実行/];
  if (evidenceHasKeywordSupport(evidence.observedResults, resultKeywords, notExecutedPatterns)) {
    return text;
  }

  return text
    .replace(/(\d+)人に聞いた/g, "$1人に聞く")
    .replace(/顧客から反応があった/g, "顧客から反応があるか確認する")
    .replace(/販売実績がある/g, "販売実績になる条件を確認する")
    .replace(/(\d+)件売れた/g, "$1件売れるか検証する")
    .replace(/受注した/g, "受注できるか検証する")
    .replace(/返信が来た/g, "返信が来るか確認する");
}

function sanitizeNeedAssertion(text: string, evidence: EvidenceContext) {
  const needKeywords = ["不安", "悩み", "ニーズ", "需要", "求め", "課題", "反応", "返信"];
  const contraryNeedPatterns = [/不要/, /興味を示されなかった/, /反応なし/, /売れなかった/, /断られた/];
  if (evidenceHasKeywordSupport(evidence.observedResults, needKeywords, contraryNeedPatterns)) {
    return text;
  }

  return text
    .replace(/顧客は([^。、「」]+?)に悩んでいる/g, "顧客が$1に悩んでいるか確認する")
    .replace(/([^。、「」]+?)のニーズがある/g, "$1のニーズがあるか確認する")
    .replace(/市場で求められている/g, "市場で求められているか確認する")
    .replace(/40代会社員は独立に不安を感じている/g, "40代会社員が独立にどんな不安を感じるか確認する")
    .replace(/このニーズがあります/g, "このニーズがあるか確認します");
}

function sanitizeDemandAssertion(text: string, evidence: EvidenceContext) {
  const demandKeywords = ["売れ", "販売", "受注", "契約", "購入", "反応", "返信", "申し込み"];
  const contraryDemandPatterns = [/売れなかった/, /反応がなかった/, /反応なし/, /不要/, /断られた/, /興味を示されなかった/];
  if (evidenceHasKeywordSupport(evidence.observedResults, demandKeywords, contraryDemandPatterns)) {
    return text;
  }

  return text
    .replace(/売れる(?!か|条件|可能性)/g, "売れるか検証する")
    .replace(/需要がある/g, "需要があるか確かめる")
    .replace(/成功する/g, "成功する条件を確認する")
    .replace(/収益化できる/g, "収益化できる条件を確認する")
    .replace(/顧客が集まる/g, "顧客が集まるか確認する");
}

function sanitizeEvidenceQualityText(text: string, evidence: EvidenceContext) {
  let sanitized = text;
  sanitized = sanitizeStrengthAssertion(sanitized, evidence);
  sanitized = sanitizeObservedResultAssertion(sanitized, evidence);
  sanitized = sanitizeNeedAssertion(sanitized, evidence);
  sanitized = sanitizeDemandAssertion(sanitized, evidence);
  return sanitized;
}

function applyEvidenceQualityGate(payload: GeneratePayload, result: AtlasResult): AtlasResult {
  if (result.needsMoreInfo) {
    return result;
  }

  const evidence = collectStructuredEvidence(payload);

  return {
    ...result,
    conclusion: sanitizeEvidenceQualityText(result.conclusion, evidence),
    reasons: result.reasons.map((reason) => sanitizeEvidenceQualityText(reason, evidence)),
    decisionLog: result.decisionLog.map((entry) => sanitizeEvidenceQualityText(entry, evidence)),
    todayPlan: result.todayPlan.map((entry) => sanitizeEvidenceQualityText(entry, evidence)),
    sevenDayPlan: result.sevenDayPlan.map((entry) => sanitizeEvidenceQualityText(entry, evidence)),
    ninetyDayPlan: result.ninetyDayPlan.map((entry) => sanitizeEvidenceQualityText(entry, evidence)),
    dontDo: result.dontDo.map((entry) => sanitizeEvidenceQualityText(entry, evidence)),
    todayMission: result.todayMission.map((mission) => ({
      ...mission,
      title: sanitizeEvidenceQualityText(mission.title, evidence),
      action: mission.action ? sanitizeEvidenceQualityText(mission.action, evidence) : undefined,
      deliverable: mission.deliverable ? sanitizeEvidenceQualityText(mission.deliverable, evidence) : undefined,
      doneCriteria: mission.doneCriteria ? sanitizeEvidenceQualityText(mission.doneCriteria, evidence) : undefined,
      example: mission.example ? sanitizeEvidenceQualityText(mission.example, evidence) : undefined,
    })),
    atlasComment: sanitizeEvidenceQualityText(result.atlasComment, evidence),
    atlasOneLine: sanitizeEvidenceQualityText(result.atlasOneLine, evidence),
    nextStep: sanitizeEvidenceQualityText(result.nextStep, evidence),
  };
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

function buildCurrentStateMap(payload: GeneratePayload, currentStage: CurrentStage) {
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
    `currentStage: ${currentStage}`,
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

function buildPrompt(payload: GeneratePayload, currentStage: CurrentStage) {
  const interviewAnswers = payload.interviewAnswers ?? [];
  const followUpAnswers = payload.followUpAnswers ?? [];
  const atlasProfile = payload.atlasProfile;
  const missionHistory = payload.missionHistory ?? [];
  const missions = payload.missions ?? [];
  const conversationHistory = payload.conversationHistory ?? [];
  const missionContinuation = payload.missionContinuation;
  const evidence = collectStructuredEvidence(payload);
  const summary = [payload.welcomeChoice, ...(payload.answers ?? []).filter(Boolean)].filter(Boolean).join("\n");
  const currentStateMap = buildCurrentStateMap(payload, currentStage);
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
    "- Use Structured Evidence Context as the only source for factual assertions about the user's strengths, actions, results, customer needs, market demand, or sales proof.",
    "- Context such as Profile, Summary, Memory, Conversation History, and Active Missions may be used for continuity and background understanding, but not as proof of verified facts.",
    "- Decide todayMission in this order: 1) confirm what the user has already decided, 2) identify prerequisites for the next action, 3) if prerequisites are missing, assign the immediately previous prerequisite-building Mission, 4) only if prerequisites are ready, assign the smallest execution Mission.",
    "- The Mission must be doable today, preferably within 60 minutes, low risk, minimal in scope, and must not skip the previous stage.",
    "- Do not assign company sales outreach unless target customer, customer problem, and offered value are already clear.",
    "- Do not assign proposal-writing unless who receives it and what is offered are already clear.",
    "- Do not assign price-setting unless the offer or deliverable is already clear.",
    "- As a rule, do not assign development before demand has been checked.",
    "- Do not assign advertising before a small response test has been done.",
    "- Do not assign incorporation, hiring, tooling purchases, or other large investments before initial revenue validation.",
    "- If the user's current position is unclear, prefer a prerequisite Mission such as listing three values they can provide, choosing one smallest testable offer, or tentatively deciding whose problem they will solve.",
    "- statedFacts may be used as user facts.",
    "- statedIntent must be treated only as hopes, goals, plans, or preferences, not as completed action.",
    "- observedResults may be used as actual actions or outcomes.",
    "- unverifiedHypotheses must always be treated as unverified hypotheses to test.",
    "- Never assert a user strength unless it is supported by Structured Evidence Context.",
    "- Never treat hopes as achievements, AI-generated customer problems as real customer needs, or unverified ideas as proven demand.",
    "- Preserve the existing Mission detail structure: title, action, deliverable, doneCriteria, timeEstimate, example.",
  ].join("\n");
  const missionContinuationRules = missionContinuation
    ? [
        "Mission Continuation Rules:",
        "- This request is after Mission completion. Do not require a full Interview and do not ask interview questions.",
        "- Rejudge the user's current position using Mission Outcome, Completed Mission, Atlas Profile, Follow Up Answers, Mission History, and Conversation History.",
        "- In continuation mode as well, use Structured Evidence Context as the only source for factual assertions about strengths, actions, results, customer needs, demand, or traction.",
        "- Rebuild the Current State Map from the latest evidence before deciding GO or HOLD.",
        "- If the user can move now, return verdict GO and create the next smallest Mission in todayMission using the existing fields: title, action, deliverable, doneCriteria, timeEstimate, example.",
        "- If the user should not move now, return verdict HOLD, return todayMission as an empty array, set conclusion to a short waiting judgment, put the reason in reasons[0], and put the restart condition in nextStep.",
        "- For outcome '反応待ち', prefer HOLD unless there is a low-risk preparation task that does not skip the waiting step.",
        "- For outcome 'うまくいかなかった' or '別の発見があった', use the result as evidence and choose either a smaller correction Mission or HOLD if more observation is needed.",
      ].join("\n")
    : "";
  const evidenceRules = [
    "Structured Evidence Context:",
    "- Use the sections below as the boundary for factual claims.",
    "- statedFacts: may be used as user facts.",
    "- statedIntent: treat only as hope, goal, or plan. Do not rewrite as completed action or proven result.",
    "- observedResults: may be used as actual action or outcome.",
    "- unverifiedHypotheses: always present as unverified assumptions to test.",
    "- Forbidden: unsupported 'your strength is ...' claims.",
    "- Forbidden: treating goals as traction or execution.",
    "- Forbidden: treating AI-generated customer problems, summaries, memory text, or mission text as validated customer needs.",
    "- Forbidden: saying demand exists, it will sell, or the market wants it without Structured Evidence Context support.",
  ].join("\n");

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
- exampleは全Missionで必須。空文字は禁止
- exampleはそのMissionで実際に作る成果物の完成例にする
- exampleはtitle, action, deliverable, doneCriteriaに具体的に対応させる
- exampleはそのままコピーして書き換えられる本文にする
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

${evidenceRules}

Evidence Context:
statedFacts:
${evidence.statedFacts.length > 0 ? evidence.statedFacts.join("\n") : "unknown"}

statedIntent:
${evidence.statedIntent.length > 0 ? evidence.statedIntent.join("\n") : "unknown"}

observedResults:
${evidence.observedResults.length > 0 ? evidence.observedResults.join("\n") : "unknown"}

unverifiedHypotheses:
${evidence.unverifiedHypotheses.length > 0 ? evidence.unverifiedHypotheses.join("\n") : "unknown"}

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
  const currentStage = deriveCurrentStage(payload);

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
      contents: buildPrompt(payload, currentStage),
    });

    return Response.json({
      result: normalizeResult(response.text ?? "", payload, currentStage, interviewAnswers, atlasProfile),
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

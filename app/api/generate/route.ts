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

type RevenueHypothesis = {
  buyer: string;
  problem: string;
  offer: string;
  paidReason: string;
  priceHypothesis: string;
  firstCustomerPath: string;
  requiredTime: string;
  requiredBudget: string;
  smallestValidation: string;
  successCondition: string;
  failureCondition: string;
  nextDecision: string;
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

type UserArtifactInput = {
  id: string;
  type: "mission_artifact";
  source: "user";
  missionTitle: string;
  missionAction: string;
  content: string;
  sharedAt: string;
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
  userArtifacts?: UserArtifactInput[];
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
      example: "サービスA：3,000円／60分相談\nサービスB：5,000円／診断レポート付き\nサービスC：月額2,980円／チャット相談",
    },
    {
      title: "提案価格を修正",
      action: "競合価格メモを見て、今日送る提案価格を1つ決める",
      deliverable: "提案価格1つ",
      doneCriteria: "送信文に入れる価格が1つ決まっている",
      timeEstimate: "10分",
      example: "価格仮説：5,000円\n提供内容：60分の個別相談と提案文1本\n検証方法：初回候補3人へ提案する",
    },
    {
      title: "3件へ送信",
      action: "見込み客3人に短い提案文を送る",
      deliverable: "送信済み提案3件",
      doneCriteria: "3人に送信し、送信先と送信時刻を記録している",
      timeEstimate: "30分",
      example: "対象者：発信準備に時間がかかる個人事業主\n相手の悩み：何を発信すればよいか決める作業が止まりやすい\n提供内容：1週間分の発信テーマを一緒に整理する60分相談\n価格：5,000円（価格仮説）\n伝える文：発信テーマの整理で時間がかかる場合、60分で1週間分の候補を一緒に整理する相談を5,000円で試しています。必要なら状況を10分だけ伺えます。",
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
      revenueHypothesis?: RevenueHypothesis | null;
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
    const normalizedRevenueHypothesis = parsed.needsMoreInfo === true
      ? null
      : normalizeRevenueHypothesis(parsed.revenueHypothesis, currentStage);
    const revenueHypothesis = normalizedRevenueHypothesis
      ? applyRevenueQualityGate(normalizedRevenueHypothesis, payload)
      : null;

    const normalized = projectRevenueHypothesis({
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
    }, revenueHypothesis);
    return finalizeMissionExamples(applyEvidenceQualityGate(
      payload,
      applyStageFitGate(payload, applyHardReadinessGate(payload, normalized), currentStage),
    ));
  } catch {
    return finalizeMissionExamples(applyEvidenceQualityGate(
      payload,
      applyStageFitGate(payload, applyHardReadinessGate(payload, {
        ...defaultResult,
        salesSimulation: emptySalesSimulation,
        decisionLog: fallbackDecisionLog,
        atlasComment: fallbackAtlasComment,
      }), currentStage),
    ));
  }
}

function normalizeRevenueHypothesis(value: unknown, currentStage: CurrentStage): RevenueHypothesis | null {
  const revenueStages: CurrentStage[] = ["validating", "selling", "repeating", "optimizing", "scaling"];
  if (!revenueStages.includes(currentStage) || !value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Partial<Record<keyof RevenueHypothesis, unknown>>;
  const text = (field: keyof RevenueHypothesis) => typeof candidate[field] === "string" ? candidate[field].trim() : "";
  const buyer = text("buyer");
  const problem = text("problem");
  const offer = text("offer");
  const paidReason = text("paidReason");
  const priceHypothesis = text("priceHypothesis");
  const firstCustomerPath = text("firstCustomerPath");
  const requiredTime = text("requiredTime");
  const requiredBudget = text("requiredBudget");
  const smallestValidation = text("smallestValidation");
  const successCondition = text("successCondition");
  const failureCondition = text("failureCondition");
  const nextDecision = text("nextDecision");

  if (![buyer, problem, offer, paidReason, priceHypothesis, firstCustomerPath, requiredTime, requiredBudget, smallestValidation, successCondition, failureCondition, nextDecision].every(Boolean)) {
    return null;
  }

  return {
    buyer,
    problem,
    offer,
    paidReason,
    priceHypothesis,
    firstCustomerPath,
    requiredTime,
    requiredBudget,
    smallestValidation,
    successCondition,
    failureCondition,
    nextDecision,
  };
}

function applyRevenueQualityGate(revenueHypothesis: RevenueHypothesis, payload: GeneratePayload): RevenueHypothesis | null {
  const allFields = Object.values(revenueHypothesis).join(" ");
  const hasUnsupportedAssertion = containsUnsupportedRevenueAssertion(allFields, payload);

  const isValid = [
    isSpecificRevenueBuyer(revenueHypothesis.buyer),
    isSpecificRevenueProblem(revenueHypothesis.problem),
    isConcreteRevenueOffer(revenueHypothesis.offer),
    isConcretePaidReason(revenueHypothesis.paidReason),
    isTestablePriceHypothesis(revenueHypothesis.priceHypothesis),
    isSpecificFirstCustomerPath(revenueHypothesis.firstCustomerPath),
    isViableRequiredTime(revenueHypothesis.requiredTime, payload),
    isViableRequiredBudget(revenueHypothesis, payload),
    isSmallestValidation(revenueHypothesis.smallestValidation),
    isMeasurableCondition(revenueHypothesis.successCondition),
    isMeasurableCondition(revenueHypothesis.failureCondition),
    isClearNextDecision(revenueHypothesis.nextDecision),
    !hasUnsupportedAssertion,
  ].every(Boolean);

  return isValid ? revenueHypothesis : null;
}

function containsUnsupportedRevenueAssertion(value: string, payload: GeneratePayload) {
  const hypothesisLanguage = value
    .replace(/需要があるか(確認|確かめ|検証)する/g, "")
    .replace(/売れるか(確認|検証)する/g, "")
    .replace(/支払い意思を(確かめ|確認|検証)する/g, "")
    .replace(/[0-9０-９,，]+円で提案して反応を見る/g, "")
    .replace(/価格仮説/g, "");
  const factualAssertion = /需要がある|売れる(?!か|条件|可能性)|成功する|顧客が集まる|収益化できる|儲かる|月収\s*[0-9０-９,，万円円]+/.test(hypothesisLanguage);
  return factualAssertion
    && !evidenceHasKeywordSupport(collectStructuredEvidence(payload).observedResults, ["販売", "購入", "申込", "支払い", "受注"]);
}

function isSpecificRevenueBuyer(value: string) {
  const broadBuyer = /^(みんな|企業|個人|副業したい人|困っている人)$/;
  const context = /\d|[0-9０-９]+代|会社員|責任者|担当者|新人|前職|現場|[がでに].{2,}(困|決ま|ばらつ|時間|未経験|不安)/;
  return value.length >= 6 && !broadBuyer.test(value.replace(/[。！!]/g, "")) && context.test(value);
}

function isSpecificRevenueProblem(value: string) {
  const vagueProblem = /^(売上を増やしたい|効率化したい|困っている|成長したい)$/;
  const situation = /で|時|場面|新人|顧客|現場|業務|提案|教育|販売/;
  const pain = /困|時間|ばらつ|決まら|できな|不安|手間|失敗|迷/;
  return value.length >= 8 && !vagueProblem.test(value.replace(/[。！!]/g, "")) && situation.test(value) && pain.test(value);
}

function isConcreteRevenueOffer(value: string) {
  const vagueOffer = /^(AIサービス|コンサル|サポート|アプリ)$/;
  const deliverable = /ヒアリング|提案文|一覧|診断|添削|レビュー|整理|作成|設計|テンプレ|手作業|資料/;
  return value.length >= 6 && !vagueOffer.test(value.replace(/[。！!]/g, "")) && deliverable.test(value);
}

function isConcretePaidReason(value: string) {
  const vagueReason = /^(便利だから|価値があるから|時間を節約できるから)$/;
  return value.length >= 8 && !vagueReason.test(value.replace(/[。！!]/g, ""));
}

function parseJapaneseAmount(value: string) {
  const normalized = value.replace(/[，,]/g, "").replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xFEE0));
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(万)?円/);
  if (!match) return null;
  return Number(match[1]) * (match[2] ? 10000 : 1);
}

function isTestablePriceHypothesis(value: string) {
  const amount = parseJapaneseAmount(value);
  return amount !== null
    && amount > 0
    && /(仮説|テスト|試験)/.test(value)
    && !/高価格|要相談|市場価格|保証|月収|売上予測/.test(value);
}

function isSpecificFirstCustomerPath(value: string) {
  const contactCount = /[1-3１-３]\s*(人|名|件)/;
  const directPath = /個別連絡|連絡|ヒアリング|依頼|紹介|知人|コミュニティ/;
  return value.length >= 8 && contactCount.test(value) && directPath.test(value) && !/^(SNSで集客する|広告を出す|営業する|口コミを増やす)$/.test(value);
}

function parseMinutes(value: string) {
  const normalized = value.replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xFEE0));
  const hours = normalized.match(/(\d+(?:\.\d+)?)\s*時間/);
  const minutes = normalized.match(/(\d+)\s*分/);
  if (hours) return Number(hours[1]) * 60 + (minutes ? Number(minutes[1]) : 0);
  return minutes ? Number(minutes[1]) : null;
}

function isViableRequiredTime(value: string, payload: GeneratePayload) {
  const requiredMinutes = parseMinutes(value);
  const availableTime = payload.profile?.availableTime
    || payload.interviewAnswers?.find((entry) => ["weekdayTime", "reTime"].includes(entry.questionId))?.answer
    || "";
  const availableMinutes = availableTime ? parseMinutes(availableTime.split(/[〜～]/).at(-1) ?? "") : null;
  return requiredMinutes !== null && requiredMinutes > 0
    && (availableMinutes === null || requiredMinutes <= availableMinutes);
}

function isViableRequiredBudget(revenueHypothesis: RevenueHypothesis, payload: GeneratePayload) {
  const requiredBudget = /^(0円|無料)$/.test(revenueHypothesis.requiredBudget.trim()) ? 0 : parseJapaneseAmount(revenueHypothesis.requiredBudget);
  const budgetAnswer = payload.interviewAnswers?.find((entry) => entry.questionId === "initialCost")?.answer ?? "";
  const availableBudget = /^(0円|無料)$/.test(budgetAnswer.trim()) ? 0 : parseJapaneseAmount(budgetAnswer);
  const requiresLargeSpend = /広告|本格開発|外注|大きな購入|大量集客/.test(
    `${revenueHypothesis.requiredBudget} ${revenueHypothesis.smallestValidation}`,
  );
  const isLowCostWhenUnknown = requiredBudget === 0
    || /無料|低額|少額/.test(revenueHypothesis.requiredBudget)
    || (requiredBudget !== null && requiredBudget <= 10000 && !requiresLargeSpend);
  return requiredBudget !== null && requiredBudget >= 0
    && (availableBudget === null ? isLowCostWhenUnknown : requiredBudget <= availableBudget);
}

function isSmallestValidation(value: string) {
  const prohibited = /本格開発|アプリを開発|LPを完成|広告を運用|広告出稿|100人集客|大量集客/;
  const smallTest = /[1-5１-５]\s*(人|名|件)|ヒアリング|有料提案|手作業|簡易(資料|文章)|先行募集|予約|申込意思/;
  return value.length >= 6 && !prohibited.test(value) && smallTest.test(value);
}

function isMeasurableCondition(value: string) {
  const observable = /[0-9０-９]+\s*(人|名|件)|全員|以上|以下/;
  const event = /回答|申込|支払|有料|不要|断|反応|連絡/;
  return value.length >= 8 && observable.test(value) && event.test(value)
    && !/反応が良ければ|手応えがなければ|成功したら続ける/.test(value);
}

function isClearNextDecision(value: string) {
  const condition = /なら|場合|以上|なければ|失敗|成功/;
  const decision = /提供|見直|修正|続け|停止|絞|変更|決め/;
  return value.length >= 8 && condition.test(value) && decision.test(value);
}

function projectRevenueHypothesis(result: AtlasResult, revenueHypothesis: RevenueHypothesis | null): AtlasResult {
  if (!revenueHypothesis) {
    return result;
  }

  return {
    ...result,
    conclusion: `買い手候補: ${revenueHypothesis.buyer}。問題仮説: ${revenueHypothesis.problem}。提供: ${revenueHypothesis.offer}。有料理由: ${revenueHypothesis.paidReason}。`,
    salesSimulation: {
      ...result.salesSimulation,
      price: revenueHypothesis.priceHypothesis,
    },
    todayPlan: [
      `初回販売候補への経路: ${revenueHypothesis.firstCustomerPath}`,
      `必要時間: ${revenueHypothesis.requiredTime}`,
      `必要費用: ${revenueHypothesis.requiredBudget}`,
    ],
    todayMission: [{
      title: "最小検証を実行する",
      action: revenueHypothesis.smallestValidation,
      deliverable: "最小検証の記録",
      doneCriteria: "検証内容と相手の反応を記録できている",
      timeEstimate: revenueHypothesis.requiredTime,
      example: revenueHypothesis.smallestValidation,
    }],
    reasons: [
      `成功条件: ${revenueHypothesis.successCondition}`,
      `失敗条件: ${revenueHypothesis.failureCondition}`,
    ],
    nextStep: revenueHypothesis.nextDecision,
  };
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
  const lower = `${title} ${action ?? ""} ${deliverable ?? ""}`.toLowerCase();

  if (isProposalOrSendingMission({ title, action, deliverable, doneCriteria: mission.doneCriteria })) {
    return buildProposalExample();
  }

  if (/価格|競合/.test(lower)) {
    return stripMarkdown(
      "10,000円: 初回相談\n30,000円: 個別サポート\n50,000円: 継続サポート",
    );
  }

  if (/質問/.test(lower)) {
    return stripMarkdown("今、最も時間がかかっていることは何ですか？\nそれを変えるために試したことはありますか？\n改善できたら何が一番楽になりますか？");
  }

  if (/困りごと|悩み/.test(lower)) {
    return stripMarkdown("毎日の確認作業に30分以上かかる\n担当者ごとに教え方が違い同じミスが繰り返される\n引き継ぎが口頭だけで重要事項が抜ける");
  }

  if (/対象者|顧客/.test(lower)) {
    return stripMarkdown("初めて副業の提案先を決める会社員\n新人教育の手順をそろえたい現場責任者\n定期的な発信の準備で止まりやすい個人事業主");
  }

  if (/経験|興味|頼まれたこと|振り返|強み|候補|整理/.test(lower)) {
    return stripMarkdown("会議メモを要点3つに整理した経験\n手順が分からない人へ資料の使い方を説明した経験\n週末に写真を撮って記録を続けている興味");
  }

  return stripMarkdown("朝の作業手順を1枚に整理する\n問い合わせ内容を3分類する\n週次の確認項目を共有する");
}

function isProposalOrSendingMission(mission: Pick<MissionDraft, "title" | "action" | "deliverable" | "doneCriteria">) {
  return /3件へ送信|提案文|見込み客.*連絡|有料提案|営業文|送信|営業|連絡|メッセージ/.test(
    `${mission.title} ${mission.action ?? ""} ${mission.deliverable ?? ""} ${mission.doneCriteria ?? ""}`,
  );
}

function buildProposalExample() {
  return stripMarkdown(
    "対象者：発信準備に時間がかかる個人事業主\n相手の悩み：何を発信すればよいか決める作業が止まりやすい\n提供内容：1週間分の発信テーマを一緒に整理する60分相談\n価格：5,000円（価格仮説）\n伝える文：発信テーマの整理で時間がかかる場合、60分で1週間分の候補を一緒に整理する相談を5,000円で試しています。必要なら状況を10分だけ伺えます。",
  );
}

function hasProposalExampleStructure(example: string) {
  return ["対象者：", "相手の悩み：", "提供内容：", "価格：", "伝える文："].every((label) => example.includes(label));
}

function normalizeMissionArray(value: unknown, fallback: MissionDraft[]) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [];
    }

    const items = value
      .map((item): MissionDraft | null => {
        if (typeof item === "string" && item.trim()) {
          return completeMissionDraft({ title: item.trim() });
        }

        if (!item || typeof item !== "object") {
          return null;
        }

        const mission = item as Partial<MissionDraft>;
        const title = mission.title?.trim();

        if (!title) {
          return null;
        }

        return completeMissionDraft({
          title,
          action: mission.action?.trim() || undefined,
          deliverable: mission.deliverable?.trim() || undefined,
          doneCriteria: mission.doneCriteria?.trim() || undefined,
          timeEstimate: mission.timeEstimate?.trim() || undefined,
          example: stripMarkdown(mission.example?.trim() || "") || undefined,
        });
      })
      .filter((item): item is MissionDraft => Boolean(item));

    return items.length > 0 ? items : fallback;
  }

  if (typeof value === "string" && value.trim()) {
    return [completeMissionDraft({ title: value.trim() })];
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

function completeMissionDraft(mission: MissionDraft): MissionDraft {
  const title = mission.title.trim();
  const action = mission.action?.trim() || `${title}を実行し、結果を記録する`;
  const deliverable = mission.deliverable?.trim() || `${title}の記録`;
  const doneCriteria = mission.doneCriteria?.trim() || `実行結果が${deliverable}として残っている`;
  const existingExample = stripMarkdown(mission.example?.trim() || "");
  const isProposalMission = isProposalOrSendingMission({ title, action, deliverable, doneCriteria });
  return {
    title,
    action,
    deliverable,
    doneCriteria,
    timeEstimate: mission.timeEstimate?.trim() || "20分",
    example: isProposalMission
      ? (hasProposalExampleStructure(existingExample) ? existingExample : buildProposalExample())
      : existingExample || buildMissionExample({ title, action, deliverable, doneCriteria }),
  };
}

function finalizeMissionExamples(result: AtlasResult): AtlasResult {
  return {
    ...result,
    todayMission: result.todayMission.map((mission) => completeMissionDraft(mission)),
  };
}

type EvidenceContext = {
  statedFacts: string[];
  statedIntent: string[];
  observedResults: string[];
  unverifiedHypotheses: string[];
  sharedArtifacts: string[];
  sharedArtifactTopics: Array<"goal" | "customerProblem" | "offerOrStrength">;
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

function collectSharedUserArtifacts(payload: GeneratePayload) {
  return (payload.userArtifacts ?? [])
    .filter(
      (artifact) =>
        artifact?.type === "mission_artifact" &&
        artifact.source === "user" &&
        typeof artifact.content === "string" &&
        hasSubstance(artifact.content),
    )
    .sort((left, right) => Date.parse(right.sharedAt) - Date.parse(left.sharedAt))
    .slice(0, 10);
}

function collectSharedArtifactTopics(artifacts: UserArtifactInput[]) {
  const topics = new Set<"goal" | "customerProblem" | "offerOrStrength">();

  artifacts.forEach((artifact) => {
    const content = artifact.content.trim();
    // AI-generated mission metadata only identifies the artifact's topic; content remains the user-authored input.
    const metadata = `${artifact.missionTitle} ${artifact.missionAction}`;

    if (/目標|目指|副収入|収入|独立|働き方|変えたい|優先|将来/.test(content) || /目標|目指|収入|独立|変えたい|優先/.test(metadata)) {
      topics.add("goal");
    }

    if (/対象者|顧客|困りごと|悩み|課題|不安|誰|人/.test(content) || /対象者|顧客|困りごと|悩み|課題/.test(metadata)) {
      topics.add("customerProblem");
    }

    if (/経験|興味|頼まれ|強み|できる|提供|スキル|価値/.test(content) || /経験|興味|頼まれ|強み|提供|スキル|価値/.test(metadata)) {
      topics.add("offerOrStrength");
    }
  });

  return [...topics];
}

function collectStructuredEvidence(payload: GeneratePayload): EvidenceContext {
  const answerValuesFromLegacyAnswers = (payload.answers ?? []).map((entry) => extractAnswerValue(entry));
  const interviewAnswers = payload.interviewAnswers ?? [];
  const followUpAnswers = payload.followUpAnswers ?? [];
  const missionHistory = payload.missionHistory ?? [];
  const sharedUserArtifacts = collectSharedUserArtifacts(payload);
  const sharedArtifacts = dedupeEvidence(sharedUserArtifacts.map((artifact) => artifact.content));
  const sharedArtifactTopics = collectSharedArtifactTopics(sharedUserArtifacts);
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
    sharedArtifacts,
    sharedArtifactTopics,
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
  const hasExploringProgress = evidence.sharedArtifactTopics.length > 0 || collectCompletedMissionTitles(payload).length > 0;
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

  if (hasSubstance(evidence.goal) || hasSubstance(evidence.availableTime) || evidence.statedFacts.length > 0 || hasExploringProgress) {
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
  const hasGoal = hasSubstance(evidence.goal) || evidence.sharedArtifactTopics.includes("goal");
  const hasCustomerProblem = hasSubstance(evidence.customerProblem) || evidence.sharedArtifactTopics.includes("customerProblem");
  const hasOfferOrStrength = containsConcreteOfferOrStrength([
    evidence.offerOrStrength,
    ...evidence.statedFacts,
    ...evidence.observedResults,
  ]) || evidence.sharedArtifactTopics.includes("offerOrStrength");
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

function normalizeMissionPurpose(value: string) {
  return value.toLowerCase().replace(/[ 　\t\r\n。、，,!.！?？ー\-:：]/g, "");
}

function collectCompletedMissionTitles(payload: GeneratePayload) {
  return [
    ...(payload.missionContinuation?.completedMissions.map((mission) => mission.title) ?? []),
    ...(payload.missionHistory ?? []).filter((entry) => entry.status === "完了").map((entry) => entry.mission),
    ...collectSharedUserArtifacts(payload).map((artifact) => artifact.missionTitle),
  ].filter(hasSubstance);
}

function hasCompletedMissionPurpose(
  mission: MissionDraft,
  purposePattern: RegExp,
  completedMissionTitles: string[],
) {
  const normalizedTitle = normalizeMissionPurpose(mission.title);

  return completedMissionTitles.some((completedTitle) => {
    const normalizedCompletedTitle = normalizeMissionPurpose(completedTitle);
    return normalizedCompletedTitle === normalizedTitle || purposePattern.test(completedTitle);
  });
}

function buildStageSafeMission(stage: CurrentStage, payload: GeneratePayload): MissionDraft[] {
  const hasSharedArtifacts = collectStructuredEvidence(payload).sharedArtifacts.length > 0;
  const completedMissionTitles = collectCompletedMissionTitles(payload);
  const safeMissionMap: Record<Exclude<CurrentStage, "unknown" | "optimizing" | "scaling">, MissionDraft> = {
    exploring: {
      title: "自分の経験と興味を3つ整理する",
      action: `これまでの経験や気になる分野から、使えそうなものを3つ書き出す`,
      deliverable: "経験と興味の候補3項目",
      doneCriteria: "3項目が短文で整理されている",
      timeEstimate: "10分",
      example: "会議メモを要点3つに整理した経験\n家族にスマホ設定を説明した経験\n週末に写真を撮って記録する興味",
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

  if (stage === "exploring") {
    const exploringMissions = [
      {
        purposePattern: /経験|興味|頼まれたこと|強み/,
        mission: safeMissionMap.exploring,
      },
      {
        purposePattern: /困りごと|悩み|課題/,
        mission: {
          title: "解決したい困りごと候補を3つ絞る",
          action: hasSharedArtifacts
            ? "Atlasと共有した内容を見直し、解決したい困りごと候補を3つ書き出す"
            : "自分や身近な人が困ることから、解決したい候補を3つ書き出す",
          deliverable: "困りごと候補3項目",
          doneCriteria: "確認したい困りごとが3項目並んでいる",
          timeEstimate: "10分",
          example: "毎日の確認作業に30分以上かかる\n担当者ごとに教え方が違い同じミスが繰り返される\n引き継ぎが口頭だけで重要事項が抜ける",
        },
      },
      {
        purposePattern: /対象者|仮説/,
        mission: {
          title: "対象者と困りごとの仮説を1つ決める",
          action: hasSharedArtifacts
            ? "Atlasと共有した候補から、誰のどの困りごとを確かめるか1組に絞る"
            : "対象者と、その人が抱えているかもしれない困りごとを1組に絞る",
          deliverable: "対象者と困りごとの仮説1組",
          doneCriteria: "対象者と確認したい困りごとが1文で書けている",
          timeEstimate: "10分",
          example: "対象者: 初めて副業の提案先を決める会社員\n困りごと: 何を売るか決められず準備が止まる",
        },
      },
      {
        purposePattern: /確認.*質問|質問.*確認|確認.*準備|仮説.*確認/,
        mission: {
          title: "仮説を確認するための質問を3つ作る",
          action: "選んだ仮説を確かめるために、実際に相手へ聞く質問を3つ書く",
          deliverable: "確認質問3つ",
          doneCriteria: "相手にそのまま聞ける質問が3つ並んでいる",
          timeEstimate: "10分",
          example: "今、最も時間がかかっていることは何ですか？\nそれを変えるために試したことはありますか？\n改善できたら何が一番楽になりますか？",
        },
      },
    ];

    const nextMission = exploringMissions.find(
      ({ mission, purposePattern }) => !hasCompletedMissionPurpose(mission, purposePattern, completedMissionTitles),
    );
    return nextMission ? [nextMission.mission] : [];
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
    .replace(/儲かる/g, "支払い意思を検証する")
    .replace(/売れる(?!か|条件|可能性)/g, "売れるか検証する")
    .replace(/需要がある/g, "需要があるか確かめる")
    .replace(/成功する/g, "成功する条件を確認する")
    .replace(/収益化できる/g, "収益化できる条件を確認する")
    .replace(/月収\s*[0-9０-９,，万円円]+を達成できる/g, "支払い意思を検証する")
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
    salesSimulation: {
      price: sanitizeEvidenceQualityText(result.salesSimulation.price, evidence),
      requiredSales: sanitizeEvidenceQualityText(result.salesSimulation.requiredSales, evidence),
      targetProfit: sanitizeEvidenceQualityText(result.salesSimulation.targetProfit, evidence),
    },
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
    "- sharedArtifacts: user-authored artifacts explicitly shared with Atlas. Use them with high confidence for personalization, Mission specificity, and preserving the user's own wording.",
    "- Do not ask again for information already expressed in sharedArtifacts.",
    "- When a sharedArtifact clearly covers a goal, customer problem, or offer/strength candidate, treat only that base topic as already organized at the hypothesis level. Ask the next-stage question or create the next smallest Mission instead of repeating the base question.",
    "- Never promote sharedArtifacts into external facts, completed actions, customer reactions, customer needs, market demand, sales proof, or likelihood of success. Those claims still require observedResults.",
    "- Forbidden: unsupported 'your strength is ...' claims.",
    "- Forbidden: treating goals as traction or execution.",
    "- Forbidden: treating AI-generated customer problems, summaries, memory text, or mission text as validated customer needs.",
    "- Forbidden: saying demand exists, it will sell, or the market wants it without Structured Evidence Context support.",
  ].join("\n");
  const revenueHypothesisRules = [
    "Revenue Hypothesis Rules:",
    "- revenueHypothesis is an internal generation-only object. Return it in this Gemini JSON, but it is not part of the public API response.",
    "- When currentStage is validating, selling, repeating, optimizing, or scaling and a revenue test is the decision target, return every revenueHypothesis field. Otherwise return revenueHypothesis as null.",
    "- When revenueHypothesis is present, use its fields as the single source for the corresponding existing display fields: conclusion summarizes buyer, problem, offer, paidReason; salesSimulation.price uses priceHypothesis; todayPlan uses firstCustomerPath, requiredTime, requiredBudget; todayMission uses smallestValidation; reasons use successCondition and failureCondition; nextStep uses nextDecision. Do not repeat the same content elsewhere without a reason.",
    "- buyer: identify who would pay. problem: identify the problem they may pay to solve. offer: identify the smallest deliverable. paidReason: explain the paid value beyond free information, such as tailored work, implementation, review, access, or time saved. Do not invent proof that this value is wanted.",
    "- priceHypothesis: write one minimum-test price as a hypothesis, for example '価格仮説: 3,000円'. Never present it as a proven market price. If the basis is weak but buyer, problem, and offer are organized, still propose one small test price.",
    "- firstCustomerPath: name a realistic first-customer candidate path that matches the user's available time, budget, experience, and Shared User Artifacts, such as 3 to 5 interview candidates, 1 to 3 direct paid proposals, or a small existing contact group. Shared User Artifacts personalize the path but never prove demand or sales.",
    "- requiredTime and requiredBudget: give only the minimum resources for the test, tied to explicit Current State Map constraints. If a constraint is unknown, say '要確認' rather than inventing it.",
    "- smallestValidation: before development or expansion, prefer 3 to 5 interviews, 1 to 3 paid proposals, manual delivery, a simple document or text proposal, a pre-order, or a reservation/application-intent check.",
    "- successCondition must be observable and say that meeting it permits the next step. failureCondition must say what response means revise or stop. nextDecision must name what will be decided after the test.",
    "- Never start with full-scale development, ad spend, incorporation, a large landing page, or mass acquisition. Keep the test small and reversible.",
    "- If currentStage is exploring or defining and buyer, problem, or offer is not organized, revenueHypothesis must be null. Return needsMoreInfo or a current-stage Mission to organize and test those prerequisites first.",
    "- If Structured Evidence or the Current State Map is insufficient for a revenue hypothesis, revenueHypothesis must be null. Prefer needsMoreInfo or the smallest current-stage Mission.",
    "- Treat all unverified revenue language as hypotheses: use '価格仮説', '需要を確認する', '支払い意思を検証する', '初回販売候補', and '成功条件を満たしたら次へ進む'.",
    "- Unless directly supported by observedResults, never state or imply '儲かる', '売れる', '需要がある', '成功する', or a monthly-income amount as a fact. Do not include unsupported sales, profit, conversion-rate, or revenue figures in any field, including salesSimulation.",
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
  "salesSimulation": { "price": "価格仮説。例: 価格仮説: 3,000円", "requiredSales": "検証用の必要販売数。例: 初回販売候補1件", "targetProfit": "検証目的。例: 支払い意思を確認する" },
  "revenueHypothesis": {
    "buyer": "支払う人の仮説",
    "problem": "支払う問題の仮説",
    "offer": "最小の提供内容",
    "paidReason": "無料情報ではなく支払う理由の仮説",
    "priceHypothesis": "価格仮説: 3,000円",
    "firstCustomerPath": "最初の顧客候補への経路",
    "requiredTime": "最小検証に必要な時間",
    "requiredBudget": "最小検証に必要な費用",
    "smallestValidation": "開発前の最小検証",
    "successCondition": "次へ進む観測可能な条件",
    "failureCondition": "修正または停止する条件",
    "nextDecision": "検証後に決めること"
  },
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
- exampleは分類名や見出しだけにせず、対象・場面・問題のいずれかが分かる記入済みの具体例にする
- exampleはtitle, action, deliverable, doneCriteriaに具体的に対応させる
- exampleはそのままコピーして書き換えられる本文にする
- 最重要: exampleはdeliverableと同じ形式で返す。成果物が候補3項目なら、exampleもそのまま入力できる短い候補3項目にする
- 単語・候補リストの成果物には、単語または短い語句だけを並べる。質問項目や説明文にしない
- 困りごと候補のexampleは、誰がどこで何に困るかが分かる短文を件数どおり返す
- 短文リストの成果物には短文だけを並べる。質問リストの成果物には実際に使う質問文を並べる
- 営業文の成果物には完成した営業文を返す。価格案の成果物には実際の価格案を返す
- 経験、興味、強み候補、困りごと候補、対象者候補を整理するMissionでは、短い語句で十分なら文章にしない
- ユーザー情報が不足している候補整理Missionでは、特定人物を想定せず「これまでの仕事」「人によく頼まれること」「長く続けている趣味」のような中立的な候補形式を使う
- ユーザーが提供していない実績、顧客名、導入事例、売上実績を捏造しない
- 必要な固有名詞がない場合は「相手A」「○○」「△△」などの仮名を使う

- needsMoreInfoは、現在の判断を大きく左右する重要情報が不足している時だけtrueにする
- 情報が十分なら needsMoreInfo は false、followUpQuestions は [] にする
- followUpQuestionsは最大3問
- 質問は、そのユーザーの不足情報だけを聞く。既にProfile、Interview、History、Memoryで分かっていることは聞かない
- 1問は短く、答えやすく、長文入力を前提にしない
- 一般論の質問や広すぎる質問はしない
- missingCriticalInfo が次の判断に重要なら、その不足だけを具体的に質問する
- revenueHypothesisは、12項目すべてを持つオブジェクトかnullだけを返す。不完全なオブジェクトは禁止
${missionReadinessRules}
${missionContinuationRules ? `\n${missionContinuationRules}` : ""}

${revenueHypothesisRules}

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

Shared User Artifacts:
${evidence.sharedArtifacts.length > 0 ? evidence.sharedArtifacts.join("\n\n") : "unknown"}

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

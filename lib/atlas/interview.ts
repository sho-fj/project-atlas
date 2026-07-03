export type InterviewCategory = "Value" | "Time" | "Money" | "Risk" | "Skill" | "Sales" | "Lifestyle";

export type InterviewQuestion = {
  id: string;
  category: InterviewCategory;
  label: string;
  options: InterviewOption[];
};

export type InterviewOption = {
  label: string;
  description: string;
};

export type InterviewAnswer = {
  questionId: string;
  question: string;
  answer: string;
};

export type ProfileType = "Builder" | "Operator" | "Creator" | "Strategist";

export type AtlasProfile = {
  profileType: ProfileType;
  valueMap: {
    family: number;
    health: number;
    freedom: number;
    revenue: number;
    challenge: number;
  };
  strength: string[];
  weakness: string[];
  recommendedStrategy: string[];
  accuracy: number;
  version: string;
  updatedAt: string;
};

const adaptiveQuestions = {
  priority: {
    id: "priority",
    category: "Value",
    label: "今一番優先したいもの",
    options: [
      { label: "家族", description: "家族との時間や安心を最優先したい" },
      { label: "収入", description: "まずはお金の不安を減らしたい" },
      { label: "自由", description: "時間や場所に縛られたくない" },
      { label: "成長", description: "スキルやキャリアを伸ばしたい" },
      { label: "健康", description: "無理せず続けられる働き方にしたい" },
    ],
  },
  familyTime: {
    id: "familyTime",
    category: "Lifestyle",
    label: "平日に守りたい家族時間を選択してください。",
    options: [
      { label: "毎日2時間以上", description: "家族と過ごすまとまった時間を毎日残したい" },
      { label: "夕食時間は確保", description: "夜の食事や会話の時間は守りたい" },
      { label: "週3日以上", description: "毎日は難しいが、週の半分は家族時間を作りたい" },
      { label: "今は確保が難しい", description: "まずは短時間でできる収益行動を優先したい" },
    ],
  },
  healthLimit: {
    id: "healthLimit",
    category: "Lifestyle",
    label: "体力を削らない働き方の条件はどれですか？",
    options: [
      { label: "夜作業を避ける", description: "睡眠時間を削らずに進めたい" },
      { label: "短時間で終える", description: "1回の作業を小さく区切りたい" },
      { label: "移動を減らす", description: "外出や移動なしで進めたい" },
      { label: "人間関係を減らす", description: "ストレスの少ない相手や導線で進めたい" },
    ],
  },
  freedomStyle: {
    id: "freedomStyle",
    category: "Lifestyle",
    label: "自由を増やすために最初に減らしたいものはどれですか？",
    options: [
      { label: "通勤を減らす", description: "場所に縛られない収益導線を作りたい" },
      { label: "残業を減らす", description: "平日の夜に余白を作りたい" },
      { label: "固定予定を減らす", description: "時間の自由度を増やしたい" },
      { label: "低単価作業を減らす", description: "少ない件数で収益を上げたい" },
    ],
  },
  revenueTarget: {
    id: "revenueTarget",
    category: "Money",
    label: "90日後の収益目標を選択してください。",
    options: [
      { label: "月3万円", description: "まずは小さな副収入を作りたい" },
      { label: "月5万円", description: "生活の不安を少し減らしたい" },
      { label: "月10万円", description: "本業以外の柱として育てたい" },
      { label: "独立準備", description: "将来の独立に使える実績を作りたい" },
    ],
  },
  independenceTimeline: {
    id: "independenceTimeline",
    category: "Lifestyle",
    label: "働き方を変える目標時期を選択してください。",
    options: [
      { label: "1年以内", description: "早く収益の柱を作りたい" },
      { label: "2年以内", description: "準備しながら現実的に移行したい" },
      { label: "3年以内", description: "実績と貯金を積み上げてから動きたい" },
      { label: "時期は未定", description: "まずは選択肢を増やしたい" },
    ],
  },
  weekdayTime: {
    id: "weekdayTime",
    category: "Time",
    label: "平日に使える時間",
    options: [
      { label: "15分", description: "短い作業を1つだけ進められる" },
      { label: "30分", description: "調査や文章作成を小さく進められる" },
      { label: "1時間", description: "調査から送信まで1セット進められる" },
      { label: "2時間以上", description: "検証や改善までまとまって進められる" },
    ],
  },
  holidayTime: {
    id: "holidayTime",
    category: "Time",
    label: "休日に使える時間",
    options: [
      { label: "30分", description: "平日の続きだけ進められる" },
      { label: "1時間", description: "1つのMissionを完了できる" },
      { label: "3時間", description: "調査、作成、提案まで進められる" },
      { label: "半日以上", description: "検証サイクルを一気に進められる" },
    ],
  },
  strengthBase: {
    id: "strengthBase",
    category: "Skill",
    label: "今の自分に近い得意パターンを選択してください。",
    options: [
      { label: "文章で整理する", description: "考えや情報を文章にまとめるのが得意" },
      { label: "人に説明・提案する", description: "相手に分かりやすく伝えるのが得意" },
      { label: "手を動かして形にする", description: "ツールや資料を実際に作業して完成に近づけるのが得意" },
      { label: "仕組みを改善する", description: "手順や運用のムダを減らすのが得意" },
      { label: "まだ判断できない", description: "得意な進め方をこれから見つけたい" },
    ],
  },
  salesBlocker: {
    id: "salesBlocker",
    category: "Sales",
    label: "販売で最も避けたい行動を選択してください。",
    options: [
      { label: "顔出し", description: "自分の顔を出して発信するのは避けたい" },
      { label: "直接営業", description: "知らない相手へ強く売り込むのは避けたい" },
      { label: "電話対応", description: "電話や口頭での対応は避けたい" },
      { label: "動画発信", description: "動画を撮影して発信するのは避けたい" },
      { label: "SNS投稿", description: "SNSで継続的に発信するのは避けたい" },
    ],
  },
  initialCost: {
    id: "initialCost",
    category: "Money",
    label: "初期費用",
    options: [
      { label: "0円", description: "無料ツールだけで始めたい" },
      { label: "5,000円以内", description: "必要最低限のツール費なら使える" },
      { label: "1万円以内", description: "検証に必要なら小さく投資できる" },
      { label: "少額なら可", description: "回収見込みがあるなら少し投資できる" },
    ],
  },
  risk: {
    id: "risk",
    category: "Risk",
    label: "リスク許容度",
    options: [
      { label: "低い", description: "失敗しても損失が少ない方法を選びたい" },
      { label: "普通", description: "小さく試しながら判断したい" },
      { label: "高い", description: "勝率があるなら速く動きたい" },
    ],
  },
  aiExperience: {
    id: "aiExperience",
    category: "Skill",
    label: "AI経験",
    options: [
      { label: "ほぼなし", description: "AIツールはまだあまり使っていない" },
      { label: "少しある", description: "文章作成や調査で少し使ったことがある" },
      { label: "よく使う", description: "仕事や作業で日常的に使っている" },
      { label: "自動化も試した", description: "AIを使った仕組み化や自動化に触れたことがある" },
    ],
  },
  continuity: {
    id: "continuity",
    category: "Lifestyle",
    label: "継続力",
    options: [
      { label: "続けるのが苦手", description: "毎日続ける前提だと止まりやすい" },
      { label: "短期なら続く", description: "1週間単位なら集中して進められる" },
      { label: "習慣化できる", description: "決まった時間に作業を続けられる" },
    ],
  },
  avoidFuture: {
    id: "avoidFuture",
    category: "Risk",
    label: "今一番避けたい未来",
    options: [
      { label: "お金に困る", description: "収入の不安をこれ以上増やしたくない" },
      { label: "時間がない", description: "忙しさだけが増える状態を避けたい" },
      { label: "家族との時間が減る", description: "大切な人との時間を犠牲にしたくない" },
      { label: "今の仕事を続ける", description: "今の働き方から抜け出す材料が欲しい" },
      { label: "何も変わらない", description: "行動しないまま時間が過ぎる状態を避けたい" },
    ],
  },
  rePriority: {
    id: "rePriority",
    category: "Value",
    label: "前回から優先順位に変化がありますか？",
    options: [
      { label: "変化なし", description: "前回の方針をそのまま使う" },
      { label: "家族を優先", description: "家族時間や安心を前より重く見る" },
      { label: "収益を優先", description: "まずはお金の不安を減らす" },
      { label: "働き方を変える準備", description: "将来の独立や転職につながる実績を作る" },
    ],
  },
  reTime: {
    id: "reTime",
    category: "Time",
    label: "今週使える時間を更新してください。",
    options: [
      { label: "15分", description: "最小の作業だけ進める" },
      { label: "30分", description: "調査か提案文のどちらかを進める" },
      { label: "1時間", description: "1つのMissionを完了する" },
      { label: "2時間以上", description: "検証と改善まで進める" },
    ],
  },
  reMoney: {
    id: "reMoney",
    category: "Money",
    label: "今週の収益目標を更新してください。",
    options: [
      { label: "反応獲得", description: "まずは返信や興味ありの反応を取る" },
      { label: "3万円", description: "小さな販売で初収益を狙う" },
      { label: "5万円", description: "単価か販売数を上げて狙う" },
      { label: "10万円", description: "高単価の提案を含めて狙う" },
    ],
  },
  reSales: {
    id: "reSales",
    category: "Sales",
    label: "今週の販売ブロックを選択してください。",
    options: [
      { label: "候補不足", description: "誰に提案するかが足りていない" },
      { label: "提案文が弱い", description: "送る文章に自信がない" },
      { label: "価格不安", description: "いくらで出すか迷っている" },
      { label: "送信抵抗", description: "送る直前で手が止まる" },
    ],
  },
} satisfies Record<string, InterviewQuestion>;

const initialFlow = [
  "priority",
  "branch",
  "weekdayTime",
  "holidayTime",
  "strengthBase",
  "salesBlocker",
  "initialCost",
  "risk",
  "aiExperience",
  "continuity",
  "avoidFuture",
] as const;

const reInterviewFlow = ["rePriority", "reTime", "reMoney", "reSales"] as const;

export function createInitialInterviewQueue(isReInterview: boolean): InterviewQuestion[] {
  return [isReInterview ? adaptiveQuestions.rePriority : adaptiveQuestions.priority];
}

export function resolveNextInterviewQuestion(
  answers: InterviewAnswer[],
  isReInterview: boolean,
): InterviewQuestion | null {
  const flow = isReInterview ? reInterviewFlow : initialFlow;
  const answeredIds = new Set(answers.map((answer) => answer.questionId));
  const branchQuestion = resolveBranchQuestion(answers);

  for (const step of flow) {
    if (step === "branch") {
      if (branchQuestion && !answeredIds.has(branchQuestion.id)) {
        return branchQuestion;
      }

      continue;
    }

    const question = adaptiveQuestions[step];

    if (!answeredIds.has(question.id)) {
      return question;
    }
  }

  return null;
}

export function buildAtlasProfile(answers: InterviewAnswer[], previousAccuracy = 70): AtlasProfile {
  const answerText = answers.map((item) => item.answer);
  const getAnswer = (ids: string[]) => answers.find((item) => ids.includes(item.questionId))?.answer ?? "";
  const priority = getAnswer(["priority", "rePriority"]);
  const target = getAnswer(["revenueTarget", "reMoney"]);
  const strengthBase = getAnswer(["strengthBase"]);
  const hardNo = getAnswer(["salesBlocker", "reSales"]);
  const risk = getAnswer(["risk", "avoidFuture"]);
  const aiExperience = getAnswer(["aiExperience"]);
  const continuity = getAnswer(["continuity"]);
  const accuracyBase = Number.isFinite(previousAccuracy) ? previousAccuracy : 70;

  const profileType = resolveProfileType(strengthBase, risk, aiExperience, priority);

  return {
    profileType,
    valueMap: {
      family: priority.includes("家族") || answerText.includes("家族との時間が減る") ? 5 : 3,
      health: priority === "健康" || answerText.includes("夜作業なし") ? 5 : 3,
      freedom: priority === "自由" || target === "独立準備" || priority.includes("働き方") ? 5 : 3,
      revenue: priority.includes("収益") || priority === "収入" || priority === "お金" || target.includes("万円") ? 5 : 4,
      challenge: priority === "成長" || priority.includes("働き方") || risk === "高い" ? 5 : 3,
    },
    strength: buildStrength(profileType, strengthBase, aiExperience),
    weakness: buildWeakness(hardNo, continuity, risk),
    recommendedStrategy: buildRecommendedStrategy(profileType, target, hardNo, priority),
    accuracy: Math.min(accuracyBase + 2, 96),
    version: "v1.0",
    updatedAt: new Date().toISOString(),
  };
}

function resolveBranchQuestion(answers: InterviewAnswer[]): InterviewQuestion | null {
  const priority = answers.find((answer) => answer.questionId === "priority")?.answer;

  if (priority === "家族") {
    return adaptiveQuestions.familyTime;
  }

  if (priority === "健康") {
    return adaptiveQuestions.healthLimit;
  }

  if (priority === "自由") {
    return adaptiveQuestions.freedomStyle;
  }

  if (priority === "収入" || priority === "お金") {
    return adaptiveQuestions.revenueTarget;
  }

  if (priority === "成長" || priority === "独立") {
    return adaptiveQuestions.independenceTimeline;
  }

  return null;
}

function resolveProfileType(strengthBase: string, risk: string, aiExperience: string, priority: string): ProfileType {
  if (strengthBase === "手を動かして形にする") {
    return "Builder";
  }

  if (strengthBase === "仕組みを改善する") {
    return "Operator";
  }

  if (
    strengthBase === "文章で整理する" ||
    strengthBase === "人に説明・提案する"
  ) {
    return "Creator";
  }

  if (priority.includes("働き方") || priority === "成長" || risk === "高い" || aiExperience === "自動化も試した") {
    return "Strategist";
  }

  return "Operator";
}

function buildStrength(profileType: ProfileType, strengthBase: string, aiExperience: string) {
  const base = {
    Builder: ["形にする速度", "検証用の試作", "改善の反復"],
    Operator: ["継続運用", "手順化", "抜け漏れの削減"],
    Creator: ["言葉への変換", "発信素材の作成", "相手に伝える力"],
    Strategist: ["仮説設計", "優先順位の判断", "市場比較"],
  } satisfies Record<ProfileType, string[]>;

  if (aiExperience === "よく使う" || aiExperience === "自動化も試した") {
    return [base[profileType][0], "AI活用", base[profileType][1]];
  }

  if (strengthBase === "まだ判断できない" || strengthBase === "") {
    return ["選択式で前進できる", "制約を守れる", "小さく試せる"];
  }

  return base[profileType];
}

function buildWeakness(hardNo: string, continuity: string, risk: string) {
  const salesWeakness = hardNo ? `${hardNo}を使う施策は勝率低下` : "販売接触の遅れ";
  const weakness = [salesWeakness, "初期仮説の拡散", "販売接触の遅れ"];

  if (continuity === "続けるのが苦手" || continuity === "苦手") {
    weakness[1] = "継続前提の施策";
  }

  if (risk === "低い") {
    weakness[2] = "大きな初期投資";
  }

  if (hardNo === "送信抵抗") {
    weakness[2] = "提案の先送り";
  }

  return weakness;
}

function buildRecommendedStrategy(profileType: ProfileType, target: string, hardNo: string, priority: string) {
  const firstTarget = target.includes("転職")
    ? "職務経歴に残る実績化"
    : priority.includes("働き方") || priority.includes("独立")
      ? "独立準備に使える初回販売"
      : "小さな初収益";
  const secondRoute = hardNo === "SNS投稿" || hardNo === "SNS" || hardNo === "送信抵抗" ? "直接提案ルート" : "短文発信ルート";

  return [
    `${firstTarget}を最優先`,
    `${secondRoute}で7日以内に反応を取る`,
    `${profileType}型の強みを使い、60分Missionへ分解`,
  ];
}

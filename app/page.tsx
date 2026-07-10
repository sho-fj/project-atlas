"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Home,
  ListChecks,
  RotateCcw,
  Settings,
  UserCircle,
} from "lucide-react";

import Header from "@/components/Header";
import AtlasBootScreen from "@/components/atlas/AtlasBootScreen";
import AtlasProfileScreen from "@/components/atlas/AtlasProfileScreen";
import DecisionEngineCard from "@/components/atlas/DecisionEngineCard";
import FounderTimeline from "@/components/atlas/FounderTimeline";
import GhostEventModal from "@/components/atlas/GhostEventModal";
import InterviewScreen from "@/components/atlas/InterviewScreen";
import LoadingScreen from "@/components/atlas/LoadingScreen";
import ProfileGenerationScreen from "@/components/atlas/ProfileGenerationScreen";
import ReflectionScreen from "@/components/atlas/ReflectionScreen";
import ResultScreen from "@/components/atlas/ResultScreen";
import StrategyEngineCard from "@/components/atlas/StrategyEngineCard";
import {
  type AtlasProfile,
  type InterviewAnswer,
  type InterviewQuestion,
  buildAtlasProfile,
  createInitialInterviewQueue,
  resolveNextInterviewQuestion,
} from "@/lib/atlas/interview";
import { resolveStrategy, type StrategyState } from "@/lib/atlas/strategy";
import { resolveFounderTimeline, type FounderTimelineState } from "@/lib/atlas/timeline";

type Screen =
  | "firstRun"
  | "brief"
  | "welcome"
  | "boot"
  | "interview"
  | "reflection"
  | "profileGenerating"
  | "profile"
  | "loading"
  | "followUp"
  | "decision"
  | "result"
  | "mission";

type AtlasMissionDraft =
  | string
  | {
      title?: string;
      action?: string;
      deliverable?: string;
      doneCriteria?: string;
      timeEstimate?: string;
      example?: string;
    };

type AtlasResult = {
  verdict: "GO" | "HOLD" | "STOP";
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
  needsMoreInfo: boolean;
  followUpQuestions: string[];
};

type AtlasApiResult = Omit<AtlasResult, "todayMission"> & {
  todayMission: AtlasMissionDraft[];
};

type AtlasMemory = {
  goal: string;
  todayMission: string;
  trust: number;
  level: number;
  lastConversation: string;
  homework: string;
};

type MissionHistoryEntry = {
  date: string;
  mission: string;
  status: "完了" | "未完了";
  note: string;
};

type ConversationEntry = {
  date: string;
  content: string;
};

type MissionItem = {
  id: string;
  title?: string;
  label?: string;
  done: boolean;
  action?: string;
  deliverable?: string;
  doneCriteria?: string;
  timeEstimate?: string;
  example?: string;
};

type UserArtifact = {
  id: string;
  type: "mission_artifact";
  source: "user";
  missionTitle: string;
  missionAction: string;
  content: string;
  sharedAt: string;
};

type MissionOutcome = "できた" | "反応待ち" | "うまくいかなかった" | "別の発見があった";

type MissionContinuationResult =
  | { status: "mission" }
  | {
      status: "wait";
      reason: string;
      resumeCondition: string;
    };

type FollowUpAnswer = {
  question: string;
  answer: string;
};

type FollowUpQuestionKey = "goal" | "customerProblem" | "offerOrStrength" | "availableTime" | "availableBudget";

const followUpQuestionConfig: Record<
  FollowUpQuestionKey,
  {
    question: string;
    options: string[];
  }
> = {
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
};

type GenerationContext =
  | {
      kind: "initial";
      profile: AtlasProfile;
      answers: InterviewAnswer[];
    }
  | {
      kind: "continuation";
      profile: AtlasProfile;
      answers: InterviewAnswer[];
      outcome: MissionOutcome;
      completedMissions: MissionItem[];
    };

type LegacyProfile = {
  name: string;
  targetRevenue: string;
  availableTime: string;
  currentJob: string;
  interests: string;
  startDate: string;
};

const emptyResult: AtlasResult = {
  verdict: "GO",
  conclusion: "Profileから逆算。今日60分で販売接触を開始する。",
  reasons: ["入力負荷が低い。", "初期費用を抑えられる。", "90日以内の初収益に直結する。"],
  decisionLog: ["Profile条件を採用", "初期費用を抑える", "販売接触を優先", "60分以内で実行可能", "90日以内を優先"],
  todayPlan: [
    "09:00〜09:20 Profile条件を1枚に整理",
    "09:20〜09:40 買う可能性がある相手を10件抽出",
    "09:40〜10:00 短い提案文を3件送信",
  ],
  sevenDayPlan: ["Day1: 候補10件抽出", "Day2: 提案文作成", "Day3: 5件送信"],
  ninetyDayPlan: ["Phase1: 売れる仮説を作る", "Phase2: 初回販売を取る", "Phase3: 再現性を上げる"],
  salesSimulation: {
    price: "",
    requiredSales: "",
    targetProfit: "",
  },
  dontDo: ["長期開発", "販売前の作り込み", "新機能追加"],
  todayMission: ["候補10件抽出", "提案文1本作成", "3件送信"],
  atlasComment: "完成度より販売接触を優先。売れるかどうかを最優先に変更しました。",
  atlasOneLine: "制約内で勝率が高い接触から開始。",
  nextStep: "今日60分で候補10件を抽出し、3件へ提案を送信する。",
  needsMoreInfo: false,
  followUpQuestions: [],
};

const ghostMessages = [
  "数字を見ろ。感情では動くな。",
  "今日の行動が、次の判断材料になる。",
  "未完了を記録。優先順位を再計算。",
  "売上に近い行動を選べ。",
];

const firstRunStorageKey = "atlas-first-run-started";
const missionOutcomeOptions: MissionOutcome[] = ["できた", "反応待ち", "うまくいかなかった", "別の発見があった"];

function getMissionTitle(mission: Pick<MissionItem, "title" | "label">) {
  return mission.title?.trim() || mission.label?.trim() || "Mission";
}

function formatMissionExample(example?: string) {
  if (!example) {
    return "";
  }

  return example
    .replace(/\r\n/g, "\n")
    .replace(/^\s*[-*#]\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(^|[\s(])([*_`]+)([^*_`\n].*?)(\2)(?=[\s).,!?]|$)/g, "$1$3")
    .replace(/[`]/g, "")
    .trim();
}

function normalizeArtifactComparisonText(value: string) {
  return value.replace(/\s/g, "");
}

function toMissionItem(source: AtlasMissionDraft, index: number): MissionItem | null {
  if (typeof source === "string") {
    const normalizedTitle = source.trim();
    return normalizedTitle
      ? {
          id: `${normalizedTitle}-${index}`,
          title: normalizedTitle,
          done: false,
        }
      : null;
  }

  const title = source.title?.trim();

  if (!title) {
    return null;
  }

  return {
    id: `${title}-${index}`,
    title,
    done: false,
    action: source.action?.trim() || undefined,
    deliverable: source.deliverable?.trim() || undefined,
    doneCriteria: source.doneCriteria?.trim() || undefined,
    timeEstimate: source.timeEstimate?.trim() || undefined,
    example: formatMissionExample(source.example) || undefined,
  };
}

function extractMissionItems(result: AtlasApiResult) {
  const missionSources =
    Array.isArray(result.todayMission) && result.todayMission.length > 0
      ? result.todayMission
      : result.todayPlan.map((item) => item.replace(/^\d{2}:\d{2}〜\d{2}:\d{2}\s*/, "").trim()).filter(Boolean);

  return missionSources
    .slice(0, 6)
    .map((mission, index) => toMissionItem(mission, index))
    .filter((mission): mission is MissionItem => Boolean(mission));
}

function readStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function readStoredText(key: string, fallback = "") {
  if (typeof window === "undefined") {
    return fallback;
  }

  return window.localStorage.getItem(key) ?? fallback;
}

function readStoredProfile(): AtlasProfile | null {
  const stored = readStoredValue<Partial<AtlasProfile> | null>("atlas-profile", null);

  if (!stored || !stored.profileType || !stored.valueMap || !Array.isArray(stored.strength)) {
    return null;
  }

  return stored as AtlasProfile;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "未記録";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function buildLegacyProfile(profile: AtlasProfile, answers: InterviewAnswer[]): LegacyProfile {
  const getAnswer = (ids: string[]) => answers.find((item) => ids.includes(item.questionId))?.answer ?? "未設定";

  return {
    name: profile.profileType,
    targetRevenue: getAnswer(["revenueTarget", "reMoney"]),
    availableTime: getAnswer(["weekdayTime", "reTime"]),
    currentJob: getAnswer(["currentState"]),
    interests: profile.recommendedStrategy.join(" / "),
    startDate: profile.updatedAt.slice(0, 10),
  };
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [screen, setScreen] = useState<Screen>("welcome");
  const [interviewIndex, setInterviewIndex] = useState(0);
  const [isReInterview, setIsReInterview] = useState(false);
  const [interviewQueue, setInterviewQueue] = useState<InterviewQuestion[]>(() =>
    createInitialInterviewQueue(false),
  );
  const [interviewAnswers, setInterviewAnswers] = useState<InterviewAnswer[]>([]);
  const [atlasProfile, setAtlasProfile] = useState<AtlasProfile | null>(null);
  const [userName, setUserName] = useState("");
  const [userNameDraft, setUserNameDraft] = useState("");
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [result, setResult] = useState<AtlasResult | null>(null);
  const [memory, setMemory] = useState<AtlasMemory>({
    goal: "未設定",
    todayMission: "未設定",
    trust: 1,
    level: 1,
    lastConversation: "面談前",
    homework: "初回面談を完了する",
  });
  const [missions, setMissions] = useState<MissionItem[]>([]);
  const [missionHistory, setMissionHistory] = useState<MissionHistoryEntry[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [showGhostEvent, setShowGhostEvent] = useState(false);
  const [showMissionComplete, setShowMissionComplete] = useState(false);
  const [atlasComment, setAtlasComment] = useState("Profile生成後、戦略を作成する。");
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [followUpAnswers, setFollowUpAnswers] = useState<FollowUpAnswer[]>([]);
  const [generationContext, setGenerationContext] = useState<GenerationContext | null>(null);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const storedProfile = readStoredProfile();
      const storedAnswers = readStoredValue<InterviewAnswer[]>("atlas-interview-answers", []);
      const storedMissions = readStoredValue<MissionItem[]>("atlas-missions", []);
      const storedMissionHistory = readStoredValue<MissionHistoryEntry[]>("atlas-mission-history", []);
      const storedConversationHistory = readStoredValue<ConversationEntry[]>("atlas-conversation-history", []);
      const storedUserName = readStoredText("atlas-user-name");
      const hasStoredProfile = Boolean(storedProfile);
      const hasStartedFirstRun = window.localStorage.getItem(firstRunStorageKey) === "true";

      setAtlasProfile(storedProfile);
      setInterviewAnswers(storedAnswers);
      setMissions(storedMissions);
      setMissionHistory(storedMissionHistory);
      setConversationHistory(storedConversationHistory);
      setUserName(storedUserName);
      setUserNameDraft(storedUserName);
      setIsReInterview(hasStoredProfile);
      setInterviewQueue(createInitialInterviewQueue(hasStoredProfile));
      setScreen(hasStoredProfile ? "brief" : hasStartedFirstRun ? "welcome" : "firstRun");
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    window.localStorage.setItem("atlas-mission-history", JSON.stringify(missionHistory));
  }, [missionHistory, mounted]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    window.localStorage.setItem("atlas-conversation-history", JSON.stringify(conversationHistory));
  }, [conversationHistory, mounted]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    window.localStorage.setItem("atlas-missions", JSON.stringify(missions));
  }, [missions, mounted]);

  const completedMissionCount = useMemo(() => missions.filter((mission) => mission.done).length, [missions]);
  const progressPercent = useMemo(() => {
    if (missions.length === 0) {
      return 0;
    }

    return Math.round((completedMissionCount / missions.length) * 100);
  }, [completedMissionCount, missions.length]);
  const lastCompletedMission = useMemo(() => {
    const completed = missions.filter((mission) => mission.done);
    return completed.at(-1) ? getMissionTitle(completed.at(-1)!) : "";
  }, [missions]);
  const strategy = useMemo(() => resolveStrategy(progressPercent), [progressPercent]);
  const founderTimeline = useMemo(
    () => resolveFounderTimeline(atlasProfile?.updatedAt ?? null, progressPercent),
    [atlasProfile?.updatedAt, progressPercent],
  );

  const handleDashboardReturn = () => {
    setScreen(atlasProfile ? "brief" : "welcome");
  };

  const resetFollowUpState = () => {
    setFollowUpQuestions([]);
    setFollowUpAnswers([]);
    setGenerationContext(null);
  };

  const buildConversationHistory = (
    label: string,
    content: string,
    baseConversationHistory: ConversationEntry[],
  ) =>
    [
      {
        date: new Date().toLocaleDateString("ja-JP"),
        content: `${label}\n${content}`,
      },
      ...baseConversationHistory,
    ].slice(0, 30);

  const finalizeAtlasResult = (nextResult: AtlasApiResult) => {
    const extractedMissions = extractMissionItems(nextResult);
    const normalizedResult = {
      ...nextResult,
      todayMission: extractedMissions.map((mission) => getMissionTitle(mission)),
    };

    setMissions(extractedMissions);
    setResult(normalizedResult);
    setAtlasComment(nextResult.atlasComment || atlasComment);
    updateMemory(nextResult);
    updateGhostCounter();
    resetFollowUpState();
    setLoadingComplete(true);
    window.setTimeout(() => {
      setScreen("decision");
    }, 600);
  };

  const requestFollowUp = (nextResult: AtlasApiResult, context: GenerationContext) => {
    setFollowUpQuestions(nextResult.followUpQuestions);
    setFollowUpAnswers([]);
    setGenerationContext(context);
    setLoadingComplete(true);
    setScreen("followUp");
  };

  const executeAtlasGeneration = async (context: GenerationContext, pendingFollowUpAnswers: FollowUpAnswer[] = []) => {
    const interviewSummary = context.answers.map((item) => `${item.question}: ${item.answer}`).join("\n");
    const profileSummary = [
      `Profile Type: ${context.profile.profileType}`,
      `Accuracy: ${context.profile.accuracy}%`,
      `Strength: ${context.profile.strength.join(" / ")}`,
      `Weakness: ${context.profile.weakness.join(" / ")}`,
      `Recommended Strategy: ${context.profile.recommendedStrategy.join(" / ")}`,
    ].join("\n");
    const followUpSummary =
      pendingFollowUpAnswers.length > 0
        ? `\nFollow Up Answers:\n${pendingFollowUpAnswers.map((item) => `${item.question}: ${item.answer}`).join("\n")}`
        : "";
    const nextConversationHistory = buildConversationHistory(
      context.kind === "continuation" ? "Mission Continuation" : "Atlas Interview",
      context.kind === "continuation"
        ? `Outcome: ${context.outcome}\nCompleted Missions:\n${context.completedMissions.map((mission) => getMissionTitle(mission)).join("\n")}${followUpSummary}`
        : `${interviewSummary}\n${profileSummary}${followUpSummary}`,
      conversationHistory,
    );

    setConversationHistory(nextConversationHistory);
    setLoadingComplete(false);
    setScreen("loading");

    const body =
      context.kind === "continuation"
        ? {
            answers: context.answers.map((item) => `${item.question}: ${item.answer}`),
            welcomeChoice: "Mission Continuation",
            profile: buildLegacyProfile(context.profile, context.answers),
            atlasProfile: context.profile,
            interviewAnswers: context.answers,
            memory,
            missions,
            missionHistory,
            conversationHistory: nextConversationHistory,
            followUpAnswers: pendingFollowUpAnswers,
            missionContinuation: {
              outcome: context.outcome,
              completedMissions: context.completedMissions.map((mission) => ({
                title: getMissionTitle(mission),
                action: mission.action,
                deliverable: mission.deliverable,
                doneCriteria: mission.doneCriteria,
                timeEstimate: mission.timeEstimate,
              })),
            },
          }
        : {
            answers: context.answers.map((item) => `${item.question}: ${item.answer}`),
            welcomeChoice: "Atlas Interview",
            profile: buildLegacyProfile(context.profile, context.answers),
            atlasProfile: context.profile,
            interviewAnswers: context.answers,
            memory,
            missions,
            missionHistory,
            conversationHistory: nextConversationHistory,
            followUpAnswers: pendingFollowUpAnswers,
          };

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("Failed to generate Atlas result.");
    }

    const data = await response.json();
    return data.result as AtlasApiResult;
  };

  const updateMemory = (nextResult: AtlasApiResult | AtlasResult) => {
    const firstMission = nextResult.todayMission[0];
    const nextMissionTitle = typeof firstMission === "string" ? firstMission : firstMission?.title;

    setMemory((previous) => ({
      goal: nextResult.conclusion || previous.goal,
      todayMission: nextMissionTitle || previous.todayMission,
      trust: Math.min(previous.trust + 1, 5),
      level: Math.min(previous.level + 1, 5),
      lastConversation: nextResult.conclusion || previous.lastConversation,
      homework: nextResult.nextStep || previous.homework,
    }));
  };

  const updateGhostCounter = () => {
    const currentGhostCount = Number(window.localStorage.getItem("atlas-ghost-count") ?? "0");
    const nextGhostCount = currentGhostCount + 1;
    window.localStorage.setItem("atlas-ghost-count", String(nextGhostCount));

    if (nextGhostCount > 0 && nextGhostCount % 33 === 0) {
      setShowGhostEvent(true);
    }
  };

  const saveProfile = (profile: AtlasProfile, answers: InterviewAnswer[]) => {
    window.localStorage.setItem("atlas-profile", JSON.stringify(profile));
    window.localStorage.setItem("atlas-interview-answers", JSON.stringify(answers));
    window.localStorage.setItem("atlas-profile-version", profile.version);
    window.localStorage.setItem("atlas-profile-accuracy", String(profile.accuracy));
    window.localStorage.setItem("atlas-profile-updated-at", profile.updatedAt);
  };

  const handleStartInterview = () => {
    const nextIsReInterview = Boolean(atlasProfile);

    window.localStorage.setItem(firstRunStorageKey, "true");
    resetFollowUpState();
    setInterviewIndex(0);
    setInterviewAnswers([]);
    setIsReInterview(nextIsReInterview);
    setInterviewQueue(createInitialInterviewQueue(nextIsReInterview));
    setResult(null);
    setLoadingComplete(false);
    setScreen("boot");
    window.setTimeout(() => {
      setScreen("interview");
    }, 1000);
  };

  const handleInterviewSelect = (answer: string) => {
    const question = interviewQueue[interviewIndex];

    if (!question) {
      return;
    }

    const nextAnswers = [
      ...interviewAnswers,
      {
        questionId: question.id,
        question: question.label,
        answer,
      },
    ];
    const nextQuestion = resolveNextInterviewQuestion(nextAnswers, isReInterview);

    setInterviewAnswers(nextAnswers);

    if (nextQuestion) {
      setInterviewQueue((previous) => [...previous, nextQuestion]);
      setInterviewIndex((previous) => previous + 1);
      return;
    }

    setScreen("reflection");
  };

  const handleInterviewBack = () => {
    if (interviewIndex === 0) {
      return;
    }

    setInterviewAnswers((previous) => previous.slice(0, -1));
    setInterviewQueue((previous) => previous.slice(0, Math.max(1, previous.length - 1)));
    setInterviewIndex((previous) => Math.max(0, previous - 1));
  };

  const handleReflectionConfirm = () => {
    const nextProfile = buildAtlasProfile(interviewAnswers, atlasProfile?.accuracy ?? 70);

    setAtlasProfile(nextProfile);
    saveProfile(nextProfile, interviewAnswers);
    setScreen("profileGenerating");
    window.setTimeout(() => {
      setScreen("profile");
    }, 1400);
  };

  const handleReflectionRevise = () => {
    if (interviewAnswers.length === 0) {
      setScreen("interview");
      return;
    }

    setInterviewAnswers((previous) => previous.slice(0, -1));
    setInterviewIndex(Math.max(0, interviewQueue.length - 1));
    setScreen("interview");
  };

  const handleProfileBackToInterview = () => {
    setInterviewAnswers((previous) => previous.slice(0, -1));
    setInterviewIndex(Math.max(0, interviewQueue.length - 1));
    setScreen("interview");
  };

  const handleSaveUserName = () => {
    const nextName = userNameDraft.trim();
    setUserName(nextName);
    setUserNameDraft(nextName);

    if (nextName) {
      window.localStorage.setItem("atlas-user-name", nextName);
      return;
    }

    window.localStorage.removeItem("atlas-user-name");
  };

  const handleSkipUserName = () => {
    setUserName("");
    setUserNameDraft("");
    window.localStorage.removeItem("atlas-user-name");
  };

  const handleResetAtlasData = () => {
    [
      "atlas-profile",
      "atlas-interview-answers",
      "atlas-profile-version",
      "atlas-profile-accuracy",
      "atlas-profile-updated-at",
      "atlas-user-name",
      "atlas-missions",
      "atlas-mission-history",
      "atlas-conversation-history",
      "atlas-ghost-count",
      firstRunStorageKey,
    ].forEach((key) => window.localStorage.removeItem(key));

    setAtlasProfile(null);
    setInterviewAnswers([]);
    setMissions([]);
    setMissionHistory([]);
    setConversationHistory([]);
    setUserName("");
    setUserNameDraft("");
    setIsReInterview(false);
    setInterviewIndex(0);
    setInterviewQueue(createInitialInterviewQueue(false));
    setResult(null);
    setLoadingComplete(false);
    resetFollowUpState();
    setMemory({
      goal: "未設定",
      todayMission: "未設定",
      trust: 1,
      level: 1,
      lastConversation: "面談前",
      homework: "初回面談を完了する",
    });
    setAtlasComment("Profile生成後、戦略を作成する。");
    setScreen("firstRun");
  };

  const handleAdvanceFollowUp = async (answer: string) => {
    const currentQuestion = followUpQuestions[followUpAnswers.length] as FollowUpQuestionKey | undefined;

    if (!currentQuestion || !answer || !generationContext) {
      return;
    }

    const nextAnswers = [...followUpAnswers, { question: currentQuestion, answer }];

    if (nextAnswers.length < followUpQuestions.length) {
      setFollowUpAnswers(nextAnswers);
      return;
    }

    try {
      const nextResult = await executeAtlasGeneration(generationContext, nextAnswers);

      if (nextResult.needsMoreInfo && nextResult.followUpQuestions.length > 0) {
        requestFollowUp(nextResult, generationContext);
        return;
      }

      if (generationContext.kind === "continuation") {
        const extractedMissions = nextResult.verdict === "GO" ? extractMissionItems(nextResult) : [];

        if (extractedMissions.length > 0) {
          setMissions(extractedMissions);
          setResult({
            ...nextResult,
            todayMission: extractedMissions.map((mission) => getMissionTitle(mission)),
          });
          setAtlasComment(nextResult.atlasComment || atlasComment);
          updateMemory(nextResult);
          updateGhostCounter();
          resetFollowUpState();
          setScreen("mission");
          return;
        }

        resetFollowUpState();
        setScreen("mission");
        return;
      }

      finalizeAtlasResult(nextResult);
    } catch {
      setResult(emptyResult);
      resetFollowUpState();
      setLoadingComplete(true);
      window.setTimeout(() => {
        setScreen("decision");
      }, 600);
    }
  };

  const runAtlas = async (profile: AtlasProfile, answers: InterviewAnswer[]) => {
    try {
      const context: GenerationContext = {
        kind: "initial",
        profile,
        answers,
      };
      const nextResult = await executeAtlasGeneration(context);

      if (nextResult.needsMoreInfo && nextResult.followUpQuestions.length > 0) {
        requestFollowUp(nextResult, context);
        return;
      }

      finalizeAtlasResult(nextResult);
    } catch {
      setResult(emptyResult);
      resetFollowUpState();
      setLoadingComplete(true);
      window.setTimeout(() => {
        setScreen("decision");
      }, 600);
    }
  };

  const handleContinueMission = async (outcome: MissionOutcome): Promise<MissionContinuationResult> => {
    if (!atlasProfile) {
      return {
        status: "wait",
        reason: "Profileがまだないため、次のMissionを安全に判断できません。",
        resumeCondition: "Profile作成後にMissionを再開する。",
      };
    }

    const completedMissions = missions.filter((mission) => mission.done);

    try {
      const context: GenerationContext = {
        kind: "continuation",
        profile: atlasProfile,
        answers: interviewAnswers,
        outcome,
        completedMissions,
      };
      const nextResult = await executeAtlasGeneration(context);

      if (nextResult.needsMoreInfo && nextResult.followUpQuestions.length > 0) {
        requestFollowUp(nextResult, context);
        return {
          status: "wait",
          reason: "判断に必要な情報を追加で確認しています。",
          resumeCondition: "追加質問への回答後に、そのまま再判断します。",
        };
      }

      const extractedMissions = nextResult.verdict === "GO" ? extractMissionItems(nextResult) : [];

      if (extractedMissions.length > 0) {
        setMissions(extractedMissions);
        setResult({
          ...nextResult,
          todayMission: extractedMissions.map((mission) => getMissionTitle(mission)),
        });
        setAtlasComment(nextResult.atlasComment || atlasComment);
        updateMemory(nextResult);
        updateGhostCounter();
        resetFollowUpState();
        setScreen("mission");
        return { status: "mission" };
      }

      return {
        status: "wait",
        reason: nextResult.reasons[0] || nextResult.conclusion || "次の判断材料がまだ不足しています。",
        resumeCondition: nextResult.nextStep || "反応や結果が返ってきたら再開する。",
      };
    } catch {
      return {
        status: "wait",
        reason: "継続Missionの判断に失敗しました。",
        resumeCondition: "少し時間を置いてから、Mission完了画面でもう一度試す。",
      };
    }
  };

  const handleGenerateFromProfile = () => {
    if (!atlasProfile) {
      return;
    }

    void runAtlas(atlasProfile, interviewAnswers);
  };

  const handleMissionFromSavedProfile = () => {
    if (!atlasProfile) {
      return;
    }

    void runAtlas(atlasProfile, interviewAnswers);
  };

  const toggleMission = (missionId: string) => {
    setMissions((previous) => {
      const targetMission = previous.find((mission) => mission.id === missionId);
      const nextValue = !targetMission?.done;
      const nextMissions = previous.map((mission) => (mission.id === missionId ? { ...mission, done: nextValue } : mission));

      setAtlasComment(nextValue ? "処理を記録。優先順位を再計算。" : "未完了へ更新。処理を続行。");

      if (targetMission) {
        setMissionHistory((history) => [
          {
            date: new Date().toLocaleDateString("ja-JP"),
            mission: getMissionTitle(targetMission),
            status: nextValue ? ("完了" as const) : ("未完了" as const),
            note: nextValue ? "達成を記録" : "未完了に更新",
          },
          ...history,
        ].slice(0, 50));
      }

      if (nextMissions.length > 0 && nextMissions.every((mission) => mission.done)) {
        setShowMissionComplete(true);
      }

      return nextMissions;
    });
  };
  const isFirstRunScreen = screen === "firstRun";

  return (
    <div className="atlas-page">
      <Header
        missionDone={completedMissionCount}
        missionTotal={missions.length}
        tagline={isFirstRunScreen ? "次の一歩を決めるAI" : undefined}
        hideMetrics={isFirstRunScreen}
      />

      <main className="px-4 py-8 sm:px-6 sm:py-12">
        {showMissionComplete && (
          <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between rounded-[18px] border border-atlas-success/20 bg-atlas-success/10 px-5 py-4 text-atlas-primary">
            <span className="text-sm font-medium">Mission Complete</span>
            <button
              type="button"
              onClick={() => setShowMissionComplete(false)}
              className="text-sm font-bold text-atlas-primary"
            >
              閉じる
            </button>
          </div>
        )}

        <GhostEventModal isOpen={showGhostEvent} onClose={() => setShowGhostEvent(false)} messages={ghostMessages} />

        {screen === "firstRun" && <FirstRunScreen onStart={handleStartInterview} />}

        {screen === "brief" && atlasProfile && (
          <DashboardScreen
            lastCompletedMission={lastCompletedMission}
            timeline={founderTimeline}
            missions={missions}
            progressPercent={progressPercent}
            completedMissionCount={completedMissionCount}
            userName={userName}
            userNameDraft={userNameDraft}
            onUserNameDraftChange={setUserNameDraft}
            onSaveUserName={handleSaveUserName}
            onResetAtlasData={handleResetAtlasData}
            onContinue={() => setScreen("mission")}
            onNewConsultation={handleStartInterview}
          />
        )}

        {screen === "welcome" && (
          <div className="mx-auto grid w-full max-w-5xl gap-4">
            <NameSettingPanel
              userName={userName}
              draft={userNameDraft}
              onDraftChange={setUserNameDraft}
              onSave={handleSaveUserName}
              onSkip={handleSkipUserName}
            />
            <WelcomePanel
              profile={atlasProfile}
              onStartInterview={handleStartInterview}
              onGenerateMission={handleMissionFromSavedProfile}
            />
          </div>
        )}

        {screen === "boot" && <AtlasBootScreen />}

        {screen === "interview" && (
          <div className="mx-auto w-full max-w-5xl">
            <TopActions onDashboard={handleDashboardReturn} onNewConsultation={handleStartInterview} />
            <button
              type="button"
              onClick={handleInterviewBack}
              disabled={interviewIndex === 0}
              className={`mb-4 inline-flex items-center rounded-[14px] border px-4 py-2 text-sm font-black transition duration-200 ${
                interviewIndex === 0
                  ? "cursor-not-allowed border-slate-200 bg-white/60 text-slate-300"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              前の質問へ
            </button>
            {isReInterview && (
              <section className="mb-4 rounded-[22px] border border-indigo-100 bg-indigo-50/70 p-5 shadow-[0_12px_30px_rgba(79,70,229,0.06)]">
                <p className="text-[12px] font-black uppercase tracking-[0.2em] text-indigo-500">
                  Founder Memory
                </p>
                <h2 className="mt-2 text-xl font-black tracking-normal text-slate-950">
                  前回の内容を確認しました。
                </h2>
                <p className="mt-2 text-sm font-bold leading-7 text-slate-500">
                  変わった点だけ選択してください。
                </p>
              </section>
            )}
            <InterviewScreen
              questions={interviewQueue}
              currentIndex={interviewIndex}
              answers={interviewAnswers}
              plannedQuestionCount={isReInterview ? 5 : 12}
              onSelect={handleInterviewSelect}
            />
          </div>
        )}

        {screen === "reflection" && (
          <ReflectionScreen
            answers={interviewAnswers}
            onConfirm={handleReflectionConfirm}
            onRevise={handleReflectionRevise}
            onDashboard={handleDashboardReturn}
            onNewConsultation={handleStartInterview}
          />
        )}

        {screen === "profileGenerating" && (
          <div className="mx-auto grid w-full max-w-5xl gap-4">
            <TopActions onDashboard={handleDashboardReturn} onNewConsultation={handleStartInterview} />
            <ProfileGenerationScreen />
          </div>
        )}

        {screen === "profile" && atlasProfile && (
          <div className="mx-auto grid w-full max-w-5xl gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <TopActions onDashboard={handleDashboardReturn} onNewConsultation={handleStartInterview} />
                <button
                  type="button"
                  onClick={handleProfileBackToInterview}
                  className="mt-3 inline-flex items-center rounded-[14px] border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 transition duration-200 hover:bg-slate-50"
                >
                  回答を修正
                </button>
              </div>
              <NameSettingPanel
                userName={userName}
                draft={userNameDraft}
                onDraftChange={setUserNameDraft}
                onSave={handleSaveUserName}
                onSkip={handleSkipUserName}
              />
            </div>
            <AtlasProfileScreen
              profile={atlasProfile}
              onGenerate={handleGenerateFromProfile}
              onRestartInterview={handleStartInterview}
            />
          </div>
        )}

        {screen === "loading" && (
          <div className="mx-auto grid w-full max-w-5xl gap-4">
            <TopActions onDashboard={handleDashboardReturn} onNewConsultation={handleStartInterview} />
            <LoadingScreen isComplete={loadingComplete} />
          </div>
        )}

        {screen === "followUp" && (
          <div className="mx-auto grid w-full max-w-3xl gap-4">
            <TopActions onDashboard={handleDashboardReturn} onNewConsultation={handleStartInterview} />
            <FollowUpQuestionPanel
              questionKey={(followUpQuestions[followUpAnswers.length] as FollowUpQuestionKey | undefined) ?? "goal"}
              currentIndex={followUpAnswers.length + 1}
              total={followUpQuestions.length}
              onSelect={(answer) => void handleAdvanceFollowUp(answer)}
            />
          </div>
        )}

        {screen === "mission" && (
          <div className="mx-auto grid w-full max-w-5xl gap-4">
            <TopActions onDashboard={handleDashboardReturn} onNewConsultation={handleStartInterview} />
            <MissionPanel
              missions={missions}
              progressPercent={progressPercent}
              atlasComment={atlasComment}
              strategy={strategy}
              timeline={founderTimeline}
              onToggleMission={toggleMission}
              onDashboard={handleDashboardReturn}
              onContinueMission={handleContinueMission}
            />
          </div>
        )}

        {screen === "decision" && result && (
          <div className="mx-auto grid w-full max-w-5xl gap-4">
            <TopActions onDashboard={handleDashboardReturn} onNewConsultation={handleStartInterview} />
            <DecisionEngineCard result={result} onComplete={() => setScreen("result")} />
          </div>
        )}

        {screen === "result" && result && (
          <div className="space-y-6">
            <div className="sticky top-[82px] z-10 mx-auto flex w-full max-w-7xl justify-start">
              <button
                type="button"
                onClick={handleDashboardReturn}
                className="inline-flex min-h-9 items-center justify-center rounded-[12px] border border-slate-200 bg-white/90 px-3 text-xs font-black text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.06)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              >
                ← ダッシュボード
              </button>
            </div>
            {missions.length > 0 && (
              <MissionPanel
                missions={missions}
                progressPercent={progressPercent}
                atlasComment={atlasComment}
                strategy={strategy}
                timeline={founderTimeline}
                onToggleMission={toggleMission}
                onDashboard={handleDashboardReturn}
                onContinueMission={handleContinueMission}
                showNextStep={false}
              />
            )}
          <ResultScreen
            result={result}
            onDashboard={handleDashboardReturn}
            onNewConsultation={handleStartInterview}
          />
          </div>
        )}
      </main>
    </div>
  );
}

function FirstRunScreen({ onStart }: { onStart: () => void }) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-132px)] w-full max-w-4xl items-center">
      <div className="w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_54px_rgba(15,23,42,0.07)]">
        <div className="h-1 bg-[#5FA8A0]" />
        <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.22em] text-[#25736C]">Atlas</p>
            <p className="mt-4 whitespace-nowrap text-sm font-black text-slate-500 sm:text-base">
              副業や新しい挑戦を、前に進めたい人へ。
            </p>
            <h1 className="mt-5 whitespace-pre-line text-5xl font-black leading-[1.05] tracking-normal text-slate-950 sm:text-6xl">
              {`迷うな。\n進め。`}
            </h1>
            <p className="mt-6 max-w-xl whitespace-pre-line text-xl font-black leading-9 text-slate-800 sm:text-2xl sm:leading-10">
              {`副業や新しい挑戦の迷いを整理して、\n「今やる」\n「今は待つ」\n「今はやらない」\nを判断し、\n今日の一歩を決めます。`}
            </p>
            <p className="mt-5 text-base font-bold text-slate-500">
              3分。長い入力は必要ありません。
            </p>
            <button
              type="button"
              onClick={onStart}
              className="mt-8 flex min-h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-[#182033] px-6 text-base font-black text-white shadow-[0_16px_36px_rgba(24,32,51,0.16)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-100 sm:w-auto"
            >
              次の一歩を決める
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-[#F4F6F8] p-5">
            <div className="grid gap-3">
              {["悩みを整理", "判断を分ける", "今日の一歩を決める"].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-[18px] bg-white px-4 py-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#5FA8A0]/12 text-sm font-black text-[#25736C]">
                    {index + 1}
                  </span>
                  <span className="text-sm font-black text-slate-900">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TopActions({
  onDashboard,
  onNewConsultation,
}: {
  onDashboard: () => void;
  onNewConsultation: () => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={onDashboard}
        className="inline-flex items-center rounded-[14px] border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 shadow-[0_8px_22px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100"
      >
        ← Dashboard
      </button>
      <button
        type="button"
        onClick={onNewConsultation}
        className="inline-flex items-center rounded-[14px] bg-[#182033] px-4 py-2 text-sm font-black text-white shadow-[0_8px_22px_rgba(15,23,42,0.12)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-100"
      >
        新しい相談
      </button>
    </div>
  );
}

function FollowUpQuestionPanel({
  questionKey,
  currentIndex,
  total,
  onSelect,
}: {
  questionKey: FollowUpQuestionKey;
  currentIndex: number;
  total: number;
  onSelect: (answer: string) => void;
}) {
  const config = followUpQuestionConfig[questionKey];

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_54px_rgba(15,23,42,0.07)] sm:p-8">
      <p className="text-[12px] font-black uppercase tracking-[0.2em] text-indigo-500">Atlas Follow Up</p>
      <h2 className="mt-3 text-3xl font-black tracking-normal text-slate-950">もう少しだけ教えてください</h2>
      <p className="mt-3 text-sm font-bold text-slate-500">{`${Math.min(currentIndex, Math.max(total, 1))}/${Math.max(total, 1)}`}</p>
      <div className="mt-6 rounded-[20px] bg-slate-50 p-5">
        <p className="text-sm font-black text-slate-950">現在の質問</p>
        <p className="mt-3 text-xl font-black leading-8 text-slate-900">{config.question}</p>
      </div>
      <div className="mt-5 grid gap-3">
        {config.options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className="flex min-h-12 items-center justify-between rounded-[16px] border border-slate-200 bg-white px-4 text-left text-sm font-black text-slate-900 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-100"
          >
            <span>{option}</span>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </button>
        ))}
      </div>
    </section>
  );
}

function NameSettingPanel({
  userName,
  draft,
  onDraftChange,
  onSave,
  onSkip,
}: {
  userName: string;
  draft: string;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onSkip: () => void;
}) {
  return (
    <section className="rounded-[20px] border border-slate-200 bg-white/90 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto] lg:items-center">
        <div>
          <p className="text-sm font-black text-slate-950">呼び名を設定しますか？</p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {userName ? `解析対象: ${userName}` : "解析対象を確認中"}
          </p>
        </div>
        <input
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="ニックネームを入力"
          className="h-11 rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition duration-200 placeholder:text-slate-300 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSave}
            className="h-11 rounded-[14px] bg-slate-950 px-4 text-sm font-black text-white transition duration-200 hover:bg-black"
          >
            保存
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="h-11 rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 transition duration-200 hover:bg-slate-50"
          >
            未設定のまま進む
          </button>
        </div>
      </div>
    </section>
  );
}

function WelcomePanel({
  profile,
  onStartInterview,
  onGenerateMission,
}: {
  profile: AtlasProfile | null;
  onStartInterview: () => void;
  onGenerateMission: () => void;
}) {
  return (
    <section className="mx-auto w-full max-w-5xl animate-in fade-in duration-500">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_54px_rgba(15,23,42,0.07)]">
        <div className="h-1 bg-indigo-500" />
        <div className="grid gap-7 p-5 sm:p-8 lg:grid-cols-[1fr_0.86fr] lg:items-center">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#182033] text-white shadow-[0_12px_30px_rgba(24,32,51,0.14)]">
                <Brain className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.22em] text-indigo-500">Atlas Core</p>
                <h1 className="mt-1 text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">
                  Revenue Protocol
                </h1>
              </div>
            </div>
            <p className="mt-7 whitespace-pre-line text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
              {`理解してから\n戦略を立てます。`}
            </p>
            <p className="mt-5 max-w-lg text-base font-bold leading-7 text-slate-500">
              解析開始。Profileを生成し、90日以内の初収益に向けてMissionへ接続します。
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-[#F4F6F8] p-5 sm:p-6">
            {profile ? (
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.22em] text-slate-400">Atlas Profile</p>
                <div className="mt-5 grid gap-3">
                  <InfoCard label="最終面談" value={formatDate(profile.updatedAt)} />
                </div>
                <div className="mt-5 grid gap-3">
                <button type="button" onClick={onGenerateMission} className="flex min-h-12 items-center justify-center gap-2 rounded-[18px] bg-[#182033] px-5 text-sm font-black text-white transition duration-200 hover:-translate-y-0.5 hover:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-100">
                    今日のMissionを見る
                    <ArrowRight className="h-4 w-4" />
                  </button>
                <button type="button" onClick={onStartInterview} className="flex min-h-12 items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100">
                    <RotateCcw className="h-4 w-4" />
                    再面談する
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="rounded-[20px] border border-slate-200 bg-white p-4">
                  <p className="text-sm font-black text-slate-950">初回面談前</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-500">初回面談前。ボタン選択のみ。</p>
                </div>
                <button
                  type="button"
                  onClick={onStartInterview}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      onStartInterview();
                    }
                  }}
                  className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-[#182033] px-5 text-base font-black text-white shadow-[0_16px_36px_rgba(24,32,51,0.16)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-200"
                >
                  Atlas Profile を生成する
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardScreen({
  lastCompletedMission,
  timeline,
  missions,
  progressPercent,
  completedMissionCount,
  userName,
  userNameDraft,
  onUserNameDraftChange,
  onSaveUserName,
  onResetAtlasData,
  onContinue,
  onNewConsultation,
}: {
  lastCompletedMission: string;
  timeline: FounderTimelineState;
  missions: MissionItem[];
  progressPercent: number;
  completedMissionCount: number;
  userName: string;
  userNameDraft: string;
  onUserNameDraftChange: (value: string) => void;
  onSaveUserName: () => void;
  onResetAtlasData: () => void;
  onContinue: () => void;
  onNewConsultation: () => void;
}) {
  const dashboardRef = useRef<HTMLElement | null>(null);
  const missionRef = useRef<HTMLElement | null>(null);
  const profileRef = useRef<HTMLElement | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const missionTotal = missions.length;
  const missionItems = missions.slice(0, 4);
  const scrollToSection = (target: HTMLElement | null) => {
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const handleSidebarNavigation = (target: string) => {
    if (target === "dashboard") {
      scrollToSection(dashboardRef.current);
      return;
    }

    if (target === "mission") {
      scrollToSection(missionRef.current);
      return;
    }

    if (target === "profile") {
      scrollToSection(profileRef.current);
      return;
    }

    setShowSettingsModal(true);
  };
  const navItems = [
    { label: "Dashboard", icon: Home, target: "dashboard" },
    { label: "Mission", icon: ListChecks, target: "mission" },
    { label: "Profile", icon: UserCircle, target: "profile" },
    { label: "Settings", icon: Settings, target: "settings" },
  ];

  return (
    <section className="mx-auto w-full max-w-[1500px] animate-in fade-in duration-500 rounded-[28px] bg-[#F4F6F8] p-3 sm:p-4">
      <div className="grid gap-5 lg:grid-cols-[184px_minmax(0,1fr)_330px]">
        <aside className="rounded-[24px] border border-slate-200/70 bg-white p-4 shadow-[0_18px_54px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-[#182033] text-white">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-black tracking-normal text-slate-950">Atlas</p>
              <p className="text-xs font-bold text-slate-500">Founder OS</p>
            </div>
          </div>

          <nav className="mt-8 grid gap-2">
            {navItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleSidebarNavigation(item.target)}
                  className={`flex items-center gap-3 rounded-[14px] px-3 py-3 text-sm font-black transition duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 ${
                    index === 0 ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="grid gap-5">
          <section ref={dashboardRef} className="scroll-mt-24 relative overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_82%_18%,rgba(95,168,160,0.18),transparent_30%),linear-gradient(135deg,#182033_0%,#202A43_58%,#F8FAFC_145%)] p-6 text-white shadow-[0_22px_58px_rgba(24,32,51,0.18)] sm:p-8">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-white/50">Atlasの判断</p>
                <button
                  type="button"
                  onClick={onNewConsultation}
                  className="rounded-[14px] border border-white/25 bg-white px-4 py-2 text-sm font-black text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.12)] transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-white/25"
                >
                  新しい相談
                </button>
              </div>
              <h1 className="mt-8 text-4xl font-black leading-tight tracking-normal sm:text-5xl">
                今日のMissionを確認。
              </h1>
              <p className="mt-4 max-w-xl text-base font-bold leading-7 text-white/70">
                Profileを確認。優先順位を再計算し、本日の最適行動を提示します。
              </p>

              <div className="mt-7 grid max-w-sm gap-3">
                <HeroMetric label="Mission" value={`${completedMissionCount}/${missionTotal}`} />
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onContinue}
                  className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-[#5FA8A0] to-indigo-500 px-6 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(95,168,160,0.26)] transition duration-200 hover:-translate-y-0.5 hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-white/25"
                >
                  Missionを開始
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>

          <section ref={missionRef} className="scroll-mt-24 rounded-[24px] border border-slate-200/70 bg-white p-5 shadow-[0_18px_54px_rgba(15,23,42,0.07)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-black text-slate-950">Today&apos;s Mission</h2>
              {lastCompletedMission && (
                <p className="text-xs font-bold text-slate-400">前回: {lastCompletedMission}</p>
              )}
            </div>
            <div className="grid gap-2">
              {missionItems.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5">
                  <p className="text-sm font-black text-slate-900">まだミッションはありません。</p>
                  <p className="mt-2 whitespace-pre-line text-sm font-bold leading-6 text-slate-500">
                    {`相談を始めると、\nここに次の行動が表示されます。`}
                  </p>
                </div>
              ) : missionItems.map((mission, index) => (
                <button
                  key={mission.id}
                  type="button"
                  onClick={onContinue}
                  className="group grid grid-cols-[28px_minmax(0,1fr)_72px] items-center gap-3 rounded-[16px] border border-slate-100 bg-white px-3 py-3 text-left transition duration-200 hover:-translate-y-0.5 hover:border-indigo-100 hover:bg-indigo-50/50 hover:shadow-[0_12px_28px_rgba(79,70,229,0.08)] focus:outline-none focus:ring-4 focus:ring-indigo-100"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-[8px] border border-indigo-100 bg-indigo-50 text-indigo-600 transition duration-200 group-hover:scale-110">
                    {mission.done && <CheckCircle2 className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 truncate text-sm font-black text-slate-900">{getMissionTitle(mission)}</span>
                  <span className={`rounded-full px-2 py-1 text-center text-xs font-black ${
                    index === 0 ? "bg-[#5FA8A0]/12 text-[#25736C]" : index === 1 ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-600"
                  }`}>
                    P{index + 1}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="grid gap-5">
          <MemoryDeltaCard completedMissionCount={completedMissionCount} />
          <section ref={profileRef} className="scroll-mt-24 rounded-[24px] border border-slate-200/70 bg-white p-5 shadow-[0_18px_54px_rgba(15,23,42,0.07)]">
            <p className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400">Profile Generation</p>
            <h2 className="mt-2 text-base font-black text-slate-950">Progress</h2>
            <div className="mt-4 grid gap-3">
              <ImageStat label="Mission" value={`${completedMissionCount}/${missionTotal}`} />
              <ImageStat label="Day" value={`${timeline.currentDay}/90`} />
              <ImageStat label="Phase" value={timeline.activePhase.label} />
              <ImageStat label="Mission Progress" value={`${progressPercent}%`} />
              <ProgressBlocks value={progressPercent} />
            </div>
          </section>
        </aside>
      </div>

      {showSettingsModal && (
        <DashboardModal title="Settings" onClose={() => setShowSettingsModal(false)}>
          <div className="grid gap-5">
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Nickname</span>
              <input
                value={userNameDraft}
                onChange={(event) => onUserNameDraftChange(event.target.value)}
                placeholder={userName || "ニックネーム"}
                className="min-h-12 rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition duration-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />
            </label>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => {
                  onSaveUserName();
                  setShowSettingsModal(false);
                }}
                className="flex min-h-11 items-center justify-center rounded-[14px] bg-[#182033] px-4 text-sm font-black text-white transition duration-200 hover:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              >
                ニックネーム変更
              </button>
              <button
                type="button"
                onClick={onNewConsultation}
                className="flex min-h-11 items-center justify-center rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition duration-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              >
                Profile再生成
              </button>
              <button
                type="button"
                onClick={onResetAtlasData}
                className="flex min-h-11 items-center justify-center rounded-[14px] border border-rose-100 bg-rose-50 px-4 text-sm font-black text-rose-700 transition duration-200 hover:bg-rose-100 focus:outline-none focus:ring-4 focus:ring-rose-100"
              >
                データ初期化
              </button>
            </div>
          </div>
        </DashboardModal>
      )}
    </section>
  );
}

function DashboardModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm">
      <section className="w-full max-w-md rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Modalを閉じる"
            className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-slate-200 bg-white text-sm font-black text-slate-500 transition duration-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100"
          >
            ×
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </section>
    </div>
  );
}

function MemoryDeltaCard({ completedMissionCount }: { completedMissionCount: number }) {
  const completedLabel = completedMissionCount > 0 ? `${completedMissionCount}件完了` : "未完了";
  const changes = [`Missionを${completedLabel}`];

  return (
    <section className="rounded-[24px] border border-indigo-100 bg-white p-5 shadow-[0_18px_54px_rgba(15,23,42,0.07)]">
      <p className="text-[12px] font-black uppercase tracking-[0.2em] text-indigo-500">Founder Memory</p>
      <h2 className="mt-2 text-xl font-black tracking-normal text-slate-950">Mission履歴</h2>
      <div className="mt-5 grid gap-3">
        {changes.map((change) => (
          <div key={change} className="flex items-start gap-3 rounded-[16px] bg-indigo-50/70 px-3 py-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <p className="text-sm font-black leading-6 text-slate-800">{change}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MissionPanel({
  missions,
  progressPercent,
  atlasComment,
  strategy,
  timeline,
  onToggleMission,
  onDashboard,
  onContinueMission,
  showNextStep = true,
}: {
  missions: MissionItem[];
  progressPercent: number;
  atlasComment: string;
  strategy: StrategyState;
  timeline: FounderTimelineState;
  onToggleMission: (missionId: string) => void;
  onDashboard: () => void;
  onContinueMission: (outcome: MissionOutcome) => Promise<MissionContinuationResult>;
  showNextStep?: boolean;
}) {
  const missionTotal = Math.max(missions.length, 1);
  const allMissionsDone = missions.length > 0 && missions.every((mission) => mission.done);
  const [openExampleId, setOpenExampleId] = useState<string | null>(null);
  const [copiedExampleId, setCopiedExampleId] = useState<string | null>(null);
  const [editingExampleId, setEditingExampleId] = useState<string | null>(null);
  const [artifactDraft, setArtifactDraft] = useState("");
  const [artifactMessage, setArtifactMessage] = useState<{ type: "success" | "error"; text: string; missionId: string } | null>(null);
  const [isContinuationOpen, setIsContinuationOpen] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<MissionOutcome | null>(null);
  const [isContinuingMission, setIsContinuingMission] = useState(false);
  const [waitResult, setWaitResult] = useState<Extract<MissionContinuationResult, { status: "wait" }> | null>(null);

  useEffect(() => {
    if (!allMissionsDone) {
      setIsContinuationOpen(false);
      setSelectedOutcome(null);
      setIsContinuingMission(false);
      setWaitResult(null);
    }
  }, [allMissionsDone]);

  const handleCopyExample = async (mission: MissionItem) => {
    const exampleText = formatMissionExample(mission.example);

    if (!exampleText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(exampleText);
      setCopiedExampleId(mission.id);
      window.setTimeout(() => {
        setCopiedExampleId((current) => (current === mission.id ? null : current));
      }, 2200);
    } catch {
      setCopiedExampleId((current) => (current === mission.id ? null : current));
    }
  };

  const handleStartArtifactEdit = (mission: MissionItem) => {
    const exampleText = formatMissionExample(mission.example);
    if (!exampleText) {
      return;
    }

    setEditingExampleId(mission.id);
    setArtifactDraft(exampleText);
    setArtifactMessage(null);
  };

  const handleCancelArtifactEdit = () => {
    setEditingExampleId(null);
    setArtifactDraft("");
  };

  const handleShareArtifact = (mission: MissionItem) => {
    const originalExample = formatMissionExample(mission.example);
    const nextContent = artifactDraft.trim();
    const normalizedOriginalExample = normalizeArtifactComparisonText(originalExample);
    const normalizedNextContent = normalizeArtifactComparisonText(nextContent);

    if (!normalizedNextContent || normalizedNextContent === normalizedOriginalExample) {
      return;
    }

    try {
      const storedArtifacts = readStoredValue<UserArtifact[]>("atlas-user-artifacts", []);
      const nextArtifact: UserArtifact = {
        id: crypto.randomUUID(),
        type: "mission_artifact",
        source: "user",
        missionTitle: getMissionTitle(mission),
        missionAction: mission.action?.trim() || "",
        content: nextContent,
        sharedAt: new Date().toISOString(),
      };
      window.localStorage.setItem("atlas-user-artifacts", JSON.stringify([...storedArtifacts, nextArtifact]));
      setArtifactMessage({ type: "success", text: "Atlasと共有しました", missionId: mission.id });
      setEditingExampleId(null);
      setArtifactDraft("");
    } catch {
      setArtifactMessage({ type: "error", text: "保存できませんでした", missionId: mission.id });
    }
  };

  const handleContinuationOutcome = async (outcome: MissionOutcome) => {
    setSelectedOutcome(outcome);
    setWaitResult(null);
    setIsContinuingMission(true);

    const nextResult = await onContinueMission(outcome);

    if (nextResult.status === "wait") {
      setWaitResult(nextResult);
    }

    setIsContinuingMission(false);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <StrategyEngineCard strategy={strategy} />
      <FounderTimeline timeline={timeline} />
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.055)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400">Today&apos;s Mission</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Mission更新</h2>
          </div>
          <div className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-black text-indigo-600">{progressPercent}% 完了</div>
        </div>
        <div className="mt-5">
          <ProgressBlocks value={progressPercent} />
        </div>

        {missions.length === 0 ? (
          <div className="mt-6 rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5">
            <p className="text-sm font-black text-slate-900">まだミッションはありません。</p>
            <p className="mt-2 whitespace-pre-line text-sm font-bold leading-6 text-slate-500">
              {`相談を始めると、\nここに次の行動が表示されます。`}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {missions.map((mission, index) => (
              <article
                key={mission.id}
                className={`rounded-[20px] border px-4 py-4 transition duration-200 ${
                  mission.done
                    ? "border-emerald-200 bg-emerald-50/80 text-slate-950 shadow-[0_10px_26px_rgba(34,197,94,0.08)]"
                    : "border-slate-200 bg-white text-slate-950 shadow-[0_12px_28px_rgba(79,70,229,0.05)]"
                }`}
              >
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_72px] sm:items-start">
                  <button
                    type="button"
                    aria-pressed={mission.done}
                    onClick={() => onToggleMission(mission.id)}
                    className={`group grid min-h-16 grid-cols-[32px_minmax(0,1fr)] items-start gap-3 text-left transition duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 ${
                      mission.done ? "" : "hover:-translate-y-0.5"
                    }`}
                  >
                    <span className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-[10px] border transition duration-200 ${
                      mission.done ? "border-emerald-300 bg-emerald-500 text-white scale-105" : "border-slate-200 bg-white text-slate-300 group-hover:border-indigo-300 group-hover:text-indigo-500"
                    }`}>
                      {mission.done ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                    </span>
                    <span>
                      <span className="block text-sm font-black leading-6">{getMissionTitle(mission)}</span>
                      <span className="mt-1 block text-xs font-bold text-slate-400">
                        {mission.done ? "処理済み。履歴に記録。" : `${index + 1}/${missionTotal} / 本日の最適行動`}
                      </span>
                    </span>
                  </button>

                  <span className={`justify-self-start rounded-full px-2 py-1 text-center text-xs font-black sm:justify-self-end ${
                    index === 0 ? "bg-[#5FA8A0]/12 text-[#25736C]" : index === 1 ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-600"
                  }`}>
                    P{index + 1}
                  </span>
                </div>

                {(mission.action || mission.deliverable || mission.doneCriteria || mission.timeEstimate) && (
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    {mission.action && (
                      <div className="rounded-[16px] bg-slate-50 px-4 py-3">
                        <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">何をするか</dt>
                        <dd className="mt-2 text-sm font-bold leading-6 text-slate-900">{mission.action}</dd>
                      </div>
                    )}
                    {mission.deliverable && (
                      <div className="rounded-[16px] bg-slate-50 px-4 py-3">
                        <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">何を作るか</dt>
                        <dd className="mt-2 text-sm font-bold leading-6 text-slate-900">{mission.deliverable}</dd>
                      </div>
                    )}
                    {mission.doneCriteria && (
                      <div className="rounded-[16px] bg-slate-50 px-4 py-3">
                        <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">どこまでやれば完了か</dt>
                        <dd className="mt-2 text-sm font-bold leading-6 text-slate-900">{mission.doneCriteria}</dd>
                      </div>
                    )}
                    {mission.timeEstimate && (
                      <div className="rounded-[16px] bg-slate-50 px-4 py-3">
                        <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">何分でやるか</dt>
                        <dd className="mt-2 text-sm font-bold leading-6 text-slate-900">{mission.timeEstimate}</dd>
                      </div>
                    )}
                  </dl>
                )}

                {formatMissionExample(mission.example) && (
                  <div className="mt-4">
                    {artifactMessage?.missionId === mission.id && (
                      <p className={`mb-3 text-sm font-black ${artifactMessage.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
                        {artifactMessage.text}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setOpenExampleId((current) => (current === mission.id ? null : mission.id))}
                      className="inline-flex min-h-11 items-center justify-center rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition duration-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    >
                      {openExampleId === mission.id ? "完成サンプルを閉じる" : "完成サンプルを見る"}
                    </button>

                    {openExampleId === mission.id && (
                      <div className="mt-3 rounded-[18px] border border-indigo-100 bg-indigo-50/40 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-slate-950">完成サンプル（例）</p>
                            <p className="mt-1 text-sm font-bold leading-6 text-slate-500">
                              コピーして、自分用に書き換えて使えます。
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleCopyExample(mission)}
                            className="inline-flex min-h-10 items-center justify-center rounded-[12px] border border-indigo-200 bg-white px-3 text-sm font-black text-indigo-700 transition duration-200 hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                          >
                            {copiedExampleId === mission.id ? "✓ コピーしました" : "サンプルをコピー"}
                          </button>
                        </div>
                        <div className="mt-4 rounded-[16px] bg-white px-4 py-4 text-sm font-bold leading-7 text-slate-800 shadow-[0_8px_24px_rgba(79,70,229,0.05)] whitespace-pre-wrap break-words select-text">
                          {formatMissionExample(mission.example)}
                        </div>
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => handleStartArtifactEdit(mission)}
                            className="inline-flex min-h-10 items-center justify-center rounded-[12px] border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition duration-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                          >
                            自分用に書き換える
                          </button>
                        </div>
                        {editingExampleId === mission.id && (
                          <div className="mt-4 rounded-[16px] border border-slate-200 bg-white p-4">
                            <p className="text-sm font-black text-slate-950">自分用に書き換える</p>
                            <textarea
                              value={artifactDraft}
                              onChange={(event) => setArtifactDraft(event.target.value)}
                              rows={8}
                              className="mt-3 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-7 text-slate-900 outline-none transition duration-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                            />
                            <div className="mt-4 flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() => handleShareArtifact(mission)}
                                disabled={
                                  !normalizeArtifactComparisonText(artifactDraft.trim()) ||
                                  normalizeArtifactComparisonText(artifactDraft.trim()) ===
                                    normalizeArtifactComparisonText(formatMissionExample(mission.example))
                                }
                                className="inline-flex min-h-10 items-center justify-center rounded-[12px] bg-slate-950 px-4 text-sm font-black text-white transition duration-200 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-300"
                              >
                                Atlasと共有
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelArtifactEdit}
                                className="inline-flex min-h-10 items-center justify-center rounded-[12px] border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition duration-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                              >
                                キャンセル
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        <div className="mt-6 rounded-[20px] bg-[#F4F6F8] p-4">
          <p className="text-sm font-bold text-slate-500">Atlas</p>
          <p className="mt-2 text-sm font-semibold leading-7 text-slate-950">{atlasComment}</p>
        </div>
      </section>

      {showNextStep && allMissionsDone && (
        <section className="rounded-[30px] border border-emerald-100 bg-white p-5 shadow-[0_18px_54px_rgba(16,185,129,0.08)] sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.2em] text-emerald-500">MISSION COMPLETE</p>
              <h2 className="mt-2 text-3xl font-black tracking-normal text-slate-950">一歩、進みました。</h2>
              <p className="mt-3 whitespace-pre-line text-sm font-bold leading-7 text-slate-500">
                {`今回の結果をもとに、\n次の一歩を決めましょう。`}
              </p>
            </div>

            <div className="grid gap-3 sm:min-w-64">
              {!isContinuationOpen && (
                <button
                  type="button"
                  onClick={() => setIsContinuationOpen(true)}
                  className="flex min-h-14 items-center justify-center gap-2 rounded-[18px] bg-[#182033] px-5 text-base font-black text-white shadow-[0_14px_30px_rgba(24,32,51,0.14)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                >
                  もう一歩進める
                  <ArrowRight className="h-5 w-5" />
                </button>
              )}
              <button
                type="button"
                onClick={onDashboard}
                className="flex min-h-12 items-center justify-center rounded-[16px] border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              >
                今日はここまで
              </button>
            </div>
          </div>

          {isContinuationOpen && (
            <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">今回のMissionはどうでしたか？</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {missionOutcomeOptions.map((outcome) => (
                  <button
                    key={outcome}
                    type="button"
                    disabled={isContinuingMission}
                    onClick={() => void handleContinuationOutcome(outcome)}
                    className={`min-h-12 rounded-[16px] border px-4 text-sm font-black transition duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-wait disabled:opacity-60 ${
                      selectedOutcome === outcome
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-indigo-200 hover:text-slate-950"
                    }`}
                  >
                    {outcome}
                  </button>
                ))}
              </div>

              {isContinuingMission && (
                <p className="mt-3 text-sm font-bold text-slate-500">現在地を再判断しています。</p>
              )}

              {waitResult && (
                <div className="mt-4 rounded-[18px] border border-amber-100 bg-white p-4">
                  <p className="text-[12px] font-black uppercase tracking-[0.18em] text-amber-500">今は待つ</p>
                  <dl className="mt-3 grid gap-3">
                    <div>
                      <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">理由</dt>
                      <dd className="mt-1 text-sm font-bold leading-6 text-slate-900">{waitResult.reason}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">再開条件</dt>
                      <dd className="mt-1 text-sm font-bold leading-6 text-slate-900">{waitResult.resumeCondition}</dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {showNextStep && !allMissionsDone && (
        <section className="rounded-[30px] border border-indigo-100 bg-white p-5 shadow-[0_18px_54px_rgba(79,70,229,0.08)] sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.2em] text-indigo-500">NEXT STEP</p>
              <h2 className="mt-2 text-3xl font-black tracking-normal text-slate-950">次の判断へ。</h2>
              <p className="mt-3 whitespace-pre-line text-sm font-bold leading-7 text-slate-500">
                {`ミッションを確認しました。\nダッシュボードから、次の一歩を決めましょう。`}
              </p>
            </div>

            <div className="grid gap-3 sm:min-w-64">
              <button
                type="button"
                onClick={onDashboard}
                className="flex min-h-14 items-center justify-center gap-2 rounded-[18px] bg-[#182033] px-5 text-base font-black text-white shadow-[0_14px_30px_rgba(24,32,51,0.14)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              >
                ダッシュボードへ進む
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/15 bg-white/10 px-4 py-4 backdrop-blur">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/45">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-normal text-white">{value}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-5">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function ImageStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] bg-slate-50 px-3 py-2">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

function ProgressBlocks({ value }: { value: number }) {
  const activeCount = Math.max(0, Math.min(7, Math.round((value / 100) * 7)));

  return (
    <div className="rounded-[16px] bg-slate-50 px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Progress</p>
        <p className="text-xs font-black text-slate-600">{value}%</p>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }).map((_, index) => (
          <span
            key={index}
            className={`h-2 rounded-full transition duration-200 ${
              index < activeCount ? "bg-[#5FA8A0]" : "bg-slate-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Home,
  Lightbulb,
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
  | "decision"
  | "result"
  | "mission";

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
  label: string;
  done: boolean;
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
    price: "10,000円",
    requiredSales: "3件",
    targetProfit: "30,000円",
  },
  dontDo: ["長期開発", "販売前の作り込み", "新機能追加"],
  todayMission: ["候補10件抽出", "提案文1本作成", "3件送信"],
  atlasComment: "完成度より販売接触を優先。売れるかどうかを最優先に変更しました。",
  atlasOneLine: "制約内で勝率が高い接触から開始。",
  nextStep: "今日60分で候補10件を抽出し、3件へ提案を送信する。",
};

const ghostMessages = [
  "数字を見ろ。感情では動くな。",
  "今日の行動が、次の判断材料になる。",
  "未完了を記録。優先順位を再計算。",
  "売上に近い行動を選べ。",
];

const firstRunStorageKey = "atlas-first-run-started";

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
    return completed.at(-1)?.label ?? missions[0]?.label ?? "競合10社調査";
  }, [missions]);
  const strategy = useMemo(() => resolveStrategy(progressPercent), [progressPercent]);
  const founderTimeline = useMemo(
    () => resolveFounderTimeline(atlasProfile?.updatedAt ?? null, progressPercent),
    [atlasProfile?.updatedAt, progressPercent],
  );

  const handleDashboardReturn = () => {
    setScreen(atlasProfile ? "brief" : "welcome");
  };

  const updateMemory = (nextResult: AtlasResult) => {
    setMemory((previous) => ({
      goal: nextResult.conclusion || previous.goal,
      todayMission: nextResult.todayMission[0] || previous.todayMission,
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

  const runAtlas = async (profile: AtlasProfile, answers: InterviewAnswer[]) => {
    const legacyProfile = buildLegacyProfile(profile, answers);
    const interviewSummary = answers.map((item) => `${item.question}: ${item.answer}`).join("\n");
    const profileSummary = [
      `Profile Type: ${profile.profileType}`,
      `Accuracy: ${profile.accuracy}%`,
      `Strength: ${profile.strength.join(" / ")}`,
      `Weakness: ${profile.weakness.join(" / ")}`,
      `Recommended Strategy: ${profile.recommendedStrategy.join(" / ")}`,
    ].join("\n");
    const nextConversationHistory = [
      {
        date: new Date().toLocaleDateString("ja-JP"),
        content: `Atlas Interview\n${interviewSummary}\n${profileSummary}`,
      },
      ...conversationHistory,
    ].slice(0, 30);

    setConversationHistory(nextConversationHistory);
    setLoadingComplete(false);
    setScreen("loading");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: answers.map((item) => `${item.question}: ${item.answer}`),
          welcomeChoice: "Atlas Interview",
          profile: legacyProfile,
          atlasProfile: profile,
          interviewAnswers: answers,
          memory,
          missions,
          missionHistory,
          conversationHistory: nextConversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate Atlas result.");
      }

      const data = await response.json();
      const nextResult = data.result as AtlasResult;
      const missionLabels = Array.isArray(nextResult.todayMission) && nextResult.todayMission.length > 0
        ? nextResult.todayMission
        : nextResult.todayPlan
            .map((item) => item.replace(/^\d{2}:\d{2}〜\d{2}:\d{2}\s*/, "").trim())
            .filter(Boolean);
      const extractedMissions = missionLabels.slice(0, 6).map((label, index) => ({ id: `${label}-${index}`, label, done: false }));

      setMissions(extractedMissions);
      setResult(nextResult);
      updateMemory(nextResult);
      updateGhostCounter();
      setLoadingComplete(true);
      window.setTimeout(() => {
        setScreen("decision");
      }, 600);
    } catch {
      setResult(emptyResult);
      setLoadingComplete(true);
      window.setTimeout(() => {
        setScreen("decision");
      }, 600);
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
            mission: targetMission.label,
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
        profileAccuracy={atlasProfile?.accuracy ?? 0}
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
            profile={atlasProfile}
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
              />
            )}
            <ResultScreen
              result={result}
              memory={memory}
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
                  <InfoCard label="Profile Accuracy" value={`${profile.accuracy}%`} />
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
                  <p className="text-sm font-black text-slate-950">Profile Accuracy 0%</p>
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
  profile,
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
  profile: AtlasProfile;
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
  const insightRef = useRef<HTMLDivElement | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const missionTotal = missions.length || 3;
  const missionItems = missions.length > 0
    ? missions.slice(0, 4)
    : [
        { id: "market", label: "競合価格を3件確認", done: false },
        { id: "offer", label: "提案文を1つ更新", done: false },
        { id: "sales", label: "見込み客へ3件送信", done: false },
      ];
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

    if (target === "insight") {
      scrollToSection(insightRef.current);
      return;
    }

    setShowSettingsModal(true);
  };
  const navItems = [
    { label: "Dashboard", icon: Home, target: "dashboard" },
    { label: "Mission", icon: ListChecks, target: "mission" },
    { label: "Profile", icon: UserCircle, target: "profile" },
    { label: "Insight", icon: Lightbulb, target: "insight" },
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
                  {item.label}
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
                今日は「価格改善」を優先。
              </h1>
              <p className="mt-4 max-w-xl text-base font-bold leading-7 text-white/70">
                Profileを確認。優先順位を再計算し、本日の最適行動を提示します。
              </p>

              <div className="mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
                <HeroMetric label="期待値" value="92%" />
                <HeroMetric label="所要時間" value="45分" />
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
                <a
                  href="#founder-compass"
                  className="rounded-[16px] border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-white/25"
                >
                  理由を見る
                </a>
              </div>
            </div>
          </section>

          <section ref={missionRef} className="scroll-mt-24 rounded-[24px] border border-slate-200/70 bg-white p-5 shadow-[0_18px_54px_rgba(15,23,42,0.07)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-black text-slate-950">Today&apos;s Mission</h2>
              <p className="text-xs font-bold text-slate-400">前回: {lastCompletedMission}</p>
            </div>
            <div className="grid gap-2">
              {missionItems.map((mission, index) => (
                <button
                  key={mission.id}
                  type="button"
                  onClick={onContinue}
                  className="group grid grid-cols-[28px_minmax(0,1fr)_72px] items-center gap-3 rounded-[16px] border border-slate-100 bg-white px-3 py-3 text-left transition duration-200 hover:-translate-y-0.5 hover:border-indigo-100 hover:bg-indigo-50/50 hover:shadow-[0_12px_28px_rgba(79,70,229,0.08)] focus:outline-none focus:ring-4 focus:ring-indigo-100"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-[8px] border border-indigo-100 bg-indigo-50 text-indigo-600 transition duration-200 group-hover:scale-110">
                    {mission.done && <CheckCircle2 className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 truncate text-sm font-black text-slate-900">{mission.label}</span>
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
          <div ref={insightRef} className="scroll-mt-24">
            <FounderCompassCard />
          </div>
          <MemoryDeltaCard completedMissionCount={completedMissionCount} />
          <section ref={profileRef} className="scroll-mt-24 rounded-[24px] border border-slate-200/70 bg-white p-5 shadow-[0_18px_54px_rgba(15,23,42,0.07)]">
            <p className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400">Profile Generation</p>
            <h2 className="mt-2 text-base font-black text-slate-950">Progress</h2>
            <div className="mt-4 grid gap-3">
              <ImageStat label="Profile Accuracy" value={`${profile.accuracy}%`} />
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

function FounderCompassCard() {
  const dontDo = ["ロゴ調整", "長期開発", "新機能追加"];

  return (
    <section id="founder-compass" className="rounded-[24px] border border-slate-200/70 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.055)]">
      <p className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400">Founder Compass</p>
      <div className="mt-4 rounded-[20px] border border-[#5FA8A0]/20 bg-[#F1FAF8] p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#25736C]">今日の判断</p>
        <h2 className="mt-2 text-2xl font-black tracking-normal text-slate-950">価格改善を優先</h2>
        <div className="mt-4 flex items-end justify-between rounded-[16px] bg-white px-4 py-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">期待値</p>
          <p className="text-3xl font-black text-[#25736C]">92%</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        <div className="rounded-[18px] bg-indigo-50 px-4 py-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-400">理由</p>
          <p className="mt-2 text-sm font-black leading-7 text-slate-800">
            昨日の検証結果では、販売数より単価改善の期待値が高い。
          </p>
        </div>
      </div>
      <div className="mt-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">今日やらないこと</p>
        <div className="mt-3 grid gap-2">
          {dontDo.map((item) => (
            <div key={item} className="rounded-[14px] bg-slate-50 px-3 py-2 text-sm font-black text-slate-600">
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MemoryDeltaCard({ completedMissionCount }: { completedMissionCount: number }) {
  const completedLabel = completedMissionCount > 0 ? `${completedMissionCount}件完了` : "未完了";
  const trustDelta = completedMissionCount > 0 ? `+${Math.min(completedMissionCount * 2, 8)}%` : "+0%";
  const changes = [
    `Missionを${completedLabel}`,
    `信頼度 ${trustDelta}`,
    "興味: AI販売 → SaaSへ変化",
  ];

  return (
    <section className="rounded-[24px] border border-indigo-100 bg-white p-5 shadow-[0_18px_54px_rgba(15,23,42,0.07)]">
      <p className="text-[12px] font-black uppercase tracking-[0.2em] text-indigo-500">Founder Memory</p>
      <h2 className="mt-2 text-xl font-black tracking-normal text-slate-950">前回からの変化</h2>
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
}: {
  missions: MissionItem[];
  progressPercent: number;
  atlasComment: string;
  strategy: StrategyState;
  timeline: FounderTimelineState;
  onToggleMission: (missionId: string) => void;
}) {
  const missionTotal = Math.max(missions.length, 1);

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
          <p className="mt-6 text-sm font-bold leading-7 text-slate-500">ProfileからMissionを生成してください。</p>
        ) : (
          <div className="mt-6 grid gap-3">
            {missions.map((mission, index) => (
              <button
                key={mission.id}
                type="button"
                aria-pressed={mission.done}
                onClick={() => onToggleMission(mission.id)}
                className={`group grid min-h-16 grid-cols-[32px_minmax(0,1fr)_72px] items-center gap-3 rounded-[18px] border px-4 py-3 text-left transition duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 ${
                  mission.done
                    ? "border-emerald-200 bg-emerald-50 text-slate-950 shadow-[0_10px_26px_rgba(34,197,94,0.08)]"
                    : "border-slate-200 bg-white text-slate-950 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/60 hover:shadow-[0_12px_28px_rgba(79,70,229,0.08)]"
                }`}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-[10px] border transition duration-200 ${
                  mission.done ? "border-emerald-300 bg-emerald-500 text-white scale-105" : "border-slate-200 bg-white text-slate-300 group-hover:border-indigo-300 group-hover:text-indigo-500"
                }`}>
                  {mission.done ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                </span>
                <span>
                  <span className="block text-sm font-black leading-6">{mission.label}</span>
                  <span className="mt-1 block text-xs font-bold text-slate-400">
                    {mission.done ? "処理済み。Memoryへ反映。" : `${index + 1}/${missionTotal} / 本日の最適行動`}
                  </span>
                </span>
                <span className={`rounded-full px-2 py-1 text-center text-xs font-black ${
                  index === 0 ? "bg-[#5FA8A0]/12 text-[#25736C]" : index === 1 ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-600"
                }`}>
                  P{index + 1}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 rounded-[20px] bg-[#F4F6F8] p-4">
          <p className="text-sm font-bold text-slate-500">Atlas</p>
          <p className="mt-2 text-sm font-semibold leading-7 text-slate-950">{atlasComment}</p>
        </div>
      </section>
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

"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  PauseCircle,
  RotateCcw,
  ShieldAlert,
  Target,
  TrendingUp,
  WalletCards,
  XCircle,
} from "lucide-react";

type Verdict = "GO" | "HOLD" | "STOP";

type Result = {
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

type AtlasMemory = {
  goal: string;
  todayMission: string;
  trust: number;
  level: number;
  lastConversation: string;
  homework: string;
};

type ResultScreenProps = {
  result: Result;
  memory: AtlasMemory;
  onRestart: () => void;
};

type VerdictConfig = {
  label: string;
  title: string;
  score: number;
  successRate: string;
  difficulty: string;
  revenueExpectation: string;
  icon: ReactNode;
  accent: string;
  soft: string;
  text: string;
};

const verdictConfig: Record<Verdict, VerdictConfig> = {
  GO: {
    label: "GO",
    title: "実行推奨",
    score: 86,
    successRate: "72%",
    difficulty: "中",
    revenueExpectation: "高",
    icon: <CheckCircle2 className="h-8 w-8" />,
    accent: "from-emerald-500 to-teal-500",
    soft: "bg-emerald-50 text-emerald-600",
    text: "text-emerald-500",
  },
  HOLD: {
    label: "HOLD",
    title: "条件調整",
    score: 58,
    successRate: "46%",
    difficulty: "中-高",
    revenueExpectation: "中",
    icon: <PauseCircle className="h-8 w-8" />,
    accent: "from-amber-500 to-orange-500",
    soft: "bg-amber-50 text-amber-600",
    text: "text-amber-500",
  },
  STOP: {
    label: "STOP",
    title: "停止推奨",
    score: 31,
    successRate: "24%",
    difficulty: "高",
    revenueExpectation: "低",
    icon: <XCircle className="h-8 w-8" />,
    accent: "from-rose-500 to-red-500",
    soft: "bg-rose-50 text-rose-600",
    text: "text-rose-500",
  },
};

const fallbackDecisionLog = [
  "Profile条件を採用",
  "初期費用を抑える",
  "販売接触を優先",
  "60分以内で実行可能",
  "90日以内を優先",
];

const fallbackMissions = [
  "候補10件を抽出",
  "提案文を1本作成",
  "3件へ送信",
];

const fallbackDontDo = [
  "ロゴ調整",
  "長期開発",
  "新機能追加",
];

export default function ResultScreen({
  result,
  memory,
  onRestart,
}: ResultScreenProps) {
  const ui = verdictConfig[result.verdict];
  const missionItems = buildMissionItems(result);
  const decisionItems = buildDecisionItems(result);
  const riskyActions = (result.dontDo.length > 0 ? result.dontDo : fallbackDontDo).slice(0, 3);
  const salesSimulation = [
    {
      label: "販売価格",
      value: result.salesSimulation.price,
      icon: <WalletCards className="h-5 w-5" />,
    },
    {
      label: "必要販売数",
      value: result.salesSimulation.requiredSales,
      icon: <Target className="h-5 w-5" />,
    },
    {
      label: "利益",
      value: result.salesSimulation.targetProfit,
      icon: <TrendingUp className="h-5 w-5" />,
    },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl animate-in fade-in duration-200">
      <div className="rounded-[32px] border border-indigo-100/70 bg-[radial-gradient(circle_at_top_left,#F1F5FF_0,#FFFFFF_32%,#F8FAFC_100%)] p-3 shadow-[0_20px_56px_rgba(79,70,229,0.09)] sm:p-4">
        <div className="grid gap-4">
          <section className="overflow-hidden rounded-[30px] border border-white/70 bg-white shadow-[0_20px_52px_rgba(79,70,229,0.1)]">
            <div className="border-b border-indigo-50 bg-gradient-to-r from-indigo-50 via-white to-violet-50 px-5 py-4 sm:px-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[12px] font-black uppercase tracking-[0.22em] text-indigo-500">
                  Atlas Result
                </p>
                <span className="rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-black text-indigo-600">
                  90日以内を優先
                </span>
              </div>
            </div>

            <div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[1fr_310px] lg:items-end">
              <div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-br ${ui.accent} text-white shadow-lg shadow-indigo-200`}>
                    {ui.icon}
                  </div>
                  <div>
                    <h1 className={`text-6xl font-black leading-none tracking-normal sm:text-8xl ${ui.text}`}>
                      {ui.label}
                    </h1>
                    <p className="mt-2 text-xl font-black text-slate-800">
                      {ui.title}
                    </p>
                  </div>
                </div>

                <p className="mt-6 max-w-3xl text-2xl font-black leading-10 text-slate-950">
                  {result.conclusion}
                </p>
                <p className="mt-3 max-w-2xl text-base font-bold leading-7 text-slate-500">
                  {result.atlasOneLine || "理由、戦略、行動を接続。今日のMissionへ移行します。"}
                </p>

                <div className="mt-7 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${ui.accent} transition-all duration-200`}
                    style={{ width: `${ui.score}%` }}
                  />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Metric label="成功率" value={ui.successRate} />
                  <Metric label="難易度" value={ui.difficulty} />
                  <Metric label="収益期待" value={ui.revenueExpectation} />
                </div>
              </div>

              <div className="rounded-[28px] bg-[#182033] p-5 text-white shadow-[0_16px_42px_rgba(24,32,51,0.16)]">
                <p className="text-[12px] font-black uppercase tracking-[0.22em] text-white/45">
                  Execution Score
                </p>
                <p className="mt-2 text-6xl font-black tracking-normal">
                  {ui.score}
                </p>
                <div className="mt-5 rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/40">
                    Next Action
                  </p>
                  <p className="mt-2 text-sm font-bold leading-7 text-white/75">
                    {result.nextStep}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
            <Panel eyebrow="Block 01" title="今日のMission" icon={<Clock3 className="h-5 w-5" />}>
              <div className="grid gap-3">
                {missionItems.map((mission, index) => (
                  <div
                    key={`${mission}-${index}`}
                    className="grid min-h-14 grid-cols-[28px_minmax(0,1fr)_56px] items-center gap-3 rounded-[20px] border border-slate-100 bg-white px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.04)]"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-[9px] border border-indigo-200 bg-indigo-50 text-indigo-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <p className="min-w-0 text-sm font-black leading-6 text-slate-800">
                      {mission}
                    </p>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-center text-[11px] font-black text-slate-500">
                      P{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel eyebrow="Block 02" title="Decision Log" icon={<CheckCircle2 className="h-5 w-5" />}>
              <div className="rounded-[22px] border border-indigo-100 bg-indigo-50/70 p-4">
                <p className="text-sm font-black leading-7 text-slate-800">
                  Atlasは以下の理由で今回の戦略を採用しました。
                </p>
              </div>
              <div className="mt-4 grid gap-2.5">
                {decisionItems.map((reason, index) => (
                  <div
                    key={`${reason}-${index}`}
                    className="flex items-start gap-3 rounded-[18px] border border-slate-100 bg-white px-4 py-3"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[11px] font-black text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm font-bold leading-6 text-slate-700">
                      {reason}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-[18px] bg-[#182033] px-4 py-3 text-sm font-bold leading-7 text-white/75">
                {result.atlasComment || "完成度より販売接触を優先。売れるかどうかを最優先に変更しました。"}
              </p>
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
            <Panel eyebrow="Block 03" title="Sales Simulation" icon={<BarChart3 className="h-5 w-5" />}>
              <div className="grid gap-3 sm:grid-cols-3">
                {salesSimulation.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[22px] border border-indigo-100 bg-white p-4 shadow-[0_10px_28px_rgba(79,70,229,0.06)]"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[16px] bg-indigo-50 text-indigo-600">
                      {item.icon}
                    </div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-black text-slate-950">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-[22px] border border-slate-200 bg-[#F4F6F8] p-4">
                <p className="text-[12px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Atlas Memory
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <MemoryLine label="Goal" value={memory.goal || result.conclusion} />
                  <MemoryLine label="Trust" value={`Lv.${memory.level} / ${memory.trust}`} />
                </div>
              </div>
            </Panel>

            <Panel eyebrow="Block 04" title="Don't Do" icon={<ShieldAlert className="h-5 w-5" />}>
              <div className="grid gap-3">
                {riskyActions.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-[18px] bg-slate-100 px-4 py-3 text-slate-600"
                  >
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                    <p className="text-sm font-bold leading-6">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <section className="rounded-[30px] bg-[radial-gradient(circle_at_85%_10%,rgba(95,168,160,0.22),transparent_32%),linear-gradient(135deg,#182033_0%,#202A43_58%,#312E81_130%)] p-5 text-white shadow-[0_20px_56px_rgba(79,70,229,0.18)] sm:p-7">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.22em] text-white/45">
                  Next Action
                </p>
                <h2 className="mt-3 text-3xl font-black leading-tight tracking-normal sm:text-4xl">
                  {result.nextStep}
                </h2>
              </div>
              <ArrowRight className="hidden h-12 w-12 text-white/70 lg:block" />
            </div>
          </section>

          <section className="rounded-[28px] border border-indigo-100 bg-white p-5 shadow-[0_18px_54px_rgba(79,70,229,0.08)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.2em] text-indigo-500">
                  Atlas Memory
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-normal text-slate-950">
                  Atlasが記憶しました
                </h2>
              </div>
              <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-600">
                次回へ反映
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {buildCapturedMemory(result, memory).map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[18px] bg-indigo-50/60 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                  <p className="text-sm font-black leading-6 text-slate-800">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-5 rounded-[20px] bg-[#182033] px-4 py-3 text-sm font-bold leading-7 text-white/75">
              次回以降の提案へ反映します。
            </p>
          </section>

          <div className="grid gap-3">
            <button
              type="button"
              onClick={onRestart}
              className="flex h-14 items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-white px-5 text-base font-black text-slate-600 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            >
              <RotateCcw className="h-5 w-5" />
              別案を見る
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Panel({
  eyebrow,
  title,
  icon,
  children,
}: {
  eyebrow: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_54px_rgba(15,23,42,0.07)] backdrop-blur sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-normal text-slate-950">
            {title}
          </h2>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-indigo-50 text-indigo-600">
          {icon}
        </div>
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-indigo-100 bg-white p-4 shadow-[0_10px_28px_rgba(79,70,229,0.06)]">
      <p className="text-[12px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function MemoryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-white px-3 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 line-clamp-2 text-sm font-black leading-6 text-slate-800">
        {value}
      </p>
    </div>
  );
}

function buildMissionItems(result: Result) {
  const source = result.todayMission.length > 0 ? result.todayMission : result.todayPlan;

  return (source.length > 0 ? source : fallbackMissions).slice(0, 4).map((item) =>
    item.replace(/^\d{2}:\d{2}〜\d{2}:\d{2}\s*/, "").trim(),
  );
}

function buildDecisionItems(result: Result) {
  const source = result.decisionLog.length > 0
    ? result.decisionLog
    : result.reasons.length > 0
      ? result.reasons
      : fallbackDecisionLog;

  return source.slice(0, 5);
}

function buildCapturedMemory(result: Result, memory: AtlasMemory) {
  const source = [
    result.decisionLog[0],
    result.decisionLog[1],
    result.todayMission[0] || memory.todayMission,
    result.atlasComment,
  ].filter((item): item is string => Boolean(item && item.trim()));

  if (source.length >= 4) {
    return source.slice(0, 4);
  }

  return [
    ...source,
    "営業より仕組み作りを優先",
    "価格改善が得意",
    "短時間で集中するタイプ",
    "夜に作業する傾向",
  ].slice(0, 4);
}

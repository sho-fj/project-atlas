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

type ResultScreenProps = {
  result: Result;
  onDashboard: () => void;
  onNewConsultation: () => void;
};

type VerdictConfig = {
  label: string;
  title: string;
  icon: ReactNode;
  accent: string;
  text: string;
};

const verdictConfig: Record<Verdict, VerdictConfig> = {
  GO: {
    label: "GO",
    title: "実行推奨",
    icon: <CheckCircle2 className="h-8 w-8" />,
    accent: "from-emerald-500 to-teal-500",
    text: "text-emerald-500",
  },
  HOLD: {
    label: "HOLD",
    title: "条件調整",
    icon: <PauseCircle className="h-8 w-8" />,
    accent: "from-amber-500 to-orange-500",
    text: "text-amber-500",
  },
  STOP: {
    label: "STOP",
    title: "停止推奨",
    icon: <XCircle className="h-8 w-8" />,
    accent: "from-rose-500 to-red-500",
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

const fallbackDontDo = [
  "ロゴ調整",
  "長期開発",
  "新機能追加",
];

export default function ResultScreen({
  result,
  onDashboard,
  onNewConsultation,
}: ResultScreenProps) {
  const ui = verdictConfig[result.verdict];
  const missionItems = buildMissionItems(result);
  const decisionItems = buildDecisionItems(result);
  const riskyActions = (result.dontDo.length > 0 ? result.dontDo : fallbackDontDo).slice(0, 3);
  const judgmentNotes = buildJudgmentNotes(result);
  const hasSalesSimulation = Boolean(
    !isFallbackResult(result)
      && result.salesSimulation.price?.trim()
      && result.salesSimulation.requiredSales?.trim()
      && result.salesSimulation.targetProfit?.trim(),
  );
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
                {result.atlasOneLine && (
                  <p className="mt-3 max-w-2xl text-base font-bold leading-7 text-slate-500">
                    {result.atlasOneLine}
                  </p>
                )}
              </div>

              <div className="rounded-[28px] bg-[#182033] p-5 text-white shadow-[0_16px_42px_rgba(24,32,51,0.16)]">
                <p className="text-[12px] font-black uppercase tracking-[0.22em] text-white/45">
                  Next Action
                </p>
                <p className="mt-3 text-lg font-black leading-8">
                  {result.nextStep}
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
            <Panel eyebrow="Block 01" title="今日のMission" icon={<Clock3 className="h-5 w-5" />}>
              {missionItems.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5">
                  <p className="text-sm font-black text-slate-900">Missionを生成できませんでした。</p>
                </div>
              ) : (
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
              )}
            </Panel>

            <Panel eyebrow="Block 02" title="Decision Log" icon={<CheckCircle2 className="h-5 w-5" />}>
              <div className="rounded-[22px] border border-indigo-100 bg-indigo-50/70 p-4">
                <p className="text-sm font-black leading-7 text-slate-800">
                  Atlasは以下の理由で今回の判断を作成しました。
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
              {result.atlasComment && (
                <p className="mt-4 rounded-[18px] bg-[#182033] px-4 py-3 text-sm font-bold leading-7 text-white/75">
                  {result.atlasComment}
                </p>
              )}
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
            <Panel eyebrow="Block 03" title="Sales Simulation" icon={<BarChart3 className="h-5 w-5" />}>
              {hasSalesSimulation ? (
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
              ) : (
                <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5">
                  <p className="text-sm font-black text-slate-900">試算データを生成できませんでした。</p>
                </div>
              )}
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
            </div>
          </section>

          <section className="rounded-[28px] border border-indigo-100 bg-white p-5 shadow-[0_18px_54px_rgba(79,70,229,0.08)] sm:p-6">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.2em] text-indigo-500">
                今回の判断メモ
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-normal text-slate-950">
                この相談は、このブラウザの履歴に保存されます。
              </h2>
            </div>

            {judgmentNotes.length > 0 && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {judgmentNotes.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-[18px] bg-indigo-50/60 px-4 py-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                    <p className="text-sm font-black leading-6 text-slate-800">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[30px] border border-indigo-100 bg-white p-5 shadow-[0_18px_54px_rgba(79,70,229,0.08)] sm:p-6">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.2em] text-indigo-500">
                  NEXT STEP
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-normal text-slate-950">
                  次の一歩へ。
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm font-bold leading-7 text-slate-500">
                  {`今日の一歩を確認したら、\n次へ進みましょう。`}
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
                <button
                  type="button"
                  onClick={onNewConsultation}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-[16px] border border-slate-200 bg-white px-5 text-sm font-black text-slate-600 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                >
                  <RotateCcw className="h-4 w-4" />
                  別の相談を始める
                </button>
              </div>
            </div>
          </section>
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

function buildMissionItems(result: Result) {
  const source = result.todayMission.length > 0 ? result.todayMission : result.todayPlan;

  return source.slice(0, 4).map((item) =>
    item.replace(/^\d{2}:\d{2}〜\d{2}:\d{2}\s*/, "").trim(),
  ).filter(Boolean);
}

function buildDecisionItems(result: Result) {
  const source = result.decisionLog.length > 0
    ? result.decisionLog
    : result.reasons.length > 0
      ? result.reasons
      : fallbackDecisionLog;

  return source.slice(0, 5);
}

function isFallbackResult(result: Result) {
  const fallbackText = [
    result.atlasComment,
    result.atlasOneLine,
    result.nextStep,
  ].join(" ");

  return /\bAPI\b/i.test(fallbackText) && /fallback/i.test(fallbackText);
}

function buildJudgmentNotes(result: Result) {
  return [
    result.decisionLog[0],
    result.decisionLog[1],
    result.todayMission[0],
    result.atlasComment,
  ].filter((item): item is string => Boolean(item && item.trim())).slice(0, 4);
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, Cpu, Target } from "lucide-react";

type Verdict = "GO" | "HOLD" | "STOP";

type DecisionResult = {
  verdict: Verdict;
  conclusion: string;
  reasons: string[];
  decisionLog: string[];
};

type DecisionEngineCardProps = {
  result: DecisionResult;
  onComplete: () => void;
};

type Metric = {
  label: string;
  value: number;
};

const verdictTone: Record<Verdict, string> = {
  GO: "text-emerald-500",
  HOLD: "text-amber-500",
  STOP: "text-rose-500",
};

export default function DecisionEngineCard({
  result,
  onComplete,
}: DecisionEngineCardProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"analysis" | "progress" | "decision">("analysis");
  const metrics = useMemo(() => buildMetrics(result.verdict), [result.verdict]);
  const reason = buildReason(result);

  useEffect(() => {
    const phaseTimer = window.setTimeout(() => {
      setPhase("progress");
    }, 450);

    return () => window.clearTimeout(phaseTimer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((previous) => {
        if (previous >= 100) {
          window.clearInterval(timer);
          return 100;
        }

        return Math.min(previous + 8, 100);
      });
    }, 130);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress < 100) {
      return;
    }

    const decisionTimer = window.setTimeout(() => {
      setPhase("decision");
    }, 180);
    const completeTimer = window.setTimeout(() => {
      onComplete();
    }, 1250);

    return () => {
      window.clearTimeout(decisionTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete, progress]);

  return (
    <section className="mx-auto w-full max-w-5xl animate-in fade-in duration-200">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
        <div className="border-b border-indigo-50 bg-[#F4F6F8] px-5 py-4 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.22em] text-indigo-500">
                Atlas Decision Engine
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">
                判断プロセス
              </h1>
            </div>
            <span className="rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-black text-indigo-600">
              解析 → Progress → 判定
            </span>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_300px]">
          <div>
            <div className="rounded-[24px] bg-[#182033] p-5 text-white shadow-[0_16px_42px_rgba(24,32,51,0.14)] sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[12px] font-black uppercase tracking-[0.22em] text-white/45">
                    Current Phase
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {phase === "analysis" && "解析"}
                    {phase === "progress" && "Progress"}
                    {phase === "decision" && "判定"}
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/10 text-indigo-200 ring-1 ring-white/10">
                  <Cpu className="h-7 w-7" />
                </div>
              </div>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-cyan-300 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs font-black text-white/45">
                <span>Decision Progress</span>
                <span>{progress}%</span>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {metrics.map((metric) => (
                <DecisionMetric
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  visibleValue={Math.round((metric.value * progress) / 100)}
                />
              ))}
            </div>
          </div>

          <aside className="rounded-[24px] border border-indigo-100 bg-indigo-50/70 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white text-indigo-600 shadow-[0_10px_26px_rgba(79,70,229,0.12)]">
              <Target className="h-6 w-6" />
            </div>

            <p className="mt-5 text-[12px] font-black uppercase tracking-[0.22em] text-indigo-500">
              Atlasの判断
            </p>
            <p className={`mt-3 text-6xl font-black leading-none tracking-normal ${verdictTone[result.verdict]}`}>
              {result.verdict}
            </p>

            <div className="mt-6 rounded-[20px] border border-white bg-white/80 p-4">
              <div className="mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-500" />
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  理由
                </p>
              </div>
              <p className="whitespace-pre-line text-sm font-black leading-7 text-slate-800">
                {reason}
              </p>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-[18px] bg-white px-4 py-3 text-sm font-black text-slate-700">
              <CheckCircle2 className="h-5 w-5 text-indigo-600" />
              Resultへ接続します。
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function DecisionMetric({
  label,
  value,
  visibleValue,
}: {
  label: string;
  value: number;
  visibleValue: number;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-black text-slate-800">
          {label}
        </p>
        <p className="text-sm font-black text-slate-950">
          {visibleValue}%
        </p>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-200"
          style={{ width: `${Math.min(visibleValue, value)}%` }}
        />
      </div>
    </div>
  );
}

function buildMetrics(verdict: Verdict): Metric[] {
  const base = {
    GO: [82, 76, 88, 69, 86],
    HOLD: [62, 58, 64, 51, 58],
    STOP: [38, 34, 45, 29, 31],
  } satisfies Record<Verdict, number[]>;
  const [market, revenue, feasibility, advantage, expectation] = base[verdict];

  return [
    { label: "市場性", value: market },
    { label: "収益性", value: revenue },
    { label: "実現性", value: feasibility },
    { label: "競争優位", value: advantage },
    { label: "期待値", value: expectation },
  ];
}

function buildReason(result: DecisionResult) {
  const source = result.decisionLog.length > 0
    ? result.decisionLog
    : result.reasons.length > 0
      ? result.reasons
      : [result.conclusion];

  return source.slice(0, 3).join("\n");
}

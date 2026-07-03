"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Cpu, Database, Gauge, RadioTower } from "lucide-react";

type LoadingScreenProps = {
  isComplete?: boolean;
};

const analysisLogs = [
  "Atlas Core 起動",
  "Profile Memory 照合",
  "Revenue Engine 接続",
  "Market Scan 実行",
  "Pricing Analysis 実行",
  "Risk Filter 適用",
  "Mission Route 生成",
  "Decision Package 構築",
];

const waitingLogs = [
  "API応答を待機",
  "判断理由を圧縮",
  "Mission粒度を調整",
  "Result表示を準備",
];

const analysisSteps = [
  {
    label: "Profile",
    icon: <Database className="h-4 w-4" />,
  },
  {
    label: "Market",
    icon: <RadioTower className="h-4 w-4" />,
  },
  {
    label: "Pricing",
    icon: <Gauge className="h-4 w-4" />,
  },
  {
    label: "Mission",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
];

export default function LoadingScreen({ isComplete = false }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const [waitingIndex, setWaitingIndex] = useState(0);
  const displayedProgress = isComplete ? 100 : progress;

  const statusText = useMemo(() => {
    if (isComplete) {
      return "解析完了。Decision Engineへ接続します。";
    }

    if (progress >= 95) {
      return "解析継続。応答を待機しています。";
    }

    return "解析開始。Revenue Operating Systemを起動中。";
  }, [isComplete, progress]);

  useEffect(() => {
    let index = 0;

    const timer = window.setInterval(() => {
      if (index < analysisLogs.length) {
        setVisibleLogs((previous) => [...previous, analysisLogs[index]]);
        setProgress(Math.min(Math.round(((index + 1) / analysisLogs.length) * 95), 95));
        index += 1;
        return;
      }

      setProgress(95);
      window.clearInterval(timer);
    }, 320);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isComplete) {
      const completeTimer = window.setTimeout(() => {
        setVisibleLogs((previous) => {
          if (previous.includes("Analysis Complete")) {
            return previous;
          }

          return [...previous, "Analysis Complete", "Decision Engine Ready"];
        });
      }, 0);

      return () => window.clearTimeout(completeTimer);
    }

    const timer = window.setInterval(() => {
      setWaitingIndex((previous) => (previous + 1) % waitingLogs.length);
    }, 560);

    return () => window.clearInterval(timer);
  }, [isComplete]);

  return (
    <section className="mx-auto w-full max-w-4xl animate-in fade-in duration-500">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_54px_rgba(15,23,42,0.07)]">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
              <span className={`h-2 w-2 rounded-full ${isComplete ? "bg-emerald-500" : "animate-pulse bg-indigo-500"}`} />
              Atlas Analysis
            </div>

            <h1 className="mt-5 text-3xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl">
              戦略を生成中。
            </h1>
            <p className="mt-4 text-base font-bold leading-7 text-slate-500">
              Profile、制約、初収益までの距離を照合。停止していません。
            </p>

            <div className="mt-6 rounded-[22px] border border-slate-200 bg-[#F4F6F8] p-4">
              <div className="mb-2 flex items-center justify-between text-sm font-black text-slate-500">
                <span>{statusText}</span>
                <span>{displayedProgress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 ease-out"
                  style={{ width: `${displayedProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[26px] bg-slate-950 p-5 text-white shadow-[0_18px_54px_rgba(15,23,42,0.18)] sm:p-6">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="relative flex items-center justify-between gap-4">
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.22em] text-white/45">
                  Revenue Core
                </p>
                <p className="mt-2 text-xl font-black">処理を続行</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/10 text-indigo-200 ring-1 ring-white/10">
                <Cpu className="h-7 w-7" />
              </div>
            </div>

            <div className="relative mt-6 grid grid-cols-2 gap-3">
              {analysisSteps.map((step, index) => {
                const isActive = displayedProgress >= (index + 1) * 22;

                return (
                  <div
                    key={step.label}
                    className={`rounded-[18px] border px-3 py-3 transition duration-200 ${
                      isActive
                        ? "border-indigo-300/30 bg-indigo-400/15 text-white"
                        : "border-white/10 bg-white/5 text-white/45"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      {step.icon}
                      {isActive && <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
                    </div>
                    <p className="text-sm font-black">{step.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="relative mt-6 rounded-[20px] border border-white/10 bg-black/25 p-4 font-mono text-xs leading-6 text-indigo-100 sm:text-sm">
              {visibleLogs.slice(-7).map((log, index) => (
                <div key={`${log}-${index}`} className="flex gap-2">
                  <span className="text-emerald-300">OK</span>
                  <span>{log}</span>
                </div>
              ))}

              {!isComplete && (
                <div className="mt-1 flex gap-2 text-indigo-200">
                  <span className="animate-pulse">...</span>
                  <span>{waitingLogs[waitingIndex]}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

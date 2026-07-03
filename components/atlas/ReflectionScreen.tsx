"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, RotateCcw, Sparkles } from "lucide-react";

import type { InterviewAnswer } from "@/lib/atlas/interview";

type ReflectionScreenProps = {
  answers: InterviewAnswer[];
  onConfirm: () => void;
  onRevise: () => void;
  onDashboard: () => void;
  onNewConsultation: () => void;
};

type CorrectionKey = "value" | "time" | "sales" | "goal";

const correctionOptions: Array<{
  key: CorrectionKey;
  label: string;
  description: string;
}> = [
  {
    key: "value",
    label: "優先順位が少し違う",
    description: "価値観や避けたい未来の解釈を弱めます。",
  },
  {
    key: "time",
    label: "使える時間が少し違う",
    description: "短時間前提でMissionを組みます。",
  },
  {
    key: "sales",
    label: "苦手な販売手段が違う",
    description: "販売接触の方法を保守的にします。",
  },
  {
    key: "goal",
    label: "目標の強さが少し違う",
    description: "収益目標より継続性を重く見ます。",
  },
];

const insightRules = [
  {
    ids: ["priority", "rePriority"],
    fallback: "優先順位を確認中",
    build: (answer: string) => `${answer}を重視している可能性があります`,
  },
  {
    ids: ["revenueTarget", "reMoney"],
    fallback: "90日以内の収益目標を確認中",
    build: (answer: string) => `${answer}を一つの到達基準に置いています`,
  },
  {
    ids: ["weekdayTime", "reTime"],
    fallback: "平日の稼働時間を確認中",
    build: (answer: string) => `平日の実行時間は${answer}前提です`,
  },
  {
    ids: ["salesBlocker", "reSales"],
    fallback: "販売上の制約を確認中",
    build: (answer: string) => `${answer}は避けたい傾向があります`,
  },
  {
    ids: ["aiExperience"],
    fallback: "AI活用の前提を確認中",
    build: (answer: string) => `AIへの抵抗は${answer}として扱います`,
  },
  {
    ids: ["continuity"],
    fallback: "継続条件を確認中",
    build: (answer: string) => `継続条件は${answer}に近いです`,
  },
];

export default function ReflectionScreen({
  answers,
  onConfirm,
  onRevise,
  onDashboard,
  onNewConsultation,
}: ReflectionScreenProps) {
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [selectedCorrection, setSelectedCorrection] = useState<CorrectionKey>("value");
  const insightSummary = useMemo(() => buildInsightSummary(answers), [answers]);
  const selectedCorrectionItem = correctionOptions.find((item) => item.key === selectedCorrection);

  return (
    <section className="mx-auto w-full max-w-4xl animate-in fade-in duration-200">
      <div className="mb-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onDashboard}
          className="inline-flex items-center rounded-[14px] border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100"
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

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
        <div className="border-b border-indigo-50 bg-gradient-to-r from-indigo-50 via-white to-violet-50 px-5 py-4 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.22em] text-indigo-500">
                Atlas Insight
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">
                Atlasの分析
              </h1>
            </div>
            <span className="rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-black text-indigo-600">
              現在の分析結果
            </span>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_0.78fr]">
          <div>
            <div className="rounded-[24px] bg-[#182033] p-5 text-white shadow-[0_16px_42px_rgba(24,32,51,0.14)] sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-white/10 text-indigo-200">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[12px] font-black uppercase tracking-[0.22em] text-white/45">
                    入力受信
                  </p>
                  <p className="mt-1 text-lg font-black">ユーザー像を推定</p>
                </div>
              </div>

              <p className="mt-5 text-2xl font-black leading-10">
                現時点では、以下の傾向があると分析しています。
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              {insightSummary.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="flex items-start gap-3 rounded-[20px] border border-slate-100 bg-white px-4 py-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">
                    {index + 1}
                  </span>
                  <p className="text-base font-black leading-7 text-slate-800">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[24px] border border-indigo-100 bg-indigo-50/70 p-5">
            {!isCorrectionOpen ? (
              <>
                <p className="text-[12px] font-black uppercase tracking-[0.22em] text-indigo-500">
                  Confirm
                </p>
                <h2 className="mt-3 text-2xl font-black leading-9 text-slate-950">
                  この分析は合っていますか？
                </h2>
                <p className="mt-3 text-sm font-bold leading-7 text-slate-500">
                  断定ではありません。Profile生成前の確認です。
                </p>

                <div className="mt-6 grid gap-3">
                  <button
                    type="button"
                    onClick={onConfirm}
                    className="flex min-h-14 items-center justify-center gap-2 rounded-[18px] bg-[#182033] px-5 text-base font-black text-white shadow-[0_16px_34px_rgba(24,32,51,0.16)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    はい
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCorrectionOpen(true)}
                    className="flex min-h-14 items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-white px-5 text-base font-black text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  >
                    <RotateCcw className="h-5 w-5" />
                    少し違う
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-[12px] font-black uppercase tracking-[0.22em] text-indigo-500">
                  Correction
                </p>
                <h2 className="mt-3 text-2xl font-black leading-9 text-slate-950">
                  違いに近い項目を選択してください。
                </h2>
                <p className="mt-3 text-sm font-bold leading-7 text-slate-500">
                  自由入力は不要です。選択内容をProfile生成時の前提にします。
                </p>

                <div className="mt-5 grid gap-2.5">
                  {correctionOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setSelectedCorrection(option.key)}
                      className={`rounded-[18px] border px-4 py-3 text-left transition duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 ${
                        selectedCorrection === option.key
                          ? "border-indigo-300 bg-white text-slate-950 shadow-[0_10px_28px_rgba(79,70,229,0.08)]"
                          : "border-slate-200 bg-white/70 text-slate-600 hover:bg-white"
                      }`}
                    >
                      <span className="block text-sm font-black">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-5 rounded-[18px] bg-white px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    修正反映
                  </p>
                  <p className="mt-2 text-sm font-black leading-7 text-slate-800">
                    {selectedCorrectionItem?.description}
                  </p>
                </div>

                <div className="mt-5 grid gap-3">
                  <button
                    type="button"
                    onClick={onConfirm}
                    className="flex min-h-14 items-center justify-center gap-2 rounded-[18px] bg-[#182033] px-5 text-base font-black text-white shadow-[0_16px_34px_rgba(24,32,51,0.16)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    この修正でProfile生成
                  </button>
                  <button
                    type="button"
                    onClick={onRevise}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-[16px] border border-slate-200 bg-white px-5 text-sm font-black text-slate-600 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  >
                    回答を戻して修正
                  </button>
                </div>
              </>
            )}

            <div className="mt-6 rounded-[20px] border border-white bg-white/80 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Next
              </p>
              <p className="mt-2 text-sm font-black leading-7 text-slate-800">
                確認後、Profile生成へ進みます。
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function buildInsightSummary(answers: InterviewAnswer[]) {
  const summary = insightRules
    .map((rule) => {
      const match = answers.find((answer) => rule.ids.includes(answer.questionId));

      if (!match) {
        return null;
      }

      return match.answer ? rule.build(match.answer) : rule.fallback;
    })
    .filter((item): item is string => Boolean(item));

  if (summary.length >= 3) {
    return summary.slice(0, 5);
  }

  return [
    ...summary,
    "短時間で成果が出るMissionを優先する傾向があります",
    "販売前の作り込みは抑えた方がよい状態です",
    "90日以内の初収益を優先する設計が合っています",
  ].slice(0, 5);
}

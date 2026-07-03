"use client";

import type { InterviewAnswer, InterviewQuestion } from "@/lib/atlas/interview";

type InterviewScreenProps = {
  questions: InterviewQuestion[];
  currentIndex: number;
  answers: InterviewAnswer[];
  plannedQuestionCount: number;
  onSelect: (answer: string) => void;
};

export default function InterviewScreen({
  questions,
  currentIndex,
  answers,
  plannedQuestionCount,
  onSelect,
}: InterviewScreenProps) {
  const currentQuestion = questions[currentIndex];
  const displayTotal = Math.max(plannedQuestionCount, questions.length, currentIndex + 1);
  const progress = Math.min(Math.round(((currentIndex + 1) / displayTotal) * 100), 100);

  if (!currentQuestion) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-4xl animate-in fade-in duration-200">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-100 bg-[#F4F6F8] px-5 py-4 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.22em] text-indigo-500">
                Atlas Interview
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">
                条件を確認します。
              </h1>
            </div>
            <div className="min-w-[180px]">
              <div className="mb-2 flex justify-between text-xs font-black text-slate-400">
                <span>{String(currentIndex + 1).padStart(2, "0")} / {displayTotal}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="rounded-[24px] border border-indigo-100 bg-indigo-50/60 p-5 sm:p-6">
            <p className="text-sm font-black text-indigo-500">
              Atlas / {currentQuestion.category}
            </p>
            <p className="mt-3 text-2xl font-black leading-9 text-slate-950 sm:text-3xl sm:leading-10">
              {currentQuestion.label}
            </p>
            <p className="mt-3 text-sm font-bold leading-6 text-slate-500">
              近い条件を選択。Atlasが次の仮説を更新します。
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {currentQuestion.options.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => onSelect(option.label)}
                className="min-h-24 rounded-[20px] border border-slate-200 bg-white px-5 py-4 text-left shadow-[0_10px_28px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/60 hover:shadow-[0_14px_30px_rgba(79,70,229,0.08)] focus:outline-none focus:ring-4 focus:ring-indigo-100 sm:min-h-28"
              >
                <span className="flex flex-col gap-2">
                  <span className="text-base font-black leading-6 text-slate-950">
                    {option.label}
                  </span>
                  <span className="text-sm font-semibold leading-6 text-slate-500">
                    {option.description}
                  </span>
                </span>
              </button>
            ))}
          </div>

          {answers.length > 0 && (
            <div className="mt-6 rounded-[22px] bg-[#182033] p-4 text-white sm:p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
                入力受信
              </p>
              <div className="mt-3 flex max-h-24 flex-wrap gap-2 overflow-hidden">
                {answers.map((answer) => (
                  <span
                    key={`${answer.questionId}-${answer.answer}`}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white"
                  >
                    {answer.answer}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

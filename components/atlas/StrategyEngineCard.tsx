"use client";

import { Brain, Sparkles } from "lucide-react";

import { renderStars, type StrategyState } from "@/lib/atlas/strategy";

type StrategyEngineCardProps = {
  strategy: StrategyState;
};

export default function StrategyEngineCard({ strategy }: StrategyEngineCardProps) {
  return (
    <section
      key={`${strategy.phase}-${strategy.recommendation}`}
      className="atlas-console animate-in fade-in p-6 duration-200 sm:p-7"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/45">
            Today&apos;s Strategy
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-normal">
            {strategy.mode}
          </h2>
          <p className="mt-2 text-xl font-black text-white/60">
            {strategy.phase}
          </p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-white text-atlas-primary">
          <Brain className="h-6 w-6" />
        </div>
      </div>

      <div className="rounded-[28px] bg-white/10 p-5 ring-1 ring-white/10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
          理由
        </p>
        <p className="mt-3 text-base font-bold leading-8 text-white/85">
          {strategy.reason}
        </p>
      </div>

      <div className="mt-5 rounded-[28px] bg-white p-5 text-atlas-primary">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="atlas-caption">
            Priority
          </p>
          <Sparkles className="h-5 w-5 text-atlas-accent" />
        </div>
        <div className="grid gap-3">
          {strategy.priorities.map((priority) => (
            <div key={priority.label} className="flex items-center justify-between gap-4">
              <p className="text-sm font-black text-atlas-primary">
                {priority.label}
              </p>
              <p className="text-sm tracking-[0.16em] text-atlas-accent">
                {renderStars(priority.score)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-[28px] border border-white/10 bg-black/25 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
          Atlas Recommendation
        </p>
        <p className="mt-3 whitespace-pre-line text-2xl font-black leading-10">
          {strategy.recommendation}
        </p>
      </div>
    </section>
  );
}

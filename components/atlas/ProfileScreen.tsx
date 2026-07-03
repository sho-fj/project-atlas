"use client";

import { ArrowRight, Brain, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

type ProfileScreenProps = {
  onGenerate?: () => void;
};

type ValueMapItem = {
  label: string;
  score: number;
};

const valueMap: ValueMapItem[] = [
  { label: "家族", score: 5 },
  { label: "健康", score: 3 },
  { label: "自由", score: 4 },
  { label: "収益", score: 5 },
  { label: "挑戦", score: 3 },
];

const strength = ["分析力", "継続力", "改善力"];
const weakness = ["営業", "価格設定", "SNS発信"];
const recommendedStrategy = ["AI受託", "テンプレート販売", "AI自動化"];

export default function ProfileScreen({ onGenerate }: ProfileScreenProps) {
  return (
    <section className="mx-auto w-full max-w-6xl animate-in fade-in duration-500">
      <div className="space-y-6">
        <div className="atlas-card overflow-hidden">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
            <div>
              <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-atlas-primary text-white">
                <Brain className="h-8 w-8" />
              </div>

              <p className="atlas-caption mt-6">
                Atlas Profile
              </p>
              <h1 className="mt-3 text-5xl font-black tracking-normal text-atlas-primary sm:text-6xl">
                Builder
              </h1>
              <p className="atlas-body mt-5 max-w-xl">
                面談データを受信。Atlasは現在地・価値観・制約を理解し、90日以内の初収益に向けて戦略化する。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <MetricCard label="Profile Accuracy" value="72%" />
              <MetricCard label="Version" value="v1.0" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <Panel title="Value Map" icon={<ShieldCheck className="h-5 w-5" />}>
            <div className="space-y-5">
              {valueMap.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="text-base font-black text-atlas-primary">
                      {item.label}
                    </p>
                    <p className="shrink-0 text-sm tracking-[0.18em] text-atlas-accent">
                      {"★".repeat(item.score)}
                      <span className="text-atlas-border">
                        {"★".repeat(5 - item.score)}
                      </span>
                    </p>
                  </div>
                  <div className="atlas-progress-track">
                    <div
                      className="atlas-progress-fill"
                      style={{ width: `${item.score * 20}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
            <Panel title="Strength" icon={<CheckCircle2 className="h-5 w-5" />}>
              <TagGrid items={strength} tone="bg-atlas-primary text-white" />
            </Panel>

            <Panel title="Weakness" icon={<ShieldCheck className="h-5 w-5" />}>
              <TagGrid items={weakness} tone="bg-atlas-muted text-atlas-text-muted" />
            </Panel>
          </div>
        </div>

        <Panel title="Recommended Strategy" icon={<Sparkles className="h-5 w-5" />}>
          <div className="grid gap-3 md:grid-cols-3">
            {recommendedStrategy.map((item, index) => (
              <div
                key={item}
                className="atlas-surface p-5"
              >
                <p className="atlas-caption">
                  Strategy {index + 1}
                </p>
                <p className="mt-3 text-xl font-black tracking-normal text-atlas-primary">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel title="Atlas Comment" icon={<Brain className="h-5 w-5" />}>
            <p className="whitespace-pre-line text-xl font-black leading-10 text-atlas-primary">
              {`あなたは完成させる力があります。\n\nしかし販売を後回しにする傾向があります。\n\n今回の戦略では販売を最優先に設定します。`}
            </p>
          </Panel>

          <div className="atlas-console p-6 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
              Profile Accuracy
            </p>
            <p className="mt-4 text-6xl font-black tracking-normal">
              72%
            </p>
            <p className="mt-5 whitespace-pre-line text-base font-semibold leading-8 text-white/65">
              {`Atlasは現在、\nあなたを72%理解しています。\n\n相談やMission完了により\n精度は向上します。`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onGenerate}
          className="atlas-button-primary min-h-16 w-full"
        >
          このProfileで戦略を生成
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="atlas-surface p-6">
      <p className="atlas-caption">
        {label}
      </p>
      <p className="mt-3 text-4xl font-black tracking-normal text-atlas-primary">
        {value}
      </p>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="atlas-card p-6 sm:p-7">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-black tracking-normal text-atlas-primary">
          {title}
        </h2>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-atlas-border bg-atlas-muted text-atlas-text-muted">
          {icon}
        </div>
      </div>
      {children}
    </div>
  );
}

function TagGrid({ items, tone }: { items: string[]; tone: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
      {items.map((item) => (
        <div
          key={item}
          className={`rounded-[18px] px-4 py-4 text-center text-sm font-black ${tone}`}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

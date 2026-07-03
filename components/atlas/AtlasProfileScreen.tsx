"use client";

import { ArrowRight, BadgeCheck, Brain, RotateCcw, ShieldCheck } from "lucide-react";

import type { AtlasProfile } from "@/lib/atlas/interview";

type AtlasProfileScreenProps = {
  profile: AtlasProfile;
  onGenerate: () => void;
  onRestartInterview: () => void;
};

const valueLabels: Array<{
  key: keyof AtlasProfile["valueMap"];
  label: string;
}> = [
  { key: "family", label: "家族" },
  { key: "health", label: "健康" },
  { key: "freedom", label: "自由" },
  { key: "revenue", label: "収益" },
  { key: "challenge", label: "挑戦" },
];

export default function AtlasProfileScreen({
  profile,
  onGenerate,
  onRestartInterview,
}: AtlasProfileScreenProps) {
  return (
    <section className="mx-auto w-full max-w-5xl animate-in fade-in duration-500">
      <div className="space-y-5 sm:space-y-6">
        <div className="atlas-card overflow-hidden">
          <div className="h-1 bg-atlas-accent" />
          <div className="grid gap-7 p-5 sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-atlas-primary text-white">
                <Brain className="h-7 w-7" />
              </div>
              <p className="atlas-caption mt-6">
                Atlas Profile Generated
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-normal text-atlas-primary sm:text-5xl">
                {profile.profileType}
              </h1>
              <p className="atlas-body mt-4 max-w-md">
                解析完了。90日以内を優先し、次の戦略へ接続します。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard label="Profile Accuracy" value={`${profile.accuracy}%`} />
              <InfoCard label="Profile Version" value={profile.version} />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Panel title="Value Map" icon={<ShieldCheck className="h-5 w-5" />}>
            <div className="space-y-4">
              {valueLabels.map((item) => (
                <div key={item.key}>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-black text-atlas-primary">
                      {item.label}
                    </p>
                    <p className="text-sm tracking-[0.18em] text-atlas-accent">
                      {"★".repeat(profile.valueMap[item.key])}
                      <span className="text-atlas-border">
                        {"★".repeat(5 - profile.valueMap[item.key])}
                      </span>
                    </p>
                  </div>
                  <div className="atlas-progress-track">
                    <div
                      className="atlas-progress-fill"
                      style={{ width: `${profile.valueMap[item.key] * 20}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid gap-6">
            <Panel title="Strength" icon={<BadgeCheck className="h-5 w-5" />}>
              <List items={profile.strength} tone="bg-atlas-accent/10 text-atlas-primary" />
            </Panel>

            <Panel title="Weakness" icon={<ShieldCheck className="h-5 w-5" />}>
              <List items={profile.weakness} tone="bg-atlas-muted text-atlas-text-muted" />
            </Panel>
          </div>
        </div>

        <Panel title="Recommended Strategy" icon={<ArrowRight className="h-5 w-5" />}>
          <div className="grid gap-3 md:grid-cols-3">
            {profile.recommendedStrategy.map((item, index) => (
              <div
                key={item}
                className="atlas-surface p-4 sm:p-5"
              >
                <p className="atlas-caption">
                  Strategy {index + 1}
                </p>
                <p className="mt-3 text-sm font-black leading-7 text-atlas-primary sm:text-base">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <button
            type="button"
            onClick={onGenerate}
            className="atlas-button-primary min-h-16"
          >
            このProfileで戦略を生成
            <ArrowRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onRestartInterview}
            className="atlas-button-secondary min-h-16"
          >
            <RotateCcw className="h-5 w-5" />
            再面談する
          </button>
        </div>
      </div>
    </section>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="atlas-surface p-5 sm:p-6">
      <p className="atlas-caption">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-normal text-atlas-primary">
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
    <div className="atlas-card p-5 sm:p-7">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-xl font-black tracking-normal text-atlas-primary sm:text-2xl">
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

function List({ items, tone }: { items: string[]; tone: string }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item} className={`rounded-[18px] px-4 py-4 text-sm font-black ${tone}`}>
          {item}
        </div>
      ))}
    </div>
  );
}

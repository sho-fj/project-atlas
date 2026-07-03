"use client";

import { Activity, Flag } from "lucide-react";

import { founderPhases, type FounderTimelineState } from "@/lib/atlas/timeline";

type FounderTimelineProps = {
  timeline: FounderTimelineState;
};

export default function FounderTimeline({ timeline }: FounderTimelineProps) {
  return (
    <section className="atlas-card p-6 sm:p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="atlas-caption">
            90-Day Founder Timeline
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-normal text-atlas-primary">
            {timeline.activePhase.name} / {timeline.activePhase.label}
          </h2>
          <p className="mt-2 text-sm font-bold text-atlas-text-muted">
            Day {timeline.currentDay} / 90
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-atlas-primary text-white">
          <Flag className="h-6 w-6" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {founderPhases.map((phase) => {
          const isActive = phase.id === timeline.activePhase.id;
          const isDone = phase.id < timeline.activePhase.id;
          const progress = isDone ? 100 : isActive ? timeline.phaseProgress : 0;

          return (
            <div
              key={phase.id}
              className={`rounded-[28px] p-5 ring-1 transition duration-200 ${
                isActive
                  ? "bg-atlas-primary text-white ring-atlas-primary"
                  : "bg-atlas-muted text-atlas-primary ring-atlas-border"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-[0.18em] ${isActive ? "text-white/45" : "text-atlas-text-muted"}`}>
                    {phase.name}
                  </p>
                  <h3 className="mt-2 text-2xl font-black tracking-normal">
                    {phase.label}
                  </h3>
                  <p className={`mt-1 text-sm font-bold ${isActive ? "text-white/55" : "text-atlas-text-muted"}`}>
                    {phase.days}
                  </p>
                </div>
                {isActive && <Activity className="h-5 w-5 text-white" />}
              </div>

              <div className="mt-5 space-y-4">
                <TimelineField label="目的" value={phase.purpose} active={isActive} />
                <TimelineField label="Status" value={isDone ? "Complete" : isActive ? "Active" : "Pending"} active={isActive} />
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className={`text-xs font-bold uppercase tracking-[0.16em] ${isActive ? "text-white/45" : "text-atlas-text-muted"}`}>
                      Progress
                    </p>
                    <p className="text-sm font-black">
                      {progress}%
                    </p>
                  </div>
                  <div className={`h-2 overflow-hidden rounded-full ${isActive ? "bg-white/20" : "bg-atlas-border"}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${isActive ? "bg-atlas-accent" : "bg-atlas-accent"}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="atlas-surface mt-6 p-5">
        <p className="atlas-caption">
          Atlas Comment
        </p>
        <p className="mt-4 whitespace-pre-line text-xl font-black leading-9 text-atlas-primary">
          {timeline.comment}
        </p>
      </div>
    </section>
  );
}

function TimelineField({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div>
      <p className={`text-xs font-bold uppercase tracking-[0.16em] ${active ? "text-white/45" : "text-atlas-text-muted"}`}>
        {label}:
      </p>
      <p className={`mt-1 text-sm font-bold leading-6 ${active ? "text-white/85" : "text-atlas-primary"}`}>
        {value}
      </p>
    </div>
  );
}

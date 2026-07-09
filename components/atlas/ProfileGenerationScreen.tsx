"use client";

import { useEffect, useMemo, useState } from "react";

const generationLogs = [
  "Generating Atlas Profile...",
  "Analyzing Values...",
  "Analyzing Strength...",
  "Estimating Strategy...",
  "Finalizing Profile...",
  "Profile Generated",
];

export default function ProfileGenerationScreen() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStep((current) => Math.min(current + 1, generationLogs.length - 1));
    }, 220);

    return () => window.clearInterval(timer);
  }, []);

  const progress = useMemo(
    () => Math.round(((step + 1) / generationLogs.length) * 100),
    [step],
  );

  const blocks = Array.from({ length: 10 }, (_, index) => index < Math.round(progress / 10));

  return (
    <section className="mx-auto flex min-h-[480px] w-full max-w-3xl animate-in fade-in duration-500 items-center justify-center">
      <div className="atlas-card w-full overflow-hidden">
        <div className="border-b border-atlas-border p-5 sm:p-7">
          <p className="atlas-caption">
            Profile Generation
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-normal text-atlas-primary sm:text-4xl">
            Atlas Profile
          </h1>
        </div>

        <div className="atlas-console m-5 p-5 font-mono text-sm text-white sm:m-7 sm:p-6 sm:text-base">
          <div className="mb-5 tracking-[0.24em] text-white/50">
            {blocks.map((filled, index) => (
              <span key={index} className={filled ? "text-white" : "text-white/20"}>
                □
              </span>
            ))}
          </div>

          <div className="space-y-3">
            {generationLogs.slice(0, step + 1).map((log) => (
              <div key={log} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-atlas-accent" />
                <span>{log}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-atlas-accent transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

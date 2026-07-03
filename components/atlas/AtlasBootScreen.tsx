"use client";

const bootLogs = [
  "Initializing Atlas...",
  "Loading Revenue Engine...",
  "Creating Session...",
  "Preparing Interview...",
  "READY",
];

export default function AtlasBootScreen() {
  return (
    <section className="mx-auto flex min-h-[480px] w-full max-w-3xl animate-in fade-in duration-500 items-center justify-center">
      <div className="atlas-console w-full overflow-hidden p-5 sm:p-8">
        <div className="mb-7 flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/40">
              Atlas Boot Screen
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-normal sm:text-4xl">
              Revenue OS
            </h1>
          </div>
          <div className="h-3 w-3 animate-pulse rounded-full bg-atlas-accent" />
        </div>

        <div className="space-y-3 font-mono text-sm sm:text-base">
          {bootLogs.map((log, index) => (
            <div
              key={log}
              className="flex items-center gap-3 text-white/80"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-atlas-accent" />
              <span>{log}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-full animate-pulse rounded-full bg-atlas-accent" />
        </div>
      </div>
    </section>
  );
}

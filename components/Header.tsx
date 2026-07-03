type HeaderProps = {
  profileAccuracy?: number;
  missionDone?: number;
  missionTotal?: number;
};

export default function Header({
  profileAccuracy = 0,
  missionDone = 0,
  missionTotal = 0,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-atlas-border bg-atlas-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div>
          <h1 className="text-2xl font-black tracking-normal text-atlas-primary">ATLAS</h1>
          <p className="mt-1 text-[13px] font-bold text-atlas-text-muted">Revenue Operating System</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="atlas-badge">
            Profile Accuracy {profileAccuracy}%
          </div>
          <div className="atlas-badge">
            Mission {missionDone}/{missionTotal}
          </div>
        </div>
      </div>
    </header>
  );
}

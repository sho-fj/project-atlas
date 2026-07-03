type ProgressBarProps = {
  currentStep: number;
  totalSteps: number;
};

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between text-sm text-atlas-text-muted">
        <span>進捗</span>
        <span className="font-bold text-atlas-primary">
          {currentStep + 1}/{totalSteps}
        </span>
      </div>
      <div className="atlas-progress-track relative">
        <div
          className="atlas-progress-fill absolute inset-y-0 left-0"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

import { Check } from "lucide-react";

type OptionButtonProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
};

export default function OptionButton({ label, selected, onClick }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group border p-4 text-left transition-all duration-200 ${
        selected
          ? "border-atlas-accent bg-atlas-accent/10 text-atlas-primary"
          : "border-atlas-border bg-white text-atlas-primary hover:-translate-y-0.5 hover:border-atlas-accent/40 hover:bg-atlas-muted"
      }`}
      style={{ borderRadius: "var(--atlas-radius-button)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border transition ${
            selected ? "border-atlas-accent bg-atlas-accent text-white" : "border-atlas-border bg-transparent"
          }`}
        >
          {selected ? <Check className="h-3.5 w-3.5" /> : null}
        </div>
        <div className="text-sm leading-6">{label}</div>
      </div>
    </button>
  );
}

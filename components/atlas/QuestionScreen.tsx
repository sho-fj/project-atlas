import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import OptionButton from "@/components/atlas/OptionButton";
import ProgressBar from "@/components/atlas/ProgressBar";

type QuestionScreenProps = {
  question: {
    title: string;
    description: string;
    options?: readonly string[];
    comment: string;
  };
  currentStep: number;
  totalSteps: number;
  answer: string;
  onSelect: (value: string) => void;
  onBack: () => void;
  onDraftChange: (value: string) => void;
  onNext: () => void;
  onSubmit: () => void;
  isLast: boolean;
  draft: string;
  canContinue: boolean;
};

export default function QuestionScreen({
  question,
  currentStep,
  totalSteps,
  answer,
  onSelect,
  onBack,
  onDraftChange,
  onSubmit,
  onNext,
  isLast,
  draft,
  canContinue,
}: QuestionScreenProps) {
  return (
    <section className="mx-auto w-full max-w-3xl">
      <div className="mb-8 flex items-center justify-between text-sm text-atlas-text-muted">
        <button
          type="button"
          onClick={onBack}
          className="atlas-button-secondary min-h-10 px-3 py-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </button>
      </div>

      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

      <div className="atlas-card mt-8 p-8 sm:p-10">
        <p className="atlas-caption">
          Step {currentStep + 1}
        </p>
        <h2 className="mt-3 text-2xl font-black text-atlas-primary sm:text-3xl">
          {question.title}
        </h2>
        <p className="atlas-body mt-2">{question.description}</p>

        <div className="atlas-surface mt-6 p-4">
          <p className="text-sm font-bold text-atlas-text-muted">Atlasからの一言</p>
          <p className="mt-2 text-sm font-semibold leading-7 text-atlas-primary">{question.comment}</p>
        </div>

        {isLast ? (
          <div className="mt-8 space-y-4">
            <textarea
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              placeholder="例：1人向けのAI顧問サービス"
              className="min-h-32 w-full border border-atlas-border bg-atlas-muted px-4 py-3 text-base text-atlas-primary outline-none transition duration-200 focus:border-atlas-accent focus:bg-white"
              style={{ borderRadius: "var(--atlas-radius-input)" }}
            />
            <Button
              onClick={onSubmit}
              disabled={!draft.trim()}
              className="atlas-button-secondary w-full py-6"
            >
              結果を見る
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {question.options?.map((option) => (
                <OptionButton
                  key={option}
                  label={option}
                  selected={answer === option}
                  onClick={() => onSelect(option)}
                />
              ))}
            </div>

            <Button
              onClick={onNext}
              disabled={!canContinue}
              className="atlas-button-secondary w-full py-6"
            >
              次へ
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

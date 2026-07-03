export type StrategyPriority = {
  label: string;
  score: number;
};

export type StrategyState = {
  mode: string;
  phase: string;
  reason: string;
  recommendation: string;
  priorities: StrategyPriority[];
};

const marketResearchStrategy: StrategyState = {
  mode: "Execution Mode",
  phase: "Market Research",
  reason: "Mission達成率が低いため、販売前に市場の前提を固定します。",
  recommendation: "今日は販売より市場調査を優先してください。",
  priorities: [
    { label: "販売", score: 2 },
    { label: "価格", score: 2 },
    { label: "SNS", score: 2 },
    { label: "改善", score: 1 },
  ],
};

const pricingStrategy: StrategyState = {
  mode: "Execution Mode",
  phase: "Pricing",
  reason: "市場調査が進行したため、価格の仮説を固定します。",
  recommendation: "今日はLPより価格比較を優先してください。",
  priorities: [
    { label: "販売", score: 3 },
    { label: "価格", score: 5 },
    { label: "SNS", score: 2 },
    { label: "改善", score: 2 },
  ],
};

const validationStrategy: StrategyState = {
  mode: "Execution Mode",
  phase: "Validation",
  reason: "競合調査が完了したため販売検証へ移行します。",
  recommendation: "今日はLPより販売を優先してください。",
  priorities: [
    { label: "販売", score: 5 },
    { label: "価格", score: 4 },
    { label: "SNS", score: 3 },
    { label: "改善", score: 2 },
  ],
};

const improvementStrategy: StrategyState = {
  mode: "Execution Mode",
  phase: "Improvement",
  reason: "販売検証が進んだため、反応のある導線を改善します。",
  recommendation: "今日は新規施策より改善を優先してください。",
  priorities: [
    { label: "販売", score: 4 },
    { label: "価格", score: 3 },
    { label: "SNS", score: 2 },
    { label: "改善", score: 5 },
  ],
};

export function resolveStrategy(completionRate: number): StrategyState {
  if (completionRate >= 90) {
    return improvementStrategy;
  }

  if (completionRate >= 70) {
    return validationStrategy;
  }

  if (completionRate >= 50) {
    return pricingStrategy;
  }

  return marketResearchStrategy;
}

export function renderStars(score: number) {
  return `${"★".repeat(score)}${"☆".repeat(5 - score)}`;
}

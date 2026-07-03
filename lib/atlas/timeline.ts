export type FounderPhase = {
  id: number;
  name: string;
  label: string;
  days: string;
  startDay: number;
  endDay: number;
  purpose: string;
};

export type FounderTimelineState = {
  currentDay: number;
  activePhase: FounderPhase;
  phaseProgress: number;
  comment: string;
};

export const founderPhases: FounderPhase[] = [
  {
    id: 1,
    name: "Phase 1",
    label: "Validate",
    days: "Day 1 - 14",
    startDay: 1,
    endDay: 14,
    purpose: "売れる可能性を確認する",
  },
  {
    id: 2,
    name: "Phase 2",
    label: "Sell",
    days: "Day 15 - 45",
    startDay: 15,
    endDay: 45,
    purpose: "初回販売を成立させる",
  },
  {
    id: 3,
    name: "Phase 3",
    label: "Repeat",
    days: "Day 46 - 75",
    startDay: 46,
    endDay: 75,
    purpose: "再現できる販売手順を作る",
  },
  {
    id: 4,
    name: "Phase 4",
    label: "Scale",
    days: "Day 76 - 90",
    startDay: 76,
    endDay: 90,
    purpose: "収益導線を拡張する",
  },
];

export function resolveFounderTimeline(startDate: string | null, missionCompletionRate: number): FounderTimelineState {
  const dayFromDate = resolveCurrentDay(startDate);
  const dayFromMission = missionCompletionRate >= 90 ? 76 : missionCompletionRate >= 70 ? 46 : missionCompletionRate >= 50 ? 15 : 1;
  const currentDay = Math.max(dayFromDate, dayFromMission);
  const activePhase = founderPhases.find((phase) => currentDay >= phase.startDay && currentDay <= phase.endDay) ?? founderPhases[3];
  const phaseLength = activePhase.endDay - activePhase.startDay + 1;
  const elapsedInPhase = Math.min(Math.max(currentDay - activePhase.startDay + 1, 1), phaseLength);
  const dateProgress = Math.round((elapsedInPhase / phaseLength) * 100);
  const phaseProgress = Math.max(dateProgress, resolveMissionProgressFloor(activePhase.id, missionCompletionRate));

  return {
    currentDay,
    activePhase,
    phaseProgress: Math.min(phaseProgress, 100),
    comment: buildComment(activePhase.label),
  };
}

function resolveCurrentDay(startDate: string | null) {
  if (!startDate) {
    return 1;
  }

  const start = new Date(startDate);

  if (Number.isNaN(start.getTime())) {
    return 1;
  }

  const now = new Date();
  const diff = now.getTime() - start.getTime();
  const day = Math.floor(diff / 86_400_000) + 1;

  return Math.min(Math.max(day, 1), 90);
}

function resolveMissionProgressFloor(phaseId: number, missionCompletionRate: number) {
  if (phaseId === 1) {
    return Math.min(missionCompletionRate, 80);
  }

  if (phaseId === 2) {
    return missionCompletionRate >= 50 ? 34 : 12;
  }

  if (phaseId === 3) {
    return missionCompletionRate >= 70 ? 28 : 10;
  }

  return missionCompletionRate >= 90 ? 40 : 8;
}

function buildComment(phaseLabel: string) {
  if (phaseLabel === "Validate") {
    return "現在はValidateフェーズです。\n\n作ることではなく、\n売れるか確認することを優先します。";
  }

  if (phaseLabel === "Sell") {
    return "現在はSellフェーズです。\n\n準備より接触。\n販売の事実を作ります。";
  }

  if (phaseLabel === "Repeat") {
    return "現在はRepeatフェーズです。\n\n一度売れた手順を分解し、\n再現性を作ります。";
  }

  return "現在はScaleフェーズです。\n\n反応のある導線へ集中し、\n収益を拡張します。";
}

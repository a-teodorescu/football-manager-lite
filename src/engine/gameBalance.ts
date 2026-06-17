import type { ClubFinance } from "./finance";
import type { Team } from "./types";

export type DifficultyLevel = "casual" | "normal" | "hard" | "elite";

export interface DifficultySettings {
  level: DifficultyLevel;
  locked?: boolean;
}

export interface DifficultyOption {
  level: DifficultyLevel;
  label: string;
  description: string;
  incomeModifier: number;
  staffWageModifier: number;
  boardPressureModifier: number;
  opponentPressureLabel: string;
}

export interface BalanceReport {
  score: number;
  difficultyLabel: string;
  economyStatus: "easy" | "balanced" | "tight" | "danger";
  squadStatus: "thin" | "balanced" | "deep";
  pressureStatus: "low" | "medium" | "high";
  notes: string[];
}

const OPTIONS: DifficultyOption[] = [
  {
    level: "casual",
    label: "Casual",
    description: "Mai multi bani, presiune mai mica, ideal pentru invatare.",
    incomeModifier: 1.18,
    staffWageModifier: 0.9,
    boardPressureModifier: 0.78,
    opponentPressureLabel: "AI tolerant",
  },
  {
    level: "normal",
    label: "Normal",
    description: "Experienta standard pentru beta.",
    incomeModifier: 1,
    staffWageModifier: 1,
    boardPressureModifier: 1,
    opponentPressureLabel: "AI standard",
  },
  {
    level: "hard",
    label: "Hard",
    description: "Bugete mai stranse si board mai exigent.",
    incomeModifier: 0.9,
    staffWageModifier: 1.08,
    boardPressureModifier: 1.18,
    opponentPressureLabel: "AI competitiv",
  },
  {
    level: "elite",
    label: "Elite",
    description: "Pentru testeri avansati: economie dura si presiune mare.",
    incomeModifier: 0.8,
    staffWageModifier: 1.18,
    boardPressureModifier: 1.35,
    opponentPressureLabel: "AI agresiv",
  },
];

export function createInitialDifficultySettings(): DifficultySettings {
  return { level: "normal" };
}

export function getDifficultyOptions(): DifficultyOption[] {
  return OPTIONS;
}

export function getDifficultyOption(settings: DifficultySettings): DifficultyOption {
  return OPTIONS.find((item) => item.level === settings.level) ?? OPTIONS[1];
}

export function getDifficultyLabel(level: DifficultyLevel): string {
  return OPTIONS.find((item) => item.level === level)?.label ?? "Normal";
}

export function applyDifficultyToMoney(value: number, settings: DifficultySettings): number {
  return Math.round(value * getDifficultyOption(settings).incomeModifier);
}

export function applyDifficultyToCost(value: number, settings: DifficultySettings): number {
  return Math.round(value * getDifficultyOption(settings).staffWageModifier);
}

export function buildBalanceReport(input: {
  difficulty: DifficultySettings;
  finance: ClubFinance;
  team: Team;
  jobSecurity: number;
  wageBill: number;
  squadValue: number;
}): BalanceReport {
  const option = getDifficultyOption(input.difficulty);
  const wageRatio = input.wageBill / Math.max(1, input.finance.wageBudget);
  const cashRatio = input.finance.cashBalance / Math.max(1, input.squadValue);
  const squadStatus = input.team.players.length >= 24 ? "deep" : input.team.players.length < 17 ? "thin" : "balanced";
  const economyStatus = input.finance.cashBalance < 0 ? "danger" : wageRatio > 1 ? "tight" : cashRatio > 0.7 ? "easy" : "balanced";
  const pressureStatus = input.jobSecurity < 45 ? "high" : input.jobSecurity < 68 ? "medium" : "low";
  const notes = [
    `Difficulty: ${option.label} (${option.opponentPressureLabel}).`,
    `Income modifier ${Math.round(option.incomeModifier * 100)}%, cost modifier ${Math.round(option.staffWageModifier * 100)}%.`,
    `Wage ratio ${Math.round(wageRatio * 100)}%.`,
  ];
  const score = Math.round(
    Math.max(0, Math.min(100, 80 - Math.max(0, wageRatio - 0.85) * 80 + Math.min(20, cashRatio * 15) + input.jobSecurity * 0.15)),
  );

  return {
    score,
    difficultyLabel: option.label,
    economyStatus,
    squadStatus,
    pressureStatus,
    notes,
  };
}

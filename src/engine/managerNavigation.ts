import { validateLineupSelection } from "./lineupSelection";
import { buildSetPieceReport } from "./setPieces";
import { buildSubstitutionReport } from "./substitutions";
import type { Formation, Team } from "./types";

export type NavigationGroupId =
  | "home"
  | "club"
  | "match"
  | "season"
  | "business"
  | "online";

export type QuickActionPriority = "critical" | "recommended" | "optional";

export interface NavigationTabItem {
  tab: string;
  label: string;
  compactLabel?: string;
}

export interface NavigationGroup {
  id: NavigationGroupId;
  label: string;
  description: string;
  tabs: NavigationTabItem[];
}

export interface ManagerQuickAction {
  id: string;
  label: string;
  description: string;
  targetTab: string;
  priority: QuickActionPriority;
}

export interface MatchReadinessChecklistItem {
  id: string;
  label: string;
  ready: boolean;
  targetTab: string;
  detail: string;
}

export interface ManagerNavigationReport {
  groups: NavigationGroup[];
  totalTabs: number;
  mobilePrimaryTabs: NavigationTabItem[];
  quickActions: ManagerQuickAction[];
  matchReadinessScore: number;
  matchReadinessLabel: string;
  checklist: MatchReadinessChecklistItem[];
  summary: string;
}

export interface BuildManagerNavigationInput {
  team: Team;
  formation: Formation;
  currentRound: number;
  maxRound: number;
  seasonFinished: boolean;
  nextMatchAvailable: boolean;
  trainingDoneThisRound: boolean;
  unreadInboxCount: number;
  transferBudget: number;
  cashBalance: number;
}

export const MANAGER_NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    id: "home",
    label: "Home",
    description: "Imaginea rapida a carierei si mesajele importante.",
    tabs: [
      { tab: "dashboard", label: "Dashboard" },
      { tab: "inbox", label: "Inbox" },
      { tab: "help", label: "Help" },
    ],
  },
  {
    id: "club",
    label: "Club",
    description: "Lot, identitate, staff, contracte si dezvoltare interna.",
    tabs: [
      { tab: "squad", label: "Squad" },
      { tab: "players", label: "Players" },
      { tab: "portraits", label: "Portraits" },
      { tab: "staff", label: "Staff" },
      { tab: "training", label: "Training" },
      { tab: "medical", label: "Fitness" },
      { tab: "contracts", label: "Contracts" },
      { tab: "academy", label: "Academy" },
    ],
  },
  {
    id: "match",
    label: "Matchday",
    description: "Tactica, primul 11, schimbari, faze fixe si pregatirea meciului.",
    tabs: [
      { tab: "tactics", label: "Tactics" },
      { tab: "advancedTactics", label: "Advanced Tactics", compactLabel: "Advanced" },
      { tab: "lineup", label: "Lineup" },
      { tab: "subs", label: "Subs" },
      { tab: "setpieces", label: "Set Pieces", compactLabel: "Set Pieces" },
      { tab: "prep", label: "Match Prep", compactLabel: "Prep" },
      { tab: "match", label: "Meci curent", compactLabel: "Match" },
      { tab: "fixtures", label: "Program" },
    ],
  },
  {
    id: "season",
    label: "Season",
    description: "Clasamente, competitii, recorduri si palmares.",
    tabs: [
      { tab: "league", label: "League" },
      { tab: "board", label: "Board" },
      { tab: "standings", label: "Clasament" },
      { tab: "cup", label: "Cup" },
      { tab: "europe", label: "Europe" },
      { tab: "seasons", label: "Seasons" },
      { tab: "records", label: "Records" },
      { tab: "trophy", label: "Trophy Room", compactLabel: "Trophy" },
    ],
  },
  {
    id: "business",
    label: "Business",
    description: "Transferuri, scouting, finante, sponsori, stadion, media si fani.",
    tabs: [
      { tab: "transfers", label: "Transfers" },
      { tab: "scouting", label: "Scouting" },
      { tab: "finance", label: "Finance" },
      { tab: "sponsorships", label: "Sponsors" },
      { tab: "facilities", label: "Facilities" },
      { tab: "media", label: "Media" },
      { tab: "fans", label: "Fans" },
      { tab: "difficulty", label: "Difficulty" },
    ],
  },
  {
    id: "online",
    label: "Online & QA",
    description: "Multiplayer, notificari, PWA, stabilitate, database si panouri beta/admin.",
    tabs: [
      { tab: "multiplayer", label: "Multiplayer" },
      { tab: "notifications", label: "Notifications", compactLabel: "Alerts" },
      { tab: "beta", label: "Beta" },
      { tab: "release", label: "Release" },
      { tab: "performance", label: "Performance" },
      { tab: "pwa", label: "PWA" },
      { tab: "stability", label: "Stability" },
      { tab: "database", label: "Database" },
      { tab: "qa", label: "QA Live" },
      { tab: "admin", label: "Admin" },
    ],
  },
];

function getMatchReadinessLabel(score: number): string {
  if (score >= 90) return "Ready";
  if (score >= 70) return "Almost ready";
  if (score >= 45) return "Needs attention";
  return "Not ready";
}

function pushQuickAction(actions: ManagerQuickAction[], action: ManagerQuickAction): void {
  if (!actions.some((item) => item.id === action.id)) actions.push(action);
}

export function buildManagerNavigationReport(input: BuildManagerNavigationInput): ManagerNavigationReport {
  const lineupReport = validateLineupSelection(input.team, input.formation);
  const substitutionReport = buildSubstitutionReport(input.team, input.formation);
  const setPieceReport = buildSetPieceReport(input.team, input.formation);

  const checklist: MatchReadinessChecklistItem[] = [
    {
      id: "lineup",
      label: "Primul 11",
      ready: lineupReport.isValid,
      targetTab: "lineup",
      detail: lineupReport.summary,
    },
    {
      id: "subs",
      label: "Schimbari",
      ready: substitutionReport.isValid,
      targetTab: "subs",
      detail: substitutionReport.summary,
    },
    {
      id: "setpieces",
      label: "Faze fixe",
      ready: setPieceReport.isValid,
      targetTab: "setpieces",
      detail: setPieceReport.summary,
    },
    {
      id: "training",
      label: "Training runda curenta",
      ready: input.trainingDoneThisRound || input.seasonFinished,
      targetTab: "training",
      detail: input.trainingDoneThisRound ? "Sesiunea de training pentru runda curenta este facuta." : "Mai poti face o sesiune de training inainte de meci.",
    },
    {
      id: "matchprep",
      label: "Scouting adversar",
      ready: input.nextMatchAvailable || input.seasonFinished,
      targetTab: "prep",
      detail: input.nextMatchAvailable ? "Exista raport pentru urmatorul adversar." : "Nu exista meci disponibil in runda curenta.",
    },
  ];

  const readinessScore = Math.round((checklist.filter((item) => item.ready).length / checklist.length) * 100);
  const actions: ManagerQuickAction[] = [];

  if (input.unreadInboxCount > 0) {
    pushQuickAction(actions, {
      id: "read-inbox",
      label: `Citeste inbox (${input.unreadInboxCount})`,
      description: "Ai mesaje noi care pot influenta urmatoarele decizii.",
      targetTab: "inbox",
      priority: "recommended",
    });
  }

  if (!lineupReport.isValid) {
    pushQuickAction(actions, {
      id: "fix-lineup",
      label: "Repara primul 11",
      description: lineupReport.summary,
      targetTab: "lineup",
      priority: "critical",
    });
  }

  if (!substitutionReport.isValid) {
    pushQuickAction(actions, {
      id: "prepare-subs",
      label: "Pregateste schimbarile",
      description: substitutionReport.summary,
      targetTab: "subs",
      priority: readinessScore < 70 ? "critical" : "recommended",
    });
  }

  if (!setPieceReport.isValid) {
    pushQuickAction(actions, {
      id: "assign-set-pieces",
      label: "Alege specialistii",
      description: setPieceReport.summary,
      targetTab: "setpieces",
      priority: "recommended",
    });
  }

  if (!input.trainingDoneThisRound && !input.seasonFinished) {
    pushQuickAction(actions, {
      id: "run-training",
      label: "Fa training",
      description: "Sesiunea de training poate imbunatati lotul inainte de etapa.",
      targetTab: "training",
      priority: "recommended",
    });
  }

  if (input.transferBudget >= 3500 && input.cashBalance >= 9000) {
    pushQuickAction(actions, {
      id: "transfer-window",
      label: "Verifica piata",
      description: "Ai buget suficient pentru un free agent sau pentru rotatie.",
      targetTab: "transfers",
      priority: "optional",
    });
  }

  if (input.nextMatchAvailable && readinessScore >= 80 && !input.seasonFinished) {
    pushQuickAction(actions, {
      id: "prepare-match",
      label: "Pregateste meciul",
      description: "Lineup-ul, banca si fazele fixe sunt suficient de pregatite.",
      targetTab: "prep",
      priority: "recommended",
    });
  }

  if (input.seasonFinished) {
    pushQuickAction(actions, {
      id: "new-season",
      label: "Pregateste sezon nou",
      description: "Sezonul este incheiat. Verifica istoricul si porneste sezonul urmator.",
      targetTab: "seasons",
      priority: "critical",
    });
  }

  const priorityRank: Record<QuickActionPriority, number> = {
    critical: 0,
    recommended: 1,
    optional: 2,
  };
  const quickActions = actions.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]).slice(0, 5);
  const mobilePrimaryTabs = [
    MANAGER_NAVIGATION_GROUPS[0].tabs[0],
    MANAGER_NAVIGATION_GROUPS[2].tabs[2],
    MANAGER_NAVIGATION_GROUPS[2].tabs[5],
    MANAGER_NAVIGATION_GROUPS[2].tabs[7],
    MANAGER_NAVIGATION_GROUPS[4].tabs[0],
  ];
  const totalTabs = MANAGER_NAVIGATION_GROUPS.reduce((sum, group) => sum + group.tabs.length, 0);

  return {
    groups: MANAGER_NAVIGATION_GROUPS,
    totalTabs,
    mobilePrimaryTabs,
    quickActions,
    matchReadinessScore: readinessScore,
    matchReadinessLabel: getMatchReadinessLabel(readinessScore),
    checklist,
    summary:
      readinessScore >= 80
        ? "Manager hub-ul este pregatit pentru urmatoarea decizie importanta."
        : "Manager hub-ul a gasit pasi importanti inainte de urmatorul meci.",
  };
}

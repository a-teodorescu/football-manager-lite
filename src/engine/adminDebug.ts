import { calculateSquadWageBill, getWageBudgetStatus } from "./finance";
import { getUnavailablePlayers } from "./playerStatus";
import type { Team } from "./types";

export type AdminCheckStatus = "pass" | "warning" | "fail";

export interface AdminDebugCheck {
  id: string;
  title: string;
  status: AdminCheckStatus;
  summary: string;
  action: string;
  targetTab: string;
}

export interface AdminDebugFact {
  label: string;
  value: string;
}

export interface AdminDebugReport {
  score: number;
  statusLabel: string;
  passCount: number;
  warningCount: number;
  failCount: number;
  checks: AdminDebugCheck[];
  saveFacts: AdminDebugFact[];
  testActions: string[];
  exportSummary: string;
}

export interface BuildAdminDebugInput {
  appVersion: string;
  authenticated: boolean;
  managerId?: string;
  supabaseConfigured: boolean;
  localSaveAvailable: boolean;
  cloudSaveLikelyAvailable: boolean;
  seasonNumber: number;
  currentRound: number;
  maxRound: number;
  teamsCount: number;
  fixturesCount: number;
  resultsCount: number;
  standingsCount: number;
  userTeam: Team;
  cashBalance: number;
  wageBudget: number;
  transferBudget: number;
  trainingHistoryCount: number;
  transferHistoryCount: number;
  financeHistoryCount: number;
  academyProspectsCount: number;
  seasonHistoryCount: number;
  cupHistoryCount: number;
  boardReviewsCount: number;
  scoutingReportsCount: number;
  lastSaveStatus?: string;
  lastError?: string;
  savePayloadBytes: number;
}

function getStatusWeight(status: AdminCheckStatus): number {
  if (status === "pass") return 10;
  if (status === "warning") return 5;
  return 0;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getSquadIntegrityStatus(userTeam: Team): AdminCheckStatus {
  const positions = userTeam.players.reduce<Record<string, number>>((map, player) => {
    map[player.position] = (map[player.position] ?? 0) + 1;
    return map;
  }, {});

  if (userTeam.players.length < 14) return "fail";
  if ((positions.GK ?? 0) < 1) return "fail";
  if ((positions.DEF ?? 0) < 4) return "warning";
  if ((positions.MID ?? 0) < 4) return "warning";
  if ((positions.ATT ?? 0) < 2) return "warning";
  return "pass";
}

function getPayloadStatus(bytes: number): AdminCheckStatus {
  if (bytes > 3_000_000) return "fail";
  if (bytes > 900_000) return "warning";
  return "pass";
}

function buildStatusLabel(failCount: number, warningCount: number): string {
  if (failCount > 0) return "Admin attention needed";
  if (warningCount > 0) return "Admin checks mostly healthy";
  return "Admin checks healthy";
}

export function buildAdminDebugPanel(input: BuildAdminDebugInput): AdminDebugReport {
  const unavailablePlayers = getUnavailablePlayers(input.userTeam);
  const wageBill = calculateSquadWageBill(input.userTeam);
  const wageBudgetStatus = getWageBudgetStatus(
    {
      cashBalance: input.cashBalance,
      wageBudget: input.wageBudget,
      sponsorBase: 0,
    },
    input.userTeam,
  );
  const squadIntegrityStatus = getSquadIntegrityStatus(input.userTeam);
  const payloadStatus = getPayloadStatus(input.savePayloadBytes);
  const seasonFinished = input.currentRound > input.maxRound;

  const checks: AdminDebugCheck[] = [
    {
      id: "auth-context",
      title: "Auth context",
      status: input.authenticated && input.managerId ? "pass" : "fail",
      summary: input.managerId
        ? `Manager ID activ: ${input.managerId}`
        : "Nu exista manager ID activ pentru salvare per user.",
      action: input.managerId ? "Continua testarea." : "Fa login/register inainte de debug.",
      targetTab: "dashboard",
    },
    {
      id: "supabase-context",
      title: "Supabase context",
      status: input.supabaseConfigured ? "pass" : "warning",
      summary: input.supabaseConfigured
        ? "Env vars Supabase sunt prezente in build."
        : "Supabase env vars lipsesc sau nu sunt injectate in Netlify.",
      action: input.supabaseConfigured
        ? "Testeaza save/load cloud."
        : "Seteaza VITE_SUPABASE_URL si VITE_SUPABASE_ANON_KEY.",
      targetTab: "qa",
    },
    {
      id: "save-availability",
      title: "Save availability",
      status: input.localSaveAvailable || input.cloudSaveLikelyAvailable ? "pass" : "warning",
      summary: input.localSaveAvailable
        ? "Exista salvare locala pentru userul curent."
        : input.cloudSaveLikelyAvailable
          ? "Exista semnal ca salvarea cloud a fost testata in sesiunea curenta."
          : "Nu exista inca salvare locala/cloud confirmata pentru userul curent.",
      action: "Foloseste Save local si Save Supabase din QA Live.",
      targetTab: "qa",
    },
    {
      id: "payload-size",
      title: "Save payload size",
      status: payloadStatus,
      summary: `Payload estimat: ${formatBytes(input.savePayloadBytes)}.`,
      action:
        payloadStatus === "pass"
          ? "Dimensiunea este ok pentru browser si Supabase."
          : "Curata istoricele sau redu listele salvate daca payload-ul creste prea mult.",
      targetTab: "admin",
    },
    {
      id: "squad-integrity",
      title: "Squad integrity",
      status: squadIntegrityStatus,
      summary: `${input.userTeam.players.length} jucatori in lot, ${unavailablePlayers.length} indisponibili.`,
      action:
        squadIntegrityStatus === "pass"
          ? "Lotul respecta regulile minime."
          : "Verifica transferuri/release contracte si completeaza posturile lipsa.",
      targetTab: "squad",
    },
    {
      id: "league-data",
      title: "League data",
      status:
        input.teamsCount >= 8 && input.fixturesCount > 0 && input.standingsCount >= 8
          ? "pass"
          : "fail",
      summary: `${input.teamsCount} echipe, ${input.fixturesCount} fixtures, ${input.standingsCount} randuri de clasament.`,
      action: "Daca datele lipsesc, reseteaza cariera locala si creeaza club nou.",
      targetTab: "fixtures",
    },
    {
      id: "season-state",
      title: "Season state",
      status: input.currentRound >= 1 && input.maxRound >= 1 ? "pass" : "fail",
      summary: seasonFinished
        ? `Sezon finalizat dupa runda ${input.maxRound}.`
        : `Runda curenta ${input.currentRound}/${input.maxRound}.`,
      action: seasonFinished
        ? "Testeaza Start new season."
        : "Simuleaza urmatoarea etapa pentru smoke test.",
      targetTab: "seasons",
    },
    {
      id: "finance-state",
      title: "Finance state",
      status:
        input.cashBalance < 0 || wageBudgetStatus === "over"
          ? "warning"
          : "pass",
      summary: `Cash €${input.cashBalance.toLocaleString("en-US")}k, wage bill €${wageBill.toLocaleString("en-US")}k / budget €${input.wageBudget.toLocaleString("en-US")}k.`,
      action:
        input.cashBalance < 0 || wageBudgetStatus === "over"
          ? "Verifica salarii, transferuri si rapoarte Finance."
          : "Finantele sunt in zona controlabila.",
      targetTab: "finance",
    },
    {
      id: "feature-history",
      title: "Feature history",
      status:
        input.trainingHistoryCount + input.transferHistoryCount + input.financeHistoryCount + input.boardReviewsCount > 0
          ? "pass"
          : "warning",
      summary: `${input.trainingHistoryCount} training, ${input.transferHistoryCount} transferuri, ${input.financeHistoryCount} rapoarte finance, ${input.boardReviewsCount} board reviews.`,
      action: "Ruleaza cel putin o actiune din fiecare modul critic la QA final.",
      targetTab: "dashboard",
    },
    {
      id: "last-error",
      title: "Last UI error",
      status: input.lastError ? "warning" : "pass",
      summary: input.lastError || "Nu exista eroare activa in UI.",
      action: input.lastError
        ? "Genereaza export debug si investigheaza eroarea."
        : "Continua testarea.",
      targetTab: input.lastError ? "admin" : "qa",
    },
  ];

  const passCount = checks.filter((check) => check.status === "pass").length;
  const warningCount = checks.filter((check) => check.status === "warning").length;
  const failCount = checks.filter((check) => check.status === "fail").length;
  const score = Math.round(
    (checks.reduce((sum, check) => sum + getStatusWeight(check.status), 0) /
      (checks.length * 10)) *
      100,
  );

  const saveFacts: AdminDebugFact[] = [
    { label: "App version", value: input.appVersion },
    { label: "Manager ID", value: input.managerId ?? "not logged in" },
    { label: "Season", value: String(input.seasonNumber) },
    { label: "Round", value: `${input.currentRound}/${input.maxRound}` },
    { label: "Payload size", value: formatBytes(input.savePayloadBytes) },
    { label: "Squad", value: `${input.userTeam.players.length} players` },
    { label: "Unavailable", value: String(unavailablePlayers.length) },
    { label: "Results", value: String(input.resultsCount) },
    { label: "Transfer budget", value: `€${input.transferBudget.toLocaleString("en-US")}k` },
    { label: "Cash balance", value: `€${input.cashBalance.toLocaleString("en-US")}k` },
    { label: "Wage budget", value: `€${input.wageBudget.toLocaleString("en-US")}k` },
    { label: "Scouting reports", value: String(input.scoutingReportsCount) },
    { label: "Academy prospects", value: String(input.academyProspectsCount) },
    { label: "Cup history", value: String(input.cupHistoryCount) },
    { label: "Seasons completed", value: String(input.seasonHistoryCount) },
    { label: "Last status", value: input.lastSaveStatus || "none" },
  ];

  const testActions = checks
    .filter((check) => check.status !== "pass")
    .map((check) => check.action)
    .slice(0, 5);

  if (testActions.length === 0) {
    testActions.push(
      "Ruleaza flow-ul complet: save local, save Supabase, simulate round, board review, reload cloud.",
    );
  }

  return {
    score,
    statusLabel: buildStatusLabel(failCount, warningCount),
    passCount,
    warningCount,
    failCount,
    checks,
    saveFacts,
    testActions,
    exportSummary: `v${input.appVersion} | ${input.managerId ?? "anonymous"} | S${input.seasonNumber} R${input.currentRound}/${input.maxRound} | payload ${formatBytes(input.savePayloadBytes)} | score ${score}/100`,
  };
}

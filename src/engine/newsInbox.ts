import type { BoardReviewRecord } from "./boardObjectives";
import type { CupRecord } from "./cupCompetition";
import type { FinanceReport } from "./finance";
import type { FixtureResult } from "./leagueSimulation";
import type { RoundStatusReport } from "./playerStatus";
import type { ScoutingRecord, ScoutReport } from "./scouting";
import type { SeasonHistoryRecord } from "./seasonProgression";
import type { SponsorshipRecord } from "./sponsorship";
import type { FacilityRecord } from "./stadiumFacilities";
import type { StandingRow } from "./standings";
import type { ContractRecord } from "./contracts";
import type { TransferRecord } from "./transferMarket";
import type { TrainingSessionResult } from "./training";
import type { YouthAcademyRecord } from "./youthAcademy";
import type { Team } from "./types";

export type InboxMessageCategory =
  | "club"
  | "match"
  | "training"
  | "medical"
  | "transfer"
  | "scouting"
  | "finance"
  | "sponsor"
  | "facilities"
  | "media"
  | "fans"
  | "academy"
  | "contract"
  | "cup"
  | "board"
  | "season"
  | "system";

export type InboxMessageTone = "info" | "success" | "warning" | "danger";

export interface InboxMessage {
  id: string;
  seasonNumber: number;
  round: number;
  category: InboxMessageCategory;
  tone: InboxMessageTone;
  title: string;
  body: string;
  source: string;
  targetTab: string;
  createdAt: string;
  read: boolean;
  pinned?: boolean;
}

export interface InboxSummary {
  totalCount: number;
  unreadCount: number;
  urgentCount: number;
  latestHeadline: string;
  categories: Array<{
    category: InboxMessageCategory;
    label: string;
    count: number;
    unreadCount: number;
  }>;
}

export interface BuildRoundNewsInput {
  seasonNumber: number;
  round: number;
  clubName: string;
  roundResults: FixtureResult[];
  standings: StandingRow[];
  financeReport?: FinanceReport;
  statusReport?: RoundStatusReport;
  boardReview?: BoardReviewRecord;
  userTeamId: string;
}

const CATEGORY_LABELS: Record<InboxMessageCategory, string> = {
  club: "Club",
  match: "Meciuri",
  training: "Training",
  medical: "Medical",
  transfer: "Transferuri",
  scouting: "Scouting",
  finance: "Finante",
  sponsor: "Sponsori",
  facilities: "Facilitati",
  media: "Media",
  fans: "Fans",
  academy: "Academie",
  contract: "Contracte",
  cup: "Cupa",
  board: "Board",
  season: "Sezon",
  system: "Sistem",
};

function nowIso(): string {
  return new Date().toISOString();
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function createMessage(input: Omit<InboxMessage, "createdAt" | "read"> & { createdAt?: string; read?: boolean }): InboxMessage {
  return {
    ...input,
    createdAt: input.createdAt ?? nowIso(),
    read: input.read ?? false,
  };
}

function getRoundResultForUser(roundResults: FixtureResult[], userTeamId: string): FixtureResult | undefined {
  return roundResults.find(
    (item) => item.result.homeTeamId === userTeamId || item.result.awayTeamId === userTeamId,
  );
}

function getUserScore(result: FixtureResult, userTeamId: string): { userScore: number; opponentScore: number; opponentName: string; home: boolean } {
  const home = result.result.homeTeamId === userTeamId;
  return {
    home,
    userScore: home ? result.result.homeScore : result.result.awayScore,
    opponentScore: home ? result.result.awayScore : result.result.homeScore,
    opponentName: home ? result.result.awayTeamName : result.result.homeTeamName,
  };
}

function getResultTone(userScore: number, opponentScore: number): InboxMessageTone {
  if (userScore > opponentScore) return "success";
  if (userScore === opponentScore) return "info";
  return "warning";
}

export function getInboxCategoryLabel(category: InboxMessageCategory): string {
  return CATEGORY_LABELS[category];
}

export function createWelcomeInboxMessages(input: {
  seasonNumber: number;
  clubName: string;
  city?: string;
}): InboxMessage[] {
  return [
    createMessage({
      id: `welcome-s${input.seasonNumber}-${slug(input.clubName)}`,
      seasonNumber: input.seasonNumber,
      round: 1,
      category: "club",
      tone: "success",
      title: `Bine ai venit la ${input.clubName}`,
      body: `${input.city ? `${input.city} are un nou proiect fotbalistic.` : "Clubul tau este pregatit."} Configureaza tactica, verifica lotul si salveaza progresul inainte de primul meci.`,
      source: "club-setup",
      targetTab: "dashboard",
      pinned: true,
    }),
    createMessage({
      id: `board-welcome-s${input.seasonNumber}`,
      seasonNumber: input.seasonNumber,
      round: 1,
      category: "board",
      tone: "info",
      title: "Board-ul asteapta rezultate",
      body: "Obiectivele de sezon sunt active. Verifica tabul Board pentru job security, sack risk si asteptarile clubului.",
      source: "board",
      targetTab: "board",
    }),
  ];
}

export function addInboxMessages(existing: InboxMessage[], next: InboxMessage[], limit = 90): InboxMessage[] {
  const merged = new Map<string, InboxMessage>();

  for (const message of [...next, ...existing]) {
    const previous = merged.get(message.id);
    merged.set(message.id, previous ? { ...message, read: previous.read || message.read } : message);
  }

  return Array.from(merged.values())
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, limit);
}

export function markInboxMessageRead(messages: InboxMessage[], messageId: string): InboxMessage[] {
  return messages.map((message) => (message.id === messageId ? { ...message, read: true } : message));
}

export function markAllInboxMessagesRead(messages: InboxMessage[]): InboxMessage[] {
  return messages.map((message) => ({ ...message, read: true }));
}

export function buildInboxSummary(messages: InboxMessage[]): InboxSummary {
  const categories = Object.keys(CATEGORY_LABELS).map((category) => {
    const typedCategory = category as InboxMessageCategory;
    const categoryMessages = messages.filter((message) => message.category === typedCategory);
    return {
      category: typedCategory,
      label: CATEGORY_LABELS[typedCategory],
      count: categoryMessages.length,
      unreadCount: categoryMessages.filter((message) => !message.read).length,
    };
  }).filter((item) => item.count > 0);

  const latestUnread = messages.find((message) => !message.read) ?? messages[0];

  return {
    totalCount: messages.length,
    unreadCount: messages.filter((message) => !message.read).length,
    urgentCount: messages.filter((message) => !message.read && (message.tone === "danger" || message.tone === "warning")).length,
    latestHeadline: latestUnread?.title ?? "Inbox gol",
    categories,
  };
}

export function buildRoundNewsMessages(input: BuildRoundNewsInput): InboxMessage[] {
  const messages: InboxMessage[] = [];
  const userResult = getRoundResultForUser(input.roundResults, input.userTeamId);
  const userStanding = input.standings.find((row) => row.teamId === input.userTeamId);

  if (userResult) {
    const score = getUserScore(userResult, input.userTeamId);
    const userWon = score.userScore > score.opponentScore;
    const userDraw = score.userScore === score.opponentScore;
    messages.push(createMessage({
      id: `match-s${input.seasonNumber}-r${input.round}-${userResult.fixture.id}`,
      seasonNumber: input.seasonNumber,
      round: input.round,
      category: "match",
      tone: getResultTone(score.userScore, score.opponentScore),
      title: userWon ? "Victorie importanta" : userDraw ? "Rezultat de egalitate" : "Infrangere in campionat",
      body: `${input.clubName} ${score.userScore}-${score.opponentScore} ${score.opponentName}. ${userStanding ? `Pozitie curenta: ${input.standings.findIndex((row) => row.teamId === input.userTeamId) + 1}, ${userStanding.points} puncte.` : "Clasamentul a fost actualizat."}`,
      source: "league-round",
      targetTab: "match",
    }));
  }

  if (input.financeReport) {
    messages.push(createMessage({
      id: `finance-s${input.seasonNumber}-r${input.round}`,
      seasonNumber: input.seasonNumber,
      round: input.round,
      category: "finance",
      tone: input.financeReport.netChange >= 0 ? "success" : input.financeReport.balanceAfter < 0 ? "danger" : "warning",
      title: input.financeReport.netChange >= 0 ? "Runda profitabila" : "Costuri peste venituri",
      body: `${input.financeReport.summary} Balanta dupa runda: €${input.financeReport.balanceAfter.toLocaleString("en-US")}k.`,
      source: "finance",
      targetTab: "finance",
    }));
  }

  const injuryNotes = input.statusReport?.changes
    .filter((change) => change.injuryAfter && change.teamId === input.userTeamId)
    .map((change) => change.note) ?? [];
  if (injuryNotes.length > 0) {
    messages.push(createMessage({
      id: `medical-s${input.seasonNumber}-r${input.round}`,
      seasonNumber: input.seasonNumber,
      round: input.round,
      category: "medical",
      tone: injuryNotes.length >= 2 ? "danger" : "warning",
      title: "Raport medical nou",
      body: injuryNotes.slice(0, 3).join(" "),
      source: "medical",
      targetTab: "medical",
    }));
  }

  if (input.boardReview) {
    messages.push(createMessage({
      id: `board-s${input.seasonNumber}-r${input.round}-${input.boardReview.id}`,
      seasonNumber: input.seasonNumber,
      round: input.round,
      category: "board",
      tone: input.boardReview.sackRiskPercent >= 55 ? "danger" : input.boardReview.sackRiskPercent >= 30 ? "warning" : "info",
      title: `Board review: job security ${input.boardReview.jobSecurity}`,
      body: input.boardReview.summary,
      source: "board",
      targetTab: "board",
    }));
  }

  return messages;
}

export function buildTrainingNewsMessage(result: TrainingSessionResult): InboxMessage {
  return createMessage({
    id: `training-s${result.seasonNumber}-r${result.round}-${result.focus}`,
    seasonNumber: result.seasonNumber,
    round: result.round,
    category: "training",
    tone: result.changes.length > 0 ? "success" : "info",
    title: "Training completat",
    body: result.summary,
    source: "training",
    targetTab: "training",
  });
}

export function buildTransferNewsMessage(record: TransferRecord): InboxMessage {
  return createMessage({
    id: `transfer-${record.id}`,
    seasonNumber: record.seasonNumber,
    round: record.round,
    category: "transfer",
    tone: record.type === "buy" ? "success" : "info",
    title: record.type === "buy" ? "Transfer finalizat" : "Jucator vandut",
    body: `${record.playerName} (${record.position}, OVR ${record.overall}) ${record.type === "buy" ? "a semnat" : "a fost vandut"} pentru €${record.value.toLocaleString("en-US")}k. Buget ramas: €${record.budgetAfter.toLocaleString("en-US")}k.`,
    source: "transfer-market",
    targetTab: "transfers",
  });
}

export function buildScoutingNewsMessage(record: ScoutingRecord | ScoutReport): InboxMessage {
  return createMessage({
    id: `scouting-${record.id}`,
    seasonNumber: record.seasonNumber,
    round: record.round,
    category: "scouting",
    tone: "info",
    title: `Raport scouting: ${record.playerName}`,
    body: `Recomandare noua disponibila pentru ${record.playerName}. Verifica fit-ul tactic, financiar si riscul in tabul Scouting.`,
    source: "scouting",
    targetTab: "scouting",
  });
}

export function buildSponsorshipNewsMessage(record: SponsorshipRecord): InboxMessage {
  const isIncome = record.type === "round_income";
  const isSigned = record.type === "signed";
  return createMessage({
    id: `sponsor-${record.id}`,
    seasonNumber: record.seasonNumber,
    round: record.round,
    category: "sponsor",
    tone: isSigned || isIncome ? "success" : record.type === "expired" ? "warning" : "info",
    title: isSigned ? "Sponsor nou semnat" : isIncome ? "Venituri din sponsori" : record.type === "expired" ? "Sponsor expirat" : "Oferte sponsori actualizate",
    body: record.summary,
    source: "sponsorship",
    targetTab: "sponsorships",
  });
}


export function buildFacilityNewsMessage(record: FacilityRecord): InboxMessage {
  return createMessage({
    id: `facility-${record.id}`,
    seasonNumber: record.seasonNumber,
    round: record.round,
    category: "facilities",
    tone: record.type === "upgrade" ? "success" : record.amount < 0 ? "warning" : "info",
    title: record.type === "upgrade" ? "Upgrade facilitati" : record.type === "season_reset" ? "Facilitati pregatite" : "Raport facilitati",
    body: record.summary,
    source: "stadium-facilities",
    targetTab: "facilities",
  });
}

export function buildAcademyNewsMessage(record: YouthAcademyRecord): InboxMessage {
  const isPromotion = record.type === "promote";
  return createMessage({
    id: `academy-${record.id}`,
    seasonNumber: record.seasonNumber,
    round: record.round,
    category: "academy",
    tone: isPromotion ? "success" : "info",
    title: isPromotion ? "Junior promovat" : "Academy update",
    body: record.summary,
    source: "academy",
    targetTab: "academy",
  });
}

export function buildContractNewsMessage(record: ContractRecord): InboxMessage {
  return createMessage({
    id: `contract-${record.id}`,
    seasonNumber: record.seasonNumber,
    round: record.round,
    category: "contract",
    tone: record.type === "auto_release" || record.type === "release" ? "warning" : "success",
    title: record.type === "renew" ? "Contract reinnoit" : "Schimbare contract",
    body: record.summary,
    source: "contracts",
    targetTab: "contracts",
  });
}

export function buildCupNewsMessage(record: CupRecord): InboxMessage {
  return createMessage({
    id: `cup-${record.id}`,
    seasonNumber: record.seasonNumber,
    round: 100 + record.roundIndex,
    category: "cup",
    tone: record.championTeamName ? (record.userAdvanced ? "success" : "info") : record.userAdvanced ? "success" : record.userParticipated ? "warning" : "info",
    title: record.championTeamName ? "Cupa s-a incheiat" : `Cupa: ${record.userAdvanced ? "calificare" : "runda jucata"}`,
    body: record.summary,
    source: "cup",
    targetTab: "cup",
  });
}

export function buildSeasonNewsMessages(record: SeasonHistoryRecord): InboxMessage[] {
  return [
    createMessage({
      id: `season-summary-${record.id}`,
      seasonNumber: record.seasonNumber,
      round: 999,
      category: "season",
      tone: record.userPosition <= 3 ? "success" : record.userPosition <= 6 ? "info" : "warning",
      title: `Sezon ${record.seasonNumber} finalizat`,
      body: record.summary,
      source: "season-progression",
      targetTab: "seasons",
      pinned: true,
    }),
  ];
}

export function buildClubSnapshotMessage(input: {
  seasonNumber: number;
  round: number;
  team: Team;
  cashBalance: number;
  position: number;
}): InboxMessage {
  return createMessage({
    id: `club-snapshot-s${input.seasonNumber}-r${input.round}`,
    seasonNumber: input.seasonNumber,
    round: input.round,
    category: "club",
    tone: "info",
    title: "Snapshot manager",
    body: `${input.team.name}: locul ${input.position}, moral ${input.team.morale}, cash €${input.cashBalance.toLocaleString("en-US")}k.`,
    source: "dashboard",
    targetTab: "dashboard",
  });
}

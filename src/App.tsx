import { type FormEvent, useMemo, useState } from "react";
import { Fixture } from "./engine/fixtureGenerator";
import {
  FixtureResult,
  USER_TEAM_ID,
  createMockLeagueTeams,
  defaultUserTactic,
  getMaxRound,
  getTeamTactic,
  simulateRound,
} from "./engine/leagueSimulation";
import { MatchEventType, Tactic, Team } from "./engine/types";
import { calculateTeamStrength } from "./engine/teamStrength";
import {
  buildMatchAnalysis,
  buildMatchPreview,
} from "./engine/matchExperience";
import { buildManagerDashboard } from "./engine/managerDashboard";
import { buildUiExperience } from "./engine/uiExperience";
import { buildBetaReadiness } from "./engine/betaReadiness";
import { buildLiveDeployQa } from "./engine/liveDeployQa";
import { buildAdminDebugPanel } from "./engine/adminDebug";
import {
  getTrainingFocusLabel,
  runTeamTraining,
  type TrainingFocus,
  type TrainingSessionResult,
} from "./engine/training";
import {
  getAverageFitness,
  getPlayerAvailabilityLabel,
  getUnavailablePlayers,
  isPlayerInjured,
  normalizeTeamStatus,
  type RoundStatusReport,
} from "./engine/playerStatus";
import {
  buyMarketPlayer,
  createFreeAgentMarket,
  estimatePlayerValue,
  formatMoney,
  getInitialTransferBudget,
  getSellBlockReason,
  sellSquadPlayer,
  type TransferMarketPlayer,
  type TransferRecord,
} from "./engine/transferMarket";
import {
  buildScoutReport,
  getRecommendationLabel,
  getRiskLabel,
  getScoutReportForPlayer,
  getScoutingCost as getMarketScoutingCost,
  getSquadNeedLabel,
  getTopScoutRecommendations,
  upsertScoutReport,
  type ScoutReport,
  type ScoutingRecord,
} from "./engine/scouting";
import {
  createInitialCupState,
  getCupRoundLabel,
  getCurrentCupRoundName,
  getUserCupMatch,
  isUserStillInCup,
  simulateCupRound,
  type CupRecord,
  type CupState,
} from "./engine/cupCompetition";
import {
  createInitialBoardState,
  evaluateBoard,
  getBoardMoodLabel,
  getJobStatusLabel,
  getObjectiveStatusLabel as getBoardObjectiveStatusLabel,
  type BoardState,
} from "./engine/boardObjectives";
import {
  applyRoundFinances,
  calculateSquadWageBill,
  createInitialFinance,
  getPlayerWage,
  getWageBudgetStatus,
  type ClubFinance,
  type FinanceReport,
} from "./engine/finance";
import {
  getContractOffer,
  getContractRiskSummary,
  getContractStatus,
  getContractStatusLabel,
  getContractHappiness,
  normalizeTeamContracts,
  releaseExpiredContractPlayers,
  releasePlayerFromContract,
  renewPlayerContract,
  type ContractRecord,
} from "./engine/contracts";
import {
  createInitialYouthAcademy,
  getAcademyRoundCost,
  getAcademyRoundKey,
  getAcademyUpgradeCost,
  getScoutingCost,
  promoteYouthProspect,
  scoutYouthProspects,
  upgradeYouthAcademy,
  type YouthAcademyRecord,
  type YouthAcademyState,
} from "./engine/youthAcademy";
import {
  prepareNextSeason,
  type SeasonHistoryRecord,
} from "./engine/seasonProgression";
import { createInitialStandings, StandingRow } from "./engine/standings";
import { generateFixtures } from "./engine/fixtureGenerator";
import {
  ClubProfile,
  ManagerSavePayload,
  clearLocalStorageSave,
  deleteSupabaseSave,
  isSupabaseConfigured,
  loadFromLocalStorage,
  loadFromSupabase,
  saveToLocalStorage,
  saveToSupabase,
} from "./lib/saveService";
import {
  AuthSession,
  getStoredAuthSession,
  loginWithEmail,
  logoutFromSupabase,
  registerWithEmail,
} from "./lib/authService";

const APP_VERSION = "2.2.0";

const DEFAULT_CLUB_PROFILE: ClubProfile = {
  name: "FC Bucuresti",
  city: "Bucuresti",
  primaryColor: "#2563eb",
  secondaryColor: "#f8fafc",
};

type Tab =
  | "dashboard"
  | "board"
  | "squad"
  | "training"
  | "medical"
  | "transfers"
  | "scouting"
  | "finance"
  | "contracts"
  | "academy"
  | "seasons"
  | "cup"
  | "tactics"
  | "match"
  | "fixtures"
  | "standings"
  | "help"
  | "beta"
  | "qa"
  | "admin";
type SaveStatus = string;
type AuthMode = "login" | "register";

interface GameState {
  seasonNumber: number;
  currentRound: number;
  userTactic: Tactic;
  clubProfile: ClubProfile;
  trainingFocus: TrainingFocus;
  lastTrainingRoundKey?: string;
  trainingHistory: TrainingSessionResult[];
  statusHistory: RoundStatusReport[];
  transferBudget: number;
  transferMarket: TransferMarketPlayer[];
  transferHistory: TransferRecord[];
  scoutingReports: ScoutReport[];
  scoutingHistory: ScoutingRecord[];
  finance: ClubFinance;
  financeHistory: FinanceReport[];
  youthAcademy: YouthAcademyState;
  youthAcademyHistory: YouthAcademyRecord[];
  seasonHistory: SeasonHistoryRecord[];
  contractHistory: ContractRecord[];
  cupState: CupState;
  cupHistory: CupRecord[];
  boardState: BoardState;
  teams: Team[];
  fixtures: Fixture[];
  results: FixtureResult[];
  standings: StandingRow[];
  selectedFixtureId?: string;
}

function normalizeClubProfile(profile?: Partial<ClubProfile>): ClubProfile {
  const name = profile?.name?.trim() || DEFAULT_CLUB_PROFILE.name;
  const city = profile?.city?.trim() || DEFAULT_CLUB_PROFILE.city;

  return {
    name: name.slice(0, 40),
    city: city.slice(0, 40),
    primaryColor: profile?.primaryColor || DEFAULT_CLUB_PROFILE.primaryColor,
    secondaryColor:
      profile?.secondaryColor || DEFAULT_CLUB_PROFILE.secondaryColor,
  };
}

function applyClubProfileToTeams(
  teams: Team[],
  clubProfile: ClubProfile,
  seasonNumber = 1,
): Team[] {
  return teams.map((team) => {
    const normalizedTeam = normalizeTeamContracts(
      normalizeTeamStatus(team),
      seasonNumber,
    );

    return team.id === USER_TEAM_ID
      ? {
          ...normalizedTeam,
          name: clubProfile.name,
        }
      : normalizedTeam;
  });
}

function applyClubProfileToFixtures(
  fixtures: Fixture[],
  clubProfile: ClubProfile,
): Fixture[] {
  return fixtures.map((fixture) => ({
    ...fixture,
    homeTeam:
      fixture.homeTeam.id === USER_TEAM_ID
        ? { ...fixture.homeTeam, name: clubProfile.name }
        : fixture.homeTeam,
    awayTeam:
      fixture.awayTeam.id === USER_TEAM_ID
        ? { ...fixture.awayTeam, name: clubProfile.name }
        : fixture.awayTeam,
  }));
}

function applyClubProfileToResults(
  results: FixtureResult[],
  clubProfile: ClubProfile,
): FixtureResult[] {
  return results.map((item) => ({
    ...item,
    fixture: {
      ...item.fixture,
      homeTeam:
        item.fixture.homeTeam.id === USER_TEAM_ID
          ? { ...item.fixture.homeTeam, name: clubProfile.name }
          : item.fixture.homeTeam,
      awayTeam:
        item.fixture.awayTeam.id === USER_TEAM_ID
          ? { ...item.fixture.awayTeam, name: clubProfile.name }
          : item.fixture.awayTeam,
    },
    result: {
      ...item.result,
      homeTeamName:
        item.result.homeTeamId === USER_TEAM_ID
          ? clubProfile.name
          : item.result.homeTeamName,
      awayTeamName:
        item.result.awayTeamId === USER_TEAM_ID
          ? clubProfile.name
          : item.result.awayTeamName,
    },
  }));
}

function createNewGame(
  clubProfile: ClubProfile = DEFAULT_CLUB_PROFILE,
  seasonNumber = 1,
  userTactic: Tactic = defaultUserTactic,
): GameState {
  const normalizedClubProfile = normalizeClubProfile(clubProfile);
  const teams = applyClubProfileToTeams(
    createMockLeagueTeams(),
    normalizedClubProfile,
    seasonNumber,
  );
  const fixtures = generateFixtures(teams);

  return {
    seasonNumber,
    currentRound: 1,
    userTactic,
    clubProfile: normalizedClubProfile,
    trainingFocus: "balanced",
    trainingHistory: [],
    statusHistory: [],
    transferBudget: getInitialTransferBudget(seasonNumber),
    transferMarket: createFreeAgentMarket(seasonNumber, 1),
    transferHistory: [],
    scoutingReports: [],
    scoutingHistory: [],
    finance: createInitialFinance(seasonNumber),
    financeHistory: [],
    youthAcademy: createInitialYouthAcademy(seasonNumber),
    youthAcademyHistory: [],
    seasonHistory: [],
    contractHistory: [],
    cupState: createInitialCupState(teams, seasonNumber),
    cupHistory: [],
    boardState: createInitialBoardState(seasonNumber),
    teams,
    fixtures,
    results: [],
    standings: createInitialStandings(teams),
  };
}

function getEventClass(type: MatchEventType): string {
  if (type === "goal") return "event event-goal";
  if (type === "yellow_card") return "event event-card";
  if (type === "shot_on_target") return "event event-target";
  return "event";
}

function getRoundFixtures(fixtures: Fixture[], round: number): Fixture[] {
  return fixtures.filter((fixture) => fixture.round === round);
}

function getResultForFixture(
  results: FixtureResult[],
  fixtureId: string,
): FixtureResult | undefined {
  return results.find((item) => item.fixture.id === fixtureId);
}

function getUserTeam(teams: Team[]): Team {
  const team = teams.find((item) => item.id === USER_TEAM_ID);
  if (!team) throw new Error("User team not found.");
  return team;
}

function getSavePayload(
  game: GameState,
  managerId: string,
): ManagerSavePayload {
  return {
    version: 1,
    managerId,
    seasonNumber: game.seasonNumber,
    currentRound: game.currentRound,
    userTactic: game.userTactic,
    clubProfile: game.clubProfile,
    trainingFocus: game.trainingFocus,
    lastTrainingRoundKey: game.lastTrainingRoundKey,
    trainingHistory: game.trainingHistory,
    statusHistory: game.statusHistory,
    transferBudget: game.transferBudget,
    transferMarket: game.transferMarket,
    transferHistory: game.transferHistory,
    scoutingReports: game.scoutingReports,
    scoutingHistory: game.scoutingHistory,
    finance: game.finance,
    financeHistory: game.financeHistory,
    youthAcademy: game.youthAcademy,
    youthAcademyHistory: game.youthAcademyHistory,
    seasonHistory: game.seasonHistory,
    contractHistory: game.contractHistory,
    cupState: game.cupState,
    cupHistory: game.cupHistory,
    boardState: game.boardState,
    teams: game.teams,
    fixtures: game.fixtures,
    results: game.results,
    standings: game.standings,
    selectedFixtureId: game.selectedFixtureId,
    updatedAt: new Date().toISOString(),
  };
}

function gameFromPayload(payload: ManagerSavePayload): GameState {
  const savedUserTeamName = payload.teams.find(
    (team) => team.id === USER_TEAM_ID,
  )?.name;
  const clubProfile = normalizeClubProfile(
    payload.clubProfile ?? { name: savedUserTeamName },
  );
  const teams = applyClubProfileToTeams(
    payload.teams,
    clubProfile,
    payload.seasonNumber,
  );

  return {
    seasonNumber: payload.seasonNumber,
    currentRound: payload.currentRound,
    userTactic: payload.userTactic,
    clubProfile,
    trainingFocus: payload.trainingFocus ?? "balanced",
    lastTrainingRoundKey: payload.lastTrainingRoundKey,
    trainingHistory: payload.trainingHistory ?? [],
    statusHistory: payload.statusHistory ?? [],
    transferBudget:
      payload.transferBudget ?? getInitialTransferBudget(payload.seasonNumber),
    transferMarket:
      payload.transferMarket ??
      createFreeAgentMarket(payload.seasonNumber, payload.currentRound),
    transferHistory: payload.transferHistory ?? [],
    scoutingReports: payload.scoutingReports ?? [],
    scoutingHistory: payload.scoutingHistory ?? [],
    finance: payload.finance ?? createInitialFinance(payload.seasonNumber),
    financeHistory: payload.financeHistory ?? [],
    youthAcademy:
      payload.youthAcademy ?? createInitialYouthAcademy(payload.seasonNumber),
    youthAcademyHistory: payload.youthAcademyHistory ?? [],
    seasonHistory: payload.seasonHistory ?? [],
    contractHistory: payload.contractHistory ?? [],
    cupState:
      payload.cupState ?? createInitialCupState(teams, payload.seasonNumber),
    cupHistory: payload.cupHistory ?? [],
    boardState:
      payload.boardState ?? createInitialBoardState(payload.seasonNumber),
    teams: teams.map((team) =>
      normalizeTeamContracts(normalizeTeamStatus(team), payload.seasonNumber),
    ),
    fixtures: applyClubProfileToFixtures(payload.fixtures, clubProfile),
    results: applyClubProfileToResults(payload.results, clubProfile),
    standings: payload.standings.map((row) =>
      row.teamId === USER_TEAM_ID
        ? { ...row, teamName: clubProfile.name }
        : row,
    ),
    selectedFixtureId: payload.selectedFixtureId,
  };
}

function getTacticLabel(tactic: Tactic): string {
  return `${tactic.formation} / ${tactic.mentality} / ${tactic.pressing}`;
}

function getTrainingRoundKey(seasonNumber: number, round: number): string {
  return `s${seasonNumber}:r${round}`;
}

function getObjectiveStatusLabel(status: string): string {
  if (status === "on_track") return "On track";
  if (status === "watch") return "Watch";
  return "At risk";
}

function getAlertSeverityLabel(severity: string): string {
  if (severity === "danger") return "Urgent";
  if (severity === "warning") return "Atentie";
  return "Info";
}

function getBoardStatusClass(status: string): string {
  if (
    [
      "completed",
      "on_track",
      "secure",
      "stable",
      "delighted",
      "satisfied",
    ].includes(status)
  )
    return "ok";
  if (["warning", "under_pressure", "neutral", "concerned"].includes(status))
    return "warning";
  return "danger";
}

function updateUserTeamInFutureFixtures(
  fixtures: Fixture[],
  updatedUserTeam: Team,
): Fixture[] {
  return fixtures.map((fixture) => {
    if (fixture.played) return fixture;

    return {
      ...fixture,
      homeTeam:
        fixture.homeTeam.id === USER_TEAM_ID
          ? updatedUserTeam
          : fixture.homeTeam,
      awayTeam:
        fixture.awayTeam.id === USER_TEAM_ID
          ? updatedUserTeam
          : fixture.awayTeam,
    };
  });
}

function createInitialGameFromStoredSession(): GameState {
  const storedSession = getStoredAuthSession();
  if (!storedSession) return createNewGame();

  const localPayload = loadFromLocalStorage(storedSession.user.id);
  return localPayload ? gameFromPayload(localPayload) : createNewGame();
}

function shouldRequireClubSetupFromStoredSession(): boolean {
  const storedSession = getStoredAuthSession();
  if (!storedSession) return false;

  return !loadFromLocalStorage(storedSession.user.id);
}

function getBlankClubDraft(): ClubProfile {
  return {
    name: "",
    city: "",
    primaryColor: DEFAULT_CLUB_PROFILE.primaryColor,
    secondaryColor: DEFAULT_CLUB_PROFILE.secondaryColor,
  };
}

function evaluateBoardForGame(
  game: GameState,
  forceReview = false,
): BoardState {
  const maxRound = getMaxRound(game.fixtures);

  return evaluateBoard({
    board: game.boardState,
    team: getUserTeam(game.teams),
    standings: game.standings,
    finance: game.finance,
    transferBudget: game.transferBudget,
    academyLevel: game.youthAcademy.level,
    cupState: game.cupState,
    seasonNumber: game.seasonNumber,
    currentRound: game.currentRound,
    maxRound,
    seasonFinished: game.currentRound > maxRound,
    forceReview,
  }).board;
}

function estimateJsonSizeBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

export default function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(() =>
    getStoredAuthSession(),
  );
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [game, setGame] = useState<GameState>(() =>
    createInitialGameFromStoredSession(),
  );
  const [clubSetupRequired, setClubSetupRequired] = useState(() =>
    shouldRequireClubSetupFromStoredSession(),
  );
  const [clubDraft, setClubDraft] = useState<ClubProfile>(() =>
    getBlankClubDraft(),
  );
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("");
  const [errorMessage, setErrorMessage] = useState("");
  const [adminExportText, setAdminExportText] = useState("");

  const maxRound = useMemo(() => getMaxRound(game.fixtures), [game.fixtures]);
  const seasonFinished = game.currentRound > maxRound;
  const trainingRoundKey = getTrainingRoundKey(
    game.seasonNumber,
    game.currentRound,
  );
  const trainingDoneThisRound = game.lastTrainingRoundKey === trainingRoundKey;
  const userTeam = useMemo(() => getUserTeam(game.teams), [game.teams]);
  const userAverageFitness = getAverageFitness(userTeam);
  const unavailablePlayers = getUnavailablePlayers(userTeam);
  const injuredPlayers = userTeam.players.filter(isPlayerInjured);
  const lowFitnessPlayers = userTeam.players.filter(
    (player) => !isPlayerInjured(player) && (player.fitness ?? 100) < 55,
  );
  const squadValue = userTeam.players.reduce(
    (sum, player) => sum + estimatePlayerValue(player),
    0,
  );
  const wageBill = calculateSquadWageBill(userTeam);
  const contractRiskSummary = getContractRiskSummary(
    userTeam,
    game.seasonNumber,
  );
  const expiringContracts = userTeam.players.filter(
    (player) => getContractStatus(player, game.seasonNumber) === "expiring",
  );
  const expiredContracts = userTeam.players.filter(
    (player) => getContractStatus(player, game.seasonNumber) === "expired",
  );
  const unhappyContracts = userTeam.players.filter(
    (player) => getContractStatus(player, game.seasonNumber) === "unhappy",
  );
  const latestContractRecord = game.contractHistory[0];
  const wageBudgetStatus = getWageBudgetStatus(game.finance, userTeam);
  const latestFinanceReport = game.financeHistory[0];
  const latestAcademyRecord = game.youthAcademyHistory[0];
  const latestSeasonRecord = game.seasonHistory[0];
  const academyRoundCost = getAcademyRoundCost(game.youthAcademy);
  const academyUpgradeCost = getAcademyUpgradeCost(game.youthAcademy);
  const scoutingCost = getScoutingCost(game.youthAcademy);
  const academyRoundKey = getAcademyRoundKey(
    game.seasonNumber,
    game.currentRound,
  );
  const scoutingDoneThisRound =
    game.youthAcademy.lastScoutRoundKey === academyRoundKey;
  const projectedSeasonWageCost =
    wageBill * Math.max(0, maxRound - game.currentRound + 1);
  const affordableMarketPlayers = game.transferMarket.filter(
    (player) => player.value <= game.transferBudget,
  );
  const latestTransfer = game.transferHistory[0];
  const latestScoutingRecord = game.scoutingHistory[0];
  const topScoutReports = getTopScoutRecommendations(game.scoutingReports, 5);
  const unscoutedMarketPlayers = game.transferMarket.filter(
    (player) => !getScoutReportForPlayer(game.scoutingReports, player.id),
  );
  const scoutingSpend = game.scoutingHistory.reduce(
    (sum, report) => sum + report.scoutCost,
    0,
  );
  const latestStatusReport = game.statusHistory[0];
  const userStanding =
    game.standings.find((row) => row.teamId === USER_TEAM_ID) ??
    game.standings[0];
  const userClubPosition =
    game.standings.findIndex((row) => row.teamId === USER_TEAM_ID) + 1 || 1;
  const selectedMatch = game.selectedFixtureId
    ? getResultForFixture(game.results, game.selectedFixtureId)
    : game.results[game.results.length - 1];
  const selectedMatchAnalysis = selectedMatch
    ? buildMatchAnalysis(selectedMatch, game.userTactic)
    : undefined;
  const nextUserFixture = seasonFinished
    ? undefined
    : getRoundFixtures(game.fixtures, game.currentRound).find(
        (fixture) =>
          fixture.homeTeam.id === USER_TEAM_ID ||
          fixture.awayTeam.id === USER_TEAM_ID,
      );
  const nextMatchPreview = nextUserFixture
    ? buildMatchPreview(nextUserFixture, game.userTactic)
    : undefined;
  const currentCupRoundName = getCurrentCupRoundName(game.cupState);
  const userCupMatch = getUserCupMatch(game.cupState);
  const userStillInCup = isUserStillInCup(game.cupState);
  const latestCupRecord = game.cupHistory[0];
  const latestBoardReview = game.boardState.reviews[0];
  const failedBoardObjectives = game.boardState.objectives.filter(
    (objective) => objective.status === "failed",
  ).length;
  const boardWarnings = latestBoardReview?.warnings ?? [];
  const localSaveAvailable = authSession
    ? Boolean(loadFromLocalStorage(authSession.user.id))
    : false;
  const uiExperience = useMemo(
    () =>
      buildUiExperience({
        hasSavedLocal: localSaveAvailable,
        supabaseConfigured: isSupabaseConfigured(),
        resultsCount: game.results.length,
        trainingDoneThisRound,
        transferHistoryCount: game.transferHistory.length,
        hasAcademyProspects: game.youthAcademy.prospects.length > 0,
        boardReviewsCount: game.boardState.reviews.length,
        cupMatchesPlayed: game.cupHistory.length,
        seasonFinished,
      }),
    [
      localSaveAvailable,
      game.results.length,
      trainingDoneThisRound,
      game.transferHistory.length,
      game.youthAcademy.prospects.length,
      game.boardState.reviews.length,
      game.cupHistory.length,
      seasonFinished,
      saveStatus,
    ],
  );

  const betaReadiness = useMemo(
    () =>
      buildBetaReadiness({
        authenticated: Boolean(authSession),
        supabaseConfigured: isSupabaseConfigured(),
        localSaveAvailable,
        hasCloudSave: Boolean(
          authSession &&
          isSupabaseConfigured() &&
          (saveStatus.includes("Supabase") || saveStatus.includes("cloud")),
        ),
        onboardingPercent: uiExperience.completionPercent,
        resultsCount: game.results.length,
        seasonHistoryCount: game.seasonHistory.length,
        squadSize: userTeam.players.length,
        transferHistoryCount: game.transferHistory.length,
        financeHistoryCount: game.financeHistory.length,
        boardReviewsCount: game.boardState.reviews.length,
        cupHistoryCount: game.cupHistory.length,
        helpArticlesCount: uiExperience.helpArticles.length,
        cashBalance: game.finance.cashBalance,
        wageBudgetStatus,
        jobSecurity: game.boardState.jobSecurity,
        sackRiskPercent: game.boardState.sackRiskPercent,
        injuredPlayersCount: injuredPlayers.length,
        lowFitnessPlayersCount: lowFitnessPlayers.length,
      }),
    [
      authSession,
      localSaveAvailable,
      saveStatus,
      uiExperience.completionPercent,
      uiExperience.helpArticles.length,
      game.results.length,
      game.seasonHistory.length,
      userTeam.players.length,
      game.transferHistory.length,
      game.financeHistory.length,
      game.boardState.reviews.length,
      game.cupHistory.length,
      game.finance.cashBalance,
      wageBudgetStatus,
      game.boardState.jobSecurity,
      game.boardState.sackRiskPercent,
      injuredPlayers.length,
      lowFitnessPlayers.length,
    ],
  );

  const cloudSaveLikelyAvailable = Boolean(
    authSession &&
      isSupabaseConfigured() &&
      (saveStatus.includes("Supabase") || saveStatus.includes("cloud")),
  );

  const liveDeployQa = useMemo(
    () =>
      buildLiveDeployQa({
        appVersion: APP_VERSION,
        authenticated: Boolean(authSession),
        supabaseConfigured: isSupabaseConfigured(),
        localSaveAvailable,
        cloudSaveLikelyAvailable,
        hasClubCreated:
          game.clubProfile.name !== DEFAULT_CLUB_PROFILE.name ||
          Boolean(localSaveAvailable),
        resultsCount: game.results.length,
        seasonHistoryCount: game.seasonHistory.length,
        boardReviewsCount: game.boardState.reviews.length,
        currentRound: game.currentRound,
        maxRound,
        lastSaveStatus: saveStatus,
        lastError: errorMessage,
        userId: authSession?.user.id,
      }),
    [
      authSession,
      localSaveAvailable,
      cloudSaveLikelyAvailable,
      game.clubProfile.name,
      game.results.length,
      game.seasonHistory.length,
      game.boardState.reviews.length,
      game.currentRound,
      maxRound,
      saveStatus,
      errorMessage,
    ],
  );

  const currentSavePayload = useMemo(
    () => getSavePayload(game, authSession?.user.id ?? "anonymous"),
    [game, authSession],
  );
  const adminSavePayloadBytes = useMemo(
    () => estimateJsonSizeBytes(currentSavePayload),
    [currentSavePayload],
  );
  const adminDebug = useMemo(
    () =>
      buildAdminDebugPanel({
        appVersion: APP_VERSION,
        authenticated: Boolean(authSession),
        managerId: authSession?.user.id,
        supabaseConfigured: isSupabaseConfigured(),
        localSaveAvailable,
        cloudSaveLikelyAvailable,
        seasonNumber: game.seasonNumber,
        currentRound: game.currentRound,
        maxRound,
        teamsCount: game.teams.length,
        fixturesCount: game.fixtures.length,
        resultsCount: game.results.length,
        standingsCount: game.standings.length,
        userTeam,
        cashBalance: game.finance.cashBalance,
        wageBudget: game.finance.wageBudget,
        transferBudget: game.transferBudget,
        trainingHistoryCount: game.trainingHistory.length,
        transferHistoryCount: game.transferHistory.length,
        financeHistoryCount: game.financeHistory.length,
        academyProspectsCount: game.youthAcademy.prospects.length,
        seasonHistoryCount: game.seasonHistory.length,
        cupHistoryCount: game.cupHistory.length,
        boardReviewsCount: game.boardState.reviews.length,
        scoutingReportsCount: game.scoutingReports.length,
        lastSaveStatus: saveStatus,
        lastError: errorMessage,
        savePayloadBytes: adminSavePayloadBytes,
      }),
    [
      authSession,
      localSaveAvailable,
      cloudSaveLikelyAvailable,
      game.seasonNumber,
      game.currentRound,
      maxRound,
      game.teams.length,
      game.fixtures.length,
      game.results.length,
      game.standings.length,
      userTeam,
      game.finance.cashBalance,
      game.finance.wageBudget,
      game.transferBudget,
      game.trainingHistory.length,
      game.transferHistory.length,
      game.financeHistory.length,
      game.youthAcademy.prospects.length,
      game.seasonHistory.length,
      game.cupHistory.length,
      game.boardState.reviews.length,
      game.scoutingReports.length,
      saveStatus,
      errorMessage,
      adminSavePayloadBytes,
    ],
  );

  const importantEvents =
    selectedMatch?.result.events.filter((event) =>
      [
        "kickoff",
        "goal",
        "shot",
        "shot_on_target",
        "yellow_card",
        "injury",
        "full_time",
      ].includes(event.type),
    ) ?? [];

  const teamStrength = useMemo(
    () => calculateTeamStrength(userTeam, game.userTactic),
    [userTeam, game.userTactic],
  );
  const managerDashboard = useMemo(
    () =>
      buildManagerDashboard({
        team: userTeam,
        tactic: game.userTactic,
        standings: game.standings,
        finance: game.finance,
        transferBudget: game.transferBudget,
        academyLevel: game.youthAcademy.level,
        currentRound: game.currentRound,
        maxRound,
        seasonFinished,
      }),
    [
      userTeam,
      game.userTactic,
      game.standings,
      game.finance,
      game.transferBudget,
      game.youthAcademy.level,
      game.currentRound,
      maxRound,
      seasonFinished,
    ],
  );

  function setTemporaryStatus(status: SaveStatus) {
    setSaveStatus(status);
    setErrorMessage("");
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthStatus("");
    setAuthError("");

    try {
      if (authPassword.length < 6) {
        throw new Error("Parola trebuie sa aiba minimum 6 caractere.");
      }

      if (authMode === "register") {
        const result = await registerWithEmail(authEmail.trim(), authPassword);
        setAuthStatus(result.message);

        if (result.session) {
          setAuthSession(result.session);
          const localPayload = loadFromLocalStorage(result.session.user.id);
          setGame(
            localPayload ? gameFromPayload(localPayload) : createNewGame(),
          );
          setClubSetupRequired(!localPayload);
          setClubDraft(getBlankClubDraft());
        }
      } else {
        const session = await loginWithEmail(authEmail.trim(), authPassword);
        setAuthSession(session);
        const localPayload = loadFromLocalStorage(session.user.id);
        setGame(localPayload ? gameFromPayload(localPayload) : createNewGame());
        setClubSetupRequired(!localPayload);
        setClubDraft(getBlankClubDraft());
        setAuthStatus("Login reusit.");
      }
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Autentificarea a esuat.",
      );
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    if (!authSession) return;

    try {
      await logoutFromSupabase(authSession.accessToken);
    } catch {
      // Local session is cleared by logoutFromSupabase even if the network call fails.
    } finally {
      setAuthSession(null);
      setGame(createNewGame());
      setClubSetupRequired(false);
      setClubDraft(getBlankClubDraft());
      setSaveStatus("");
      setErrorMessage("");
      setAuthPassword("");
      setActiveTab("dashboard");
    }
  }

  function simulateNextRound() {
    if (seasonFinished) return;

    setGame((previous) => {
      const simulation = simulateRound(
        previous.fixtures,
        previous.standings,
        previous.currentRound,
        previous.seasonNumber,
        previous.userTactic,
        previous.teams,
      );

      const nextResults = [...previous.results, ...simulation.roundResults];
      const lastFixtureId =
        simulation.roundResults[simulation.roundResults.length - 1]?.fixture
          .id ?? previous.selectedFixtureId;
      const updatedUserTeam = getUserTeam(simulation.updatedTeams);
      const financeUpdate = applyRoundFinances({
        finance: previous.finance,
        userTeam: updatedUserTeam,
        roundResults: simulation.roundResults,
        standings: simulation.updatedStandings,
        seasonNumber: previous.seasonNumber,
        round: previous.currentRound,
        academyCost: getAcademyRoundCost(previous.youthAcademy),
      });

      const nextState: GameState = {
        ...previous,
        currentRound: previous.currentRound + 1,
        teams: simulation.updatedTeams,
        fixtures: simulation.updatedFixtures,
        results: nextResults,
        standings: simulation.updatedStandings,
        statusHistory: [
          simulation.statusReport,
          ...previous.statusHistory,
        ].slice(0, 12),
        finance: financeUpdate.finance,
        financeHistory: [
          financeUpdate.report,
          ...previous.financeHistory,
        ].slice(0, 24),
        selectedFixtureId: lastFixtureId,
      };

      return {
        ...nextState,
        boardState: evaluateBoardForGame(nextState, true),
      };
    });

    setActiveTab("match");
  }

  function simulateAllRemainingRounds() {
    if (seasonFinished) return;

    setGame((previous) => {
      let nextTeams = previous.teams;
      let nextFixtures = previous.fixtures;
      let nextStandings = previous.standings;
      let nextResults = [...previous.results];
      let nextStatusHistory = [...previous.statusHistory];
      let nextFinance = previous.finance;
      let nextFinanceHistory = [...previous.financeHistory];
      let round = previous.currentRound;
      let lastFixtureId = previous.selectedFixtureId;
      const finalRound = getMaxRound(previous.fixtures);

      while (round <= finalRound) {
        const simulation = simulateRound(
          nextFixtures,
          nextStandings,
          round,
          previous.seasonNumber,
          previous.userTactic,
          nextTeams,
        );

        const updatedUserTeam = getUserTeam(simulation.updatedTeams);
        const financeUpdate = applyRoundFinances({
          finance: nextFinance,
          userTeam: updatedUserTeam,
          roundResults: simulation.roundResults,
          standings: simulation.updatedStandings,
          seasonNumber: previous.seasonNumber,
          round,
          academyCost: getAcademyRoundCost(previous.youthAcademy),
        });

        nextTeams = simulation.updatedTeams;
        nextFixtures = simulation.updatedFixtures;
        nextStandings = simulation.updatedStandings;
        nextResults = [...nextResults, ...simulation.roundResults];
        nextStatusHistory = [
          simulation.statusReport,
          ...nextStatusHistory,
        ].slice(0, 12);
        nextFinance = financeUpdate.finance;
        nextFinanceHistory = [
          financeUpdate.report,
          ...nextFinanceHistory,
        ].slice(0, 24);
        lastFixtureId =
          simulation.roundResults[simulation.roundResults.length - 1]?.fixture
            .id ?? lastFixtureId;
        round += 1;
      }

      const nextState: GameState = {
        ...previous,
        currentRound: finalRound + 1,
        teams: nextTeams,
        fixtures: nextFixtures,
        results: nextResults,
        standings: nextStandings,
        statusHistory: nextStatusHistory,
        finance: nextFinance,
        financeHistory: nextFinanceHistory,
        selectedFixtureId: lastFixtureId,
      };

      return {
        ...nextState,
        boardState: evaluateBoardForGame(nextState, true),
      };
    });

    setActiveTab("standings");
  }

  function startNewSeason() {
    if (!seasonFinished) {
      setErrorMessage("Termina sezonul curent inainte sa incepi unul nou.");
      setSaveStatus("");
      return;
    }

    setGame((previous) => {
      const nextSeason = prepareNextSeason({
        currentSeasonNumber: previous.seasonNumber,
        teams: previous.teams,
        standings: previous.standings,
        finance: previous.finance,
      });
      const namedTeams = applyClubProfileToTeams(
        nextSeason.teams,
        previous.clubProfile,
        nextSeason.seasonNumber,
      );
      const userTeamAfterProgression = getUserTeam(namedTeams);
      const contractResolution = releaseExpiredContractPlayers({
        team: userTeamAfterProgression,
        nextSeasonNumber: nextSeason.seasonNumber,
      });
      const finalTeams = namedTeams.map((team) =>
        team.id === USER_TEAM_ID ? contractResolution.team : team,
      );
      const finalFixtures = generateFixtures(finalTeams);
      const finalStandings = createInitialStandings(finalTeams).map((row) =>
        row.teamId === USER_TEAM_ID
          ? { ...row, teamName: previous.clubProfile.name }
          : row,
      );

      return {
        ...previous,
        seasonNumber: nextSeason.seasonNumber,
        currentRound: 1,
        lastTrainingRoundKey: undefined,
        trainingHistory: previous.trainingHistory.slice(0, 8),
        statusHistory: [],
        transferBudget: nextSeason.transferBudget,
        transferMarket: createFreeAgentMarket(nextSeason.seasonNumber, 1),
        scoutingReports: [],
        scoutingHistory: previous.scoutingHistory.slice(0, 12),
        finance: nextSeason.finance,
        financeHistory: previous.financeHistory.slice(0, 8),
        youthAcademy: {
          ...previous.youthAcademy,
          lastScoutRoundKey: undefined,
        },
        youthAcademyHistory: previous.youthAcademyHistory.slice(0, 12),
        seasonHistory: [
          nextSeason.seasonRecord,
          ...previous.seasonHistory,
        ].slice(0, 12),
        contractHistory: [
          ...contractResolution.records,
          ...previous.contractHistory,
        ].slice(0, 24),
        cupState: createInitialCupState(finalTeams, nextSeason.seasonNumber),
        cupHistory: previous.cupHistory.slice(0, 12),
        boardState: createInitialBoardState(
          nextSeason.seasonNumber,
          previous.boardState.managerReputation,
        ),
        teams: finalTeams,
        fixtures: applyClubProfileToFixtures(
          finalFixtures,
          previous.clubProfile,
        ),
        results: [],
        standings: finalStandings,
        selectedFixtureId: undefined,
      };
    });
    setTemporaryStatus(
      "Sezon nou creat. Lotul a imbatranit cu un an, accidentarile au fost resetate, contractele expirate au fost procesate si ai primit prize money.",
    );
    setErrorMessage("");
    setActiveTab("seasons");
  }

  function simulateNextCupRound() {
    if (game.cupState.status === "completed") {
      setErrorMessage("Cupa este deja terminata pentru sezonul curent.");
      setSaveStatus("");
      return;
    }

    setGame((previous) => {
      try {
        const cupSimulation = simulateCupRound({
          cupState: previous.cupState,
          teams: previous.teams,
          seasonNumber: previous.seasonNumber,
          userTactic: previous.userTactic,
        });

        const nextFinance =
          cupSimulation.prizeMoney > 0
            ? {
                ...previous.finance,
                cashBalance:
                  previous.finance.cashBalance + cupSimulation.prizeMoney,
              }
            : previous.finance;

        setTemporaryStatus(cupSimulation.record.summary);

        const nextState: GameState = {
          ...previous,
          cupState: cupSimulation.cupState,
          cupHistory: [cupSimulation.record, ...previous.cupHistory].slice(
            0,
            16,
          ),
          teams: cupSimulation.teams,
          fixtures: updateUserTeamInFutureFixtures(
            previous.fixtures,
            getUserTeam(cupSimulation.teams),
          ),
          statusHistory: [
            cupSimulation.statusReport,
            ...previous.statusHistory,
          ].slice(0, 12),
          finance: nextFinance,
        };

        return {
          ...nextState,
          boardState: evaluateBoardForGame(nextState, true),
        };
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Runda de cupa nu a putut fi simulata.",
        );
        setSaveStatus("");
        return previous;
      }
    });

    setActiveTab("cup");
  }

  function runBoardReview() {
    setGame((previous) => ({
      ...previous,
      boardState: evaluateBoardForGame(previous, true),
    }));
    setActiveTab("board");
    setTemporaryStatus(
      "Board review actualizat pentru starea curenta a clubului.",
    );
  }

  function updateTrainingFocus(focus: TrainingFocus) {
    setGame((previous) => ({
      ...previous,
      trainingFocus: focus,
    }));
  }

  function runTrainingSession() {
    if (seasonFinished) {
      setErrorMessage(
        "Sezonul este terminat. Incepe un sezon nou pentru alte antrenamente.",
      );
      setSaveStatus("");
      return;
    }

    if (trainingDoneThisRound) {
      setErrorMessage("Ai facut deja antrenamentul pentru runda curenta.");
      setSaveStatus("");
      return;
    }

    setGame((previous) => {
      const updatedRoundKey = getTrainingRoundKey(
        previous.seasonNumber,
        previous.currentRound,
      );
      if (previous.lastTrainingRoundKey === updatedRoundKey) return previous;

      const currentUserTeam = getUserTeam(previous.teams);
      const { team: trainedUserTeam, result } = runTeamTraining(
        currentUserTeam,
        previous.trainingFocus,
        previous.seasonNumber,
        previous.currentRound,
      );

      return {
        ...previous,
        teams: previous.teams.map((team) =>
          team.id === USER_TEAM_ID ? trainedUserTeam : team,
        ),
        fixtures: updateUserTeamInFutureFixtures(
          previous.fixtures,
          trainedUserTeam,
        ),
        lastTrainingRoundKey: updatedRoundKey,
        trainingHistory: [result, ...previous.trainingHistory].slice(0, 10),
      };
    });

    setActiveTab("training");
    setTemporaryStatus(
      "Antrenamentul rundei a fost aplicat. Salveaza progresul ca sa il pastrezi.",
    );
  }

  function refreshTransferMarket() {
    setGame((previous) => ({
      ...previous,
      transferMarket: createFreeAgentMarket(
        previous.seasonNumber,
        previous.currentRound,
      ),
    }));
    setActiveTab("transfers");
    setTemporaryStatus(
      "Lista de free agents a fost actualizata pentru runda curenta.",
    );
  }

  function handleScoutMarketPlayer(playerId: string) {
    setGame((previous) => {
      const player = previous.transferMarket.find(
        (item) => item.id === playerId,
      );
      if (!player) {
        setErrorMessage("Jucatorul nu mai este disponibil pentru scouting.");
        setSaveStatus("");
        return previous;
      }

      const scoutCost = getMarketScoutingCost(player);
      if (previous.finance.cashBalance < scoutCost) {
        setErrorMessage("Cash insuficient pentru raportul de scouting.");
        setSaveStatus("");
        return previous;
      }

      const report = buildScoutReport({
        player,
        team: getUserTeam(previous.teams),
        tactic: previous.userTactic,
        transferBudget: previous.transferBudget,
        finance: previous.finance,
        seasonNumber: previous.seasonNumber,
        round: previous.currentRound,
      });

      setTemporaryStatus(
        `Raport scouting generat pentru ${report.playerName}: ${getRecommendationLabel(report.recommendation)}.`,
      );

      return {
        ...previous,
        finance: {
          ...previous.finance,
          cashBalance: previous.finance.cashBalance - report.scoutCost,
        },
        scoutingReports: upsertScoutReport(previous.scoutingReports, report),
        scoutingHistory: [
          report,
          ...previous.scoutingHistory.filter((item) => item.id !== report.id),
        ].slice(0, 24),
      };
    });

    setActiveTab("scouting");
  }

  function handleBuyPlayer(playerId: string) {
    setGame((previous) => {
      const currentUserTeam = getUserTeam(previous.teams);
      const marketPlayer = previous.transferMarket.find(
        (player) => player.id === playerId,
      );
      if (!marketPlayer) {
        setErrorMessage("Jucatorul nu mai este disponibil in piata.");
        setSaveStatus("");
        return previous;
      }

      try {
        const transfer = buyMarketPlayer(
          currentUserTeam,
          marketPlayer,
          previous.transferBudget,
          previous.seasonNumber,
          previous.currentRound,
        );

        setTemporaryStatus(
          `${transfer.record.playerName} a semnat cu ${previous.clubProfile.name}.`,
        );

        return {
          ...previous,
          transferBudget: transfer.budget,
          transferMarket: previous.transferMarket.filter(
            (player) => player.id !== playerId,
          ),
          transferHistory: [transfer.record, ...previous.transferHistory].slice(
            0,
            20,
          ),
          teams: previous.teams.map((team) =>
            team.id === USER_TEAM_ID ? transfer.team : team,
          ),
          fixtures: updateUserTeamInFutureFixtures(
            previous.fixtures,
            transfer.team,
          ),
        };
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Transferul nu a putut fi finalizat.",
        );
        setSaveStatus("");
        return previous;
      }
    });

    setActiveTab("transfers");
  }

  function handleSellPlayer(playerId: string) {
    setGame((previous) => {
      const currentUserTeam = getUserTeam(previous.teams);

      try {
        const transfer = sellSquadPlayer(
          currentUserTeam,
          playerId,
          previous.transferBudget,
          previous.seasonNumber,
          previous.currentRound,
        );

        setTemporaryStatus(
          `${transfer.record.playerName} a fost vandut pentru ${formatMoney(transfer.record.value)}.`,
        );

        return {
          ...previous,
          transferBudget: transfer.budget,
          transferHistory: [transfer.record, ...previous.transferHistory].slice(
            0,
            20,
          ),
          teams: previous.teams.map((team) =>
            team.id === USER_TEAM_ID ? transfer.team : team,
          ),
          fixtures: updateUserTeamInFutureFixtures(
            previous.fixtures,
            transfer.team,
          ),
        };
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Jucatorul nu a putut fi vandut.",
        );
        setSaveStatus("");
        return previous;
      }
    });

    setActiveTab("transfers");
  }

  function handleRenewContract(playerId: string) {
    setGame((previous) => {
      const currentUserTeam = getUserTeam(previous.teams);

      try {
        const renewal = renewPlayerContract({
          team: currentUserTeam,
          finance: previous.finance,
          playerId,
          seasonNumber: previous.seasonNumber,
          round: previous.currentRound,
        });

        setTemporaryStatus(renewal.record.summary);

        return {
          ...previous,
          finance: renewal.finance,
          contractHistory: [renewal.record, ...previous.contractHistory].slice(
            0,
            24,
          ),
          teams: previous.teams.map((team) =>
            team.id === USER_TEAM_ID ? renewal.team : team,
          ),
          fixtures: updateUserTeamInFutureFixtures(
            previous.fixtures,
            renewal.team,
          ),
        };
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Contractul nu a putut fi reinnoit.",
        );
        setSaveStatus("");
        return previous;
      }
    });

    setActiveTab("contracts");
  }

  function handleReleaseContractPlayer(playerId: string) {
    setGame((previous) => {
      const currentUserTeam = getUserTeam(previous.teams);

      try {
        const release = releasePlayerFromContract({
          team: currentUserTeam,
          playerId,
          seasonNumber: previous.seasonNumber,
          round: previous.currentRound,
        });

        setTemporaryStatus(release.record.summary);

        return {
          ...previous,
          contractHistory: [release.record, ...previous.contractHistory].slice(
            0,
            24,
          ),
          teams: previous.teams.map((team) =>
            team.id === USER_TEAM_ID ? release.team : team,
          ),
          fixtures: updateUserTeamInFutureFixtures(
            previous.fixtures,
            release.team,
          ),
        };
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Jucatorul nu a putut fi eliberat.",
        );
        setSaveStatus("");
        return previous;
      }
    });

    setActiveTab("contracts");
  }

  function handleScoutYouth() {
    if (seasonFinished) {
      setErrorMessage(
        "Sezonul este terminat. Incepe un sezon nou pentru scouting.",
      );
      setSaveStatus("");
      return;
    }

    if (scoutingDoneThisRound) {
      setErrorMessage("Ai facut deja scouting in runda curenta.");
      setSaveStatus("");
      return;
    }

    setGame((previous) => {
      const cost = getScoutingCost(previous.youthAcademy);
      if (previous.finance.cashBalance < cost) {
        setErrorMessage("Cash insuficient pentru scouting academy.");
        setSaveStatus("");
        return previous;
      }

      const scouting = scoutYouthProspects(
        previous.youthAcademy,
        previous.seasonNumber,
        previous.currentRound,
      );
      setTemporaryStatus("Raport nou de scouting generat pentru academia ta.");

      return {
        ...previous,
        finance: {
          ...previous.finance,
          cashBalance: previous.finance.cashBalance - scouting.record.cost,
        },
        youthAcademy: scouting.academy,
        youthAcademyHistory: [
          scouting.record,
          ...previous.youthAcademyHistory,
        ].slice(0, 24),
      };
    });

    setActiveTab("academy");
  }

  function handlePromoteYouthPlayer(prospectId: string) {
    setGame((previous) => {
      const currentUserTeam = getUserTeam(previous.teams);

      try {
        const promotion = promoteYouthProspect(
          currentUserTeam,
          previous.youthAcademy,
          prospectId,
          previous.seasonNumber,
          previous.currentRound,
        );

        if (previous.finance.cashBalance < promotion.cost) {
          throw new Error("Cash insuficient pentru promovarea acestui junior.");
        }

        setTemporaryStatus(
          `${promotion.record.playerName} a fost promovat in lotul mare.`,
        );

        return {
          ...previous,
          finance: {
            ...previous.finance,
            cashBalance: previous.finance.cashBalance - promotion.cost,
          },
          youthAcademy: promotion.academy,
          youthAcademyHistory: [
            promotion.record,
            ...previous.youthAcademyHistory,
          ].slice(0, 24),
          teams: previous.teams.map((team) =>
            team.id === USER_TEAM_ID ? promotion.team : team,
          ),
          fixtures: updateUserTeamInFutureFixtures(
            previous.fixtures,
            promotion.team,
          ),
        };
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Juniorul nu a putut fi promovat.",
        );
        setSaveStatus("");
        return previous;
      }
    });

    setActiveTab("academy");
  }

  function handleUpgradeYouthAcademy() {
    setGame((previous) => {
      try {
        const upgrade = upgradeYouthAcademy(
          previous.youthAcademy,
          previous.seasonNumber,
          previous.currentRound,
        );

        if (previous.finance.cashBalance < upgrade.cost) {
          throw new Error("Cash insuficient pentru upgrade la academie.");
        }

        setTemporaryStatus(
          `Academia a ajuns la nivelul ${upgrade.academy.level}.`,
        );

        return {
          ...previous,
          finance: {
            ...previous.finance,
            cashBalance: previous.finance.cashBalance - upgrade.cost,
          },
          youthAcademy: upgrade.academy,
          youthAcademyHistory: [
            upgrade.record,
            ...previous.youthAcademyHistory,
          ].slice(0, 24),
        };
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Academia nu a putut fi imbunatatita.",
        );
        setSaveStatus("");
        return previous;
      }
    });

    setActiveTab("academy");
  }

  function updateTactic<Key extends keyof Tactic>(
    key: Key,
    value: Tactic[Key],
  ) {
    setGame((previous) => ({
      ...previous,
      userTactic: {
        ...previous.userTactic,
        [key]: value,
      },
    }));
  }

  function updateClubDraft<Key extends keyof ClubProfile>(
    key: Key,
    value: ClubProfile[Key],
  ) {
    setClubDraft((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function handleCreateClub(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!authSession) {
      setErrorMessage("Trebuie sa fii logat ca sa creezi clubul.");
      return;
    }

    const normalizedClubProfile = normalizeClubProfile(clubDraft);
    if (normalizedClubProfile.name.length < 2) {
      setErrorMessage("Numele clubului trebuie sa aiba minimum 2 caractere.");
      setSaveStatus("");
      return;
    }

    const nextGame = createNewGame(normalizedClubProfile, 1, defaultUserTactic);
    setGame(nextGame);
    saveToLocalStorage(
      authSession.user.id,
      getSavePayload(nextGame, authSession.user.id),
    );
    setClubSetupRequired(false);
    setActiveTab("dashboard");
    setTemporaryStatus("Club creat si salvat local pentru contul tau.");
  }

  function openMatch(fixtureId: string) {
    const result = getResultForFixture(game.results, fixtureId);
    if (!result) return;

    setGame((previous) => ({ ...previous, selectedFixtureId: fixtureId }));
    setActiveTab("match");
  }

  function handleSaveLocal() {
    if (!authSession) {
      setErrorMessage("Trebuie sa fii logat ca sa salvezi progresul.");
      setSaveStatus("");
      return;
    }

    saveToLocalStorage(
      authSession.user.id,
      getSavePayload(game, authSession.user.id),
    );
    setTemporaryStatus("Salvat local pentru contul tau.");
  }

  function handleLoadLocal() {
    if (!authSession) {
      setErrorMessage("Trebuie sa fii logat ca sa incarci progresul.");
      setSaveStatus("");
      return;
    }

    const payload = loadFromLocalStorage(authSession.user.id);
    if (!payload) {
      setErrorMessage("Nu exista inca o salvare locala pentru acest user.");
      setSaveStatus("");
      return;
    }

    setGame(gameFromPayload(payload));
    setClubSetupRequired(false);
    setTemporaryStatus("Progres incarcat local pentru contul tau.");
  }

  function handleClearLocal() {
    if (!authSession) {
      setErrorMessage("Trebuie sa fii logat ca sa stergi salvarea locala.");
      setSaveStatus("");
      return;
    }

    clearLocalStorageSave(authSession.user.id);
    setTemporaryStatus("Salvarea locala pentru contul tau a fost stearsa.");
  }

  function handleResetCareerLocal() {
    if (!authSession) {
      setErrorMessage("Trebuie sa fii logat ca sa resetezi cariera.");
      setSaveStatus("");
      return;
    }

    clearLocalStorageSave(authSession.user.id);
    setGame(createNewGame());
    setClubSetupRequired(true);
    setClubDraft(getBlankClubDraft());
    setActiveTab("dashboard");
    setTemporaryStatus(
      "Cariera locala a fost resetata. Salvarea Supabase nu a fost stearsa automat.",
    );
  }

  async function handleDeleteSupabaseSave() {
    if (!authSession) {
      setErrorMessage("Trebuie sa fii logat ca sa stergi salvarea Supabase.");
      setSaveStatus("");
      return;
    }

    try {
      await deleteSupabaseSave(authSession.user.id, authSession.accessToken);
      setTemporaryStatus("Salvarea Supabase pentru contul tau a fost stearsa.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nu am putut sterge salvarea din Supabase.",
      );
      setSaveStatus("");
    }
  }

  async function handleSaveSupabase() {
    if (!authSession) {
      setErrorMessage("Trebuie sa fii logat ca sa salvezi in Supabase.");
      setSaveStatus("");
      return;
    }

    try {
      await saveToSupabase(
        authSession.user.id,
        authSession.accessToken,
        getSavePayload(game, authSession.user.id),
      );
      setTemporaryStatus("Salvat in Supabase pentru contul tau.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nu am putut salva in Supabase.",
      );
      setSaveStatus("");
    }
  }

  async function handleLoadSupabase() {
    if (!authSession) {
      setErrorMessage("Trebuie sa fii logat ca sa incarci din Supabase.");
      setSaveStatus("");
      return;
    }

    try {
      const payload = await loadFromSupabase(
        authSession.user.id,
        authSession.accessToken,
      );
      if (!payload) {
        setErrorMessage("Nu exista salvare in Supabase pentru acest user.");
        setSaveStatus("");
        return;
      }

      setGame(gameFromPayload(payload));
      setClubSetupRequired(false);
      setTemporaryStatus("Progres incarcat din Supabase pentru contul tau.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nu am putut incarca din Supabase.",
      );
      setSaveStatus("");
    }
  }

  function handleValidateAdminPayload() {
    try {
      const restoredGame = gameFromPayload(currentSavePayload);
      if (restoredGame.teams.length !== game.teams.length) {
        throw new Error("Numarul de echipe nu se pastreaza dupa restore.");
      }

      setTemporaryStatus(
        `Admin validation OK: save payload restaurabil, ${adminDebug.exportSummary}.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Save payload-ul curent nu a putut fi validat.",
      );
      setSaveStatus("");
    }
  }

  function handleGenerateAdminExport() {
    if (!authSession) {
      setErrorMessage("Trebuie sa fii logat ca sa generezi export debug.");
      setSaveStatus("");
      return;
    }

    const exportPayload = {
      appVersion: APP_VERSION,
      generatedAt: new Date().toISOString(),
      note: "Debug export pentru Football Manager Lite. Nu include parola sau access token.",
      auth: {
        authenticated: true,
        managerId: authSession.user.id,
        email: authSession.user.email,
        accessTokenIncluded: false,
      },
      adminSummary: adminDebug.exportSummary,
      adminReport: adminDebug,
      savePayload: currentSavePayload,
    };

    setAdminExportText(JSON.stringify(exportPayload, null, 2));
    setTemporaryStatus("Export debug generat in panoul Admin.");
  }

  async function handleCopyAdminExport() {
    if (!adminExportText) {
      setErrorMessage("Genereaza mai intai exportul debug.");
      setSaveStatus("");
      return;
    }

    try {
      await navigator.clipboard.writeText(adminExportText);
      setTemporaryStatus("Export debug copiat in clipboard.");
    } catch {
      setErrorMessage(
        "Nu am putut copia automat. Selecteaza manual textul din textarea.",
      );
      setSaveStatus("");
    }
  }

  const nextRoundFixtures = seasonFinished
    ? []
    : getRoundFixtures(game.fixtures, game.currentRound);
  const champion = seasonFinished ? game.standings[0] : undefined;

  if (!authSession) {
    return (
      <main className="page auth-page">
        <section className="auth-shell panel">
          <div>
            <p className="eyebrow">Football Manager Lite</p>
            <h1>Manager Career</h1>
            <p className="description">
              Creeaza cont sau intra in cont ca salvarea sa fie separata pentru
              fiecare manager.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            <div className="auth-mode-switch" aria-label="Auth mode">
              <button
                type="button"
                className={authMode === "login" ? "tab active" : "tab"}
                onClick={() => {
                  setAuthMode("login");
                  setAuthStatus("");
                  setAuthError("");
                }}
              >
                Login
              </button>
              <button
                type="button"
                className={authMode === "register" ? "tab active" : "tab"}
                onClick={() => {
                  setAuthMode("register");
                  setAuthStatus("");
                  setAuthError("");
                }}
              >
                Register
              </button>
            </div>

            <label>
              Email
              <input
                type="email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                placeholder="manager@email.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                placeholder="minimum 6 caractere"
                required
                minLength={6}
              />
            </label>

            <button
              type="submit"
              disabled={!isSupabaseConfigured() || authLoading}
            >
              {authLoading
                ? "Se proceseaza..."
                : authMode === "login"
                  ? "Login"
                  : "Create account"}
            </button>

            <p className="muted small-note">
              Supabase Auth{" "}
              {isSupabaseConfigured()
                ? "este configurat"
                : "nu este configurat"}
              . Ai nevoie de VITE_SUPABASE_URL si VITE_SUPABASE_ANON_KEY in
              Netlify.
            </p>
            {authStatus && <p className="success-message">{authStatus}</p>}
            {authError && <p className="error-message">{authError}</p>}
          </form>
        </section>
      </main>
    );
  }

  if (clubSetupRequired) {
    return (
      <main className="page auth-page">
        <section className="auth-shell panel club-setup-shell">
          <div>
            <p className="eyebrow">Football Manager Lite</p>
            <h1>Creeaza clubul tau</h1>
            <p className="description">
              Acest club va fi legat de contul tau si va inlocui echipa default
              in lot, program, meciuri si clasament.
            </p>
          </div>

          <form className="auth-form club-form" onSubmit={handleCreateClub}>
            <label>
              Nume club
              <input
                type="text"
                value={clubDraft.name}
                onChange={(event) =>
                  updateClubDraft("name", event.target.value)
                }
                placeholder="Ex: Rapid Voluntari"
                minLength={2}
                maxLength={40}
                required
              />
            </label>

            <label>
              Oras
              <input
                type="text"
                value={clubDraft.city}
                onChange={(event) =>
                  updateClubDraft("city", event.target.value)
                }
                placeholder="Ex: Bucuresti"
                maxLength={40}
              />
            </label>

            <div className="color-grid">
              <label>
                Culoare principala
                <input
                  type="color"
                  value={clubDraft.primaryColor}
                  onChange={(event) =>
                    updateClubDraft("primaryColor", event.target.value)
                  }
                />
              </label>

              <label>
                Culoare secundara
                <input
                  type="color"
                  value={clubDraft.secondaryColor}
                  onChange={(event) =>
                    updateClubDraft("secondaryColor", event.target.value)
                  }
                />
              </label>
            </div>

            <div className="club-preview-card">
              <div
                className="club-badge-preview"
                style={{
                  background: clubDraft.primaryColor,
                  color: clubDraft.secondaryColor,
                }}
              >
                {(clubDraft.name.trim()[0] || "F").toUpperCase()}
              </div>
              <div>
                <strong>{clubDraft.name.trim() || "Numele clubului"}</strong>
                <span>{clubDraft.city.trim() || "Oras necompletat"}</span>
              </div>
            </div>

            <button type="submit">Creeaza club si incepe sezonul</button>

            <div className="save-actions setup-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={handleLoadLocal}
              >
                Incarca salvare locala
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleLoadSupabase}
                disabled={!isSupabaseConfigured()}
              >
                Incarca din Supabase
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>

            <p className="muted small-note">
              Daca ai deja o salvare in cloud, foloseste incarcarea din Supabase
              inainte sa creezi un club nou.
            </p>
            {saveStatus && <p className="success-message">{saveStatus}</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Football Manager Lite</p>
          <h1>Manager Career</h1>
          <p className="description">
            Acum jocul ruleaza etapa cu etapa in browser. Vezi lotul, setezi
            tactica, simulezi runde si salvezi progresul pe contul tau.
          </p>
        </div>
        <div className="hero-actions">
          <div className="user-panel">
            <span>Logat ca</span>
            <strong>{authSession.user.email ?? authSession.user.id}</strong>
          </div>
          <button onClick={simulateNextRound} disabled={seasonFinished}>
            Simuleaza etapa
          </button>
          <button
            className="secondary-button compact"
            onClick={startNewSeason}
            disabled={!seasonFinished}
          >
            Sezon nou
          </button>
          <button className="secondary-button compact" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>

      <nav className="tabs" aria-label="Main navigation">
        <button
          className={activeTab === "dashboard" ? "tab active" : "tab"}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={activeTab === "board" ? "tab active" : "tab"}
          onClick={() => setActiveTab("board")}
        >
          Board
        </button>
        <button
          className={activeTab === "squad" ? "tab active" : "tab"}
          onClick={() => setActiveTab("squad")}
        >
          Squad
        </button>
        <button
          className={activeTab === "training" ? "tab active" : "tab"}
          onClick={() => setActiveTab("training")}
        >
          Training
        </button>
        <button
          className={activeTab === "medical" ? "tab active" : "tab"}
          onClick={() => setActiveTab("medical")}
        >
          Fitness
        </button>
        <button
          className={activeTab === "transfers" ? "tab active" : "tab"}
          onClick={() => setActiveTab("transfers")}
        >
          Transfers
        </button>
        <button
          className={activeTab === "scouting" ? "tab active" : "tab"}
          onClick={() => setActiveTab("scouting")}
        >
          Scouting
        </button>
        <button
          className={activeTab === "finance" ? "tab active" : "tab"}
          onClick={() => setActiveTab("finance")}
        >
          Finance
        </button>
        <button
          className={activeTab === "contracts" ? "tab active" : "tab"}
          onClick={() => setActiveTab("contracts")}
        >
          Contracts
        </button>
        <button
          className={activeTab === "academy" ? "tab active" : "tab"}
          onClick={() => setActiveTab("academy")}
        >
          Academy
        </button>
        <button
          className={activeTab === "seasons" ? "tab active" : "tab"}
          onClick={() => setActiveTab("seasons")}
        >
          Seasons
        </button>
        <button
          className={activeTab === "cup" ? "tab active" : "tab"}
          onClick={() => setActiveTab("cup")}
        >
          Cup
        </button>
        <button
          className={activeTab === "tactics" ? "tab active" : "tab"}
          onClick={() => setActiveTab("tactics")}
        >
          Tactics
        </button>
        <button
          className={activeTab === "match" ? "tab active" : "tab"}
          onClick={() => setActiveTab("match")}
        >
          Meci curent
        </button>
        <button
          className={activeTab === "fixtures" ? "tab active" : "tab"}
          onClick={() => setActiveTab("fixtures")}
        >
          Program
        </button>
        <button
          className={activeTab === "standings" ? "tab active" : "tab"}
          onClick={() => setActiveTab("standings")}
        >
          Clasament
        </button>
        <button
          className={activeTab === "help" ? "tab active" : "tab"}
          onClick={() => setActiveTab("help")}
        >
          Help
        </button>
        <button
          className={activeTab === "beta" ? "tab active" : "tab"}
          onClick={() => setActiveTab("beta")}
        >
          Beta
        </button>
        <button
          className={activeTab === "qa" ? "tab active" : "tab"}
          onClick={() => setActiveTab("qa")}
        >
          QA Live
        </button>
        <button
          className={activeTab === "admin" ? "tab active" : "tab"}
          onClick={() => setActiveTab("admin")}
        >
          Admin
        </button>
      </nav>

      {activeTab === "dashboard" && (
        <section className="dashboard-grid">
          <article className="panel highlight-panel">
            <span className="team-label">Sezon {game.seasonNumber}</span>
            <h2>Clubul tau: {game.clubProfile.name}</h2>
            <p className="muted">
              {seasonFinished
                ? `Sezon terminat. Campioana: ${champion?.teamName}.`
                : `Urmeaza runda ${game.currentRound} din ${maxRound}.`}
            </p>
            <div className="club-identity-strip">
              <span
                className="club-color-dot"
                style={{ background: game.clubProfile.primaryColor }}
              />
              <span
                className="club-color-dot"
                style={{ background: game.clubProfile.secondaryColor }}
              />
              <strong>{game.clubProfile.city}</strong>
            </div>
            <div className="metric-grid">
              <div className="metric">
                <span>Pozitie</span>
                <strong>{userClubPosition}</strong>
              </div>
              <div className="metric">
                <span>Puncte</span>
                <strong>{userStanding.points}</strong>
              </div>
              <div className="metric">
                <span>Meciuri</span>
                <strong>{userStanding.played}</strong>
              </div>
              <div className="metric">
                <span>Golaveraj</span>
                <strong>{userStanding.goalDifference}</strong>
              </div>
              <div className="metric">
                <span>Fitness mediu</span>
                <strong>{userAverageFitness}</strong>
              </div>
              <div className="metric">
                <span>Indisponibili</span>
                <strong>{unavailablePlayers.length}</strong>
              </div>
              <div className="metric">
                <span>Buget transferuri</span>
                <strong>{formatMoney(game.transferBudget)}</strong>
              </div>
              <div className="metric">
                <span>Cash club</span>
                <strong>{formatMoney(game.finance.cashBalance)}</strong>
              </div>
              <div className="metric">
                <span>Academie</span>
                <strong>Lvl {game.youthAcademy.level}</strong>
              </div>
              <div className="metric">
                <span>Salarii/runda</span>
                <strong>{formatMoney(wageBill)}</strong>
              </div>
              <div className="metric">
                <span>Contracte risc</span>
                <strong>
                  {expiringContracts.length +
                    expiredContracts.length +
                    unhappyContracts.length}
                </strong>
              </div>
              <div className="metric">
                <span>Valoare lot</span>
                <strong>{formatMoney(squadValue)}</strong>
              </div>
              <div className="metric">
                <span>Cupa</span>
                <strong>
                  {game.cupState.status === "completed"
                    ? "Finalizata"
                    : getCupRoundLabel(currentCupRoundName)}
                </strong>
              </div>
              <div className="metric">
                <span>Job security</span>
                <strong>{game.boardState.jobSecurity}</strong>
              </div>
              <div className="metric">
                <span>Sack risk</span>
                <strong>{game.boardState.sackRiskPercent}%</strong>
              </div>
            </div>
          </article>

          <article className="panel quick-actions-panel">
            <h3>Comenzi rapide</h3>
            <div className="button-stack">
              <button onClick={simulateNextRound} disabled={seasonFinished}>
                Simuleaza etapa {seasonFinished ? "" : game.currentRound}
              </button>
              <button
                className="secondary-button"
                onClick={simulateAllRemainingRounds}
                disabled={seasonFinished}
              >
                Simuleaza tot sezonul
              </button>
              <button
                className="secondary-button"
                onClick={() => setActiveTab("fixtures")}
                disabled={!nextMatchPreview}
              >
                Preview meci
              </button>
              <button
                className="secondary-button"
                onClick={() => setActiveTab("training")}
              >
                Antrenament
              </button>
              <button
                className="secondary-button"
                onClick={() => setActiveTab("medical")}
              >
                Fitness & medical
              </button>
              <button
                className="secondary-button"
                onClick={() => setActiveTab("transfers")}
              >
                Transferuri
              </button>
              <button
                className="secondary-button"
                onClick={() => setActiveTab("finance")}
              >
                Finante
              </button>
              <button
                className="secondary-button"
                onClick={() => setActiveTab("contracts")}
              >
                Contracte
              </button>
              <button
                className="secondary-button"
                onClick={() => setActiveTab("academy")}
              >
                Academie juniori
              </button>
              <button
                className="secondary-button"
                onClick={() => setActiveTab("seasons")}
              >
                Istoric sezoane
              </button>
              <button
                className="secondary-button"
                onClick={() => setActiveTab("cup")}
              >
                Cupa sezonului
              </button>
              <button
                className="secondary-button"
                onClick={() => setActiveTab("board")}
              >
                Board objectives
              </button>
              <button
                className="secondary-button"
                onClick={() => setActiveTab("help")}
              >
                Help center
              </button>
              <button
                className="secondary-button"
                onClick={() => setActiveTab("beta")}
              >
                Beta readiness
              </button>
              <button
                className="secondary-button"
                onClick={() => setActiveTab("qa")}
              >
                Live QA
              </button>
              <button
                className="secondary-button"
                onClick={startNewSeason}
                disabled={!seasonFinished}
              >
                Incepe sezon nou
              </button>
              <button
                className="secondary-button"
                onClick={() => setActiveTab("tactics")}
              >
                Schimba tactica
              </button>
            </div>
            <p className="muted small-note">
              Tactica activa: {getTacticLabel(game.userTactic)}. Cash club:{" "}
              {formatMoney(game.finance.cashBalance)}. Buget transferuri:{" "}
              {formatMoney(game.transferBudget)}. Contracte:{" "}
              {contractRiskSummary}.
            </p>
          </article>

          <article className="panel onboarding-panel">
            <div className="section-header">
              <div>
                <h3>Onboarding</h3>
                <p className="muted">
                  Checklist pentru primele actiuni importante din cariera.
                </p>
              </div>
              <span className="status-pill ok">
                {uiExperience.completedCount}/{uiExperience.totalCount}
              </span>
            </div>

            <div
              className="progress-track large-progress"
              aria-label="Onboarding progress"
            >
              <i style={{ width: `${uiExperience.completionPercent}%` }} />
            </div>
            <p className="muted small-note">
              Progres onboarding: {uiExperience.completionPercent}%.
            </p>

            {uiExperience.nextTask ? (
              <button
                type="button"
                className="dashboard-alert info onboarding-next"
                onClick={() =>
                  setActiveTab(uiExperience.nextTask?.targetTab as Tab)
                }
              >
                <span>Next step</span>
                <strong>{uiExperience.nextTask.title}</strong>
                <small>{uiExperience.nextTask.description}</small>
              </button>
            ) : (
              <p className="success-message inline-message">
                Onboarding complet. Esti pregatit pentru versiunea beta.
              </p>
            )}

            <div className="onboarding-list">
              {uiExperience.tasks.slice(0, 5).map((item) => (
                <button
                  type="button"
                  className={`onboarding-row ${item.completed ? "completed" : "pending"}`}
                  key={item.id}
                  onClick={() => setActiveTab(item.targetTab as Tab)}
                >
                  <span>{item.completed ? "✓" : "·"}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </div>
                </button>
              ))}
            </div>
          </article>

          <article className="panel wide-panel manager-overview-panel">
            <div className="section-header">
              <div>
                <h3>Manager dashboard</h3>
                <p className="muted">
                  Board confidence, obiective, alerte si actiuni recomandate
                  pentru urmatoarea etapa.
                </p>
              </div>
              <span
                className={`status-pill confidence-${managerDashboard.boardConfidenceLevel}`}
              >
                {managerDashboard.boardConfidenceLabel}
              </span>
            </div>

            <div className="manager-overview">
              <div
                className={`manager-rating-card confidence-${managerDashboard.boardConfidenceLevel}`}
              >
                <span>Manager rating</span>
                <strong>{managerDashboard.rating}</strong>
                <em>{managerDashboard.headline}</em>
                <div className="progress-track" aria-label="Season progress">
                  <i
                    style={{
                      width: `${managerDashboard.seasonProgressPercent}%`,
                    }}
                  />
                </div>
                <small>
                  Progres sezon: {managerDashboard.seasonProgressPercent}%
                </small>
              </div>

              <div className="objective-grid">
                {managerDashboard.objectives.map((objective) => (
                  <div
                    className={`objective-card ${objective.status}`}
                    key={objective.id}
                  >
                    <div>
                      <strong>{objective.title}</strong>
                      <span>{objective.detail}</span>
                    </div>
                    <div>
                      <b>{objective.score}</b>
                      <small>{getObjectiveStatusLabel(objective.status)}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="manager-columns">
              <div className="manager-column">
                <h4>Board alerts</h4>
                {managerDashboard.alerts.length === 0 ? (
                  <p className="success-message inline-message">
                    Nu exista alerte majore. Clubul este stabil pentru runda
                    curenta.
                  </p>
                ) : (
                  <div className="alert-stack">
                    {managerDashboard.alerts.map((alert) => (
                      <button
                        type="button"
                        className={`dashboard-alert ${alert.severity}`}
                        key={alert.id}
                        onClick={() => setActiveTab(alert.targetTab as Tab)}
                      >
                        <span>{getAlertSeverityLabel(alert.severity)}</span>
                        <strong>{alert.title}</strong>
                        <small>{alert.message}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="manager-column">
                <h4>Key players</h4>
                <div className="key-player-list">
                  {managerDashboard.keyPlayers.map((player) => (
                    <div className="key-player-row" key={player.id}>
                      <div>
                        <strong>{player.name}</strong>
                        <span>
                          {player.position} · {player.note}
                        </span>
                      </div>
                      <div>
                        <b>{player.overall}</b>
                        <small>{formatMoney(player.value)}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="manager-column">
                <h4>Next actions</h4>
                <ol className="next-action-list">
                  {managerDashboard.nextActions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ol>
              </div>
            </div>
          </article>

          {nextMatchPreview && (
            <article className="panel wide-panel match-preview-panel">
              <div className="section-header">
                <div>
                  <h3>Match preview</h3>
                  <p className="muted">
                    Analiza inaintea meciului clubului tau din runda curenta.
                  </p>
                </div>
                <span className="status-pill ok">
                  Runda {nextMatchPreview.round}
                </span>
              </div>

              <div className="preview-scoreline">
                <div>
                  <span>Home</span>
                  <strong>{nextMatchPreview.home.name}</strong>
                  <small>{nextMatchPreview.home.tacticLabel}</small>
                </div>
                <b>vs</b>
                <div>
                  <span>Away</span>
                  <strong>{nextMatchPreview.away.name}</strong>
                  <small>{nextMatchPreview.away.tacticLabel}</small>
                </div>
              </div>

              <div className="metric-grid compact-metrics">
                <div className="metric">
                  <span>Atac</span>
                  <strong>
                    {nextMatchPreview.home.strength.attack} -{" "}
                    {nextMatchPreview.away.strength.attack}
                  </strong>
                </div>
                <div className="metric">
                  <span>Mijloc</span>
                  <strong>
                    {nextMatchPreview.home.strength.midfield} -{" "}
                    {nextMatchPreview.away.strength.midfield}
                  </strong>
                </div>
                <div className="metric">
                  <span>Aparare</span>
                  <strong>
                    {nextMatchPreview.home.strength.defense} -{" "}
                    {nextMatchPreview.away.strength.defense}
                  </strong>
                </div>
                <div className="metric">
                  <span>Overall</span>
                  <strong>
                    {nextMatchPreview.home.strength.overall} -{" "}
                    {nextMatchPreview.away.strength.overall}
                  </strong>
                </div>
                <div className="metric">
                  <span>Fitness</span>
                  <strong>
                    {nextMatchPreview.home.averageFitness} -{" "}
                    {nextMatchPreview.away.averageFitness}
                  </strong>
                </div>
                <div className="metric">
                  <span>Indisponibili</span>
                  <strong>
                    {nextMatchPreview.home.unavailableCount} -{" "}
                    {nextMatchPreview.away.unavailableCount}
                  </strong>
                </div>
              </div>

              <div className="matchday-columns">
                <div className="matchday-note positive">
                  <strong>{nextMatchPreview.expectedBalance}</strong>
                  <span>{nextMatchPreview.recommendation}</span>
                </div>
                <div className="risk-list">
                  {nextMatchPreview.keyRisks.map((risk) => (
                    <div className="risk-item" key={risk}>
                      {risk}
                    </div>
                  ))}
                </div>
              </div>
            </article>
          )}

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Urmatoarea etapa</h3>
                <p className="muted">
                  Meciurile sunt simulate doar cand apesi pe etapa.
                </p>
              </div>
            </div>
            {seasonFinished ? (
              <div className="empty-state compact-empty">
                <p className="muted">
                  Sezonul este complet. Poti incepe un sezon nou.
                </p>
                <button onClick={startNewSeason}>Incepe sezonul urmator</button>
              </div>
            ) : (
              <div className="fixtures-list compact-fixtures">
                {nextRoundFixtures.map((fixture) => (
                  <div className="fixture-row static" key={fixture.id}>
                    <span>{fixture.homeTeam.name}</span>
                    <strong>vs</strong>
                    <span>{fixture.awayTeam.name}</span>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="panel wide-panel save-panel">
            <div className="section-header">
              <div>
                <h3>Salvare progres</h3>
                <p className="muted">
                  Salvarea locala si salvarea Supabase sunt legate de user.id
                  din Supabase Auth.
                </p>
              </div>
              <span
                className={
                  isSupabaseConfigured() ? "status-pill ok" : "status-pill"
                }
              >
                Supabase{" "}
                {isSupabaseConfigured() ? "configurat" : "neconfigurat"}
              </span>
            </div>
            <div className="save-actions">
              <button onClick={handleSaveLocal}>Salveaza local</button>
              <button className="secondary-button" onClick={handleLoadLocal}>
                Incarca local
              </button>
              <button className="secondary-button" onClick={handleClearLocal}>
                Sterge salvarea locala
              </button>
              <button className="secondary-button" onClick={handleSaveSupabase}>
                Salveaza in Supabase
              </button>
              <button className="secondary-button" onClick={handleLoadSupabase}>
                Incarca din Supabase
              </button>
            </div>
            {saveStatus && <p className="success-message">{saveStatus}</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </article>
        </section>
      )}

      {activeTab === "board" && (
        <section className="dashboard-grid board-grid">
          <article className="panel highlight-panel board-summary-panel">
            <div className="section-header">
              <div>
                <span className="team-label">Board objectives</span>
                <h2>Job security: {game.boardState.jobSecurity}/100</h2>
                <p className="muted">
                  Board-ul evalueaza performanta sportiva, controlul salarial,
                  stabilitatea cash, parcursul in cupa si dezvoltarea academiei.
                </p>
              </div>
              <span
                className={`status-pill ${getBoardStatusClass(game.boardState.jobStatus)}`}
              >
                {getJobStatusLabel(game.boardState.jobStatus)}
              </span>
            </div>

            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>Mood board</span>
                <strong>{getBoardMoodLabel(game.boardState.mood)}</strong>
              </div>
              <div className="metric">
                <span>Sack risk</span>
                <strong>{game.boardState.sackRiskPercent}%</strong>
              </div>
              <div className="metric">
                <span>Manager reputation</span>
                <strong>{game.boardState.managerReputation}</strong>
              </div>
              <div className="metric">
                <span>Obiective ratate</span>
                <strong>{failedBoardObjectives}</strong>
              </div>
            </div>

            <div className="save-actions transfer-actions">
              <button type="button" onClick={runBoardReview}>
                Actualizeaza board review
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setActiveTab("dashboard")}
              >
                Inapoi la dashboard
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleSaveLocal}
              >
                Salveaza local
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleSaveSupabase}
              >
                Salveaza Supabase
              </button>
            </div>
            {saveStatus && <p className="success-message">{saveStatus}</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </article>

          <article className="panel">
            <h3>Ultimul review</h3>
            {latestBoardReview ? (
              <>
                <div className="stat-row">
                  <span>Runda</span>
                  <strong>{latestBoardReview.round}</strong>
                </div>
                <div className="stat-row">
                  <span>Confidence</span>
                  <strong>{latestBoardReview.confidenceScore}/100</strong>
                </div>
                <div className="stat-row">
                  <span>Job status</span>
                  <strong>
                    {getJobStatusLabel(latestBoardReview.jobStatus)}
                  </strong>
                </div>
                <div className="stat-row">
                  <span>Risc demitere</span>
                  <strong>{latestBoardReview.sackRiskPercent}%</strong>
                </div>
                <p className="muted small-note">{latestBoardReview.summary}</p>
              </>
            ) : (
              <p className="muted">
                Nu exista inca review. Simuleaza o etapa sau apasa Actualizeaza
                board review.
              </p>
            )}
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Obiective sezon {game.seasonNumber}</h3>
                <p className="muted">
                  Aceste obiective sunt salvate in payload per user si se
                  reseteaza la sezon nou.
                </p>
              </div>
              <span
                className={`status-pill ${getBoardStatusClass(game.boardState.mood)}`}
              >
                {getBoardMoodLabel(game.boardState.mood)}
              </span>
            </div>
            <div className="board-objective-grid">
              {game.boardState.objectives.map((objective) => (
                <div
                  className={`board-objective-card ${getBoardStatusClass(objective.status)}`}
                  key={objective.id}
                >
                  <div>
                    <strong>{objective.title}</strong>
                    <span>{objective.description}</span>
                    <small>{objective.summary}</small>
                  </div>
                  <div className="board-objective-score">
                    <b>{objective.score}</b>
                    <span>
                      {getBoardObjectiveStatusLabel(objective.status)}
                    </span>
                    <small>Weight {objective.weight}%</small>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <h3>Avertizari board</h3>
            {boardWarnings.length === 0 ? (
              <p className="success-message inline-message">
                Nu exista avertizari.
              </p>
            ) : (
              <div className="alert-stack">
                {boardWarnings.map((warning) => (
                  <div className="board-warning" key={warning}>
                    {warning}
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="panel">
            <h3>Reguli job security</h3>
            <div className="mini-list">
              <div className="mini-row">
                <span>Rezultate</span>
                <strong>Pozitia in campionat are cea mai mare greutate.</strong>
              </div>
              <div className="mini-row">
                <span>Finante</span>
                <strong>
                  Wage budget si cash balance pot scadea rapid increderea.
                </strong>
              </div>
              <div className="mini-row">
                <span>Cupa</span>
                <strong>Semifinala este tinta minima in acest sezon.</strong>
              </div>
              <div className="mini-row">
                <span>Sezon nou</span>
                <strong>
                  Obiectivele se regenereaza si reputatia managerului se
                  pastreaza.
                </strong>
              </div>
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Istoric board reviews</h3>
                <p className="muted">
                  Ultimele review-uri arata cum se schimba job security dupa
                  decizii si rezultate.
                </p>
              </div>
              <span className="status-pill">
                {game.boardState.reviews.length} review-uri
              </span>
            </div>
            {game.boardState.reviews.length === 0 ? (
              <p className="muted">Istoricul este gol.</p>
            ) : (
              <div className="board-review-list">
                {game.boardState.reviews.map((review) => (
                  <div
                    className={`board-review-record ${getBoardStatusClass(review.jobStatus)}`}
                    key={review.id}
                  >
                    <span
                      className={`status-badge ${getBoardStatusClass(review.jobStatus)}`}
                    >
                      {getJobStatusLabel(review.jobStatus)}
                    </span>
                    <div>
                      <strong>
                        Sezon {review.seasonNumber}, runda {review.round}
                      </strong>
                      <small>{review.summary}</small>
                    </div>
                    <strong>{review.confidenceScore}/100</strong>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      )}

      {activeTab === "squad" && (
        <section className="panel">
          <div className="section-header">
            <div>
              <h3>Squad - {userTeam.name}</h3>
              <p className="muted">
                Primul lot generat automat: 18 jucatori, impartiti pe posturi.
              </p>
            </div>
            <span className="status-pill ok">
              {userTeam.players.length} jucatori
            </span>
          </div>

          <div className="squad-summary">
            <div className="metric">
              <span>Reputatie</span>
              <strong>{userTeam.reputation}</strong>
            </div>
            <div className="metric">
              <span>Moral echipa</span>
              <strong>{userTeam.morale}</strong>
            </div>
            <div className="metric">
              <span>Overall engine</span>
              <strong>{Math.round(teamStrength.overall)}</strong>
            </div>
            <div className="metric">
              <span>Atac</span>
              <strong>{Math.round(teamStrength.attack)}</strong>
            </div>
            <div className="metric">
              <span>Fitness mediu</span>
              <strong>{userAverageFitness}</strong>
            </div>
            <div className="metric">
              <span>Accidentati</span>
              <strong>{injuredPlayers.length}</strong>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Jucator</th>
                  <th>Pos</th>
                  <th>Age</th>
                  <th>OVR</th>
                  <th>PAC</th>
                  <th>SHO</th>
                  <th>PAS</th>
                  <th>DEF</th>
                  <th>STA</th>
                  <th>FIT</th>
                  <th>MOR</th>
                  <th>FORM</th>
                  <th>Wage</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {userTeam.players.map((player) => (
                  <tr
                    className={
                      isPlayerInjured(player) || (player.fitness ?? 100) < 55
                        ? "player-alert-row"
                        : undefined
                    }
                    key={player.id}
                  >
                    <td>{player.name}</td>
                    <td>
                      <strong>{player.position}</strong>
                    </td>
                    <td>{player.age}</td>
                    <td>
                      <strong>{player.overall}</strong>
                    </td>
                    <td>{player.pace}</td>
                    <td>{player.shooting}</td>
                    <td>{player.passing}</td>
                    <td>{player.defending}</td>
                    <td>{player.stamina}</td>
                    <td>
                      <strong>{player.fitness ?? 100}</strong>
                    </td>
                    <td>{player.morale}</td>
                    <td>{player.form}</td>
                    <td>{formatMoney(getPlayerWage(player))}</td>
                    <td>
                      <span
                        className={
                          isPlayerInjured(player)
                            ? "status-badge danger"
                            : (player.fitness ?? 100) < 55
                              ? "status-badge warning"
                              : "status-badge ok"
                        }
                      >
                        {getPlayerAvailabilityLabel(player)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "training" && (
        <section className="dashboard-grid training-grid">
          <article className="panel highlight-panel">
            <span className="team-label">Training focus</span>
            <h2>{getTrainingFocusLabel(game.trainingFocus)}</h2>
            <p className="muted">
              Un singur antrenament este permis in fiecare runda. Efectele se
              aplica lotului tau si meciurilor viitoare.
            </p>

            <div className="focus-grid">
              {(
                [
                  "balanced",
                  "attacking",
                  "defensive",
                  "fitness",
                ] as TrainingFocus[]
              ).map((focus) => (
                <button
                  type="button"
                  className={
                    game.trainingFocus === focus
                      ? "focus-card active"
                      : "focus-card"
                  }
                  key={focus}
                  onClick={() => updateTrainingFocus(focus)}
                >
                  <strong>{getTrainingFocusLabel(focus)}</strong>
                  <span>
                    {focus === "balanced" &&
                      "Crestere generala pentru toate posturile."}
                    {focus === "attacking" &&
                      "Pune accent pe atacanti si mijlocasi ofensivi."}
                    {focus === "defensive" &&
                      "Intareste fundasii, portarii si disciplina."}
                    {focus === "fitness" &&
                      "Creste stamina, ritmul, forma si moralul."}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={runTrainingSession}
              disabled={trainingDoneThisRound || seasonFinished}
            >
              {trainingDoneThisRound
                ? "Antrenament facut in runda curenta"
                : "Ruleaza antrenamentul rundei"}
            </button>
            <p className="muted small-note">
              Runda curenta:{" "}
              {seasonFinished
                ? "sezon terminat"
                : `${game.currentRound}/${maxRound}`}
              . Tinerii cresc mai usor, iar jucatorii peste 33 ani cresc mai
              greu.
            </p>
            {saveStatus && <p className="success-message">{saveStatus}</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </article>

          <article className="panel">
            <h3>Ultimul antrenament</h3>
            {game.trainingHistory[0] ? (
              <>
                <div className="stat-row">
                  <span>Sezon / Runda</span>
                  <strong>
                    {game.trainingHistory[0].seasonNumber} /{" "}
                    {game.trainingHistory[0].round}
                  </strong>
                </div>
                <div className="stat-row">
                  <span>Focus</span>
                  <strong>
                    {getTrainingFocusLabel(game.trainingHistory[0].focus)}
                  </strong>
                </div>
                <div className="stat-row">
                  <span>Schimbari cheie</span>
                  <strong>{game.trainingHistory[0].changes.length}</strong>
                </div>
                <p className="muted small-note">
                  {game.trainingHistory[0].summary}
                </p>
              </>
            ) : (
              <p className="muted">
                Nu ai rulat inca niciun antrenament in aceasta cariera.
              </p>
            )}
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Development report</h3>
                <p className="muted">
                  Cele mai importante imbunatatiri din ultimele sesiuni.
                </p>
              </div>
              <span
                className={
                  trainingDoneThisRound ? "status-pill ok" : "status-pill"
                }
              >
                {trainingDoneThisRound ? "Done this round" : "Available"}
              </span>
            </div>

            {game.trainingHistory.length === 0 ? (
              <p className="muted">
                Alege un focus si ruleaza primul antrenament.
              </p>
            ) : (
              <div className="training-history">
                {game.trainingHistory.map((session) => (
                  <div
                    className="training-session"
                    key={`${session.seasonNumber}-${session.round}-${session.focus}`}
                  >
                    <div>
                      <strong>
                        {getTrainingFocusLabel(session.focus)} · Runda{" "}
                        {session.round}
                      </strong>
                      <span>Sezon {session.seasonNumber}</span>
                    </div>
                    <div className="development-list">
                      {session.changes.length === 0 ? (
                        <p className="muted">Sesiune fara schimbari majore.</p>
                      ) : (
                        session.changes.map((change) => (
                          <div
                            className="development-row"
                            key={`${session.round}-${change.playerId}`}
                          >
                            <span>
                              {change.playerName} · {change.position}
                            </span>
                            <strong>
                              {change.overallBefore} → {change.overallAfter}
                            </strong>
                            <small>
                              {change.improvedAttributes.join(", ")}
                            </small>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      )}

      {activeTab === "medical" && (
        <section className="dashboard-grid medical-grid">
          <article className="panel highlight-panel">
            <span className="team-label">Fitness & medical</span>
            <h2>{userAverageFitness}/100 fitness mediu</h2>
            <p className="muted">
              Fitness-ul scade dupa meciuri si se recupereaza partial la
              inceputul fiecarei runde. Accidentarile si oboseala scad puterea
              in match engine.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>Accidentati</span>
                <strong>{injuredPlayers.length}</strong>
              </div>
              <div className="metric">
                <span>Foarte obositi</span>
                <strong>{lowFitnessPlayers.length}</strong>
              </div>
              <div className="metric">
                <span>Indisponibili</span>
                <strong>{unavailablePlayers.length}</strong>
              </div>
              <div className="metric">
                <span>Moral echipa</span>
                <strong>{userTeam.morale}</strong>
              </div>
            </div>
          </article>

          <article className="panel">
            <h3>Risc pentru tactica</h3>
            {unavailablePlayers.length === 0 ? (
              <p className="success-message inline-message">
                Lotul este disponibil pentru urmatoarea etapa.
              </p>
            ) : (
              <>
                <p className="error-message inline-message">
                  Ai {unavailablePlayers.length} jucatori cu risc. Daca ii
                  folosesti, engine-ul penalizeaza echipa prin fitness/injury
                  modifier.
                </p>
                <div className="mini-list">
                  {unavailablePlayers.slice(0, 6).map((player) => (
                    <div className="mini-row" key={player.id}>
                      <span>
                        {player.name} · {player.position}
                      </span>
                      <strong>{getPlayerAvailabilityLabel(player)}</strong>
                    </div>
                  ))}
                </div>
              </>
            )}
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Ultimul raport dupa etapa</h3>
                <p className="muted">
                  Raport determinist generat dupa fiecare runda simulata.
                </p>
              </div>
              <span className="status-pill">
                {latestStatusReport
                  ? `Runda ${latestStatusReport.round}`
                  : "No report"}
              </span>
            </div>

            {!latestStatusReport ? (
              <p className="muted">
                Simuleaza o etapa ca sa vezi primul raport de fitness, moral si
                accidentari.
              </p>
            ) : (
              <div className="training-history">
                <div className="training-session">
                  <div>
                    <strong>{latestStatusReport.summary}</strong>
                    <span>
                      Sezon {latestStatusReport.seasonNumber} · Runda{" "}
                      {latestStatusReport.round}
                    </span>
                  </div>
                  <div className="development-list">
                    {latestStatusReport.changes.length === 0 ? (
                      <p className="muted">
                        Nu exista schimbari medicale importante in aceasta
                        etapa.
                      </p>
                    ) : (
                      latestStatusReport.changes.map((change) => (
                        <div
                          className="development-row status-change-row"
                          key={`${latestStatusReport.round}-${change.playerId}`}
                        >
                          <span>
                            {change.playerName} · {change.teamName}
                          </span>
                          <strong>
                            FIT {change.fitnessBefore} → {change.fitnessAfter}
                          </strong>
                          <small>
                            MOR {change.moraleBefore} → {change.moraleAfter}.{" "}
                            {change.note}
                          </small>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </article>
        </section>
      )}

      {activeTab === "transfers" && (
        <section className="dashboard-grid transfer-grid">
          <article className="panel highlight-panel">
            <span className="team-label">Transfer market</span>
            <h2>{formatMoney(game.transferBudget)} buget disponibil</h2>
            <p className="muted">
              Cumpara free agents sau vinde jucatori din lot. Transferurile
              modifica imediat lotul si meciurile viitoare.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>Valoare lot</span>
                <strong>{formatMoney(squadValue)}</strong>
              </div>
              <div className="metric">
                <span>Free agents</span>
                <strong>{game.transferMarket.length}</strong>
              </div>
              <div className="metric">
                <span>Accesibili</span>
                <strong>{affordableMarketPlayers.length}</strong>
              </div>
              <div className="metric">
                <span>Lot</span>
                <strong>{userTeam.players.length}/25</strong>
              </div>
              <div className="metric">
                <span>Cash</span>
                <strong>{formatMoney(game.finance.cashBalance)}</strong>
              </div>
              <div className="metric">
                <span>Salarii/runda</span>
                <strong>{formatMoney(wageBill)}</strong>
              </div>
            </div>
            <div className="save-actions transfer-actions">
              <button type="button" onClick={refreshTransferMarket}>
                Scouteaza lista noua
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleSaveLocal}
              >
                Salveaza local
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleSaveSupabase}
              >
                Salveaza Supabase
              </button>
            </div>
            {saveStatus && <p className="success-message">{saveStatus}</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </article>

          <article className="panel">
            <h3>Ultimul transfer</h3>
            {latestTransfer ? (
              <>
                <div className="stat-row">
                  <span>Tip</span>
                  <strong>
                    {latestTransfer.type === "buy" ? "Cumparare" : "Vanzare"}
                  </strong>
                </div>
                <div className="stat-row">
                  <span>Jucator</span>
                  <strong>{latestTransfer.playerName}</strong>
                </div>
                <div className="stat-row">
                  <span>Post / OVR</span>
                  <strong>
                    {latestTransfer.position} / {latestTransfer.overall}
                  </strong>
                </div>
                <div className="stat-row">
                  <span>Suma</span>
                  <strong>{formatMoney(latestTransfer.value)}</strong>
                </div>
                <div className="stat-row">
                  <span>Buget dupa</span>
                  <strong>{formatMoney(latestTransfer.budgetAfter)}</strong>
                </div>
              </>
            ) : (
              <p className="muted">
                Nu ai facut inca niciun transfer in aceasta cariera.
              </p>
            )}
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Free agents</h3>
                <p className="muted">
                  Lista este generata determinist pentru sezon si runda.
                  Jucatorii cumparati dispar din lista curenta.
                </p>
              </div>
              <span className="status-pill">
                Runda {seasonFinished ? maxRound : game.currentRound}
              </span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Jucator</th>
                    <th>Pos</th>
                    <th>Age</th>
                    <th>OVR</th>
                    <th>PAC</th>
                    <th>SHO</th>
                    <th>PAS</th>
                    <th>DEF</th>
                    <th>STA</th>
                    <th>Valoare</th>
                    <th>Wage</th>
                    <th>Scout report</th>
                    <th>Actiune</th>
                  </tr>
                </thead>
                <tbody>
                  {game.transferMarket.map((player) => {
                    const scoutReport = getScoutReportForPlayer(
                      game.scoutingReports,
                      player.id,
                    );
                    const marketScoutingCost = getMarketScoutingCost(player);

                    return (
                      <tr key={player.id}>
                        <td>
                          {player.name}
                          <br />
                          <small className="muted">{player.askingClub}</small>
                        </td>
                        <td>
                          <strong>{player.position}</strong>
                        </td>
                        <td>{player.age}</td>
                        <td>
                          <strong>{player.overall}</strong>
                        </td>
                        <td>{player.pace}</td>
                        <td>{player.shooting}</td>
                        <td>{player.passing}</td>
                        <td>{player.defending}</td>
                        <td>{player.stamina}</td>
                        <td>
                          <strong>{formatMoney(player.value)}</strong>
                        </td>
                        <td>{formatMoney(player.wage)}</td>
                        <td>
                          {scoutReport ? (
                            <div className="report-chip">
                              <strong>
                                {getRecommendationLabel(
                                  scoutReport.recommendation,
                                )}
                              </strong>
                              <small>
                                Fit {scoutReport.tacticalFit}/100 · Risc{" "}
                                {getRiskLabel(scoutReport.riskLevel)}
                              </small>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="table-action secondary-table-action"
                              disabled={
                                game.finance.cashBalance < marketScoutingCost
                              }
                              onClick={() => handleScoutMarketPlayer(player.id)}
                            >
                              Scout {formatMoney(marketScoutingCost)}
                            </button>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="table-action"
                            disabled={
                              player.value > game.transferBudget ||
                              userTeam.players.length >= 25
                            }
                            onClick={() => handleBuyPlayer(player.id)}
                          >
                            Cumpara
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Vinde din lot</h3>
                <p className="muted">
                  Nu poti cobori sub lot minim: 14 jucatori, 1 GK, 4 DEF, 4 MID,
                  2 ATT.
                </p>
              </div>
              <span className="status-pill ok">
                {formatMoney(squadValue)} valoare lot
              </span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Jucator</th>
                    <th>Pos</th>
                    <th>Age</th>
                    <th>OVR</th>
                    <th>FIT</th>
                    <th>Status</th>
                    <th>Wage</th>
                    <th>Valoare estimata</th>
                    <th>Actiune</th>
                  </tr>
                </thead>
                <tbody>
                  {userTeam.players.map((player) => {
                    const sellBlockReason = getSellBlockReason(
                      userTeam,
                      player.id,
                    );
                    const saleValue =
                      Math.round((estimatePlayerValue(player) * 0.72) / 25) *
                      25;

                    return (
                      <tr
                        className={
                          isPlayerInjured(player) ||
                          (player.fitness ?? 100) < 55
                            ? "player-alert-row"
                            : undefined
                        }
                        key={player.id}
                      >
                        <td>{player.name}</td>
                        <td>
                          <strong>{player.position}</strong>
                        </td>
                        <td>{player.age}</td>
                        <td>
                          <strong>{player.overall}</strong>
                        </td>
                        <td>{player.fitness ?? 100}</td>
                        <td>
                          <span
                            className={
                              isPlayerInjured(player)
                                ? "status-badge danger"
                                : (player.fitness ?? 100) < 55
                                  ? "status-badge warning"
                                  : "status-badge ok"
                            }
                          >
                            {getPlayerAvailabilityLabel(player)}
                          </span>
                        </td>
                        <td>{formatMoney(getPlayerWage(player))}</td>
                        <td>
                          <strong>{formatMoney(saleValue)}</strong>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="table-action danger-action"
                            disabled={Boolean(sellBlockReason)}
                            title={sellBlockReason ?? "Vinde jucatorul"}
                            onClick={() => handleSellPlayer(player.id)}
                          >
                            Vinde
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Istoric transferuri</h3>
                <p className="muted">
                  Ultimele 20 tranzactii sunt salvate in payload per user.
                </p>
              </div>
            </div>
            {game.transferHistory.length === 0 ? (
              <p className="muted">Istoricul este gol.</p>
            ) : (
              <div className="transfer-history">
                {game.transferHistory.map((record) => (
                  <div className="transfer-record" key={record.id}>
                    <span
                      className={
                        record.type === "buy"
                          ? "status-badge ok"
                          : "status-badge warning"
                      }
                    >
                      {record.type === "buy" ? "IN" : "OUT"}
                    </span>
                    <div>
                      <strong>{record.playerName}</strong>
                      <small>
                        Sezon {record.seasonNumber}, runda {record.round} ·{" "}
                        {record.position}, {record.age} ani, OVR{" "}
                        {record.overall}
                      </small>
                    </div>
                    <strong>{formatMoney(record.value)}</strong>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      )}

      {activeTab === "scouting" && (
        <section className="dashboard-grid scouting-grid">
          <article className="panel highlight-panel">
            <span className="team-label">Scouting department</span>
            <h2>{game.scoutingReports.length} rapoarte active</h2>
            <p className="muted">
              Scouteaza free agents inainte sa ii cumperi. Raportul calculeaza
              fit tactic, fit financiar, nevoie in lot, potential si risc.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>Cash club</span>
                <strong>{formatMoney(game.finance.cashBalance)}</strong>
              </div>
              <div className="metric">
                <span>Buget transferuri</span>
                <strong>{formatMoney(game.transferBudget)}</strong>
              </div>
              <div className="metric">
                <span>Nescoutati</span>
                <strong>{unscoutedMarketPlayers.length}</strong>
              </div>
              <div className="metric">
                <span>Istoric scouting</span>
                <strong>{game.scoutingHistory.length}</strong>
              </div>
              <div className="metric">
                <span>Cost total scouting</span>
                <strong>{formatMoney(scoutingSpend)}</strong>
              </div>
              <div className="metric">
                <span>Tactica evaluata</span>
                <strong>{getTacticLabel(game.userTactic)}</strong>
              </div>
            </div>
            <div className="save-actions transfer-actions">
              <button type="button" onClick={() => setActiveTab("transfers")}>
                Vezi piata de transferuri
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={refreshTransferMarket}
              >
                Lista noua free agents
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleSaveLocal}
              >
                Salveaza local
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleSaveSupabase}
              >
                Salveaza Supabase
              </button>
            </div>
            {saveStatus && <p className="success-message">{saveStatus}</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </article>

          <article className="panel">
            <h3>Ultimul raport</h3>
            {latestScoutingRecord ? (
              <>
                <div className="stat-row">
                  <span>Jucator</span>
                  <strong>{latestScoutingRecord.playerName}</strong>
                </div>
                <div className="stat-row">
                  <span>Recomandare</span>
                  <strong>
                    {getRecommendationLabel(
                      latestScoutingRecord.recommendation,
                    )}
                  </strong>
                </div>
                <div className="stat-row">
                  <span>Fit tactic</span>
                  <strong>{latestScoutingRecord.tacticalFit}/100</strong>
                </div>
                <div className="stat-row">
                  <span>Fit financiar</span>
                  <strong>{latestScoutingRecord.financialFit}/100</strong>
                </div>
                <div className="stat-row">
                  <span>Risc</span>
                  <strong>
                    {getRiskLabel(latestScoutingRecord.riskLevel)}
                  </strong>
                </div>
                <p className="muted small-note">
                  {latestScoutingRecord.summary}
                </p>
              </>
            ) : (
              <p className="muted">
                Nu exista inca rapoarte. Apasa Scout pe un free agent din tabul
                Transfers.
              </p>
            )}
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Recomandari scouting</h3>
                <p className="muted">
                  Cele mai bune rapoarte sunt sortate dupa recomandare, fit
                  tactic, fit financiar si OVR.
                </p>
              </div>
              <span className="status-pill ok">
                Top {topScoutReports.length}
              </span>
            </div>
            {topScoutReports.length === 0 ? (
              <p className="muted">
                Nu exista recomandari inca. Scouteaza cativa jucatori din piata.
              </p>
            ) : (
              <div className="scout-card-grid">
                {topScoutReports.map((report) => (
                  <div
                    className={`scout-card recommendation-${report.recommendation}`}
                    key={report.id}
                  >
                    <div className="scout-card-header">
                      <div>
                        <strong>{report.playerName}</strong>
                        <span>
                          {report.position} · {report.age} ani · OVR{" "}
                          {report.overall}
                        </span>
                      </div>
                      <span className="status-badge ok">
                        {getRecommendationLabel(report.recommendation)}
                      </span>
                    </div>
                    <div className="metric-grid compact-metrics">
                      <div className="metric">
                        <span>Fit tactic</span>
                        <strong>{report.tacticalFit}</strong>
                      </div>
                      <div className="metric">
                        <span>Fit financiar</span>
                        <strong>{report.financialFit}</strong>
                      </div>
                      <div className="metric">
                        <span>Potential</span>
                        <strong>{report.potentialEstimate}</strong>
                      </div>
                      <div className="metric">
                        <span>Readiness</span>
                        <strong>{report.readiness}</strong>
                      </div>
                    </div>
                    <div className="scout-notes">
                      <strong>Plusuri</strong>
                      {report.strengths.length === 0 ? (
                        <span className="muted">Nu exista plusuri clare.</span>
                      ) : (
                        report.strengths.map((item) => (
                          <span key={item}>+ {item}</span>
                        ))
                      )}
                    </div>
                    <div className="scout-notes concerns">
                      <strong>Riscuri</strong>
                      {report.concerns.length === 0 ? (
                        <span className="muted">Fara riscuri majore.</span>
                      ) : (
                        report.concerns.map((item) => (
                          <span key={item}>- {item}</span>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Rapoarte active</h3>
                <p className="muted">
                  Rapoartele curente sunt salvate in payload per user si raman
                  disponibile pana schimbi sezonul.
                </p>
              </div>
              <span className="status-pill">
                {game.scoutingReports.length} rapoarte
              </span>
            </div>
            {game.scoutingReports.length === 0 ? (
              <p className="muted">Niciun jucator scouted momentan.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Jucator</th>
                      <th>Pos</th>
                      <th>Age</th>
                      <th>OVR</th>
                      <th>Valoare</th>
                      <th>Wage</th>
                      <th>Nevoie lot</th>
                      <th>Fit tactic</th>
                      <th>Fit financiar</th>
                      <th>Risc</th>
                      <th>Recomandare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {game.scoutingReports.map((report) => (
                      <tr key={report.id}>
                        <td>{report.playerName}</td>
                        <td>
                          <strong>{report.position}</strong>
                        </td>
                        <td>{report.age}</td>
                        <td>
                          <strong>{report.overall}</strong>
                        </td>
                        <td>{formatMoney(report.value)}</td>
                        <td>{formatMoney(report.wage)}</td>
                        <td>{getSquadNeedLabel(report.squadNeed)}</td>
                        <td>
                          <strong>{report.tacticalFit}</strong>
                        </td>
                        <td>
                          <strong>{report.financialFit}</strong>
                        </td>
                        <td>{getRiskLabel(report.riskLevel)}</td>
                        <td>
                          <strong>
                            {getRecommendationLabel(report.recommendation)}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </section>
      )}

      {activeTab === "academy" && (
        <section className="dashboard-grid academy-grid">
          <article className="panel highlight-panel">
            <span className="team-label">Youth academy</span>
            <h2>Academie nivel {game.youthAcademy.level}</h2>
            <p className="muted">
              Descopera juniori, promoveaza-i in lotul mare si imbunatateste
              academia. Costul de intretinere este inclus automat in raportul
              financiar dupa fiecare etapa.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>Prospecti</span>
                <strong>{game.youthAcademy.prospects.length}</strong>
              </div>
              <div className="metric">
                <span>Upkeep/runda</span>
                <strong>{formatMoney(academyRoundCost)}</strong>
              </div>
              <div className="metric">
                <span>Scouting</span>
                <strong>{formatMoney(scoutingCost)}</strong>
              </div>
              <div className="metric">
                <span>Upgrade</span>
                <strong>
                  {game.youthAcademy.level >= 5
                    ? "Max"
                    : formatMoney(academyUpgradeCost)}
                </strong>
              </div>
              <div className="metric">
                <span>Cash club</span>
                <strong>{formatMoney(game.finance.cashBalance)}</strong>
              </div>
              <div className="metric">
                <span>Lot</span>
                <strong>{userTeam.players.length}/25</strong>
              </div>
            </div>
            <div className="save-actions academy-actions">
              <button
                type="button"
                onClick={handleScoutYouth}
                disabled={
                  scoutingDoneThisRound ||
                  seasonFinished ||
                  game.finance.cashBalance < scoutingCost
                }
              >
                {scoutingDoneThisRound
                  ? "Scouting facut in runda curenta"
                  : "Scouteaza juniori"}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleUpgradeYouthAcademy}
                disabled={
                  game.youthAcademy.level >= 5 ||
                  game.finance.cashBalance < academyUpgradeCost
                }
              >
                Upgrade academie
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleSaveLocal}
              >
                Salveaza local
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleSaveSupabase}
              >
                Salveaza Supabase
              </button>
            </div>
            {saveStatus && <p className="success-message">{saveStatus}</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </article>

          <article className="panel">
            <h3>Ultima actiune academy</h3>
            {latestAcademyRecord ? (
              <>
                <div className="stat-row">
                  <span>Tip</span>
                  <strong>{latestAcademyRecord.type}</strong>
                </div>
                <div className="stat-row">
                  <span>Cost</span>
                  <strong>{formatMoney(latestAcademyRecord.cost)}</strong>
                </div>
                <div className="stat-row">
                  <span>Runda</span>
                  <strong>
                    S{latestAcademyRecord.seasonNumber} / R
                    {latestAcademyRecord.round}
                  </strong>
                </div>
                <p className="muted small-note">
                  {latestAcademyRecord.summary}
                </p>
              </>
            ) : (
              <p className="muted">Nu exista inca actiuni in academie.</p>
            )}
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Prospecti academy</h3>
                <p className="muted">
                  Potentialul indica plafonul estimat, iar readiness arata cat
                  de pregatit este juniorul pentru lotul mare.
                </p>
              </div>
              <span className="status-pill ok">
                Nivel {game.youthAcademy.level}
              </span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Junior</th>
                    <th>Pos</th>
                    <th>Age</th>
                    <th>OVR</th>
                    <th>Potential</th>
                    <th>Readiness</th>
                    <th>PAC</th>
                    <th>SHO</th>
                    <th>PAS</th>
                    <th>DEF</th>
                    <th>STA</th>
                    <th>Cost promovare</th>
                    <th>Actiune</th>
                  </tr>
                </thead>
                <tbody>
                  {game.youthAcademy.prospects.map((prospect) => (
                    <tr key={prospect.id}>
                      <td>{prospect.name}</td>
                      <td>
                        <strong>{prospect.position}</strong>
                      </td>
                      <td>{prospect.age}</td>
                      <td>
                        <strong>{prospect.overall}</strong>
                      </td>
                      <td>
                        <strong>{prospect.potential}</strong>
                      </td>
                      <td>{prospect.readiness}</td>
                      <td>{prospect.pace}</td>
                      <td>{prospect.shooting}</td>
                      <td>{prospect.passing}</td>
                      <td>{prospect.defending}</td>
                      <td>{prospect.stamina}</td>
                      <td>
                        <strong>{formatMoney(prospect.promotionCost)}</strong>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="table-action"
                          disabled={
                            userTeam.players.length >= 25 ||
                            game.finance.cashBalance < prospect.promotionCost
                          }
                          onClick={() => handlePromoteYouthPlayer(prospect.id)}
                        >
                          Promoveaza
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Istoric academy</h3>
                <p className="muted">
                  Ultimele 24 actiuni sunt salvate in payload per user.
                </p>
              </div>
              <span className="status-pill">
                {game.youthAcademyHistory.length} actiuni
              </span>
            </div>
            {game.youthAcademyHistory.length === 0 ? (
              <p className="muted">Istoricul academiei este gol.</p>
            ) : (
              <div className="academy-history">
                {game.youthAcademyHistory.map((record) => (
                  <div className="academy-record" key={record.id}>
                    <span
                      className={
                        record.type === "promote"
                          ? "status-badge ok"
                          : record.type === "upgrade"
                            ? "status-badge warning"
                            : "status-badge"
                      }
                    >
                      {record.type.toUpperCase()}
                    </span>
                    <div>
                      <strong>{record.playerName ?? record.summary}</strong>
                      <small>
                        Sezon {record.seasonNumber}, runda {record.round} ·{" "}
                        {record.summary}
                      </small>
                    </div>
                    <strong>{formatMoney(record.cost)}</strong>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      )}

      {activeTab === "seasons" && (
        <section className="dashboard-grid seasons-grid">
          <article className="panel highlight-panel">
            <span className="team-label">Multi-season career</span>
            <h2>Sezon {game.seasonNumber}</h2>
            <p className="muted">
              La final de sezon poti trece in sezonul urmator. Se reseteaza
              programul si clasamentul, lotul tau este pastrat, jucatorii
              imbatranesc cu un an, accidentarile se curata si clubul primeste
              prize money.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>Status sezon</span>
                <strong>{seasonFinished ? "Final" : "In progress"}</strong>
              </div>
              <div className="metric">
                <span>Runda</span>
                <strong>
                  {seasonFinished
                    ? `${maxRound}/${maxRound}`
                    : `${game.currentRound}/${maxRound}`}
                </strong>
              </div>
              <div className="metric">
                <span>Pozitie curenta</span>
                <strong>{userClubPosition}</strong>
              </div>
              <div className="metric">
                <span>Cash club</span>
                <strong>{formatMoney(game.finance.cashBalance)}</strong>
              </div>
              <div className="metric">
                <span>Buget transferuri</span>
                <strong>{formatMoney(game.transferBudget)}</strong>
              </div>
              <div className="metric">
                <span>Sezoane in istoric</span>
                <strong>{game.seasonHistory.length}</strong>
              </div>
            </div>
            <div className="save-actions">
              <button
                type="button"
                onClick={simulateAllRemainingRounds}
                disabled={seasonFinished}
              >
                Simuleaza restul sezonului
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={startNewSeason}
                disabled={!seasonFinished}
              >
                Incepe sezon nou
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleSaveLocal}
              >
                Salveaza local
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleSaveSupabase}
              >
                Salveaza Supabase
              </button>
            </div>
            {saveStatus && <p className="success-message">{saveStatus}</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </article>

          <article className="panel">
            <h3>Ultimul sezon inchis</h3>
            {latestSeasonRecord ? (
              <>
                <div className="stat-row">
                  <span>Sezon</span>
                  <strong>{latestSeasonRecord.seasonNumber}</strong>
                </div>
                <div className="stat-row">
                  <span>Campioana</span>
                  <strong>{latestSeasonRecord.championTeamName}</strong>
                </div>
                <div className="stat-row">
                  <span>Locul tau</span>
                  <strong>{latestSeasonRecord.userPosition}</strong>
                </div>
                <div className="stat-row">
                  <span>Record</span>
                  <strong>{latestSeasonRecord.userRecord}</strong>
                </div>
                <div className="stat-row">
                  <span>Prize money</span>
                  <strong>{formatMoney(latestSeasonRecord.prizeMoney)}</strong>
                </div>
                <p className="muted small-note">{latestSeasonRecord.summary}</p>
              </>
            ) : (
              <p className="muted">Nu ai inchis inca niciun sezon.</p>
            )}
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Istoric sezoane</h3>
                <p className="muted">
                  Ultimele 12 sezoane inchise sunt salvate in payload per user.
                </p>
              </div>
              <span className="status-pill ok">
                {game.seasonHistory.length} sezoane
              </span>
            </div>
            {game.seasonHistory.length === 0 ? (
              <p className="muted">
                Termina sezonul curent si apasa “Incepe sezon nou” ca sa creezi
                primul sumar istoric.
              </p>
            ) : (
              <div className="academy-history">
                {game.seasonHistory.map((record) => (
                  <div className="academy-record" key={record.id}>
                    <span
                      className={
                        record.userPosition <= 3
                          ? "status-badge ok"
                          : "status-badge"
                      }
                    >
                      S{record.seasonNumber}
                    </span>
                    <div>
                      <strong>{record.summary}</strong>
                      <small>
                        Record {record.userRecord} · varsta medie lot{" "}
                        {record.squadAverageAge} · cash dupa prize{" "}
                        {formatMoney(record.cashAfterPrize)}
                      </small>
                      {record.playerDevelopmentNotes.length > 0 && (
                        <small>
                          {record.playerDevelopmentNotes.slice(0, 3).join(" ")}
                        </small>
                      )}
                    </div>
                    <strong>{formatMoney(record.prizeMoney)}</strong>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      )}

      {activeTab === "cup" && (
        <section className="dashboard-grid cup-grid">
          <article className="panel highlight-panel">
            <span className="team-label">Cup Competition</span>
            <h2>
              {game.cupState.status === "completed"
                ? `Castigatoare: ${game.cupState.championTeamName}`
                : getCupRoundLabel(currentCupRoundName)}
            </h2>
            <p className="muted">
              Cupa este o competitie eliminatorie separata de campionat. Fiecare
              runda simuleaza toate meciurile ramase in bracket, aplica
              fitness/moral/accidentari si poate aduce bonus financiar clubului
              tau.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>Status</span>
                <strong>
                  {game.cupState.status === "completed"
                    ? "Finalizata"
                    : "Activa"}
                </strong>
              </div>
              <div className="metric">
                <span>Runda curenta</span>
                <strong>
                  {game.cupState.status === "completed"
                    ? "-"
                    : getCupRoundLabel(currentCupRoundName)}
                </strong>
              </div>
              <div className="metric">
                <span>Clubul tau</span>
                <strong>{userStillInCup ? "In competitie" : "Eliminat"}</strong>
              </div>
              <div className="metric">
                <span>Meciul tau</span>
                <strong>
                  {userCupMatch
                    ? `${userCupMatch.homeTeamName} vs ${userCupMatch.awayTeamName}`
                    : "-"}
                </strong>
              </div>
              <div className="metric">
                <span>Istoric cupa</span>
                <strong>{game.cupHistory.length}</strong>
              </div>
              <div className="metric">
                <span>Cash club</span>
                <strong>{formatMoney(game.finance.cashBalance)}</strong>
              </div>
            </div>
            <div className="save-actions cup-actions">
              <button
                type="button"
                onClick={simulateNextCupRound}
                disabled={game.cupState.status === "completed"}
              >
                Simuleaza runda de cupa
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleSaveLocal}
              >
                Salveaza local
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleSaveSupabase}
              >
                Salveaza Supabase
              </button>
            </div>
            {saveStatus && <p className="success-message">{saveStatus}</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </article>

          <article className="panel">
            <h3>Ultima runda cupa</h3>
            {latestCupRecord ? (
              <>
                <div className="stat-row">
                  <span>Runda</span>
                  <strong>{getCupRoundLabel(latestCupRecord.roundName)}</strong>
                </div>
                <div className="stat-row">
                  <span>Club implicat</span>
                  <strong>
                    {latestCupRecord.userParticipated ? "Da" : "Nu"}
                  </strong>
                </div>
                <div className="stat-row">
                  <span>Calificare</span>
                  <strong>{latestCupRecord.userAdvanced ? "Da" : "Nu"}</strong>
                </div>
                <div className="stat-row">
                  <span>Bonus</span>
                  <strong>{formatMoney(latestCupRecord.prizeMoney)}</strong>
                </div>
                <p className="muted small-note">{latestCupRecord.summary}</p>
              </>
            ) : (
              <p className="muted">Nu ai simulat inca nicio runda de cupa.</p>
            )}
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Bracket cupa</h3>
                <p className="muted">
                  Meciurile se genereaza determinist la inceputul sezonului.
                  Daca un meci se termina egal, calificarea se decide la
                  penalty-uri.
                </p>
              </div>
              <span className="status-pill ok">
                Sezon {game.cupState.seasonNumber}
              </span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Runda</th>
                    <th>Meci</th>
                    <th>Scor</th>
                    <th>Castigatoare</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {game.cupState.matches.map((match) => (
                    <tr
                      className={
                        match.homeTeamId === USER_TEAM_ID ||
                        match.awayTeamId === USER_TEAM_ID
                          ? "player-alert-row"
                          : undefined
                      }
                      key={match.id}
                    >
                      <td>{getCupRoundLabel(match.roundName)}</td>
                      <td>
                        {match.homeTeamName} vs {match.awayTeamName}
                      </td>
                      <td>
                        {match.result
                          ? `${match.result.homeScore} - ${match.result.awayScore}${match.decidedByPenalties ? " p" : ""}`
                          : "-"}
                      </td>
                      <td>
                        <strong>{match.winnerTeamName ?? "-"}</strong>
                      </td>
                      <td>
                        <span
                          className={
                            match.played ? "status-badge ok" : "status-badge"
                          }
                        >
                          {match.played ? "Jucat" : "Programat"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Istoric cupa</h3>
                <p className="muted">
                  Ultimele runde de cupa sunt salvate in payload per user.
                </p>
              </div>
              <span className="status-pill">
                {game.cupHistory.length} runde
              </span>
            </div>
            {game.cupHistory.length === 0 ? (
              <p className="muted">Istoricul cupei este gol.</p>
            ) : (
              <div className="contract-history">
                {game.cupHistory.map((record) => (
                  <div className="contract-record" key={record.id}>
                    <span
                      className={
                        record.userAdvanced
                          ? "status-badge ok"
                          : record.userParticipated
                            ? "status-badge warning"
                            : "status-badge"
                      }
                    >
                      {getCupRoundLabel(record.roundName)}
                    </span>
                    <div>
                      <strong>
                        {record.championTeamName ?? record.summary}
                      </strong>
                      <small>{record.summary}</small>
                    </div>
                    <strong>{formatMoney(record.prizeMoney)}</strong>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      )}

      {activeTab === "contracts" && (
        <section className="dashboard-grid contracts-grid">
          <article className="panel highlight-panel">
            <span className="team-label">Contracts</span>
            <h2>{contractRiskSummary}</h2>
            <p className="muted">
              Gestioneaza contractele, wage bill-ul si riscul de a pierde
              jucatori la trecerea in sezonul urmator.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>Expira sezonul asta</span>
                <strong>{expiringContracts.length}</strong>
              </div>
              <div className="metric">
                <span>Expirate</span>
                <strong>{expiredContracts.length}</strong>
              </div>
              <div className="metric">
                <span>Nemultumiti</span>
                <strong>{unhappyContracts.length}</strong>
              </div>
              <div className="metric">
                <span>Wage bill/runda</span>
                <strong>{formatMoney(wageBill)}</strong>
              </div>
              <div className="metric">
                <span>Wage budget</span>
                <strong>{formatMoney(game.finance.wageBudget)}</strong>
              </div>
              <div className="metric">
                <span>Cash</span>
                <strong>{formatMoney(game.finance.cashBalance)}</strong>
              </div>
            </div>
            <p
              className={
                expiredContracts.length > 0 || expiringContracts.length > 0
                  ? "error-message inline-message"
                  : "success-message inline-message"
              }
            >
              {expiredContracts.length > 0 || expiringContracts.length > 0
                ? "Rezolva contractele inainte de sezonul nou. Contractele expirate pot pleca automat daca lotul minim ramane valid."
                : "Lotul este stabil contractual pentru moment."}
            </p>
            <div className="save-actions contract-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={handleSaveLocal}
              >
                Salveaza local
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleSaveSupabase}
              >
                Salveaza Supabase
              </button>
            </div>
            {saveStatus && <p className="success-message">{saveStatus}</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </article>

          <article className="panel">
            <h3>Ultima miscare contractuala</h3>
            {latestContractRecord ? (
              <>
                <div className="stat-row">
                  <span>Tip</span>
                  <strong>{latestContractRecord.type}</strong>
                </div>
                <div className="stat-row">
                  <span>Jucator</span>
                  <strong>{latestContractRecord.playerName}</strong>
                </div>
                <div className="stat-row">
                  <span>Wage vechi</span>
                  <strong>{formatMoney(latestContractRecord.oldWage)}</strong>
                </div>
                <div className="stat-row">
                  <span>Wage nou</span>
                  <strong>
                    {latestContractRecord.newWage
                      ? formatMoney(latestContractRecord.newWage)
                      : "-"}
                  </strong>
                </div>
                <p className="muted small-note">
                  {latestContractRecord.summary}
                </p>
              </>
            ) : (
              <p className="muted">Nu exista inca actiuni contractuale.</p>
            )}
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Contracte lot</h3>
                <p className="muted">
                  Oferta de reinnoire este calculata determinist din varsta,
                  OVR, valoare, wage curent si status contractual.
                </p>
              </div>
              <span className="status-pill ok">Sezon {game.seasonNumber}</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Jucator</th>
                    <th>Pos</th>
                    <th>Age</th>
                    <th>OVR</th>
                    <th>Wage</th>
                    <th>Expires</th>
                    <th>Happiness</th>
                    <th>Status</th>
                    <th>Oferta wage</th>
                    <th>Bonus</th>
                    <th>Actiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {userTeam.players.map((player) => {
                    const offer = getContractOffer(player, game.seasonNumber);
                    const status = getContractStatus(player, game.seasonNumber);
                    const contract = player.contract;
                    const statusClass =
                      status === "expired"
                        ? "danger"
                        : status === "expiring" || status === "unhappy"
                          ? "warning"
                          : "ok";

                    return (
                      <tr
                        className={
                          status === "expired" ||
                          status === "expiring" ||
                          status === "unhappy"
                            ? "player-alert-row"
                            : undefined
                        }
                        key={player.id}
                      >
                        <td>{player.name}</td>
                        <td>
                          <strong>{player.position}</strong>
                        </td>
                        <td>{player.age}</td>
                        <td>
                          <strong>{player.overall}</strong>
                        </td>
                        <td>{formatMoney(getPlayerWage(player))}</td>
                        <td>{contract ? `S${contract.expiresSeason}` : "-"}</td>
                        <td>{getContractHappiness(player)}</td>
                        <td>
                          <span className={`status-badge ${statusClass}`}>
                            {getContractStatusLabel(player, game.seasonNumber)}
                          </span>
                        </td>
                        <td>
                          <strong>{formatMoney(offer.wage)}</strong>
                          <br />
                          <small className="muted">{offer.years} ani</small>
                        </td>
                        <td>{formatMoney(offer.signingBonus)}</td>
                        <td>
                          <div className="inline-actions">
                            <button
                              type="button"
                              className="table-action"
                              disabled={
                                game.finance.cashBalance < offer.signingBonus
                              }
                              onClick={() => handleRenewContract(player.id)}
                            >
                              Reinnoieste
                            </button>
                            <button
                              type="button"
                              className="table-action danger-action"
                              onClick={() =>
                                handleReleaseContractPlayer(player.id)
                              }
                            >
                              Release
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Istoric contracte</h3>
                <p className="muted">
                  Ultimele 24 actiuni contractuale sunt salvate in payload per
                  user.
                </p>
              </div>
              <span className="status-pill">
                {game.contractHistory.length} actiuni
              </span>
            </div>
            {game.contractHistory.length === 0 ? (
              <p className="muted">Istoricul contractual este gol.</p>
            ) : (
              <div className="contract-history">
                {game.contractHistory.map((record) => (
                  <div className="contract-record" key={record.id}>
                    <span
                      className={
                        record.type === "renew"
                          ? "status-badge ok"
                          : "status-badge warning"
                      }
                    >
                      {record.type.toUpperCase()}
                    </span>
                    <div>
                      <strong>{record.playerName}</strong>
                      <small>{record.summary}</small>
                    </div>
                    <strong>
                      {record.newWage
                        ? formatMoney(record.newWage)
                        : formatMoney(record.oldWage)}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      )}

      {activeTab === "finance" && (
        <section className="dashboard-grid finance-grid">
          <article className="panel highlight-panel">
            <span className="team-label">Club finance</span>
            <h2>{formatMoney(game.finance.cashBalance)} cash balance</h2>
            <p className="muted">
              Veniturile sunt calculate dupa fiecare etapa: sponsor, matchday
              income, bonus de rezultat, salarii si penalizare daca depasesti
              wage budget-ul.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>Wage bill/runda</span>
                <strong>{formatMoney(wageBill)}</strong>
              </div>
              <div className="metric">
                <span>Wage budget</span>
                <strong>{formatMoney(game.finance.wageBudget)}</strong>
              </div>
              <div className="metric">
                <span>Status salarii</span>
                <strong>{wageBudgetStatus}</strong>
              </div>
              <div className="metric">
                <span>Cost salarii ramas</span>
                <strong>{formatMoney(projectedSeasonWageCost)}</strong>
              </div>
              <div className="metric">
                <span>Academy upkeep</span>
                <strong>{formatMoney(academyRoundCost)}</strong>
              </div>
            </div>
            <p
              className={
                wageBudgetStatus === "over"
                  ? "error-message inline-message"
                  : wageBudgetStatus === "tight"
                    ? "success-message inline-message"
                    : "success-message inline-message"
              }
            >
              {wageBudgetStatus === "over"
                ? "Atentie: ai depasit wage budget-ul. Dupa fiecare runda apare o penalizare financiara."
                : wageBudgetStatus === "tight"
                  ? "Esti aproape de limita salariala. Urmatorul transfer poate duce clubul peste buget."
                  : "Wage bill-ul este sanatos pentru nivelul actual al clubului."}
            </p>
          </article>

          <article className="panel">
            <h3>Ultimul raport financiar</h3>
            {latestFinanceReport ? (
              <>
                <div className="stat-row">
                  <span>Sponsor</span>
                  <strong>
                    {formatMoney(latestFinanceReport.sponsorIncome)}
                  </strong>
                </div>
                <div className="stat-row">
                  <span>Matchday</span>
                  <strong>
                    {formatMoney(latestFinanceReport.matchdayIncome)}
                  </strong>
                </div>
                <div className="stat-row">
                  <span>Bonus rezultat</span>
                  <strong>
                    {formatMoney(latestFinanceReport.performanceBonus)}
                  </strong>
                </div>
                <div className="stat-row">
                  <span>Salarii</span>
                  <strong>-{formatMoney(latestFinanceReport.wageCost)}</strong>
                </div>
                <div className="stat-row">
                  <span>Penalizare wage budget</span>
                  <strong>
                    -{formatMoney(latestFinanceReport.overWagePenalty)}
                  </strong>
                </div>
                <div className="stat-row">
                  <span>Academie</span>
                  <strong>
                    -{formatMoney(latestFinanceReport.academyCost ?? 0)}
                  </strong>
                </div>
                <div className="stat-row">
                  <span>Net</span>
                  <strong>
                    {latestFinanceReport.netChange >= 0 ? "+" : ""}
                    {formatMoney(latestFinanceReport.netChange)}
                  </strong>
                </div>
              </>
            ) : (
              <p className="muted">
                Simuleaza o etapa ca sa generezi primul raport financiar.
              </p>
            )}
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Istoric financiar</h3>
                <p className="muted">
                  Ultimele 24 rapoarte financiare sunt salvate in payload per
                  user.
                </p>
              </div>
              <span className="status-pill ok">
                {game.financeHistory.length} rapoarte
              </span>
            </div>
            {game.financeHistory.length === 0 ? (
              <p className="muted">Istoricul financiar este gol.</p>
            ) : (
              <div className="finance-history">
                {game.financeHistory.map((report) => (
                  <div className="finance-record" key={report.id}>
                    <span
                      className={
                        report.netChange >= 0
                          ? "status-badge ok"
                          : "status-badge danger"
                      }
                    >
                      {report.netChange >= 0 ? "PROFIT" : "LOSS"}
                    </span>
                    <div>
                      <strong>{report.summary}</strong>
                      <small>
                        Sponsor {formatMoney(report.sponsorIncome)} · Matchday{" "}
                        {formatMoney(report.matchdayIncome)} · Bonus{" "}
                        {formatMoney(report.performanceBonus)} · Salarii{" "}
                        {formatMoney(report.wageCost)} · Academie{" "}
                        {formatMoney(report.academyCost ?? 0)}
                      </small>
                    </div>
                    <strong>{formatMoney(report.balanceAfter)}</strong>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      )}

      {activeTab === "tactics" && (
        <section className="dashboard-grid">
          <article className="panel highlight-panel">
            <span className="team-label">Tactica activa</span>
            <h2>{getTacticLabel(game.userTactic)}</h2>
            <p className="muted">
              Modificarile se aplica meciurilor viitoare ale clubului tau.
              Meciurile deja jucate nu se recalculeaza.
            </p>
            {unavailablePlayers.length > 0 && (
              <p className="error-message inline-message">
                Atentie: {unavailablePlayers.length} jucatori sunt accidentati
                sau foarte obositi. Tactica va fi penalizata in engine pana isi
                revin.
              </p>
            )}
            <div className="tactic-form">
              <label>
                Formation
                <select
                  value={game.userTactic.formation}
                  onChange={(event) =>
                    updateTactic(
                      "formation",
                      event.target.value as Tactic["formation"],
                    )
                  }
                >
                  <option value="4-4-2">4-4-2</option>
                  <option value="4-3-3">4-3-3</option>
                  <option value="4-2-3-1">4-2-3-1</option>
                  <option value="5-3-2">5-3-2</option>
                </select>
              </label>

              <label>
                Mentality
                <select
                  value={game.userTactic.mentality}
                  onChange={(event) =>
                    updateTactic(
                      "mentality",
                      event.target.value as Tactic["mentality"],
                    )
                  }
                >
                  <option value="defensive">defensive</option>
                  <option value="balanced">balanced</option>
                  <option value="attacking">attacking</option>
                </select>
              </label>

              <label>
                Pressing
                <select
                  value={game.userTactic.pressing}
                  onChange={(event) =>
                    updateTactic(
                      "pressing",
                      event.target.value as Tactic["pressing"],
                    )
                  }
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </label>
            </div>
          </article>

          <article className="panel">
            <h3>Impact engine</h3>
            <div className="stat-row">
              <span>Attack</span>
              <strong>{teamStrength.attack.toFixed(1)}</strong>
            </div>
            <div className="stat-row">
              <span>Midfield</span>
              <strong>{teamStrength.midfield.toFixed(1)}</strong>
            </div>
            <div className="stat-row">
              <span>Defense</span>
              <strong>{teamStrength.defense.toFixed(1)}</strong>
            </div>
            <div className="stat-row">
              <span>Goalkeeper</span>
              <strong>{teamStrength.goalkeeper.toFixed(1)}</strong>
            </div>
            <div className="stat-row">
              <span>Overall</span>
              <strong>{teamStrength.overall.toFixed(1)}</strong>
            </div>
            <p className="muted small-note">
              Exemplu: 4-3-3 + attacking creste atacul, dar scade apararea.
              5-3-2 + defensive scade riscul, dar produce mai putine ocazii.
            </p>
          </article>
        </section>
      )}

      {activeTab === "match" &&
        (selectedMatch && selectedMatchAnalysis ? (
          <>
            <section className="score-card matchday-score-card">
              <div className="team-block">
                <span className="team-label">Home</span>
                <h2>{selectedMatch.result.homeTeamName}</h2>
                <p>
                  {getTacticLabel(
                    getTeamTactic(
                      selectedMatch.fixture.homeTeam.id,
                      game.userTactic,
                    ),
                  )}
                </p>
              </div>

              <div className="score">
                <span>{selectedMatch.result.homeScore}</span>
                <small>-</small>
                <span>{selectedMatch.result.awayScore}</span>
              </div>

              <div className="team-block right">
                <span className="team-label">Away</span>
                <h2>{selectedMatch.result.awayTeamName}</h2>
                <p>
                  {getTacticLabel(
                    getTeamTactic(
                      selectedMatch.fixture.awayTeam.id,
                      game.userTactic,
                    ),
                  )}
                </p>
              </div>
            </section>

            <section className="dashboard-grid matchday-grid">
              <article className="panel highlight-panel">
                <span className="team-label">Post-match report</span>
                <h2>{selectedMatchAnalysis.conclusion}</h2>
                <p className="muted">{selectedMatchAnalysis.momentumLabel}</p>
                <div className="metric-grid compact-metrics">
                  <div className="metric">
                    <span>Runda</span>
                    <strong>{selectedMatch.fixture.round}</strong>
                  </div>
                  <div className="metric">
                    <span>Pauza</span>
                    <strong>{selectedMatchAnalysis.halfTimeScore}</strong>
                  </div>
                  <div className="metric">
                    <span>Posesie</span>
                    <strong>
                      {selectedMatch.result.stats.homePossession}% -{" "}
                      {selectedMatch.result.stats.awayPossession}%
                    </strong>
                  </div>
                  <div className="metric">
                    <span>Suturi</span>
                    <strong>
                      {selectedMatch.result.stats.homeShots} -{" "}
                      {selectedMatch.result.stats.awayShots}
                    </strong>
                  </div>
                  <div className="metric">
                    <span>Pe poarta</span>
                    <strong>
                      {selectedMatch.result.stats.homeShotsOnTarget} -{" "}
                      {selectedMatch.result.stats.awayShotsOnTarget}
                    </strong>
                  </div>
                  <div className="metric">
                    <span>xG</span>
                    <strong>
                      {selectedMatch.result.stats.homeXg} -{" "}
                      {selectedMatch.result.stats.awayXg}
                    </strong>
                  </div>
                </div>
                <div className="seed">Seed: {selectedMatch.result.seed}</div>
              </article>

              <article className="panel motm-card">
                <h3>Man of the Match</h3>
                <div className="motm-rating">
                  {selectedMatchAnalysis.manOfTheMatch.rating}
                </div>
                <strong>
                  {selectedMatchAnalysis.manOfTheMatch.playerName}
                </strong>
                <span>
                  {selectedMatchAnalysis.manOfTheMatch.teamName} ·{" "}
                  {selectedMatchAnalysis.manOfTheMatch.position}
                </span>
                <p className="muted small-note">
                  {selectedMatchAnalysis.manOfTheMatch.note}
                </p>
              </article>

              <article className="panel wide-panel">
                <div className="section-header">
                  <div>
                    <h3>Tactical feedback</h3>
                    <p className="muted">
                      Explicatii generate din statistici, tactica, fitness si
                      strength-uri.
                    </p>
                  </div>
                  <span className="status-pill ok">
                    {selectedMatchAnalysis.feedback.length} observatii
                  </span>
                </div>
                <div className="feedback-grid">
                  {selectedMatchAnalysis.feedback.map((item) => (
                    <div
                      className={`feedback-card ${item.severity}`}
                      key={item.title}
                    >
                      <strong>{item.title}</strong>
                      <span>{item.message}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel">
                <h3>Top performers</h3>
                <div className="key-player-list">
                  {selectedMatchAnalysis.topPerformers.map((player) => (
                    <div className="key-player-row" key={player.playerId}>
                      <div>
                        <strong>{player.playerName}</strong>
                        <span>
                          {player.teamName} · {player.position} · {player.note}
                        </span>
                      </div>
                      <div>
                        <b>{player.rating}</b>
                        <small>rating</small>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel">
                <h3>Timeline</h3>
                <div className="timeline">
                  {importantEvents.map((event, index) => (
                    <div
                      className={getEventClass(event.type)}
                      key={`${event.minute}-${event.type}-${index}`}
                    >
                      <span>{event.minute}'</span>
                      <p>{event.text}</p>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </>
        ) : (
          <section className="panel empty-state">
            <h3>Nu exista inca un meci jucat</h3>
            <p className="muted">
              Apasa pe “Simuleaza etapa” ca sa generezi primul raport de meci.
            </p>
            <button onClick={simulateNextRound}>Simuleaza etapa 1</button>
          </section>
        ))}

      {activeTab === "fixtures" && (
        <section className="panel">
          <div className="section-header">
            <div>
              <h3>Program si rezultate</h3>
              <p className="muted">
                8 echipe, 14 runde, 56 meciuri tur-retur. Rundele nejucate raman
                cu status programat.
              </p>
            </div>
            <button onClick={simulateNextRound} disabled={seasonFinished}>
              Simuleaza etapa
            </button>
          </div>

          <div className="fixtures-list">
            {Array.from({ length: maxRound }, (_, index) => index + 1).map(
              (round) => (
                <div className="round-block" key={round}>
                  <h4>Runda {round}</h4>
                  {getRoundFixtures(game.fixtures, round).map((fixture) => {
                    const result = getResultForFixture(
                      game.results,
                      fixture.id,
                    );
                    return result ? (
                      <button
                        className="fixture-row"
                        key={fixture.id}
                        onClick={() => openMatch(fixture.id)}
                      >
                        <span>{result.result.homeTeamName}</span>
                        <strong>
                          {result.result.homeScore} - {result.result.awayScore}
                        </strong>
                        <span>{result.result.awayTeamName}</span>
                      </button>
                    ) : (
                      <div
                        className="fixture-row static scheduled"
                        key={fixture.id}
                      >
                        <span>{fixture.homeTeam.name}</span>
                        <strong>vs</strong>
                        <span>{fixture.awayTeam.name}</span>
                      </div>
                    );
                  })}
                </div>
              ),
            )}
          </div>
        </section>
      )}

      {activeTab === "help" && (
        <section className="dashboard-grid help-grid">
          <article className="panel highlight-panel">
            <span className="team-label">Help Center</span>
            <h2>Ghid rapid pentru manager</h2>
            <p className="muted">
              Acest tab explica flow-ul de joc si iti arata ce mai ai de bifat
              in cariera.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>Onboarding</span>
                <strong>{uiExperience.completionPercent}%</strong>
              </div>
              <div className="metric">
                <span>Task-uri facute</span>
                <strong>
                  {uiExperience.completedCount}/{uiExperience.totalCount}
                </strong>
              </div>
              <div className="metric">
                <span>Save local</span>
                <strong>{localSaveAvailable ? "OK" : "Nu"}</strong>
              </div>
              <div className="metric">
                <span>Supabase</span>
                <strong>{isSupabaseConfigured() ? "Config" : "Off"}</strong>
              </div>
            </div>
            {uiExperience.nextTask && (
              <div className="help-next-step">
                <strong>Urmatorul pas recomandat</strong>
                <span>
                  {uiExperience.nextTask.title} —{" "}
                  {uiExperience.nextTask.description}
                </span>
                <button
                  type="button"
                  className="secondary-button compact"
                  onClick={() =>
                    setActiveTab(uiExperience.nextTask?.targetTab as Tab)
                  }
                >
                  Deschide tabul
                </button>
              </div>
            )}
          </article>

          <article className="panel">
            <h3>Checklist complet</h3>
            <div className="onboarding-list full-checklist">
              {uiExperience.tasks.map((item) => (
                <button
                  type="button"
                  className={`onboarding-row ${item.completed ? "completed" : "pending"}`}
                  key={item.id}
                  onClick={() => setActiveTab(item.targetTab as Tab)}
                >
                  <span>{item.completed ? "✓" : "·"}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </div>
                </button>
              ))}
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Ghid in joc</h3>
                <p className="muted">
                  Articole scurte, orientate pe actiune, fara sa parasesti
                  jocul.
                </p>
              </div>
              <span className="status-pill ok">
                {uiExperience.helpArticles.length} ghiduri
              </span>
            </div>

            <div className="help-article-grid">
              {uiExperience.helpArticles.map((article) => (
                <article className="help-article" key={article.id}>
                  <div className="section-header compact-header">
                    <div>
                      <span className="team-label">{article.category}</span>
                      <h4>{article.title}</h4>
                    </div>
                    <button
                      type="button"
                      className="secondary-button compact"
                      onClick={() => setActiveTab(article.targetTab as Tab)}
                    >
                      Deschide
                    </button>
                  </div>
                  <p className="muted">{article.summary}</p>
                  <ul>
                    {article.tips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </article>
        </section>
      )}

      {activeTab === "beta" && (
        <section className="dashboard-grid beta-grid">
          <article className="panel highlight-panel beta-hero">
            <span className="team-label">Public Beta</span>
            <h2>{betaReadiness.statusLabel}</h2>
            <p className="muted">
              Acest tab verifica daca build-ul, salvarea, flow-ul de joc si
              sistemele importante sunt pregatite pentru testeri.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>Beta score</span>
                <strong>{betaReadiness.score}/100</strong>
              </div>
              <div className="metric">
                <span>Passed</span>
                <strong>{betaReadiness.passCount}</strong>
              </div>
              <div className="metric">
                <span>Warnings</span>
                <strong>{betaReadiness.warningCount}</strong>
              </div>
              <div className="metric">
                <span>Blockers</span>
                <strong>{betaReadiness.failCount}</strong>
              </div>
            </div>
            <div
              className="progress-track large-progress"
              aria-label="Beta readiness score"
            >
              <i style={{ width: `${betaReadiness.score}%` }} />
            </div>
            <p className="muted small-note">
              Status: {betaReadiness.status}. Pentru beta publica, rezolva mai
              intai blocker-ele si apoi warnings importante.
            </p>
          </article>

          <article className="panel">
            <h3>Urmatoarele actiuni</h3>
            <div className="beta-action-list">
              {betaReadiness.nextActions.map((action) => (
                <div className="beta-action" key={action}>
                  <span>→</span>
                  <p>{action}</p>
                </div>
              ))}
            </div>
            <div className="button-stack beta-buttons">
              <button
                className="secondary-button"
                onClick={() => setActiveTab("help")}
              >
                Deschide Help
              </button>
              <button
                className="secondary-button"
                onClick={() => setActiveTab("dashboard")}
              >
                Dashboard
              </button>
              <button
                className="secondary-button"
                onClick={() => setActiveTab("board")}
              >
                Board review
              </button>
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Readiness checks</h3>
                <p className="muted">
                  Checklist practic pentru Netlify + Supabase + gameplay smoke
                  test.
                </p>
              </div>
              <span
                className={`status-pill ${betaReadiness.failCount > 0 ? "danger" : betaReadiness.warningCount > 0 ? "warning" : "ok"}`}
              >
                {betaReadiness.failCount > 0
                  ? "Blockers"
                  : betaReadiness.warningCount > 0
                    ? "Warnings"
                    : "Ready"}
              </span>
            </div>

            <div className="beta-check-grid">
              {betaReadiness.checks.map((item) => (
                <article
                  className={`beta-check-card ${item.status}`}
                  key={item.id}
                >
                  <div className="section-header compact-header">
                    <div>
                      <span className="team-label">{item.category}</span>
                      <h4>{item.title}</h4>
                    </div>
                    <span
                      className={`status-badge ${item.status === "pass" ? "ok" : item.status === "warning" ? "warning" : "danger"}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="muted">{item.summary}</p>
                  <small>{item.action}</small>
                  <button
                    type="button"
                    className="secondary-button compact"
                    onClick={() => setActiveTab(item.targetTab as Tab)}
                  >
                    Deschide
                  </button>
                </article>
              ))}
            </div>
          </article>

          <article className="panel wide-panel">
            <h3>Deploy checklist</h3>
            <ol className="deploy-checklist">
              <li>
                Ruleaza schema din <code>supabase/schema.sql</code> in Supabase
                SQL Editor.
              </li>
              <li>
                Seteaza in Netlify <code>VITE_SUPABASE_URL</code> si{" "}
                <code>VITE_SUPABASE_ANON_KEY</code>.
              </li>
              <li>
                Pastreaza build command <code>npm run build</code> si publish
                directory <code>dist</code>.
              </li>
              <li>
                Deploy din GitHub fara <code>node_modules</code>,{" "}
                <code>dist</code>, <code>.vite</code> sau{" "}
                <code>package-lock.json</code>.
              </li>
              <li>
                Fa smoke test: register, create club, save local, save Supabase,
                simulate round, reload cloud.
              </li>
            </ol>
          </article>
        </section>
      )}

      {activeTab === "qa" && (
        <section className="dashboard-grid qa-grid">
          <article className="panel highlight-panel beta-hero">
            <span className="team-label">Live Deploy QA</span>
            <h2>{liveDeployQa.statusLabel}</h2>
            <p className="muted">
              Panou pentru testare reala pe Netlify + Supabase: environment,
              auth, save/load, reset cariera si debug packet pentru bug reports.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>QA score</span>
                <strong>{liveDeployQa.score}/100</strong>
              </div>
              <div className="metric">
                <span>Passed</span>
                <strong>{liveDeployQa.passCount}</strong>
              </div>
              <div className="metric">
                <span>Warnings</span>
                <strong>{liveDeployQa.warningCount}</strong>
              </div>
              <div className="metric">
                <span>Blockers</span>
                <strong>{liveDeployQa.failCount}</strong>
              </div>
            </div>
            <div className="progress-track large-progress" aria-label="Live QA score">
              <i style={{ width: `${liveDeployQa.score}%` }} />
            </div>
            <p className="muted small-note">
              Smoke test: {liveDeployQa.completedSmokeSteps}/
              {liveDeployQa.totalSmokeSteps} pasi completati.
            </p>
          </article>

          <article className="panel">
            <h3>Actiuni QA rapide</h3>
            <div className="button-stack beta-buttons">
              <button onClick={handleSaveLocal}>Save local</button>
              <button className="secondary-button" onClick={handleLoadLocal}>
                Load local
              </button>
              <button className="secondary-button" onClick={handleSaveSupabase}>
                Save Supabase
              </button>
              <button className="secondary-button" onClick={handleLoadSupabase}>
                Load Supabase
              </button>
              <button className="secondary-button" onClick={handleClearLocal}>
                Sterge local save
              </button>
              <button className="danger-button" onClick={handleDeleteSupabaseSave}>
                Sterge Supabase save
              </button>
              <button className="danger-button" onClick={handleResetCareerLocal}>
                Reset cariera locala
              </button>
            </div>
            <p className="muted small-note">
              Reset cariera locala sterge doar localStorage pentru userul curent.
              Salvarea cloud se sterge separat, intentionat, ca sa nu pierzi date
              din greseala.
            </p>
            {saveStatus && <p className="success-message">{saveStatus}</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Health checks</h3>
                <p className="muted">
                  Verificari pentru deploy live, configurare Supabase si fluxul
                  minim de gameplay.
                </p>
              </div>
              <span
                className={`status-pill ${liveDeployQa.failCount > 0 ? "danger" : liveDeployQa.warningCount > 0 ? "warning" : "ok"}`}
              >
                {liveDeployQa.failCount > 0
                  ? "Blockers"
                  : liveDeployQa.warningCount > 0
                    ? "Warnings"
                    : "Ready"}
              </span>
            </div>

            <div className="beta-check-grid">
              {liveDeployQa.checks.map((item) => (
                <article className={`beta-check-card ${item.status}`} key={item.id}>
                  <div className="section-header compact-header">
                    <div>
                      <span className="team-label">{item.id}</span>
                      <h4>{item.title}</h4>
                    </div>
                    <span
                      className={`status-badge ${item.status === "pass" ? "ok" : item.status === "warning" ? "warning" : "danger"}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="muted">{item.summary}</p>
                  <small>{item.action}</small>
                  <button
                    type="button"
                    className="secondary-button compact"
                    onClick={() => setActiveTab(item.targetTab as Tab)}
                  >
                    Deschide
                  </button>
                </article>
              ))}
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Smoke test checklist</h3>
                <p className="muted">
                  Pasii pe care sa ii faci dupa deploy, in ordine, cu un cont
                  real de test.
                </p>
              </div>
              <span className="status-pill ok">
                {liveDeployQa.completedSmokeSteps}/{liveDeployQa.totalSmokeSteps}
              </span>
            </div>
            <div className="onboarding-list qa-smoke-list">
              {liveDeployQa.smokeSteps.map((step) => (
                <button
                  type="button"
                  className={`onboarding-row ${step.completed ? "completed" : "pending"}`}
                  key={step.id}
                  onClick={() => setActiveTab(step.targetTab as Tab)}
                >
                  <span>{step.completed ? "✓" : "·"}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <small>{step.hint}</small>
                  </div>
                </button>
              ))}
            </div>
          </article>

          <article className="panel">
            <h3>Actiuni recomandate</h3>
            <div className="beta-action-list">
              {liveDeployQa.recommendedActions.map((action) => (
                <div className="beta-action" key={action}>
                  <span>→</span>
                  <p>{action}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Debug packet pentru bug report</h3>
                <p className="muted">
                  Copiaza aceste informatii cand apare o problema in Netlify sau
                  Supabase. Nu include parola sau chei private.
                </p>
              </div>
              <span className="status-pill ok">v{APP_VERSION}</span>
            </div>
            <div className="debug-grid">
              {liveDeployQa.debugFacts.map((fact) => (
                <div className="debug-fact" key={fact.label}>
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {activeTab === "admin" && (
        <section className="dashboard-grid admin-grid">
          <article className="panel highlight-panel beta-hero">
            <span className="team-label">Admin / Debug Panel</span>
            <h2>{adminDebug.statusLabel}</h2>
            <p className="muted">
              Panou pentru inspectare rapida a carierei, validare save payload,
              export debug si verificari admin fara sa expui parola sau tokenul.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>Admin score</span>
                <strong>{adminDebug.score}/100</strong>
              </div>
              <div className="metric">
                <span>Passed</span>
                <strong>{adminDebug.passCount}</strong>
              </div>
              <div className="metric">
                <span>Warnings</span>
                <strong>{adminDebug.warningCount}</strong>
              </div>
              <div className="metric">
                <span>Blockers</span>
                <strong>{adminDebug.failCount}</strong>
              </div>
            </div>
            <div className="progress-track large-progress" aria-label="Admin score">
              <i style={{ width: `${adminDebug.score}%` }} />
            </div>
            <p className="muted small-note">{adminDebug.exportSummary}</p>
          </article>

          <article className="panel">
            <h3>Admin actions</h3>
            <div className="button-stack beta-buttons">
              <button onClick={handleValidateAdminPayload}>Valideaza payload</button>
              <button className="secondary-button" onClick={handleGenerateAdminExport}>
                Genereaza export debug
              </button>
              <button className="secondary-button" onClick={handleCopyAdminExport}>
                Copiaza export
              </button>
              <button className="secondary-button" onClick={handleSaveLocal}>
                Force local save
              </button>
              <button className="secondary-button" onClick={runBoardReview}>
                Force board review
              </button>
            </div>
            <p className="muted small-note">
              Exportul este pentru debugging: include snapshot-ul carierei si
              rapoartele admin, dar nu include parola sau Supabase access token.
            </p>
            {saveStatus && <p className="success-message">{saveStatus}</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Save facts</h3>
                <p className="muted">
                  Rezumat tehnic rapid pentru cariera curenta si payload-ul care
                  se salveaza local/Supabase.
                </p>
              </div>
              <span className="status-pill ok">v{APP_VERSION}</span>
            </div>
            <div className="debug-grid">
              {adminDebug.saveFacts.map((fact) => (
                <div className="debug-fact" key={fact.label}>
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Admin checks</h3>
                <p className="muted">
                  Verificari de integritate pentru auth, save, lot, sezon,
                  finante si istoricele modulelor principale.
                </p>
              </div>
              <span
                className={`status-pill ${adminDebug.failCount > 0 ? "danger" : adminDebug.warningCount > 0 ? "warning" : "ok"}`}
              >
                {adminDebug.failCount > 0
                  ? "Needs attention"
                  : adminDebug.warningCount > 0
                    ? "Review"
                    : "Healthy"}
              </span>
            </div>
            <div className="beta-check-grid">
              {adminDebug.checks.map((item) => (
                <article className={`beta-check-card ${item.status}`} key={item.id}>
                  <div className="section-header compact-header">
                    <div>
                      <span className="team-label">{item.id}</span>
                      <h4>{item.title}</h4>
                    </div>
                    <span
                      className={`status-badge ${item.status === "pass" ? "ok" : item.status === "warning" ? "warning" : "danger"}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="muted">{item.summary}</p>
                  <small>{item.action}</small>
                  <button
                    type="button"
                    className="secondary-button compact"
                    onClick={() => setActiveTab(item.targetTab as Tab)}
                  >
                    Deschide
                  </button>
                </article>
              ))}
            </div>
          </article>

          <article className="panel">
            <h3>Recomandari debug</h3>
            <div className="beta-action-list">
              {adminDebug.testActions.map((action) => (
                <div className="beta-action" key={action}>
                  <span>→</span>
                  <p>{action}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Export debug</h3>
                <p className="muted">
                  Genereaza, copiaza si trimite acest text cand vrei sa analizam
                  un bug din deploy-ul live.
                </p>
              </div>
              <span className="status-pill ok">no tokens</span>
            </div>
            <textarea
              className="admin-export-textarea"
              value={adminExportText}
              readOnly
              placeholder="Apasa Genereaza export debug ca sa vezi snapshot-ul carierei aici."
            />
          </article>
        </section>
      )}

      {activeTab === "standings" && (
        <section className="panel">
          <div className="section-header">
            <div>
              <h3>Clasament sezon {game.seasonNumber}</h3>
              <p className="muted">
                Criterii: puncte, golaveraj, goluri marcate, victorii.
              </p>
            </div>
            <span className="status-pill ok">
              {seasonFinished
                ? "Final"
                : `Runda ${Math.max(game.currentRound - 1, 0)}/${maxRound}`}
            </span>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Echipa</th>
                  <th>M</th>
                  <th>V</th>
                  <th>E</th>
                  <th>I</th>
                  <th>GM</th>
                  <th>GP</th>
                  <th>GD</th>
                  <th>Pt</th>
                </tr>
              </thead>
              <tbody>
                {game.standings.map((row, index) => (
                  <tr
                    className={
                      row.teamId === USER_TEAM_ID ? "user-row" : undefined
                    }
                    key={row.teamId}
                  >
                    <td>{index + 1}</td>
                    <td>{row.teamName}</td>
                    <td>{row.played}</td>
                    <td>{row.wins}</td>
                    <td>{row.draws}</td>
                    <td>{row.losses}</td>
                    <td>{row.goalsFor}</td>
                    <td>{row.goalsAgainst}</td>
                    <td>{row.goalDifference}</td>
                    <td>
                      <strong>{row.points}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

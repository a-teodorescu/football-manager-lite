import { type FormEvent, useEffect, useMemo, useState } from "react";
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
import { MatchEventType, SetPieceRole, SubstitutionInstruction, Tactic, Team } from "./engine/types";
import {
  applyLineupSelectionToTeam,
  autoPickLineup,
  getFormationSlots,
  getSelectedLineupPlayerIds,
  validateLineupSelection,
} from "./engine/lineupSelection";
import {
  addSubstitutionToTeam,
  autoPickSubstitutionPlan,
  buildSubstitutionReport,
  clearSubstitutionPlan,
  normalizeSubstitutionPlan,
} from "./engine/substitutions";
import {
  autoPickSetPieces,
  buildSetPieceReport,
  getSetPieceRoles,
  scorePlayerForSetPieceRole,
  setSetPieceAssignment,
} from "./engine/setPieces";
import { buildAdvancedTacticsReport, calculateAdvancedTeamStrength, getAdvancedTacticValueOptions, normalizeAdvancedTactic } from "./engine/advancedTactics";
import { calculateTeamStrength } from "./engine/teamStrength";
import {
  buildMatchAnalysis,
  buildMatchPreview,
} from "./engine/matchExperience";
import { buildManagerDashboard } from "./engine/managerDashboard";
import { buildManagerNavigationReport } from "./engine/managerNavigation";
import { buildUiExperience } from "./engine/uiExperience";
import { buildBetaReadiness } from "./engine/betaReadiness";
import { buildLiveDeployQa } from "./engine/liveDeployQa";
import { buildAdminDebugPanel } from "./engine/adminDebug";
import { buildStabilityReport } from "./engine/stabilization";
import { buildBetaPolishReleaseReport } from "./engine/betaPolishRelease";
import { buildPerformanceDeployReport } from "./engine/performanceDeploy";
import { buildPwaInstallReport } from "./engine/pwaInstall";
import {
  buildNotificationCenterReport,
  createInitialNotificationSettings,
  type BrowserNotificationPermission,
  type NotificationReminder,
  type NotificationSettings,
} from "./engine/notificationsReminders";
import { buildRealDatabaseModeReport } from "./engine/realDatabaseMode";
import { buildOppositionScoutReport, getMatchPlanRiskLabel } from "./engine/oppositionScout";
import { buildCareerTrophyRoomReport } from "./engine/careerTrophyRoom";
import { buildMultiplayerLeagueReport } from "./engine/multiplayerLeague";
import {
  addInboxMessages,
  buildAcademyNewsMessage,
  buildClubSnapshotMessage,
  buildContractNewsMessage,
  buildCupNewsMessage,
  buildInboxSummary,
  buildRoundNewsMessages,
  buildScoutingNewsMessage,
  buildSeasonNewsMessages,
  buildSponsorshipNewsMessage,
  buildFacilityNewsMessage,
  buildTrainingNewsMessage,
  buildTransferNewsMessage,
  createWelcomeInboxMessages,
  getInboxCategoryLabel,
  markAllInboxMessagesRead,
  markInboxMessageRead,
  type InboxMessage,
} from "./engine/newsInbox";
import {
  buildLeagueOverview,
  applyTeamIdentity,
  getLeagueTierLabel,
  getTeamAmbitionLabel,
  getTeamStyleLabel,
} from "./engine/leagueExpansion";
import {
  buildPlayerIdentityOverview,
  buildPlayerIdentitySummary,
  getPersonalityLabel,
  getPreferredFootLabel,
  getRoleLabel,
  normalizeTeamPlayerIdentities,
} from "./engine/playerIdentity";
import {
  buildPlayerPortrait,
  buildPortraitGallery,
  getPortraitFrameLabel,
  getPortraitMoodLabel,
} from "./engine/playerPortraits";
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
  calculateSponsorshipRoundIncome,
  createInitialSponsorshipState,
  expireSponsorshipDeals,
  getSponsorshipCategoryLabel,
  getSponsorshipHealth,
  refreshSponsorshipOffers,
  signSponsorshipDeal,
  type SponsorshipRecord,
  type SponsorshipState,
} from "./engine/sponsorship";
import {
  calculateFacilityRoundImpact,
  createInitialFacilities,
  getEffectiveAcademyRoundCost,
  getFacilitiesOverview,
  getFacilityTrainingBonus,
  getFacilityUpgradeOptions,
  getFacilityLabel,
  prepareFacilitiesForNewSeason,
  upgradeFacility,
  type FacilityRecord,
  type FacilityUpgradeType,
  type StadiumFacilitiesState,
} from "./engine/stadiumFacilities";
import {
  buildStaffImpact,
  calculateStaffWageCost,
  createInitialStaffState,
  getAdjustedScoutingCost,
  getStaffRoleLabel,
  hireStaffMember,
  refreshStaffCandidates,
  type StaffState,
} from "./engine/staffCoaching";
import {
  buildPlayerStatsAwardsReport,
} from "./engine/playerStatsAwards";
import {
  applyDifficultyToCost,
  applyDifficultyToMoney,
  buildBalanceReport,
  createInitialDifficultySettings,
  getDifficultyLabel,
  getDifficultyOptions,
  type DifficultyLevel,
  type DifficultySettings,
} from "./engine/gameBalance";
import {
  answerPressConference,
  buildMediaReport,
  buildRoundMediaMessage,
  createInitialMediaState,
  type PressAnswer,
  type MediaState,
} from "./engine/mediaCenter";
import {
  buildFanReport,
  createInitialFanState,
  updateFanStateAfterRound,
  type FanState,
} from "./engine/fanExperience";
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
  createInitialEuropeanCompetitionState,
  getCurrentEuropeanRoundName,
  getEuropeanRoundLabel,
  getUserEuropeanMatch,
  isUserStillInEurope,
  simulateEuropeanRound,
  type EuropeanCompetitionRecord,
  type EuropeanCompetitionState,
} from "./engine/europeanCompetitions";
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
import { SAVE_SCHEMA_VERSION } from "./lib/saveMigration";
import {
  AuthSession,
  getStoredAuthSession,
  loginWithEmail,
  logoutFromSupabase,
  registerWithEmail,
} from "./lib/authService";
import {
  buildRealDatabaseSnapshot,
  syncRealDatabaseSnapshot,
} from "./lib/realDatabaseService";

const APP_VERSION = "4.9.0";
const APP_TSX_ESTIMATED_LINES = 10550;
const ENGINE_MODULE_COUNT = 45;
const MAIN_TAB_COUNT = 45;

const DEFAULT_CLUB_PROFILE: ClubProfile = {
  name: "FC Bucuresti",
  city: "Bucuresti",
  primaryColor: "#2563eb",
  secondaryColor: "#f8fafc",
};

type Tab =
  | "dashboard"
  | "inbox"
  | "league"
  | "board"
  | "squad"
  | "lineup"
  | "subs"
  | "setpieces"
  | "prep"
  | "players"
  | "portraits"
  | "staff"
  | "records"
  | "trophy"
  | "media"
  | "fans"
  | "difficulty"
  | "training"
  | "medical"
  | "transfers"
  | "scouting"
  | "sponsorships"
  | "facilities"
  | "finance"
  | "contracts"
  | "academy"
  | "seasons"
  | "cup"
  | "europe"
  | "tactics"
  | "advancedTactics"
  | "match"
  | "fixtures"
  | "standings"
  | "help"
  | "beta"
  | "release"
  | "performance"
  | "pwa"
  | "notifications"
  | "stability"
  | "database"
  | "multiplayer"
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
  europeanState: EuropeanCompetitionState;
  europeanHistory: EuropeanCompetitionRecord[];
  boardState: BoardState;
  inboxMessages: InboxMessage[];
  sponsorships: SponsorshipState;
  sponsorshipHistory: SponsorshipRecord[];
  facilities: StadiumFacilitiesState;
  facilityHistory: FacilityRecord[];
  staff: StaffState;
  difficulty: DifficultySettings;
  media: MediaState;
  fans: FanState;
  notificationSettings: NotificationSettings;
  notificationHistory: NotificationReminder[];
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
    const normalizedTeam = normalizeTeamPlayerIdentities(
      normalizeTeamContracts(
        normalizeTeamStatus(applyTeamIdentity(team)),
        seasonNumber,
      ),
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
  const profiledTeams = applyClubProfileToTeams(
    createMockLeagueTeams(),
    normalizedClubProfile,
    seasonNumber,
  );
  const userTeamWithLineup = autoPickLineup(
    getUserTeam(profiledTeams),
    userTactic.formation,
  );
  const userTeamWithSetPieces = autoPickSetPieces(
    userTeamWithLineup,
    userTactic.formation,
  );
  const teams = profiledTeams.map((team) =>
    team.id === USER_TEAM_ID ? userTeamWithSetPieces : team,
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
    europeanState: createInitialEuropeanCompetitionState(teams, seasonNumber),
    europeanHistory: [],
    boardState: createInitialBoardState(seasonNumber),
    sponsorships: createInitialSponsorshipState({
      seasonNumber,
      team: getUserTeam(teams),
      boardConfidence: 60,
    }),
    sponsorshipHistory: [],
    facilities: createInitialFacilities(getUserTeam(teams), seasonNumber),
    facilityHistory: [],
    staff: createInitialStaffState(seasonNumber, getUserTeam(teams)),
    difficulty: createInitialDifficultySettings(),
    media: createInitialMediaState(seasonNumber, normalizedClubProfile.name),
    fans: createInitialFanState(getUserTeam(teams)),
    notificationSettings: createInitialNotificationSettings(),
    notificationHistory: [],
    inboxMessages: createWelcomeInboxMessages({
      seasonNumber,
      clubName: normalizedClubProfile.name,
      city: normalizedClubProfile.city,
    }),
    teams,
    fixtures,
    results: [],
    standings: createInitialStandings(teams),
  };
}

function getEventClass(type: MatchEventType): string {
  if (type === "goal") return "event event-goal";
  if (type === "yellow_card") return "event event-card";
  if (type === "substitution") return "event event-substitution";
  if (type === "set_piece") return "event event-set-piece";
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
    version: SAVE_SCHEMA_VERSION,
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
    europeanState: game.europeanState,
    europeanHistory: game.europeanHistory,
    boardState: game.boardState,
    inboxMessages: game.inboxMessages,
    sponsorships: game.sponsorships,
    sponsorshipHistory: game.sponsorshipHistory,
    facilities: game.facilities,
    facilityHistory: game.facilityHistory,
    staff: game.staff,
    difficulty: game.difficulty,
    media: game.media,
    fans: game.fans,
    notificationSettings: game.notificationSettings,
    notificationHistory: game.notificationHistory,
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
  const profiledTeams = applyClubProfileToTeams(
    payload.teams,
    clubProfile,
    payload.seasonNumber,
  );
  const loadedUserTeam = getUserTeam(profiledTeams);
  const userTeamWithLineup = loadedUserTeam.lineupPlayerIds?.length
    ? loadedUserTeam
    : autoPickLineup(loadedUserTeam, payload.userTactic.formation);
  const userTeamWithSetPieces = userTeamWithLineup.setPieceAssignments
    ? userTeamWithLineup
    : autoPickSetPieces(userTeamWithLineup, payload.userTactic.formation);
  const teams = profiledTeams.map((team) =>
    team.id === USER_TEAM_ID ? userTeamWithSetPieces : team,
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
    europeanState:
      payload.europeanState ?? createInitialEuropeanCompetitionState(teams, payload.seasonNumber),
    europeanHistory: payload.europeanHistory ?? [],
    boardState:
      payload.boardState ?? createInitialBoardState(payload.seasonNumber),
    inboxMessages:
      payload.inboxMessages ??
      createWelcomeInboxMessages({
        seasonNumber: payload.seasonNumber,
        clubName: clubProfile.name,
        city: clubProfile.city,
      }),
    sponsorships:
      payload.sponsorships ??
      createInitialSponsorshipState({
        seasonNumber: payload.seasonNumber,
        team: getUserTeam(teams),
        boardConfidence: payload.boardState?.jobSecurity ?? 60,
      }),
    sponsorshipHistory: payload.sponsorshipHistory ?? [],
    facilities: payload.facilities ?? createInitialFacilities(getUserTeam(teams), payload.seasonNumber),
    facilityHistory: payload.facilityHistory ?? [],
    staff: payload.staff ?? createInitialStaffState(payload.seasonNumber, getUserTeam(teams)),
    difficulty: payload.difficulty ?? createInitialDifficultySettings(),
    media: payload.media ?? createInitialMediaState(payload.seasonNumber, clubProfile.name),
    fans: payload.fans ?? createInitialFanState(getUserTeam(teams)),
    notificationSettings: payload.notificationSettings ?? createInitialNotificationSettings(),
    notificationHistory: payload.notificationHistory ?? [],
    teams: teams.map((team) =>
      normalizeTeamPlayerIdentities(
        normalizeTeamContracts(normalizeTeamStatus(team), payload.seasonNumber),
      ),
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

function applyUserTeamUpdate(game: GameState, updatedUserTeam: Team): GameState {
  return {
    ...game,
    teams: game.teams.map((team) =>
      team.id === USER_TEAM_ID ? updatedUserTeam : team,
    ),
    fixtures: updateUserTeamInFutureFixtures(game.fixtures, updatedUserTeam),
  };
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
  const [databaseSyncStatus, setDatabaseSyncStatus] = useState("");
  const [pwaServiceWorkerStatus, setPwaServiceWorkerStatus] = useState<"registered" | "pending" | "unsupported" | "error">(() =>
    typeof navigator !== "undefined" && "serviceWorker" in navigator ? "pending" : "unsupported",
  );
  const [pwaInstallPromptAvailable, setPwaInstallPromptAvailable] = useState(false);
  const [pwaInstalled, setPwaInstalled] = useState(() =>
    typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)").matches,
  );
  const [notificationPermission, setNotificationPermission] = useState<BrowserNotificationPermission>(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission as BrowserNotificationPermission;
  });
  const [subOutPlayerId, setSubOutPlayerId] = useState("");
  const [subInPlayerId, setSubInPlayerId] = useState("");
  const [subMinute, setSubMinute] = useState(60);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleServiceWorkerRegistered = () => setPwaServiceWorkerStatus("registered");
    const handleServiceWorkerError = () => setPwaServiceWorkerStatus("error");
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPwaInstallPromptAvailable(true);
    };
    const handleInstalled = () => {
      setPwaInstalled(true);
      setPwaInstallPromptAvailable(false);
    };

    window.addEventListener("fml-sw-registered", handleServiceWorkerRegistered);
    window.addEventListener("fml-sw-error", handleServiceWorkerError);
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistration()
        .then((registration) => {
          if (registration) setPwaServiceWorkerStatus("registered");
        })
        .catch(() => setPwaServiceWorkerStatus("error"));
    } else {
      setPwaServiceWorkerStatus("unsupported");
    }

    const standaloneQuery = window.matchMedia?.("(display-mode: standalone)");
    const handleDisplayModeChange = () => setPwaInstalled(Boolean(standaloneQuery?.matches));
    standaloneQuery?.addEventListener?.("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener("fml-sw-registered", handleServiceWorkerRegistered);
      window.removeEventListener("fml-sw-error", handleServiceWorkerError);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      standaloneQuery?.removeEventListener?.("change", handleDisplayModeChange);
    };
  }, []);

  const maxRound = useMemo(() => getMaxRound(game.fixtures), [game.fixtures]);
  const seasonFinished = game.currentRound > maxRound;
  const trainingRoundKey = getTrainingRoundKey(
    game.seasonNumber,
    game.currentRound,
  );
  const trainingDoneThisRound = game.lastTrainingRoundKey === trainingRoundKey;
  const userTeam = useMemo(() => getUserTeam(game.teams), [game.teams]);
  const lineupReport = useMemo(
    () => validateLineupSelection(userTeam, game.userTactic.formation),
    [userTeam, game.userTactic.formation],
  );
  const lineupSlots = useMemo(
    () => getFormationSlots(game.userTactic.formation),
    [game.userTactic.formation],
  );
  const selectedLineupIds = useMemo(
    () => getSelectedLineupPlayerIds(userTeam, game.userTactic.formation),
    [userTeam, game.userTactic.formation],
  );
  const selectedLineupIdSet = useMemo(
    () => new Set(selectedLineupIds),
    [selectedLineupIds],
  );
  const substitutionReport = useMemo(
    () => buildSubstitutionReport(userTeam, game.userTactic.formation),
    [userTeam, game.userTactic.formation],
  );
  const setPieceReport = useMemo(
    () => buildSetPieceReport(userTeam, game.userTactic.formation),
    [userTeam, game.userTactic.formation],
  );
  const setPieceRoles = useMemo(() => getSetPieceRoles(), []);
  const substitutionPlayerById = useMemo(
    () => new Map(userTeam.players.map((player) => [player.id, player])),
    [userTeam],
  );
  const playerIdentityOverview = useMemo(
    () => buildPlayerIdentityOverview(userTeam),
    [userTeam],
  );
  const portraitGallery = useMemo(
    () =>
      buildPortraitGallery(userTeam, {
        primaryColor: game.clubProfile.primaryColor,
        secondaryColor: game.clubProfile.secondaryColor,
      }),
    [userTeam, game.clubProfile.primaryColor, game.clubProfile.secondaryColor],
  );
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
  const oppositionScoutReport = useMemo(
    () =>
      buildOppositionScoutReport({
        fixture: nextUserFixture,
        userTeam,
        userTactic: game.userTactic,
      }),
    [nextUserFixture, userTeam, game.userTactic],
  );
  const currentCupRoundName = getCurrentCupRoundName(game.cupState);
  const userCupMatch = getUserCupMatch(game.cupState);
  const userStillInCup = isUserStillInCup(game.cupState);
  const currentEuropeanRoundName = getCurrentEuropeanRoundName(game.europeanState);
  const userEuropeanMatch = getUserEuropeanMatch(game.europeanState);
  const userStillInEurope = isUserStillInEurope(game.europeanState);
  const latestEuropeanRecord = game.europeanHistory[0];
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
  const realDatabaseSnapshot = useMemo(
    () => buildRealDatabaseSnapshot(currentSavePayload),
    [currentSavePayload],
  );
  const realDatabaseMode = useMemo(
    () =>
      buildRealDatabaseModeReport({
        appVersion: APP_VERSION,
        authenticated: Boolean(authSession),
        supabaseConfigured: isSupabaseConfigured(),
        userId: authSession?.user.id,
        saveSchemaVersion: SAVE_SCHEMA_VERSION,
        payloadVersion: currentSavePayload.version,
        teamsCount: game.teams.length,
        playersCount: userTeam.players.length,
        fixturesCount: game.fixtures.length,
        resultsCount: game.results.length,
        financeReportsCount: game.financeHistory.length,
        inboxMessagesCount: game.inboxMessages.length,
        normalizedTables: realDatabaseSnapshot.tables,
      }),
    [
      authSession,
      currentSavePayload.version,
      game.teams.length,
      userTeam.players.length,
      game.fixtures.length,
      game.results.length,
      game.financeHistory.length,
      game.inboxMessages.length,
      realDatabaseSnapshot.tables,
    ],
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

  const stabilityReport = useMemo(
    () =>
      buildStabilityReport({
        appVersion: APP_VERSION,
        saveSchemaVersion: SAVE_SCHEMA_VERSION,
        savePayloadVersion: currentSavePayload.version,
        savePayloadBytes: adminSavePayloadBytes,
        appTsxLines: APP_TSX_ESTIMATED_LINES,
        totalTabs: MAIN_TAB_COUNT,
        errorBoundaryEnabled: true,
        fullcheckAvailable: true,
        hasRecentError: Boolean(errorMessage),
        teamsCount: game.teams.length,
        fixturesCount: game.fixtures.length,
        standingsCount: game.standings.length,
        userPlayersCount: userTeam.players.length,
        engineModuleCount: ENGINE_MODULE_COUNT,
      }),
    [
      currentSavePayload.version,
      adminSavePayloadBytes,
      errorMessage,
      game.teams.length,
      game.fixtures.length,
      game.standings.length,
      userTeam.players.length,
    ],
  );

  const leagueOverview = useMemo(
    () =>
      buildLeagueOverview({
        teams: game.teams,
        standings: game.standings,
        fixtures: game.fixtures,
        currentRound: game.currentRound,
        maxRound,
        userTeamId: USER_TEAM_ID,
      }),
    [game.teams, game.standings, game.fixtures, game.currentRound, maxRound],
  );

  const inboxSummary = useMemo(
    () => buildInboxSummary(game.inboxMessages),
    [game.inboxMessages],
  );

  const multiplayerLeague = useMemo(
    () =>
      buildMultiplayerLeagueReport({
        appVersion: APP_VERSION,
        authenticated: Boolean(authSession),
        supabaseConfigured: isSupabaseConfigured(),
        realDatabaseReadyScore: realDatabaseMode.readinessScore,
        userId: authSession?.user.id,
        managerName: authSession?.user.email?.split("@")[0],
        clubName: game.clubProfile.name,
        seasonNumber: game.seasonNumber,
        currentRound: game.currentRound,
        maxRound,
        points: userStanding.points,
        position: userClubPosition,
        jobSecurity: game.boardState.jobSecurity,
        cashBalance: game.finance.cashBalance,
        inboxUnreadCount: inboxSummary.unreadCount,
        hasCloudSave: cloudSaveLikelyAvailable,
      }),
    [
      authSession,
      realDatabaseMode.readinessScore,
      game.clubProfile.name,
      game.seasonNumber,
      game.currentRound,
      maxRound,
      userStanding.points,
      userClubPosition,
      game.boardState.jobSecurity,
      game.finance.cashBalance,
      inboxSummary.unreadCount,
      cloudSaveLikelyAvailable,
    ],
  );


  const sponsorshipHealth = useMemo(
    () => getSponsorshipHealth(game.sponsorships),
    [game.sponsorships],
  );
  const latestSponsorshipRecord = game.sponsorshipHistory[0];
  const facilitiesOverview = useMemo(
    () =>
      getFacilitiesOverview({
        facilities: game.facilities,
        team: userTeam,
        standings: game.standings,
      }),
    [game.facilities, userTeam, game.standings],
  );
  const staffImpact = useMemo(() => buildStaffImpact(game.staff), [game.staff]);
  const staffWageCost = calculateStaffWageCost(game.staff);
  const playerStatsAwards = useMemo(
    () =>
      buildPlayerStatsAwardsReport({
        team: userTeam,
        results: game.results,
        standings: game.standings,
        seasonNumber: game.seasonNumber,
      }),
    [userTeam, game.results, game.standings, game.seasonNumber],
  );
  const careerTrophyRoom = useMemo(
    () =>
      buildCareerTrophyRoomReport({
        clubName: game.clubProfile.name,
        team: userTeam,
        standings: game.standings,
        results: game.results,
        seasonNumber: game.seasonNumber,
        currentRound: game.currentRound,
        maxRound,
        seasonHistory: game.seasonHistory,
        cupHistory: game.cupHistory,
        europeanHistory: game.europeanHistory,
        playerStats: playerStatsAwards.stats,
      }),
    [
      game.clubProfile.name,
      userTeam,
      game.standings,
      game.results,
      game.seasonNumber,
      game.currentRound,
      maxRound,
      game.seasonHistory,
      game.cupHistory,
      game.europeanHistory,
      playerStatsAwards.stats,
    ],
  );
  const mediaReport = useMemo(() => buildMediaReport(game.media), [game.media]);
  const fanReport = useMemo(
    () =>
      buildFanReport({
        state: game.fans,
        team: userTeam,
        standings: game.standings,
        facilities: game.facilities,
      }),
    [game.fans, userTeam, game.standings, game.facilities],
  );
  const balanceReport = useMemo(
    () =>
      buildBalanceReport({
        difficulty: game.difficulty,
        finance: game.finance,
        team: userTeam,
        jobSecurity: game.boardState.jobSecurity,
        wageBill: wageBill + staffWageCost,
        squadValue,
      }),
    [game.difficulty, game.finance, userTeam, game.boardState.jobSecurity, wageBill, staffWageCost, squadValue],
  );
  const facilityUpgradeOptions = useMemo(
    () => getFacilityUpgradeOptions(game.facilities),
    [game.facilities],
  );
  const latestFacilityRecord = game.facilityHistory[0];
  const effectiveAcademyRoundCost = getEffectiveAcademyRoundCost(
    game.youthAcademy,
    academyRoundCost,
    game.facilities,
  );
  const sponsorshipCanRefresh =
    game.sponsorships.lastRefreshRoundKey !==
    getTrainingRoundKey(game.seasonNumber, game.currentRound);

  const latestInboxMessages = useMemo(
    () => game.inboxMessages.slice(0, 8),
    [game.inboxMessages],
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
  const advancedTactic = useMemo(
    () => normalizeAdvancedTactic(game.userTactic),
    [game.userTactic],
  );
  const advancedTacticsReport = useMemo(
    () => buildAdvancedTacticsReport(userTeam, game.userTactic),
    [userTeam, game.userTactic],
  );
  const advancedTeamStrength = useMemo(
    () => calculateAdvancedTeamStrength(userTeam, game.userTactic),
    [userTeam, game.userTactic],
  );
  const advancedTacticOptions = getAdvancedTacticValueOptions();

  const betaPolishRelease = useMemo(
    () =>
      buildBetaPolishReleaseReport({
        appVersion: APP_VERSION,
        saveSchemaVersion: SAVE_SCHEMA_VERSION,
        betaReadinessScore: betaReadiness.score,
        stabilityScore: stabilityReport.score,
        adminScore: adminDebug.score,
        databaseReadinessScore: realDatabaseMode.readinessScore,
        multiplayerReadinessScore: multiplayerLeague.readinessScore,
        tacticalScore: advancedTacticsReport.tacticalScore,
        authenticated: Boolean(authSession),
        supabaseConfigured: isSupabaseConfigured(),
        localSaveAvailable,
        cloudSaveLikelyAvailable,
        resultsCount: game.results.length,
        seasonHistoryCount: game.seasonHistory.length,
        inboxUnreadCount: inboxSummary.unreadCount,
        savePayloadBytes: adminSavePayloadBytes,
        totalTabs: MAIN_TAB_COUNT,
        engineChecksCount: ENGINE_MODULE_COUNT,
        hasRecentError: Boolean(errorMessage),
      }),
    [
      betaReadiness.score,
      stabilityReport.score,
      adminDebug.score,
      realDatabaseMode.readinessScore,
      multiplayerLeague.readinessScore,
      advancedTacticsReport.tacticalScore,
      authSession,
      localSaveAvailable,
      cloudSaveLikelyAvailable,
      game.results.length,
      game.seasonHistory.length,
      inboxSummary.unreadCount,
      adminSavePayloadBytes,
      errorMessage,
    ],
  );

  const performanceDeploy = useMemo(
    () =>
      buildPerformanceDeployReport({
        appVersion: APP_VERSION,
        saveSchemaVersion: SAVE_SCHEMA_VERSION,
        appEstimatedLines: APP_TSX_ESTIMATED_LINES,
        totalTabs: MAIN_TAB_COUNT,
        engineModuleCount: ENGINE_MODULE_COUNT,
        buildUsesManualChunks: true,
        reactVendorChunk: true,
        engineChunk: true,
        servicesChunk: true,
        sourcemapDisabled: true,
        packageLockExcluded: true,
        nodeModulesExcluded: true,
        distExcluded: true,
        netlifyNodeVersion: "20",
        netlifyBuildCommand: "npm run build",
        netlifyPublishDir: "dist",
        fullcheckAvailable: true,
        bundleWarningResolved: true,
      }),
    [],
  );

  const pwaInstall = useMemo(
    () =>
      buildPwaInstallReport({
        appVersion: APP_VERSION,
        saveSchemaVersion: SAVE_SCHEMA_VERSION,
        manifestLinked: true,
        manifestHasIcons: true,
        manifestHasStandaloneDisplay: true,
        serviceWorkerSupported: typeof navigator !== "undefined" && "serviceWorker" in navigator,
        serviceWorkerStatus: pwaServiceWorkerStatus,
        offlineFallbackAvailable: true,
        cacheStrategyVersioned: true,
        secureContext:
          typeof window === "undefined" ||
          window.isSecureContext ||
          window.location.hostname === "localhost",
        netlifyCompatible: true,
        localSaveAvailable,
        installPromptAvailable: pwaInstallPromptAvailable,
        displayModeStandalone: pwaInstalled,
      }),
    [localSaveAvailable, pwaInstallPromptAvailable, pwaInstalled, pwaServiceWorkerStatus],
  );

  const notificationCenter = useMemo(
    () =>
      buildNotificationCenterReport({
        appVersion: APP_VERSION,
        saveSchemaVersion: SAVE_SCHEMA_VERSION,
        settings: game.notificationSettings,
        permissionState: notificationPermission,
        serviceWorkerStatus: pwaServiceWorkerStatus,
        pwaInstalled,
        secureContext:
          typeof window === "undefined" ||
          window.isSecureContext ||
          window.location.hostname === "localhost",
        authenticated: Boolean(authSession),
        localSaveAvailable,
        cloudSaveLikelyAvailable,
        currentRound: game.currentRound,
        maxRound,
        trainingDoneThisRound,
        hasSelectedFixture: Boolean(nextUserFixture),
        lowFitnessPlayersCount: lowFitnessPlayers.length,
        injuredPlayersCount: injuredPlayers.length,
        expiringContractsCount: expiringContracts.length,
        expiredContractsCount: expiredContracts.length,
        boardSackRiskPercent: game.boardState.sackRiskPercent,
        inboxUnreadCount: inboxSummary.unreadCount,
        lastSaveStatus: saveStatus,
      }),
    [
      game.notificationSettings,
      notificationPermission,
      pwaServiceWorkerStatus,
      pwaInstalled,
      authSession,
      localSaveAvailable,
      cloudSaveLikelyAvailable,
      game.currentRound,
      maxRound,
      trainingDoneThisRound,
      nextUserFixture,
      lowFitnessPlayers.length,
      injuredPlayers.length,
      expiringContracts.length,
      expiredContracts.length,
      game.boardState.sackRiskPercent,
      inboxSummary.unreadCount,
      saveStatus,
    ],
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

  const managerNavigation = useMemo(
    () =>
      buildManagerNavigationReport({
        team: userTeam,
        formation: game.userTactic.formation,
        currentRound: game.currentRound,
        maxRound,
        seasonFinished,
        nextMatchAvailable: Boolean(nextUserFixture),
        trainingDoneThisRound,
        unreadInboxCount: inboxSummary.unreadCount,
        transferBudget: game.transferBudget,
        cashBalance: game.finance.cashBalance,
      }),
    [
      userTeam,
      game.userTactic.formation,
      game.currentRound,
      maxRound,
      seasonFinished,
      nextUserFixture,
      trainingDoneThisRound,
      inboxSummary.unreadCount,
      game.transferBudget,
      game.finance.cashBalance,
    ],
  );

  function setTemporaryStatus(status: SaveStatus) {
    setSaveStatus(status);
    setErrorMessage("");
  }

  function handleMarkInboxMessageRead(messageId: string) {
    setGame((previous) => ({
      ...previous,
      inboxMessages: markInboxMessageRead(previous.inboxMessages, messageId),
    }));
  }

  function handleMarkAllInboxRead() {
    setGame((previous) => ({
      ...previous,
      inboxMessages: markAllInboxMessagesRead(previous.inboxMessages),
    }));
    setTemporaryStatus("Toate mesajele din inbox au fost marcate ca citite.");
  }

  function handleCreateClubSnapshotMessage() {
    setGame((previous) => {
      const position = Math.max(
        1,
        previous.standings.findIndex((row) => row.teamId === USER_TEAM_ID) + 1 || 1,
      );
      return {
        ...previous,
        inboxMessages: addInboxMessages(previous.inboxMessages, [
          buildClubSnapshotMessage({
            seasonNumber: previous.seasonNumber,
            round: previous.currentRound,
            team: getUserTeam(previous.teams),
            cashBalance: previous.finance.cashBalance,
            position,
          }),
        ]),
      };
    });
    setTemporaryStatus("Snapshot nou adaugat in inbox.");
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
      const sponsorshipIncome = calculateSponsorshipRoundIncome({
        state: previous.sponsorships,
        roundResults: simulation.roundResults,
        standings: simulation.updatedStandings,
        userTeamId: USER_TEAM_ID,
        seasonNumber: previous.seasonNumber,
        round: previous.currentRound,
      });
      const facilityImpact = calculateFacilityRoundImpact({
        facilities: previous.facilities,
        userTeam: updatedUserTeam,
        roundResults: simulation.roundResults,
        standings: simulation.updatedStandings,
        seasonNumber: previous.seasonNumber,
        round: previous.currentRound,
      });
      const financeUpdate = applyRoundFinances({
        finance: previous.finance,
        userTeam: updatedUserTeam,
        roundResults: simulation.roundResults,
        standings: simulation.updatedStandings,
        seasonNumber: previous.seasonNumber,
        round: previous.currentRound,
        academyCost: getEffectiveAcademyRoundCost(
          previous.youthAcademy,
          getAcademyRoundCost(previous.youthAcademy),
          previous.facilities,
        ),
        commercialIncome: applyDifficultyToMoney(sponsorshipIncome.totalIncome, previous.difficulty),
        facilitiesIncome: applyDifficultyToMoney(facilityImpact.matchdayBoost + facilityImpact.commercialIncome, previous.difficulty),
        facilitiesMaintenance: facilityImpact.maintenanceCost,
        staffCost: applyDifficultyToCost(calculateStaffWageCost(previous.staff), previous.difficulty),
      });
      const mediaUpdate = buildRoundMediaMessage({
        state: previous.media,
        seasonNumber: previous.seasonNumber,
        round: previous.currentRound,
        team: updatedUserTeam,
        roundResults: simulation.roundResults,
        standings: simulation.updatedStandings,
      });
      const fanUpdate = updateFanStateAfterRound({
        state: previous.fans,
        team: updatedUserTeam,
        standings: simulation.updatedStandings,
        facilities: previous.facilities,
        roundResults: simulation.roundResults,
        seasonNumber: previous.seasonNumber,
        round: previous.currentRound,
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
        sponsorshipHistory: [
          ...sponsorshipIncome.records,
          ...previous.sponsorshipHistory,
        ].slice(0, 24),
        facilityHistory: [facilityImpact.record, ...previous.facilityHistory].slice(0, 24),
        media: mediaUpdate.state,
        fans: fanUpdate.state,
        selectedFixtureId: lastFixtureId,
      };

      const reviewedBoard = evaluateBoardForGame(nextState, true);
      const roundMessages = [
        ...buildRoundNewsMessages({
          seasonNumber: previous.seasonNumber,
          round: previous.currentRound,
          clubName: previous.clubProfile.name,
          roundResults: simulation.roundResults,
          standings: simulation.updatedStandings,
          financeReport: financeUpdate.report,
          statusReport: simulation.statusReport,
          boardReview: reviewedBoard.reviews[0],
          userTeamId: USER_TEAM_ID,
        }),
        ...sponsorshipIncome.records.map(buildSponsorshipNewsMessage),
        buildFacilityNewsMessage(facilityImpact.record),
        {
          id: `media-s${previous.seasonNumber}-r${previous.currentRound}`,
          seasonNumber: previous.seasonNumber,
          round: previous.currentRound,
          category: "media" as const,
          tone: mediaUpdate.message.tone === "critical" ? "warning" as const : "info" as const,
          title: mediaUpdate.message.headline,
          body: mediaUpdate.message.body,
          source: "media",
          targetTab: "media",
          createdAt: new Date().toISOString(),
          read: false,
        },
        {
          id: `fans-s${previous.seasonNumber}-r${previous.currentRound}`,
          seasonNumber: previous.seasonNumber,
          round: previous.currentRound,
          category: "fans" as const,
          tone: fanUpdate.state.happiness < 45 ? "warning" as const : "info" as const,
          title: "Fan update",
          body: fanUpdate.record.summary,
          source: "fans",
          targetTab: "fans",
          createdAt: new Date().toISOString(),
          read: false,
        },
      ];

      return {
        ...nextState,
        boardState: reviewedBoard,
        inboxMessages: addInboxMessages(previous.inboxMessages, roundMessages),
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
      let nextSponsorshipHistory = [...previous.sponsorshipHistory];
      let nextFacilityHistory = [...previous.facilityHistory];
      let nextMedia = previous.media;
      let nextFans = previous.fans;
      let nextInboxMessages = [...previous.inboxMessages];
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
        const sponsorshipIncome = calculateSponsorshipRoundIncome({
          state: previous.sponsorships,
          roundResults: simulation.roundResults,
          standings: simulation.updatedStandings,
          userTeamId: USER_TEAM_ID,
          seasonNumber: previous.seasonNumber,
          round,
        });
        const facilityImpact = calculateFacilityRoundImpact({
          facilities: previous.facilities,
          userTeam: updatedUserTeam,
          roundResults: simulation.roundResults,
          standings: simulation.updatedStandings,
          seasonNumber: previous.seasonNumber,
          round,
        });
        const financeUpdate = applyRoundFinances({
          finance: nextFinance,
          userTeam: updatedUserTeam,
          roundResults: simulation.roundResults,
          standings: simulation.updatedStandings,
          seasonNumber: previous.seasonNumber,
          round,
          academyCost: getEffectiveAcademyRoundCost(
            previous.youthAcademy,
            getAcademyRoundCost(previous.youthAcademy),
            previous.facilities,
          ),
          commercialIncome: applyDifficultyToMoney(sponsorshipIncome.totalIncome, previous.difficulty),
          facilitiesIncome: applyDifficultyToMoney(facilityImpact.matchdayBoost + facilityImpact.commercialIncome, previous.difficulty),
          facilitiesMaintenance: facilityImpact.maintenanceCost,
          staffCost: applyDifficultyToCost(calculateStaffWageCost(previous.staff), previous.difficulty),
        });
        const mediaUpdate = buildRoundMediaMessage({
          state: nextMedia,
          seasonNumber: previous.seasonNumber,
          round,
          team: updatedUserTeam,
          roundResults: simulation.roundResults,
          standings: simulation.updatedStandings,
        });
        const fanUpdate = updateFanStateAfterRound({
          state: nextFans,
          team: updatedUserTeam,
          standings: simulation.updatedStandings,
          facilities: previous.facilities,
          roundResults: simulation.roundResults,
          seasonNumber: previous.seasonNumber,
          round,
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
        nextSponsorshipHistory = [
          ...sponsorshipIncome.records,
          ...nextSponsorshipHistory,
        ].slice(0, 24);
        nextFacilityHistory = [facilityImpact.record, ...nextFacilityHistory].slice(0, 24);
        nextMedia = mediaUpdate.state;
        nextFans = fanUpdate.state;
        nextInboxMessages = addInboxMessages(
          nextInboxMessages,
          [
            ...buildRoundNewsMessages({
              seasonNumber: previous.seasonNumber,
              round,
              clubName: previous.clubProfile.name,
              roundResults: simulation.roundResults,
              standings: simulation.updatedStandings,
              financeReport: financeUpdate.report,
              statusReport: simulation.statusReport,
              userTeamId: USER_TEAM_ID,
            }),
            ...sponsorshipIncome.records.map(buildSponsorshipNewsMessage),
            buildFacilityNewsMessage(facilityImpact.record),
            {
              id: `media-s${previous.seasonNumber}-r${round}`,
              seasonNumber: previous.seasonNumber,
              round,
              category: "media" as const,
              tone: mediaUpdate.message.tone === "critical" ? "warning" as const : "info" as const,
              title: mediaUpdate.message.headline,
              body: mediaUpdate.message.body,
              source: "media",
              targetTab: "media",
              createdAt: new Date().toISOString(),
              read: false,
            },
            {
              id: `fans-s${previous.seasonNumber}-r${round}`,
              seasonNumber: previous.seasonNumber,
              round,
              category: "fans" as const,
              tone: fanUpdate.state.happiness < 45 ? "warning" as const : "info" as const,
              title: "Fan update",
              body: fanUpdate.record.summary,
              source: "fans",
              targetTab: "fans",
              createdAt: new Date().toISOString(),
              read: false,
            },
          ],
        );
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
        sponsorshipHistory: nextSponsorshipHistory,
        facilityHistory: nextFacilityHistory,
        media: nextMedia,
        fans: nextFans,
        selectedFixtureId: lastFixtureId,
      };

      const reviewedBoard = evaluateBoardForGame(nextState, true);
      const finalUserPosition = Math.max(
        1,
        nextStandings.findIndex((row) => row.teamId === USER_TEAM_ID) + 1 || 1,
      );
      const finalMessages = addInboxMessages(nextInboxMessages, [
        buildClubSnapshotMessage({
          seasonNumber: previous.seasonNumber,
          round: finalRound,
          team: getUserTeam(nextTeams),
          cashBalance: nextFinance.cashBalance,
          position: finalUserPosition,
        }),
      ]);

      return {
        ...nextState,
        boardState: reviewedBoard,
        inboxMessages: addInboxMessages(finalMessages, reviewedBoard.reviews[0]
          ? [
              {
                id: `board-season-s${previous.seasonNumber}-${reviewedBoard.reviews[0].id}`,
                seasonNumber: previous.seasonNumber,
                round: finalRound,
                category: "board",
                tone: reviewedBoard.reviews[0].sackRiskPercent >= 55 ? "danger" : reviewedBoard.reviews[0].sackRiskPercent >= 30 ? "warning" : "info",
                title: `Board review: job security ${reviewedBoard.reviews[0].jobSecurity}`,
                body: reviewedBoard.reviews[0].summary,
                source: "board",
                targetTab: "board",
                createdAt: new Date().toISOString(),
                read: false,
              },
            ]
          : []),
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
      const nextBoardState = createInitialBoardState(
        nextSeason.seasonNumber,
        previous.boardState.managerReputation,
      );
      const sponsorshipExpiry = expireSponsorshipDeals({
        state: previous.sponsorships,
        nextSeasonNumber: nextSeason.seasonNumber,
        round: 1,
      });
      const sponsorshipRefresh = refreshSponsorshipOffers({
        state: sponsorshipExpiry.state,
        team: getUserTeam(finalTeams),
        seasonNumber: nextSeason.seasonNumber,
        round: 1,
        boardConfidence: nextBoardState.jobSecurity,
      });
      const facilitiesReset = prepareFacilitiesForNewSeason(
        previous.facilities,
        nextSeason.seasonNumber,
      );
      const staffRefresh = refreshStaffCandidates({
        state: previous.staff,
        seasonNumber: nextSeason.seasonNumber,
        round: 1,
        team: getUserTeam(finalTeams),
        extraBoost: previous.seasonHistory.length > 0 ? 1 : 0,
      });

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
        europeanState: createInitialEuropeanCompetitionState(finalTeams, nextSeason.seasonNumber),
        europeanHistory: previous.europeanHistory.slice(0, 12),
        boardState: nextBoardState,
        sponsorships: sponsorshipRefresh.state,
        sponsorshipHistory: [
          sponsorshipRefresh.record,
          ...sponsorshipExpiry.records,
          ...previous.sponsorshipHistory,
        ].slice(0, 24),
        facilities: facilitiesReset.facilities,
        facilityHistory: [facilitiesReset.record, ...previous.facilityHistory].slice(0, 24),
        staff: staffRefresh.state,
        media: createInitialMediaState(nextSeason.seasonNumber, previous.clubProfile.name),
        fans: createInitialFanState(getUserTeam(finalTeams)),
        teams: finalTeams,
        fixtures: applyClubProfileToFixtures(
          finalFixtures,
          previous.clubProfile,
        ),
        results: [],
        standings: finalStandings,
        selectedFixtureId: undefined,
        inboxMessages: addInboxMessages(
          previous.inboxMessages,
          [
            ...buildSeasonNewsMessages(nextSeason.seasonRecord),
            ...contractResolution.records.map(buildContractNewsMessage),
            ...sponsorshipExpiry.records.map(buildSponsorshipNewsMessage),
            buildSponsorshipNewsMessage(sponsorshipRefresh.record),
            buildFacilityNewsMessage(facilitiesReset.record),
            {
              id: `staff-refresh-s${nextSeason.seasonNumber}-r1`,
              seasonNumber: nextSeason.seasonNumber,
              round: 1,
              category: "system" as const,
              tone: "info" as const,
              title: "Staff shortlist refreshed",
              body: staffRefresh.record.summary,
              source: "staff",
              targetTab: "staff",
              createdAt: new Date().toISOString(),
              read: false,
            },
            ...createWelcomeInboxMessages({
              seasonNumber: nextSeason.seasonNumber,
              clubName: previous.clubProfile.name,
              city: previous.clubProfile.city,
            }),
          ],
        ),
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

        const reviewedBoard = evaluateBoardForGame(nextState, true);

        return {
          ...nextState,
          boardState: reviewedBoard,
          inboxMessages: addInboxMessages(previous.inboxMessages, [
            buildCupNewsMessage(cupSimulation.record),
            ...(reviewedBoard.reviews[0]
              ? [
                  {
                    id: `board-cup-s${previous.seasonNumber}-${reviewedBoard.reviews[0].id}`,
                    seasonNumber: previous.seasonNumber,
                    round: 100 + cupSimulation.record.roundIndex,
                    category: "board" as const,
                    tone: reviewedBoard.reviews[0].sackRiskPercent >= 55 ? "danger" as const : reviewedBoard.reviews[0].sackRiskPercent >= 30 ? "warning" as const : "info" as const,
                    title: `Board review: job security ${reviewedBoard.reviews[0].jobSecurity}`,
                    body: reviewedBoard.reviews[0].summary,
                    source: "board",
                    targetTab: "board",
                    createdAt: new Date().toISOString(),
                    read: false,
                  },
                ]
              : []),
          ]),
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

  function simulateNextEuropeanRound() {
    if (game.europeanState.status === "completed") {
      setErrorMessage("Competitia europeana este deja terminata pentru sezonul curent.");
      setSaveStatus("");
      return;
    }

    setGame((previous) => {
      try {
        const europeanSimulation = simulateEuropeanRound({
          state: previous.europeanState,
          teams: previous.teams,
          seasonNumber: previous.seasonNumber,
          userTactic: previous.userTactic,
        });

        const nextFinance =
          europeanSimulation.prizeMoney > 0
            ? {
                ...previous.finance,
                cashBalance:
                  previous.finance.cashBalance + europeanSimulation.prizeMoney,
              }
            : previous.finance;

        setTemporaryStatus(europeanSimulation.record.summary);

        const nextState: GameState = {
          ...previous,
          europeanState: europeanSimulation.state,
          europeanHistory: [
            europeanSimulation.record,
            ...previous.europeanHistory,
          ].slice(0, 16),
          teams: europeanSimulation.teams,
          fixtures: updateUserTeamInFutureFixtures(
            previous.fixtures,
            getUserTeam(europeanSimulation.teams),
          ),
          statusHistory: [
            europeanSimulation.statusReport,
            ...previous.statusHistory,
          ].slice(0, 12),
          finance: nextFinance,
        };

        const reviewedBoard = evaluateBoardForGame(nextState, true);

        return {
          ...nextState,
          boardState: reviewedBoard,
          inboxMessages: addInboxMessages(previous.inboxMessages, [
            {
              id: `europe-s${previous.seasonNumber}-r${europeanSimulation.record.roundIndex}`,
              seasonNumber: previous.seasonNumber,
              round: 120 + europeanSimulation.record.roundIndex,
              category: "match" as const,
              tone: europeanSimulation.record.userAdvanced ? "success" as const : europeanSimulation.record.userParticipated ? "warning" as const : "info" as const,
              title: getEuropeanRoundLabel(europeanSimulation.record.roundName),
              body: europeanSimulation.record.summary,
              source: "europe",
              targetTab: "europe",
              createdAt: new Date().toISOString(),
              read: false,
            },
            ...(reviewedBoard.reviews[0]
              ? [
                  {
                    id: `board-europe-s${previous.seasonNumber}-${reviewedBoard.reviews[0].id}`,
                    seasonNumber: previous.seasonNumber,
                    round: 120 + europeanSimulation.record.roundIndex,
                    category: "board" as const,
                    tone: reviewedBoard.reviews[0].sackRiskPercent >= 55 ? "danger" as const : reviewedBoard.reviews[0].sackRiskPercent >= 30 ? "warning" as const : "info" as const,
                    title: `Board review: job security ${reviewedBoard.reviews[0].jobSecurity}`,
                    body: reviewedBoard.reviews[0].summary,
                    source: "board",
                    targetTab: "board",
                    createdAt: new Date().toISOString(),
                    read: false,
                  },
                ]
              : []),
          ]),
        };
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Runda europeana nu a putut fi simulata.",
        );
        setSaveStatus("");
        return previous;
      }
    });

    setActiveTab("europe");
  }


  function runBoardReview() {
    setGame((previous) => {
      const reviewedBoard = evaluateBoardForGame(previous, true);
      const review = reviewedBoard.reviews[0];

      return {
        ...previous,
        boardState: reviewedBoard,
        inboxMessages: review
          ? addInboxMessages(previous.inboxMessages, [
              {
                id: `board-manual-s${previous.seasonNumber}-${review.id}`,
                seasonNumber: previous.seasonNumber,
                round: previous.currentRound,
                category: "board" as const,
                tone: review.sackRiskPercent >= 55 ? "danger" as const : review.sackRiskPercent >= 30 ? "warning" as const : "info" as const,
                title: `Board review: job security ${review.jobSecurity}`,
                body: review.summary,
                source: "board",
                targetTab: "board",
                createdAt: new Date().toISOString(),
                read: false,
              },
            ])
          : previous.inboxMessages,
      };
    });
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
        getFacilityTrainingBonus(previous.facilities) + buildStaffImpact(previous.staff).trainingBonus,
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
        inboxMessages: addInboxMessages(previous.inboxMessages, [
          buildTrainingNewsMessage(result),
        ]),
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

  function handleRefreshSponsorshipOffers() {
    setGame((previous) => {
      const refresh = refreshSponsorshipOffers({
        state: previous.sponsorships,
        team: getUserTeam(previous.teams),
        seasonNumber: previous.seasonNumber,
        round: previous.currentRound,
        boardConfidence: previous.boardState.jobSecurity,
      });

      setTemporaryStatus(refresh.record.summary);

      return {
        ...previous,
        sponsorships: refresh.state,
        sponsorshipHistory: [
          refresh.record,
          ...previous.sponsorshipHistory,
        ].slice(0, 24),
        inboxMessages: addInboxMessages(previous.inboxMessages, [
          buildSponsorshipNewsMessage(refresh.record),
        ]),
      };
    });

    setActiveTab("sponsorships");
  }

  function handleSignSponsorshipDeal(offerId: string) {
    setGame((previous) => {
      try {
        const signing = signSponsorshipDeal({
          state: previous.sponsorships,
          offerId,
          seasonNumber: previous.seasonNumber,
          round: previous.currentRound,
          boardConfidence: previous.boardState.jobSecurity,
        });

        setTemporaryStatus(signing.record.summary);

        return {
          ...previous,
          finance: {
            ...previous.finance,
            cashBalance: previous.finance.cashBalance + signing.signingBonus,
          },
          sponsorships: signing.state,
          sponsorshipHistory: [
            signing.record,
            ...previous.sponsorshipHistory,
          ].slice(0, 24),
          inboxMessages: addInboxMessages(previous.inboxMessages, [
            buildSponsorshipNewsMessage(signing.record),
          ]),
        };
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Sponsorizarea nu a putut fi semnata.",
        );
        setSaveStatus("");
        return previous;
      }
    });

    setActiveTab("sponsorships");
  }

  function handleUpgradeFacility(upgradeType: FacilityUpgradeType) {
    setGame((previous) => {
      try {
        const upgrade = upgradeFacility({
          facilities: previous.facilities,
          upgradeType,
          seasonNumber: previous.seasonNumber,
          round: previous.currentRound,
        });

        if (previous.finance.cashBalance < upgrade.cost) {
          throw new Error("Cash insuficient pentru upgrade-ul selectat.");
        }

        setTemporaryStatus(upgrade.record.summary);

        return {
          ...previous,
          finance: {
            ...previous.finance,
            cashBalance: previous.finance.cashBalance - upgrade.cost,
          },
          facilities: upgrade.facilities,
          facilityHistory: [upgrade.record, ...previous.facilityHistory].slice(0, 24),
          inboxMessages: addInboxMessages(previous.inboxMessages, [
            buildFacilityNewsMessage(upgrade.record),
          ]),
        };
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Upgrade-ul de facilitati nu a putut fi finalizat.",
        );
        setSaveStatus("");
        return previous;
      }
    });

    setActiveTab("facilities");
  }

  function handleRefreshStaffCandidates() {
    setGame((previous) => {
      const refresh = refreshStaffCandidates({
        state: previous.staff,
        seasonNumber: previous.seasonNumber,
        round: previous.currentRound,
        team: getUserTeam(previous.teams),
        extraBoost: previous.facilities.commercialZoneLevel,
      });

      setTemporaryStatus(refresh.record.summary);
      return {
        ...previous,
        staff: refresh.state,
        inboxMessages: addInboxMessages(previous.inboxMessages, [
          {
            id: `staff-refresh-s${previous.seasonNumber}-r${previous.currentRound}`,
            seasonNumber: previous.seasonNumber,
            round: previous.currentRound,
            category: "system" as const,
            tone: "info" as const,
            title: "Staff shortlist refreshed",
            body: refresh.record.summary,
            source: "staff",
            targetTab: "staff",
            createdAt: new Date().toISOString(),
            read: false,
          },
        ]),
      };
    });
    setActiveTab("staff");
  }

  function handleHireStaff(candidateId: string) {
    setGame((previous) => {
      try {
        const hiring = hireStaffMember({
          state: previous.staff,
          candidateId,
          seasonNumber: previous.seasonNumber,
          round: previous.currentRound,
        });
        if (previous.finance.cashBalance < hiring.signingCost) {
          throw new Error("Cash insuficient pentru signing bonus staff.");
        }
        setTemporaryStatus(hiring.record.summary);
        return {
          ...previous,
          finance: {
            ...previous.finance,
            cashBalance: previous.finance.cashBalance - hiring.signingCost,
          },
          staff: hiring.state,
          inboxMessages: addInboxMessages(previous.inboxMessages, [
            {
              id: hiring.record.id,
              seasonNumber: previous.seasonNumber,
              round: previous.currentRound,
              category: "system" as const,
              tone: "success" as const,
              title: `Staff hired: ${hiring.record.staffName}`,
              body: hiring.record.summary,
              source: "staff",
              targetTab: "staff",
              createdAt: new Date().toISOString(),
              read: false,
            },
          ]),
        };
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Staff-ul nu a putut fi angajat.");
        setSaveStatus("");
        return previous;
      }
    });
    setActiveTab("staff");
  }

  function handleSetDifficulty(level: DifficultyLevel) {
    setGame((previous) => ({
      ...previous,
      difficulty: { ...previous.difficulty, level },
    }));
    setTemporaryStatus(`Difficulty setat la ${getDifficultyLabel(level)}.`);
    setActiveTab("difficulty");
  }

  function handlePressAnswer(answer: PressAnswer) {
    setGame((previous) => ({
      ...previous,
      media: answerPressConference(previous.media, answer),
    }));
    setTemporaryStatus("Raspunsul de presa a fost inregistrat.");
    setActiveTab("media");
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

      const scoutCost = getAdjustedScoutingCost(getMarketScoutingCost(player), buildStaffImpact(previous.staff));
      if (previous.finance.cashBalance < scoutCost) {
        setErrorMessage("Cash insuficient pentru raportul de scouting.");
        setSaveStatus("");
        return previous;
      }

      const baseReport = buildScoutReport({
        player,
        team: getUserTeam(previous.teams),
        tactic: previous.userTactic,
        transferBudget: previous.transferBudget,
        finance: previous.finance,
        seasonNumber: previous.seasonNumber,
        round: previous.currentRound,
      });
      const report = { ...baseReport, scoutCost };

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
        inboxMessages: addInboxMessages(previous.inboxMessages, [
          buildScoutingNewsMessage(report),
        ]),
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
          inboxMessages: addInboxMessages(previous.inboxMessages, [
            buildTransferNewsMessage(transfer.record),
          ]),
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
          inboxMessages: addInboxMessages(previous.inboxMessages, [
            buildTransferNewsMessage(transfer.record),
          ]),
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
          inboxMessages: addInboxMessages(previous.inboxMessages, [
            buildContractNewsMessage(renewal.record),
          ]),
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
          inboxMessages: addInboxMessages(previous.inboxMessages, [
            buildContractNewsMessage(release.record),
          ]),
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
      const cost = getAdjustedScoutingCost(getScoutingCost(previous.youthAcademy), buildStaffImpact(previous.staff));
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
          { ...scouting.record, cost },
          ...previous.youthAcademyHistory,
        ].slice(0, 24),
        inboxMessages: addInboxMessages(previous.inboxMessages, [
          buildAcademyNewsMessage({ ...scouting.record, cost }),
        ]),
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
          inboxMessages: addInboxMessages(previous.inboxMessages, [
            buildAcademyNewsMessage(promotion.record),
          ]),
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
          inboxMessages: addInboxMessages(previous.inboxMessages, [
            buildAcademyNewsMessage(upgrade.record),
          ]),
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

  function handleToggleLineupPlayer(playerId: string) {
    setGame((previous) => {
      const currentUserTeam = getUserTeam(previous.teams);
      const currentIds = getSelectedLineupPlayerIds(
        currentUserTeam,
        previous.userTactic.formation,
      );
      const isSelected = currentIds.includes(playerId);

      if (!isSelected && currentIds.length >= 11) {
        setErrorMessage(
          "Ai deja 11 titulari. Scoate un jucator inainte sa adaugi altul.",
        );
        setSaveStatus("");
        return previous;
      }

      const nextIds = isSelected
        ? currentIds.filter((id) => id !== playerId)
        : [...currentIds, playerId];
      const updatedUserTeam = applyLineupSelectionToTeam(
        currentUserTeam,
        nextIds,
      );

      setTemporaryStatus(
        isSelected
          ? "Jucator scos din primul 11."
          : "Jucator adaugat in primul 11.",
      );
      setErrorMessage("");

      return applyUserTeamUpdate(previous, updatedUserTeam);
    });

    setActiveTab("lineup");
  }

  function handleAutoPickLineup() {
    setGame((previous) => {
      const updatedUserTeam = autoPickLineup(
        getUserTeam(previous.teams),
        previous.userTactic.formation,
      );
      setTemporaryStatus("Primul 11 a fost ales automat dupa forma, fitness si post.");
      setErrorMessage("");
      return applyUserTeamUpdate(previous, updatedUserTeam);
    });

    setActiveTab("lineup");
  }

  function handleAutoPickSubstitutions() {
    setGame((previous) => {
      const updatedUserTeam = autoPickSubstitutionPlan(
        getUserTeam(previous.teams),
        previous.userTactic.formation,
      );
      setTemporaryStatus("Planul de schimbari a fost generat automat pentru repriza a doua.");
      setErrorMessage("");
      return applyUserTeamUpdate(previous, updatedUserTeam);
    });

    setActiveTab("subs");
  }

  function handleClearSubstitutions() {
    setGame((previous) => {
      const updatedUserTeam = clearSubstitutionPlan(getUserTeam(previous.teams));
      setTemporaryStatus("Planul de schimbari a fost sters.");
      setErrorMessage("");
      return applyUserTeamUpdate(previous, updatedUserTeam);
    });

    setActiveTab("subs");
  }

  function handleAddManualSubstitution(instruction?: SubstitutionInstruction) {
    const nextInstruction: SubstitutionInstruction = instruction ?? {
      outPlayerId: subOutPlayerId,
      inPlayerId: subInPlayerId,
      minute: subMinute,
      reason: "Schimbare planificata manual de manager.",
    };

    if (!nextInstruction.outPlayerId || !nextInstruction.inPlayerId) {
      setErrorMessage("Alege jucatorul care iese si jucatorul care intra.");
      setSaveStatus("");
      setActiveTab("subs");
      return;
    }

    if (nextInstruction.outPlayerId === nextInstruction.inPlayerId) {
      setErrorMessage("Schimbarea trebuie sa aiba doi jucatori diferiti.");
      setSaveStatus("");
      setActiveTab("subs");
      return;
    }

    setGame((previous) => {
      const updatedUserTeam = addSubstitutionToTeam(
        getUserTeam(previous.teams),
        nextInstruction,
      );
      setTemporaryStatus("Schimbare adaugata in planul pentru urmatorul meci.");
      setErrorMessage("");
      return applyUserTeamUpdate(previous, updatedUserTeam);
    });

    setSubOutPlayerId("");
    setSubInPlayerId("");
    setSubMinute(60);
    setActiveTab("subs");
  }

  function handleAutoPickSetPieces() {
    setGame((previous) => {
      const updatedUserTeam = autoPickSetPieces(
        getUserTeam(previous.teams),
        previous.userTactic.formation,
      );
      setTemporaryStatus("Set pieces si capitanul au fost alese automat.");
      setErrorMessage("");
      return applyUserTeamUpdate(previous, updatedUserTeam);
    });

    setActiveTab("setpieces");
  }

  function handleSetPieceAssignment(role: SetPieceRole, playerId: string) {
    if (!playerId) {
      setErrorMessage("Alege un jucator valid pentru rolul selectat.");
      setSaveStatus("");
      setActiveTab("setpieces");
      return;
    }

    setGame((previous) => {
      const updatedUserTeam = setSetPieceAssignment(
        getUserTeam(previous.teams),
        role,
        playerId,
        previous.userTactic.formation,
      );
      setTemporaryStatus("Rolul de faza fixa a fost actualizat.");
      setErrorMessage("");
      return applyUserTeamUpdate(previous, updatedUserTeam);
    });

    setActiveTab("setpieces");
  }

  function handleApplyRecommendedMatchPlan() {
    setGame((previous) => {
      const futureFixture = previous.currentRound > getMaxRound(previous.fixtures)
        ? undefined
        : getRoundFixtures(previous.fixtures, previous.currentRound).find(
            (fixture) =>
              fixture.homeTeam.id === USER_TEAM_ID ||
              fixture.awayTeam.id === USER_TEAM_ID,
          );
      const currentUserTeam = getUserTeam(previous.teams);
      const report = buildOppositionScoutReport({
        fixture: futureFixture,
        userTeam: currentUserTeam,
        userTactic: previous.userTactic,
      });

      if (!report.available) {
        setErrorMessage("Nu exista un meci viitor disponibil pentru match prep.");
        setSaveStatus("");
        return previous;
      }

      const updatedUserTeam = autoPickSetPieces(
        autoPickLineup(currentUserTeam, report.recommendedTactic.formation),
        report.recommendedTactic.formation,
      );

      setTemporaryStatus("Planul recomandat de scout a fost aplicat tacticii si primului 11.");
      setErrorMessage("");
      return applyUserTeamUpdate(
        {
          ...previous,
          userTactic: report.recommendedTactic,
        },
        updatedUserTeam,
      );
    });

    setActiveTab("prep");
  }

  function updateTactic<Key extends keyof Tactic>(
    key: Key,
    value: Tactic[Key],
  ) {
    setGame((previous) => {
      const nextTactic = {
        ...previous.userTactic,
        [key]: value,
      };

      if (key !== "formation") {
        return {
          ...previous,
          userTactic: nextTactic,
        };
      }

      const updatedUserTeam = autoPickSetPieces(
        autoPickLineup(getUserTeam(previous.teams), nextTactic.formation),
        nextTactic.formation,
      );

      return applyUserTeamUpdate(
        {
          ...previous,
          userTactic: nextTactic,
        },
        updatedUserTeam,
      );
    });
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

  async function handleSyncRealDatabase() {
    if (!authSession) {
      setErrorMessage("Trebuie sa fii logat ca sa sincronizezi tabelele reale.");
      setDatabaseSyncStatus("");
      return;
    }

    try {
      const result = await syncRealDatabaseSnapshot(
        authSession.user.id,
        authSession.accessToken,
        getSavePayload(game, authSession.user.id),
      );
      setDatabaseSyncStatus(
        `Real DB sync OK: ${result.totalRows} rows in ${result.tables.length} tables.`,
      );
      setTemporaryStatus("Real Database Mode mirror sincronizat.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nu am putut sincroniza Real Database Mode.",
      );
      setDatabaseSyncStatus("");
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

  function handleDownloadReleaseSave() {
    try {
      const exportPayload = {
        appVersion: APP_VERSION,
        saveSchemaVersion: SAVE_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        note: "Portable save export. Nu include parola sau Supabase access token.",
        savePayload: currentSavePayload,
      };
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = betaPolishRelease.exportFilename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setTemporaryStatus(`Save export descarcat: ${betaPolishRelease.exportFilename}.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Nu am putut genera exportul save.",
      );
      setSaveStatus("");
    }
  }

  async function handleCopyReleaseNotes() {
    const notes = [
      `Football Manager Lite v${APP_VERSION}`,
      `Release status: ${betaPolishRelease.statusLabel} (${betaPolishRelease.score}/100)`,
      "",
      ...betaPolishRelease.releaseNotes.map((item) => `- ${item}`),
      "",
      "QA commands:",
      ...betaPolishRelease.qaCommands.map((item) => `- ${item}`),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(notes);
      setTemporaryStatus("Release notes copiate in clipboard.");
    } catch {
      setErrorMessage("Nu am putut copia automat release notes.");
      setSaveStatus("");
    }
  }

  function handleUpdateNotificationSetting(
    key: keyof NotificationSettings,
    value: boolean,
  ) {
    setGame((previous) => ({
      ...previous,
      notificationSettings: {
        ...previous.notificationSettings,
        [key]: value,
      },
    }));
  }

  async function handleRequestNotificationPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      setErrorMessage("Browserul curent nu suporta Notification API.");
      setSaveStatus("");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission as BrowserNotificationPermission);
      if (permission === "granted") {
        setGame((previous) => ({
          ...previous,
          notificationSettings: {
            ...previous.notificationSettings,
            enabled: true,
          },
        }));
        setTemporaryStatus("Notificarile browser au fost activate.");
      } else {
        setTemporaryStatus(`Permisiune notificari: ${permission}. In-app reminders raman disponibile.`);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nu am putut cere permisiunea de notificari.");
      setSaveStatus("");
    }
  }

  function handleSendTestNotification() {
    const title = "Football Manager Lite";
    const body = notificationCenter.reminders[0]?.summary ?? "Notification Center test OK.";

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/icons/icon.svg",
        tag: "football-manager-lite-test",
      });
      setTemporaryStatus("Notificare test trimisa catre browser/PWA.");
      return;
    }

    setTemporaryStatus("Test in-app OK. Pentru notificari browser, apasa Request permission si permite notificarile.");
  }

  function handleArchiveNotificationReminders() {
    setGame((previous) => ({
      ...previous,
      notificationHistory: [
        ...notificationCenter.reminders.map((item) => ({ ...item, read: true })),
        ...previous.notificationHistory,
      ].slice(0, 50),
    }));
    setTemporaryStatus("Reminder-ele curente au fost arhivate in save payload.");
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

      <nav className="tabs grouped-tabs" aria-label="Main navigation">
        {managerNavigation.groups.map((group) => (
          <div className="nav-group" key={group.id}>
            <span className="nav-group-label">{group.label}</span>
            <div className="nav-group-tabs">
              {group.tabs.map((item) => {
                const badge = item.tab === "inbox" && inboxSummary.unreadCount > 0 ? ` (${inboxSummary.unreadCount})` : "";
                return (
                  <button
                    key={item.tab}
                    className={activeTab === item.tab ? "tab active" : "tab"}
                    onClick={() => setActiveTab(item.tab as Tab)}
                    title={group.description}
                  >
                    {item.compactLabel ?? item.label}{badge}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
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
                <span>Inbox necitite</span>
                <strong>{inboxSummary.unreadCount}</strong>
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
                onClick={() => setActiveTab("inbox")}
              >
                News Inbox
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

          <article className="panel manager-hub-panel">
            <div className="section-header">
              <div>
                <h3>Manager hub</h3>
                <p className="muted">
                  Navigatie rapida si checklist pentru urmatoarea decizie.
                </p>
              </div>
              <span className={managerNavigation.matchReadinessScore >= 80 ? "status-pill ok" : "status-pill warning"}>
                {managerNavigation.matchReadinessLabel}
              </span>
            </div>

            <div className="manager-hub-score">
              <div>
                <span>Match readiness</span>
                <strong>{managerNavigation.matchReadinessScore}%</strong>
              </div>
              <div className="progress-track" aria-label="Match readiness progress">
                <i style={{ width: `${managerNavigation.matchReadinessScore}%` }} />
              </div>
              <p className="muted small-note">{managerNavigation.summary}</p>
            </div>

            <div className="quick-action-grid">
              {managerNavigation.quickActions.map((action) => (
                <button
                  type="button"
                  className={`quick-action-card ${action.priority}`}
                  key={action.id}
                  onClick={() => setActiveTab(action.targetTab as Tab)}
                >
                  <span>{action.priority}</span>
                  <strong>{action.label}</strong>
                  <small>{action.description}</small>
                </button>
              ))}
            </div>

            <div className="manager-checklist">
              {managerNavigation.checklist.map((item) => (
                <button
                  type="button"
                  className={`checklist-row ${item.ready ? "ready" : "review"}`}
                  key={item.id}
                  onClick={() => setActiveTab(item.targetTab as Tab)}
                >
                  <span>{item.ready ? "✓" : "!"}</span>
                  <div>
                    <strong>{item.label}</strong>
                    <small>{item.detail}</small>
                  </div>
                </button>
              ))}
            </div>
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

      {activeTab === "inbox" && (
        <section className="dashboard-grid inbox-grid">
          <article className="panel highlight-panel inbox-hero">
            <span className="team-label">News Inbox</span>
            <h2>Manager messages</h2>
            <p className="muted">
              Mesaje automate despre meciuri, board, transferuri, scouting,
              academie, cupa, finante si sezoane. Totul se salveaza in payload
              per user.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>Total mesaje</span>
                <strong>{inboxSummary.totalCount}</strong>
              </div>
              <div className="metric">
                <span>Necitite</span>
                <strong>{inboxSummary.unreadCount}</strong>
              </div>
              <div className="metric">
                <span>Urgente</span>
                <strong>{inboxSummary.urgentCount}</strong>
              </div>
              <div className="metric">
                <span>Ultima stire</span>
                <strong>{inboxSummary.latestHeadline}</strong>
              </div>
            </div>
            <div className="save-actions transfer-actions">
              <button type="button" onClick={handleMarkAllInboxRead}>
                Marcheaza tot ca citit
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleCreateClubSnapshotMessage}
              >
                Genereaza snapshot
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
            <h3>Categorii</h3>
            {inboxSummary.categories.length === 0 ? (
              <p className="muted">Inbox-ul este gol momentan.</p>
            ) : (
              <div className="mini-list">
                {inboxSummary.categories.map((item) => (
                  <div className="mini-row" key={item.category}>
                    <span>{item.label}</span>
                    <strong>
                      {item.count} mesaje · {item.unreadCount} necitite
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Ultimele mesaje</h3>
                <p className="muted">
                  Apasa pe un mesaj ca sa il marchezi citit si sa mergi la tabul
                  relevant.
                </p>
              </div>
              <span className="status-pill">
                {latestInboxMessages.length} afisate
              </span>
            </div>
            {latestInboxMessages.length === 0 ? (
              <p className="muted">
                Nu exista mesaje. Simuleaza o etapa sau genereaza un snapshot.
              </p>
            ) : (
              <div className="inbox-list">
                {latestInboxMessages.map((message) => (
                  <button
                    type="button"
                    className={`inbox-message ${message.tone} ${message.read ? "read" : "unread"}`}
                    key={message.id}
                    onClick={() => {
                      handleMarkInboxMessageRead(message.id);
                      setActiveTab(message.targetTab as Tab);
                    }}
                  >
                    <div className="inbox-message-header">
                      <span className={`status-badge ${message.tone}`}>
                        {getInboxCategoryLabel(message.category)}
                      </span>
                      <small>
                        S{message.seasonNumber} · R{message.round} · {message.read ? "citit" : "nou"}
                      </small>
                    </div>
                    <strong>{message.title}</strong>
                    <p>{message.body}</p>
                    <small className="muted">Sursa: {message.source}</small>
                  </button>
                ))}
              </div>
            )}
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Flux complet</h3>
                <p className="muted">
                  Istoricul este limitat la ultimele mesaje ca save-ul sa ramana
                  rapid pentru localStorage si Supabase.
                </p>
              </div>
              <span className="status-pill ok">max 90 mesaje</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Stare</th>
                    <th>Categorie</th>
                    <th>Titlu</th>
                    <th>Sezon</th>
                    <th>Runda</th>
                    <th>Actiune</th>
                  </tr>
                </thead>
                <tbody>
                  {game.inboxMessages.map((message) => (
                    <tr key={message.id}>
                      <td>{message.read ? "Citit" : "Nou"}</td>
                      <td>{getInboxCategoryLabel(message.category)}</td>
                      <td>{message.title}</td>
                      <td>{message.seasonNumber}</td>
                      <td>{message.round}</td>
                      <td>
                        <button
                          type="button"
                          className="table-action-button"
                          onClick={() => {
                            handleMarkInboxMessageRead(message.id);
                            setActiveTab(message.targetTab as Tab);
                          }}
                        >
                          Deschide
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}

      {activeTab === "league" && (
        <section className="dashboard-grid league-grid">
          <article className="panel highlight-panel">
            <span className="team-label">League expansion</span>
            <h2>{leagueOverview.leagueName}</h2>
            <p className="muted">
              Liga are identitate proprie: orase, stadioane, rivalitati, stiluri
              tactice AI si obiective diferite pentru fiecare club.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>Teams</span>
                <strong>{leagueOverview.totalTeams}</strong>
              </div>
              <div className="metric">
                <span>Rounds</span>
                <strong>{leagueOverview.totalRounds}</strong>
              </div>
              <div className="metric">
                <span>Your position</span>
                <strong>#{leagueOverview.userClubPosition ?? "-"}</strong>
              </div>
              <div className="metric">
                <span>Your tier</span>
                <strong>
                  {leagueOverview.userClubTier
                    ? getLeagueTierLabel(leagueOverview.userClubTier)
                    : "-"}
                </strong>
              </div>
            </div>
          </article>

          <article className="panel">
            <h3>League stories</h3>
            <div className="beta-action-list">
              <div className="beta-action">
                <span>1</span>
                <p>{leagueOverview.titleRaceSummary}</p>
              </div>
              <div className="beta-action">
                <span>2</span>
                <p>{leagueOverview.pressureZoneSummary}</p>
              </div>
              {leagueOverview.fixtureOfTheWeek && (
                <div className="beta-action">
                  <span>3</span>
                  <p>
                    {leagueOverview.fixtureOfTheWeek.headline}: {" "}
                    {leagueOverview.fixtureOfTheWeek.homeTeamName} vs {" "}
                    {leagueOverview.fixtureOfTheWeek.awayTeamName} · importance {" "}
                    {leagueOverview.fixtureOfTheWeek.importance}/100
                  </p>
                </div>
              )}
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Club identities</h3>
                <p className="muted">
                  Fiecare club are oras, stadion, stil AI, ambitie si rivalitate.
                  Aceste date se salveaza in cariera si ajuta liga sa para mai
                  vie fara sa complicam build-ul Netlify.
                </p>
              </div>
              <span className="status-pill ok">v{APP_VERSION}</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Club</th>
                    <th>City</th>
                    <th>Stadium</th>
                    <th>Style</th>
                    <th>Ambition</th>
                    <th>Tier</th>
                    <th>Rival</th>
                    <th>Form</th>
                  </tr>
                </thead>
                <tbody>
                  {leagueOverview.teams.map((team) => (
                    <tr
                      className={team.isUserClub ? "user-row" : undefined}
                      key={team.teamId}
                    >
                      <td>{team.position ?? "-"}</td>
                      <td>
                        <strong>{team.name}</strong>
                        <br />
                        <small>{team.shortName} · OVR {team.averageOverall}</small>
                      </td>
                      <td>{team.city}</td>
                      <td>{team.stadium}</td>
                      <td>{getTeamStyleLabel(team.tacticalStyle)}</td>
                      <td>{getTeamAmbitionLabel(team.ambition)}</td>
                      <td>{getLeagueTierLabel(team.tier)}</td>
                      <td>{team.rivalTeamName ?? "-"}</td>
                      <td>{team.formSummary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Rivalries</h3>
                <p className="muted">
                  Rivalitatile sunt folosite pentru storytelling, fixture of the
                  week si viitoare module de news inbox.
                </p>
              </div>
              <span className="status-pill ok">{leagueOverview.rivalries.length} rivalries</span>
            </div>
            <div className="beta-check-grid">
              {leagueOverview.rivalries.map((rivalry) => (
                <article className="beta-check-card pass" key={rivalry.id}>
                  <span className="team-label">{rivalry.label}</span>
                  <h4>
                    {rivalry.teamA} vs {rivalry.teamB}
                  </h4>
                  <p className="muted">Intensity {rivalry.intensity}/100</p>
                </article>
              ))}
            </div>
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
                  <th>Nat</th>
                  <th>Role</th>
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
                    <td>{player.flagEmoji ?? "🏳️"}</td>
                    <td>{getRoleLabel(player.role)}</td>
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

      {activeTab === "lineup" && (
        <section className="dashboard-grid lineup-grid">
          <article className="panel highlight-panel">
            <span className="team-label">Manual starting XI</span>
            <h2>Primul 11 - {game.userTactic.formation}</h2>
            <p className="muted">
              Alege titularii pentru urmatorul meci. Engine-ul foloseste acesti
              11 jucatori la forta echipei, suturi, goluri si cartonase.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>Titulari</span>
                <strong>{lineupReport.selectedPlayers.length}/11</strong>
              </div>
              <div className="metric">
                <span>Scor lineup</span>
                <strong>{lineupReport.score}/100</strong>
              </div>
              <div className="metric">
                <span>Schema</span>
                <strong>
                  {lineupSlots.GK}-{lineupSlots.DEF}-{lineupSlots.MID}-{lineupSlots.ATT}
                </strong>
              </div>
              <div className="metric">
                <span>Overall activ</span>
                <strong>{Math.round(teamStrength.overall)}</strong>
              </div>
              <div className="metric">
                <span>Accidentati titulari</span>
                <strong>
                  {lineupReport.selectedPlayers.filter(isPlayerInjured).length}
                </strong>
              </div>
              <div className="metric">
                <span>Banca</span>
                <strong>{lineupReport.benchPlayers.length}</strong>
              </div>
            </div>
            <div className="save-actions">
              <button type="button" onClick={handleAutoPickLineup}>
                Auto-pick cel mai bun 11
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setActiveTab("tactics")}
              >
                Schimba tactica
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setActiveTab("subs")}
              >
                Plan schimbari
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
            <h3>Status lineup</h3>
            <div className="stat-row">
              <span>GK / DEF / MID / ATT</span>
              <strong>
                {lineupReport.positionCounts.GK} / {lineupReport.positionCounts.DEF} / {lineupReport.positionCounts.MID} / {lineupReport.positionCounts.ATT}
              </strong>
            </div>
            <div className="stat-row">
              <span>Validare</span>
              <span
                className={
                  lineupReport.isValid
                    ? "status-badge ok"
                    : "status-badge warning"
                }
              >
                {lineupReport.isValid ? "Ready" : "Needs attention"}
              </span>
            </div>
            <p className="muted small-note">{lineupReport.summary}</p>
            <div className="history-list compact-list">
              {lineupReport.issues.map((issue) => (
                <div className="history-item" key={issue.message}>
                  <span className={`status-badge ${issue.severity}`}>
                    {issue.severity}
                  </span>
                  <small>{issue.message}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Selectie jucatori</h3>
                <p className="muted">
                  Selecteaza maximum 11 jucatori. Posturile recomandate se
                  bazeaza pe formatia activa.
                </p>
              </div>
              <span className={lineupReport.isValid ? "status-pill ok" : "status-pill warning"}>
                {game.userTactic.formation}
              </span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Jucator</th>
                    <th>Nat</th>
                    <th>Pos</th>
                    <th>OVR</th>
                    <th>FIT</th>
                    <th>MOR</th>
                    <th>FORM</th>
                    <th>Disponibilitate</th>
                    <th>Actiune</th>
                  </tr>
                </thead>
                <tbody>
                  {[...userTeam.players]
                    .sort((a, b) => {
                      const selectedDelta =
                        Number(selectedLineupIdSet.has(b.id)) -
                        Number(selectedLineupIdSet.has(a.id));
                      if (selectedDelta !== 0) return selectedDelta;
                      if (a.position !== b.position) {
                        return a.position.localeCompare(b.position);
                      }
                      return b.overall - a.overall;
                    })
                    .map((player) => {
                      const selected = selectedLineupIdSet.has(player.id);
                      return (
                        <tr
                          key={player.id}
                          className={
                            selected
                              ? "selected-player-row"
                              : isPlayerInjured(player) ||
                                  (player.fitness ?? 100) < 55
                                ? "player-alert-row"
                                : undefined
                          }
                        >
                          <td>
                            <span
                              className={
                                selected
                                  ? "status-badge ok"
                                  : "status-badge warning"
                              }
                            >
                              {selected ? "Titular" : "Banca"}
                            </span>
                          </td>
                          <td>{player.name}</td>
                          <td>{player.flagEmoji ?? "🏳️"}</td>
                          <td>
                            <strong>{player.position}</strong>
                          </td>
                          <td>
                            <strong>{player.overall}</strong>
                          </td>
                          <td>{player.fitness ?? 100}</td>
                          <td>{player.morale}</td>
                          <td>{player.form}</td>
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
                          <td>
                            <button
                              type="button"
                              className="secondary-button compact"
                              onClick={() => handleToggleLineupPlayer(player.id)}
                            >
                              {selected ? "Scoate" : "Adauga"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}

      {activeTab === "subs" && (
        <section className="dashboard-grid lineup-grid">
          <article className="panel highlight-panel">
            <span className="team-label">v4.5 Substitutions</span>
            <h2>Plan schimbari - banca activa</h2>
            <p className="muted">
              Pregateste pana la 3 schimbari pentru urmatorul meci. Engine-ul le
              executa la minutul ales si jucatorii intrati pot aparea apoi la
              suturi, goluri si cartonase.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>Schimbari</span>
                <strong>{substitutionReport.planned.length}/3</strong>
              </div>
              <div className="metric">
                <span>Banca</span>
                <strong>{substitutionReport.bench.length}</strong>
              </div>
              <div className="metric">
                <span>Bench strength</span>
                <strong>{substitutionReport.benchStrength}</strong>
              </div>
              <div className="metric">
                <span>Impact estimat</span>
                <strong>
                  {substitutionReport.expectedImpact >= 0 ? "+" : ""}
                  {substitutionReport.expectedImpact}
                </strong>
              </div>
              <div className="metric">
                <span>Status</span>
                <strong>{substitutionReport.isValid ? "Ready" : "Review"}</strong>
              </div>
              <div className="metric">
                <span>Formatia</span>
                <strong>{game.userTactic.formation}</strong>
              </div>
            </div>
            <div className="save-actions">
              <button type="button" onClick={handleAutoPickSubstitutions}>
                Auto-pick schimbari
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleClearSubstitutions}
              >
                Sterge planul
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setActiveTab("lineup")}
              >
                Inapoi la primul 11
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
            <h3>Status plan</h3>
            <p className="muted small-note">{substitutionReport.summary}</p>
            <div className="history-list compact-list">
              {substitutionReport.issues.map((issue) => (
                <div className="history-item" key={issue.message}>
                  <span className={`status-badge ${issue.severity}`}>
                    {issue.severity}
                  </span>
                  <small>{issue.message}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Adauga manual o schimbare</h3>
                <p className="muted">
                  Alege un titular care iese, o rezerva care intra si minutul.
                  Schimbarile duplicate sunt inlocuite automat.
                </p>
              </div>
              <span className={substitutionReport.isValid ? "status-pill ok" : "status-pill warning"}>
                max 3
              </span>
            </div>
            <div className="form-grid compact-form">
              <label>
                Iese
                <select
                  value={subOutPlayerId}
                  onChange={(event) => setSubOutPlayerId(event.target.value)}
                >
                  <option value="">Alege titular</option>
                  {substitutionReport.starters.map((player) => (
                    <option value={player.id} key={player.id}>
                      {player.name} · {player.position} · FIT {player.fitness ?? 100}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Intra
                <select
                  value={subInPlayerId}
                  onChange={(event) => setSubInPlayerId(event.target.value)}
                >
                  <option value="">Alege rezerva</option>
                  {substitutionReport.bench.map((player) => (
                    <option value={player.id} key={player.id}>
                      {player.name} · {player.position} · OVR {player.overall}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Minut
                <input
                  type="number"
                  min="1"
                  max="89"
                  value={subMinute}
                  onChange={(event) => setSubMinute(Number(event.target.value))}
                />
              </label>
              <button type="button" onClick={() => handleAddManualSubstitution()}>
                Adauga schimbare
              </button>
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Plan curent</h3>
                <p className="muted">
                  Aceste schimbari vor fi rulate in urmatorul meci oficial al
                  echipei tale, inclusiv in simularea de etapa.
                </p>
              </div>
              <span className="status-pill ok">
                {normalizeSubstitutionPlan(userTeam).length} active
              </span>
            </div>
            {substitutionReport.planned.length === 0 ? (
              <p className="muted">Nu exista schimbari planificate.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Min</th>
                      <th>Iese</th>
                      <th>Intra</th>
                      <th>Motiv</th>
                    </tr>
                  </thead>
                  <tbody>
                    {substitutionReport.planned.map((item) => {
                      const outPlayer = substitutionPlayerById.get(item.outPlayerId);
                      const inPlayer = substitutionPlayerById.get(item.inPlayerId);
                      return (
                        <tr key={`${item.outPlayerId}-${item.inPlayerId}`}>
                          <td>
                            <strong>{item.minute}'</strong>
                          </td>
                          <td>
                            {outPlayer?.name ?? "-"}
                            <br />
                            <small className="muted">
                              {outPlayer?.position ?? "-"} · FIT {outPlayer?.fitness ?? 100}
                            </small>
                          </td>
                          <td>
                            {inPlayer?.name ?? "-"}
                            <br />
                            <small className="muted">
                              {inPlayer?.position ?? "-"} · OVR {inPlayer?.overall ?? "-"}
                            </small>
                          </td>
                          <td>{item.reason ?? "Rotatie planificata"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Recomandari de pe banca</h3>
                <p className="muted">
                  Sugestii calculate din fitness, stamina, forma, post si impact
                  pentru finalul meciului.
                </p>
              </div>
              <span className="status-pill ok">deterministic</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Min</th>
                    <th>Schimbare</th>
                    <th>Post</th>
                    <th>Impact</th>
                    <th>Motiv</th>
                    <th>Actiune</th>
                  </tr>
                </thead>
                <tbody>
                  {substitutionReport.recommendations.map((item) => (
                    <tr key={`${item.outPlayerId}-${item.inPlayerId}`}>
                      <td>{item.minute}'</td>
                      <td>
                        <strong>{item.inPlayerName}</strong> pentru {item.outPlayerName}
                      </td>
                      <td>{item.position}</td>
                      <td>
                        <span className={item.impact >= 0 ? "status-badge ok" : "status-badge warning"}>
                          {item.impact >= 0 ? "+" : ""}{item.impact}
                        </span>
                      </td>
                      <td>{item.reason}</td>
                      <td>
                        <button
                          type="button"
                          className="secondary-button compact"
                          onClick={() =>
                            handleAddManualSubstitution({
                              outPlayerId: item.outPlayerId,
                              inPlayerId: item.inPlayerId,
                              minute: item.minute,
                              reason: item.reason,
                            })
                          }
                        >
                          Foloseste
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}

      {activeTab === "setpieces" && (
        <section className="dashboard-grid">
          <article className="panel highlight-panel wide-panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">Set Pieces & Captain</p>
                <h2>Specialisti pentru faze fixe</h2>
                <p className="description">
                  Alege capitanul, executantul de penalty-uri, lovituri libere si
                  cornere. Match engine-ul foloseste specialistii activi din primul
                  11, iar dupa schimbari alege automat cel mai bun jucator ramas pe teren.
                </p>
              </div>
              <span className={setPieceReport.isValid ? "status-pill ok" : "status-pill warning"}>
                v4.6
              </span>
            </div>
            <div className="metric-grid">
              <div className="metric">
                <span>Specialist score</span>
                <strong>{setPieceReport.specialistScore}</strong>
              </div>
              <div className="metric">
                <span>Dead-ball threat</span>
                <strong>{setPieceReport.deadBallThreat}</strong>
              </div>
              <div className="metric">
                <span>Captain</span>
                <strong>{setPieceReport.assignments[0]?.playerName ?? "-"}</strong>
              </div>
              <div className="metric">
                <span>Status</span>
                <strong>{setPieceReport.isValid ? "Ready" : "Review"}</strong>
              </div>
            </div>
            <div className="save-actions">
              <button type="button" onClick={handleAutoPickSetPieces}>
                Auto-pick set pieces
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setActiveTab("lineup")}
              >
                Verifica primul 11
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setActiveTab("subs")}
              >
                Verifica schimbarile
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
            <h3>Status faze fixe</h3>
            <p className="muted small-note">{setPieceReport.summary}</p>
            <div className="history-list compact-list">
              {setPieceReport.issues.map((issue) => (
                <div className="history-item" key={issue.message}>
                  <span className={`status-badge ${issue.severity}`}>
                    {issue.severity}
                  </span>
                  <small>{issue.message}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <h3>Impact in meci</h3>
            <p className="muted">
              Loviturile libere pot genera suturi directe, iar cornerele pot crea
              ocazii pentru fundasi, mijlocasi si atacanti. Daca un executant este
              schimbat sau nu este titular, engine-ul foloseste automat cel mai bun
              specialist ramas pe teren.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>Formatia</span>
                <strong>{game.userTactic.formation}</strong>
              </div>
              <div className="metric">
                <span>Titulari</span>
                <strong>{selectedLineupIds.length}</strong>
              </div>
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Atribuire roluri</h3>
                <p className="muted">
                  Recomandarea este ca executantii sa fie in primul 11 pentru urmatorul meci.
                </p>
              </div>
              <span className="status-pill ok">{setPieceReport.assignments.length} roluri</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Rol</th>
                    <th>Jucator</th>
                    <th>Post</th>
                    <th>Scor rol</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {setPieceReport.assignments.map((assignment) => (
                    <tr key={assignment.role}>
                      <td>
                        <strong>{assignment.label}</strong>
                      </td>
                      <td>
                        <select
                          value={assignment.playerId ?? ""}
                          onChange={(event) =>
                            handleSetPieceAssignment(assignment.role, event.target.value)
                          }
                        >
                          {userTeam.players
                            .slice()
                            .sort((a, b) => {
                              const starterDelta =
                                Number(selectedLineupIdSet.has(b.id)) -
                                Number(selectedLineupIdSet.has(a.id));
                              if (starterDelta !== 0) return starterDelta;
                              return (
                                scorePlayerForSetPieceRole(b, assignment.role) -
                                scorePlayerForSetPieceRole(a, assignment.role)
                              );
                            })
                            .map((player) => (
                              <option value={player.id} key={player.id}>
                                {player.name} · {player.position} · {selectedLineupIdSet.has(player.id) ? "Titular" : "Banca"}
                              </option>
                            ))}
                        </select>
                      </td>
                      <td>{assignment.position ?? "-"}</td>
                      <td>
                        <span className={assignment.score >= 70 ? "status-badge ok" : "status-badge warning"}>
                          {assignment.score}/100
                        </span>
                      </td>
                      <td>
                        {assignment.isStarter ? (
                          <span className="status-badge ok">Titular</span>
                        ) : (
                          <span className="status-badge warning">Banca</span>
                        )}
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
                <h3>Top specialisti din lot</h3>
                <p className="muted">
                  Top 3 pentru fiecare rol, calculat din atribute, forma, moral,
                  personalitate si picior preferat.
                </p>
              </div>
              <span className="status-pill ok">deterministic</span>
            </div>
            <div className="card-grid three-columns">
              {setPieceRoles.map((roleItem) => {
                const topPlayers = userTeam.players
                  .slice()
                  .sort(
                    (a, b) =>
                      scorePlayerForSetPieceRole(b, roleItem.role) -
                      scorePlayerForSetPieceRole(a, roleItem.role),
                  )
                  .slice(0, 3);

                return (
                  <div className="panel mini-card" key={roleItem.role}>
                    <h4>{roleItem.label}</h4>
                    <div className="history-list compact-list">
                      {topPlayers.map((player) => (
                        <div className="history-item" key={`${roleItem.role}-${player.id}`}>
                          <div>
                            <strong>{player.name}</strong>
                            <br />
                            <small className="muted">
                              {player.position} · {selectedLineupIdSet.has(player.id) ? "Titular" : "Banca"}
                            </small>
                          </div>
                          <span className="status-badge ok">
                            {scorePlayerForSetPieceRole(player, roleItem.role)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </section>
      )}

      {activeTab === "prep" && (
        <section className="dashboard-grid matchday-grid">
          <article className="panel highlight-panel wide-panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">Opposition Scout & Match Plan</p>
                <h2>Pregatirea urmatorului meci</h2>
                <p className="description">
                  Analizeaza adversarul din etapa curenta, compara punctele forte
                  si propune un plan tactic pe care il poti aplica direct inainte de simulare.
                </p>
              </div>
              <span className={`status-pill ${oppositionScoutReport.risk === "high" ? "danger" : oppositionScoutReport.risk === "medium" ? "warning" : "ok"}`}>
                v4.7
              </span>
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>Meci</span>
                <strong>{oppositionScoutReport.matchLabel}</strong>
              </div>
              <div className="metric">
                <span>Adversar</span>
                <strong>{oppositionScoutReport.opponentName ?? "-"}</strong>
              </div>
              <div className="metric">
                <span>Risc</span>
                <strong>{getMatchPlanRiskLabel(oppositionScoutReport.risk)}</strong>
              </div>
              <div className="metric">
                <span>Readiness</span>
                <strong>{oppositionScoutReport.readinessScore}/100</strong>
              </div>
            </div>

            <p className="muted small-note">{oppositionScoutReport.summary}</p>
            <div className="save-actions">
              <button
                type="button"
                onClick={handleApplyRecommendedMatchPlan}
                disabled={!oppositionScoutReport.available}
              >
                Aplica planul recomandat
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setActiveTab("tactics")}
              >
                Ajusteaza tactica manual
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setActiveTab("lineup")}
              >
                Verifica Lineup
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleSaveLocal}
              >
                Salveaza local
              </button>
            </div>
            {saveStatus && <p className="success-message">{saveStatus}</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </article>

          <article className="panel">
            <h3>Comparatie forte</h3>
            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>Overall tau</span>
                <strong>{oppositionScoutReport.userStrength?.overall ?? "-"}</strong>
              </div>
              <div className="metric">
                <span>Overall adversar</span>
                <strong>{oppositionScoutReport.opponentStrength?.overall ?? "-"}</strong>
              </div>
              <div className="metric">
                <span>Diferenta</span>
                <strong>{oppositionScoutReport.strengthDelta > 0 ? "+" : ""}{oppositionScoutReport.strengthDelta}</strong>
              </div>
              <div className="metric">
                <span>Stil adversar</span>
                <strong>{oppositionScoutReport.opponentStyle ?? "-"}</strong>
              </div>
            </div>
            <div className="mini-list">
              <div className="mini-row">
                <span>Tactica ta</span>
                <strong>{getTacticLabel(game.userTactic)}</strong>
              </div>
              <div className="mini-row">
                <span>Tactica adversar</span>
                <strong>{oppositionScoutReport.opponentTactic ? getTacticLabel(oppositionScoutReport.opponentTactic) : "-"}</strong>
              </div>
              <div className="mini-row">
                <span>Locatie</span>
                <strong>{oppositionScoutReport.venue === "home" ? "Acasa" : oppositionScoutReport.venue === "away" ? "Deplasare" : "Neutru"}</strong>
              </div>
            </div>
          </article>

          <article className="panel">
            <h3>Plan recomandat</h3>
            <div className="mini-list">
              <div className="mini-row">
                <span>Formation</span>
                <strong>{oppositionScoutReport.recommendedTactic.formation}</strong>
              </div>
              <div className="mini-row">
                <span>Mentality</span>
                <strong>{oppositionScoutReport.recommendedTactic.mentality}</strong>
              </div>
              <div className="mini-row">
                <span>Pressing</span>
                <strong>{oppositionScoutReport.recommendedTactic.pressing}</strong>
              </div>
              <div className="mini-row">
                <span>Advanced</span>
                <strong>{oppositionScoutReport.recommendedTactic.tempo ?? "normal"} / {oppositionScoutReport.recommendedTactic.width ?? "balanced"}</strong>
              </div>
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Ajustari recomandate</h3>
                <p className="muted">
                  Fiecare ajustare are motiv tactic. Dupa aplicare, primul 11 si fazele fixe se regenereaza automat pentru noua formatie.
                </p>
              </div>
              <span className="status-pill ok">{oppositionScoutReport.adjustments.length} recomandari</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Zona</th>
                    <th>Din</th>
                    <th>In</th>
                    <th>Motiv</th>
                  </tr>
                </thead>
                <tbody>
                  {oppositionScoutReport.adjustments.map((item, index) => (
                    <tr key={`${item.key}-${index}`}>
                      <td><strong>{item.label}</strong></td>
                      <td>{item.from ?? "-"}</td>
                      <td>{item.to}</td>
                      <td>{item.rationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel">
            <h3>Amenintari</h3>
            <div className="history-list compact-list">
              {oppositionScoutReport.threats.map((item) => (
                <div className="history-item" key={item}>
                  <span className="status-badge warning">Scout</span>
                  <small>{item}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <h3>Oportunitati</h3>
            <div className="history-list compact-list">
              {oppositionScoutReport.opportunities.map((item) => (
                <div className="history-item" key={item}>
                  <span className="status-badge ok">Plan</span>
                  <small>{item}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="panel wide-panel">
            <h3>Checklist inainte de simulare</h3>
            <div className="history-list compact-list">
              {oppositionScoutReport.checklist.map((item) => (
                <div className="history-item" key={item}>
                  <span className={item.startsWith("Planul de meci") ? "status-badge ok" : "status-badge warning"}>
                    Prep
                  </span>
                  <small>{item}</small>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {activeTab === "portraits" && (
        <section className="dashboard-grid portrait-grid">
          <article className="panel highlight-panel">
            <span className="team-label">v3.8 Pixel portraits</span>
            <h2>{portraitGallery.totalPortraits} avataruri generate</h2>
            <p className="muted">
              Avatarurile sunt SVG pixel-art generate determinist din profilul
              jucatorului, tara, personalitate, pozitie si culorile clubului.
              Nu folosesc AI, API extern sau dependinte noi.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>Captain frames</span>
                <strong>{portraitGallery.captainFrames}</strong>
              </div>
              <div className="metric">
                <span>Star frames</span>
                <strong>{portraitGallery.starFrames}</strong>
              </div>
              <div className="metric">
                <span>Academy frames</span>
                <strong>{portraitGallery.academyFrames}</strong>
              </div>
              <div className="metric">
                <span>Mood dominant</span>
                <strong>{getPortraitMoodLabel(portraitGallery.dominantMood)}</strong>
              </div>
            </div>
          </article>

          <article className="panel">
            <h3>Reguli generare</h3>
            <div className="mini-list">
              <div className="mini-row">
                <span>Seed</span>
                <strong>player.id + avatarSeed</strong>
              </div>
              <div className="mini-row">
                <span>Kit</span>
                <strong>Culorile clubului</strong>
              </div>
              <div className="mini-row">
                <span>Frame</span>
                <strong>Leader / Star / U21</strong>
              </div>
              <div className="mini-row">
                <span>Output</span>
                <strong>SVG data URI</strong>
              </div>
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Portrait gallery</h3>
                <p className="muted">
                  Primele 12 profiluri sunt ordonate dupa marketability si OVR.
                </p>
              </div>
              <span className="status-pill ok">Deterministic</span>
            </div>
            <div className="portrait-card-grid">
              {portraitGallery.samplePortraits.map((portrait) => {
                const player = userTeam.players.find(
                  (item) => item.id === portrait.playerId,
                );
                return (
                  <div className="portrait-card" key={portrait.playerId}>
                    <img
                      className="portrait-image"
                      src={portrait.dataUri}
                      alt={`Pixel portrait ${portrait.name}`}
                    />
                    <div>
                      <strong>{portrait.name}</strong>
                      <span>
                        {player?.flagEmoji ?? "🏳️"} {player?.position} · OVR {player?.overall ?? "-"} · {getPortraitFrameLabel(portrait.frame)}
                      </span>
                      <small>
                        {getPortraitMoodLabel(portrait.mood)} mood · {player?.nationality ?? "Unknown"} · Marketability {player?.marketability ?? 50}
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>All squad portraits</h3>
                <p className="muted">
                  Avatarurile sunt regenerabile la fiecare load din datele
                  salvate ale jucatorului, deci nu maresc payload-ul Supabase.
                </p>
              </div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Avatar</th>
                    <th>Jucator</th>
                    <th>Frame</th>
                    <th>Mood</th>
                    <th>Kit</th>
                    <th>Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {userTeam.players.map((player) => {
                    const portrait = buildPlayerPortrait(player, {
                      primaryColor: game.clubProfile.primaryColor,
                      secondaryColor: game.clubProfile.secondaryColor,
                    });
                    return (
                      <tr key={player.id}>
                        <td>
                          <img
                            className="portrait-table-thumb"
                            src={portrait.dataUri}
                            alt={`Pixel portrait ${player.name}`}
                          />
                        </td>
                        <td>
                          <strong>{player.name}</strong>
                          <br />
                          <small className="muted">
                            {player.flagEmoji ?? "🏳️"} {player.nationality ?? "Unknown"} · {player.position}
                          </small>
                        </td>
                        <td>{getPortraitFrameLabel(portrait.frame)}</td>
                        <td>{getPortraitMoodLabel(portrait.mood)}</td>
                        <td>
                          <span
                            className="club-color-dot"
                            style={{ background: portrait.kitColor }}
                          />
                          <span
                            className="club-color-dot"
                            style={{ background: portrait.accentColor }}
                          />
                        </td>
                        <td>{portrait.tags.join(" · ")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}

      {activeTab === "players" && (
        <section className="dashboard-grid identity-grid">
          <article className="panel highlight-panel">
            <span className="team-label">Player identity</span>
            <h2>{playerIdentityOverview.countriesCount} tari in lot</h2>
            <p className="muted">
              Fiecare jucator are nationalitate, steag, picior preferat,
              personalitate, rol de joc si marketability. Datele sunt generate
              determinist si salvate in payload per user.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>Jucatori romani</span>
                <strong>{playerIdentityOverview.domesticPlayers}</strong>
              </div>
              <div className="metric">
                <span>Straini</span>
                <strong>{playerIdentityOverview.foreignPlayers}</strong>
              </div>
              <div className="metric">
                <span>Marketability medie</span>
                <strong>{playerIdentityOverview.averageMarketability}</strong>
              </div>
              <div className="metric">
                <span>Leaderi</span>
                <strong>{playerIdentityOverview.leadersCount}</strong>
              </div>
            </div>
          </article>

          <article className="panel">
            <h3>Nationalitati</h3>
            <div className="mini-list">
              {playerIdentityOverview.topCountries.map((country) => (
                <div className="mini-row" key={country.code}>
                  <span>
                    {country.flag} {country.name}
                  </span>
                  <strong>{country.count}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <h3>Picior preferat</h3>
            <div className="mini-list">
              <div className="mini-row">
                <span>Left foot</span>
                <strong>{playerIdentityOverview.leftFootedPlayers}</strong>
              </div>
              <div className="mini-row">
                <span>Both feet</span>
                <strong>{playerIdentityOverview.bothFootedPlayers}</strong>
              </div>
              <div className="mini-row">
                <span>Right foot</span>
                <strong>
                  {playerIdentityOverview.totalPlayers -
                    playerIdentityOverview.leftFootedPlayers -
                    playerIdentityOverview.bothFootedPlayers}
                </strong>
              </div>
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Top player profiles</h3>
                <p className="muted">
                  Jucatorii cu cel mai bun mix de OVR, forma, moral si
                  marketability.
                </p>
              </div>
              <span className="status-pill ok">
                {playerIdentityOverview.totalPlayers} profiles
              </span>
            </div>
            <div className="profile-card-grid">
              {playerIdentityOverview.spotlights.map((profile) => (
                <div className="profile-card" key={profile.playerId}>
                  <img
                    className="portrait-thumb"
                    src={
                      buildPlayerPortrait(
                        userTeam.players.find((player) => player.id === profile.playerId) ?? userTeam.players[0],
                        {
                          primaryColor: game.clubProfile.primaryColor,
                          secondaryColor: game.clubProfile.secondaryColor,
                        },
                      ).dataUri
                    }
                    alt={`Pixel portrait ${profile.name}`}
                  />
                  <div>
                    <strong>{profile.name}</strong>
                    <span>
                      {profile.position} · {profile.age} ani · {profile.nationality}
                    </span>
                    <small>{profile.summary}</small>
                  </div>
                  <b>{profile.marketability}</b>
                </div>
              ))}
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Squad identity table</h3>
                <p className="muted">
                  Profil complet pentru fiecare jucator din lotul mare.
                </p>
              </div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Avatar</th>
                    <th>Jucator</th>
                    <th>Nat</th>
                    <th>Pos</th>
                    <th>Age</th>
                    <th>OVR</th>
                    <th>Role</th>
                    <th>Foot</th>
                    <th>Personality</th>
                    <th>Marketability</th>
                  </tr>
                </thead>
                <tbody>
                  {userTeam.players.map((player) => (
                    <tr key={player.id}>
                      <td>
                        <img
                          className="portrait-table-thumb"
                          src={
                            buildPlayerPortrait(player, {
                              primaryColor: game.clubProfile.primaryColor,
                              secondaryColor: game.clubProfile.secondaryColor,
                            }).dataUri
                          }
                          alt={`Pixel portrait ${player.name}`}
                        />
                      </td>
                      <td>
                        <strong>{player.name}</strong>
                        <br />
                        <small className="muted">
                          {buildPlayerIdentitySummary(player)}
                        </small>
                      </td>
                      <td>
                        {player.flagEmoji ?? "🏳️"} {player.countryCode ?? "-"}
                      </td>
                      <td>
                        <strong>{player.position}</strong>
                      </td>
                      <td>{player.age}</td>
                      <td>
                        <strong>{player.overall}</strong>
                      </td>
                      <td>{getRoleLabel(player.role)}</td>
                      <td>{getPreferredFootLabel(player.preferredFoot)}</td>
                      <td>{getPersonalityLabel(player.personality)}</td>
                      <td>
                        <strong>{player.marketability ?? 50}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}

      {activeTab === "staff" && (
        <section className="panel stack">
          <div className="section-header">
            <div>
              <p className="eyebrow">v2.8 Staff & Coaching Team</p>
              <h2>Staff</h2>
              <p className="muted">Staff-ul influenteaza training-ul, scouting-ul, academia si costurile pe runda.</p>
            </div>
            <button className="secondary-button compact" onClick={handleRefreshStaffCandidates}>
              Refresh shortlist
            </button>
          </div>

          <div className="metric-grid">
            <div className="metric"><span>Average rating</span><strong>{staffImpact.averageRating}</strong></div>
            <div className="metric"><span>Staff wage/runda</span><strong>{formatMoney(staffWageCost)}</strong></div>
            <div className="metric"><span>Training bonus</span><strong>+{staffImpact.trainingBonus}</strong></div>
            <div className="metric"><span>Scouting discount</span><strong>{staffImpact.scoutingDiscountPercent}%</strong></div>
            <div className="metric"><span>Youth bonus</span><strong>+{staffImpact.youthBonus}</strong></div>
            <div className="metric"><span>Recovery bonus</span><strong>+{staffImpact.recoveryBonus}</strong></div>
          </div>

          <div className="two-column">
            <article className="panel soft-panel">
              <h3>Current staff</h3>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Role</th><th>Name</th><th>Rating</th><th>Specialty</th><th>Wage</th></tr></thead>
                  <tbody>
                    {game.staff.members.map((member) => (
                      <tr key={member.id}>
                        <td>{getStaffRoleLabel(member.role)}</td>
                        <td>{member.name}</td>
                        <td>{member.rating}</td>
                        <td>{member.specialty}</td>
                        <td>{formatMoney(member.wage)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="panel soft-panel">
              <h3>Candidates</h3>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Role</th><th>Name</th><th>Rating</th><th>Wage</th><th></th></tr></thead>
                  <tbody>
                    {game.staff.candidates.map((candidate) => (
                      <tr key={candidate.id}>
                        <td>{getStaffRoleLabel(candidate.role)}</td>
                        <td>{candidate.name}</td>
                        <td>{candidate.rating}</td>
                        <td>{formatMoney(candidate.wage)}</td>
                        <td>
                          <button className="secondary-button compact" onClick={() => handleHireStaff(candidate.id)}>
                            Hire
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>

          <article className="panel soft-panel">
            <h3>Staff history</h3>
            <ul className="clean-list">
              {game.staff.history.slice(0, 8).map((record) => (
                <li key={record.id}>{record.summary}</li>
              ))}
            </ul>
          </article>
        </section>
      )}

      {activeTab === "records" && (
        <section className="panel stack">
          <div className="section-header">
            <div>
              <p className="eyebrow">v2.9 Player Stats, Records & Awards</p>
              <h2>Records & Awards</h2>
              <p className="muted">Statistici de sezon, recorduri de club si awards calculate din meciurile simulate.</p>
            </div>
          </div>
          <div className="metric-grid">
            {playerStatsAwards.records.map((record) => (
              <div className="metric" key={record.label}>
                <span>{record.label}</span>
                <strong>{record.value}</strong>
                <small>{record.detail}</small>
              </div>
            ))}
          </div>
          <div className="card-grid">
            {playerStatsAwards.awards.map((award) => (
              <article className="mini-card" key={award.title}>
                <span>{award.title}</span>
                <strong>{award.playerName}</strong>
                <p className="muted small-note">{award.reason}</p>
              </article>
            ))}
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Player</th><th>Pos</th><th>Age</th><th>Apps</th><th>Goals</th><th>Rating</th><th>Value</th></tr></thead>
              <tbody>
                {playerStatsAwards.stats.map((stat) => (
                  <tr key={stat.playerId}>
                    <td>{stat.playerName}</td>
                    <td>{stat.position}</td>
                    <td>{stat.age}</td>
                    <td>{stat.appearances}</td>
                    <td>{stat.goals}</td>
                    <td>{stat.averageRating}</td>
                    <td>{formatMoney(stat.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}



      {activeTab === "trophy" && (
        <section className="panel stack">
          <div className="section-header">
            <div>
              <p className="eyebrow">v4.8 Career Mode Polish / Trophy Room</p>
              <h2>Trophy Room & Career Legacy</h2>
              <p className="muted">
                Palmares, recorduri all-time, timeline de cariera, Hall of Fame si obiective legacy calculate din sezoane, cupa, Europa si statisticile jucatorilor.
              </p>
            </div>
            <span className="status-pill ok">Legacy score {careerTrophyRoom.careerScore}/100</span>
          </div>

          <div className="metric-grid">
            <div className="metric">
              <span>Trofee totale</span>
              <strong>{careerTrophyRoom.trophyCount}</strong>
              <small>{careerTrophyRoom.completedSeasons} sezoane inchise</small>
            </div>
            {careerTrophyRoom.records.map((record) => (
              <div className="metric" key={record.label}>
                <span>{record.label}</span>
                <strong>{record.value}</strong>
                <small>{record.detail}</small>
              </div>
            ))}
          </div>

          <div className="card-grid">
            {careerTrophyRoom.trophies.map((trophy) => (
              <article className="mini-card" key={trophy.id}>
                <span>{trophy.title}</span>
                <strong>{trophy.count}</strong>
                <p className="muted small-note">
                  {trophy.detail}{trophy.lastSeason ? ` Ultima data: sezon ${trophy.lastSeason}.` : ""}
                </p>
              </article>
            ))}
          </div>

          <div className="dashboard-grid two-column">
            <article className="panel soft-panel">
              <h3>Career timeline</h3>
              <ul className="clean-list">
                {careerTrophyRoom.timeline.map((item) => (
                  <li key={item.id}>
                    <strong>S{item.seasonNumber} · {item.title}</strong>
                    <p className="muted small-note">{item.detail}</p>
                  </li>
                ))}
              </ul>
            </article>

            <article className="panel soft-panel">
              <h3>Legacy milestones</h3>
              <div className="academy-history">
                {careerTrophyRoom.milestones.map((milestone) => (
                  <div className="academy-record" key={milestone.id}>
                    <span className={milestone.status === "achieved" ? "status-badge ok" : milestone.status === "active" ? "status-badge warning" : "status-badge"}>
                      {milestone.status}
                    </span>
                    <div>
                      <strong>{milestone.title}</strong>
                      <small>{milestone.progressLabel}</small>
                      <small>{milestone.detail}</small>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <article className="panel soft-panel">
            <h3>Hall of Fame watchlist</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Player</th><th>Legacy tag</th><th>Score</th><th>Detail</th></tr></thead>
                <tbody>
                  {careerTrophyRoom.hallOfFame.map((player) => (
                    <tr key={player.playerId}>
                      <td>{player.playerName}</td>
                      <td>{player.tag}</td>
                      <td>{player.score}</td>
                      <td>{player.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted small-note">{careerTrophyRoom.summary}</p>
          </article>
        </section>
      )}

      {activeTab === "media" && (
        <section className="panel stack">
          <div className="section-header">
            <div>
              <p className="eyebrow">v3.1 Media / Press Conferences</p>
              <h2>Media Center</h2>
              <p className="muted">Presa reactioneaza la rezultate si raspunsurile tale modifica reputatia media.</p>
            </div>
          </div>
          <div className="metric-grid">
            <div className="metric"><span>Media reputation</span><strong>{game.media.reputation}</strong></div>
            <div className="metric"><span>Media pressure</span><strong>{mediaReport.pressure}</strong></div>
            <div className="metric"><span>Tone</span><strong>{mediaReport.tone}</strong></div>
            <div className="metric"><span>Last answer</span><strong>{game.media.lastAnswer ?? "-"}</strong></div>
          </div>
          <article className="panel soft-panel">
            <h3>{mediaReport.topHeadline}</h3>
            <p className="muted">{mediaReport.summary}</p>
            <div className="button-row">
              <button className="secondary-button compact" onClick={() => handlePressAnswer("calm")}>Calm answer</button>
              <button className="secondary-button compact" onClick={() => handlePressAnswer("ambitious")}>Ambitious answer</button>
              <button className="secondary-button compact" onClick={() => handlePressAnswer("defensive")}>Defensive answer</button>
            </div>
          </article>
          <div className="stack">
            {game.media.messages.slice(0, 10).map((message) => (
              <article className={`inbox-card ${message.tone}`} key={message.id}>
                <strong>{message.headline}</strong>
                <p>{message.body}</p>
                <span className="muted small-note">Pressure {message.pressure}/100 · S{message.seasonNumber} R{message.round}</span>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === "fans" && (
        <section className="panel stack">
          <div className="section-header">
            <div>
              <p className="eyebrow">v3.2 Stadium Attendance & Fan Happiness</p>
              <h2>Fans</h2>
              <p className="muted">Fanii reactioneaza la rezultate, pozitia in clasament si nivelul de fan experience al stadionului.</p>
            </div>
          </div>
          <div className="metric-grid">
            <div className="metric"><span>Fan happiness</span><strong>{fanReport.happiness}</strong></div>
            <div className="metric"><span>Mood</span><strong>{fanReport.mood}</strong></div>
            <div className="metric"><span>Attendance</span><strong>{fanReport.projectedAttendance.toLocaleString("en-US")}</strong></div>
            <div className="metric"><span>Sellout chance</span><strong>{fanReport.selloutChance}%</strong></div>
          </div>
          <article className="panel soft-panel"><p>{fanReport.summary}</p></article>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Round</th><th>Happiness</th><th>Attendance</th><th>Summary</th></tr></thead>
              <tbody>
                {game.fans.history.slice(0, 12).map((record) => (
                  <tr key={record.id}>
                    <td>S{record.seasonNumber} R{record.round}</td>
                    <td>{record.happiness}</td>
                    <td>{record.projectedAttendance.toLocaleString("en-US")}</td>
                    <td>{record.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "difficulty" && (
        <section className="panel stack">
          <div className="section-header">
            <div>
              <p className="eyebrow">v3.3 Difficulty Levels & Game Balance</p>
              <h2>Difficulty & Balance</h2>
              <p className="muted">Seteaza dificultatea si vezi rapid daca economia, lotul si presiunea de board sunt echilibrate.</p>
            </div>
          </div>
          <div className="metric-grid">
            <div className="metric"><span>Difficulty</span><strong>{balanceReport.difficultyLabel}</strong></div>
            <div className="metric"><span>Balance score</span><strong>{balanceReport.score}</strong></div>
            <div className="metric"><span>Economy</span><strong>{balanceReport.economyStatus}</strong></div>
            <div className="metric"><span>Squad</span><strong>{balanceReport.squadStatus}</strong></div>
            <div className="metric"><span>Pressure</span><strong>{balanceReport.pressureStatus}</strong></div>
          </div>
          <div className="card-grid">
            {getDifficultyOptions().map((option) => (
              <article className="mini-card" key={option.level}>
                <span>{option.label}</span>
                <strong>{Math.round(option.incomeModifier * 100)}% income</strong>
                <p className="muted small-note">{option.description}</p>
                <button className="secondary-button compact" onClick={() => handleSetDifficulty(option.level)}>
                  Select
                </button>
              </article>
            ))}
          </div>
          <article className="panel soft-panel">
            <h3>Balance notes</h3>
            <ul className="clean-list">
              {balanceReport.notes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          </article>
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
                <strong>{formatMoney(effectiveAcademyRoundCost)}</strong>
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

      {activeTab === "europe" && (
        <section className="dashboard-grid cup-grid">
          <article className="panel highlight-panel">
            <span className="team-label">European Competition</span>
            <h2>
              {game.europeanState.status === "completed"
                ? `Castigatoare: ${game.europeanState.championTeamName}`
                : getEuropeanRoundLabel(currentEuropeanRoundName)}
            </h2>
            <p className="muted">
              Competitia europeana este separata de liga si cupa interna. Include
              adversari continentali generati determinist, premii mai mari si
              impact pe fitness, moral, accidentari, finance, board si inbox.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>Status</span>
                <strong>
                  {game.europeanState.status === "completed"
                    ? "Finalizata"
                    : "Activa"}
                </strong>
              </div>
              <div className="metric">
                <span>Runda curenta</span>
                <strong>
                  {game.europeanState.status === "completed"
                    ? "-"
                    : getEuropeanRoundLabel(currentEuropeanRoundName)}
                </strong>
              </div>
              <div className="metric">
                <span>Clubul tau</span>
                <strong>{userStillInEurope ? "In Europa" : "Eliminat"}</strong>
              </div>
              <div className="metric">
                <span>Meciul tau</span>
                <strong>
                  {userEuropeanMatch
                    ? `${userEuropeanMatch.homeTeamName} vs ${userEuropeanMatch.awayTeamName}`
                    : "-"}
                </strong>
              </div>
              <div className="metric">
                <span>Istoric Europa</span>
                <strong>{game.europeanHistory.length}</strong>
              </div>
              <div className="metric">
                <span>Cash club</span>
                <strong>{formatMoney(game.finance.cashBalance)}</strong>
              </div>
            </div>
            <div className="save-actions cup-actions">
              <button
                type="button"
                onClick={simulateNextEuropeanRound}
                disabled={game.europeanState.status === "completed"}
              >
                Simuleaza runda europeana
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
            <h3>Ultima runda europeana</h3>
            {latestEuropeanRecord ? (
              <>
                <div className="stat-row">
                  <span>Runda</span>
                  <strong>{getEuropeanRoundLabel(latestEuropeanRecord.roundName)}</strong>
                </div>
                <div className="stat-row">
                  <span>Club implicat</span>
                  <strong>
                    {latestEuropeanRecord.userParticipated ? "Da" : "Nu"}
                  </strong>
                </div>
                <div className="stat-row">
                  <span>Calificare</span>
                  <strong>{latestEuropeanRecord.userAdvanced ? "Da" : "Nu"}</strong>
                </div>
                <div className="stat-row">
                  <span>Bonus</span>
                  <strong>{formatMoney(latestEuropeanRecord.prizeMoney)}</strong>
                </div>
                <p className="muted small-note">{latestEuropeanRecord.summary}</p>
              </>
            ) : (
              <p className="muted">Nu ai simulat inca nicio runda europeana.</p>
            )}
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Calendar european</h3>
                <p className="muted">
                  Runda curenta este simulata complet. Egalurile se decid
                  determinist la penalty-uri, ca in cupa interna.
                </p>
              </div>
              <span className="status-pill ok">
                Sezon {game.europeanState.seasonNumber}
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
                  {game.europeanState.matches.map((match) => (
                    <tr
                      className={
                        match.homeTeamId === USER_TEAM_ID ||
                        match.awayTeamId === USER_TEAM_ID
                          ? "player-alert-row"
                          : undefined
                      }
                      key={match.id}
                    >
                      <td>{getEuropeanRoundLabel(match.roundName)}</td>
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
                <h3>Istoric european</h3>
                <p className="muted">
                  Rezultatele europene sunt salvate in payload per user si intra
                  in rapoartele de stabilitate/debug.
                </p>
              </div>
              <span className="status-pill">
                {game.europeanHistory.length} runde
              </span>
            </div>
            {game.europeanHistory.length === 0 ? (
              <p className="muted">Istoricul european este gol.</p>
            ) : (
              <div className="contract-history">
                {game.europeanHistory.map((record) => (
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
                      {getEuropeanRoundLabel(record.roundName)}
                    </span>
                    <div>
                      <strong>{record.championTeamName ?? record.summary}</strong>
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
                <span>Staff cost/runda</span>
                <strong>{formatMoney(staffWageCost)}</strong>
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

      {activeTab === "sponsorships" && (
        <section className="dashboard-grid finance-grid">
          <article className="panel highlight-panel">
            <span className="team-label">Commercial department</span>
            <h2>{sponsorshipHealth.summary}</h2>
            <p className="muted">
              Sponsorizările adaugă venit recurent la raportul financiar al
              fiecărei etape. Unele deal-uri oferă bonus de semnare, bonus de
              victorie și bonus de obiectiv dacă echipa rămâne sus în clasament.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>Deal-uri active</span>
                <strong>{sponsorshipHealth.activeDealsCount}</strong>
              </div>
              <div className="metric">
                <span>Oferte disponibile</span>
                <strong>{sponsorshipHealth.offersCount}</strong>
              </div>
              <div className="metric">
                <span>Venit/runda</span>
                <strong>{formatMoney(sponsorshipHealth.projectedRoundIncome)}</strong>
              </div>
              <div className="metric">
                <span>Bonus victorie max</span>
                <strong>{formatMoney(sponsorshipHealth.maxPotentialWinBonus)}</strong>
              </div>
            </div>
            <div className="save-actions transfer-actions">
              <button
                type="button"
                onClick={handleRefreshSponsorshipOffers}
                disabled={!sponsorshipCanRefresh}
              >
                Refresh oferte
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
            {!sponsorshipCanRefresh && (
              <p className="muted small-note">
                Ai actualizat deja ofertele în runda curentă. Simulează o etapă
                pentru un nou refresh.
              </p>
            )}
            {saveStatus && <p className="success-message">{saveStatus}</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </article>

          <article className="panel">
            <h3>Ultimul eveniment comercial</h3>
            {latestSponsorshipRecord ? (
              <>
                <div className="stat-row">
                  <span>Tip</span>
                  <strong>{latestSponsorshipRecord.type}</strong>
                </div>
                <div className="stat-row">
                  <span>Sponsor</span>
                  <strong>{latestSponsorshipRecord.sponsorName ?? "-"}</strong>
                </div>
                <div className="stat-row">
                  <span>Valoare</span>
                  <strong>{formatMoney(latestSponsorshipRecord.amount)}</strong>
                </div>
                <p className="muted">{latestSponsorshipRecord.summary}</p>
              </>
            ) : (
              <p className="muted">
                Nu există încă evenimente comerciale. Semnează primul sponsor.
              </p>
            )}
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Oferte de sponsorizare</h3>
                <p className="muted">
                  Poți avea câte un deal activ pe fiecare categorie comercială.
                  Board confidence-ul influențează ofertele disponibile.
                </p>
              </div>
              <span className="status-pill ok">
                {game.sponsorships.availableOffers.length} oferte
              </span>
            </div>
            {game.sponsorships.availableOffers.length === 0 ? (
              <p className="muted">
                Nu ai oferte disponibile momentan. Reîmprospătează ofertele în
                runda următoare sau îmbunătățește job security-ul.
              </p>
            ) : (
              <div className="transfer-market-list">
                {game.sponsorships.availableOffers.map((offer) => (
                  <div className="transfer-card" key={offer.id}>
                    <div>
                      <strong>{offer.sponsorName}</strong>
                      <small>
                        {getSponsorshipCategoryLabel(offer.category)} · expiră
                        după sezonul {offer.expiresSeason}
                      </small>
                      <small>{offer.summary}</small>
                    </div>
                    <div className="transfer-values">
                      <span>{formatMoney(offer.baseIncomePerRound)}/runda</span>
                      <span>Sign {formatMoney(offer.signingBonus)}</span>
                      <span>Win {formatMoney(offer.winBonus)}</span>
                      <span>Min board {offer.minBoardConfidence}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSignSponsorshipDeal(offer.id)}
                      disabled={game.boardState.jobSecurity < offer.minBoardConfidence}
                    >
                      Semneaza
                    </button>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Deal-uri active</h3>
                <p className="muted">
                  Venitul de bază se aplică la fiecare rundă de campionat.
                  Bonusurile se adaugă automat în Finance.
                </p>
              </div>
              <span className="status-pill">
                {game.sponsorships.activeDeals.length} active
              </span>
            </div>
            {game.sponsorships.activeDeals.length === 0 ? (
              <p className="muted">Nu ai încă sponsori activi.</p>
            ) : (
              <div className="mini-list">
                {game.sponsorships.activeDeals.map((deal) => (
                  <div className="mini-row" key={deal.id}>
                    <span>
                      {deal.sponsorName} · {getSponsorshipCategoryLabel(deal.category)}
                    </span>
                    <strong>
                      {formatMoney(deal.baseIncomePerRound)}/runda · până în S{deal.expiresSeason}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Istoric sponsorizări</h3>
                <p className="muted">
                  Ultimele 24 evenimente comerciale sunt salvate în payload per
                  user.
                </p>
              </div>
              <span className="status-pill">
                {game.sponsorshipHistory.length} evenimente
              </span>
            </div>
            {game.sponsorshipHistory.length === 0 ? (
              <p className="muted">Istoricul comercial este gol.</p>
            ) : (
              <div className="finance-history">
                {game.sponsorshipHistory.map((record) => (
                  <div className="finance-record" key={record.id}>
                    <span className={record.amount > 0 ? "status-badge ok" : "status-badge"}>
                      {record.type}
                    </span>
                    <div>
                      <strong>{record.sponsorName ?? "Commercial update"}</strong>
                      <small>{record.summary}</small>
                    </div>
                    <strong>{formatMoney(record.amount)}</strong>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      )}

      {activeTab === "facilities" && (
        <section className="dashboard-grid finance-grid">
          <article className="panel highlight-panel">
            <span className="team-label">Stadium & Facilities</span>
            <h2>{game.facilities.stadiumName}</h2>
            <p className="muted">
              Dezvoltă stadionul și infrastructura clubului. Facilitățile adaugă
              venituri la meciurile acasă, venit comercial pe rundă, bonus la
              training și discount pentru costurile academiei.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>Capacitate</span>
                <strong>{game.facilities.capacity.toLocaleString("en-US")}</strong>
              </div>
              <div className="metric">
                <span>Tier stadion</span>
                <strong>{facilitiesOverview.stadiumTier}</strong>
              </div>
              <div className="metric">
                <span>Attendance proiectat</span>
                <strong>{facilitiesOverview.projectedAttendance.toLocaleString("en-US")}</strong>
              </div>
              <div className="metric">
                <span>Home boost</span>
                <strong>{formatMoney(facilitiesOverview.projectedHomeIncomeBoost)}</strong>
              </div>
              <div className="metric">
                <span>Commercial/runda</span>
                <strong>{formatMoney(facilitiesOverview.projectedCommercialIncome)}</strong>
              </div>
              <div className="metric">
                <span>Maintenance/runda</span>
                <strong>{formatMoney(facilitiesOverview.maintenanceCost)}</strong>
              </div>
            </div>
            <p className="success-message inline-message">
              {facilitiesOverview.summary}
            </p>
            {saveStatus && <p className="success-message">{saveStatus}</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </article>

          <article className="panel">
            <h3>Impact sportiv</h3>
            <div className="stat-row">
              <span>Training bonus</span>
              <strong>+{facilitiesOverview.trainingBonus}%</strong>
            </div>
            <div className="stat-row">
              <span>Academy discount</span>
              <strong>{facilitiesOverview.academyCostDiscountPercent}%</strong>
            </div>
            <div className="stat-row">
              <span>Medical reduction</span>
              <strong>{facilitiesOverview.injuryRiskReduction}%</strong>
            </div>
            <div className="stat-row">
              <span>Fan satisfaction</span>
              <strong>{facilitiesOverview.fanSatisfaction}/100</strong>
            </div>
            <p className="muted small-note">
              Training ground-ul influențează șansa de îmbunătățire la antrenament.
              Academy campus reduce upkeep-ul academiei în Finance.
            </p>
          </article>

          <article className="panel">
            <h3>Ultimul eveniment facilities</h3>
            {latestFacilityRecord ? (
              <>
                <div className="stat-row">
                  <span>Tip</span>
                  <strong>{latestFacilityRecord.type}</strong>
                </div>
                <div className="stat-row">
                  <span>Valoare</span>
                  <strong>{formatMoney(latestFacilityRecord.amount)}</strong>
                </div>
                <p className="muted">{latestFacilityRecord.summary}</p>
              </>
            ) : (
              <p className="muted">
                Nu există încă evenimente. Fă primul upgrade sau simulează o etapă.
              </p>
            )}
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Upgrade facilities</h3>
                <p className="muted">
                  Upgrade-urile se plătesc din cash balance și sunt salvate în
                  payload per user.
                </p>
              </div>
              <span className="status-pill ok">
                Cash {formatMoney(game.finance.cashBalance)}
              </span>
            </div>
            <div className="transfer-market-list">
              {facilityUpgradeOptions.map((option) => (
                <div className="transfer-card" key={option.type}>
                  <div>
                    <strong>{option.label}</strong>
                    <small>
                      {option.currentLevelLabel} → {option.nextLevelLabel}
                    </small>
                    <small>{option.effect}</small>
                  </div>
                  <div className="transfer-values">
                    <span>Cost {option.maxed ? "Max" : formatMoney(option.cost)}</span>
                    <span>{getFacilityLabel(option.type)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpgradeFacility(option.type)}
                    disabled={option.maxed || game.finance.cashBalance < option.cost}
                  >
                    {option.maxed ? "Max" : "Upgrade"}
                  </button>
                </div>
              ))}
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Istoric facilities</h3>
                <p className="muted">
                  Ultimele 24 evenimente de infrastructură sunt salvate în payload.
                </p>
              </div>
              <span className="status-pill">{game.facilityHistory.length} evenimente</span>
            </div>
            {game.facilityHistory.length === 0 ? (
              <p className="muted">Istoricul de facilities este gol.</p>
            ) : (
              <div className="finance-history">
                {game.facilityHistory.map((record) => (
                  <div className="finance-record" key={record.id}>
                    <span className={record.type === "upgrade" ? "status-badge ok" : "status-badge"}>
                      {record.type}
                    </span>
                    <div>
                      <strong>{record.upgradeType ? getFacilityLabel(record.upgradeType) : "Facilities"}</strong>
                      <small>{record.summary}</small>
                    </div>
                    <strong>{formatMoney(record.amount)}</strong>
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
                <strong>{formatMoney(effectiveAcademyRoundCost)}</strong>
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
                  <span>Sponsori</span>
                  <strong>
                    +{formatMoney(latestFinanceReport.commercialIncome ?? 0)}
                  </strong>
                </div>
                <div className="stat-row">
                  <span>Facilities income</span>
                  <strong>
                    +{formatMoney(latestFinanceReport.facilitiesIncome ?? 0)}
                  </strong>
                </div>
                <div className="stat-row">
                  <span>Facilities maintenance</span>
                  <strong>
                    -{formatMoney(latestFinanceReport.facilitiesMaintenance ?? 0)}
                  </strong>
                </div>
                <div className="stat-row">
                  <span>Academie</span>
                  <strong>
                    -{formatMoney(latestFinanceReport.academyCost ?? 0)}
                  </strong>
                </div>
                <div className="stat-row">
                  <span>Staff</span>
                  <strong>
                    -{formatMoney(latestFinanceReport.staffCost ?? 0)}
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
                        {formatMoney(report.performanceBonus)} · Sponsori {" "}
                        {formatMoney(report.commercialIncome ?? 0)} · Facilities {" "}
                        {formatMoney(report.facilitiesIncome ?? 0)} / -{formatMoney(report.facilitiesMaintenance ?? 0)} · Salarii {" "}
                        {formatMoney(report.wageCost)} · Academie {" "}
                        {formatMoney(report.academyCost ?? 0)} · Staff {formatMoney(report.staffCost ?? 0)}
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

      {activeTab === "advancedTactics" && (
        <section className="dashboard-grid">
          <article className="panel highlight-panel">
            <span className="team-label">Advanced tactics</span>
            <h2>{advancedTacticsReport.summary}</h2>
            <p className="muted">
              Ajusteaza detaliile tactice fara sa pierzi compatibilitatea cu
              sistemul vechi de formation / mentality / pressing. Valorile noi
              sunt optionale si salvate in acelasi payload per user.
            </p>
            <div className="metric-grid">
              <div className="metric">
                <span>Tactical score</span>
                <strong>{advancedTacticsReport.tacticalScore}/100</strong>
              </div>
              <div className="metric">
                <span>Risk</span>
                <strong>{advancedTacticsReport.risk.label}</strong>
              </div>
              <div className="metric">
                <span>Risk score</span>
                <strong>{advancedTacticsReport.risk.score}/100</strong>
              </div>
              <div className="metric">
                <span>Style</span>
                <strong>{advancedTactic.tempo} / {advancedTactic.width}</strong>
              </div>
            </div>
            {advancedTacticsReport.risk.warnings.length > 0 && (
              <div className="callout warning-callout">
                {advancedTacticsReport.risk.warnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            )}
          </article>

          <article className="panel">
            <h3>Advanced controls</h3>
            <div className="tactic-form">
              <label>
                Tempo
                <select
                  value={advancedTactic.tempo}
                  onChange={(event) =>
                    updateTactic("tempo", event.target.value as Tactic["tempo"])
                  }
                >
                  {advancedTacticOptions.tempo.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label>
                Width
                <select
                  value={advancedTactic.width}
                  onChange={(event) =>
                    updateTactic("width", event.target.value as Tactic["width"])
                  }
                >
                  {advancedTacticOptions.width.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label>
                Risk
                <select
                  value={advancedTactic.risk}
                  onChange={(event) =>
                    updateTactic("risk", event.target.value as Tactic["risk"])
                  }
                >
                  {advancedTacticOptions.risk.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label>
                Defensive line
                <select
                  value={advancedTactic.defensiveLine}
                  onChange={(event) =>
                    updateTactic("defensiveLine", event.target.value as Tactic["defensiveLine"])
                  }
                >
                  {advancedTacticOptions.defensiveLine.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label>
                Attacking focus
                <select
                  value={advancedTactic.attackingFocus}
                  onChange={(event) =>
                    updateTactic("attackingFocus", event.target.value as Tactic["attackingFocus"])
                  }
                >
                  {advancedTacticOptions.attackingFocus.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>
          </article>

          <article className="panel">
            <h3>Advanced strength</h3>
            <div className="stat-row"><span>Attack</span><strong>{advancedTeamStrength.attack.toFixed(1)}</strong></div>
            <div className="stat-row"><span>Midfield</span><strong>{advancedTeamStrength.midfield.toFixed(1)}</strong></div>
            <div className="stat-row"><span>Defense</span><strong>{advancedTeamStrength.defense.toFixed(1)}</strong></div>
            <div className="stat-row"><span>Goalkeeper</span><strong>{advancedTeamStrength.goalkeeper.toFixed(1)}</strong></div>
            <div className="stat-row"><span>Overall</span><strong>{advancedTeamStrength.overall.toFixed(1)}</strong></div>
            <p className="muted small-note">
              Comparatie baza: {teamStrength.overall.toFixed(1)} overall.
            </p>
          </article>

          <article className="panel wide-panel">
            <h3>Role suitability</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Player</th><th>Pos</th><th>Role</th><th>Fit</th><th>Note</th></tr>
                </thead>
                <tbody>
                  {advancedTacticsReport.roles.map((role) => (
                    <tr key={role.playerId}>
                      <td>{role.playerName}</td>
                      <td>{role.position}</td>
                      <td>{role.role}</td>
                      <td>{role.suitability}/100</td>
                      <td>{role.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel wide-panel">
            <h3>Recommendations</h3>
            <div className="card-list">
              {advancedTacticsReport.recommendations.map((item) => (
                <div className="mini-card" key={item}>{item}</div>
              ))}
            </div>
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

      {activeTab === "release" && (
        <section className="dashboard-grid beta-grid">
          <article className="panel highlight-panel beta-hero">
            <span className="team-label">v4.0 Beta Polish Release</span>
            <h2>{betaPolishRelease.statusLabel}</h2>
            <p className="muted">
              Panou final de release: combina Beta, Stability, Admin, Database,
              Multiplayer si Advanced Tactics intr-un singur status de lansare.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric">
                <span>Release score</span>
                <strong>{betaPolishRelease.score}/100</strong>
              </div>
              <div className="metric">
                <span>Passed</span>
                <strong>{betaPolishRelease.passCount}</strong>
              </div>
              <div className="metric">
                <span>Warnings</span>
                <strong>{betaPolishRelease.warningCount}</strong>
              </div>
              <div className="metric">
                <span>Blockers</span>
                <strong>{betaPolishRelease.failCount}</strong>
              </div>
            </div>
            <div className="progress-track large-progress" aria-label="Release score">
              <i style={{ width: `${betaPolishRelease.score}%` }} />
            </div>
            <p className="muted small-note">
              Tip release: <strong>{betaPolishRelease.releaseType}</strong>. Daca
              apar blockers, rezolva-le din taburile indicate inainte de deploy.
            </p>
          </article>

          <article className="panel">
            <h3>Release actions</h3>
            <div className="button-stack beta-buttons">
              <button onClick={handleDownloadReleaseSave}>Export save JSON</button>
              <button className="secondary-button" onClick={handleCopyReleaseNotes}>
                Copiaza release notes
              </button>
              <button className="secondary-button" onClick={() => setActiveTab("qa")}>
                QA Live
              </button>
              <button className="secondary-button" onClick={() => setActiveTab("admin")}>
                Admin debug
              </button>
            </div>
            <p className="muted small-note">
              Exportul save este portabil si nu include parola sau Supabase access token.
              Pentru debug complet foloseste in continuare Admin &gt; Genereaza export debug.
            </p>
            {saveStatus && <p className="success-message">{saveStatus}</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Release milestones</h3>
                <p className="muted">Indicatori scurti pentru handoff si deploy.</p>
              </div>
              <span className={`status-pill ${betaPolishRelease.failCount > 0 ? "danger" : betaPolishRelease.warningCount > 0 ? "warning" : "ok"}`}>
                {betaPolishRelease.failCount > 0 ? "Blocked" : betaPolishRelease.warningCount > 0 ? "Candidate" : "Ready"}
              </span>
            </div>
            <div className="metric-grid compact-metrics">
              {betaPolishRelease.milestones.map((item) => (
                <div className="metric" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small className={`status-badge ${item.status === "pass" ? "ok" : item.status === "warning" ? "warning" : "danger"}`}>
                    {item.status}
                  </small>
                </div>
              ))}
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Release checks</h3>
                <p className="muted">
                  Checklist v4 care leaga toate panourile de stabilitate si gameplay.
                </p>
              </div>
              <span className="status-pill ok">schema {SAVE_SCHEMA_VERSION}</span>
            </div>
            <div className="beta-check-grid">
              {betaPolishRelease.checks.map((item) => (
                <article className={`beta-check-card ${item.status}`} key={item.id}>
                  <div className="section-header compact-header">
                    <div>
                      <span className="team-label">{item.category}</span>
                      <h4>{item.title}</h4>
                    </div>
                    <span className={`status-badge ${item.status === "pass" ? "ok" : item.status === "warning" ? "warning" : "danger"}`}>
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
            <h3>QA commands</h3>
            <div className="beta-action-list">
              {betaPolishRelease.qaCommands.map((command) => (
                <div className="beta-action" key={command}>
                  <span>$</span>
                  <p><code>{command}</code></p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <h3>Release notes</h3>
            <div className="beta-action-list">
              {betaPolishRelease.releaseNotes.map((note) => (
                <div className="beta-action" key={note}>
                  <span>→</span>
                  <p>{note}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel wide-panel">
            <h3>Launch checklist</h3>
            <ol className="deploy-checklist">
              {betaPolishRelease.launchChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </article>
        </section>
      )}

      {activeTab === "performance" && (
        <section className="dashboard-grid beta-grid">
          <article className="panel highlight-panel beta-hero">
            <span className="team-label">v4.1 Performance</span>
            <h2>{performanceDeploy.statusLabel}</h2>
            <p className="muted">
              Panou pentru deploy optimization: chunking Vite, Netlify profile,
              ZIP hygiene si comenzi QA pentru build-uri rapide si predictibile.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric"><span>Performance score</span><strong>{performanceDeploy.score}/100</strong></div>
              <div className="metric"><span>Passed</span><strong>{performanceDeploy.passCount}</strong></div>
              <div className="metric"><span>Warnings</span><strong>{performanceDeploy.warningCount}</strong></div>
              <div className="metric"><span>Blockers</span><strong>{performanceDeploy.failCount}</strong></div>
            </div>
            <div className="progress-track large-progress" aria-label="Performance score">
              <i style={{ width: `${performanceDeploy.score}%` }} />
            </div>
            <p className="muted small-note">
              v4.1 nu adauga gameplay nou; optimizeaza build-ul dupa warning-ul
              de bundle mare aparut in v4.0.
            </p>
          </article>

          <article className="panel">
            <h3>Build commands</h3>
            <div className="beta-action-list">
              {performanceDeploy.recommendedCommands.map((command) => (
                <div className="beta-action" key={command}>
                  <span>$</span>
                  <p><code>{command}</code></p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Performance checks</h3>
                <p className="muted">
                  Verificari pentru chunking, Netlify, schema save si igiena arhivei.
                </p>
              </div>
              <span className={`status-pill ${performanceDeploy.failCount > 0 ? "danger" : performanceDeploy.warningCount > 0 ? "warning" : "ok"}`}>
                {performanceDeploy.failCount > 0 ? "Blocked" : performanceDeploy.warningCount > 0 ? "Warnings" : "Optimized"}
              </span>
            </div>
            <div className="beta-check-grid">
              {performanceDeploy.checks.map((item) => (
                <article className={`beta-check-card ${item.status}`} key={item.id}>
                  <div className="section-header compact-header">
                    <div>
                      <span className="team-label">deploy</span>
                      <h4>{item.title}</h4>
                    </div>
                    <span className={`status-badge ${item.status === "pass" ? "ok" : item.status === "warning" ? "warning" : "danger"}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="muted">{item.summary}</p>
                  <small>{item.action}</small>
                </article>
              ))}
            </div>
          </article>

          <article className="panel">
            <h3>Chunk plan</h3>
            <div className="beta-action-list">
              {performanceDeploy.chunkPlan.map((chunk) => (
                <div className="beta-action" key={chunk.name}>
                  <span>JS</span>
                  <p><strong>{chunk.name}</strong><br /><small>{chunk.purpose} · target &lt; {chunk.expectedMaxKb} KB</small></p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <h3>Netlify profile</h3>
            <div className="beta-action-list">
              {performanceDeploy.netlifyBuildProfile.map((item) => (
                <div className="beta-action" key={item}>
                  <span>✓</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel wide-panel">
            <h3>Release notes v4.1</h3>
            <div className="beta-action-list">
              {performanceDeploy.releaseNotes.map((note) => (
                <div className="beta-action" key={note}>
                  <span>→</span>
                  <p>{note}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {activeTab === "pwa" && (
        <section className="dashboard-grid beta-grid">
          <article className="panel highlight-panel beta-hero">
            <span className="team-label">v4.2 PWA / Offline Install</span>
            <h2>{pwaInstall.statusLabel}</h2>
            <p className="muted">
              Instalare pe telefon, manifest, service worker, offline fallback si
              verificari pentru app-like mobile beta. Nu foloseste API extern si nu
              adauga dependinte noi.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric"><span>PWA score</span><strong>{pwaInstall.score}/100</strong></div>
              <div className="metric"><span>Passed</span><strong>{pwaInstall.passCount}</strong></div>
              <div className="metric"><span>Warnings</span><strong>{pwaInstall.warningCount}</strong></div>
              <div className="metric"><span>Blockers</span><strong>{pwaInstall.failCount}</strong></div>
            </div>
            <div className="progress-track large-progress" aria-label="PWA score">
              <i style={{ width: `${pwaInstall.score}%` }} />
            </div>
            <p className="muted small-note">
              Status instalare: <strong>{pwaInstall.installStatusLabel}</strong>.
              Supabase cloud save necesita internet, dar app shell + local save
              raman fallback-ul pentru testare mobila.
            </p>
          </article>

          <article className="panel">
            <h3>Install status</h3>
            <div className="debug-grid compact-debug">
              <div className="debug-fact"><span>Service worker</span><strong>{pwaServiceWorkerStatus}</strong></div>
              <div className="debug-fact"><span>Install prompt</span><strong>{pwaInstallPromptAvailable ? "available" : "not yet"}</strong></div>
              <div className="debug-fact"><span>Standalone</span><strong>{pwaInstalled ? "yes" : "no"}</strong></div>
              <div className="debug-fact"><span>Schema</span><strong>{SAVE_SCHEMA_VERSION}</strong></div>
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>PWA checks</h3>
                <p className="muted">
                  Verificari pentru manifest, service worker, fallback offline,
                  HTTPS si siguranta salvarii locale.
                </p>
              </div>
              <span className={`status-pill ${pwaInstall.failCount > 0 ? "danger" : pwaInstall.warningCount > 0 ? "warning" : "ok"}`}>
                {pwaInstall.failCount > 0 ? "Blocked" : pwaInstall.warningCount > 0 ? "Warnings" : "Install ready"}
              </span>
            </div>
            <div className="beta-check-grid">
              {pwaInstall.checks.map((item) => (
                <article className={`beta-check-card ${item.status}`} key={item.id}>
                  <div className="section-header compact-header">
                    <div>
                      <span className="team-label">pwa</span>
                      <h4>{item.title}</h4>
                    </div>
                    <span className={`status-badge ${item.status === "pass" ? "ok" : item.status === "warning" ? "warning" : "danger"}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="muted">{item.summary}</p>
                  <small>{item.action}</small>
                </article>
              ))}
            </div>
          </article>

          <article className="panel">
            <h3>Install steps</h3>
            <div className="beta-action-list">
              {pwaInstall.installSteps.map((step, index) => (
                <div className="beta-action" key={step}>
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <h3>Offline assets</h3>
            <div className="beta-action-list">
              {pwaInstall.offlineAssets.map((asset) => (
                <div className="beta-action" key={asset}>
                  <span>cache</span>
                  <p><code>{asset}</code></p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <h3>QA commands</h3>
            <div className="beta-action-list">
              {pwaInstall.qaCommands.map((command) => (
                <div className="beta-action" key={command}>
                  <span>$</span>
                  <p><code>{command}</code></p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel wide-panel">
            <h3>Release notes v4.2</h3>
            <div className="beta-action-list">
              {pwaInstall.releaseNotes.map((note) => (
                <div className="beta-action" key={note}>
                  <span>→</span>
                  <p>{note}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {activeTab === "notifications" && (
        <section className="dashboard-grid beta-grid">
          <article className="panel highlight-panel beta-hero">
            <span className="team-label">v4.3 Notifications / Reminders</span>
            <h2>{notificationCenter.statusLabel}</h2>
            <p className="muted">
              Notification Center adauga reminder-e locale pentru save, training,
              matchday, fitness, contracte, board si Inbox. Browser notifications
              sunt optionale; reminder-ele in-app functioneaza si fara permisiune.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric"><span>Notification score</span><strong>{notificationCenter.score}/100</strong></div>
              <div className="metric"><span>Reminders</span><strong>{notificationCenter.unreadCount}</strong></div>
              <div className="metric"><span>Urgente</span><strong>{notificationCenter.highPriorityCount}</strong></div>
              <div className="metric"><span>Permission</span><strong>{notificationPermission}</strong></div>
            </div>
            <div className="progress-track large-progress" aria-label="Notification score">
              <i style={{ width: `${notificationCenter.score}%` }} />
            </div>
            <p className="muted small-note">
              Urmatorul pas recomandat: <strong>{notificationCenter.nextBestAction}</strong>
            </p>
          </article>

          <article className="panel">
            <h3>Browser permission</h3>
            <p className="muted">{notificationCenter.permissionLabel}</p>
            <div className="button-row stacked-buttons">
              <button className="primary-button" type="button" onClick={handleRequestNotificationPermission}>
                Request permission
              </button>
              <button className="secondary-button" type="button" onClick={handleSendTestNotification}>
                Send test notification
              </button>
            </div>
            <p className="muted small-note">
              Pe iOS, notificarile sunt mai stabile dupa ce app-ul este instalat din Add to Home Screen.
            </p>
          </article>

          <article className="panel">
            <h3>Reminder settings</h3>
            <div className="settings-list">
              {([
                ["enabled", "In-app reminders"],
                ["saveReminders", "Save reminders"],
                ["trainingReminders", "Training reminders"],
                ["matchdayReminders", "Matchday reminders"],
                ["medicalReminders", "Medical reminders"],
                ["contractReminders", "Contract reminders"],
                ["boardReminders", "Board reminders"],
                ["inboxReminders", "Inbox reminders"],
                ["quietMode", "Quiet mode"],
              ] as Array<[keyof NotificationSettings, string]>).map(([key, label]) => (
                <label className="toggle-row" key={key}>
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(game.notificationSettings[key])}
                    onChange={(event) => handleUpdateNotificationSetting(key, event.target.checked)}
                  />
                </label>
              ))}
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Active reminders</h3>
                <p className="muted">
                  Reminder-ele sunt calculate din starea curenta a carierei si pot fi arhivate in save payload.
                </p>
              </div>
              <button className="secondary-button" type="button" onClick={handleArchiveNotificationReminders}>
                Archive current
              </button>
            </div>
            {notificationCenter.reminders.length === 0 ? (
              <p className="empty-state">Nu exista reminder-e active acum.</p>
            ) : (
              <div className="beta-check-grid">
                {notificationCenter.reminders.map((reminder) => (
                  <article className={`beta-check-card ${reminder.priority === "high" ? "fail" : reminder.priority === "medium" ? "warning" : "pass"}`} key={reminder.id}>
                    <div className="section-header compact-header">
                      <div>
                        <span className="team-label">{reminder.type}</span>
                        <h4>{reminder.title}</h4>
                      </div>
                      <span className={`status-badge ${reminder.priority === "high" ? "danger" : reminder.priority === "medium" ? "warning" : "ok"}`}>
                        {reminder.priority}
                      </span>
                    </div>
                    <p className="muted">{reminder.summary}</p>
                    <small>{reminder.action}</small>
                  </article>
                ))}
              </div>
            )}
          </article>

          <article className="panel wide-panel">
            <h3>Notification readiness checks</h3>
            <div className="beta-check-grid">
              {notificationCenter.checks.map((item) => (
                <article className={`beta-check-card ${item.status}`} key={item.id}>
                  <div className="section-header compact-header">
                    <div>
                      <span className="team-label">notification</span>
                      <h4>{item.title}</h4>
                    </div>
                    <span className={`status-badge ${item.status === "pass" ? "ok" : item.status === "warning" ? "warning" : "danger"}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="muted">{item.summary}</p>
                  <small>{item.action}</small>
                </article>
              ))}
            </div>
          </article>

          <article className="panel">
            <h3>Archived reminders</h3>
            <div className="debug-grid compact-debug">
              <div className="debug-fact"><span>Total archived</span><strong>{game.notificationHistory.length}</strong></div>
              <div className="debug-fact"><span>Schema</span><strong>{SAVE_SCHEMA_VERSION}</strong></div>
              <div className="debug-fact"><span>PWA</span><strong>{pwaServiceWorkerStatus}</strong></div>
              <div className="debug-fact"><span>Standalone</span><strong>{pwaInstalled ? "yes" : "no"}</strong></div>
            </div>
          </article>

          <article className="panel">
            <h3>QA commands</h3>
            <div className="beta-action-list">
              {notificationCenter.qaCommands.map((command) => (
                <div className="beta-action" key={command}>
                  <span>$</span>
                  <p><code>{command}</code></p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel wide-panel">
            <h3>Release notes v4.3</h3>
            <div className="beta-action-list">
              {notificationCenter.releaseNotes.map((note) => (
                <div className="beta-action" key={note}>
                  <span>→</span>
                  <p>{note}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {activeTab === "stability" && (
        <section className="dashboard-grid admin-grid">
          <article className="panel highlight-panel beta-hero">
            <span className="team-label">v3.4 Stabilizare</span>
            <h2>{stabilityReport.statusLabel}</h2>
            <p className="muted">
              Panou pentru health check tehnic: schema save, payload size,
              ErrorBoundary, fullcheck, integritate core data si urmatorii pasi
              de refactor fara sa rupem jocul.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric"><span>Stability score</span><strong>{stabilityReport.score}/100</strong></div>
              <div className="metric"><span>Passed</span><strong>{stabilityReport.passCount}</strong></div>
              <div className="metric"><span>Warnings</span><strong>{stabilityReport.warningCount}</strong></div>
              <div className="metric"><span>Blockers</span><strong>{stabilityReport.failCount}</strong></div>
            </div>
            <div className="progress-track large-progress" aria-label="Stability score">
              <i style={{ width: `${stabilityReport.score}%` }} />
            </div>
            <p className="muted small-note">
              Comanda recomandata inainte de release: <code>{stabilityReport.fullCheckCommand}</code>
            </p>
          </article>

          <article className="panel">
            <h3>v3.4 focus</h3>
            <ul className="clean-list">
              <li>Save migration system pentru payload-uri vechi.</li>
              <li>React ErrorBoundary pentru recovery cand UI-ul crapa.</li>
              <li>Script unic <code>npm run fullcheck</code>.</li>
              <li>Tipuri centralizate in <code>src/types</code>.</li>
              <li>Refactor plan gradual pentru <code>App.tsx</code>.</li>
            </ul>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Stability checks</h3>
                <p className="muted">Verificari rapide pentru release quality si mentenanta.</p>
              </div>
              <span className={`status-pill ${stabilityReport.failCount > 0 ? "danger" : stabilityReport.warningCount > 0 ? "warning" : "ok"}`}>
                {stabilityReport.failCount > 0 ? "Needs work" : stabilityReport.warningCount > 0 ? "Review" : "Stable"}
              </span>
            </div>
            <div className="beta-check-grid">
              {stabilityReport.checks.map((item) => (
                <article className={`beta-check-card ${item.status}`} key={item.id}>
                  <div className="section-header compact-header">
                    <div>
                      <span className="team-label">{item.id}</span>
                      <h4>{item.title}</h4>
                    </div>
                    <span className={`status-badge ${item.status === "pass" ? "ok" : item.status === "warning" ? "warning" : "danger"}`}>
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
            <h3>Quick wins</h3>
            <div className="beta-action-list">
              {stabilityReport.quickWins.map((item) => (
                <div className="beta-action" key={item}>
                  <span>→</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {activeTab === "database" && (
        <section className="dashboard-grid admin-grid">
          <article className="panel highlight-panel beta-hero">
            <span className="team-label">v3.5 Real Database Mode</span>
            <h2>{realDatabaseMode.statusLabel}</h2>
            <p className="muted">
              JSON save-ul ramane fallback sigur, dar cariera poate fi oglindita
              in tabele Supabase reale pentru debug, rapoarte, cautare si viitoare
              moduri multiplayer/friends league.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric"><span>Readiness</span><strong>{realDatabaseMode.readinessScore}/100</strong></div>
              <div className="metric"><span>Tabele</span><strong>{realDatabaseMode.tableCount}</strong></div>
              <div className="metric"><span>Randuri proiectate</span><strong>{realDatabaseMode.totalProjectedRows}</strong></div>
              <div className="metric"><span>Mode</span><strong>Mirror</strong></div>
            </div>
            <div className="progress-track large-progress" aria-label="Database readiness">
              <i style={{ width: `${realDatabaseMode.readinessScore}%` }} />
            </div>
            <p className="muted small-note">
              Canonical fallback ramane <code>manager_saves.payload</code>; tabelele reale sunt mirror verificabil.
            </p>
            <div className="button-row">
              <button type="button" onClick={handleSyncRealDatabase} disabled={!authSession || !isSupabaseConfigured()}>
                Sync real DB mirror
              </button>
              <button type="button" className="secondary-button" onClick={handleSaveSupabase} disabled={!authSession}>
                Save JSON fallback
              </button>
            </div>
            {databaseSyncStatus && <p className="success-text">{databaseSyncStatus}</p>}
          </article>

          <article className="panel">
            <h3>Blockers / warnings</h3>
            {realDatabaseMode.blockers.length === 0 && realDatabaseMode.warnings.length === 0 ? (
              <p className="success-text">Real DB mirror este pregatit pentru test live.</p>
            ) : (
              <ul className="clean-list">
                {realDatabaseMode.blockers.map((item) => (
                  <li key={`blocker-${item}`}><strong>Blocker:</strong> {item}</li>
                ))}
                {realDatabaseMode.warnings.map((item) => (
                  <li key={`warning-${item}`}><strong>Warning:</strong> {item}</li>
                ))}
              </ul>
            )}
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Real Supabase tables</h3>
                <p className="muted">Tabelele adaugate in <code>supabase/schema.sql</code> pentru mirror relational.</p>
              </div>
              <span className={`status-pill ${realDatabaseMode.status === "blocked" ? "danger" : realDatabaseMode.status === "partial" ? "warning" : "ok"}`}>
                {realDatabaseMode.status}
              </span>
            </div>
            <div className="beta-check-grid">
              {realDatabaseMode.tables.map((table) => (
                <article className={`beta-check-card ${table.status === "ready" ? "pass" : table.status === "empty" ? "warning" : "fail"}`} key={table.table}>
                  <div className="section-header compact-header">
                    <div>
                      <span className="team-label">{table.table}</span>
                      <h4>{table.label}</h4>
                    </div>
                    <span className={`status-badge ${table.status === "ready" ? "ok" : table.status === "empty" ? "warning" : "danger"}`}>
                      {table.rows} rows
                    </span>
                  </div>
                  <p className="muted">{table.purpose}</p>
                  <small>Conflict target: <code>{table.conflictTarget}</code></small>
                </article>
              ))}
            </div>
          </article>

          <article className="panel">
            <h3>Migration steps</h3>
            <ol className="clean-list numbered-list">
              {realDatabaseMode.migrationSteps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </article>

          <article className="panel">
            <h3>Recommended actions</h3>
            <div className="beta-action-list">
              {realDatabaseMode.recommendedActions.map((item) => (
                <div className="beta-action" key={item}>
                  <span>→</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {activeTab === "multiplayer" && (
        <section className="dashboard-grid admin-grid">
          <article className="panel highlight-panel beta-hero">
            <span className="team-label">v3.6 Multiplayer / Friends League</span>
            <h2>{multiplayerLeague.statusLabel}</h2>
            <p className="muted">
              Modul de friends league foloseste Supabase Auth + Real Database Mode
              pentru camere private, cod de invitatie si leaderboard intre manageri.
              JSON save-ul ramane fallback sigur.
            </p>
            <div className="metric-grid compact-metrics">
              <div className="metric"><span>Readiness</span><strong>{multiplayerLeague.readinessScore}/100</strong></div>
              <div className="metric"><span>League code</span><strong>{multiplayerLeague.leagueCode}</strong></div>
              <div className="metric"><span>Join code</span><strong>{multiplayerLeague.joinCode}</strong></div>
              <div className="metric"><span>Managers</span><strong>{multiplayerLeague.projectedManagers}</strong></div>
            </div>
            <div className="progress-track large-progress" aria-label="Multiplayer readiness">
              <i style={{ width: `${multiplayerLeague.readinessScore}%` }} />
            </div>
            <p className="muted small-note">Invite text: {multiplayerLeague.invite.shareText}</p>
            <div className="button-row">
              <button type="button" onClick={handleSaveSupabase} disabled={!authSession}>
                Save cloud fallback
              </button>
              <button type="button" className="secondary-button" onClick={handleSyncRealDatabase} disabled={!authSession || !isSupabaseConfigured()}>
                Sync real DB first
              </button>
            </div>
          </article>

          <article className="panel">
            <h3>Blockers / warnings</h3>
            {multiplayerLeague.blockers.length === 0 && multiplayerLeague.warnings.length === 0 ? (
              <p className="success-text">Friends League este pregatit pentru test live.</p>
            ) : (
              <ul className="clean-list">
                {multiplayerLeague.blockers.map((item) => (
                  <li key={`mp-blocker-${item}`}><strong>Blocker:</strong> {item}</li>
                ))}
                {multiplayerLeague.warnings.map((item) => (
                  <li key={`mp-warning-${item}`}><strong>Warning:</strong> {item}</li>
                ))}
              </ul>
            )}
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Friends leaderboard preview</h3>
                <p className="muted">Snapshot comparativ pentru managerul curent si doua intrari demo de test.</p>
              </div>
              <span className={`status-pill ${multiplayerLeague.status === "blocked" ? "danger" : multiplayerLeague.status === "partial" ? "warning" : "ok"}`}>
                {multiplayerLeague.status}
              </span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Manager</th>
                    <th>Club</th>
                    <th>Sezon</th>
                    <th>Puncte</th>
                    <th>Job</th>
                    <th>Cash</th>
                  </tr>
                </thead>
                <tbody>
                  {multiplayerLeague.leaderboard.map((manager, index) => (
                    <tr className={manager.managerId === authSession?.user.id ? "user-row" : undefined} key={manager.managerId}>
                      <td>{index + 1}</td>
                      <td>{manager.managerName}</td>
                      <td>{manager.clubName}</td>
                      <td>{manager.seasonNumber}</td>
                      <td>{manager.points}</td>
                      <td>{manager.jobSecurity}</td>
                      <td>{formatMoney(manager.cashBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Supabase multiplayer tables</h3>
                <p className="muted">Tabele noi adaugate in schema.sql pentru rooms, membership si snapshots.</p>
              </div>
              <span className="status-pill ok">RLS by auth.uid()</span>
            </div>
            <div className="beta-check-grid">
              {multiplayerLeague.databaseTables.map((table) => (
                <article className="beta-check-card pass" key={table.table}>
                  <div className="section-header compact-header">
                    <div>
                      <span className="team-label">{table.table}</span>
                      <h4>{table.rows} projected rows</h4>
                    </div>
                    <span className="status-badge ok">RLS</span>
                  </div>
                  <p className="muted">{table.purpose}</p>
                  <small>{table.rls}</small>
                </article>
              ))}
            </div>
          </article>

          <article className="panel">
            <h3>Recommended actions</h3>
            <div className="beta-action-list">
              {multiplayerLeague.recommendedActions.map((item) => (
                <div className="beta-action" key={item}>
                  <span>→</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
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

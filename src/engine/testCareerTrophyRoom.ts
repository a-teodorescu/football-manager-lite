import { createInitialCupState, simulateCupRound, type CupRecord } from "./cupCompetition";
import { createInitialEuropeanCompetitionState, simulateEuropeanRound, type EuropeanCompetitionRecord } from "./europeanCompetitions";
import { createMockLeagueTeams, defaultUserTactic, simulateFullSeason, USER_TEAM_ID } from "./leagueSimulation";
import { buildPlayerStatsAwardsReport } from "./playerStatsAwards";
import { prepareNextSeason } from "./seasonProgression";
import { createInitialFinance } from "./finance";
import { buildCareerTrophyRoomReport } from "./careerTrophyRoom";

const season = simulateFullSeason(1, defaultUserTactic);
const userTeam = season.teams.find((team) => team.id === USER_TEAM_ID);
if (!userTeam) throw new Error("User team missing after season simulation.");

const seasonPreparation = prepareNextSeason({
  currentSeasonNumber: 1,
  teams: season.teams,
  standings: season.standings,
  finance: createInitialFinance(1),
});
const playerStats = buildPlayerStatsAwardsReport({
  team: userTeam,
  results: season.results,
  standings: season.standings,
  seasonNumber: 1,
});

const manualCupWin: CupRecord = {
  id: "manual-cup-final-win",
  seasonNumber: 1,
  roundIndex: 3,
  roundName: "final",
  summary: "FC Bucuresti won the domestic cup final.",
  userParticipated: true,
  userAdvanced: true,
  prizeMoney: 2500,
  championTeamName: userTeam.name,
};
const manualEuropeanRun: EuropeanCompetitionRecord = {
  id: "manual-euro-semi-run",
  seasonNumber: 1,
  roundIndex: 3,
  roundName: "semi_final",
  summary: "FC Bucuresti reached a European semi-final.",
  userParticipated: true,
  userAdvanced: true,
  prizeMoney: 2800,
};

const report = buildCareerTrophyRoomReport({
  clubName: userTeam.name,
  team: userTeam,
  standings: season.standings,
  results: season.results,
  seasonNumber: 2,
  currentRound: 1,
  maxRound: 14,
  seasonHistory: [seasonPreparation.seasonRecord],
  cupHistory: [manualCupWin],
  europeanHistory: [manualEuropeanRun],
  playerStats: playerStats.stats,
});

if (report.records.length < 5) throw new Error("Career records should be generated.");
if (report.trophies.length < 4) throw new Error("Trophy room should include trophy buckets.");
if (report.trophyCount < 1) throw new Error("Manual trophy win should be counted.");
if (report.timeline.length < 2) throw new Error("Career timeline should include current and historical items.");
if (report.hallOfFame.length === 0) throw new Error("Hall of Fame should include current squad leaders.");
if (!report.milestones.some((item) => item.id === "domestic-double")) throw new Error("Milestones should include domestic double target.");
if (report.careerScore < 1 || report.careerScore > 100) throw new Error("Career score should stay within 1-100.");

// Smoke-test real competition records too, without assuming the user wins.
let cupState = createInitialCupState(createMockLeagueTeams(), 2);
const cupSimulation = simulateCupRound({ cupState, teams: createMockLeagueTeams(), seasonNumber: 2, userTactic: defaultUserTactic });
cupState = cupSimulation.cupState;
let europeState = createInitialEuropeanCompetitionState(createMockLeagueTeams(), 2);
const euroSimulation = simulateEuropeanRound({ state: europeState, teams: createMockLeagueTeams(), seasonNumber: 2, userTactic: defaultUserTactic });
europeState = euroSimulation.state;
if (!cupState.matches.length || !europeState.matches.length) throw new Error("Competition smoke setup failed.");

console.log("Career trophy room OK", report.summary);

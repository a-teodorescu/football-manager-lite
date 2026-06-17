import type { CupRecord } from "./cupCompetition";
import type { EuropeanCompetitionRecord } from "./europeanCompetitions";
import type { FixtureResult } from "./leagueSimulation";
import type { PlayerSeasonStat } from "./playerStatsAwards";
import type { SeasonHistoryRecord } from "./seasonProgression";
import type { StandingRow } from "./standings";
import type { Team } from "./types";
import { formatMoney } from "./transferMarket";

export type TrophyTier = "major" | "domestic" | "continental" | "milestone";
export type TimelineTone = "gold" | "success" | "info" | "warning";
export type MilestoneStatus = "achieved" | "active" | "locked";

export interface TrophyRoomItem {
  id: string;
  tier: TrophyTier;
  title: string;
  count: number;
  detail: string;
  lastSeason?: number;
}

export interface CareerTimelineItem {
  id: string;
  seasonNumber: number;
  title: string;
  detail: string;
  tone: TimelineTone;
}

export interface CareerHallOfFameItem {
  playerId: string;
  playerName: string;
  tag: string;
  detail: string;
  score: number;
}

export interface CareerMilestoneItem {
  id: string;
  title: string;
  status: MilestoneStatus;
  progressLabel: string;
  detail: string;
}

export interface CareerRecordMetric {
  label: string;
  value: string;
  detail: string;
}

export interface CareerTrophyRoomReport {
  careerScore: number;
  completedSeasons: number;
  trophyCount: number;
  trophies: TrophyRoomItem[];
  records: CareerRecordMetric[];
  timeline: CareerTimelineItem[];
  hallOfFame: CareerHallOfFameItem[];
  milestones: CareerMilestoneItem[];
  summary: string;
}

function getCurrentStanding(standings: StandingRow[], teamId: string): StandingRow | undefined {
  return standings.find((row) => row.teamId === teamId);
}

function getCurrentPosition(standings: StandingRow[], teamId: string): number {
  const index = standings.findIndex((row) => row.teamId === teamId);
  return index >= 0 ? index + 1 : Math.max(1, standings.length);
}

function getLastSeason(records: Array<{ seasonNumber: number }>): number | undefined {
  return records.length ? Math.max(...records.map((record) => record.seasonNumber)) : undefined;
}

function countLeagueTitles(history: SeasonHistoryRecord[], teamId: string): number {
  return history.filter((record) => record.championTeamId === teamId).length;
}

function getCupWins(history: CupRecord[]): CupRecord[] {
  return history.filter(
    (record) => record.roundName === "final" && record.userParticipated && record.userAdvanced,
  );
}

function getEuropeanWins(history: EuropeanCompetitionRecord[]): EuropeanCompetitionRecord[] {
  return history.filter(
    (record) => record.roundName === "final" && record.userParticipated && record.userAdvanced,
  );
}

function getBestLeagueFinish(input: {
  seasonHistory: SeasonHistoryRecord[];
  standings: StandingRow[];
  teamId: string;
}): number {
  const closedSeasonBest = input.seasonHistory.reduce(
    (best, record) => Math.min(best, record.userPosition),
    Number.POSITIVE_INFINITY,
  );
  const currentPosition = getCurrentPosition(input.standings, input.teamId);
  return Math.min(closedSeasonBest, currentPosition);
}

function getHighestPoints(input: {
  seasonHistory: SeasonHistoryRecord[];
  standings: StandingRow[];
  teamId: string;
}): number {
  const currentPoints = getCurrentStanding(input.standings, input.teamId)?.points ?? 0;
  return input.seasonHistory.reduce(
    (best, record) => Math.max(best, record.userPoints),
    currentPoints,
  );
}

function getBiggestCurrentWin(input: {
  results: FixtureResult[];
  teamId: string;
}): { label: string; detail: string; margin: number } | undefined {
  const userResults = input.results.filter(
    (item) => item.result.homeTeamId === input.teamId || item.result.awayTeamId === input.teamId,
  );

  const wins = userResults
    .map((item) => {
      const isHome = item.result.homeTeamId === input.teamId;
      const forGoals = isHome ? item.result.homeScore : item.result.awayScore;
      const againstGoals = isHome ? item.result.awayScore : item.result.homeScore;
      return {
        label: `${forGoals}-${againstGoals}`,
        detail: `${item.fixture.homeTeam.name} vs ${item.fixture.awayTeam.name}`,
        margin: forGoals - againstGoals,
      };
    })
    .filter((item) => item.margin > 0)
    .sort((a, b) => b.margin - a.margin);

  return wins[0];
}

function buildTimeline(input: {
  seasonHistory: SeasonHistoryRecord[];
  cupHistory: CupRecord[];
  europeanHistory: EuropeanCompetitionRecord[];
  currentSeasonNumber: number;
  currentPosition: number;
}): CareerTimelineItem[] {
  const seasonItems: CareerTimelineItem[] = input.seasonHistory.slice(0, 8).map((record) => ({
    id: `league-${record.id}`,
    seasonNumber: record.seasonNumber,
    title: record.userPosition === 1 ? "League title season" : `League finish: #${record.userPosition}`,
    detail: record.summary,
    tone: record.userPosition === 1 ? "gold" : record.userPosition <= 3 ? "success" : "info",
  }));

  const cupItems: CareerTimelineItem[] = input.cupHistory
    .filter((record) => record.roundName === "final" || record.userAdvanced)
    .slice(0, 8)
    .map((record) => ({
      id: `cup-${record.id}`,
      seasonNumber: record.seasonNumber,
      title: record.roundName === "final" && record.userAdvanced ? "Domestic cup won" : "Domestic cup run",
      detail: record.summary,
      tone: record.roundName === "final" && record.userAdvanced ? "gold" : record.userAdvanced ? "success" : "info",
    }));

  const europeanItems: CareerTimelineItem[] = input.europeanHistory
    .filter((record) => record.roundName === "final" || record.userAdvanced)
    .slice(0, 8)
    .map((record) => ({
      id: `europe-${record.id}`,
      seasonNumber: record.seasonNumber,
      title: record.roundName === "final" && record.userAdvanced ? "European trophy won" : "European campaign",
      detail: record.summary,
      tone: record.roundName === "final" && record.userAdvanced ? "gold" : record.userAdvanced ? "success" : "info",
    }));

  const currentItem: CareerTimelineItem = {
    id: `current-season-${input.currentSeasonNumber}`,
    seasonNumber: input.currentSeasonNumber,
    title: "Current season status",
    detail: `Season ${input.currentSeasonNumber} is active. Current league position: #${input.currentPosition}.`,
    tone: input.currentPosition <= 3 ? "success" : "info",
  };

  return [currentItem, ...seasonItems, ...cupItems, ...europeanItems]
    .sort((a, b) => b.seasonNumber - a.seasonNumber || a.id.localeCompare(b.id))
    .slice(0, 10);
}

function buildHallOfFame(playerStats: PlayerSeasonStat[]): CareerHallOfFameItem[] {
  return [...playerStats]
    .sort((a, b) => b.averageRating - a.averageRating || b.goals - a.goals || b.value - a.value)
    .slice(0, 5)
    .map((player, index) => {
      const tag =
        index === 0
          ? "Club icon"
          : player.goals >= 8
            ? "Goal machine"
            : player.age <= 23
              ? "Future legend"
              : player.averageRating >= 7.2
                ? "Reliable leader"
                : "Squad pillar";

      return {
        playerId: player.playerId,
        playerName: player.playerName,
        tag,
        detail: `${player.position} · ${player.goals} goals · ${player.averageRating} avg rating · ${formatMoney(player.value)} value`,
        score: Math.round(player.averageRating * 10 + player.goals * 2 + Math.min(15, player.appearances)),
      };
    });
}

function buildMilestones(input: {
  leagueTitles: number;
  cupWins: number;
  europeanWins: number;
  topThreeFinishes: number;
  completedSeasons: number;
  bestLeagueFinish: number;
}): CareerMilestoneItem[] {
  return [
    {
      id: "first-league-title",
      title: "Win the league",
      status: input.leagueTitles > 0 ? "achieved" : input.bestLeagueFinish <= 3 ? "active" : "locked",
      progressLabel: input.leagueTitles > 0 ? `${input.leagueTitles} title(s)` : `Best finish #${input.bestLeagueFinish}`,
      detail: "First major proof that the club can dominate domestically.",
    },
    {
      id: "domestic-double",
      title: "Domestic double",
      status: input.leagueTitles > 0 && input.cupWins > 0 ? "achieved" : input.leagueTitles > 0 || input.cupWins > 0 ? "active" : "locked",
      progressLabel: `${input.leagueTitles} league · ${input.cupWins} cup`,
      detail: "Win both the league and domestic cup across your career save.",
    },
    {
      id: "european-breakthrough",
      title: "European breakthrough",
      status: input.europeanWins > 0 ? "achieved" : input.completedSeasons >= 1 ? "active" : "locked",
      progressLabel: input.europeanWins > 0 ? `${input.europeanWins} European trophy` : "No European trophy yet",
      detail: "Turn the club into a continental name.",
    },
    {
      id: "consistent-contender",
      title: "Consistent contender",
      status: input.topThreeFinishes >= 3 ? "achieved" : input.topThreeFinishes > 0 ? "active" : "locked",
      progressLabel: `${input.topThreeFinishes}/3 top-three seasons`,
      detail: "Finish in the top 3 three times across closed seasons.",
    },
  ];
}

export function buildCareerTrophyRoomReport(input: {
  clubName: string;
  team: Team;
  standings: StandingRow[];
  results: FixtureResult[];
  seasonNumber: number;
  currentRound: number;
  maxRound: number;
  seasonHistory: SeasonHistoryRecord[];
  cupHistory: CupRecord[];
  europeanHistory: EuropeanCompetitionRecord[];
  playerStats: PlayerSeasonStat[];
}): CareerTrophyRoomReport {
  const leagueTitles = countLeagueTitles(input.seasonHistory, input.team.id);
  const cupWins = getCupWins(input.cupHistory);
  const europeanWins = getEuropeanWins(input.europeanHistory);
  const topThreeFinishes = input.seasonHistory.filter((record) => record.userPosition <= 3).length;
  const completedSeasons = input.seasonHistory.length;
  const trophyCount = leagueTitles + cupWins.length + europeanWins.length;
  const currentPosition = getCurrentPosition(input.standings, input.team.id);
  const currentStanding = getCurrentStanding(input.standings, input.team.id);
  const bestLeagueFinish = getBestLeagueFinish({ seasonHistory: input.seasonHistory, standings: input.standings, teamId: input.team.id });
  const highestPoints = getHighestPoints({ seasonHistory: input.seasonHistory, standings: input.standings, teamId: input.team.id });
  const biggestWin = getBiggestCurrentWin({ results: input.results, teamId: input.team.id });
  const currentSeasonProgress = Math.round((Math.min(input.currentRound - 1, input.maxRound) / Math.max(1, input.maxRound)) * 100);
  const totalPrizeMoney = input.seasonHistory.reduce((sum, record) => sum + record.prizeMoney, 0) + input.cupHistory.reduce((sum, record) => sum + record.prizeMoney, 0) + input.europeanHistory.reduce((sum, record) => sum + record.prizeMoney, 0);

  const trophies: TrophyRoomItem[] = [
    {
      id: "league-title",
      tier: "major",
      title: "League titles",
      count: leagueTitles,
      detail: leagueTitles > 0 ? "Domestic league trophies won in closed seasons." : "No league title yet.",
      lastSeason: getLastSeason(input.seasonHistory.filter((record) => record.championTeamId === input.team.id)),
    },
    {
      id: "domestic-cup",
      tier: "domestic",
      title: "Domestic cups",
      count: cupWins.length,
      detail: cupWins.length > 0 ? "Cup finals won by your club." : "No domestic cup trophy yet.",
      lastSeason: getLastSeason(cupWins),
    },
    {
      id: "european-trophy",
      tier: "continental",
      title: "European trophies",
      count: europeanWins.length,
      detail: europeanWins.length > 0 ? "Continental finals won by your club." : "No European trophy yet.",
      lastSeason: getLastSeason(europeanWins),
    },
    {
      id: "top-three",
      tier: "milestone",
      title: "Top-three finishes",
      count: topThreeFinishes,
      detail: "Closed seasons finished on the podium.",
      lastSeason: getLastSeason(input.seasonHistory.filter((record) => record.userPosition <= 3)),
    },
  ];

  const records: CareerRecordMetric[] = [
    {
      label: "Career score",
      value: `${Math.min(100, Math.round(18 + trophyCount * 14 + topThreeFinishes * 5 + completedSeasons * 4 + Math.max(0, 9 - bestLeagueFinish) * 2))}/100`,
      detail: "Score based on trophies, consistency, closed seasons and best league finish.",
    },
    {
      label: "Best league finish",
      value: `#${bestLeagueFinish}`,
      detail: completedSeasons > 0 ? "Includes closed seasons and current table." : "Current season only until you close the first season.",
    },
    {
      label: "Highest points",
      value: String(highestPoints),
      detail: "Best points total from closed seasons or current table.",
    },
    {
      label: "Current season progress",
      value: `${currentSeasonProgress}%`,
      detail: `Round ${Math.min(input.currentRound, input.maxRound)}/${input.maxRound}. Current points: ${currentStanding?.points ?? 0}.`,
    },
    {
      label: "Career prize money",
      value: formatMoney(totalPrizeMoney),
      detail: "League, cup and European prize money recorded in career history.",
    },
    {
      label: "Biggest current win",
      value: biggestWin?.label ?? "-",
      detail: biggestWin?.detail ?? "No current-season win recorded yet.",
    },
  ];

  const careerScoreValue = Number(records[0].value.split("/")[0]);
  const milestones = buildMilestones({ leagueTitles, cupWins: cupWins.length, europeanWins: europeanWins.length, topThreeFinishes, completedSeasons, bestLeagueFinish });

  return {
    careerScore: careerScoreValue,
    completedSeasons,
    trophyCount,
    trophies,
    records,
    timeline: buildTimeline({
      seasonHistory: input.seasonHistory,
      cupHistory: input.cupHistory,
      europeanHistory: input.europeanHistory,
      currentSeasonNumber: input.seasonNumber,
      currentPosition,
    }),
    hallOfFame: buildHallOfFame(input.playerStats),
    milestones,
    summary: `${input.clubName}: ${trophyCount} trophy/trophies, ${completedSeasons} closed season(s), best league finish #${bestLeagueFinish}.`,
  };
}

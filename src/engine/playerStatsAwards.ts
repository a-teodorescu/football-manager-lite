import type { FixtureResult } from "./leagueSimulation";
import type { Player, Team } from "./types";
import type { StandingRow } from "./standings";
import { estimatePlayerValue, formatMoney } from "./transferMarket";

export interface PlayerSeasonStat {
  playerId: string;
  playerName: string;
  position: Player["position"];
  age: number;
  goals: number;
  appearances: number;
  averageRating: number;
  value: number;
}

export interface ClubRecordItem {
  label: string;
  value: string;
  detail: string;
}

export interface PlayerAward {
  title: string;
  playerName: string;
  reason: string;
}

export interface PlayerStatsAwardsReport {
  stats: PlayerSeasonStat[];
  awards: PlayerAward[];
  records: ClubRecordItem[];
  summary: string;
}

function userResultScore(result: FixtureResult, teamId: string): { forGoals: number; againstGoals: number } {
  const isHome = result.result.homeTeamId === teamId;
  return {
    forGoals: isHome ? result.result.homeScore : result.result.awayScore,
    againstGoals: isHome ? result.result.awayScore : result.result.homeScore,
  };
}

function getPlayerGoals(results: FixtureResult[], player: Player, teamId: string): number {
  return results.reduce((sum, item) => {
    const involved = item.result.homeTeamId === teamId || item.result.awayTeamId === teamId;
    if (!involved) return sum;
    return sum + item.result.events.filter((event) => event.type === "goal" && event.playerId === player.id).length;
  }, 0);
}

function getRating(player: Player, goals: number): number {
  const base = player.overall * 0.45 + player.form * 0.2 + player.morale * 0.15 + (player.fitness ?? 100) * 0.1 + goals * 1.7;
  const positionBonus = player.position === "GK" ? player.defending * 0.05 : player.position === "ATT" ? player.shooting * 0.06 : player.passing * 0.05;
  return Math.round(Math.min(10, Math.max(5.5, (base + positionBonus) / 10)) * 10) / 10;
}

export function buildPlayerStatsAwardsReport(input: {
  team: Team;
  results: FixtureResult[];
  standings: StandingRow[];
  seasonNumber: number;
}): PlayerStatsAwardsReport {
  const userResults = input.results.filter(
    (item) => item.result.homeTeamId === input.team.id || item.result.awayTeamId === input.team.id,
  );
  const appearances = userResults.length;
  const stats = input.team.players
    .map((player) => {
      const goals = getPlayerGoals(userResults, player, input.team.id);
      return {
        playerId: player.id,
        playerName: player.name,
        position: player.position,
        age: player.age,
        goals,
        appearances,
        averageRating: getRating(player, goals),
        value: estimatePlayerValue(player),
      };
    })
    .sort((a, b) => b.averageRating - a.averageRating || b.goals - a.goals);

  const topScorer = [...stats].sort((a, b) => b.goals - a.goals || b.averageRating - a.averageRating)[0];
  const playerOfSeason = stats[0];
  const bestYoung = stats.filter((item) => item.age <= 23).sort((a, b) => b.averageRating - a.averageRating)[0] ?? stats[0];
  const bestValue = stats
    .filter((item) => item.value > 0)
    .sort((a, b) => b.averageRating / b.value - a.averageRating / a.value)[0] ?? stats[0];

  const goalDiffs = userResults.map((item) => ({ item, ...userResultScore(item, input.team.id) }));
  const biggestWin = goalDiffs.sort((a, b) => b.forGoals - b.againstGoals - (a.forGoals - a.againstGoals))[0];
  const highestScoring = [...goalDiffs].sort((a, b) => b.forGoals + b.againstGoals - (a.forGoals + a.againstGoals))[0];
  const position = Math.max(1, input.standings.findIndex((row) => row.teamId === input.team.id) + 1 || input.standings.length);

  const records: ClubRecordItem[] = [
    {
      label: "Pozitie curenta",
      value: `#${position}`,
      detail: `Sezon ${input.seasonNumber}, dupa ${appearances} meciuri jucate de club.`,
    },
    {
      label: "Goluri marcate",
      value: String(goalDiffs.reduce((sum, item) => sum + item.forGoals, 0)),
      detail: "Total in meciurile oficiale simulate din campionat.",
    },
    {
      label: "Biggest win",
      value: biggestWin ? `${biggestWin.forGoals}-${biggestWin.againstGoals}` : "-",
      detail: biggestWin ? `${biggestWin.item.fixture.homeTeam.name} vs ${biggestWin.item.fixture.awayTeam.name}` : "Nu exista meciuri simulate.",
    },
    {
      label: "Highest scoring game",
      value: highestScoring ? `${highestScoring.forGoals + highestScoring.againstGoals} goluri` : "-",
      detail: highestScoring ? `${highestScoring.item.fixture.homeTeam.name} vs ${highestScoring.item.fixture.awayTeam.name}` : "Nu exista meciuri simulate.",
    },
  ];

  const awards: PlayerAward[] = [
    { title: "Player of the Season", playerName: playerOfSeason?.playerName ?? "-", reason: `${playerOfSeason?.averageRating ?? "-"} average rating.` },
    { title: "Top Scorer", playerName: topScorer?.playerName ?? "-", reason: `${topScorer?.goals ?? 0} goluri.` },
    { title: "Young Player", playerName: bestYoung?.playerName ?? "-", reason: `${bestYoung?.age ?? "-"} ani, rating ${bestYoung?.averageRating ?? "-"}.` },
    { title: "Best Value", playerName: bestValue?.playerName ?? "-", reason: `${bestValue ? formatMoney(bestValue.value) : "-"} valoare estimata.` },
  ];

  return {
    stats,
    awards,
    records,
    summary: `${appearances} meciuri urmarite, ${stats.reduce((sum, item) => sum + item.goals, 0)} goluri atribuite jucatorilor, ${awards.length} awards active.`,
  };
}

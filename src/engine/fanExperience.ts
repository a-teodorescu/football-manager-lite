import type { FixtureResult } from "./leagueSimulation";
import type { StandingRow } from "./standings";
import type { StadiumFacilitiesState } from "./stadiumFacilities";
import type { Team } from "./types";

export interface FanState {
  happiness: number;
  attendanceMomentum: number;
  history: FanRecord[];
}

export interface FanRecord {
  id: string;
  seasonNumber: number;
  round: number;
  happiness: number;
  projectedAttendance: number;
  summary: string;
}

export interface FanReport {
  happiness: number;
  projectedAttendance: number;
  selloutChance: number;
  mood: "ecstatic" | "happy" | "neutral" | "frustrated";
  summary: string;
}

export function createInitialFanState(team?: Team): FanState {
  return {
    happiness: Math.max(45, Math.min(80, team?.morale ?? 62)),
    attendanceMomentum: 50,
    history: [],
  };
}

function getRoundResult(roundResults: FixtureResult[], teamId: string): { gf: number; ga: number; home: boolean } | undefined {
  const result = roundResults.find((item) => item.result.homeTeamId === teamId || item.result.awayTeamId === teamId);
  if (!result) return undefined;
  const home = result.result.homeTeamId === teamId;
  return {
    home,
    gf: home ? result.result.homeScore : result.result.awayScore,
    ga: home ? result.result.awayScore : result.result.homeScore,
  };
}

function getMood(happiness: number): FanReport["mood"] {
  if (happiness >= 78) return "ecstatic";
  if (happiness >= 62) return "happy";
  if (happiness >= 42) return "neutral";
  return "frustrated";
}

export function buildFanReport(input: {
  state: FanState;
  team: Team;
  standings: StandingRow[];
  facilities: StadiumFacilitiesState;
}): FanReport {
  const position = Math.max(1, input.standings.findIndex((row) => row.teamId === input.team.id) + 1 || input.standings.length);
  const capacity = input.facilities.capacity;
  const demand = input.state.happiness * 0.55 + input.state.attendanceMomentum * 0.25 + input.team.reputation * 0.18 + Math.max(0, 10 - position) * 3;
  const projectedAttendance = Math.min(capacity, Math.round(capacity * Math.max(0.35, Math.min(0.98, demand / 100))));
  const selloutChance = Math.round(Math.max(0, Math.min(100, (projectedAttendance / Math.max(1, capacity)) * 100 - 12)));
  return {
    happiness: input.state.happiness,
    projectedAttendance,
    selloutChance,
    mood: getMood(input.state.happiness),
    summary: `Fan happiness ${input.state.happiness}/100, attendance estimat ${projectedAttendance.toLocaleString("en-US")}/${capacity.toLocaleString("en-US")}.`,
  };
}

export function updateFanStateAfterRound(input: {
  state: FanState;
  team: Team;
  standings: StandingRow[];
  facilities: StadiumFacilitiesState;
  roundResults: FixtureResult[];
  seasonNumber: number;
  round: number;
}): { state: FanState; record: FanRecord } {
  const result = getRoundResult(input.roundResults, input.team.id);
  const position = Math.max(1, input.standings.findIndex((row) => row.teamId === input.team.id) + 1 || input.standings.length);
  let delta = Math.max(-3, 6 - position);
  if (result) {
    if (result.gf > result.ga) delta += result.home ? 6 : 4;
    if (result.gf === result.ga) delta += 1;
    if (result.gf < result.ga) delta -= result.home ? 7 : 5;
    if (result.gf >= 3) delta += 2;
  }
  delta += Math.round((input.facilities.fanExperienceLevel - 1) * 1.5);
  const happiness = Math.max(0, Math.min(100, input.state.happiness + delta));
  const attendanceMomentum = Math.max(0, Math.min(100, input.state.attendanceMomentum + Math.round(delta / 2)));
  const projectedAttendance = buildFanReport({ ...input, state: { ...input.state, happiness, attendanceMomentum } }).projectedAttendance;
  const record: FanRecord = {
    id: `fans-s${input.seasonNumber}-r${input.round}`,
    seasonNumber: input.seasonNumber,
    round: input.round,
    happiness,
    projectedAttendance,
    summary: `Fanii sunt ${getMood(happiness)} dupa runda ${input.round}. Attendance proiectat: ${projectedAttendance.toLocaleString("en-US")}.`,
  };

  return {
    record,
    state: {
      happiness,
      attendanceMomentum,
      history: [record, ...input.state.history].slice(0, 24),
    },
  };
}

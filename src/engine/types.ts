export type Position = "GK" | "DEF" | "MID" | "ATT";

export type Formation = "4-4-2" | "4-3-3" | "4-2-3-1" | "5-3-2";

export type Mentality = "defensive" | "balanced" | "attacking";

export type Pressing = "low" | "medium" | "high";

export type TrainingFocus = "balanced" | "attacking" | "defensive" | "fitness";

export type MatchSide = "home" | "away" | "neutral";

export type InjurySeverity = "minor" | "moderate";

export interface PlayerInjury {
  severity: InjurySeverity;
  label: string;
  roundsRemaining: number;
}

export interface PlayerContract {
  wage: number;
  signedSeason: number;
  expiresSeason: number;
  happiness: number;
}

export type MatchEventType =
  | "kickoff"
  | "shot"
  | "shot_on_target"
  | "goal"
  | "foul"
  | "yellow_card"
  | "red_card"
  | "injury"
  | "full_time";

export interface Player {
  id: string;
  name: string;
  position: Position;
  age: number;

  overall: number;
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
  stamina: number;
  morale: number;
  form: number;
  fitness?: number;
  wage?: number;
  contract?: PlayerContract;
  injury?: PlayerInjury;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  reputation: number;
  morale: number;
}

export interface Tactic {
  formation: Formation;
  mentality: Mentality;
  pressing: Pressing;
}

export interface TeamStrength {
  attack: number;
  midfield: number;
  defense: number;
  goalkeeper: number;
  overall: number;
}

export interface MatchEvent {
  minute: number;
  type: MatchEventType;
  team: MatchSide;
  playerId?: string;
  playerName?: string;
  text: string;
}

export interface MatchStats {
  homePossession: number;
  awayPossession: number;

  homeShots: number;
  awayShots: number;

  homeShotsOnTarget: number;
  awayShotsOnTarget: number;

  homeFouls: number;
  awayFouls: number;

  homeYellowCards: number;
  awayYellowCards: number;

  homeRedCards: number;
  awayRedCards: number;

  homeXg: number;
  awayXg: number;
}

export interface MatchResult {
  homeTeamId: string;
  awayTeamId: string;

  homeTeamName: string;
  awayTeamName: string;

  homeScore: number;
  awayScore: number;

  stats: MatchStats;
  events: MatchEvent[];

  seed: string;
}

export interface SimulateMatchInput {
  homeTeam: Team;
  awayTeam: Team;
  homeTactic: Tactic;
  awayTactic: Tactic;
  seed: string;
}

export type Position = "GK" | "DEF" | "MID" | "ATT";

export type Formation = "4-4-2" | "4-3-3" | "4-2-3-1" | "5-3-2";

export type Mentality = "defensive" | "balanced" | "attacking";

export type Pressing = "low" | "medium" | "high";

export type TrainingFocus = "balanced" | "attacking" | "defensive" | "fitness";

export type PreferredFoot = "left" | "right" | "both";

export type PlayerPersonality =
  | "leader"
  | "professional"
  | "ambitious"
  | "loyal"
  | "temperamental"
  | "team_player";

export type PlayerRole =
  | "sweeper_keeper"
  | "shot_stopper"
  | "ball_playing_defender"
  | "defensive_fullback"
  | "box_to_box"
  | "deep_lying_playmaker"
  | "wide_creator"
  | "target_forward"
  | "pressing_forward"
  | "inside_forward";

export type MatchSide = "home" | "away" | "neutral";

export type SetPieceRole = "captain" | "penalty" | "freeKick" | "leftCorner" | "rightCorner";

export interface SetPieceAssignments {
  captainId?: string;
  penaltyTakerId?: string;
  freeKickTakerId?: string;
  leftCornerTakerId?: string;
  rightCornerTakerId?: string;
}

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
  | "substitution"
  | "set_piece"
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

  countryCode?: string;
  nationality?: string;
  flagEmoji?: string;
  preferredFoot?: PreferredFoot;
  personality?: PlayerPersonality;
  role?: PlayerRole;
  marketability?: number;
  avatarSeed?: string;
}

export type TeamTacticalStyle =
  | "possession"
  | "direct"
  | "counter"
  | "pressing"
  | "defensive"
  | "balanced";

export type TeamAmbition = "title" | "europe" | "mid_table" | "survival";

export interface SubstitutionInstruction {
  outPlayerId: string;
  inPlayerId: string;
  minute: number;
  reason?: string;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  reputation: number;
  morale: number;
  shortName?: string;
  city?: string;
  stadium?: string;
  country?: string;
  primaryColor?: string;
  secondaryColor?: string;
  tacticalStyle?: TeamTacticalStyle;
  ambition?: TeamAmbition;
  rivalTeamId?: string;
  fanbase?: number;
  lineupPlayerIds?: string[];
  substitutionPlan?: SubstitutionInstruction[];
  setPieceAssignments?: SetPieceAssignments;
}

export type TacticalTempo = "slow" | "normal" | "fast";

export type TacticalWidth = "narrow" | "balanced" | "wide";

export type TacticalRisk = "safe" | "balanced" | "risky";

export type TacticalLine = "deep" | "standard" | "high";

export type TacticalFocus = "balanced" | "left" | "right" | "central";

export interface Tactic {
  formation: Formation;
  mentality: Mentality;
  pressing: Pressing;
  tempo?: TacticalTempo;
  width?: TacticalWidth;
  risk?: TacticalRisk;
  defensiveLine?: TacticalLine;
  attackingFocus?: TacticalFocus;
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
  substitutions?: {
    home: SubstitutionInstruction[];
    away: SubstitutionInstruction[];
  };
}

export interface SimulateMatchInput {
  homeTeam: Team;
  awayTeam: Team;
  homeTactic: Tactic;
  awayTactic: Tactic;
  seed: string;
  substitutions?: {
    home: SubstitutionInstruction[];
    away: SubstitutionInstruction[];
  };
}

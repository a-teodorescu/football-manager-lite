import { Player, Tactic, Team, TeamStrength } from "./types";
import { calculateTeamStrength } from "./teamStrength";
import { clamp } from "./random";
import { getAverageFitness, getUnavailablePlayers } from "./playerStatus";

export type TacticalTempo = "slow" | "normal" | "fast";
export type TacticalWidth = "narrow" | "balanced" | "wide";
export type TacticalRisk = "safe" | "balanced" | "risky";
export type TacticalLine = "deep" | "standard" | "high";
export type TacticalFocus = "balanced" | "left" | "right" | "central";

export interface AdvancedTacticSettings {
  tempo: TacticalTempo;
  width: TacticalWidth;
  risk: TacticalRisk;
  defensiveLine: TacticalLine;
  attackingFocus: TacticalFocus;
}

export type AdvancedTactic = Omit<Tactic, keyof AdvancedTacticSettings> & AdvancedTacticSettings;

export interface TacticalRoleAssignment {
  playerId: string;
  playerName: string;
  position: Player["position"];
  role: string;
  suitability: number;
  note: string;
}

export interface TacticalRiskReport {
  label: "Stable" | "Balanced" | "Risky" | "Exposed";
  score: number;
  warnings: string[];
}

export interface AdvancedTacticsReport {
  tactic: AdvancedTactic;
  styleLabel: string;
  strength: TeamStrength;
  tacticalScore: number;
  risk: TacticalRiskReport;
  roles: TacticalRoleAssignment[];
  recommendations: string[];
  summary: string;
}

export const DEFAULT_ADVANCED_TACTIC_SETTINGS: AdvancedTacticSettings = {
  tempo: "normal",
  width: "balanced",
  risk: "balanced",
  defensiveLine: "standard",
  attackingFocus: "balanced",
};

export function normalizeAdvancedTactic(tactic: Tactic): AdvancedTactic {
  const extended = tactic as Partial<AdvancedTactic>;
  return {
    formation: tactic.formation,
    mentality: tactic.mentality,
    pressing: tactic.pressing,
    tempo: extended.tempo ?? DEFAULT_ADVANCED_TACTIC_SETTINGS.tempo,
    width: extended.width ?? DEFAULT_ADVANCED_TACTIC_SETTINGS.width,
    risk: extended.risk ?? DEFAULT_ADVANCED_TACTIC_SETTINGS.risk,
    defensiveLine: extended.defensiveLine ?? DEFAULT_ADVANCED_TACTIC_SETTINGS.defensiveLine,
    attackingFocus: extended.attackingFocus ?? DEFAULT_ADVANCED_TACTIC_SETTINGS.attackingFocus,
  };
}

function getAverage(values: number[]): number {
  if (values.length === 0) return 50;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getPositionAverage(players: Player[], position: Player["position"], attribute: keyof Pick<Player, "pace" | "shooting" | "passing" | "defending" | "stamina" | "overall">): number {
  return getAverage(players.filter((player) => player.position === position).map((player) => Number(player[attribute])));
}

function getTempoModifier(tactic: AdvancedTactic): Pick<TeamStrength, "attack" | "midfield" | "defense" | "goalkeeper"> {
  if (tactic.tempo === "slow") return { attack: 0.98, midfield: 1.05, defense: 1.02, goalkeeper: 1 };
  if (tactic.tempo === "fast") return { attack: 1.06, midfield: 0.98, defense: 0.96, goalkeeper: 1 };
  return { attack: 1, midfield: 1, defense: 1, goalkeeper: 1 };
}

function getWidthModifier(tactic: AdvancedTactic): Pick<TeamStrength, "attack" | "midfield" | "defense" | "goalkeeper"> {
  if (tactic.width === "narrow") return { attack: 0.99, midfield: 1.06, defense: 1.01, goalkeeper: 1 };
  if (tactic.width === "wide") return { attack: 1.05, midfield: 0.98, defense: 0.96, goalkeeper: 1 };
  return { attack: 1, midfield: 1, defense: 1, goalkeeper: 1 };
}

function getRiskModifier(tactic: AdvancedTactic): Pick<TeamStrength, "attack" | "midfield" | "defense" | "goalkeeper"> {
  if (tactic.risk === "safe") return { attack: 0.96, midfield: 1.01, defense: 1.07, goalkeeper: 1.01 };
  if (tactic.risk === "risky") return { attack: 1.08, midfield: 1.01, defense: 0.92, goalkeeper: 0.99 };
  return { attack: 1, midfield: 1, defense: 1, goalkeeper: 1 };
}

function getLineModifier(tactic: AdvancedTactic): Pick<TeamStrength, "attack" | "midfield" | "defense" | "goalkeeper"> {
  if (tactic.defensiveLine === "deep") return { attack: 0.97, midfield: 0.99, defense: 1.07, goalkeeper: 1.02 };
  if (tactic.defensiveLine === "high") return { attack: 1.03, midfield: 1.04, defense: 0.94, goalkeeper: 0.98 };
  return { attack: 1, midfield: 1, defense: 1, goalkeeper: 1 };
}

function getFocusModifier(tactic: AdvancedTactic): Pick<TeamStrength, "attack" | "midfield" | "defense" | "goalkeeper"> {
  if (tactic.attackingFocus === "central") return { attack: 1.02, midfield: 1.04, defense: 1, goalkeeper: 1 };
  if (tactic.attackingFocus === "left" || tactic.attackingFocus === "right") return { attack: 1.04, midfield: 0.99, defense: 0.99, goalkeeper: 1 };
  return { attack: 1, midfield: 1, defense: 1, goalkeeper: 1 };
}

function multiplyStrength(base: TeamStrength, modifiers: Array<Pick<TeamStrength, "attack" | "midfield" | "defense" | "goalkeeper">>): TeamStrength {
  const combined = modifiers.reduce(
    (acc, modifier) => ({
      attack: acc.attack * modifier.attack,
      midfield: acc.midfield * modifier.midfield,
      defense: acc.defense * modifier.defense,
      goalkeeper: acc.goalkeeper * modifier.goalkeeper,
    }),
    { attack: 1, midfield: 1, defense: 1, goalkeeper: 1 },
  );
  const attack = base.attack * combined.attack;
  const midfield = base.midfield * combined.midfield;
  const defense = base.defense * combined.defense;
  const goalkeeper = base.goalkeeper * combined.goalkeeper;
  return {
    attack,
    midfield,
    defense,
    goalkeeper,
    overall: getAverage([attack, midfield, defense, goalkeeper]),
  };
}

export function calculateAdvancedTeamStrength(team: Team, tactic: Tactic): TeamStrength {
  const normalized = normalizeAdvancedTactic(tactic);
  const base = calculateTeamStrength(team, normalized);
  return multiplyStrength(base, [
    getTempoModifier(normalized),
    getWidthModifier(normalized),
    getRiskModifier(normalized),
    getLineModifier(normalized),
    getFocusModifier(normalized),
  ]);
}

function getRoleForPlayer(player: Player, tactic: AdvancedTactic): string {
  if (player.position === "GK") return tactic.defensiveLine === "high" ? "Sweeper Keeper" : "Shot Stopper";
  if (player.position === "DEF") return tactic.defensiveLine === "deep" ? "No-Nonsense Defender" : "Ball-Playing Defender";
  if (player.position === "MID") return tactic.tempo === "slow" ? "Deep Playmaker" : tactic.pressing === "high" ? "Pressing Midfielder" : "Box-to-Box";
  if (tactic.width === "wide") return "Wide Forward";
  if (tactic.risk === "risky") return "Advanced Forward";
  return "Pressing Forward";
}

function getRoleSuitability(player: Player, tactic: AdvancedTactic): number {
  let score = player.overall;
  if (player.position === "GK" && tactic.defensiveLine === "high") score += player.pace >= 60 ? 6 : -6;
  if (player.position === "DEF" && tactic.defensiveLine === "high") score += player.pace >= 68 ? 7 : -8;
  if (player.position === "MID" && tactic.tempo === "fast") score += player.stamina >= 70 ? 6 : -5;
  if (player.position === "MID" && tactic.tempo === "slow") score += player.passing >= 70 ? 6 : -3;
  if (player.position === "ATT" && tactic.width === "wide") score += player.pace >= 70 ? 5 : -3;
  if (tactic.pressing === "high") score += player.stamina >= 70 ? 4 : -7;
  if (tactic.risk === "safe") score += player.defending >= 65 ? 3 : 0;
  return Math.round(clamp(score, 35, 99));
}

function buildRoleAssignments(team: Team, tactic: AdvancedTactic): TacticalRoleAssignment[] {
  return [...team.players]
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 11)
    .map((player) => {
      const suitability = getRoleSuitability(player, tactic);
      return {
        playerId: player.id,
        playerName: player.name,
        position: player.position,
        role: getRoleForPlayer(player, tactic),
        suitability,
        note: suitability >= 80 ? "Potrivire foarte buna" : suitability >= 68 ? "Potrivire stabila" : "Necesita atentie tactica",
      };
    });
}

function buildRiskReport(team: Team, tactic: AdvancedTactic): TacticalRiskReport {
  const warnings: string[] = [];
  let score = 35;
  const avgFitness = getAverageFitness(team);
  const injuredCount = getUnavailablePlayers(team).length;
  const defenderPace = getPositionAverage(team.players, "DEF", "pace");
  const midfieldStamina = getPositionAverage(team.players, "MID", "stamina");

  if (tactic.mentality === "attacking") score += 12;
  if (tactic.pressing === "high") score += 14;
  if (tactic.risk === "risky") score += 18;
  if (tactic.defensiveLine === "high") score += 12;
  if (tactic.width === "wide") score += 5;
  if (tactic.tempo === "fast") score += 6;
  if (tactic.risk === "safe") score -= 12;
  if (tactic.defensiveLine === "deep") score -= 10;
  if (tactic.mentality === "defensive") score -= 6;
  if (avgFitness < 68) score += 12;
  if (injuredCount > 0) score += injuredCount * 3;

  if (tactic.pressing === "high" && midfieldStamina < 68) warnings.push("Pressing-ul ridicat cere mai multa stamina la mijloc.");
  if (tactic.defensiveLine === "high" && defenderPace < 66) warnings.push("Linia defensiva sus este riscanta cu fundasi lenti.");
  if (tactic.risk === "risky" && tactic.mentality === "attacking") warnings.push("Mentalitatea ofensiva + risc ridicat poate expune apararea.");
  if (avgFitness < 68) warnings.push("Fitness-ul mediu scazut amplifica riscul tactic.");

  const clamped = Math.round(clamp(score, 0, 100));
  const label = clamped >= 80 ? "Exposed" : clamped >= 62 ? "Risky" : clamped >= 42 ? "Balanced" : "Stable";
  return { label, score: clamped, warnings };
}

function buildRecommendations(team: Team, tactic: AdvancedTactic, strength: TeamStrength, risk: TacticalRiskReport): string[] {
  const recommendations: string[] = [];
  const avgFitness = getAverageFitness(team);
  const midfieldPassing = getPositionAverage(team.players, "MID", "passing");
  const attackerPace = getPositionAverage(team.players, "ATT", "pace");
  const defenderDefending = getPositionAverage(team.players, "DEF", "defending");

  if (risk.score >= 75) recommendations.push("Redu riscul sau coboara linia defensiva inaintea meciurilor grele.");
  if (tactic.tempo === "fast" && avgFitness < 72) recommendations.push("Tempo fast consuma energie; foloseste training fitness sau tempo normal.");
  if (tactic.width === "wide" && attackerPace < 68) recommendations.push("Wide play cere atacanti rapizi; central poate fi mai sigur cu lotul actual.");
  if (tactic.tempo === "slow" && midfieldPassing >= 72) recommendations.push("Mijlocul are passing bun; tempo slow poate controla meciurile stranse.");
  if (tactic.defensiveLine === "deep" && defenderDefending >= 72) recommendations.push("Apararea poate sustine un bloc jos eficient contra echipelor mai puternice.");
  if (strength.attack > strength.defense + 8) recommendations.push("Profil ofensiv puternic: cauta gol rapid, dar monitorizeaza tranzitiile defensive.");
  if (recommendations.length === 0) recommendations.push("Tactica este echilibrata pentru lotul actual. Ajusteaza doar in functie de adversar.");
  return recommendations;
}

function getStyleLabel(tactic: AdvancedTactic): string {
  const parts = [tactic.formation, tactic.mentality, tactic.pressing, tactic.tempo, tactic.width, tactic.risk, tactic.defensiveLine];
  return parts.join(" / ");
}

export function buildAdvancedTacticsReport(team: Team, tactic: Tactic): AdvancedTacticsReport {
  const normalized = normalizeAdvancedTactic(tactic);
  const strength = calculateAdvancedTeamStrength(team, normalized);
  const risk = buildRiskReport(team, normalized);
  const roles = buildRoleAssignments(team, normalized);
  const tacticalScore = Math.round(clamp(strength.overall - risk.score * 0.12 + getAverage(roles.map((role) => role.suitability)) * 0.18, 1, 100));
  const recommendations = buildRecommendations(team, normalized, strength, risk);
  return {
    tactic: normalized,
    styleLabel: getStyleLabel(normalized),
    strength,
    tacticalScore,
    risk,
    roles,
    recommendations,
    summary: `Tactical score ${tacticalScore}/100, risc ${risk.label} (${risk.score}/100).`,
  };
}

export function getAdvancedTacticValueOptions() {
  return {
    tempo: ["slow", "normal", "fast"] as TacticalTempo[],
    width: ["narrow", "balanced", "wide"] as TacticalWidth[],
    risk: ["safe", "balanced", "risky"] as TacticalRisk[],
    defensiveLine: ["deep", "standard", "high"] as TacticalLine[],
    attackingFocus: ["balanced", "left", "right", "central"] as TacticalFocus[],
  };
}

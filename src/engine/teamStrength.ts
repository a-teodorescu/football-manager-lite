import { Player, Tactic, Team, TeamStrength } from "./types";
import { isPlayerInjured, normalizePlayerStatus } from "./playerStatus";

function average(values: number[]): number {
  if (values.length === 0) return 50;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getPlayersByPosition(players: Player[], position: Player["position"]): Player[] {
  return players.filter((player) => player.position === position);
}

function getAvailabilityModifier(player: Player): number {
  const normalized = normalizePlayerStatus(player);
  const fitness = normalized.fitness ?? 100;
  const fitnessModifier = 0.82 + fitness / 500;
  const injuryModifier = isPlayerInjured(normalized) ? 0.58 : 1;

  return fitnessModifier * injuryModifier;
}

function calculatePlayerAttack(player: Player): number {
  const availability = getAvailabilityModifier(player);

  return (
    player.shooting * 0.45 +
    player.pace * 0.2 +
    player.passing * 0.15 +
    player.morale * 0.1 +
    player.form * 0.1
  ) * availability;
}

function calculatePlayerMidfield(player: Player): number {
  const availability = getAvailabilityModifier(player);

  return (
    player.passing * 0.4 +
    player.stamina * 0.2 +
    player.defending * 0.15 +
    player.shooting * 0.1 +
    player.morale * 0.075 +
    player.form * 0.075
  ) * availability;
}

function calculatePlayerDefense(player: Player): number {
  const availability = getAvailabilityModifier(player);

  return (
    player.defending * 0.5 +
    player.pace * 0.15 +
    player.stamina * 0.15 +
    player.morale * 0.1 +
    player.form * 0.1
  ) * availability;
}

function calculateGoalkeeper(player: Player | undefined): number {
  if (!player) return 50;

  const availability = getAvailabilityModifier(player);

  return (
    player.overall * 0.55 +
    player.defending * 0.2 +
    player.stamina * 0.1 +
    player.morale * 0.075 +
    player.form * 0.075
  ) * availability;
}

function getFormationModifiers(tactic: Tactic) {
  const formationModifiers = {
    "4-4-2": {
      attack: 1.03,
      midfield: 0.98,
      defense: 1.0,
    },
    "4-3-3": {
      attack: 1.08,
      midfield: 0.98,
      defense: 0.96,
    },
    "4-2-3-1": {
      attack: 1.04,
      midfield: 1.06,
      defense: 1.0,
    },
    "5-3-2": {
      attack: 0.94,
      midfield: 0.98,
      defense: 1.11,
    },
  } as const;

  return formationModifiers[tactic.formation];
}

function getMentalityModifiers(tactic: Tactic) {
  const mentalityModifiers = {
    defensive: {
      attack: 0.92,
      midfield: 1.0,
      defense: 1.1,
    },
    balanced: {
      attack: 1.0,
      midfield: 1.0,
      defense: 1.0,
    },
    attacking: {
      attack: 1.1,
      midfield: 1.02,
      defense: 0.93,
    },
  } as const;

  return mentalityModifiers[tactic.mentality];
}

function getPressingModifiers(tactic: Tactic) {
  const pressingModifiers = {
    low: {
      attack: 0.97,
      midfield: 0.98,
      defense: 1.04,
    },
    medium: {
      attack: 1.0,
      midfield: 1.0,
      defense: 1.0,
    },
    high: {
      attack: 1.04,
      midfield: 1.03,
      defense: 0.97,
    },
  } as const;

  return pressingModifiers[tactic.pressing];
}

export function calculateTeamStrength(team: Team, tactic: Tactic): TeamStrength {
  const normalizedTeam = {
    ...team,
    players: team.players.map(normalizePlayerStatus),
  };
  const goalkeepers = getPlayersByPosition(normalizedTeam.players, "GK");
  const defenders = getPlayersByPosition(normalizedTeam.players, "DEF");
  const midfielders = getPlayersByPosition(normalizedTeam.players, "MID");
  const attackers = getPlayersByPosition(normalizedTeam.players, "ATT");

  const goalkeeperStrength = calculateGoalkeeper(goalkeepers[0]);

  const defenseStrength = average(defenders.map(calculatePlayerDefense));
  const midfieldStrength = average(midfielders.map(calculatePlayerMidfield));
  const attackStrength = average(attackers.map(calculatePlayerAttack));

  const formation = getFormationModifiers(tactic);
  const mentality = getMentalityModifiers(tactic);
  const pressing = getPressingModifiers(tactic);

  const teamMoraleModifier = 0.9 + normalizedTeam.morale / 500;
  const reputationModifier = 0.95 + normalizedTeam.reputation / 1000;

  const attack =
    (attackStrength * 0.7 + midfieldStrength * 0.25 + defenseStrength * 0.05) *
    formation.attack *
    mentality.attack *
    pressing.attack *
    teamMoraleModifier *
    reputationModifier;

  const midfield =
    (midfieldStrength * 0.75 + attackStrength * 0.15 + defenseStrength * 0.1) *
    formation.midfield *
    mentality.midfield *
    pressing.midfield *
    teamMoraleModifier *
    reputationModifier;

  const defense =
    (defenseStrength * 0.7 + midfieldStrength * 0.2 + goalkeeperStrength * 0.1) *
    formation.defense *
    mentality.defense *
    pressing.defense *
    teamMoraleModifier *
    reputationModifier;

  const overall = average([attack, midfield, defense, goalkeeperStrength]);

  return {
    attack,
    midfield,
    defense,
    goalkeeper: goalkeeperStrength,
    overall,
  };
}

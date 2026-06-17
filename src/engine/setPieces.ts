import type { Formation, Player, SetPieceAssignments, SetPieceRole, Team } from "./types";
import { getSelectedLineupPlayerIds } from "./lineupSelection";
import { isPlayerInjured, normalizePlayerStatus } from "./playerStatus";
import { clamp } from "./random";

export interface SetPieceAssignmentView {
  role: SetPieceRole;
  label: string;
  playerId?: string;
  playerName: string;
  position?: Player["position"];
  score: number;
  isStarter: boolean;
  warning?: string;
}

export interface SetPieceValidationIssue {
  severity: "ok" | "warning" | "danger";
  message: string;
}

export interface SetPieceReport {
  assignments: SetPieceAssignmentView[];
  issues: SetPieceValidationIssue[];
  isValid: boolean;
  specialistScore: number;
  deadBallThreat: number;
  summary: string;
}

const SET_PIECE_ROLES: Array<{ role: SetPieceRole; label: string }> = [
  { role: "captain", label: "Captain" },
  { role: "penalty", label: "Penalty taker" },
  { role: "freeKick", label: "Free kicks" },
  { role: "leftCorner", label: "Left corners" },
  { role: "rightCorner", label: "Right corners" },
];

const DEFAULT_ASSIGNMENTS: SetPieceAssignments = {
  captainId: undefined,
  penaltyTakerId: undefined,
  freeKickTakerId: undefined,
  leftCornerTakerId: undefined,
  rightCornerTakerId: undefined,
};

function getRoleAssignmentKey(role: SetPieceRole): keyof SetPieceAssignments {
  if (role === "captain") return "captainId";
  if (role === "penalty") return "penaltyTakerId";
  if (role === "freeKick") return "freeKickTakerId";
  if (role === "leftCorner") return "leftCornerTakerId";
  return "rightCornerTakerId";
}

function getRoleLabel(role: SetPieceRole): string {
  return SET_PIECE_ROLES.find((item) => item.role === role)?.label ?? role;
}

function getPersonalityCaptainBonus(player: Player): number {
  if (player.personality === "leader") return 18;
  if (player.personality === "professional") return 12;
  if (player.personality === "team_player") return 10;
  if (player.personality === "loyal") return 8;
  if (player.personality === "temperamental") return -8;
  return 4;
}

function getFootCornerBonus(player: Player, role: SetPieceRole): number {
  if (role !== "leftCorner" && role !== "rightCorner") return 0;
  if (player.preferredFoot === "both") return 5;
  if (role === "leftCorner" && player.preferredFoot === "right") return 4;
  if (role === "rightCorner" && player.preferredFoot === "left") return 4;
  return 0;
}

function getRolePositionBonus(player: Player, role: SetPieceRole): number {
  if (role === "captain") return player.position === "GK" || player.position === "DEF" || player.position === "MID" ? 4 : 0;
  if (role === "penalty") return player.position === "ATT" ? 12 : player.position === "MID" ? 6 : -4;
  if (role === "freeKick") return player.position === "MID" || player.position === "ATT" ? 8 : -2;
  if (role === "leftCorner" || role === "rightCorner") return player.position === "MID" ? 8 : player.position === "ATT" ? 5 : -3;
  return 0;
}

export function getSetPieceRoles(): Array<{ role: SetPieceRole; label: string }> {
  return SET_PIECE_ROLES;
}

export function scorePlayerForSetPieceRole(player: Player, role: SetPieceRole): number {
  const normalized = normalizePlayerStatus(player);
  const fitness = normalized.fitness ?? 100;
  const injuryPenalty = isPlayerInjured(normalized) ? 22 : 0;

  const base = (() => {
    if (role === "captain") {
      const ageBonus = clamp((normalized.age - 22) * 1.2, 0, 12);
      return (
        normalized.overall * 0.75 +
        normalized.morale * 0.48 +
        normalized.form * 0.22 +
        ageBonus +
        getPersonalityCaptainBonus(normalized)
      );
    }

    if (role === "penalty") {
      return normalized.shooting * 0.92 + normalized.morale * 0.28 + normalized.form * 0.22 + normalized.overall * 0.12;
    }

    if (role === "freeKick") {
      return normalized.shooting * 0.58 + normalized.passing * 0.42 + normalized.form * 0.2 + normalized.overall * 0.12;
    }

    return normalized.passing * 0.82 + normalized.stamina * 0.12 + normalized.form * 0.16 + normalized.overall * 0.1;
  })();

  return Math.round(
    clamp(
      base + getRolePositionBonus(normalized, role) + getFootCornerBonus(normalized, role) + fitness * 0.04 - injuryPenalty,
      1,
      100,
    ),
  );
}

function sortCandidates(players: Player[], role: SetPieceRole): Player[] {
  return [...players].sort((a, b) => {
    const scoreDelta = scorePlayerForSetPieceRole(b, role) - scorePlayerForSetPieceRole(a, role);
    if (scoreDelta !== 0) return scoreDelta;
    return b.overall - a.overall;
  });
}

function getDefaultRolePlayerId(team: Team, role: SetPieceRole, formation: Formation): string | undefined {
  const selectedIds = new Set(getSelectedLineupPlayerIds(team, formation));
  const starters = team.players.filter((player) => selectedIds.has(player.id));
  const candidates = starters.length > 0 ? starters : team.players;
  return sortCandidates(candidates, role)[0]?.id;
}

export function createDefaultSetPieceAssignments(team: Team, formation: Formation): SetPieceAssignments {
  return {
    captainId: getDefaultRolePlayerId(team, "captain", formation),
    penaltyTakerId: getDefaultRolePlayerId(team, "penalty", formation),
    freeKickTakerId: getDefaultRolePlayerId(team, "freeKick", formation),
    leftCornerTakerId: getDefaultRolePlayerId(team, "leftCorner", formation),
    rightCornerTakerId: getDefaultRolePlayerId(team, "rightCorner", formation),
  };
}

export function normalizeSetPieceAssignments(team: Team, formation: Formation): SetPieceAssignments {
  const validIds = new Set(team.players.map((player) => player.id));
  const defaults = createDefaultSetPieceAssignments(team, formation);
  const source = team.setPieceAssignments ?? DEFAULT_ASSIGNMENTS;

  const normalizeId = (value: string | undefined, fallback: string | undefined) =>
    value && validIds.has(value) ? value : fallback;

  return {
    captainId: normalizeId(source.captainId, defaults.captainId),
    penaltyTakerId: normalizeId(source.penaltyTakerId, defaults.penaltyTakerId),
    freeKickTakerId: normalizeId(source.freeKickTakerId, defaults.freeKickTakerId),
    leftCornerTakerId: normalizeId(source.leftCornerTakerId, defaults.leftCornerTakerId),
    rightCornerTakerId: normalizeId(source.rightCornerTakerId, defaults.rightCornerTakerId),
  };
}

export function applySetPieceAssignmentsToTeam(team: Team, assignments: SetPieceAssignments, formation: Formation): Team {
  return {
    ...team,
    setPieceAssignments: normalizeSetPieceAssignments({ ...team, setPieceAssignments: assignments }, formation),
  };
}

export function autoPickSetPieces(team: Team, formation: Formation): Team {
  return applySetPieceAssignmentsToTeam(team, createDefaultSetPieceAssignments(team, formation), formation);
}

export function setSetPieceAssignment(team: Team, role: SetPieceRole, playerId: string, formation: Formation): Team {
  const playerExists = team.players.some((player) => player.id === playerId);
  const normalized = normalizeSetPieceAssignments(team, formation);

  return applySetPieceAssignmentsToTeam(
    team,
    {
      ...normalized,
      [getRoleAssignmentKey(role)]: playerExists ? playerId : undefined,
    },
    formation,
  );
}

export function getSetPieceTaker(
  team: Team,
  role: SetPieceRole,
  formation: Formation,
  activePlayerIds?: string[],
): Player | undefined {
  const activeSet = new Set(activePlayerIds ?? getSelectedLineupPlayerIds(team, formation));
  const assignments = normalizeSetPieceAssignments(team, formation);
  const assignedId = assignments[getRoleAssignmentKey(role)];
  const assignedPlayer = team.players.find((player) => player.id === assignedId && activeSet.has(player.id));
  if (assignedPlayer) return assignedPlayer;

  const activePlayers = team.players.filter((player) => activeSet.has(player.id));
  return sortCandidates(activePlayers.length > 0 ? activePlayers : team.players, role)[0];
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildSetPieceReport(team: Team, formation: Formation): SetPieceReport {
  const selectedIds = new Set(getSelectedLineupPlayerIds(team, formation));
  const assignments = normalizeSetPieceAssignments(team, formation);
  const playerById = new Map(team.players.map((player) => [player.id, player]));
  const issues: SetPieceValidationIssue[] = [];

  const assignmentViews = SET_PIECE_ROLES.map(({ role, label }) => {
    const playerId = assignments[getRoleAssignmentKey(role)];
    const player = playerId ? playerById.get(playerId) : undefined;
    const isStarter = Boolean(player && selectedIds.has(player.id));
    const score = player ? scorePlayerForSetPieceRole(player, role) : 0;
    const warning = player && !isStarter ? `${player.name} nu este in primul 11.` : undefined;

    if (!player) {
      issues.push({ severity: "danger", message: `${label} nu are jucator valid.` });
    } else if (!isStarter) {
      issues.push({ severity: "warning", message: `${label}: ${player.name} nu este titular si va fi inlocuit automat in meci.` });
    } else if (score < 55) {
      issues.push({ severity: "warning", message: `${label}: ${player.name} are scor modest pentru rol (${score}).` });
    }

    return {
      role,
      label,
      playerId,
      playerName: player?.name ?? "Nealocat",
      position: player?.position,
      score,
      isStarter,
      warning,
    } satisfies SetPieceAssignmentView;
  });

  const specialistScore = Math.round(average(assignmentViews.map((item) => item.score)));
  const deadBallThreat = Math.round(
    average(
      assignmentViews
        .filter((item) => item.role !== "captain")
        .map((item) => item.score),
    ),
  );

  if (issues.length === 0) {
    issues.push({ severity: "ok", message: "Set pieces si capitanul sunt pregatite pentru urmatorul meci." });
  }

  const isValid = !issues.some((issue) => issue.severity === "danger");

  return {
    assignments: assignmentViews,
    issues,
    isValid,
    specialistScore,
    deadBallThreat,
    summary: isValid
      ? `Set pieces pregatite. Threat faze fixe ${deadBallThreat}/100, leadership ${assignmentViews[0]?.score ?? 0}/100.`
      : "Set pieces au nevoie de atentie inainte de meci.",
  };
}

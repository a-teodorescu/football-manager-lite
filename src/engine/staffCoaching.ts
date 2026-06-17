import type { Team } from "./types";
import { createSeededRandom, randomInt } from "./random";

export type StaffRole =
  | "head_coach"
  | "assistant_manager"
  | "fitness_coach"
  | "scout"
  | "youth_coach"
  | "physio";

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  rating: number;
  specialty: string;
  wage: number;
  signedSeason: number;
}

export interface StaffRecord {
  id: string;
  seasonNumber: number;
  round: number;
  type: "hire" | "replace" | "refresh" | "review";
  staffName: string;
  role: StaffRole;
  cost: number;
  summary: string;
}

export interface StaffState {
  members: StaffMember[];
  candidates: StaffMember[];
  history: StaffRecord[];
  lastRefreshRoundKey?: string;
}

export interface StaffImpact {
  averageRating: number;
  totalWage: number;
  trainingBonus: number;
  scoutingDiscountPercent: number;
  youthBonus: number;
  recoveryBonus: number;
  tacticalBonus: number;
  moraleBonus: number;
  summary: string;
}

const FIRST_NAMES = ["Mihai", "Andrei", "Victor", "Radu", "Sorin", "Ionut", "Cristian", "Dorian", "Vlad", "Alex"];
const LAST_NAMES = ["Popa", "Ionescu", "Marin", "Dumitru", "Stan", "Munteanu", "Rusu", "Petrescu", "Dragomir", "Nica"];
const SPECIALTIES: Record<StaffRole, string[]> = {
  head_coach: ["team culture", "match preparation", "dressing room control"],
  assistant_manager: ["tactical analysis", "opposition reports", "set pieces"],
  fitness_coach: ["high intensity", "stamina plans", "load management"],
  scout: ["domestic market", "hidden gems", "data scouting"],
  youth_coach: ["technical growth", "mentoring", "academy standards"],
  physio: ["recovery plans", "injury prevention", "rehab routines"],
};

const DEFAULT_ROLES: StaffRole[] = [
  "head_coach",
  "assistant_manager",
  "fitness_coach",
  "scout",
  "youth_coach",
  "physio",
];

export function getStaffRoleLabel(role: StaffRole): string {
  const labels: Record<StaffRole, string> = {
    head_coach: "Head Coach",
    assistant_manager: "Assistant Manager",
    fitness_coach: "Fitness Coach",
    scout: "Scout",
    youth_coach: "Youth Coach",
    physio: "Physio / Doctor",
  };
  return labels[role];
}

function createStaffMember(seed: string, role: StaffRole, seasonNumber: number, boost = 0): StaffMember {
  const random = createSeededRandom(seed);
  const firstName = FIRST_NAMES[randomInt(random, 0, FIRST_NAMES.length - 1)];
  const lastName = LAST_NAMES[randomInt(random, 0, LAST_NAMES.length - 1)];
  const rating = Math.min(95, Math.max(45, randomInt(random, 54 + boost, 78 + boost)));
  const wage = Math.round((120 + rating * 5 + randomInt(random, 0, 90)) / 10) * 10;
  const specialtyList = SPECIALTIES[role];

  return {
    id: `${role}-${seasonNumber}-${Math.round(random() * 100000)}`,
    name: `${firstName} ${lastName}`,
    role,
    rating,
    specialty: specialtyList[randomInt(random, 0, specialtyList.length - 1)],
    wage,
    signedSeason: seasonNumber,
  };
}

export function createInitialStaffState(seasonNumber: number, team?: Team): StaffState {
  const reputationBoost = team ? Math.round(team.reputation / 20) : 0;
  const members = DEFAULT_ROLES.map((role, index) =>
    createStaffMember(`initial:${seasonNumber}:${role}:${index}`, role, seasonNumber, reputationBoost),
  );

  return {
    members,
    candidates: createStaffCandidates(seasonNumber, 1, team, 0),
    history: [
      {
        id: `staff-start-s${seasonNumber}`,
        seasonNumber,
        round: 1,
        type: "review",
        staffName: "Club staff",
        role: "head_coach",
        cost: 0,
        summary: `Staff setup initial: ${members.length} roluri acoperite.`,
      },
    ],
    lastRefreshRoundKey: `s${seasonNumber}:r1`,
  };
}

export function createStaffCandidates(seasonNumber: number, round: number, team?: Team, extraBoost = 0): StaffMember[] {
  const reputationBoost = team ? Math.round(team.reputation / 18) : 0;
  return DEFAULT_ROLES.map((role, index) =>
    createStaffMember(
      `candidate:${seasonNumber}:${round}:${role}:${index}`,
      role,
      seasonNumber,
      reputationBoost + extraBoost + 4,
    ),
  ).sort((a, b) => b.rating - a.rating);
}

export function refreshStaffCandidates(input: {
  state: StaffState;
  seasonNumber: number;
  round: number;
  team?: Team;
  extraBoost?: number;
}): { state: StaffState; record: StaffRecord } {
  const candidates = createStaffCandidates(input.seasonNumber, input.round, input.team, input.extraBoost ?? 0);
  const record: StaffRecord = {
    id: `staff-refresh-s${input.seasonNumber}-r${input.round}`,
    seasonNumber: input.seasonNumber,
    round: input.round,
    type: "refresh",
    staffName: "Candidate pool",
    role: "scout",
    cost: 0,
    summary: `Staff shortlist actualizat: ${candidates.length} candidati disponibili.`,
  };

  return {
    state: {
      ...input.state,
      candidates,
      lastRefreshRoundKey: `s${input.seasonNumber}:r${input.round}`,
      history: [record, ...input.state.history].slice(0, 24),
    },
    record,
  };
}

export function hireStaffMember(input: {
  state: StaffState;
  candidateId: string;
  seasonNumber: number;
  round: number;
}): { state: StaffState; record: StaffRecord; signingCost: number } {
  const candidate = input.state.candidates.find((item) => item.id === input.candidateId);
  if (!candidate) throw new Error("Candidatul nu mai este disponibil.");

  const previous = input.state.members.find((item) => item.role === candidate.role);
  const signingCost = Math.round(candidate.wage * 1.8);
  const record: StaffRecord = {
    id: `staff-hire-${candidate.id}-s${input.seasonNumber}-r${input.round}`,
    seasonNumber: input.seasonNumber,
    round: input.round,
    type: previous ? "replace" : "hire",
    staffName: candidate.name,
    role: candidate.role,
    cost: signingCost,
    summary: `${candidate.name} a fost ${previous ? "numit in locul staff-ului vechi" : "angajat"} ca ${getStaffRoleLabel(candidate.role)} (${candidate.rating} OVR).`,
  };

  return {
    signingCost,
    record,
    state: {
      ...input.state,
      members: [candidate, ...input.state.members.filter((item) => item.role !== candidate.role)].sort(
        (a, b) => DEFAULT_ROLES.indexOf(a.role) - DEFAULT_ROLES.indexOf(b.role),
      ),
      candidates: input.state.candidates.filter((item) => item.id !== candidate.id),
      history: [record, ...input.state.history].slice(0, 24),
    },
  };
}

function getRatingForRole(state: StaffState, role: StaffRole): number {
  return state.members.find((item) => item.role === role)?.rating ?? 50;
}

export function calculateStaffWageCost(state: StaffState): number {
  return state.members.reduce((sum, item) => sum + item.wage, 0);
}

export function buildStaffImpact(state: StaffState): StaffImpact {
  const averageRating = Math.round(
    state.members.reduce((sum, item) => sum + item.rating, 0) / Math.max(1, state.members.length),
  );
  const fitnessCoach = getRatingForRole(state, "fitness_coach");
  const physio = getRatingForRole(state, "physio");
  const scout = getRatingForRole(state, "scout");
  const youthCoach = getRatingForRole(state, "youth_coach");
  const assistant = getRatingForRole(state, "assistant_manager");
  const headCoach = getRatingForRole(state, "head_coach");

  return {
    averageRating,
    totalWage: calculateStaffWageCost(state),
    trainingBonus: Math.max(0, Math.round((fitnessCoach - 55) / 8)),
    scoutingDiscountPercent: Math.max(0, Math.min(30, Math.round((scout - 55) / 2))),
    youthBonus: Math.max(0, Math.round((youthCoach - 55) / 8)),
    recoveryBonus: Math.max(0, Math.round((physio - 55) / 10)),
    tacticalBonus: Math.max(0, Math.round((assistant - 55) / 10)),
    moraleBonus: Math.max(0, Math.round((headCoach - 55) / 12)),
    summary: `Staff avg ${averageRating}. Training +${Math.max(0, Math.round((fitnessCoach - 55) / 8))}, scouting discount ${Math.max(0, Math.min(30, Math.round((scout - 55) / 2)))}%, youth +${Math.max(0, Math.round((youthCoach - 55) / 8))}.`,
  };
}

export function getAdjustedScoutingCost(baseCost: number, impact: StaffImpact): number {
  return Math.max(20, Math.round(baseCost * (1 - impact.scoutingDiscountPercent / 100)));
}

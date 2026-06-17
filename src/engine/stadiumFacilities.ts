import { clamp } from "./random";
import type { FixtureResult } from "./leagueSimulation";
import type { StandingRow } from "./standings";
import type { Team } from "./types";
import type { YouthAcademyState } from "./youthAcademy";

export type FacilityUpgradeType =
  | "capacity"
  | "fan_experience"
  | "training_ground"
  | "medical_center"
  | "academy_campus"
  | "commercial_zone";

export interface StadiumFacilitiesState {
  seasonNumber: number;
  stadiumName: string;
  capacity: number;
  ticketPrice: number;
  fanExperienceLevel: number;
  trainingGroundLevel: number;
  medicalCenterLevel: number;
  academyCampusLevel: number;
  commercialZoneLevel: number;
  lastUpgradeRoundKey?: string;
}

export interface FacilityUpgradeOption {
  type: FacilityUpgradeType;
  label: string;
  currentLevelLabel: string;
  nextLevelLabel: string;
  cost: number;
  maxed: boolean;
  effect: string;
}

export type FacilityRecordType = "upgrade" | "round_income" | "season_reset";

export interface FacilityRecord {
  id: string;
  type: FacilityRecordType;
  seasonNumber: number;
  round: number;
  upgradeType?: FacilityUpgradeType;
  amount: number;
  summary: string;
  createdAt: string;
}

export interface FacilityRoundImpact {
  attendance: number;
  matchdayBoost: number;
  commercialIncome: number;
  maintenanceCost: number;
  netImpact: number;
  record: FacilityRecord;
}

export interface FacilitiesOverview {
  stadiumTier: "local" | "regional" | "national" | "elite";
  projectedAttendance: number;
  projectedHomeIncomeBoost: number;
  projectedCommercialIncome: number;
  maintenanceCost: number;
  trainingBonus: number;
  academyCostDiscountPercent: number;
  injuryRiskReduction: number;
  fanSatisfaction: number;
  summary: string;
}

const FACILITY_LABELS: Record<FacilityUpgradeType, string> = {
  capacity: "Stadium capacity",
  fan_experience: "Fan experience",
  training_ground: "Training ground",
  medical_center: "Medical center",
  academy_campus: "Academy campus",
  commercial_zone: "Commercial zone",
};

function nowIso(): string {
  return new Date().toISOString();
}

function roundMoney(value: number): number {
  return Math.max(25, Math.round(value / 25) * 25);
}

function getRoundKey(seasonNumber: number, round: number): string {
  return `s${seasonNumber}:r${round}`;
}

function getUserPosition(standings: StandingRow[], userTeamId: string): number {
  return Math.max(1, standings.findIndex((row) => row.teamId === userTeamId) + 1 || standings.length);
}

function getUserFixture(roundResults: FixtureResult[], userTeamId: string): FixtureResult | undefined {
  return roundResults.find((item) => item.result.homeTeamId === userTeamId || item.result.awayTeamId === userTeamId);
}

function isHomeMatch(result: FixtureResult | undefined, userTeamId: string): boolean {
  return Boolean(result && result.result.homeTeamId === userTeamId);
}

export function getFacilityLabel(type: FacilityUpgradeType): string {
  return FACILITY_LABELS[type];
}

export function createInitialFacilities(team: Team, seasonNumber: number): StadiumFacilitiesState {
  const baseCapacity = 7200 + (team.fanbase ?? 42) * 75 + team.reputation * 35;
  return {
    seasonNumber,
    stadiumName: team.stadium ?? `${team.name} Arena`,
    capacity: Math.round(baseCapacity / 500) * 500,
    ticketPrice: 18,
    fanExperienceLevel: 1,
    trainingGroundLevel: 1,
    medicalCenterLevel: 1,
    academyCampusLevel: 1,
    commercialZoneLevel: 1,
  };
}

export function prepareFacilitiesForNewSeason(
  facilities: StadiumFacilitiesState,
  nextSeasonNumber: number,
): { facilities: StadiumFacilitiesState; record: FacilityRecord } {
  return {
    facilities: {
      ...facilities,
      seasonNumber: nextSeasonNumber,
      lastUpgradeRoundKey: undefined,
    },
    record: {
      id: `facility-season-reset-s${nextSeasonNumber}`,
      type: "season_reset",
      seasonNumber: nextSeasonNumber,
      round: 1,
      amount: 0,
      summary: `Facilities carried into season ${nextSeasonNumber}: ${facilities.stadiumName}, ${facilities.capacity.toLocaleString("en-US")} seats.`,
      createdAt: nowIso(),
    },
  };
}

export function getFacilityTrainingBonus(facilities: StadiumFacilitiesState): number {
  return Math.max(0, facilities.trainingGroundLevel - 1) * 5;
}

export function getFacilityInjuryRiskReduction(facilities: StadiumFacilitiesState): number {
  return Math.max(0, facilities.medicalCenterLevel - 1) * 4;
}

export function getAcademyCostDiscountPercent(facilities: StadiumFacilitiesState): number {
  return Math.max(0, facilities.academyCampusLevel - 1) * 6;
}

export function getEffectiveAcademyRoundCost(
  academy: YouthAcademyState,
  baseCost: number,
  facilities: StadiumFacilitiesState,
): number {
  const discount = getAcademyCostDiscountPercent(facilities);
  const levelSynergy = Math.max(0, facilities.academyCampusLevel - academy.level) * 12;
  return roundMoney(baseCost * (1 - discount / 100) - levelSynergy);
}

export function getFacilityMaintenanceCost(facilities: StadiumFacilitiesState): number {
  const levelCost =
    facilities.fanExperienceLevel * 22 +
    facilities.trainingGroundLevel * 28 +
    facilities.medicalCenterLevel * 24 +
    facilities.academyCampusLevel * 26 +
    facilities.commercialZoneLevel * 18;
  const capacityCost = facilities.capacity / 550;
  return roundMoney(levelCost + capacityCost);
}

function getProjectedAttendance(input: {
  facilities: StadiumFacilitiesState;
  team: Team;
  userPosition: number;
  opponentReputation?: number;
}): number {
  const reputationDemand = input.team.reputation * 92;
  const moraleDemand = input.team.morale * 42;
  const fanExperienceDemand = input.facilities.fanExperienceLevel * 820;
  const positionDemand = Math.max(0, 9 - input.userPosition) * 520;
  const opponentDemand = (input.opponentReputation ?? 58) * 38;
  const raw = reputationDemand + moraleDemand + fanExperienceDemand + positionDemand + opponentDemand;
  return Math.round(clamp(raw, 2400, input.facilities.capacity) / 100) * 100;
}

export function getFacilitiesOverview(input: {
  facilities: StadiumFacilitiesState;
  team: Team;
  standings: StandingRow[];
}): FacilitiesOverview {
  const userPosition = getUserPosition(input.standings, input.team.id);
  const projectedAttendance = getProjectedAttendance({
    facilities: input.facilities,
    team: input.team,
    userPosition,
  });
  const projectedHomeIncomeBoost = roundMoney(
    projectedAttendance * input.facilities.ticketPrice * (0.012 + input.facilities.fanExperienceLevel * 0.0016),
  );
  const projectedCommercialIncome = roundMoney(85 + input.facilities.commercialZoneLevel * 115 + input.team.reputation * 4);
  const maintenanceCost = getFacilityMaintenanceCost(input.facilities);
  const fanSatisfaction = clamp(
    Math.round(45 + input.facilities.fanExperienceLevel * 8 + input.facilities.capacity / 2400 + input.team.morale * 0.12),
    1,
    100,
  );
  const stadiumTier =
    input.facilities.capacity >= 28000
      ? "elite"
      : input.facilities.capacity >= 19000
        ? "national"
        : input.facilities.capacity >= 12000
          ? "regional"
          : "local";

  return {
    stadiumTier,
    projectedAttendance,
    projectedHomeIncomeBoost,
    projectedCommercialIncome,
    maintenanceCost,
    trainingBonus: getFacilityTrainingBonus(input.facilities),
    academyCostDiscountPercent: getAcademyCostDiscountPercent(input.facilities),
    injuryRiskReduction: getFacilityInjuryRiskReduction(input.facilities),
    fanSatisfaction,
    summary: `${input.facilities.stadiumName}: ${input.facilities.capacity.toLocaleString("en-US")} seats, projected attendance ${projectedAttendance.toLocaleString("en-US")}, maintenance €${maintenanceCost.toLocaleString("en-US")}k/round.`,
  };
}

export function getFacilityUpgradeOptions(facilities: StadiumFacilitiesState): FacilityUpgradeOption[] {
  const levelCost = (type: FacilityUpgradeType, level: number): number => {
    const multipliers: Record<FacilityUpgradeType, number> = {
      capacity: 1.35,
      fan_experience: 1.08,
      training_ground: 1.12,
      medical_center: 1.04,
      academy_campus: 1.1,
      commercial_zone: 0.94,
    };
    return roundMoney((1050 + level * 1125 + facilities.capacity / 42) * multipliers[type]);
  };

  const levelOption = (
    type: FacilityUpgradeType,
    currentLevel: number,
    effect: string,
  ): FacilityUpgradeOption => {
    const maxed = currentLevel >= 5;
    return {
      type,
      label: FACILITY_LABELS[type],
      currentLevelLabel: `Level ${currentLevel}`,
      nextLevelLabel: maxed ? "Max" : `Level ${currentLevel + 1}`,
      cost: maxed ? 0 : levelCost(type, currentLevel),
      maxed,
      effect,
    };
  };

  return [
    {
      type: "capacity",
      label: FACILITY_LABELS.capacity,
      currentLevelLabel: `${facilities.capacity.toLocaleString("en-US")} seats`,
      nextLevelLabel: `${(facilities.capacity + 2500).toLocaleString("en-US")} seats`,
      cost: roundMoney(1850 + facilities.capacity / 3.2),
      maxed: facilities.capacity >= 32000,
      effect: "+2,500 seats, higher matchday upside, slightly higher maintenance.",
    },
    levelOption("fan_experience", facilities.fanExperienceLevel, "Higher attendance demand and better home income."),
    levelOption("training_ground", facilities.trainingGroundLevel, "Better training sessions and player development chance."),
    levelOption("medical_center", facilities.medicalCenterLevel, "Lower injury risk profile and better club health rating."),
    levelOption("academy_campus", facilities.academyCampusLevel, "Lower academy operating costs and better youth infrastructure."),
    levelOption("commercial_zone", facilities.commercialZoneLevel, "Higher commercial income every round."),
  ];
}

export function upgradeFacility(input: {
  facilities: StadiumFacilitiesState;
  upgradeType: FacilityUpgradeType;
  seasonNumber: number;
  round: number;
}): { facilities: StadiumFacilitiesState; record: FacilityRecord; cost: number } {
  const option = getFacilityUpgradeOptions(input.facilities).find((item) => item.type === input.upgradeType);
  if (!option) throw new Error("Upgrade-ul nu exista.");
  if (option.maxed) throw new Error(`${option.label} este deja la nivel maxim.`);

  const nextFacilities: StadiumFacilitiesState = { ...input.facilities, lastUpgradeRoundKey: getRoundKey(input.seasonNumber, input.round) };
  if (input.upgradeType === "capacity") nextFacilities.capacity += 2500;
  if (input.upgradeType === "fan_experience") nextFacilities.fanExperienceLevel += 1;
  if (input.upgradeType === "training_ground") nextFacilities.trainingGroundLevel += 1;
  if (input.upgradeType === "medical_center") nextFacilities.medicalCenterLevel += 1;
  if (input.upgradeType === "academy_campus") nextFacilities.academyCampusLevel += 1;
  if (input.upgradeType === "commercial_zone") nextFacilities.commercialZoneLevel += 1;

  return {
    facilities: nextFacilities,
    cost: option.cost,
    record: {
      id: `facility-upgrade-s${input.seasonNumber}-r${input.round}-${input.upgradeType}`,
      type: "upgrade",
      seasonNumber: input.seasonNumber,
      round: input.round,
      upgradeType: input.upgradeType,
      amount: -option.cost,
      summary: `${option.label} upgraded: ${option.currentLevelLabel} -> ${option.nextLevelLabel}. Cost €${option.cost.toLocaleString("en-US")}k.`,
      createdAt: nowIso(),
    },
  };
}

export function calculateFacilityRoundImpact(input: {
  facilities: StadiumFacilitiesState;
  userTeam: Team;
  roundResults: FixtureResult[];
  standings: StandingRow[];
  seasonNumber: number;
  round: number;
}): FacilityRoundImpact {
  const userResult = getUserFixture(input.roundResults, input.userTeam.id);
  const userPosition = getUserPosition(input.standings, input.userTeam.id);
  const home = isHomeMatch(userResult, input.userTeam.id);
  const opponentReputation = userResult
    ? userResult.fixture.homeTeam.id === input.userTeam.id
      ? userResult.fixture.awayTeam.reputation
      : userResult.fixture.homeTeam.reputation
    : undefined;
  const attendance = home
    ? getProjectedAttendance({
        facilities: input.facilities,
        team: input.userTeam,
        userPosition,
        opponentReputation,
      })
    : 0;
  const matchdayBoost = home
    ? roundMoney(attendance * input.facilities.ticketPrice * (0.012 + input.facilities.fanExperienceLevel * 0.0016))
    : 0;
  const commercialIncome = roundMoney(85 + input.facilities.commercialZoneLevel * 115 + input.userTeam.reputation * 4);
  const maintenanceCost = getFacilityMaintenanceCost(input.facilities);
  const netImpact = matchdayBoost + commercialIncome - maintenanceCost;

  return {
    attendance,
    matchdayBoost,
    commercialIncome,
    maintenanceCost,
    netImpact,
    record: {
      id: `facility-income-s${input.seasonNumber}-r${input.round}`,
      type: "round_income",
      seasonNumber: input.seasonNumber,
      round: input.round,
      amount: netImpact,
      summary: `Facilities round ${input.round}: ${home ? `${attendance.toLocaleString("en-US")} attendance, matchday boost €${matchdayBoost.toLocaleString("en-US")}k` : "away round, no stadium attendance"}, commercial €${commercialIncome.toLocaleString("en-US")}k, maintenance -€${maintenanceCost.toLocaleString("en-US")}k, net ${netImpact >= 0 ? "+" : ""}€${netImpact.toLocaleString("en-US")}k.`,
      createdAt: nowIso(),
    },
  };
}

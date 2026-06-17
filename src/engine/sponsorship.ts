import { clamp, createSeededRandom, pickRandom, randomInt } from "./random";
import type { FixtureResult } from "./leagueSimulation";
import type { StandingRow } from "./standings";
import type { Team } from "./types";

export type SponsorshipCategory = "main" | "shirt" | "stadium" | "youth" | "regional";

export interface SponsorshipDeal {
  id: string;
  sponsorName: string;
  category: SponsorshipCategory;
  seasonNumber: number;
  signedRound?: number;
  durationSeasons: number;
  expiresSeason: number;
  baseIncomePerRound: number;
  signingBonus: number;
  winBonus: number;
  objectiveBonus: number;
  minBoardConfidence: number;
  reputationBoost: number;
  active: boolean;
  summary: string;
}

export type SponsorshipRecordType = "signed" | "round_income" | "refreshed" | "expired";

export interface SponsorshipRecord {
  id: string;
  type: SponsorshipRecordType;
  seasonNumber: number;
  round: number;
  dealId?: string;
  sponsorName?: string;
  amount: number;
  summary: string;
  createdAt: string;
}

export interface SponsorshipState {
  seasonNumber: number;
  activeDeals: SponsorshipDeal[];
  availableOffers: SponsorshipDeal[];
  lastRefreshRoundKey?: string;
}

export interface SponsorshipRoundIncome {
  totalIncome: number;
  baseIncome: number;
  winBonus: number;
  objectiveBonus: number;
  records: SponsorshipRecord[];
}

export interface SponsorshipHealth {
  activeDealsCount: number;
  offersCount: number;
  projectedRoundIncome: number;
  maxPotentialWinBonus: number;
  status: "excellent" | "stable" | "light" | "empty";
  summary: string;
}

const sponsorNames = [
  "Northstar Bank",
  "Urban Arena",
  "Carpathian Mobile",
  "Blue River Energy",
  "Nova Travel",
  "Metro Foods",
  "Crown Insurance",
  "Pixel Sportswear",
  "Rapid Cloud",
  "Victory Logistics",
  "FanHub Digital",
  "Dacia Steel",
  "Eastern Telecom",
  "Bucharest Labs",
  "Summit Fitness",
];

const categoryLabels: Record<SponsorshipCategory, string> = {
  main: "Main sponsor",
  shirt: "Shirt sponsor",
  stadium: "Stadium partner",
  youth: "Youth partner",
  regional: "Regional partner",
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

function getUserResult(roundResults: FixtureResult[], userTeamId: string): FixtureResult | undefined {
  return roundResults.find(
    (item) => item.result.homeTeamId === userTeamId || item.result.awayTeamId === userTeamId,
  );
}

function didUserWin(result: FixtureResult | undefined, userTeamId: string): boolean {
  if (!result) return false;
  const home = result.result.homeTeamId === userTeamId;
  const userScore = home ? result.result.homeScore : result.result.awayScore;
  const opponentScore = home ? result.result.awayScore : result.result.homeScore;
  return userScore > opponentScore;
}

function getUserPosition(standings: StandingRow[], userTeamId: string): number {
  return Math.max(1, standings.findIndex((row) => row.teamId === userTeamId) + 1 || standings.length);
}

function createOffer(input: {
  seasonNumber: number;
  round: number;
  index: number;
  team: Team;
  boardConfidence: number;
}): SponsorshipDeal {
  const random = createSeededRandom(`sponsor:${input.seasonNumber}:${input.round}:${input.team.id}:${input.index}`);
  const categoryCycle: SponsorshipCategory[] = ["main", "shirt", "stadium", "youth", "regional"];
  const category = categoryCycle[(input.index - 1) % categoryCycle.length];
  const reputationFactor = input.team.reputation * randomInt(random, 5, 8);
  const moraleFactor = input.team.morale * randomInt(random, 2, 4);
  const boardFactor = input.boardConfidence * randomInt(random, 2, 5);
  const categoryMultiplier: Record<SponsorshipCategory, number> = {
    main: 1.35,
    shirt: 1.18,
    stadium: 1.1,
    youth: 0.82,
    regional: 0.72,
  };
  const base = roundMoney((520 + reputationFactor + moraleFactor + boardFactor) * categoryMultiplier[category] / 10);
  const signingBonus = roundMoney(base * randomInt(random, 5, 9));
  const winBonus = roundMoney(base * (category === "main" || category === "shirt" ? 0.42 : 0.24));
  const objectiveBonus = roundMoney(base * randomInt(random, 8, 15));
  const minBoardConfidence = clamp(randomInt(random, 42, 72) + (category === "main" ? 8 : 0), 35, 85);
  const durationSeasons = category === "regional" ? 1 : randomInt(random, 1, 3);
  const sponsorName = pickRandom(random, sponsorNames);

  return {
    id: `sponsor-offer-s${input.seasonNumber}-r${input.round}-${category}-${input.index}`,
    sponsorName,
    category,
    seasonNumber: input.seasonNumber,
    durationSeasons,
    expiresSeason: input.seasonNumber + durationSeasons,
    baseIncomePerRound: base,
    signingBonus,
    winBonus,
    objectiveBonus,
    minBoardConfidence,
    reputationBoost: category === "main" ? 3 : category === "shirt" ? 2 : 1,
    active: false,
    summary: `${sponsorName} ofera ${categoryLabels[category].toLowerCase()}: ${base}k/runda, bonus semnare ${signingBonus}k, bonus victorie ${winBonus}k.`,
  };
}

export function getSponsorshipCategoryLabel(category: SponsorshipCategory): string {
  return categoryLabels[category];
}

export function generateSponsorshipOffers(input: {
  seasonNumber: number;
  round: number;
  team: Team;
  boardConfidence: number;
  activeDeals?: SponsorshipDeal[];
  count?: number;
}): SponsorshipDeal[] {
  const activeCategories = new Set((input.activeDeals ?? []).filter((deal) => deal.active).map((deal) => deal.category));
  return Array.from({ length: input.count ?? 5 }, (_, index) =>
    createOffer({
      seasonNumber: input.seasonNumber,
      round: input.round,
      index: index + 1,
      team: input.team,
      boardConfidence: input.boardConfidence,
    }),
  ).filter((offer) => !activeCategories.has(offer.category));
}

export function createInitialSponsorshipState(input: {
  seasonNumber: number;
  team: Team;
  boardConfidence?: number;
}): SponsorshipState {
  return {
    seasonNumber: input.seasonNumber,
    activeDeals: [],
    availableOffers: generateSponsorshipOffers({
      seasonNumber: input.seasonNumber,
      round: 1,
      team: input.team,
      boardConfidence: input.boardConfidence ?? 60,
    }),
    lastRefreshRoundKey: getRoundKey(input.seasonNumber, 1),
  };
}

export function refreshSponsorshipOffers(input: {
  state: SponsorshipState;
  team: Team;
  seasonNumber: number;
  round: number;
  boardConfidence: number;
}): { state: SponsorshipState; record: SponsorshipRecord } {
  const roundKey = getRoundKey(input.seasonNumber, input.round);
  const offers = generateSponsorshipOffers({
    seasonNumber: input.seasonNumber,
    round: input.round,
    team: input.team,
    boardConfidence: input.boardConfidence,
    activeDeals: input.state.activeDeals,
  });

  return {
    state: {
      ...input.state,
      seasonNumber: input.seasonNumber,
      availableOffers: offers,
      lastRefreshRoundKey: roundKey,
    },
    record: {
      id: `sponsor-refresh-s${input.seasonNumber}-r${input.round}`,
      type: "refreshed",
      seasonNumber: input.seasonNumber,
      round: input.round,
      amount: 0,
      summary: `Au fost generate ${offers.length} oferte comerciale pentru runda ${input.round}.`,
      createdAt: nowIso(),
    },
  };
}

export function signSponsorshipDeal(input: {
  state: SponsorshipState;
  offerId: string;
  seasonNumber: number;
  round: number;
  boardConfidence: number;
}): { state: SponsorshipState; record: SponsorshipRecord; signingBonus: number } {
  const offer = input.state.availableOffers.find((deal) => deal.id === input.offerId);
  if (!offer) throw new Error("Oferta de sponsorizare nu mai este disponibila.");
  if (input.state.activeDeals.some((deal) => deal.active && deal.category === offer.category)) {
    throw new Error(`Ai deja un deal activ pentru categoria ${categoryLabels[offer.category]}.`);
  }
  if (input.boardConfidence < offer.minBoardConfidence) {
    throw new Error(`Board confidence prea mic. Ai nevoie de minimum ${offer.minBoardConfidence}.`);
  }

  const activeDeal: SponsorshipDeal = {
    ...offer,
    id: `sponsor-deal-s${input.seasonNumber}-r${input.round}-${offer.category}-${offer.sponsorName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    signedRound: input.round,
    active: true,
  };

  return {
    state: {
      ...input.state,
      activeDeals: [activeDeal, ...input.state.activeDeals].slice(0, 8),
      availableOffers: input.state.availableOffers.filter((deal) => deal.id !== input.offerId && deal.category !== offer.category),
    },
    signingBonus: activeDeal.signingBonus,
    record: {
      id: `sponsor-signed-s${input.seasonNumber}-r${input.round}-${activeDeal.category}`,
      type: "signed",
      seasonNumber: input.seasonNumber,
      round: input.round,
      dealId: activeDeal.id,
      sponsorName: activeDeal.sponsorName,
      amount: activeDeal.signingBonus,
      summary: `${activeDeal.sponsorName} a semnat ca ${categoryLabels[activeDeal.category].toLowerCase()}. Bonus semnare: €${activeDeal.signingBonus.toLocaleString("en-US")}k.`,
      createdAt: nowIso(),
    },
  };
}

export function calculateSponsorshipRoundIncome(input: {
  state: SponsorshipState;
  roundResults: FixtureResult[];
  standings: StandingRow[];
  userTeamId: string;
  seasonNumber: number;
  round: number;
}): SponsorshipRoundIncome {
  const userResult = getUserResult(input.roundResults, input.userTeamId);
  const won = didUserWin(userResult, input.userTeamId);
  const userPosition = getUserPosition(input.standings, input.userTeamId);
  const activeDeals = input.state.activeDeals.filter((deal) => deal.active && deal.expiresSeason >= input.seasonNumber);
  const baseIncome = activeDeals.reduce((sum, deal) => sum + deal.baseIncomePerRound, 0);
  const winBonus = won ? activeDeals.reduce((sum, deal) => sum + deal.winBonus, 0) : 0;
  const objectiveBonus = userPosition <= 2 && input.round % 4 === 0
    ? activeDeals.reduce((sum, deal) => sum + Math.round(deal.objectiveBonus / 2), 0)
    : 0;
  const totalIncome = baseIncome + winBonus + objectiveBonus;

  return {
    totalIncome,
    baseIncome,
    winBonus,
    objectiveBonus,
    records: totalIncome > 0
      ? [
          {
            id: `sponsor-income-s${input.seasonNumber}-r${input.round}`,
            type: "round_income",
            seasonNumber: input.seasonNumber,
            round: input.round,
            amount: totalIncome,
            summary: `Sponsorizari runda ${input.round}: baza €${baseIncome.toLocaleString("en-US")}k${winBonus > 0 ? `, bonus victorie €${winBonus.toLocaleString("en-US")}k` : ""}${objectiveBonus > 0 ? `, bonus obiectiv €${objectiveBonus.toLocaleString("en-US")}k` : ""}.`,
            createdAt: nowIso(),
          },
        ]
      : [],
  };
}

export function expireSponsorshipDeals(input: {
  state: SponsorshipState;
  nextSeasonNumber: number;
  round?: number;
}): { state: SponsorshipState; records: SponsorshipRecord[] } {
  const stillActive = input.state.activeDeals.filter((deal) => deal.expiresSeason >= input.nextSeasonNumber);
  const expired = input.state.activeDeals.filter((deal) => deal.expiresSeason < input.nextSeasonNumber);

  return {
    state: {
      ...input.state,
      seasonNumber: input.nextSeasonNumber,
      activeDeals: stillActive,
      availableOffers: [],
      lastRefreshRoundKey: undefined,
    },
    records: expired.map((deal) => ({
      id: `sponsor-expired-s${input.nextSeasonNumber}-${deal.id}`,
      type: "expired",
      seasonNumber: input.nextSeasonNumber,
      round: input.round ?? 1,
      dealId: deal.id,
      sponsorName: deal.sponsorName,
      amount: 0,
      summary: `Contractul cu ${deal.sponsorName} (${categoryLabels[deal.category]}) a expirat.`,
      createdAt: nowIso(),
    })),
  };
}

export function getSponsorshipHealth(state: SponsorshipState): SponsorshipHealth {
  const activeDeals = state.activeDeals.filter((deal) => deal.active);
  const projectedRoundIncome = activeDeals.reduce((sum, deal) => sum + deal.baseIncomePerRound, 0);
  const maxPotentialWinBonus = activeDeals.reduce((sum, deal) => sum + deal.winBonus, 0);
  const activeDealsCount = activeDeals.length;
  const status: SponsorshipHealth["status"] = activeDealsCount >= 4
    ? "excellent"
    : activeDealsCount >= 2
      ? "stable"
      : activeDealsCount === 1
        ? "light"
        : "empty";

  return {
    activeDealsCount,
    offersCount: state.availableOffers.length,
    projectedRoundIncome,
    maxPotentialWinBonus,
    status,
    summary: activeDealsCount === 0
      ? "Nu ai inca sponsori activi. Semneaza un deal pentru venituri recurente."
      : `Ai ${activeDealsCount} sponsori activi si venit proiectat de €${projectedRoundIncome.toLocaleString("en-US")}k/runda.`,
  };
}

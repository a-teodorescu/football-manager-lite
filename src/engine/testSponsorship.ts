import { createMockLeagueTeams, defaultUserTactic, simulateRound, USER_TEAM_ID } from "./leagueSimulation";
import { generateFixtures } from "./fixtureGenerator";
import { createInitialStandings } from "./standings";
import { createInitialSponsorshipState, signSponsorshipDeal, calculateSponsorshipRoundIncome, refreshSponsorshipOffers, getSponsorshipHealth } from "./sponsorship";

const teams = createMockLeagueTeams();
const userTeam = teams.find((team) => team.id === USER_TEAM_ID);
if (!userTeam) throw new Error("User team missing.");

const initialState = createInitialSponsorshipState({
  seasonNumber: 1,
  team: userTeam,
  boardConfidence: 80,
});

if (initialState.availableOffers.length === 0) {
  throw new Error("Expected sponsorship offers.");
}

const signed = signSponsorshipDeal({
  state: initialState,
  offerId: initialState.availableOffers[0].id,
  seasonNumber: 1,
  round: 1,
  boardConfidence: 80,
});

if (signed.signingBonus <= 0 || signed.state.activeDeals.length !== 1) {
  throw new Error("Expected a signed sponsorship deal with signing bonus.");
}

const fixtures = generateFixtures(teams);
const standings = createInitialStandings(teams);
const round = simulateRound(fixtures, standings, 1, 1, defaultUserTactic, teams);
const income = calculateSponsorshipRoundIncome({
  state: signed.state,
  roundResults: round.roundResults,
  standings: round.updatedStandings,
  userTeamId: USER_TEAM_ID,
  seasonNumber: 1,
  round: 1,
});

if (income.totalIncome <= 0 || income.records.length === 0) {
  throw new Error("Expected sponsorship round income.");
}

const refreshed = refreshSponsorshipOffers({
  state: signed.state,
  team: userTeam,
  seasonNumber: 1,
  round: 2,
  boardConfidence: 80,
});

if (refreshed.state.availableOffers.some((offer) => offer.category === signed.state.activeDeals[0].category)) {
  throw new Error("Expected active sponsor category to be excluded from offers.");
}

const health = getSponsorshipHealth(signed.state);
if (health.projectedRoundIncome <= 0 || health.activeDealsCount !== 1) {
  throw new Error("Expected sponsorship health to include active deal income.");
}

console.log("Sponsorship engine OK", {
  signingBonus: signed.signingBonus,
  roundIncome: income.totalIncome,
  offersAfterRefresh: refreshed.state.availableOffers.length,
});

import { createMockLeagueTeams, USER_TEAM_ID } from "./leagueSimulation";
import { generateFixtures } from "./fixtureGenerator";
import { createInitialStandings } from "./standings";
import {
  calculateFacilityRoundImpact,
  createInitialFacilities,
  getFacilitiesOverview,
  getFacilityUpgradeOptions,
  upgradeFacility,
} from "./stadiumFacilities";

const teams = createMockLeagueTeams();
const userTeam = teams.find((team) => team.id === USER_TEAM_ID);
if (!userTeam) throw new Error("User team missing.");

const facilities = createInitialFacilities(userTeam, 1);
const options = getFacilityUpgradeOptions(facilities);
if (options.length < 6) throw new Error("Expected all facility upgrade options.");

const trainingUpgrade = upgradeFacility({
  facilities,
  upgradeType: "training_ground",
  seasonNumber: 1,
  round: 1,
});
if (trainingUpgrade.facilities.trainingGroundLevel !== facilities.trainingGroundLevel + 1) {
  throw new Error("Training ground upgrade did not increase level.");
}
if (trainingUpgrade.cost <= 0) throw new Error("Upgrade cost should be positive.");

const fixtures = generateFixtures(teams);
const homeFixture = fixtures.find((fixture) => fixture.round === 1 && fixture.homeTeam.id === USER_TEAM_ID);
if (!homeFixture) throw new Error("Expected one home fixture for user in round 1.");

const fakeResult = {
  fixture: homeFixture,
  result: {
    homeTeamId: homeFixture.homeTeam.id,
    awayTeamId: homeFixture.awayTeam.id,
    homeTeamName: homeFixture.homeTeam.name,
    awayTeamName: homeFixture.awayTeam.name,
    homeScore: 2,
    awayScore: 1,
    stats: {
      homePossession: 52,
      awayPossession: 48,
      homeShots: 10,
      awayShots: 8,
      homeShotsOnTarget: 5,
      awayShotsOnTarget: 3,
      homeFouls: 8,
      awayFouls: 9,
      homeYellowCards: 1,
      awayYellowCards: 2,
      homeRedCards: 0,
      awayRedCards: 0,
      homeXg: 1.6,
      awayXg: 1.1,
    },
    events: [],
    seed: "test",
  },
};

const impact = calculateFacilityRoundImpact({
  facilities,
  userTeam,
  roundResults: [fakeResult],
  standings: createInitialStandings(teams),
  seasonNumber: 1,
  round: 1,
});
if (impact.attendance <= 0 || impact.matchdayBoost <= 0) {
  throw new Error("Home facility impact should include attendance and matchday boost.");
}

const overview = getFacilitiesOverview({
  facilities: trainingUpgrade.facilities,
  team: userTeam,
  standings: createInitialStandings(teams),
});
if (overview.trainingBonus <= 0) throw new Error("Training upgrade should improve training bonus.");

console.log("Stadium & Facilities test passed", {
  options: options.length,
  upgraded: trainingUpgrade.record.summary,
  netImpact: impact.netImpact,
  tier: overview.stadiumTier,
});

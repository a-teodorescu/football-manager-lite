import { createMockLeagueTeams, USER_TEAM_ID } from "./leagueSimulation";
import {
  createInitialYouthAcademy,
  getAcademyRoundCost,
  promoteYouthProspect,
  scoutYouthProspects,
  upgradeYouthAcademy,
} from "./youthAcademy";

const team = createMockLeagueTeams().find((item) => item.id === USER_TEAM_ID);
if (!team) throw new Error("User team not found.");

const academy = createInitialYouthAcademy(1);
const scouting = scoutYouthProspects(academy, 1, 1);
const firstProspect = scouting.academy.prospects[0];
const promotion = promoteYouthProspect(team, scouting.academy, firstProspect.id, 1, 1);
const upgrade = upgradeYouthAcademy(promotion.academy, 1, 1);

console.log("Youth academy test OK", {
  initialProspects: academy.prospects.length,
  scoutedProspects: scouting.academy.prospects.length,
  promotedPlayer: promotion.record.playerName,
  squadSizeAfterPromotion: promotion.team.players.length,
  nextLevel: upgrade.academy.level,
  upkeep: getAcademyRoundCost(upgrade.academy),
});

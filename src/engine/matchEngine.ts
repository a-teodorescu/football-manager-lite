import {
  MatchEvent,
  MatchResult,
  MatchStats,
  Player,
  SimulateMatchInput,
  Team,
  TeamStrength,
} from "./types";
import { calculateAdvancedTeamStrength as calculateTeamStrength } from "./advancedTactics";
import { clamp, createSeededRandom, pickRandom } from "./random";
import { getActiveLineupPlayers, getSelectedLineupPlayerIds } from "./lineupSelection";
import {
  applySubstitutionToActiveIds,
  getSubstitutionPlayerNames,
  normalizeSubstitutionPlan,
} from "./substitutions";
import { getSetPieceTaker, scorePlayerForSetPieceRole } from "./setPieces";

function getAvailablePlayersForShot(team: Team): Player[] {
  const activePlayers = getActiveLineupPlayers(team);
  const preferred = activePlayers.filter(
    (player) => player.position === "ATT" || player.position === "MID"
  );

  return preferred.length > 0 ? preferred : activePlayers;
}

function getAvailablePlayersForCard(team: Team): Player[] {
  const activePlayers = getActiveLineupPlayers(team);
  const preferred = activePlayers.filter(
    (player) => player.position === "DEF" || player.position === "MID"
  );

  return preferred.length > 0 ? preferred : activePlayers;
}

function calculateStaminaModifier(minute: number): number {
  if (minute <= 60) return 1;

  const fatigue = (minute - 60) * 0.006;
  return clamp(1 - fatigue, 0.78, 1);
}

function calculateHomePossession(home: TeamStrength, away: TeamStrength): number {
  const midfieldDifference = home.midfield - away.midfield;
  return clamp(Math.round(50 + midfieldDifference * 0.35), 35, 65);
}

function createInitialStats(homePossession: number): MatchStats {
  return {
    homePossession,
    awayPossession: 100 - homePossession,

    homeShots: 0,
    awayShots: 0,

    homeShotsOnTarget: 0,
    awayShotsOnTarget: 0,

    homeFouls: 0,
    awayFouls: 0,

    homeYellowCards: 0,
    awayYellowCards: 0,

    homeRedCards: 0,
    awayRedCards: 0,

    homeXg: 0,
    awayXg: 0,
  };
}

function addShot(stats: MatchStats, side: "home" | "away") {
  if (side === "home") {
    stats.homeShots += 1;
  } else {
    stats.awayShots += 1;
  }
}

function addShotOnTarget(stats: MatchStats, side: "home" | "away") {
  if (side === "home") {
    stats.homeShotsOnTarget += 1;
  } else {
    stats.awayShotsOnTarget += 1;
  }
}

function addXg(stats: MatchStats, side: "home" | "away", value: number) {
  if (side === "home") {
    stats.homeXg = Number((stats.homeXg + value).toFixed(2));
  } else {
    stats.awayXg = Number((stats.awayXg + value).toFixed(2));
  }
}

function addFoul(stats: MatchStats, side: "home" | "away") {
  if (side === "home") {
    stats.homeFouls += 1;
  } else {
    stats.awayFouls += 1;
  }
}

function addYellowCard(stats: MatchStats, side: "home" | "away") {
  if (side === "home") {
    stats.homeYellowCards += 1;
  } else {
    stats.awayYellowCards += 1;
  }
}

function createShotText(teamName: string, playerName: string): string {
  return `${teamName} construieste o faza buna. ${playerName} suteaza, dar mingea trece pe langa poarta.`;
}

function createShotOnTargetText(teamName: string, playerName: string): string {
  return `${playerName} trimite un sut pe poarta pentru ${teamName}, dar portarul respinge.`;
}

function createGoalText(teamName: string, playerName: string): string {
  return `GOL ${teamName}! ${playerName} marcheaza dupa o faza bine construita.`;
}

function createYellowCardText(teamName: string, playerName: string): string {
  return `${playerName} de la ${teamName} primeste cartonas galben dupa un fault intarziat.`;
}

function createSubstitutionText(teamName: string, inName: string, outName: string): string {
  return `${teamName} face o schimbare: intra ${inName}, iese ${outName}.`;
}

function createFreeKickGoalText(teamName: string, playerName: string): string {
  return `GOL ${teamName}! ${playerName} marcheaza direct din lovitura libera.`;
}

function createFreeKickThreatText(teamName: string, playerName: string): string {
  return `${teamName} obtine o lovitura libera periculoasa. ${playerName} executa bine, dar apararea respinge.`;
}

function createCornerGoalText(teamName: string, takerName: string, finisherName: string): string {
  return `GOL ${teamName}! Corner executat de ${takerName}, iar ${finisherName} finalizeaza.`;
}

function createCornerThreatText(teamName: string, takerName: string, finisherName: string): string {
  return `${teamName} pune presiune din corner: ${takerName} centreaza, ${finisherName} trimite spre poarta.`;
}

function createTeamWithActiveLineup(team: Team, activePlayerIds: string[]): Team {
  return {
    ...team,
    lineupPlayerIds: activePlayerIds,
  };
}

function getSetPieceFinisher(team: Team, random: () => number): Player {
  const activePlayers = getActiveLineupPlayers(team);
  const preferred = activePlayers.filter(
    (player) => player.position === "ATT" || player.position === "DEF" || player.position === "MID",
  );

  return pickRandom(random, preferred.length > 0 ? preferred : activePlayers);
}

function tryFreeKickAttack(params: {
  random: () => number;
  minute: number;
  attackingSide: "home" | "away";
  attackingTeam: Team;
  defendingStrength: TeamStrength;
  tacticFormation: SimulateMatchInput["homeTactic"]["formation"];
  activePlayerIds: string[];
  stats: MatchStats;
  events: MatchEvent[];
  addGoal: () => void;
}): boolean {
  const taker = getSetPieceTaker(
    params.attackingTeam,
    "freeKick",
    params.tacticFormation,
    params.activePlayerIds,
  );
  if (!taker) return false;

  const specialistScore = scorePlayerForSetPieceRole(taker, "freeKick");
  const xgValue = clamp(0.05 + specialistScore / 900, 0.06, 0.18);
  addShot(params.stats, params.attackingSide);
  addXg(params.stats, params.attackingSide, xgValue);

  const onTargetChance = clamp(0.18 + specialistScore / 190, 0.28, 0.68);
  if (params.random() > onTargetChance) {
    params.events.push({
      minute: params.minute,
      type: "set_piece",
      team: params.attackingSide,
      playerId: taker.id,
      playerName: taker.name,
      text: createFreeKickThreatText(params.attackingTeam.name, taker.name),
    });
    return true;
  }

  addShotOnTarget(params.stats, params.attackingSide);
  const goalChance = clamp(
    specialistScore / (specialistScore + params.defendingStrength.goalkeeper * 1.9),
    0.05,
    0.24,
  );

  if (params.random() < goalChance) {
    params.addGoal();
    params.events.push({
      minute: params.minute,
      type: "goal",
      team: params.attackingSide,
      playerId: taker.id,
      playerName: taker.name,
      text: createFreeKickGoalText(params.attackingTeam.name, taker.name),
    });
  } else {
    params.events.push({
      minute: params.minute,
      type: "set_piece",
      team: params.attackingSide,
      playerId: taker.id,
      playerName: taker.name,
      text: createFreeKickThreatText(params.attackingTeam.name, taker.name),
    });
  }

  return true;
}

function tryCornerAttack(params: {
  random: () => number;
  minute: number;
  attackingSide: "home" | "away";
  attackingTeam: Team;
  defendingStrength: TeamStrength;
  tacticFormation: SimulateMatchInput["homeTactic"]["formation"];
  activePlayerIds: string[];
  stats: MatchStats;
  events: MatchEvent[];
  addGoal: () => void;
}): boolean {
  const role = params.random() < 0.5 ? "leftCorner" : "rightCorner";
  const taker = getSetPieceTaker(
    params.attackingTeam,
    role,
    params.tacticFormation,
    params.activePlayerIds,
  );
  if (!taker) return false;

  const finisher = getSetPieceFinisher(params.attackingTeam, params.random);
  const takerScore = scorePlayerForSetPieceRole(taker, role);
  const finisherScore = Math.round((finisher.shooting * 0.42 + finisher.overall * 0.38 + finisher.form * 0.2));
  const threatScore = takerScore * 0.58 + finisherScore * 0.42;
  const xgValue = clamp(0.06 + threatScore / 1050, 0.07, 0.19);

  addShot(params.stats, params.attackingSide);
  addXg(params.stats, params.attackingSide, xgValue);

  const onTargetChance = clamp(0.2 + threatScore / 220, 0.3, 0.66);
  if (params.random() > onTargetChance) {
    params.events.push({
      minute: params.minute,
      type: "set_piece",
      team: params.attackingSide,
      playerId: taker.id,
      playerName: taker.name,
      text: createCornerThreatText(params.attackingTeam.name, taker.name, finisher.name),
    });
    return true;
  }

  addShotOnTarget(params.stats, params.attackingSide);
  const goalChance = clamp(
    threatScore / (threatScore + params.defendingStrength.goalkeeper * 2 + params.defendingStrength.defense * 0.7),
    0.04,
    0.23,
  );

  if (params.random() < goalChance) {
    params.addGoal();
    params.events.push({
      minute: params.minute,
      type: "goal",
      team: params.attackingSide,
      playerId: finisher.id,
      playerName: finisher.name,
      text: createCornerGoalText(params.attackingTeam.name, taker.name, finisher.name),
    });
  } else {
    params.events.push({
      minute: params.minute,
      type: "set_piece",
      team: params.attackingSide,
      playerId: taker.id,
      playerName: taker.name,
      text: createCornerThreatText(params.attackingTeam.name, taker.name, finisher.name),
    });
  }

  return true;
}

export function simulateMatch(input: SimulateMatchInput): MatchResult {
  const random = createSeededRandom(input.seed);

  let homeActivePlayerIds = getSelectedLineupPlayerIds(input.homeTeam, input.homeTactic.formation);
  let awayActivePlayerIds = getSelectedLineupPlayerIds(input.awayTeam, input.awayTactic.formation);
  const homeSubstitutionPlan = normalizeSubstitutionPlan(input.homeTeam);
  const awaySubstitutionPlan = normalizeSubstitutionPlan(input.awayTeam);
  const appliedHomeSubstitutions = new Set<string>();
  const appliedAwaySubstitutions = new Set<string>();

  let homeScore = 0;
  let awayScore = 0;

  const events: MatchEvent[] = [
    {
      minute: 0,
      type: "kickoff",
      team: "neutral",
      text: `A inceput meciul dintre ${input.homeTeam.name} si ${input.awayTeam.name}.`,
    },
  ];

  const initialHomeTeam = createTeamWithActiveLineup(input.homeTeam, homeActivePlayerIds);
  const initialAwayTeam = createTeamWithActiveLineup(input.awayTeam, awayActivePlayerIds);
  const initialHomeStrength = calculateTeamStrength(initialHomeTeam, input.homeTactic);
  const initialAwayStrength = calculateTeamStrength(initialAwayTeam, input.awayTactic);
  const homePossession = calculateHomePossession(initialHomeStrength, initialAwayStrength);
  const stats = createInitialStats(homePossession);

  for (let minute = 1; minute <= 90; minute++) {
    for (const instruction of homeSubstitutionPlan) {
      const key = `${instruction.outPlayerId}->${instruction.inPlayerId}`;
      if (appliedHomeSubstitutions.has(key) || instruction.minute !== minute) continue;
      if (!homeActivePlayerIds.includes(instruction.outPlayerId)) continue;
      if (homeActivePlayerIds.includes(instruction.inPlayerId)) continue;

      homeActivePlayerIds = applySubstitutionToActiveIds(homeActivePlayerIds, instruction);
      appliedHomeSubstitutions.add(key);
      const names = getSubstitutionPlayerNames(input.homeTeam, instruction);
      events.push({
        minute,
        type: "substitution",
        team: "home",
        playerId: instruction.inPlayerId,
        playerName: names.inName,
        text: createSubstitutionText(input.homeTeam.name, names.inName, names.outName),
      });
    }

    for (const instruction of awaySubstitutionPlan) {
      const key = `${instruction.outPlayerId}->${instruction.inPlayerId}`;
      if (appliedAwaySubstitutions.has(key) || instruction.minute !== minute) continue;
      if (!awayActivePlayerIds.includes(instruction.outPlayerId)) continue;
      if (awayActivePlayerIds.includes(instruction.inPlayerId)) continue;

      awayActivePlayerIds = applySubstitutionToActiveIds(awayActivePlayerIds, instruction);
      appliedAwaySubstitutions.add(key);
      const names = getSubstitutionPlayerNames(input.awayTeam, instruction);
      events.push({
        minute,
        type: "substitution",
        team: "away",
        playerId: instruction.inPlayerId,
        playerName: names.inName,
        text: createSubstitutionText(input.awayTeam.name, names.inName, names.outName),
      });
    }

    const homeMatchTeam = createTeamWithActiveLineup(input.homeTeam, homeActivePlayerIds);
    const awayMatchTeam = createTeamWithActiveLineup(input.awayTeam, awayActivePlayerIds);
    const homeStrength = calculateTeamStrength(homeMatchTeam, input.homeTactic);
    const awayStrength = calculateTeamStrength(awayMatchTeam, input.awayTactic);
    const staminaModifier = calculateStaminaModifier(minute);

    const homeMinutePower =
      (homeStrength.attack * 0.45 + homeStrength.midfield * 0.4 + homeStrength.defense * 0.15) *
      staminaModifier *
      1.04;

    const awayMinutePower =
      (awayStrength.attack * 0.45 + awayStrength.midfield * 0.4 + awayStrength.defense * 0.15) *
      staminaModifier;

    const combinedPower = homeMinutePower + awayMinutePower;

    const eventChance = clamp(0.12 + combinedPower / 1200, 0.14, 0.26);

    if (random() > eventChance) {
      continue;
    }

    const homeAttackProbability = homeMinutePower / combinedPower;
    const attackingSide: "home" | "away" = random() < homeAttackProbability ? "home" : "away";

    const attackingTeam = attackingSide === "home" ? homeMatchTeam : awayMatchTeam;
    const defendingTeam = attackingSide === "home" ? awayMatchTeam : homeMatchTeam;

    const attackingStrength = attackingSide === "home" ? homeStrength : awayStrength;
    const defendingStrength = attackingSide === "home" ? awayStrength : homeStrength;

    const foulChance = 0.18;

    if (random() < foulChance) {
      const defendingSide = attackingSide === "home" ? "away" : "home";
      const cardTeam = defendingTeam;
      const cardPlayer = pickRandom(random, getAvailablePlayersForCard(cardTeam));

      addFoul(stats, defendingSide);

      const yellowChance = 0.24;

      if (random() < yellowChance) {
        addYellowCard(stats, defendingSide);

        events.push({
          minute,
          type: "yellow_card",
          team: defendingSide,
          playerId: cardPlayer.id,
          playerName: cardPlayer.name,
          text: createYellowCardText(cardTeam.name, cardPlayer.name),
        });
      }

      const activeIds = attackingSide === "home" ? homeActivePlayerIds : awayActivePlayerIds;
      const tacticFormation = attackingSide === "home" ? input.homeTactic.formation : input.awayTactic.formation;
      if (random() < 0.32) {
        tryFreeKickAttack({
          random,
          minute,
          attackingSide,
          attackingTeam,
          defendingStrength,
          tacticFormation,
          activePlayerIds: activeIds,
          stats,
          events,
          addGoal: () => {
            if (attackingSide === "home") homeScore += 1;
            else awayScore += 1;
          },
        });
      }

      continue;
    }

    const activeIds = attackingSide === "home" ? homeActivePlayerIds : awayActivePlayerIds;
    const tacticFormation = attackingSide === "home" ? input.homeTactic.formation : input.awayTactic.formation;
    if (random() < 0.1) {
      const cornerCreated = tryCornerAttack({
        random,
        minute,
        attackingSide,
        attackingTeam,
        defendingStrength,
        tacticFormation,
        activePlayerIds: activeIds,
        stats,
        events,
        addGoal: () => {
          if (attackingSide === "home") homeScore += 1;
          else awayScore += 1;
        },
      });

      if (cornerCreated) continue;
    }

    const shooter = pickRandom(random, getAvailablePlayersForShot(attackingTeam));

    const chanceQuality =
      attackingStrength.attack /
      (attackingStrength.attack + defendingStrength.defense + defendingStrength.goalkeeper * 0.35);

    const shotChance = clamp(0.45 + chanceQuality * 0.35, 0.35, 0.75);

    if (random() > shotChance) {
      continue;
    }

    addShot(stats, attackingSide);

    const xgValue = clamp(chanceQuality * 0.35, 0.04, 0.32);
    addXg(stats, attackingSide, xgValue);

    const shotOnTargetChance = clamp(
      0.25 + shooter.shooting / 300 + attackingStrength.attack / 500,
      0.25,
      0.65
    );

    if (random() > shotOnTargetChance) {
      events.push({
        minute,
        type: "shot",
        team: attackingSide,
        playerId: shooter.id,
        playerName: shooter.name,
        text: createShotText(attackingTeam.name, shooter.name),
      });

      continue;
    }

    addShotOnTarget(stats, attackingSide);

    const goalkeeperPower = defendingStrength.goalkeeper;
    const goalChance = clamp(
      shooter.shooting / (shooter.shooting + goalkeeperPower * 1.35),
      0.08,
      0.38
    );

    if (random() < goalChance) {
      if (attackingSide === "home") {
        homeScore += 1;
      } else {
        awayScore += 1;
      }

      events.push({
        minute,
        type: "goal",
        team: attackingSide,
        playerId: shooter.id,
        playerName: shooter.name,
        text: createGoalText(attackingTeam.name, shooter.name),
      });
    } else {
      events.push({
        minute,
        type: "shot_on_target",
        team: attackingSide,
        playerId: shooter.id,
        playerName: shooter.name,
        text: createShotOnTargetText(attackingTeam.name, shooter.name),
      });
    }
  }

  events.push({
    minute: 90,
    type: "full_time",
    team: "neutral",
    text: `Final de meci: ${input.homeTeam.name} ${homeScore} - ${awayScore} ${input.awayTeam.name}.`,
  });

  return {
    homeTeamId: input.homeTeam.id,
    awayTeamId: input.awayTeam.id,

    homeTeamName: input.homeTeam.name,
    awayTeamName: input.awayTeam.name,

    homeScore,
    awayScore,

    stats,
    events,

    seed: input.seed,
    substitutions: {
      home: homeSubstitutionPlan.filter((instruction) =>
        appliedHomeSubstitutions.has(`${instruction.outPlayerId}->${instruction.inPlayerId}`),
      ),
      away: awaySubstitutionPlan.filter((instruction) =>
        appliedAwaySubstitutions.has(`${instruction.outPlayerId}->${instruction.inPlayerId}`),
      ),
    },
  };
}

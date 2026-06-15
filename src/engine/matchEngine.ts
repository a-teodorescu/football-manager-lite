import {
  MatchEvent,
  MatchResult,
  MatchStats,
  Player,
  SimulateMatchInput,
  Team,
  TeamStrength,
} from "./types";
import { calculateTeamStrength } from "./teamStrength";
import { clamp, createSeededRandom, pickRandom } from "./random";

function getAvailablePlayersForShot(team: Team): Player[] {
  const preferred = team.players.filter(
    (player) => player.position === "ATT" || player.position === "MID"
  );

  return preferred.length > 0 ? preferred : team.players;
}

function getAvailablePlayersForCard(team: Team): Player[] {
  const preferred = team.players.filter(
    (player) => player.position === "DEF" || player.position === "MID"
  );

  return preferred.length > 0 ? preferred : team.players;
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

export function simulateMatch(input: SimulateMatchInput): MatchResult {
  const random = createSeededRandom(input.seed);

  const homeStrength = calculateTeamStrength(input.homeTeam, input.homeTactic);
  const awayStrength = calculateTeamStrength(input.awayTeam, input.awayTactic);

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

  const homePossession = calculateHomePossession(homeStrength, awayStrength);
  const stats = createInitialStats(homePossession);

  for (let minute = 1; minute <= 90; minute++) {
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

    const attackingTeam = attackingSide === "home" ? input.homeTeam : input.awayTeam;
    const defendingTeam = attackingSide === "home" ? input.awayTeam : input.homeTeam;

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

      continue;
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
  };
}

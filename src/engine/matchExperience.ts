import { Fixture } from "./fixtureGenerator";
import { FixtureResult, USER_TEAM_ID, getTeamTactic } from "./leagueSimulation";
import { clamp } from "./random";
import { calculateTeamStrength } from "./teamStrength";
import { MatchSide, Player, Tactic, Team, TeamStrength } from "./types";
import { getAverageFitness, getUnavailablePlayers, isPlayerInjured, normalizeTeamStatus } from "./playerStatus";

export interface MatchPreviewStrengthLine {
  attack: number;
  midfield: number;
  defense: number;
  goalkeeper: number;
  overall: number;
}

export interface MatchPreviewTeam {
  id: string;
  name: string;
  tacticLabel: string;
  strength: MatchPreviewStrengthLine;
  averageFitness: number;
  unavailableCount: number;
  morale: number;
}

export interface MatchPreview {
  fixtureId: string;
  round: number;
  home: MatchPreviewTeam;
  away: MatchPreviewTeam;
  userSide: "home" | "away" | "neutral";
  opponentName: string;
  expectedBalance: string;
  headline: string;
  recommendation: string;
  keyRisks: string[];
}

export interface PlayerMatchRating {
  playerId: string;
  playerName: string;
  teamName: string;
  side: "home" | "away";
  position: Player["position"];
  rating: number;
  note: string;
}

export interface TacticalFeedbackItem {
  title: string;
  message: string;
  severity: "positive" | "neutral" | "warning";
}

export interface MatchAnalysis {
  fixtureId: string;
  halfTimeScore: string;
  momentumLabel: string;
  conclusion: string;
  manOfTheMatch: PlayerMatchRating;
  topPerformers: PlayerMatchRating[];
  feedback: TacticalFeedbackItem[];
}

function roundStrength(strength: TeamStrength): MatchPreviewStrengthLine {
  return {
    attack: Math.round(strength.attack),
    midfield: Math.round(strength.midfield),
    defense: Math.round(strength.defense),
    goalkeeper: Math.round(strength.goalkeeper),
    overall: Math.round(strength.overall),
  };
}

function formatTactic(tactic: Tactic): string {
  return `${tactic.formation} / ${tactic.mentality} / ${tactic.pressing}`;
}

function buildPreviewTeam(team: Team, tactic: Tactic): MatchPreviewTeam {
  const normalizedTeam = normalizeTeamStatus(team);
  const strength = calculateTeamStrength(normalizedTeam, tactic);

  return {
    id: normalizedTeam.id,
    name: normalizedTeam.name,
    tacticLabel: formatTactic(tactic),
    strength: roundStrength(strength),
    averageFitness: getAverageFitness(normalizedTeam),
    unavailableCount: getUnavailablePlayers(normalizedTeam).length,
    morale: normalizedTeam.morale,
  };
}

function getExpectedBalance(home: MatchPreviewTeam, away: MatchPreviewTeam): string {
  const difference = home.strength.overall - away.strength.overall;

  if (difference >= 8) return `${home.name} porneste favorita clar.`;
  if (difference >= 3) return `${home.name} are un mic avantaj.`;
  if (difference <= -8) return `${away.name} porneste favorita clar.`;
  if (difference <= -3) return `${away.name} are un mic avantaj.`;
  return "Meci echilibrat, decis probabil de forma si detalii tactice.";
}

function buildRecommendation(userTeam: MatchPreviewTeam, opponent: MatchPreviewTeam, tactic: Tactic): string {
  if (userTeam.averageFitness < 62) {
    return "Scade pressing-ul sau joaca mai prudent: fitness-ul mediu este jos si finalul de meci poate deveni periculos.";
  }

  if (userTeam.unavailableCount >= 3) {
    return "Protejeaza lotul: ai mai multi jucatori indisponibili, deci o abordare balanced/defensive este mai sigura.";
  }

  if (opponent.strength.attack > userTeam.strength.defense + 8) {
    return "Adversarul are atac superior. Recomandare: defensive mentality sau 5-3-2 pentru a reduce riscul.";
  }

  if (userTeam.strength.midfield < opponent.strength.midfield - 6) {
    return "Adversarul poate controla centrul. Recomandare: 4-2-3-1 sau pressing medium pentru stabilitate la mijloc.";
  }

  if (userTeam.strength.attack > opponent.strength.defense + 7) {
    return "Ai avantaj ofensiv. Poti folosi attacking mentality, dar evita high pressing daca fitness-ul scade sub 70.";
  }

  if (tactic.mentality === "attacking" && userTeam.strength.defense < opponent.strength.attack) {
    return "Tactica activa e riscanta: atacul advers poate exploata spatiile. Balanced ar fi mai sigur.";
  }

  return "Pastreaza tactica actuala. Diferentele sunt mici, deci antrenamentul si fitness-ul pot face diferenta.";
}

function buildKeyRisks(userTeam: MatchPreviewTeam, opponent: MatchPreviewTeam): string[] {
  const risks: string[] = [];

  if (userTeam.averageFitness < 70) {
    risks.push(`Fitness mediu ${userTeam.averageFitness}: risc crescut in ultimele 30 de minute.`);
  }

  if (userTeam.unavailableCount > 0) {
    risks.push(`${userTeam.unavailableCount} jucatori indisponibili sau cu risc medical.`);
  }

  if (opponent.strength.midfield > userTeam.strength.midfield + 5) {
    risks.push("Adversarul are avantaj la mijloc si poate controla posesia.");
  }

  if (opponent.strength.attack > userTeam.strength.defense + 5) {
    risks.push("Atacul advers este peste apararea ta.");
  }

  if (risks.length === 0) {
    risks.push("Nu exista risc major detectat. Meciul depinde de executie si forma de moment.");
  }

  return risks;
}

export function buildMatchPreview(fixture: Fixture, userTactic: Tactic): MatchPreview {
  const homeTactic = getTeamTactic(fixture.homeTeam.id, userTactic);
  const awayTactic = getTeamTactic(fixture.awayTeam.id, userTactic);
  const home = buildPreviewTeam(fixture.homeTeam, homeTactic);
  const away = buildPreviewTeam(fixture.awayTeam, awayTactic);
  const userSide = fixture.homeTeam.id === USER_TEAM_ID ? "home" : fixture.awayTeam.id === USER_TEAM_ID ? "away" : "neutral";
  const userTeam = userSide === "away" ? away : home;
  const opponent = userSide === "away" ? home : away;
  const userTacticForRecommendation = userSide === "away" ? awayTactic : homeTactic;
  const expectedBalance = getExpectedBalance(home, away);

  return {
    fixtureId: fixture.id,
    round: fixture.round,
    home,
    away,
    userSide,
    opponentName: opponent.name,
    expectedBalance,
    headline: userSide === "neutral" ? expectedBalance : `${userTeam.name} vs ${opponent.name}: ${expectedBalance}`,
    recommendation: userSide === "neutral" ? "Urmareste echilibrul tactic si forma echipelor." : buildRecommendation(userTeam, opponent, userTacticForRecommendation),
    keyRisks: userSide === "neutral" ? ["Nu este meciul clubului tau, dar rezultatul poate conta in clasament."] : buildKeyRisks(userTeam, opponent),
  };
}

function getSideScore(result: FixtureResult, side: "home" | "away"): number {
  return side === "home" ? result.result.homeScore : result.result.awayScore;
}

function getSideShots(result: FixtureResult, side: "home" | "away"): number {
  return side === "home" ? result.result.stats.homeShots : result.result.stats.awayShots;
}

function getSideShotsOnTarget(result: FixtureResult, side: "home" | "away"): number {
  return side === "home" ? result.result.stats.homeShotsOnTarget : result.result.stats.awayShotsOnTarget;
}

function getSidePossession(result: FixtureResult, side: "home" | "away"): number {
  return side === "home" ? result.result.stats.homePossession : result.result.stats.awayPossession;
}

function getSideXg(result: FixtureResult, side: "home" | "away"): number {
  return side === "home" ? result.result.stats.homeXg : result.result.stats.awayXg;
}

function getTeamForSide(result: FixtureResult, side: "home" | "away"): Team {
  return side === "home" ? result.fixture.homeTeam : result.fixture.awayTeam;
}

function getTeamNameForSide(result: FixtureResult, side: "home" | "away"): string {
  return side === "home" ? result.result.homeTeamName : result.result.awayTeamName;
}

function getResultModifier(result: FixtureResult, side: "home" | "away"): number {
  const ownScore = getSideScore(result, side);
  const otherScore = getSideScore(result, side === "home" ? "away" : "home");

  if (ownScore > otherScore) return 0.55;
  if (ownScore === otherScore) return 0.18;
  return -0.25;
}

function getPlayerEventScore(result: FixtureResult, player: Player, side: "home" | "away"): { score: number; note: string } {
  const playerEvents = result.result.events.filter((event) => event.playerId === player.id && event.team === side);
  const goals = playerEvents.filter((event) => event.type === "goal").length;
  const shotsOnTarget = playerEvents.filter((event) => event.type === "shot_on_target").length;
  const shots = playerEvents.filter((event) => event.type === "shot").length;
  const yellows = playerEvents.filter((event) => event.type === "yellow_card").length;
  const injuries = playerEvents.filter((event) => event.type === "injury").length;

  const score = goals * 1.25 + shotsOnTarget * 0.38 + shots * 0.14 - yellows * 0.45 - injuries * 0.2;

  if (goals > 0) return { score, note: goals === 1 ? "gol decisiv" : `${goals} goluri` };
  if (shotsOnTarget > 0) return { score, note: "periculos pe poarta" };
  if (shots > 0) return { score, note: "activ ofensiv" };
  if (yellows > 0) return { score, note: "a luat cartonas" };

  return { score, note: "contributie stabila" };
}

function positionMatchBonus(result: FixtureResult, player: Player, side: "home" | "away"): number {
  const possession = getSidePossession(result, side);
  const shotsAgainst = getSideShots(result, side === "home" ? "away" : "home");
  const ownShots = getSideShots(result, side);
  const cleanSheet = getSideScore(result, side === "home" ? "away" : "home") === 0;

  if (player.position === "GK") return (cleanSheet ? 0.35 : 0) + clamp((10 - shotsAgainst) * 0.025, -0.2, 0.2);
  if (player.position === "DEF") return (cleanSheet ? 0.25 : 0) + clamp((8 - shotsAgainst) * 0.02, -0.18, 0.2);
  if (player.position === "MID") return clamp((possession - 50) * 0.015, -0.28, 0.28);
  return clamp((ownShots - 8) * 0.035, -0.22, 0.3);
}

function ratePlayer(result: FixtureResult, player: Player, side: "home" | "away"): PlayerMatchRating {
  const eventScore = getPlayerEventScore(result, player, side);
  const resultModifier = getResultModifier(result, side);
  const positionBonus = positionMatchBonus(result, player, side);
  const fitnessPenalty = (player.fitness ?? 100) < 55 ? -0.25 : 0;
  const injuryPenalty = isPlayerInjured(player) ? -0.35 : 0;
  const base = 6.2 + (player.overall - 65) * 0.035 + resultModifier + positionBonus + eventScore.score + fitnessPenalty + injuryPenalty;
  const rating = Number(clamp(base, 4.8, 9.8).toFixed(1));

  return {
    playerId: player.id,
    playerName: player.name,
    teamName: getTeamNameForSide(result, side),
    side,
    position: player.position,
    rating,
    note: eventScore.note,
  };
}

function buildPlayerRatings(result: FixtureResult): PlayerMatchRating[] {
  const homePlayers = normalizeTeamStatus(result.fixture.homeTeam).players.map((player) => ratePlayer(result, player, "home"));
  const awayPlayers = normalizeTeamStatus(result.fixture.awayTeam).players.map((player) => ratePlayer(result, player, "away"));

  return [...homePlayers, ...awayPlayers].sort((a, b) => b.rating - a.rating || a.playerName.localeCompare(b.playerName));
}

function buildHalfTimeScore(result: FixtureResult): string {
  let homeHalf = 0;
  let awayHalf = 0;

  result.result.events.forEach((event) => {
    if (event.type !== "goal" || event.minute > 45) return;
    if (event.team === "home") homeHalf += 1;
    if (event.team === "away") awayHalf += 1;
  });

  return `${result.result.homeTeamName} ${homeHalf} - ${awayHalf} ${result.result.awayTeamName}`;
}

function buildMomentumLabel(result: FixtureResult): string {
  const homeMomentum = result.result.stats.homePossession * 0.08 + result.result.stats.homeShots * 0.75 + result.result.stats.homeXg * 5 + result.result.homeScore * 4;
  const awayMomentum = result.result.stats.awayPossession * 0.08 + result.result.stats.awayShots * 0.75 + result.result.stats.awayXg * 5 + result.result.awayScore * 4;
  const difference = homeMomentum - awayMomentum;

  if (difference >= 7) return `${result.result.homeTeamName} a controlat ritmul meciului.`;
  if (difference <= -7) return `${result.result.awayTeamName} a controlat ritmul meciului.`;
  return "Momentum echilibrat, cu perioade bune pentru ambele echipe.";
}

function buildConclusion(result: FixtureResult): string {
  const homeScore = result.result.homeScore;
  const awayScore = result.result.awayScore;
  const homeXg = result.result.stats.homeXg;
  const awayXg = result.result.stats.awayXg;
  const shotDifference = result.result.stats.homeShots - result.result.stats.awayShots;

  if (homeScore > awayScore && homeXg >= awayXg) return `${result.result.homeTeamName} a castigat justificat, cu avantaj la ocazii si eficienta.`;
  if (awayScore > homeScore && awayXg >= homeXg) return `${result.result.awayTeamName} a castigat justificat, cu avantaj la ocazii si eficienta.`;
  if (homeScore !== awayScore) return "Rezultatul a fost decis de eficienta la finalizare, nu neaparat de control total.";
  if (Math.abs(shotDifference) <= 2) return "Remiza echilibrata, fara diferenta majora la volum ofensiv.";
  return "Remiza obtinuta in ciuda unui raport de ocazii dezechilibrat.";
}

function getUserSide(result: FixtureResult): "home" | "away" | "neutral" {
  if (result.fixture.homeTeam.id === USER_TEAM_ID) return "home";
  if (result.fixture.awayTeam.id === USER_TEAM_ID) return "away";
  return "neutral";
}

function buildUserFeedback(result: FixtureResult, userTactic: Tactic): TacticalFeedbackItem[] {
  const userSide = getUserSide(result);

  if (userSide === "neutral") {
    return [
      {
        title: "Meci neutru",
        message: "Acest meci nu implica direct clubul tau, dar poate influenta clasamentul si obiectivele de sezon.",
        severity: "neutral",
      },
    ];
  }

  const opponentSide = userSide === "home" ? "away" : "home";
  const ownTeam = normalizeTeamStatus(getTeamForSide(result, userSide));
  const opponentTeam = normalizeTeamStatus(getTeamForSide(result, opponentSide));
  const ownStrength = calculateTeamStrength(ownTeam, getTeamTactic(ownTeam.id, userTactic));
  const opponentStrength = calculateTeamStrength(opponentTeam, getTeamTactic(opponentTeam.id, userTactic));
  const ownScore = getSideScore(result, userSide);
  const opponentScore = getSideScore(result, opponentSide);
  const ownPossession = getSidePossession(result, userSide);
  const ownShots = getSideShots(result, userSide);
  const opponentShots = getSideShots(result, opponentSide);
  const ownShotsOnTarget = getSideShotsOnTarget(result, userSide);
  const ownXg = getSideXg(result, userSide);
  const opponentXg = getSideXg(result, opponentSide);
  const averageFitness = getAverageFitness(ownTeam);
  const unavailable = getUnavailablePlayers(ownTeam).length;
  const feedback: TacticalFeedbackItem[] = [];

  if (ownScore > opponentScore) {
    feedback.push({ title: "Rezultat bun", message: "Planul de joc a produs rezultatul dorit. Pastreaza baza tactica, dar verifica fitness-ul inainte de urmatoarea runda.", severity: "positive" });
  } else if (ownScore === opponentScore) {
    feedback.push({ title: "Rezultat neutru", message: "Ai obtinut punct, dar mai exista spatiu de optimizare in faza ofensiva sau la posesie.", severity: "neutral" });
  } else {
    feedback.push({ title: "Rezultat negativ", message: "Meci pierdut. Verifica raportul de ocazii si diferenta de strength inainte de a schimba agresiv tactica.", severity: "warning" });
  }

  if (ownPossession < 45 || ownStrength.midfield < opponentStrength.midfield - 5) {
    feedback.push({ title: "Ai pierdut mijlocul", message: "Posesia si/sau strength-ul de midfield au fost sub adversar. Incearca 4-2-3-1, pressing medium sau training balanced.", severity: "warning" });
  } else if (ownPossession > 55) {
    feedback.push({ title: "Control bun la mijloc", message: "Ai avut suficienta posesie pentru a dicta ritmul. Continua sa construiesti prin mijlocasi.", severity: "positive" });
  }

  if (ownShotsOnTarget === 0 || ownXg < 0.45) {
    feedback.push({ title: "Atac steril", message: "Ai produs prea putine ocazii clare. Ia in calcul attacking training sau transferul unui ATT cu shooting mai bun.", severity: "warning" });
  } else if (ownShots >= opponentShots && ownXg >= opponentXg) {
    feedback.push({ title: "Atac eficient", message: "Volumul ofensiv a fost competitiv. Rezultatele ar trebui sa se imbunatateasca daca mentii fitness-ul ridicat.", severity: "positive" });
  }

  if (averageFitness < 65 || unavailable > 0) {
    feedback.push({ title: "Fitness-ul a contat", message: `Fitness mediu ${averageFitness}, indisponibili ${unavailable}. High pressing devine riscant cand lotul e obosit.`, severity: "warning" });
  }

  if (userTactic.mentality === "attacking" && opponentStrength.attack > ownStrength.defense) {
    feedback.push({ title: "Tactica riscanta", message: "Mentalitatea attacking a lasat spatii contra unui adversar cu atac puternic. Balanced poate fi mai sigur.", severity: "warning" });
  }

  if (feedback.length < 3) {
    feedback.push({ title: "Plan stabil", message: "Nu exista semnale tactice critice. Urmatorul pas este optimizarea lotului si antrenamentul specific.", severity: "neutral" });
  }

  return feedback.slice(0, 5);
}

export function buildMatchAnalysis(result: FixtureResult, userTactic: Tactic): MatchAnalysis {
  const playerRatings = buildPlayerRatings(result);
  const manOfTheMatch = playerRatings[0];

  return {
    fixtureId: result.fixture.id,
    halfTimeScore: buildHalfTimeScore(result),
    momentumLabel: buildMomentumLabel(result),
    conclusion: buildConclusion(result),
    manOfTheMatch,
    topPerformers: playerRatings.slice(0, 3),
    feedback: buildUserFeedback(result, userTactic),
  };
}

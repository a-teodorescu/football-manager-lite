import type { Fixture } from "./fixtureGenerator";
import { getTeamTactic, USER_TEAM_ID } from "./leagueSimulation";
import { calculateAdvancedTeamStrength } from "./advancedTactics";
import type { TacticalFocus, TacticalLine, TacticalRisk, TacticalTempo, TacticalWidth, Tactic, Team, TeamStrength } from "./types";
import { clamp } from "./random";
import { getAverageFitness, getUnavailablePlayers } from "./playerStatus";
import { validateLineupSelection } from "./lineupSelection";
import { buildSubstitutionReport } from "./substitutions";
import { buildSetPieceReport } from "./setPieces";

export type MatchPlanRisk = "low" | "medium" | "high";
export type MatchVenue = "home" | "away" | "neutral";

export interface MatchPlanAdjustment {
  key: keyof Tactic;
  from?: string;
  to: string;
  label: string;
  rationale: string;
}

export interface OppositionScoutReport {
  available: boolean;
  matchLabel: string;
  venue: MatchVenue;
  opponentName?: string;
  opponentStyle?: string;
  opponentTactic?: Tactic;
  userStrength?: TeamStrength;
  opponentStrength?: TeamStrength;
  strengthDelta: number;
  risk: MatchPlanRisk;
  readinessScore: number;
  recommendedTactic: Tactic;
  adjustments: MatchPlanAdjustment[];
  threats: string[];
  opportunities: string[];
  checklist: string[];
  summary: string;
}

function roundStrength(strength: TeamStrength): TeamStrength {
  return {
    attack: Math.round(strength.attack),
    midfield: Math.round(strength.midfield),
    defense: Math.round(strength.defense),
    goalkeeper: Math.round(strength.goalkeeper),
    overall: Math.round(strength.overall),
  };
}

function getTeamStyleLabel(team: Team): string {
  if (team.tacticalStyle === "possession") return "possession";
  if (team.tacticalStyle === "direct") return "direct play";
  if (team.tacticalStyle === "counter") return "counter attack";
  if (team.tacticalStyle === "pressing") return "high pressing";
  if (team.tacticalStyle === "defensive") return "defensive block";
  return "balanced";
}

function getVenueForFixture(fixture: Fixture): MatchVenue {
  if (fixture.homeTeam.id === USER_TEAM_ID) return "home";
  if (fixture.awayTeam.id === USER_TEAM_ID) return "away";
  return "neutral";
}

function pushAdjustment<T extends keyof Tactic>(params: {
  current: Tactic;
  next: Tactic;
  key: T;
  value: Tactic[T];
  label: string;
  rationale: string;
  adjustments: MatchPlanAdjustment[];
}): void {
  const previous = params.next[params.key] ?? params.current[params.key];
  if (previous === params.value) return;

  params.adjustments.push({
    key: params.key,
    from: previous ? String(previous) : undefined,
    to: String(params.value),
    label: params.label,
    rationale: params.rationale,
  });
  params.next[params.key] = params.value;
}

function buildChecklist(params: {
  userTeam: Team;
  userTactic: Tactic;
  recommendedTactic: Tactic;
  fixture?: Fixture;
}): string[] {
  const lineupReport = validateLineupSelection(params.userTeam, params.userTactic.formation);
  const substitutionReport = buildSubstitutionReport(params.userTeam, params.userTactic.formation);
  const setPieceReport = buildSetPieceReport(params.userTeam, params.userTactic.formation);
  const checklist: string[] = [];

  if (!params.fixture) checklist.push("Asteapta generarea urmatorului meci oficial.");
  if (!lineupReport.isValid) checklist.push("Repara primul 11 inainte sa aplici planul tactic.");
  if (!substitutionReport.isValid || substitutionReport.planned.length === 0) checklist.push("Pregateste cel putin o schimbare pentru repriza a doua.");
  if (!setPieceReport.isValid) checklist.push("Alege specialistii de faze fixe si capitanul.");
  if (params.userTactic.formation !== params.recommendedTactic.formation) checklist.push("Dupa schimbarea formatiei, verifica din nou Lineup si Subs.");
  if (getAverageFitness(params.userTeam) < 70) checklist.push("Fitness-ul mediu este scazut; evita pressing/tempo foarte agresiv.");
  if (getUnavailablePlayers(params.userTeam).length > 0) checklist.push("Verifica accidentatii si jucatorii indisponibili in Medical.");
  if (checklist.length === 0) checklist.push("Planul de meci este pregatit: lineup, banca, faze fixe si tactica sunt aliniate.");

  return checklist;
}

export function getMatchPlanRiskLabel(risk: MatchPlanRisk): string {
  if (risk === "high") return "Risc ridicat";
  if (risk === "medium") return "Risc mediu";
  return "Risc redus";
}

export function buildRecommendedMatchPlan(params: {
  userTeam: Team;
  userTactic: Tactic;
  opponentTeam: Team;
  opponentTactic: Tactic;
  venue: MatchVenue;
  userStrength: TeamStrength;
  opponentStrength: TeamStrength;
}): { tactic: Tactic; adjustments: MatchPlanAdjustment[]; threats: string[]; opportunities: string[] } {
  const next: Tactic = { ...params.userTactic };
  const adjustments: MatchPlanAdjustment[] = [];
  const threats: string[] = [];
  const opportunities: string[] = [];
  const strengthDelta = params.userStrength.overall - params.opponentStrength.overall;
  const opponentAttackEdge = params.opponentStrength.attack - params.userStrength.defense;
  const opponentMidfieldEdge = params.opponentStrength.midfield - params.userStrength.midfield;
  const userAttackEdge = params.userStrength.attack - params.opponentStrength.defense;
  const avgFitness = getAverageFitness(params.userTeam);

  if (opponentAttackEdge >= 7) {
    threats.push(`${params.opponentTeam.name} are avantaj ofensiv fata de defensiva ta.`);
    pushAdjustment({
      current: params.userTactic,
      next,
      key: "mentality",
      value: "balanced",
      label: "Mentalitate mai controlata",
      rationale: "Reduce expunerea contra unui atac mai puternic.",
      adjustments,
    });
    pushAdjustment({
      current: params.userTactic,
      next,
      key: "defensiveLine",
      value: "standard" as TacticalLine,
      label: "Linie defensiva standard",
      rationale: "Lasa mai putin spatiu in spatele fundasilor.",
      adjustments,
    });
    pushAdjustment({
      current: params.userTactic,
      next,
      key: "risk",
      value: "balanced" as TacticalRisk,
      label: "Risc controlat",
      rationale: "Evita tranzitiile pierdute in zone periculoase.",
      adjustments,
    });
  }

  if (opponentMidfieldEdge >= 6) {
    threats.push("Adversarul poate controla mijlocul terenului.");
    pushAdjustment({
      current: params.userTactic,
      next,
      key: "formation",
      value: "4-2-3-1",
      label: "Bloc central mai solid",
      rationale: "Adauga protectie intre mijloc si aparare.",
      adjustments,
    });
    pushAdjustment({
      current: params.userTactic,
      next,
      key: "attackingFocus",
      value: "central" as TacticalFocus,
      label: "Focus central",
      rationale: "Nu lasa adversarul sa castige usor zona centrala.",
      adjustments,
    });
  }

  if (params.opponentTactic.pressing === "high") {
    threats.push("Adversarul preseaza sus si poate forta greseli la constructie.");
    pushAdjustment({
      current: params.userTactic,
      next,
      key: "tempo",
      value: "slow" as TacticalTempo,
      label: "Tempo mai asezat",
      rationale: "Ajuta la iesirea mai sigura din pressing.",
      adjustments,
    });
  }

  if (params.opponentTactic.formation === "5-3-2") {
    opportunities.push("Adversarul are bloc defensiv compact; benzile pot deschide spatii.");
    pushAdjustment({
      current: params.userTactic,
      next,
      key: "width",
      value: "wide" as TacticalWidth,
      label: "Latime mai mare",
      rationale: "Desface o aparare cu cinci fundasi.",
      adjustments,
    });
  }

  if (userAttackEdge >= 6) {
    opportunities.push("Atacul tau poate exploata apararea adversa.");
    pushAdjustment({
      current: params.userTactic,
      next,
      key: "mentality",
      value: strengthDelta >= -3 ? "attacking" : "balanced",
      label: "Ataca punctul slab",
      rationale: "Ai avantaj clar in duelul atac vs aparare.",
      adjustments,
    });
  }

  if (params.venue === "away" && strengthDelta < 4) {
    threats.push("Meci in deplasare: avantajul terenului nu este de partea ta.");
    pushAdjustment({
      current: params.userTactic,
      next,
      key: "pressing",
      value: avgFitness >= 74 ? "medium" : "low",
      label: "Pressing adaptat deplasarii",
      rationale: "Reduce riscul si consumul de energie in deplasare.",
      adjustments,
    });
  }

  if (avgFitness >= 78 && params.userStrength.midfield >= params.opponentStrength.midfield - 2) {
    opportunities.push("Fitness-ul bun permite o intensitate mai mare in momentele cheie.");
    if (params.opponentTactic.pressing !== "high") {
      pushAdjustment({
        current: params.userTactic,
        next,
        key: "pressing",
        value: "high",
        label: "Pressing agresiv",
        rationale: "Lotul are energie suficienta pentru a forta recuperari sus.",
        adjustments,
      });
    }
  }

  if (threats.length === 0) threats.push("Nu exista un mismatch major negativ inaintea meciului.");
  if (opportunities.length === 0) opportunities.push("Planul principal este disciplina tactica si eficienta la faze fixe.");
  if (adjustments.length === 0) {
    adjustments.push({
      key: "mentality",
      from: params.userTactic.mentality,
      to: params.userTactic.mentality,
      label: "Pastrare tactica",
      rationale: "Tactica actuala este potrivita pentru acest adversar.",
    });
  }

  return { tactic: next, adjustments, threats, opportunities };
}

export function buildOppositionScoutReport(params: {
  fixture?: Fixture;
  userTeam: Team;
  userTactic: Tactic;
}): OppositionScoutReport {
  const fallback: OppositionScoutReport = {
    available: false,
    matchLabel: "Niciun meci disponibil",
    venue: "neutral",
    strengthDelta: 0,
    risk: "medium",
    readinessScore: 0,
    recommendedTactic: params.userTactic,
    adjustments: [],
    threats: ["Nu exista un meci viitor pentru analiza adversarului."],
    opportunities: [],
    checklist: buildChecklist({ ...params, recommendedTactic: params.userTactic }),
    summary: "Opposition scout va fi disponibil cand exista un meci viitor al clubului tau.",
  };

  if (!params.fixture) return fallback;

  const venue = getVenueForFixture(params.fixture);
  if (venue === "neutral") return fallback;

  const opponentTeam = params.fixture.homeTeam.id === USER_TEAM_ID ? params.fixture.awayTeam : params.fixture.homeTeam;
  const opponentTactic = getTeamTactic(opponentTeam.id, undefined, opponentTeam);
  const userStrength = roundStrength(calculateAdvancedTeamStrength(params.userTeam, params.userTactic));
  const opponentStrength = roundStrength(calculateAdvancedTeamStrength(opponentTeam, opponentTactic));
  const plan = buildRecommendedMatchPlan({
    userTeam: params.userTeam,
    userTactic: params.userTactic,
    opponentTeam,
    opponentTactic,
    venue,
    userStrength,
    opponentStrength,
  });
  const strengthDelta = userStrength.overall - opponentStrength.overall;
  const riskScore = clamp(50 - strengthDelta + (venue === "away" ? 8 : -3) + (plan.threats.length - plan.opportunities.length) * 4, 0, 100);
  const risk: MatchPlanRisk = riskScore >= 66 ? "high" : riskScore >= 42 ? "medium" : "low";
  const checklist = buildChecklist({ ...params, recommendedTactic: plan.tactic });
  const readinessScore = Math.round(clamp(100 - checklist.filter((item) => !item.startsWith("Planul de meci")).length * 14 - (risk === "high" ? 12 : risk === "medium" ? 5 : 0), 15, 100));

  return {
    available: true,
    matchLabel: `${params.fixture.homeTeam.name} vs ${params.fixture.awayTeam.name}`,
    venue,
    opponentName: opponentTeam.name,
    opponentStyle: getTeamStyleLabel(opponentTeam),
    opponentTactic,
    userStrength,
    opponentStrength,
    strengthDelta,
    risk,
    readinessScore,
    recommendedTactic: plan.tactic,
    adjustments: plan.adjustments,
    threats: plan.threats,
    opportunities: plan.opportunities,
    checklist,
    summary: `Scout report: ${opponentTeam.name}, ${getMatchPlanRiskLabel(risk).toLowerCase()}, readiness ${readinessScore}/100.`,
  };
}

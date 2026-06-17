import type { FixtureResult } from "./leagueSimulation";
import type { StandingRow } from "./standings";
import type { Team } from "./types";

export type MediaTone = "positive" | "neutral" | "critical";
export type PressAnswer = "calm" | "ambitious" | "defensive";

export interface MediaMessage {
  id: string;
  seasonNumber: number;
  round: number;
  tone: MediaTone;
  headline: string;
  body: string;
  pressure: number;
}

export interface MediaState {
  messages: MediaMessage[];
  reputation: number;
  lastAnswer?: PressAnswer;
}

export interface MediaReport {
  topHeadline: string;
  pressure: number;
  tone: MediaTone;
  summary: string;
}

export function createInitialMediaState(seasonNumber: number, clubName: string): MediaState {
  return {
    reputation: 50,
    messages: [
      {
        id: `media-welcome-s${seasonNumber}`,
        seasonNumber,
        round: 1,
        tone: "neutral",
        headline: `${clubName} porneste un nou proiect`,
        body: "Presa asteapta sa vada daca managerul poate transforma clubul intr-o candidata serioasa.",
        pressure: 35,
      },
    ],
  };
}

function getUserResult(roundResults: FixtureResult[], teamId: string): FixtureResult | undefined {
  return roundResults.find((item) => item.result.homeTeamId === teamId || item.result.awayTeamId === teamId);
}

export function buildRoundMediaMessage(input: {
  state: MediaState;
  seasonNumber: number;
  round: number;
  team: Team;
  roundResults: FixtureResult[];
  standings: StandingRow[];
}): { state: MediaState; message: MediaMessage } {
  const result = getUserResult(input.roundResults, input.team.id);
  const position = Math.max(1, input.standings.findIndex((row) => row.teamId === input.team.id) + 1 || input.standings.length);
  let tone: MediaTone = "neutral";
  let headline = `${input.team.name} ramane sub lupa presei`;
  let body = `Pozitia curenta in clasament este #${position}.`;
  let pressure = Math.max(20, 70 - input.state.reputation + position * 3);

  if (result) {
    const isHome = result.result.homeTeamId === input.team.id;
    const gf = isHome ? result.result.homeScore : result.result.awayScore;
    const ga = isHome ? result.result.awayScore : result.result.homeScore;
    if (gf > ga) {
      tone = "positive";
      headline = `${input.team.name} castiga si ridica asteptarile`;
      body = `Victoria ${gf}-${ga} aduce incredere, dar si asteptari mai mari.`;
      pressure = Math.max(15, pressure - 12);
    } else if (gf < ga) {
      tone = "critical";
      headline = `Intrebari dificile dupa esecul lui ${input.team.name}`;
      body = `Infrangerea ${gf}-${ga} pune presiune pe manager inaintea rundei urmatoare.`;
      pressure += 18;
    } else {
      headline = `${input.team.name} obtine un egal muncit`;
      body = `Egalul ${gf}-${ga} pastreaza echipa in lupta, dar presa cere progres.`;
      pressure += 4;
    }
  }

  const answerModifier = input.state.lastAnswer === "calm" ? -4 : input.state.lastAnswer === "ambitious" ? 2 : input.state.lastAnswer === "defensive" ? 6 : 0;
  const message: MediaMessage = {
    id: `media-s${input.seasonNumber}-r${input.round}-${input.roundResults.length}`,
    seasonNumber: input.seasonNumber,
    round: input.round,
    tone,
    headline,
    body,
    pressure: Math.max(0, Math.min(100, Math.round(pressure + answerModifier))),
  };

  const reputationDelta = tone === "positive" ? 3 : tone === "critical" ? -3 : 1;
  return {
    message,
    state: {
      ...input.state,
      reputation: Math.max(0, Math.min(100, input.state.reputation + reputationDelta)),
      messages: [message, ...input.state.messages].slice(0, 30),
    },
  };
}

export function answerPressConference(state: MediaState, answer: PressAnswer): MediaState {
  const reputationDelta = answer === "calm" ? 2 : answer === "ambitious" ? 1 : -1;
  return {
    ...state,
    lastAnswer: answer,
    reputation: Math.max(0, Math.min(100, state.reputation + reputationDelta)),
  };
}

export function buildMediaReport(state: MediaState): MediaReport {
  const latest = state.messages[0];
  return {
    topHeadline: latest?.headline ?? "Nu exista stiri inca.",
    pressure: latest?.pressure ?? 30,
    tone: latest?.tone ?? "neutral",
    summary: `Media reputation ${state.reputation}. Ultima presiune media: ${latest?.pressure ?? 30}/100.`,
  };
}

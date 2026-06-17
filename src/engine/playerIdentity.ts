import { clamp, createSeededRandom, randomInt } from "./random";
import type { Player, Position, Team } from "./types";

export type PreferredFoot = "left" | "right" | "both";

export type PlayerPersonality =
  | "leader"
  | "professional"
  | "ambitious"
  | "loyal"
  | "temperamental"
  | "team_player";

export type PlayerRole =
  | "sweeper_keeper"
  | "shot_stopper"
  | "ball_playing_defender"
  | "defensive_fullback"
  | "box_to_box"
  | "deep_lying_playmaker"
  | "wide_creator"
  | "target_forward"
  | "pressing_forward"
  | "inside_forward";

export interface CountryProfile {
  code: string;
  name: string;
  flag: string;
  firstNames: string[];
  lastNames: string[];
}

export interface PlayerIdentitySeed {
  seed: string;
  index: number;
  position: Position;
  age: number;
  overall?: number;
}

export interface PlayerIdentityOverviewCountry {
  code: string;
  name: string;
  flag: string;
  count: number;
}

export interface PlayerIdentitySpotlight {
  playerId: string;
  name: string;
  flag: string;
  nationality: string;
  position: Position;
  age: number;
  role: PlayerRole;
  preferredFoot: PreferredFoot;
  personality: PlayerPersonality;
  marketability: number;
  summary: string;
}

export interface PlayerIdentityOverview {
  totalPlayers: number;
  domesticPlayers: number;
  foreignPlayers: number;
  countriesCount: number;
  topCountries: PlayerIdentityOverviewCountry[];
  averageMarketability: number;
  leftFootedPlayers: number;
  bothFootedPlayers: number;
  leadersCount: number;
  spotlights: PlayerIdentitySpotlight[];
}

export const COUNTRY_PROFILES: CountryProfile[] = [
  {
    code: "RO",
    name: "Romania",
    flag: "🇷🇴",
    firstNames: ["Andrei", "Radu", "Mihai", "Vlad", "Tudor", "Denis", "Cristi", "Ionut", "Alex", "Darius"],
    lastNames: ["Popescu", "Ionescu", "Dumitrescu", "Munteanu", "Marin", "Stoica", "Dragomir", "Radu", "Coman", "Ilie"],
  },
  {
    code: "BR",
    name: "Brazil",
    flag: "🇧🇷",
    firstNames: ["Lucas", "Mateus", "Rafael", "Caio", "Bruno", "Thiago", "Joao", "Felipe", "Renan", "Davi"],
    lastNames: ["Silva", "Santos", "Pereira", "Costa", "Oliveira", "Rocha", "Almeida", "Lima", "Ferreira", "Gomes"],
  },
  {
    code: "AR",
    name: "Argentina",
    flag: "🇦🇷",
    firstNames: ["Mateo", "Santiago", "Nicolas", "Lautaro", "Tomas", "Franco", "Emiliano", "Julian", "Facundo", "Bruno"],
    lastNames: ["Gomez", "Fernandez", "Lopez", "Martinez", "Romero", "Diaz", "Acosta", "Pereyra", "Vega", "Suarez"],
  },
  {
    code: "ES",
    name: "Spain",
    flag: "🇪🇸",
    firstNames: ["Pablo", "Daniel", "Hugo", "Sergio", "Adrian", "Javier", "Alejandro", "Marcos", "Iker", "Diego"],
    lastNames: ["Garcia", "Lopez", "Ruiz", "Moreno", "Torres", "Sanchez", "Navarro", "Romero", "Castro", "Ortega"],
  },
  {
    code: "PT",
    name: "Portugal",
    flag: "🇵🇹",
    firstNames: ["Diogo", "Tiago", "Ruben", "Joao", "Miguel", "Goncalo", "Andre", "Nuno", "Rafael", "Fabio"],
    lastNames: ["Costa", "Silva", "Ferreira", "Santos", "Pereira", "Cardoso", "Mendes", "Ribeiro", "Gomes", "Teixeira"],
  },
  {
    code: "FR",
    name: "France",
    flag: "🇫🇷",
    firstNames: ["Lucas", "Theo", "Hugo", "Mathis", "Enzo", "Jules", "Noah", "Axel", "Nolan", "Ethan"],
    lastNames: ["Martin", "Dubois", "Bernard", "Lefevre", "Moreau", "Laurent", "Girard", "Andre", "Mercier", "Roux"],
  },
  {
    code: "IT",
    name: "Italy",
    flag: "🇮🇹",
    firstNames: ["Luca", "Matteo", "Alessandro", "Marco", "Andrea", "Federico", "Nicolo", "Gabriele", "Davide", "Simone"],
    lastNames: ["Rossi", "Bianchi", "Romano", "Conti", "Ferrari", "Ricci", "Moretti", "Marino", "Greco", "Gallo"],
  },
  {
    code: "DE",
    name: "Germany",
    flag: "🇩🇪",
    firstNames: ["Lukas", "Leon", "Felix", "Jonas", "Noah", "Julian", "Max", "Finn", "Tim", "Nico"],
    lastNames: ["Muller", "Schmidt", "Schneider", "Fischer", "Weber", "Hoffmann", "Wagner", "Becker", "Klein", "Wolf"],
  },
  {
    code: "NL",
    name: "Netherlands",
    flag: "🇳🇱",
    firstNames: ["Daan", "Sem", "Luuk", "Milan", "Jesse", "Thijs", "Niels", "Ruben", "Lars", "Bram"],
    lastNames: ["De Jong", "Van Dijk", "Bakker", "Jansen", "Visser", "Smit", "Meijer", "Bos", "Vos", "Dekker"],
  },
  {
    code: "HR",
    name: "Croatia",
    flag: "🇭🇷",
    firstNames: ["Luka", "Ivan", "Marko", "Ante", "Mateo", "Filip", "Josip", "Dario", "Lovro", "Nikola"],
    lastNames: ["Horvat", "Kovacic", "Maric", "Novak", "Kralj", "Bilic", "Tomic", "Peric", "Jovic", "Vukovic"],
  },
  {
    code: "NG",
    name: "Nigeria",
    flag: "🇳🇬",
    firstNames: ["Victor", "Samuel", "Kelechi", "Chinedu", "Emeka", "Ifeanyi", "Moses", "Daniel", "Tosin", "Caleb"],
    lastNames: ["Okafor", "Adeyemi", "Iheanacho", "Balogun", "Eze", "Nwosu", "Adebayo", "Onyeka", "Sadiq", "Okocha"],
  },
  {
    code: "GH",
    name: "Ghana",
    flag: "🇬🇭",
    firstNames: ["Kwame", "Kofi", "Yaw", "Daniel", "Emmanuel", "Kojo", "Isaac", "Nana", "Samuel", "Jordan"],
    lastNames: ["Mensah", "Owusu", "Boateng", "Asante", "Osei", "Addo", "Appiah", "Acheampong", "Darko", "Adjei"],
  },
];

const domesticCountry = COUNTRY_PROFILES[0];
const personalities: PlayerPersonality[] = ["leader", "professional", "ambitious", "loyal", "temperamental", "team_player"];

function getCountryForSeed(seed: string, index: number): CountryProfile {
  const random = createSeededRandom(`country:${seed}:${index}`);
  const domesticBias = random();

  if (domesticBias < 0.58) return domesticCountry;

  const foreignProfiles = COUNTRY_PROFILES.slice(1);
  return foreignProfiles[randomInt(random, 0, foreignProfiles.length - 1)];
}

function buildName(country: CountryProfile, seed: string, index: number): string {
  const random = createSeededRandom(`name:${country.code}:${seed}:${index}`);
  const firstName = country.firstNames[randomInt(random, 0, country.firstNames.length - 1)];
  const lastName = country.lastNames[randomInt(random, 0, country.lastNames.length - 1)];
  return `${firstName} ${lastName}`;
}

function getPreferredFoot(seed: string, position: Position): PreferredFoot {
  const random = createSeededRandom(`foot:${seed}`);
  const roll = random();

  if (position === "GK") {
    if (roll < 0.08) return "left";
    if (roll < 0.12) return "both";
    return "right";
  }

  if (roll < 0.19) return "left";
  if (roll < 0.27) return "both";
  return "right";
}

export function getPlayerRole(position: Position, player: Pick<Player, "pace" | "shooting" | "passing" | "defending" | "stamina">): PlayerRole {
  if (position === "GK") {
    return player.passing >= player.defending - 2 ? "sweeper_keeper" : "shot_stopper";
  }

  if (position === "DEF") {
    return player.passing >= player.defending - 3 ? "ball_playing_defender" : "defensive_fullback";
  }

  if (position === "MID") {
    if (player.stamina >= player.passing && player.stamina >= player.defending) return "box_to_box";
    if (player.passing >= player.shooting) return "deep_lying_playmaker";
    return "wide_creator";
  }

  if (player.shooting >= player.pace + 3) return "target_forward";
  if (player.stamina >= player.shooting) return "pressing_forward";
  return "inside_forward";
}

function getPersonality(seed: string, age: number, overall?: number): PlayerPersonality {
  const random = createSeededRandom(`personality:${seed}:${age}:${overall ?? 0}`);
  const roll = randomInt(random, 0, personalities.length - 1);

  if (age >= 30 && random() > 0.48) return "leader";
  if ((overall ?? 0) >= 78 && random() > 0.55) return "ambitious";
  return personalities[roll];
}

function getMarketability(player: Pick<Player, "age" | "overall" | "morale" | "form">, personality: PlayerPersonality): number {
  const personalityBoost: Record<PlayerPersonality, number> = {
    leader: 8,
    professional: 6,
    ambitious: 5,
    loyal: 4,
    temperamental: -4,
    team_player: 5,
  };
  const ageModifier = player.age <= 23 ? 7 : player.age <= 30 ? 4 : -2;
  const raw = player.overall * 0.58 + player.morale * 0.18 + player.form * 0.14 + ageModifier + personalityBoost[personality];
  return clamp(Math.round(raw), 1, 100);
}

export function createPlayerIdentity(input: PlayerIdentitySeed): Pick<Player, "name" | "countryCode" | "nationality" | "flagEmoji" | "preferredFoot" | "personality" | "role" | "marketability" | "avatarSeed"> {
  const country = getCountryForSeed(input.seed, input.index);
  const preferredFoot = getPreferredFoot(input.seed, input.position);
  const personality = getPersonality(input.seed, input.age, input.overall);

  return {
    name: buildName(country, input.seed, input.index),
    countryCode: country.code,
    nationality: country.name,
    flagEmoji: country.flag,
    preferredFoot,
    personality,
    role: undefined,
    marketability: undefined,
    avatarSeed: `${country.code}-${input.seed}-${input.index}`,
  };
}

export function normalizePlayerIdentity<T extends Player>(player: T): T {
  const random = createSeededRandom(`identity:${player.id}:${player.name}`);
  const fallbackCountry = getCountryForSeed(player.id, randomInt(random, 1, 99));
  const personality = player.personality ?? getPersonality(player.id, player.age, player.overall);
  const role = player.role ?? getPlayerRole(player.position, player);
  const normalized: T = {
    ...player,
    countryCode: player.countryCode ?? fallbackCountry.code,
    nationality: player.nationality ?? fallbackCountry.name,
    flagEmoji: player.flagEmoji ?? fallbackCountry.flag,
    preferredFoot: player.preferredFoot ?? getPreferredFoot(player.id, player.position),
    personality,
    role,
    marketability: player.marketability ?? getMarketability(player, personality),
    avatarSeed: player.avatarSeed ?? `${player.id}-${player.name}`,
  };

  return normalized;
}

export function normalizeTeamPlayerIdentities(team: Team): Team {
  return {
    ...team,
    players: team.players.map(normalizePlayerIdentity),
  };
}

export function getPreferredFootLabel(foot?: PreferredFoot): string {
  if (foot === "left") return "Left";
  if (foot === "both") return "Both";
  return "Right";
}

export function getPersonalityLabel(personality?: PlayerPersonality): string {
  if (personality === "leader") return "Leader";
  if (personality === "professional") return "Professional";
  if (personality === "ambitious") return "Ambitious";
  if (personality === "loyal") return "Loyal";
  if (personality === "temperamental") return "Temperamental";
  return "Team player";
}

export function getRoleLabel(role?: PlayerRole): string {
  if (role === "sweeper_keeper") return "Sweeper keeper";
  if (role === "shot_stopper") return "Shot stopper";
  if (role === "ball_playing_defender") return "Ball-playing defender";
  if (role === "defensive_fullback") return "Defensive fullback";
  if (role === "box_to_box") return "Box-to-box";
  if (role === "deep_lying_playmaker") return "Deep playmaker";
  if (role === "wide_creator") return "Wide creator";
  if (role === "target_forward") return "Target forward";
  if (role === "pressing_forward") return "Pressing forward";
  return "Inside forward";
}

export function buildPlayerIdentitySummary(player: Player): string {
  const normalized = normalizePlayerIdentity(player);
  return `${normalized.flagEmoji ?? "🏳️"} ${normalized.nationality ?? "Unknown"} · ${getRoleLabel(normalized.role)} · ${getPreferredFootLabel(normalized.preferredFoot)} foot · ${getPersonalityLabel(normalized.personality)}`;
}

export function buildPlayerIdentityOverview(team: Team): PlayerIdentityOverview {
  const players = team.players.map(normalizePlayerIdentity);
  const countryMap = new Map<string, PlayerIdentityOverviewCountry>();

  players.forEach((player) => {
    const code = player.countryCode ?? "UN";
    const current = countryMap.get(code) ?? {
      code,
      name: player.nationality ?? "Unknown",
      flag: player.flagEmoji ?? "🏳️",
      count: 0,
    };
    countryMap.set(code, { ...current, count: current.count + 1 });
  });

  const topCountries = Array.from(countryMap.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const averageMarketability = players.length
    ? Math.round(players.reduce((sum, player) => sum + (player.marketability ?? 50), 0) / players.length)
    : 0;

  const spotlights = [...players]
    .sort((a, b) => (b.marketability ?? 0) - (a.marketability ?? 0) || b.overall - a.overall)
    .slice(0, 5)
    .map((player) => ({
      playerId: player.id,
      name: player.name,
      flag: player.flagEmoji ?? "🏳️",
      nationality: player.nationality ?? "Unknown",
      position: player.position,
      age: player.age,
      role: player.role ?? getPlayerRole(player.position, player),
      preferredFoot: player.preferredFoot ?? "right",
      personality: player.personality ?? "team_player",
      marketability: player.marketability ?? 50,
      summary: buildPlayerIdentitySummary(player),
    }));

  return {
    totalPlayers: players.length,
    domesticPlayers: players.filter((player) => player.countryCode === domesticCountry.code).length,
    foreignPlayers: players.filter((player) => player.countryCode !== domesticCountry.code).length,
    countriesCount: topCountries.length,
    topCountries,
    averageMarketability,
    leftFootedPlayers: players.filter((player) => player.preferredFoot === "left").length,
    bothFootedPlayers: players.filter((player) => player.preferredFoot === "both").length,
    leadersCount: players.filter((player) => player.personality === "leader").length,
    spotlights,
  };
}

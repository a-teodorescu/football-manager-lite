import { createPlayerIdentity, normalizePlayerIdentity } from "./playerIdentity";
import { Player, Team } from "./types";

const firstNames = [
  "Alex",
  "Mihai",
  "Andrei",
  "Radu",
  "Cristi",
  "Vlad",
  "Ionut",
  "George",
  "Darius",
  "Rares",
];

const lastNames = [
  "Popescu",
  "Ionescu",
  "Dumitrescu",
  "Stan",
  "Marin",
  "Georgescu",
  "Ilie",
  "Matei",
  "Voicu",
  "Stoica",
];

function createPlayer(
  id: string,
  position: Player["position"],
  baseOverall: number,
  index: number
): Player {
  const variance = (index % 5) - 2;

  const age = 18 + ((index * 3) % 17);
  const overall = baseOverall + variance;

  const player: Player = {
    id,
    ...createPlayerIdentity({ seed: id, index, position, age, overall }),
    position,
    age,
    overall,
    pace: baseOverall + ((index * 4) % 10) - 4,
    shooting: position === "ATT" ? baseOverall + 6 : baseOverall - 5,
    passing: position === "MID" ? baseOverall + 6 : baseOverall - 2,
    defending: position === "DEF" || position === "GK" ? baseOverall + 6 : baseOverall - 8,
    stamina: baseOverall + ((index * 5) % 8) - 3,
    morale: 70 + ((index * 7) % 20),
    form: 65 + ((index * 6) % 25),
    fitness: 100,
  };

  return normalizePlayerIdentity(player);
}

export function createMockTeam(id: string, name: string, baseOverall: number): Team {
  const players: Player[] = [];

  let index = 1;

  for (let i = 0; i < 2; i++) {
    players.push(createPlayer(`${id}-gk-${i + 1}`, "GK", baseOverall, index++));
  }

  for (let i = 0; i < 6; i++) {
    players.push(createPlayer(`${id}-def-${i + 1}`, "DEF", baseOverall, index++));
  }

  for (let i = 0; i < 6; i++) {
    players.push(createPlayer(`${id}-mid-${i + 1}`, "MID", baseOverall, index++));
  }

  for (let i = 0; i < 4; i++) {
    players.push(createPlayer(`${id}-att-${i + 1}`, "ATT", baseOverall, index++));
  }

  return {
    id,
    name,
    players,
    reputation: baseOverall,
    morale: 75,
  };
}

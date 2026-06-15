export function createSeededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;

  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }

  return function random() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;

    return (h >>> 0) / 4294967296;
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function randomInt(random: () => number, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

export function pickRandom<T>(random: () => number, items: T[]): T {
  if (items.length === 0) {
    throw new Error("Cannot pick a random item from an empty array.");
  }

  return items[Math.floor(random() * items.length)];
}

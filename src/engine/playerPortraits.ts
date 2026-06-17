import { clamp, createSeededRandom, randomInt } from "./random";
import type { Player, Team } from "./types";

export interface PortraitClubColors {
  primaryColor: string;
  secondaryColor: string;
}

export type PortraitMood = "calm" | "focused" | "confident" | "intense";
export type PortraitFrame = "academy" | "first_team" | "star" | "captain";

export interface PlayerPortrait {
  playerId: string;
  name: string;
  initials: string;
  dataUri: string;
  svg: string;
  skinTone: string;
  hairColor: string;
  kitColor: string;
  accentColor: string;
  backgroundColor: string;
  mood: PortraitMood;
  frame: PortraitFrame;
  tags: string[];
}

export interface PortraitGallerySummary {
  totalPortraits: number;
  captainFrames: number;
  starFrames: number;
  academyFrames: number;
  averageMarketability: number;
  dominantMood: PortraitMood;
  samplePortraits: PlayerPortrait[];
}

const skinTones = ["#f3c79f", "#d69a6a", "#b9784c", "#8d5638", "#5f3929", "#f1b985"];
const hairColors = ["#1f1713", "#3b2417", "#6b4423", "#a16207", "#d6a354", "#111827", "#4b5563"];
const backgroundColors = ["#0f172a", "#064e3b", "#1e3a8a", "#3b0764", "#7f1d1d", "#164e63"];

function escapeSvg(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "P";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1];
  return `${first}${last ?? "L"}`.toUpperCase();
}

function pick<T>(items: T[], seed: string): T {
  const random = createSeededRandom(seed);
  return items[randomInt(random, 0, items.length - 1)];
}

function getPortraitMood(player: Player): PortraitMood {
  if ((player.morale ?? 50) >= 76 && (player.form ?? 50) >= 72) return "confident";
  if ((player.morale ?? 50) < 42 || player.personality === "temperamental") return "intense";
  if ((player.overall ?? 50) >= 75 || player.personality === "professional") return "focused";
  return "calm";
}

function getPortraitFrame(player: Player): PortraitFrame {
  if (player.personality === "leader" && player.age >= 27) return "captain";
  if ((player.marketability ?? 50) >= 72 || player.overall >= 78) return "star";
  if (player.age <= 21) return "academy";
  return "first_team";
}

function getMouthPath(mood: PortraitMood): string {
  if (mood === "confident") return "M40 62 H56 V66 H40 Z";
  if (mood === "intense") return "M40 64 H56 V68 H40 Z";
  if (mood === "focused") return "M42 64 H54 V66 H42 Z";
  return "M42 63 H54 V65 H42 Z";
}

function getEyebrowRects(mood: PortraitMood): string {
  if (mood === "intense") {
    return `<rect x="34" y="38" width="10" height="4"/><rect x="52" y="38" width="10" height="4"/>`;
  }
  if (mood === "confident") {
    return `<rect x="34" y="37" width="10" height="3"/><rect x="52" y="39" width="10" height="3"/>`;
  }
  return `<rect x="34" y="38" width="10" height="3"/><rect x="52" y="38" width="10" height="3"/>`;
}

function getFrameStroke(frame: PortraitFrame): string {
  if (frame === "captain") return "#facc15";
  if (frame === "star") return "#38bdf8";
  if (frame === "academy") return "#86efac";
  return "#94a3b8";
}

function getFrameLabel(frame: PortraitFrame): string {
  if (frame === "captain") return "CAP";
  if (frame === "star") return "STAR";
  if (frame === "academy") return "U21";
  return "XI";
}

function buildPixelSvg(player: Player, clubColors: PortraitClubColors): PlayerPortrait {
  const seed = player.avatarSeed ?? `${player.id}:${player.name}`;
  const skinTone = pick(skinTones, `skin:${seed}`);
  const hairColor = pick(hairColors, `hair:${seed}`);
  const backgroundColor = pick(backgroundColors, `bg:${seed}:${player.countryCode ?? "UN"}`);
  const kitColor = clubColors.primaryColor || "#22c55e";
  const accentColor = clubColors.secondaryColor || "#ecfdf5";
  const mood = getPortraitMood(player);
  const frame = getPortraitFrame(player);
  const frameStroke = getFrameStroke(frame);
  const initials = getInitials(player.name);
  const random = createSeededRandom(`portrait:${seed}`);
  const hairShape = randomInt(random, 0, 3);
  const hasBeard = player.age >= 25 && random() > 0.56;
  const hasHeadband = player.position === "GK" || random() > 0.86;
  const shirtStripe = random() > 0.48;
  const escapedName = escapeSvg(player.name);

  const hair = [
    `<rect x="28" y="22" width="40" height="16"/><rect x="24" y="30" width="8" height="14"/><rect x="64" y="30" width="8" height="14"/>`,
    `<rect x="30" y="20" width="36" height="14"/><rect x="26" y="28" width="12" height="10"/><rect x="58" y="28" width="12" height="10"/>`,
    `<rect x="26" y="24" width="44" height="12"/><rect x="30" y="18" width="28" height="10"/><rect x="62" y="32" width="8" height="10"/>`,
    `<rect x="30" y="22" width="36" height="12"/><rect x="34" y="18" width="24" height="8"/>`,
  ][hairShape];

  const beard = hasBeard
    ? `<rect x="34" y="58" width="28" height="12" fill="${hairColor}" opacity="0.88"/><rect x="38" y="68" width="20" height="4" fill="${hairColor}"/>`
    : "";
  const headband = hasHeadband
    ? `<rect x="30" y="32" width="36" height="5" fill="${accentColor}" opacity="0.95"/>`
    : "";
  const stripes = shirtStripe
    ? `<rect x="44" y="74" width="8" height="18" fill="${accentColor}" opacity="0.9"/><rect x="28" y="82" width="40" height="4" fill="${accentColor}" opacity="0.55"/>`
    : `<rect x="28" y="80" width="40" height="4" fill="${accentColor}" opacity="0.65"/>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" shape-rendering="crispEdges" role="img" aria-label="Pixel portrait ${escapedName}">
  <rect width="96" height="96" fill="${backgroundColor}"/>
  <rect x="4" y="4" width="88" height="88" rx="10" fill="none" stroke="${frameStroke}" stroke-width="4"/>
  <rect x="10" y="10" width="76" height="76" fill="rgba(255,255,255,0.04)"/>
  <rect x="22" y="74" width="52" height="18" fill="${kitColor}"/>
  <rect x="18" y="82" width="12" height="10" fill="${kitColor}"/>
  <rect x="66" y="82" width="12" height="10" fill="${kitColor}"/>
  ${stripes}
  <rect x="38" y="66" width="20" height="12" fill="${skinTone}"/>
  <rect x="28" y="34" width="40" height="34" fill="${skinTone}"/>
  <rect x="24" y="44" width="6" height="14" fill="${skinTone}"/>
  <rect x="66" y="44" width="6" height="14" fill="${skinTone}"/>
  <g fill="${hairColor}">${hair}</g>
  ${headband}
  <g fill="#0f172a">${getEyebrowRects(mood)}<rect x="36" y="46" width="6" height="6"/><rect x="56" y="46" width="6" height="6"/></g>
  <rect x="46" y="52" width="4" height="8" fill="#a16207" opacity="0.45"/>
  ${beard}
  <path d="${getMouthPath(mood)}" fill="#111827"/>
  <rect x="8" y="8" width="24" height="12" fill="${frameStroke}" opacity="0.96"/>
  <text x="20" y="17" text-anchor="middle" font-family="monospace" font-size="8" font-weight="800" fill="#020617">${getFrameLabel(frame)}</text>
  <text x="48" y="91" text-anchor="middle" font-family="monospace" font-size="9" font-weight="800" fill="#ecfdf5">${initials}</text>
</svg>`;

  return {
    playerId: player.id,
    name: player.name,
    initials,
    svg,
    dataUri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    skinTone,
    hairColor,
    kitColor,
    accentColor,
    backgroundColor,
    mood,
    frame,
    tags: [getFrameLabel(frame), mood, player.position, player.nationality ?? "Unknown"],
  };
}

export function buildPlayerPortrait(player: Player, clubColors: PortraitClubColors): PlayerPortrait {
  return buildPixelSvg(player, clubColors);
}

export function buildPortraitGallery(team: Team, clubColors: PortraitClubColors): PortraitGallerySummary {
  const portraits = team.players.map((player) => buildPlayerPortrait(player, clubColors));
  const moodCounts = new Map<PortraitMood, number>();
  portraits.forEach((portrait) => {
    moodCounts.set(portrait.mood, (moodCounts.get(portrait.mood) ?? 0) + 1);
  });
  const dominantMood = ([...moodCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "calm") as PortraitMood;

  return {
    totalPortraits: portraits.length,
    captainFrames: portraits.filter((portrait) => portrait.frame === "captain").length,
    starFrames: portraits.filter((portrait) => portrait.frame === "star").length,
    academyFrames: portraits.filter((portrait) => portrait.frame === "academy").length,
    averageMarketability: portraits.length
      ? clamp(Math.round(team.players.reduce((sum, player) => sum + (player.marketability ?? 50), 0) / portraits.length), 1, 100)
      : 0,
    dominantMood,
    samplePortraits: portraits
      .sort((a, b) => {
        const playerA = team.players.find((player) => player.id === a.playerId);
        const playerB = team.players.find((player) => player.id === b.playerId);
        return (playerB?.marketability ?? 0) - (playerA?.marketability ?? 0) || (playerB?.overall ?? 0) - (playerA?.overall ?? 0);
      })
      .slice(0, 12),
  };
}

export function getPortraitMoodLabel(mood: PortraitMood): string {
  if (mood === "confident") return "Confident";
  if (mood === "focused") return "Focused";
  if (mood === "intense") return "Intense";
  return "Calm";
}

export function getPortraitFrameLabel(frame: PortraitFrame): string {
  if (frame === "captain") return "Captain frame";
  if (frame === "star") return "Star frame";
  if (frame === "academy") return "Academy frame";
  return "First team frame";
}

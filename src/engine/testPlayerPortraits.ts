import { createMockLeagueTeams } from "./leagueSimulation";
import { normalizeTeamPlayerIdentities } from "./playerIdentity";
import { buildPlayerPortrait, buildPortraitGallery } from "./playerPortraits";

const team = normalizeTeamPlayerIdentities(createMockLeagueTeams()[0]);
const colors = { primaryColor: "#2563eb", secondaryColor: "#f8fafc" };
const firstPortrait = buildPlayerPortrait(team.players[0], colors);
const repeatPortrait = buildPlayerPortrait(team.players[0], colors);
const gallery = buildPortraitGallery(team, colors);

if (!firstPortrait.dataUri.startsWith("data:image/svg+xml")) {
  throw new Error("Portrait should be exported as an SVG data URI.");
}

if (firstPortrait.dataUri !== repeatPortrait.dataUri) {
  throw new Error("Portrait generation must be deterministic for the same player and club colors.");
}

if (gallery.totalPortraits !== team.players.length) {
  throw new Error("Gallery should include exactly one portrait for each squad player.");
}

if (gallery.samplePortraits.length === 0) {
  throw new Error("Gallery should expose sample portraits for UI rendering.");
}

console.log("Player portraits OK", {
  totalPortraits: gallery.totalPortraits,
  dominantMood: gallery.dominantMood,
  firstFrame: firstPortrait.frame,
});

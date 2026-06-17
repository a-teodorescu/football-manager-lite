export type ReleaseCheckStatus = "pass" | "warning" | "fail";

export interface ReleaseCheck {
  id: string;
  category: "setup" | "gameplay" | "data" | "qa" | "ux";
  title: string;
  status: ReleaseCheckStatus;
  summary: string;
  action: string;
  targetTab: string;
}

export interface ReleaseMilestone {
  label: string;
  value: string;
  status: ReleaseCheckStatus;
}

export interface BetaPolishReleaseReport {
  score: number;
  statusLabel: string;
  releaseType: "beta_ready" | "candidate" | "needs_final_qa";
  passCount: number;
  warningCount: number;
  failCount: number;
  checks: ReleaseCheck[];
  milestones: ReleaseMilestone[];
  launchChecklist: string[];
  qaCommands: string[];
  releaseNotes: string[];
  exportFilename: string;
}

function weight(status: ReleaseCheckStatus): number {
  if (status === "pass") return 1;
  if (status === "warning") return 0.55;
  return 0;
}

function getStatusLabel(score: number, failCount: number, warningCount: number): BetaPolishReleaseReport["releaseType"] {
  if (failCount === 0 && score >= 88 && warningCount <= 2) return "beta_ready";
  if (failCount === 0 && score >= 72) return "candidate";
  return "needs_final_qa";
}

function getPublicStatusLabel(type: BetaPolishReleaseReport["releaseType"]): string {
  if (type === "beta_ready") return "Beta polish ready";
  if (type === "candidate") return "Release candidate with warnings";
  return "Needs final QA before sharing";
}

export function buildBetaPolishReleaseReport(input: {
  appVersion: string;
  saveSchemaVersion: number;
  betaReadinessScore: number;
  stabilityScore: number;
  adminScore: number;
  databaseReadinessScore: number;
  multiplayerReadinessScore: number;
  tacticalScore: number;
  authenticated: boolean;
  supabaseConfigured: boolean;
  localSaveAvailable: boolean;
  cloudSaveLikelyAvailable: boolean;
  resultsCount: number;
  seasonHistoryCount: number;
  inboxUnreadCount: number;
  savePayloadBytes: number;
  totalTabs: number;
  engineChecksCount: number;
  hasRecentError: boolean;
}): BetaPolishReleaseReport {
  const checks: ReleaseCheck[] = [
    {
      id: "auth-and-saves",
      category: "setup",
      title: "Auth and save flow",
      status: input.authenticated && (input.localSaveAvailable || input.cloudSaveLikelyAvailable) ? "pass" : input.authenticated ? "warning" : "fail",
      summary: input.authenticated
        ? `Authenticated session detected. Local save: ${input.localSaveAvailable ? "yes" : "no"}. Cloud signal: ${input.cloudSaveLikelyAvailable ? "yes" : "no"}.`
        : "No authenticated session is active, so public beta save flow is not testable from this browser.",
      action: "Login, save local, save cloud after Netlify/Supabase env variables are configured.",
      targetTab: "qa",
    },
    {
      id: "supabase-setup",
      category: "setup",
      title: "Supabase deploy setup",
      status: input.supabaseConfigured ? "pass" : "warning",
      summary: input.supabaseConfigured
        ? "Supabase URL and anon key are available to the frontend."
        : "Cloud save, auth and database mirror need Netlify environment variables before live testing.",
      action: "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify, then run QA Live.",
      targetTab: "database",
    },
    {
      id: "core-gameplay",
      category: "gameplay",
      title: "Core gameplay loop",
      status: input.resultsCount > 0 ? "pass" : "warning",
      summary: input.resultsCount > 0 ? `${input.resultsCount} match results exist in the current career.` : "No match result exists in this career yet.",
      action: "Simulate one round and inspect Match, Inbox, Finance and Board reports.",
      targetTab: "match",
    },
    {
      id: "season-path",
      category: "gameplay",
      title: "Season rollover path",
      status: input.seasonHistoryCount > 0 ? "pass" : "warning",
      summary: input.seasonHistoryCount > 0 ? "At least one season transition exists in history." : "Season rollover has not been tested in this save yet.",
      action: "Use Seasons after the league is finished, or test on a dedicated QA save.",
      targetTab: "seasons",
    },
    {
      id: "schema-and-payload",
      category: "data",
      title: "Save schema and payload size",
      status: input.savePayloadBytes < 700_000 && input.saveSchemaVersion >= 40 ? "pass" : input.savePayloadBytes < 1_100_000 ? "warning" : "fail",
      summary: `Schema ${input.saveSchemaVersion}, payload about ${Math.round(input.savePayloadBytes / 1024)} KB.`,
      action: "Keep migration enabled and archive old histories if payload grows too large.",
      targetTab: "stability",
    },
    {
      id: "beta-readiness",
      category: "qa",
      title: "Public beta readiness",
      status: input.betaReadinessScore >= 80 ? "pass" : input.betaReadinessScore >= 60 ? "warning" : "fail",
      summary: `Beta readiness score is ${input.betaReadinessScore}/100.`,
      action: "Open Beta and fix blockers/warnings before inviting testers.",
      targetTab: "beta",
    },
    {
      id: "stability",
      category: "qa",
      title: "Stability and recovery",
      status: input.stabilityScore >= 80 && !input.hasRecentError ? "pass" : input.stabilityScore >= 65 ? "warning" : "fail",
      summary: input.hasRecentError ? `Stability score ${input.stabilityScore}/100, but a recent UI error is recorded.` : `Stability score ${input.stabilityScore}/100.`,
      action: "Use Stability and Admin export if errors appear during testing.",
      targetTab: "stability",
    },
    {
      id: "admin-debug",
      category: "qa",
      title: "Admin debug packet",
      status: input.adminScore >= 75 ? "pass" : "warning",
      summary: `Admin debug score is ${input.adminScore}/100.`,
      action: "Generate debug export when reporting live bugs.",
      targetTab: "admin",
    },
    {
      id: "database-mode",
      category: "data",
      title: "Real Database Mode",
      status: input.databaseReadinessScore >= 75 ? "pass" : input.databaseReadinessScore >= 55 ? "warning" : "fail",
      summary: `Database readiness score is ${input.databaseReadinessScore}/100. JSON save remains the fallback.`,
      action: "Run schema.sql and use Database tab to mirror snapshots after cloud save works.",
      targetTab: "database",
    },
    {
      id: "friends-league",
      category: "gameplay",
      title: "Friends League foundation",
      status: input.multiplayerReadinessScore >= 70 ? "pass" : "warning",
      summary: `Friends League readiness score is ${input.multiplayerReadinessScore}/100.`,
      action: "Use Multiplayer after each tester has a cloud save.",
      targetTab: "multiplayer",
    },
    {
      id: "advanced-tactics",
      category: "gameplay",
      title: "Advanced tactical layer",
      status: input.tacticalScore >= 65 ? "pass" : "warning",
      summary: `Advanced tactics score is ${input.tacticalScore}/100 for the current squad.`,
      action: "Open Advanced Tactics and resolve risky warnings before difficult matches.",
      targetTab: "advancedTactics",
    },
    {
      id: "ux-surface",
      category: "ux",
      title: "UI surface area",
      status: input.totalTabs <= 38 ? "pass" : input.totalTabs <= 44 ? "warning" : "fail",
      summary: `${input.totalTabs} tabs are available in the current UI.`,
      action: "Group tabs into categories before adding more major features.",
      targetTab: "help",
    },
    {
      id: "fullcheck",
      category: "qa",
      title: "Fullcheck coverage",
      status: input.engineChecksCount >= 36 ? "pass" : "warning",
      summary: `${input.engineChecksCount} engine checks are expected in npm run fullcheck.`,
      action: "Run npm run check, npm run build and npm run fullcheck before ZIP release.",
      targetTab: "stability",
    },
  ];

  const passCount = checks.filter((item) => item.status === "pass").length;
  const warningCount = checks.filter((item) => item.status === "warning").length;
  const failCount = checks.filter((item) => item.status === "fail").length;
  const score = Math.round((checks.reduce((sum, item) => sum + weight(item.status), 0) / checks.length) * 100);
  const releaseType = getStatusLabel(score, failCount, warningCount);

  return {
    score,
    statusLabel: getPublicStatusLabel(releaseType),
    releaseType,
    passCount,
    warningCount,
    failCount,
    checks,
    milestones: [
      { label: "Version", value: input.appVersion, status: "pass" },
      { label: "Save schema", value: String(input.saveSchemaVersion), status: input.saveSchemaVersion >= 40 ? "pass" : "warning" },
      { label: "Engine checks", value: String(input.engineChecksCount), status: input.engineChecksCount >= 36 ? "pass" : "warning" },
      { label: "Payload", value: `${Math.round(input.savePayloadBytes / 1024)} KB`, status: input.savePayloadBytes < 700_000 ? "pass" : "warning" },
      { label: "Unread inbox", value: String(input.inboxUnreadCount), status: input.inboxUnreadCount <= 12 ? "pass" : "warning" },
    ],
    launchChecklist: [
      "Run npm run check, npm run build and npm run fullcheck locally.",
      "Deploy to Netlify with build command npm run build and publish dist.",
      "Run supabase/schema.sql in Supabase SQL Editor before first live test.",
      "Register a fresh test account and create a club from scratch.",
      "Save local, save cloud, reload page, load cloud and validate with Admin.",
      "Simulate one league round, one cup/europe round where available, then review Inbox and Finance.",
      "Export a debug packet after the first successful live smoke test.",
    ],
    qaCommands: [
      "npm run check",
      "npm run build",
      "npm run fullcheck",
      "npm run release",
    ],
    releaseNotes: [
      "v4.0 promotes the prototype to a beta-polished release candidate.",
      "JSON save remains the safety fallback while Real Database Mode mirrors key tables.",
      "Release tab centralizes launch status, QA actions, save export and handoff notes.",
      "No external AI, image, analytics or payment services are required for this release.",
    ],
    exportFilename: `football-manager-lite-save-v${input.appVersion.replace(/\./g, "_")}.json`,
  };
}

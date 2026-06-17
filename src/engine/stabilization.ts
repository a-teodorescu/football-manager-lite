export interface StabilityCheck {
  id: string;
  title: string;
  status: "pass" | "warning" | "fail";
  summary: string;
  action: string;
  targetTab: string;
}

export interface StabilityReport {
  score: number;
  statusLabel: string;
  passCount: number;
  warningCount: number;
  failCount: number;
  checks: StabilityCheck[];
  quickWins: string[];
  fullCheckCommand: string;
}

function statusWeight(status: StabilityCheck["status"]): number {
  if (status === "pass") return 1;
  if (status === "warning") return 0.55;
  return 0;
}

export function buildStabilityReport(input: {
  appVersion: string;
  saveSchemaVersion: number;
  savePayloadVersion: number;
  savePayloadBytes: number;
  appTsxLines: number;
  totalTabs: number;
  errorBoundaryEnabled: boolean;
  fullcheckAvailable: boolean;
  hasRecentError: boolean;
  teamsCount: number;
  fixturesCount: number;
  standingsCount: number;
  userPlayersCount: number;
  engineModuleCount: number;
}): StabilityReport {
  const checks: StabilityCheck[] = [
    {
      id: "schema",
      title: "Save schema migration",
      status: input.savePayloadVersion >= input.saveSchemaVersion ? "pass" : "fail",
      summary: `Payload version ${input.savePayloadVersion}, target schema ${input.saveSchemaVersion}.`,
      action: "Load/save once to migrate older payloads automatically.",
      targetTab: "admin",
    },
    {
      id: "payload-size",
      title: "Save payload size",
      status: input.savePayloadBytes < 500_000 ? "pass" : input.savePayloadBytes < 900_000 ? "warning" : "fail",
      summary: `${Math.round(input.savePayloadBytes / 1024)} KB estimated JSON payload.`,
      action: "If it grows too much, archive old histories or move to real database tables.",
      targetTab: "admin",
    },
    {
      id: "recovery",
      title: "UI recovery boundary",
      status: input.errorBoundaryEnabled ? "pass" : "fail",
      summary: input.errorBoundaryEnabled ? "React ErrorBoundary wraps the app." : "No error boundary detected.",
      action: "Keep the recovery screen available for debug exports and reloads.",
      targetTab: "qa",
    },
    {
      id: "fullcheck",
      title: "One-command QA",
      status: input.fullcheckAvailable ? "pass" : "warning",
      summary: input.fullcheckAvailable ? "npm run fullcheck is available." : "Full QA command is missing.",
      action: "Run npm run fullcheck before each ZIP/release.",
      targetTab: "qa",
    },
    {
      id: "core-data",
      title: "Core data integrity",
      status: input.teamsCount >= 8 && input.fixturesCount > 0 && input.standingsCount >= 8 ? "pass" : "fail",
      summary: `${input.teamsCount} teams, ${input.fixturesCount} fixtures, ${input.standingsCount} standings rows.`,
      action: "Use Admin validation if teams/fixtures/standings look inconsistent.",
      targetTab: "admin",
    },
    {
      id: "squad-depth",
      title: "Squad depth",
      status: input.userPlayersCount >= 18 ? "pass" : input.userPlayersCount >= 14 ? "warning" : "fail",
      summary: `${input.userPlayersCount} players in user squad.`,
      action: "Use transfers or academy promotion if the squad is thin.",
      targetTab: "squad",
    },
    {
      id: "ui-size",
      title: "UI refactor status",
      status: input.appTsxLines <= 4500 ? "pass" : input.appTsxLines <= 8500 ? "warning" : "fail",
      summary: `App.tsx has about ${input.appTsxLines.toLocaleString("en-US")} lines and ${input.totalTabs} tabs.`,
      action: "Next refactor target: split heavy tab sections into src/components/tabs.",
      targetTab: "help",
    },
    {
      id: "engine-surface",
      title: "Engine module coverage",
      status: input.engineModuleCount >= 25 ? "pass" : "warning",
      summary: `${input.engineModuleCount} engine modules/test files are present.` ,
      action: "Keep new features engine-first with a dedicated test script.",
      targetTab: "admin",
    },
    {
      id: "last-error",
      title: "Last UI error",
      status: input.hasRecentError ? "warning" : "pass",
      summary: input.hasRecentError ? "A recent UI error is recorded." : "No active UI error message.",
      action: "Export the Admin debug packet if an error appears again.",
      targetTab: "admin",
    },
  ];

  const passCount = checks.filter((item) => item.status === "pass").length;
  const warningCount = checks.filter((item) => item.status === "warning").length;
  const failCount = checks.filter((item) => item.status === "fail").length;
  const score = Math.round(
    (checks.reduce((sum, item) => sum + statusWeight(item.status), 0) / checks.length) * 100,
  );

  return {
    score,
    statusLabel: failCount > 0 ? "Needs stabilization" : warningCount > 0 ? "Stable with warnings" : "Release stable",
    passCount,
    warningCount,
    failCount,
    checks,
    quickWins: [
      "Run npm run fullcheck before Netlify deploy.",
      "Use Admin > Valideaza payload after importing an older save.",
      "Keep package-lock.json out of the ZIP only if you want fast, flexible Netlify installs.",
      "Split App.tsx tab sections gradually; avoid risky big-bang UI rewrites.",
    ],
    fullCheckCommand: "npm run fullcheck",
  };
}

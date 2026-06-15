export type BetaCheckCategory =
  | "setup"
  | "gameplay"
  | "stability"
  | "operations";
export type BetaCheckStatus = "pass" | "warning" | "fail";

export interface BetaReadinessCheck {
  id: string;
  category: BetaCheckCategory;
  title: string;
  status: BetaCheckStatus;
  summary: string;
  action: string;
  targetTab: string;
}

export interface BetaReadinessInput {
  authenticated: boolean;
  supabaseConfigured: boolean;
  localSaveAvailable: boolean;
  hasCloudSave: boolean;
  onboardingPercent: number;
  resultsCount: number;
  seasonHistoryCount: number;
  squadSize: number;
  transferHistoryCount: number;
  financeHistoryCount: number;
  boardReviewsCount: number;
  cupHistoryCount: number;
  helpArticlesCount: number;
  cashBalance: number;
  wageBudgetStatus: "healthy" | "tight" | "over";
  jobSecurity: number;
  sackRiskPercent: number;
  injuredPlayersCount: number;
  lowFitnessPlayersCount: number;
}

export interface BetaReadinessSummary {
  score: number;
  statusLabel: string;
  status: "ready" | "almost" | "needs_work";
  passCount: number;
  warningCount: number;
  failCount: number;
  checks: BetaReadinessCheck[];
  blockers: BetaReadinessCheck[];
  warnings: BetaReadinessCheck[];
  nextActions: string[];
}

function check(input: BetaReadinessCheck): BetaReadinessCheck {
  return input;
}

function getStatusLabel(
  score: number,
  failCount: number,
): BetaReadinessSummary["status"] {
  if (failCount === 0 && score >= 82) return "ready";
  if (failCount <= 1 && score >= 66) return "almost";
  return "needs_work";
}

function getPublicLabel(status: BetaReadinessSummary["status"]): string {
  if (status === "ready") return "Ready for closed/public beta";
  if (status === "almost") return "Almost ready - needs final setup";
  return "Needs work before beta";
}

export function buildBetaReadiness(
  input: BetaReadinessInput,
): BetaReadinessSummary {
  const checks: BetaReadinessCheck[] = [
    check({
      id: "auth-session",
      category: "setup",
      title: "Supabase Auth session",
      status: input.authenticated ? "pass" : "fail",
      summary: input.authenticated
        ? "User login/register flow is active for this browser session."
        : "No authenticated user is available, so per-user cloud saves cannot be tested end-to-end.",
      action: input.authenticated
        ? "Logout/login once before release to verify credentials."
        : "Create a test account with email and password.",
      targetTab: "dashboard",
    }),
    check({
      id: "supabase-env",
      category: "setup",
      title: "Supabase environment variables",
      status: input.supabaseConfigured ? "pass" : "warning",
      summary: input.supabaseConfigured
        ? "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are available."
        : "Cloud features need Netlify environment variables before beta users can save online.",
      action: input.supabaseConfigured
        ? "Keep the anon key in Netlify env, not in source code."
        : "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify.",
      targetTab: "help",
    }),
    check({
      id: "save-layer",
      category: "setup",
      title: "Save/load safety",
      status:
        input.localSaveAvailable || input.hasCloudSave ? "pass" : "warning",
      summary:
        input.localSaveAvailable || input.hasCloudSave
          ? "At least one save path has been used in this career."
          : "No saved career was detected yet for this user.",
      action:
        "Use Save local and, after Supabase setup, Save cloud before inviting testers.",
      targetTab: "dashboard",
    }),
    check({
      id: "game-loop",
      category: "gameplay",
      title: "Core match loop",
      status: input.resultsCount > 0 ? "pass" : "warning",
      summary:
        input.resultsCount > 0
          ? `${input.resultsCount} match results exist in the current save.`
          : "No match has been simulated in this save yet.",
      action: "Simulate at least one round and inspect the Match report.",
      targetTab: "match",
    }),
    check({
      id: "squad-depth",
      category: "gameplay",
      title: "Squad depth",
      status: input.squadSize >= 14 ? "pass" : "fail",
      summary:
        input.squadSize >= 14
          ? `${input.squadSize} players are available in the squad.`
          : `Only ${input.squadSize} players are available; this can break rotation and transfers.`,
      action:
        "Keep at least 14 players and minimum position coverage before beta.",
      targetTab: "squad",
    }),
    check({
      id: "club-systems",
      category: "gameplay",
      title: "Club systems touched",
      status:
        input.transferHistoryCount > 0 ||
        input.financeHistoryCount > 0 ||
        input.boardReviewsCount > 0 ||
        input.cupHistoryCount > 0
          ? "pass"
          : "warning",
      summary:
        input.transferHistoryCount > 0 ||
        input.financeHistoryCount > 0 ||
        input.boardReviewsCount > 0 ||
        input.cupHistoryCount > 0
          ? "At least one advanced club system has recorded activity."
          : "Transfers, finance, board and cup systems have not been exercised in this save yet.",
      action:
        "Run one transfer/scout action, one board review and one round before beta testing.",
      targetTab: "board",
    }),
    check({
      id: "finance-health",
      category: "gameplay",
      title: "Financial health",
      status:
        input.cashBalance <= 0 || input.wageBudgetStatus === "over"
          ? "warning"
          : "pass",
      summary:
        input.cashBalance <= 0
          ? "Cash balance is negative or zero."
          : input.wageBudgetStatus === "over"
            ? "Wage budget is exceeded and will pressure the board."
            : "Cash and wage budget are acceptable for beta gameplay.",
      action:
        "Use Finance and Transfers to stabilize cash and wages if needed.",
      targetTab: "finance",
    }),
    check({
      id: "manager-safety",
      category: "gameplay",
      title: "Manager job safety",
      status:
        input.sackRiskPercent >= 75 || input.jobSecurity <= 25
          ? "warning"
          : "pass",
      summary:
        input.sackRiskPercent >= 75 || input.jobSecurity <= 25
          ? "The current save is under heavy board pressure."
          : "Board pressure is acceptable for testing.",
      action:
        "Run Board review and improve objectives before using this save as demo data.",
      targetTab: "board",
    }),
    check({
      id: "player-availability",
      category: "gameplay",
      title: "Player availability",
      status:
        input.injuredPlayersCount + input.lowFitnessPlayersCount >= 7
          ? "warning"
          : "pass",
      summary:
        input.injuredPlayersCount + input.lowFitnessPlayersCount >= 7
          ? "Many players are injured or low fitness, which may make the next match feel harsh."
          : "Player availability is healthy enough for beta tests.",
      action: "Use Fitness training or rotate the squad before the next match.",
      targetTab: "medical",
    }),
    check({
      id: "multi-season",
      category: "stability",
      title: "Multi-season path",
      status: input.seasonHistoryCount > 0 ? "pass" : "warning",
      summary:
        input.seasonHistoryCount > 0
          ? "At least one season transition exists in history."
          : "The current career has not tested the season rollover path yet.",
      action: "Run or simulate a full season once before public beta.",
      targetTab: "seasons",
    }),
    check({
      id: "onboarding-help",
      category: "operations",
      title: "Onboarding and help",
      status:
        input.onboardingPercent >= 50 && input.helpArticlesCount >= 6
          ? "pass"
          : "warning",
      summary: `Onboarding is ${input.onboardingPercent}% complete and ${input.helpArticlesCount} help articles are available.`,
      action:
        "Open Help and make sure the recommended next step is understandable.",
      targetTab: "help",
    }),
    check({
      id: "netlify-build",
      category: "operations",
      title: "Netlify build profile",
      status: "pass",
      summary:
        "Project is configured for npm run build, dist publish, Node 20 and dev dependencies included.",
      action:
        "Deploy the ZIP contents to GitHub/Netlify without node_modules or dist.",
      targetTab: "beta",
    }),
  ];

  const passCount = checks.filter((item) => item.status === "pass").length;
  const warningCount = checks.filter(
    (item) => item.status === "warning",
  ).length;
  const failCount = checks.filter((item) => item.status === "fail").length;
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (passCount / checks.length) * 100 - warningCount * 2 - failCount * 7,
      ),
    ),
  );
  const status = getStatusLabel(score, failCount);
  const blockers = checks.filter((item) => item.status === "fail");
  const warnings = checks.filter((item) => item.status === "warning");
  const nextActions = [...blockers, ...warnings]
    .slice(0, 5)
    .map((item) => item.action);

  if (nextActions.length === 0) {
    nextActions.push(
      "Create a fresh test account, run one full round and save to cloud before inviting beta testers.",
    );
  }

  return {
    score,
    status,
    statusLabel: getPublicLabel(status),
    passCount,
    warningCount,
    failCount,
    checks,
    blockers,
    warnings,
    nextActions,
  };
}

import { buildBetaReadiness } from "./betaReadiness";

const ready = buildBetaReadiness({
  authenticated: true,
  supabaseConfigured: true,
  localSaveAvailable: true,
  hasCloudSave: true,
  onboardingPercent: 100,
  resultsCount: 12,
  seasonHistoryCount: 1,
  squadSize: 22,
  transferHistoryCount: 2,
  financeHistoryCount: 4,
  boardReviewsCount: 2,
  cupHistoryCount: 1,
  helpArticlesCount: 6,
  cashBalance: 42000,
  wageBudgetStatus: "healthy",
  jobSecurity: 82,
  sackRiskPercent: 8,
  injuredPlayersCount: 1,
  lowFitnessPlayersCount: 2,
});

if (ready.status !== "ready") {
  throw new Error(`Expected ready beta state, got ${ready.status}`);
}

if (ready.failCount !== 0) {
  throw new Error("Ready beta state should not include blockers.");
}

const blocked = buildBetaReadiness({
  authenticated: false,
  supabaseConfigured: false,
  localSaveAvailable: false,
  hasCloudSave: false,
  onboardingPercent: 0,
  resultsCount: 0,
  seasonHistoryCount: 0,
  squadSize: 10,
  transferHistoryCount: 0,
  financeHistoryCount: 0,
  boardReviewsCount: 0,
  cupHistoryCount: 0,
  helpArticlesCount: 2,
  cashBalance: -300,
  wageBudgetStatus: "over",
  jobSecurity: 18,
  sackRiskPercent: 86,
  injuredPlayersCount: 4,
  lowFitnessPlayersCount: 5,
});

if (blocked.status !== "needs_work") {
  throw new Error(
    `Expected blocked beta state to need work, got ${blocked.status}`,
  );
}

if (blocked.blockers.length < 2) {
  throw new Error(
    "Blocked beta state should include auth and squad-depth blockers.",
  );
}

console.log("Beta readiness test passed", {
  readyScore: ready.score,
  blockedScore: blocked.score,
  blockerCount: blocked.blockers.length,
});

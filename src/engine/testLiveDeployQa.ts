import { buildLiveDeployQa } from "./liveDeployQa";

const report = buildLiveDeployQa({
  appVersion: "2.1.0",
  authenticated: true,
  supabaseConfigured: true,
  localSaveAvailable: true,
  cloudSaveLikelyAvailable: true,
  hasClubCreated: true,
  resultsCount: 4,
  seasonHistoryCount: 1,
  boardReviewsCount: 2,
  currentRound: 2,
  maxRound: 14,
  lastSaveStatus: "Salvat in Supabase pentru contul tau.",
  lastError: "",
  userId: "test-user",
});

if (report.score < 80) {
  throw new Error(`Expected QA score above 80, got ${report.score}`);
}

if (report.failCount !== 0) {
  throw new Error(`Expected no blockers, got ${report.failCount}`);
}

if (report.completedSmokeSteps < 6) {
  throw new Error("Expected most smoke steps to be completed.");
}

console.log("Live deploy QA test passed", {
  score: report.score,
  status: report.statusLabel,
  smoke: `${report.completedSmokeSteps}/${report.totalSmokeSteps}`,
});

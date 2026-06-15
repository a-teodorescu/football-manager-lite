import { buildUiExperience, getHelpArticles } from "./uiExperience";

const freshCareer = buildUiExperience({
  hasSavedLocal: false,
  supabaseConfigured: false,
  resultsCount: 0,
  trainingDoneThisRound: false,
  transferHistoryCount: 0,
  hasAcademyProspects: false,
  boardReviewsCount: 0,
  cupMatchesPlayed: 0,
  seasonFinished: false,
});

if (freshCareer.completedCount !== 0) {
  throw new Error("Fresh career should start with zero completed onboarding tasks.");
}

if (freshCareer.nextTask?.id !== "save-local") {
  throw new Error("The first recommended task should be local save.");
}

const activeCareer = buildUiExperience({
  hasSavedLocal: true,
  supabaseConfigured: true,
  resultsCount: 4,
  trainingDoneThisRound: true,
  transferHistoryCount: 1,
  hasAcademyProspects: true,
  boardReviewsCount: 2,
  cupMatchesPlayed: 1,
  seasonFinished: false,
});

if (activeCareer.completionPercent !== 100) {
  throw new Error(`Expected 100% onboarding completion, got ${activeCareer.completionPercent}%`);
}

if (getHelpArticles().length < 5) {
  throw new Error("Help Center should contain core guide articles.");
}

console.log("UI experience test passed", {
  freshNextTask: freshCareer.nextTask?.title,
  activeCompletion: activeCareer.completionPercent,
  articleCount: getHelpArticles().length,
});

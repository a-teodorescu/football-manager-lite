export type QaCheckStatus = "pass" | "warning" | "fail";

export interface QaCheck {
  id: string;
  title: string;
  status: QaCheckStatus;
  summary: string;
  action: string;
  targetTab: string;
}

export interface SmokeStep {
  id: string;
  title: string;
  completed: boolean;
  targetTab: string;
  hint: string;
}

export interface DebugFact {
  label: string;
  value: string;
}

export interface LiveDeployQaReport {
  score: number;
  statusLabel: string;
  passCount: number;
  warningCount: number;
  failCount: number;
  checks: QaCheck[];
  smokeSteps: SmokeStep[];
  completedSmokeSteps: number;
  totalSmokeSteps: number;
  debugFacts: DebugFact[];
  recommendedActions: string[];
}

export interface BuildLiveDeployQaInput {
  appVersion: string;
  authenticated: boolean;
  supabaseConfigured: boolean;
  localSaveAvailable: boolean;
  cloudSaveLikelyAvailable: boolean;
  hasClubCreated: boolean;
  resultsCount: number;
  seasonHistoryCount: number;
  boardReviewsCount: number;
  currentRound: number;
  maxRound: number;
  lastSaveStatus?: string;
  lastError?: string;
  userId?: string;
}

function statusWeight(status: QaCheckStatus): number {
  if (status === "pass") return 10;
  if (status === "warning") return 5;
  return 0;
}

function buildStatusLabel(failCount: number, warningCount: number): string {
  if (failCount > 0) return "Needs setup before live testing";
  if (warningCount > 0) return "Ready for controlled QA";
  return "Live QA ready";
}

export function buildLiveDeployQa(input: BuildLiveDeployQaInput): LiveDeployQaReport {
  const checks: QaCheck[] = [
    {
      id: "auth-session",
      title: "Auth session",
      status: input.authenticated ? "pass" : "fail",
      summary: input.authenticated
        ? "Userul curent are sesiune Supabase Auth activa."
        : "Nu exista sesiune activa. Register/Login trebuie verificat inainte de test live.",
      action: input.authenticated ? "Continua smoke test-ul." : "Fa register sau login.",
      targetTab: "dashboard",
    },
    {
      id: "supabase-env",
      title: "Supabase env vars",
      status: input.supabaseConfigured ? "pass" : "fail",
      summary: input.supabaseConfigured
        ? "VITE_SUPABASE_URL si VITE_SUPABASE_ANON_KEY sunt prezente in build."
        : "Variabilele Supabase lipsesc din environment-ul aplicatiei.",
      action: input.supabaseConfigured
        ? "Testeaza save/load cloud."
        : "Adauga env vars in Netlify si redeploy.",
      targetTab: "qa",
    },
    {
      id: "local-save",
      title: "Local save",
      status: input.localSaveAvailable ? "pass" : "warning",
      summary: input.localSaveAvailable
        ? "Exista salvare locala pentru userul curent."
        : "Nu exista inca salvare locala pentru userul curent.",
      action: "Apasa Save local si reincarca pagina.",
      targetTab: "qa",
    },
    {
      id: "cloud-save",
      title: "Cloud save signal",
      status: input.cloudSaveLikelyAvailable ? "pass" : input.supabaseConfigured ? "warning" : "fail",
      summary: input.cloudSaveLikelyAvailable
        ? "Ultima actiune indica un save/load Supabase reusit."
        : "Nu exista inca un semnal local ca save/load Supabase a mers in sesiunea curenta.",
      action: input.supabaseConfigured
        ? "Apasa Save Supabase, apoi Load Supabase."
        : "Configureaza Supabase env vars mai intai.",
      targetTab: "qa",
    },
    {
      id: "club-created",
      title: "Club created",
      status: input.hasClubCreated ? "pass" : "warning",
      summary: input.hasClubCreated
        ? "Cariera are club creat si poate continua gameplay-ul."
        : "Clubul este inca default sau cariera nu a fost initializata complet.",
      action: "Creeaza clubul dupa login/register.",
      targetTab: "dashboard",
    },
    {
      id: "match-loop",
      title: "Match loop",
      status: input.resultsCount > 0 ? "pass" : "warning",
      summary: input.resultsCount > 0
        ? `${input.resultsCount} rezultate sunt deja generate.`
        : "Nu a fost simulat inca niciun meci in cariera curenta.",
      action: "Simuleaza o etapa si verifica raportul de meci.",
      targetTab: "match",
    },
    {
      id: "season-path",
      title: "Season path",
      status: input.currentRound <= input.maxRound || input.seasonHistoryCount > 0 ? "pass" : "warning",
      summary: input.seasonHistoryCount > 0
        ? "A fost testata trecerea intre sezoane."
        : `Cariera este in runda ${input.currentRound}/${input.maxRound}.`,
      action: "Simuleaza sezonul complet si porneste sezon nou la QA final.",
      targetTab: "seasons",
    },
    {
      id: "board-review",
      title: "Board review",
      status: input.boardReviewsCount > 0 ? "pass" : "warning",
      summary: input.boardReviewsCount > 0
        ? "Board-ul are cel putin un review generat."
        : "Nu exista inca review de board pentru cariera curenta.",
      action: "Ruleaza un board review manual sau simuleaza o etapa.",
      targetTab: "board",
    },
    {
      id: "last-error",
      title: "Last error",
      status: input.lastError ? "warning" : "pass",
      summary: input.lastError || "Nu exista eroare activa in UI.",
      action: input.lastError
        ? "Copiaza debug packet-ul si investigheaza eroarea."
        : "Continua testarea.",
      targetTab: "qa",
    },
  ];

  const smokeSteps: SmokeStep[] = [
    {
      id: "register-login",
      title: "Register/Login",
      completed: input.authenticated,
      targetTab: "dashboard",
      hint: "Creeaza cont sau intra in cont cu Supabase Auth.",
    },
    {
      id: "create-club",
      title: "Create club",
      completed: input.hasClubCreated,
      targetTab: "dashboard",
      hint: "Creeaza clubul si verifica numele in dashboard.",
    },
    {
      id: "save-local",
      title: "Save local",
      completed: input.localSaveAvailable,
      targetTab: "qa",
      hint: "Apasa Save local, reload, apoi Load local.",
    },
    {
      id: "save-cloud",
      title: "Save Supabase",
      completed: input.cloudSaveLikelyAvailable,
      targetTab: "qa",
      hint: "Apasa Save Supabase si Load Supabase.",
    },
    {
      id: "simulate-round",
      title: "Simulate match round",
      completed: input.resultsCount > 0,
      targetTab: "match",
      hint: "Simuleaza etapa urmatoare si verifica raportul post-meci.",
    },
    {
      id: "board-review",
      title: "Board review",
      completed: input.boardReviewsCount > 0,
      targetTab: "board",
      hint: "Ruleaza Board Review sau simuleaza o etapa.",
    },
    {
      id: "season-cycle",
      title: "Season cycle",
      completed: input.seasonHistoryCount > 0,
      targetTab: "seasons",
      hint: "Simuleaza sezonul complet, apoi porneste sezon nou.",
    },
  ];

  const passCount = checks.filter((check) => check.status === "pass").length;
  const warningCount = checks.filter((check) => check.status === "warning").length;
  const failCount = checks.filter((check) => check.status === "fail").length;
  const score = Math.round(
    (checks.reduce((sum, check) => sum + statusWeight(check.status), 0) /
      (checks.length * 10)) *
      100,
  );
  const completedSmokeSteps = smokeSteps.filter((step) => step.completed).length;
  const debugFacts: DebugFact[] = [
    { label: "App version", value: input.appVersion },
    { label: "Supabase configured", value: input.supabaseConfigured ? "yes" : "no" },
    { label: "Authenticated", value: input.authenticated ? "yes" : "no" },
    { label: "User ID", value: input.userId || "not logged in" },
    { label: "Local save", value: input.localSaveAvailable ? "present" : "missing" },
    { label: "Cloud save signal", value: input.cloudSaveLikelyAvailable ? "seen" : "not tested" },
    { label: "Round", value: `${input.currentRound}/${input.maxRound}` },
    { label: "Results", value: String(input.resultsCount) },
    { label: "Last status", value: input.lastSaveStatus || "none" },
    { label: "Last error", value: input.lastError || "none" },
  ];

  const recommendedActions = checks
    .filter((check) => check.status !== "pass")
    .slice(0, 4)
    .map((check) => check.action);

  if (recommendedActions.length === 0) {
    recommendedActions.push("Trimite linkul Netlify la 1-2 testeri si cere smoke test complet.");
  }

  return {
    score,
    statusLabel: buildStatusLabel(failCount, warningCount),
    passCount,
    warningCount,
    failCount,
    checks,
    smokeSteps,
    completedSmokeSteps,
    totalSmokeSteps: smokeSteps.length,
    debugFacts,
    recommendedActions,
  };
}

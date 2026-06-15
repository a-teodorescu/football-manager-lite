export type GuideCategory = "start" | "squad" | "matchday" | "club" | "save";
export type ChecklistPriority = "high" | "medium" | "low";

export interface HelpArticle {
  id: string;
  category: GuideCategory;
  title: string;
  targetTab: string;
  summary: string;
  tips: string[];
}

export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  targetTab: string;
  completed: boolean;
  priority: ChecklistPriority;
}

export interface UiExperienceSummary {
  tasks: OnboardingTask[];
  completedCount: number;
  totalCount: number;
  completionPercent: number;
  nextTask?: OnboardingTask;
  helpArticles: HelpArticle[];
}

export interface BuildUiExperienceInput {
  hasSavedLocal: boolean;
  supabaseConfigured: boolean;
  resultsCount: number;
  trainingDoneThisRound: boolean;
  transferHistoryCount: number;
  hasAcademyProspects: boolean;
  boardReviewsCount: number;
  cupMatchesPlayed: number;
  seasonFinished: boolean;
}

const helpArticles: HelpArticle[] = [
  {
    id: "quick-start",
    category: "start",
    title: "Start rapid",
    targetTab: "dashboard",
    summary: "Cel mai sigur flow este: verifica Dashboard, alege tactica, fa training, apoi simuleaza etapa.",
    tips: [
      "Dashboard iti arata cele mai importante alerte inainte sa apesi Simuleaza etapa.",
      "Training se poate face o singura data pe runda, deci foloseste-l inainte de meci.",
      "Dupa meci, deschide Match pentru analiza si feedback tactic.",
    ],
  },
  {
    id: "save-load",
    category: "save",
    title: "Salvare si cloud",
    targetTab: "dashboard",
    summary: "Salvarea locala este rapida, iar Supabase pastreaza progresul pe user.id cand ai variabilele de mediu configurate.",
    tips: [
      "Salveaza local dupa schimbari mari: transferuri, training, cupa sau sezon nou.",
      "Supabase necesita VITE_SUPABASE_URL si VITE_SUPABASE_ANON_KEY in Netlify.",
      "Fiecare user are propria salvare prin Supabase Auth.",
    ],
  },
  {
    id: "matchday-flow",
    category: "matchday",
    title: "Ziua meciului",
    targetTab: "match",
    summary: "Preview-ul iti compara atacul, mijlocul, apararea si fitness-ul cu adversarul din runda curenta.",
    tips: [
      "Daca preview-ul arata risc la fitness, schimba training focus pe Fitness sau ajusteaza tactica.",
      "Feedback-ul post-meci explica de ce ai castigat sau pierdut controlul jocului.",
      "Man of the Match si ratingurile te ajuta sa identifici titularii importanti.",
    ],
  },
  {
    id: "squad-health",
    category: "squad",
    title: "Lot, fitness si contracte",
    targetTab: "medical",
    summary: "Fitness-ul, moralul, contractele si salariile influenteaza direct performanta si stabilitatea clubului.",
    tips: [
      "Evita sa fortezi jucatori accidentati sau sub 55 fitness.",
      "Contractele expirate pot cauza plecari la sezon nou.",
      "Bugetul salarial prea mare scade board confidence si cash balance.",
    ],
  },
  {
    id: "club-growth",
    category: "club",
    title: "Cresterea clubului",
    targetTab: "academy",
    summary: "Transferurile, scouting-ul, academia si cupa sunt metodele principale de dezvoltare pe termen mediu.",
    tips: [
      "Scouteaza free agents inainte sa cumperi jucatori scumpi.",
      "Academia produce prospecte mai bune cand cresti nivelul ei.",
      "Cupa aduce bani bonus, dar consuma fitness si poate genera accidentari.",
    ],
  },
  {
    id: "board-security",
    category: "club",
    title: "Board objectives si job security",
    targetTab: "board",
    summary: "Board-ul urmareste rezultate, cash, salarii, cupa si academie. Job security scade cand obiectivele sunt ratate.",
    tips: [
      "Fa board review dupa schimbari importante ca sa vezi impactul real.",
      "Daca sack risk creste, prioritizeaza rezultate si stabilizare financiara.",
      "Obiectivele se regenereaza la fiecare sezon nou.",
    ],
  },
];

function task(input: OnboardingTask): OnboardingTask {
  return input;
}

export function getHelpArticles(): HelpArticle[] {
  return helpArticles;
}

export function buildUiExperience(input: BuildUiExperienceInput): UiExperienceSummary {
  const tasks = [
    task({
      id: "save-local",
      title: "Fa prima salvare locala",
      description: "Pastreaza progresul in browser pentru userul autentificat.",
      targetTab: "dashboard",
      completed: input.hasSavedLocal,
      priority: "high",
    }),
    task({
      id: "first-training",
      title: "Ruleaza un training in runda curenta",
      description: "Training-ul poate creste lotul si poate pregati urmatorul meci.",
      targetTab: "training",
      completed: input.trainingDoneThisRound,
      priority: "high",
    }),
    task({
      id: "first-match",
      title: "Simuleaza primul meci",
      description: "Deblocheaza raport post-meci, ratinguri si feedback tactic.",
      targetTab: "match",
      completed: input.resultsCount > 0,
      priority: "high",
    }),
    task({
      id: "board-review",
      title: "Fa un board review",
      description: "Verifica obiectivele si riscul de demitere inainte sa avansezi prea mult.",
      targetTab: "board",
      completed: input.boardReviewsCount > 0,
      priority: "medium",
    }),
    task({
      id: "transfer-action",
      title: "Fa prima miscare pe piata",
      description: "Cumpara, vinde sau scouteaza ca sa imbunatatesti lotul.",
      targetTab: "transfers",
      completed: input.transferHistoryCount > 0,
      priority: "medium",
    }),
    task({
      id: "academy-scout",
      title: "Scouteaza academia",
      description: "Gaseste un prospect si incepe dezvoltarea clubului pe termen lung.",
      targetTab: "academy",
      completed: input.hasAcademyProspects,
      priority: "medium",
    }),
    task({
      id: "cup-round",
      title: "Joaca o runda de cupa",
      description: "Cupa aduce bonus financiar, dar consuma fitness.",
      targetTab: "cup",
      completed: input.cupMatchesPlayed > 0,
      priority: "low",
    }),
    task({
      id: "supabase-ready",
      title: "Pregateste salvarea in cloud",
      description: "Configureaza variabilele Supabase in Netlify pentru save/load online.",
      targetTab: "dashboard",
      completed: input.supabaseConfigured,
      priority: "low",
    }),
  ];

  const completedCount = tasks.filter((item) => item.completed).length;
  const totalCount = tasks.length;
  const completionPercent = Math.round((completedCount / totalCount) * 100);
  const nextTask = tasks.find((item) => !item.completed && item.priority === "high")
    ?? tasks.find((item) => !item.completed && item.priority === "medium")
    ?? tasks.find((item) => !item.completed);

  const contextualArticles = input.seasonFinished
    ? helpArticles
    : helpArticles.filter((article) => article.id !== "board-security" || input.boardReviewsCount > 0);

  return {
    tasks,
    completedCount,
    totalCount,
    completionPercent,
    nextTask,
    helpArticles: contextualArticles,
  };
}

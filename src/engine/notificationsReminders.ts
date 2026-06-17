export type BrowserNotificationPermission = "granted" | "denied" | "default" | "unsupported";
export type ReminderPriority = "low" | "medium" | "high";
export type ReminderType =
  | "save"
  | "training"
  | "matchday"
  | "medical"
  | "contracts"
  | "board"
  | "inbox";

export interface NotificationSettings {
  enabled: boolean;
  saveReminders: boolean;
  trainingReminders: boolean;
  matchdayReminders: boolean;
  medicalReminders: boolean;
  contractReminders: boolean;
  boardReminders: boolean;
  inboxReminders: boolean;
  quietMode: boolean;
}

export interface NotificationReminder {
  id: string;
  type: ReminderType;
  priority: ReminderPriority;
  title: string;
  summary: string;
  action: string;
  createdAt: string;
  read: boolean;
}

export interface NotificationCenterCheck {
  id: string;
  title: string;
  status: "pass" | "warning" | "fail";
  summary: string;
  action: string;
}

export interface NotificationCenterReport {
  score: number;
  statusLabel: string;
  permissionLabel: string;
  passCount: number;
  warningCount: number;
  failCount: number;
  unreadCount: number;
  highPriorityCount: number;
  nextBestAction: string;
  checks: NotificationCenterCheck[];
  reminders: NotificationReminder[];
  qaCommands: string[];
  releaseNotes: string[];
}

export function createInitialNotificationSettings(): NotificationSettings {
  return {
    enabled: false,
    saveReminders: true,
    trainingReminders: true,
    matchdayReminders: true,
    medicalReminders: true,
    contractReminders: true,
    boardReminders: true,
    inboxReminders: true,
    quietMode: false,
  };
}

function statusWeight(status: NotificationCenterCheck["status"]): number {
  if (status === "pass") return 1;
  if (status === "warning") return 0.55;
  return 0;
}

function permissionLabel(permission: BrowserNotificationPermission): string {
  if (permission === "granted") return "Browser notifications allowed";
  if (permission === "denied") return "Browser notifications blocked";
  if (permission === "unsupported") return "Notifications unsupported";
  return "Permission not requested";
}

function getStatusLabel(score: number, failCount: number, highPriorityCount: number): string {
  if (failCount === 0 && score >= 90 && highPriorityCount === 0) return "Notification Center ready";
  if (failCount === 0 && score >= 75) return "Notification Center ready with reminders";
  return "Notification setup needs attention";
}

function buildReminder(input: {
  type: ReminderType;
  priority: ReminderPriority;
  title: string;
  summary: string;
  action: string;
  seed: string;
}): NotificationReminder {
  return {
    id: `${input.type}-${input.seed}`,
    type: input.type,
    priority: input.priority,
    title: input.title,
    summary: input.summary,
    action: input.action,
    createdAt: new Date(0).toISOString(),
    read: false,
  };
}

function nextBestAction(reminders: NotificationReminder[], checks: NotificationCenterCheck[]): string {
  const fail = checks.find((item) => item.status === "fail");
  if (fail) return fail.action;
  const high = reminders.find((item) => item.priority === "high");
  if (high) return high.action;
  const medium = reminders.find((item) => item.priority === "medium");
  if (medium) return medium.action;
  return "Keep simulating rounds and use reminders as a lightweight manager assistant.";
}

export function buildNotificationCenterReport(input: {
  appVersion: string;
  saveSchemaVersion: number;
  settings: NotificationSettings;
  permissionState: BrowserNotificationPermission;
  serviceWorkerStatus: "registered" | "pending" | "unsupported" | "error";
  pwaInstalled: boolean;
  secureContext: boolean;
  authenticated: boolean;
  localSaveAvailable: boolean;
  cloudSaveLikelyAvailable: boolean;
  currentRound: number;
  maxRound: number;
  trainingDoneThisRound: boolean;
  hasSelectedFixture: boolean;
  lowFitnessPlayersCount: number;
  injuredPlayersCount: number;
  expiringContractsCount: number;
  expiredContractsCount: number;
  boardSackRiskPercent: number;
  inboxUnreadCount: number;
  lastSaveStatus: string;
}): NotificationCenterReport {
  const browserReady = input.permissionState !== "unsupported";
  const checks: NotificationCenterCheck[] = [
    {
      id: "browser-api",
      title: "Browser Notification API",
      status: browserReady ? "pass" : "fail",
      summary: browserReady
        ? `Notification API detected, current permission: ${input.permissionState}.`
        : "This browser does not expose the Notification API.",
      action: "Use a modern browser. Chrome/Edge Android provide the most reliable install + notification flow.",
    },
    {
      id: "permission",
      title: "Permission state",
      status: input.permissionState === "granted" ? "pass" : input.permissionState === "denied" ? "fail" : "warning",
      summary: permissionLabel(input.permissionState),
      action: "Press Request permission from the Notifications tab and allow notifications for the Netlify site.",
    },
    {
      id: "pwa-context",
      title: "PWA context",
      status: input.serviceWorkerStatus === "registered" && input.secureContext ? "pass" : input.secureContext ? "warning" : "fail",
      summary: input.pwaInstalled
        ? "The app is running in installed/standalone mode."
        : `Service worker status: ${input.serviceWorkerStatus}.`,
      action: "Deploy on Netlify HTTPS, reload once, then install the PWA from the browser menu.",
    },
    {
      id: "settings",
      title: "Reminder settings",
      status: input.settings.enabled ? "pass" : "warning",
      summary: input.settings.enabled
        ? "In-app reminders are enabled."
        : "In-app reminders are currently paused.",
      action: "Enable in-app reminders to use the Notification Center as a manager assistant.",
    },
    {
      id: "save-safety",
      title: "Save safety",
      status: input.localSaveAvailable || input.cloudSaveLikelyAvailable ? "pass" : "warning",
      summary: input.localSaveAvailable
        ? "Local save fallback is available."
        : input.cloudSaveLikelyAvailable
          ? "Cloud save appears available."
          : "No recent save signal detected.",
      action: "Use Save local or Save Supabase before testing notifications on mobile.",
    },
    {
      id: "schema",
      title: "Save schema",
      status: input.saveSchemaVersion >= 43 ? "pass" : "warning",
      summary: `Current schema: ${input.saveSchemaVersion}.`,
      action: "Keep save migration active so notification settings stay compatible with older saves.",
    },
  ];

  const seed = `s${input.saveSchemaVersion}-r${input.currentRound}`;
  const reminders: NotificationReminder[] = [];

  if (input.settings.saveReminders && !input.lastSaveStatus.toLowerCase().includes("salvat")) {
    reminders.push(buildReminder({
      type: "save",
      priority: input.authenticated ? "medium" : "low",
      title: "Save your career",
      summary: "No clear recent save confirmation was detected in this session.",
      action: input.authenticated ? "Save to Supabase or local storage before closing the app." : "Log in and save locally before leaving the session.",
      seed: `${seed}-save`,
    }));
  }

  if (input.settings.trainingReminders && !input.trainingDoneThisRound && input.currentRound <= input.maxRound) {
    reminders.push(buildReminder({
      type: "training",
      priority: "medium",
      title: "Training available",
      summary: `Round ${input.currentRound} training has not been completed yet.`,
      action: "Open Training and run one focused session before simulating the round.",
      seed: `${seed}-training`,
    }));
  }

  if (input.settings.matchdayReminders && input.hasSelectedFixture && input.currentRound <= input.maxRound) {
    reminders.push(buildReminder({
      type: "matchday",
      priority: "medium",
      title: "Matchday preparation",
      summary: "A user match is available in the current round.",
      action: "Review Match Preview, fitness warnings and Advanced Tactics before simulating.",
      seed: `${seed}-matchday`,
    }));
  }

  if (input.settings.medicalReminders && (input.injuredPlayersCount > 0 || input.lowFitnessPlayersCount >= 3)) {
    reminders.push(buildReminder({
      type: "medical",
      priority: input.injuredPlayersCount > 0 ? "high" : "medium",
      title: "Medical attention needed",
      summary: `${input.injuredPlayersCount} injured and ${input.lowFitnessPlayersCount} low-fitness players detected.`,
      action: "Open Fitness and rotate tired or injured players before the next match.",
      seed: `${seed}-medical-${input.injuredPlayersCount}-${input.lowFitnessPlayersCount}`,
    }));
  }

  if (input.settings.contractReminders && (input.expiredContractsCount > 0 || input.expiringContractsCount > 0)) {
    reminders.push(buildReminder({
      type: "contracts",
      priority: input.expiredContractsCount > 0 ? "high" : "medium",
      title: "Contract risk",
      summary: `${input.expiredContractsCount} expired and ${input.expiringContractsCount} expiring contracts need attention.`,
      action: "Open Contracts and renew key players before starting a new season.",
      seed: `${seed}-contracts-${input.expiredContractsCount}-${input.expiringContractsCount}`,
    }));
  }

  if (input.settings.boardReminders && input.boardSackRiskPercent >= 35) {
    reminders.push(buildReminder({
      type: "board",
      priority: input.boardSackRiskPercent >= 60 ? "high" : "medium",
      title: "Board pressure rising",
      summary: `Sack risk is ${input.boardSackRiskPercent}%.`,
      action: "Open Board and review objectives before making expensive decisions.",
      seed: `${seed}-board-${input.boardSackRiskPercent}`,
    }));
  }

  if (input.settings.inboxReminders && input.inboxUnreadCount > 0) {
    reminders.push(buildReminder({
      type: "inbox",
      priority: input.inboxUnreadCount >= 5 ? "medium" : "low",
      title: "Unread inbox messages",
      summary: `${input.inboxUnreadCount} unread manager messages are waiting.`,
      action: "Open Inbox to review board, finance, transfer and match updates.",
      seed: `${seed}-inbox-${input.inboxUnreadCount}`,
    }));
  }

  const activeReminders = input.settings.enabled && !input.settings.quietMode ? reminders : [];
  const passCount = checks.filter((item) => item.status === "pass").length;
  const warningCount = checks.filter((item) => item.status === "warning").length;
  const failCount = checks.filter((item) => item.status === "fail").length;
  const score = Math.round((checks.reduce((sum, item) => sum + statusWeight(item.status), 0) / checks.length) * 100);
  const highPriorityCount = activeReminders.filter((item) => item.priority === "high").length;

  return {
    score,
    statusLabel: getStatusLabel(score, failCount, highPriorityCount),
    permissionLabel: permissionLabel(input.permissionState),
    passCount,
    warningCount,
    failCount,
    unreadCount: activeReminders.length,
    highPriorityCount,
    nextBestAction: nextBestAction(activeReminders, checks),
    checks,
    reminders: activeReminders,
    qaCommands: [
      "npm run check",
      "npm run build",
      "npm run notifications",
      "npm run fullcheck",
    ],
    releaseNotes: [
      `v${input.appVersion} adds a lightweight Notification Center without external services.`,
      "Browser notifications are optional; in-app reminders work even when permission is not granted.",
      "The PWA/service worker layer remains simple and Netlify-compatible.",
      "Notification preferences are migration-safe through save schema 43.",
    ],
  };
}

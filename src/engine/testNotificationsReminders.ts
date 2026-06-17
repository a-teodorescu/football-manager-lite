import { buildNotificationCenterReport, createInitialNotificationSettings } from "./notificationsReminders";

const report = buildNotificationCenterReport({
  appVersion: "4.3.0",
  saveSchemaVersion: 43,
  settings: { ...createInitialNotificationSettings(), enabled: true },
  permissionState: "granted",
  serviceWorkerStatus: "registered",
  pwaInstalled: true,
  secureContext: true,
  authenticated: true,
  localSaveAvailable: true,
  cloudSaveLikelyAvailable: true,
  currentRound: 4,
  maxRound: 14,
  trainingDoneThisRound: false,
  hasSelectedFixture: true,
  lowFitnessPlayersCount: 4,
  injuredPlayersCount: 1,
  expiringContractsCount: 2,
  expiredContractsCount: 0,
  boardSackRiskPercent: 42,
  inboxUnreadCount: 3,
  lastSaveStatus: "",
});

if (report.score < 90) {
  throw new Error(`Expected notifications score >= 90, got ${report.score}`);
}

if (report.highPriorityCount === 0) {
  throw new Error("Expected at least one high-priority reminder when injuries are present.");
}

if (!report.qaCommands.includes("npm run notifications")) {
  throw new Error("Expected npm run notifications in QA commands.");
}

const disabledReport = buildNotificationCenterReport({
  appVersion: "4.3.0",
  saveSchemaVersion: 43,
  settings: createInitialNotificationSettings(),
  permissionState: "default",
  serviceWorkerStatus: "pending",
  pwaInstalled: false,
  secureContext: true,
  authenticated: false,
  localSaveAvailable: false,
  cloudSaveLikelyAvailable: false,
  currentRound: 1,
  maxRound: 14,
  trainingDoneThisRound: false,
  hasSelectedFixture: true,
  lowFitnessPlayersCount: 0,
  injuredPlayersCount: 0,
  expiringContractsCount: 0,
  expiredContractsCount: 0,
  boardSackRiskPercent: 0,
  inboxUnreadCount: 0,
  lastSaveStatus: "",
});

if (disabledReport.unreadCount !== 0) {
  throw new Error("Expected no active reminders when settings are disabled.");
}

if (disabledReport.warningCount === 0) {
  throw new Error("Expected warnings while permission has not been requested.");
}

console.log("Notifications reminders test OK", report.statusLabel, report.unreadCount);

import { buildPwaInstallReport } from "./pwaInstall";

const readyReport = buildPwaInstallReport({
  appVersion: "4.2.0",
  saveSchemaVersion: 42,
  manifestLinked: true,
  manifestHasIcons: true,
  manifestHasStandaloneDisplay: true,
  serviceWorkerSupported: true,
  serviceWorkerStatus: "registered",
  offlineFallbackAvailable: true,
  cacheStrategyVersioned: true,
  secureContext: true,
  netlifyCompatible: true,
  localSaveAvailable: true,
  installPromptAvailable: true,
  displayModeStandalone: false,
});

if (readyReport.score < 90) {
  throw new Error(`Expected PWA score >= 90, got ${readyReport.score}`);
}

if (readyReport.failCount !== 0) {
  throw new Error(`Expected no PWA blockers, got ${readyReport.failCount}`);
}

if (!readyReport.offlineAssets.includes("/offline.html")) {
  throw new Error("Expected offline fallback to be listed as cached asset.");
}

if (!readyReport.qaCommands.includes("npm run pwa")) {
  throw new Error("Expected npm run pwa in QA commands.");
}

const warningReport = buildPwaInstallReport({
  appVersion: "4.2.0",
  saveSchemaVersion: 42,
  manifestLinked: true,
  manifestHasIcons: true,
  manifestHasStandaloneDisplay: true,
  serviceWorkerSupported: true,
  serviceWorkerStatus: "pending",
  offlineFallbackAvailable: true,
  cacheStrategyVersioned: true,
  secureContext: false,
  netlifyCompatible: true,
  localSaveAvailable: true,
  installPromptAvailable: false,
  displayModeStandalone: false,
});

if (warningReport.warningCount === 0) {
  throw new Error("Expected warnings when service worker is pending and context is not secure.");
}

console.log("PWA install test OK", readyReport.statusLabel, readyReport.score);

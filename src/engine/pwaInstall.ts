export type PwaCheckStatus = "pass" | "warning" | "fail";

export interface PwaCheck {
  id: string;
  title: string;
  status: PwaCheckStatus;
  summary: string;
  action: string;
}

export interface PwaInstallReport {
  score: number;
  statusLabel: string;
  passCount: number;
  warningCount: number;
  failCount: number;
  installStatusLabel: string;
  checks: PwaCheck[];
  offlineAssets: string[];
  installSteps: string[];
  qaCommands: string[];
  releaseNotes: string[];
}

function scoreWeight(status: PwaCheckStatus): number {
  if (status === "pass") return 1;
  if (status === "warning") return 0.55;
  return 0;
}

function getStatusLabel(score: number, failCount: number, warningCount: number): string {
  if (failCount === 0 && score >= 90 && warningCount <= 1) return "PWA ready for mobile beta";
  if (failCount === 0 && score >= 75) return "PWA ready with minor warnings";
  return "PWA setup needs attention";
}

function getInstallStatusLabel(input: {
  displayModeStandalone: boolean;
  installPromptAvailable: boolean;
  serviceWorkerStatus: string;
}): string {
  if (input.displayModeStandalone) return "Installed / standalone mode";
  if (input.installPromptAvailable) return "Install prompt available";
  if (input.serviceWorkerStatus === "registered") return "Installable after browser checks";
  if (input.serviceWorkerStatus === "unsupported") return "Browser does not support service workers";
  return "Waiting for service worker";
}

export function buildPwaInstallReport(input: {
  appVersion: string;
  saveSchemaVersion: number;
  manifestLinked: boolean;
  manifestHasIcons: boolean;
  manifestHasStandaloneDisplay: boolean;
  serviceWorkerSupported: boolean;
  serviceWorkerStatus: "registered" | "pending" | "unsupported" | "error";
  offlineFallbackAvailable: boolean;
  cacheStrategyVersioned: boolean;
  secureContext: boolean;
  netlifyCompatible: boolean;
  localSaveAvailable: boolean;
  installPromptAvailable: boolean;
  displayModeStandalone: boolean;
}): PwaInstallReport {
  const checks: PwaCheck[] = [
    {
      id: "manifest",
      title: "Web app manifest",
      status: input.manifestLinked && input.manifestHasIcons && input.manifestHasStandaloneDisplay ? "pass" : "fail",
      summary: input.manifestLinked
        ? "Manifest is linked and describes the installable Football Manager Lite app."
        : "Manifest link is missing from index.html.",
      action: "Keep /manifest.webmanifest linked in index.html and include name, icons, theme_color and display standalone.",
    },
    {
      id: "service-worker",
      title: "Service worker",
      status: input.serviceWorkerSupported && input.serviceWorkerStatus === "registered" ? "pass" : input.serviceWorkerSupported ? "warning" : "fail",
      summary: input.serviceWorkerSupported
        ? `Service worker support detected, current status: ${input.serviceWorkerStatus}.`
        : "This browser does not support service workers.",
      action: "Deploy on HTTPS/Netlify and reload once after first install so the service worker can control the page.",
    },
    {
      id: "offline-fallback",
      title: "Offline fallback",
      status: input.offlineFallbackAvailable && input.cacheStrategyVersioned ? "pass" : input.offlineFallbackAvailable ? "warning" : "fail",
      summary: input.offlineFallbackAvailable
        ? "Offline fallback is available and can serve the app shell when the network is unavailable."
        : "Offline fallback file is missing.",
      action: "Keep /offline.html and versioned cache names in public/sw.js.",
    },
    {
      id: "secure-context",
      title: "Secure context",
      status: input.secureContext ? "pass" : "warning",
      summary: input.secureContext
        ? "The app is running in a secure context or localhost."
        : "Installability requires HTTPS in production.",
      action: "Use Netlify HTTPS for the public beta URL.",
    },
    {
      id: "install-state",
      title: "Install state",
      status: input.displayModeStandalone || input.installPromptAvailable || input.serviceWorkerStatus === "registered" ? "pass" : "warning",
      summary: getInstallStatusLabel(input),
      action: "On Chrome/Android use Add to Home Screen. On iOS use Share -> Add to Home Screen.",
    },
    {
      id: "save-safety",
      title: "Offline save safety",
      status: input.localSaveAvailable && input.saveSchemaVersion >= 42 ? "pass" : input.localSaveAvailable ? "warning" : "fail",
      summary: input.localSaveAvailable
        ? `Local save fallback is available with schema ${input.saveSchemaVersion}.`
        : "Local save fallback is not detected.",
      action: "Keep localStorage save as fallback when Supabase is offline or the user tests on mobile.",
    },
    {
      id: "netlify",
      title: "Netlify compatibility",
      status: input.netlifyCompatible ? "pass" : "fail",
      summary: input.netlifyCompatible
        ? "PWA files live in public/ and are copied by Vite into dist without custom build commands."
        : "PWA deploy requires extra Netlify configuration.",
      action: "Keep build command npm run build and publish directory dist.",
    },
  ];

  const passCount = checks.filter((item) => item.status === "pass").length;
  const warningCount = checks.filter((item) => item.status === "warning").length;
  const failCount = checks.filter((item) => item.status === "fail").length;
  const score = Math.round((checks.reduce((sum, item) => sum + scoreWeight(item.status), 0) / checks.length) * 100);

  return {
    score,
    statusLabel: getStatusLabel(score, failCount, warningCount),
    passCount,
    warningCount,
    failCount,
    installStatusLabel: getInstallStatusLabel(input),
    checks,
    offlineAssets: [
      "/",
      "/index.html",
      "/manifest.webmanifest",
      "/offline.html",
      "/icons/icon.svg",
    ],
    installSteps: [
      "Deploy pe Netlify cu HTTPS activ.",
      "Deschide aplicatia in Chrome/Android sau Safari/iOS.",
      "Logheaza-te si salveaza local macar o data.",
      "Alege Add to Home Screen / Install app.",
      "Inchide browserul si porneste jocul din iconita instalata.",
      "Testeaza reload cu internet oprit pentru fallback offline.",
    ],
    qaCommands: [
      "npm run check",
      "npm run build",
      "npm run pwa",
      "npm run fullcheck",
    ],
    releaseNotes: [
      `v${input.appVersion} adds PWA install support without adding dependencies.`,
      "Vite copies manifest, service worker, icons and offline fallback from public/ into dist.",
      "The JSON save fallback remains the safest offline/mobile save path.",
      "Supabase cloud save still requires internet, but local save and offline app shell work independently.",
    ],
  };
}

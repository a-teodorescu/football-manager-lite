import { spawnSync } from "node:child_process";

const commandScripts: string[] = [];
const moduleTests = [
  "testSimulation",
  "testSeason",
  "simulationBatchTest",
  "testPlayerStatus",
  "testTransferMarket",
  "testFinance",
  "testYouthAcademy",
  "testSeasonProgression",
  "testManagerDashboard",
  "testNavigationPolish",
  "testMatchExperience",
  "testContracts",
  "testScouting",
  "testCupCompetition",
  "testBoardObjectives",
  "testUiExperience",
  "testBetaReadiness",
  "testLiveDeployQa",
  "testAdminDebug",
  "testLeagueExpansion",
  "testNewsInbox",
  "testSponsorship",
  "testStadiumFacilities",
  "testPlayerIdentity",
  "testStaffCoaching",
  "testPlayerStatsAwards",
  "testGameBalance",
  "testMediaCenter",
  "testFanExperience",
  "testSaveMigration",
  "testStabilization",
  "testRealDatabaseMode",
  "testMultiplayerLeague",
  "testEuropeanCompetitions",
  "testPlayerPortraits",
  "testAdvancedTactics",
  "testLineupSelection",
  "testSubstitutions",
  "testSetPieces",
  "testOppositionScout",
  "testCareerTrophyRoom",
  "testBetaPolishRelease",
  "testPerformanceDeploy",
  "testPwaInstall",
  "testNotificationsReminders",
];

for (const script of commandScripts) {
  console.log(`\n==============================`);
  console.log(` npm run ${script}`);
  console.log(`==============================`);
  const result = spawnSync("npm", ["run", script], {
    stdio: "inherit",
    shell: process.platform === "win32",
    timeout: 300_000,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`npm run ${script} failed with exit code ${result.status}`);
  }
}

for (const moduleName of moduleTests) {
  console.log(`\n==============================`);
  console.log(` ${moduleName}`);
  console.log(`==============================`);
  await import(`./${moduleName}.ts?fullcheck=${Date.now()}`);
}

console.log(`\nFullcheck OK: ${moduleTests.length} engine checks passed. Run npm run check and npm run build separately for TypeScript/build validation.`);

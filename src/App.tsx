import { type FormEvent, useMemo, useState } from "react";
import { Fixture } from "./engine/fixtureGenerator";
import {
  FixtureResult,
  USER_TEAM_ID,
  createMockLeagueTeams,
  defaultUserTactic,
  getMaxRound,
  getTeamTactic,
  simulateRound,
} from "./engine/leagueSimulation";
import { MatchEventType, Tactic, Team } from "./engine/types";
import { calculateTeamStrength } from "./engine/teamStrength";
import { createInitialStandings, StandingRow } from "./engine/standings";
import { generateFixtures } from "./engine/fixtureGenerator";
import {
  ManagerSavePayload,
  clearLocalStorageSave,
  isSupabaseConfigured,
  loadFromLocalStorage,
  loadFromSupabase,
  saveToLocalStorage,
  saveToSupabase,
} from "./lib/saveService";
import {
  AuthSession,
  getStoredAuthSession,
  loginWithEmail,
  logoutFromSupabase,
  registerWithEmail,
} from "./lib/authService";

const USER_CLUB_NAME = "FC Bucuresti";

type Tab = "dashboard" | "squad" | "tactics" | "match" | "fixtures" | "standings";
type SaveStatus = string;
type AuthMode = "login" | "register";

interface GameState {
  seasonNumber: number;
  currentRound: number;
  userTactic: Tactic;
  teams: Team[];
  fixtures: Fixture[];
  results: FixtureResult[];
  standings: StandingRow[];
  selectedFixtureId?: string;
}

function createNewGame(seasonNumber = 1, userTactic: Tactic = defaultUserTactic): GameState {
  const teams = createMockLeagueTeams();
  const fixtures = generateFixtures(teams);

  return {
    seasonNumber,
    currentRound: 1,
    userTactic,
    teams,
    fixtures,
    results: [],
    standings: createInitialStandings(teams),
  };
}

function getEventClass(type: MatchEventType): string {
  if (type === "goal") return "event event-goal";
  if (type === "yellow_card") return "event event-card";
  if (type === "shot_on_target") return "event event-target";
  return "event";
}

function getRoundFixtures(fixtures: Fixture[], round: number): Fixture[] {
  return fixtures.filter((fixture) => fixture.round === round);
}

function getResultForFixture(results: FixtureResult[], fixtureId: string): FixtureResult | undefined {
  return results.find((item) => item.fixture.id === fixtureId);
}

function getUserTeam(teams: Team[]): Team {
  const team = teams.find((item) => item.id === USER_TEAM_ID);
  if (!team) throw new Error("User team not found.");
  return team;
}

function getSavePayload(game: GameState, managerId: string): ManagerSavePayload {
  return {
    version: 1,
    managerId,
    seasonNumber: game.seasonNumber,
    currentRound: game.currentRound,
    userTactic: game.userTactic,
    teams: game.teams,
    fixtures: game.fixtures,
    results: game.results,
    standings: game.standings,
    selectedFixtureId: game.selectedFixtureId,
    updatedAt: new Date().toISOString(),
  };
}

function gameFromPayload(payload: ManagerSavePayload): GameState {
  return {
    seasonNumber: payload.seasonNumber,
    currentRound: payload.currentRound,
    userTactic: payload.userTactic,
    teams: payload.teams,
    fixtures: payload.fixtures,
    results: payload.results,
    standings: payload.standings,
    selectedFixtureId: payload.selectedFixtureId,
  };
}

function getTacticLabel(tactic: Tactic): string {
  return `${tactic.formation} / ${tactic.mentality} / ${tactic.pressing}`;
}

function createInitialGameFromStoredSession(): GameState {
  const storedSession = getStoredAuthSession();
  if (!storedSession) return createNewGame();

  const localPayload = loadFromLocalStorage(storedSession.user.id);
  return localPayload ? gameFromPayload(localPayload) : createNewGame();
}

export default function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => getStoredAuthSession());
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [game, setGame] = useState<GameState>(() => createInitialGameFromStoredSession());
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("");
  const [errorMessage, setErrorMessage] = useState("");

  const maxRound = useMemo(() => getMaxRound(game.fixtures), [game.fixtures]);
  const seasonFinished = game.currentRound > maxRound;
  const userTeam = useMemo(() => getUserTeam(game.teams), [game.teams]);
  const userStanding = game.standings.find((row) => row.teamId === USER_TEAM_ID) ?? game.standings[0];
  const userClubPosition = game.standings.findIndex((row) => row.teamId === USER_TEAM_ID) + 1 || 1;
  const selectedMatch = game.selectedFixtureId
    ? getResultForFixture(game.results, game.selectedFixtureId)
    : game.results[game.results.length - 1];

  const importantEvents = selectedMatch?.result.events.filter((event) =>
    ["kickoff", "goal", "shot", "shot_on_target", "yellow_card", "full_time"].includes(event.type)
  ) ?? [];

  const teamStrength = useMemo(
    () => calculateTeamStrength(userTeam, game.userTactic),
    [userTeam, game.userTactic]
  );

  function setTemporaryStatus(status: SaveStatus) {
    setSaveStatus(status);
    setErrorMessage("");
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthStatus("");
    setAuthError("");

    try {
      if (authPassword.length < 6) {
        throw new Error("Parola trebuie sa aiba minimum 6 caractere.");
      }

      if (authMode === "register") {
        const result = await registerWithEmail(authEmail.trim(), authPassword);
        setAuthStatus(result.message);

        if (result.session) {
          setAuthSession(result.session);
          const localPayload = loadFromLocalStorage(result.session.user.id);
          setGame(localPayload ? gameFromPayload(localPayload) : createNewGame());
        }
      } else {
        const session = await loginWithEmail(authEmail.trim(), authPassword);
        setAuthSession(session);
        const localPayload = loadFromLocalStorage(session.user.id);
        setGame(localPayload ? gameFromPayload(localPayload) : createNewGame());
        setAuthStatus("Login reusit.");
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Autentificarea a esuat.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    if (!authSession) return;

    try {
      await logoutFromSupabase(authSession.accessToken);
    } catch {
      // Local session is cleared by logoutFromSupabase even if the network call fails.
    } finally {
      setAuthSession(null);
      setGame(createNewGame());
      setSaveStatus("");
      setErrorMessage("");
      setAuthPassword("");
      setActiveTab("dashboard");
    }
  }

  function simulateNextRound() {
    if (seasonFinished) return;

    setGame((previous) => {
      const simulation = simulateRound(
        previous.fixtures,
        previous.standings,
        previous.currentRound,
        previous.seasonNumber,
        previous.userTactic
      );

      const nextResults = [...previous.results, ...simulation.roundResults];
      const lastFixtureId = simulation.roundResults[simulation.roundResults.length - 1]?.fixture.id ?? previous.selectedFixtureId;

      return {
        ...previous,
        currentRound: previous.currentRound + 1,
        fixtures: simulation.updatedFixtures,
        results: nextResults,
        standings: simulation.updatedStandings,
        selectedFixtureId: lastFixtureId,
      };
    });

    setActiveTab("fixtures");
  }

  function simulateAllRemainingRounds() {
    if (seasonFinished) return;

    setGame((previous) => {
      let nextFixtures = previous.fixtures;
      let nextStandings = previous.standings;
      let nextResults = [...previous.results];
      let round = previous.currentRound;
      let lastFixtureId = previous.selectedFixtureId;
      const finalRound = getMaxRound(previous.fixtures);

      while (round <= finalRound) {
        const simulation = simulateRound(
          nextFixtures,
          nextStandings,
          round,
          previous.seasonNumber,
          previous.userTactic
        );

        nextFixtures = simulation.updatedFixtures;
        nextStandings = simulation.updatedStandings;
        nextResults = [...nextResults, ...simulation.roundResults];
        lastFixtureId = simulation.roundResults[simulation.roundResults.length - 1]?.fixture.id ?? lastFixtureId;
        round += 1;
      }

      return {
        ...previous,
        currentRound: finalRound + 1,
        fixtures: nextFixtures,
        results: nextResults,
        standings: nextStandings,
        selectedFixtureId: lastFixtureId,
      };
    });

    setActiveTab("standings");
  }

  function startNewSeason() {
    setGame((previous) => createNewGame(previous.seasonNumber + 1, previous.userTactic));
    setSaveStatus("");
    setErrorMessage("");
    setActiveTab("dashboard");
  }

  function updateTactic<Key extends keyof Tactic>(key: Key, value: Tactic[Key]) {
    setGame((previous) => ({
      ...previous,
      userTactic: {
        ...previous.userTactic,
        [key]: value,
      },
    }));
  }

  function openMatch(fixtureId: string) {
    const result = getResultForFixture(game.results, fixtureId);
    if (!result) return;

    setGame((previous) => ({ ...previous, selectedFixtureId: fixtureId }));
    setActiveTab("match");
  }

  function handleSaveLocal() {
    if (!authSession) {
      setErrorMessage("Trebuie sa fii logat ca sa salvezi progresul.");
      setSaveStatus("");
      return;
    }

    saveToLocalStorage(authSession.user.id, getSavePayload(game, authSession.user.id));
    setTemporaryStatus("Salvat local pentru contul tau.");
  }

  function handleLoadLocal() {
    if (!authSession) {
      setErrorMessage("Trebuie sa fii logat ca sa incarci progresul.");
      setSaveStatus("");
      return;
    }

    const payload = loadFromLocalStorage(authSession.user.id);
    if (!payload) {
      setErrorMessage("Nu exista inca o salvare locala pentru acest user.");
      setSaveStatus("");
      return;
    }

    setGame(gameFromPayload(payload));
    setTemporaryStatus("Progres incarcat local pentru contul tau.");
  }

  function handleClearLocal() {
    if (!authSession) {
      setErrorMessage("Trebuie sa fii logat ca sa stergi salvarea locala.");
      setSaveStatus("");
      return;
    }

    clearLocalStorageSave(authSession.user.id);
    setTemporaryStatus("Salvarea locala pentru contul tau a fost stearsa.");
  }

  async function handleSaveSupabase() {
    if (!authSession) {
      setErrorMessage("Trebuie sa fii logat ca sa salvezi in Supabase.");
      setSaveStatus("");
      return;
    }

    try {
      await saveToSupabase(authSession.user.id, authSession.accessToken, getSavePayload(game, authSession.user.id));
      setTemporaryStatus("Salvat in Supabase pentru contul tau.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nu am putut salva in Supabase.");
      setSaveStatus("");
    }
  }

  async function handleLoadSupabase() {
    if (!authSession) {
      setErrorMessage("Trebuie sa fii logat ca sa incarci din Supabase.");
      setSaveStatus("");
      return;
    }

    try {
      const payload = await loadFromSupabase(authSession.user.id, authSession.accessToken);
      if (!payload) {
        setErrorMessage("Nu exista salvare in Supabase pentru acest user.");
        setSaveStatus("");
        return;
      }

      setGame(gameFromPayload(payload));
      setTemporaryStatus("Progres incarcat din Supabase pentru contul tau.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nu am putut incarca din Supabase.");
      setSaveStatus("");
    }
  }

  const nextRoundFixtures = seasonFinished ? [] : getRoundFixtures(game.fixtures, game.currentRound);
  const champion = seasonFinished ? game.standings[0] : undefined;

  if (!authSession) {
    return (
      <main className="page auth-page">
        <section className="auth-shell panel">
          <div>
            <p className="eyebrow">Football Manager Lite</p>
            <h1>Manager Career</h1>
            <p className="description">
              Creeaza cont sau intra in cont ca salvarea sa fie separata pentru fiecare manager.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            <div className="auth-mode-switch" aria-label="Auth mode">
              <button
                type="button"
                className={authMode === "login" ? "tab active" : "tab"}
                onClick={() => {
                  setAuthMode("login");
                  setAuthStatus("");
                  setAuthError("");
                }}
              >
                Login
              </button>
              <button
                type="button"
                className={authMode === "register" ? "tab active" : "tab"}
                onClick={() => {
                  setAuthMode("register");
                  setAuthStatus("");
                  setAuthError("");
                }}
              >
                Register
              </button>
            </div>

            <label>
              Email
              <input
                type="email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                placeholder="manager@email.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                placeholder="minimum 6 caractere"
                required
                minLength={6}
              />
            </label>

            <button type="submit" disabled={!isSupabaseConfigured() || authLoading}>
              {authLoading ? "Se proceseaza..." : authMode === "login" ? "Login" : "Create account"}
            </button>

            <p className="muted small-note">
              Supabase Auth {isSupabaseConfigured() ? "este configurat" : "nu este configurat"}. Ai nevoie de VITE_SUPABASE_URL si VITE_SUPABASE_ANON_KEY in Netlify.
            </p>
            {authStatus && <p className="success-message">{authStatus}</p>}
            {authError && <p className="error-message">{authError}</p>}
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Football Manager Lite</p>
          <h1>Manager Career</h1>
          <p className="description">
            Acum jocul ruleaza etapa cu etapa in browser. Vezi lotul, setezi tactica, simulezi runde si salvezi progresul pe contul tau.
          </p>
        </div>
        <div className="hero-actions">
          <div className="user-panel">
            <span>Logat ca</span>
            <strong>{authSession.user.email ?? authSession.user.id}</strong>
          </div>
          <button onClick={simulateNextRound} disabled={seasonFinished}>Simuleaza etapa</button>
          <button className="secondary-button compact" onClick={startNewSeason}>Sezon nou</button>
          <button className="secondary-button compact" onClick={handleLogout}>Logout</button>
        </div>
      </section>

      <nav className="tabs" aria-label="Main navigation">
        <button className={activeTab === "dashboard" ? "tab active" : "tab"} onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        <button className={activeTab === "squad" ? "tab active" : "tab"} onClick={() => setActiveTab("squad")}>Squad</button>
        <button className={activeTab === "tactics" ? "tab active" : "tab"} onClick={() => setActiveTab("tactics")}>Tactics</button>
        <button className={activeTab === "match" ? "tab active" : "tab"} onClick={() => setActiveTab("match")}>Meci curent</button>
        <button className={activeTab === "fixtures" ? "tab active" : "tab"} onClick={() => setActiveTab("fixtures")}>Program</button>
        <button className={activeTab === "standings" ? "tab active" : "tab"} onClick={() => setActiveTab("standings")}>Clasament</button>
      </nav>

      {activeTab === "dashboard" && (
        <section className="dashboard-grid">
          <article className="panel highlight-panel">
            <span className="team-label">Sezon {game.seasonNumber}</span>
            <h2>Clubul tau: {USER_CLUB_NAME}</h2>
            <p className="muted">
              {seasonFinished
                ? `Sezon terminat. Campioana: ${champion?.teamName}.`
                : `Urmeaza runda ${game.currentRound} din ${maxRound}.`}
            </p>
            <div className="metric-grid">
              <div className="metric"><span>Pozitie</span><strong>{userClubPosition}</strong></div>
              <div className="metric"><span>Puncte</span><strong>{userStanding.points}</strong></div>
              <div className="metric"><span>Meciuri</span><strong>{userStanding.played}</strong></div>
              <div className="metric"><span>Golaveraj</span><strong>{userStanding.goalDifference}</strong></div>
            </div>
          </article>

          <article className="panel">
            <h3>Comenzi rapide</h3>
            <div className="button-stack">
              <button onClick={simulateNextRound} disabled={seasonFinished}>Simuleaza etapa {seasonFinished ? "" : game.currentRound}</button>
              <button className="secondary-button" onClick={simulateAllRemainingRounds} disabled={seasonFinished}>Simuleaza tot sezonul</button>
              <button className="secondary-button" onClick={() => setActiveTab("tactics")}>Schimba tactica</button>
            </div>
            <p className="muted small-note">Tactica activa: {getTacticLabel(game.userTactic)}</p>
          </article>

          <article className="panel wide-panel">
            <div className="section-header">
              <div>
                <h3>Urmatoarea etapa</h3>
                <p className="muted">Meciurile sunt simulate doar cand apesi pe etapa.</p>
              </div>
            </div>
            {seasonFinished ? (
              <p className="muted">Sezonul este complet. Poti incepe un sezon nou.</p>
            ) : (
              <div className="fixtures-list compact-fixtures">
                {nextRoundFixtures.map((fixture) => (
                  <div className="fixture-row static" key={fixture.id}>
                    <span>{fixture.homeTeam.name}</span>
                    <strong>vs</strong>
                    <span>{fixture.awayTeam.name}</span>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="panel wide-panel save-panel">
            <div className="section-header">
              <div>
                <h3>Salvare progres</h3>
                <p className="muted">Salvarea locala si salvarea Supabase sunt legate de user.id din Supabase Auth.</p>
              </div>
              <span className={isSupabaseConfigured() ? "status-pill ok" : "status-pill"}>
                Supabase {isSupabaseConfigured() ? "configurat" : "neconfigurat"}
              </span>
            </div>
            <div className="save-actions">
              <button onClick={handleSaveLocal}>Salveaza local</button>
              <button className="secondary-button" onClick={handleLoadLocal}>Incarca local</button>
              <button className="secondary-button" onClick={handleClearLocal}>Sterge salvarea locala</button>
              <button className="secondary-button" onClick={handleSaveSupabase}>Salveaza in Supabase</button>
              <button className="secondary-button" onClick={handleLoadSupabase}>Incarca din Supabase</button>
            </div>
            {saveStatus && <p className="success-message">{saveStatus}</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </article>
        </section>
      )}

      {activeTab === "squad" && (
        <section className="panel">
          <div className="section-header">
            <div>
              <h3>Squad - {userTeam.name}</h3>
              <p className="muted">Primul lot generat automat: 18 jucatori, impartiti pe posturi.</p>
            </div>
            <span className="status-pill ok">{userTeam.players.length} jucatori</span>
          </div>

          <div className="squad-summary">
            <div className="metric"><span>Reputatie</span><strong>{userTeam.reputation}</strong></div>
            <div className="metric"><span>Moral echipa</span><strong>{userTeam.morale}</strong></div>
            <div className="metric"><span>Overall engine</span><strong>{Math.round(teamStrength.overall)}</strong></div>
            <div className="metric"><span>Atac</span><strong>{Math.round(teamStrength.attack)}</strong></div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Jucator</th>
                  <th>Pos</th>
                  <th>Age</th>
                  <th>OVR</th>
                  <th>PAC</th>
                  <th>SHO</th>
                  <th>PAS</th>
                  <th>DEF</th>
                  <th>STA</th>
                  <th>MOR</th>
                  <th>FORM</th>
                </tr>
              </thead>
              <tbody>
                {userTeam.players.map((player) => (
                  <tr key={player.id}>
                    <td>{player.name}</td>
                    <td><strong>{player.position}</strong></td>
                    <td>{player.age}</td>
                    <td><strong>{player.overall}</strong></td>
                    <td>{player.pace}</td>
                    <td>{player.shooting}</td>
                    <td>{player.passing}</td>
                    <td>{player.defending}</td>
                    <td>{player.stamina}</td>
                    <td>{player.morale}</td>
                    <td>{player.form}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "tactics" && (
        <section className="dashboard-grid">
          <article className="panel highlight-panel">
            <span className="team-label">Tactica activa</span>
            <h2>{getTacticLabel(game.userTactic)}</h2>
            <p className="muted">Modificarile se aplica meciurilor viitoare ale clubului tau. Meciurile deja jucate nu se recalculeaza.</p>
            <div className="tactic-form">
              <label>
                Formation
                <select value={game.userTactic.formation} onChange={(event) => updateTactic("formation", event.target.value as Tactic["formation"])}>
                  <option value="4-4-2">4-4-2</option>
                  <option value="4-3-3">4-3-3</option>
                  <option value="4-2-3-1">4-2-3-1</option>
                  <option value="5-3-2">5-3-2</option>
                </select>
              </label>

              <label>
                Mentality
                <select value={game.userTactic.mentality} onChange={(event) => updateTactic("mentality", event.target.value as Tactic["mentality"])}>
                  <option value="defensive">defensive</option>
                  <option value="balanced">balanced</option>
                  <option value="attacking">attacking</option>
                </select>
              </label>

              <label>
                Pressing
                <select value={game.userTactic.pressing} onChange={(event) => updateTactic("pressing", event.target.value as Tactic["pressing"])}>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </label>
            </div>
          </article>

          <article className="panel">
            <h3>Impact engine</h3>
            <div className="stat-row"><span>Attack</span><strong>{teamStrength.attack.toFixed(1)}</strong></div>
            <div className="stat-row"><span>Midfield</span><strong>{teamStrength.midfield.toFixed(1)}</strong></div>
            <div className="stat-row"><span>Defense</span><strong>{teamStrength.defense.toFixed(1)}</strong></div>
            <div className="stat-row"><span>Goalkeeper</span><strong>{teamStrength.goalkeeper.toFixed(1)}</strong></div>
            <div className="stat-row"><span>Overall</span><strong>{teamStrength.overall.toFixed(1)}</strong></div>
            <p className="muted small-note">Exemplu: 4-3-3 + attacking creste atacul, dar scade apararea. 5-3-2 + defensive scade riscul, dar produce mai putine ocazii.</p>
          </article>
        </section>
      )}

      {activeTab === "match" && (
        selectedMatch ? (
          <>
            <section className="score-card">
              <div className="team-block">
                <span className="team-label">Home</span>
                <h2>{selectedMatch.result.homeTeamName}</h2>
                <p>{getTacticLabel(getTeamTactic(selectedMatch.fixture.homeTeam.id, game.userTactic))}</p>
              </div>

              <div className="score">
                <span>{selectedMatch.result.homeScore}</span>
                <small>-</small>
                <span>{selectedMatch.result.awayScore}</span>
              </div>

              <div className="team-block right">
                <span className="team-label">Away</span>
                <h2>{selectedMatch.result.awayTeamName}</h2>
                <p>{getTacticLabel(getTeamTactic(selectedMatch.fixture.awayTeam.id, game.userTactic))}</p>
              </div>
            </section>

            <section className="grid">
              <article className="panel">
                <h3>Statistici</h3>
                <div className="stat-row"><span>Runda</span><strong>{selectedMatch.fixture.round}</strong></div>
                <div className="stat-row"><span>Posesie</span><strong>{selectedMatch.result.stats.homePossession}% - {selectedMatch.result.stats.awayPossession}%</strong></div>
                <div className="stat-row"><span>Suturi</span><strong>{selectedMatch.result.stats.homeShots} - {selectedMatch.result.stats.awayShots}</strong></div>
                <div className="stat-row"><span>Suturi pe poarta</span><strong>{selectedMatch.result.stats.homeShotsOnTarget} - {selectedMatch.result.stats.awayShotsOnTarget}</strong></div>
                <div className="stat-row"><span>xG</span><strong>{selectedMatch.result.stats.homeXg} - {selectedMatch.result.stats.awayXg}</strong></div>
                <div className="stat-row"><span>Faulturi</span><strong>{selectedMatch.result.stats.homeFouls} - {selectedMatch.result.stats.awayFouls}</strong></div>
                <div className="stat-row"><span>Cartonase galbene</span><strong>{selectedMatch.result.stats.homeYellowCards} - {selectedMatch.result.stats.awayYellowCards}</strong></div>
                <div className="seed">Seed: {selectedMatch.result.seed}</div>
              </article>

              <article className="panel">
                <h3>Timeline</h3>
                <div className="timeline">
                  {importantEvents.map((event, index) => (
                    <div className={getEventClass(event.type)} key={`${event.minute}-${event.type}-${index}`}>
                      <span>{event.minute}'</span>
                      <p>{event.text}</p>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </>
        ) : (
          <section className="panel empty-state">
            <h3>Nu exista inca un meci jucat</h3>
            <p className="muted">Apasa pe “Simuleaza etapa” ca sa generezi primul raport de meci.</p>
            <button onClick={simulateNextRound}>Simuleaza etapa 1</button>
          </section>
        )
      )}

      {activeTab === "fixtures" && (
        <section className="panel">
          <div className="section-header">
            <div>
              <h3>Program si rezultate</h3>
              <p className="muted">8 echipe, 14 runde, 56 meciuri tur-retur. Rundele nejucate raman cu status programat.</p>
            </div>
            <button onClick={simulateNextRound} disabled={seasonFinished}>Simuleaza etapa</button>
          </div>

          <div className="fixtures-list">
            {Array.from({ length: maxRound }, (_, index) => index + 1).map((round) => (
              <div className="round-block" key={round}>
                <h4>Runda {round}</h4>
                {getRoundFixtures(game.fixtures, round).map((fixture) => {
                  const result = getResultForFixture(game.results, fixture.id);
                  return result ? (
                    <button className="fixture-row" key={fixture.id} onClick={() => openMatch(fixture.id)}>
                      <span>{result.result.homeTeamName}</span>
                      <strong>{result.result.homeScore} - {result.result.awayScore}</strong>
                      <span>{result.result.awayTeamName}</span>
                    </button>
                  ) : (
                    <div className="fixture-row static scheduled" key={fixture.id}>
                      <span>{fixture.homeTeam.name}</span>
                      <strong>vs</strong>
                      <span>{fixture.awayTeam.name}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "standings" && (
        <section className="panel">
          <div className="section-header">
            <div>
              <h3>Clasament sezon {game.seasonNumber}</h3>
              <p className="muted">Criterii: puncte, golaveraj, goluri marcate, victorii.</p>
            </div>
            <span className="status-pill ok">{seasonFinished ? "Final" : `Runda ${Math.max(game.currentRound - 1, 0)}/${maxRound}`}</span>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Echipa</th>
                  <th>M</th>
                  <th>V</th>
                  <th>E</th>
                  <th>I</th>
                  <th>GM</th>
                  <th>GP</th>
                  <th>GD</th>
                  <th>Pt</th>
                </tr>
              </thead>
              <tbody>
                {game.standings.map((row, index) => (
                  <tr className={row.teamId === USER_TEAM_ID ? "user-row" : undefined} key={row.teamId}>
                    <td>{index + 1}</td>
                    <td>{row.teamName}</td>
                    <td>{row.played}</td>
                    <td>{row.wins}</td>
                    <td>{row.draws}</td>
                    <td>{row.losses}</td>
                    <td>{row.goalsFor}</td>
                    <td>{row.goalsAgainst}</td>
                    <td>{row.goalDifference}</td>
                    <td><strong>{row.points}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

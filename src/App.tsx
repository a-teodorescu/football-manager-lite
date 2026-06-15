import { useMemo, useState } from "react";
import { FixtureResult, getTeamTactic, simulateFullSeason } from "./engine/leagueSimulation";
import { MatchEventType } from "./engine/types";

type Tab = "dashboard" | "match" | "fixtures" | "standings";

function getEventClass(type: MatchEventType): string {
  if (type === "goal") return "event event-goal";
  if (type === "yellow_card") return "event event-card";
  if (type === "shot_on_target") return "event event-target";
  return "event";
}

function getResultLabel(item: FixtureResult): string {
  return `${item.result.homeTeamName} ${item.result.homeScore} - ${item.result.awayScore} ${item.result.awayTeamName}`;
}

function getRoundResults(results: FixtureResult[], round: number): FixtureResult[] {
  return results.filter((item) => item.fixture.round === round);
}

export default function App() {
  const [seasonNumber, setSeasonNumber] = useState(1);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const season = useMemo(() => simulateFullSeason(seasonNumber), [seasonNumber]);
  const selectedMatch = season.results[selectedMatchIndex] ?? season.results[0];
  const rounds = Array.from(new Set(season.results.map((item) => item.fixture.round))).sort((a, b) => a - b);
  const champion = season.standings[0];
  const userClub = season.standings.find((row) => row.teamId === "team-1") ?? season.standings[0];
  const userClubPosition = season.standings.findIndex((row) => row.teamId === userClub.teamId) + 1;

  const importantEvents = selectedMatch.result.events.filter((event) =>
    ["kickoff", "goal", "shot", "shot_on_target", "yellow_card", "full_time"].includes(event.type)
  );

  function simulateNewSeason() {
    setSeasonNumber((value) => value + 1);
    setSelectedMatchIndex(0);
    setActiveTab("dashboard");
  }

  function openMatch(index: number) {
    setSelectedMatchIndex(index);
    setActiveTab("match");
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Football Manager Lite</p>
          <h1>League Simulator</h1>
          <p className="description">
            Prima versiune rulabila in browser cu liga, calendar, clasament si rapoarte de meci.
            Sezonul este simulat cu acelasi engine determinist TypeScript.
          </p>
        </div>
        <button onClick={simulateNewSeason}>Simuleaza sezon nou</button>
      </section>

      <nav className="tabs" aria-label="Main navigation">
        <button className={activeTab === "dashboard" ? "tab active" : "tab"} onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        <button className={activeTab === "match" ? "tab active" : "tab"} onClick={() => setActiveTab("match")}>Meci curent</button>
        <button className={activeTab === "fixtures" ? "tab active" : "tab"} onClick={() => setActiveTab("fixtures")}>Program</button>
        <button className={activeTab === "standings" ? "tab active" : "tab"} onClick={() => setActiveTab("standings")}>Clasament</button>
      </nav>

      {activeTab === "dashboard" && (
        <section className="dashboard-grid">
          <article className="panel highlight-panel">
            <span className="team-label">Sezon {seasonNumber}</span>
            <h2>Clubul tau: FC Bucuresti</h2>
            <p className="muted">
              Pozitie actuala: locul {userClubPosition}. Campioana sezonului simulat: {champion.teamName}.
            </p>
            <div className="metric-grid">
              <div className="metric"><span>Puncte</span><strong>{userClub.points}</strong></div>
              <div className="metric"><span>Meciuri</span><strong>{userClub.played}</strong></div>
              <div className="metric"><span>Golaveraj</span><strong>{userClub.goalDifference}</strong></div>
              <div className="metric"><span>Goluri</span><strong>{userClub.goalsFor}</strong></div>
            </div>
          </article>

          <article className="panel">
            <h3>Ultimul meci selectat</h3>
            <div className="mini-score">
              <span>{selectedMatch.result.homeTeamName}</span>
              <strong>{selectedMatch.result.homeScore} - {selectedMatch.result.awayScore}</strong>
              <span>{selectedMatch.result.awayTeamName}</span>
            </div>
            <p className="muted">Runda {selectedMatch.fixture.round} · Seed: {selectedMatch.result.seed}</p>
            <button className="secondary-button" onClick={() => setActiveTab("match")}>Vezi raportul meciului</button>
          </article>

          <article className="panel wide-panel">
            <h3>Top clasament</h3>
            <div className="standings-list">
              {season.standings.slice(0, 5).map((row, index) => (
                <div className="standing-card" key={row.teamId}>
                  <strong>{index + 1}</strong>
                  <span>{row.teamName}</span>
                  <b>{row.points}p</b>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {activeTab === "match" && (
        <>
          <section className="score-card">
            <div className="team-block">
              <span className="team-label">Home</span>
              <h2>{selectedMatch.result.homeTeamName}</h2>
              <p>
                {getTeamTactic(selectedMatch.fixture.homeTeam.id).formation} / {getTeamTactic(selectedMatch.fixture.homeTeam.id).mentality} / {getTeamTactic(selectedMatch.fixture.homeTeam.id).pressing}
              </p>
            </div>

            <div className="score">
              <span>{selectedMatch.result.homeScore}</span>
              <small>-</small>
              <span>{selectedMatch.result.awayScore}</span>
            </div>

            <div className="team-block right">
              <span className="team-label">Away</span>
              <h2>{selectedMatch.result.awayTeamName}</h2>
              <p>
                {getTeamTactic(selectedMatch.fixture.awayTeam.id).formation} / {getTeamTactic(selectedMatch.fixture.awayTeam.id).mentality} / {getTeamTactic(selectedMatch.fixture.awayTeam.id).pressing}
              </p>
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
      )}

      {activeTab === "fixtures" && (
        <section className="panel">
          <div className="section-header">
            <div>
              <h3>Program si rezultate</h3>
              <p className="muted">8 echipe, 14 runde, 56 meciuri tur-retur.</p>
            </div>
          </div>

          <div className="fixtures-list">
            {rounds.map((round) => (
              <div className="round-block" key={round}>
                <h4>Runda {round}</h4>
                {getRoundResults(season.results, round).map((item) => {
                  const globalIndex = season.results.findIndex((result) => result.fixture.id === item.fixture.id);
                  return (
                    <button className="fixture-row" key={item.fixture.id} onClick={() => openMatch(globalIndex)}>
                      <span>{item.result.homeTeamName}</span>
                      <strong>{item.result.homeScore} - {item.result.awayScore}</strong>
                      <span>{item.result.awayTeamName}</span>
                    </button>
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
              <h3>Clasament final sezon {seasonNumber}</h3>
              <p className="muted">Criterii: puncte, golaveraj, goluri marcate, victorii.</p>
            </div>
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
                {season.standings.map((row, index) => (
                  <tr className={row.teamId === "team-1" ? "user-row" : undefined} key={row.teamId}>
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

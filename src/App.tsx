import { useMemo, useState } from "react";
import { simulateMatch } from "./engine/matchEngine";
import { createMockTeam } from "./engine/mockData";
import { Tactic } from "./engine/types";

const homeTeam = createMockTeam("team-1", "FC Bucuresti", 74);
const awayTeam = createMockTeam("team-2", "Rapid Nord", 71);

const homeTactic: Tactic = {
  formation: "4-3-3",
  mentality: "attacking",
  pressing: "high",
};

const awayTactic: Tactic = {
  formation: "5-3-2",
  mentality: "defensive",
  pressing: "medium",
};

function getEventClass(type: string): string {
  if (type === "goal") return "event event-goal";
  if (type === "yellow_card") return "event event-card";
  if (type === "shot_on_target") return "event event-target";
  return "event";
}

export default function App() {
  const [matchNumber, setMatchNumber] = useState(1);

  const result = useMemo(() => {
    return simulateMatch({
      homeTeam,
      awayTeam,
      homeTactic,
      awayTactic,
      seed: `season_1_match_${matchNumber}`,
    });
  }, [matchNumber]);

  const importantEvents = result.events.filter((event) =>
    ["kickoff", "goal", "shot", "shot_on_target", "yellow_card", "full_time"].includes(event.type)
  );

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Football Manager Lite</p>
          <h1>Match Engine Prototype</h1>
          <p className="description">
            Prima versiune rulabila in browser. Simularea este determinista: acelasi seed produce acelasi rezultat.
          </p>
        </div>
        <button onClick={() => setMatchNumber((value) => value + 1)}>Simuleaza alt meci</button>
      </section>

      <section className="score-card">
        <div className="team-block">
          <span className="team-label">Home</span>
          <h2>{result.homeTeamName}</h2>
          <p>{homeTactic.formation} / {homeTactic.mentality} / {homeTactic.pressing}</p>
        </div>

        <div className="score">
          <span>{result.homeScore}</span>
          <small>-</small>
          <span>{result.awayScore}</span>
        </div>

        <div className="team-block right">
          <span className="team-label">Away</span>
          <h2>{result.awayTeamName}</h2>
          <p>{awayTactic.formation} / {awayTactic.mentality} / {awayTactic.pressing}</p>
        </div>
      </section>

      <section className="grid">
        <article className="panel">
          <h3>Statistici</h3>
          <div className="stat-row"><span>Posesie</span><strong>{result.stats.homePossession}% - {result.stats.awayPossession}%</strong></div>
          <div className="stat-row"><span>Suturi</span><strong>{result.stats.homeShots} - {result.stats.awayShots}</strong></div>
          <div className="stat-row"><span>Suturi pe poarta</span><strong>{result.stats.homeShotsOnTarget} - {result.stats.awayShotsOnTarget}</strong></div>
          <div className="stat-row"><span>xG</span><strong>{result.stats.homeXg} - {result.stats.awayXg}</strong></div>
          <div className="stat-row"><span>Faulturi</span><strong>{result.stats.homeFouls} - {result.stats.awayFouls}</strong></div>
          <div className="stat-row"><span>Cartonase galbene</span><strong>{result.stats.homeYellowCards} - {result.stats.awayYellowCards}</strong></div>
          <div className="seed">Seed: {result.seed}</div>
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
    </main>
  );
}

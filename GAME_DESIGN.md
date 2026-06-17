# Football Manager Lite - Game Design Document

## 1. Concept

Football Manager Lite este un joc browser/mobile de management fotbalistic in care utilizatorul controleaza un club, seteaza tactica, gestioneaza lotul si participa intr-un campionat simulat si intr-o cupa eliminatorie separata.

Scopul primei versiuni este construirea unui MVP simplu, dar jucabil, cu accent pe simularea meciurilor, clasament si progresia unui sezon.

---

## 2. MVP Scope

Prima versiune va include:

- autentificare utilizator;
- creare club;
- lot generat automat;
- alegere tactica;
- liga cu 8 echipe;
- calendar meciuri;
- simulare meci;
- raport meci;
- clasament;
- sezon simplu tur-retur;
- cupa eliminatorie cu sferturi, semifinale si finala.

Prima versiune NU va include:

- transferuri complexe cu AI bidding;
- contracte complexe;
- academie complexa cu echipe U19/U21;
- sponsori negociabili;
- multiplayer live;
- animatii 2D;
- aplicatie mobila nativa.

---

## 3. Player Attributes

Fiecare jucator are urmatoarele atribute:

| Attribute | Description |
|---|---|
| id | identificator unic |
| name | numele jucatorului |
| position | GK, DEF, MID, ATT |
| age | varsta |
| overall | valoarea generala |
| pace | viteza |
| shooting | finalizare |
| passing | pase |
| defending | aparare |
| stamina | rezistenta |
| morale | moral |
| form | forma recenta |
| fitness | conditia fizica actuala |
| injury | accidentare optionala cu runde ramase |
| wage | salariu estimat pe runda, exprimat in mii EUR |
| contract | contract optional: wage, sezon semnare, sezon expirare, happiness |

Valorile atributelor principale sunt intre 1 si 100.

---

## 4. Team

O echipa are:

- id;
- name;
- players;
- tactic;
- budget;
- reputation;
- morale.

Pentru MVP, lotul va avea 18 jucatori:

- 2 portari;
- 6 fundasi;
- 6 mijlocasi;
- 4 atacanti.

---

## 5. Training / Player Development

Managerul poate alege un focus de antrenament pentru club:

- balanced;
- attacking;
- defensive;
- fitness.

Reguli MVP:

- un singur antrenament este permis pe runda;
- efectele sunt deterministe pe baza sezonului, rundei, focusului si jucatorului;
- jucatorii tineri cresc mai usor;
- jucatorii peste 33 ani cresc mai greu;
- modificarile se aplica lotului si meciurilor viitoare.


---

## 5.1 Fitness, Morale & Injuries

Dupa fiecare runda simulata, sistemul actualizeaza determinist starea jucatorilor:

- fitness-ul scade dupa meci;
- fitness-ul se recupereaza partial la inceputul rundei urmatoare;
- jucatorii mai in varsta se recupereaza mai greu;
- moralul creste dupa victorii si scade dupa infrangeri;
- forma recenta se ajusteaza usor in functie de rezultat;
- riscul de accidentare creste cand fitness-ul este scazut;
- accidentarile dureaza 1-3 runde.

Fitness-ul si accidentarile influenteaza calculul de forta al echipei. Un jucator accidentat sau foarte obosit reduce eficienta compartimentului sau.

---


## 5.2 Transfers & Free Agents

Managerul are un buget de transfer si poate interactiona cu o piata simpla de free agents.

Reguli MVP:

- lista de free agents este generata determinist pe baza sezonului si rundei;
- fiecare jucator are valoare estimata si salariu estimat;
- cumpararea scade bugetul si adauga jucatorul in lot;
- vanzarea scoate jucatorul din lot si adauga bani in buget;
- lotul nu poate cobori sub 14 jucatori;
- echipa trebuie sa pastreze minimum 1 GK, 4 DEF, 4 MID si 2 ATT;
- transferurile se aplica imediat meciurilor viitoare;
- istoricul de transferuri se salveaza in payload per user.


## 5.3 Finance / Budget / Salaries

Clubul are un modul financiar simplu, separat de bugetul de transfer.

Reguli MVP:

- clubul are cash balance, wage budget si sponsor base;
- fiecare jucator are salariu estimat;
- dupa fiecare runda se genereaza un raport financiar;
- veniturile includ sponsor income, matchday income si bonus de rezultat;
- costurile includ wage bill-ul lotului;
- daca wage bill-ul depaseste wage budget-ul, clubul primeste o penalizare financiara;
- istoricul financiar se salveaza in payload per user.

---


## 5.4 Youth Academy

Managerul poate folosi o academie de juniori pentru a genera prospecte si a le promova in lotul mare.

Reguli MVP:

- academia are nivel intre 1 si 5;
- scouting-ul este determinist pe baza sezonului, rundei si nivelului academiei;
- fiecare junior are overall, potential, readiness si cost de promovare;
- promovarea adauga jucatorul in lot si scade cash-ul clubului;
- upgrade-ul academiei creste calitatea prospectilor viitori;
- academia are cost de intretinere per runda inclus in raportul financiar;
- istoricul academiei se salveaza in payload per user.


## 5.5 Multi-season Progression

Dupa terminarea unui sezon, managerul poate incepe sezonul urmator.

Reguli MVP:

- sezonul nou poate fi pornit doar dupa ce toate rundele au fost simulate;
- programul si clasamentul se reseteaza;
- lotul utilizatorului este pastrat;
- jucatorii imbatranesc cu un an;
- jucatorii tineri pot creste la overall;
- veteranii pot scadea usor;
- accidentarile sunt resetate in pre-sezon;
- clubul primeste prize money in functie de pozitia finala;
- transfer budget-ul si finance-ul sunt actualizate pentru noul sezon;
- se pastreaza un istoric al sezoanelor inchise in save payload.

---


## 5.6 Manager Dashboard

Dashboard-ul centralizeaza starea clubului intr-un ecran rapid pentru browser si mobile.

Reguli MVP:

- calculeaza un Manager Rating intre 1 si 100;
- board confidence este derivat din rating: Excellent, Stable, Sub observatie sau Critic;
- obiectivele monitorizate sunt performanta sportiva, starea lotului, controlul financiar si dezvoltarea clubului;
- alertele trimit managerul catre tabul relevant: Fitness, Training, Finance, Transfers sau Seasons;
- afiseaza key players dupa overall si valoare;
- genereaza actiuni recomandate pe baza fitness-ului, salariilor, bugetului, academiei si sezonului curent.

---

## 5.7 Matchday Experience & Tactical Feedback

Meciurile au acum un strat de prezentare si analiza pentru a face fiecare runda mai jucabila:

- match preview pentru meciul clubului din runda curenta;
- comparatie atac / mijloc / aparare / overall;
- fitness mediu si indisponibili pentru ambele echipe;
- recomandare tactica inainte de meci;
- raport post-meci cu scor la pauza, momentum si concluzie;
- Man of the Match si top 3 performers;
- feedback tactic generat din statistici, tactica, fitness si strength-uri.

Acest layer este determinist si nu schimba retroactiv rezultatele deja simulate.

---

## 5.8 Contracts & Squad Management

Jucatorii au contracte simple, compatibile cu salvarile vechi. Daca un jucator nu are contract in payload, jocul ii genereaza unul automat la load.

Reguli MVP:

- fiecare contract are wage, sezon de semnare, sezon de expirare si happiness;
- managerul poate reinnoi contractul platind un signing bonus;
- oferta este determinista si tine cont de varsta, overall, valoare, wage curent si urgenta contractuala;
- managerul poate elibera jucatori din contract, dar nu poate cobori sub lotul minim;
- la trecerea in sezon nou, contractele expirate pot pleca automat daca lotul minim ramane valid;
- istoricul contractual este salvat in payload per user.

---


## 6. Tactics

Tactica este compusa din:

### Formation

- 4-4-2
- 4-3-3
- 4-2-3-1
- 5-3-2

### Mentality

- defensive
- balanced
- attacking

### Pressing

- low
- medium
- high

Tactica modifica forta echipei in atac, mijloc si aparare.

---

## 7. Team Strength Calculation

Engine-ul calculeaza patru valori principale:

- attackStrength;
- midfieldStrength;
- defenseStrength;
- goalkeeperStrength.

attackStrength este influentat de:

- shooting;
- pace;
- passing;
- morale;
- form;
- mentalitate;
- formatie.

midfieldStrength este influentat de:

- passing;
- stamina;
- defending;
- shooting;
- morale;
- form.

defenseStrength este influentat de:

- defending;
- pace;
- stamina;
- morale;
- form;
- formatie;
- pressing.

---

## 8. Match Engine v1

Meciul este simulat minut cu minut.

Pentru fiecare minut:

1. se verifica daca apare o faza importanta;
2. se decide echipa care ataca;
3. se decide tipul fazei;
4. se decide rezultatul fazei;
5. se salveaza evenimentul;
6. se actualizeaza statisticile.

Tipuri de evenimente:

- kickoff;
- shot;
- shot_on_target;
- goal;
- foul;
- yellow_card;
- red_card;
- injury;
- full_time.

Pentru MVP, cele mai importante sunt:

- shot;
- shot_on_target;
- goal;
- yellow_card;
- full_time.

---

## 9. Deterministic Simulation

Fiecare meci foloseste un seed.

Exemplu:

```txt
season_1_match_12
```

Daca acelasi meci este rulat cu acelasi seed si aceleasi echipe, rezultatul trebuie sa fie acelasi.

Acest lucru ajuta la debug, testare si protectie anti-cheat.

---

## 10. Match Result Output

Engine-ul returneaza:

- scor final;
- statistici;
- evenimente;
- posesie;
- suturi;
- suturi pe poarta;
- cartonase;
- xG simplificat.

---

## 11. League System

Prima liga va avea 8 echipe.

Fiecare echipa joaca impotriva fiecarei echipe de doua ori:

- acasa;
- deplasare.

Total meciuri per echipa: 14.

Total meciuri campionat: 56.

Punctaj:

- victorie: 3 puncte;
- egal: 1 punct;
- infrangere: 0 puncte.

Criterii clasament:

1. puncte;
2. golaveraj;
3. goluri marcate;
4. victorii.

---

## 11. MVP Pages

Aplicatia va avea urmatoarele pagini:

### Dashboard

Overview club, urmatorul meci, pozitie in clasament.

### Squad

Lista de jucatori si atributele lor.

### Tactics

Alegere formatie, mentalitate si pressing.

### Fixtures

Lista meciurilor.

### Match Report

Scor, statistici si evenimente minut cu minut.

### Standings

Clasamentul ligii.

---

## 12. Long Term Features

Functii care pot fi adaugate dupa MVP:

- transferuri;
- scouting;
- youth academy;
- salarii;
- contracte;
- accidentari avansate;
- antrenamente;
- upgrade stadion;
- sponsori;
- competitii europene;
- multiplayer;
- marketplace;
- aplicatie mobila nativa;
- animatii 2D.

---

## 13. Current Browser MVP v0.4.0

The browser MVP now includes:

- Squad page for FC Bucuresti;
- Tactics page for formation, mentality and pressing;
- round-by-round simulation;
- standings updated after every round;
- fixtures that remain scheduled until simulated;
- local save/load with LocalStorage;
- optional Supabase save/load using a minimal `manager_saves` table.

The next major gameplay step is manual lineup selection.

---

## 13. Scouting System

Scouting-ul este un layer simplu peste Transfer Market. Managerul poate plati un cost mic din cash balance pentru a genera un raport determinist pentru un free agent.

Raportul include:

- fit tactic in functie de formatie, mentalitate si pressing;
- fit financiar in functie de transfer budget, cash balance si wage budget;
- nevoie in lot pentru postul jucatorului;
- potential estimat;
- readiness pentru lotul mare;
- risc scazut, mediu sau ridicat;
- recomandare: Must sign, Good option, Squad depth sau Avoid.

Rapoartele active si istoricul de scouting sunt salvate in payload per user. La sezon nou, rapoartele active se reseteaza, iar istoricul recent se pastreaza.

---

## Cup Competition

Cupa sezonului este o competitie eliminatorie separata de campionat. La inceputul fiecarui sezon se genereaza determinist un bracket cu 8 echipe:

- sferturi;
- semifinale;
- finala.

Fiecare runda de cupa simuleaza toate meciurile din bracket-ul curent. Daca un meci se termina egal, calificarea se decide determinist la penalty-uri. Runda de cupa aplica efecte de fitness, moral si accidentari asupra echipelor implicate, dar nu modifica programul sau clasamentul ligii.

Clubul utilizatorului poate primi bonus financiar in functie de parcurs:

- bonus mic la eliminare;
- bonus de calificare in rundele urmatoare;
- bonus mare pentru castigarea trofeului.

Starea cupei si istoricul rundelor sunt salvate in payload per user. La sezon nou se genereaza un bracket nou pentru noul sezon.


## 5.10 Board Objectives & Manager Job Security

Board-ul clubului seteaza obiective de sezon si monitorizeaza managerul.

Reguli MVP:

- fiecare sezon are obiective generate: pozitie in campionat, control salarial, cash balance, parcurs in cupa si nivel academie;
- obiectivele au weight diferit si produc un confidence score intre 1 si 100;
- job security se actualizeaza dupa runde de liga, dupa runde de cupa si la review manual;
- sack risk este derivat din job security si obiective ratate;
- manager reputation se pastreaza intre sezoane;
- la sezon nou se genereaza obiective noi, iar istoricul de review-uri ramane in payload;
- daca performanta este extrem de slaba la final de sezon, starea managerului poate ajunge la demitere.

---

## v1.9.0 - UI/UX Polish Major + Help Center

Added an in-game Help Center and onboarding checklist to make the prototype easier to test and play without external notes.

- New Help tab with short action-oriented guides.
- Dashboard onboarding panel with progress percentage and next recommended task.
- Checklist covers local save, training, first match, board review, transfers, academy, cup and Supabase setup.
- New deterministic UI experience helper in `src/engine/uiExperience.ts`.
- New verification script: `npm run ux`.


## v2.0.0 - Public Beta Readiness

Goal: make the prototype easier to validate before sharing it with external testers.

Design rules:

- The Beta tab does not change match results or career progression.
- Readiness checks are deterministic and derived from the current save state.
- A failed check means there is a release blocker or a broken gameplay assumption.
- A warning means the game can still run, but a tester may hit friction or an unclear flow.
- Netlify build remains unchanged: `npm run build`, publish `dist`, Node 20.

Readiness categories:

- Setup: Auth session, Supabase env vars and save/load safety.
- Gameplay: match loop, squad depth, finance health, board pressure and player availability.
- Stability: multi-season progression smoke test.
- Operations: onboarding, Help Center and deploy checklist.

This release marks the first package that can be treated as a beta candidate, not a finished commercial game.

## v2.1.0 — Live Deploy & QA Stabilization

The game now includes a dedicated live QA layer. This layer does not change the deterministic engine. It gives the manager/tester an operational dashboard for deployment checks: auth status, Supabase configuration, local save, cloud save signal, smoke test progress, reset actions, and bug-report debug facts.

Design goal: before adding more gameplay systems, make the existing feature set easy to deploy, verify, reset, and debug in a real Netlify + Supabase environment.


## v2.2.0 — Admin / Debug Panel

This release adds an operational Admin tab for live debugging. It does not modify gameplay simulation or deterministic match outcomes.

Admin checks are derived from the current save state and include auth context, save availability, payload size, squad integrity, league data integrity, season state, finance state, feature-history signals and last UI error.

The panel can validate the current save payload by restoring it in memory and can generate a JSON debug export. The export intentionally excludes passwords and Supabase access tokens, but it may include manager ID, email and save data, so it should be treated as private debugging material.


## v2.3.0 — Realistic League Expansion

This release gives the domestic league a stronger identity layer while keeping the deterministic match engine and fast Netlify build intact.

Each club now has optional metadata stored on the `Team` object: short name, city, stadium, country, colors, tactical style, ambition, rival team and fanbase. This metadata survives in the save payload because it is part of the existing teams array.

AI tactical behavior can now be derived from the club tactical style. Examples:

- high-press clubs use attacking 4-3-3 with high pressing;
- possession clubs use 4-2-3-1 balanced medium pressing;
- counter clubs use defensive 5-3-2;
- defensive clubs use low-block 5-3-2.

The user-controlled club still uses the tactic selected by the manager. The identity layer therefore improves AI diversity without taking control away from the player.

The new League tab summarizes:

- league name and total rounds;
- title-race story;
- pressure-zone story;
- fixture of the week;
- team identities;
- rivalries and intensity.

This is intentionally not a full database league editor yet. It is a deterministic in-code league profile that can later be moved to Supabase when the game needs editable or user-generated leagues.

## v2.4.0 — News Inbox / Manager Messages

- Adds a saved in-game Inbox tab for manager messages.
- Generates news for match rounds, finances, injuries, board reviews, transfers, scouting, academy actions, contracts, cup rounds and season transitions.
- Supports unread/read state, mark-all-read, category summary and manual club snapshot messages.
- Keeps the existing Supabase single-table save model by storing inbox messages inside the manager save payload.

## v2.5.0 — Sponsorships & Commercial Deals

The commercial layer adds deterministic sponsorship offers and active sponsor contracts. Sponsors can provide signing bonuses, base income per league round, win bonuses and objective bonuses. The system is saved inside the same per-user payload and does not require new Supabase tables.

---

## 10. Stadium & Facilities

Versiunea 2.6.0 adauga un layer de infrastructura: stadion, fan experience, training ground, medical center, academy campus si commercial zone. Upgrade-urile costa cash, cresc costul de mentenanta, dar pot creste veniturile si eficienta dezvoltarii clubului.


## v2.7.0 - Player Identity & Presentation

Adds richer player identity: nationality, flag, preferred foot, personality, player role, marketability, a new Players tab, and deterministic save-compatible normalization for older careers.

## v3.3.0 Combined Systems

The v3.3.0 package adds Staff, Records/Awards, Balance, Media, Fans and Difficulty as separate lightweight systems. They are saved in the same per-user payload and stay compatible with older saves through default normalization during load.

## v3.4.0 - Stabilizare & QA

Release-ul v3.4.0 adauga save migration, ErrorBoundary recovery, tabul Stability, re-exporturi de tipuri in `src/types`, scripturile `npm run migration`, `npm run stabilization` si comanda completa `npm run fullcheck`. Detalii in `STABILIZATION_QA.md`.



## v3.5.0 - Real Database Mode

Adds optional Supabase relational mirror tables while keeping `manager_saves.payload` as the canonical fallback. New files: `REAL_DATABASE_MODE.md`, `src/engine/realDatabaseMode.ts`, `src/lib/realDatabaseService.ts`, and `src/engine/testRealDatabaseMode.ts`. Run `npm run database` or `npm run fullcheck`.

## v3.6.0 — Multiplayer / Friends League

Friends League is snapshot-based, not real-time. Managers can compare careers through Supabase-owned league rooms and snapshot rows while the existing deterministic single-player simulation stays unchanged.


## v3.8.0 — Player Portraits / Pixel Avatars

Added deterministic SVG pixel portraits, a Portraits tab, portrait thumbnails in player identity views, and `npm run portraits`.

## v3.9.0 — Advanced Tactics

Advanced tactics extends the original formation / mentality / pressing layer. The new settings are deterministic and lightweight: tempo, width, risk, defensive line and attacking focus. They influence the advanced strength report and are also used by match simulation through the advanced team strength calculation.

## v4.0.0 — Beta Polish Release

- New Release tab with launch readiness score.
- Portable save JSON export.
- Copyable release notes for testers.
- `npm run release` added and included in `npm run fullcheck`.
- Save schema updated to `40`.
---

## v4.1 Performance & Deploy Optimization

This release does not add gameplay mechanics. It improves deploy quality after the v4.0 beta polish release by splitting the Vite production build into predictable chunks:

- React vendor runtime;
- deterministic engine modules;
- auth/save/database services;
- app shell.

The goal is to keep Netlify builds simple and remove the large single-bundle warning without adding dependencies or changing the game loop.



## v4.2.0 PWA / Offline Install

The game can now be installed as a lightweight browser/mobile PWA. The implementation uses a static manifest, service worker and offline fallback copied by Vite from `public/` into `dist/`. No external API, AI image generation or heavy dependency is required. Offline mode protects the app shell and local save path; Supabase Auth/cloud save remain online-only.


## v4.3.0 - Notifications & Reminders

Adds a Notification Center with browser permission status, in-app reminders, archived reminders in the save payload, and QA script `npm run notifications`.

# Football Manager Lite - Game Design Document

## 1. Concept

Football Manager Lite este un joc browser/mobile de management fotbalistic in care utilizatorul controleaza un club, seteaza tactica, gestioneaza lotul si participa intr-un campionat simulat.

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
- sezon simplu tur-retur.

Prima versiune NU va include:

- transferuri complexe;
- salarii;
- academie;
- sponsori;
- stadion upgradabil;
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

Valorile atributelor sunt intre 1 si 100.

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

## 5. Tactics

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

## 6. Team Strength Calculation

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

## 7. Match Engine v1

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

## 8. Deterministic Simulation

Fiecare meci foloseste un seed.

Exemplu:

```txt
season_1_match_12
```

Daca acelasi meci este rulat cu acelasi seed si aceleasi echipe, rezultatul trebuie sa fie acelasi.

Acest lucru ajuta la debug, testare si protectie anti-cheat.

---

## 9. Match Result Output

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

## 10. League System

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

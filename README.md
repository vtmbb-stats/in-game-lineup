# VT Men's Basketball — In-Game Lineup Tracker

Live lineup, possession, and shot tracking for Virginia Tech Men's Basketball. One person logs
the game on a laptop; the dashboards update live from a shared Firebase database.

## Pages

| Page | Who uses it | What it does |
|---|---|---|
| `index.html` | Bench operator (laptop) | Subs, shots by location, rebounds, free throws, turnovers, periods, garbage time, review/fixes |
| `live.html` | Staff during the game | Current five's +/-, bench minutes, live lineup table (optionally combined with earlier games) |
| `game.html` | After the game | Lineups, usage, and shot chart for any single game; choose which periods count (scrimmage formats) |
| `display.html` | Season review | Lineups, usage, and shot chart over a date range with filters |
| `combinations.html` | Season review | Guard pairs, big pairs, and all 3-man combos |

## Files

| File | Purpose |
|---|---|
| `config.js` | **Rosters, schedules, default starters, sign-in switch.** The only file to edit for a new season. |
| `play-log.js` | Engine for this season's game format: turns the play log into stints, possessions, shots, and usage. |
| `lineup-core.js` | Lineup math shared by every page, plus last season's (old format) engine. |
| `ui.jsx` | Shared React components (nav, tables, court, shot chart, usage table). |
| `firebase.js` | Firebase connection (database + sign-in). |
| `sw.js` | Offline support: keeps the pages and libraries cached so the input app opens with no internet. |
| `database.rules.json` | Database security rules (deploy only after the sign-in account exists). |

## New season checklist

1. In `config.js`, add a `SEASONS` entry (roster in display order, `defaultStarters`, schedule) and set `CURRENT_SEASON`.
2. Leave old seasons in place — their games need their own roster to display correctly.
3. Tag exhibitions (`exhibition: true`), ACC games (`conference: true`), and high-major opponents (`highMajor: true`).
   Wins and losses come from final scores.

## Logging a game (index.html)

- **Start game** → pick the starting five. Exhibitions can use **custom periods** (any length; End period can stop early,
  e.g. at the Under-4). Regular games are always two 20-minute halves plus 5-minute overtimes.
- **Our shots:** click the spot on the court → shooter (keys `1`–`5`) → **Make** (`M`) or **Miss** (`X`) → rebound
  **VT / Opponent / None** (`V` `O` `N`; "None" then asks whose ball, or time expired). `Q` logs a shot whose spot you didn't
  see; mark the spot later from Review. After a make, `A` adds an and-1.
- **Free throws** (`F` ours, `D` theirs): pick 1-and-1, 2, or 3, then enter each result as it's shot. Subs between free throws are fine.
- **Opponent:** Made 2 (`W`), Made 3 (`E`), Missed (`R`), and-1 (`S`), Turnover (`G`). **Our turnover:** `T` then the player.
- **Possessions count themselves** from makes, defensive rebounds, turnovers, last free throws, and time expired.
  **Didn't happen** (`U`) removes the last counted possession (e.g. the refs stopped play). `Ctrl+Z` undoes the last entry.
- **Subs** (`B`): pick who's out and in, type the clock (`1542` = 15:42). If you missed a sub, tick **I missed this sub**:
  the player goes in now and you place when he really entered from **Review**. **Fix time** corrects a sub's clock.
- **Offline:** everything saves on the laptop first and uploads automatically when there's a connection. You can open the
  page and log a whole game with no internet once the page has been opened online at least once.

## Usage rate

USG% = 100 × (FGA + 0.44 × FTA + TOV) × (Team MP / 5) / (MP × (Team FGA + 0.44 × Team FTA + Team TOV)),
with Team MP = 5 × the minutes in the selected periods/games.

## Hosting

Netlify deploys `main` automatically — every push goes live, so avoid pushing during a game.
For local testing: `npx http-server` in this folder (pages need http, not file://).

## Data

Firebase Realtime Database `vtmbb-gameday`, keyed by game date (`YYYY-MM-DD`):
- 2026-27 on (format 2): `game-info/<date>` (with `format: 2`, periods) and `events/<date>` — the ordered play log.
- 2025-26 (format 1): `game-info/`, `lineup-changes/`, `live-game/`, `current-stats/`.

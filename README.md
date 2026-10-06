# VT Men's Basketball — In-Game Lineup Tracker

Live lineup tracking for Virginia Tech Men's Basketball. One person enters subs, score, and
possession stats on the bench; the dashboards update live from a shared Firebase database.

## Pages

| Page | Who uses it | What it does |
|---|---|---|
| `index.html` | Bench operator | Starting lineups, subs (with game clock), score, possessions/rebounds/turnovers, garbage time, periods/OT |
| `live.html` | Staff during the game | Current five's +/-, bench minutes, live lineup table (optionally combined with earlier games) |
| `game.html` | After the game | Lineup table for any single game, any season |
| `display.html` | Season review | Lineups over a date range with filters (losses, high-major, ACC, garbage time, player filters) |
| `combinations.html` | Season review | Guard pairs, big pairs, and all 3-man combos |

## Files

| File | Purpose |
|---|---|
| `config.js` | **Rosters and schedules for every season.** The only file to edit for a new season. |
| `lineup-core.js` | All the lineup math (stints, minutes, +/-, rates, W/L). Shared by every page. |
| `ui.jsx` | Shared React components (nav, tables, player list, toggles). |
| `firebase.js` | Firebase connection, shared by every page. |

## New season checklist

1. In `config.js`, add a new entry to `SEASONS` with the roster and schedule (see the comments
   at the top of the file for the fields), and set `CURRENT_SEASON` to it.
2. Leave old seasons in place — their games need their own roster to display correctly.
3. Mark exhibitions (`exhibition: true`), ACC games (`conference: true`), and high-major
   opponents (`highMajor: true`). Wins and losses are worked out automatically from final scores.

## Running a game

1. Open `index.html`, pick the game, **Start Game**, choose the starting five.
2. Change players in the lineup dropdowns, then **Confirm All** and enter the game clock.
   The app warns if a time is earlier in the game than the previous entry (usually a typo).
3. **Mark Garbage Time** once the game is decided — dashboards can then exclude it.
4. **End 1st Half** → pick the 2nd-half five. **Start OT** if tied. **End Game** when final.
5. If the wifi drops, keep the page open: the red OFFLINE badge appears and changes sync when the
   connection returns. Reloading while offline loses unsynced changes.

## Hosting

The pages must be served over http(s) (e.g. GitHub Pages) — opening the HTML files directly from
disk won't load the shared files. For local testing: `npx http-server` in this folder.

## Data

Firebase Realtime Database `vtmbb-gameday`, keyed by game date (`YYYY-MM-DD`):
`game-info/`, `live-game/`, `lineup-changes/`, `current-stats/`.
Each entry in `lineup-changes/<date>` closes the stint that was on the floor and opens the next.

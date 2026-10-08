// Season configuration — the ONLY place rosters and schedules live.
//
// To set up a new season: add an entry to SEASONS and point CURRENT_SEASON at it.
// Old seasons stay here so their games keep resolving player names correctly.
//
// Player fields:
//   id        jersey number
//   name      full name — must match exactly what was recorded during games
//   position  'G', 'F', or 'C'. F and C count as bigs for the Big Combinations table.
//   flexBig   true for a forward who counts as a "big" only when at most one teammate listed
//             below him on this roster is on the floor with him (so roster order matters)
//
// The roster's ORDER is the display order everywhere (lineup names, player lists, dropdowns).
// defaultStarters: jersey numbers pre-filled when Start Game is pressed.
//
// Game fields:
//   date        'YYYY-MM-DD' — also the database key for the game, so never change it
//               once a game has been tracked
//   opponent    opponent name
//   site        'home' | 'away' | 'neutral' (optional, display only; default 'home')
//   exhibition  true = excluded from all season/multi-game stats
//   conference  true = included in "ACC Games" filters
//   highMajor   true = included in "High Major Only" filters
//   displayName optional override for the dropdown label
//
// Wins/losses are NOT listed here — they are computed from each game's final score.

(function () {
  const SEASONS = {
    '2026-27': {
      label: '2026-27',
      // Listed in display order (lineup names, player lists, and dropdowns all follow it).
      roster: [
        { id: 3,  name: 'Ben Hammond',       position: 'G' },
        { id: 0,  name: 'Jaylen Curry',      position: 'G' },
        { id: 11, name: 'James Caldarella',  position: 'G' },
        { id: 1,  name: 'Ethan Copeland',    position: 'G' },
        { id: 33, name: 'Butta Johnson',     position: 'G' },
        { id: 2,  name: 'Isaiah Elohim',     position: 'G' },
        { id: 4,  name: 'Ned Hull',          position: 'G' },
        { id: 8,  name: 'Eltayeb Eltayeb',   position: 'F', flexBig: true },
        { id: 10, name: 'Tyler Johnson',     position: 'F', flexBig: true },
        { id: 7,  name: 'Kuol Atak',         position: 'F', flexBig: true },
        { id: 5,  name: "Sin'Cere Jones",    position: 'F', flexBig: true },
        { id: 13, name: 'Amani Hansberry',   position: 'F' },
        { id: 31, name: 'Musa Sagnia',       position: 'F' },
        { id: 6,  name: 'Miles Heide',       position: 'C' },
        { id: 22, name: 'Solomon Davis',     position: 'C' }
      ],
      // Pre-filled when you press Start Game (jersey numbers). Can be changed in the picker.
      defaultStarters: [3, 2, 10, 13, 6], // Hammond, Elohim, T. Johnson, Hansberry, Heide
      schedule: [
        { date: '2026-10-06', opponent: 'Liberty', exhibition: true },
        { date: '2026-10-16', opponent: 'Wofford', site: 'away', exhibition: true },
        { date: '2026-10-24', opponent: 'Maryland', exhibition: true, highMajor: true },
        { date: '2026-11-03', opponent: 'Coppin State' },
        { date: '2026-11-05', opponent: 'Mercer' },
        { date: '2026-11-10', opponent: 'Iowa', site: 'away', highMajor: true },
        { date: '2026-11-13', opponent: "Mount St. Mary's" },
        { date: '2026-11-16', opponent: 'Richmond' },
        { date: '2026-11-20', opponent: 'Northwestern', site: 'away', highMajor: true },
        { date: '2026-11-22', opponent: 'Oklahoma State', site: 'away', highMajor: true },
        { date: '2026-11-27', opponent: 'Old Dominion' },
        { date: '2026-12-01', opponent: 'Ole Miss', highMajor: true },
        { date: '2026-12-05', opponent: 'West Virginia', site: 'away', highMajor: true },
        { date: '2026-12-10', opponent: 'UMES' },
        { date: '2026-12-13', opponent: 'Radford' },
        { date: '2026-12-19', opponent: 'UCF', site: 'away', highMajor: true },
        { date: '2026-12-21', opponent: 'VMI' },
        { date: '2026-12-30', opponent: 'Louisville', conference: true, highMajor: true },
        { date: '2027-01-02', opponent: 'Wake Forest', site: 'away', conference: true, highMajor: true },
        { date: '2027-01-06', opponent: 'Notre Dame', site: 'away', conference: true, highMajor: true },
        { date: '2027-01-09', opponent: 'Boston College', conference: true, highMajor: true },
        { date: '2027-01-16', opponent: 'SMU', conference: true, highMajor: true },
        { date: '2027-01-20', opponent: 'Florida State', site: 'away', conference: true, highMajor: true },
        { date: '2027-01-23', opponent: 'Miami', conference: true, highMajor: true },
        { date: '2027-01-27', opponent: 'Pittsburgh', site: 'away', conference: true, highMajor: true },
        { date: '2027-01-30', opponent: 'Virginia', site: 'away', conference: true, highMajor: true },
        { date: '2027-02-02', opponent: 'Clemson', conference: true, highMajor: true },
        { date: '2027-02-10', opponent: 'California', site: 'away', conference: true, highMajor: true },
        { date: '2027-02-13', opponent: 'Stanford', site: 'away', conference: true, highMajor: true },
        { date: '2027-02-17', opponent: 'NC State', conference: true, highMajor: true },
        { date: '2027-02-20', opponent: 'Boston College', site: 'away', conference: true, highMajor: true },
        { date: '2027-02-23', opponent: 'Virginia', conference: true, highMajor: true },
        { date: '2027-02-27', opponent: 'North Carolina', conference: true, highMajor: true },
        { date: '2027-03-03', opponent: 'Syracuse', conference: true, highMajor: true },
        { date: '2027-03-06', opponent: 'Georgia Tech', site: 'away', conference: true, highMajor: true }
      ]
    },

    '2025-26': {
      label: '2025-26',
      roster: [
        { id: 3,  name: 'Ben Hammond',      position: 'G' },
        { id: 17, name: 'Neo Avdalas',      position: 'G' },
        { id: 4,  name: 'Izaiah Pasha',     position: 'G' },
        { id: 7,  name: 'Brett Freeman',    position: 'G' },
        { id: 0,  name: 'Jailen Bedford',   position: 'G' },
        { id: 2,  name: 'Jaden Schutt',     position: 'G' },
        { id: 10, name: 'Tyler Johnson',    position: 'F', flexBig: true },
        { id: 5,  name: "Sin'Cere Jones",   position: 'F' },
        { id: 1,  name: 'Tobi Lawal',       position: 'F' },
        { id: 13, name: 'Amani Hansberry',  position: 'F' },
        { id: 22, name: 'Solomon Davis',    position: 'C' },
        { id: 32, name: 'Christian Gurdak', position: 'C' },
        { id: 77, name: 'Antonio Dorn',     position: 'C' }
      ],
      schedule: [
        { date: '2025-10-11', opponent: 'Seton Hall', exhibition: true },
        { date: '2025-10-25', opponent: 'Duquesne', exhibition: true },
        { date: '2025-11-03', opponent: 'Charleston Southern', displayName: 'Nov 4 vs Charleston Southern' },
        { date: '2025-11-08', opponent: 'Providence', highMajor: true },
        { date: '2025-11-12', opponent: "Saint Joseph's" },
        { date: '2025-11-16', opponent: 'Charlotte' },
        { date: '2025-11-19', opponent: 'Bryant' },
        { date: '2025-11-26', opponent: 'Colorado State' },
        { date: '2025-11-27', opponent: "Saint Mary's" },
        { date: '2025-11-28', opponent: 'VCU' },
        { date: '2025-12-02', opponent: 'South Carolina', highMajor: true },
        { date: '2025-12-06', opponent: 'George Mason' },
        { date: '2025-12-11', opponent: 'Western Carolina' },
        { date: '2025-12-14', opponent: 'Maryland-Eastern Shore' },
        { date: '2025-12-20', opponent: 'Elon' },
        { date: '2025-12-31', opponent: 'Virginia', conference: true, highMajor: true },
        { date: '2026-01-03', opponent: 'Wake Forest', conference: true, highMajor: true },
        { date: '2026-01-07', opponent: 'Stanford', conference: true, highMajor: true },
        { date: '2026-01-10', opponent: 'California', conference: true, highMajor: true },
        { date: '2026-01-14', opponent: 'SMU', conference: true, highMajor: true },
        { date: '2026-01-17', opponent: 'Notre Dame', conference: true, highMajor: true },
        { date: '2026-01-21', opponent: 'Syracuse', conference: true, highMajor: true },
        { date: '2026-01-24', opponent: 'Louisville', conference: true, highMajor: true },
        { date: '2026-01-27', opponent: 'Georgia Tech', conference: true, highMajor: true },
        { date: '2026-01-31', opponent: 'Duke', conference: true, highMajor: true },
        { date: '2026-02-07', opponent: 'NC State', conference: true, highMajor: true },
        { date: '2026-02-11', opponent: 'Clemson', conference: true, highMajor: true },
        { date: '2026-02-14', opponent: 'Florida State', conference: true, highMajor: true },
        { date: '2026-02-17', opponent: 'Miami', conference: true, highMajor: true },
        { date: '2026-02-21', opponent: 'Wake Forest', conference: true, highMajor: true },
        { date: '2026-02-28', opponent: 'North Carolina', conference: true, highMajor: true },
        { date: '2026-03-03', opponent: 'Boston College', conference: true, highMajor: true },
        { date: '2026-03-07', opponent: 'Virginia', conference: true, highMajor: true },
        { date: '2026-03-10', opponent: 'Wake Forest', conference: true, highMajor: true }
      ]
    }
  };

  const CURRENT_SEASON = '2026-27';

  // Sign-in for the input app (index.html) only — dashboards never require it.
  // Turn on only AFTER the account exists in Firebase (Authentication → Users) and you've
  // tested signing in. `email` is the shared account, so the tablet only asks for the password.
  const INPUT_SIGN_IN = {
    enabled: true,
    email: 'bakerd23@vt.edu'
  };

  // ESPN team IDs, used for logos. Add new opponents here (find the number in the team's
  // espn.com URL, e.g. espn.com/mens-college-basketball/team/_/id/2335/liberty-flames).
  const TEAM_IDS = {
    'Virginia Tech': 259, 'Liberty': 2335, 'Wofford': 2747, 'Maryland': 120, 'Coppin State': 2154, 'Mercer': 2382,
    'Iowa': 2294, "Mount St. Mary's": 116, 'Richmond': 257, 'Northwestern': 77, 'Oklahoma State': 197,
    'Old Dominion': 295, 'Ole Miss': 145, 'West Virginia': 277, 'UMES': 2379, 'Maryland-Eastern Shore': 2379,
    'Radford': 2515, 'UCF': 2116, 'VMI': 2678, 'Louisville': 97, 'Wake Forest': 154, 'Notre Dame': 87,
    'Boston College': 103, 'SMU': 2567, 'Florida State': 52, 'Miami': 2390, 'Pittsburgh': 221, 'Virginia': 258,
    'Clemson': 228, 'California': 25, 'Stanford': 24, 'NC State': 152, 'North Carolina': 153, 'Syracuse': 183,
    'Georgia Tech': 59, 'Seton Hall': 2550, 'Duquesne': 2184, 'Charleston Southern': 2127, 'Providence': 2507,
    "Saint Joseph's": 2603, 'Charlotte': 2429, 'Bryant': 2803, 'Colorado State': 36, "Saint Mary's": 2608,
    'VCU': 2670, 'South Carolina': 2579, 'George Mason': 2244, 'Western Carolina': 2717, 'Elon': 2210, 'Duke': 150
  };
  const teamLogo = (name) => TEAM_IDS[name] ? `https://a.espncdn.com/i/teamlogos/ncaa/500/${TEAM_IDS[name]}.png` : null;

  // ---- helpers (no need to edit below) ----

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const withDisplay = (seasonKey) => (g) => {
    const [, m, d] = g.date.split('-').map(Number);
    const prefix = g.site === 'away' ? 'at' : 'vs';
    return {
      ...g,
      season: seasonKey,
      displayName: g.displayName || `${MONTHS[m - 1]} ${d} ${prefix} ${g.opponent}`
    };
  };

  const seasonKeys = Object.keys(SEASONS).sort().reverse(); // newest first

  const gamesForSeason = (key) =>
    (SEASONS[key]?.schedule || []).map(withDisplay(key)).sort((a, b) => a.date.localeCompare(b.date));

  const allGames = () => seasonKeys.flatMap(gamesForSeason).sort((a, b) => a.date.localeCompare(b.date));

  const findGame = (date) => allGames().find(g => g.date === date) || null;

  const seasonForDate = (date) => findGame(date)?.season || null;

  const rosterForSeason = (key) => SEASONS[key]?.roster || [];

  const rosterForDate = (date) => rosterForSeason(seasonForDate(date) || CURRENT_SEASON);

  window.VT_CONFIG = {
    SEASONS,
    CURRENT_SEASON,
    INPUT_SIGN_IN,
    TEAM_IDS,
    teamLogo,
    seasonKeys,
    gamesForSeason,
    allGames,
    findGame,
    seasonForDate,
    rosterForSeason,
    rosterForDate
  };
})();

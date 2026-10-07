// Shared lineup math used by every page. Plain JS (no JSX) so it loads with a normal <script>.
//
// Data model recap — each game's `lineup-changes/<date>` is a list of records:
//   { gameTime: '15:42 1st', vtScore, oppScore, changes, previousLineup, newLineup,
//     half, completedSegmentStats: { vt: {...}, opponent: {...} }, garbageTime? }
// A record closes the stint that was on the floor before it and opens the next one.
// "Start of ..." records only set the lineup for the new period.

(function () {
    const EMPTY_STATS = () => ({
        vt: { possessions: 0, offensiveRebounds: 0, defensiveRebounds: 0, turnovers: 0 },
        opponent: { possessions: 0, offensiveRebounds: 0, defensiveRebounds: 0, turnovers: 0 }
    });

    // half: 1 = 1st, 2 = 2nd, 3 = OT, 4 = 2OT, ...
    const periodLabel = (half) => half === 1 ? '1st' : half === 2 ? '2nd' : half === 3 ? 'OT' : `${half - 2}OT`;
    const periodLength = (half) => half <= 2 ? 20 * 60 : 5 * 60;

    // '15:42 1st' -> seconds elapsed since tip-off. Handles any number of overtimes. null if unparseable.
    const parseGameTime = (str) => {
        if (!str) return null;
        const m = String(str).match(/(\d+):(\d{2})\s+(1st|2nd|(\d*)OT)\b/);
        if (!m) return null;
        const left = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
        if (m[3] === '1st') return 20 * 60 - left;
        if (m[3] === '2nd') return 40 * 60 - left;
        const ot = m[4] ? parseInt(m[4], 10) : 1;
        return 40 * 60 + ot * 5 * 60 - left;
    };

    const formatSeconds = (s) => {
        if (s === null || s === undefined) return '--:--';
        const t = Math.max(0, Math.round(s));
        return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    };

    const namesToIds = (str, roster) =>
        (str ? str.split(', ') : []).map(name => roster.find(p => p.name === name)?.id).filter(id => id !== undefined);

    const idsToNames = (ids, roster) => ids.map(id => roster.find(p => p.id === id)?.name).join(', ');

    const lastName = (id, roster) => (roster.find(p => p.id === id)?.name || '').split(' ').pop();

    // Firebase returns lists as arrays or objects (push keys). Normalize, keeping insertion order.
    const historyList = (raw) => (!raw ? [] : Array.isArray(raw) ? raw.filter(Boolean) : Object.values(raw));

    // Chronological, stable: records at the same clock time keep the order they were entered.
    const sortHistory = (history) =>
        history
            .map((r, i) => ({ r, i, t: parseGameTime(r.gameTime || r.timestamp) ?? 0 }))
            .sort((a, b) => a.t - b.t || a.i - b.i)
            .map(x => x.r);

    const hasStats = (stats) =>
        ['vt', 'opponent'].some(side => Object.values(stats?.[side] || {}).some(v => v));

    /**
     * Turn a game's change log into stints ("segments") of one five-man unit.
     *
     * opts.startingLineup  names string, used if the first record lacks previousLineup
     * opts.current         { lineup, vtScore, oppScore, stats } — adds the open, still-running
     *                      stint (endTime 'Current') for live views
     *
     * Returns { segments, warnings }. Stints are never dropped silently: anything that can't
     * be used produces a warning string.
     */
    const buildSegments = (rawHistory, roster, opts = {}) => {
        const history = sortHistory(historyList(rawHistory));
        const segments = [];
        const warnings = [];

        let lineupStr = null;
        let prev = { time: '20:00 1st', vt: 0, opp: 0 };
        let garbage = false;

        const pushSegment = (lineup, endTime, endVt, endOpp, stats, extra = {}) => {
            const ids = namesToIds(lineup, roster);
            const startT = parseGameTime(prev.time);
            const endT = endTime === 'Current' ? null : parseGameTime(endTime);
            let seconds = endT === null || startT === null ? null : endT - startT;
            const vtPts = (endVt || 0) - (prev.vt || 0);
            const oppPts = (endOpp || 0) - (prev.opp || 0);

            if (seconds !== null && seconds < 0) {
                warnings.push(`Clock goes backwards from ${prev.time} to ${endTime}: check the time entered for that sub. Its minutes were not counted.`);
                seconds = 0;
            }
            // Same-clock subs (e.g. around free throws): keep them if anything happened.
            if (seconds === 0 && vtPts === 0 && oppPts === 0 && !hasStats(stats) && !extra.isCurrent) return;

            if (ids.length !== 5) {
                warnings.push(`Stint ${prev.time} → ${endTime} skipped: lineup "${lineup || '(none)'}" doesn't match 5 roster players.`);
                return;
            }
            segments.push({
                lineup: ids,
                startTime: prev.time,
                endTime,
                seconds,
                startScore: { vt: prev.vt || 0, opp: prev.opp || 0 },
                endScore: { vt: endVt || 0, opp: endOpp || 0 },
                stats: stats || EMPTY_STATS(),
                isGarbageTime: garbage,
                ...extra
            });
        };

        history.forEach((r, i) => {
            const time = r.gameTime || r.timestamp;
            if ((r.changes || '').startsWith('Start of')) {
                lineupStr = r.newLineup || lineupStr;
                prev = { time, vt: r.vtScore, opp: r.oppScore };
                if (r.garbageTime) garbage = true;
                return;
            }
            const onFloor = lineupStr || r.previousLineup || opts.startingLineup;
            pushSegment(onFloor, time, r.vtScore, r.oppScore, r.completedSegmentStats);
            lineupStr = r.newLineup || onFloor;
            prev = { time, vt: r.vtScore, opp: r.oppScore };
            if (r.garbageTime) garbage = true;
        });

        if (opts.current) {
            const c = opts.current;
            pushSegment(c.lineup || lineupStr || opts.startingLineup, 'Current', c.vtScore, c.oppScore, c.stats, { isCurrent: true });
        }

        return { segments, warnings };
    };

    const sumStats = (into, stats) => {
        const v = stats?.vt || {};
        const o = stats?.opponent || {};
        into.possessions += v.possessions || 0;
        into.offReb += v.offensiveRebounds || 0;
        into.defReb += v.defensiveRebounds || 0;
        into.turnovers += v.turnovers || 0;
        into.oppPossessions += o.possessions || 0;
        into.oppOffReb += o.offensiveRebounds || 0;
        into.oppDefReb += o.defensiveRebounds || 0;
        into.oppTurnovers += o.turnovers || 0;
    };

    const emptyTotals = (players) => ({
        players, segments: 0, seconds: 0, hasCurrent: false, plusMinus: 0, points: 0, oppPoints: 0,
        possessions: 0, offReb: 0, defReb: 0, turnovers: 0,
        oppPossessions: 0, oppOffReb: 0, oppDefReb: 0, oppTurnovers: 0
    });

    const addSegment = (t, seg) => {
        const vt = seg.endScore.vt - seg.startScore.vt;
        const opp = seg.endScore.opp - seg.startScore.opp;
        t.segments += 1;
        t.plusMinus += vt - opp;
        t.points += vt;
        t.oppPoints += opp;
        if (seg.seconds !== null) t.seconds += seg.seconds;
        if (seg.isCurrent) t.hasCurrent = true;
        sumStats(t, seg.stats);
    };

    const ratio = (num, den, scale = 1) => (den > 0 ? (num / den) * scale : null);

    // Rates are null (shown as "—") when there's nothing to divide by, instead of pretending
    // the denominator was 1.
    const withRates = (t) => ({
        ...t,
        pointsPerPossession: ratio(t.points, t.possessions),
        defPointsPerPossession: ratio(t.oppPoints, t.oppPossessions),
        offRebRate: ratio(t.offReb, t.offReb + t.oppDefReb, 100),
        defRebRate: ratio(t.defReb, t.defReb + t.oppOffReb, 100),
        turnoverRate: ratio(t.turnovers, t.possessions, 100),
        defTurnoverRate: ratio(t.oppTurnovers, t.oppPossessions, 100),
        pmPerMinute: t.seconds > 0 ? t.plusMinus / (t.seconds / 60) : null
    });

    // Group segments into five-man lineups.
    const aggregateLineups = (segments, roster) => {
        const map = new Map();
        segments.forEach(seg => {
            const key = [...seg.lineup].sort((a, b) => a - b).join('-');
            if (!map.has(key)) map.set(key, emptyTotals(seg.lineup));
            addSegment(map.get(key), seg);
        });
        return [...map.entries()].map(([key, t]) => {
            const ordered = [...t.players].sort(
                (a, b) => roster.findIndex(p => p.id === a) - roster.findIndex(p => p.id === b)
            );
            return {
                ...withRates(t),
                id: key,
                playerIds: t.players,
                names: ordered.map(id => lastName(id, roster)).join(', ')
            };
        });
    };

    // Combine already-aggregated lineup rows (e.g. baseline games + live game) by lineup id.
    const mergeLineupRows = (...lists) => {
        const map = new Map();
        lists.flat().forEach(row => {
            if (!map.has(row.id)) { map.set(row.id, { ...row }); return; }
            const t = map.get(row.id);
            ['segments', 'seconds', 'plusMinus', 'points', 'oppPoints', 'possessions', 'offReb', 'defReb',
             'turnovers', 'oppPossessions', 'oppOffReb', 'oppDefReb', 'oppTurnovers'].forEach(k => { t[k] += row[k]; });
            t.hasCurrent = t.hasCurrent || row.hasCurrent;
        });
        return [...map.values()].map(withRates);
    };

    // Per-player minutes and +/- from segments. Open (current) stints add no minutes.
    const playerTotals = (segments) => {
        const out = {};
        segments.forEach(seg => {
            const pm = (seg.endScore.vt - seg.startScore.vt) - (seg.endScore.opp - seg.startScore.opp);
            seg.lineup.forEach(id => {
                if (!out[id]) out[id] = { seconds: 0, plusMinus: 0 };
                out[id].plusMinus += pm;
                if (seg.seconds !== null) out[id].seconds += seg.seconds;
            });
        });
        return out;
    };

    // Totals for an arbitrary group of players being on the floor together.
    // `include(lineup)` decides whether a segment counts (defaults to "all players present").
    const groupTotals = (segments, players, include) => {
        const t = emptyTotals(players);
        segments.forEach(seg => {
            const ok = include ? include(seg.lineup) : players.every(p => seg.lineup.includes(p));
            if (ok) addSegment(t, seg);
        });
        return withRates(t);
    };

    // Every k-player combination that appeared, with totals.
    const comboTotals = (segments, k) => {
        const map = new Map();
        const choose = (arr, k, start = 0, acc = [], out = []) => {
            if (acc.length === k) { out.push([...acc]); return out; }
            for (let i = start; i < arr.length; i++) { acc.push(arr[i]); choose(arr, k, i + 1, acc, out); acc.pop(); }
            return out;
        };
        segments.forEach(seg => {
            choose([...seg.lineup].sort((a, b) => a - b), k).forEach(combo => {
                const key = combo.join('-');
                if (!map.has(key)) map.set(key, emptyTotals(combo));
                addSegment(map.get(key), seg);
            });
        });
        return [...map.values()].map(withRates);
    };

    // Is this player playing as a big in this five? Guards: never. F/C without flexBig: always.
    // A flexBig forward is a big unless two or more teammates listed below him on the roster are on the floor.
    // (e.g. Atak with T. Johnson and Hansberry: only Hansberry is below him, so he's a big;
    //  Atak with Jones and Sagnia: two below him, so he's not; Jones with nobody below him is playing the 5, so he is).
    const isBigInLineup = (id, lineup, roster) => {
        const p = roster.find(r => r.id === id);
        if (!p || p.position === 'G') return false;
        if (!p.flexBig) return true;
        const idx = roster.indexOf(p);
        return lineup.filter(other => other !== id && roster.findIndex(r => r.id === other) > idx).length <= 1;
    };

    // Final result from the log: 'W', 'L', or null if the game isn't finished.
    const gameResult = (rawHistory, gameInfo) => {
        if (gameInfo && !gameInfo.ended) return null;
        const end = historyList(rawHistory).find(r => r.changes === 'End of Game');
        const vt = end ? end.vtScore : gameInfo?.finalVtScore;
        const opp = end ? end.oppScore : gameInfo?.finalOppScore;
        if (vt === undefined || opp === undefined || vt === opp) return null;
        return vt > opp ? 'W' : 'L';
    };

    // Background color for a table cell, relative to the other rows.
    const colorClass = (value, column, rows) => {
        if (value === null || value === undefined || !isFinite(value) || rows.length < 2) return '';

        if (column === 'plusMinus') {
            if (value === 0) return '';
            const same = rows.map(r => r.plusMinus).filter(v => (value > 0 ? v > 0 : v < 0));
            if (same.length <= 1) return value > 0 ? 'custom-green-100' : 'custom-red-100';
            same.sort((a, b) => (value > 0 ? a - b : b - a));
            const pct = same.indexOf(value) / (same.length - 1);
            return value > 0 ? (pct >= 0.5 ? 'custom-green-100' : 'custom-green-50')
                             : (pct >= 0.5 ? 'custom-red-100' : 'custom-red-50');
        }

        const higherIsBetter = ['pointsPerPossession', 'offRebRate', 'defRebRate', 'defTurnoverRate', 'pmPerMinute'];
        const lowerIsBetter = ['defPointsPerPossession', 'turnoverRate'];
        if (!higherIsBetter.includes(column) && !lowerIsBetter.includes(column)) return '';

        const unique = [...new Set(rows.map(r => r[column]).filter(v => v !== null && isFinite(v)))].sort((a, b) => a - b);
        if (unique.length < 2) return '';
        const pct = unique.indexOf(value) / (unique.length - 1);
        const good = higherIsBetter.includes(column) ? pct : 1 - pct;
        if (good >= 0.8) return 'custom-green-100';
        if (good >= 0.6) return 'custom-green-50';
        if (good >= 0.4) return '';
        if (good >= 0.2) return 'custom-red-50';
        return 'custom-red-100';
    };

    const fmt = (v, digits = 1, suffix = '') => (v === null || v === undefined || !isFinite(v) ? '—' : v.toFixed(digits) + suffix);
    const fmtPM = (v) => (v > 0 ? `+${v}` : `${v}`);

    // Sort rows by a column; null values always sink to the bottom.
    const sortRows = (rows, column, direction) => {
        const key = column === 'minutes' ? 'seconds' : column;
        return [...rows].sort((a, b) => {
            const av = a[key], bv = b[key];
            if (av === null && bv === null) return 0;
            if (av === null) return 1;
            if (bv === null) return -1;
            return direction === 'desc' ? bv - av : av - bv;
        });
    };

    // Waits for firebase.js (a module script) to finish loading.
    const db = () => new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
            if (window.firebaseDb) return resolve(window.firebaseDb);
            if (Date.now() - start > 15000) return reject(new Error('Firebase failed to load'));
            setTimeout(check, 50);
        };
        check();
    });

    // Load info + change log for a list of scheduled games (from VT_CONFIG). Games with no
    // recorded data are dropped. Each result also carries its result ('W'/'L'/null).
    // Each game also gets `built` = { segments, warnings, shots, ... } from buildGame (needs play-log.js).
    const loadGames = async (games) => {
        const database = await db();
        const loaded = await Promise.all(games.map(async (g) => {
            const info = await database.read(`game-info/${g.date}`);
            if (!info?.started) return null;
            const raw = await database.read(window.LineupCore.dataPath(info, g.date));
            const roster = window.VT_CONFIG.rosterForDate(g.date);
            const built = window.LineupCore.buildGame(info, raw, roster);
            const history = info.format === 2 ? [] : historyList(raw);
            const result = info.format === 2
                ? (info.ended && built.score.vt !== built.score.opp ? (built.score.vt > built.score.opp ? 'W' : 'L') : null)
                : gameResult(history, info);
            return { ...g, info, raw, history, built, result };
        }));
        return loaded.filter(g => g && (g.info.format === 2 ? g.built.segments.length > 0 : g.history.length > 0));
    };

    // Season filters shared by the multi-game pages. Exhibitions are left out unless includeExhibitions.
    const filterGames = (games, { from, to, includeLosses = true, highMajorOnly = false, conferenceOnly = false, includeExhibitions = false } = {}) =>
        games.filter(g =>
            (includeExhibitions || !g.exhibition) &&
            (!from || g.date >= from) &&
            (!to || g.date <= to) &&
            (includeLosses || g.result !== 'L') &&
            (!highMajorOnly || g.highMajor) &&
            (!conferenceOnly || g.conference)
        );

    window.LineupCore = {
        EMPTY_STATS, periodLabel, periodLength, parseGameTime, formatSeconds,
        namesToIds, idsToNames, lastName, historyList, sortHistory,
        buildSegments, aggregateLineups, mergeLineupRows, playerTotals, groupTotals, comboTotals, isBigInLineup,
        gameResult, colorClass, fmt, fmtPM, sortRows, db, loadGames, filterGames
    };
})();

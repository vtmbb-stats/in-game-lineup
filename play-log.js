// Play-log engine (game format 2, used from the 2026-27 season on).
// Plain JS; load after lineup-core.js. Adds functions to window.LineupCore.
//
// A format-2 game is:
//   game-info/<date>  { format: 2, started, ended, opponent, season, custom, periods: [...], ... }
//   events/<date>     { <id>: event, ... }   — ordered by event.seq (the order plays were entered)
//
// Event types (all have id, seq, type):
//   period_start { period, label, length (sec), lineup: [ids] }
//   period_end   { period, clock (sec remaining) }
//   sub          { out: [ids], in: [ids], clock (sec remaining) | null, needsPlacement? }
//   shot         { team: 'vt'|'opp', pts: 2|3, made, shooter? (vt), x?, y? (ft; vt only; null = unseen),
//                  reb?: 'vt'|'opp'|'none', ballTo?: 'vt'|'opp'|'expired', andOne? }
//   ft           { team, shooter? (vt), made, idx, of, oneAndOne?, reb?, ballTo? }
//   to           { team, player? (vt) }
//   expired      { team }               — time ran out on that team's possession
//   foul         { }                    — (no longer logged) older 'foul on the floor' notes; ignored by all stats
//   garbage      { clock }              — garbage time starts here
//   adjust       { team, pts }          — manual score correction
//   score_reset  { }                    — scoreboard back to 0-0 (exhibitions). Points before it still count
//                                         toward +/- and lineup stats; only the displayed score restarts.
// Any event that ended a team's possession carries poss: 'vt'|'opp'. possVoid: true means
// "that possession change didn't actually happen" and it is not counted.

(function () {
    const C = window.LineupCore;

    const sortEvents = (raw) => Object.values(raw || {}).filter(Boolean).sort((a, b) => a.seq - b.seq);

    const STANDARD_PERIODS = (n) => Array.from({ length: n }, (_, i) =>
        i < 2 ? { label: i === 0 ? '1st' : '2nd', length: 1200 } : { label: i === 2 ? 'OT' : `${i - 1}OT`, length: 300 });

    const periodLabelOf = (info, period) => info?.periods?.[period - 1]?.label || C.periodLabel(period);

    const clockText = (sec) => (sec === null || sec === undefined ? '?:??' : C.formatSeconds(sec));

    // 3-point geometry (NCAA men): half court 50 ft wide, basket 5.25 ft from the baseline.
    const BASKET = { x: 25, y: 5.25 };
    const ARC_R = 22.146;      // 22' 1.75"
    const CORNER_X = 21.65;    // distance from basket centre to corner 3 line
    const CORNER_Y = BASKET.y + Math.sqrt(ARC_R * ARC_R - CORNER_X * CORNER_X);
    const isThree = (x, y) => {
        if (x === null || x === undefined) return null;
        if (y <= CORNER_Y) return Math.abs(x - BASKET.x) >= CORNER_X;
        return Math.hypot(x - BASKET.x, y - BASKET.y) >= ARC_R;
    };

    const emptyPlayer = () => ({ fga: 0, fgm: 0, tpa: 0, tpm: 0, fta: 0, ftm: 0, tov: 0, pts: 0 });

    /**
     * Turn a format-2 game into stints in the same shape LineupCore.buildSegments produces,
     * plus per-player shooting/turnover stats on each stint and a list of our shots.
     *
     * opts.current  include the still-open stint (for live views)
     */
    const buildPlayLog = (info, rawEvents, roster, opts = {}) => {
        const events = sortEvents(rawEvents);
        const segments = [], warnings = [], shots = [];
        const score = { vt: 0, opp: 0 };        // running total, used for all stats
        let resetAt = { vt: 0, opp: 0 };        // running total at the last scoreboard reset
        const poss = { vt: 0, opp: 0 };
        let lineup = null, period = 0, garbage = false, seg = null;
        const review = { unplacedSubs: [], unseenShots: [] };

        const open = (clock) => {
            seg = {
                lineup: lineup ? [...lineup] : [], period, startClock: clock,
                startScore: { ...score }, stats: C.EMPTY_STATS(), playerStats: {}, isGarbageTime: garbage
            };
        };
        const close = (clock, extra = {}) => {
            if (!seg) return;
            const s = seg; seg = null;
            let seconds = s.startClock === null || clock === null ? null : s.startClock - clock;
            if (seconds !== null && seconds < 0) {
                warnings.push(`${periodLabelOf(info, s.period)}: the clock goes backwards from ${clockText(s.startClock)} to ${clockText(clock)}. Check the time on that sub.`);
                seconds = 0;
            }
            const happened = (seconds || 0) > 0 || score.vt !== s.startScore.vt || score.opp !== s.startScore.opp ||
                Object.values(s.stats.vt).some(Boolean) || Object.values(s.stats.opponent).some(Boolean) || extra.isCurrent;
            if (!happened) return;
            if (s.lineup.length !== 5) { warnings.push(`${periodLabelOf(info, s.period)}: a stretch was played without five players on the floor.`); return; }
            const label = periodLabelOf(info, s.period);
            segments.push({
                lineup: s.lineup, period: s.period, seconds,
                startTime: `${clockText(s.startClock)} ${label}`, endTime: extra.isCurrent ? 'Current' : `${clockText(clock)} ${label}`,
                startScore: s.startScore, endScore: { ...score }, stats: s.stats, playerStats: s.playerStats,
                isGarbageTime: s.isGarbageTime, ...extra
            });
        };
        const ps = (id) => { if (!seg) return emptyPlayer(); return seg.playerStats[id] || (seg.playerStats[id] = emptyPlayer()); };
        const side = (team) => (team === 'vt' ? 'vt' : 'opponent');
        const countPoss = (e) => { if (e.poss && !e.possVoid) { poss[e.poss]++; if (seg) seg.stats[side(e.poss)].possessions++; } };
        const countReb = (e) => {
            if (e.made || !e.reb || e.reb === 'none' || !seg) return;
            const shooterSide = e.team, rebSide = e.reb;
            if (rebSide === shooterSide) seg.stats[side(rebSide)].offensiveRebounds++;
            else seg.stats[side(rebSide)].defensiveRebounds++;
        };
        const outsideStint = (e) => { if (!seg) warnings.push(`A ${e.type === 'ft' ? 'free throw' : e.type} was logged between periods.`); };

        events.forEach(e => {
            switch (e.type) {
                case 'period_start':
                    close(null);
                    period = e.period; lineup = [...(e.lineup || [])];
                    open(e.length);
                    break;
                case 'period_end':
                    close(e.clock);
                    break;
                case 'sub': {
                    if (e.needsPlacement) review.unplacedSubs.push(e);
                    close(e.clock ?? null);
                    const base = lineup || [];
                    lineup = base.filter(id => !(e.out || []).includes(id)).concat(e.in || []);
                    if (period) open(e.clock ?? null);
                    break;
                }
                case 'garbage':
                    close(e.clock ?? null); garbage = true; if (period) open(e.clock ?? null);
                    break;
                case 'shot': {
                    outsideStint(e);
                    if (e.made) { score[e.team] += e.pts; }
                    if (e.team === 'vt' && e.shooter !== undefined && e.shooter !== null) {
                        const p = ps(e.shooter);
                        p.fga++; if (e.pts === 3) p.tpa++;
                        if (e.made) { p.fgm++; p.pts += e.pts; if (e.pts === 3) p.tpm++; }
                        shots.push({ id: e.id, x: e.x ?? null, y: e.y ?? null, made: !!e.made, pts: e.pts, shooter: e.shooter,
                            lineup: lineup ? [...lineup] : [], period, garbage });
                        if (e.x === null || e.x === undefined) review.unseenShots.push(e);
                    }
                    countReb(e); countPoss(e);
                    break;
                }
                case 'ft':
                    outsideStint(e);
                    if (e.made) score[e.team] += 1;
                    if (e.team === 'vt' && e.shooter !== undefined && e.shooter !== null) {
                        const p = ps(e.shooter); p.fta++; if (e.made) { p.ftm++; p.pts++; }
                    }
                    countReb(e); countPoss(e);
                    break;
                case 'to':
                    outsideStint(e);
                    if (seg) seg.stats[side(e.team)].turnovers++;
                    if (e.team === 'vt' && e.player !== undefined && e.player !== null) ps(e.player).tov++;
                    countPoss(e);
                    break;
                case 'expired':
                    countPoss(e);
                    break;
                case 'adjust':
                    score[e.team] += e.pts;
                    break;
                case 'score_reset':
                    resetAt = { ...score };
                    break;
                default:
                    break;
            }
        });

        if (seg) {
            if (opts.current && !info?.ended) close(null, { isCurrent: true });
            else close(null);
        }
        if (review.unplacedSubs.length) warnings.push(`${review.unplacedSubs.length} ${review.unplacedSubs.length > 1 ? 'subs still need' : 'sub still needs'} to be placed. Lineup stats near an unplaced sub are approximate until it's placed.`);

        // displayScore is what the scoreboard shows (restarts at each reset); score is the full running total.
        const displayScore = { vt: score.vt - resetAt.vt, opp: score.opp - resetAt.opp };
        return { segments, warnings, shots, score, displayScore, possessions: poss, lineup, period, review, events };
    };

    // Works for both formats. raw = events (format 2) or lineup-changes (format 1).
    const buildGame = (info, raw, roster, opts = {}) => {
        if (info?.format === 2) return buildPlayLog(info, raw, roster, opts);
        const legacy = C.buildSegments(raw, roster, {
            startingLineup: info?.startingLineup,
            current: opts.current ? opts.legacyCurrent : undefined
        });
        return { ...legacy, shots: [], review: { unplacedSubs: [], unseenShots: [] } };
    };

    const dataPath = (info, date) => (info?.format === 2 ? `events/${date}` : `lineup-changes/${date}`);

    // Usage rate: USG% = 100 × (FGA + 0.44×FTA + TOV) × (Team MP / 5) / (MP × (Team FGA + 0.44×Team FTA + Team TOV))
    // Team MP = 5 × minutes in the selected stints. Only format-2 games have the shot data.
    const usageRows = (segments, roster) => {
        const players = {}, team = { ...emptyPlayer() };
        let teamSeconds = 0, tracked = false;
        segments.forEach(seg => {
            if (seg.seconds) teamSeconds += seg.seconds;
            seg.lineup.forEach(id => {
                const p = players[id] || (players[id] = { id, seconds: 0, ...emptyPlayer() });
                if (seg.seconds) p.seconds += seg.seconds;
            });
            if (!seg.playerStats) return;
            tracked = true;
            Object.entries(seg.playerStats).forEach(([id, s]) => {
                const p = players[id] || (players[id] = { id: +id, seconds: 0, ...emptyPlayer() });
                Object.keys(s).forEach(k => { p[k] += s[k]; team[k] += s[k]; });
            });
        });
        const teamMP = 5 * teamSeconds / 60;
        const teamUse = team.fga + 0.44 * team.fta + team.tov;
        const rows = Object.values(players).filter(p => p.seconds > 0 || p.fga || p.fta || p.tov).map(p => {
            const mp = p.seconds / 60;
            const use = p.fga + 0.44 * p.fta + p.tov;
            const usg = tracked && mp > 0 && teamUse > 0 ? 100 * use * (teamMP / 5) / (mp * teamUse) : null;
            return { ...p, name: roster.find(r => r.id === +p.id)?.name || `#${p.id}`, mp, usg };
        }).sort((a, b) => roster.findIndex(r => r.id === +a.id) - roster.findIndex(r => r.id === +b.id));
        return { rows, team: { ...team, mp: teamMP }, tracked };
    };

    Object.assign(C, { sortEvents, STANDARD_PERIODS, periodLabelOf, clockText, isThree, BASKET, ARC_R, CORNER_X, CORNER_Y,
        buildPlayLog, buildGame, dataPath, usageRows });
})();

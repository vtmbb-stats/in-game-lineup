// Shared React components for the viewer pages.
// Loaded with <script type="text/babel" src="ui.jsx"></script> (pages must be served over http,
// e.g. GitHub Pages — opening the files directly from disk won't load it).

(function () {
    const C = window.LineupCore;

    const NAV = [
        ['live.html', 'Live Game'],
        ['game.html', 'Game Report'],
        ['display.html', 'Lineups'],
        ['combinations.html', 'Combinations'],
        ['shots.html', 'Shot Charts'],
        ['usage.html', 'Usage']
    ];

    const Nav = ({ current, darkMode }) => (
        <div className="flex flex-wrap items-center gap-2">
            {NAV.map(([href, label]) => (
                <a key={href} href={href}
                    className={`px-3 py-2 rounded-md text-sm transition-colors ${href === current
                        ? (darkMode ? 'bg-gray-700 text-white' : 'bg-gray-300 text-gray-900')
                        : (darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white')}`}>
                    {label}
                </a>
            ))}
        </div>
    );

    const DarkToggle = ({ darkMode, setDarkMode }) => (
        <button onClick={() => setDarkMode(!darkMode)}
            className={`px-4 py-2 rounded-md ${darkMode ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-white'}`}>
            {darkMode ? 'Light' : 'Dark'}
        </button>
    );

    // On/off filter button, e.g. "Garbage Time: Included / Excluded".
    const Toggle = ({ label, value, onChange, onText = 'Included', offText = 'Excluded', darkMode }) => (
        <div className="flex items-center gap-2">
            <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}:</label>
            <button onClick={() => onChange(!value)}
                className={`px-4 py-2 rounded-md ${value
                    ? (darkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white')
                    : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-300 text-gray-700')}`}>
                {value ? onText : offText}
            </button>
        </div>
    );

    const Select = ({ label, value, onChange, children, darkMode }) => (
        <div className="flex items-center gap-2">
            {label && <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}:</label>}
            <select value={value} onChange={(e) => onChange(e.target.value)}
                className={`px-3 py-2 border rounded-md ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                {children}
            </select>
        </div>
    );

    const minutesText = (row) => C.formatSeconds(row.seconds) + (row.hasCurrent ? '+' : '');

    const LINEUP_COLUMNS = [
        { key: 'plusMinus', label: '+/-', render: r => C.fmtPM(r.plusMinus) },
        { key: 'pointsPerPossession', label: 'PPP', render: r => C.fmt(r.pointsPerPossession, 2) },
        { key: 'defPointsPerPossession', label: 'Def PPP', render: r => C.fmt(r.defPointsPerPossession, 2) },
        { key: 'offRebRate', label: 'OReb%', render: r => C.fmt(r.offRebRate, 1, '%') },
        { key: 'defRebRate', label: 'DReb%', render: r => C.fmt(r.defRebRate, 1, '%') },
        { key: 'turnoverRate', label: 'TO%', render: r => C.fmt(r.turnoverRate, 1, '%') },
        { key: 'defTurnoverRate', label: 'Def TO%', render: r => C.fmt(r.defTurnoverRate, 1, '%') },
        { key: 'minutes', label: 'Min', render: minutesText }
    ];

    // Sortable, color-coded stats table. `rows` come from LineupCore.aggregateLineups or the like.
    const StatsTable = ({ rows, columns = LINEUP_COLUMNS, nameLabel = 'Lineup', nameKey = 'names',
                          sortColumn, sortDirection, onSort, darkMode, emptyText = 'No lineup data available',
                          dimRow, onRowClick, selectedId }) => {
        const sorted = C.sortRows(rows, sortColumn, sortDirection);
        const th = `text-left p-2 cursor-pointer whitespace-nowrap ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`;
        const td = darkMode ? 'text-white' : 'text-gray-900';
        return (
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <th className={`text-left p-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{nameLabel}</th>
                            {columns.map(col => (
                                <th key={col.key} onClick={() => onSort(col.key)} className={`${th} ${sortColumn === col.key ? 'font-bold' : ''}`}>
                                    {col.label}{sortColumn === col.key && <span className="ml-1">{sortDirection === 'desc' ? '↓' : '↑'}</span>}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map(row => (
                            <tr key={row.id || row[nameKey]} onClick={onRowClick ? () => onRowClick(row) : undefined}
                                className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${dimRow && dimRow(row) ? 'opacity-30' : ''} ${onRowClick ? 'cursor-pointer' : ''} ${selectedId && selectedId === row.id ? (darkMode ? 'outline outline-2 outline-orange-400' : 'outline outline-2 outline-orange-500') : ''}`}
                                title={onRowClick ? 'Click to filter the shot chart to this group (click again to clear)' : undefined}>
                                <td className={`p-2 font-medium ${td}`}>{selectedId && selectedId === row.id ? '▶ ' : ''}{row[nameKey]}</td>
                                {columns.map(col => (
                                    <td key={col.key} className={`p-2 ${C.colorClass(row[col.key], col.key, rows)} ${td}`}
                                        title={col.key === 'minutes' && row.hasCurrent ? 'Plus the stint currently on the floor' : undefined}>
                                        {col.render(row)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {rows.length === 0 && (
                    <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{emptyText}</div>
                )}
            </div>
        );
    };

    // Sidebar list of players with +/-, minutes, and an availability checkbox
    // (unchecking a player hides every lineup that includes them).
    const PlayerList = ({ title = 'Players', players, totals, availability, onToggle, darkMode, liveIds = [] }) => (
        <div>
            <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
            <div className="space-y-2">
                {players.map(p => {
                    const t = totals[p.id] || { plusMinus: 0, seconds: 0 };
                    const on = availability[p.id] !== false;
                    return (
                        <div key={p.id} className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} ${!on ? 'opacity-50' : ''}`}>
                            <div className="flex justify-between items-center">
                                <div className="flex-1">
                                    <div className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>#{p.id} {p.name}</div>
                                    <div className="flex gap-3 items-center">
                                        <div className={`text-sm ${t.plusMinus >= 0 ? 'text-green-500' : 'text-red-500'}`}>{C.fmtPM(t.plusMinus)}</div>
                                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {C.formatSeconds(t.seconds)}{liveIds.includes(p.id) ? '+' : ''}
                                        </div>
                                    </div>
                                </div>
                                <input type="checkbox" checked={on} onChange={() => onToggle(p.id)} className="ml-2" title="Include lineups with this player" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // Data-quality warnings from LineupCore.buildSegments.
    const Warnings = ({ warnings, darkMode }) => {
        const [open, setOpen] = React.useState(false);
        if (!warnings || warnings.length === 0) return null;
        return (
            <div className={`rounded-lg p-3 mb-4 text-sm border ${darkMode ? 'bg-yellow-900 border-yellow-700 text-yellow-100' : 'bg-yellow-50 border-yellow-300 text-yellow-900'}`}>
                <button onClick={() => setOpen(!open)} className="font-semibold">
                    ⚠ {warnings.length} data issue{warnings.length > 1 ? 's' : ''} in the change log {open ? '▲' : '▼'}
                </button>
                {open && <ul className="list-disc ml-5 mt-2 space-y-1">{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>}
            </div>
        );
    };

    // Sort state helper: clicking the active column flips direction, a new column starts descending.
    const useSort = (initial = 'plusMinus') => {
        const [column, setColumn] = React.useState(initial);
        const [direction, setDirection] = React.useState('desc');
        const onSort = (c) => {
            if (c === column) setDirection(direction === 'desc' ? 'asc' : 'desc');
            else { setColumn(c); setDirection('desc'); }
        };
        return { sortColumn: column, sortDirection: direction, onSort };
    };

    // Availability map helper: everyone available by default.
    const useAvailability = () => {
        const [availability, setAvailability] = React.useState({});
        const toggle = (id) => setAvailability(a => ({ ...a, [id]: a[id] === false }));
        const isAvailable = (id) => availability[id] !== false;
        return { availability, toggle, isAvailable };
    };

    // Half court. Data coordinates are always feet: x 0–50 across (0 = left side when facing the basket),
    // y = distance from the baseline. Only the drawing rotates; clicks come back in the same coordinates.
    //   orientation: 'up' (basket at top), 'left' or 'right' (sideways, as seen from the sideline)
    //   depth: how many feet from the baseline to show (default the full 47)
    // onPick(x, y) makes it clickable. shots: [{ x, y, made, key?, title? }]. marker: { x, y } for a pending click.
    const Court = ({ shots = [], onPick, marker, darkMode, className = '', style = {}, orientation = 'up', depth = 47 }) => {
        const ref = React.useRef(null);
        const groupRef = React.useRef(null);
        const line = darkMode ? '#9a968f' : '#6b6760';
        const floor = darkMode ? '#2a2724' : '#efe6d6';
        const paint = darkMode ? '#33302c' : '#e6d9c3';
        const D = depth;
        const sideways = orientation !== 'up';
        // Either way, the sideline nearest the viewer is at the bottom (basket left: x = 0 at the bottom; basket right: x = 0 at the top).
        const transform = orientation === 'left' ? 'matrix(0 -1 1 0 0 50)' : orientation === 'right' ? `matrix(0 1 -1 0 ${D} 0)` : undefined;
        const viewBox = sideways ? `-0.5 -0.5 ${D + 1} 51` : `-0.5 -0.5 51 ${D + 1}`;
        const click = (e) => {
            if (!onPick) return;
            const svg = ref.current;
            const pt = svg.createSVGPoint();
            pt.x = e.clientX; pt.y = e.clientY;
            const p = pt.matrixTransform(groupRef.current.getScreenCTM().inverse());
            const x = Math.max(0, Math.min(50, p.x)), y = Math.max(0, Math.min(D, p.y));
            onPick(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
        };
        const C = window.LineupCore;
        const arcStart = C.CORNER_Y;
        const threePath = `M ${25 - C.CORNER_X} 0 L ${25 - C.CORNER_X} ${arcStart} A ${C.ARC_R} ${C.ARC_R} 0 0 0 ${25 + C.CORNER_X} ${arcStart} L ${25 + C.CORNER_X} 0`;
        return (
            <svg ref={ref} viewBox={viewBox} className={className} onClick={click}
                style={{ cursor: onPick ? 'crosshair' : 'default', display: 'block', width: '100%', height: 'auto', touchAction: 'manipulation', ...style }}
                role={onPick ? 'button' : 'img'} aria-label={onPick ? 'Court: click where the shot was taken' : 'Shot chart'}>
                <g ref={groupRef} transform={transform}>
                <rect x="0" y="0" width="50" height={Math.min(47, D)} fill={floor} stroke={line} strokeWidth="0.2" />
                <rect x="19" y="0" width="12" height="19" fill={paint} stroke={line} strokeWidth="0.2" />
                {/* Free-throw circle: only the half outside the lane (our floor has no dashed half inside) */}
                <path d="M 19 19 A 6 6 0 0 0 31 19" fill="none" stroke={line} strokeWidth="0.2" />
                {/* "ACC" across the lane just under the free-throw line, letter bottoms toward the line */}
                <text x="25" y="17.4" textAnchor="middle" fontSize="3.6" fontWeight="800" letterSpacing="0.7"
                    fontFamily="'Arial Black', Arial, sans-serif" fill={line} opacity="0.45" style={{ pointerEvents: 'none', userSelect: 'none' }}>ACC</text>
                {/* Lane hash marks (NCAA spacing): block at 7–8 ft from the baseline, marks at 11, 14 and 17 ft */}
                {[19, 31].map(lx => {
                    const out = lx === 19 ? -0.6 : 0;
                    return (
                        <g key={lx} fill={line}>
                            <rect x={lx + out} y="7" width="0.6" height="1" />
                            {[11, 14, 17].map(y => <rect key={y} x={lx + out} y={y - 0.08} width="0.6" height="0.16" />)}
                        </g>
                    );
                })}
                <path d="M 21 5.25 A 4 4 0 0 0 29 5.25" fill="none" stroke={line} strokeWidth="0.2" />
                <path d={threePath} fill="none" stroke={line} strokeWidth="0.25" />
                <line x1="22" y1="4" x2="28" y2="4" stroke={line} strokeWidth="0.35" />
                <circle cx="25" cy="5.25" r="0.75" fill="none" stroke={darkMode ? '#f08a4b' : '#c64600'} strokeWidth="0.25" />
                {D >= 41 && <path d="M 19 47 A 6 6 0 0 1 31 47" fill="none" stroke={line} strokeWidth="0.2" />}
                {shots.filter(s => s.x !== null && s.x !== undefined && s.y <= D).map((s, i) => s.made
                    ? <circle key={s.key || i} cx={s.x} cy={s.y} r="0.7" fill="none" stroke={darkMode ? '#34c27a' : '#15913f'} strokeWidth="0.3"><title>{s.title || 'Make'}</title></circle>
                    : <g key={s.key || i} stroke={darkMode ? '#e66767' : '#e34948'} strokeWidth="0.3"><title>{s.title || 'Miss'}</title>
                        <line x1={s.x - 0.6} y1={s.y - 0.6} x2={s.x + 0.6} y2={s.y + 0.6} /><line x1={s.x - 0.6} y1={s.y + 0.6} x2={s.x + 0.6} y2={s.y - 0.6} /></g>)}
                {/* Spot just clicked, waiting for the rest of the entry: ring with a center dot (distinct from the rim and from makes) */}
                {marker && <g fill="none" stroke={darkMode ? '#f08a4b' : '#c64600'} strokeWidth="0.3" style={{ pointerEvents: 'none' }}>
                    <circle cx={marker.x} cy={marker.y} r="1.1" strokeDasharray="0.5 0.35" />
                    <circle cx={marker.x} cy={marker.y} r="0.25" fill={darkMode ? '#f08a4b' : '#c64600'} stroke="none" />
                </g>}
                </g>
            </svg>
        );
    };

    // Feet from the baseline the shooting area needs: the top of the arc plus a few feet, or further if a shot was deeper.
    const shotDepth = (shots = []) => {
        const base = Math.ceil(window.LineupCore.BASKET.y + window.LineupCore.ARC_R + 8.5); // ≈ 36 ft: room for deep threes at the top of the key
        const deepest = Math.max(0, ...shots.filter(s => s.y !== null && s.y !== undefined).map(s => s.y));
        return Math.min(47, Math.max(base, Math.ceil(deepest + 2)));
    };

    // Team logo with the name as a fallback (and for screen readers).
    const TeamLogo = ({ name, size = 28, className = '' }) => {
        const [failed, setFailed] = React.useState(false);
        const src = window.VT_CONFIG.teamLogo(name);
        if (!src || failed) return <span className={`font-semibold ${className}`}>{name}</span>;
        return <img src={src} alt={name} title={name} width={size} height={size} onError={() => setFailed(true)}
            className={className} style={{ width: size, height: size, objectFit: 'contain', display: 'inline-block' }} />;
    };

    // Shot chart with make/miss counts. The player filter can be controlled by the page (player/onPlayer)
    // so it stays in sync with other tables, or left to manage itself.
    const ShotChart = ({ shots, roster, darkMode, player: playerProp, onPlayer, caption, showZones = true }) => {
        const [own, setOwn] = React.useState('all');
        const player = playerProp !== undefined ? String(playerProp) : own;
        const setPlayer = (v) => (onPlayer ? onPlayer(v === 'all' ? 'all' : +v) : setOwn(v));
        const shown = shots.filter(s => player === 'all' || s.shooter === +player);
        const placed = shown.filter(s => s.x !== null && s.x !== undefined);
        const made = shown.filter(s => s.made).length;
        const threes = shown.filter(s => s.pts === 3);
        const pts = shown.reduce((a, s) => a + (s.made ? s.pts : 0), 0);
        // Players with shots here, plus the selected player even if he has none (so the menu shows the real filter)
        const shooters = roster.filter(p => shots.some(s => s.shooter === p.id) || (player !== 'all' && +player === p.id));
        const name = (id) => roster.find(p => p.id === id)?.name || `#${id}`;
        const sub = darkMode ? 'text-gray-400' : 'text-gray-600';
        return (
            <div className="grid gap-3">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                    <Select value={player} onChange={setPlayer} darkMode={darkMode}>
                        <option value="all">All players</option>
                        {shooters.map(p => <option key={p.id} value={p.id}>#{p.id} {p.name}</option>)}
                    </Select>
                    <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>
                        <b>{made}-{shown.length}</b> FG{shown.length ? ` (${Math.round(100 * made / shown.length)}%)` : ''} · <b>{threes.filter(s => s.made).length}-{threes.length}</b> 3PT · {shown.length ? (pts / shown.length).toFixed(2) : '—'} pts/shot
                    </span>
                    {shown.length - placed.length > 0 && <span className={sub}>{shown.length - placed.length} without a spot</span>}
                </div>
                {caption && <div className={`text-sm ${sub}`}>{caption}</div>}
                {/* Chart and zone table side by side when there's room; the zones drop below on narrow cards. */}
                <div className="flex flex-wrap gap-4 items-start">
                    <div style={{ flex: '1 1 340px', maxWidth: 560 }}>
                        <Court darkMode={darkMode} depth={shotDepth(placed)} shots={placed.map(s => ({ ...s, key: s.id + (s.date || ''), title: `${name(s.shooter)}: ${s.made ? 'made' : 'missed'} ${s.pts}${s.opponent ? ` vs ${s.opponent}` : ''}` }))} />
                        <div className={`flex gap-4 text-xs mt-2 ${sub}`}>
                            <span><span style={{ color: darkMode ? '#34c27a' : '#15913f' }}>○</span> Make</span>
                            <span><span style={{ color: darkMode ? '#e66767' : '#e34948' }}>✕</span> Miss</span>
                        </div>
                    </div>
                    {showZones && <div style={{ flex: '1 1 320px', minWidth: 0 }}><ShotZones shots={shown} darkMode={darkMode} /></div>}
                </div>
            </div>
        );
    };

    // FG by zone: rim, paint, midrange, corner 3, above-break 3.
    const ShotZones = ({ shots, darkMode }) => {
        const rows = C.zoneSummary(shots);
        const th = `text-right p-2 text-xs uppercase tracking-wide ${darkMode ? 'text-gray-300' : 'text-gray-600'}`;
        const td = `text-right p-2 ${darkMode ? 'text-white' : 'text-gray-900'}`;
        return (
            <table className="w-full text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <thead><tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className={`${th} !text-left`}>Zone</th><th className={th}>FG</th><th className={th}>FG%</th><th className={th}>Pts/shot</th><th className={th}>Share</th>
                </tr></thead>
                <tbody>
                    {rows.map(r => (
                        <tr key={r.zone} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <td className={`${td} !text-left`}>{r.zone}</td>
                            <td className={td}>{r.fgm}-{r.fga}</td>
                            <td className={td}>{r.pct === null ? '—' : `${Math.round(r.pct * 100)}%`}</td>
                            <td className={td}>{r.pps === null ? '—' : r.pps.toFixed(2)}</td>
                            <td className={td}>{r.fga ? `${Math.round(r.share * 100)}%` : '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    // Usage table from LineupCore.usageRows. Click a row to select a player (onRowClick/selectedId).
    const USAGE_COLUMNS = [
        { key: 'seconds', label: 'Min', render: r => C.formatSeconds(r.seconds) },
        { key: 'plusMinus', label: '+/-', render: r => C.fmtPM(r.plusMinus || 0) },
        { key: 'pts', label: 'Pts', render: r => r.pts },
        { key: 'fga', label: 'FG', render: r => (r.fga ? `${r.fgm}-${r.fga}` : '—') },
        { key: 'tpa', label: '3PT', render: r => (r.tpa ? `${r.tpm}-${r.tpa}` : '—') },
        { key: 'fta', label: 'FT', render: r => (r.fta ? `${r.ftm}-${r.fta}` : '—') },
        { key: 'tov', label: 'TO', render: r => r.tov },
        { key: 'usg', label: 'USG%', render: r => (r.usg === null ? '—' : r.usg.toFixed(1)) }
    ];
    const UsageTable = ({ usage, darkMode, onRowClick, selectedId, minMinutes = 0 }) => {
        const [sort, setSort] = React.useState({ key: 'usg', dir: 'desc' });
        const th = `text-right p-2 text-xs uppercase tracking-wide cursor-pointer select-none ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`;
        const td = `text-right p-2 ${darkMode ? 'text-white' : 'text-gray-900'}`;
        if (!usage.tracked) return <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Usage needs shot tracking, which started with the 2026-27 season.</div>;
        const rows = usage.rows.filter(r => r.seconds >= minMinutes * 60);
        const sorted = [...rows].sort((a, b) => {
            const av = a[sort.key] ?? -1, bv = b[sort.key] ?? -1;
            return sort.dir === 'desc' ? bv - av : av - bv;
        });
        const onSort = (key) => setSort(s => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));
        const hidden = usage.rows.length - rows.length;
        return (
            <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    <thead><tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <th className={`${th} text-left cursor-default`}>Player</th>
                        {USAGE_COLUMNS.map(c => <th key={c.key} className={`${th} ${sort.key === c.key ? 'font-bold' : ''}`} onClick={() => onSort(c.key)}>{c.label}{sort.key === c.key ? (sort.dir === 'desc' ? ' ↓' : ' ↑') : ''}</th>)}
                    </tr></thead>
                    <tbody>
                        {sorted.map(r => {
                            const sel = selectedId !== undefined && selectedId !== 'all' && +selectedId === +r.id;
                            return (
                                <tr key={r.id} onClick={onRowClick ? () => onRowClick(+r.id) : undefined}
                                    className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${onRowClick ? 'cursor-pointer' : ''} ${sel ? (darkMode ? 'bg-gray-700' : 'bg-orange-50') : ''}`}>
                                    <td className={`${td} !text-left`}>{sel ? '▶ ' : ''}#{r.id} {r.name}</td>
                                    {USAGE_COLUMNS.map(c => <td key={c.key} className={`${td} ${c.key === 'usg' ? 'font-semibold' : ''}`}>{c.render(r)}</td>)}
                                </tr>
                            );
                        })}
                        <tr className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                            <td className="p-2 text-left font-medium">Team</td>
                            <td className="p-2 text-right">{C.formatSeconds(usage.team.mp * 60 / 5)}</td>
                            <td className="p-2 text-right">{C.fmtPM(usage.team.plusMinus || 0)}</td>
                            <td className="p-2 text-right">{usage.team.pts}</td>
                            <td className="p-2 text-right">{usage.team.fgm}-{usage.team.fga}</td>
                            <td className="p-2 text-right">{usage.team.tpm}-{usage.team.tpa}</td>
                            <td className="p-2 text-right">{usage.team.ftm}-{usage.team.fta}</td>
                            <td className="p-2 text-right">{usage.team.tov}</td>
                            <td className="p-2 text-right">100.0</td>
                        </tr>
                    </tbody>
                </table>
                <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    USG% = 100 × (FGA + 0.44×FTA + TOV) × (Team MP ÷ 5) ÷ (MP × (Team FGA + 0.44×Team FTA + Team TOV)), counting only the selected games and periods.
                    {hidden > 0 && ` ${hidden} player${hidden > 1 ? 's' : ''} under ${minMinutes} min hidden.`}
                </p>
            </div>
        );
    };

    // ---- Multi-game pages: one shared season + game-range filter ----

    // Loads a season's games and holds the filter settings. Exhibitions switch on automatically
    // while no regular-season game has been tracked yet (otherwise the page would be empty).
    const useSeasonGames = () => {
        const [season, setSeason] = React.useState(null);
        const [games, setGames] = React.useState(null);
        const [f, setF] = React.useState({ from: '', to: '', includeLosses: true, highMajorOnly: false, conferenceOnly: false, includeExhibitions: false, includeGarbageTime: true });
        React.useEffect(() => {
            C.db().then(db => db.read('game-info')).then(all => {
                const has = (key) => CFG().gamesForSeason(key).some(g => all?.[g.date]?.started);
                setSeason(CFG().seasonKeys.find(has) || CFG().CURRENT_SEASON);
            });
        }, []);
        React.useEffect(() => {
            if (!season) return;
            setGames(null);
            C.loadGames(CFG().gamesForSeason(season)).then(loaded => {
                const regular = loaded.filter(g => !g.exhibition);
                const pool = regular.length ? regular : loaded;
                setF(prev => ({ ...prev, includeExhibitions: regular.length === 0 && loaded.length > 0,
                    from: pool[0]?.date || '', to: pool[pool.length - 1]?.date || '' }));
                setGames(loaded);
            });
        }, [season]);
        const set = (patch) => setF(prev => ({ ...prev, ...patch }));
        const selected = React.useMemo(() => C.filterGames(games || [], f), [games, f]);
        const roster = CFG().rosterForSeason(season);
        return { season, setSeason, games, filters: f, set, selected, roster, loading: games === null };
    };
    const CFG = () => window.VT_CONFIG;

    // The filter bar used by Lineups, Combinations, Shot Charts and Usage.
    const RangeFilters = ({ sg, darkMode, garbage = true }) => {
        const { season, setSeason, games, filters: f, set } = sg;
        const options = (games || []).filter(g => f.includeExhibitions || !g.exhibition);
        const w = sg.selected.filter(g => g.result === 'W').length, l = sg.selected.filter(g => g.result === 'L').length;
        return (
            <div className="flex flex-wrap justify-end items-center gap-3">
                <Select label="Season" value={season || ''} onChange={setSeason} darkMode={darkMode}>
                    {CFG().seasonKeys.map(k => <option key={k} value={k}>{CFG().SEASONS[k].label}</option>)}
                </Select>
                <Select label="From" value={f.from} onChange={(v) => set({ from: v })} darkMode={darkMode}>
                    {options.map(g => <option key={g.date} value={g.date}>{g.displayName}{g.exhibition ? ' (exh)' : ''}</option>)}
                </Select>
                <Select label="To" value={f.to} onChange={(v) => set({ to: v })} darkMode={darkMode}>
                    {options.map(g => <option key={g.date} value={g.date}>{g.displayName}{g.exhibition ? ' (exh)' : ''}</option>)}
                </Select>
                <Toggle label="Exhibitions" value={f.includeExhibitions} darkMode={darkMode} onChange={(v) => {
                    const pool = (games || []).filter(g => v || !g.exhibition);
                    set({ includeExhibitions: v, from: pool[0]?.date || '', to: pool[pool.length - 1]?.date || '' });
                }} />
                {garbage && <Toggle label="Garbage Time" value={f.includeGarbageTime} onChange={(v) => set({ includeGarbageTime: v })} darkMode={darkMode} />}
                <Toggle label="Losses" value={f.includeLosses} onChange={(v) => set({ includeLosses: v })} darkMode={darkMode} />
                <Toggle label="High Major Only" value={f.highMajorOnly} onChange={(v) => set({ highMajorOnly: v })} onText="Yes" offText="No" darkMode={darkMode} />
                <Toggle label="ACC Only" value={f.conferenceOnly} onChange={(v) => set({ conferenceOnly: v })} onText="Yes" offText="No" darkMode={darkMode} />
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{sg.selected.length} game{sg.selected.length === 1 ? '' : 's'} ({w}-{l})</span>
            </div>
        );
    };

    // Everything the multi-game pages need from the selected games, with garbage time applied.
    const collectSelected = (sg) => {
        const segments = [], shots = [], warnings = [];
        sg.selected.forEach(g => {
            g.built.segments.forEach(s => { if (sg.filters.includeGarbageTime || !s.isGarbageTime) segments.push({ ...s, date: g.date }); });
            (g.built.shots || []).forEach(s => { if (sg.filters.includeGarbageTime || !s.garbage) shots.push({ ...s, date: g.date, opponent: g.opponent }); });
            g.built.warnings.forEach(w => warnings.push(`${g.displayName}: ${w}`));
        });
        return { segments, shots, warnings };
    };

    // Standard page frame: title, nav, filters, then content.
    const PageHeader = ({ title, current, darkMode, setDarkMode, children }) => (
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h1>
                <div className="flex items-center gap-3">
                    <Nav current={current} darkMode={darkMode} />
                    <DarkToggle darkMode={darkMode} setDarkMode={setDarkMode} />
                </div>
            </div>
            {children}
        </div>
    );

    const Card = ({ title, right, darkMode, children, className = '' }) => (
        <div className={`rounded-lg shadow p-4 min-w-0 ${darkMode ? 'bg-gray-800' : 'bg-white'} ${className}`}>
            {(title || right) && (
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                    {title && <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>}
                    {right && <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{right}</div>}
                </div>
            )}
            {children}
        </div>
    );

    window.UI = { Nav, DarkToggle, Toggle, Select, StatsTable, PlayerList, Warnings, useSort, useAvailability, LINEUP_COLUMNS, minutesText,
        Court, ShotChart, ShotZones, UsageTable, TeamLogo, shotDepth, useSeasonGames, RangeFilters, collectSelected, PageHeader, Card };
})();

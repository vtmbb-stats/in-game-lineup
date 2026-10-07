// Shared React components for the viewer pages.
// Loaded with <script type="text/babel" src="ui.jsx"></script> (pages must be served over http,
// e.g. GitHub Pages — opening the files directly from disk won't load it).

(function () {
    const C = window.LineupCore;

    const NAV = [
        ['live.html', 'Live Game'],
        ['game.html', 'Single Game'],
        ['display.html', 'Season Lineups'],
        ['combinations.html', 'Guard/Big Combos']
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
                          dimRow }) => {
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
                            <tr key={row.id || row[nameKey]} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${dimRow && dimRow(row) ? 'opacity-30' : ''}`}>
                                <td className={`p-2 font-medium ${td}`}>{row[nameKey]}</td>
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

    // Half court, basket at the top. Coordinates are feet: x 0–50 across, y 0–47 from the baseline.
    // onPick(x, y) makes it clickable. shots: [{ x, y, made, key?, title? }]. marker: { x, y } for a pending click.
    const Court = ({ shots = [], onPick, marker, darkMode, className = '', style = {} }) => {
        const ref = React.useRef(null);
        const line = darkMode ? '#9a968f' : '#6b6760';
        const floor = darkMode ? '#2a2724' : '#efe6d6';
        const paint = darkMode ? '#33302c' : '#e6d9c3';
        const click = (e) => {
            if (!onPick) return;
            const svg = ref.current;
            const pt = svg.createSVGPoint();
            pt.x = e.clientX; pt.y = e.clientY;
            const p = pt.matrixTransform(svg.getScreenCTM().inverse());
            const x = Math.max(0, Math.min(50, p.x)), y = Math.max(0, Math.min(47, p.y));
            onPick(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
        };
        const C = window.LineupCore;
        const arcStart = C.CORNER_Y;
        const threePath = `M ${25 - C.CORNER_X} 0 L ${25 - C.CORNER_X} ${arcStart} A ${C.ARC_R} ${C.ARC_R} 0 0 0 ${25 + C.CORNER_X} ${arcStart} L ${25 + C.CORNER_X} 0`;
        return (
            <svg ref={ref} viewBox="-0.5 -0.5 51 48" className={className} onClick={click}
                style={{ cursor: onPick ? 'crosshair' : 'default', display: 'block', width: '100%', height: 'auto', touchAction: 'manipulation', ...style }}
                role={onPick ? 'button' : 'img'} aria-label={onPick ? 'Court: click where the shot was taken' : 'Shot chart'}>
                <rect x="0" y="0" width="50" height="47" fill={floor} stroke={line} strokeWidth="0.2" />
                <rect x="19" y="0" width="12" height="19" fill={paint} stroke={line} strokeWidth="0.2" />
                <circle cx="25" cy="19" r="6" fill="none" stroke={line} strokeWidth="0.2" />
                <path d="M 21 5.25 A 4 4 0 0 0 29 5.25" fill="none" stroke={line} strokeWidth="0.2" />
                <path d={threePath} fill="none" stroke={line} strokeWidth="0.25" />
                <line x1="22" y1="4" x2="28" y2="4" stroke={line} strokeWidth="0.35" />
                <circle cx="25" cy="5.25" r="0.75" fill="none" stroke={darkMode ? '#f08a4b' : '#c64600'} strokeWidth="0.25" />
                <path d="M 19 47 A 6 6 0 0 1 31 47" fill="none" stroke={line} strokeWidth="0.2" />
                {shots.filter(s => s.x !== null && s.x !== undefined).map((s, i) => s.made
                    ? <circle key={s.key || i} cx={s.x} cy={s.y} r="0.75" fill={darkMode ? '#3987e5' : '#2a78d6'} stroke={floor} strokeWidth="0.2"><title>{s.title || 'Make'}</title></circle>
                    : <g key={s.key || i} stroke={darkMode ? '#e66767' : '#e34948'} strokeWidth="0.3"><title>{s.title || 'Miss'}</title>
                        <line x1={s.x - 0.6} y1={s.y - 0.6} x2={s.x + 0.6} y2={s.y + 0.6} /><line x1={s.x - 0.6} y1={s.y + 0.6} x2={s.x + 0.6} y2={s.y - 0.6} /></g>)}
                {marker && <circle cx={marker.x} cy={marker.y} r="1" fill="none" stroke={darkMode ? '#f08a4b' : '#c64600'} strokeWidth="0.35" />}
            </svg>
        );
    };

    // Shot chart with a player filter and make/miss counts.
    const ShotChart = ({ shots, roster, darkMode }) => {
        const [player, setPlayer] = React.useState('all');
        const shown = shots.filter(s => player === 'all' || s.shooter === +player);
        const placed = shown.filter(s => s.x !== null && s.x !== undefined);
        const made = shown.filter(s => s.made).length;
        const threes = shown.filter(s => s.pts === 3);
        const shooters = roster.filter(p => shots.some(s => s.shooter === p.id));
        const name = (id) => roster.find(p => p.id === id)?.name || `#${id}`;
        return (
            <div className="grid gap-3">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                    <Select value={player} onChange={setPlayer} darkMode={darkMode}>
                        <option value="all">All players</option>
                        {shooters.map(p => <option key={p.id} value={p.id}>#{p.id} {p.name}</option>)}
                    </Select>
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {made}-{shown.length} FG · {threes.filter(s => s.made).length}-{threes.length} 3PT
                        {shown.length - placed.length > 0 && ` · ${shown.length - placed.length} without a location`}
                    </span>
                </div>
                <div style={{ maxWidth: 520 }}>
                    <Court darkMode={darkMode} shots={placed.map(s => ({ ...s, key: s.id, title: `${name(s.shooter)}: ${s.made ? 'made' : 'missed'} ${s.pts}` }))} />
                </div>
                <div className={`flex gap-4 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span>● Make</span><span>✕ Miss</span>
                </div>
            </div>
        );
    };

    // Usage table from LineupCore.usageRows.
    const UsageTable = ({ usage, darkMode }) => {
        const th = `text-right p-2 text-xs uppercase tracking-wide ${darkMode ? 'text-gray-300' : 'text-gray-600'}`;
        const td = `text-right p-2 ${darkMode ? 'text-white' : 'text-gray-900'}`;
        const pct = (m, a) => (a ? `${m}-${a}` : '—');
        if (!usage.tracked) return <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Usage needs shot tracking, which started with the 2026-27 season.</div>;
        return (
            <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    <thead><tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <th className={`${th} text-left`}>Player</th><th className={th}>Min</th><th className={th}>Pts</th>
                        <th className={th}>FG</th><th className={th}>3PT</th><th className={th}>FT</th><th className={th}>TO</th><th className={th}>USG%</th>
                    </tr></thead>
                    <tbody>
                        {usage.rows.map(r => (
                            <tr key={r.id} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <td className={`${td} text-left`}>#{r.id} {r.name}</td>
                                <td className={td}>{window.LineupCore.formatSeconds(r.seconds)}</td>
                                <td className={td}>{r.pts}</td>
                                <td className={td}>{pct(r.fgm, r.fga)}</td>
                                <td className={td}>{pct(r.tpm, r.tpa)}</td>
                                <td className={td}>{pct(r.ftm, r.fta)}</td>
                                <td className={td}>{r.tov}</td>
                                <td className={`${td} font-semibold`}>{r.usg === null ? '—' : r.usg.toFixed(1)}</td>
                            </tr>
                        ))}
                        <tr className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                            <td className="p-2 text-left font-medium">Team</td>
                            <td className="p-2 text-right">{window.LineupCore.formatSeconds(usage.team.mp * 60 / 5)}</td>
                            <td className="p-2 text-right">{usage.team.pts}</td>
                            <td className="p-2 text-right">{pct(usage.team.fgm, usage.team.fga)}</td>
                            <td className="p-2 text-right">{pct(usage.team.tpm, usage.team.tpa)}</td>
                            <td className="p-2 text-right">{pct(usage.team.ftm, usage.team.fta)}</td>
                            <td className="p-2 text-right">{usage.team.tov}</td>
                            <td className="p-2 text-right">100.0</td>
                        </tr>
                    </tbody>
                </table>
                <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>USG% = 100 × (FGA + 0.44×FTA + TOV) × (Team MP ÷ 5) ÷ (MP × (Team FGA + 0.44×Team FTA + Team TOV)). Team rows count only the selected periods.</p>
            </div>
        );
    };

    window.UI = { Nav, DarkToggle, Toggle, Select, StatsTable, PlayerList, Warnings, useSort, useAvailability, LINEUP_COLUMNS, minutesText, Court, ShotChart, UsageTable };
})();

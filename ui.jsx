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

    window.UI = { Nav, DarkToggle, Toggle, Select, StatsTable, PlayerList, Warnings, useSort, useAvailability, LINEUP_COLUMNS, minutesText };
})();

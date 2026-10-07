// Game Report PDF. Builds a vector PDF in the browser (court and tables stay sharp when printed).
// The PDF libraries load only when the button is clicked.
//   Page 1: header, shot chart + zone table, usage table (with +/-)
//   Page 2+: lineups table
(function () {
    const LIBS = [
        'https://unpkg.com/jspdf@2.5.2/dist/jspdf.umd.min.js',
        'https://unpkg.com/jspdf-autotable@3.8.4/dist/jspdf.plugin.autotable.min.js',
        'https://unpkg.com/svg2pdf.js@2.2.4/dist/svg2pdf.umd.min.js'
    ];
    const loadScript = (src) => new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement('script');
        s.src = src; s.onload = resolve; s.onerror = () => reject(new Error(`Couldn't load ${src}`));
        document.head.appendChild(s);
    });
    const ensureLibs = async () => { for (const src of LIBS) await loadScript(src); };

    const MAROON = [99, 0, 49], ORANGE = [198, 70, 0], INK = [27, 26, 25], GREY = [110, 106, 100], RULE = [220, 216, 210];
    const GOOD = [212, 240, 219], BAD = [248, 215, 213];

    /**
     * opts: { filename, title, subtitle, score: { vt, opp, opponent }, sections: 'Zone 7-12 · Half 1 30-23',
     *         filterNote, courtSvg (SVG element), zones (zoneSummary rows), shotLine,
     *         usage (usageRows result), lineups (rows from aggregateLineups) }
     */
    const download = async (opts) => {
        await ensureLibs();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
        const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 36;
        const C = window.LineupCore;

        // ---- header ----
        const header = () => {
            doc.setFillColor(...MAROON); doc.rect(0, 0, W, 6, 'F');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(...INK);
            doc.text(opts.title, M, M + 8);
            doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...GREY);
            doc.text(opts.subtitle, M, M + 24);
            doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(...INK);
            doc.text(`${opts.score.vt} - ${opts.score.opp}`, W - M, M + 10, { align: 'right' });
            doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GREY);
            doc.text(`Virginia Tech - ${opts.score.opponent}`, W - M, M + 24, { align: 'right' });
            let y = M + 38;
            if (opts.sections) { doc.setFontSize(9); doc.setTextColor(...INK); doc.text(opts.sections, M, y); y += 12; }
            if (opts.filterNote) { doc.setFontSize(8); doc.setTextColor(...GREY); doc.text(opts.filterNote, M, y); y += 10; }
            doc.setDrawColor(...RULE); doc.setLineWidth(0.75); doc.line(M, y + 2, W - M, y + 2);
            return y + 14;
        };
        const sectionTitle = (text, x, y) => {
            doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...ORANGE);
            doc.text(text.toUpperCase(), x, y);
        };
        const tableStyle = {
            theme: 'plain',
            styles: { font: 'helvetica', fontSize: 8, cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 }, textColor: INK, lineColor: RULE, lineWidth: { bottom: 0.4 } },
            headStyles: { fontStyle: 'bold', textColor: GREY, fontSize: 7, lineWidth: { bottom: 0.8 }, lineColor: INK },
            // number columns: right-align the header over the numbers
        };
        const alignHeads = (d) => { if (d.section === 'head' && d.column.index > 0) d.cell.styles.halign = 'right'; };

        // ---- page 1: shot chart + zones (left), usage (right) ----
        const top = header();
        const leftW = 300, rightX = M + leftW + 24, rightW = W - M - rightX;

        sectionTitle('Shot chart', M, top);
        let leftY = top + 8;
        if (opts.courtSvg) {
            const vb = opts.courtSvg.viewBox.baseVal;
            const h = leftW * vb.height / vb.width;
            const svg2pdf = window.svg2pdf && (window.svg2pdf.svg2pdf || window.svg2pdf);
            const svg = opts.courtSvg.cloneNode(true);
            svg.querySelectorAll('text').forEach(t => { t.setAttribute('font-family', 'helvetica'); t.setAttribute('font-weight', 'bold'); });
            const holder = document.createElement('div');
            holder.style.cssText = 'position:absolute;left:-10000px;top:0;width:600px';
            holder.appendChild(svg); document.body.appendChild(holder);
            try { await svg2pdf(svg, doc, { x: M, y: leftY, width: leftW, height: h }); } finally { holder.remove(); }
            leftY += h + 6;
            doc.setFontSize(7.5); doc.setTextColor(...GREY);
            doc.setDrawColor(21, 145, 63); doc.setLineWidth(1); doc.circle(M + 4, leftY + 3, 3, 'S');
            doc.text('Make', M + 11, leftY + 5.5);
            doc.setDrawColor(227, 73, 72); doc.line(M + 38, leftY, M + 44, leftY + 6); doc.line(M + 38, leftY + 6, M + 44, leftY);
            doc.text('Miss', M + 48, leftY + 5.5);
            if (opts.shotLine) doc.text(opts.shotLine, M + leftW, leftY + 5.5, { align: 'right' });
            leftY += 14;
        }
        doc.autoTable({
            ...tableStyle, startY: leftY, margin: { left: M }, tableWidth: leftW,
            head: [['Zone', 'FG', 'FG%', 'Pts/shot', 'Share']],
            body: opts.zones.map(z => [z.zone, `${z.fgm}-${z.fga}`, z.pct === null ? '-' : `${Math.round(z.pct * 100)}%`,
                z.pps === null ? '-' : z.pps.toFixed(2), z.fga ? `${Math.round(z.share * 100)}%` : '-']),
            columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
            didParseCell: alignHeads
        });

        sectionTitle('Usage', rightX, top);
        const u = opts.usage;
        const rows = [...u.rows].sort((a, b) => (b.seconds - a.seconds));
        const pmCell = (v) => ({ content: C.fmtPM(v || 0), styles: { fillColor: v > 0 ? GOOD : v < 0 ? BAD : null } });
        const frac = (m, a) => (a ? `${m}-${a}` : '-');
        doc.autoTable({
            ...tableStyle, startY: top + 8, margin: { left: rightX }, tableWidth: rightW,
            head: [['Player', 'Min', '+/-', 'Pts', 'FG', '3PT', 'FT', 'TO', 'USG%']],
            body: [
                ...rows.map(r => [`#${r.id} ${r.name}`, C.formatSeconds(r.seconds), pmCell(r.plusMinus), r.pts, frac(r.fgm, r.fga),
                    frac(r.tpm, r.tpa), frac(r.ftm, r.fta), r.tov, r.usg === null ? '-' : r.usg.toFixed(1)]),
                [{ content: 'Team', styles: { fontStyle: 'bold' } }, C.formatSeconds(u.team.mp * 60 / 5), C.fmtPM(u.team.plusMinus || 0), u.team.pts,
                    frac(u.team.fgm, u.team.fga), frac(u.team.tpm, u.team.tpa), frac(u.team.ftm, u.team.fta), u.team.tov, '100.0']
            ],
            columnStyles: Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8].map(i => [i, { halign: 'right' }])),
            didParseCell: (d) => { alignHeads(d); if (d.section === 'body' && d.column.index === 8) d.cell.styles.fontStyle = 'bold'; }
        });
        doc.setFontSize(7); doc.setTextColor(...GREY);
        const usgNote = 'USG% = 100 x (FGA + 0.44 x FTA + TOV) x (Team MP / 5) / (MP x (Team FGA + 0.44 x Team FTA + Team TOV)). +/- = score margin while on the floor.';
        doc.text(doc.splitTextToSize(usgNote, rightW), rightX, doc.lastAutoTable.finalY + 10);

        // ---- page 2: lineups ----
        doc.addPage();
        const top2 = header();
        sectionTitle(`Lineups (${opts.lineups.length})`, M, top2);
        const f = (v, d, s = '') => (v === null || v === undefined || !isFinite(v) ? '-' : v.toFixed(d) + s);
        const lineups = [...opts.lineups].sort((a, b) => b.seconds - a.seconds);
        doc.autoTable({
            ...tableStyle, startY: top2 + 8, margin: { left: M, right: M, top: M + 20 },
            head: [['Lineup', 'Min', '+/-', 'PPP', 'Def PPP', 'OReb%', 'DReb%', 'TO%', 'Def TO%']],
            body: lineups.map(r => [r.names, C.formatSeconds(r.seconds), pmCell(r.plusMinus), f(r.pointsPerPossession, 2), f(r.defPointsPerPossession, 2),
                f(r.offRebRate, 1, '%'), f(r.defRebRate, 1, '%'), f(r.turnoverRate, 1, '%'), f(r.defTurnoverRate, 1, '%')]),
            columnStyles: Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8].map(i => [i, { halign: 'right', cellWidth: 56 }])),
            didParseCell: alignHeads
        });
        doc.setFontSize(7); doc.setTextColor(...GREY);
        doc.text('Sorted by minutes. PPP = points per possession. Rates use the bench possession and rebound tallies.', M, doc.lastAutoTable.finalY + 10);

        // ---- footers ----
        const pages = doc.getNumberOfPages();
        for (let i = 1; i <= pages; i++) {
            doc.setPage(i);
            doc.setFontSize(7); doc.setTextColor(...GREY);
            doc.text(`Virginia Tech Men's Basketball - Lineup Tracker - generated ${new Date().toLocaleString()}`, M, H - 18);
            doc.text(`Page ${i} of ${pages}`, W - M, H - 18, { align: 'right' });
        }
        doc.save(opts.filename);
    };

    window.GameReportPDF = { download };
})();

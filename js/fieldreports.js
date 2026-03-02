// Field Reports — Reportes de Campo desde Apps Script
(function() {
    const REPORTS_URL = 'https://script.google.com/macros/s/AKfycbz6YI1Oh-tutU3q5NfPJxDq77QKDMVX6DtM92YZ_GxgKYqm0XXymVCOi08k4SuDteXr/exec';

    const STATUS_CONFIG = {
        'finalizada_ok':  { label: '✅ Finalizada OK',  cls: 'fr-badge-ok' },
        'no_ok':          { label: '❌ No OK',           cls: 'fr-badge-no-ok' },
        'cliente_ausente':{ label: '⚠️ Ausente',         cls: 'fr-badge-ausente' },
        'recitar':        { label: '🔄 Recitar',         cls: 'fr-badge-recitar' },
        'paralizada':     { label: '🔴 Paralizada',      cls: 'fr-badge-paralizada' },
        'preinstalada':   { label: '📦 Preinstalada',    cls: 'fr-badge-preinstalada' },
    };

    function getStatusCfg(status) {
        if (!status) return { label: '—', cls: 'fr-badge-unknown' };
        const key = status.toLowerCase().replace(/\s+/g, '_');
        return STATUS_CONFIG[key] || { label: status, cls: 'fr-badge-unknown' };
    }

    function todayStr() {
        return new Date().toISOString().split('T')[0];
    }

    window.FieldReports = {
        cache: [],

        async fetchReports(date) {
            const d = date || todayStr();
            const url = `${REPORTS_URL}?action=getReports&date=${d}&t=${Date.now()}`;
            const resp = await fetch(url);
            const data = await resp.json();
            this.cache = data.reports || [];
            return this.cache;
        },

        getReportsForHA(ha) {
            return this.cache.filter(r => r.ha && r.ha.toString() === ha.toString());
        }
    };

    window.render_fieldreports = function() {
        const container = document.getElementById('view-fieldreports');
        container.innerHTML = `
            <style>
                .fr-kpi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:12px; margin-bottom:24px; }
                .fr-kpi { background:var(--bg-secondary); border-radius:14px; padding:16px; text-align:center; border:1px solid var(--border); }
                .fr-kpi-label { font-size:11px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:.5px; margin-bottom:6px; }
                .fr-kpi-value { font-size:28px; font-weight:700; }
                .fr-kpi-value.green { color:var(--green); }
                .fr-kpi-value.orange { color:#f59e0b; }
                .fr-kpi-value.blue { color:var(--blue); }
                .fr-team-section { margin-bottom:28px; }
                .fr-team-header { font-size:13px; font-weight:600; color:var(--text-secondary); text-transform:uppercase;
                    letter-spacing:.5px; margin-bottom:12px; padding-bottom:6px; border-bottom:1px solid var(--border); }
                .fr-card { background:var(--bg-secondary); border-radius:14px; padding:16px; margin-bottom:10px;
                    border:1px solid var(--border); transition:transform .15s ease; }
                .fr-card:hover { transform:translateY(-1px); }
                .fr-card-top { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:8px; }
                .fr-card-ha { font-size:17px; font-weight:700; }
                .fr-card-tech { font-size:12px; color:var(--text-secondary); margin-top:2px; }
                .fr-badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; color:#fff; white-space:nowrap; }
                .fr-badge-ok { background:#16a34a; }
                .fr-badge-no-ok { background:#dc2626; }
                .fr-badge-ausente { background:#d97706; }
                .fr-badge-recitar { background:#2563eb; }
                .fr-badge-paralizada { background:#dc2626; }
                .fr-badge-preinstalada { background:#7c3aed; }
                .fr-badge-unknown { background:var(--text-secondary,#888); }
                .fr-card-meta { display:flex; gap:12px; flex-wrap:wrap; font-size:12px; color:var(--text-secondary); margin-top:6px; }
                .fr-card-comments { font-size:12px; color:var(--text-secondary); margin-top:8px;
                    padding:8px; background:var(--bg-primary); border-radius:8px; font-style:italic; }
                .fr-filter-bar { display:flex; gap:12px; align-items:center; margin-bottom:20px; flex-wrap:wrap; }
            </style>

            <div class="section-header">
                <div>
                    <div class="section-title">Reportes de Campo</div>
                    <div class="section-sub">Reportes enviados desde las apps de campo</div>
                </div>
            </div>

            <div class="fr-filter-bar">
                <input type="date" id="frDateFilter" class="form-input" style="width:auto;padding:8px 14px;">
                <button class="btn btn-primary btn-sm" onclick="window.loadFieldReports()">🔄 Cargar</button>
                <span id="frStatusMsg" style="font-size:12px;color:var(--text-secondary);"></span>
            </div>

            <div class="fr-kpi-grid">
                <div class="fr-kpi"><div class="fr-kpi-label">Total</div><div class="fr-kpi-value blue" id="frKpiTotal">—</div></div>
                <div class="fr-kpi"><div class="fr-kpi-label">Finalizadas OK</div><div class="fr-kpi-value green" id="frKpiOk">—</div></div>
                <div class="fr-kpi"><div class="fr-kpi-label">Pendientes</div><div class="fr-kpi-value orange" id="frKpiPending">—</div></div>
                <div class="fr-kpi"><div class="fr-kpi-label">📷 Fotos</div><div class="fr-kpi-value" id="frKpiPhotos">—</div></div>
            </div>

            <div id="frLoading" style="text-align:center;padding:40px;color:var(--text-secondary);">Elige una fecha y carga</div>
            <div id="frContent"></div>
        `;

        document.getElementById('frDateFilter').value = todayStr();
        window.loadFieldReports();
    };

    window.loadFieldReports = async function() {
        const date = document.getElementById('frDateFilter').value || todayStr();
        const loading = document.getElementById('frLoading');
        const content = document.getElementById('frContent');

        loading.style.display = 'block';
        loading.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;gap:8px;"><div class="cita-spinner"></div> Cargando reportes\u2026</div>';
        content.innerHTML = '';

        try {
            const reports = await window.FieldReports.fetchReports(date);

            const okStatuses = ['finalizada_ok'];
            const pendingStatuses = ['recitar', 'paralizada', 'cliente_ausente', 'no_ok'];
            const totalOk = reports.filter(r => okStatuses.includes((r.workStatus||'').toLowerCase())).length;
            const totalPending = reports.filter(r => pendingStatuses.includes((r.workStatus||'').toLowerCase())).length;
            const totalPhotos = reports.reduce((s, r) => s + (parseInt(r.photoCount) || 0), 0);

            document.getElementById('frKpiTotal').textContent = reports.length;
            document.getElementById('frKpiOk').textContent = totalOk;
            document.getElementById('frKpiPending').textContent = totalPending;
            document.getElementById('frKpiPhotos').textContent = totalPhotos;

            loading.style.display = 'none';

            if (reports.length === 0) {
                content.innerHTML = '<div class="empty-state"><div class="icon">\uD83D\uDCED</div><div class="title">Sin reportes</div><div class="desc">No hay reportes para ' + date + '</div></div>';
                document.getElementById('frStatusMsg').textContent = 'Sin datos';
                return;
            }

            const byTeam = {};
            reports.forEach(r => {
                const t = r.team || 'Sin equipo';
                if (!byTeam[t]) byTeam[t] = [];
                byTeam[t].push(r);
            });

            content.innerHTML = Object.keys(byTeam).sort().map(team =>
                '<div class="fr-team-section">' +
                '<div class="fr-team-header">\uD83D\uDC65 ' + team + ' <span style="font-weight:400;">(' + byTeam[team].length + ')</span></div>' +
                byTeam[team].map(renderReportCard).join('') +
                '</div>'
            ).join('');

            document.getElementById('frStatusMsg').textContent = '\u2705 ' + reports.length + ' reportes \u00B7 ' + date;

        } catch (err) {
            loading.style.display = 'none';
            content.innerHTML = '<div class="empty-state"><div class="icon">\u26A0\uFE0F</div><div class="title">Error</div><div class="desc">' + err.message + '</div></div>';
        }
    };

    function renderReportCard(r) {
        const cfg = getStatusCfg(r.workStatus);
        const time = (r.startTime && r.endTime) ? '\uD83D\uDD50 ' + r.startTime + ' \u2013 ' + r.endTime : (r.startTime ? '\uD83D\uDD50 ' + r.startTime : '');
        const photos = parseInt(r.photoCount) || 0;
        const driveLink = r.driveUrl ? '<a href="' + r.driveUrl + '" target="_blank" style="color:var(--blue);font-size:12px;">\uD83D\uDCC1 Drive</a>' : '';
        const metaItems = [
            time ? '<span>' + time + '</span>' : '',
            r.client ? '<span>\uD83C\uDFE2 ' + r.client + '</span>' : '',
            r.units ? '<span>\uD83C\uDFD8\uFE0F ' + r.units + ' uds</span>' : '',
            r.variant ? '<span>\uD83D\uDCCF ' + r.variant + '</span>' : '',
            photos > 0 ? '<span>\uD83D\uDCF7 ' + photos + ' fotos</span>' : '',
            driveLink
        ].filter(Boolean).join('');

        return '<div class="fr-card">' +
            '<div class="fr-card-top">' +
            '<div>' +
            '<div class="fr-card-ha">' + (r.ha || '\u2014') + '</div>' +
            '<div class="fr-card-tech">\uD83D\uDC77 ' + (r.technician || '\u2014') + (r.supportTeam ? ' \u00B7 ' + r.supportTeam : '') + '</div>' +
            '</div>' +
            '<span class="fr-badge ' + cfg.cls + '">' + cfg.label + '</span>' +
            '</div>' +
            (metaItems ? '<div class="fr-card-meta">' + metaItems + '</div>' : '') +
            (r.comments ? '<div class="fr-card-comments">' + r.comments + '</div>' : '') +
            '</div>';
    }

})();

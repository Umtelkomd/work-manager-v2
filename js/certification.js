// Certification & Invoicing view — Real data from Google Sheets + local NE4
const SHEETS_CERT_URL = 'https://jarl9801.github.io/work-manager/data/sheets.json';

// Cache sheets data
async function fetchSheetsForCert() {
    if (window._sheetsCertData && (Date.now() - window._sheetsCertTs < 120000)) return window._sheetsCertData;
    try {
        const resp = await fetch(SHEETS_CERT_URL + '?t=' + Date.now());
        window._sheetsCertData = await resp.json();
        window._sheetsCertTs = Date.now();
        return window._sheetsCertData;
    } catch (e) { return null; }
}

// Parse sheets rows into unified records
function parseSheetsRecords(data) {
    const records = [];
    if (data.soplado_rd) {
        data.soplado_rd.forEach((r, i) => {
            const dateStr = r['Fecha de Inicio'] || r['Timestamp'] || '';
            const meters = parseFloat(r['Metros Soplados']) || 0;
            const fibras = parseInt(r['Número de Fibras']) || 0;
            const cert = r['Certificado'] === 'TRUE' || r['Certificado'] === true;
            records.push({
                id: 'sop_' + i,
                type: 'soplado',
                line: 'NE3',
                project: r['Código de Proyecto'] || '—',
                dp: r['DP'] || '',
                calle: r['Calle'] || '',
                tech: r['Técnico Responsable'] || '',
                date: dateStr,
                meters, fibras,
                color: r['Color miniducto'] || '',
                incidencias: r['Incidencias (si las hubo)'] || r['Incidencias'] || '',
                fotos: r['Fotos del Trabajo'] || '',
                certifiedByField: cert,
                kw: kwFromDate(dateStr)
            });
        });
    }
    if (data.fusion) {
        data.fusion.forEach((r, i) => {
            const dateStr = r['Fecha de Inicio'] || r['Timestamp'] || '';
            const fusions = parseInt(r['Fusiones']) || 0;
            records.push({
                id: 'fus_' + i,
                type: 'fusion',
                line: 'NE3',
                project: r['Código de Proyecto'] || '—',
                dp: r['DP'] || '',
                tech: r['Técnico Responsable'] || '',
                date: dateStr,
                fusions,
                incidencias: r['Incidencias'] || '',
                fotos: r['Fotos del Trabajo'] || r['Registro Fotografico'] || '',
                certifiedByField: false,
                kw: kwFromDate(dateStr)
            });
        });
    }
    return records;
}

function kwFromDate(str) {
    if (!str) return '—';
    const parts = str.split('/');
    if (parts.length < 3) return '—';
    const d = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
    if (isNaN(d)) return '—';
    const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const wk = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
    return 'KW' + String(wk).padStart(2, '0');
}

function calcAmount(rec) {
    if (rec.type === 'soplado') return (rec.meters || 0) * PRICE_LIST.NE3.soplado.price;
    if (rec.type === 'fusion') return (rec.fusions || 0) * PRICE_LIST.NE3.fusion.price;
    if (rec.line === 'NE4') {
        return (rec.wes || 0) * PRICE_LIST.NE4.we_assembly.price + (rec.mdus || 0) * PRICE_LIST.NE4.mdu_complete.price;
    }
    return 0;
}

// Cert status stored in IndexedDB keyed by record id
async function getCertStatus() {
    const certs = await DB.getAll('certification');
    const map = {};
    certs.forEach(c => { map[c.recordId] = c; });
    return map;
}

window.render_certification = async function() {
    const container = document.getElementById('view-certification');
    container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-secondary);">⏳ Cargando datos de producción…</div>`;

    const [sheetsData, localRecords, certMap] = await Promise.all([
        fetchSheetsForCert(),
        DB.getAll('records'),
        getCertStatus()
    ]);

    // Merge sheets + local NE4 records
    const sheetsRecords = sheetsData ? parseSheetsRecords(sheetsData) : [];
    const ne4Records = localRecords.filter(r => r.line === 'NE4').map(r => ({
        id: 'ne4_' + r.id,
        type: 'ne4',
        line: 'NE4',
        project: r.projectCode || '—',
        dp: '',
        tech: r.teamId || '',
        date: '',
        wes: r.wes || 0,
        mdus: r.mdus || 0,
        certifiedByField: false,
        kw: r.kw || '—'
    }));

    const allRecords = [...sheetsRecords, ...ne4Records];
    window._certAllRecords = allRecords;
    window._certMap = certMap;

    // Stats
    const totalSoplado = sheetsRecords.filter(r => r.type === 'soplado').reduce((s, r) => s + r.meters, 0);
    const totalFusions = sheetsRecords.filter(r => r.type === 'fusion').reduce((s, r) => s + r.fusions, 0);

    const certified = allRecords.filter(r => {
        const c = certMap[r.id];
        return (c && (c.status === 'certified' || c.status === 'invoiced'));
    }).length;
    const invoiced = allRecords.filter(r => certMap[r.id]?.status === 'invoiced').length;
    const pending = allRecords.length - certified;

    let certValue = 0, invValue = 0;
    allRecords.forEach(r => {
        const c = certMap[r.id];
        const amt = calcAmount(r);
        if (c && (c.status === 'certified' || c.status === 'invoiced')) certValue += amt;
        if (c?.status === 'invoiced') invValue += amt;
    });

    const updatedStr = sheetsData?.updated ? new Date(sheetsData.updated).toLocaleString('de-DE') : '—';

    // Get unique KWs and projects for filters
    const kws = [...new Set(allRecords.map(r => r.kw).filter(k => k !== '—'))].sort().reverse();
    const projects = [...new Set(allRecords.map(r => r.project).filter(p => p !== '—'))].sort();

    container.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">Certificación & Facturación</div>
                <div class="section-sub">${allRecords.length} registros · ${totalSoplado.toLocaleString('de-DE')} m soplado · ${totalFusions} fusiones · act. ${updatedStr}</div>
            </div>
            <button class="btn btn-secondary" onclick="window.exportCertification()">📥 CSV</button>
        </div>

        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label">Pendientes</div>
                <div class="kpi-value orange">${pending}</div>
                <div class="kpi-sub">de ${allRecords.length} totales</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Certificados</div>
                <div class="kpi-value green">${certified}</div>
                <div class="kpi-sub">€ ${certValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Facturados</div>
                <div class="kpi-value blue">${invoiced}</div>
                <div class="kpi-sub">€ ${invValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</div>
            </div>
        </div>

        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center;">
            <select id="certFilterKW" onchange="window.renderCertTable()" style="padding:10px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg-tertiary);color:var(--text-primary);font-size:13px;">
                <option value="">Todas KW</option>
                ${kws.map(k => `<option value="${k}">${k}</option>`).join('')}
            </select>
            <select id="certFilterProject" onchange="window.renderCertTable()" style="padding:10px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg-tertiary);color:var(--text-primary);font-size:13px;">
                <option value="">Todos proyectos</option>
                ${projects.map(p => `<option value="${p}">${p}</option>`).join('')}
            </select>
            <select id="certFilterType" onchange="window.renderCertTable()" style="padding:10px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg-tertiary);color:var(--text-primary);font-size:13px;">
                <option value="">Soplado + Fusiones + NE4</option>
                <option value="soplado">Soplado</option>
                <option value="fusion">Fusiones</option>
                <option value="ne4">NE4</option>
            </select>
        </div>

        <div class="tabs" id="certTabs">
            <button class="tab active" onclick="window.switchCertTab('pending', this)">Pendientes</button>
            <button class="tab" onclick="window.switchCertTab('certified', this)">Certificados</button>
            <button class="tab" onclick="window.switchCertTab('invoiced', this)">Facturados</button>
            <button class="tab" onclick="window.switchCertTab('all', this)">Todos</button>
        </div>

        <div id="certTable"></div>
    `;

    window._certTab = 'pending';
    window.renderCertTable();
};

window.switchCertTab = function(tab, btn) {
    document.querySelectorAll('#certTabs .tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    window._certTab = tab;
    window.renderCertTable();
};

window.renderCertTable = function() {
    const allRecords = window._certAllRecords || [];
    const certMap = window._certMap || {};
    const tableEl = document.getElementById('certTable');
    if (!tableEl) return;

    // Filters
    const kwFilter = document.getElementById('certFilterKW')?.value || '';
    const projFilter = document.getElementById('certFilterProject')?.value || '';
    const typeFilter = document.getElementById('certFilterType')?.value || '';

    let filtered = allRecords;
    if (kwFilter) filtered = filtered.filter(r => r.kw === kwFilter);
    if (projFilter) filtered = filtered.filter(r => r.project === projFilter);
    if (typeFilter) filtered = filtered.filter(r => r.type === typeFilter);

    // Tab filter
    if (window._certTab === 'pending') {
        filtered = filtered.filter(r => !certMap[r.id] || certMap[r.id].status === 'pending');
    } else if (window._certTab === 'certified') {
        filtered = filtered.filter(r => certMap[r.id]?.status === 'certified');
    } else if (window._certTab === 'invoiced') {
        filtered = filtered.filter(r => certMap[r.id]?.status === 'invoiced');
    }

    if (filtered.length === 0) {
        tableEl.innerHTML = `<div class="empty-state"><div class="icon">📋</div><div class="title">Sin registros</div><div class="sub">No hay registros en esta categoría</div></div>`;
        return;
    }

    // Calculate totals for filtered
    let totalMeters = 0, totalFusions = 0, totalAmount = 0;
    filtered.forEach(r => {
        if (r.type === 'soplado') totalMeters += r.meters || 0;
        if (r.type === 'fusion') totalFusions += r.fusions || 0;
        totalAmount += calcAmount(r);
    });

    tableEl.innerHTML = `
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">
            ${filtered.length} registros · ${totalMeters > 0 ? totalMeters.toLocaleString('de-DE') + ' m · ' : ''}${totalFusions > 0 ? totalFusions + ' fus · ' : ''}€ ${totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
        </div>
        <div class="table-wrap">
            <table>
                <thead><tr>
                    <th><input type="checkbox" onchange="window.toggleAllCert(this)"></th>
                    <th>Tipo</th>
                    <th>Proyecto</th>
                    <th>DP</th>
                    <th>KW</th>
                    <th>Técnico</th>
                    <th>Valores</th>
                    <th>Monto €</th>
                    <th>Estado</th>
                    <th></th>
                </tr></thead>
                <tbody>
                    ${filtered.map(r => {
                        const cert = certMap[r.id];
                        const amount = calcAmount(r);
                        const status = cert?.status || 'pending';
                        const typeBadge = r.type === 'soplado' ? '<span class="badge badge-green">Soplado</span>' :
                                         r.type === 'fusion' ? '<span class="badge badge-blue">Fusión</span>' :
                                         '<span class="badge badge-purple">NE4</span>';
                        const statusBadge = status === 'invoiced' ? '<span class="badge badge-blue">Facturado</span>' :
                                           status === 'certified' ? '<span class="badge badge-green">Certificado</span>' :
                                           '<span class="badge badge-orange">Pendiente</span>';
                        const values = r.type === 'soplado' ? `${r.meters}m · ${r.fibras} fibras` :
                                      r.type === 'fusion' ? `${r.fusions} fusiones` :
                                      `${r.wes || 0} WEs`;
                        const fotosLink = r.fotos ? `<a href="${r.fotos}" target="_blank" style="color:var(--blue);font-size:12px;">📎</a>` : '';

                        return `<tr>
                            <td><input type="checkbox" class="cert-check" data-id="${r.id}"></td>
                            <td>${typeBadge}</td>
                            <td style="font-weight:600;font-size:12px;">${r.project}</td>
                            <td style="font-size:12px;">${r.dp || '—'}</td>
                            <td><span class="badge" style="font-size:10px;">${r.kw}</span></td>
                            <td style="font-size:12px;">${r.tech || '—'}</td>
                            <td style="font-size:12px;">${values} ${fotosLink}</td>
                            <td style="font-weight:700;">€ ${amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</td>
                            <td>${statusBadge}</td>
                            <td style="white-space:nowrap;">
                                ${status === 'pending' ? `<button class="btn btn-sm btn-success" onclick="window.certifyRecord('${r.id}')">✓</button>` : ''}
                                ${status === 'certified' ? `<button class="btn btn-sm btn-primary" onclick="window.invoiceRecord('${r.id}')">€</button>` : ''}
                                ${status !== 'pending' ? `<button class="btn btn-sm btn-secondary" onclick="window.uncertifyRecord('${r.id}')">↩</button>` : ''}
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-success btn-sm" onclick="window.certifySelected()">✅ Certificar seleccionados</button>
            <button class="btn btn-primary btn-sm" onclick="window.invoiceSelected()">💶 Facturar seleccionados</button>
        </div>
    `;
};

window.certifyRecord = async function(recordId) {
    const amount = calcAmount((window._certAllRecords || []).find(r => r.id === recordId) || {});
    await DB.add('certification', { recordId, status: 'certified', amount, certifiedAt: Date.now() });
    window._certMap[recordId] = { recordId, status: 'certified', amount, certifiedAt: Date.now() };
    window.toast('Registro certificado ✓', 'success');
    window.renderCertTable();
};

window.invoiceRecord = async function(recordId) {
    const certs = await DB.getAll('certification');
    const cert = certs.find(c => c.recordId === recordId);
    if (!cert) return;
    cert.status = 'invoiced';
    cert.invoicedAt = Date.now();
    await DB.put('certification', cert);
    window._certMap[recordId] = cert;
    window.toast('Registro facturado €', 'success');
    window.renderCertTable();
};

window.uncertifyRecord = async function(recordId) {
    const certs = await DB.getAll('certification');
    const cert = certs.find(c => c.recordId === recordId);
    if (!cert) return;
    await DB.delete('certification', cert.id);
    delete window._certMap[recordId];
    window.toast('Estado revertido ↩', 'info');
    window.renderCertTable();
};

window.toggleAllCert = function(cb) {
    document.querySelectorAll('.cert-check').forEach(c => c.checked = cb.checked);
};

window.certifySelected = async function() {
    const checks = document.querySelectorAll('.cert-check:checked');
    let count = 0;
    for (const cb of checks) {
        const id = cb.dataset.id;
        if (window._certMap[id]) continue;
        const rec = (window._certAllRecords || []).find(r => r.id === id);
        if (!rec) continue;
        const amount = calcAmount(rec);
        const entry = { recordId: id, status: 'certified', amount, certifiedAt: Date.now() };
        await DB.add('certification', entry);
        window._certMap[id] = entry;
        count++;
    }
    window.toast(`${count} registros certificados ✓`, 'success');
    window.renderCertTable();
};

window.invoiceSelected = async function() {
    const checks = document.querySelectorAll('.cert-check:checked');
    let count = 0;
    for (const cb of checks) {
        const id = cb.dataset.id;
        const cert = window._certMap[id];
        if (!cert || cert.status !== 'certified') continue;
        const certs = await DB.getAll('certification');
        const dbCert = certs.find(c => c.recordId === id);
        if (!dbCert) continue;
        dbCert.status = 'invoiced';
        dbCert.invoicedAt = Date.now();
        await DB.put('certification', dbCert);
        window._certMap[id] = dbCert;
        count++;
    }
    window.toast(`${count} registros facturados €`, 'success');
    window.renderCertTable();
};

window.exportCertification = function() {
    const allRecords = window._certAllRecords || [];
    const certMap = window._certMap || {};
    const data = allRecords.map(r => {
        const cert = certMap[r.id];
        const status = cert?.status || 'pending';
        return {
            Tipo: r.type,
            Proyecto: r.project,
            DP: r.dp || '',
            KW: r.kw,
            Técnico: r.tech || '',
            Metros: r.meters || '',
            Fibras: r.fibras || '',
            Fusiones: r.fusions || '',
            WEs: r.wes || '',
            Color: r.color || '',
            'Monto €': calcAmount(r).toFixed(2),
            Estado: status === 'invoiced' ? 'Facturado' : status === 'certified' ? 'Certificado' : 'Pendiente',
            'Fecha Cert.': cert?.certifiedAt ? new Date(cert.certifiedAt).toLocaleDateString('de-DE') : '',
            'Fecha Fact.': cert?.invoicedAt ? new Date(cert.invoicedAt).toLocaleDateString('de-DE') : ''
        };
    });
    window.exportCSV(data, `certificacion_${new Date().toISOString().split('T')[0]}.csv`);
    window.toast('CSV exportado 📥', 'success');
};

window.calcRecordPrice = function(r) {
    let total = 0;
    if (r.line === 'NE3') {
        total += (r.meters || 0) * PRICE_LIST.NE3.soplado.price;
        total += (r.fusions || 0) * PRICE_LIST.NE3.fusion.price;
        total += (r.activations || 0) * PRICE_LIST.NE3.alta.price;
    } else {
        total += (r.wes || 0) * PRICE_LIST.NE4.we_assembly.price;
        total += (r.mdus || 0) * PRICE_LIST.NE4.mdu_complete.price;
    }
    return total;
};

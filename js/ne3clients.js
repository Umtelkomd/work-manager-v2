// NE3 Clients view — GO FiberConnect CSV import, dropdown filters, phase badges, sheets sync
// Migrated from Work Manager v1

// ===== CONSTANTS =====
const PHASE_COLORS = {
    'Tiefbau':'var(--red)','Einblasen':'var(--blue)','Spleiße':'var(--purple,#a855f7)',
    'Abliefern':'var(--teal,#14b8a6)','Hausbegehung':'var(--orange)','Hausanschluss':'var(--yellow)',
    'Arbeitsvorbereitung':'var(--cyan,#06b6d4)','Montage':'var(--pink,#ec4899)'
};
const ANSCHLUSS_COLORS = {
    '0':'var(--text-tertiary)','100':'var(--orange)','101':'var(--teal,#14b8a6)',
    '102':'var(--purple,#a855f7)','103':'var(--yellow)','108':'var(--red)','109':'var(--blue)'
};

const SHEETS_JSON_URL = 'https://jarl9801.github.io/work-manager/data/sheets.json';

// ===== FILTER STATE =====
const _ne3FilterSelections = { project: new Set(), dp: new Set(), phase: new Set(), anschluss: new Set(), contract: new Set() };
let _ne3Sort = { field: 'dp', dir: 1 };

// ===== CSV PARSING (robust, handles quoted fields) =====
function parseCSVRobust(text) {
    const lines = [];
    let current = '', inQuote = false, row = [];
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuote) {
            if (c === '"' && text[i+1] === '"') { current += '"'; i++; }
            else if (c === '"') { inQuote = false; }
            else { current += c; }
        } else {
            if (c === '"') { inQuote = true; }
            else if (c === ',') { row.push(current.trim()); current = ''; }
            else if (c === '\n' || (c === '\r' && text[i+1] === '\n')) {
                row.push(current.trim()); current = '';
                if (c === '\r') i++;
                if (row.some(x => x)) lines.push(row);
                row = [];
            } else { current += c; }
        }
    }
    row.push(current.trim());
    if (row.some(x => x)) lines.push(row);
    return lines;
}

function csvLinesToObjects(lines) {
    if (lines.length < 2) return [];
    const headers = lines[0];
    return lines.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, i) => obj[h] = row[i] || '');
        return obj;
    });
}

function detectCSVType(headers) {
    const h = headers.join(',').toLowerCase().normalize('NFC');
    if (h.includes('auftragsnummer') && h.includes('anschlussstatus')) return 'clients';
    return null;
}

// ===== DP NORMALIZATION =====
function normalizeDP(raw) {
    if (!raw) return '';
    const str = raw.toString().trim().toUpperCase();
    if (/^\d+$/.test(str)) return 'DP' + str.padStart(3, '0');
    const m = str.match(/DP[- ]?(\d+)/);
    if (m) return 'DP' + m[1].padStart(3, '0');
    return raw.trim();
}

function extractProjectCode(row) {
    const dp = row['DP'] || '';
    const m = dp.match(/(QFF-\d+)/i);
    return m ? m[1].toUpperCase() : '';
}

// Derive NE3 project code (HXT/RSD/WCB) from CSV Projektnummer or DP field
function deriveNE3ProjectCode(row) {
    // Try extracting QFF-xxx first (legacy)
    const qff = extractProjectCode(row);
    if (qff) return qff;
    // Try matching known NE3 project codes from Projektnummer or other fields
    const fields = [row['Projektnummer'] || '', row['Projekt'] || '', row['DP'] || ''];
    for (const f of fields) {
        const upper = f.toUpperCase();
        if (upper.includes('HXT') || upper.includes('HÖXTER') || upper.includes('HOEXTER')) return 'HXT';
        if (upper.includes('RSD') || upper.includes('ROSSDORF') || upper.includes('ROßDORF') || upper.includes('ROSS')) return 'RSD';
        if (upper.includes('WCB') || upper.includes('WESTCONNECT') || upper.includes('BIELEFELD')) return 'WCB';
    }
    return '';
}

// ===== RENDER VIEW =====
window.render_ne3clients = async function() {
    const container = document.getElementById('view-ne3clients');
    const clients = await DB.getAll('ne3_clients');

    container.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">Clientes NE3</div>
                <div class="section-sub" id="ne3ClientCount">${clients.length} registros</div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button class="btn btn-secondary" id="syncSheetsBtn" onclick="window.syncFromSheets()">🔄 Sync Sheets</button>
                <button class="btn btn-secondary" onclick="window.clearNE3Clients()">🗑 Limpiar</button>
                <button class="btn btn-primary" onclick="document.getElementById('ne3CsvUpload').click()">📂 Importar CSV</button>
            </div>
        </div>

        <input type="file" id="ne3CsvUpload" accept=".csv" style="display:none" onchange="window.handleNE3CSVUpload(event)">

        <div class="ne3-search-row" style="display:flex;gap:10px;align-items:center;margin-bottom:12px;flex-wrap:wrap">
            <input type="text" id="ne3ClientSearch" placeholder="🔍 Buscar..." oninput="window.renderNE3Table()"
                style="background:var(--bg-secondary);border:0.5px solid var(--border);color:var(--text-primary);padding:8px 14px;border-radius:20px;font-size:13px;width:220px">
            <div id="ne3FilterDrop_project" class="filter-drop">
                <button class="filter-btn" onclick="window.toggleNE3FilterDrop('project',event)">Proyecto <span class="filter-count"></span></button>
                <div class="filter-menu" id="ne3FilterMenu_project"></div>
            </div>
            <div id="ne3FilterDrop_dp" class="filter-drop">
                <button class="filter-btn" onclick="window.toggleNE3FilterDrop('dp',event)">DP <span class="filter-count"></span></button>
                <div class="filter-menu" id="ne3FilterMenu_dp"></div>
            </div>
            <div id="ne3FilterDrop_phase" class="filter-drop">
                <button class="filter-btn" onclick="window.toggleNE3FilterDrop('phase',event)">Phase <span class="filter-count"></span></button>
                <div class="filter-menu" id="ne3FilterMenu_phase"></div>
            </div>
            <div id="ne3FilterDrop_anschluss" class="filter-drop">
                <button class="filter-btn" onclick="window.toggleNE3FilterDrop('anschluss',event)">Anschluss <span class="filter-count"></span></button>
                <div class="filter-menu" id="ne3FilterMenu_anschluss"></div>
            </div>
            <div id="ne3FilterDrop_contract" class="filter-drop">
                <button class="filter-btn" onclick="window.toggleNE3FilterDrop('contract',event)">Contract <span class="filter-count"></span></button>
                <div class="filter-menu" id="ne3FilterMenu_contract"></div>
            </div>
            <button class="btn btn-sm btn-secondary" onclick="window.clearNE3Filters()">✕ Limpiar filtros</button>
        </div>

        <div id="ne3ClientsTable"></div>
    `;

    updateNE3Filters(clients);
    window.renderNE3Table();
};

// ===== DROPDOWN CHECKBOX FILTERS =====
window.toggleNE3FilterDrop = function(name, event) {
    if (event) { event.stopPropagation(); event.preventDefault(); }
    const menu = document.getElementById('ne3FilterMenu_' + name);
    if (!menu) return;
    const wasOpen = menu.classList.contains('open');
    document.querySelectorAll('.filter-menu').forEach(m => m.classList.remove('open'));
    if (!wasOpen) menu.classList.add('open');
};

document.addEventListener('click', e => {
    if (e.target.closest('.filter-menu') || e.target.closest('.filter-btn')) return;
    document.querySelectorAll('.filter-menu.open').forEach(m => m.classList.remove('open'));
});

function buildNE3FilterMenu(name, items) {
    const menu = document.getElementById('ne3FilterMenu_' + name);
    if (!menu) return;
    const sel = _ne3FilterSelections[name];
    menu.innerHTML = items.map(v =>
        `<label class="filter-check-label"><input type="checkbox" value="${v}" ${sel.has(v)?'checked':''} onchange="window.onNE3FilterCheck('${name}',this)">${v}</label>`
    ).join('');
    updateNE3FilterBtnLabel(name);
}

window.onNE3FilterCheck = function(name, cb) {
    if (cb.checked) _ne3FilterSelections[name].add(cb.value);
    else _ne3FilterSelections[name].delete(cb.value);
    updateNE3FilterBtnLabel(name);
    window.renderNE3Table();
};

function updateNE3FilterBtnLabel(name) {
    const btn = document.querySelector('#ne3FilterDrop_' + name + ' .filter-btn');
    if (!btn) return;
    const cnt = _ne3FilterSelections[name].size;
    const countSpan = btn.querySelector('.filter-count');
    if (countSpan) countSpan.textContent = cnt > 0 ? cnt : '';
    btn.classList.toggle('active', cnt > 0);
}

function getNE3FilterValues(name) { return [..._ne3FilterSelections[name]]; }

window.clearNE3Filters = function() {
    Object.keys(_ne3FilterSelections).forEach(k => _ne3FilterSelections[k].clear());
    document.querySelectorAll('.filter-menu input[type="checkbox"]').forEach(cb => cb.checked = false);
    Object.keys(_ne3FilterSelections).forEach(updateNE3FilterBtnLabel);
    const search = document.getElementById('ne3ClientSearch');
    if (search) search.value = '';
    window.renderNE3Table();
};

async function updateNE3Filters(clientsOpt) {
    const clients = clientsOpt || await DB.getAll('ne3_clients');
    const projs = [...new Set(clients.map(c => c.projectCode).filter(Boolean))].sort();
    const dps = [...new Set(clients.map(c => c.dp).filter(Boolean))].sort();
    const phases = [...new Set(clients.map(c => c.phase).filter(Boolean))].sort();
    const anschlusses = [...new Set(clients.map(c => c.anschluss).filter(Boolean))].sort((a, b) => Number(a) - Number(b));
    const contracts = [...new Set(clients.map(c => c.contract).filter(Boolean))].sort();
    buildNE3FilterMenu('project', projs);
    buildNE3FilterMenu('dp', dps);
    buildNE3FilterMenu('phase', phases);
    buildNE3FilterMenu('anschluss', anschlusses);
    buildNE3FilterMenu('contract', contracts);
}

// ===== SORT =====
window.sortNE3Clients = function(field) {
    if (_ne3Sort.field === field) _ne3Sort.dir *= -1;
    else { _ne3Sort.field = field; _ne3Sort.dir = 1; }
    window.renderNE3Table();
};

// ===== RENDER TABLE =====
window.renderNE3Table = async function() {
    const clients = await DB.getAll('ne3_clients');
    const tableEl = document.getElementById('ne3ClientsTable');
    if (!tableEl) return;

    if (clients.length === 0) {
        tableEl.innerHTML = `
            <div class="upload-zone" onclick="document.getElementById('ne3CsvUpload').click()">
                <div class="icon">📄</div>
                <div class="label">Importar CSV de GO FiberConnect</div>
                <div class="hint">Formato NE3: Auftragsnummer, DP, ANSCHLUSSSTATUS, Status, GrundNA...</div>
            </div>`;
        return;
    }

    const search = (document.getElementById('ne3ClientSearch')?.value || '').toLowerCase();
    const fp = getNE3FilterValues('project');
    const fd = getNE3FilterValues('dp');
    const fPhase = getNE3FilterValues('phase');
    const fAnschluss = getNE3FilterValues('anschluss');
    const fc = getNE3FilterValues('contract');

    let filtered = clients.filter(c => {
        if (search && !`${c.auftrag} ${c.dp} ${c.street} ${c.hausnummer} ${c.cableId} ${c.phase} ${c.projectCode}`.toLowerCase().includes(search)) return false;
        if (fp.length && !fp.includes(c.projectCode)) return false;
        if (fd.length && !fd.includes(c.dp)) return false;
        if (fPhase.length && !fPhase.includes(c.phase)) return false;
        if (fAnschluss.length && !fAnschluss.includes(c.anschluss)) return false;
        if (fc.length && !fc.includes(c.contract)) return false;
        return true;
    });

    const f = _ne3Sort.field;
    filtered.sort((a, b) => {
        const va = (a[f] || '').toString();
        const vb = (b[f] || '').toString();
        return va.localeCompare(vb) * _ne3Sort.dir;
    });

    const sortIcon = (field) => _ne3Sort.field === field ? (_ne3Sort.dir === 1 ? ' ↑' : ' ↓') : '';

    tableEl.innerHTML = `
        <div class="table-wrap">
            <table>
                <thead><tr>
                    <th style="cursor:pointer" onclick="window.sortNE3Clients('projectCode')">Proyecto${sortIcon('projectCode')}</th>
                    <th style="cursor:pointer" onclick="window.sortNE3Clients('auftrag')">Auftrag${sortIcon('auftrag')}</th>
                    <th style="cursor:pointer" onclick="window.sortNE3Clients('dp')">DP${sortIcon('dp')}</th>
                    <th style="cursor:pointer" onclick="window.sortNE3Clients('street')">Dirección${sortIcon('street')}</th>
                    <th>Cable ID</th>
                    <th style="cursor:pointer" onclick="window.sortNE3Clients('contract')">Contract${sortIcon('contract')}</th>
                    <th style="cursor:pointer" onclick="window.sortNE3Clients('anschluss')">Anschluss${sortIcon('anschluss')}</th>
                    <th style="cursor:pointer" onclick="window.sortNE3Clients('phase')">Phase${sortIcon('phase')}</th>
                </tr></thead>
                <tbody>
                    ${filtered.slice(0, 500).map(c => {
                        const addr = `${c.street || ''} ${c.hausnummer || ''}${c.hausnummerZusatz ? ' ' + c.hausnummerZusatz : ''}`.trim();
                        const phaseColor = PHASE_COLORS[c.phase] || 'var(--text-tertiary)';
                        const anschlussColor = ANSCHLUSS_COLORS[c.anschluss] || 'var(--text-tertiary)';
                        return `<tr>
                            <td><strong>${c.projectCode || '—'}</strong></td>
                            <td style="font-size:11px">${c.auftrag}</td>
                            <td><strong>${c.dp}</strong></td>
                            <td>${addr}</td>
                            <td style="font-size:11px">${c.cableId || ''}</td>
                            <td><span class="badge ne3-badge-contract">${c.contract || '—'}</span></td>
                            <td><span class="badge" style="background:color-mix(in srgb,${anschlussColor} 15%,transparent);color:${anschlussColor}">${c.anschluss || '—'}</span></td>
                            <td><span class="badge" style="background:color-mix(in srgb,${phaseColor} 15%,transparent);color:${phaseColor}">${c.phase || '—'}</span></td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
        ${filtered.length > 500 ? `<div style="text-align:center;padding:12px;color:var(--text-secondary);font-size:12px">Mostrando 500 de ${filtered.length}</div>` : ''}
    `;

    const countEl = document.getElementById('ne3ClientCount');
    if (countEl) countEl.textContent = `${filtered.length} / ${clients.length} registros`;
};

// ===== CSV IMPORT =====
window.handleNE3CSVUpload = async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const text = await file.text();
    const lines = parseCSVRobust(text);
    if (lines.length < 2) { window.toast('CSV vacío', 'error'); return; }

    const type = detectCSVType(lines[0]);
    if (type !== 'clients') {
        window.toast('CSV no reconocido como GO FiberConnect clients', 'error');
        event.target.value = '';
        return;
    }

    const objs = csvLinesToObjects(lines);
    await importNE3Clients(objs);
    event.target.value = '';
};

async function importNE3Clients(objs) {
    const existing = await DB.getAll('ne3_clients');
    const existingByAuftrag = {};
    for (const c of existing) { if (c.auftrag) existingByAuftrag[c.auftrag] = c; }

    let added = 0, skipped = 0;

    for (const o of objs) {
        const auftrag = (o['Auftragsnummer'] || '').trim();
        if (!auftrag) continue;

        const grundNA = (o['GrundNA'] || '').trim();
        if (!grundNA) { skipped++; continue; } // Skip clients without contract

        // Merge by Auftragsnummer — don't overwrite existing
        if (existingByAuftrag[auftrag]) continue;

        const dpFull = o['DP'] || '';
        const dpNorm = normalizeDP(dpFull);
        const projCode = deriveNE3ProjectCode(o);
        const anschluss = (o['ANSCHLUSSSTATUS'] || '').toString().trim();
        const phase = (o['Status'] || '').trim().replace(/\s+/g, ' ').trim();

        const client = {
            auftrag,
            projektnummer: o['Projektnummer'] || '',
            projectCode: projCode,
            dp: dpNorm,
            dpFull,
            street: o['Straße'] || '',
            hausnummer: o['Hausnummer'] || '',
            hausnummerZusatz: o['Hausnummernzusatz'] || '',
            unit: o['Unit'] || '',
            cableId: o['Cable ID (From TRI)'] || '',
            contract: grundNA,
            anschluss,
            phase,
            farbeRohre: o['Farbe Rohre'] || '',
            datumHausanschluss: o['Datum Hausanschluss'] || '',
            line: 'NE3'
        };

        await DB.add('ne3_clients', client);
        added++;
    }

    window.toast(`✅ ${added} nuevos clientes NE3 importados (${skipped} sin contrato omitidos)`, 'success');
    window.render_ne3clients();
}

// ===== GOOGLE SHEETS SYNC =====
window.syncFromSheets = async function() {
    const btn = document.getElementById('syncSheetsBtn');
    if (!btn) return;
    const origText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '⏳ Sincronizando...';

    try {
        const resp = await fetch(SHEETS_JSON_URL + '?t=' + Date.now());
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();

        let imported = { ra: 0, rd: 0, fusion: 0 };

        // Import Soplado RA
        if (data.soplado_ra && data.soplado_ra.length > 0) {
            await DB.clear('orders_ra');
            for (const o of data.soplado_ra) {
                const projCode = o['Código de Proyecto'] || o['Codigo de Proyecto'] || '';
                await DB.add('orders_ra', {
                    timestamp: o['Timestamp'] || '',
                    projectCode: projCode,
                    technician: o['Técnico Responsable'] || o['Tecnico Responsable'] || '',
                    startDate: o['Fecha de Inicio'] || '',
                    endDate: o['Fecha de Finalización'] || o['Fecha de Finalizacion'] || '',
                    fibers: o['Número de Fibras'] || o['Numero de Fibras'] || '',
                    meters: o['Metros Soplados'] || '',
                    color: o['Color miniducto'] || '',
                    incidents: o['Incidencias (si las hubo)'] || '',
                    photos: o['Fotos del Trabajo'] || ''
                });
            }
            imported.ra = data.soplado_ra.length;
        }

        // Import Soplado RD
        if (data.soplado_rd && data.soplado_rd.length > 0) {
            await DB.clear('orders_rd');
            for (const o of data.soplado_rd) {
                const projCode = o['Código de Proyecto'] || o['Codigo de Proyecto'] || '';
                const dp = normalizeDP(o['DP'] || '');
                await DB.add('orders_rd', {
                    timestamp: o['Timestamp'] || '',
                    projectCode: projCode,
                    dp,
                    street: o['Calle'] || '',
                    ka: o['KA cliente'] || '',
                    technician: o['Técnico Responsable'] || o['Tecnico Responsable'] || '',
                    startDate: o['Fecha de Inicio'] || '',
                    endDate: o['Fecha de Finalización'] || o['Fecha de Finalizacion'] || '',
                    meters: o['Metros Soplados'] || '',
                    color: o['Color miniducto'] || '',
                    incidents: o['Incidencias (si las hubo)'] || '',
                    photos: o['Fotos del Trabajo'] || '',
                    fibers: o['Número de Fibras'] || o['Numero de Fibras'] || ''
                });
            }
            imported.rd = data.soplado_rd.length;
        }

        // Import Fusiones
        if (data.fusion && data.fusion.length > 0) {
            await DB.clear('orders_fusion');
            for (const o of data.fusion) {
                const projCode = o['Código de Proyecto'] || o['Codigo de Proyecto'] || '';
                const dp = normalizeDP(o['DP'] || '');
                await DB.add('orders_fusion', {
                    timestamp: o['Timestamp'] || '',
                    projectCode: projCode,
                    dp,
                    technician: o['Técnico Responsable'] || o['Tecnico Responsable'] || '',
                    startDate: o['Fecha de Inicio'] || '',
                    endDate: o['Fecha de Finalización'] || o['Fecha de Finalizacion'] || '',
                    splices: o['Fusiones'] || '',
                    incidents: o['Incidencias (si las hubo)'] || '',
                    photos: o['Fotos del Trabajo'] || '',
                    photoRegistry: o['Registro Fotografico'] || ''
                });
            }
            imported.fusion = data.fusion.length;
        }

        const updated = data.updated ? new Date(data.updated).toLocaleString() : 'desconocido';
        window.toast(`✅ Sync OK — RA: ${imported.ra} | RD: ${imported.rd} | Fusión: ${imported.fusion} (${updated})`, 'success');
    } catch (err) {
        console.error('Sync error:', err);
        window.toast('❌ Error sync: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = origText;
    }
};

// ===== CLEAR =====
window.clearNE3Clients = async function() {
    if (!confirm('¿Eliminar todos los clientes NE3 importados?')) return;
    await DB.clear('ne3_clients');
    window.toast('Clientes NE3 eliminados', 'info');
    window.render_ne3clients();
};

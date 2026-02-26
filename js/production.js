// Production view — weekly production tracking
window.render_production = async function() {
    const container = document.getElementById('view-production');
    const records = await DB.getAll('records');
    const projects = await DB.getAll('projects');
    const teams = await DB.getAll('teams');

    // Get current KW for default
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const currentKW = Math.ceil(((now - start) / 86400000 + start.getDay()) / 7);

    // Build KW options (KW01-KW52)
    const kwOptions = [];
    for (let i = 1; i <= 52; i++) kwOptions.push('KW' + String(i).padStart(2, '0'));

    container.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">Producción</div>
                <div class="section-sub">Registros semanales por equipo</div>
            </div>
            <button class="btn btn-primary" onclick="window.addProductionRecord()">+ Nuevo registro</button>
        </div>

        <div class="tabs" id="prodTabs">
            <button class="tab active" onclick="window.switchProdTab('NE3', this)">NE3 — Backbone</button>
            <button class="tab" onclick="window.switchProdTab('NE4', this)">NE4 — Hausanschluss</button>
        </div>

        <div class="filter-bar" id="prodFilters"></div>

        <div id="prodTable"></div>
    `;

    window._prodLine = 'NE3';
    window._prodFilterKW = new Set();
    window._prodFilterTeam = new Set();
    window._prodFilterProject = new Set();

    // Setup filters
    const filtersEl = document.getElementById('prodFilters');

    // KW filter
    const kwWrapper = document.createElement('div');
    kwWrapper.className = 'dropdown-filter';
    const kwBtn = document.createElement('button');
    kwBtn.className = 'dropdown-btn';
    kwBtn.innerHTML = 'KW <span class="arrow">▾</span>';
    const kwPanel = document.createElement('div');
    kwPanel.className = 'dropdown-panel';
    kwOptions.forEach(kw => {
        const lbl = document.createElement('label');
        lbl.className = 'dropdown-option';
        const cb = document.createElement('input');
        cb.type = 'checkbox'; cb.value = kw;
        if (kw === 'KW' + String(currentKW).padStart(2, '0')) { cb.checked = true; window._prodFilterKW.add(kw); }
        cb.onchange = () => { cb.checked ? window._prodFilterKW.add(kw) : window._prodFilterKW.delete(kw); window.renderProdTable(); };
        lbl.appendChild(cb); lbl.appendChild(document.createTextNode(kw));
        kwPanel.appendChild(lbl);
    });
    kwBtn.onclick = (e) => { e.stopPropagation(); kwPanel.classList.toggle('open'); };
    kwWrapper.appendChild(kwBtn); kwWrapper.appendChild(kwPanel);
    filtersEl.appendChild(kwWrapper);

    // Team filter
    const teamOpts = teams.map(t => ({ value: t.id, label: t.name }));
    window.createDropdownFilter('prodFilters', 'Equipo', teamOpts, (sel) => { window._prodFilterTeam = sel; window.renderProdTable(); });

    // Project filter
    const projOpts = projects.map(p => ({ value: p.code, label: `${p.code} — ${p.name}` }));
    window.createDropdownFilter('prodFilters', 'Proyecto', projOpts, (sel) => { window._prodFilterProject = sel; window.renderProdTable(); });

    window.renderProdTable();
};

window.switchProdTab = function(line, btn) {
    document.querySelectorAll('#prodTabs .tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    window._prodLine = line;
    window.renderProdTable();
};

window.renderProdTable = async function() {
    const records = await DB.getAll('records');
    const teams = await DB.getAll('teams');
    let filtered = records.filter(r => r.line === window._prodLine);

    if (window._prodFilterKW.size > 0) filtered = filtered.filter(r => window._prodFilterKW.has(r.kw));
    if (window._prodFilterTeam.size > 0) filtered = filtered.filter(r => window._prodFilterTeam.has(r.teamId));
    if (window._prodFilterProject.size > 0) filtered = filtered.filter(r => window._prodFilterProject.has(r.projectCode));

    const tableEl = document.getElementById('prodTable');

    if (filtered.length === 0) {
        tableEl.innerHTML = `<div class="empty-state"><div class="icon">📈</div><div class="title">Sin registros</div><div class="desc">Agrega registros de producción con el botón +</div></div>`;
        return;
    }

    if (window._prodLine === 'NE3') {
        const totalMeters = filtered.reduce((s, r) => s + (r.meters || 0), 0);
        const totalFusions = filtered.reduce((s, r) => s + (r.fusions || 0), 0);
        const totalAltas = filtered.reduce((s, r) => s + (r.activations || 0), 0);

        tableEl.innerHTML = `
            <div class="kpi-grid" style="margin-bottom:20px">
                <div class="kpi-card"><div class="kpi-label">Total Metros</div><div class="kpi-value green">${totalMeters.toLocaleString('de-DE')}</div></div>
                <div class="kpi-card"><div class="kpi-label">Total Fusiones</div><div class="kpi-value blue">${totalFusions}</div></div>
                <div class="kpi-card"><div class="kpi-label">Total Altas</div><div class="kpi-value orange">${totalAltas}</div></div>
            </div>
            <div class="table-wrap">
                <table>
                    <thead><tr><th>Código</th><th>Proyecto</th><th>Equipo</th><th>KW</th><th>Metros</th><th>Fusiones</th><th>Altas</th><th></th></tr></thead>
                    <tbody>
                        ${filtered.map(r => {
                            const team = teams.find(t => t.id === r.teamId);
                            return `<tr>
                                <td style="font-family:monospace;font-size:11px">${r.code || '-'}</td>
                                <td>${r.projectCode}</td>
                                <td>${team ? team.name : r.teamId || '-'}</td>
                                <td>${r.kw}</td>
                                <td style="font-weight:600">${(r.meters || 0).toLocaleString('de-DE')}</td>
                                <td>${r.fusions || 0}</td>
                                <td>${r.activations || 0}</td>
                                <td><button class="btn btn-sm btn-secondary" onclick="window.editRecord(${r.id})">✏️</button> <button class="btn btn-sm btn-danger" onclick="window.deleteRecord(${r.id})">🗑</button></td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>`;
    } else {
        const totalWEs = filtered.reduce((s, r) => s + (r.wes || 0), 0);
        const totalMDUs = filtered.reduce((s, r) => s + (r.mdus || 0), 0);

        tableEl.innerHTML = `
            <div class="kpi-grid" style="margin-bottom:20px">
                <div class="kpi-card"><div class="kpi-label">Total WEs</div><div class="kpi-value green">${totalWEs}</div></div>
                <div class="kpi-card"><div class="kpi-label">Total MDUs</div><div class="kpi-value blue">${totalMDUs}</div></div>
            </div>
            <div class="table-wrap">
                <table>
                    <thead><tr><th>Código</th><th>Proyecto</th><th>Equipo</th><th>KW</th><th>WEs</th><th>MDUs</th><th></th></tr></thead>
                    <tbody>
                        ${filtered.map(r => {
                            const team = teams.find(t => t.id === r.teamId);
                            return `<tr>
                                <td style="font-family:monospace;font-size:11px">${r.code || '-'}</td>
                                <td>${r.projectCode}</td>
                                <td>${team ? team.name : r.teamId || '-'}</td>
                                <td>${r.kw}</td>
                                <td style="font-weight:600">${r.wes || 0}</td>
                                <td>${r.mdus || 0}</td>
                                <td><button class="btn btn-sm btn-secondary" onclick="window.editRecord(${r.id})">✏️</button> <button class="btn btn-sm btn-danger" onclick="window.deleteRecord(${r.id})">🗑</button></td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>`;
    }
};

window.addProductionRecord = async function() {
    const projects = await DB.getAll('projects');
    const teams = await DB.getAll('teams');
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const currentKW = Math.ceil(((now - start) / 86400000 + start.getDay()) / 7);
    const line = window._prodLine || 'NE3';

    const lineProjects = projects.filter(p => p.lines && p.lines.includes(line));

    let body = `
        <div class="form-group">
            <label class="form-label">Proyecto</label>
            <select class="form-select" id="recProject">
                ${lineProjects.map(p => `<option value="${p.code}">${p.code} — ${p.name}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Equipo</label>
            <select class="form-select" id="recTeam">
                <option value="">— Sin equipo —</option>
                ${teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">KW</label>
            <input class="form-input" type="number" id="recKW" value="${currentKW}" min="1" max="52">
        </div>
        ${line === 'NE3' ? `
        <div class="form-group"><label class="form-label">Metros soplados (ML)</label><input class="form-input" type="number" id="recMeters" value="0"></div>
        <div class="form-group"><label class="form-label">Fusiones (DPs)</label><input class="form-input" type="number" id="recFusions" value="0"></div>
        <div class="form-group"><label class="form-label">Altas de cliente</label><input class="form-input" type="number" id="recAltas" value="0"></div>
        ` : `
        <div class="form-group"><label class="form-label">WEs montados</label><input class="form-input" type="number" id="recWEs" value="0"></div>
        <div class="form-group"><label class="form-label">MDUs completados</label><input class="form-input" type="number" id="recMDUs" value="0"></div>
        `}
    `;

    const footer = `
        <button class="btn btn-secondary" onclick="window.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="window.saveProductionRecord('${line}')">Guardar</button>
    `;

    window.openModal(`Nuevo registro ${line}`, body, footer);
};

window.saveProductionRecord = async function(line) {
    const projectCode = document.getElementById('recProject').value;
    const teamId = document.getElementById('recTeam').value;
    const kw = 'KW' + String(document.getElementById('recKW').value).padStart(2, '0');

    const project = await DB.get('projects', projectCode);
    const clientId = project ? project.clientId : '';
    const operatorId = project ? project.operatorId : '';

    const record = { projectCode, teamId, kw, line, timestamp: Date.now() };

    if (line === 'NE3') {
        record.meters = parseFloat(document.getElementById('recMeters').value) || 0;
        record.fusions = parseInt(document.getElementById('recFusions').value) || 0;
        record.activations = parseInt(document.getElementById('recAltas').value) || 0;
    } else {
        record.wes = parseInt(document.getElementById('recWEs').value) || 0;
        record.mdus = parseInt(document.getElementById('recMDUs').value) || 0;
    }

    // Generate unique code
    const allRecords = await DB.getAll('records');
    const sameScope = allRecords.filter(r => r.projectCode === projectCode && r.line === line && r.kw === kw);
    const seq = String(sameScope.length + 1).padStart(3, '0');
    record.code = `${clientId}-${operatorId}-${projectCode}-${line}-${kw}-${seq}`;

    await DB.add('records', record);
    window.closeModal();
    window.toast('Registro guardado', 'success');
    window.renderProdTable();
};

window.editRecord = async function(id) {
    const record = await DB.get('records', id);
    if (!record) return;
    const teams = await DB.getAll('teams');
    const line = record.line;

    let body = `
        <div class="form-group">
            <label class="form-label">Código</label>
            <input class="form-input" value="${record.code || ''}" disabled>
        </div>
        <div class="form-group">
            <label class="form-label">Equipo</label>
            <select class="form-select" id="editTeam">
                <option value="">— Sin equipo —</option>
                ${teams.map(t => `<option value="${t.id}" ${t.id === record.teamId ? 'selected' : ''}>${t.name}</option>`).join('')}
            </select>
        </div>
        ${line === 'NE3' ? `
        <div class="form-group"><label class="form-label">Metros (ML)</label><input class="form-input" type="number" id="editMeters" value="${record.meters || 0}"></div>
        <div class="form-group"><label class="form-label">Fusiones</label><input class="form-input" type="number" id="editFusions" value="${record.fusions || 0}"></div>
        <div class="form-group"><label class="form-label">Altas</label><input class="form-input" type="number" id="editAltas" value="${record.activations || 0}"></div>
        ` : `
        <div class="form-group"><label class="form-label">WEs</label><input class="form-input" type="number" id="editWEs" value="${record.wes || 0}"></div>
        <div class="form-group"><label class="form-label">MDUs</label><input class="form-input" type="number" id="editMDUs" value="${record.mdus || 0}"></div>
        `}
    `;

    const footer = `
        <button class="btn btn-secondary" onclick="window.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="window.updateRecord(${id}, '${line}')">Guardar</button>
    `;
    window.openModal('Editar registro', body, footer);
};

window.updateRecord = async function(id, line) {
    const record = await DB.get('records', id);
    if (!record) return;
    record.teamId = document.getElementById('editTeam').value;
    if (line === 'NE3') {
        record.meters = parseFloat(document.getElementById('editMeters').value) || 0;
        record.fusions = parseInt(document.getElementById('editFusions').value) || 0;
        record.activations = parseInt(document.getElementById('editAltas').value) || 0;
    } else {
        record.wes = parseInt(document.getElementById('editWEs').value) || 0;
        record.mdus = parseInt(document.getElementById('editMDUs').value) || 0;
    }
    await DB.put('records', record);
    window.closeModal();
    window.toast('Registro actualizado', 'success');
    window.renderProdTable();
};

window.deleteRecord = async function(id) {
    if (!confirm('¿Eliminar este registro?')) return;
    await DB.del('records', id);
    window.toast('Registro eliminado', 'info');
    window.renderProdTable();
};

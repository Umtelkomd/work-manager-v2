// Clients NE4 view — CSV import, raw data display, dropdown checkbox filters
window.render_clients = async function() {
    const container = document.getElementById('view-clients');
    const clients = await DB.getAll('clients');
    const projects = await DB.getAll('projects');

    container.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">Clientes NE4</div>
                <div class="section-sub">${clients.length} registros importados</div>
            </div>
            <div style="display:flex;gap:8px">
                <button class="btn btn-secondary" onclick="window.clearClients()">🗑 Limpiar</button>
                <button class="btn btn-primary" onclick="document.getElementById('csvUpload').click()">📂 Importar CSV</button>
            </div>
        </div>

        <input type="file" id="csvUpload" accept=".csv" style="display:none" onchange="window.handleCSVUpload(event)">

        <div class="filter-bar" id="clientFilters"></div>

        <div id="clientsTable"></div>
    `;

    // Setup filters from data
    window._clientFilters = { project: new Set(), phase: new Set(), contract: new Set() };

    if (clients.length > 0) {
        const uniqueProjects = [...new Set(clients.map(c => c.projectCode).filter(Boolean))];
        const uniquePhases = [...new Set(clients.map(c => c.Phase || c.phase || '').filter(Boolean))];
        const uniqueContracts = [...new Set(clients.map(c => c.GrundNA || c.contract || '').filter(Boolean))];

        if (uniqueProjects.length > 0) {
            window.createDropdownFilter('clientFilters', 'Proyecto', uniqueProjects.map(p => ({ value: p, label: p })), (sel) => { window._clientFilters.project = sel; window.renderClientsTable(); });
        }
        if (uniquePhases.length > 0) {
            window.createDropdownFilter('clientFilters', 'Phase', uniquePhases.map(p => ({ value: p, label: p })), (sel) => { window._clientFilters.phase = sel; window.renderClientsTable(); });
        }
        if (uniqueContracts.length > 0) {
            window.createDropdownFilter('clientFilters', 'Contract', uniqueContracts.map(p => ({ value: p, label: p })), (sel) => { window._clientFilters.contract = sel; window.renderClientsTable(); });
        }
    }

    window.renderClientsTable();
};

window.renderClientsTable = async function() {
    const clients = await DB.getAll('clients');
    const tableEl = document.getElementById('clientsTable');

    if (clients.length === 0) {
        tableEl.innerHTML = `
            <div class="upload-zone" onclick="document.getElementById('csvUpload').click()">
                <div class="icon">📄</div>
                <div class="label">Importar CSV de GO FiberConnect</div>
                <div class="hint">Arrastra o haz click para seleccionar archivo CSV</div>
            </div>`;
        return;
    }

    let filtered = [...clients];

    // Apply filters
    if (window._clientFilters.project.size > 0) filtered = filtered.filter(c => window._clientFilters.project.has(c.projectCode));
    if (window._clientFilters.phase.size > 0) filtered = filtered.filter(c => window._clientFilters.phase.has(c.Phase || c.phase || ''));
    if (window._clientFilters.contract.size > 0) filtered = filtered.filter(c => window._clientFilters.contract.has(c.GrundNA || c.contract || ''));

    // Get all column headers from the raw data (show raw CSV columns)
    const allKeys = new Set();
    filtered.forEach(c => {
        Object.keys(c).forEach(k => {
            if (k !== 'id' && k !== 'projectCode' && k !== 'importedAt') allKeys.add(k);
        });
    });
    const columns = [...allKeys];

    tableEl.innerHTML = `
        <div style="margin-bottom:12px;font-size:12px;color:var(--text-secondary)">${filtered.length} de ${clients.length} registros</div>
        <div class="table-wrap">
            <table>
                <thead><tr><th>#</th>${columns.map(c => `<th>${c}</th>`).join('')}</tr></thead>
                <tbody>
                    ${filtered.slice(0, 200).map((c, i) => `
                    <tr>
                        <td style="color:var(--text-secondary)">${i + 1}</td>
                        ${columns.map(col => `<td>${c[col] || ''}</td>`).join('')}
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>
        ${filtered.length > 200 ? `<div style="text-align:center;padding:16px;color:var(--text-secondary);font-size:12px">Mostrando 200 de ${filtered.length} registros</div>` : ''}
    `;
};

window.handleCSVUpload = async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const text = await file.text();
    const rows = window.parseCSV(text);

    if (rows.length === 0) {
        window.toast('CSV vacío o formato inválido', 'error');
        return;
    }

    // Ask which project to assign
    const projects = await DB.getAll('projects');
    const ne4Projects = projects.filter(p => p.lines && p.lines.includes('NE4'));

    let body = `
        <div class="form-group">
            <label class="form-label">Asignar a proyecto</label>
            <select class="form-select" id="csvProject">
                ${ne4Projects.map(p => `<option value="${p.code}">${p.code} — ${p.name}</option>`).join('')}
            </select>
        </div>
        <div style="margin-top:12px;font-size:13px;color:var(--text-secondary)">
            ${rows.length} filas encontradas · Columnas: ${Object.keys(rows[0]).join(', ')}
        </div>
    `;

    // Store rows temporarily
    window._csvPendingRows = rows;

    const footer = `
        <button class="btn btn-secondary" onclick="window.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="window.importCSVData()">Importar ${rows.length} filas</button>
    `;
    window.openModal('Importar CSV', body, footer);
    event.target.value = '';
};

window.importCSVData = async function() {
    const projectCode = document.getElementById('csvProject').value;
    const rows = window._csvPendingRows;
    if (!rows) return;

    let imported = 0;
    for (const row of rows) {
        // Skip clients without contract (empty GrundNA)
        if (row.GrundNA !== undefined && !row.GrundNA.trim()) continue;

        row.projectCode = projectCode;
        row.importedAt = Date.now();
        await DB.add('clients', row);
        imported++;
    }

    delete window._csvPendingRows;
    window.closeModal();
    window.toast(`${imported} registros importados (${rows.length - imported} sin contrato omitidos)`, 'success');
    window.render_clients();
};

window.clearClients = async function() {
    if (!confirm('¿Eliminar todos los registros de clientes importados?')) return;
    await DB.clear('clients');
    window.toast('Registros eliminados', 'info');
    window.render_clients();
};

// Projects view — hierarchical: Client → Operator → Project → Line
window.render_projects = async function() {
    const container = document.getElementById('view-projects');
    const projects = await DB.getAll('projects');
    const records = await DB.getAll('records');

    // Build hierarchy
    const hierarchy = {};
    for (const p of projects) {
        const client = PROJECT_SEED.clients.find(c => c.id === p.clientId) || { id: p.clientId, name: p.clientId };
        const operator = PROJECT_SEED.operators.find(o => o.id === p.operatorId) || { id: p.operatorId, name: p.operatorId };
        
        if (!hierarchy[client.id]) hierarchy[client.id] = { name: client.name, operators: {} };
        if (!hierarchy[client.id].operators[operator.id]) hierarchy[client.id].operators[operator.id] = { name: operator.name, projects: [] };
        hierarchy[client.id].operators[operator.id].projects.push(p);
    }

    let filterHTML = '<div class="filter-bar" id="projectFilters"></div>';

    let treeHTML = '';
    for (const [cId, cData] of Object.entries(hierarchy)) {
        treeHTML += `<div class="tree-group">
            <div class="tree-header" onclick="window.toggleTree(this)">
                <span class="arrow open">▶</span>
                <span class="label">${cData.name} (${cId})</span>
            </div>
            <div class="tree-children">`;

        for (const [oId, oData] of Object.entries(cData.operators)) {
            treeHTML += `<div class="tree-group">
                <div class="tree-header" onclick="window.toggleTree(this)">
                    <span class="arrow open">▶</span>
                    <span class="label" style="color: var(--text-secondary)">${oData.name} (${oId})</span>
                </div>
                <div class="tree-children">`;

            for (const p of oData.projects) {
                const pRecords = records.filter(r => r.projectCode === p.code);
                const ne3Count = pRecords.filter(r => r.line === 'NE3').length;
                const ne4Count = pRecords.filter(r => r.line === 'NE4').length;
                const meters = pRecords.filter(r => r.line === 'NE3').reduce((s, r) => s + (r.meters || 0), 0);
                const wes = pRecords.filter(r => r.line === 'NE4').reduce((s, r) => s + (r.wes || 0), 0);

                treeHTML += `
                <div class="project-card" style="margin: 8px 0" onclick="window.showProjectDetail('${p.code}')">
                    <div class="project-card-header">
                        <div>
                            <div class="project-code">${p.code}</div>
                            <div class="project-name">${p.name}</div>
                        </div>
                        <div style="display:flex;gap:4px">
                            ${p.lines.map(l => `<span class="badge ${l === 'NE3' ? 'badge-blue' : 'badge-green'}">${l}</span>`).join('')}
                        </div>
                    </div>
                    <div class="project-stats">
                        ${p.lines.includes('NE3') ? `<div><div class="project-stat-label">ML</div><div class="project-stat-value">${meters.toLocaleString('de-DE')}</div></div>
                        <div><div class="project-stat-label">NE3 Reg.</div><div class="project-stat-value">${ne3Count}</div></div>` : ''}
                        ${p.lines.includes('NE4') ? `<div><div class="project-stat-label">WEs</div><div class="project-stat-value">${wes}</div></div>
                        <div><div class="project-stat-label">NE4 Reg.</div><div class="project-stat-value">${ne4Count}</div></div>` : ''}
                    </div>
                </div>`;
            }
            treeHTML += `</div></div>`;
        }
        treeHTML += `</div></div>`;
    }

    container.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">Proyectos</div>
                <div class="section-sub">Jerarquía: Cliente → Operador → Proyecto</div>
            </div>
        </div>
        ${filterHTML}
        ${treeHTML || '<div class="empty-state"><div class="icon">📁</div><div class="title">Sin proyectos</div></div>'}
    `;

    // Setup filters
    const filterContainer = document.getElementById('projectFilters');
    if (filterContainer) {
        // Filters are visual placeholders — filtering happens via tree collapse
    }
};

window.toggleTree = function(header) {
    const arrow = header.querySelector('.arrow');
    const children = header.nextElementSibling;
    if (children) {
        children.classList.toggle('collapsed');
        arrow.classList.toggle('open');
    }
};

window.showProjectDetail = async function(code) {
    const project = await DB.get('projects', code);
    if (!project) return;
    
    const records = await DB.getAll('records');
    const pRecords = records.filter(r => r.projectCode === code);
    const teams = await DB.getAll('teams');
    const assignments = await DB.getAll('team_assignments');
    const pAssignments = assignments.filter(a => a.projectCode === code);

    const client = PROJECT_SEED.clients.find(c => c.id === project.clientId);
    const operator = PROJECT_SEED.operators.find(o => o.id === project.operatorId);

    let body = `
        <div style="margin-bottom:16px">
            <div style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px">${client ? client.name : ''} → ${operator ? operator.name : ''}</div>
            <div style="display:flex;gap:6px;margin-top:8px">
                ${project.lines.map(l => `<span class="badge ${l === 'NE3' ? 'badge-blue' : 'badge-green'}">${l}</span>`).join('')}
            </div>
        </div>
        <div class="kpi-grid" style="margin-bottom:16px">
            ${project.lines.includes('NE3') ? `
            <div class="kpi-card">
                <div class="kpi-label">Metros (ML)</div>
                <div class="kpi-value green">${pRecords.filter(r => r.line === 'NE3').reduce((s, r) => s + (r.meters || 0), 0).toLocaleString('de-DE')}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Fusiones</div>
                <div class="kpi-value blue">${pRecords.filter(r => r.line === 'NE3').reduce((s, r) => s + (r.fusions || 0), 0)}</div>
            </div>` : ''}
            ${project.lines.includes('NE4') ? `
            <div class="kpi-card">
                <div class="kpi-label">WEs</div>
                <div class="kpi-value green">${pRecords.filter(r => r.line === 'NE4').reduce((s, r) => s + (r.wes || 0), 0)}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">MDUs</div>
                <div class="kpi-value blue">${pRecords.filter(r => r.line === 'NE4').reduce((s, r) => s + (r.mdus || 0), 0)}</div>
            </div>` : ''}
        </div>

        <h4 style="font-size:14px;font-weight:600;margin-bottom:10px">Equipos asignados</h4>
        ${pAssignments.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px">
            ${[...new Set(pAssignments.map(a => a.teamId))].map(tid => {
                const team = teams.find(t => t.id === tid);
                return `<span class="badge badge-blue">${team ? team.name : tid}</span>`;
            }).join('')}
        </div>` : '<div style="color:var(--text-secondary);font-size:13px;margin-bottom:16px">Sin equipos asignados</div>'}

        <h4 style="font-size:14px;font-weight:600;margin-bottom:10px">Últimos registros</h4>
        ${pRecords.length > 0 ? `
        <div class="table-wrap">
            <table>
                <thead><tr><th>Código</th><th>Línea</th><th>KW</th><th>Equipo</th><th>Valores</th></tr></thead>
                <tbody>
                    ${pRecords.slice(-10).reverse().map(r => `
                    <tr>
                        <td style="font-family:monospace;font-size:11px">${r.code || '-'}</td>
                        <td><span class="badge ${r.line === 'NE3' ? 'badge-blue' : 'badge-green'}">${r.line}</span></td>
                        <td>${r.kw}</td>
                        <td>${r.teamId || '-'}</td>
                        <td>${r.line === 'NE3' ? `${r.meters || 0}m · ${r.fusions || 0} fus` : `${r.wes || 0} WEs · ${r.mdus || 0} MDUs`}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>` : '<div style="color:var(--text-secondary);font-size:13px">Sin registros</div>'}
    `;

    window.openModal(project.name, body);
};

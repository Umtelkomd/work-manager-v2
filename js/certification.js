// Certification & Invoicing view
window.render_certification = async function() {
    const container = document.getElementById('view-certification');
    const records = await DB.getAll('records');
    const certifications = await DB.getAll('certification');

    // Build cert status map
    const certMap = {};
    certifications.forEach(c => { certMap[c.recordId] = c; });

    // Stats
    const total = records.length;
    const certified = certifications.filter(c => c.status === 'certified' || c.status === 'invoiced').length;
    const invoiced = certifications.filter(c => c.status === 'invoiced').length;
    const pending = total - certified;

    // Calculate totals from price list
    let certValue = 0;
    let invoicedValue = 0;
    certifications.forEach(c => { certValue += c.amount || 0; if (c.status === 'invoiced') invoicedValue += c.amount || 0; });

    container.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">Certificación & Facturación</div>
                <div class="section-sub">${total} registros totales</div>
            </div>
            <button class="btn btn-secondary" onclick="window.exportCertification()">📥 Exportar CSV</button>
        </div>

        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label">Pendientes</div>
                <div class="kpi-value orange">${pending}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Certificados</div>
                <div class="kpi-value green">${certified}</div>
                <div class="kpi-sub">€ ${certValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Facturados</div>
                <div class="kpi-value blue">${invoiced}</div>
                <div class="kpi-sub">€ ${invoicedValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</div>
            </div>
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

window.renderCertTable = async function() {
    const records = await DB.getAll('records');
    const certifications = await DB.getAll('certification');
    const teams = await DB.getAll('teams');
    const certMap = {};
    certifications.forEach(c => { certMap[c.recordId] = c; });

    let filtered;
    if (window._certTab === 'pending') {
        filtered = records.filter(r => !certMap[r.id]);
    } else if (window._certTab === 'certified') {
        filtered = records.filter(r => certMap[r.id] && certMap[r.id].status === 'certified');
    } else if (window._certTab === 'invoiced') {
        filtered = records.filter(r => certMap[r.id] && certMap[r.id].status === 'invoiced');
    } else {
        filtered = records;
    }

    const tableEl = document.getElementById('certTable');

    if (filtered.length === 0) {
        tableEl.innerHTML = `<div class="empty-state"><div class="icon">✅</div><div class="title">Sin registros en esta categoría</div></div>`;
        return;
    }

    tableEl.innerHTML = `
        <div class="table-wrap">
            <table>
                <thead><tr><th><input type="checkbox" onchange="window.toggleAllCert(this)"></th><th>Código</th><th>Proyecto</th><th>Línea</th><th>KW</th><th>Valores</th><th>Monto €</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                    ${filtered.map(r => {
                        const cert = certMap[r.id];
                        const amount = cert ? cert.amount : window.calcRecordPrice(r);
                        const status = cert ? cert.status : 'pending';
                        const team = teams.find(t => t.id === r.teamId);
                        const statusBadge = status === 'invoiced' ? '<span class="badge badge-blue">Facturado</span>' :
                                           status === 'certified' ? '<span class="badge badge-green">Certificado</span>' :
                                           '<span class="badge badge-orange">Pendiente</span>';

                        return `<tr>
                            <td><input type="checkbox" class="cert-check" data-id="${r.id}"></td>
                            <td style="font-family:monospace;font-size:11px">${r.code || '-'}</td>
                            <td>${r.projectCode}</td>
                            <td><span class="badge ${r.line === 'NE3' ? 'badge-blue' : 'badge-green'}">${r.line}</span></td>
                            <td>${r.kw}</td>
                            <td>${r.line === 'NE3' ? `${r.meters || 0}m · ${r.fusions || 0} fus · ${r.activations || 0} altas` : `${r.wes || 0} WEs · ${r.mdus || 0} MDUs`}</td>
                            <td style="font-weight:600">€ ${amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</td>
                            <td>${statusBadge}</td>
                            <td>
                                ${status === 'pending' ? `<button class="btn btn-sm btn-success" onclick="window.certifyRecord(${r.id})">Certificar</button>` : ''}
                                ${status === 'certified' ? `<button class="btn btn-sm btn-primary" onclick="window.invoiceRecord(${r.id})">Facturar</button>` : ''}
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px">
            <button class="btn btn-success btn-sm" onclick="window.certifySelected()">Certificar seleccionados</button>
            <button class="btn btn-primary btn-sm" onclick="window.invoiceSelected()">Facturar seleccionados</button>
        </div>
    `;
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

window.certifyRecord = async function(recordId) {
    const record = await DB.get('records', recordId);
    if (!record) return;
    const amount = window.calcRecordPrice(record);
    await DB.add('certification', { recordId, status: 'certified', amount, certifiedAt: Date.now() });
    window.toast('Registro certificado', 'success');
    window.render_certification();
};

window.invoiceRecord = async function(recordId) {
    const certifications = await DB.getAll('certification');
    const cert = certifications.find(c => c.recordId === recordId);
    if (!cert) return;
    cert.status = 'invoiced';
    cert.invoicedAt = Date.now();
    await DB.put('certification', cert);
    window.toast('Registro facturado', 'success');
    window.render_certification();
};

window.toggleAllCert = function(cb) {
    document.querySelectorAll('.cert-check').forEach(c => c.checked = cb.checked);
};

window.certifySelected = async function() {
    const checks = document.querySelectorAll('.cert-check:checked');
    for (const cb of checks) {
        const id = parseInt(cb.dataset.id);
        const record = await DB.get('records', id);
        if (!record) continue;
        const certifications = await DB.getAll('certification');
        if (certifications.find(c => c.recordId === id)) continue;
        const amount = window.calcRecordPrice(record);
        await DB.add('certification', { recordId: id, status: 'certified', amount, certifiedAt: Date.now() });
    }
    window.toast(`${checks.length} registros certificados`, 'success');
    window.render_certification();
};

window.invoiceSelected = async function() {
    const checks = document.querySelectorAll('.cert-check:checked');
    let count = 0;
    for (const cb of checks) {
        const id = parseInt(cb.dataset.id);
        const certifications = await DB.getAll('certification');
        const cert = certifications.find(c => c.recordId === id && c.status === 'certified');
        if (!cert) continue;
        cert.status = 'invoiced';
        cert.invoicedAt = Date.now();
        await DB.put('certification', cert);
        count++;
    }
    window.toast(`${count} registros facturados`, 'success');
    window.render_certification();
};

window.exportCertification = async function() {
    const records = await DB.getAll('records');
    const certifications = await DB.getAll('certification');
    const certMap = {};
    certifications.forEach(c => { certMap[c.recordId] = c; });

    const data = records.map(r => {
        const cert = certMap[r.id];
        return {
            Código: r.code || '',
            Proyecto: r.projectCode,
            Línea: r.line,
            KW: r.kw,
            Equipo: r.teamId || '',
            Metros: r.meters || '',
            Fusiones: r.fusions || '',
            Altas: r.activations || '',
            WEs: r.wes || '',
            MDUs: r.mdus || '',
            'Monto €': cert ? cert.amount.toFixed(2) : window.calcRecordPrice(r).toFixed(2),
            Estado: cert ? (cert.status === 'invoiced' ? 'Facturado' : 'Certificado') : 'Pendiente',
            'Fecha Cert.': cert && cert.certifiedAt ? new Date(cert.certifiedAt).toLocaleDateString('de-DE') : '',
            'Fecha Fact.': cert && cert.invoicedAt ? new Date(cert.invoicedAt).toLocaleDateString('de-DE') : ''
        };
    });

    window.exportCSV(data, `certificacion_${new Date().toISOString().split('T')[0]}.csv`);
    window.toast('CSV exportado', 'success');
};

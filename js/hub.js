// Hub — Central App Launcher
window.render_hub = function() {
    const el = document.getElementById('view-hub');
    if (!el) return;

    el.innerHTML = `
    <div class="hub-container">

        <!-- Campo -->
        <div class="hub-section">
            <h2 class="hub-section-title">📡 Campo</h2>
            <div class="hub-grid">

                <div class="hub-card">
                    <div class="hub-card-header">
                        <span class="hub-icon">🔵</span>
                        <div>
                            <div class="hub-card-name">WestConnect — Tech View</div>
                            <div class="hub-card-desc">Vista técnica para equipos WestConnect</div>
                        </div>
                    </div>
                    <div class="hub-pins">
                        <div class="hub-pin-title">PINs de equipo</div>
                        <div class="hub-pin-grid">
                            <span class="hub-pin"><b>West-001</b> 2345</span>
                            <span class="hub-pin"><b>West-002</b> 3456</span>
                            <span class="hub-pin"><b>West-003</b> 4567</span>
                            <span class="hub-pin"><b>West-004</b> 5678</span>
                        </div>
                    </div>
                    <button class="hub-btn" onclick="window.open('https://jarl9801.github.io/field-report/westconnect.html','_blank')">Abrir ↗</button>
                </div>

                <div class="hub-card">
                    <div class="hub-card-header">
                        <span class="hub-icon">🟢</span>
                        <div>
                            <div class="hub-card-name">Glasfaser Plus — Tech View</div>
                            <div class="hub-card-desc">Vista técnica para equipos Glasfaser Plus</div>
                        </div>
                    </div>
                    <div class="hub-pins">
                        <div class="hub-pin-title">PINs de equipo</div>
                        <div class="hub-pin-grid">
                            <span class="hub-pin"><b>Plus-001</b> 1234</span>
                        </div>
                    </div>
                    <button class="hub-btn" onclick="window.open('https://jarl9801.github.io/field-report/glasfaser.html','_blank')">Abrir ↗</button>
                </div>

                <div class="hub-card">
                    <div class="hub-card-header">
                        <span class="hub-icon">📋</span>
                        <div>
                            <div class="hub-card-name">Field Report Admin</div>
                            <div class="hub-card-desc">Admin citas WestConnect — asignación y seguimiento</div>
                            <div class="hub-card-desc" style="color:var(--accent);font-size:11px;">PIN Isabelle: 0223 · Integrado en v2 → Citas NE4</div>
                        </div>
                    </div>
                    <button class="hub-btn" onclick="window.open('https://jarl9801.github.io/field-report/admin.html','_blank')">Abrir ↗</button>
                </div>

                <div class="hub-card">
                    <div class="hub-card-header">
                        <span class="hub-icon">📖</span>
                        <div>
                            <div class="hub-card-name">Field Report Manual</div>
                            <div class="hub-card-desc">Guía de uso del sistema de reportes de campo</div>
                        </div>
                    </div>
                    <button class="hub-btn" onclick="window.open('https://jarl9801.github.io/field-report/manual.html','_blank')">Abrir ↗</button>
                </div>

            </div>
        </div>

        <!-- Finanzas -->
        <div class="hub-section">
            <h2 class="hub-section-title">💰 Finanzas</h2>
            <div class="hub-grid">

                <div class="hub-card">
                    <div class="hub-card-header">
                        <span class="hub-icon">📊</span>
                        <div>
                            <div class="hub-card-name">FinControl</div>
                            <div class="hub-card-desc">Control financiero — transacciones, CXP, CXC, cashflow</div>
                        </div>
                    </div>
                    <button class="hub-btn hub-btn-primary" onclick="window.open('https://umtelkomd-finance.web.app','_blank')">Abrir ↗</button>
                </div>

            </div>
        </div>

        <!-- Herramientas -->
        <div class="hub-section">
            <h2 class="hub-section-title">🔧 Herramientas Externas</h2>
            <div class="hub-grid">

                <div class="hub-card">
                    <div class="hub-card-header">
                        <span class="hub-icon">🌐</span>
                        <div>
                            <div class="hub-card-name">GO FiberConnect</div>
                            <div class="hub-card-desc">Fuente de datos de proyectos. Requiere 2FA.</div>
                        </div>
                    </div>
                    <button class="hub-btn" onclick="window.open('https://dg.connectsoftware.nl','_blank')">Abrir ↗</button>
                </div>

                <div class="hub-card">
                    <div class="hub-card-header">
                        <span class="hub-icon">📋</span>
                        <div>
                            <div class="hub-card-name">Google Sheets</div>
                            <div class="hub-card-desc">Hojas de cálculo clave del proyecto</div>
                        </div>
                    </div>
                    <div class="hub-links">
                        <a class="hub-link" href="https://docs.google.com/spreadsheets/d/1g3-t2_02wSLpg2LPBvRgEFY3EFjYPxZJTfpyoAa--EE" target="_blank">📄 Soplado RD</a>
                        <a class="hub-link" href="https://docs.google.com/spreadsheets/d/1jLQf3brTId_hU2nmU16BapEvTYxYDbJJyR6IV_u7MOc" target="_blank">📄 Soplado RA</a>
                        <a class="hub-link" href="https://docs.google.com/spreadsheets/d/1Ssq_EYReehe8ddOrho1B08CzTocXYr2o7Qlnf73gxcs" target="_blank">📄 Fusiones DP</a>
                        <a class="hub-link" href="https://docs.google.com/spreadsheets/d/19gmi3TLzhlsfq5K_l5-T1EmDt7EheTkouqMEFcUYPUw" target="_blank">📄 Field Reports</a>
                    </div>
                </div>

            </div>
        </div>

        <!-- Legacy -->
        <div class="hub-section">
            <h2 class="hub-section-title">🗂️ Legacy</h2>
            <div class="hub-grid">

                <div class="hub-card hub-card-legacy">
                    <div class="hub-card-header">
                        <span class="hub-icon">⚙️</span>
                        <div>
                            <div class="hub-card-name">Work Manager v1 <span class="hub-badge-legacy">Legacy</span></div>
                            <div class="hub-card-desc">En migración a v2</div>
                        </div>
                    </div>
                    <button class="hub-btn" onclick="window.open('https://jarl9801.github.io/work-manager/','_blank')">Abrir ↗</button>
                </div>

            </div>
        </div>

    </div>`;
};

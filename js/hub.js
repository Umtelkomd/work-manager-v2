// Hub — Nexus Command Center v3.0
// Diseno enterprise: Linear × Vercel × Notion

window.render_hub = function() {
    const el = document.getElementById('view-hub');
    if (!el) return;

    el.innerHTML = `
    <div class="nexus-container">

        <div class="nexus-header">
            <div class="nexus-header-content">
                <div class="nexus-brand">
                    <div class="nexus-logo">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                        </svg>
                    </div>
                    <div class="nexus-brand-text">
                        <h1>Nexus<span>OS</span></h1>
                        <p>Command Center</p>
                    </div>
                </div>
                <div class="nexus-status-bar">
                    <div class="nexus-status-item">
                        <span class="nexus-status-dot nexus-status-online"></span>
                        <span>Sistemas online</span>
                    </div>
                    <div class="nexus-time" id="nexusClock">--:--</div>
                </div>
            </div>
        </div>

        <div class="nexus-stats">
            <div class="nexus-stat-card">
                <div class="nexus-stat-value">6</div>
                <div class="nexus-stat-label">Apps activas</div>
                <div class="nexus-stat-trend nexus-trend-up">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                        <polyline points="17 6 23 6 23 12"/>
                    </svg>
                    100%
                </div>
            </div>
            <div class="nexus-stat-card">
                <div class="nexus-stat-value">4</div>
                <div class="nexus-stat-label">Proyectos NE3/NE4</div>
                <div class="nexus-stat-trend">En curso</div>
            </div>
            <div class="nexus-stat-card">
                <div class="nexus-stat-value">2</div>
                <div class="nexus-stat-label">Equipos campo</div>
                <div class="nexus-stat-trend">WestConnect + GFP</div>
            </div>
        </div>

        <div class="nexus-section">
            <div class="nexus-section-header">
                <div class="nexus-section-title">
                    <span class="nexus-section-icon">🐙</span>
                    <div>
                        <h2>Nexus Ecosystem</h2>
                        <p>Tus aplicaciones conectadas</p>
                    </div>
                </div>
                <button class="nexus-btn nexus-btn-ghost" onclick="window.open('https://github.com/jarl9801','_blank')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                    </svg>
                    GitHub
                </button>
            </div>

            <div class="nexus-app-grid">

                <div class="nexus-app-card nexus-app-local" data-app="workmanager">
                    <div class="nexus-app-accent nexus-accent-primary"></div>
                    <div class="nexus-app-body">
                        <div class="nexus-app-top">
                            <div class="nexus-app-badge nexus-badge-local">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                                    <line x1="8" y1="21" x2="16" y2="21"/>
                                    <line x1="12" y1="17" x2="12" y2="21"/>
                                </svg>
                                Local
                            </div>
                            <button class="nexus-app-menu">⋯</button>
                        </div>
                        <div class="nexus-app-icon-lg nexus-icon-gradient">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="7" height="7" rx="1"/>
                                <rect x="14" y="3" width="7" height="7" rx="1"/>
                                <rect x="3" y="14" width="7" height="7" rx="1"/>
                                <rect x="14" y="14" width="7" height="7" rx="1"/>
                            </svg>
                        </div>
                        <div class="nexus-app-info">
                            <h3>Work Manager</h3>
                            <p>Control de proyectos fibra optica NE3/NE4</p>
                        </div>
                        <div class="nexus-app-footer">
                            <span class="nexus-tag">v2.0</span>
                            <button class="nexus-btn nexus-btn-sm" onclick="window.navigate('dashboard')">Abrir</button>
                        </div>
                    </div>
                </div>

                <div class="nexus-app-card" data-app="fincontrol">
                    <div class="nexus-app-accent nexus-accent-green"></div>
                    <div class="nexus-app-body">
                        <div class="nexus-app-top">
                            <div class="nexus-app-badge nexus-badge-cloud">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
                                </svg>
                                Firebase
                            </div>
                            <button class="nexus-app-menu">⋯</button>
                        </div>
                        <div class="nexus-app-icon-lg nexus-icon-green">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="1" x2="12" y2="23"/>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                            </svg>
                        </div>
                        <div class="nexus-app-info">
                            <h3>FinControl</h3>
                            <p>Finanzas, CXP/CXC, cashflow en tiempo real</p>
                        </div>
                        <div class="nexus-app-footer">
                            <span class="nexus-tag nexus-tag-green">Produccion</span>
                            <button class="nexus-btn nexus-btn-sm nexus-btn-green" onclick="window.open('https://umtelkomd-finance.web.app','_blank')">Abrir</button>
                        </div>
                    </div>
                </div>

                <div class="nexus-app-card" data-app="stockanalyzer">
                    <div class="nexus-app-accent nexus-accent-orange"></div>
                    <div class="nexus-app-body">
                        <div class="nexus-app-top">
                            <div class="nexus-app-badge nexus-badge-cloud">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                                </svg>
                                GitHub
                            </div>
                            <button class="nexus-app-menu">⋯</button>
                        </div>
                        <div class="nexus-app-icon-lg nexus-icon-orange">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                                <polyline points="16 7 22 7 22 13"/>
                            </svg>
                        </div>
                        <div class="nexus-app-info">
                            <h3>Stock Analyzer</h3>
                            <p>Valuacion DCF, portfolio multi-lote, scanner</p>
                        </div>
                        <div class="nexus-app-footer">
                            <span class="nexus-tag nexus-tag-orange">Terminal</span>
                            <button class="nexus-btn nexus-btn-sm nexus-btn-orange" onclick="window.open('https://jarl9801.github.io/stock-analyzer/','_blank')">Abrir</button>
                        </div>
                    </div>
                </div>

                <div class="nexus-app-card" data-app="nexusweb">
                    <div class="nexus-app-accent nexus-accent-blue"></div>
                    <div class="nexus-app-body">
                        <div class="nexus-app-top">
                            <div class="nexus-app-badge nexus-badge-cloud">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="2" y1="12" x2="22" y2="12"/>
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                                </svg>
                                Netlify
                            </div>
                            <button class="nexus-app-menu">⋯</button>
                        </div>
                        <div class="nexus-app-icon-lg nexus-icon-blue">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="2" y1="12" x2="22" y2="12"/>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                            </svg>
                        </div>
                        <div class="nexus-app-info">
                            <h3>Nexus Website</h3>
                            <p>Web corporativa con i18n y animaciones</p>
                        </div>
                        <div class="nexus-app-footer">
                            <span class="nexus-tag nexus-tag-blue">React 19</span>
                            <button class="nexus-btn nexus-btn-sm nexus-btn-blue" onclick="window.open('https://hmr-nexus.com','_blank')">Abrir</button>
                        </div>
                    </div>
                </div>

                <div class="nexus-app-card" data-app="nexusbot">
                    <div class="nexus-app-accent nexus-accent-purple"></div>
                    <div class="nexus-app-body">
                        <div class="nexus-app-top">
                            <div class="nexus-app-badge nexus-badge-cloud">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
                                    <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
                                    <line x1="6" y1="6" x2="6.01" y2="6"/>
                                    <line x1="6" y1="18" x2="6.01" y2="18"/>
                                </svg>
                                Railway
                            </div>
                            <button class="nexus-app-menu">⋯</button>
                        </div>
                        <div class="nexus-app-icon-lg nexus-icon-purple">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                        </div>
                        <div class="nexus-app-info">
                            <h3>Nexus Bot</h3>
                            <p>Telegram bot con API Groq LLM</p>
                        </div>
                        <div class="nexus-app-footer">
                            <span class="nexus-tag nexus-tag-purple">Node.js</span>
                            <button class="nexus-btn nexus-btn-sm nexus-btn-purple" onclick="window.open('https://t.me/HMRNexusBot','_blank')">Abrir</button>
                        </div>
                    </div>
                </div>

                <div class="nexus-app-card" data-app="fieldreport">
                    <div class="nexus-app-accent nexus-accent-teal"></div>
                    <div class="nexus-app-body">
                        <div class="nexus-app-top">
                            <div class="nexus-app-badge nexus-badge-cloud">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                                </svg>
                                GitHub
                            </div>
                            <button class="nexus-app-menu">⋯</button>
                        </div>
                        <div class="nexus-app-icon-lg nexus-icon-teal">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10 9 9 9 8 9"/>
                            </svg>
                        </div>
                        <div class="nexus-app-info">
                            <h3>Field Report</h3>
                            <p>Gestion de citas para equipos de campo</p>
                        </div>
                        <div class="nexus-app-footer">
                            <span class="nexus-tag nexus-tag-teal">PWA</span>
                            <button class="nexus-btn nexus-btn-sm nexus-btn-teal" onclick="window.open('https://jarl9801.github.io/field-report/','_blank')">Abrir</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <div class="nexus-section">
            <div class="nexus-section-header">
                <div class="nexus-section-title">
                    <span class="nexus-section-icon">📡</span>
                    <div>
                        <h2>Operaciones</h2>
                        <p>Herramientas de campo y acceso directo</p>
                    </div>
                </div>
            </div>

            <div class="nexus-ops-grid">

                <div class="nexus-op-card">
                    <div class="nexus-op-header">
                        <div class="nexus-op-icon nexus-op-west">W</div>
                        <div class="nexus-op-title">
                            <h4>WestConnect</h4>
                            <span>Vista tecnica</span>
                        </div>
                    </div>
                    <div class="nexus-op-pins">
                        <div class="nexus-pin"><span>001</span>2345</div>
                        <div class="nexus-pin"><span>002</span>3456</div>
                        <div class="nexus-pin"><span>003</span>4567</div>
                        <div class="nexus-pin"><span>004</span>5678</div>
                    </div>
                    <button class="nexus-btn nexus-btn-ghost nexus-btn-full" onclick="window.open('https://jarl9801.github.io/field-report/westconnect.html','_blank')">Abrir</button>
                </div>

                <div class="nexus-op-card">
                    <div class="nexus-op-header">
                        <div class="nexus-op-icon nexus-op-gfp">G</div>
                        <div class="nexus-op-title">
                            <h4>Glasfaser Plus</h4>
                            <span>Vista tecnica</span>
                        </div>
                    </div>
                    <div class="nexus-op-pins">
                        <div class="nexus-pin"><span>001</span>1234</div>
                    </div>
                    <button class="nexus-btn nexus-btn-ghost nexus-btn-full" onclick="window.open('https://jarl9801.github.io/field-report/glasfaser.html','_blank')">Abrir</button>
                </div>

                <div class="nexus-op-card nexus-op-wide">
                    <div class="nexus-op-header">
                        <div class="nexus-op-icon nexus-op-admin">📊</div>
                        <div class="nexus-op-title">
                            <h4>Field Report Admin</h4>
                            <span>Asignacion y seguimiento de citas</span>
                        </div>
                    </div>
                    <div class="nexus-op-note">PIN Isabelle: 0223 · Integrado en Citas NE4</div>
                    <button class="nexus-btn nexus-btn-ghost nexus-btn-full" onclick="window.open('https://jarl9801.github.io/field-report/admin.html','_blank')">Abrir Panel Admin</button>
                </div>

                <div class="nexus-op-card nexus-op-wide">
                    <div class="nexus-op-header">
                        <div class="nexus-op-icon nexus-op-go">🌐</div>
                        <div class="nexus-op-title">
                            <h4>GO FiberConnect</h4>
                            <span>Fuente de datos de proyectos · Requiere 2FA</span>
                        </div>
                    </div>
                    <button class="nexus-btn nexus-btn-ghost nexus-btn-full" onclick="window.open('https://dg.connectsoftware.nl','_blank')">Acceder</button>
                </div>

            </div>
        </div>

        <div class="nexus-section">
            <div class="nexus-section-header">
                <div class="nexus-section-title">
                    <span class="nexus-section-icon">📑</span>
                    <div>
                        <h2>Recursos</h2>
                        <p>Google Sheets y documentacion</p>
                    </div>
                </div>
            </div>

            <div class="nexus-resources-grid">
                <a href="https://docs.google.com/spreadsheets/d/1g3-t2_02wSLpg2LPBvRgEFY3EFjYPxZJTfpyoAa--EE" target="_blank" class="nexus-resource">
                    <div class="nexus-resource-icon">💨</div>
                    <div class="nexus-resource-info">
                        <h4>Soplado RD</h4>
                        <span>Google Sheets</span>
                    </div>
                </a>
                <a href="https://docs.google.com/spreadsheets/d/1jLQf3brTId_hU2nmU16BapEvTYxYDbJJyR6IV_u7MOc" target="_blank" class="nexus-resource">
                    <div class="nexus-resource-icon">💨</div>
                    <div class="nexus-resource-info">
                        <h4>Soplado RA</h4>
                        <span>Google Sheets</span>
                    </div>
                </a>
                <a href="https://docs.google.com/spreadsheets/d/1Ssq_EYReehe8ddOrho1B08CzTocXYr2o7Qlnf73gxcs" target="_blank" class="nexus-resource">
                    <div class="nexus-resource-icon">🔧</div>
                    <div class="nexus-resource-info">
                        <h4>Fusiones DP</h4>
                        <span>Google Sheets</span>
                    </div>
                </a>
                <a href="https://docs.google.com/spreadsheets/d/19gmi3TLzhlsfq5K_l5-T1EmDt7EheTkouqMEFcUYPUw" target="_blank" class="nexus-resource">
                    <div class="nexus-resource-icon">📋</div>
                    <div class="nexus-resource-info">
                        <h4>Field Reports</h4>
                        <span>Google Sheets</span>
                    </div>
                </a>
            </div>
        </div>

    </div>`;

    // Reloj en tiempo real
    const updateClock = () => {
        const clock = document.getElementById('nexusClock');
        if (clock) {
            const now = new Date();
            clock.textContent = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        }
    };
    updateClock();
    setInterval(updateClock, 60000);

    // Animacion de entrada
    setTimeout(() => {
        document.querySelectorAll('.nexus-app-card').forEach((card, i) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, i * 60);
        });
    }, 50);
};

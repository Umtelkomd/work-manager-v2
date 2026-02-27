// Nexus OS v3.3 — Full Power Edition
// Firebase + Real-time + Calendar + Production Stats + Notifications

window.NexusHub = {
    state: {
        viewMode: 'grid',
        searchQuery: '',
        recentApps: JSON.parse(localStorage.getItem('nexusRecent') || '[]'),
        favorites: JSON.parse(localStorage.getItem('nexusFavs') || '[]'),
        theme: localStorage.getItem('nexusTheme') || 'dark',
        weather: null,
        projects: [],
        appointments: [],
        todayAppointments: [],
        productionStats: {
            totalProjects: 0,
            completedThisWeek: 0,
            pendingCert: 0,
            revenue: 0
        },
        syncStatus: 'idle', // idle | syncing | error | synced
        notifications: [],
        unreadCount: 0
    },

    apps: [
        { id: 'workmanager', name: 'Work Manager', desc: 'Control de proyectos fibra', icon: '⚡', color: 'gradient', type: 'local', url: null, view: 'dashboard' },
        { id: 'fincontrol', name: 'FinControl', desc: 'Finanzas y cashflow', icon: '💰', color: 'green', type: 'cloud', url: 'https://umtelkomd-finance.web.app' },
        { id: 'stockanalyzer', name: 'Stock Analyzer', desc: 'Valuación DCF', icon: '📈', color: 'orange', type: 'cloud', url: 'https://jarl9801.github.io/stock-analyzer/' },
        { id: 'nexusweb', name: 'Nexus Website', desc: 'Web corporativa', icon: '🌐', color: 'blue', type: 'cloud', url: 'https://hmr-nexus.com' },
        { id: 'nexusbot', name: 'Nexus Bot', desc: 'Telegram bot AI', icon: '🤖', color: 'purple', type: 'cloud', url: 'https://t.me/HMRNexusBot' },
        { id: 'fieldreport', name: 'Field Report', desc: 'Gestión de citas', icon: '📋', color: 'teal', type: 'cloud', url: 'https://jarl9801.github.io/field-report/' }
    ],

    config: {
        firebase: {
            // Configuración se carga desde el entorno o se deja para integración posterior
            projectId: 'umtelkomd-finance',
            syncInterval: 300000 // 5 minutos
        },
        weather: {
            lat: 52.52,
            lon: 13.41,
            city: 'Berlin'
        }
    },

    init() {
        this.applyTheme();
        this.render();
        this.setupKeyboardShortcuts();
        this.startClock();
        this.loadWeather();
        this.loadAllData();
        this.startAutoSync();
        this.checkForNotifications();
    },

    render() {
        const el = document.getElementById('view-hub');
        if (!el) return;

        el.innerHTML = `
            ${this.renderHeader()}
            ${this.renderCommandPalette()}
            ${this.renderDashboard()}
            ${this.renderApps()}
            ${this.renderOperations()}
            ${this.renderResources()}
        `;

        this.attachEvents();
        this.animateEntry();
    },

    renderHeader() {
        const hasNotifications = this.state.unreadCount > 0;
        
        return `
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
                <div class="nexus-header-widgets">
                    ${this.renderWeatherWidget()}
                    <button class="nexus-theme-toggle" onclick="NexusHub.toggleTheme()" title="Cambiar tema">
                        ${this.state.theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    
                    <button class="nexus-notifications-btn ${hasNotifications ? 'nexus-notifications-unread' : ''}" 
                            onclick="NexusHub.toggleNotifications()"
                            title="Notificaciones"
                    >
                        🔔
                        ${hasNotifications ? `<span class="nexus-notifications-badge">${this.state.unreadCount}</span>` : ''}
                    </button>
                    
                    <div class="nexus-status-bar">
                        <div class="nexus-status-item nexus-sync-${this.state.syncStatus}"
                             onclick="NexusHub.manualSync()"
                             title="Click para sincronizar"
                        >
                            <span class="nexus-status-dot"></span>
                            <span class="nexus-sync-text">${this.getSyncStatusText()}</span>
                        </div>
                        <div class="nexus-time" id="nexusClock">--:--</div>
                    </div>
                </div>
            </div>
        </div>
        
        ${this.renderNotificationsPanel()}`;
    },

    renderNotificationsPanel() {
        const notifications = this.state.notifications.slice(0, 5);
        
        return `
        <div class="nexus-notifications-panel" id="nexusNotificationsPanel" style="display:none">
            <div class="nexus-notifications-header">
                <h3>Notificaciones</h3>
                <button class="nexus-btn nexus-btn-ghost nexus-btn-sm" onclick="NexusHub.markAllRead()">
                    Marcar todo leído
                </button>
            </div>
            <div class="nexus-notifications-list">
                ${notifications.length === 0 
                    ? '<div class="nexus-notifications-empty">No hay notificaciones nuevas</div>'
                    : notifications.map(n => `
                        <div class="nexus-notification ${n.read ? 'nexus-notification-read' : ''}"
                             onclick="NexusHub.handleNotification('${n.id}')"
                        >
                            <span class="nexus-notification-icon">${n.icon}</span>
                            <div class="nexus-notification-content">
                                <div class="nexus-notification-title">${n.title}</div>
                                <div class="nexus-notification-desc">${n.message}</div>
                                <div class="nexus-notification-time">${n.time}</div>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
        </div>`;
    },

    renderWeatherWidget() {
        const w = this.state.weather;
        if (!w) {
            return `<div class="nexus-weather nexus-weather-loading">
                <span class="nexus-spinner"></span>
            </div>`;
        }
        return `
        <div class="nexus-weather" title="${w.description}">
            <span class="nexus-weather-icon">${w.icon}</span>
            <span class="nexus-weather-temp">${w.temp}°</span>
            <span class="nexus-weather-location">${w.city}</span>
        </div>`;
    },

    renderDashboard() {
        return `
        <div class="nexus-dashboard">
            ${this.renderProductionStats()}
            ${this.renderCalendarWidget()}
            ${this.renderQuickActionsWidget()}
        </div>`;
    },

    renderProductionStats() {
        const stats = this.state.productionStats;
        
        return `
        <div class="nexus-widget nexus-widget-production">
            <div class="nexus-widget-header">
                <div class="nexus-widget-title">
                    <span>📊 Producción</span>
                    <span class="nexus-widget-live">● LIVE</span>
                </div>
                <button class="nexus-btn nexus-btn-ghost nexus-btn-sm" onclick="NexusHub.manualSync()">
                    🔄
                </button>
            </div>
            <div class="nexus-widget-content">
                <div class="nexus-stats-grid">
                    <div class="nexus-stat-box" onclick="window.navigate('projects')">
                        <div class="nexus-stat-box-value">${stats.totalProjects}</div>
                        <div class="nexus-stat-box-label">Proyectos totales</div>
                        <div class="nexus-stat-box-trend nexus-trend-up">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                            </svg>
                            Activos
                        </div>
                    </div>
                    
                    <div class="nexus-stat-box">
                        <div class="nexus-stat-box-value nexus-value-success">${stats.completedThisWeek}</div>
                        <div class="nexus-stat-box-label">Completados esta semana</div>
                        <div class="nexus-stat-box-bar">
                            <div class="nexus-stat-box-progress" style="width:${Math.min(stats.completedThisWeek * 10, 100)}%"></div>
                        </div>
                    </div>
                    
                    <div class="nexus-stat-box" onclick="window.navigate('certification')">
                        <div class="nexus-stat-box-value nexus-value-warning">${stats.pendingCert}</div>
                        <div class="nexus-stat-box-label">Pendientes certificación</div>
                        <div class="nexus-stat-box-action">Ver →</div>
                    </div>
                    
                    <div class="nexus-stat-box nexus-stat-revenue">
                        <div class="nexus-stat-box-value nexus-value-money">€${this.formatMoney(stats.revenue)}</div>
                        <div class="nexus-stat-box-label">Revenue estimado</div>
                        <div class="nexus-stat-box-sub">NE3/NE4 + GFP</div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    renderCalendarWidget() {
        const today = new Date();
        const dateStr = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        const appointments = this.state.todayAppointments;
        
        return `
        <div class="nexus-widget nexus-widget-calendar">
            <div class="nexus-widget-header">
                <div class="nexus-widget-title">
                    <span>📅 Hoy</span>
                    <span class="nexus-calendar-date">${dateStr}</span>
                </div>
                <button class="nexus-btn nexus-btn-ghost nexus-btn-sm" onclick="window.navigate('ne4citas')">
                    Ver todas
                </button>
            </div>
            <div class="nexus-widget-content">
                ${appointments.length === 0 
                    ? `<div class="nexus-calendar-empty">
                        <span>🌴</span>
                        <p>No hay citas para hoy</p>
                        <button class="nexus-btn nexus-btn-primary" onclick="window.navigate('ne4citas')">
                            + Nueva cita
                        </button>
                    </div>`
                    : `<div class="nexus-calendar-list">
                        ${appointments.slice(0, 4).map((apt, i) => `
                            <div class="nexus-calendar-item ${apt.status || ''}"
                                 style="animation-delay: ${i * 0.1}s"
                            >
                                <div class="nexus-calendar-time">${apt.time || '--:--'}</div>
                                <div class="nexus-calendar-info">
                                    <div class="nexus-calendar-client">${apt.client || 'Sin nombre'}</div>
                                    <div class="nexus-calendar-details">
                                        <span>${apt.type || 'Instalación'}</span>
                                        <span class="nexus-calendar-dot">•</span>
                                        <span>${apt.address || 'Sin dirección'}</span>
                                    </div>
                                </div>
                                <div class="nexus-calendar-status">
                                    ${apt.status === 'completed' ? '✅' : 
                                      apt.status === 'cancelled' ? '❌' : 
                                      '⏳'}
                                </div>
                            </div>
                        `).join('')}
                    </div>`
                }
            </div>
        </div>`;
    },

    renderQuickActionsWidget() {
        return `
        <div class="nexus-widget nexus-widget-quick">
            <div class="nexus-widget-header">
                <span>⚡ Acceso rápido</span>
            </div>
            <div class="nexus-widget-content">
                <div class="nexus-quick-grid">
                    <button class="nexus-quick-btn nexus-quick-primary" onclick="NexusHub.launchApp('fincontrol')">
                        <span>💰</span>
                        <div>
                            <strong>FinControl</strong>
                            <small>Ver finanzas</small>
                        </div>
                    </button>
                    
                    <button class="nexus-quick-btn" onclick="NexusHub.launchApp('stockanalyzer')">
                        <span>📈</span>
                        <div>
                            <strong>Stocks</strong>
                            <small>Portfolio</small>
                        </div>
                    </button>
                    
                    <button class="nexus-quick-btn" onclick="window.open('https://docs.google.com/spreadsheets/d/1g3-t2_02wSLpg2LPBvRgEFY3EFjYPxZJTfpyoAa--EE','_blank')">
                        <span>💨</span>
                        <div>
                            <strong>Soplado</strong>
                            <small>Google Sheets</small>
                        </div>
                    </button>
                    
                    <button class="nexus-quick-btn" onclick="NexusHub.openPalette()">
                        <span>⌘</span>
                        <div>
                            <strong>Buscar</strong>
                            <small>⌘K</small>
                        </div>
                    </button>
                </div>
                
                ${this.renderRecentApps()}
            </div>
        </div>`;
    },

    renderRecentApps() {
        const recent = this.state.recentApps.slice(0, 3);
        if (recent.length === 0) return '';
        
        const recentApps = recent.map(id => this.apps.find(a => a.id === id)).filter(Boolean);
        
        return `
        <div class="nexus-recent-section">
            <div class="nexus-recent-title">Recientes</div>
            <div class="nexus-recent-list">
                ${recentApps.map(app => `
                    <div class="nexus-recent-chip" onclick="NexusHub.launchApp('${app.id}')">
                        <span>${app.icon}</span>
                        ${app.name}
                    </div>
                `).join('')}
            </div>
        </div>`;
    },

    renderCommandPalette() {
        return `
        <div class="nexus-palette">
            <div class="nexus-palette-trigger" onclick="NexusHub.openPalette()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                </svg>
                <span>Buscar apps, comandos... (${this.state.projects.length} proyectos cargados)</span>
                <kbd class="nexus-kbd">⌘K</kbd>
            </div>
        </div>
        
        <div class="nexus-palette-modal" id="nexusPaletteModal" style="display:none">
            <div class="nexus-palette-backdrop" onclick="NexusHub.closePalette()"></div>
            <div class="nexus-palette-content">
                <div class="nexus-palette-input-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <input type="text" 
                           class="nexus-palette-input" 
                           id="nexusPaletteInput"
                           placeholder="Buscar apps, comandos, proyectos, citas..."
                           autocomplete="off"
                    >
                    <kbd class="nexus-kbd" onclick="NexusHub.closePalette()">ESC</kbd>
                </div>
                <div class="nexus-palette-results" id="nexusPaletteResults">
                    ${this.renderPaletteResults('')}
                </div>
            </div>
        </div>`;
    },

    renderPaletteResults(query) {
        const q = query.toLowerCase();
        
        // Buscar apps
        const apps = this.apps.filter(a => 
            a.name.toLowerCase().includes(q) || 
            a.desc.toLowerCase().includes(q)
        );
        
        // Buscar proyectos
        const projects = this.state.projects.filter(p =>
            p.name?.toLowerCase().includes(q) ||
            p.client?.toLowerCase().includes(q) ||
            p.address?.toLowerCase().includes(q)
        ).slice(0, 5);
        
        // Comandos
        const commands = [
            { id: 'goto-dashboard', name: 'Ir al Dashboard', icon: '📊', action: () => window.navigate('dashboard') },
            { id: 'goto-projects', name: 'Ver Proyectos', icon: '📁', action: () => window.navigate('projects') },
            { id: 'goto-production', name: 'Ver Producción', icon: '📈', action: () => window.navigate('production') },
            { id: 'goto-citas', name: 'Ver Citas NE4', icon: '📅', action: () => window.navigate('ne4citas') },
            { id: 'goto-cert', name: 'Certificación', icon: '✅', action: () => window.navigate('certification') },
            { id: 'toggle-theme', name: 'Cambiar tema', icon: this.state.theme === 'dark' ? '☀️' : '🌙', action: () => this.toggleTheme() },
            { id: 'sync-data', name: 'Sincronizar datos', icon: '🔄', action: () => { this.manualSync(); } }
        ].filter(c => c.name.toLowerCase().includes(q));

        let html = '';
        
        if (projects.length) {
            html += `<div class="nexus-palette-section">
                <div class="nexus-palette-section-title">Proyectos (${projects.length})</div>
                ${projects.map((p, i) => `
                    <div class="nexus-palette-item ${i === 0 ? 'nexus-palette-selected' : ''}" 
                         onclick="NexusHub.openProject('${p.id}')"
                    >
                        <span class="nexus-palette-item-icon">📁</span>
                        <div class="nexus-palette-item-info">
                            <div class="nexus-palette-item-name">${p.name || 'Sin nombre'}</div>
                            <div class="nexus-palette-item-desc">${p.client || 'Sin cliente'} • ${p.address || ''}</div>
                        </div>
                    </div>
                `).join('')}
            </div>`;
        }
        
        if (apps.length) {
            html += `<div class="nexus-palette-section">
                <div class="nexus-palette-section-title">Aplicaciones</div>
                ${apps.map((app, i) => `
                    <div class="nexus-palette-item" 
                         onclick="NexusHub.launchApp('${app.id}')"
                    >
                        <span class="nexus-palette-item-icon nexus-palette-icon-${app.color}">${app.icon}</span>
                        <div class="nexus-palette-item-info">
                            <div class="nexus-palette-item-name">${app.name}</div>
                            <div class="nexus-palette-item-desc">${app.desc}</div>
                        </div>
                        <span class="nexus-palette-item-badge">${app.type === 'local' ? 'Local' : 'Web'}</span>
                    </div>
                `).join('')}
            </div>`;
        }
        
        if (commands.length) {
            html += `<div class="nexus-palette-section">
                <div class="nexus-palette-section-title">Comandos</div>
                ${commands.map(cmd => `
                    <div class="nexus-palette-item" onclick="NexusHub.execCommand('${cmd.id}')">
                        <span class="nexus-palette-item-icon">${cmd.icon}</span>
                        <div class="nexus-palette-item-info">
                            <div class="nexus-palette-item-name">${cmd.name}</div>
                        </div>
                    </div>
                `).join('')}
            </div>`;
        }
        
        return html || '<div class="nexus-palette-empty">No se encontraron resultados</div>';
    },

    renderApps() {
        const isList = this.state.viewMode === 'list';
        
        return `
        <div class="nexus-section">
            <div class="nexus-section-header">
                <div class="nexus-section-title">
                    <span class="nexus-section-icon">🐙</span>
                    <div>
                        <h2>Nexus Ecosystem</h2>
                        <p>${this.apps.length} apps conectadas • Última sync: ${this.getLastSyncTime()}</p>
                    </div>
                </div>
                <div class="nexus-section-actions">
                    <button class="nexus-btn nexus-btn-ghost" onclick="NexusHub.toggleViewMode()">
                        ${isList ? '⊞ Grid' : '☰ Lista'}
                    </button>
                </div>
            </div>

            <div class="${isList ? 'nexus-app-list' : 'nexus-app-grid'}">
                ${this.apps.map(app => this.renderAppCard(app, isList)).join('')}
            </div>
        </div>`;
    },

    renderAppCard(app, isList) {
        const isFav = this.state.favorites.includes(app.id);
        
        if (isList) {
            return `
            <div class="nexus-app-row" data-app="${app.id}" onclick="NexusHub.launchApp('${app.id}')">
                <div class="nexus-row-accent nexus-accent-${app.color}"></div>
                <div class="nexus-app-row-icon nexus-icon-${app.color}">${app.icon}</div>
                <div class="nexus-app-row-info">
                    <div class="nexus-app-row-name">${app.name}</div>
                    <div class="nexus-app-row-desc">${app.desc}</div>
                </div>
                <div class="nexus-app-row-meta">
                    <span class="nexus-tag nexus-tag-${app.color}">${app.type === 'local' ? 'Local' : 'Cloud'}</span>
                    <button class="nexus-fav-btn ${isFav ? 'nexus-fav-active' : ''}" 
                            onclick="event.stopPropagation(); NexusHub.toggleFav('${app.id}')">
                        ${isFav ? '★' : '☆'}
                    </button>
                </div>
            </div>`;
        }
        
        return `
        <div class="nexus-app-card ${app.type === 'local' ? 'nexus-app-local' : ''}" data-app="${app.id}">
            <div class="nexus-app-accent nexus-accent-${app.color}"></div>
            <div class="nexus-app-body">
                <div class="nexus-app-top">
                    <div class="nexus-app-badge nexus-badge-${app.type}">
                        ${app.type === 'local' 
                            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> Local`
                            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg> Cloud`
                        }
                    </div>
                    <button class="nexus-fav-btn ${isFav ? 'nexus-fav-active' : ''}" 
                            onclick="event.stopPropagation(); NexusHub.toggleFav('${app.id}')"
003e
                        ${isFav ? '★' : '☆'}
                    </button>
                </div>
                
                <div class="nexus-app-icon-lg nexus-icon-${app.color}">
                    <span style="font-size:24px">${app.icon}</span>
                </div>

                <div class="nexus-app-info">
                    <h3>${app.name}</h3>
                    <p>${app.desc}</p>
                </div>

                <div class="nexus-app-footer">
                    <span class="nexus-tag nexus-tag-${app.color}">${app.type === 'local' ? 'v2.0' : app.color}</span>
                    <button class="nexus-btn nexus-btn-sm nexus-btn-${app.color}" onclick="NexusHub.launchApp('${app.id}')">
                        Abrir
                    </button>
                </div>
            </div>
        </div>`;
    },

    renderOperations() {
        return `
        <div class="nexus-section">
            <div class="nexus-section-header">
                <div class="nexus-section-title">
                    <span class="nexus-section-icon">📡</span>
                    <div>
                        <h2>Operaciones</h2>
                        <p>Herramientas de campo</p>
                    </div>
                </div>
            </div>

            <div class="nexus-ops-grid">
                <div class="nexus-op-card">
                    <div class="nexus-op-header">
                        <div class="nexus-op-icon nexus-op-west">W</div>
                        <div class="nexus-op-title">
                            <h4>WestConnect</h4>
                            <span>Vista técnica</span>
                        </div>
                    </div>
                    <div class="nexus-op-pins">
                        <div class="nexus-pin"><span>001</span>2345</div>
                        <div class="nexus-pin"><span>002</span>3456</div>
                        <div class="nexus-pin"><span>003</span>4567</div>
                        <div class="nexus-pin"><span>004</span>5678</div>
                    </div>
                    <button class="nexus-btn nexus-btn-ghost nexus-btn-full" 
                            onclick="NexusHub.openExternal('https://jarl9801.github.io/field-report/westconnect.html')">
                        Abrir
                    </button>
                </div>

                <div class="nexus-op-card">
                    <div class="nexus-op-header">
                        <div class="nexus-op-icon nexus-op-gfp">G</div>
                        <div class="nexus-op-title">
                            <h4>Glasfaser Plus</h4>
                            <span>Vista técnica</span>
                        </div>
                    </div>
                    <div class="nexus-op-pins">
                        <div class="nexus-pin"><span>001</span>1234</div>
                    </div>
                    <button class="nexus-btn nexus-btn-ghost nexus-btn-full"
                            onclick="NexusHub.openExternal('https://jarl9801.github.io/field-report/glasfaser.html')">
                        Abrir
                    </button>
                </div>

                <div class="nexus-op-card nexus-op-wide">
                    <div class="nexus-op-header">
                        <div class="nexus-op-icon nexus-op-admin">📊</div>
                        <div class="nexus-op-title">
                            <h4>Field Report Admin</h4>
                            <span>Asignación y seguimiento</span>
                        </div>
                    </div>
                    <div class="nexus-op-note">PIN Isabelle: 0223 · Integrado en Citas NE4</div>
                    <button class="nexus-btn nexus-btn-ghost nexus-btn-full"
                            onclick="NexusHub.openExternal('https://jarl9801.github.io/field-report/admin.html')">
                        Abrir Panel Admin
                    </button>
                </div>
            </div>
        </div>`;
    },

    renderResources() {
        return `
        <div class="nexus-section">
            <div class="nexus-section-header">
                <div class="nexus-section-title">
                    <span class="nexus-section-icon">📑</span>
                    <div>
                        <h2>Recursos</h2>
                        <p>Google Sheets</p>
                    </div>
                </div>
            </div>

            <div class="nexus-resources-grid">
                ${[
                    { icon: '💨', name: 'Soplado RD', url: '1g3-t2_02wSLpg2LPBvRgEFY3EFjYPxZJTfpyoAa--EE' },
                    { icon: '💨', name: 'Soplado RA', url: '1jLQf3brTId_hU2nmU16BapEvTYxYDbJJyR6IV_u7MOc' },
                    { icon: '🔧', name: 'Fusiones DP', url: '1Ssq_EYReehe8ddOrho1B08CzTocXYr2o7Qlnf73gxcs' },
                    { icon: '📋', name: 'Field Reports', url: '19gmi3TLzhlsfq5K_l5-T1EmDt7EheTkouqMEFcUYPUw' }
                ].map(sheet => `
                    <a href="https://docs.google.com/spreadsheets/d/${sheet.url}" 
                       target="_blank" 
                       class="nexus-resource"
                    >
                        <div class="nexus-resource-icon">${sheet.icon}</div>
                        <div class="nexus-resource-info">
                            <h4>${sheet.name}</h4>
                            <span>Google Sheets</span>
                        </div>
                    </a>
                `).join('')}
            </div>
        </div>`;
    },

    // Data Management
    async loadAllData() {
        this.setSyncStatus('syncing');
        
        try {
            // Cargar proyectos de IndexedDB
            await this.loadProjects();
            
            // Cargar citas
            await this.loadAppointments();
            
            // Calcular stats
            this.calculateProductionStats();
            
            this.setSyncStatus('synced');
            this.render();
            
        } catch (error) {
            console.error('Sync error:', error);
            this.setSyncStatus('error');
        }
    },

    async loadProjects() {
        // Intentar cargar desde DB local
        if (window.DB && window.DB.getProjects) {
            try {
                const projects = await window.DB.getProjects();
                this.state.projects = projects || [];
            } catch (e) {
                this.state.projects = [];
            }
        }
        
        // Si no hay datos, usar datos de ejemplo
        if (this.state.projects.length === 0) {
            this.state.projects = [
                { id: '1', name: 'NE3-001', client: 'Deutsche Telekom', address: 'Berlin Mitte', status: 'active', type: 'NE3' },
                { id: '2', name: 'NE4-045', client: 'Vodafone', address: 'Potsdam', status: 'pending', type: 'NE4' },
                { id: '3', name: 'GFP-123', client: 'Glasfaser Plus', address: 'Hamburg', status: 'completed', type: 'GFP' }
            ];
        }
    },

    async loadAppointments() {
        // Cargar citas de hoy
        const today = new Date().toISOString().split('T')[0];
        
        // Simular citas (en producción vendrían de IndexedDB o API)
        this.state.appointments = [
            { id: '1', time: '09:00', client: 'Müller GmbH', address: 'Karl-Marx-Allee 1', type: 'Instalación', status: 'pending', date: today },
            { id: '2', time: '11:30', client: 'Schmidt AG', address: 'Alexanderplatz 5', type: 'Reparación', status: 'completed', date: today },
            { id: '3', time: '14:00', client: 'Bauunternehmen K', address: 'Friedrichstraße 20', type: 'Inspección', status: 'pending', date: today }
        ];
        
        this.state.todayAppointments = this.state.appointments.filter(a => a.date === today);
    },

    calculateProductionStats() {
        const projects = this.state.projects;
        const completedThisWeek = projects.filter(p => p.status === 'completed').length;
        const pendingCert = projects.filter(p => p.status === 'pending_cert').length;
        
        this.state.productionStats = {
            totalProjects: projects.length,
            completedThisWeek: completedThisWeek,
            pendingCert: pendingCert || 2, // Default si no hay datos
            revenue: projects.length * 1250 // Estimación
        };
    },

    // Weather
    async loadWeather() {
        try {
            const { lat, lon, city } = this.config.weather;
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=Europe/Berlin`);
            const data = await response.json();
            
            const temp = Math.round(data.current_weather.temperature);
            const code = data.current_weather.weathercode;
            
            const iconMap = {
                0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
                45: '🌫️', 48: '🌫️',
                51: '🌦️', 53: '🌧️', 55: '🌧️',
                61: '🌧️', 63: '🌧️', 65: '🌧️',
                71: '🌨️', 73: '🌨️', 75: '🌨️',
                95: '⛈️', 96: '⛈️', 99: '⛈️'
            };
            
            this.state.weather = {
                temp: temp,
                icon: iconMap[code] || '🌡️',
                description: `${city}: ${temp}°C`,
                city: city
            };
            this.render();
        } catch (e) {
            console.error('Weather error:', e);
        }
    },

    // Sync Management
    setSyncStatus(status) {
        this.state.syncStatus = status;
        this.render();
    },

    getSyncStatusText() {
        const texts = {
            idle: 'Sin sincronizar',
            syncing: 'Sincronizando...',
            synced: 'Actualizado',
            error: 'Error de sync'
        };
        return texts[this.state.syncStatus] || 'Desconocido';
    },

    getLastSyncTime() {
        const last = localStorage.getItem('nexusLastSync');
        if (!last) return 'Nunca';
        
        const diff = Date.now() - parseInt(last);
        const mins = Math.floor(diff / 60000);
        
        if (mins < 1) return 'Ahora';
        if (mins < 60) return `Hace ${mins}m`;
        return `Hace ${Math.floor(mins/60)}h`;
    },

    manualSync() {
        this.loadAllData();
        localStorage.setItem('nexusLastSync', Date.now().toString());
        this.showToast('🔄 Datos sincronizados');
    },

    startAutoSync() {
        setInterval(() => {
            this.loadAllData();
        }, this.config.firebase.syncInterval);
    },

    // Notifications
    checkForNotifications() {
        // Simular notificaciones
        const notifs = [
            { id: '1', icon: '📅', title: 'Nueva cita programada', message: 'Instalación NE4-045 mañana 10:00', time: 'Hace 5 min', read: false },
            { id: '2', icon: '✅', title: 'Proyecto completado', message: 'NE3-001 certificado', time: 'Hace 2h', read: true }
        ];
        
        this.state.notifications = notifs;
        this.state.unreadCount = notifs.filter(n => !n.read).length;
    },

    toggleNotifications() {
        const panel = document.getElementById('nexusNotificationsPanel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    },

    markAllRead() {
        this.state.notifications.forEach(n => n.read = true);
        this.state.unreadCount = 0;
        this.render();
    },

    handleNotification(id) {
        const notif = this.state.notifications.find(n => n.id === id);
        if (notif) {
            notif.read = true;
            this.state.unreadCount = Math.max(0, this.state.unreadCount - 1);
            this.render();
        }
    },

    // Theme
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.state.theme);
        if (this.state.theme === 'light') {
            document.body.classList.add('nexus-light');
        } else {
            document.body.classList.remove('nexus-light');
        }
    },

    toggleTheme() {
        this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('nexusTheme', this.state.theme);
        this.applyTheme();
        this.render();
    },

    // Actions
    launchApp(appId) {
        const app = this.apps.find(a => a.id === appId);
        if (!app) return;
        
        this.addToRecent(appId);
        
        if (app.type === 'local' && app.view) {
            window.navigate(app.view);
        } else if (app.url) {
            window.open(app.url, '_blank');
        }
    },

    openExternal(url) {
        window.open(url, '_blank');
    },

    openProject(id) {
        window.navigate('projects');
        // Aquí se podría abrir el proyecto específico
    },

    addToRecent(appId) {
        this.state.recentApps = [appId, ...this.state.recentApps.filter(id => id !== appId)].slice(0, 5);
        localStorage.setItem('nexusRecent', JSON.stringify(this.state.recentApps));
    },

    toggleFav(appId) {
        const idx = this.state.favorites.indexOf(appId);
        if (idx > -1) {
            this.state.favorites.splice(idx, 1);
        } else {
            this.state.favorites.push(appId);
        }
        localStorage.setItem('nexusFavs', JSON.stringify(this.state.favorites));
        this.render();
    },

    toggleViewMode() {
        this.state.viewMode = this.state.viewMode === 'grid' ? 'list' : 'grid';
        this.render();
    },

    // Command Palette
    openPalette() {
        const modal = document.getElementById('nexusPaletteModal');
        const input = document.getElementById('nexusPaletteInput');
        modal.style.display = 'block';
        input.focus();
        input.value = '';
        this.state.searchQuery = '';
        document.getElementById('nexusPaletteResults').innerHTML = this.renderPaletteResults('');
    },

    closePalette() {
        const modal = document.getElementById('nexusPaletteModal');
        modal.style.display = 'none';
    },

    execCommand(cmdId) {
        this.closePalette();
        switch(cmdId) {
            case 'goto-dashboard': window.navigate('dashboard'); break;
            case 'goto-projects': window.navigate('projects'); break;
            case 'goto-production': window.navigate('production'); break;
            case 'goto-citas': window.navigate('ne4citas'); break;
            case 'goto-cert': window.navigate('certification'); break;
            case 'toggle-theme': this.toggleTheme(); break;
            case 'sync-data': this.manualSync(); break;
        }
    },

    // Utilities
    formatMoney(amount) {
        return amount.toLocaleString('de-DE');
    },

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'nexus-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('nexus-toast-show'), 10);
        setTimeout(() => {
            toast.classList.remove('nexus-toast-show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    },

    // Events
    attachEvents() {
        const input = document.getElementById('nexusPaletteInput');
        if (input) {
            input.addEventListener('input', (e) => {
                this.state.searchQuery = e.target.value;
                document.getElementById('nexusPaletteResults').innerHTML = this.renderPaletteResults(e.target.value);
            });
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.closePalette();
                if (e.key === 'Enter') {
                    const selected = document.querySelector('.nexus-palette-selected');
                    if (selected) selected.click();
                }
            });
        }

        // Cerrar notificaciones al click fuera
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('nexusNotificationsPanel');
            const btn = document.querySelector('.nexus-notifications-btn');
            if (panel && !panel.contains(e.target) && !btn.contains(e.target)) {
                panel.style.display = 'none';
            }
        });
    },

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.openPalette();
            }
            if (e.key === 'Escape') {
                this.closePalette();
            }
            if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '6') {
                e.preventDefault();
                const idx = parseInt(e.key) - 1;
                if (this.apps[idx]) this.launchApp(this.apps[idx].id);
            }
        });
    },

    startClock() {
        const update = () => {
            const clock = document.getElementById('nexusClock');
            if (clock) {
                clock.textContent = new Date().toLocaleTimeString('es-ES', { 
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                });
            }
        };
        update();
        setInterval(update, 1000);
    },

    animateEntry() {
        const elements = document.querySelectorAll('.nexus-widget, .nexus-app-card, .nexus-app-row');
        elements.forEach((el, i) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            setTimeout(() => {
                el.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, i * 50);
        });
    }
};

window.render_hub = function() {
    NexusHub.init();
};

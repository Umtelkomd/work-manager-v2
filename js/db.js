// IndexedDB layer for Work Manager v2
const DB = (() => {
    const DB_NAME = 'WorkManagerV2';
    const DB_VERSION = 2;
    let db = null;

    const STORES = {
        projects: { keyPath: 'code' },
        records: { keyPath: 'id', autoIncrement: true },
        clients: { keyPath: 'id', autoIncrement: true },
        ne3_clients: { keyPath: 'id', autoIncrement: true },
        orders_ra: { keyPath: 'id', autoIncrement: true },
        orders_rd: { keyPath: 'id', autoIncrement: true },
        orders_fusion: { keyPath: 'id', autoIncrement: true },
        go_status: { keyPath: 'id', autoIncrement: true },
        teams: { keyPath: 'id' },
        team_assignments: { keyPath: 'id', autoIncrement: true },
        certification: { keyPath: 'id', autoIncrement: true },
        settings: { keyPath: 'key' }
    };

    const INDEXES = {
        records: [
            { name: 'by_project', keyPath: 'projectCode' },
            { name: 'by_kw', keyPath: 'kw' },
            { name: 'by_team', keyPath: 'teamId' },
            { name: 'by_line', keyPath: 'line' },
            { name: 'by_code', keyPath: 'code', unique: true }
        ],
        clients: [
            { name: 'by_project', keyPath: 'projectCode' },
            { name: 'by_dp', keyPath: 'dp' }
        ],
        ne3_clients: [
            { name: 'by_project', keyPath: 'projectCode' },
            { name: 'by_dp', keyPath: 'dp' },
            { name: 'by_auftrag', keyPath: 'auftrag', unique: true }
        ],
        orders_ra: [
            { name: 'by_project', keyPath: 'projectCode' }
        ],
        orders_rd: [
            { name: 'by_project', keyPath: 'projectCode' },
            { name: 'by_dp', keyPath: 'dp' }
        ],
        orders_fusion: [
            { name: 'by_project', keyPath: 'projectCode' },
            { name: 'by_dp', keyPath: 'dp' }
        ],
        go_status: [
            { name: 'by_dp', keyPath: 'dp' }
        ],
        team_assignments: [
            { name: 'by_team', keyPath: 'teamId' },
            { name: 'by_kw', keyPath: 'kw' }
        ],
        certification: [
            { name: 'by_record', keyPath: 'recordId' },
            { name: 'by_status', keyPath: 'status' }
        ]
    };

    function open() {
        return new Promise((resolve, reject) => {
            if (db) return resolve(db);
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = (e) => {
                const d = e.target.result;
                for (const [name, opts] of Object.entries(STORES)) {
                    if (!d.objectStoreNames.contains(name)) {
                        const store = d.createObjectStore(name, opts);
                        if (INDEXES[name]) {
                            for (const idx of INDEXES[name]) {
                                store.createIndex(idx.name, idx.keyPath, { unique: idx.unique || false });
                            }
                        }
                    }
                }
            };
            req.onsuccess = (e) => { db = e.target.result; resolve(db); };
            req.onerror = (e) => reject(e.target.error);
        });
    }

    async function tx(storeName, mode = 'readonly') {
        const d = await open();
        return d.transaction(storeName, mode).objectStore(storeName);
    }

    async function getAll(storeName) {
        const store = await tx(storeName);
        return new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async function get(storeName, key) {
        const store = await tx(storeName);
        return new Promise((resolve, reject) => {
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async function put(storeName, data) {
        const store = await tx(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const req = store.put(data);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async function add(storeName, data) {
        const store = await tx(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const req = store.add(data);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async function del(storeName, key) {
        const store = await tx(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const req = store.delete(key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    async function clear(storeName) {
        const store = await tx(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    async function getAllByIndex(storeName, indexName, value) {
        const store = await tx(storeName);
        const index = store.index(indexName);
        return new Promise((resolve, reject) => {
            const req = index.getAll(value);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async function count(storeName) {
        const store = await tx(storeName);
        return new Promise((resolve, reject) => {
            const req = store.count();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async function seed() {
        const projects = await getAll('projects');
        if (projects.length === 0) {
            for (const p of PROJECT_SEED.projects) {
                await put('projects', p);
            }
            for (const t of PROJECT_SEED.teams) {
                await put('teams', t);
            }
            await put('settings', { key: 'seeded', value: true, timestamp: Date.now() });
        }
    }

    async function getSetting(key, defaultVal = null) {
        const result = await get('settings', key);
        return result ? result.value : defaultVal;
    }

    async function setSetting(key, value) {
        return put('settings', { key, value, timestamp: Date.now() });
    }

    return { open, getAll, get, put, add, del, clear, getAllByIndex, count, seed, getSetting, setSetting };
})();

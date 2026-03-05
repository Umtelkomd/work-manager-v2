const CACHE_NAME = 'wm-v2-cache-v6';
const ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './js/app.js',
  './js/db.js',
  './js/ne4citas.js',
  './js/hub.js',
  './js/settings.js',
  './js/i18n.js',
  './data/projects.js',
  './data/prices.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Network-first: always try fresh, fall back to cache
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).then(r => {
      const clone = r.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      return r;
    }).catch(() => caches.match(e.request))
  );
});

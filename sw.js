const CACHE_NAME = 'wm-v2-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './js/app.js',
  './js/db.js',
  './js/dashboard.js',
  './js/projects.js',
  './js/production.js',
  './js/teams.js',
  './js/clients.js',
  './js/certification.js',
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

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

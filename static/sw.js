'use strict';

const CACHE = 'pokerun-v1';

const PRECACHE = [
  '/',
  '/static/css/style.css',
  '/static/js/api.js',
  '/static/js/game.js',
  '/static/js/quiz.js',
  '/static/js/share.js',
  '/static/js/confetti.js',
  '/static/js/main.js',
  '/static/manifest.json',
  '/static/icons/icon.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Let API calls go straight to network; fall back to cache only for navigation
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // For PokeAPI sprite/cry CDN requests — network first, no caching (too large)
  if (url.hostname !== location.hostname) {
    e.respondWith(fetch(request).catch(() => new Response('', { status: 408 })));
    return;
  }

  // Network-first for local assets; fall back to cache if offline
  e.respondWith(
    fetch(request).then(response => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(request, clone));
      }
      return response;
    }).catch(() => caches.match(request))
  );
});

/* Rasta PWA service worker: app shell offline, images cache-first, video always from network. */
const VERSION = 'rasta-v10';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/img/logo.svg',
  './assets/fonts/vazirmatn-arabic.woff2',
  './assets/fonts/vazirmatn-latin.woff2',
  './assets/icons/icon-192.png',
  './assets/icons/apple-touch-icon.png',
  './assets/img/hero_d.webp',
  './assets/img/poster_hero.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('.mp4')) return; // range requests: leave video to the network

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      const fresh = fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || fresh;
    })
  );
});

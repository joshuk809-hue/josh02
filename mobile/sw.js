/* Offline shell for Contadino Club. Bump VERSION when the app files change. */
const VERSION = 'contadino-club-v1';
const SHELL = [
  './', './index.html', './app.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
  '../wallet/art/germoglio/card@3x.jpg', '../wallet/art/raccolto/card@3x.jpg', '../wallet/art/riserva/card@3x.jpg',
  '../wallet/art/germoglio/hero.png', '../wallet/art/raccolto/hero.png', '../wallet/art/riserva/hero.png',
  '../wallet/art/germoglio/google-logo.png', '../wallet/art/raccolto/google-logo.png', '../wallet/art/riserva/google-logo.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Network first for the app itself (so updates show), cache first for images and fonts.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isAsset = /\.(png|jpe?g|woff2?)$/.test(new URL(req.url).pathname);
  if (isAsset) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(req, copy));
      return res;
    })));
  } else {
    e.respondWith(fetch(req).then((res) => {
      if (res.ok && new URL(req.url).origin === location.origin) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html'))));
  }
});

// Tapping a notification opens (or focuses) the app.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((list) => (list[0] ? list[0].focus() : self.clients.openWindow('./index.html'))));
});

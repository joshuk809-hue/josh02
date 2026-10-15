// Studio offline support: always try the network first (so updates arrive), fall back to the last saved copy.
const CACHE = 'studio-v1'
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return
  e.respondWith(
    fetch(request)
      .then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(request, copy)) } return res })
      .catch(() => caches.match(request, { ignoreSearch: true }).then((r) => r || caches.match('./'))),
  )
})

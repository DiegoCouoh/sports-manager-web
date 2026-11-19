/* Caribe Sports - sw.js simple, sin inyeccion, solo cache */
const CACHE = 'caribe-v19-1';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(clients.claim()); });
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).then((res) => {
      const copia = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copia)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request))
  );
});

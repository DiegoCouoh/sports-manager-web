// Sports Manager Web - sports-manager-web - PWA
// Solo permite abrir sin internet tras la primera carga. NO toca tu lógica, NO borra torneos.
const CACHE = 'sports-manager-web-v3';
const CORE = ['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./version.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // version.json y datos de GitHub siempre frescos, nunca desde caché viejo
  if (e.request.url.includes('version.json')) { e.respondWith(fetch(e.request).catch(() => caches.match('./version.json'))); return; }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    const copy = res.clone();
    if (res.ok && new URL(e.request.url).origin === location.origin) { caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match('./index.html'))));
});

// Sports Manager Web v4 - sports-manager-web - PWA en vivo
// Solo permite abrir sin internet tras la primera carga. NO borra torneos. NO tiene roles.
const CACHE = 'sports-manager-web-v4';
const CORE = ['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./version.json','./live-tick.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // version + live-tick siempre frescos, nunca desde caché viejo. Es lo que permite el en vivo cada 1s.
  if (e.request.url.includes('version.json') || e.request.url.includes('live-tick.json')) { e.respondWith(fetch(e.request, {cache:'no-store'}).catch(() => caches.match(e.request.url))); return; }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    const copy = res.clone();
    if (res.ok && new URL(e.request.url).origin === location.origin) { caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match('./index.html'))));
});

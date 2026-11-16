// Sports Manager Web v6 - PWA
// v6: NO cachea index.html ni live-sync.js ni datos. Siempre red. Solo iconos/manifest en cache.
// Esto arregla que el navegador siguiera sirviendo la version vieja (con el banner pegado)
// aunque ya hubieras subido la nueva a GitHub.
const CACHE = 'sports-manager-web-v6';
const CORE = ['./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE).catch(()=>{})).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;
  // Todo lo que cambia seguido: SIEMPRE red, nunca cache viejo.
  if (url.includes('index.html') || url.includes('live-sync.js') || url.includes('version.json') || url.includes('live-tick.json') || url.includes('live-datos.json') || url.includes('sw.js')) {
    e.respondWith(fetch(e.request, {cache:'no-store'}).catch(() => caches.match(e.request)));
    return;
  }
  // Iconos/manifest: cache primero, red como respaldo.
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok && new URL(url).origin === location.origin) { var copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request))));
});

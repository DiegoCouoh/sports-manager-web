// Caribe Sports v10 - PWA
// v7: NO cachea index.html ni live-sync.js ni datos. Siempre red. Solo iconos/manifest.
const CACHE = 'caribe-sports-v10';
const CORE = ['./manifest.webmanifest','./icon-192.png','./icon-512.png','./caribe-logo.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE).catch(()=>{})).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;
  if (url.includes('index.html') || url.includes('live-sync.js') || url.includes('version.json') || url.includes('live-tick.json') || url.includes('live-datos.json') || url.includes('sw.js')) {
    e.respondWith(fetch(e.request, {cache:'no-store'}).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok && new URL(url).origin === location.origin) { var copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request))));
});

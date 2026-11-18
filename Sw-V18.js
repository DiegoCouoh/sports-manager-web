// Caribe Sports v18 - SW que inyecta v18-patch.js SIN tocar index.html
// index.html pesa >1MB y el editor de GitHub lo muestra vacío, pero SÍ existe y funciona.
// Este sw.js intercepta la carga y le agrega el parche en el aire.
const CACHE_V18 = 'caribe-v18-1';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(clients.claim()); });
self.addEventListener('fetch', (e) => {
  try {
    const url = new URL(e.request.url);
    const esNavegacion = e.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/caribe-sports') || url.pathname.endsWith('/caribe-sports/');
    if (!esNavegacion) {
      e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
      return;
    }
    e.respondWith((async () => {
      try {
        const res = await fetch(e.request, { cache: 'no-store' });
        const text = await res.text();
        if (text.includes('v18-patch.js')) {
          return new Response(text, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }
        // Quitar v17 si quedó, poner v18 (v18 ya incluye lo de v17)
        let parcheado = text.replace(/<script[^>]*v17-patch\.js[^>]*><\/script>/g, '');
        parcheado = parcheado.replace('</body>', '<script src="./v18-patch.js"></script></body>');
        if (parcheado === text) parcheado = text + '<script src="./v18-patch.js"></script>';
        return new Response(parcheado, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      } catch (err) {
        return fetch(e.request);
      }
    })());
  } catch (_) {}
});

const CACHE_VERSION = 'bolita-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// Instalar y guardar archivos en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activar y limpiar cachés viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Servir desde caché si no hay internet
self.addEventListener('fetch', (event) => {
  // No cachear peticiones a Firebase
  if (event.request.url.includes('firebaseio.com') || 
      event.request.url.includes('gstatic.com') ||
      event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Devolver caché si existe, sino buscar en red
        return cachedResponse || fetch(event.request)
          .then((networkResponse) => {
            return caches.open(CACHE_VERSION)
              .then((cache) => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
              });
          });
      })
      .catch(() => {
        // Si no hay nada en caché ni red, mostrar página básica
        return new Response('<html><body style="font-family:Arial;padding:20px;text-align:center;"><h1>📴 Sin conexión</h1><p>La página se cargará cuando recuperes internet.</p></body></html>', {
          headers: { 'Content-Type': 'text/html' }
        });
      })
  );
});

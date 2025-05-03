const CACHE_NAME = 'cash-counter-cache-v3'; // Wersja cache'u jak wcześniej
const urlsToCache = [
  '.', // Katalog bieżący
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'icons/icon-192x192.png', // Ścieżka względna
  'icons/icon-512x512.png', // Ścieżka względna
  'background.jpg'
];

// Instalacja Service Workera
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Otwarto cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
          console.error('Nie udało się zcache\'ować zasobów podczas instalacji:', error);
      })
  );
});

// Aktywacja Service Workera - usuwanie starych cache
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Usuwanie starego cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    // Brak self.clients.claim()
  );
});


// Przechwytywanie żądań sieciowych (prostsza wersja fetch)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Jeśli zasób jest w cache, zwróć go
        if (response) {
          return response;
        }

        // Jeśli nie ma w cache, spróbuj pobrać z sieci
        return fetch(event.request).then(
          networkResponse => {
            // Sprawdzenie odpowiedzi przed cachowaniem
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                return networkResponse;
            }

            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // Cachowanie tylko jeśli żądanie jest GET
                if (event.request.method === 'GET') {
                   cache.put(event.request, responseToCache);
                }
              });

            return networkResponse;
          }
        ).catch(error => {
            console.error('Fetch failed; returning offline page instead.', error);
            // Można by tu zwrócić specjalną stronę offline
            // return caches.match('/offline.html');
        });
      })
  );
});
// --- START OF FILE sw.js ---

const CACHE_NAME = 'cash-counter-cache-v4'; // Zwiększona wersja cache'u
const urlsToCache = [
  '.', // Katalog bieżący
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  'background.jpg',
  'offline.html' // <--- Dodana strona offline
];

// Instalacja Service Workera
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalacja...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Otwarto cache, cachowanie podstawowych zasobów');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
          console.error('[Service Worker] Nie udało się zcache\'ować zasobów podczas instalacji:', error);
          // Rzucenie błędu może zatrzymać instalację, jeśli krytyczne pliki nie zostaną zcache'owane.
          // W zależności od potrzeb, można to obsłużyć inaczej.
          throw error;
      })
  );
});

// Aktywacja Service Workera - usuwanie starych cache i przejęcie kontroli
self.addEventListener('activate', event => {
  console.log('[Service Worker] Aktywacja...');
  const cacheWhitelist = [CACHE_NAME]; // Tylko aktualna wersja cache jest dozwolona
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Usuwanie starego cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('[Service Worker] Przejmowanie kontroli nad klientami...');
        return self.clients.claim(); // <--- Przejmuje kontrolę nad otwartymi stronami
    }).catch(error => {
        console.error('[Service Worker] Błąd podczas aktywacji:', error);
    })
  );
});


// Przechwytywanie żądań sieciowych
self.addEventListener('fetch', event => {
  // Ignoruj żądania inne niż GET (np. POST), aby uniknąć cachowania niepotrzebnych danych
  if (event.request.method !== 'GET') {
    // Pozwól przeglądarce obsłużyć żądanie normalnie
    return;
  }

  // Ignoruj żądania do rozszerzeń Chrome itp.
  if (!event.request.url.startsWith('http')) {
      return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Zasób znaleziony w cache - zwróć go
        if (cachedResponse) {
          // console.log('[Service Worker] Zasób znaleziony w cache:', event.request.url);
          return cachedResponse;
        }

        // Zasób nieznaleziony w cache - spróbuj pobrać z sieci
        // console.log('[Service Worker] Zasób nieznaleziony w cache, pobieranie z sieci:', event.request.url);
        return fetch(event.request).then(
          networkResponse => {
            // Sprawdź, czy odpowiedź sieciowa jest poprawna
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                // console.warn('[Service Worker] Niepoprawna odpowiedź sieciowa, nie cachuję:', event.request.url, networkResponse);
                return networkResponse; // Zwróć niepoprawną odpowiedź (np. 404)
            }

            // Odpowiedź jest poprawna - sklonuj ją, aby móc ją zcache'ować i zwrócić
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                 // console.log('[Service Worker] Cachowanie nowego zasobu:', event.request.url);
                 cache.put(event.request, responseToCache);
              })
              .catch(cacheError => {
                  console.error('[Service Worker] Błąd podczas cachowania:', event.request.url, cacheError);
              });

            // Zwróć oryginalną odpowiedź sieciową do przeglądarki
            return networkResponse;
          }
        ).catch(error => {
            // Błąd podczas pobierania z sieci (prawdopodobnie offline)
            console.warn('[Service Worker] Błąd fetch, prawdopodobnie offline. Zwracam stronę offline.', error);
            // Spróbuj zwrócić stronę offline z cache
            return caches.match('offline.html').then(offlineResponse => {
                if (offlineResponse) {
                    return offlineResponse;
                } else {
                    // Jeśli nawet strona offline nie jest w cache (co nie powinno się zdarzyć po instalacji)
                    // Zwróć prostą odpowiedź tekstową lub pustą odpowiedź błędu
                    console.error('[Service Worker] Strona offline nie znaleziona w cache!');
                    return new Response("Jesteś offline, a strona offline nie została znaleziona w cache.", {
                        status: 503, // Service Unavailable
                        headers: { 'Content-Type': 'text/plain' }
                    });
                }
            });
        });
      })
  );
});
// --- END OF FILE sw.js ---
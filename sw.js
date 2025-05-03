// --- START OF FILE sw.js ---

const CACHE_NAME = 'cash-counter-cache-v4'; // Używamy nowej wersji dla pewności aktualizacji
const urlsToCache = [
  '.', // Katalog bieżący
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  'background.jpg'
  // 'offline.html' <-- Usunięto
];

// Instalacja Service Workera
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalacja...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Otwarto cache, cachowanie podstawowych zasobów');
        // Dodajemy zasoby pojedynczo, aby w razie błędu jednego, inne mogły zostać zcache'owane
        // Chociaż addAll jest wygodniejsze, jest "wszystko albo nic".
        // Dla większej odporności można by użyć pętli i cache.add(), ale addAll jest tu OK.
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
          console.error('[Service Worker] Nie udało się zcache\'ować zasobów podczas instalacji:', error);
          // Rzucenie błędu zatrzyma instalację
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


// Przechwytywanie żądań sieciowych (Cache First, Network Fallback)
self.addEventListener('fetch', event => {
  // Ignoruj żądania inne niż GET
  if (event.request.method !== 'GET') {
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
            // Sprawdź, czy odpowiedź sieciowa jest poprawna (200 OK, typ 'basic')
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                // console.warn('[Service Worker] Niepoprawna odpowiedź sieciowa, nie cachuję:', event.request.url, networkResponse);
                return networkResponse; // Zwróć odpowiedź taką jaka jest (np. 404)
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
        // Usunięto blok .catch(), który zwracał stronę offline.
        // Teraz, jeśli fetch zawiedzie (np. brak sieci), błąd zostanie przepuszczony,
        // a przeglądarka wyświetli standardowy komunikat o błędzie sieciowym.
        ).catch(error => {
             console.error('[Service Worker] Fetch failed:', error);
             // Rzucamy błąd dalej, aby przeglądarka mogła go obsłużyć jako błąd sieciowy
             throw error;
        });
      })
  );
});
// --- END OF FILE sw.js ---
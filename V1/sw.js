const CACHE_VERSION = 'v2';
const CACHE_NAME = `classroom-tools-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  'index.html',
  'demo1-random-picker.html',
  'demo2-quiz-game.html',
  'demo3-timer.html',
  'demo4-scoreboard.html',
  'demo5-seating.html',
  'manifest.json',
  'icon.svg'
];

// Install: precache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('classroom-tools-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: strategy depends on request type
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Google Fonts: network-first with cache fallback
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Everything else: cache-first
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
  );
});

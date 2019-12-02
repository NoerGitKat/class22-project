/* eslint-disable no-restricted-globals */
const CACHE_VERSION = 3;
const CURRENT_CACHES = {
  static: `static-v${CACHE_VERSION}`,
  dynamic: `dynamic-v${CACHE_VERSION}`,
};
const STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/static/media/showcase.4b31330b.jpg',
  '/static/js/bundle.js',
  '/static/js/0.chunk.js',
  '/static/js/main.chunk.js',
  '/sw.js',
  '/swReg.js',
  '/favicon.ico',
  'https://use.fontawesome.com/releases/v5.8.1/css/all.css',
  'https://use.fontawesome.com/releases/v5.8.1/webfonts/fa-solid-900.ttf',
  'https://use.fontawesome.com/releases/v5.8.1/webfonts/fa-solid-900.woff',
  'https://use.fontawesome.com/releases/v5.8.1/webfonts/fa-solid-900.woff2',
  'https://use.fontawesome.com/releases/v5.8.1/webfonts/fa-brands-400.ttf',
  'https://use.fontawesome.com/releases/v5.8.1/webfonts/fa-brands-400.woff',
  'https://use.fontawesome.com/releases/v5.8.1/webfonts/fa-brands-400.woff2',
];

const trimCache = (cacheName, maxItems) => {
  caches.open(cacheName).then(cache => {
    return cache.keys().then(keys => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
      }
    });
  });
};

self.addEventListener('install', event => {
  console.log('[SW] Installing sw', event);

  event.waitUntil(
    caches.open(CURRENT_CACHES.static).then(cache => {
      console.log('Pre-caching...');
      // Static Prefetching
      cache.addAll(STATIC_FILES);
    }),
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activating sw', event);
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CURRENT_CACHES.static && key !== CURRENT_CACHES.dynamic) {
            console.log('[SW] Deleting old cache...');
            return caches.delete(key);
          }
        }),
      );
    }),
  );
  return self.clients.claim();
});

// Cache with network fallback & dynamic caching
self.addEventListener('fetch', event => {
  // if (event.request.url.includes('/api/profile')) {
  //   event.respondWith(
  //     caches.open(CURRENT_CACHES.dynamic).then(cache => {
  //       return fetch(event.request).then(response => {
  //         const cloneResponse = response.clone();
  //         cache.put(event.request.url, cloneResponse);
  //         return response;
  //       });
  //     }),
  //   );
  // } else {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      } else {
        // Dynamic Prefetching
        return fetch(event.request)
          .then(response => {
            return caches.open(CURRENT_CACHES.dynamic).then(cache => {
              const cloneResponse = response.clone();
              trimCache(CURRENT_CACHES.dynamic, 30);
              cache.put(event.request.url, cloneResponse);
              return response;
            });
          })
          .catch(error => {
            return caches.open(CURRENT_CACHES.static).then(cache => {
              if (event.request.headers.get('accept').includes('text/html')) {
                return cache.match('/offline.html');
              }
            });
          });
      }
    }),
  );
  // }
});

// Network with cache fallback
// self.addEventListener('fetch', event => {
//   event.respondWith(fetch(event.request).catch(error => caches.match(event.request)));
// });

// Cache-only
// self.addEventListener('fetch', event => event.respondWith(caches.match(event.request)));

// Network-only
// self.addEventListener('fetch', event => event.respondWith(fetch(event.request)));

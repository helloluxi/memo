
const CACHE_NAME = 'memo-cache-v1';
const urlsToCache = [
    './',
    './index.html',
    'https://fonts.googleapis.com/css2?family=Comic+Neue:wght@700&display=swap'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});

self.addEventListener('message', event => {
    if (event.data === 'ud') {
      caches.open(CACHE_NAME).then(cache => {
        urlsToCache.forEach(url => {
          fetch(url).then(response => cache.put(url, response)).catch(err => console.error(`Failed to update ${url}:`, err));
        });
      });
    }
  });
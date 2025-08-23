// Service Worker for Memo App
const CACHE_NAME = 'memo-cache-v1';
const STATIC_CACHE = 'memo-static-v1';

// Static resources to cache immediately
const STATIC_RESOURCES = [
    './',
    './index.html',
    'https://fonts.googleapis.com/css2?family=Comic+Neue:wght@700&display=swap'
];

// Install event - cache static resources
self.addEventListener('install', event => {
    console.log('Service Worker: Install');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static resources');
                return cache.addAll(STATIC_RESOURCES);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activate');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Message event - handle memo URL caching requests
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CACHE_MEMO_URL') {
        const memoUrl = event.data.url;
        if (memoUrl) {
            console.log('Service Worker: Caching memo URL', memoUrl);
            caches.open(CACHE_NAME)
                .then(cache => cache.add(memoUrl))
                .catch(error => console.log('Service Worker: Failed to cache memo URL', error));
        }
    }
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    console.log('Service Worker: Serving from cache', event.request.url);
                    return cachedResponse;
                }

                // If not in cache, fetch from network
                return fetch(event.request)
                    .then(response => {
                        // Don't cache if not a successful response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response for caching
                        const responseToCache = response.clone();
                        
                        // Cache memo data files
                        if (event.request.url.includes('.txt') || 
                            event.request.url.includes('memo') ||
                            event.request.url.includes('data')) {
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                        }

                        return response;
                    })
                    .catch(() => {
                        // If fetch fails and we're requesting the main page, serve index.html from cache
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                    });
            })
    );
});
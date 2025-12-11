// Define the cache name and the files to cache
const CACHE_NAME = 'chrono-chess-v1';
const urlsToCache = [
    './chrono_chess_game.html',
    './manifest.json',
    './service-worker.js'
    // We intentionally do not cache external CDN links (Tailwind, Fonts) 
    // to keep the PWA file minimal. They will be fetched from the network.
];

// Installation event: Caches all required assets
self.addEventListener('install', event => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activation event: Cleans up old caches if necessary
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating...');
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch event: Intercepts network requests
self.addEventListener('fetch', event => {
    // Strategy: Cache-first for the main app files, Network-first for everything else (like CDNs)
    
    // Check if the request URL is one of our explicitly cached local files
    const isLocalFile = urlsToCache.some(url => event.request.url.includes(url.substring(1))); 

    if (isLocalFile) {
        // Cache-First strategy for local files
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    // Cache hit - return response
                    if (response) {
                        return response;
                    }
                    // No cache match - fetch from network
                    return fetch(event.request);
                })
        );
    } else {
        // Network-Only/Network-First for all external resources (CDNs, fonts)
        event.respondWith(fetch(event.request));
    }
});

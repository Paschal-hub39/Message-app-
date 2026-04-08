const CACHE_NAME = 'paschala-hub-v1';

self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
});

self.addEventListener('fetch', (event) => {
  // This allows the app to load while the service worker is active
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});


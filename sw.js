const HEXA_CACHE = 'hexa-static-v1';
const CORE_ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './icon.png',
    './js/main.js',
    './js/hexa-app.js',
    './js/smart-compress.js',
    './js/share-optimizer.js'
];
self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(HEXA_CACHE).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => null));
    self.skipWaiting();
});
self.addEventListener('activate', (event) => {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== HEXA_CACHE).map((key) => caches.delete(key)))));
    self.clients.claim();
});
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET')
        return;
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(HEXA_CACHE).then((cache) => cache.put(event.request, copy)).catch(() => null);
        return response;
    }).catch(() => cached)));
});

const CACHE_NAME = 'todo-pwa-v1';
const ASSETS = [
  'nova-lista.html',
  'style.css',
  'todos.js',
  'favicon.png',
  'img/icon-192x192.png',
  'img/icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.14.0/css/all.min.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

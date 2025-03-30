const CACHE_NAME = 'wordie-blast-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/game.js',
  '/manifest.json',
  '/sounds/clear.mp3',
  '/sounds/game-over.mp3',
  '/sounds/invalid-word.mp3',
  '/sounds/level-up.mp3',
  '/sounds/match.mp3',
  '/sounds/place.mp3',
  '/sounds/select.mp3',
  '/sounds/word-found.mp3'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
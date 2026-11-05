// JIT PREDICTION - Self-Destruct & Cache Nuke Worker
// Automatically unregisters any existing service workers and purges all stale caches

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          console.log('[SW] Deleting stale cache:', key);
          return caches.delete(key);
        })
      );
    })
    .then(() => self.registration.unregister())
    .then(() => self.clients.claim())
    .then(() => {
      // Force all open tabs of JIT PREDICTION to reload immediately with fresh server HTML
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          if ('navigate' in client) {
            client.navigate(client.url);
          }
        });
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Always fetch directly from live network
  return;
});

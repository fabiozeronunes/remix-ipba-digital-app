self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through simples para habilitar instalação PWA sem forçar cache obsoleto durante builds
  event.respondWith(fetch(event.request));
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.message || 'Nova Notificação',
    icon: '/icon-512.png',
    badge: '/icon-512.png'
  };
  event.waitUntil(self.registration.showNotification(data.title || 'App', options));
});

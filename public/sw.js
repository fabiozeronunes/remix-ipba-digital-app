self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through simples para garantir que o PWA seja instalável
  event.respondWith(fetch(event.request));
});

// Listener para notificações PUSH vindas do servidor
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'IPB Digital', body: event.data.text() };
    }
  }

  const options = {
    body: data.body || 'Você tem uma nova atualização da igreja.',
    icon: '/icon-512.png',
    badge: '/icon-512.png',
    data: data.url || '/', // URL para abrir ao clicar
    tag: `push-${Date.now()}`,
    vibrate: [100, 50, 100],
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Ver Agora' },
      { action: 'close', title: 'Fechar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Novo Alerta!', options)
  );
});

// Lida com o clique na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const urlToOpen = new URL(event.notification.data, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Se já houver uma aba aberta com o app, foca nela
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não, abre uma nova janela
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

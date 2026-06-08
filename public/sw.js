importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBceh-0kCx90Wmy9ANdtt2iRiwnHcl51iM",
  authDomain: "project-44817653-8cb3-49de-8f9.firebaseapp.com",
  projectId: "project-44817653-8cb3-49de-8f9",
  storageBucket: "project-44817653-8cb3-49de-8f9.firebasestorage.app",
  messagingSenderId: "588095094401",
  appId: "1:588095094401:web:fa788aeffcf09bfa665780"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-512.png',
    data: payload.data
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

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

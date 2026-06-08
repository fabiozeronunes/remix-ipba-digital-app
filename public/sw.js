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

// Este handler captura mensagens quando o app está em background ou fechado
// Ele é o método recomendado pelo Firebase para Web Push
messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Mensagem recebida em background:', payload);
  
  const notificationTitle = payload.notification?.title || 'Nova Notificação';
  const notificationOptions = {
    body: payload.notification?.body || 'Você recebeu uma atualização do sistema.',
    icon: '/icon-512.png',
    badge: '/icon-512.png',
    data: payload.data, // Dados extras enviados pelo servidor
    vibrate: [200, 100, 200],
    tag: 'church-push-notification',
    renotify: true
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Listener genérico de Push para máxima compatibilidade com sistemas legados ou raw push
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      // O Firebase costuma disparar o onBackgroundMessage automaticamente,
      // mas este listener garante que nada seja perdido em outros tipos de envio.
      console.log('[sw.js] Evento Push nativo recebido:', data);
    } catch (e) {
      console.log('[sw.js] Evento Push de texto recebido:', event.data.text());
    }
  }
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

// Tratamento de clique na notificação para abrir o app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Tenta focar em uma aba já aberta ou abre a raiz do app
      for (const client of windowClients) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

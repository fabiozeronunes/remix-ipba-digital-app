import { messaging, db, auth } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

export async function requestNotificationPermission(userId: string) {
  if (!messaging || !('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        serviceWorkerRegistration: registration,
        // vapidKey: '...' // Opcional: Se houver uma chave VAPID configurada no console
      });
      
      if (token) {
        console.log('FCM Token:', token);
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(token)
        });
      }
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
}

export function onForegroundMessage() {
  if (!messaging) return;
  
  onMessage(messaging, (payload) => {
    console.log('Message received in foreground: ', payload);
    // You can trigger a local notification or update UI
    if (payload.notification) {
      const { title, body } = payload.notification;
      new Notification(title || 'Nova mensagem', {
        body: body,
        icon: '/pwa-192x192.png'
      });
    }
  });
}

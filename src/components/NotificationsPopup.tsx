import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Bell, X } from 'lucide-react';
import { Notification } from '../types';

export default function NotificationsPopup({ user, isAuthReady, onRedirect }: { user: any, isAuthReady: boolean, onRedirect: (tab: string, elementId?: string) => void }) {
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isAuthReady) {
      setLatestNotification(null);
      setShow(false);
      return;
    }
    
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data() as Notification;
          setLatestNotification({ id: doc.id, ...data });
          setShow(true);
        }
    }, (error) => {
        console.error('Snapshot listener error:', error);
    });
    
    return () => unsubscribe();
  }, [isAuthReady]);

  const handleRedirect = () => {
    if (latestNotification) {
      onRedirect(latestNotification.targetTab || 'home', latestNotification.targetElementId);
      setShow(false);
    }
  };

  if (!show || !latestNotification) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
        <button onClick={() => setShow(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-black uppercase font-sans text-[#001939]">NOTIFICAÇÃO</h2>
        </div>
        <h3 className="font-bold text-slate-800 mb-1">
           {latestNotification.eventName && <span className="text-amber-500">EVENTO: {latestNotification.eventName}</span>}
        </h3>
        {latestNotification.eventDate && <p className="text-sm font-bold text-slate-700 mb-2">DATA EVENTO: {latestNotification.eventDate}</p>}
        <p className="text-sm text-slate-600 mb-6 italic">abra o evento no seu aplicativo.</p>
        <button onClick={handleRedirect} className="w-full py-3 bg-[#002d5e] text-white font-black rounded-xl">Entendi</button>
      </div>
    </div>
  );
}

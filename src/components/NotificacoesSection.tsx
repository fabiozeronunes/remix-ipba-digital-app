import React, { useState, useEffect } from 'react';
import { Bell, Clock } from 'lucide-react';
import { Notification } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

interface NotificacoesSectionProps {
  isAuthReady: boolean;
}

export default function NotificacoesSection({ isAuthReady }: NotificacoesSectionProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!isAuthReady) return;
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
      setNotifications(fetched);
    }, (error) => {
      console.error('Notifications fetch error:', error);
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });
    return () => unsubscribe();
  }, [isAuthReady]);

  return (
    <div className="p-6 pb-24 animate-fade-in">
      <h1 className="text-2xl font-black text-[#001939] mb-6 flex items-center">
        <Bell className="w-6 h-6 mr-2 text-[#002d5e]" />
        Notificações
      </h1>
      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-500">Nenhuma notificação por enquanto.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map(n => (
            <div key={n.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:border-amber-200 transition-colors">
              <h3 className="font-extrabold text-[#001939] text-base mb-1">{n.title}</h3>
              <p className="text-slate-600 text-sm mb-3">{n.message}</p>
              <div className="flex items-center text-slate-400 text-[10px] font-bold">
                <Clock className="w-3 h-3 mr-1" />
                {new Date(n.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

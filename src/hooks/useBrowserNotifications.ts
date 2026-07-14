import { useEffect, useRef } from 'react';
import type { AppNotification } from './useNotifications';

export function useBrowserNotifications(notifications: AppNotification[], enabled: boolean) {
  const shown = useRef<Set<string>>(new Set());
  const requested = useRef(false);

  useEffect(() => {
    if (!enabled || !('Notification' in window)) return;
    if (!requested.current && Notification.permission === 'default') {
      requested.current = true;
      Notification.requestPermission();
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !('Notification' in window) || Notification.permission !== 'granted') return;
    for (const n of notifications) {
      if (shown.current.has(n.id)) continue;
      shown.current.add(n.id);
      try {
        new Notification(n.title, { body: n.body, icon: '/icon-192x192.png', tag: n.id });
      } catch {
        // Notifications blocked or unavailable in this context
      }
    }
  }, [notifications, enabled]);

  // Reset shown set daily so recurring notifications re-fire each day
  useEffect(() => {
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    const timer = setTimeout(() => { shown.current.clear(); }, msUntilMidnight);
    return () => clearTimeout(timer);
  }, []);
}

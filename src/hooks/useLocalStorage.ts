import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }, [key, value]);

  // Re-sync from localStorage when updated externally (Realtime sync or another tab)
  useEffect(() => {
    const sync = (e?: Event) => {
      const storageEvent = e as StorageEvent | undefined;
      if (storageEvent?.key !== undefined && storageEvent.key !== key) return;
      try {
        const item = window.localStorage.getItem(key);
        if (item !== null) setValue(JSON.parse(item) as T);
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', sync);
    window.addEventListener('lh:storage-updated', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('lh:storage-updated', sync);
    };
  }, [key]);

  return [value, setValue] as const;
}

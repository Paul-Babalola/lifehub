import { useLocalStorage } from './useLocalStorage';
import type { InboxItem } from '../types';
import { nanoid } from '../utils/nanoid';

export function useInbox() {
  const [items, setItems] = useLocalStorage<InboxItem[]>('lh-inbox', []);

  const addItem = (text: string) => {
    if (!text.trim()) return;
    setItems(prev => [{ id: nanoid(), text: text.trim(), createdAt: new Date().toISOString() }, ...prev]);
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(x => x.id !== id));

  const clearAll = () => setItems([]);

  return { items, addItem, removeItem, clearAll };
}

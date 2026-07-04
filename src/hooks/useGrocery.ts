import { useLocalStorage } from './useLocalStorage';
import type { GroceryList, GroceryItem } from '../types';
import { nanoid } from '../utils/nanoid';

export function useGrocery() {
  const [lists, setLists] = useLocalStorage<GroceryList[]>('lh-grocery', []);

  const addList = (name: string) => {
    setLists(prev => [...prev, { id: nanoid(), name, items: [], createdAt: new Date().toISOString() }]);
  };

  const deleteList = (id: string) => {
    setLists(prev => prev.filter(l => l.id !== id));
  };

  const renameList = (id: string, name: string) => {
    setLists(prev => prev.map(l => l.id === id ? { ...l, name } : l));
  };

  const addItem = (listId: string, item: Omit<GroceryItem, 'id' | 'checked'>) => {
    const newItem: GroceryItem = { ...item, id: nanoid(), checked: false };
    setLists(prev => prev.map(l => l.id === listId ? { ...l, items: [...l.items, newItem] } : l));
  };

  const updateItem = (listId: string, itemId: string, updates: Partial<GroceryItem>) => {
    setLists(prev => prev.map(l => {
      if (l.id !== listId) return l;
      return { ...l, items: l.items.map(i => i.id === itemId ? { ...i, ...updates } : i) };
    }));
  };

  const toggleItem = (listId: string, itemId: string) => {
    setLists(prev => prev.map(l => {
      if (l.id !== listId) return l;
      return { ...l, items: l.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i) };
    }));
  };

  const deleteItem = (listId: string, itemId: string) => {
    setLists(prev => prev.map(l => {
      if (l.id !== listId) return l;
      return { ...l, items: l.items.filter(i => i.id !== itemId) };
    }));
  };

  const clearChecked = (listId: string) => {
    setLists(prev => prev.map(l => {
      if (l.id !== listId) return l;
      return { ...l, items: l.items.filter(i => !i.checked) };
    }));
  };

  const importLists = (incoming: Omit<GroceryList, 'id' | 'createdAt'>[]) => {
    const now = new Date().toISOString();
    setLists(prev => [
      ...prev,
      ...incoming.map(l => ({ ...l, id: nanoid(), createdAt: now })),
    ]);
  };

  return {
    lists,
    addList, deleteList, renameList,
    addItem, updateItem, toggleItem, deleteItem, clearChecked,
    importLists,
  };
}

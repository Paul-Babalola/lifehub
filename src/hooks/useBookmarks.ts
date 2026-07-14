import { useLocalStorage } from './useLocalStorage';
import type { Bookmark } from '../types';
import { nanoid } from '../utils/nanoid';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>('lh-bookmarks', []);

  const addBookmark = (data: Omit<Bookmark, 'id' | 'createdAt'>) => {
    setBookmarks(prev => [...prev, { ...data, id: nanoid(), createdAt: new Date().toISOString() }]);
  };

  const updateBookmark = (id: string, updates: Partial<Bookmark>) => {
    setBookmarks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const toggleRead = (id: string) => {
    setBookmarks(prev => prev.map(b => b.id === id ? { ...b, read: !b.read } : b));
  };

  return { bookmarks, addBookmark, updateBookmark, deleteBookmark, toggleRead };
}

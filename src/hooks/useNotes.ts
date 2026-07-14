import { useLocalStorage } from './useLocalStorage';
import type { Note } from '../types';
import { nanoid } from '../utils/nanoid';

export function useNotes() {
  const [notes, setNotes] = useLocalStorage<Note[]>('lh-notes', []);

  const addNote = (title: string, content: string): string => {
    const id = nanoid();
    const now = new Date().toISOString();
    setNotes(prev => [{ id, title, content, createdAt: now, updatedAt: now }, ...prev]);
    return id;
  };

  const updateNote = (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  return { notes, addNote, updateNote, deleteNote };
}

import { useLocalStorage } from './useLocalStorage';
import type { JournalEntry } from '../types';
import { nanoid } from '../utils/nanoid';

export function useJournal() {
  const [entries, setEntries] = useLocalStorage<JournalEntry[]>('lh-journal', []);

  const saveEntry = (date: string, content: string, mood: JournalEntry['mood']) => {
    setEntries(prev => {
      const existing = prev.find(e => e.date === date);
      if (existing) {
        return prev.map(e => e.date === date ? { ...e, content, mood } : e);
      }
      return [...prev, { id: nanoid(), date, content, mood, createdAt: new Date().toISOString() }];
    });
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  return { entries, saveEntry, deleteEntry };
}

import { useLocalStorage } from './useLocalStorage';
import type { MoodEntry } from '../types';
import { nanoid } from '../utils/nanoid';

export function useMood() {
  const [entries, setEntries] = useLocalStorage<MoodEntry[]>('lh-mood', []);

  const saveEntry = (date: string, mood: MoodEntry['mood'], note?: string) => {
    setEntries(prev => {
      const existing = prev.find(e => e.date === date);
      if (existing) {
        return prev.map(e => e.date === date ? { ...e, mood, note } : e);
      }
      return [...prev, { id: nanoid(), date, mood, note, createdAt: new Date().toISOString() }];
    });
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  return { entries, saveEntry, deleteEntry };
}

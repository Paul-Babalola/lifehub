import { useLocalStorage } from './useLocalStorage';
import type { Habit, HabitLog } from '../types';
import { nanoid } from '../utils/nanoid';
import { format, subDays } from 'date-fns';

export function useHabits() {
  const [habits, setHabits] = useLocalStorage<Habit[]>('lh-habits', []);
  const [logs, setLogs] = useLocalStorage<HabitLog[]>('lh-habit-logs', []);

  const addHabit = (name: string, color: string, icon: string) => {
    setHabits(prev => [...prev, { id: nanoid(), name, color, icon, createdAt: new Date().toISOString() }]);
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setLogs(prev => prev.filter(l => l.habitId !== id));
  };

  const toggleLog = (habitId: string, date: string) => {
    setLogs(prev => {
      const exists = prev.some(l => l.habitId === habitId && l.date === date);
      if (exists) return prev.filter(l => !(l.habitId === habitId && l.date === date));
      return [...prev, { habitId, date }];
    });
  };

  const isLogged = (habitId: string, date: string): boolean =>
    logs.some(l => l.habitId === habitId && l.date === date);

  const getStreak = (habitId: string): number => {
    let streak = 0;
    let d = new Date();
    while (true) {
      const dateStr = format(d, 'yyyy-MM-dd');
      if (!logs.some(l => l.habitId === habitId && l.date === dateStr)) break;
      streak++;
      d = subDays(d, 1);
    }
    return streak;
  };

  return { habits, logs, addHabit, deleteHabit, toggleLog, isLogged, getStreak };
}

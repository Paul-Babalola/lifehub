import { useLocalStorage } from './useLocalStorage';
import type { Goal } from '../types';
import { nanoid } from '../utils/nanoid';

export function useGoals() {
  const [goals, setGoals] = useLocalStorage<Goal[]>('lh-life-goals', []);

  const addGoal = (data: Omit<Goal, 'id' | 'createdAt'>) => {
    setGoals(prev => [...prev, { ...data, id: nanoid(), createdAt: new Date().toISOString() }]);
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      const milestones = g.milestones.map(m =>
        m.id === milestoneId ? { ...m, done: !m.done } : m
      );
      const progress = milestones.length > 0
        ? Math.round((milestones.filter(m => m.done).length / milestones.length) * 100)
        : g.progress;
      return { ...g, milestones, progress };
    }));
  };

  return { goals, addGoal, updateGoal, deleteGoal, toggleMilestone };
}

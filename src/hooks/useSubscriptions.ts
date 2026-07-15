import { useLocalStorage } from './useLocalStorage';
import type { Subscription } from '../types';
import { nanoid } from '../utils/nanoid';
import { differenceInDays, parseISO } from 'date-fns';

export const SUB_CATEGORIES = ['Streaming', 'Software', 'Cloud', 'Fitness', 'News', 'Music', 'Gaming', 'Finance', 'Other'];
export const SUB_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#ef4444', '#06b6d4'];

export function toMonthly(amount: number, cycle: Subscription['cycle']): number {
  if (cycle === 'weekly') return (amount * 52) / 12;
  if (cycle === 'yearly') return amount / 12;
  return amount;
}

export function useSubscriptions() {
  const [subs, setSubs] = useLocalStorage<Subscription[]>('lh-subscriptions', []);

  const addSub = (s: Omit<Subscription, 'id' | 'createdAt'>) =>
    setSubs(prev => [...prev, { ...s, id: nanoid(), createdAt: new Date().toISOString() }]);

  const updateSub = (id: string, s: Partial<Subscription>) =>
    setSubs(prev => prev.map(x => x.id === id ? { ...x, ...s } : x));

  const deleteSub = (id: string) =>
    setSubs(prev => prev.filter(x => x.id !== id));

  const totalMonthly = subs
    .filter(s => s.active)
    .reduce((acc, s) => acc + toMonthly(s.amount, s.cycle), 0);

  const renewingSoon = subs.filter(s => {
    if (!s.active || !s.nextRenewal) return false;
    const days = differenceInDays(parseISO(s.nextRenewal), new Date());
    return days >= 0 && days <= 7;
  });

  return { subs, addSub, updateSub, deleteSub, totalMonthly, renewingSoon };
}

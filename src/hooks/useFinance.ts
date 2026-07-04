import { useLocalStorage } from './useLocalStorage';
import type { Transaction, Budget, SavingsGoal } from '../types';
import { nanoid } from '../utils/nanoid';
import { format, addDays, addWeeks, addMonths, subMonths, parseISO } from 'date-fns';

export const EXPENSE_CATEGORIES = [
  'Housing', 'Food', 'Transport', 'Healthcare', 'Entertainment',
  'Shopping', 'Utilities', 'Education', 'Savings', 'Other',
];

export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

function computeNextDateStr(dateStr: string, cfg: { frequency: string; interval: number }): string {
  const d = parseISO(dateStr);
  if (cfg.frequency === 'daily')  return format(addDays(d,   cfg.interval), 'yyyy-MM-dd');
  if (cfg.frequency === 'weekly') return format(addWeeks(d,  cfg.interval), 'yyyy-MM-dd');
  return format(addMonths(d, cfg.interval), 'yyyy-MM-dd');
}

export function useFinance() {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('lh-transactions', []);
  const [budgets, setBudgets] = useLocalStorage<Budget[]>('lh-budgets', []);
  const [goals, setGoals] = useLocalStorage<SavingsGoal[]>('lh-goals', []);

  const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const seriesId = tx.recurring ? (tx.seriesId ?? nanoid()) : undefined;
    setTransactions(prev => [...prev, { ...tx, seriesId, id: nanoid(), createdAt: new Date().toISOString() }]);
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Generates any missing past/present occurrences for recurring transaction series.
  const generateRecurring = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setTransactions(prev => {
      const withSeries = prev.filter(t => t.recurring && t.seriesId);
      if (withSeries.length === 0) return prev;

      const groups = new Map<string, Transaction[]>();
      for (const t of withSeries) {
        const key = t.seriesId!;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(t);
      }

      const toAdd: Transaction[] = [];
      const now = new Date().toISOString();

      for (const [seriesId, group] of groups) {
        const template = group[0];
        const existingDates = new Set(group.map(t => t.date));
        const latestDate = group.reduce((max, t) => t.date > max ? t.date : max, group[0].date);

        let next = computeNextDateStr(latestDate, template.recurring!);
        while (next <= today) {
          if (!existingDates.has(next)) {
            toAdd.push({ ...template, id: nanoid(), date: next, seriesId, createdAt: now });
            existingDates.add(next);
          }
          next = computeNextDateStr(next, template.recurring!);
        }
      }

      return toAdd.length === 0 ? prev : [...prev, ...toAdd];
    });
  };

  // Auto-copy previous month's budgets to current month if none exist.
  const autoCopyBudgets = () => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const prevMonth = format(subMonths(new Date(), 1), 'yyyy-MM');
    setBudgets(prev => {
      if (prev.some(b => b.month === currentMonth) || !prev.some(b => b.month === prevMonth)) return prev;
      const from = prev.filter(b => b.month === prevMonth);
      return [...prev, ...from.map(b => ({ ...b, id: nanoid(), month: currentMonth }))];
    });
  };

  const importTransactions = (incoming: Omit<Transaction, 'id' | 'createdAt'>[]) => {
    const now = new Date().toISOString();
    setTransactions(prev => [
      ...prev,
      ...incoming.map(t => ({ ...t, id: nanoid(), createdAt: now })),
    ]);
  };

  const upsertBudget = (category: string, limit: number, month?: string) => {
    const m = month ?? format(new Date(), 'yyyy-MM');
    setBudgets(prev => {
      const existing = prev.find(b => b.category === category && b.month === m);
      if (existing) {
        return prev.map(b => b.id === existing.id ? { ...b, limit } : b);
      }
      return [...prev, { id: nanoid(), category, limit, month: m }];
    });
  };

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  const copyBudgetsFromMonth = (fromMonth: string, toMonth: string) => {
    setBudgets(prev => {
      const from = prev.filter(b => b.month === fromMonth);
      const existing = new Set(prev.filter(b => b.month === toMonth).map(b => b.category));
      const toCopy = from.filter(b => !existing.has(b.category));
      if (toCopy.length === 0) return prev;
      return [...prev, ...toCopy.map(b => ({ ...b, id: nanoid(), month: toMonth }))];
    });
  };

  // Analyze last 3 months of spending and generate suggested budgets for current month.
  const generateBudgetsFromHistory = (targetMonth?: string): { count: number; categories: string[] } => {
    const m = targetMonth ?? format(new Date(), 'yyyy-MM');
    const today = new Date();

    const totals: Record<string, number> = {};
    for (let i = 1; i <= 3; i++) {
      const monthStr = format(subMonths(today, i), 'yyyy-MM');
      const spending = getCategorySpending(monthStr);
      for (const [cat, amt] of Object.entries(spending)) {
        totals[cat] = (totals[cat] ?? 0) + amt;
      }
    }

    const existing = new Set(budgets.filter(b => b.month === m).map(b => b.category));
    const toAdd: Budget[] = [];

    for (const [cat, total] of Object.entries(totals)) {
      if (existing.has(cat)) continue;
      const avg = total / 3;
      const suggested = Math.max(10, Math.ceil(avg * 1.1 / 10) * 10);
      toAdd.push({ id: nanoid(), category: cat, limit: suggested, month: m });
    }

    if (toAdd.length > 0) {
      setBudgets(prev => [...prev, ...toAdd]);
    }

    return { count: toAdd.length, categories: toAdd.map(b => b.category) };
  };

  // ── Savings goals ────────────────────────────────────────────────────────────

  const addGoal = (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    setGoals(prev => [...prev, { ...goal, id: nanoid(), createdAt: new Date().toISOString() }]);
  };

  const updateGoal = (id: string, updates: Partial<SavingsGoal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const contributeToGoal = (id: string, amount: number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, saved: Math.min(g.saved + amount, g.target) } : g));
  };

  // ── Stats ────────────────────────────────────────────────────────────────────

  const getMonthlyStats = (month: string) => {
    const txs = transactions.filter(t => t.date.startsWith(month));
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expenses, net: income - expenses };
  };

  const getCategorySpending = (month: string) => {
    return transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(month))
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + t.amount;
        return acc;
      }, {});
  };

  return {
    transactions, budgets, goals,
    addTransaction, updateTransaction, deleteTransaction,
    generateRecurring, autoCopyBudgets, importTransactions,
    upsertBudget, deleteBudget, copyBudgetsFromMonth, generateBudgetsFromHistory,
    addGoal, updateGoal, deleteGoal, contributeToGoal,
    getMonthlyStats, getCategorySpending,
  };
}

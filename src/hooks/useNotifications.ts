import { useMemo } from 'react';
import { useTasks } from './useTasks';
import { useFinance } from './useFinance';
import { isToday, isPast, parseISO, format } from 'date-fns';
import type { NotificationPrefs } from '../types';

export type NotificationLevel = 'error' | 'warning' | 'info';

export interface AppNotification {
  id: string;
  level: NotificationLevel;
  title: string;
  body: string;
  page: 'tasks' | 'finance';
}

const DEFAULT_PREFS: NotificationPrefs = {
  overdueTasks: true, dueTodayTasks: true, overBudget: true, nearBudget: true,
};

export function useNotifications(prefs?: NotificationPrefs) {
  const { tasks } = useTasks();
  const { budgets, getCategorySpending } = useFinance();
  const p = prefs ?? DEFAULT_PREFS;

  const notifications = useMemo(() => {
    const month = format(new Date(), 'yyyy-MM');
    const spending = getCategorySpending(month);
    const monthBudgets = budgets.filter(b => b.month === month);
    const items: AppNotification[] = [];

    if (p.overdueTasks) {
      const overdue = tasks.filter(t => !t.done && t.dueDate && isPast(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate)));
      if (overdue.length > 0) {
        items.push({
          id: 'overdue', level: 'error',
          title: `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`,
          body: overdue.slice(0, 2).map(t => t.title).join(', ') + (overdue.length > 2 ? ` +${overdue.length - 2} more` : ''),
          page: 'tasks',
        });
      }
    }

    if (p.dueTodayTasks) {
      const dueToday = tasks.filter(t => !t.done && t.dueDate && isToday(parseISO(t.dueDate)));
      if (dueToday.length > 0) {
        items.push({
          id: 'due-today', level: 'warning',
          title: `${dueToday.length} task${dueToday.length > 1 ? 's' : ''} due today`,
          body: dueToday.slice(0, 2).map(t => t.title).join(', ') + (dueToday.length > 2 ? ` +${dueToday.length - 2} more` : ''),
          page: 'tasks',
        });
      }
    }

    for (const b of monthBudgets) {
      const spent = spending[b.category] ?? 0;
      if (p.overBudget && spent > b.limit) {
        items.push({
          id: `budget-over-${b.category}`, level: 'error',
          title: `${b.category} budget exceeded`,
          body: `Spent $${spent.toFixed(0)} of $${b.limit.toFixed(0)} limit`,
          page: 'finance',
        });
      } else if (p.nearBudget && spent / b.limit > 0.8) {
        items.push({
          id: `budget-warn-${b.category}`, level: 'warning',
          title: `${b.category} budget at ${Math.round((spent / b.limit) * 100)}%`,
          body: `$${(b.limit - spent).toFixed(0)} remaining this month`,
          page: 'finance',
        });
      }
    }

    // Spending velocity: predict overage for categories not yet flagged
    if (p.nearBudget) {
      const today = new Date();
      const dayOfMonth = today.getDate();
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      if (dayOfMonth >= 8) {
        for (const b of monthBudgets) {
          const spent = spending[b.category] ?? 0;
          const pct = spent / b.limit;
          if (pct >= 0.8 || spent > b.limit) continue;
          const projected = (spent / dayOfMonth) * daysInMonth;
          if (projected > b.limit) {
            items.push({
              id: `velocity-${b.category}`, level: 'info',
              title: `${b.category} on pace to exceed budget`,
              body: `Projected $${projected.toFixed(0)} vs $${b.limit.toFixed(0)} limit this month`,
              page: 'finance',
            });
          }
        }
      }
    }

    return items;
  }, [tasks, budgets, getCategorySpending, p]);

  return notifications;
}

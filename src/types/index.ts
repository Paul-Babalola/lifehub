export type Priority = 'low' | 'medium' | 'high';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly';

export interface RecurringConfig {
  frequency: RecurringFrequency;
  interval: number;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  priority: Priority;
  dueDate?: string;
  projectId?: string;
  subtasks: Subtask[];
  recurring?: RecurringConfig;
  status?: 'todo' | 'in-progress' | 'done';
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  recurring?: RecurringConfig;
  seriesId?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  month: string; // "2026-07"
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
  color: string;
  deadline?: string;
  createdAt: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity?: string;
  category?: string;
  checked: boolean;
}

export interface GroceryList {
  id: string;
  name: string;
  items: GroceryItem[];
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
}

export interface HabitLog {
  habitId: string;
  date: string; // yyyy-MM-dd
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface NotificationPrefs {
  overdueTasks: boolean;
  dueTodayTasks: boolean;
  overBudget: boolean;
  nearBudget: boolean;
}

export interface AppSettings {
  anthropicApiKey: string;
  aiModel: string;
  darkMode?: boolean;
  notifications?: NotificationPrefs;
}

export type Page = 'dashboard' | 'tasks' | 'finance' | 'grocery' | 'notes' | 'habits' | 'settings';

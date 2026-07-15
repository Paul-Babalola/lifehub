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
  currency?: string;
}

export type Page = 'dashboard' | 'tasks' | 'finance' | 'grocery' | 'notes' | 'habits' | 'inbox' | 'settings';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  cycle: 'weekly' | 'monthly' | 'yearly';
  category: string;
  nextRenewal: string;
  color: string;
  active: boolean;
  createdAt: string;
}

export interface InboxItem {
  id: string;
  text: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  progress: number;
  milestones: { id: string; text: string; done: boolean }[];
  category: 'health' | 'finance' | 'personal' | 'career' | 'learning' | 'other';
  color: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: 1 | 2 | 3 | 4 | 5;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  tags: string[];
  read: boolean;
  createdAt: string;
}

export interface MoodEntry {
  id: string;
  date: string;
  mood: 1 | 2 | 3 | 4 | 5;
  note?: string;
  createdAt: string;
}

export interface AccountabilityPair {
  id: string;
  inviteCode: string;
  habitName: string;
  user1Id: string;
  user1Name: string;
  user1HabitId: string;
  user2Id: string | null;
  user2Name: string | null;
  user2HabitId: string | null;
  status: 'pending' | 'active';
  createdAt: string;
}

export interface AccountabilityLog {
  id: string;
  pairId: string;
  userId: string;
  date: string;
}

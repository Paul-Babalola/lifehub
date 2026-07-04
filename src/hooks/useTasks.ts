import { useLocalStorage } from './useLocalStorage';
import type { Task, Project, Subtask, RecurringConfig } from '../types';
import { nanoid } from '../utils/nanoid';
import { format, addDays, addWeeks, addMonths, parseISO } from 'date-fns';

const DEFAULT_PROJECTS: Project[] = [
  { id: 'personal', name: 'Personal', color: '#6366f1' },
  { id: 'work', name: 'Work', color: '#f59e0b' },
];

function nextDueDate(dateStr: string, cfg: RecurringConfig): string {
  const d = parseISO(dateStr);
  if (cfg.frequency === 'daily')   return format(addDays(d,   cfg.interval), 'yyyy-MM-dd');
  if (cfg.frequency === 'weekly')  return format(addWeeks(d,  cfg.interval), 'yyyy-MM-dd');
  return format(addMonths(d, cfg.interval), 'yyyy-MM-dd');
}

export function useTasks() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('lh-tasks', []);
  const [projects, setProjects] = useLocalStorage<Project[]>('lh-projects', DEFAULT_PROJECTS);

  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    setTasks(prev => [...prev, { ...task, id: nanoid(), createdAt: new Date().toISOString() }]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const toggleTask = (id: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      const updated = prev.map(t => t.id === id ? { ...t, done: !t.done } : t);

      // Completing a recurring task with a due date → spawn next occurrence
      if (task && !task.done && task.recurring && task.dueDate) {
        const next: Task = {
          ...task,
          id: nanoid(),
          done: false,
          dueDate: nextDueDate(task.dueDate, task.recurring),
          createdAt: new Date().toISOString(),
          subtasks: task.subtasks.map(s => ({ ...s, id: nanoid(), done: false })),
        };
        return [...updated, next];
      }
      return updated;
    });
  };

  const addSubtask = (taskId: string, title: string) => {
    const sub: Subtask = { id: nanoid(), title, done: false };
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subtasks: [...t.subtasks, sub] } : t));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return { ...t, subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, done: !s.done } : s) };
    }));
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return { ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId) };
    }));
  };

  const addProject = (name: string, color: string) => {
    setProjects(prev => [...prev, { id: nanoid(), name, color }]);
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.map(t => t.projectId === id ? { ...t, projectId: undefined } : t));
  };

  return {
    tasks, projects,
    addTask, updateTask, deleteTask, toggleTask,
    addSubtask, toggleSubtask, deleteSubtask,
    addProject, deleteProject,
  };
}

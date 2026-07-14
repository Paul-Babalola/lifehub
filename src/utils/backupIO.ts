import { format, differenceInDays, parseISO } from 'date-fns';

const BACKUP_KEYS = ['lh-tasks', 'lh-projects', 'lh-transactions', 'lh-budgets', 'lh-goals', 'lh-life-goals', 'lh-grocery', 'lh-notes', 'lh-habits', 'lh-habit-logs', 'lh-journal', 'lh-bookmarks', 'lh-mood', 'lh-settings'];
const LAST_BACKUP_KEY = 'lh-last-backup'; // intentionally outside BACKUP_KEYS

export function exportBackup(): void {
  const data: Record<string, unknown> = { _version: 1, _exportedAt: new Date().toISOString() };
  for (const key of BACKUP_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try { data[key] = JSON.parse(raw); } catch { data[key] = raw; }
    }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lifehub-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
}

export function getBackupStatus(): { daysSince: number | null; lastBackupAt: string | null } {
  const raw = localStorage.getItem(LAST_BACKUP_KEY);
  if (!raw) return { daysSince: null, lastBackupAt: null };
  try {
    const d = parseISO(raw);
    return { daysSince: differenceInDays(new Date(), d), lastBackupAt: format(d, 'MMM d, yyyy') };
  } catch {
    return { daysSince: null, lastBackupAt: null };
  }
}

export function importBackup(raw: string): { success: boolean; error?: string; restored: string[] } {
  try {
    const data = JSON.parse(raw);
    const restored: string[] = [];
    for (const key of BACKUP_KEYS) {
      if (data[key] !== undefined) {
        localStorage.setItem(key, JSON.stringify(data[key]));
        restored.push(key.replace('lh-', ''));
      }
    }
    return { success: true, restored };
  } catch {
    return { success: false, error: 'Invalid backup file.', restored: [] };
  }
}

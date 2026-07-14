import { useState, useEffect } from 'react';
import { Sidebar, MobileHeader } from './components/layout/Sidebar';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { TasksPage } from './components/tasks/TasksPage';
import { FinancePage } from './components/finance/FinancePage';
import { GroceryPage } from './components/grocery/GroceryPage';
import { NotesPage } from './components/notes/NotesPage';
import { HabitsPage } from './components/habits/HabitsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { AIAssistant } from './components/ai/AIAssistant';
import { SearchOverlay } from './components/shared/SearchOverlay';
import { BackupReminderBanner } from './components/shared/BackupReminderBanner';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useSync } from './hooks/useSync';
import { useAuth } from './hooks/useAuth';
import { useNotifications } from './hooks/useNotifications';
import { useBrowserNotifications } from './hooks/useBrowserNotifications';
import { AuthPage } from './components/auth/AuthPage';
import { SetNewPasswordPage } from './components/auth/SetNewPasswordPage';
import type { Page, AppSettings } from './types';
import { getShareParam, clearShareParam } from './utils/shareUtils';

const DEFAULT_SETTINGS: AppSettings = {
  anthropicApiKey: '',
  aiModel: 'claude-sonnet-4-6',
  darkMode: false,
  notifications: { overdueTasks: true, dueTodayTasks: true, overBudget: true, nearBudget: true },
};

const PAGE_TITLES: Record<Page, string> = {
  dashboard: 'Dashboard',
  tasks: 'Tasks',
  finance: 'Finance',
  grocery: 'Grocery',
  notes: 'Notes',
  habits: 'Habits',
  settings: 'Settings',
};

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [aiOpen, setAiOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useLocalStorage<AppSettings>('lh-settings', DEFAULT_SETTINGS);
  const { user, loading, isRecoveryMode, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, setNewPassword, updateProfile, signOut, firstName, isSupabaseConfigured } = useAuth();
  const notifications = useNotifications(settings.notifications);
  useBrowserNotifications(notifications, !!(settings.notifications?.overdueTasks || settings.notifications?.dueTodayTasks || settings.notifications?.overBudget || settings.notifications?.nearBudget));
  const sync = useSync(user?.id ?? null);
  const [shareImport, setShareImport] = useState<{ label: string; count: number; apply: () => void } | null>(null);

  // Pull cloud data once when a user first signs in on this device
  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) return;
    const key = `lh-pulled-${user.id}`;
    if (localStorage.getItem(key)) return;
    sync.pull().then(pulled => {
      if (pulled) {
        localStorage.setItem(key, '1');
        window.location.reload();
      } else {
        localStorage.setItem(key, '1');
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Apply dark mode on mount and when settings change
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.darkMode ?? false);
  }, [settings.darkMode]);

  // Detect shared data in URL on mount
  useEffect(() => {
    const payload = getShareParam();
    if (!payload) return;
    clearShareParam();
    setShareImport({
      label: payload.label,
      count: payload.data.length,
      apply: () => {
        const key = payload.type === 'tasks' ? 'lh-tasks'
          : payload.type === 'finance' ? 'lh-transactions'
          : payload.type === 'grocery' ? 'lh-grocery'
          : 'lh-notes';
        const existing = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown[];
        const merged = [...existing, ...payload.data];
        localStorage.setItem(key, JSON.stringify(merged));
        window.location.reload();
      },
    });
  }, []);

  // Global Cmd+K shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(s => !s);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  if (loading && isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f5f6fa 0%, #eef0f8 100%)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  if (isRecoveryMode) {
    return <SetNewPasswordPage onSave={(pw) => setNewPassword?.(pw)} />;
  }

  if (isSupabaseConfigured && !user) {
    return (
      <AuthPage
        onSignIn={() => signInWithGoogle()}
        onEmailSignIn={(email, password) => signInWithEmail?.(email, password)}
        onEmailSignUp={(email, password, fn, ln) => signUpWithEmail?.(email, password, fn, ln)}
        onResetPassword={(email) => resetPassword?.(email)}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden w-full">
      <Sidebar
        page={page}
        onNavigate={setPage}
        aiOpen={aiOpen}
        onToggleAI={() => setAiOpen(!aiOpen)}
        onOpenSearch={() => setSearchOpen(true)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        userName={firstName}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <MobileHeader title={PAGE_TITLES[page]} onOpen={() => setMobileMenuOpen(true)} userName={firstName} />

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <main className="flex-1 overflow-hidden flex flex-col">
            {page === 'dashboard' && <DashboardPage onNavigate={setPage} userName={firstName} />}
            {page === 'tasks'     && <TasksPage />}
            {page === 'finance'   && <FinancePage />}
            {page === 'grocery'   && <GroceryPage />}
            {page === 'notes'     && <NotesPage />}
            {page === 'habits'    && <HabitsPage />}
            {page === 'settings'  && <SettingsPage settings={settings} onSave={s => { setSettings(s); }} sync={sync} user={user} onSignOut={signOut} onUpdateProfile={(fn, ln) => updateProfile?.(fn, ln)} />}
          </main>

          {aiOpen && (
            <AIAssistant settings={settings} onClose={() => setAiOpen(false)} />
          )}
        </div>
      </div>

      {searchOpen && (
        <SearchOverlay onNavigate={p => { setPage(p); setSearchOpen(false); }} onClose={() => setSearchOpen(false)} />
      )}

      <BackupReminderBanner />

      {shareImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)' }}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center"
            style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <div className="text-3xl mb-3">📤</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Shared data received</h2>
            <p className="text-sm text-gray-500 mb-1">{shareImport.label}</p>
            <p className="text-xs text-gray-400 mb-5">{shareImport.count} item{shareImport.count !== 1 ? 's' : ''} will be merged into your existing data.</p>
            <div className="flex gap-3">
              <button onClick={() => setShareImport(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                Ignore
              </button>
              <button onClick={() => { shareImport.apply(); setShareImport(null); }}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                Import data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

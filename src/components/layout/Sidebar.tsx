import { CheckSquare, DollarSign, ShoppingCart, Settings, Sparkles, Menu, LayoutDashboard, FileText, Search, Flame } from 'lucide-react';
import type { Page, NotificationPrefs } from '../../types';
import { NotificationBell } from './NotificationBell';
import { useNotifications } from '../../hooks/useNotifications';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { AppSettings } from '../../types';

interface Props {
  page: Page;
  onNavigate: (p: Page) => void;
  aiOpen: boolean;
  onToggleAI: () => void;
  onOpenSearch: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} strokeWidth={1.75} /> },
  { id: 'tasks',     label: 'Tasks',     icon: <CheckSquare     size={18} strokeWidth={1.75} /> },
  { id: 'finance',   label: 'Finance',   icon: <DollarSign      size={18} strokeWidth={1.75} /> },
  { id: 'grocery',   label: 'Grocery',   icon: <ShoppingCart    size={18} strokeWidth={1.75} /> },
  { id: 'notes',     label: 'Notes',     icon: <FileText        size={18} strokeWidth={1.75} /> },
  { id: 'habits',    label: 'Habits',    icon: <Flame           size={18} strokeWidth={1.75} /> },
  { id: 'settings',  label: 'Settings',  icon: <Settings        size={18} strokeWidth={1.75} /> },
];

const DEFAULT_SETTINGS: AppSettings = { anthropicApiKey: '', aiModel: 'claude-sonnet-4-6' };

function SidebarContent({ page, onNavigate, aiOpen, onToggleAI, onOpenSearch, onCloseMobile }: Omit<Props, 'mobileOpen'>) {
  const navigate = (p: Page) => { onNavigate(p); onCloseMobile(); };
  const [settings] = useLocalStorage<AppSettings>('lh-settings', DEFAULT_SETTINGS);
  const notifications = useNotifications(settings.notifications as NotificationPrefs | undefined);

  return (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)' }}>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
            <span className="text-white font-bold text-sm tracking-tight">LH</span>
          </div>
          <div>
            <span className="text-white font-semibold text-base tracking-tight leading-none">LifeHub</span>
            <p className="text-[10px] text-indigo-400 mt-0.5 leading-none">Personal OS</p>
          </div>
        </div>
      </div>

      <div className="mx-3 h-px bg-white/5 mb-3" />

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest px-3 mb-2">Menu</p>
        {navItems.map(item => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group"
              style={active ? { background: 'rgba(255,255,255,0.1)', color: '#fff', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)' } : { color: '#94a3b8' }}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                  style={{ background: 'linear-gradient(180deg, #818cf8, #a78bfa)' }} />
              )}
              <span className={active ? 'text-indigo-300' : 'text-slate-500 group-hover:text-slate-300 transition-colors'}>{item.icon}</span>
              <span className={active ? 'text-white' : 'group-hover:text-slate-200 transition-colors'}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-6 space-y-0.5">
        <div className="mx-0 h-px bg-white/5 mb-3" />

        {/* Search button */}
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
          style={{ color: '#94a3b8' }}>
          <Search size={18} strokeWidth={1.75} className="text-slate-500" />
          <span>Search</span>
          <kbd className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded border border-white/10 text-slate-600">⌘K</kbd>
        </button>

        {/* Notification bell */}
        <NotificationBell notifications={notifications} onNavigate={navigate} />

        {/* AI button */}
        <button
          onClick={onToggleAI}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
          style={aiOpen ? {
            background: 'linear-gradient(135deg, rgba(250,204,21,0.15), rgba(251,146,60,0.1))',
            color: '#fbbf24',
            boxShadow: 'inset 0 1px 0 rgba(251,191,36,0.1)',
          } : { color: '#94a3b8' }}
        >
          <Sparkles size={18} strokeWidth={1.75} className={aiOpen ? 'text-yellow-400' : 'text-slate-500'} />
          <span className={aiOpen ? 'text-yellow-300' : ''}>AI Assistant</span>
          {aiOpen && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />}
        </button>
      </div>
    </div>
  );
}

export function Sidebar(props: Props) {
  return (
    <>
      <aside className="hidden md:flex flex-col shrink-0" style={{ width: 220 }}>
        <SidebarContent {...props} />
      </aside>

      {props.mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={props.onCloseMobile} />
          <aside className="absolute left-0 top-0 bottom-0 flex flex-col z-50" style={{ width: 220 }}>
            <SidebarContent {...props} />
          </aside>
        </div>
      )}
    </>
  );
}

export function MobileHeader({ onOpen, title }: { onOpen: () => void; title: string }) {
  return (
    <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-30">
      <button onClick={onOpen} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
        <Menu size={20} />
      </button>
      <span className="font-semibold text-gray-900">{title}</span>
    </header>
  );
}

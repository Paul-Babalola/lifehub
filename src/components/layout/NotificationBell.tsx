import { useState, useRef, useEffect } from 'react';
import { Bell, CheckSquare, DollarSign, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { AppNotification } from '../../hooks/useNotifications';
import type { Page } from '../../types';

const LEVEL_STYLES = {
  error:   { icon: <AlertCircle  size={14} strokeWidth={2} />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   dot: '#ef4444' },
  warning: { icon: <AlertTriangle size={14} strokeWidth={2} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', dot: '#f59e0b' },
  info:    { icon: <Info          size={14} strokeWidth={2} />, color: '#6366f1', bg: 'rgba(99,102,241,0.1)', dot: '#6366f1' },
};

const PAGE_ICON: Record<Page, React.ReactNode> = {
  dashboard: null,
  tasks:     <CheckSquare size={12} strokeWidth={2} />,
  finance:   <DollarSign  size={12} strokeWidth={2} />,
  grocery:   null,
  notes:     null,
  habits:    null,
  inbox:     null,
  settings:  null,
};

interface Props {
  notifications: AppNotification[];
  onNavigate: (p: Page) => void;
}

export function NotificationBell({ notifications, onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const count = notifications.length;
  const errorCount = notifications.filter(n => n.level === 'error').length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group"
        style={open ? { background: 'rgba(255,255,255,0.1)', color: '#fff' } : { color: '#94a3b8' }}
      >
        <span className="relative shrink-0">
          <Bell size={18} strokeWidth={1.75} className={open ? 'text-white' : 'text-slate-500 group-hover:text-slate-300 transition-colors'} />
          {count > 0 && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
              style={{ fontSize: 9, background: errorCount > 0 ? '#ef4444' : '#f59e0b', boxShadow: '0 0 0 2px #1e1b4b' }}
            >
              {count > 9 ? '9+' : count}
            </span>
          )}
        </span>
        <span className={open ? 'text-white' : 'group-hover:text-slate-200 transition-colors'}>Notifications</span>
        {count === 0 && <span className="ml-auto text-[10px] text-slate-600">All clear</span>}
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 mb-2 w-80 rounded-2xl overflow-hidden z-50"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.24), 0 0 0 1px rgba(255,255,255,0.06)', background: '#1e293b' }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-slate-400" />
              <span className="text-sm font-semibold text-white">Notifications</span>
              {count > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: errorCount > 0 ? '#ef4444' : '#f59e0b' }}>
                  {count}
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors">
              <X size={13} />
            </button>
          </div>

          {/* Items */}
          <div className="p-2 max-h-72 overflow-y-auto">
            {count === 0 ? (
              <div className="py-8 text-center">
                <div className="text-2xl mb-2">✓</div>
                <p className="text-sm text-slate-400">You're all caught up!</p>
              </div>
            ) : (
              notifications.map(n => {
                const style = LEVEL_STYLES[n.level];
                return (
                  <button
                    key={n.id}
                    onClick={() => { onNavigate(n.page); setOpen(false); }}
                    className="w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-colors hover:bg-white/5 group"
                  >
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: style.bg, color: style.color }}>
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white leading-tight">{n.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{n.body}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 group-hover:text-slate-400 flex items-center gap-1 shrink-0 mt-1" style={{ color: style.color + 'aa' }}>
                      {PAGE_ICON[n.page]}
                      {n.page}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

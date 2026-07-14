import { useState } from 'react';
import { CheckSquare, DollarSign, ShoppingCart, ChevronRight, Check, TrendingUp, TrendingDown, Wallet, Calendar, ShoppingBag } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useFinance } from '../../hooks/useFinance';
import { useGrocery } from '../../hooks/useGrocery';
import type { Page, Task, Priority } from '../../types';
import { format, parseISO } from 'date-fns';
import { WeeklyReview } from './WeeklyReview';

const PRIORITY_COLORS: Record<Priority, string> = {
  low: '#10b981', medium: '#f59e0b', high: '#ef4444',
};
const PRIORITY_BG: Record<Priority, string> = {
  low: 'rgba(16,185,129,0.1)', medium: 'rgba(245,158,11,0.1)', high: 'rgba(239,68,68,0.1)',
};

function Stat({ icon, value, label, color }: { icon: React.ReactNode; value: string | number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)' }}>
      <span style={{ color }}>{icon}</span>
      <span className="text-white font-bold text-sm tabular">{value}</span>
      <span className="text-white/50 text-xs">{label}</span>
    </div>
  );
}

function SectionHeader({ icon, title, sub, count, countColor, onNavigate }: {
  icon: React.ReactNode; title: string; sub?: string;
  count?: number; countColor?: string; onNavigate: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-semibold text-gray-900 text-sm">{title}</span>
        {count !== undefined && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${countColor ?? 'bg-gray-100 text-gray-500'}`}>{count}</span>
        )}
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
      </div>
      <button onClick={onNavigate} className="text-xs text-gray-400 hover:text-indigo-500 transition-colors flex items-center gap-0.5 font-medium">
        View all <ChevronRight size={12} />
      </button>
    </div>
  );
}

function FinanceStat({ label, value, color, icon, bold }: { label: string; value: number; color: string; icon: React.ReactNode; bold?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span style={{ color }}>{icon}</span>
      <span className={`text-sm flex-1 ${bold ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{label}</span>
      <span className={`text-sm tabular ${bold ? 'font-bold' : 'font-semibold'}`} style={{ color }}>
        {value < 0 ? '-' : ''}${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </span>
    </div>
  );
}

function EmptyState({ icon, text, sub }: { icon: React.ReactNode; text: string; sub: string }) {
  return (
    <div className="flex flex-col items-center py-8 text-gray-300 mt-1">
      {icon}
      <p className="text-sm text-gray-400 mt-2 font-medium">{text}</p>
      <p className="text-xs text-gray-300 mt-0.5 text-center">{sub}</p>
    </div>
  );
}

function TodayTaskRow({ task, onToggle }: { task: Task; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-3 group py-1">
      <button onClick={onToggle}
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all hover:border-indigo-400 active:scale-95"
        style={{ borderColor: '#d1d5db' }}>
        <Check size={9} className="text-transparent group-hover:text-indigo-300 transition-colors" strokeWidth={3} />
      </button>
      <span className="text-sm text-gray-700 flex-1 truncate">{task.title}</span>
      <span className="text-xs px-1.5 py-0.5 rounded-md font-medium shrink-0"
        style={{ background: PRIORITY_BG[task.priority], color: PRIORITY_COLORS[task.priority] }}>
        {task.priority}
      </span>
    </div>
  );
}

export function DashboardPage({ onNavigate, userName }: { onNavigate: (p: Page) => void; userName?: string | null }) {
  const [tab, setTab] = useState<'overview' | 'review'>('overview');
  const { tasks, toggleTask } = useTasks();
  const { getMonthlyStats } = useFinance();
  const { lists } = useGrocery();

  const today = format(new Date(), 'yyyy-MM-dd');
  const month = format(new Date(), 'yyyy-MM');
  const stats = getMonthlyStats(month);

  const dueTodayTasks = tasks.filter(t => !t.done && t.dueDate === today);
  const upcomingTasks = tasks
    .filter(t => !t.done && t.dueDate && t.dueDate > today)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
    .slice(0, 6);

  const totalUnchecked = lists.reduce((s, l) => s + l.items.filter(i => !i.checked).length, 0);
  const activeTasks = tasks.filter(t => !t.done).length;

  const hour = new Date().getHours();
  const greetingBase = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const greeting = userName ? `${greetingBase}, ${userName}` : greetingBase;
  const dateStr = format(new Date(), 'EEEE, MMMM d');

  const cardShadow = { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' };

  return (
    <div className="flex-1 overflow-y-auto p-6 fade-up">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 rounded-xl self-start w-fit" style={{ background: '#f1f5f9' }}>
          {(['overview', 'review'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              {t === 'overview' ? 'Overview' : '📋 Weekly Review'}
            </button>
          ))}
        </div>

        {tab === 'review' && <WeeklyReview />}
        {tab === 'overview' && <>

        {/* Hero */}
        <div className="rounded-3xl p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', boxShadow: '0 8px 32px rgba(15,23,42,0.25)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-[0.04]" style={{ background: 'white', transform: 'translate(35%,-35%)' }} />
          <div className="relative z-10">
            <p className="text-indigo-400 text-sm font-medium mb-0.5">{dateStr}</p>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-4">{greeting}</h1>
            <div className="flex flex-wrap gap-2">
              <Stat icon={<CheckSquare size={14} />} value={activeTasks} label="active tasks" color="#818cf8" />
              <Stat
                icon={<DollarSign size={14} />}
                value={`$${Math.abs(stats.net).toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
                label={`net ${stats.net >= 0 ? 'saved' : 'spent'} this month`}
                color="#34d399"
              />
              <Stat icon={<ShoppingCart size={14} />} value={totalUnchecked} label="items to buy" color="#f472b6" />
            </div>
          </div>
        </div>

        {/* Main row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Today's tasks */}
          <div className="bg-white rounded-3xl p-5" style={cardShadow}>
            <SectionHeader
              icon={<CheckSquare size={16} className="text-indigo-500" />}
              title="Due Today"
              count={dueTodayTasks.length}
              countColor="bg-indigo-100 text-indigo-600"
              onNavigate={() => onNavigate('tasks')}
            />
            {dueTodayTasks.length === 0 ? (
              <EmptyState icon={<Check size={28} strokeWidth={1.5} />} text="All clear for today!" sub="No tasks are due today." />
            ) : (
              <div className="mt-3 space-y-1">
                {dueTodayTasks.slice(0, 7).map(task => (
                  <TodayTaskRow key={task.id} task={task} onToggle={() => toggleTask(task.id)} />
                ))}
                {dueTodayTasks.length > 7 && (
                  <button onClick={() => onNavigate('tasks')} className="text-xs text-indigo-500 mt-1 hover:underline">
                    +{dueTodayTasks.length - 7} more
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Finance snapshot */}
          <div className="bg-white rounded-3xl p-5" style={cardShadow}>
            <SectionHeader
              icon={<DollarSign size={16} className="text-emerald-500" />}
              title="Finance"
              sub={format(new Date(), 'MMMM yyyy')}
              onNavigate={() => onNavigate('finance')}
            />
            <div className="mt-3 space-y-1 divide-y divide-gray-50">
              <FinanceStat label="Income" value={stats.income} color="#10b981" icon={<TrendingUp size={14} />} />
              <FinanceStat label="Expenses" value={stats.expenses} color="#f43f5e" icon={<TrendingDown size={14} />} />
              <FinanceStat label="Net" value={stats.net} color={stats.net >= 0 ? '#6366f1' : '#f43f5e'} icon={<Wallet size={14} />} bold />
            </div>
            {stats.income === 0 && stats.expenses === 0 && (
              <p className="text-xs text-gray-400 mt-3 text-center">No transactions recorded this month.</p>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Upcoming tasks */}
          <div className="bg-white rounded-3xl p-5" style={cardShadow}>
            <SectionHeader
              icon={<Calendar size={16} className="text-orange-500" />}
              title="Upcoming"
              onNavigate={() => onNavigate('tasks')}
            />
            {upcomingTasks.length === 0 ? (
              <EmptyState icon={<Calendar size={28} strokeWidth={1.5} />} text="Nothing scheduled ahead" sub="Add tasks with due dates to see them here." />
            ) : (
              <div className="mt-3 space-y-2">
                {upcomingTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PRIORITY_COLORS[task.priority] }} />
                    <span className="text-sm text-gray-700 flex-1 truncate">{task.title}</span>
                    <span className="text-xs text-gray-400 shrink-0 font-medium">
                      {format(parseISO(task.dueDate!), 'MMM d')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grocery */}
          <div className="bg-white rounded-3xl p-5" style={cardShadow}>
            <SectionHeader
              icon={<ShoppingBag size={16} className="text-pink-500" />}
              title="Grocery"
              count={lists.length}
              countColor="bg-pink-100 text-pink-600"
              onNavigate={() => onNavigate('grocery')}
            />
            {lists.length === 0 ? (
              <EmptyState icon={<ShoppingCart size={28} strokeWidth={1.5} />} text="No grocery lists" sub="Create a list to track your shopping." />
            ) : (
              <div className="mt-3 space-y-3">
                {lists.slice(0, 4).map(list => {
                  const total = list.items.length;
                  const checked = list.items.filter(i => i.checked).length;
                  const pct = total > 0 ? (checked / total) * 100 : 0;
                  return (
                    <div key={list.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 font-medium truncate flex-1">{list.name}</span>
                        <span className="text-xs text-gray-400 shrink-0 ml-2 tabular">{checked}/{total}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #ec4899, #f43f5e)' }} />
                      </div>
                    </div>
                  );
                })}
                {lists.length > 4 && (
                  <p className="text-xs text-gray-400">+{lists.length - 4} more lists</p>
                )}
              </div>
            )}
          </div>
        </div>

        </>}
      </div>
    </div>
  );
}

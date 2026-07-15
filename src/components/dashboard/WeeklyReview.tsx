import { } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isWithinInterval } from 'date-fns';
import { CheckSquare, Flame, DollarSign, Target, BookOpen, TrendingUp, TrendingDown } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useHabits } from '../../hooks/useHabits';
import { useMood } from '../../hooks/useMood';
import { useFinance } from '../../hooks/useFinance';
import { useGoals } from '../../hooks/useGoals';
import { useJournal } from '../../hooks/useJournal';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useCurrency } from '../../hooks/useCurrency';

const MOOD_EMOJIS: Record<number, string> = { 1: '😔', 2: '😕', 3: '😐', 4: '🙂', 5: '😊' };
const MOOD_COLORS: Record<number, string> = { 1: '#ef4444', 2: '#f59e0b', 3: '#6366f1', 4: '#10b981', 5: '#22c55e' };
const cardShadow = { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' };

function SectionCard({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-5" style={cardShadow}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + '18' }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function WeeklyReview() {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weekKey = format(weekStart, 'yyyy-MM-dd');
  const weekLabel = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;

  const { tasks } = useTasks();
  const { habits, logs } = useHabits();
  const { entries: moodEntries } = useMood();
  const { transactions } = useFinance();
  const { goals } = useGoals();
  const { entries: journalEntries } = useJournal();
  const [reflection, setReflection] = useLocalStorage<string>(`lh-review-${weekKey}`, '');
  const { fmt } = useCurrency();

  const isThisWeek = (dateStr: string) => {
    try {
      return isWithinInterval(parseISO(dateStr), { start: weekStart, end: weekEnd });
    } catch { return false; }
  };

  // Tasks
  const weekTasks = tasks.filter(t => t.dueDate && isThisWeek(t.dueDate));
  const completedTasks = weekTasks.filter(t => t.done);

  // Habits
  const totalPossible = habits.length * 7;
  const totalLogged = weekDays.reduce((acc, day) => {
    const d = format(day, 'yyyy-MM-dd');
    return acc + habits.filter(h => logs.some(l => l.habitId === h.id && l.date === d)).length;
  }, 0);
  const habitPct = totalPossible > 0 ? Math.round((totalLogged / totalPossible) * 100) : 0;
  const perfectHabits = habits.filter(h =>
    weekDays.every(day => logs.some(l => l.habitId === h.id && l.date === format(day, 'yyyy-MM-dd')))
  );

  // Mood
  const weekMoods = moodEntries.filter(e => isThisWeek(e.date));
  const avgMood = weekMoods.length > 0
    ? (weekMoods.reduce((s, e) => s + e.mood, 0) / weekMoods.length).toFixed(1)
    : null;

  // Finance
  const weekTx = transactions.filter(t => isThisWeek(t.date));
  const weekIncome = weekTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const weekExpenses = weekTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // Goals
  const activeGoals = goals.filter(g => g.progress < 100);

  // Journal
  const weekJournal = journalEntries.filter(e => isThisWeek(e.date)).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-3xl p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', boxShadow: '0 8px 32px rgba(15,23,42,0.25)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-[0.04]" style={{ background: 'white', transform: 'translate(30%,-30%)' }} />
        <p className="text-indigo-400 text-sm font-medium mb-1">{weekLabel}</p>
        <h2 className="text-2xl font-bold text-white mb-3">Weekly Review</h2>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1 rounded-full font-semibold" style={{ background: 'rgba(99,102,241,0.25)', color: '#a5b4fc' }}>
            {completedTasks.length}/{weekTasks.length} tasks
          </span>
          {avgMood && (
            <span className="px-3 py-1 rounded-full font-semibold" style={{ background: 'rgba(16,185,129,0.2)', color: '#6ee7b7' }}>
              {MOOD_EMOJIS[Math.round(Number(avgMood)) as keyof typeof MOOD_EMOJIS]} avg mood {avgMood}
            </span>
          )}
          {habitPct > 0 && (
            <span className="px-3 py-1 rounded-full font-semibold" style={{ background: 'rgba(251,191,36,0.2)', color: '#fde68a' }}>
              🔥 {habitPct}% habits
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tasks */}
        <SectionCard icon={<CheckSquare size={15} />} title="Tasks" color="#6366f1">
          {weekTasks.length === 0 ? (
            <p className="text-xs text-gray-400">No tasks due this week.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{completedTasks.length} of {weekTasks.length} completed</span>
                <span className="text-xs font-bold" style={{ color: '#6366f1' }}>
                  {Math.round((completedTasks.length / weekTasks.length) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${(completedTasks.length / weekTasks.length) * 100}%`, background: 'linear-gradient(90deg, #6366f1, #a855f7)' }} />
              </div>
              <div className="mt-3 space-y-1">
                {weekTasks.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center gap-2 text-xs">
                    <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${t.done ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
                      {t.done && <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>}
                    </span>
                    <span className={t.done ? 'line-through text-gray-300' : 'text-gray-600'}>{t.title}</span>
                  </div>
                ))}
                {weekTasks.length > 5 && <p className="text-xs text-gray-400">+{weekTasks.length - 5} more</p>}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Habits */}
        <SectionCard icon={<Flame size={15} />} title="Habits" color="#f59e0b">
          {habits.length === 0 ? (
            <p className="text-xs text-gray-400">No habits set up yet.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{totalLogged} of {totalPossible} check-ins</span>
                <span className="text-xs font-bold text-amber-500">{habitPct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${habitPct}%`, background: 'linear-gradient(90deg, #f59e0b, #f97316)' }} />
              </div>
              {/* Day-by-day grid */}
              <div className="grid grid-cols-7 gap-1 mt-2">
                {weekDays.map(day => {
                  const d = format(day, 'yyyy-MM-dd');
                  const count = habits.filter(h => logs.some(l => l.habitId === h.id && l.date === d)).length;
                  const pct = habits.length > 0 ? count / habits.length : 0;
                  return (
                    <div key={d} className="flex flex-col items-center gap-0.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ background: pct === 0 ? '#f1f5f9' : pct < 0.5 ? '#fde68a' : pct < 1 ? '#10b981' : '#6366f1', color: pct === 0 ? '#cbd5e1' : '#fff' }}>
                        {count}
                      </div>
                      <span className="text-[9px] text-gray-400">{format(day, 'E')[0]}</span>
                    </div>
                  );
                })}
              </div>
              {perfectHabits.length > 0 && (
                <p className="text-xs text-amber-600 font-medium">🏆 Perfect week: {perfectHabits.map(h => h.icon + ' ' + h.name).join(', ')}</p>
              )}
            </div>
          )}
        </SectionCard>

        {/* Mood */}
        <SectionCard icon={<span className="text-sm">😊</span>} title="Mood" color="#10b981">
          {weekMoods.length === 0 ? (
            <p className="text-xs text-gray-400">No mood entries this week.</p>
          ) : (
            <div className="space-y-3">
              {avgMood && (
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{MOOD_EMOJIS[Math.round(Number(avgMood)) as keyof typeof MOOD_EMOJIS]}</span>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{avgMood}</p>
                    <p className="text-xs text-gray-400">average this week</p>
                  </div>
                </div>
              )}
              <div className="flex gap-1.5">
                {weekDays.map(day => {
                  const d = format(day, 'yyyy-MM-dd');
                  const entry = weekMoods.find(e => e.date === d);
                  return (
                    <div key={d} className="flex flex-col items-center gap-0.5 flex-1">
                      <div className="w-full h-2 rounded-full" style={{ background: entry ? MOOD_COLORS[entry.mood] : '#f1f5f9' }} />
                      <span className="text-[9px] text-gray-400">{format(day, 'E')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Finance */}
        <SectionCard icon={<DollarSign size={15} />} title="Finance" color="#10b981">
          {weekTx.length === 0 ? (
            <p className="text-xs text-gray-400">No transactions this week.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-3 py-1">
                <TrendingUp size={14} className="text-emerald-500 shrink-0" />
                <span className="text-sm text-gray-600 flex-1">Income</span>
                <span className="text-sm font-semibold text-emerald-600">{fmt(weekIncome)}</span>
              </div>
              <div className="flex items-center gap-3 py-1">
                <TrendingDown size={14} className="text-red-400 shrink-0" />
                <span className="text-sm text-gray-600 flex-1">Expenses</span>
                <span className="text-sm font-semibold text-red-500">{fmt(weekExpenses)}</span>
              </div>
              <div className="h-px bg-gray-100 my-1" />
              <div className="flex items-center gap-3 py-1">
                <span className="text-sm text-gray-600 flex-1 font-semibold">Net</span>
                <span className="text-sm font-bold" style={{ color: weekIncome - weekExpenses >= 0 ? '#6366f1' : '#ef4444' }}>
                  {weekIncome - weekExpenses >= 0 ? '+' : ''}{fmt(weekIncome - weekExpenses)}
                </span>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Goals */}
        {activeGoals.length > 0 && (
          <SectionCard icon={<Target size={15} />} title="Goals" color="#a855f7">
            <div className="space-y-3">
              {activeGoals.slice(0, 4).map(g => (
                <div key={g.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700 truncate flex-1">{g.title}</span>
                    <span className="text-xs font-bold ml-2 shrink-0" style={{ color: g.color }}>{g.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${g.progress}%`, background: g.color }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Journal */}
        {weekJournal.length > 0 && (
          <SectionCard icon={<BookOpen size={15} />} title="Journal" color="#6366f1">
            <div className="space-y-2">
              {weekJournal.slice(0, 3).map(e => (
                <div key={e.id} className="flex gap-3 py-1.5" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <span className="text-lg shrink-0">{MOOD_EMOJIS[e.mood]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 font-medium">{format(parseISO(e.date), 'EEE, MMM d')}</p>
                    <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{e.content || <span className="italic text-gray-300">No content</span>}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>

      {/* Reflection */}
      <div className="bg-white rounded-2xl p-5" style={cardShadow}>
        <h3 className="font-semibold text-gray-800 text-sm mb-1">Weekly reflection</h3>
        <p className="text-xs text-gray-400 mb-3">What went well? What would you do differently?</p>
        <textarea
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          placeholder="Write your thoughts for the week…"
          rows={4}
          className="w-full text-sm text-gray-700 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-300 resize-none leading-relaxed"
        />
      </div>
    </div>
  );
}

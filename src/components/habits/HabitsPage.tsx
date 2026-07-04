import { useState } from 'react';
import { Plus, Flame, Trash2, Check } from 'lucide-react';
import { useHabits } from '../../hooks/useHabits';
import { format, subDays } from 'date-fns';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#ef4444'];
const ICONS  = ['💪', '📚', '🧘', '💧', '🏃', '😴', '🥗', '✍️', '🎯', '🌱', '🎵', '🧹'];

const TODAY = format(new Date(), 'yyyy-MM-dd');
const LAST_7 = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'));

export function HabitsPage() {
  const { habits, addHabit, deleteHabit, toggleLog, isLogged, getStreak } = useHabits();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName]   = useState('');
  const [icon, setIcon]   = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);

  const handleAdd = () => {
    if (!name.trim()) return;
    addHabit(name.trim(), color, icon);
    setName(''); setIcon(ICONS[0]); setColor(COLORS[0]);
    setShowAdd(false);
  };

  const completedToday = habits.filter(h => isLogged(h.id, TODAY)).length;
  const cardShadow = { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' };

  return (
    <div className="flex-1 overflow-y-auto p-6 fade-up">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Habits</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {habits.length === 0
                ? 'Track daily habits and build streaks'
                : `${completedToday} / ${habits.length} done today`}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 text-sm px-4 py-2 text-white rounded-xl font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
            <Plus size={15} strokeWidth={2.5} />
            <span className="hidden sm:inline">Add Habit</span>
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="bg-white rounded-3xl p-5 mb-5" style={{ ...cardShadow, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)' }}>
            <p className="text-sm font-semibold text-gray-700 mb-4">New Habit</p>
            <div className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Read 20 minutes, Drink 8 glasses of water…"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                onKeyDown={e => e.key === 'Enter' && handleAdd()} autoFocus />
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Icon</p>
                <div className="flex flex-wrap gap-1.5">
                  {ICONS.map(ic => (
                    <button key={ic} type="button" onClick={() => setIcon(ic)}
                      className={`w-8 h-8 rounded-lg text-base transition-all ${icon === ic ? 'ring-2 ring-indigo-500 scale-110' : 'hover:scale-105'}`}
                      style={{ background: icon === ic ? color + '20' : '#f8f9fc' }}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Color</p>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-all ${color === c ? 'scale-125 ring-2 ring-offset-2' : 'hover:scale-110'}`}
                      style={{ background: c, outlineColor: c }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowAdd(false)}
                  className="flex-1 py-2 text-sm font-semibold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button onClick={handleAdd} disabled={!name.trim()}
                  className="flex-1 py-2 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {habits.length === 0 && (
          <div className="bg-white rounded-3xl p-16 text-center" style={cardShadow}>
            <div className="text-4xl mb-3">🌱</div>
            <p className="font-semibold text-gray-700">No habits yet</p>
            <p className="text-sm text-gray-400 mt-1">Start small. One habit changes everything.</p>
            <button onClick={() => setShowAdd(true)}
              className="mt-5 text-sm px-5 py-2 text-white rounded-xl font-semibold transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
              Add your first habit
            </button>
          </div>
        )}

        {/* Habit list */}
        {habits.length > 0 && (
          <div className="space-y-2">
            {/* Column header — scrollable on narrow screens */}
            <div className="flex items-center gap-3 px-1 pb-1 overflow-x-auto">
              <div className="flex-1 min-w-[80px]" />
              <div className="flex gap-1 shrink-0">
                {LAST_7.map(d => (
                  <div key={d} className="w-7 text-center text-[10px] font-bold text-gray-300">
                    {format(new Date(d + 'T12:00:00'), 'EEEEE')}
                  </div>
                ))}
              </div>
              <div className="w-12 text-[10px] font-bold text-gray-300 text-center uppercase tracking-wide shrink-0">Streak</div>
              <div className="w-5 shrink-0" />
            </div>

            {habits.map(h => {
              const streak = getStreak(h.id);
              const todayDone = isLogged(h.id, TODAY);
              return (
                <div key={h.id} className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 group overflow-x-auto" style={cardShadow}>
                  {/* Today check-in button */}
                  <button onClick={() => toggleLog(h.id, TODAY)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl transition-all hover:scale-110 active:scale-95"
                    style={todayDone
                      ? { background: h.color, boxShadow: `0 4px 8px ${h.color}40` }
                      : { background: h.color + '15' }}>
                    {todayDone ? <Check size={18} strokeWidth={3} color="white" /> : <span>{h.icon}</span>}
                  </button>

                  {/* Name */}
                  <span className={`text-sm font-semibold flex-1 min-w-[60px] truncate ${todayDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {h.name}
                  </span>

                  {/* Last 7 days mini-history */}
                  <div className="flex gap-1 shrink-0">
                    {LAST_7.map(d => {
                      const logged = isLogged(h.id, d);
                      const isToday_ = d === TODAY;
                      return (
                        <button key={d} onClick={() => toggleLog(h.id, d)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 ${isToday_ ? 'ring-2' : ''}`}
                          style={logged
                            ? { background: h.color, ...(isToday_ ? { ringColor: h.color } : {}) }
                            : { background: '#f1f5f9', ...(isToday_ ? { ringColor: '#d1d5db' } : {}) }}
                          title={d}>
                          {logged && <Check size={10} strokeWidth={3} color="white" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Streak */}
                  <div className="w-12 flex items-center justify-center gap-1 shrink-0">
                    {streak > 0 && <Flame size={12} className="text-orange-400" />}
                    <span className={`text-sm font-bold tabular-nums ${streak >= 7 ? 'text-orange-500' : streak >= 3 ? 'text-amber-500' : 'text-gray-400'}`}>
                      {streak}
                    </span>
                  </div>

                  {/* Delete */}
                  <button onClick={() => deleteHabit(h.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all w-5 shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

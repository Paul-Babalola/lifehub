import { useState } from 'react';
import { useMood } from '../../hooks/useMood';
import type { MoodEntry } from '../../types';
import { format, subDays } from 'date-fns';

const MOOD_EMOJIS: Record<number, string> = { 1: '😔', 2: '😕', 3: '😐', 4: '🙂', 5: '😊' };
const MOOD_COLORS: Record<number, string> = { 1: '#ef4444', 2: '#f59e0b', 3: '#6366f1', 4: '#10b981', 5: '#22c55e' };
const TODAY = format(new Date(), 'yyyy-MM-dd');

const cardShadow = { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' };

export function MoodView() {
  const { entries, saveEntry } = useMood();
  const todayEntry = entries.find(e => e.date === TODAY);

  const [mood, setMood] = useState<MoodEntry['mood']>(todayEntry?.mood ?? 3);
  const [note, setNote] = useState(todayEntry?.note ?? '');

  const handleSave = () => {
    saveEntry(TODAY, mood, note.trim() || undefined);
  };

  const last30 = Array.from({ length: 30 }, (_, i) => {
    const date = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd');
    const entry = entries.find(e => e.date === date);
    return { date, entry };
  });

  const thisWeekEntries = last30.slice(23).map(d => d.entry).filter(Boolean) as MoodEntry[];
  const avgMood = thisWeekEntries.length > 0
    ? (thisWeekEntries.reduce((s, e) => s + e.mood, 0) / thisWeekEntries.length).toFixed(1)
    : null;

  let streak = 0;
  for (let i = 0; i < last30.length; i++) {
    const d = last30[last30.length - 1 - i];
    if (d.entry) streak++;
    else break;
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-5" style={cardShadow}>
        <p className="text-sm font-semibold text-gray-700 mb-4">How are you feeling today?</p>

        <div className="flex gap-3 mb-4">
          {([1, 2, 3, 4, 5] as MoodEntry['mood'][]).map(m => (
            <button key={m} onClick={() => setMood(m)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl text-2xl transition-all hover:scale-105 ${mood === m ? 'scale-105' : 'bg-gray-50'}`}
              style={mood === m ? { background: MOOD_COLORS[m] + '18', outline: `2px solid ${MOOD_COLORS[m]}`, outlineOffset: '2px' } : {}}>
              <span>{MOOD_EMOJIS[m]}</span>
              <span className="text-[10px] font-semibold" style={{ color: mood === m ? MOOD_COLORS[m] : '#94a3b8' }}>{m}</span>
            </button>
          ))}
        </div>

        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a note (optional)"
          className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-400 mb-3"
        />

        <button
          onClick={handleSave}
          className="w-full py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
          {todayEntry ? 'Update' : 'Save mood'}
        </button>
      </div>

      {thisWeekEntries.length > 0 && (
        <div className="bg-white rounded-2xl p-5" style={cardShadow}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">This week</p>
          <div className="flex gap-6">
            {avgMood && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">{MOOD_EMOJIS[Math.round(Number(avgMood)) as MoodEntry['mood']]}</span>
                <div>
                  <p className="text-xs text-gray-400">Avg mood</p>
                  <p className="text-sm font-bold text-gray-800">{avgMood}</p>
                </div>
              </div>
            )}
            {streak > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="text-xs text-gray-400">Day streak</p>
                  <p className="text-sm font-bold text-gray-800">{streak}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-5" style={cardShadow}>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Last 30 days</p>
        <div className="grid grid-cols-6 gap-1.5">
          {last30.map(({ date, entry }) => {
            const dayNum = format(new Date(date + 'T12:00:00'), 'd');
            const isToday = date === TODAY;
            return (
              <div key={date} className="group relative flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${isToday ? 'ring-2 ring-offset-1 ring-indigo-400' : ''}`}
                  style={entry
                    ? { background: MOOD_COLORS[entry.mood], color: '#fff' }
                    : { background: '#f1f5f9', color: '#94a3b8' }}>
                  {dayNum}
                </div>
                {entry && (
                  <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                    <div className="bg-gray-900 text-white text-[10px] rounded-lg px-2 py-1.5 whitespace-nowrap shadow-lg">
                      <span>{MOOD_EMOJIS[entry.mood]} Mood {entry.mood}</span>
                      {entry.note && <span className="block max-w-[140px] truncate opacity-80">{entry.note}</span>}
                    </div>
                    <div className="w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useJournal } from '../../hooks/useJournal';
import type { JournalEntry } from '../../types';
import { format } from 'date-fns';
import { Check } from 'lucide-react';

const MOOD_EMOJIS: Record<number, string> = { 1: '😔', 2: '😕', 3: '😐', 4: '🙂', 5: '😊' };
const TODAY = format(new Date(), 'yyyy-MM-dd');
const cardShadow = { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' };

export function JournalView() {
  const { entries, saveEntry, deleteEntry } = useJournal();
  const todayEntry = entries.find(e => e.date === TODAY);

  const [mood, setMood] = useState<JournalEntry['mood']>(todayEntry?.mood ?? 3);
  const [content, setContent] = useState(todayEntry?.content ?? '');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!content.trim()) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveEntry(TODAY, content.trim(), mood);
      setSaveStatus('saved');
    }, 800);
    return () => clearTimeout(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, mood]);

  const past = [...entries]
    .filter(e => e.date !== TODAY)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-5" style={cardShadow}>
        <p className="text-sm font-semibold text-gray-700 mb-4">
          Today — {format(new Date(), 'MMMM d, yyyy')}
        </p>

        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">How are you feeling?</p>
          <div className="flex gap-2">
            {([1, 2, 3, 4, 5] as JournalEntry['mood'][]).map(m => (
              <button key={m} onClick={() => setMood(m)}
                className={`text-2xl w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 ${mood === m ? 'scale-110 ring-2 ring-indigo-400 ring-offset-1' : 'bg-gray-50'}`}>
                {MOOD_EMOJIS[m]}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="What's on your mind today?"
          rows={5}
          className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-400 resize-none"
        />

        <div className="mt-3 flex items-center justify-end h-6">
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
              <Check size={11} strokeWidth={2.5} /> Saved
            </span>
          )}
        </div>
      </div>

      {past.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Past entries</p>
          <div className="space-y-2">
            {past.map(entry => (
              <div key={entry.id} className="bg-white rounded-2xl overflow-hidden" style={cardShadow}>
                <button
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50/60 transition-colors">
                  <span className="text-sm font-bold text-gray-800 min-w-[90px]">
                    {format(new Date(entry.date + 'T12:00:00'), 'MMM d, yyyy')}
                  </span>
                  <span className="text-lg">{MOOD_EMOJIS[entry.mood]}</span>
                  <span className="text-xs text-gray-400 flex-1 truncate">
                    {entry.content.slice(0, 120)}
                  </span>
                </button>
                {expandedId === entry.id && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="mt-3 text-xs text-red-400 hover:text-red-600 transition-colors">
                      Delete entry
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {past.length === 0 && !todayEntry && (
        <div className="text-center py-8 text-gray-300">
          <p className="text-sm">No past entries yet. Start journaling today!</p>
        </div>
      )}
    </div>
  );
}

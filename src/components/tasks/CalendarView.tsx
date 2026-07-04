import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, isToday,
} from 'date-fns';
import type { Task, Priority } from '../../types';

const PRIORITY_COLORS: Record<Priority, string> = {
  low: '#10b981', medium: '#f59e0b', high: '#ef4444',
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Props {
  tasks: Task[];
  onToggle: (id: string) => void;
}

export function CalendarView({ tasks, onToggle }: Props) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selected, setSelected] = useState<string | null>(format(new Date(), 'yyyy-MM-dd'));

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Monday-first: 0=Sun→6, 1=Mon→0, ...
  const startPad = (getDay(monthStart) + 6) % 7;
  const cells: (Date | null)[] = [...Array(startPad).fill(null), ...days];
  const rem = cells.length % 7;
  if (rem !== 0) for (let i = 0; i < 7 - rem; i++) cells.push(null);

  const taskMap = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      if (!m.has(t.dueDate)) m.set(t.dueDate, []);
      m.get(t.dueDate)!.push(t);
    }
    return m;
  }, [tasks]);

  const selectedTasks = selected ? (taskMap.get(selected) ?? []) : [];

  return (
    <div>
      {/* Month navigator */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setViewDate(d => subMonths(d, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
          <ChevronLeft size={16} />
        </button>
        <span className="font-bold text-gray-900">{format(viewDate, 'MMMM yyyy')}</span>
        <button onClick={() => setViewDate(d => addMonths(d, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[11px] font-semibold text-gray-400 py-1.5">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="bg-white min-h-[72px]" />;
          const ds = format(day, 'yyyy-MM-dd');
          const dayTasks = taskMap.get(ds) ?? [];
          const isSel = selected === ds;
          const isTod = isToday(day);

          return (
            <div key={ds} onClick={() => setSelected(isSel ? null : ds)}
              className={`bg-white min-h-[72px] p-1.5 cursor-pointer transition-colors ${isSel ? 'bg-indigo-50/80' : 'hover:bg-gray-50'}`}>
              <div className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center mb-1 mx-auto
                ${isTod ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 2).map(t => (
                  <div key={t.id}
                    className="text-[9px] leading-tight px-1 py-0.5 rounded truncate font-medium"
                    style={{ background: PRIORITY_COLORS[t.priority] + '22', color: PRIORITY_COLORS[t.priority] }}>
                    {t.title}
                  </div>
                ))}
                {dayTasks.length > 2 && (
                  <div className="text-[9px] text-gray-400 text-center">+{dayTasks.length - 2}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected day task list */}
      {selected && (
        <div className="mt-4 bg-white rounded-2xl p-4"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <p className="text-sm font-bold text-gray-900 mb-3">
            {format(new Date(selected + 'T12:00:00'), 'EEEE, MMMM d')}
          </p>
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-gray-400">No tasks due this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map(t => (
                <div key={t.id} className="flex items-center gap-3">
                  <button onClick={e => { e.stopPropagation(); onToggle(t.id); }}
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                    style={t.done ? { background: '#6366f1', borderColor: '#6366f1' } : { borderColor: '#d1d5db' }}>
                    {t.done && (
                      <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                        <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <span className={`text-sm flex-1 ${t.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{t.title}</span>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PRIORITY_COLORS[t.priority] }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

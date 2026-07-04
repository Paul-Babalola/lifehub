import { ArrowRight } from 'lucide-react';
import type { Task } from '../../types';

const PRIORITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };

const COLS = [
  { id: 'todo',        label: 'To Do',       accent: '#6366f1' },
  { id: 'in-progress', label: 'In Progress',  accent: '#f59e0b' },
  { id: 'done',        label: 'Done',         accent: '#10b981' },
] as const;

type ColId = typeof COLS[number]['id'];

function colOf(t: Task): ColId {
  if (t.done) return 'done';
  if (t.status === 'in-progress') return 'in-progress';
  return 'todo';
}

interface Props {
  tasks: Task[];
  onUpdate: (id: string, updates: Partial<Task>) => void;
}

export function KanbanView({ tasks, onUpdate }: Props) {
  const move = (id: string, to: ColId) => {
    if (to === 'done')             onUpdate(id, { done: true,  status: 'done' });
    else if (to === 'in-progress') onUpdate(id, { done: false, status: 'in-progress' });
    else                           onUpdate(id, { done: false, status: 'todo' });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {COLS.map(col => {
        const colTasks = tasks.filter(t => colOf(t) === col.id);
        return (
          <div key={col.id} className="bg-white rounded-2xl overflow-hidden flex flex-col"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="px-4 py-3 flex items-center gap-2 border-b-2" style={{ borderBottomColor: col.accent }}>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: col.accent }}>{col.label}</span>
              <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{colTasks.length}</span>
            </div>
            <div className="flex-1 p-2 space-y-2 min-h-[140px]">
              {colTasks.length === 0 && (
                <div className="text-xs text-gray-300 text-center py-8">Empty</div>
              )}
              {colTasks.map(t => (
                <div key={t.id} className="p-3 rounded-xl"
                  style={{ background: col.accent + '0d', border: '1px solid ' + col.accent + '20' }}>
                  <div className="flex items-start gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                      style={{ background: PRIORITY_COLORS[t.priority] }} />
                    <p className={`text-xs font-medium flex-1 leading-snug ${t.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {t.title}
                    </p>
                  </div>
                  {t.dueDate && (
                    <p className="text-[10px] text-gray-400 mb-2 pl-3.5">{t.dueDate}</p>
                  )}
                  <div className="flex gap-1 flex-wrap pl-1">
                    {COLS.filter(c => c.id !== col.id).map(target => (
                      <button key={target.id} onClick={() => move(t.id, target.id)}
                        className="flex items-center gap-0.5 text-[10px] font-semibold px-2 py-1 rounded-lg transition-all hover:opacity-80"
                        style={{ background: target.accent + '15', color: target.accent }}>
                        <ArrowRight size={9} /> {target.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

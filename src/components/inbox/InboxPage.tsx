import { useState } from 'react';
import { CheckSquare, FileText, X } from 'lucide-react';
import { useInbox } from '../../hooks/useInbox';
import { format, parseISO } from 'date-fns';

const cardShadow = { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' };

interface Props {
  onConvertToTask: (text: string) => void;
  onConvertToNote: (text: string) => void;
}

export function InboxPage({ onConvertToTask, onConvertToNote }: Props) {
  const { items, removeItem, clearAll } = useInbox();
  const [confirmClear, setConfirmClear] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-y-auto p-6 fade-up">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Inbox</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {items.length === 0 ? 'All clear' : `${items.length} item${items.length !== 1 ? 's' : ''} to process`}
            </p>
          </div>
          {items.length > 0 && (
            !confirmClear
              ? <button onClick={() => setConfirmClear(true)}
                  className="text-xs text-gray-400 hover:text-red-400 transition-colors font-medium">
                  Clear all
                </button>
              : <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Clear all?</span>
                  <button onClick={() => { clearAll(); setConfirmClear(false); }}
                    className="text-xs font-semibold text-red-500 hover:text-red-600">Yes</button>
                  <button onClick={() => setConfirmClear(false)}
                    className="text-xs font-semibold text-gray-400 hover:text-gray-600">No</button>
                </div>
          )}
        </div>

        {items.length === 0 && (
          <div className="bg-white rounded-3xl p-16 text-center" style={cardShadow}>
            <div className="text-4xl mb-3">✨</div>
            <p className="font-semibold text-gray-700">Inbox zero!</p>
            <p className="text-sm text-gray-400 mt-1">
              Press <kbd className="px-1.5 py-0.5 text-xs rounded bg-gray-100 border border-gray-200 font-mono">⌘⇧K</kbd> anywhere to capture a thought.
            </p>
          </div>
        )}

        <div className="space-y-2">
          {items.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl px-4 py-3.5 group"
              style={cardShadow}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex items-start gap-3">
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 font-medium leading-snug">{item.text}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(parseISO(item.createdAt), 'MMM d, h:mm a')}
                  </p>
                </div>

                {/* Actions */}
                <div className={`flex items-center gap-1 shrink-0 transition-all ${hovered === item.id ? 'opacity-100' : 'opacity-0'}`}>
                  <button
                    onClick={() => { onConvertToTask(item.text); removeItem(item.id); }}
                    title="Convert to task"
                    className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                    <CheckSquare size={11} />
                    Task
                  </button>
                  <button
                    onClick={() => { onConvertToNote(item.text); removeItem(item.id); }}
                    title="Convert to note"
                    className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                    <FileText size={11} />
                    Note
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    title="Dismiss"
                    className="p-1.5 text-gray-300 hover:text-red-400 transition-colors">
                    <X size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

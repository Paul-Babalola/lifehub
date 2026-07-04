import { useState, useEffect, useRef } from 'react';
import { Search, CheckSquare, DollarSign, ShoppingCart, FileText, X, ArrowRight } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useFinance } from '../../hooks/useFinance';
import { useGrocery } from '../../hooks/useGrocery';
import { useNotes } from '../../hooks/useNotes';
import type { Page } from '../../types';
import { format } from 'date-fns';

interface SearchResult {
  id: string;
  type: 'task' | 'transaction' | 'grocery' | 'note';
  title: string;
  sub?: string;
  page: Page;
}

function icon(type: SearchResult['type']) {
  if (type === 'task')        return <CheckSquare size={14} className="text-indigo-500" />;
  if (type === 'transaction') return <DollarSign  size={14} className="text-emerald-500" />;
  if (type === 'grocery')     return <ShoppingCart size={14} className="text-pink-500" />;
  return <FileText size={14} className="text-orange-400" />;
}

interface Props {
  onNavigate: (p: Page) => void;
  onClose: () => void;
}

export function SearchOverlay({ onNavigate, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { tasks } = useTasks();
  const { transactions } = useFinance();
  const { lists } = useGrocery();
  const { notes } = useNotes();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results: SearchResult[] = query.trim().length < 1 ? [] : (() => {
    const q = query.toLowerCase();
    const out: SearchResult[] = [];

    tasks
      .filter(t => t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q))
      .slice(0, 4)
      .forEach(t => out.push({
        id: t.id, type: 'task', page: 'tasks',
        title: t.title,
        sub: t.dueDate ? `Due ${format(new Date(t.dueDate), 'MMM d')}` : t.priority,
      }));

    transactions
      .filter(t => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach(t => out.push({
        id: t.id, type: 'transaction', page: 'finance',
        title: t.description || t.category,
        sub: `${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)} · ${t.date}`,
      }));

    lists.forEach(list => {
      if (list.name.toLowerCase().includes(q))
        out.push({ id: list.id, type: 'grocery', page: 'grocery', title: list.name, sub: `${list.items.length} items` });
      list.items
        .filter(i => i.name.toLowerCase().includes(q))
        .slice(0, 2)
        .forEach(i => out.push({ id: i.id, type: 'grocery', page: 'grocery', title: i.name, sub: list.name }));
    });

    notes
      .filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach(n => out.push({ id: n.id, type: 'note', page: 'notes', title: n.title || 'Untitled', sub: n.content.slice(0, 60) }));

    return out.slice(0, 10);
  })();

  useEffect(() => { setSelected(0); }, [query]);

  const go = (idx: number) => {
    const r = results[idx];
    if (r) { onNavigate(r.page); onClose(); }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter')     { e.preventDefault(); go(selected); }
    if (e.key === 'Escape')    { onClose(); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="modal-enter w-full max-w-xl bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search tasks, transactions, grocery, notes…"
            className="flex-1 text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={15} />
            </button>
          )}
          <kbd className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-gray-200 text-gray-400">esc</kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="py-1.5 max-h-80 overflow-y-auto">
            {results.map((r, i) => (
              <button
                key={r.id + r.type}
                onClick={() => go(i)}
                onMouseEnter={() => setSelected(i)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                style={{ background: i === selected ? 'rgba(99,102,241,0.06)' : undefined }}
              >
                <span className="shrink-0">{icon(r.type)}</span>
                <span className="flex-1 min-w-0">
                  <span className="text-sm text-gray-800 font-medium truncate block">{r.title}</span>
                  {r.sub && <span className="text-xs text-gray-400 truncate block">{r.sub}</span>}
                </span>
                {i === selected && <ArrowRight size={13} className="text-indigo-400 shrink-0" />}
              </button>
            ))}
          </div>
        )}

        {query && results.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-400">
            <Search size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No results for "{query}"</p>
          </div>
        )}

        {!query && (
          <div className="px-4 py-5 text-center">
            <p className="text-xs text-gray-400">Type to search across all your data</p>
          </div>
        )}
      </div>
    </div>
  );
}

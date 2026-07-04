import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, Edit2, RefreshCw, Target, ArrowUpRight, ArrowDownRight, Upload, Download, FileJson, FileText, FileSpreadsheet, AlertCircle, CheckCircle2, Sparkles, Share2, Link } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useFinance, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../hooks/useFinance';
import { Modal } from '../shared/Modal';
import type { Transaction } from '../../types';
import { format, subMonths } from 'date-fns';
import { exportFinanceJSON, exportFinanceCSV, exportFinanceText, exportFinanceDOCX, importFinanceJSON, importFinanceCSV, importFinanceText, importFinanceDOCX } from '../../utils/financeIO';
import { suggestCategory } from '../../utils/autoCategory';
import { createShareUrl, copyToClipboard } from '../../utils/shareUtils';
import type { SharePayload } from '../../utils/shareUtils';

const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#84cc16', '#a78bfa'];

const inputCls = 'w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-400';

function TransactionForm({ onSave, initial }: {
  onSave: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
  initial?: Partial<Transaction>;
}) {
  const [type, setType] = useState<'income' | 'expense'>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [manualCategory, setManualCategory] = useState(!!initial?.category);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [date, setDate] = useState(initial?.date ?? format(new Date(), 'yyyy-MM-dd'));
  const [freq, setFreq] = useState(initial?.recurring?.frequency ?? '');
  const [interval, setInterval] = useState(initial?.recurring?.interval ?? 1);

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    if (type === 'expense' && !manualCategory) {
      const s = suggestCategory(val);
      if (s && EXPENSE_CATEGORIES.includes(s)) setCategory(s);
    }
  };

  const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;
    onSave({
      type, amount: parseFloat(amount), category,
      description: description.trim(), date,
      recurring: freq ? { frequency: freq as any, interval } : undefined,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Type toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
        {(['expense', 'income'] as const).map(t => (
          <button key={t} type="button" onClick={() => setType(t)}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
              type === t
                ? t === 'expense'
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'income' ? '↑ Income' : '↓ Expense'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Amount *</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
            <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)}
              className={`${inputCls} pl-7`} placeholder="0.00" required autoFocus />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Category *
          {!manualCategory && category && (
            <span className="ml-1.5 text-[10px] font-normal text-indigo-400 normal-case">auto-detected</span>
          )}
        </label>
        <select value={category} onChange={e => { setCategory(e.target.value); setManualCategory(true); }} className={inputCls} required>
          <option value="">Select category…</option>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Note</label>
        <input value={description} onChange={e => handleDescriptionChange(e.target.value)} className={inputCls} placeholder="Type merchant name to auto-detect category…" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Recurring</label>
        <div className="flex gap-2">
          <select value={freq} onChange={e => setFreq(e.target.value)} className={`${inputCls} flex-1`}>
            <option value="">One-time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          {freq && (
            <input type="number" min={1} value={interval} onChange={e => setInterval(Number(e.target.value))}
              className={`${inputCls} w-16`} />
          )}
        </div>
      </div>

      <button type="submit"
        className="w-full py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
        {initial ? 'Save changes' : 'Add transaction'}
      </button>
    </form>
  );
}

function BudgetSection({ month }: { month: string }) {
  const { budgets, upsertBudget, deleteBudget, copyBudgetsFromMonth, getCategorySpending, generateBudgetsFromHistory } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [limit, setLimit] = useState('');
  const [genMsg, setGenMsg] = useState('');
  const spending = getCategorySpending(month);
  const monthBudgets = budgets.filter(b => b.month === month);
  const prevMonth = format(subMonths(new Date(month + '-01'), 1), 'yyyy-MM');
  const hasPrevBudgets = budgets.some(b => b.month === prevMonth);

  const handleGenerate = () => {
    const result = generateBudgetsFromHistory(month);
    if (result.count === 0) {
      setGenMsg('No new categories to suggest (need 3+ months of data).');
    } else {
      setGenMsg(`Generated ${result.count} budget${result.count > 1 ? 's' : ''}: ${result.categories.join(', ')}.`);
    }
    setTimeout(() => setGenMsg(''), 5000);
  };

  return (
    <div className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
            <Target size={14} className="text-violet-600" strokeWidth={2} />
          </div>
          <span className="font-semibold text-gray-900 text-sm">Budgets</span>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          <button onClick={handleGenerate}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1"
            style={{ background: 'rgba(168,85,247,0.08)', color: '#a855f7' }}>
            <Sparkles size={11} /> Smart
          </button>
          {hasPrevBudgets && monthBudgets.length === 0 && (
            <button onClick={() => copyBudgetsFromMonth(prevMonth, month)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
              style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981' }}>
              Copy last month
            </button>
          )}
          <button onClick={() => setShowForm(!showForm)}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
            style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>
            + Set budget
          </button>
        </div>
      </div>
      {genMsg && (
        <p className="text-xs px-3 py-2 rounded-lg mb-3 font-medium text-purple-700" style={{ background: 'rgba(168,85,247,0.08)' }}>{genMsg}</p>
      )}

      {showForm && (
        <div className="flex gap-2 mb-4 p-3 rounded-2xl" style={{ background: '#f8f9fc' }}>
          <select value={category} onChange={e => setCategory(e.target.value)} className={`${inputCls} flex-1`}>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" value={limit} onChange={e => setLimit(e.target.value)} className={`${inputCls} w-24`} placeholder="$" />
          <button onClick={() => { if (limit) { upsertBudget(category, parseFloat(limit), month); setLimit(''); setShowForm(false); } }}
            className="px-3 py-2 text-white text-sm rounded-xl font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>Save</button>
        </div>
      )}

      {monthBudgets.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No budgets set for this month</p>
      ) : (
        <div className="space-y-4">
          {monthBudgets.map(b => {
            const spent = spending[b.category] ?? 0;
            const pct = Math.min((spent / b.limit) * 100, 100);
            const over = spent > b.limit;
            const barColor = over ? '#ef4444' : pct > 80 ? '#f59e0b' : '#10b981';
            // velocity projection
            const today = new Date();
            const dayOfMonth = today.getDate();
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            const projected = dayOfMonth >= 5 ? (spent / dayOfMonth) * daysInMonth : null;
            const projectedOver = projected !== null && projected > b.limit && !over && pct < 0.8;
            return (
              <div key={b.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">{b.category}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold tabular-nums ${over ? 'text-red-500' : 'text-gray-500'}`}>
                      ${spent.toFixed(0)} / ${b.limit.toFixed(0)}
                    </span>
                    <button onClick={() => deleteBudget(b.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: barColor }} />
                </div>
                {projectedOver && projected !== null && (
                  <p className="text-[10px] text-amber-500 mt-0.5">On pace for ${projected.toFixed(0)} this month</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const GOAL_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#f97316'];

function GoalsSection() {
  const { goals, addGoal, deleteGoal, contributeToGoal } = useFinance();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName]     = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor]   = useState(GOAL_COLORS[0]);
  const [contributeId, setContributeId] = useState<string | null>(null);
  const [contributeAmt, setContributeAmt] = useState('');

  const handleAdd = () => {
    if (!name.trim() || !target) return;
    addGoal({ name: name.trim(), target: parseFloat(target), saved: 0, color, deadline: deadline || undefined });
    setName(''); setTarget(''); setDeadline(''); setColor(GOAL_COLORS[0]);
    setShowAdd(false);
  };

  return (
    <div className="bg-white rounded-3xl p-5 mt-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
            <TrendingUp size={14} className="text-emerald-600" strokeWidth={2} />
          </div>
          <span className="font-semibold text-gray-900 text-sm">Savings Goals</span>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
          style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981' }}>
          + Add goal
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 p-3 rounded-2xl space-y-2" style={{ background: '#f8f9fc' }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Goal name (e.g. Emergency fund)…"
            className={inputCls} autoFocus onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input type="number" min="0" value={target} onChange={e => setTarget(e.target.value)}
                className={`${inputCls} pl-7`} placeholder="Target amount" />
            </div>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className={`${inputCls} w-36`} />
          </div>
          <div className="flex gap-1.5">
            {GOAL_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full transition-all ${color === c ? 'scale-125 ring-2 ring-offset-2' : 'hover:scale-110'}`}
                style={{ background: c }} />
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2 text-xs font-semibold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
            <button onClick={handleAdd} disabled={!name.trim() || !target}
              className="flex-1 py-2 text-xs font-semibold text-white rounded-xl disabled:opacity-50 transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>Create</button>
          </div>
        </div>
      )}

      {goals.length === 0 && !showAdd ? (
        <p className="text-sm text-gray-400 text-center py-4">No savings goals set</p>
      ) : (
        <div className="space-y-4">
          {goals.map(g => {
            const pct = Math.min((g.saved / g.target) * 100, 100);
            const done = g.saved >= g.target;
            return (
              <div key={g.id} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: g.color }} />
                    <span className="text-sm font-medium text-gray-700">{g.name}</span>
                    {done && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">✓ Reached!</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold tabular-nums text-gray-500">
                      ${g.saved.toFixed(0)} / ${g.target.toFixed(0)}
                    </span>
                    <button onClick={() => deleteGoal(g.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden cursor-pointer"
                  onClick={() => !done && setContributeId(contributeId === g.id ? null : g.id)}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: done ? g.color : `linear-gradient(90deg, ${g.color}cc, ${g.color})` }} />
                </div>
                {g.deadline && (
                  <p className="text-[10px] text-gray-400 mt-0.5">Target: {format(new Date(g.deadline), 'MMM d, yyyy')}</p>
                )}
                {contributeId === g.id && (
                  <div className="flex gap-2 mt-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                      <input type="number" min="0" value={contributeAmt} onChange={e => setContributeAmt(e.target.value)}
                        className="w-full text-xs pl-5 pr-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-indigo-400 transition-all"
                        placeholder="Amount to add" autoFocus />
                    </div>
                    <button onClick={() => { if (contributeAmt) { contributeToGoal(g.id, parseFloat(contributeAmt)); setContributeAmt(''); setContributeId(null); } }}
                      className="px-3 py-1 text-xs font-semibold text-white rounded-lg transition-opacity hover:opacity-90"
                      style={{ background: g.color }}>Add</button>
                    <button onClick={() => setContributeId(null)} className="px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200">×</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const CARD_STYLES = [
  { gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', shadow: 'rgba(16,185,129,0.25)', icon: <TrendingUp size={18} strokeWidth={2} />, label: 'Income', arrow: <ArrowUpRight size={14} /> },
  { gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', shadow: 'rgba(244,63,94,0.25)',  icon: <TrendingDown size={18} strokeWidth={2} />, label: 'Expenses', arrow: <ArrowDownRight size={14} /> },
  { gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', shadow: 'rgba(99,102,241,0.25)', icon: <Wallet size={18} strokeWidth={2} />, label: 'Net', arrow: null },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl p-3 shadow-xl border border-gray-100 text-xs">
      <p className="font-semibold text-gray-600 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-semibold text-gray-900">${Number(p.value).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Import / Export modal ───────────────────────────────────────────────────

function FinanceIOModal({ transactions, onImport, onClose }: {
  transactions: Transaction[];
  onImport: (txs: Omit<Transaction, 'id' | 'createdAt'>[]) => void;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [tab, setTab] = useState<'export' | 'import'>('export');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const finish = (result: { transactions: Omit<Transaction, 'id' | 'createdAt'>[]; errors: string[] }) => {
      setImportErrors(result.errors);
      if (result.transactions.length > 0) {
        onImport(result.transactions);
        setImportSuccess(`Imported ${result.transactions.length} transaction${result.transactions.length !== 1 ? 's' : ''} successfully.`);
      } else {
        setImportSuccess(null);
      }
    };

    if (file.name.endsWith('.docx')) {
      const reader = new FileReader();
      reader.onload = async ev => finish(await importFinanceDOCX(ev.target!.result as ArrayBuffer));
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = ev => {
        const raw = ev.target!.result as string;
        if (file.name.endsWith('.json'))     finish(importFinanceJSON(raw));
        else if (file.name.endsWith('.csv')) finish(importFinanceCSV(raw));
        else                                 finish(importFinanceText(raw));
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const btnCls = 'flex items-center gap-2.5 w-full px-4 py-3.5 rounded-2xl text-left transition-all hover:opacity-90 active:scale-[0.98]';

  return (
    <Modal title="Export / Import transactions" onClose={onClose}>
      <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: '#f1f5f9' }}>
        {(['export', 'import'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setImportErrors([]); setImportSuccess(null); }}
            className={`flex-1 py-1.5 text-sm font-semibold rounded-lg capitalize transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
            {t === 'export' ? '↓ Export' : '↑ Import'}
          </button>
        ))}
      </div>

      {tab === 'export' && (
        <div className="space-y-2.5">
          <p className="text-xs text-gray-400 mb-3">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''} will be exported.</p>

          <button onClick={() => exportFinanceJSON(transactions)} className={btnCls} style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff', boxShadow: '0 4px 12px rgba(99,102,241,0.25)' }}>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><FileJson size={16} /></div>
            <div><p className="text-sm font-semibold">Export as JSON</p><p className="text-xs opacity-70">Full fidelity — reimport anytime</p></div>
            <Download size={14} className="ml-auto opacity-70" />
          </button>

          <button onClick={() => exportFinanceCSV(transactions)} className={btnCls} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><FileSpreadsheet size={16} /></div>
            <div><p className="text-sm font-semibold">Export as CSV</p><p className="text-xs opacity-70">Open in Excel, Sheets, Numbers</p></div>
            <Download size={14} className="ml-auto opacity-70" />
          </button>

          <button onClick={() => exportFinanceText(transactions)} className={btnCls} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', boxShadow: '0 4px 12px rgba(245,158,11,0.25)' }}>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><FileText size={16} /></div>
            <div><p className="text-sm font-semibold">Export as plain text</p><p className="text-xs opacity-70">Grouped by month, readable anywhere</p></div>
            <Download size={14} className="ml-auto opacity-70" />
          </button>

          <button onClick={() => exportFinanceDOCX(transactions)} className={btnCls} style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <div><p className="text-sm font-semibold">Export as Word (.docx)</p><p className="text-xs opacity-70">Formatted report grouped by month</p></div>
            <Download size={14} className="ml-auto opacity-70" />
          </button>
        </div>
      )}

      {tab === 'import' && (
        <div className="space-y-4">
          <div className="rounded-2xl p-4 text-xs space-y-1.5" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)' }}>
            <p className="font-semibold text-indigo-700">Accepted formats</p>
            <ul className="text-indigo-600/80 space-y-1">
              <li><span className="font-mono bg-indigo-100 px-1 rounded">.json</span> — previously exported LifeHub finance file</li>
              <li><span className="font-mono bg-indigo-100 px-1 rounded">.csv</span> — columns: Type, Amount, Category, Description, Date</li>
              <li><span className="font-mono bg-indigo-100 px-1 rounded">.txt</span> — one transaction per line: <span className="font-mono">DATE [type] Category: ±$amount</span></li>
              <li><span className="font-mono bg-indigo-100 px-1 rounded">.docx</span> — Word document; text is extracted and parsed like .txt</li>
            </ul>
          </div>

          <button onClick={() => fileRef.current?.click()}
            className="w-full flex flex-col items-center gap-3 py-8 rounded-2xl border-2 border-dashed border-gray-200 hover:border-indigo-400 text-gray-400 hover:text-indigo-500 transition-all cursor-pointer">
            <Upload size={28} strokeWidth={1.5} />
            <div className="text-center">
              <p className="text-sm font-semibold">Click to choose a file</p>
              <p className="text-xs mt-0.5">.json · .csv · .txt · .docx</p>
            </div>
          </button>
          <input ref={fileRef} type="file" accept=".json,.csv,.txt,.docx" className="hidden" onChange={handleFile} />

          {importSuccess && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium text-emerald-700" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              {importSuccess}
            </div>
          )}
          {importErrors.length > 0 && (
            <div className="px-4 py-3 rounded-xl text-xs space-y-1" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <div className="flex items-center gap-1.5 font-semibold text-red-600 mb-1"><AlertCircle size={13} /> {importErrors.length} warning{importErrors.length !== 1 ? 's' : ''}</div>
              {importErrors.map((e, i) => <p key={i} className="text-red-500">{e}</p>)}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ─── FinancePage ──────────────────────────────────────────────────────────────

export function FinancePage() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, generateRecurring, autoCopyBudgets, importTransactions, getMonthlyStats, getCategorySpending } = useFinance();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [showIO, setShowIO] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    generateRecurring();
    autoCopyBudgets();
  }, []);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const stats = getMonthlyStats(month);
  const categorySpending = getCategorySpending(month);

  const pieData = Object.entries(categorySpending).map(([name, value]) => ({ name, value }));
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const m = format(d, 'yyyy-MM');
    const s = getMonthlyStats(m);
    return { month: format(d, 'MMM'), income: s.income, expenses: s.expenses };
  });

  const statValues = [stats.income, stats.expenses, stats.net];
  const monthTransactions = transactions
    .filter(t => t.date.startsWith(month) && (filterType === 'all' || t.type === filterType))
    .sort((a, b) => b.date.localeCompare(a.date));

  const card = 'bg-white rounded-3xl p-5';
  const cardShadow = { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' };

  return (
    <div className="flex-1 overflow-y-auto p-6 fade-up">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Finance</h1>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              className="text-sm text-gray-400 mt-0.5 focus:outline-none cursor-pointer hover:text-gray-600 transition-colors" />
          </div>
          <div className="flex gap-1.5 items-center">
            <button onClick={() => setShowShare(true)} title="Share transactions"
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors">
              <Share2 size={16} strokeWidth={1.75} />
            </button>
            <button onClick={() => setShowIO(true)} title="Export / Import"
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors">
              <Upload size={16} strokeWidth={1.75} />
            </button>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 text-sm px-4 py-2 text-white rounded-xl font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
              <Plus size={15} strokeWidth={2.5} />
              <span className="hidden sm:inline">Transaction</span>
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {CARD_STYLES.map((c, i) => (
            <div key={c.label} className="rounded-3xl p-5 text-white relative overflow-hidden"
              style={{ background: c.gradient, boxShadow: `0 8px 24px ${c.shadow}` }}>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
                style={{ background: 'white', transform: 'translate(30%,-30%)' }} />
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center">{c.icon}</div>
                {c.arrow && <span className="text-white/60 text-xs font-medium flex items-center gap-0.5">{c.arrow}</span>}
              </div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">{c.label}</p>
              <p className="text-2xl font-bold tracking-tight tabular">
                {statValues[i] < 0 ? '-' : ''}${Math.abs(statValues[i]).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Area chart */}
          <div className={`${card}`} style={cardShadow}>
            <div className="flex items-center justify-between mb-5">
              <p className="font-semibold text-gray-900 text-sm tracking-tight">Cash flow</p>
              <span className="text-xs text-gray-400">Last 6 months</span>
            </div>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={last6} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} fill="url(#gIncome)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#gExpense)" dot={false} activeDot={{ r: 4, fill: '#f43f5e' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Donut chart */}
          <div className={`${card}`} style={cardShadow}>
            <div className="flex items-center justify-between mb-5">
              <p className="font-semibold text-gray-900 text-sm tracking-tight">Spending breakdown</p>
              <span className="text-xs text-gray-400">{format(new Date(month + '-01'), 'MMMM')}</span>
            </div>
            {pieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                <Wallet size={36} strokeWidth={1} />
                <p className="text-sm mt-3 text-gray-400">No expenses this month</p>
              </div>
            ) : (
              <div className="flex gap-4 items-center">
                <ResponsiveContainer width="55%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                      paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2 overflow-hidden">
                  {pieData.slice(0, 5).map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-gray-500 truncate flex-1">{d.name}</span>
                      <span className="text-xs font-semibold text-gray-700 tabular">${d.value.toFixed(0)}</span>
                    </div>
                  ))}
                  {pieData.length > 5 && <p className="text-xs text-gray-400">+{pieData.length - 5} more</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transactions + Budgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={`${card} lg:col-span-2`} style={cardShadow}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-gray-900 text-sm tracking-tight">Transactions</p>
              <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: '#f1f5f9' }}>
                {(['all', 'income', 'expense'] as const).map(f => (
                  <button key={f} onClick={() => setFilterType(f)}
                    className={`text-xs px-3 py-1 rounded-md font-medium capitalize transition-all ${filterType === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {monthTransactions.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-gray-300">
                <Wallet size={36} strokeWidth={1} />
                <p className="text-sm mt-3 text-gray-400">No transactions this month</p>
              </div>
            ) : (
              <div className="space-y-1">
                {monthTransactions.map(tx => (
                  <div key={tx.id} className="group flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-gray-50/80 transition-colors cursor-default">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'}`}>
                      {tx.type === 'income' ? <ArrowUpRight size={16} strokeWidth={2} /> : <ArrowDownRight size={16} strokeWidth={2} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-800 truncate">{tx.description || tx.category}</span>
                        {tx.recurring && <RefreshCw size={10} className="text-gray-300 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded-md font-medium text-gray-500">{tx.category}</span>
                        <span>{format(new Date(tx.date), 'MMM d')}</span>
                      </div>
                    </div>
                    <span className={`text-sm font-bold tabular shrink-0 ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {tx.type === 'income' ? '+' : '−'}${tx.amount.toFixed(2)}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditing(tx)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-200 text-gray-400 transition-colors"><Edit2 size={13} /></button>
                      <button onClick={() => deleteTransaction(tx.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <BudgetSection month={month} />
            <GoalsSection />
          </div>
        </div>
      </div>

      {showShare && (
        <Modal title="Share finances" onClose={() => { setShowShare(false); setShareMsg(''); }} size="sm">
          <p className="text-sm text-gray-500 mb-4">
            Share {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} as a link. Recipients can import them into their own LifeHub.
          </p>
          <button
            onClick={async () => {
              const payload: SharePayload = { type: 'finance', version: 1, label: `${transactions.length} transactions from LifeHub`, data: transactions };
              const url = createShareUrl(payload);
              const ok = await copyToClipboard(url);
              setShareMsg(ok ? 'Link copied to clipboard!' : 'Copy failed — share this URL manually: ' + url);
            }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 12px rgba(99,102,241,0.25)' }}>
            <Link size={16} /> Copy shareable link
          </button>
          {shareMsg && (
            <p className={`mt-3 text-xs px-3 py-2 rounded-lg font-medium ${shareMsg.startsWith('Link') ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
              {shareMsg}
            </p>
          )}
        </Modal>
      )}

      {showAdd && (
        <Modal title="New transaction" onClose={() => setShowAdd(false)}>
          <TransactionForm onSave={t => { addTransaction(t); setShowAdd(false); }} />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit transaction" onClose={() => setEditing(null)}>
          <TransactionForm initial={editing} onSave={t => { updateTransaction(editing.id, t); setEditing(null); }} />
        </Modal>
      )}
      {showIO && (
        <FinanceIOModal
          transactions={transactions}
          onImport={importTransactions}
          onClose={() => setShowIO(false)}
        />
      )}
    </div>
  );
}

import { useState } from 'react';
import { Plus, Trash2, Edit2, Bell, CreditCard } from 'lucide-react';
import { useSubscriptions, SUB_CATEGORIES, SUB_COLORS, toMonthly } from '../../hooks/useSubscriptions';
import type { Subscription } from '../../types';
import { format, parseISO, differenceInDays } from 'date-fns';
import { useCurrency } from '../../hooks/useCurrency';

const inputCls = 'w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all';
const cardShadow = { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' };

const BLANK: Omit<Subscription, 'id' | 'createdAt'> = {
  name: '', amount: 0, cycle: 'monthly', category: 'Other',
  nextRenewal: format(new Date(), 'yyyy-MM-dd'), color: SUB_COLORS[0], active: true,
};

function daysUntil(dateStr: string) {
  return differenceInDays(parseISO(dateStr), new Date());
}

export function SubscriptionsView() {
  const { subs, addSub, updateSub, deleteSub, totalMonthly, renewingSoon } = useSubscriptions();
  const { fmt } = useCurrency();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [form, setForm] = useState(BLANK);

  const openAdd = () => { setForm(BLANK); setEditing(null); setShowForm(true); };
  const openEdit = (s: Subscription) => {
    setForm({ name: s.name, amount: s.amount, cycle: s.cycle, category: s.category, nextRenewal: s.nextRenewal, color: s.color, active: s.active });
    setEditing(s);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || form.amount <= 0) return;
    if (editing) updateSub(editing.id, form);
    else addSub(form);
    setShowForm(false);
  };

  const activeSubs = subs.filter(s => s.active);
  const totalYearly = totalMonthly * 12;

  return (
    <div className="space-y-5">
      {/* Renewal alerts */}
      {renewingSoon.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Bell size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Renewals coming up</p>
            <p className="text-xs text-amber-600 mt-0.5">
              {renewingSoon.map(s => `${s.name} in ${daysUntil(s.nextRenewal)} day${daysUntil(s.nextRenewal) !== 1 ? 's' : ''}`).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Monthly cost', value: fmt(totalMonthly), sub: `${activeSubs.length} active` },
          { label: 'Yearly cost',  value: fmt(totalYearly),  sub: 'projected' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-4" style={cardShadow}>
            <p className="text-xs text-gray-400 font-medium">{c.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{c.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-600">All subscriptions</p>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 text-white rounded-xl font-semibold transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 12px rgba(99,102,241,0.25)' }}>
          <Plus size={14} strokeWidth={2.5} />
          Add
        </button>
      </div>

      {/* List */}
      {subs.length === 0 && (
        <div className="bg-white rounded-3xl p-14 text-center" style={cardShadow}>
          <div className="text-4xl mb-3">💳</div>
          <p className="font-semibold text-gray-700">No subscriptions yet</p>
          <p className="text-sm text-gray-400 mt-1">Track your recurring bills in one place.</p>
          <button onClick={openAdd}
            className="mt-4 text-sm px-5 py-2 text-white rounded-xl font-semibold hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
            Add subscription
          </button>
        </div>
      )}

      <div className="space-y-2">
        {subs.map(s => {
          const days = daysUntil(s.nextRenewal);
          const soonRenew = days >= 0 && days <= 7;
          return (
            <div key={s.id} className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 group" style={cardShadow}>
              {/* Color dot + icon */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white"
                style={{ background: s.color }}>
                <CreditCard size={16} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold truncate ${s.active ? 'text-gray-900' : 'text-gray-400'}`}>{s.name}</p>
                  {soonRenew && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded-full shrink-0">Soon</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {s.category} · renews {format(parseISO(s.nextRenewal), 'MMM d')}
                </p>
              </div>

              {/* Amount */}
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-gray-900">{fmt(s.amount)}</p>
                <p className="text-xs text-gray-400">{s.cycle === 'yearly' ? '/yr' : s.cycle === 'weekly' ? '/wk' : '/mo'}</p>
              </div>

              {/* Monthly equiv */}
              {s.cycle !== 'monthly' && (
                <div className="text-right shrink-0 w-16">
                  <p className="text-xs text-gray-400">{fmt(toMonthly(s.amount, s.cycle))}</p>
                  <p className="text-[10px] text-gray-300">/mo</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                <button onClick={() => openEdit(s)} className="p-1.5 text-gray-300 hover:text-indigo-500 transition-colors">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => deleteSub(s.id)} className="p-1.5 text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full" style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <h2 className="text-base font-bold text-gray-900 mb-5">{editing ? 'Edit subscription' : 'Add subscription'}</h2>

            <div className="space-y-3">
              <input className={inputCls} placeholder="Name (e.g. Netflix)" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">Amount</label>
                  <input className={inputCls} type="number" min="0" step="0.01" placeholder="0.00"
                    value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">Billing</label>
                  <select className={inputCls} value={form.cycle}
                    onChange={e => setForm(f => ({ ...f, cycle: e.target.value as Subscription['cycle'] }))}>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">Category</label>
                  <select className={inputCls} value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {SUB_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">Next renewal</label>
                  <input className={inputCls} type="date" value={form.nextRenewal}
                    onChange={e => setForm(f => ({ ...f, nextRenewal: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {SUB_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'scale-125 ring-2 ring-offset-2' : 'hover:scale-110'}`}
                      style={{ background: c, outlineColor: c }} />
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  className="w-4 h-4 rounded accent-indigo-500" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={!form.name.trim() || form.amount <= 0}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                {editing ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

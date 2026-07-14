import { useState } from 'react';
import { Plus, Trash2, Target } from 'lucide-react';
import { useGoals } from '../../hooks/useGoals';
import type { Goal } from '../../types';
import { nanoid } from '../../utils/nanoid';
import { format, parseISO } from 'date-fns';

const GOAL_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#14b8a6'];
const CATEGORIES: Goal['category'][] = ['health', 'finance', 'personal', 'career', 'learning', 'other'];

const cardShadow = { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' };
const inputCls = 'w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-400';

function GoalCard({ goal, onUpdate, onDelete, onToggleMilestone }: {
  goal: Goal;
  onUpdate: (updates: Partial<Goal>) => void;
  onDelete: () => void;
  onToggleMilestone: (milestoneId: string) => void;
}) {
  const [newMilestone, setNewMilestone] = useState('');
  const [showMilestoneInput, setShowMilestoneInput] = useState(false);

  const addMilestone = () => {
    if (!newMilestone.trim()) return;
    const milestones = [...goal.milestones, { id: nanoid(), text: newMilestone.trim(), done: false }];
    const progress = Math.round((milestones.filter(m => m.done).length / milestones.length) * 100);
    onUpdate({ milestones, progress });
    setNewMilestone('');
    setShowMilestoneInput(false);
  };

  return (
    <div className="bg-white rounded-2xl p-4 relative" style={{ ...cardShadow, borderLeft: `4px solid ${goal.color}` }}>
      <button onClick={onDelete} className="absolute top-3 right-3 text-gray-300 hover:text-red-400 transition-colors">
        <Trash2 size={13} />
      </button>

      <div className="pr-6">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className="text-sm font-bold text-gray-900">{goal.title}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
            style={{ background: goal.color + '18', color: goal.color }}>
            {goal.category}
          </span>
        </div>
        {goal.description && <p className="text-xs text-gray-400 mb-2">{goal.description}</p>}
        {goal.targetDate && (
          <p className="text-xs text-gray-400 mb-2">
            Target: {format(parseISO(goal.targetDate), 'MMM d, yyyy')}
          </p>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500 font-medium">{goal.progress}% complete</span>
        </div>
        {goal.milestones.length > 0 ? (
          <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${goal.progress}%`, background: '#6366f1' }} />
          </div>
        ) : (
          <input
            type="range" min={0} max={100} value={goal.progress}
            onChange={e => onUpdate({ progress: Number(e.target.value) })}
            className="w-full accent-indigo-500"
          />
        )}
      </div>

      {goal.milestones.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {goal.milestones.map(m => (
            <div key={m.id} className="flex items-center gap-2">
              <button
                onClick={() => onToggleMilestone(m.id)}
                className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                style={m.done ? { background: '#6366f1', borderColor: '#6366f1' } : { borderColor: '#d1d5db' }}>
                {m.done && (
                  <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth={2.5} className="w-2.5 h-2.5">
                    <polyline points="2 6 5 9 10 3" />
                  </svg>
                )}
              </button>
              <span className={`text-xs flex-1 ${m.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{m.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3">
        {showMilestoneInput ? (
          <div className="flex gap-1.5">
            <input
              value={newMilestone}
              onChange={e => setNewMilestone(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addMilestone(); if (e.key === 'Escape') setShowMilestoneInput(false); }}
              placeholder="Milestone text…"
              className="flex-1 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 bg-gray-50/50 placeholder:text-gray-300"
              autoFocus
            />
            <button onClick={addMilestone} className="text-xs px-2.5 py-1.5 rounded-lg text-white font-semibold"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
              Add
            </button>
            <button onClick={() => setShowMilestoneInput(false)} className="text-xs px-2 py-1.5 rounded-lg text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
        ) : (
          <button onClick={() => setShowMilestoneInput(true)} className="text-xs text-indigo-400 hover:text-indigo-600 transition-colors font-medium">
            + milestone
          </button>
        )}
      </div>
    </div>
  );
}

export function GoalsView() {
  const { goals, addGoal, updateGoal, deleteGoal, toggleMilestone } = useGoals();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Goal['category']>('personal');
  const [color, setColor] = useState(GOAL_COLORS[0]);
  const [targetDate, setTargetDate] = useState('');

  const handleAdd = () => {
    if (!title.trim()) return;
    addGoal({ title: title.trim(), description: description.trim() || undefined, category, color, targetDate: targetDate || undefined, progress: 0, milestones: [] });
    setTitle(''); setDescription(''); setCategory('personal'); setColor(GOAL_COLORS[0]); setTargetDate('');
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm text-gray-400">{goals.length} goal{goals.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 text-white rounded-xl font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
          <Plus size={15} strokeWidth={2.5} />
          <span>Add Goal</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-5 mb-5" style={cardShadow}>
          <div className="space-y-3">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Goal title *" className={inputCls} autoFocus />
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" className={inputCls} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value as Goal['category'])} className={inputCls}>
                  {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Target date</label>
                <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Color</label>
              <div className="flex gap-2">
                {GOAL_COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className="w-6 h-6 rounded-full transition-all"
                    style={color === c
                      ? { background: c, boxShadow: `0 0 0 3px white, 0 0 0 5px ${c}`, transform: 'scale(1.1)' }
                      : { background: c }} />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2 text-sm font-semibold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleAdd} disabled={!title.trim()}
                className="flex-1 py-2 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                Add Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {goals.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center" style={cardShadow}>
          <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))' }}>
            <Target size={24} className="text-indigo-400" strokeWidth={1.5} />
          </div>
          <p className="font-semibold text-gray-700">Set your first goal</p>
          <p className="text-sm text-gray-400 mt-1">Break big ambitions into milestones and track your progress.</p>
          <button onClick={() => setShowForm(true)}
            className="mt-5 text-sm px-5 py-2 text-white rounded-xl font-semibold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
            Create a goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(g => (
            <GoalCard
              key={g.id}
              goal={g}
              onUpdate={updates => updateGoal(g.id, updates)}
              onDelete={() => deleteGoal(g.id)}
              onToggleMilestone={mid => toggleMilestone(g.id, mid)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

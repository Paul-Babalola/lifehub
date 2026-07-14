import { useState, useRef } from 'react';
import { Plus, ChevronDown, ChevronRight, Trash2, Edit2, Check, Calendar, RefreshCw, FolderOpen, Upload, Download, FileJson, FileText, FileSpreadsheet, AlertCircle, CheckCircle2, List, Columns3, Share2, Link, Target } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { Modal } from '../shared/Modal';
import type { Task, Priority, Project } from '../../types';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { exportJSON, exportCSV, exportText, exportDOCX, importJSON, importCSV, importText, importDOCX } from '../../utils/taskIO';
import { CalendarView } from './CalendarView';
import { KanbanView } from './KanbanView';
import { GoalsView } from './GoalsView';
import { createShareUrl, copyToClipboard } from '../../utils/shareUtils';
import type { SharePayload } from '../../utils/shareUtils';

type TaskView = 'list' | 'calendar' | 'kanban' | 'goals';

const PRIORITY_COLORS: Record<Priority, string> = {
  low: '#10b981', medium: '#f59e0b', high: '#ef4444',
};
const PRIORITY_BG: Record<Priority, string> = {
  low: 'rgba(16,185,129,0.1)', medium: 'rgba(245,158,11,0.1)', high: 'rgba(239,68,68,0.1)',
};

const PROJECT_COLORS = ['#6366f1','#f59e0b','#10b981','#ec4899','#8b5cf6','#14b8a6','#f97316'];

const inputCls = 'w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-400';

function TaskForm({ onSave, initial, projects }: {
  onSave: (t: Omit<Task, 'id' | 'createdAt'>) => void;
  initial?: Partial<Task>;
  projects: Project[];
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '');
  const [projectId, setProjectId] = useState(initial?.projectId ?? '');
  const [freq, setFreq] = useState(initial?.recurring?.frequency ?? '');
  const [interval, setInterval] = useState(initial?.recurring?.interval ?? 1);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(), description: description.trim() || undefined,
      done: initial?.done ?? false, priority,
      dueDate: dueDate || undefined, projectId: projectId || undefined,
      subtasks: initial?.subtasks ?? [],
      recurring: freq ? { frequency: freq as any, interval } : undefined,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Title *</label>
        <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="What needs to be done?" autoFocus required />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} className={inputCls} rows={2} placeholder="Add notes…" />
      </div>

      {/* Priority pills */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Priority</label>
        <div className="flex gap-2">
          {(['low', 'medium', 'high'] as Priority[]).map(p => (
            <button key={p} type="button" onClick={() => setPriority(p)}
              className="flex-1 py-2 text-xs font-semibold rounded-xl capitalize transition-all"
              style={priority === p
                ? { background: PRIORITY_COLORS[p], color: '#fff', boxShadow: `0 4px 8px ${PRIORITY_COLORS[p]}40` }
                : { background: PRIORITY_BG[p], color: PRIORITY_COLORS[p] }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Due date</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Project</label>
          <select value={projectId} onChange={e => setProjectId(e.target.value)} className={inputCls}>
            <option value="">No project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Recurring</label>
        <div className="flex gap-2">
          <select value={freq} onChange={e => setFreq(e.target.value)} className={`${inputCls} flex-1`}>
            <option value="">Not recurring</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          {freq && <input type="number" min={1} value={interval} onChange={e => setInterval(Number(e.target.value))} className={`${inputCls} w-16`} />}
        </div>
      </div>

      <button type="submit"
        className="w-full py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
        {initial ? 'Save changes' : 'Add task'}
      </button>
    </form>
  );
}

function TaskItem({ task, projects, onToggle, onUpdate, onDelete, onAddSubtask, onToggleSubtask, onDeleteSubtask }: {
  task: Task; projects: Project[];
  onToggle: () => void; onUpdate: (u: Partial<Task>) => void; onDelete: () => void;
  onAddSubtask: (t: string) => void; onToggleSubtask: (id: string) => void; onDeleteSubtask: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newSub, setNewSub] = useState('');

  const project = projects.find(p => p.id === task.projectId);

  const due = (() => {
    if (!task.dueDate) return null;
    const d = new Date(task.dueDate);
    if (isToday(d)) return { text: 'Today', color: '#f97316' };
    if (isTomorrow(d)) return { text: 'Tomorrow', color: '#f59e0b' };
    if (isPast(d)) return { text: format(d, 'MMM d'), color: '#ef4444' };
    return { text: format(d, 'MMM d'), color: '#94a3b8' };
  })();

  const completedSubs = task.subtasks.filter(s => s.done).length;

  return (
    <>
      <div className={`group flex items-start gap-3 px-4 py-3.5 rounded-2xl transition-all hover:bg-gray-50/80 ${task.done ? 'opacity-50' : ''}`}>
        {/* Checkbox */}
        <button onClick={onToggle}
          className="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
          style={task.done
            ? { background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none', boxShadow: '0 2px 6px rgba(99,102,241,0.35)' }
            : { borderColor: '#d1d5db' }}>
          {task.done && <Check size={11} className="text-white" strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${task.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</span>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PRIORITY_COLORS[task.priority] }} title={task.priority} />
            {project && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: project.color + '18', color: project.color }}>{project.name}</span>
            )}
            {task.recurring && <RefreshCw size={11} className="text-gray-300 shrink-0" />}
          </div>
          {task.description && <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>}

          <div className="flex items-center gap-3 mt-1.5">
            {due && (
              <span className="flex items-center gap-1 text-xs font-medium" style={{ color: due.color }}>
                <Calendar size={11} /> {due.text}
              </span>
            )}
            {task.subtasks.length > 0 && (
              <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                {completedSubs}/{task.subtasks.length}
              </button>
            )}
          </div>

          {expanded && (
            <div className="mt-2 pl-3 border-l-2 border-gray-100 space-y-1.5">
              {task.subtasks.map(s => (
                <div key={s.id} className="flex items-center gap-2 group/sub">
                  <button onClick={() => onToggleSubtask(s.id)}
                    className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                    style={s.done ? { background: '#6366f1', borderColor: '#6366f1' } : { borderColor: '#d1d5db' }}>
                    {s.done && <Check size={9} className="text-white" strokeWidth={3} />}
                  </button>
                  <span className={`text-xs flex-1 ${s.done ? 'line-through text-gray-400' : 'text-gray-600'}`}>{s.title}</span>
                  <button onClick={() => onDeleteSubtask(s.id)} className="opacity-0 group-hover/sub:opacity-100 text-gray-300 hover:text-red-400 transition-all"><Trash2 size={11} /></button>
                </div>
              ))}
              <input
                value={newSub}
                onChange={e => setNewSub(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newSub.trim()) { onAddSubtask(newSub.trim()); setNewSub(''); } }}
                placeholder="Add subtask…"
                className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 mt-1 bg-transparent placeholder:text-gray-300"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => setExpanded(!expanded)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-200 text-gray-400 transition-colors">
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
          <button onClick={() => setEditing(true)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-200 text-gray-400 transition-colors"><Edit2 size={13} /></button>
          <button onClick={onDelete} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
        </div>
      </div>

      {editing && (
        <Modal title="Edit task" onClose={() => setEditing(false)}>
          <TaskForm projects={projects} initial={task} onSave={u => { onUpdate(u); setEditing(false); }} />
        </Modal>
      )}
    </>
  );
}

// ─── Import / Export modal ───────────────────────────────────────────────────

function ImportExportModal({ tasks, projects, onImport, onClose }: {
  tasks: Task[];
  projects: Project[];
  onImport: (tasks: Omit<Task, 'id' | 'createdAt'>[]) => void;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [tab, setTab] = useState<'export' | 'import'>('export');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const finish = (result: { tasks: Omit<Task, 'id' | 'createdAt'>[]; errors: string[] }) => {
      setImportErrors(result.errors);
      if (result.tasks.length > 0) {
        onImport(result.tasks);
        setImportSuccess(`Imported ${result.tasks.length} task${result.tasks.length > 1 ? 's' : ''} successfully.`);
      } else {
        setImportSuccess(null);
      }
    };

    if (file.name.endsWith('.docx')) {
      const reader = new FileReader();
      reader.onload = async ev => finish(await importDOCX(ev.target!.result as ArrayBuffer));
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = ev => {
        const raw = ev.target!.result as string;
        if (file.name.endsWith('.json'))      finish(importJSON(raw));
        else if (file.name.endsWith('.csv'))  finish(importCSV(raw));
        else                                  finish(importText(raw));
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const btnCls = 'flex items-center gap-2.5 w-full px-4 py-3.5 rounded-2xl text-left transition-all hover:opacity-90 active:scale-[0.98]';

  return (
    <Modal title="Export / Import tasks" onClose={onClose}>
      {/* Tabs */}
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
          <p className="text-xs text-gray-400 mb-3">{tasks.length} task{tasks.length !== 1 ? 's' : ''} will be exported.</p>

          <button onClick={() => exportJSON(tasks)} className={btnCls} style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff', boxShadow: '0 4px 12px rgba(99,102,241,0.25)' }}>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><FileJson size={16} /></div>
            <div>
              <p className="text-sm font-semibold">Export as JSON</p>
              <p className="text-xs opacity-70">Full fidelity — reimport anytime</p>
            </div>
            <Download size={14} className="ml-auto opacity-70" />
          </button>

          <button onClick={() => exportCSV(tasks, projects)} className={btnCls} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><FileSpreadsheet size={16} /></div>
            <div>
              <p className="text-sm font-semibold">Export as CSV</p>
              <p className="text-xs opacity-70">Open in Excel, Sheets, Numbers</p>
            </div>
            <Download size={14} className="ml-auto opacity-70" />
          </button>

          <button onClick={() => exportText(tasks)} className={btnCls} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', boxShadow: '0 4px 12px rgba(245,158,11,0.25)' }}>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><FileText size={16} /></div>
            <div>
              <p className="text-sm font-semibold">Export as plain text</p>
              <p className="text-xs opacity-70">Active tasks as a checklist</p>
            </div>
            <Download size={14} className="ml-auto opacity-70" />
          </button>

          <button onClick={() => exportDOCX(tasks, projects)} className={btnCls} style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <div>
              <p className="text-sm font-semibold">Export as Word (.docx)</p>
              <p className="text-xs opacity-70">Formatted document with sections</p>
            </div>
            <Download size={14} className="ml-auto opacity-70" />
          </button>
        </div>
      )}

      {tab === 'import' && (
        <div className="space-y-4">
          <div className="rounded-2xl p-4 text-xs space-y-1.5" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)' }}>
            <p className="font-semibold text-indigo-700">Accepted formats</p>
            <ul className="text-indigo-600/80 space-y-1">
              <li><span className="font-mono bg-indigo-100 px-1 rounded">.json</span> — previously exported LifeHub file</li>
              <li><span className="font-mono bg-indigo-100 px-1 rounded">.csv</span> — columns: Title, Priority, Due Date, Status, Description, Subtasks</li>
              <li><span className="font-mono bg-indigo-100 px-1 rounded">.txt</span> — one task per line; use <span className="font-mono">!!!</span> for high, <span className="font-mono">!!</span> medium priority</li>
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
              <div className="flex items-center gap-1.5 font-semibold text-red-600 mb-1"><AlertCircle size={13} /> {importErrors.length} warning{importErrors.length > 1 ? 's' : ''}</div>
              {importErrors.map((e, i) => <p key={i} className="text-red-500">{e}</p>)}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ─── TasksPage ────────────────────────────────────────────────────────────────

export function TasksPage() {
  const { tasks, projects, addTask, updateTask, deleteTask, toggleTask, addSubtask, toggleSubtask, deleteSubtask, addProject, deleteProject } = useTasks();
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showIO, setShowIO] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const [view, setView] = useState<TaskView>('list');
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'done'>('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0]);
  const [search, setSearch] = useState('');

  const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

  const filtered = tasks
    .filter(t => {
      if (filterProject !== 'all' && t.projectId !== filterProject) return false;
      if (filterStatus === 'active' && t.done) return false;
      if (filterStatus === 'done' && !t.done) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      // Done tasks always sink to the bottom
      if (a.done !== b.done) return a.done ? 1 : -1;
      // Sort by due date ascending; tasks with no due date go last
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      if (aDate !== bDate) return aDate - bDate;
      // Tiebreak by priority
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    });

  const remaining = tasks.filter(t => !t.done).length;
  const cardShadow = { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' };
  const selectCls = 'text-xs px-3 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-indigo-400 text-gray-600';

  return (
    <div className="flex-1 overflow-y-auto p-6 fade-up">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tasks</h1>
            <p className="text-sm text-gray-400 mt-0.5">{remaining} task{remaining !== 1 ? 's' : ''} remaining</p>
          </div>
          <div className="flex gap-1.5 items-center">
            {/* View toggle */}
            <div className="flex gap-0.5 p-0.5 rounded-xl border border-gray-200 bg-white">
              {([['list', <List size={14} />], ['calendar', <Calendar size={14} />], ['kanban', <Columns3 size={14} />], ['goals', <Target size={14} />]] as [TaskView, React.ReactNode][]).map(([v, icon]) => (
                <button key={v} onClick={() => setView(v)}
                  className={`p-1.5 rounded-lg transition-all ${view === v ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  title={v.charAt(0).toUpperCase() + v.slice(1) + ' view'}>
                  {icon}
                </button>
              ))}
            </div>
            <button onClick={() => setShowAddProject(true)} title="New project"
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors">
              <FolderOpen size={16} strokeWidth={1.75} />
            </button>
            <button onClick={() => setShowIO(true)} title="Export / Import"
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors">
              <Upload size={16} strokeWidth={1.75} />
            </button>
            <button onClick={() => setShowShare(true)} title="Share tasks"
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors">
              <Share2 size={16} strokeWidth={1.75} />
            </button>
            <button onClick={() => setShowAddTask(true)}
              className="flex items-center gap-1.5 text-sm px-4 py-2 text-white rounded-xl font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
              <Plus size={15} strokeWidth={2.5} />
              <span className="hidden sm:inline">Task</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              className="text-xs pl-3 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 w-36 bg-white" />
          </div>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className={selectCls}>
            <option value="all">All projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="flex gap-1 p-0.5 rounded-lg border border-gray-200 bg-white">
            {(['all', 'active', 'done'] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium capitalize transition-all ${filterStatus === s ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                {s}
              </button>
            ))}
          </div>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className={selectCls}>
            <option value="all">All priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Projects chips */}
        {projects.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {projects.map(p => (
              <div key={p.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: p.color + '15', color: p.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                {p.name}
                <span className="text-gray-400 font-normal">({tasks.filter(t => t.projectId === p.id).length})</span>
                <button onClick={() => deleteProject(p.id)} className="hover:text-red-500 transition-colors ml-0.5 text-current opacity-50 hover:opacity-100">×</button>
              </div>
            ))}
          </div>
        )}

        {/* Calendar view */}
        {view === 'calendar' && (
          <div className="bg-white rounded-3xl p-5" style={cardShadow}>
            <CalendarView tasks={filtered} onToggle={id => toggleTask(id)} />
          </div>
        )}

        {/* Kanban view */}
        {view === 'kanban' && (
          <KanbanView tasks={filtered} onUpdate={(id, upd) => updateTask(id, upd)} />
        )}

        {/* Goals view */}
        {view === 'goals' && <GoalsView />}

        {/* List view */}
        {view === 'list' && (
          <div className="bg-white rounded-3xl overflow-hidden" style={cardShadow}>
            {filtered.length === 0 ? (
              <div className="p-14 text-center text-gray-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-12 h-12 mx-auto mb-3">
                  <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
                <p className="font-medium text-gray-400">No tasks found</p>
                <p className="text-sm mt-1 text-gray-300">Add a task to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50/80">
                {filtered.map(task => (
                  <TaskItem key={task.id} task={task} projects={projects}
                    onToggle={() => toggleTask(task.id)}
                    onUpdate={u => updateTask(task.id, u)}
                    onDelete={() => deleteTask(task.id)}
                    onAddSubtask={t => addSubtask(task.id, t)}
                    onToggleSubtask={sid => toggleSubtask(task.id, sid)}
                    onDeleteSubtask={sid => deleteSubtask(task.id, sid)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showIO && (
        <ImportExportModal
          tasks={tasks}
          projects={projects}
          onImport={imported => imported.forEach(t => addTask(t))}
          onClose={() => setShowIO(false)}
        />
      )}

      {showShare && (
        <Modal title="Share tasks" onClose={() => { setShowShare(false); setShareMsg(''); }} size="sm">
          <p className="text-sm text-gray-500 mb-4">
            Share {filtered.length} task{filtered.length !== 1 ? 's' : ''} (current view) as a link. Recipients can import them into their own LifeHub.
          </p>
          <button
            onClick={async () => {
              const payload: SharePayload = { type: 'tasks', version: 1, label: `${filtered.length} tasks from LifeHub`, data: filtered };
              const url = createShareUrl(payload);
              const ok = await copyToClipboard(url);
              setShareMsg(ok ? 'Link copied to clipboard!' : 'Failed to copy. Try selecting and copying manually: ' + url);
            }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 12px rgba(99,102,241,0.25)' }}>
            <Link size={16} /> Copy shareable link
          </button>
          {shareMsg && (
            <p className={`mt-3 text-xs px-3 py-2 rounded-lg ${shareMsg.startsWith('Link') ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
              {shareMsg}
            </p>
          )}
        </Modal>
      )}

      {showAddTask && (
        <Modal title="New task" onClose={() => setShowAddTask(false)}>
          <TaskForm projects={projects} onSave={t => { addTask(t); setShowAddTask(false); }} />
        </Modal>
      )}

      {showAddProject && (
        <Modal title="New project" onClose={() => setShowAddProject(false)} size="sm">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Name</label>
              <input value={newProjectName} onChange={e => setNewProjectName(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                placeholder="Project name" autoFocus />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Color</label>
              <div className="flex gap-2.5 flex-wrap">
                {PROJECT_COLORS.map(c => (
                  <button key={c} onClick={() => setNewProjectColor(c)}
                    className="w-7 h-7 rounded-full transition-all"
                    style={newProjectColor === c
                      ? { background: c, boxShadow: `0 0 0 3px white, 0 0 0 5px ${c}`, transform: 'scale(1.1)' }
                      : { background: c }} />
                ))}
              </div>
            </div>
            <button
              onClick={() => { if (newProjectName.trim()) { addProject(newProjectName.trim(), newProjectColor); setNewProjectName(''); setShowAddProject(false); } }}
              className="w-full py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
              Create project
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

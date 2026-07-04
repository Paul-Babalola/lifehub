import { useState, useRef } from 'react';
import { Plus, Trash2, Check, ShoppingCart, Edit2, X, UtensilsCrossed, Upload, Download, FileJson, FileSpreadsheet, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useGrocery } from '../../hooks/useGrocery';
import { Modal } from '../shared/Modal';
import type { GroceryList, GroceryItem } from '../../types';
import { MealPlanner } from './MealPlanner';
import { exportGroceryJSON, exportGroceryCSV, exportGroceryText, exportGroceryDOCX, importGroceryJSON, importGroceryCSV, importGroceryText, importGroceryDOCX } from '../../utils/groceryIO';

const GROCERY_CATEGORIES = ['Produce','Dairy','Meat','Bakery','Frozen','Pantry','Beverages','Snacks','Cleaning','Personal Care','Other'];
const CATEGORY_COLORS: Record<string, string> = {
  Produce:'#10b981', Dairy:'#3b82f6', Meat:'#ef4444', Bakery:'#f59e0b',
  Frozen:'#06b6d4', Pantry:'#8b5cf6', Beverages:'#ec4899', Snacks:'#f97316',
  Cleaning:'#6366f1', 'Personal Care':'#14b8a6', Other:'#9ca3af',
};

const inputCls = 'text-sm px-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-400';

function AddItemForm({ onAdd }: { onAdd: (item: Omit<GroceryItem, 'id' | 'checked'>) => void }) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [cat, setCat] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), quantity: qty.trim() || undefined, category: cat || undefined });
    setName(''); setQty('');
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Add item…" className={`${inputCls} flex-1`} />
      <input value={qty} onChange={e => setQty(e.target.value)} placeholder="Qty" className={`${inputCls} w-14`} />
      <select value={cat} onChange={e => setCat(e.target.value)} className={`${inputCls} bg-white`}>
        <option value="">Cat.</option>
        {GROCERY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <button type="submit"
        className="w-9 h-9 flex items-center justify-center text-white rounded-xl hover:opacity-90 transition-all active:scale-95 shrink-0"
        style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
        <Plus size={16} strokeWidth={2.5} />
      </button>
    </form>
  );
}

function GroceryListCard({ list, onDelete, onRename, onAddItem, onToggleItem, onDeleteItem, onClearChecked }: {
  list: GroceryList;
  onDelete: () => void;
  onRename: (name: string) => void;
  onAddItem: (item: Omit<GroceryItem, 'id' | 'checked'>) => void;
  onToggleItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onClearChecked: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(list.name);

  const grouped = GROCERY_CATEGORIES.reduce<Record<string, GroceryItem[]>>((acc, cat) => {
    const items = list.items.filter(i => i.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});
  const uncategorized = list.items.filter(i => !i.category);
  if (uncategorized.length > 0) grouped['Other'] = [...(grouped['Other'] ?? []), ...uncategorized];

  const checkedCount = list.items.filter(i => i.checked).length;
  const progress = list.items.length > 0 ? (checkedCount / list.items.length) * 100 : 0;

  const cardShadow = { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' };

  return (
    <div className="bg-white rounded-3xl overflow-hidden" style={cardShadow}>
      {/* Header */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between mb-3">
          {renaming ? (
            <form onSubmit={e => { e.preventDefault(); if (newName.trim()) { onRename(newName.trim()); setRenaming(false); } }} className="flex gap-2 flex-1">
              <input value={newName} onChange={e => setNewName(e.target.value)} autoFocus
                className="flex-1 text-sm px-3 py-1.5 border border-indigo-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100" />
              <button type="submit" className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-medium">Save</button>
              <button type="button" onClick={() => setRenaming(false)} className="text-gray-400 hover:text-gray-600 p-1.5"><X size={14} /></button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{list.name}</h3>
              <button onClick={() => setRenaming(true)} className="text-gray-300 hover:text-gray-500 transition-colors"><Edit2 size={13} /></button>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-gray-400 tabular">{checkedCount}/{list.items.length}</span>
            {checkedCount > 0 && (
              <button onClick={onClearChecked}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
                style={{ color: '#6366f1', background: 'rgba(99,102,241,0.08)' }}>
                Clear done
              </button>
            )}
            <button onClick={onDelete} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {list.items.length > 0 && (
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #6366f1, #a855f7)' }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <AddItemForm onAdd={onAddItem} />

        {list.items.length === 0 ? (
          <p className="text-sm text-gray-300 text-center py-6">No items yet</p>
        ) : (
          <div className="mt-4 space-y-4">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[cat] ?? '#9ca3af' }} />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cat}</span>
                </div>
                <div className="space-y-1">
                  {items.map(item => (
                    <div key={item.id} className={`group flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors ${item.checked ? 'opacity-50' : ''}`}>
                      <button onClick={() => onToggleItem(item.id)}
                        className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
                        style={item.checked
                          ? { background: '#10b981', borderColor: '#10b981' }
                          : { borderColor: '#d1d5db' }}>
                        {item.checked && <Check size={12} className="text-white" strokeWidth={3} />}
                      </button>
                      <span className={`flex-1 text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.name}</span>
                      {item.quantity && <span className="text-xs text-gray-400 shrink-0">{item.quantity}</span>}
                      <button onClick={() => onDeleteItem(item.id)} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-100 text-gray-300 hover:text-red-500 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Import / Export modal ────────────────────────────────────────────────────

function GroceryIOModal({ lists, onImport, onClose }: {
  lists: GroceryList[];
  onImport: (lists: Omit<GroceryList, 'id' | 'createdAt'>[]) => void;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const totalItems = lists.reduce((s, l) => s + l.items.length, 0);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const finish = (result: { lists: Omit<GroceryList, 'id' | 'createdAt'>[]; errors: string[] }) => {
      setErrors(result.errors);
      if (result.lists.length > 0) {
        onImport(result.lists);
        const itemCount = result.lists.reduce((s, l) => s + l.items.length, 0);
        setSuccess(`Imported ${result.lists.length} list${result.lists.length > 1 ? 's' : ''} with ${itemCount} item${itemCount !== 1 ? 's' : ''}.`);
      } else {
        setSuccess(null);
      }
    };

    if (file.name.endsWith('.docx')) {
      const reader = new FileReader();
      reader.onload = async ev => finish(await importGroceryDOCX(ev.target!.result as ArrayBuffer));
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = ev => {
        const raw = ev.target!.result as string;
        if (file.name.endsWith('.json'))      finish(importGroceryJSON(raw));
        else if (file.name.endsWith('.csv'))  finish(importGroceryCSV(raw));
        else                                  finish(importGroceryText(raw));
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const btnCls = 'flex items-center gap-2.5 w-full px-4 py-3.5 rounded-2xl text-left transition-all hover:opacity-90 active:scale-[0.98]';

  return (
    <Modal title="Export / Import grocery" onClose={onClose}>
      <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: '#f1f5f9' }}>
        {(['export', 'import'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setErrors([]); setSuccess(null); }}
            className={`flex-1 py-1.5 text-sm font-semibold rounded-lg capitalize transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
            {t === 'export' ? '↓ Export' : '↑ Import'}
          </button>
        ))}
      </div>

      {tab === 'export' && (
        <div className="space-y-2.5">
          <p className="text-xs text-gray-400 mb-3">{lists.length} list{lists.length !== 1 ? 's' : ''}, {totalItems} item{totalItems !== 1 ? 's' : ''} will be exported.</p>

          <button onClick={() => exportGroceryJSON(lists)} className={btnCls}
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff', boxShadow: '0 4px 12px rgba(99,102,241,0.25)' }}>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><FileJson size={16} /></div>
            <div>
              <p className="text-sm font-semibold">Export as JSON</p>
              <p className="text-xs opacity-70">Full fidelity — reimport anytime</p>
            </div>
            <Download size={14} className="ml-auto opacity-70" />
          </button>

          <button onClick={() => exportGroceryCSV(lists)} className={btnCls}
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><FileSpreadsheet size={16} /></div>
            <div>
              <p className="text-sm font-semibold">Export as CSV</p>
              <p className="text-xs opacity-70">Open in Excel, Sheets, Numbers</p>
            </div>
            <Download size={14} className="ml-auto opacity-70" />
          </button>

          <button onClick={() => exportGroceryText(lists)} className={btnCls}
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', boxShadow: '0 4px 12px rgba(245,158,11,0.25)' }}>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><FileText size={16} /></div>
            <div>
              <p className="text-sm font-semibold">Export as plain text</p>
              <p className="text-xs opacity-70">Readable checklist format</p>
            </div>
            <Download size={14} className="ml-auto opacity-70" />
          </button>

          <button onClick={() => exportGroceryDOCX(lists)} className={btnCls}
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <div>
              <p className="text-sm font-semibold">Export as Word (.docx)</p>
              <p className="text-xs opacity-70">Lists grouped by category</p>
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
              <li><span className="font-mono bg-indigo-100 px-1 rounded">.csv</span> — columns: List, Item, Quantity, Category, Checked</li>
              <li><span className="font-mono bg-indigo-100 px-1 rounded">.txt</span> — sections headed by <span className="font-mono">List name:</span>, items as <span className="font-mono">- Item (qty) [category]</span></li>
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

          {success && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium text-emerald-700" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> {success}
            </div>
          )}
          {errors.length > 0 && (
            <div className="px-4 py-3 rounded-xl text-xs space-y-1" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <div className="flex items-center gap-1.5 font-semibold text-red-600 mb-1"><AlertCircle size={13} /> {errors.length} warning{errors.length > 1 ? 's' : ''}</div>
              {errors.map((e, i) => <p key={i} className="text-red-500">{e}</p>)}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ─── GroceryPage ─────────────────────────────────────────────────────────────

export function GroceryPage() {
  const { lists, addList, deleteList, renameList, addItem, toggleItem, deleteItem, clearChecked, importLists } = useGrocery();
  const [activeTab, setActiveTab] = useState<'lists' | 'meals'>('lists');
  const [showNewList, setShowNewList] = useState(false);
  const [showIO, setShowIO] = useState(false);
  const [newListName, setNewListName] = useState('');

  const handleAddMealToList = (listId: string, items: Array<{ name: string; quantity?: string; category?: string }>) => {
    items.forEach(item => addItem(listId, item));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 fade-up">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Grocery</h1>
            <p className="text-sm text-gray-400 mt-0.5">{lists.length} {lists.length === 1 ? 'list' : 'lists'}</p>
          </div>
          {activeTab === 'lists' && (
            <div className="flex gap-1.5 items-center">
              <button onClick={() => setShowIO(true)} title="Export / Import"
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors">
                <Upload size={16} strokeWidth={1.75} />
              </button>
              <button onClick={() => setShowNewList(true)}
                className="flex items-center gap-1.5 text-sm px-4 py-2 text-white rounded-xl font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                <Plus size={15} strokeWidth={2.5} />
                <span className="hidden sm:inline">New list</span>
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl mb-6 w-fit" style={{ background: '#f1f5f9' }}>
          {([
            { id: 'lists', label: 'Shopping Lists', icon: <ShoppingCart size={14} strokeWidth={2} /> },
            { id: 'meals', label: 'Meal Planner', icon: <UtensilsCrossed size={14} strokeWidth={2} /> },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'lists' && (
          lists.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="w-16 h-16 rounded-3xl mx-auto mb-5 flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.08)' }}>
                <ShoppingCart size={28} className="text-indigo-300" strokeWidth={1.5} />
              </div>
              <p className="font-semibold text-gray-600 mb-1">No grocery lists yet</p>
              <p className="text-sm text-gray-400 mb-5">Create your first list to get started</p>
              <button onClick={() => setShowNewList(true)}
                className="text-sm px-5 py-2.5 text-white rounded-xl font-semibold hover:opacity-90 transition-all"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                Create list
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {lists.map(list => (
                <GroceryListCard key={list.id} list={list}
                  onDelete={() => deleteList(list.id)}
                  onRename={name => renameList(list.id, name)}
                  onAddItem={item => addItem(list.id, item)}
                  onToggleItem={iid => toggleItem(list.id, iid)}
                  onDeleteItem={iid => deleteItem(list.id, iid)}
                  onClearChecked={() => clearChecked(list.id)}
                />
              ))}
            </div>
          )
        )}

        {activeTab === 'meals' && (
          <MealPlanner lists={lists} onAddToList={handleAddMealToList} />
        )}
      </div>

      {showIO && (
        <GroceryIOModal
          lists={lists}
          onImport={importLists}
          onClose={() => setShowIO(false)}
        />
      )}

      {showNewList && (
        <Modal title="New grocery list" onClose={() => setShowNewList(false)} size="sm">
          <form onSubmit={e => { e.preventDefault(); if (newListName.trim()) { addList(newListName.trim()); setNewListName(''); setShowNewList(false); } }}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">List name</label>
            <input value={newListName} onChange={e => setNewListName(e.target.value)} autoFocus
              placeholder="e.g. Weekly shopping" className={`${inputCls} w-full mb-4`} />
            <button type="submit"
              className="w-full py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-all"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
              Create list
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

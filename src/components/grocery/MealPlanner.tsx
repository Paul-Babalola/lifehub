import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, ShoppingCart, Edit2, Check, UtensilsCrossed } from 'lucide-react';
import { useMeals } from '../../hooks/useMeals';
import type { Meal, MealIngredient } from '../../hooks/useMeals';
import { Modal } from '../shared/Modal';
import type { GroceryList } from '../../types';

const GROCERY_CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Bakery', 'Frozen', 'Pantry', 'Beverages', 'Snacks', 'Cleaning', 'Personal Care', 'Other'];

function IngredientRow({ ing, onUpdate, onDelete }: {
  ing: MealIngredient;
  onUpdate: (u: Partial<MealIngredient>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(ing.name);
  const [qty, setQty] = useState(ing.quantity ?? '');
  const [cat, setCat] = useState(ing.category ?? '');

  if (editing) {
    return (
      <div className="flex gap-2 items-center py-1">
        <input value={name} onChange={e => setName(e.target.value)} className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:border-indigo-400" placeholder="Name" />
        <input value={qty} onChange={e => setQty(e.target.value)} className="w-16 text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none" placeholder="Qty" />
        <select value={cat} onChange={e => setCat(e.target.value)} className="text-xs px-2 py-1 border border-gray-200 rounded bg-white focus:outline-none">
          <option value="">Category</option>
          {GROCERY_CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <button onClick={() => { onUpdate({ name, quantity: qty || undefined, category: cat || undefined }); setEditing(false); }} className="p-1 text-green-600 hover:text-green-700">
          <Check size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-3 py-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
      <span className="flex-1 text-sm text-gray-700">{ing.name}</span>
      {ing.quantity && <span className="text-xs text-gray-400">{ing.quantity}</span>}
      {ing.category && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{ing.category}</span>}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="p-0.5 text-gray-400 hover:text-gray-600"><Edit2 size={12} /></button>
        <button onClick={onDelete} className="p-0.5 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
      </div>
    </div>
  );
}

function AddToListModal({ meal, lists, onAddToList, onClose }: {
  meal: Meal;
  lists: GroceryList[];
  onAddToList: (listId: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(lists[0]?.id ?? '');

  return (
    <Modal title={`Add "${meal.name}" ingredients to list`} onClose={onClose} size="sm">
      {lists.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">No grocery lists yet. Create one first.</p>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Choose grocery list</label>
            <select value={selected} onChange={e => setSelected(e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 bg-white">
              {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 mb-2">Will add {meal.ingredients.length} ingredients:</p>
            <ul className="space-y-1">
              {meal.ingredients.map(ing => (
                <li key={ing.id} className="text-xs text-gray-600 flex gap-2">
                  <span>·</span>
                  <span>{ing.name}{ing.quantity ? ` (${ing.quantity})` : ''}</span>
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => { onAddToList(selected); onClose(); }}
            disabled={!selected}
            className="w-full py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart size={15} /> Add to list
          </button>
        </div>
      )}
    </Modal>
  );
}

function MealCard({ meal, lists, onUpdate, onDelete, onAddIngredient, onUpdateIngredient, onDeleteIngredient, onAddToList }: {
  meal: Meal;
  lists: GroceryList[];
  onUpdate: (u: Partial<Meal>) => void;
  onDelete: () => void;
  onAddIngredient: (ing: Omit<MealIngredient, 'id'>) => void;
  onUpdateIngredient: (id: string, u: Partial<MealIngredient>) => void;
  onDeleteIngredient: (id: string) => void;
  onAddToList: (listId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [addToList, setAddToList] = useState(false);
  const [newIng, setNewIng] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newCat, setNewCat] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(meal.name);

  const submitIng = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIng.trim()) return;
    onAddIngredient({ name: newIng.trim(), quantity: newQty.trim() || undefined, category: newCat || undefined });
    setNewIng('');
    setNewQty('');
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {editingName ? (
            <form onSubmit={e => { e.preventDefault(); if (draftName.trim()) { onUpdate({ name: draftName.trim() }); setEditingName(false); } }} className="flex-1 flex gap-2">
              <input value={draftName} onChange={e => setDraftName(e.target.value)} className="flex-1 text-sm px-2 py-1 border border-indigo-400 rounded-lg focus:outline-none" autoFocus />
              <button type="submit" className="text-xs px-2 py-1 bg-indigo-600 text-white rounded-lg">Save</button>
            </form>
          ) : (
            <div className="flex-1 flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{meal.name}</h3>
              <button onClick={() => setEditingName(true)} className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"><Edit2 size={13} /></button>
            </div>
          )}

          <span className="text-xs text-gray-400">{meal.ingredients.length} ingredients</span>
          <button
            onClick={() => setAddToList(true)}
            disabled={meal.ingredients.length === 0}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <ShoppingCart size={13} /> Add to list
          </button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
        </div>

        {expanded && (
          <div className="p-5">
            {meal.description && <p className="text-sm text-gray-500 mb-3">{meal.description}</p>}

            <div className="divide-y divide-gray-50">
              {meal.ingredients.map(ing => (
                <IngredientRow
                  key={ing.id}
                  ing={ing}
                  onUpdate={u => onUpdateIngredient(ing.id, u)}
                  onDelete={() => onDeleteIngredient(ing.id)}
                />
              ))}
            </div>

            <form onSubmit={submitIng} className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
              <input value={newIng} onChange={e => setNewIng(e.target.value)} placeholder="Add ingredient…" className="flex-1 text-sm px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400" />
              <input value={newQty} onChange={e => setNewQty(e.target.value)} placeholder="Qty" className="w-16 text-sm px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none" />
              <select value={newCat} onChange={e => setNewCat(e.target.value)} className="text-sm px-2 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none text-gray-600">
                <option value="">Cat.</option>
                {GROCERY_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <button type="submit" className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"><Plus size={16} /></button>
            </form>
          </div>
        )}
      </div>

      {addToList && (
        <AddToListModal meal={meal} lists={lists} onAddToList={onAddToList} onClose={() => setAddToList(false)} />
      )}
    </>
  );
}

interface Props {
  lists: GroceryList[];
  onAddToList: (listId: string, items: Array<{ name: string; quantity?: string; category?: string }>) => void;
}

export function MealPlanner({ lists, onAddToList }: Props) {
  const { meals, addMeal, updateMeal, deleteMeal, addIngredient, updateIngredient, deleteIngredient } = useMeals();
  const [showAdd, setShowAdd] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealDesc, setMealDesc] = useState('');

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UtensilsCrossed size={18} className="text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Meal Planner</h2>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
          <Plus size={14} /> Add meal
        </button>
      </div>

      {meals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
          <UtensilsCrossed size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="font-medium text-gray-500 mb-1">No meals yet</p>
          <p className="text-sm">Add a meal with its ingredients, then push them directly to a grocery list.</p>
          <button onClick={() => setShowAdd(true)} className="mt-4 text-sm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            Add first meal
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {meals.map(meal => (
            <MealCard
              key={meal.id}
              meal={meal}
              lists={lists}
              onUpdate={u => updateMeal(meal.id, u)}
              onDelete={() => deleteMeal(meal.id)}
              onAddIngredient={ing => addIngredient(meal.id, ing)}
              onUpdateIngredient={(iid, u) => updateIngredient(meal.id, iid, u)}
              onDeleteIngredient={iid => deleteIngredient(meal.id, iid)}
              onAddToList={listId => onAddToList(listId, meal.ingredients)}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Add meal" onClose={() => setShowAdd(false)} size="sm">
          <form onSubmit={e => {
            e.preventDefault();
            if (mealName.trim()) {
              addMeal({ name: mealName.trim(), description: mealDesc.trim() || undefined, ingredients: [] });
              setMealName('');
              setMealDesc('');
              setShowAdd(false);
            }
          }}>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Meal name *</label>
                <input value={mealName} onChange={e => setMealName(e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400" placeholder="e.g. Pasta Bolognese" autoFocus required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input value={mealDesc} onChange={e => setMealDesc(e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400" placeholder="Optional notes" />
              </div>
              <button type="submit" className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                Create meal
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

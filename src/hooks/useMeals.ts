import { useLocalStorage } from './useLocalStorage';
import { nanoid } from '../utils/nanoid';

export interface MealIngredient {
  id: string;
  name: string;
  quantity?: string;
  category?: string;
}

export interface Meal {
  id: string;
  name: string;
  description?: string;
  servings?: number;
  ingredients: MealIngredient[];
  createdAt: string;
}

export function useMeals() {
  const [meals, setMeals] = useLocalStorage<Meal[]>('lh-meals', []);

  const addMeal = (data: Omit<Meal, 'id' | 'createdAt'>) => {
    setMeals(prev => [...prev, { ...data, id: nanoid(), createdAt: new Date().toISOString() }]);
  };

  const updateMeal = (id: string, updates: Partial<Meal>) => {
    setMeals(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMeal = (id: string) => {
    setMeals(prev => prev.filter(m => m.id !== id));
  };

  const addIngredient = (mealId: string, ing: Omit<MealIngredient, 'id'>) => {
    setMeals(prev => prev.map(m => m.id === mealId
      ? { ...m, ingredients: [...m.ingredients, { ...ing, id: nanoid() }] }
      : m
    ));
  };

  const updateIngredient = (mealId: string, ingId: string, updates: Partial<MealIngredient>) => {
    setMeals(prev => prev.map(m => m.id === mealId
      ? { ...m, ingredients: m.ingredients.map(i => i.id === ingId ? { ...i, ...updates } : i) }
      : m
    ));
  };

  const deleteIngredient = (mealId: string, ingId: string) => {
    setMeals(prev => prev.map(m => m.id === mealId
      ? { ...m, ingredients: m.ingredients.filter(i => i.id !== ingId) }
      : m
    ));
  };

  return { meals, addMeal, updateMeal, deleteMeal, addIngredient, updateIngredient, deleteIngredient };
}

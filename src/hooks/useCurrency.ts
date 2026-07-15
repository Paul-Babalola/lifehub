import { useLocalStorage } from './useLocalStorage';
import type { AppSettings } from '../types';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

const DEFAULT: AppSettings = { anthropicApiKey: '', aiModel: 'claude-sonnet-4-6' };

export function useCurrency() {
  const [settings] = useLocalStorage<AppSettings>('lh-settings', DEFAULT);
  const code = settings.currency ?? 'USD';
  return {
    fmt: (amount: number) => formatCurrency(amount, code),
    symbol: getCurrencySymbol(code),
    code,
  };
}

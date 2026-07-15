export const CURRENCIES = [
  { code: 'USD', label: 'US Dollar',           symbol: '$'   },
  { code: 'EUR', label: 'Euro',                symbol: '€'   },
  { code: 'GBP', label: 'British Pound',       symbol: '£'   },
  { code: 'JPY', label: 'Japanese Yen',        symbol: '¥'   },
  { code: 'CAD', label: 'Canadian Dollar',     symbol: 'CA$' },
  { code: 'AUD', label: 'Australian Dollar',   symbol: 'A$'  },
  { code: 'CHF', label: 'Swiss Franc',         symbol: 'Fr'  },
  { code: 'CNY', label: 'Chinese Yuan',        symbol: '¥'   },
  { code: 'INR', label: 'Indian Rupee',        symbol: '₹'   },
  { code: 'MXN', label: 'Mexican Peso',        symbol: 'MX$' },
  { code: 'BRL', label: 'Brazilian Real',      symbol: 'R$'  },
  { code: 'SGD', label: 'Singapore Dollar',    symbol: 'S$'  },
  { code: 'NGN', label: 'Nigerian Naira',      symbol: '₦'   },
  { code: 'ZAR', label: 'South African Rand',  symbol: 'R'   },
  { code: 'KES', label: 'Kenyan Shilling',     symbol: 'KSh' },
  { code: 'GHS', label: 'Ghanaian Cedi',       symbol: '₵'   },
];

export function formatCurrency(amount: number, code = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export function getCurrencySymbol(code = 'USD'): string {
  return CURRENCIES.find(c => c.code === code)?.symbol ?? '$';
}

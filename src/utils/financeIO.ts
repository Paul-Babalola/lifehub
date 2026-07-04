import { Document, Paragraph, TextRun, HeadingLevel, Packer, BorderStyle } from 'docx';
import mammoth from 'mammoth';
import type { Transaction } from '../types';
import { format, parseISO } from 'date-fns';

// ─── Export ──────────────────────────────────────────────────────────────────

export function exportFinanceJSON(transactions: Transaction[]): void {
  download(JSON.stringify(transactions, null, 2), `finance-${fmt()}.json`, 'application/json');
}

export function exportFinanceCSV(transactions: Transaction[]): void {
  const headers = ['Type', 'Amount', 'Category', 'Description', 'Date', 'Recurring Frequency', 'Recurring Interval'];
  const rows = transactions.map(t => [
    t.type,
    t.amount.toFixed(2),
    t.category,
    t.description,
    t.date,
    t.recurring?.frequency ?? '',
    t.recurring?.interval?.toString() ?? '',
  ]);
  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  download(csv, `finance-${fmt()}.csv`, 'text/csv');
}

export function exportFinanceText(transactions: Transaction[]): void {
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const lines: string[] = [];
  let lastMonth = '';
  for (const t of sorted) {
    const m = t.date.slice(0, 7);
    if (m !== lastMonth) {
      if (lastMonth) lines.push('');
      lines.push(`=== ${format(parseISO(t.date), 'MMMM yyyy')} ===`);
      lastMonth = m;
    }
    const sign = t.type === 'income' ? '+' : '-';
    const desc = t.description ? ` - ${t.description}` : '';
    lines.push(`${t.date} [${t.type}] ${t.category}${desc}: ${sign}$${t.amount.toFixed(2)}`);
  }
  download(lines.join('\n'), `finance-${fmt()}.txt`, 'text/plain');
}

export async function exportFinanceDOCX(transactions: Transaction[]): Promise<void> {
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  const byMonth = new Map<string, Transaction[]>();
  for (const t of sorted) {
    const m = t.date.slice(0, 7);
    if (!byMonth.has(m)) byMonth.set(m, []);
    byMonth.get(m)!.push(t);
  }

  const divider = () => new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' } }, spacing: { after: 160 }, children: [] });

  const children: Paragraph[] = [
    new Paragraph({ heading: HeadingLevel.TITLE, spacing: { after: 120 }, children: [new TextRun({ text: 'Finance Report', bold: true, size: 56, color: '0F172A' })] }),
    new Paragraph({ spacing: { after: 500 }, children: [new TextRun({ text: `Exported ${format(new Date(), 'MMMM d, yyyy')}`, size: 20, color: '94A3B8' })] }),
  ];

  for (const [month, txs] of byMonth) {
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const net = income - expenses;

    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 480, after: 100 }, children: [new TextRun({ text: format(parseISO(month + '-01'), 'MMMM yyyy'), bold: true, size: 32, color: '1E293B' })] }),
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({ text: `Income: +$${income.toFixed(2)}`, size: 20, color: '10B981', bold: true }),
          new TextRun({ text: '   ·   ', size: 20, color: 'CBD5E1' }),
          new TextRun({ text: `Expenses: -$${expenses.toFixed(2)}`, size: 20, color: 'F43F5E', bold: true }),
          new TextRun({ text: '   ·   ', size: 20, color: 'CBD5E1' }),
          new TextRun({ text: `Net: ${net < 0 ? '-' : '+'}$${Math.abs(net).toFixed(2)}`, size: 20, color: net >= 0 ? '6366F1' : 'F43F5E', bold: true }),
        ],
      }),
      divider(),
    );

    for (const t of txs) {
      const isInc = t.type === 'income';
      children.push(new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: `${isInc ? '↑' : '↓'}  `, font: 'Segoe UI Emoji', size: 22 }),
          new TextRun({ text: t.description || t.category, size: 22, bold: true, color: '1E293B' }),
          new TextRun({ text: `  ·  ${t.category}  ·  ${t.date}`, size: 18, color: '94A3B8' }),
          new TextRun({ text: `  ${isInc ? '+' : '-'}$${t.amount.toFixed(2)}`, size: 22, bold: true, color: isInc ? '10B981' : 'F43F5E' }),
        ],
      }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `finance-${fmt()}.docx`);
}

// ─── Import ──────────────────────────────────────────────────────────────────

export type FinanceImportResult = { transactions: Omit<Transaction, 'id' | 'createdAt'>[]; errors: string[] };

export function importFinanceJSON(raw: string): FinanceImportResult {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return { transactions: [], errors: ['Invalid JSON file.'] }; }
  if (!Array.isArray(parsed)) return { transactions: [], errors: ['Expected a JSON array of transactions.'] };

  const errors: string[] = [];
  const transactions: Omit<Transaction, 'id' | 'createdAt'>[] = [];
  for (const item of parsed) {
    if (!['income', 'expense'].includes(item?.type)) { errors.push('Skipped item with missing or invalid type.'); continue; }
    if (typeof item?.amount !== 'number') { errors.push('Skipped item with missing amount.'); continue; }
    transactions.push({
      type: item.type,
      amount: item.amount,
      category: item.category ?? 'Other',
      description: item.description ?? '',
      date: item.date ?? format(new Date(), 'yyyy-MM-dd'),
      recurring: item.recurring,
      seriesId: item.seriesId,
    });
  }
  return { transactions, errors };
}

export function importFinanceCSV(raw: string): FinanceImportResult {
  const errors: string[] = [];
  const transactions: Omit<Transaction, 'id' | 'createdAt'>[] = [];
  const lines = raw.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return { transactions: [], errors: ['CSV must have a header row and at least one data row.'] };

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let cur = '', inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) { result.push(cur); cur = ''; }
      else cur += ch;
    }
    result.push(cur);
    return result.map(s => s.trim());
  };

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const col = (row: string[], name: string) => row[headers.indexOf(name)] ?? '';

  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    const type = col(row, 'type').toLowerCase();
    if (!['income', 'expense'].includes(type)) { errors.push(`Row ${i + 1}: invalid type "${type}", skipped.`); continue; }
    const amount = parseFloat(col(row, 'amount'));
    if (isNaN(amount)) { errors.push(`Row ${i + 1}: invalid amount, skipped.`); continue; }
    const freq = col(row, 'recurring_frequency');
    const interval = parseInt(col(row, 'recurring_interval'));
    transactions.push({
      type: type as 'income' | 'expense',
      amount,
      category: col(row, 'category') || 'Other',
      description: col(row, 'description') || '',
      date: col(row, 'date') || format(new Date(), 'yyyy-MM-dd'),
      recurring: freq && ['daily', 'weekly', 'monthly'].includes(freq)
        ? { frequency: freq as 'daily' | 'weekly' | 'monthly', interval: isNaN(interval) ? 1 : interval }
        : undefined,
    });
  }
  return { transactions, errors };
}

export function importFinanceText(raw: string): FinanceImportResult {
  const transactions: Omit<Transaction, 'id' | 'createdAt'>[] = [];
  const errors: string[] = [];

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('===')) continue;

    // Format: 2026-07-01 [income|expense] Category - Description: +/-$amount
    const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})\s+\[(income|expense)\]\s+(.+):\s*[+-]?\$?([\d.]+)$/);
    if (!match) { errors.push(`Could not parse: "${trimmed.slice(0, 60)}"`); continue; }

    const [, date, type, rest, amount] = match;
    const dashIdx = rest.indexOf(' - ');
    const category = dashIdx >= 0 ? rest.slice(0, dashIdx).trim() : rest.trim();
    const description = dashIdx >= 0 ? rest.slice(dashIdx + 3).trim() : '';

    transactions.push({
      type: type as 'income' | 'expense',
      amount: parseFloat(amount),
      category,
      description,
      date,
    });
  }
  return { transactions, errors };
}

export async function importFinanceDOCX(buffer: ArrayBuffer): Promise<FinanceImportResult> {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return importFinanceText(result.value);
  } catch {
    return { transactions: [], errors: ['Could not read .docx file. Make sure it is a valid Word document.'] };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt() { return format(new Date(), 'yyyy-MM-dd'); }

function download(content: string, filename: string, type: string) {
  downloadBlob(new Blob([content], { type }), filename);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}


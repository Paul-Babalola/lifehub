import { Document, Paragraph, TextRun, HeadingLevel, Packer, BorderStyle } from 'docx';
import mammoth from 'mammoth';
import type { GroceryList, GroceryItem } from '../types';
import { nanoid } from './nanoid';
import { format } from 'date-fns';

// ─── Export ──────────────────────────────────────────────────────────────────

export function exportGroceryJSON(lists: GroceryList[]): void {
  download(JSON.stringify(lists, null, 2), `grocery-${fmt()}.json`, 'application/json');
}

export function exportGroceryCSV(lists: GroceryList[]): void {
  const headers = ['List', 'Item', 'Quantity', 'Category', 'Checked'];
  const rows: string[][] = [];
  for (const list of lists) {
    for (const item of list.items) {
      rows.push([list.name, item.name, item.quantity ?? '', item.category ?? '', item.checked ? 'yes' : 'no']);
    }
    if (list.items.length === 0) rows.push([list.name, '', '', '', '']);
  }
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(','))
    .join('\n');
  download(csv, `grocery-${fmt()}.csv`, 'text/csv');
}

export function exportGroceryText(lists: GroceryList[]): void {
  const lines: string[] = [];
  for (const list of lists) {
    lines.push(`${list.name}:`);
    if (list.items.length === 0) { lines.push('  (empty)'); }
    else {
      for (const item of list.items) {
        let line = `  ${item.checked ? '[x]' : '[ ]'} ${item.name}`;
        if (item.quantity) line += ` (${item.quantity})`;
        if (item.category) line += ` [${item.category}]`;
        lines.push(line);
      }
    }
    lines.push('');
  }
  download(lines.join('\n'), `grocery-${fmt()}.txt`, 'text/plain');
}

export async function exportGroceryDOCX(lists: GroceryList[]): Promise<void> {
  const CATEGORY_ORDER = ['Produce','Dairy','Meat','Bakery','Frozen','Pantry','Beverages','Snacks','Cleaning','Personal Care','Other'];
  const divider = () => new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' } }, spacing: { after: 160 }, children: [] });

  const children: Paragraph[] = [
    new Paragraph({ heading: HeadingLevel.TITLE, spacing: { after: 120 }, children: [new TextRun({ text: 'Grocery Lists', bold: true, size: 56, color: '0F172A' })] }),
    new Paragraph({ spacing: { after: 500 }, children: [new TextRun({ text: `Exported ${format(new Date(), 'MMMM d, yyyy')}`, size: 20, color: '94A3B8' })] }),
  ];

  for (const list of lists) {
    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 480, after: 160 }, children: [new TextRun({ text: list.name, bold: true, size: 32, color: '1E293B' })] }),
      divider(),
    );

    if (list.items.length === 0) {
      children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: '(empty)', size: 20, color: 'CBD5E1', italics: true })] }));
      continue;
    }

    const byCategory = new Map<string, GroceryItem[]>();
    for (const item of list.items) {
      const cat = item.category ?? 'Other';
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(item);
    }

    const orderedCats = [...CATEGORY_ORDER.filter(c => byCategory.has(c)), ...Array.from(byCategory.keys()).filter(c => !CATEGORY_ORDER.includes(c))];

    for (const cat of orderedCats) {
      const items = byCategory.get(cat)!;
      children.push(new Paragraph({ spacing: { before: 200, after: 80 }, children: [new TextRun({ text: cat.toUpperCase(), size: 18, bold: true, color: '94A3B8' })] }));
      for (const item of items) {
        const check = item.checked ? '☑' : '☐';
        children.push(new Paragraph({
          spacing: { after: 60 },
          indent: { left: 200 },
          children: [
            new TextRun({ text: `${check}  `, font: 'Segoe UI Emoji', size: 22 }),
            new TextRun({ text: item.name, size: 22, color: item.checked ? 'CBD5E1' : '1E293B', strike: item.checked }),
            ...(item.quantity ? [new TextRun({ text: `  ${item.quantity}`, size: 20, color: '64748B' })] : []),
          ],
        }));
      }
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `grocery-${fmt()}.docx`);
}

// ─── Import ──────────────────────────────────────────────────────────────────

export interface GroceryImportResult {
  lists: Omit<GroceryList, 'id' | 'createdAt'>[];
  errors: string[];
}

export function importGroceryJSON(raw: string): GroceryImportResult {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return { lists: [], errors: ['Invalid JSON file.'] }; }
  if (!Array.isArray(parsed)) return { lists: [], errors: ['Expected a JSON array of grocery lists.'] };

  const errors: string[] = [];
  const lists: Omit<GroceryList, 'id' | 'createdAt'>[] = [];
  for (const entry of parsed) {
    if (typeof entry?.name !== 'string') { errors.push('Skipped entry with missing name.'); continue; }
    lists.push({
      name: entry.name,
      items: Array.isArray(entry.items)
        ? entry.items.map((i: any) => ({
            id: nanoid(),
            name: String(i.name ?? ''),
            quantity: i.quantity || undefined,
            category: i.category || undefined,
            checked: Boolean(i.checked),
          })).filter((i: GroceryItem) => i.name)
        : [],
    });
  }
  return { lists, errors };
}

export function importGroceryCSV(raw: string): GroceryImportResult {
  const errors: string[] = [];
  const lines = raw.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return { lists: [], errors: ['CSV must have a header row and at least one data row.'] };

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

  const headers = parseRow(lines[0]).map(h => h.toLowerCase());
  const col = (row: string[], name: string) => row[headers.indexOf(name)] ?? '';

  const byList = new Map<string, GroceryItem[]>();
  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    const listName = col(row, 'list');
    if (!listName) { errors.push(`Row ${i + 1}: missing list name, skipped.`); continue; }
    const itemName = col(row, 'item');
    if (!byList.has(listName)) byList.set(listName, []);
    if (itemName) {
      byList.get(listName)!.push({
        id: nanoid(),
        name: itemName,
        quantity: col(row, 'quantity') || undefined,
        category: col(row, 'category') || undefined,
        checked: col(row, 'checked').toLowerCase() === 'yes',
      });
    }
  }

  const lists = Array.from(byList.entries()).map(([name, items]) => ({ name, items }));
  return { lists, errors };
}

export function importGroceryText(raw: string): GroceryImportResult {
  const lists: Omit<GroceryList, 'id' | 'createdAt'>[] = [];
  let current: Omit<GroceryList, 'id' | 'createdAt'> | null = null;

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '(empty)') continue;

    // List header: a line ending with ':'
    if (!trimmed.startsWith('[') && !trimmed.startsWith('-') && !trimmed.startsWith('•') && trimmed.endsWith(':')) {
      current = { name: trimmed.slice(0, -1).trim(), items: [] };
      lists.push(current);
      continue;
    }

    if (!current) {
      current = { name: 'Imported list', items: [] };
      lists.push(current);
    }

    // Parse item: `[ ] Name (qty) [category]` or `- Name`
    let text = trimmed.replace(/^\[.\]\s*/, '').replace(/^[-•*]\s*/, '');
    const checked = /^\[x\]/i.test(trimmed);
    const qtyMatch = text.match(/\(([^)]+)\)/);
    const catMatch = text.match(/\[([^\]]+)\]/);
    if (qtyMatch) text = text.replace(qtyMatch[0], '').trim();
    if (catMatch) text = text.replace(catMatch[0], '').trim();
    if (!text) continue;

    current.items.push({
      id: nanoid(),
      name: text,
      quantity: qtyMatch?.[1],
      category: catMatch?.[1],
      checked,
    });
  }

  return { lists, errors: [] };
}

export async function importGroceryDOCX(buffer: ArrayBuffer): Promise<GroceryImportResult> {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return importGroceryText(result.value);
  } catch {
    return { lists: [], errors: ['Could not read .docx file. Make sure it is a valid Word document.'] };
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

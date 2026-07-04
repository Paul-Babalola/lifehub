import { Document, Paragraph, TextRun, HeadingLevel, Packer, BorderStyle } from 'docx';
import mammoth from 'mammoth';
import type { Task, Priority, Project } from '../types';
import { nanoid } from './nanoid';
import { format } from 'date-fns';

// ─── Export ──────────────────────────────────────────────────────────────────

export function exportJSON(tasks: Task[]): void {
  const payload = JSON.stringify(tasks, null, 2);
  download(payload, `tasks-${fmt()}.json`, 'application/json');
}

export function exportCSV(tasks: Task[], projects: Project[]): void {
  const projectName = (id?: string) => projects.find(p => p.id === id)?.name ?? '';
  const headers = ['Title', 'Priority', 'Due Date', 'Project', 'Status', 'Description', 'Subtasks'];
  const rows = tasks.map(t => [
    t.title,
    t.priority,
    t.dueDate ?? '',
    projectName(t.projectId),
    t.done ? 'done' : 'active',
    t.description ?? '',
    t.subtasks.map(s => s.title).join(' | '),
  ]);
  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  download(csv, `tasks-${fmt()}.csv`, 'text/csv');
}

export async function exportDOCX(tasks: Task[], projects: Project[]): Promise<void> {
  const projectName = (id?: string) => projects.find(p => p.id === id)?.name ?? '';
  const active = tasks.filter(t => !t.done);
  const done   = tasks.filter(t => t.done);

  const divider = () => new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' } },
    spacing: { after: 200 },
    children: [],
  });

  const taskPara = (t: Task) => {
    const badge = t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢';
    const lines: Paragraph[] = [
      new Paragraph({
        spacing: { before: 200, after: 60 },
        children: [
          new TextRun({ text: `${badge} `, font: 'Segoe UI Emoji' }),
          new TextRun({ text: t.title, bold: true, size: 24, color: '1E293B' }),
          ...(t.dueDate ? [new TextRun({ text: `  · due ${t.dueDate}`, size: 20, color: '94A3B8' })] : []),
        ],
      }),
    ];
    if (projectName(t.projectId)) {
      lines.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `Project: ${projectName(t.projectId)}`, size: 18, color: '6366F1' })] }));
    }
    if (t.description) {
      lines.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: t.description, size: 18, color: '64748B', italics: true })] }));
    }
    for (const s of t.subtasks) {
      lines.push(new Paragraph({ spacing: { after: 20 }, indent: { left: 360 }, children: [new TextRun({ text: `${s.done ? '☑' : '☐'} ${s.title}`, size: 18, color: s.done ? '94A3B8' : '475569' })] }));
    }
    return lines;
  };

  const children: Paragraph[] = [
    new Paragraph({ heading: HeadingLevel.TITLE, spacing: { after: 120 }, children: [new TextRun({ text: 'Task List', bold: true, size: 56, color: '0F172A' })] }),
    new Paragraph({ spacing: { after: 400 }, children: [new TextRun({ text: `Exported ${format(new Date(), 'MMMM d, yyyy')}`, size: 20, color: '94A3B8' })] }),
  ];

  if (active.length > 0) {
    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: `Active  (${active.length})`, size: 28, bold: true, color: '1E293B' })] }),
      divider(),
      ...active.flatMap(taskPara),
    );
  }
  if (done.length > 0) {
    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 600, after: 200 }, children: [new TextRun({ text: `Completed  (${done.length})`, size: 28, bold: true, color: '94A3B8' })] }),
      divider(),
      ...done.flatMap(t => taskPara(t).map(p => {
        (p as any).root.forEach((r: any) => { if (r.prepForXml) (r as any).options = { ...((r as any).options ?? {}), strike: true, color: 'CBD5E1' }; });
        return p;
      })),
    );
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `tasks-${fmt()}.docx`);
}

export function exportText(tasks: Task[]): void {
  const lines = tasks
    .filter(t => !t.done)
    .map(t => {
      let line = `[ ] ${t.title}`;
      if (t.priority === 'high') line += ' !!!';
      else if (t.priority === 'medium') line += ' !!';
      if (t.dueDate) line += ` (due ${t.dueDate})`;
      return line;
    });
  download(lines.join('\n'), `tasks-${fmt()}.txt`, 'text/plain');
}

// ─── Import ──────────────────────────────────────────────────────────────────

export type ImportResult = { tasks: Omit<Task, 'id' | 'createdAt'>[]; errors: string[] };

export function importJSON(raw: string): ImportResult {
  const errors: string[] = [];
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return { tasks: [], errors: ['Invalid JSON file.'] }; }
  if (!Array.isArray(parsed)) return { tasks: [], errors: ['Expected a JSON array of tasks.'] };
  const tasks: Omit<Task, 'id' | 'createdAt'>[] = [];
  for (const item of parsed) {
    if (typeof item?.title !== 'string') { errors.push(`Skipped item with missing title.`); continue; }
    tasks.push({
      title: item.title,
      description: item.description,
      done: Boolean(item.done),
      priority: (['low', 'medium', 'high'] as Priority[]).includes(item.priority) ? item.priority : 'medium',
      dueDate: item.dueDate,
      projectId: item.projectId,
      subtasks: Array.isArray(item.subtasks)
        ? item.subtasks.map((s: any) => ({ id: nanoid(), title: String(s.title ?? s), done: Boolean(s.done) }))
        : [],
      recurring: item.recurring,
    });
  }
  return { tasks, errors };
}

export function importCSV(raw: string): ImportResult {
  const errors: string[] = [];
  const tasks: Omit<Task, 'id' | 'createdAt'>[] = [];
  const lines = raw.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return { tasks: [], errors: ['CSV must have a header row and at least one data row.'] };

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
    const title = col(row, 'title');
    if (!title) { errors.push(`Row ${i + 1}: missing title, skipped.`); continue; }
    const rawPriority = col(row, 'priority').toLowerCase() as Priority;
    const subtaskRaw = col(row, 'subtasks');
    tasks.push({
      title,
      description: col(row, 'description') || undefined,
      done: col(row, 'status').toLowerCase() === 'done',
      priority: (['low', 'medium', 'high'] as Priority[]).includes(rawPriority) ? rawPriority : 'medium',
      dueDate: col(row, 'due_date') || undefined,
      projectId: undefined,
      subtasks: subtaskRaw
        ? subtaskRaw.split('|').map(s => ({ id: nanoid(), title: s.trim(), done: false })).filter(s => s.title)
        : [],
    });
  }
  return { tasks, errors };
}

export function importText(raw: string): ImportResult {
  const tasks: Omit<Task, 'id' | 'createdAt'>[] = [];
  const lines = raw.trim().split('\n').filter(l => l.trim());
  for (const line of lines) {
    // Strip leading checklist markers: "- [ ] ", "- [x] ", "• ", "* ", "- ", numbers
    let title = line.replace(/^(\s*[-*•]\s*\[.\]\s*|\s*[-*•]\s*|\s*\d+[.)]\s*)/, '').trim();
    if (!title) continue;
    let priority: Priority = 'medium';
    if (title.endsWith('!!!')) { priority = 'high'; title = title.slice(0, -3).trim(); }
    else if (title.endsWith('!!')) { priority = 'medium'; title = title.slice(0, -2).trim(); }
    else if (title.endsWith('!')) { priority = 'low'; title = title.slice(0, -1).trim(); }
    const dueDateMatch = title.match(/\(due (\d{4}-\d{2}-\d{2})\)$/);
    let dueDate: string | undefined;
    if (dueDateMatch) { dueDate = dueDateMatch[1]; title = title.replace(dueDateMatch[0], '').trim(); }
    tasks.push({ title, done: false, priority, dueDate, subtasks: [] });
  }
  return { tasks, errors: [] };
}

export async function importDOCX(buffer: ArrayBuffer): Promise<ImportResult> {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return importText(result.value);
  } catch {
    return { tasks: [], errors: ['Could not read .docx file. Make sure it is a valid Word document.'] };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt() { return format(new Date(), 'yyyy-MM-dd'); }

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  downloadBlob(blob, filename);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

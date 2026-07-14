import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, FileText, Search, X, Check } from 'lucide-react';
import { useNotes } from '../../hooks/useNotes';
import type { Note } from '../../types';
import { format, parseISO } from 'date-fns';
import { JournalView } from './JournalView';
import { BookmarksView } from './BookmarksView';

function NoteCard({ note, onEdit, onDelete }: { note: Note; onEdit: () => void; onDelete: () => void }) {
  const preview = note.content.replace(/\n+/g, ' ').trim().slice(0, 140);
  return (
    <div
      onClick={onEdit}
      className="group bg-white rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug flex-1 truncate">
          {note.title || 'Untitled'}
        </h3>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0"
        >
          <Trash2 size={13} />
        </button>
      </div>
      {preview && (
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{preview}</p>
      )}
      <p className="text-[10px] text-gray-300 mt-2.5 font-medium">
        {format(parseISO(note.updatedAt), 'MMM d, yyyy · h:mm a')}
      </p>
    </div>
  );
}

function NoteEditor({ note, onAdd, onUpdate, onClose }: {
  note: Partial<Note>;
  onAdd: (title: string, content: string) => string;
  onUpdate: (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(note.title ?? '');
  const [content, setContent] = useState(note.content ?? '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const noteIdRef = useRef<string | undefined>(note.id);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!title.trim() && !content.trim()) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (noteIdRef.current) {
        onUpdate(noteIdRef.current, { title: title.trim() || 'Untitled', content });
      } else {
        noteIdRef.current = onAdd(title.trim() || 'Untitled', content);
      }
      setSaveStatus('saved');
    }, 800);
    return () => clearTimeout(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content]);

  const handleClose = () => {
    clearTimeout(timerRef.current);
    if (title.trim() || content.trim()) {
      if (noteIdRef.current) {
        onUpdate(noteIdRef.current, { title: title.trim() || 'Untitled', content });
      } else {
        onAdd(title.trim() || 'Untitled', content);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)' }}
      onClick={handleClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="modal-enter bg-white rounded-3xl w-full max-w-2xl flex flex-col"
        style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)', maxHeight: '80vh' }}
      >
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <FileText size={16} className="text-indigo-400 shrink-0" />
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Note title…"
            className="flex-1 text-sm font-semibold text-gray-900 bg-transparent outline-none placeholder:text-gray-300"
            autoFocus
          />
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
              <Check size={11} strokeWidth={2.5} /> Saved
            </span>
          )}
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors ml-1">
            <X size={16} />
          </button>
        </div>

        {/* Editor */}
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Start writing…&#10;&#10;Markdown-style writing works great here — use plain text, lists, or anything you like."
          className="flex-1 resize-none px-6 py-5 text-sm text-gray-700 bg-transparent outline-none placeholder:text-gray-300 leading-relaxed min-h-[300px]"
        />
      </div>
    </div>
  );
}

export function NotesPage() {
  const { notes, addNote, updateNote, deleteNote } = useNotes();
  const [editing, setEditing] = useState<Note | null | 'new'>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'notes' | 'journal' | 'bookmarks'>('notes');

  const filtered = notes.filter(n =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase())
  );

  const cardShadow = { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' };

  return (
    <div className="flex-1 overflow-y-auto p-6 fade-up">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notes</h1>
            <p className="text-sm text-gray-400 mt-0.5">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
          </div>
          {tab === 'notes' && (
            <div className="flex gap-2 items-center">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search notes…"
                  className="text-xs pl-8 pr-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 w-44 bg-white"
                />
              </div>
              <button
                onClick={() => setEditing('new')}
                className="flex items-center gap-1.5 text-sm px-4 py-2 text-white rounded-xl font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                <Plus size={15} strokeWidth={2.5} />
                <span className="hidden sm:inline">Note</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: '#f1f5f9' }}>
          {(['notes', 'journal', 'bookmarks'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg capitalize transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'journal' && <JournalView />}
        {tab === 'bookmarks' && <BookmarksView />}

        {tab === 'notes' && (
          notes.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center" style={cardShadow}>
              <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))' }}>
                <Edit2 size={24} className="text-indigo-400" strokeWidth={1.5} />
              </div>
              <p className="font-semibold text-gray-700">No notes yet</p>
              <p className="text-sm text-gray-400 mt-1">Capture ideas, plans, or anything you want to remember.</p>
              <button
                onClick={() => setEditing('new')}
                className="mt-5 text-sm px-5 py-2 text-white rounded-xl font-semibold transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                Write your first note
              </button>
            </div>
          ) : (
            <>
              {filtered.length === 0 && search && (
                <p className="text-sm text-gray-400 text-center py-10">No notes match "{search}"</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={() => setEditing(note)}
                    onDelete={() => deleteNote(note.id)}
                  />
                ))}
              </div>
            </>
          )
        )}
      </div>

      {editing === 'new' && (
        <NoteEditor
          note={{}}
          onAdd={addNote}
          onUpdate={updateNote}
          onClose={() => setEditing(null)}
        />
      )}
      {editing && editing !== 'new' && (
        <NoteEditor
          note={editing}
          onAdd={addNote}
          onUpdate={updateNote}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

import { useState } from 'react';
import { Plus, Trash2, ExternalLink, BookOpen, BookMarked } from 'lucide-react';
import { useBookmarks } from '../../hooks/useBookmarks';

const cardShadow = { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' };
const inputCls = 'w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-400';

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export function BookmarksView() {
  const { bookmarks, addBookmark, deleteBookmark, toggleRead } = useBookmarks();
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const allTags = Array.from(new Set(bookmarks.flatMap(b => b.tags)));

  const filtered = bookmarks
    .filter(b => {
      if (filter === 'read' && !b.read) return false;
      if (filter === 'unread' && b.read) return false;
      if (tagFilter && !b.tags.includes(tagFilter)) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleAdd = () => {
    if (!url.trim() || !title.trim()) return;
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    addBookmark({ url: url.trim(), title: title.trim(), description: description.trim() || undefined, tags, read: false });
    setUrl(''); setTitle(''); setDescription(''); setTagsInput('');
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-400">{bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 text-white rounded-xl font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
          <Plus size={15} strokeWidth={2.5} />
          Add
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-5 mb-5" style={cardShadow}>
          <div className="space-y-3">
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL *" className={inputCls} autoFocus />
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title *" className={inputCls} />
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" className={inputCls} />
            <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="Tags (comma separated)" className={inputCls} />
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2 text-sm font-semibold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleAdd} disabled={!url.trim() || !title.trim()}
                className="flex-1 py-2 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {bookmarks.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#f1f5f9' }}>
            {(['all', 'unread', 'read'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                {f}
              </button>
            ))}
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setTagFilter(null)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${!tagFilter ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                All tags
              </button>
              {allTags.map(tag => (
                <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${tagFilter === tag ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {bookmarks.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center" style={cardShadow}>
          <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))' }}>
            <BookMarked size={24} className="text-indigo-400" strokeWidth={1.5} />
          </div>
          <p className="font-semibold text-gray-700">No bookmarks yet</p>
          <p className="text-sm text-gray-400 mt-1">Save links and articles you want to revisit.</p>
          <button onClick={() => setShowForm(true)}
            className="mt-5 text-sm px-5 py-2 text-white rounded-xl font-semibold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
            Add your first bookmark
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => {
            const domain = getDomain(b.url);
            return (
              <div key={b.id} className={`bg-white rounded-2xl p-4 ${b.read ? 'opacity-60' : ''}`} style={cardShadow}>
                <div className="flex items-start gap-3">
                  {domain && (
                    <img
                      src={`https://www.google.com/s2/favicons?sz=32&domain=${domain}`}
                      alt=""
                      className="w-5 h-5 rounded mt-0.5 shrink-0"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <a href={b.url} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors flex items-center gap-1.5 group">
                      <span className="truncate">{b.title}</span>
                      <ExternalLink size={11} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    {b.description && <p className="text-xs text-gray-400 mt-0.5">{b.description}</p>}
                    {b.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {b.tags.map(tag => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleRead(b.id)}
                      title={b.read ? 'Mark as unread' : 'Mark as read'}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-500 transition-colors">
                      {b.read ? <BookOpen size={13} /> : <BookMarked size={13} />}
                    </button>
                    <button onClick={() => deleteBookmark(b.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-10">No bookmarks match the current filter.</p>
          )}
        </div>
      )}
    </div>
  );
}

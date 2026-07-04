import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Trash2, X } from 'lucide-react';
import { useAI } from '../../hooks/useAI';
import type { AppSettings } from '../../types';

interface Props {
  settings: AppSettings;
  onClose: () => void;
}

const HINTS = [
  'What tasks are due this week?',
  "How's my budget looking?",
  'Suggest a weekly grocery list',
];

export function AIAssistant({ settings, onClose }: Props) {
  const { messages, loading, error, sendMessage, clearMessages } = useAI(settings);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    await sendMessage(text);
  };

  return (
    <div className="flex flex-col h-full shrink-0 bg-white" style={{ width: 320, borderLeft: '1px solid rgba(0,0,0,0.06)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 2px 8px rgba(99,102,241,0.35)' }}>
            <Sparkles size={13} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-none">AI Assistant</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Powered by Claude</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearMessages} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Clear chat">
            <Trash2 size={13} />
          </button>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: '#fafbfc' }}>
        {messages.length === 0 && (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
              <Sparkles size={22} className="text-white" strokeWidth={1.5} />
            </div>
            <p className="font-semibold text-gray-700 text-sm mb-1">Ask me anything</p>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">I can help with tasks, finances,<br />grocery lists and more.</p>
            <div className="space-y-2">
              {HINTS.map(hint => (
                <button key={hint} onClick={() => sendMessage(hint)}
                  className="w-full text-left text-xs px-3 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-gray-500 transition-all hover:shadow-sm">
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mr-2 mt-0.5"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                <Sparkles size={10} className="text-white" />
              </div>
            )}
            <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'text-white rounded-br-sm'
                : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100 shadow-sm'
            }`}
              style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #6366f1, #a855f7)' } : {}}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-end gap-2">
            <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
              <Sparkles size={10} className="text-white" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">{error}</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={submit} className="p-3 bg-white" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="flex gap-2 p-1.5 rounded-2xl border border-gray-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all bg-gray-50/50">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything…"
            className="flex-1 text-sm px-2 py-1 focus:outline-none bg-transparent placeholder:text-gray-400"
            disabled={loading}
          />
          <button type="submit" disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all hover:opacity-90 disabled:opacity-30 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
            <Send size={14} strokeWidth={2} />
          </button>
        </div>
      </form>
    </div>
  );
}

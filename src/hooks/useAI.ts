import { useState } from 'react';
import type { AIMessage, AppSettings } from '../types';
import { nanoid } from '../utils/nanoid';

const MODEL = 'claude-sonnet-4-6';

export function useAI(settings: AppSettings) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (content: string, systemPrompt?: string) => {
    if (!settings.anthropicApiKey) {
      setError('No API key set. Add your Anthropic API key in Settings.');
      return null;
    }

    const userMsg: AIMessage = { id: nanoid(), role: 'user', content, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    try {
      const body = {
        model: settings.aiModel || MODEL,
        max_tokens: 1024,
        system: systemPrompt ?? 'You are a helpful assistant integrated into a personal life management app called LifeHub. Help the user manage tasks, finances, and grocery lists. Be concise and practical.',
        messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
      };

      const res = await fetch('/api/anthropic/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? `Request failed: ${res.status}`);
      }

      const data = await res.json();
      const text = data.content?.[0]?.text ?? '';
      const assistantMsg: AIMessage = { id: nanoid(), role: 'assistant', content: text, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, assistantMsg]);
      return text;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => setMessages([]);

  return { messages, loading, error, sendMessage, clearMessages };
}

import { useState, useRef } from 'react';
import { Key, Bot, Shield, Eye, EyeOff, CheckCircle2, Moon, Bell, Download, Upload, HardDrive, Sun, Cloud, RefreshCw, AlertCircle, User as UserIcon, DollarSign } from 'lucide-react';
import type { AppSettings, NotificationPrefs } from '../../types';
import { exportBackup, importBackup } from '../../utils/backupIO';
import { CURRENCIES } from '../../utils/currency';
import type { User } from '@supabase/supabase-js';
import type { useSync } from '../../hooks/useSync';

const MODELS = [
  { id: 'claude-sonnet-4-6',        label: 'Claude Sonnet 4.6',  desc: 'Best balance of speed and intelligence' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5',   desc: 'Fastest responses, lower cost' },
  { id: 'claude-opus-4-8',          label: 'Claude Opus 4.8',    desc: 'Most capable, complex reasoning' },
];

const DEFAULT_NOTIF_PREFS: NotificationPrefs = {
  overdueTasks: true, dueTodayTasks: true, overBudget: true, nearBudget: true,
};

type SyncProps = ReturnType<typeof useSync>;

interface Props {
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
  sync: SyncProps;
  user: User | null;
  onSignOut: (() => void) | undefined;
  onUpdateProfile?: (firstName: string, lastName: string) => Promise<unknown> | undefined;
}

const inputCls = 'w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-400';

function Toggle({ value, onChange, label, sub }: { value: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="shrink-0 w-10 h-6 rounded-full transition-all duration-200 relative"
        style={{ background: value ? 'linear-gradient(135deg, #6366f1, #a855f7)' : '#e5e7eb' }}>
        <span
          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200"
          style={{ left: value ? '18px' : '2px' }} />
      </button>
    </div>
  );
}

function SectionHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-5" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      {icon}
      <div>
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

export function SettingsPage({ settings, onSave, sync, user, onSignOut, onUpdateProfile }: Props) {
  const [apiKey, setApiKey] = useState(settings.anthropicApiKey);
  const [model, setModel] = useState(settings.aiModel || MODELS[0].id);
  const [darkMode, setDarkMode] = useState(settings.darkMode ?? false);
  const [currency, setCurrency] = useState(settings.currency ?? 'USD');
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(settings.notifications ?? DEFAULT_NOTIF_PREFS);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const backupRef = useRef<HTMLInputElement>(null);

  const meta = user?.user_metadata ?? {};
  const [profileFirst, setProfileFirst] = useState<string>(
    (meta.first_name as string | undefined) ?? (meta.full_name as string | undefined)?.split(' ')[0] ?? ''
  );
  const [profileLast, setProfileLast] = useState<string>(
    (meta.last_name as string | undefined) ??
    ((meta.full_name as string | undefined)?.split(' ').slice(1).join(' ') ?? '')
  );
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const saveProfile = async () => {
    if (!profileFirst.trim()) { setProfileError('First name is required.'); return; }
    setProfileError(null);
    const res = await onUpdateProfile?.(profileFirst.trim(), profileLast.trim());
    const r = res as { error?: { message: string } } | undefined;
    if (r?.error) { setProfileError(r.error.message); return; }
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const cardShadow = { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' };

  const save = () => {
    onSave({ anthropicApiKey: apiKey.trim(), aiModel: model, darkMode, currency, notifications: notifPrefs });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const updateNotif = (key: keyof NotificationPrefs, val: boolean) => {
    setNotifPrefs(p => ({ ...p, [key]: val }));
  };

  const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = importBackup(ev.target!.result as string);
      if (result.success) {
        setBackupStatus(`Restored: ${result.restored.join(', ')}. Reload the page to see changes.`);
      } else {
        setBackupStatus(`Error: ${result.error}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 fade-up">
      <div className="max-w-2xl mx-auto">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Configure your LifeHub preferences</p>
        </div>

        <div className="space-y-4">

          {/* Profile */}
          {user && onUpdateProfile && (
            <div className="bg-white rounded-3xl p-6" style={cardShadow}>
              <SectionHeader
                icon={<div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center"><UserIcon size={18} className="text-indigo-500" strokeWidth={1.75} /></div>}
                title="Profile" sub="Update your display name" />
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">First name</label>
                  <input
                    type="text"
                    value={profileFirst}
                    onChange={e => setProfileFirst(e.target.value)}
                    placeholder="First name"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Last name</label>
                  <input
                    type="text"
                    value={profileLast}
                    onChange={e => setProfileLast(e.target.value)}
                    placeholder="Last name"
                    className={inputCls}
                  />
                </div>
                {profileError && <p className="text-xs text-red-500">{profileError}</p>}
                <button
                  onClick={saveProfile}
                  className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-semibold transition-all hover:opacity-90"
                  style={profileSaved
                    ? { background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }
                    : { background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
                  {profileSaved ? <CheckCircle2 size={14} /> : null}
                  {profileSaved ? 'Saved!' : 'Update name'}
                </button>
              </div>
            </div>
          )}

          {/* Appearance */}
          <div className="bg-white rounded-3xl p-6" style={cardShadow}>
            <SectionHeader
              icon={<div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center"><Moon size={18} className="text-slate-600" strokeWidth={1.75} /></div>}
              title="Appearance" sub="Visual preferences" />
            <Toggle
              value={darkMode}
              onChange={v => {
                setDarkMode(v);
                document.documentElement.classList.toggle('dark', v);
                onSave({ anthropicApiKey: apiKey.trim(), aiModel: model, darkMode: v, currency, notifications: notifPrefs });
              }}
              label="Dark mode"
              sub="Switch between light and dark themes"
            />
            <div className="flex items-center gap-3 mt-4 p-3 rounded-2xl" style={{ background: darkMode ? 'rgba(99,102,241,0.08)' : '#f8f9fc', border: '1px solid transparent' }}>
              <Sun size={14} className="text-amber-500 shrink-0" />
              <span className="text-xs text-gray-500">Currently using <strong className="text-gray-700">{darkMode ? 'dark' : 'light'}</strong> theme</span>
            </div>
          </div>

          {/* Currency */}
          <div className="bg-white rounded-3xl p-6" style={cardShadow}>
            <SectionHeader
              icon={<div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center"><DollarSign size={18} className="text-emerald-600" strokeWidth={1.75} /></div>}
              title="Currency" sub="Used across Finance, Subscriptions, and Goals" />
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Display currency</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className={inputCls}>
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} — {c.label} ({c.code})</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-2">
                Changes how amounts are displayed. Your data is stored as plain numbers — switching currency doesn't convert values.
              </p>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-3xl p-6" style={cardShadow}>
            <SectionHeader
              icon={<div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center"><Bell size={18} className="text-amber-500" strokeWidth={1.75} /></div>}
              title="Notifications" sub="Choose which alerts to receive" />
            <div className="space-y-3">
              <Toggle value={notifPrefs.overdueTasks} onChange={v => updateNotif('overdueTasks', v)} label="Overdue tasks" sub="Alert when tasks are past their due date" />
              <Toggle value={notifPrefs.dueTodayTasks} onChange={v => updateNotif('dueTodayTasks', v)} label="Tasks due today" sub="Alert for tasks due today" />
              <Toggle value={notifPrefs.overBudget} onChange={v => updateNotif('overBudget', v)} label="Over budget" sub="Alert when spending exceeds a budget limit" />
              <Toggle value={notifPrefs.nearBudget} onChange={v => updateNotif('nearBudget', v)} label="Near budget (80%)" sub="Warning when spending approaches the limit" />
            </div>
          </div>

          {/* AI Assistant */}
          <div className="bg-white rounded-3xl p-6" style={cardShadow}>
            <SectionHeader
              icon={<div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}><Bot size={18} className="text-white" strokeWidth={1.75} /></div>}
              title="AI Assistant" sub="Powered by Claude · Anthropic" />

            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  <Key size={11} /> Anthropic API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="sk-ant-api03-…"
                    className={`${inputCls} pr-11 font-mono text-xs`}
                  />
                  <button type="button" onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <div className="mt-2 flex items-start gap-1.5">
                  <Shield size={11} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-400">Stored locally. Never sent anywhere except Anthropic's API.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Model</label>
                <div className="space-y-2">
                  {MODELS.map(m => (
                    <label key={m.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                      style={model === m.id
                        ? { background: 'rgba(99,102,241,0.06)', border: '1.5px solid rgba(99,102,241,0.3)' }
                        : { background: '#f8f9fc', border: '1.5px solid transparent' }}>
                      <input type="radio" className="sr-only" checked={model === m.id} onChange={() => setModel(m.id)} />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${model === m.id ? 'border-indigo-500' : 'border-gray-300'}`}>
                        {model === m.id && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{m.label}</p>
                        <p className="text-xs text-gray-400">{m.desc}</p>
                      </div>
                      {m.id === MODELS[0].id && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>Recommended</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Cloud Sync & Account */}
          <div className="bg-white rounded-3xl p-6" style={cardShadow}>
            <SectionHeader
              icon={<div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center"><Cloud size={18} className="text-indigo-500" strokeWidth={1.75} /></div>}
              title="Cloud Sync" sub="Synced across devices via Supabase" />

            {user && (
              <div className="flex items-center gap-3 p-3 rounded-2xl mb-4" style={{ background: '#f8f9fc' }}>
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="" className="w-8 h-8 rounded-full shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-indigo-600">
                      {((meta.first_name as string | undefined) ?? (meta.full_name as string | undefined) ?? user.email ?? '?')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {[meta.first_name, meta.last_name].filter(Boolean).join(' ') || (meta.full_name as string | undefined) || 'Signed in'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <button
                  onClick={onSignOut}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-lg font-semibold text-red-500 hover:bg-red-50 transition-colors border border-red-100">
                  Sign out
                </button>
              </div>
            )}

            {sync.isConfigured ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: '#f8f9fc' }}>
                  {sync.status === 'syncing' && <RefreshCw size={14} className="text-indigo-500 animate-spin shrink-0" />}
                  {sync.status === 'synced'  && <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />}
                  {sync.status === 'error'   && <AlertCircle size={14} className="text-red-400 shrink-0" />}
                  {sync.status === 'idle'    && <Cloud size={14} className="text-gray-400 shrink-0" />}
                  <div>
                    <p className="text-xs font-medium text-gray-700">
                      {sync.status === 'syncing' ? 'Syncing…'
                        : sync.status === 'synced' ? 'All data synced'
                        : sync.status === 'error'  ? 'Sync failed — check console'
                        : 'Sync ready'}
                    </p>
                    {sync.lastSynced && (
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Last synced {new Date(sync.lastSynced).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => sync.push()}
                    disabled={sync.status === 'syncing'}
                    className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <Upload size={14} /> Push now
                  </button>
                  <button
                    onClick={async () => { await sync.pull(); window.location.reload(); }}
                    disabled={sync.status === 'syncing'}
                    className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <Download size={14} /> Pull & reload
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-3 rounded-2xl" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500">
                  Supabase env vars not detected. Add <code className="bg-gray-100 px-1 rounded">VITE_SUPABASE_URL</code> and <code className="bg-gray-100 px-1 rounded">VITE_SUPABASE_PUBLISHABLE_KEY</code> to enable cloud sync.
                </p>
              </div>
            )}
          </div>

          {/* Data & Backup */}
          <div className="bg-white rounded-3xl p-6" style={cardShadow}>
            <SectionHeader
              icon={<div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center"><HardDrive size={18} className="text-emerald-600" strokeWidth={1.75} /></div>}
              title="Data & Backup" sub="100% local · No account required" />

            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              All your data lives in your browser's local storage. Export a full backup regularly to protect against data loss.
            </p>

            <div className="flex flex-wrap gap-2">
              <button onClick={exportBackup}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-semibold transition-all hover:opacity-90"
                style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                <Download size={14} /> Export backup
              </button>
              <button onClick={() => backupRef.current?.click()}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-semibold transition-all hover:opacity-90"
                style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
                <Upload size={14} /> Restore backup
              </button>
              <input ref={backupRef} type="file" accept=".json" className="hidden" onChange={handleBackupImport} />
            </div>

            {backupStatus && (
              <div className="mt-3 px-4 py-3 rounded-xl text-xs text-emerald-700"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                {backupStatus}
              </div>
            )}

            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <button
                onClick={() => { if (confirm('This will permanently delete ALL your data. Continue?')) { localStorage.clear(); window.location.reload(); } }}
                className="text-xs px-4 py-2 rounded-xl font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                Clear all data
              </button>
            </div>
          </div>

        </div>

        {/* Save */}
        <button onClick={save}
          className="mt-6 flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
          style={saved
            ? { background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.35)' }
            : { background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
          {saved ? <CheckCircle2 size={16} strokeWidth={2} /> : null}
          {saved ? 'Saved!' : 'Save settings'}
        </button>
      </div>
    </div>
  );
}

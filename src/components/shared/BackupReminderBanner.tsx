import { useState, useEffect } from 'react';
import { HardDrive, X, Download } from 'lucide-react';
import { exportBackup, getBackupStatus } from '../../utils/backupIO';

export function BackupReminderBanner() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<{ daysSince: number | null; lastBackupAt: string | null }>({ daysSince: null, lastBackupAt: null });

  useEffect(() => {
    const s = getBackupStatus();
    setStatus(s);
    // Show if never backed up, or last backup was 7+ days ago
    if (s.daysSince === null || s.daysSince >= 7) {
      // Small delay so it doesn't flash on first paint
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const handleBackup = () => {
    exportBackup();
    setStatus(getBackupStatus());
    setVisible(false);
  };

  if (!visible) return null;

  const message = status.lastBackupAt
    ? `Last backup was ${status.daysSince} day${status.daysSince !== 1 ? 's' : ''} ago (${status.lastBackupAt}).`
    : "You haven't backed up your data yet.";

  return (
    <div
      className="fixed bottom-5 right-5 z-40 flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-xl max-w-sm"
      style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        animation: 'fade-up 0.25s ease forwards',
      }}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'rgba(99,102,241,0.2)' }}>
        <HardDrive size={15} className="text-indigo-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-snug">Weekly backup due</p>
        <p className="text-xs text-slate-400 mt-0.5 leading-snug">{message}</p>
        <button
          onClick={handleBackup}
          className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff' }}>
          <Download size={12} /> Back up now
        </button>
      </div>

      <button
        onClick={() => setVisible(false)}
        className="text-slate-500 hover:text-slate-300 transition-colors shrink-0 mt-0.5">
        <X size={15} />
      </button>
    </div>
  );
}

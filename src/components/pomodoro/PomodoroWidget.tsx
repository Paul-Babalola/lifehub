import { X, Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { LiquidOrb } from '../shared/LiquidOrb';
import type { PomodoroMode } from '../../hooks/usePomodoro';

const MODES: { key: PomodoroMode; label: string }[] = [
  { key: 'focus',      label: 'Focus'       },
  { key: 'shortBreak', label: 'Short Break' },
  { key: 'longBreak',  label: 'Long Break'  },
];

const MODE_ACCENT: Record<PomodoroMode, string> = {
  focus:      '#6366f1',
  shortBreak: '#10b981',
  longBreak:  '#0ea5e9',
};

interface Props {
  mode: PomodoroMode;
  minutes: string;
  seconds: string;
  progress: number;
  isRunning: boolean;
  sessions: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  onSwitchMode: (m: PomodoroMode) => void;
  onClose: () => void;
}

export function PomodoroWidget({ mode, minutes, seconds, progress, isRunning, sessions, onStart, onPause, onReset, onSkip, onSwitchMode, onClose }: Props) {
  const accent = MODE_ACCENT[mode];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(6,8,20,0.85)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="relative flex flex-col items-center gap-6 px-8 py-8 rounded-3xl"
        style={{
          background: 'linear-gradient(160deg, #0d0f1f 0%, #0f172a 100%)',
          boxShadow: `0 0 80px ${accent}30, 0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)`,
          border: `1px solid ${accent}25`,
          width: 360,
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Mode tabs */}
        <div className="flex gap-1 p-1 rounded-2xl w-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {MODES.map(m => (
            <button
              key={m.key}
              onClick={() => onSwitchMode(m.key)}
              className="flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all"
              style={mode === m.key
                ? { background: accent, color: 'white', boxShadow: `0 2px 8px ${accent}60` }
                : { color: '#64748b' }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Orb */}
        <LiquidOrb
          progress={progress}
          mode={mode}
          size={220}
          timeLabel={`${minutes}:${seconds}`}
          isRunning={isRunning}
        />

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={onReset}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            title="Reset"
          >
            <RotateCcw size={16} />
          </button>

          <button
            onClick={isRunning ? onPause : onStart}
            className="w-16 h-16 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 4px 24px ${accent}60` }}
          >
            {isRunning ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
          </button>

          <button
            onClick={onSkip}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            title="Skip"
          >
            <SkipForward size={16} />
          </button>
        </div>

        {/* Session dots */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-all"
                style={i < (sessions % 4)
                  ? { background: accent, boxShadow: `0 0 6px ${accent}` }
                  : { background: 'rgba(255,255,255,0.12)' }}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500">
            {sessions} session{sessions !== 1 ? 's' : ''} completed
          </p>
        </div>
      </div>
    </div>
  );
}

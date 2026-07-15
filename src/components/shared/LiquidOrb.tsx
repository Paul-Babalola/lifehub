import type { PomodoroMode } from '../../hooks/usePomodoro';

const COLORS: Record<PomodoroMode, { fill: string; glow: string; wave1: string; wave2: string }> = {
  focus:      { fill: '#6366f1', glow: '#818cf8', wave1: 'rgba(99,102,241,0.85)',  wave2: 'rgba(139,92,246,0.6)'  },
  shortBreak: { fill: '#10b981', glow: '#34d399', wave1: 'rgba(16,185,129,0.85)',  wave2: 'rgba(52,211,153,0.6)'  },
  longBreak:  { fill: '#0ea5e9', glow: '#38bdf8', wave1: 'rgba(14,165,233,0.85)',  wave2: 'rgba(56,189,248,0.6)'  },
};

interface Props {
  progress: number;   // 1 = full (start of session) → 0 = empty (done)
  mode: PomodoroMode;
  size?: number;
  timeLabel: string;
  isRunning: boolean;
}

export function LiquidOrb({ progress, mode, size = 260, timeLabel, isRunning }: Props) {
  const { fill, glow, wave1, wave2 } = COLORS[mode];

  // fillY: Y coord of liquid surface (SVG viewBox 0-200)
  // progress=1 → fillY≈12 (near top), progress=0 → fillY=200 (empty)
  const fillY = 12 + (1 - Math.max(0, Math.min(1, progress))) * 180;

  // Each wave spans -200 to 400 (600px), period=200px → seamless -200px translate loop
  const mkWave = (yo: number) =>
    `M-200,${fillY + yo}` +
    ` C-175,${fillY + yo - 10} -125,${fillY + yo - 10} -100,${fillY + yo}` +
    ` C-75,${fillY + yo + 10}  -25,${fillY + yo + 10}  0,${fillY + yo}` +
    ` C25,${fillY + yo - 10}   75,${fillY + yo - 10}   100,${fillY + yo}` +
    ` C125,${fillY + yo + 10}  175,${fillY + yo + 10}  200,${fillY + yo}` +
    ` C225,${fillY + yo - 10}  275,${fillY + yo - 10}  300,${fillY + yo}` +
    ` C325,${fillY + yo + 10}  375,${fillY + yo + 10}  400,${fillY + yo}` +
    ` L400,210 L-200,210 Z`;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: -32, borderRadius: '50%',
        background: `radial-gradient(circle, ${fill}50 0%, transparent 65%)`,
        filter: 'blur(28px)',
        opacity: isRunning ? 1 : 0.35,
        transition: 'opacity 0.6s ease',
        pointerEvents: 'none',
      }} />

      <svg viewBox="0 0 200 200" width={size} height={size} style={{ overflow: 'visible', display: 'block' }}>
        <defs>
          <clipPath id="orb-clip">
            <circle cx="100" cy="100" r="88" />
          </clipPath>
          <radialGradient id="orb-grad" cx="38%" cy="32%" r="70%">
            <stop offset="0%"   stopColor={fill} stopOpacity="0.25" />
            <stop offset="100%" stopColor="#060b18" stopOpacity="1" />
          </radialGradient>
          <radialGradient id="shine-grad" cx="50%" cy="50%">
            <stop offset="0%"   stopColor="white" stopOpacity="0.12" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Dark background */}
        <circle cx="100" cy="100" r="88" fill="url(#orb-grad)" />

        {/* Liquid fill */}
        <g clipPath="url(#orb-clip)">
          {/* Base fill rectangle */}
          <rect x="-10" y={fillY + 4} width="220" height={200} fill={fill} opacity="0.45" />

          {/* Animated wave 1 */}
          <g style={{ animation: isRunning ? 'wave1 3s linear infinite' : 'none', willChange: 'transform' }}>
            <path d={mkWave(0)} fill={wave1} />
          </g>

          {/* Animated wave 2 — slightly behind, slower */}
          <g style={{ animation: isRunning ? 'wave2 5s linear infinite' : 'none', willChange: 'transform' }}>
            <path d={mkWave(6)} fill={wave2} />
          </g>
        </g>

        {/* Inner shine highlight */}
        <ellipse cx="72" cy="56" rx="24" ry="14" fill="url(#shine-grad)" transform="rotate(-25 72 56)" clipPath="url(#orb-clip)" />

        {/* Outer rings */}
        <circle cx="100" cy="100" r="90" fill="none" stroke={glow}  strokeWidth="1.5" opacity="0.45" />
        <circle cx="100" cy="100" r="94" fill="none" stroke={fill}  strokeWidth="0.5" opacity="0.18" />
      </svg>

      {/* Time label */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <span style={{
          fontSize: Math.round(size * 0.185),
          fontWeight: 800,
          color: 'white',
          letterSpacing: '-2px',
          fontVariantNumeric: 'tabular-nums',
          textShadow: `0 0 24px ${fill}cc, 0 2px 8px rgba(0,0,0,0.6)`,
          lineHeight: 1,
          fontFamily: 'system-ui, sans-serif',
        }}>
          {timeLabel}
        </span>
      </div>
    </div>
  );
}

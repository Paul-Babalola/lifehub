import { useState, useEffect, useRef, useCallback } from 'react';

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export const POMODORO_DURATIONS: Record<PomodoroMode, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export function usePomodoro() {
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const modeRef = useRef(mode);
  const sessionsRef = useRef(sessions);
  modeRef.current = mode;
  sessionsRef.current = sessions;

  const notify = (title: string, body: string) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  const tick = useCallback(() => {
    setSecondsLeft(prev => {
      if (prev <= 1) {
        setIsRunning(false);
        if (modeRef.current === 'focus') {
          const next = sessionsRef.current + 1;
          setSessions(next);
          notify('Focus session complete! 🎉', 'Time for a well-earned break.');
        } else {
          notify('Break over!', 'Ready to focus again? 💪');
        }
        return 0;
      }
      return prev - 1;
    });
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isRunning, tick]);

  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);

  const reset = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(POMODORO_DURATIONS[modeRef.current]);
  }, []);

  const skip = useCallback(() => {
    setIsRunning(false);
    if (modeRef.current === 'focus') {
      const next = sessionsRef.current + 1;
      setSessions(next);
      const nextMode: PomodoroMode = next % 4 === 0 ? 'longBreak' : 'shortBreak';
      setMode(nextMode);
      setSecondsLeft(POMODORO_DURATIONS[nextMode]);
    } else {
      setMode('focus');
      setSecondsLeft(POMODORO_DURATIONS.focus);
    }
  }, []);

  const switchMode = useCallback((m: PomodoroMode) => {
    setIsRunning(false);
    setMode(m);
    setSecondsLeft(POMODORO_DURATIONS[m]);
  }, []);

  const total = POMODORO_DURATIONS[mode];
  const progress = total > 0 ? secondsLeft / total : 0;
  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const seconds = (secondsLeft % 60).toString().padStart(2, '0');

  return { mode, secondsLeft, total, progress, isRunning, sessions, minutes, seconds, start, pause, reset, skip, switchMode };
}

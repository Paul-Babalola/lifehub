import { useState } from 'react';
import { Check, X, Flame, Copy, LogOut } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useAccountability } from '../../hooks/useAccountability';
import { useHabits } from '../../hooks/useHabits';

const TODAY = format(new Date(), 'yyyy-MM-dd');
const LAST_7 = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'));
const cardShadow = { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' };

interface Props {
  userId: string | null;
  displayName: string | null;
}

export function AccountabilityView({ userId, displayName }: Props) {
  const { habits } = useHabits();
  const {
    isConfigured, pairs, pendingPairs, loading, error, setError,
    joinByCode, toggleLog, isLogged, getStreak, getSharedStreak, leavePair, cancelPending,
  } = useAccountability(userId, displayName);

  const [joinOpen, setJoinOpen] = useState(false);
  const [code, setCode] = useState('');
  const [selectedHabitId, setSelectedHabitId] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  if (!isConfigured) {
    return (
      <div className="bg-white rounded-3xl p-14 text-center" style={cardShadow}>
        <div className="text-4xl mb-3">🤝</div>
        <p className="font-semibold text-gray-700">Sign in to use accountability partners</p>
        <p className="text-sm text-gray-400 mt-1">Accountability features require an account to sync with your partner.</p>
      </div>
    );
  }

  const handleJoin = async () => {
    if (!code.trim() || !selectedHabitId) return;
    setJoinError('');
    setJoining(true);
    const ok = await joinByCode(code.trim(), selectedHabitId);
    setJoining(false);
    if (!ok) {
      setJoinError(error ?? 'Failed to join. Check the code and try again.');
      setError(null);
    } else {
      setCode(''); setSelectedHabitId(''); setJoinOpen(false);
    }
  };

  const copyCode = (c: string) => {
    navigator.clipboard.writeText(c);
    setCopied(c);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">

      {/* Join by code */}
      <div className="bg-white rounded-3xl p-5" style={cardShadow}>
        <p className="text-sm font-semibold text-gray-700 mb-3">Join a partner</p>
        {!joinOpen ? (
          <button
            onClick={() => setJoinOpen(true)}
            className="w-full py-2.5 text-sm font-semibold text-indigo-600 border-2 border-dashed border-indigo-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
            Enter invite code
          </button>
        ) : (
          <div className="space-y-3">
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABC123"
              maxLength={6}
              className="w-full text-center text-xl tracking-widest font-mono px-3.5 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all uppercase"
              autoFocus
            />
            <select
              value={selectedHabitId}
              onChange={e => setSelectedHabitId(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-indigo-400 transition-all">
              <option value="">Select your habit to link</option>
              {habits.map(h => <option key={h.id} value={h.id}>{h.icon} {h.name}</option>)}
            </select>
            {joinError && <p className="text-xs text-red-500 text-center">{joinError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => { setJoinOpen(false); setCode(''); setJoinError(''); }}
                className="flex-1 py-2 text-sm font-semibold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleJoin}
                disabled={!code.trim() || !selectedHabitId || joining}
                className="flex-1 py-2 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                {joining ? 'Joining…' : 'Join'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pending outgoing invites */}
      {pendingPairs.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">Waiting for partner</p>
          {pendingPairs.map(p => (
            <div key={p.id} className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 mb-2" style={cardShadow}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{p.habitName}</p>
                <p className="text-xs text-indigo-500 font-mono tracking-widest mt-0.5">{p.inviteCode}</p>
              </div>
              <button
                onClick={() => copyCode(p.inviteCode)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 text-indigo-600 bg-indigo-50 rounded-lg font-semibold hover:bg-indigo-100 transition-colors shrink-0">
                <Copy size={11} />
                {copied === p.inviteCode ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => cancelPending(p.id)}
                className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {pairs.length === 0 && pendingPairs.length === 0 && !loading && (
        <div className="bg-white rounded-3xl p-14 text-center" style={cardShadow}>
          <div className="text-4xl mb-3">🤝</div>
          <p className="font-semibold text-gray-700">No accountability partners yet</p>
          <p className="text-sm text-gray-400 mt-1 leading-relaxed">
            Share a habit using the <span className="font-semibold text-indigo-500">share button</span> in the Habits tab,
            then send the code to a friend.
          </p>
        </div>
      )}

      {loading && pairs.length === 0 && (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 rounded-full border-2 border-indigo-200 border-t-indigo-500 animate-spin" />
        </div>
      )}

      {/* Active pairs */}
      {pairs.map(pair => {
        const partnerId = pair.user1Id === userId ? pair.user2Id! : pair.user1Id;
        const partnerName = pair.user1Id === userId ? (pair.user2Name ?? 'Partner') : pair.user1Name;
        const myStreak = getStreak(pair.id, userId!);
        const partnerStreak = getStreak(pair.id, partnerId);
        const sharedStreak = getSharedStreak(pair.id, userId!, partnerId);
        const todayDone = isLogged(pair.id, userId!, TODAY);
        const partnerDoneToday = isLogged(pair.id, partnerId, TODAY);

        return (
          <div key={pair.id} className="bg-white rounded-3xl p-5 group" style={cardShadow}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-gray-900">{pair.habitName}</p>
                <p className="text-xs text-gray-400 mt-0.5">with {partnerName}</p>
              </div>
              <button
                onClick={() => leavePair(pair.id)}
                className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-gray-300 hover:text-red-400 transition-all mt-0.5">
                <LogOut size={12} />
                Leave
              </button>
            </div>

            {/* Shared streak */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                style={sharedStreak > 0
                  ? { background: 'linear-gradient(135deg, #6366f120, #10b98120)', color: sharedStreak >= 7 ? '#f97316' : '#6366f1' }
                  : { background: '#f1f5f9', color: '#9ca3af' }}>
                <span>{sharedStreak > 0 ? '🤝' : '—'}</span>
                <span>Together: {sharedStreak} day{sharedStreak !== 1 ? 's' : ''}</span>
                {sharedStreak >= 7 && <Flame size={11} className="text-orange-400" />}
              </div>
            </div>

            {/* Day column headers */}
            <div className="flex items-center gap-2 mb-2 pl-20">
              {LAST_7.map(d => (
                <div key={d} className="w-7 text-center text-[10px] font-bold text-gray-300">
                  {format(new Date(d + 'T12:00:00'), 'EEEEE')}
                </div>
              ))}
              <div className="w-8 text-[10px] font-bold text-gray-300 text-center">🔥</div>
            </div>

            {/* My row */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-20 text-xs font-semibold text-gray-700 truncate shrink-0">You</div>
              {LAST_7.map(d => {
                const logged = isLogged(pair.id, userId!, d);
                const isToday_ = d === TODAY;
                return (
                  <button
                    key={d}
                    onClick={() => toggleLog(pair.id, d)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shrink-0 ${isToday_ ? 'ring-2 ring-offset-1 ring-indigo-300' : ''}`}
                    style={logged ? { background: '#6366f1' } : { background: '#f1f5f9' }}>
                    {logged && <Check size={10} strokeWidth={3} color="white" />}
                  </button>
                );
              })}
              <div className="w-8 flex items-center justify-center gap-0.5 shrink-0">
                {myStreak > 0 && <Flame size={11} className="text-orange-400" />}
                <span className={`text-sm font-bold tabular-nums ${myStreak >= 7 ? 'text-orange-500' : myStreak >= 3 ? 'text-amber-500' : 'text-gray-400'}`}>
                  {myStreak}
                </span>
              </div>
            </div>

            {/* Partner row */}
            <div className="flex items-center gap-2">
              <div className="w-20 text-xs font-semibold text-gray-400 truncate shrink-0">
                {partnerName.split(' ')[0]}
              </div>
              {LAST_7.map(d => {
                const logged = isLogged(pair.id, partnerId, d);
                return (
                  <div
                    key={d}
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={logged ? { background: '#10b981' } : { background: '#f1f5f9' }}>
                    {logged && <Check size={10} strokeWidth={3} color="white" />}
                  </div>
                );
              })}
              <div className="w-8 flex items-center justify-center gap-0.5 shrink-0">
                {partnerStreak > 0 && <Flame size={11} className="text-orange-400" />}
                <span className={`text-sm font-bold tabular-nums ${partnerStreak >= 7 ? 'text-orange-500' : partnerStreak >= 3 ? 'text-amber-500' : 'text-gray-400'}`}>
                  {partnerStreak}
                </span>
              </div>
            </div>

            {/* Status / CTA */}
            <div className="mt-4">
              {todayDone ? (
                <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50 rounded-xl">
                  <span className="text-sm font-semibold text-emerald-600">✓ You checked in today</span>
                  {!partnerDoneToday && (
                    <span className="text-xs text-amber-500 font-medium">Waiting for {partnerName.split(' ')[0]}</span>
                  )}
                  {partnerDoneToday && (
                    <span className="text-xs text-emerald-500 font-medium">Both done! 🎉</span>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => toggleLog(pair.id, TODAY)}
                  className="w-full py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 12px rgba(99,102,241,0.25)' }}>
                  Check in today ✓
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

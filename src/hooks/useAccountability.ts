import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { format, subDays } from 'date-fns';
import type { AccountabilityPair, AccountabilityLog } from '../types';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePair(row: any): AccountabilityPair {
  return {
    id: row.id,
    inviteCode: row.invite_code,
    habitName: row.habit_name,
    user1Id: row.user1_id,
    user1Name: row.user1_name,
    user1HabitId: row.user1_habit_id,
    user2Id: row.user2_id ?? null,
    user2Name: row.user2_name ?? null,
    user2HabitId: row.user2_habit_id ?? null,
    status: row.status,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeLog(row: any): AccountabilityLog {
  return { id: row.id, pairId: row.pair_id, userId: row.user_id, date: row.date };
}

export function useAccountability(userId: string | null, displayName: string | null) {
  const [pairs, setPairs] = useState<AccountabilityPair[]>([]);
  const [pendingPairs, setPendingPairs] = useState<AccountabilityPair[]>([]);
  const [logs, setLogs] = useState<AccountabilityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfigured = supabase !== null && userId !== null;

  const fetchAll = useCallback(async () => {
    if (!supabase || !userId) return;
    setLoading(true);
    try {
      const { data: pairsData, error: pErr } = await supabase
        .from('accountability_pairs')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
      if (pErr) throw pErr;

      const all = (pairsData ?? []).map(normalizePair);
      const active = all.filter(p => p.status === 'active');
      setPairs(active);
      setPendingPairs(all.filter(p => p.status === 'pending'));

      if (active.length > 0) {
        const { data: logsData, error: lErr } = await supabase
          .from('accountability_logs')
          .select('*')
          .in('pair_id', active.map(p => p.id));
        if (lErr) throw lErr;
        setLogs((logsData ?? []).map(normalizeLog));
      } else {
        setLogs([]);
      }
    } catch (e) {
      console.error('[Accountability] fetch failed', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isConfigured) fetchAll();
  }, [isConfigured, fetchAll]);

  useEffect(() => {
    if (!supabase || !userId) return;
    // Unique name per mount avoids StrictMode reuse of an already-subscribed channel
    const channel = supabase
      .channel(`accountability:${userId}:${Date.now()}`)
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'accountability_pairs' }, fetchAll)
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'accountability_logs' }, fetchAll)
      .subscribe();
    return () => { supabase!.removeChannel(channel); };
  }, [userId, fetchAll]);

  const createShare = useCallback(async (habitId: string, habitName: string): Promise<string | null> => {
    if (!supabase || !userId) return null;
    setError(null);
    const code = generateCode();
    const { error: err } = await supabase.from('accountability_pairs').insert({
      invite_code: code,
      habit_name: habitName,
      user1_id: userId,
      user1_name: displayName ?? 'You',
      user1_habit_id: habitId,
      status: 'pending',
    });
    if (err) { setError(err.message); return null; }
    await fetchAll();
    return code;
  }, [userId, displayName, fetchAll]);

  const joinByCode = useCallback(async (code: string, myHabitId: string): Promise<boolean> => {
    if (!supabase || !userId) return false;
    setError(null);
    const { data, error: fetchErr } = await supabase
      .from('accountability_pairs')
      .select('*')
      .eq('invite_code', code.toUpperCase())
      .eq('status', 'pending')
      .single();
    if (fetchErr || !data) { setError('Code not found or already used'); return false; }
    if (data.user1_id === userId) { setError('You cannot join your own invitation'); return false; }

    const { error: updateErr } = await supabase
      .from('accountability_pairs')
      .update({
        user2_id: userId,
        user2_name: displayName ?? 'Partner',
        user2_habit_id: myHabitId,
        status: 'active',
      })
      .eq('id', data.id);
    if (updateErr) { setError(updateErr.message); return false; }
    await fetchAll();
    return true;
  }, [userId, displayName, fetchAll]);

  const toggleLog = useCallback(async (pairId: string, date: string) => {
    if (!supabase || !userId) return;
    const exists = logs.some(l => l.pairId === pairId && l.userId === userId && l.date === date);
    if (exists) {
      await supabase.from('accountability_logs').delete()
        .eq('pair_id', pairId).eq('user_id', userId).eq('date', date);
      setLogs(prev => prev.filter(l => !(l.pairId === pairId && l.userId === userId && l.date === date)));
    } else {
      const { data } = await supabase.from('accountability_logs').insert({
        pair_id: pairId, user_id: userId, date,
      }).select().single();
      if (data) setLogs(prev => [...prev, normalizeLog(data)]);
    }
  }, [userId, logs]);

  const isLogged = useCallback((pairId: string, uid: string, date: string) =>
    logs.some(l => l.pairId === pairId && l.userId === uid && l.date === date),
  [logs]);

  const getStreak = useCallback((pairId: string, uid: string): number => {
    let streak = 0;
    let d = new Date();
    while (true) {
      const dateStr = format(d, 'yyyy-MM-dd');
      if (!logs.some(l => l.pairId === pairId && l.userId === uid && l.date === dateStr)) break;
      streak++;
      d = subDays(d, 1);
    }
    return streak;
  }, [logs]);

  const leavePair = useCallback(async (pairId: string) => {
    if (!supabase || !userId) return;
    await supabase.from('accountability_logs').delete().eq('pair_id', pairId).eq('user_id', userId);
    const pair = pairs.find(p => p.id === pairId);
    if (!pair) return;
    if (pair.user1Id === userId) {
      await supabase.from('accountability_pairs').delete().eq('id', pairId);
    } else {
      await supabase.from('accountability_pairs').update({
        user2_id: null, user2_name: null, user2_habit_id: null, status: 'pending',
      }).eq('id', pairId);
    }
    await fetchAll();
  }, [userId, pairs, fetchAll]);

  const cancelPending = useCallback(async (pairId: string) => {
    if (!supabase) return;
    await supabase.from('accountability_pairs').delete().eq('id', pairId);
    await fetchAll();
  }, [fetchAll]);

  const getSharedStreak = useCallback((pairId: string, uid1: string, uid2: string): number => {
    let streak = 0;
    let d = new Date();
    while (true) {
      const dateStr = format(d, 'yyyy-MM-dd');
      const bothLogged =
        logs.some(l => l.pairId === pairId && l.userId === uid1 && l.date === dateStr) &&
        logs.some(l => l.pairId === pairId && l.userId === uid2 && l.date === dateStr);
      if (!bothLogged) break;
      streak++;
      d = subDays(d, 1);
    }
    return streak;
  }, [logs]);

  // Number of active pairs where partner hasn't checked in and it's past 8pm
  const nudgeCount = useMemo(() => {
    if (!userId || new Date().getHours() < 20) return 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    return pairs.filter(pair => {
      const partnerId = pair.user1Id === userId ? pair.user2Id! : pair.user1Id;
      return !logs.some(l => l.pairId === pair.id && l.userId === partnerId && l.date === today);
    }).length;
  }, [pairs, logs, userId]);

  // Fire a browser notification once per day after 8pm when a partner hasn't checked in
  useEffect(() => {
    if (!userId || pairs.length === 0 || new Date().getHours() < 20) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const nudgeKey = `lh-accountability-nudged-${today}`;
    if (localStorage.getItem(nudgeKey)) return;

    const missing = pairs.filter(pair => {
      const partnerId = pair.user1Id === userId ? pair.user2Id! : pair.user1Id;
      return !logs.some(l => l.pairId === pair.id && l.userId === partnerId && l.date === today);
    });
    if (missing.length === 0) return;

    missing.forEach(pair => {
      const partnerName = pair.user1Id === userId ? (pair.user2Name ?? 'Your partner') : pair.user1Name;
      new Notification(`${partnerName} hasn't checked in yet`, {
        body: `Give them a nudge for "${pair.habitName}" before the day ends!`,
        icon: '/favicon.ico',
      });
    });
    localStorage.setItem(nudgeKey, '1');
  }, [userId, pairs, logs]);

  return {
    isConfigured,
    pairs,
    pendingPairs,
    logs,
    loading,
    error,
    setError,
    createShare,
    joinByCode,
    toggleLog,
    isLogged,
    getStreak,
    getSharedStreak,
    nudgeCount,
    leavePair,
    cancelPending,
  };
}

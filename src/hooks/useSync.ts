import { useState, useCallback, useEffect, useRef } from "react";
import { supabase, supabaseUrl, supabaseAnonKey } from "../lib/supabase";

type JSONObject = Record<string, unknown>;

function mergeArrays(local: JSONObject[], remote: JSONObject[]): JSONObject[] {
  const itemKey = (item: JSONObject): string =>
    typeof item.id === "string" ? item.id : JSON.stringify(item);

  const merged = new Map<string, JSONObject>();
  for (const item of remote) merged.set(itemKey(item), item);

  for (const item of local) {
    const key = itemKey(item);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, item);
    } else {
      const localTs = item.updatedAt as string | undefined;
      const remoteTs = existing.updatedAt as string | undefined;
      // Prefer newer updatedAt; if neither has it, local wins
      if (!localTs || !remoteTs || localTs >= remoteTs) {
        merged.set(key, item);
      }
    }
  }

  return Array.from(merged.values());
}

function mergeData(local: unknown, remote: unknown): unknown {
  if (Array.isArray(local) && Array.isArray(remote)) {
    return mergeArrays(local as JSONObject[], remote as JSONObject[]);
  }
  if (
    local !== null && remote !== null &&
    typeof local === "object" && typeof remote === "object" &&
    !Array.isArray(local) && !Array.isArray(remote)
  ) {
    // Plain object (e.g. lh-settings): field-level merge, local wins
    return { ...(remote as JSONObject), ...(local as JSONObject) };
  }
  return local ?? remote;
}

export const SYNC_KEYS = [
  "lh-tasks",
  "lh-projects",
  "lh-transactions",
  "lh-budgets",
  "lh-goals",
  "lh-life-goals",
  "lh-grocery",
  "lh-notes",
  "lh-habits",
  "lh-habit-logs",
  "lh-journal",
  "lh-bookmarks",
  "lh-mood",
  "lh-settings",
];

export type SyncStatus =
  | "idle"
  | "syncing"
  | "synced"
  | "error"
  | "unconfigured";

export function useSync(userId: string | null) {
  const isConfigured = supabase !== null && userId !== null;
  const [status, setStatus] = useState<SyncStatus>(
    isConfigured ? "idle" : "unconfigured",
  );
  const [lastSynced, setLastSynced] = useState<string | null>(() =>
    localStorage.getItem("lh-last-cloud-sync"),
  );
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accessTokenRef = useRef<string | null>(null);

  // Keep a fresh access token cached for use in beforeunload
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      accessTokenRef.current = data.session?.access_token ?? null;
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      accessTokenRef.current = session?.access_token ?? null;
    });
    return () => subscription.unsubscribe();
  }, []);

  const push = useCallback(async (): Promise<boolean> => {
    if (!supabase || !userId) return false;
    setStatus("syncing");

    // Use native setItem to bypass the patch and avoid re-triggering pushes
    const nativeSet = Object.getPrototypeOf(localStorage).setItem as (
      this: Storage, key: string, value: string
    ) => void;

    try {
      // Fetch remote state first so we can merge instead of overwrite
      const { data: remoteRows, error: fetchError } = await supabase
        .from("lifehub_data")
        .select("key, value")
        .eq("user_id", userId);
      if (fetchError) throw fetchError;

      const remoteMap = new Map<string, unknown>(
        (remoteRows ?? []).map(r => [r.key as string, r.value])
      );

      const rows: { user_id: string; key: string; value: unknown; synced_at: string }[] = [];
      let didMergeNewItems = false;

      for (const key of SYNC_KEYS) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const local = JSON.parse(raw) as unknown;
          const remote = remoteMap.get(key);
          const merged = remote !== undefined ? mergeData(local, remote) : local;
          rows.push({ user_id: userId, key, value: merged, synced_at: new Date().toISOString() });
          // Write merged state back to localStorage so the UI reflects remote additions
          const mergedStr = JSON.stringify(merged);
          if (mergedStr !== raw) {
            nativeSet.call(localStorage, key, mergedStr);
            didMergeNewItems = true;
          }
        } catch {
          // skip malformed entries
        }
      }

      if (didMergeNewItems) {
        window.dispatchEvent(new CustomEvent("lh:storage-updated"));
      }

      const { error } = await supabase
        .from("lifehub_data")
        .upsert(rows, { onConflict: "user_id,key" });
      if (error) throw error;

      const ts = new Date().toISOString();
      localStorage.setItem("lh-last-cloud-sync", ts);
      setLastSynced(ts);
      setStatus("synced");
      return true;
    } catch (err) {
      console.error("[LifeHub] Sync push failed:", err);
      setStatus("error");
      return false;
    }
  }, [userId]);

  const pull = useCallback(async (): Promise<boolean> => {
    if (!supabase || !userId) return false;
    // Push first (which merges) — abort if it fails so we don't overwrite with stale data
    const pushed = await push();
    if (!pushed) return false;
    setStatus("syncing");

    try {
      const { data, error } = await supabase
        .from("lifehub_data")
        .select("key, value")
        .eq("user_id", userId);

      if (error) throw error;

      if (data && data.length > 0) {
        for (const row of data) {
          if (row.value != null) {
            localStorage.setItem(row.key as string, JSON.stringify(row.value));
          }
        }
        const ts = new Date().toISOString();
        localStorage.setItem("lh-last-cloud-sync", ts);
        setLastSynced(ts);
        setStatus("synced");
        return true;
      }

      setStatus("synced");
      return false;
    } catch (err) {
      console.error("[LifeHub] Sync pull failed:", err);
      setStatus("error");
      return false;
    }
  }, [userId]);

  // Patch localStorage.setItem to detect data changes
  useEffect(() => {
    if (!isConfigured) return;
    const original = localStorage.setItem.bind(localStorage);
    localStorage.setItem = (key: string, value: string) => {
      original(key, value);
      if (SYNC_KEYS.includes(key)) {
        window.dispatchEvent(new CustomEvent("lifehub:data-changed"));
      }
    };
    return () => {
      localStorage.setItem = original;
    };
  }, [isConfigured]);

  // Debounced push on data changes
  useEffect(() => {
    if (!isConfigured) return;
    const handler = () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => push(), 4000);
    };
    window.addEventListener("lifehub:data-changed", handler);
    return () => {
      window.removeEventListener("lifehub:data-changed", handler);
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [isConfigured, push]);

  // Periodic push every 60 seconds
  useEffect(() => {
    if (!isConfigured) return;
    const interval = setInterval(() => push(), 60_000);
    return () => clearInterval(interval);
  }, [isConfigured, push]);

  // Push when tab loses focus
  useEffect(() => {
    if (!isConfigured) return;
    const handler = () => {
      if (document.hidden) push();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [isConfigured, push]);

  // Keepalive push on page close — survives tab teardown unlike async push()
  useEffect(() => {
    if (!supabase || !userId || !supabaseUrl || !supabaseAnonKey) return;
    const handler = () => {
      const token = accessTokenRef.current;
      if (!token) return;
      const rows = SYNC_KEYS.map((key) => {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        try { return { user_id: userId, key, value: JSON.parse(raw), synced_at: new Date().toISOString() }; }
        catch { return null; }
      }).filter((r): r is NonNullable<typeof r> => r !== null);
      if (rows.length === 0) return;
      fetch(`${supabaseUrl}/rest/v1/lifehub_data`, {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "apikey": supabaseAnonKey as string,
          "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(rows),
      });
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Realtime subscription — apply remote changes from other devices without a reload
  useEffect(() => {
    if (!supabase || !userId) return;

    const nativeSet = Object.getPrototypeOf(localStorage).setItem as (
      this: Storage, key: string, value: string
    ) => void;

    const channel = supabase
      .channel(`lifehub:${userId}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("postgres_changes" as any, {
          event: "*",
          schema: "public",
          table: "lifehub_data",
          filter: `user_id=eq.${userId}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const row = payload.new as { key?: string; value?: unknown };
          if (!row.key || !SYNC_KEYS.includes(row.key) || row.value == null) return;
          // Bypass the patched setItem so we don't trigger another push
          nativeSet.call(localStorage, row.key, JSON.stringify(row.value));
          window.dispatchEvent(new CustomEvent("lh:storage-updated"));
        }
      )
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { isConfigured, status, lastSynced, push, pull };
}

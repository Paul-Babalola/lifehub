import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

export const SYNC_KEYS = [
  "lh-tasks",
  "lh-projects",
  "lh-transactions",
  "lh-budgets",
  "lh-goals",
  "lh-grocery",
  "lh-notes",
  "lh-habits",
  "lh-habit-logs",
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

  const push = useCallback(async (): Promise<boolean> => {
    if (!supabase || !userId) return false;
    setStatus("syncing");

    try {
      const rows = SYNC_KEYS.map((key) => {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        try {
          return {
            user_id: userId,
            key,
            value: JSON.parse(raw),
            synced_at: new Date().toISOString(),
          };
        } catch {
          return null;
        }
      }).filter((r): r is NonNullable<typeof r> => r !== null);

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

  return { isConfigured, status, lastSynced, push, pull };
}

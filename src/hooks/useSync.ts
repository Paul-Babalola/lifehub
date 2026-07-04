import { useState, useCallback, useEffect, useRef } from "react";
import { getSupabase } from "../lib/supabase";

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

const SYNC_CONFIG_KEY = "lh-sync-config";
const USER_ID_KEY = "lh-sync-user-id";

export interface SyncConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export function getSyncConfig(): SyncConfig {
  try {
    const raw = localStorage.getItem(SYNC_CONFIG_KEY);
    if (!raw) return { supabaseUrl: "", supabaseAnonKey: "" };
    return JSON.parse(raw) as SyncConfig;
  } catch {
    return { supabaseUrl: "", supabaseAnonKey: "" };
  }
}

export function saveSyncConfig(config: SyncConfig): void {
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(config));
}

export function getSyncUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export type SyncStatus =
  | "idle"
  | "syncing"
  | "synced"
  | "error"
  | "unconfigured";

export function useSync(config: SyncConfig) {
  const [status, setStatus] = useState<SyncStatus>(
    config.supabaseUrl && config.supabaseAnonKey ? "idle" : "unconfigured",
  );
  const [lastSynced, setLastSynced] = useState<string | null>(() =>
    localStorage.getItem("lh-last-cloud-sync"),
  );
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isConfigured = !!(config.supabaseUrl && config.supabaseAnonKey);

  const push = useCallback(async (): Promise<boolean> => {
    const sb = getSupabase(config.supabaseUrl, config.supabaseAnonKey);
    if (!sb) return false;

    const userId = getSyncUserId();
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

      const { error } = await sb
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
  }, [config.supabaseUrl, config.supabaseAnonKey]);

  const pull = useCallback(async (): Promise<boolean> => {
    const sb = getSupabase(config.supabaseUrl, config.supabaseAnonKey);
    if (!sb) return false;

    const userId = getSyncUserId();
    setStatus("syncing");

    try {
      const { data, error } = await sb
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
  }, [config.supabaseUrl, config.supabaseAnonKey]);

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

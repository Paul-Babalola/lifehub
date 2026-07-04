import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;
let _url = "";
let _key = "";

export function getSupabase(url: string, key: string): SupabaseClient | null {
  if (!url || !key) return null;
  if (url !== _url || key !== _key || !_client) {
    _client = createClient(url, key);
    _url = url;
    _key = key;
  }
  return _client;
}

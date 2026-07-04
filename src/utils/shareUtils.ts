export type ShareDataType = 'tasks' | 'finance' | 'grocery' | 'notes';

export interface SharePayload {
  type: ShareDataType;
  version: 1;
  label: string;
  data: unknown[];
}

export function encodeSharePayload(payload: SharePayload): string {
  return btoa(encodeURIComponent(JSON.stringify(payload)));
}

export function decodeSharePayload(encoded: string): SharePayload | null {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded))) as SharePayload;
  } catch {
    return null;
  }
}

export function createShareUrl(payload: SharePayload): string {
  return `${window.location.origin}${window.location.pathname}?share=${encodeSharePayload(payload)}`;
}

export function getShareParam(): SharePayload | null {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('share');
  if (!raw) return null;
  return decodeSharePayload(raw);
}

export function clearShareParam(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('share');
  window.history.replaceState({}, '', url.toString());
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

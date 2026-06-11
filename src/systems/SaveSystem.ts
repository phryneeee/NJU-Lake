import type { SaveData } from './GameState';

const KEY = 'seventh-archive-save-v1';

/** Web 用 localStorage；接入 Capacitor 后替换为 @capacitor/preferences */
export function saveState(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('[Save] 写入失败', e);
  }
}

export function loadState(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SaveData) : null;
  } catch {
    return null;
  }
}

export function clearState(): void {
  localStorage.removeItem(KEY);
}

export function hasSave(): boolean {
  return localStorage.getItem(KEY) !== null;
}

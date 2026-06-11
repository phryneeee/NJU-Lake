import type { RoomDef, ItemDef } from '../types/room';
import itemsRaw from './items.json';

const roomModules = import.meta.glob<{ default: RoomDef }>('./rooms/**/*.json', {
  eager: true,
});

const rooms = new Map<string, RoomDef>();
for (const path of Object.keys(roomModules)) {
  const def = roomModules[path].default;
  if (rooms.has(def.id)) throw new Error(`房间 id 重复: ${def.id} (${path})`);
  rooms.set(def.id, def);
}

export function getRoom(id: string): RoomDef {
  const r = rooms.get(id);
  if (!r) throw new Error(`未找到房间: ${id}`);
  return r;
}

export function getAllRooms(): RoomDef[] {
  return [...rooms.values()];
}

const items = new Map<string, ItemDef>();
for (const item of itemsRaw as ItemDef[]) items.set(item.id, item);

export function getItem(id: string): ItemDef {
  const it = items.get(id);
  if (!it) throw new Error(`未找到物品: ${id}`);
  return it;
}

const dialogueModules = import.meta.glob<{ default: Record<string, string> }>(
  './dialogue/*.json',
  { eager: true },
);

const dialogue = new Map<string, string>();
for (const path of Object.keys(dialogueModules)) {
  const ns = path.replace(/^.*\/(\w+)\.json$/, '$1'); // ch1.json -> ch1
  const entries = dialogueModules[path].default;
  for (const key of Object.keys(entries)) dialogue.set(`${ns}.${key}`, entries[key]);
}

export function getText(textId: string): string {
  return dialogue.get(textId) ?? `【缺文案: ${textId}】`;
}

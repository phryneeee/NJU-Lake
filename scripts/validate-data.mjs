// 数据一致性校验：房间 JSON 引用的 flag / 物品 / 文案 / 房间 / 谜题是否都存在。
// 用法：node scripts/validate-data.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const errors = [];

// 已登记 flags（从 flags.ts 文本提取 key）
const flagsSrc = readFileSync(join(root, 'data/flags.ts'), 'utf8');
const knownFlags = new Set([...flagsSrc.matchAll(/^\s{2}(\w+):/gm)].map((m) => m[1]));

// 物品
const items = JSON.parse(readFileSync(join(root, 'data/items.json'), 'utf8'));
const knownItems = new Set(items.map((i) => i.id));

// 文案（namespace.key）
const knownTexts = new Set();
for (const f of readdirSync(join(root, 'data/dialogue'))) {
  const ns = f.replace(/\.json$/, '');
  const obj = JSON.parse(readFileSync(join(root, 'data/dialogue', f), 'utf8'));
  for (const k of Object.keys(obj)) knownTexts.add(`${ns}.${k}`);
}

// 已注册谜题场景 key（约定：src/puzzles/ 下文件名即场景 key）
const knownPuzzles = new Set(
  readdirSync(join(root, 'puzzles'))
    .filter((f) => f.endsWith('.ts') && f !== 'PuzzleScene.ts')
    .map((f) => f.replace(/\.ts$/, '')),
);

// 收集房间
const rooms = [];
function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.json')) rooms.push(JSON.parse(readFileSync(p, 'utf8')));
  }
}
walk(join(root, 'data/rooms'));
const knownRooms = new Set(rooms.map((r) => r.id));

function checkAction(a, where) {
  if (a.type === 'say' && !knownTexts.has(a.textId)) errors.push(`${where}: 缺文案 ${a.textId}`);
  if ((a.type === 'give' || a.type === 'take') && !knownItems.has(a.item))
    errors.push(`${where}: 未知物品 ${a.item}`);
  if (a.type === 'setFlag' && !knownFlags.has(a.flag)) errors.push(`${where}: 未登记 flag ${a.flag}`);
  if (a.type === 'goRoom' && !knownRooms.has(a.room)) errors.push(`${where}: 未知房间 ${a.room}`);
  if (a.type === 'openPuzzle') {
    if (!knownPuzzles.has(a.puzzle)) errors.push(`${where}: 未知谜题 ${a.puzzle}`);
    for (const sa of a.config?.successActions ?? []) checkAction(sa, `${where}>success`);
    for (const sa of a.config?.perfectActions ?? []) checkAction(sa, `${where}>perfect`);
  }
}

for (const room of rooms) {
  for (const exit of Object.values(room.exits ?? {})) {
    if (!knownRooms.has(exit)) errors.push(`${room.id}: 出口指向未知房间 ${exit}`);
  }
  for (const h of room.hotspots ?? []) {
    const where = `${room.id}#${h.id}`;
    for (const f of [h.requiresFlag, h.hiddenIfFlag, ...(h.requiresFlags ?? [])].filter(Boolean)) {
      if (!knownFlags.has(f)) errors.push(`${where}: 未登记 flag ${f}`);
    }
    for (const it of h.requiresItems ?? []) {
      if (!knownItems.has(it)) errors.push(`${where}: 未知物品 ${it}`);
    }
    if (h.wrongTextId && !knownTexts.has(h.wrongTextId)) errors.push(`${where}: 缺文案 ${h.wrongTextId}`);
    for (const a of h.onTap ?? []) checkAction(a, where);
    if (h.useItem) {
      if (!knownItems.has(h.useItem.item)) errors.push(`${where}: 未知物品 ${h.useItem.item}`);
      for (const a of h.useItem.actions ?? []) checkAction(a, `${where}>useItem`);
    }
  }
}

if (errors.length) {
  console.error(`✗ 数据校验失败（${errors.length} 处）：`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✓ 数据校验通过：${rooms.length} 个房间，${knownFlags.size} 个 flag，${knownItems.size} 个物品，${knownTexts.size} 条文案`);

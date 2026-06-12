// 美术替换缺口清单：扫描全部房间，列出尚无正式背景图的房间。
// 约定：src/assets/bg/<roomId>.png|jpg 即自动替换灰盒。
// 用法：node scripts/art-checklist.mjs
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const bgDir = join(root, 'assets/bg');

const done = new Set();
if (existsSync(bgDir)) {
  for (const f of readdirSync(bgDir)) done.add(f.replace(/\.\w+$/, ''));
}

const rooms = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.json')) rooms.push(JSON.parse(readFileSync(p, 'utf8')));
  }
})(join(root, 'data/rooms'));

const missing = rooms.filter((r) => !done.has(r.id));
console.log(`背景图进度：${rooms.length - missing.length}/${rooms.length}`);
if (missing.length) {
  console.log('\n待绘制（文件名 → 场景）：');
  for (const r of missing) console.log(`  assets/bg/${r.id}.png → ${r.label}`);
}

// 物品图标缺口
const itemsDir = join(root, 'assets/items');
const itemDone = new Set();
if (existsSync(itemsDir)) {
  for (const f of readdirSync(itemsDir)) itemDone.add(f.replace(/\.\w+$/, ''));
}
const items = JSON.parse(readFileSync(join(root, 'data/items.json'), 'utf8'));
const itemMissing = items.filter((i) => !itemDone.has(i.id));
console.log(`物品图标进度：${items.length - itemMissing.length}/${items.length}`);
for (const i of itemMissing) console.log(`  assets/items/${i.id}.svg → ${i.name}`);

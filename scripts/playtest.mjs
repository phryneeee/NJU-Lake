// 全流程自动通关模拟器（回归测试）：
// 模拟玩家在所有可达房间里触发所有可用热区/谜题/合成，迭代至不动点，
// 验证两个结局均可达成、物品链无死锁、物品栏不超载。
// 用法：node scripts/playtest.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

const recipes = JSON.parse(readFileSync(join(root, 'data/recipes.json'), 'utf8'));

const rooms = new Map();
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.json')) {
      const r = JSON.parse(readFileSync(p, 'utf8'));
      rooms.set(r.id, r);
    }
  }
})(join(root, 'data/rooms'));

const flags = new Set();
const inv = new Set();
const reachable = new Set(['ch1_corridor']);
let maxInv = 0;
let changed = true;

function give(item) {
  if (inv.has(item)) return;
  inv.add(item);
  maxInv = Math.max(maxInv, inv.size);
  changed = true;
}

function runActions(actions) {
  for (const a of actions ?? []) {
    switch (a.type) {
      case 'give':
        give(a.item);
        break;
      case 'take':
        if (inv.delete(a.item)) changed = true;
        break;
      case 'setFlag':
        if (!flags.has(a.flag)) {
          flags.add(a.flag);
          changed = true;
        }
        break;
      case 'goRoom':
        if (!reachable.has(a.room)) {
          reachable.add(a.room);
          changed = true;
        }
        break;
      case 'openPuzzle':
        runActions(a.config?.successActions);
        runActions(a.config?.perfectActions);
        runActions(a.config?.bonusActions);
        break;
      // say / chapterCard：无状态影响
    }
  }
}

function hotspotVisible(h) {
  if (h.requiresFlag && !flags.has(h.requiresFlag)) return false;
  if (h.requiresFlags && !h.requiresFlags.every((f) => flags.has(f))) return false;
  if (h.hiddenIfFlag && flags.has(h.hiddenIfFlag)) return false;
  if (h.requiresItems && !h.requiresItems.every((it) => inv.has(it))) return false;
  return true;
}

let pass = 0;
while (changed && pass < 200) {
  changed = false;
  pass++;

  // 合成（与引擎一致：两件输入→一件产出）
  for (const r of recipes) {
    if (inv.has(r.inputs[0]) && inv.has(r.inputs[1]) && !inv.has(r.output)) {
      inv.delete(r.inputs[0]);
      inv.delete(r.inputs[1]);
      give(r.output);
    }
  }

  for (const roomId of [...reachable]) {
    const room = rooms.get(roomId);
    if (!room) continue;
    for (const exit of Object.values(room.exits ?? {})) {
      if (!reachable.has(exit)) {
        reachable.add(exit);
        changed = true;
      }
    }
    for (const h of room.hotspots ?? []) {
      if (!hotspotVisible(h)) continue;
      if (h.useItem) {
        if (!inv.has(h.useItem.item)) continue;
        if (h.useItem.consume) {
          inv.delete(h.useItem.item);
          changed = true;
        }
        runActions(h.useItem.actions);
      } else {
        runActions(h.onTap);
      }
    }
  }
}

const required = ['ch1_complete', 'ch2_complete', 'ch3_complete', 'ch4_complete', 'ch5_complete', 'ch6_complete', 'hidden_complete'];
const missing = required.filter((f) => !flags.has(f));
const unreached = [...rooms.keys()].filter((id) => !reachable.has(id));

console.log(`通关模拟：${pass} 轮迭代`);
console.log(`  到达房间：${reachable.size}/${rooms.size}${unreached.length ? `（未到达：${unreached.join(', ')}）` : ''}`);
console.log(`  物品栏峰值：${maxInv}/12`);
console.log(`  达成 flag：${flags.size} 个`);

if (missing.length) {
  console.error(`✗ 未能达成：${missing.join(', ')}`);
  process.exit(1);
}
if (maxInv > 12) {
  console.error(`✗ 物品栏超载（峰值 ${maxInv} > 12 格）`);
  process.exit(1);
}
console.log('✓ 双结局均可达成，物品链无死锁。');

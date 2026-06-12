// 把全部物品图标渲染成一张拼图（previews/items-sheet.png）便于审阅。
// 用法：node scripts/render-item-sheet.mjs
import { readFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const itemsDir = join(root, 'src/assets/items');
const outDir = join(root, 'previews');
if (!existsSync(outDir)) mkdirSync(outDir);

// 按 items.json 的顺序排列
const order = JSON.parse(readFileSync(join(root, 'src/data/items.json'), 'utf8')).map((i) => i.id);
const files = new Set(readdirSync(itemsDir).filter((f) => f.endsWith('.svg')));

const CELL = 150;
const PAD = 11;
const COLS = 7;
const ids = order.filter((id) => files.has(`${id}.svg`));
const rows = Math.ceil(ids.length / COLS);

const composites = [];
for (let i = 0; i < ids.length; i++) {
  const png = await sharp(join(itemsDir, `${ids[i]}.svg`), { density: 96 })
    .resize(CELL - PAD * 2, CELL - PAD * 2)
    .png()
    .toBuffer();
  composites.push({
    input: png,
    left: (i % COLS) * CELL + PAD,
    top: Math.floor(i / COLS) * CELL + PAD,
  });
}

await sharp({
  create: {
    width: COLS * CELL,
    height: rows * CELL,
    channels: 4,
    background: { r: 38, g: 35, b: 31, alpha: 1 },
  },
})
  .composite(composites)
  .png()
  .toFile(join(outDir, 'items-sheet.png'));

console.log(`✓ ${ids.length} 个图标 → previews/items-sheet.png（顺序同 items.json）`);

// 把 src/assets/bg/*.svg 渲染为 PNG 预览（previews/ 目录，git忽略）。
// 用法：node scripts/render-previews.mjs [宽度，默认1024]
import { readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const bgDir = join(root, 'src/assets/bg');
const outDir = join(root, 'previews');
const width = Number(process.argv[2] ?? 1024);

if (!existsSync(outDir)) mkdirSync(outDir);

const svgs = readdirSync(bgDir).filter((f) => f.endsWith('.svg'));
for (const f of svgs) {
  const out = join(outDir, f.replace(/\.svg$/, '.png'));
  await sharp(join(bgDir, f), { density: 96 })
    .resize(width, Math.round((width * 1536) / 2048))
    .png()
    .toFile(out);
  console.log(`✓ ${f} → previews/${f.replace(/\.svg$/, '.png')}`);
}
console.log(`共 ${svgs.length} 张`);

// 生成全部物品图标 SVG → src/assets/items/<itemId>.svg
// 设计：256×256 透明底，平涂硬边，与背景同一调色板。
// 用法：node scripts/gen-item-icons.mjs
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src/assets/items');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const wrap = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">\n${body}\n</svg>\n`;

/** 残缺档案卷宗模板：编号+各自的残缺特征（num 传空串时只显示 extra 里的自定义编号） */
const folder = (num, extra) => `
  <g transform="rotate(-4 128 128)">
    <rect x="48" y="44" width="160" height="180" rx="8" fill="#8C3B2E"/>
    <rect x="48" y="44" width="160" height="34" rx="8" fill="#76301f"/>
    <rect x="64" y="96" width="128" height="96" fill="#e8dcc0"/>
    ${num ? `<text x="128" y="166" font-family="serif" font-size="64" fill="#8C3B2E" text-anchor="middle">${num}</text>` : ''}
    <line x1="64" y1="206" x2="192" y2="206" stroke="#e8dcc0" stroke-width="6" opacity="0.6"/>
    ${extra}
  </g>`;

const icons = {
  library_card: `
  <g transform="rotate(-5 128 128)">
    <rect x="32" y="68" width="192" height="120" rx="12" fill="#E8DCC0"/>
    <rect x="48" y="88" width="56" height="72" fill="#a98e6f"/>
    <circle cx="76" cy="112" r="14" fill="#caa987"/>
    <path d="M 56 160 q 20 -24 40 0 z" fill="#caa987"/>
    <g stroke="#8a7558" stroke-width="8">
      <line x1="120" y1="100" x2="204" y2="100"/><line x1="120" y1="126" x2="190" y2="126"/>
      <line x1="120" y1="152" x2="204" y2="152"/>
    </g>
    <rect x="32" y="68" width="192" height="16" rx="8" fill="#3E5C4B"/>
  </g>`,

  crow_feather: `
  <g transform="rotate(40 128 128)">
    <path d="M 128 30 q 44 60 30 150 q -8 36 -30 46 q -22 -10 -30 -46 q -14 -90 30 -150 z" fill="#2B2B33"/>
    <path d="M 128 50 l 0 160" stroke="#1c1a17" stroke-width="8"/>
    <path d="M 128 226 l 0 16" stroke="#1c1a17" stroke-width="6"/>
    <path d="M 110 90 q 18 8 36 0 M 104 130 q 24 10 48 0 M 102 170 q 26 10 52 0" stroke="#3a3a44" stroke-width="5" fill="none"/>
  </g>`,

  vhs_tape: `
  <rect x="28" y="64" width="200" height="128" rx="10" fill="#1f1b16"/>
  <rect x="40" y="76" width="176" height="60" rx="6" fill="#2e2a24"/>
  <circle cx="84" cy="106" r="22" fill="#0e0c09"/><circle cx="84" cy="106" r="10" fill="#4a4440"/>
  <circle cx="172" cy="106" r="22" fill="#0e0c09"/><circle cx="172" cy="106" r="10" fill="#4a4440"/>
  <rect x="48" y="148" width="160" height="32" fill="#E8DCC0"/>
  <text x="128" y="172" font-family="monospace" font-size="22" fill="#3a3326" text-anchor="middle">2001.6.21</text>`,

  burned_slip: `
  <g transform="rotate(6 128 128)">
    <path d="M 60 48 l 136 -8 l 8 96 l -28 24 l 14 30 l -110 12 z" fill="#cdbd9b"/>
    <path d="M 196 40 l 8 96 l -28 24 l 14 30 l -40 5 q 30 -40 18 -80 q 20 -30 6 -73 z" fill="#3a2e20"/>
    <path d="M 168 92 q 16 -22 10 -50 l 18 -2 l 6 70 z" fill="#1c1a17"/>
    <g stroke="#a59777" stroke-width="6">
      <line x1="76" y1="84" x2="150" y2="78"/><line x1="78" y1="112" x2="140" y2="107"/>
      <line x1="80" y1="140" x2="146" y2="134"/>
    </g>
  </g>`,

  brass_key: `
  <g transform="rotate(-35 128 128)">
    <circle cx="128" cy="70" r="40" fill="none" stroke="#B08D3F" stroke-width="20"/>
    <rect x="118" y="106" width="20" height="110" fill="#B08D3F"/>
    <rect x="138" y="176" width="28" height="16" fill="#B08D3F"/>
    <rect x="138" y="200" width="38" height="16" fill="#B08D3F"/>
    <text x="128" y="80" font-family="serif" font-size="30" fill="#76301f" text-anchor="middle">七</text>
  </g>`,

  shovel_head: `
  <g transform="rotate(12 128 128)">
    <path d="M 56 86 l 144 0 l -10 96 q -62 70 -124 0 z" fill="#7a7a84"/>
    <path d="M 56 86 l 144 0 l 0 -22 q -72 -20 -144 0 z" fill="#5a5a64"/>
    <rect x="112" y="30" width="32" height="56" rx="8" fill="#5a5a64"/>
    <path d="M 86 130 l 84 0" stroke="#5a5a64" stroke-width="8"/>
    <!-- 锈斑 -->
    <circle cx="84" cy="160" r="10" fill="#8C3B2E" opacity="0.6"/>
    <circle cx="166" cy="120" r="7" fill="#8C3B2E" opacity="0.5"/>
  </g>`,

  stick: `
  <g transform="rotate(38 128 128)">
    <rect x="116" y="26" width="26" height="204" rx="12" fill="#8a6b42"/>
    <path d="M 120 60 l 18 6 M 118 120 l 20 6 M 120 180 l 18 6" stroke="#6e552f" stroke-width="6"/>
    <ellipse cx="129" cy="28" rx="13" ry="6" fill="#a8854f"/>
  </g>`,

  tape: `
  <g transform="rotate(-12 128 128)">
    <circle cx="120" cy="120" r="80" fill="#b5ab8d"/>
    <circle cx="120" cy="120" r="36" fill="#26231f"/>
    <circle cx="120" cy="120" r="36" fill="none" stroke="#998f73" stroke-width="8"/>
    <!-- 撕开搭下来的一段胶带 -->
    <path d="M 196 138 l 50 28 l 0 34 l -60 -34 q 14 -12 10 -28 z" fill="#cdc4a4"/>
    <path d="M 246 200 l -14 -2 l 14 -8 z" fill="#cdc4a4"/>
  </g>`,

  shovel_frame: `
  <g transform="rotate(30 110 90)">
    <rect x="100" y="14" width="22" height="118" rx="10" fill="#8a6b42"/>
  </g>
  <!-- 锹头歪着，没接上：中间留缝 -->
  <g transform="rotate(58 150 190)">
    <path d="M 116 160 l 68 0 l -5 50 q -29 36 -58 0 z" fill="#7a7a84"/>
    <rect x="141" y="130" width="18" height="32" fill="#5a5a64"/>
  </g>
  <!-- 摇晃线 -->
  <g stroke="#e8dcc0" stroke-width="5" fill="none" opacity="0.7">
    <path d="M 70 150 q -12 8 -8 22"/>
    <path d="M 196 110 q 12 -8 8 -22"/>
  </g>`,

  shovel: `
  <g transform="rotate(30 128 128)">
    <rect x="118" y="16" width="22" height="140" rx="10" fill="#8a6b42"/>
    <rect x="108" y="120" width="42" height="26" rx="6" fill="#9a9a8a"/>
    <path d="M 92 146 l 72 0 l -5 56 q -31 40 -62 0 z" fill="#6a6a72"/>
  </g>`,

  letter_2001: `
  <g transform="rotate(-4 128 128)">
    <rect x="44" y="64" width="168" height="128" fill="#D8C8A8"/>
    <path d="M 44 64 l 84 60 l 84 -60" fill="none" stroke="#b5a583" stroke-width="8"/>
    <ellipse cx="86" cy="160" rx="34" ry="20" fill="#b5a583" opacity="0.55"/>
    <text x="158" y="178" font-family="serif" font-size="26" fill="#8a7558" text-anchor="middle">2001</text>
  </g>`,

  half_photo: `
  <g transform="rotate(-6 128 128)">
    <path d="M 64 48 l 104 0 l -10 22 l 12 24 l -14 22 l 12 26 l -10 22 l 10 24 l -104 0 z" fill="#E8DCC0"/>
    <path d="M 78 64 l 76 0 l -8 18 l 10 20 l -12 18 l 10 22 l -8 18 l 8 20 l -76 0 z" fill="#A98E6F"/>
    <circle cx="108" cy="110" r="16" fill="#caa987"/>
    <path d="M 88 168 q 20 -30 40 0 z" fill="#5a4a38"/>
    <path d="M 148 120 q 10 -4 18 4" stroke="#5a4a38" stroke-width="8" fill="none"/>
  </g>`,

  archive_r2: folder('②', `<rect x="92" y="56" width="72" height="14" fill="#3a1c12"/>`),
  archive_r3: folder('③', `
    <path d="M 64 118 l 22 8 l -10 12 l 18 10" stroke="#3a1c12" stroke-width="5" fill="none"/>
    <rect x="62" y="124" width="34" height="13" fill="#cdbd9b" transform="rotate(40 79 130)"/>
    <rect x="74" y="148" width="34" height="13" fill="#cdbd9b" transform="rotate(40 91 154)"/>`),
  archive_r4: folder('', `<g transform="scale(-1 1) translate(-256 0)"><text x="128" y="166" font-family="serif" font-size="64" fill="#8C3B2E" text-anchor="middle">④</text></g>`),
  archive_r5: folder('⑤', `<ellipse cx="150" cy="110" rx="40" ry="16" fill="#a59777" opacity="0.65"/>`),
  archive_r6: folder('⑥', `
    <g fill="#c98a4b"><circle cx="170" cy="70" r="8"/><circle cx="186" cy="60" r="6"/><circle cx="190" cy="76" r="6"/></g>`),

  fox_mask: `
  <g transform="rotate(-5 128 128)">
    <!-- 立起的双耳 -->
    <path d="M 76 78 l -22 -52 l 52 24 z" fill="#C98A4B"/>
    <path d="M 180 78 l 22 -52 l -52 24 z" fill="#C98A4B"/>
    <path d="M 82 70 l -12 -28 l 28 13 z" fill="#76301f"/>
    <path d="M 174 70 l 12 -28 l -28 13 z" fill="#76301f"/>
    <!-- 尖吻脸型 -->
    <path d="M 128 52 q 64 14 70 80 q -4 48 -70 88 q -66 -40 -70 -88 q 6 -66 70 -80 z" fill="#C98A4B"/>
    <path d="M 128 150 q 30 6 38 34 q -20 24 -38 36 q -18 -12 -38 -36 q 8 -28 38 -34 z" fill="#e8d4b8"/>
    <!-- 空的眼洞 -->
    <path d="M 88 112 q 18 -10 36 4 q -16 14 -36 8 q -6 -6 0 -12 z" fill="#10130f"/>
    <path d="M 168 112 q -18 -10 -36 4 q 16 14 36 8 q 6 -6 0 -12 z" fill="#10130f"/>
    <path d="M 120 178 l 16 0 l -8 12 z" fill="#76301f"/>
  </g>`,

  pen_nib: `
  <g transform="rotate(20 128 128)">
    <path d="M 128 40 q 44 50 30 120 l -30 56 l -30 -56 q -14 -70 30 -120 z" fill="#9aa0ae"/>
    <circle cx="128" cy="140" r="10" fill="#3a3a44"/>
    <line x1="128" y1="150" x2="128" y2="206" stroke="#3a3a44" stroke-width="6"/>
    <path d="M 128 56 q 26 36 22 88" stroke="#c5cad4" stroke-width="6" fill="none"/>
  </g>`,

  quill: `
  <g transform="rotate(40 128 128)">
    <path d="M 128 22 q 42 56 28 140 q -8 32 -28 42 q -20 -10 -28 -42 q -14 -84 28 -140 z" fill="#2B2B33"/>
    <path d="M 128 40 l 0 150" stroke="#1c1a17" stroke-width="7"/>
    <path d="M 122 204 l 12 0 l -6 38 z" fill="#9aa0ae"/>
  </g>`,

  letter_paper: `
  <g transform="rotate(-3 128 128)">
    <rect x="64" y="40" width="128" height="176" fill="#E8DCC0"/>
    <g stroke="#c9bb98" stroke-width="6">
      <line x1="80" y1="80" x2="176" y2="80"/><line x1="80" y1="112" x2="176" y2="112"/>
      <line x1="80" y1="144" x2="176" y2="144"/><line x1="80" y1="176" x2="150" y2="176"/>
    </g>
  </g>`,

  signed_letter: `
  <g transform="rotate(-3 128 128)">
    <rect x="64" y="40" width="128" height="176" fill="#E8DCC0"/>
    <g stroke="#c9bb98" stroke-width="6">
      <line x1="80" y1="76" x2="176" y2="76"/><line x1="80" y1="104" x2="176" y2="104"/>
      <line x1="80" y1="132" x2="150" y2="132"/>
    </g>
    <text x="128" y="192" font-family="serif" font-size="34" fill="#1c1a17" text-anchor="middle">林 晚</text>
  </g>`,

  waxed_boat: `
  <path d="M 40 150 l 176 0 l -40 50 l -96 0 z" fill="#D8C8A8"/>
  <path d="M 128 64 l 56 86 l -112 0 z" fill="#E8DCC0"/>
  <path d="M 128 64 l 0 86" stroke="#b5a583" stroke-width="6"/>
  <circle cx="128" cy="178" r="16" fill="#8C3B2E"/>
  <path d="M 60 214 q 34 14 68 0 q 34 14 68 0" stroke="#4a5a66" stroke-width="8" fill="none"/>`,

  file_half_2001: `
  <g transform="rotate(-5 128 128)">
    <path d="M 56 52 l 144 0 l 0 90 l -22 12 l 20 16 l -18 12 l 16 18 l -140 6 z" fill="#A98E6F"/>
    <rect x="72" y="72" width="112" height="40" fill="#E8DCC0"/>
    <text x="128" y="102" font-family="monospace" font-size="26" fill="#3a3326" text-anchor="middle">404</text>
    <g stroke="#8a7050" stroke-width="6">
      <line x1="76" y1="138" x2="170" y2="138"/><line x1="78" y1="164" x2="150" y2="164"/>
    </g>
  </g>`,

  desk_lamp: `
  <rect x="116" y="120" width="16" height="84" fill="#8a7032"/>
  <ellipse cx="124" cy="210" rx="52" ry="14" fill="#6e5a28"/>
  <path d="M 52 116 q 72 -64 148 0 z" fill="#3E5C4B"/>
  <ellipse cx="126" cy="118" rx="74" ry="13" fill="#E8C84A"/>
  <ellipse cx="126" cy="132" rx="50" ry="8" fill="#E8C84A" opacity="0.4"/>`,

  chalk_piece: `
  <g transform="rotate(-20 128 128)">
    <rect x="58" y="112" width="104" height="34" rx="8" fill="#F0F0E8"/>
    <path d="M 162 112 l 12 8 l -8 10 l 10 8 l -14 8 l 0 -34 z" fill="#F0F0E8"/>
    <rect x="186" y="116" width="28" height="26" rx="6" fill="#e2e2d4"/>
    <path d="M 66 152 q 30 16 60 6" stroke="#d8d8c8" stroke-width="6" fill="none" opacity="0.8"/>
  </g>`,
};

let n = 0;
for (const [id, body] of Object.entries(icons)) {
  writeFileSync(join(outDir, `${id}.svg`), wrap(body));
  n++;
}
console.log(`✓ 生成 ${n} 个物品图标 → src/assets/items/`);

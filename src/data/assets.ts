/**
 * 资产清单（美术/音频替换管线）：
 * - 背景图：src/assets/bg/<roomId>.svg|png|jpg → 自动替换该房间的灰盒底色
 *   （SVG 推荐：平涂矢量风格，浏览器按逻辑分辨率栅格化，retina 锐利）
 * - 环境音：src/assets/audio/<key>.m4a|ogg|mp3 → 房间 JSON 的 ambience 字段引用
 * 画好一张放进目录即生效，JSON 与代码不需要改动。
 * 缺口清单：npm run art-checklist
 */

const bgModules = import.meta.glob<string>('../assets/bg/*.{svg,png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

export interface BgAsset {
  url: string;
  isSvg: boolean;
}

export const bgUrls = new Map<string, BgAsset>();
for (const path of Object.keys(bgModules)) {
  const id = path.replace(/^.*\/([^/]+)\.\w+$/, '$1');
  bgUrls.set(id, { url: bgModules[path], isSvg: path.endsWith('.svg') });
}

const audioModules = import.meta.glob<string>('../assets/audio/*.{m4a,ogg,mp3}', {
  eager: true,
  query: '?url',
  import: 'default',
});

export const audioUrls = new Map<string, string>();
for (const path of Object.keys(audioModules)) {
  const key = path.replace(/^.*\/([^/]+)\.\w+$/, '$1');
  audioUrls.set(key, audioModules[path]);
}

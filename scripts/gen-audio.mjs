// 程序化音频合成：环境底噪/主题旋律/交互音效 → src/assets/audio/*.wav
// 纯 Node DSP（无依赖）。22050Hz 16bit 单声道；循环素材首尾交叉淡化保证无缝。
// 用法：node scripts/gen-audio.mjs
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 22050;
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src/assets/audio');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

// ---------- 基础设施 ----------

function writeWav(name, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  writeFileSync(join(outDir, `${name}.wav`), buf);
  console.log(`✓ ${name}.wav  ${(buf.length / 1024).toFixed(0)}KB`);
}

// 可复现的伪随机
let seed = 20260612;
const rand = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const noise = () => rand() * 2 - 1;

// 单极点滤波器系数
const lpA = (fc) => 1 - Math.exp((-2 * Math.PI * fc) / SR);

/** 循环素材：末尾 fadeSec 与开头交叉淡化 */
function loopable(s, fadeSec = 0.6) {
  const f = Math.floor(fadeSec * SR);
  const n = s.length;
  for (let i = 0; i < f; i++) {
    const t = i / f;
    s[i] = s[i] * t + s[n - f + i] * (1 - t);
  }
  return s.slice(0, n - f);
}

function normalize(s, peak) {
  let max = 1e-9;
  for (const v of s) max = Math.max(max, Math.abs(v));
  const g = peak / max;
  for (let i = 0; i < s.length; i++) s[i] *= g;
  return s;
}

const seconds = (sec) => new Float32Array(Math.floor(sec * SR));

// ---------- 环境底噪（loop） ----------

function ambRoom() {
  const s = seconds(12.6);
  let lp = 0;
  const a = lpA(320);
  for (let i = 0; i < s.length; i++) {
    lp += a * (noise() - lp);
    const t = i / SR;
    const lfo = 0.8 + 0.2 * Math.sin(2 * Math.PI * 0.07 * t);
    const hum = 0.10 * Math.sin(2 * Math.PI * 50 * t);
    s[i] = lp * 0.9 * lfo + hum;
  }
  return normalize(loopable(s), 0.22);
}

function ambArchive() {
  const s = seconds(12.6);
  let lp = 0;
  const a = lpA(220);
  // 随机的纸张窸窣
  const rustles = [2.1, 5.4, 9.2].map((t) => Math.floor(t * SR));
  for (let i = 0; i < s.length; i++) {
    lp += a * (noise() - lp);
    const t = i / SR;
    let v = lp * 0.8 + 0.08 * Math.sin(2 * Math.PI * 55 * t);
    for (const r of rustles) {
      const d = i - r;
      if (d > 0 && d < 0.3 * SR) v += noise() * 0.18 * Math.exp(-d / (0.05 * SR));
    }
    s[i] = v;
  }
  return normalize(loopable(s), 0.2);
}

function ambNight() {
  const s = seconds(12.6);
  let lp = 0;
  const a = lpA(500);
  for (let i = 0; i < s.length; i++) {
    lp += a * (noise() - lp);
    const t = i / SR;
    let v = lp * 0.5;
    // 两只蟋蟀：脉冲串
    for (const [period, base, f] of [[1.3, 0.15, 4200], [1.7, 0.9, 3800]]) {
      const ph = (t + base) % period;
      if (ph < 0.28) {
        const burst = Math.sin(2 * Math.PI * 26 * ph) > 0 ? 1 : 0;
        v += 0.10 * burst * Math.sin(2 * Math.PI * f * t) * Math.sin((Math.PI * ph) / 0.28);
      }
    }
    s[i] = v;
  }
  return normalize(loopable(s), 0.2);
}

function ambDream() {
  const s = seconds(14.2);
  let lp = 0;
  const a = lpA(150);
  for (let i = 0; i < s.length; i++) {
    lp += a * (noise() - lp);
    const t = i / SR;
    const drone =
      0.30 * Math.sin(2 * Math.PI * 55 * t) +
      0.22 * Math.sin(2 * Math.PI * 55.6 * t) +
      0.12 * Math.sin(2 * Math.PI * 110.4 * t);
    const lfo = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.05 * t);
    s[i] = (drone * lfo + lp * 0.35) * 0.9;
  }
  return normalize(loopable(s, 1.2), 0.2);
}

function ambHum() {
  const s = seconds(12.6);
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    // 灯管频闪：偶发的瞬时塌陷
    const flick = Math.sin(2 * Math.PI * 0.43 * t) > 0.985 ? 0.35 : 1;
    s[i] =
      (0.5 * Math.sin(2 * Math.PI * 100 * t) +
        0.25 * Math.sin(2 * Math.PI * 200 * t) +
        0.1 * Math.sin(2 * Math.PI * 300 * t) +
        noise() * 0.04) * flick;
  }
  return normalize(loopable(s), 0.16);
}

function ambCrt() {
  const s = seconds(12.6);
  let lp = 0;
  const a = lpA(400);
  for (let i = 0; i < s.length; i++) {
    lp += a * (noise() - lp);
    const t = i / SR;
    s[i] =
      0.4 * Math.sin(2 * Math.PI * 60 * t) +
      0.12 * Math.sin(2 * Math.PI * 9800 * t) + // 高频啸叫（降采样后的近似）
      lp * 0.3;
  }
  return normalize(loopable(s), 0.15);
}

function ambLake() {
  const s = seconds(14.2);
  let lp = 0;
  const a = lpA(600);
  for (let i = 0; i < s.length; i++) {
    lp += a * (noise() - lp);
    const t = i / SR;
    const wave = 0.55 + 0.45 * Math.sin(2 * Math.PI * 0.09 * t + Math.sin(t * 0.31) * 0.8);
    s[i] = lp * wave;
  }
  return normalize(loopable(s, 1.0), 0.22);
}

function amb2001() {
  const s = seconds(12.6);
  let lp = 0, hpState = 0;
  const a = lpA(3000), ah = lpA(1800);
  for (let i = 0; i < s.length; i++) {
    const w = noise();
    lp += a * (w - lp);
    hpState += ah * (w - hpState);
    const hiss = w - hpState; // 磁带嘶声
    const t = i / SR;
    const wow = 0.85 + 0.15 * Math.sin(2 * Math.PI * 0.6 * t); // 抖晃
    let v = hiss * 0.25 * wow + 0.08 * Math.sin(2 * Math.PI * 60 * t);
    const ph = t % 1.9;
    if (ph < 0.22) v += 0.06 * Math.sin(2 * Math.PI * 3600 * t) * Math.sin((Math.PI * ph) / 0.22);
    s[i] = v;
  }
  return normalize(loopable(s), 0.18);
}

function ambMorning() {
  const s = seconds(12.6);
  let lp = 0;
  const a = lpA(900);
  const birds = [
    [1.2, 2600, 0.5], [3.8, 3100, 0.4], [6.5, 2800, 0.55], [9.6, 3400, 0.35],
  ];
  for (let i = 0; i < s.length; i++) {
    lp += a * (noise() - lp);
    const t = i / SR;
    let v = lp * 0.4;
    for (const [bt, f, dur] of birds) {
      const d = t - bt;
      if (d > 0 && d < dur) {
        const sweep = f * (1 + 0.25 * Math.sin((Math.PI * d) / dur) - 0.3 * (d / dur));
        v += 0.12 * Math.sin(2 * Math.PI * sweep * d) * Math.sin((Math.PI * d) / dur);
      }
    }
    s[i] = v;
  }
  return normalize(loopable(s), 0.2);
}

function ambWarm() {
  const s = seconds(14.2);
  let lp = 0;
  const a = lpA(180);
  for (let i = 0; i < s.length; i++) {
    lp += a * (noise() - lp);
    const t = i / SR;
    const trem = 0.8 + 0.2 * Math.sin(2 * Math.PI * 0.11 * t);
    s[i] =
      (0.3 * Math.sin(2 * Math.PI * 220 * t) +
        0.22 * Math.sin(2 * Math.PI * 277.18 * t) +
        0.18 * Math.sin(2 * Math.PI * 329.63 * t) +
        0.12 * Math.sin(2 * Math.PI * 110 * t)) * trem +
      lp * 0.25;
  }
  return normalize(loopable(s, 1.2), 0.16);
}

// ---------- 主题旋律（标题/结局） ----------

function themeMain() {
  const dur = 24;
  const s = seconds(dur);
  // A 小调动机：缓慢、克制
  const N = { A3: 220, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63, G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25 };
  const motif = [
    [0, 'A4', 2.2], [2.4, 'E5', 2.2], [4.8, 'C5', 1.6], [6.4, 'B4', 2.6],
    [9.6, 'A4', 1.6], [11.2, 'G4', 1.6], [12.8, 'E4', 2.6],
    [16, 'A4', 1.6], [17.6, 'C5', 1.6], [19.2, 'B4', 1.4], [20.6, 'A4', 3.2],
  ];
  const bassNotes = [[0, 'A3', 7.6], [8, 'C4', 7.6], [16, 'A3', 7.6]];

  const piano = (f, t) =>
    (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(2 * Math.PI * 2 * f * t) + 0.12 * Math.sin(2 * Math.PI * 3 * f * t)) *
    Math.exp(-t * 1.4);

  for (const [st, key, len] of motif) {
    const f = N[key];
    const start = Math.floor(st * SR);
    const n = Math.floor(len * SR);
    for (let i = 0; i < n && start + i < s.length; i++) {
      const t = i / SR;
      s[start + i] += 0.28 * piano(f, t) * Math.min(1, (n - i) / (0.2 * SR));
    }
  }
  for (const [st, key, len] of bassNotes) {
    const f = N[key];
    const start = Math.floor(st * SR);
    const n = Math.floor(len * SR);
    for (let i = 0; i < n && start + i < s.length; i++) {
      const t = i / SR;
      s[start + i] += 0.10 * Math.sin(2 * Math.PI * f * 0.5 * t) * Math.exp(-t * 0.25) * Math.min(1, (n - i) / (0.4 * SR));
    }
  }
  // 磁带嘶声床
  let hp = 0;
  const ah = lpA(2000);
  for (let i = 0; i < s.length; i++) {
    const w = noise();
    hp += ah * (w - hp);
    s[i] += (w - hp) * 0.02;
  }
  // 简单延迟回声
  const d = Math.floor(0.45 * SR);
  for (let i = d; i < s.length; i++) s[i] += s[i - d] * 0.28;
  return normalize(loopable(s, 2.0), 0.3);
}

// ---------- 音效 ----------

function sfxClick() {
  const s = seconds(0.09);
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    s[i] = Math.sin(2 * Math.PI * 1300 * t) * Math.exp(-t * 90) + noise() * 0.2 * Math.exp(-t * 300);
  }
  return normalize(s, 0.5);
}

function sfxPickup() {
  const s = seconds(0.35);
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    s[i] =
      Math.sin(2 * Math.PI * 130 * t) * Math.exp(-t * 22) +
      0.4 * Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 50) +
      noise() * 0.15 * Math.exp(-t * 120);
  }
  return normalize(s, 0.55);
}

function sfxSolve() {
  const s = seconds(1.1);
  const notes = [[0, 880], [0.13, 1108.7], [0.26, 1318.5]];
  for (const [st, f] of notes) {
    const start = Math.floor(st * SR);
    for (let i = start; i < s.length; i++) {
      const t = (i - start) / SR;
      s[i] += (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * 2 * f * t)) * Math.exp(-t * 4) * 0.4;
    }
  }
  return normalize(s, 0.45);
}

function sfxError() {
  const s = seconds(0.3);
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    s[i] = (Math.sin(2 * Math.PI * 110 * t) + 0.4 * Math.sin(2 * Math.PI * 165 * t)) * Math.exp(-t * 14);
  }
  return normalize(s, 0.4);
}

function sfxDial() {
  const s = seconds(0.05);
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    s[i] = Math.sin(2 * Math.PI * 620 * t) * Math.exp(-t * 160) + noise() * 0.4 * Math.exp(-t * 500);
  }
  return normalize(s, 0.4);
}

function sfxDrawer() {
  const s = seconds(0.42);
  let lp = 0;
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    const fc = 200 + 1800 * (t / 0.42);
    lp += lpA(fc) * (noise() - lp);
    let v = lp * 0.8 * Math.sin((Math.PI * t) / 0.42);
    if (t > 0.34) v += Math.sin(2 * Math.PI * 90 * (t - 0.34)) * Math.exp(-(t - 0.34) * 40) * 0.8;
    s[i] = v;
  }
  return normalize(s, 0.45);
}

function sfxPage() {
  const s = seconds(0.22);
  let hp = 0;
  const ah = lpA(1200);
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    const w = noise();
    hp += ah * (w - hp);
    s[i] = (w - hp) * Math.sin((Math.PI * t) / 0.22);
  }
  return normalize(s, 0.3);
}

function sfxBell() {
  const s = seconds(1.4);
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    s[i] =
      (Math.sin(2 * Math.PI * 1568 * t) + 0.6 * Math.sin(2 * Math.PI * 2349 * t) + 0.3 * Math.sin(2 * Math.PI * 3140 * t)) *
      Math.exp(-t * 3.2);
  }
  return normalize(s, 0.4);
}

// ---------- 产出 ----------

writeWav('amb_room', ambRoom());
writeWav('amb_archive', ambArchive());
writeWav('amb_night', ambNight());
writeWav('amb_dream', ambDream());
writeWav('amb_hum', ambHum());
writeWav('amb_crt', ambCrt());
writeWav('amb_lake', ambLake());
writeWav('amb_2001', amb2001());
writeWav('amb_morning', ambMorning());
writeWav('amb_warm', ambWarm());
writeWav('theme_main', themeMain());
writeWav('sfx_click', sfxClick());
writeWav('sfx_pickup', sfxPickup());
writeWav('sfx_solve', sfxSolve());
writeWav('sfx_error', sfxError());
writeWav('sfx_dial', sfxDial());
writeWav('sfx_drawer', sfxDrawer());
writeWav('sfx_page', sfxPage());
writeWav('sfx_bell', sfxBell());
console.log('完成。');

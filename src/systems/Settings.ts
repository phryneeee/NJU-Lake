/** 玩家设置（独立于存档，清档不影响） */

const KEY = 'seventh-archive-settings-v1';

export interface SettingsData {
  /** 颗粒/VHS等后期滤镜开关（光敏友好） */
  filters: boolean;
  /** 静音 */
  muted: boolean;
  /** 辅助模式：可交互热区微光呼吸 */
  assist: boolean;
}

const defaults: SettingsData = { filters: true, muted: false, assist: false };

let current: SettingsData = { ...defaults };
try {
  const raw = localStorage.getItem(KEY);
  if (raw) current = { ...defaults, ...(JSON.parse(raw) as Partial<SettingsData>) };
} catch {
  /* 使用默认值 */
}

export const Settings = {
  get(): SettingsData {
    return current;
  },
  set(patch: Partial<SettingsData>): void {
    current = { ...current, ...patch };
    try {
      localStorage.setItem(KEY, JSON.stringify(current));
    } catch {
      /* 忽略写入失败 */
    }
  },
};

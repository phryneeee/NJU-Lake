/**
 * 全部剧情 flag 登记处（协作守则：新增 flag 必须先在此登记）。
 * 命名规范：chN_动词_名词
 */
export const FLAGS = {
  // 第一章 · 失踪的档案
  ch1_unlocked_office: '解开导师办公室门锁（1919）',
  ch1_got_card: '拿到借阅证',
  ch1_sorted_slips: '整理借阅单，发现2001年的空白借阅人（谜题1-2）',
  ch1_registered: '在档案馆登记台出示借阅证',
  ch1_got_vhs: '在档案柜找到VHS录像带（谜题1-3）',
  ch1_inserted_tape: '把录像带放进录像机',
  ch1_watched_vhs: '看完2001年的录像（谜题1-4）',
  ch1_got_r1: '【残缺档案①】烧痕借阅单',
  ch1_complete: '第一章完成',
} as const;

export type FlagId = keyof typeof FLAGS;

export function isKnownFlag(f: string): f is FlagId {
  return f in FLAGS;
}

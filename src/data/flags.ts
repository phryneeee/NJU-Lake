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

  // 第二章 · 第七档案库
  ch2_searched_opac: '在OPAC查到索书号位置（谜题2-1）',
  ch2_sorted_books: '书脊拼出「嫏嬛在水之南」，图书馆开始闭环（谜题2-2）',
  ch2_quiz_passed: '通过猫头鹰三问，获得黄铜钥匙（谜题2-3）',
  ch2_got_r2: '【残缺档案②】猫头鹰全对奖励',
  ch2_unlocked_b7: '电梯按出B7（谜题2-4）',
  ch2_met_crow: '见到乌鸦先生，听完档案库规则',
  ch2_complete: '第二章完成（见到26岁的自己）',

  // 第三章 · 白兔时间线
  ch3_took_tools: '在工棚拿到铁锹零件',
  ch3_read_photo: '看过老照片背面的埋藏位置',
  ch3_dug_capsule: '挖出2001年的时间胶囊（谜题3-2）',
  ch3_read_diary: '解开周韵秋日记（谜题3-3，0621）',
  ch3_got_r3: '【残缺档案③】循环走廊门缝',
  ch3_timeline_done: '完成记忆时间线拼接（谜题3-4）',
  ch3_complete: '第三章完成（30岁的越洋通话）',
} as const;

export type FlagId = keyof typeof FLAGS;

export function isKnownFlag(f: string): f is FlagId {
  return f in FLAGS;
}

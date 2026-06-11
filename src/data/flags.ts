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

  // 第四章 · 乌鸦记录室
  ch4_fixed_two: '修复26/30岁两份被篡改档案（谜题4-1前半）',
  ch4_clock_done: '完成鹿的时钟走廊（谜题4-2）',
  ch4_got_draft: '从镜像档案室取回最后一份底稿（谜题4-3）',
  ch4_got_r4: '【残缺档案④】只能在镜中取得',
  ch4_fixed_all: '修复35岁档案（谜题4-1后半）',
  ch4_fox_done: '识破狐狸赌局，转出「无解」（谜题4-4）',
  ch4_complete: '第四章完成（35岁的半截粉笔）',

  // 第五章 · 档案404
  ch5_got_nib: '在机房抽屉找到钢笔尖',
  ch5_crt_done: '破解CRT烧屏密码，看到删除日志（谜题5-1）',
  ch5_got_paper: '拿到石桌上的信纸',
  ch5_dual_done: '完成双时空联动（谜题5-3）',
  ch5_got_r5: '【残缺档案⑤】2001书架深处（需传手电筒）',
  ch5_assembled: '重组档案404（谜题5-4）',
  ch5_complete: '第五章完成（明天答辩）',
} as const;

export type FlagId = keyof typeof FLAGS;

export function isKnownFlag(f: string): f is FlagId {
  return f in FLAGS;
}

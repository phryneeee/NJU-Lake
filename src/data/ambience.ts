/**
 * 房间 → 环境底噪映射（房间 JSON 的 ambience 字段优先于此表）。
 * 音频资产由 scripts/gen-audio.mjs 程序化合成。
 */
export const AMBIENCE_MAP: Record<string, string> = {
  // 第一章：现实日常
  ch1_corridor: 'amb_room',
  ch1_office: 'amb_room',
  ch1_archive_hall: 'amb_hum',
  ch1_storage: 'amb_archive',
  ch1_reading: 'amb_archive',
  // 第二章：夜与梦的边界
  ch2_library_hall: 'amb_room',
  ch2_floor5: 'amb_night',
  ch2_infinite: 'amb_dream',
  ch2_street: 'amb_night',
  ch2_elevator: 'amb_hum',
  ch2_b7: 'amb_dream',
  // 第三章：记忆
  ch3_dorm: 'amb_night',
  ch3_corridor_1: 'amb_dream',
  ch3_corridor_2: 'amb_dream',
  ch3_corridor_3: 'amb_dream',
  ch3_corridor_4: 'amb_dream',
  ch3_worksite: 'amb_2001',
  ch3_corridor_end: 'amb_dream',
  // 第四章：记录
  ch4_museum: 'amb_room',
  ch4_records: 'amb_dream',
  ch4_clock: 'amb_dream',
  ch4_mirror: 'amb_dream',
  // 第五章：404
  ch5_lab: 'amb_crt',
  ch5_lakeside: 'amb_lake',
  ch5_dual: 'amb_dream',
  ch5_desk: 'amb_archive',
  // 第六章：答辩与归档
  ch6_theater: 'amb_dream',
  ch6_cabinets: 'amb_archive',
  ch6_ending: 'amb_morning',
  ch6_infinity: 'amb_dream',
  ch6_deepest: 'amb_warm',
};

/** 房间/热区/动作的数据驱动定义。新增房间 = 一张背景 + 一个 JSON，不写新代码。 */

export interface RoomAction {
  type: 'say' | 'give' | 'take' | 'setFlag' | 'goRoom' | 'openPuzzle' | 'chapterCard' | 'playSfx';
  /** say: 文案 id（dialogue/chN.json 的 key） */
  textId?: string;
  /** playSfx: 音效 key（assets/audio/sfx_*.wav） */
  sfx?: string;
  /** give/take: 物品 id */
  item?: string;
  /** setFlag: flag id */
  flag?: string;
  /** goRoom: 目标房间 id */
  room?: string;
  /** openPuzzle: 谜题场景 key */
  puzzle?: string;
  /** openPuzzle: 传给谜题场景的配置（含 successActions） */
  config?: PuzzleConfig;
  /** chapterCard: 章节卡标题 */
  title?: string;
  /** chapterCard: 章节卡副标题 */
  subtitle?: string;
}

export interface PuzzleConfig {
  /** 谜题完成后在 RoomScene 上执行的动作 */
  successActions: RoomAction[];
  /** 各谜题自定义参数 */
  [key: string]: unknown;
}

export interface HotspotDef {
  id: string;
  /** [x, y, w, h]，2048×1536 逻辑坐标 */
  rect: [number, number, number, number];
  /** 仅当持有该 flag 时显示 */
  requiresFlag?: string;
  /** 仅当同时持有这些 flag 时显示（如三件信物都已归还） */
  requiresFlags?: string[];
  /** 仅当物品栏持有这些物品时显示（如隐藏结局需集齐6份残缺档案） */
  requiresItems?: string[];
  /** 持有该 flag 后隐藏（如已解开的锁） */
  hiddenIfFlag?: string;
  /** 直接点击触发 */
  onTap?: RoomAction[];
  /** 选中特定物品后点击触发 */
  useItem?: {
    item: string;
    /** 使用后是否从物品栏移除 */
    consume?: boolean;
    actions: RoomAction[];
  };
  /** 选错物品/不满足条件时的提示文案 id */
  wrongTextId?: string;
}

export interface RoomDef {
  id: string;
  /** 灰盒阶段显示的场景名 */
  label: string;
  /** 灰盒底色，如 "#3E5C4B" */
  color: string;
  /** 后期滤镜：grain=2026/梦境胶片颗粒，vhs=2001时间线 */
  filter?: 'grain' | 'vhs';
  /** 环境底噪 key（对应 src/assets/audio/<key>.*），缺资产时静默 */
  ambience?: string;
  exits?: { left?: string; right?: string };
  hotspots: HotspotDef[];
}

export interface ItemDef {
  id: string;
  name: string;
  color: string;
  /** 物品栏中查看时的描述文案 id */
  descTextId?: string;
}

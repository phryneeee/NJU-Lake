# 08 · Phaser 项目结构与技术架构

## 技术栈

- **Phaser 3.80+**（WebGL，含 PostFX pipeline 支持）+ **TypeScript 5** + **Vite**
- **Capacitor 6** 打包 iOS（推荐，比 Cordova 维护更活跃；WKWebView 跑 Phaser 在 iPad 上性能充裕）
- 存档：`@capacitor/preferences`（Web 端 fallback localStorage）
- 无后端、无账号、无内购——纯离线单机

## 核心架构思想：数据驱动的房间系统

谜题游戏最大的工程风险是"每个房间写一坨一次性代码"。本作把**房间、热区、物品、谜题状态**全部定义为 JSON 数据，引擎只写一次：

```
src/
├── main.ts                    # Phaser.Game 配置（2048×1536, Scale.FIT）
├── scenes/
│   ├── BootScene.ts           # 最小资源、存档读取
│   ├── PreloadScene.ts        # 按章节分包加载（进度条）
│   ├── RoomScene.ts           # ★ 通用房间场景：渲染任意 room JSON
│   ├── UIScene.ts             # 常驻覆盖层：物品栏/菜单/字幕（parallel scene）
│   ├── PuzzleScene.ts         # 全屏谜题子场景的基类（模态弹出）
│   └── CutsceneScene.ts       # 静帧+字幕+视差的过场播放器
├── puzzles/                   # 每个谜题一个类，继承 PuzzleScene
│   ├── DialLockPuzzle.ts      # 转盘锁（1-1/3-3 复用，参数化）
│   ├── SortPuzzle.ts          # 排序类（1-2/2-2/6-1 复用）
│   ├── VhsTuningPuzzle.ts
│   ├── RetroOSPuzzle.ts       # Win98 桌面（2-1/5-1 复用）
│   ├── MirrorRoomPuzzle.ts
│   ├── DualTimelinePuzzle.ts  # 5-3 双屏联动（全篇最大单体）
│   └── ...
├── systems/
│   ├── GameState.ts           # ★ 全局状态机：flags/inventory/章节进度（单一事实源）
│   ├── SaveSystem.ts          # 自动存档（每个 flag 变更节流写盘）
│   ├── InventorySystem.ts     # 物品获得/选中/组合/查看
│   ├── HotspotSystem.ts       # 热区：条件显隐、用物品、点击回调
│   ├── DialogueSystem.ts      # 单行字幕队列
│   ├── HintSystem.ts          # 卡关计时→乌鸦提示
│   └── AudioSystem.ts         # 底噪/音乐 crossfade、动机播放
├── fx/
│   ├── GrainPipeline.ts       # 胶片颗粒 PostFX
│   ├── VhsPipeline.ts         # 扫描线+色度溢出
│   └── GlitchPipeline.ts
├── data/
│   ├── rooms/                 # ★ 每个镜头一个 JSON
│   │   ├── ch1/office.json
│   │   └── ...
│   ├── items.json             # 全部物品定义
│   ├── dialogue/ch1.json      # 文案与独白（集中管理，便于校对）
│   └── flags.ts               # 所有剧情 flag 的类型常量（TS 字面量联合，拼写安全）
└── types/room.ts              # room JSON 的 TS 类型
```

## room JSON 示例（office.json）

```jsonc
{
  "id": "ch1_office",
  "background": "bg_office",
  "ambience": "amb_fluorescent",
  "filter": "grain2026",
  "exits": { "left": "ch1_corridor" },
  "hotspots": [
    {
      "id": "desk_drawer",
      "rect": [820, 900, 200, 120],
      "requiresFlag": "office_unlocked",
      "onTap": [{ "type": "openPuzzle", "puzzle": "SortPuzzle", "config": "slips_sort" }]
    },
    {
      "id": "door_lock",
      "rect": [1500, 600, 180, 260],
      "hiddenIfFlag": "office_unlocked",
      "onTap": [{ "type": "openPuzzle", "puzzle": "DialLockPuzzle",
                  "config": { "answer": "1919", "successFlag": "office_unlocked" } }]
    },
    {
      "id": "poster",
      "rect": [200, 300, 300, 400],
      "onTap": [{ "type": "say", "textId": "ch1.poster_beida" }]
    }
  ]
}
```

`RoomScene` 读 JSON → 摆背景 → 注册热区 → 根据 `GameState` flags 决定显隐。**新增一个房间 = 一张背景图 + 一个 JSON**，不写新代码。

## 状态与存档

- `GameState`：`flags: Set<FlagId>` + `inventory: ItemId[]` + `chapter/room` 指针 + `archives: 0–6`（残缺档案计数）。
- 事件总线（Phaser EventEmitter）解耦：谜题完成 → `emit('flag', 'vhs_watched')` → RoomScene/UIScene 各自响应。
- 存档即序列化 GameState，版本号字段防止更新后坏档。

## iOS 打包要点

- Capacitor：`npx cap add ios`，`webDir: dist`；锁横屏（Info.plist `UISupportedInterfaceOrientations`）。
- 音频解锁：iOS 需要首次触摸后 `this.sound.unlock()`——标题页"点击开始"天然解决。
- 性能：PostFX 只挂当前镜头一层；纹理按章节 atlas 分包（TexturePacker 或 free-tex-packer），单 atlas ≤ 4096²；实测 iPad 2020 以上 60fps 无压力。
- TestFlight：Xcode Archive → App Store Connect → 内部测试组（≤100人无需审核，外部测试需 Beta 审核）。

## 体积预算

背景 28 张 ×~400KB（atlas 压缩后）+ 物品/UI + 音频 25MB ≈ **总包 < 80MB**，TestFlight 无压力。

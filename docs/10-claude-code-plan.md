# 10 · Claude Code 分阶段开发计划

> 用法：每个阶段一个独立 Claude Code 会话（或 /clear 后继续），按顺序执行。每阶段末尾有验收命令。本文档 + 对应设计文档喂给 Claude Code 作为上下文。

## 阶段 0 · 脚手架（0.5 天）

```
提示词要点：
- 创建 Vite + TypeScript + Phaser 3.80 项目，逻辑分辨率 2048×1536，Scale.FIT 横屏
- 目录结构按 docs/08-architecture.md
- 配置 ESLint + Prettier + strict TS
- BootScene → PreloadScene → 一个显示"Hello Archive"的 RoomScene 占位
- npm scripts: dev / build / typecheck
```
验收：`npm run dev` 浏览器可见占位场景；`npm run typecheck` 零错误。

## 阶段 1 · 核心系统（2–3 天）

```
任务清单（每条单独一次对话，避免大杂烩 commit）：
1. types/room.ts + RoomScene：加载 data/rooms/*.json，渲染背景/热区/出口箭头
2. GameState + flags.ts（字面量联合类型）+ SaveSystem（localStorage，节流写入）
3. UIScene：8 格物品栏、物品选中/使用/双击放大、单行字幕队列（DialogueSystem）
4. HotspotSystem 动作解释器：say / give / openPuzzle / setFlag / goRoom / playSfx
5. PuzzleScene 模态基类（暗化背景、关闭按钮、成功回调发 flag）
```
验收：手写 2 个测试 room JSON，可走房间、捡物品、用物品开热区、刷新页面后状态保持。

## 阶段 2 · 谜题组件库（3–4 天）

```
按 docs/03-puzzles.md 实现可复用谜题类（每个一次对话+一个演示JSON）：
DialLockPuzzle（数字/汉字盘参数化）→ SortPuzzle（卡槽排序）→
IndexCabinetPuzzle（1-3）→ VhsTuningPuzzle → QuizPuzzle（2-3）→
ElevatorPuzzle（2-4）→ CombineItem 逻辑（InventorySystem 内）
```
验收：谜题陈列馆场景（debug room）逐个可玩、可重置。

## 阶段 3 · 第一章组装 = MVP（2 天）

```
- 按 docs/02-chapters.md 第一章流程写 ch1 的 5 个 room JSON + dialogue/ch1.json
- 灰盒背景：纯色块 + 文字标注的 PNG（让 Claude Code 用 canvas 脚本批量生成）
- 章节卡、开场字幕、章末钩子演出（CutsceneScene）
- Capacitor 接入 + iOS 工程，真机跑通
```
验收：docs/09-mvp.md 验收清单。

## 阶段 4 · 第 2–3 章（4–5 天）

```
- RetroOSPuzzle（Win98 桌面组件，2-1）
- 无限图书馆循环逻辑（出口指回自身+计数器）、猫头鹰问答
- 循环走廊（差分图切换+找不同热区）、时间胶囊组合、日记锁、时间线拼接轨道
- GrainPipeline / VhsPipeline 两个 PostFX
```
验收：1–3 章连续灰盒通玩；2001 场景挂 VHS 滤镜。

## 阶段 5 · 第 4–5 章（技术攻坚，5 天）

```
- MirrorRoomPuzzle（镜像联动：同一 room 状态渲染两次，输入坐标翻转映射）
- 狐狸赌局（汉字转盘复用 DialLockPuzzle）
- CRT 烧屏（关屏=切换烧屏纹理图层）
- DualTimelinePuzzle（5-3）：两个并行 RoomScene 实例上下排布 + 还书箱共享物品槽
- GlitchPipeline、机房群屏演出
```
验收：4–5 章灰盒通玩；5-3 在 iPad 真机不掉帧。

## 阶段 6 · 第 6 章 + 双结局 + 隐藏链（3 天）

```
- 幻灯片排序（复用 SortPuzzle）、归还信物（物品+托盘匹配）、签名交互（指尖轨迹绘制）
- 四柜任选→同一结局的演出；制作名单滚动
- 残缺档案 R1–R6 收集与修复小交互、B∞ 解锁、六兽门环（H-1）、隐藏结局演出
```
验收：全流程通玩；速通计时 90–120 分钟区间；隐藏结局条件正确。

## 阶段 7 · 美术替换 + 音频（与 6 可并行，1–2 周人肉绘画期）

```
Claude Code 在此阶段的角色：
- 写 atlas 打包脚本（free-tex-packer-cli）与按章节分包加载
- 写美术替换 checklist 脚本：扫描 room JSON 引用的纹理 key vs assets 目录，列出缺口
- AudioSystem：底噪 crossfade、动机触发表、iOS 触摸解锁
- 接入正式字体、设置页（音量/颗粒开关/辅助模式/跳过谜题）
```
验收：视觉/听觉完成；设置项生效并入存档。

## 阶段 8 · 发布（2–3 天）

```
- 性能 pass：纹理内存、PostFX 数量、低端 iPad 测试
- 防呆 pass：让 Claude Code 写一个"自动通关脚本"（按 flag 顺序触发）做回归测试
- 图标/启动屏/Info.plist/隐私清单（无收集=极简）
- Xcode Archive → App Store Connect → TestFlight 内部组发布说明
```
验收：TestFlight 链接发到朋友群。

## 给 Claude Code 的协作守则（写进 CLAUDE.md）

1. 所有剧情内容以 docs/01–03 为唯一事实源，不得擅自改写谜题答案与台词。
2. 新房间/谜题一律走数据驱动管线，禁止在场景类里硬编码剧情。
3. flag 命名 `chN_动词_名词`（如 `ch1_watched_vhs`），新增必须先登记 flags.ts。
4. 每个阶段一个分支，验收过了再合 main；commit 信息用中文描述玩家可感知的变化。
5. 改动谜题难度参数时，同步更新 docs/03 的对应条目。

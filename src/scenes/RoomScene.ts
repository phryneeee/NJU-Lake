import Phaser from 'phaser';
import type { HotspotDef, RoomDef } from '../types/room';
import { getRoom, getText } from '../data/registry';
import { GameState } from '../systems/GameState';
import { runActions } from '../systems/actions';
import { W, H, COLORS } from '../ui/theme';
import { GrainPostFX, VhsPostFX } from '../fx/pipelines';
import { Settings } from '../systems/Settings';
import { AudioSystem } from '../systems/AudioSystem';

/** 灰盒模式：显示热区轮廓与 id，便于测试。正式美术阶段关闭。 */
const GREYBOX = true;

/** 卡关多久后开始提示热区（毫秒） */
const HINT_IDLE_MS = 240_000;

/**
 * 通用房间场景：渲染任意 room JSON（背景、热区、出口箭头）。
 * 房间内容全部由 data/rooms/**.json 驱动。
 * 正式背景图放在 src/assets/bg/<roomId>.png 即自动替换灰盒底色。
 */
export class RoomScene extends Phaser.Scene {
  private room!: RoomDef;
  private hotspotLayer!: Phaser.GameObjects.Container;
  private zones: Phaser.GameObjects.Rectangle[] = [];
  private lastProgress = 0;
  private hintShown = false;
  private hasArt = false;

  constructor() {
    super('Room');
  }

  create(): void {
    this.room = getRoom(GameState.currentRoom);

    // 背景：有正式美术用图，否则灰盒底色+场景名
    const bgKey = `bg_${this.room.id}`;
    this.hasArt = this.textures.exists(bgKey);
    if (this.hasArt) {
      this.add.image(W / 2, H / 2, bgKey).setDisplaySize(W, H);
    } else {
      this.add.rectangle(W / 2, H / 2, W, H, Phaser.Display.Color.HexStringToColor(this.room.color).color);
      this.add
        .text(W / 2, 200, this.room.label, {
          fontSize: '56px',
          color: COLORS.paper,
          fontFamily: 'serif',
        })
        .setOrigin(0.5)
        .setAlpha(0.55);
    }

    this.applyFilter();
    AudioSystem.setAmbience(this, this.room.ambience);

    this.hotspotLayer = this.add.container(0, 0);
    this.buildHotspots();
    this.buildExits();

    // flag/物品变化后重建热区刷新显隐，并重置卡关计时
    const onFlag = (): void => {
      this.lastProgress = this.time.now;
      this.hintShown = false;
      this.time.delayedCall(0, () => this.buildHotspots());
    };
    GameState.on('flag', onFlag);
    GameState.on('inventory', onFlag);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      GameState.off('flag', onFlag);
      GameState.off('inventory', onFlag);
    });

    this.lastProgress = this.time.now;
    if (!this.scene.isActive('UI')) this.scene.launch('UI');
  }

  override update(): void {
    // 柔性提示：长时间没有进展时，所有热区微光呼吸（设计文档里这一拍由乌鸦飞落代替）
    if (!this.hintShown && this.time.now - this.lastProgress > HINT_IDLE_MS) {
      this.hintShown = true;
      GameState.say(getText('common.hint_crow'));
      this.pulseZones();
    }
  }

  private pulseZones(): void {
    for (const z of this.zones) {
      this.tweens.add({
        targets: z,
        fillAlpha: 0.25,
        duration: 900,
        yoyo: true,
        repeat: 5,
      });
    }
  }

  private applyFilter(): void {
    const cam = this.cameras.main;
    cam.resetPostPipeline();
    if (!Settings.get().filters) return;
    if (this.game.renderer.type !== Phaser.WEBGL) return;
    if (this.room.filter === 'grain') cam.setPostPipeline(GrainPostFX);
    else if (this.room.filter === 'vhs') cam.setPostPipeline(VhsPostFX);
  }

  private buildHotspots(): void {
    this.hotspotLayer.removeAll(true);
    this.zones = [];
    for (const h of this.room.hotspots) {
      if (h.requiresFlag && !GameState.hasFlag(h.requiresFlag)) continue;
      if (h.requiresFlags && !h.requiresFlags.every((f) => GameState.hasFlag(f))) continue;
      if (h.hiddenIfFlag && GameState.hasFlag(h.hiddenIfFlag)) continue;
      if (h.requiresItems && !h.requiresItems.every((it) => GameState.hasItem(it))) continue;
      this.addHotspot(h);
    }
  }

  private addHotspot(h: HotspotDef): void {
    const [x, y, w, hh] = h.rect;
    const greybox = GREYBOX && !this.hasArt; // 有正式美术的房间不画灰盒描边
    const zone = this.add
      .rectangle(x + w / 2, y + hh / 2, w, hh, 0xffffff, greybox ? 0.08 : 0.001)
      .setInteractive({ useHandCursor: true });
    this.zones.push(zone);

    // 辅助模式：可交互热区微光呼吸
    if (Settings.get().assist) {
      this.tweens.add({ targets: zone, fillAlpha: 0.15, duration: 1400, yoyo: true, repeat: -1 });
    }

    if (greybox) {
      zone.setStrokeStyle(3, 0xe8dcc0, 0.5);
      const label = this.add
        .text(x + w / 2, y + hh / 2, h.id, {
          fontSize: '26px',
          color: COLORS.paper,
          fontFamily: 'monospace',
        })
        .setOrigin(0.5)
        .setAlpha(0.6);
      this.hotspotLayer.add(label);
    }

    zone.on('pointerdown', () => this.tapHotspot(h, zone));
    this.hotspotLayer.add(zone);
  }

  private tapHotspot(h: HotspotDef, zone: Phaser.GameObjects.Rectangle): void {
    const selected = GameState.selectedItem;

    // 使用物品分支
    if (h.useItem) {
      if (selected === h.useItem.item) {
        if (h.useItem.consume) GameState.takeItem(h.useItem.item);
        GameState.select(null);
        runActions(this, h.useItem.actions);
        return;
      }
      // 需要物品但没选对：给提示
      GameState.say(getText(h.wrongTextId ?? 'common.nothing'));
      this.shake(zone);
      return;
    }

    if (h.onTap) {
      runActions(this, h.onTap);
      this.tweens.add({ targets: zone, scale: 0.96, duration: 70, yoyo: true });
      return;
    }

    GameState.say(getText(h.wrongTextId ?? 'common.nothing'));
  }

  private shake(target: Phaser.GameObjects.Rectangle): void {
    this.tweens.add({ targets: target, x: target.x + 8, duration: 50, yoyo: true, repeat: 2 });
  }

  private buildExits(): void {
    const exits = this.room.exits ?? {};
    if (exits.left) this.addArrow(110, exits.left, true);
    if (exits.right) this.addArrow(W - 110, exits.right, false);
  }

  private addArrow(x: number, target: string, left: boolean): void {
    // Triangle 形状没有 Flip 组件，直接按方向给顶点
    const pts: [number, number, number, number, number, number] = left
      ? [0, 40, 64, 0, 64, 80]
      : [64, 40, 0, 0, 0, 80];
    const tri = this.add
      .triangle(x, H / 2 + 100, ...pts, 0xe8dcc0, 0.75)
      .setInteractive({ useHandCursor: true });
    tri.on('pointerdown', () => {
      GameState.setRoom(target);
      this.scene.restart();
    });
  }
}

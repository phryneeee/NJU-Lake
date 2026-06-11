import Phaser from 'phaser';
import type { HotspotDef, RoomDef } from '../types/room';
import { getRoom, getText } from '../data/registry';
import { GameState } from '../systems/GameState';
import { runActions } from '../systems/actions';
import { W, H, COLORS } from '../ui/theme';

/** 灰盒模式：显示热区轮廓与 id，便于测试。正式美术阶段关闭。 */
const GREYBOX = true;

/**
 * 通用房间场景：渲染任意 room JSON（背景、热区、出口箭头）。
 * 房间内容全部由 data/rooms/**.json 驱动。
 */
export class RoomScene extends Phaser.Scene {
  private room!: RoomDef;
  private hotspotLayer!: Phaser.GameObjects.Container;

  constructor() {
    super('Room');
  }

  create(): void {
    this.room = getRoom(GameState.currentRoom);

    // 灰盒背景：底色 + 顶部场景名
    this.add.rectangle(W / 2, H / 2, W, H, Phaser.Display.Color.HexStringToColor(this.room.color).color);
    this.add
      .text(W / 2, 200, this.room.label, {
        fontSize: '56px',
        color: COLORS.paper,
        fontFamily: 'serif',
      })
      .setOrigin(0.5)
      .setAlpha(0.55);

    this.hotspotLayer = this.add.container(0, 0);
    this.buildHotspots();
    this.buildExits();

    // flag 变化（如谜题成功）后重建热区，刷新显隐
    const onFlag = (): void => {
      this.time.delayedCall(0, () => this.buildHotspots());
    };
    GameState.on('flag', onFlag);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => GameState.off('flag', onFlag));

    if (!this.scene.isActive('UI')) this.scene.launch('UI');
  }

  private buildHotspots(): void {
    this.hotspotLayer.removeAll(true);
    for (const h of this.room.hotspots) {
      if (h.requiresFlag && !GameState.hasFlag(h.requiresFlag)) continue;
      if (h.hiddenIfFlag && GameState.hasFlag(h.hiddenIfFlag)) continue;
      this.addHotspot(h);
    }
  }

  private addHotspot(h: HotspotDef): void {
    const [x, y, w, hh] = h.rect;
    const zone = this.add
      .rectangle(x + w / 2, y + hh / 2, w, hh, 0xffffff, GREYBOX ? 0.08 : 0.001)
      .setInteractive({ useHandCursor: true });

    if (GREYBOX) {
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

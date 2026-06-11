import Phaser from 'phaser';
import { GameState } from '../systems/GameState';
import { getItem } from '../data/registry';
import { W, H, COLORS } from '../ui/theme';

const SLOT_COUNT = 8;
const SLOT_SIZE = 150;
const SLOT_GAP = 18;

/**
 * 常驻覆盖层：物品栏（顶部8格）+ 单行字幕（底部）+ 章节卡。
 * 与 RoomScene 并行运行，通过 GameState 事件通信。
 */
export class UIScene extends Phaser.Scene {
  private slots: Phaser.GameObjects.Container[] = [];
  private subtitle!: Phaser.GameObjects.Text;
  private subtitleBg!: Phaser.GameObjects.Rectangle;
  private sayQueue: string[] = [];
  private sayTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super('UI');
  }

  create(): void {
    this.buildInventory();
    this.buildSubtitle();

    GameState.on('inventory', this.refreshInventory, this);
    GameState.on('select', this.refreshInventory, this);
    GameState.on('say', this.enqueueSay, this);
    GameState.on('chapterCard', this.showChapterCard, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      GameState.off('inventory', this.refreshInventory, this);
      GameState.off('select', this.refreshInventory, this);
      GameState.off('say', this.enqueueSay, this);
      GameState.off('chapterCard', this.showChapterCard, this);
    });

    this.refreshInventory();
  }

  // ---- 物品栏 ----

  private buildInventory(): void {
    const totalW = SLOT_COUNT * SLOT_SIZE + (SLOT_COUNT - 1) * SLOT_GAP;
    const startX = (W - totalW) / 2 + SLOT_SIZE / 2;
    for (let i = 0; i < SLOT_COUNT; i++) {
      const c = this.add.container(startX + i * (SLOT_SIZE + SLOT_GAP), 40 + SLOT_SIZE / 2);
      this.slots.push(c);
    }
  }

  private refreshInventory(): void {
    for (let i = 0; i < SLOT_COUNT; i++) {
      const c = this.slots[i];
      c.removeAll(true);
      const frame = this.add
        .rectangle(0, 0, SLOT_SIZE, SLOT_SIZE, 0x000000, 0.35)
        .setStrokeStyle(3, 0xe8dcc0, 0.35);
      c.add(frame);

      const itemId = GameState.inventory[i];
      if (!itemId) continue;
      const item = getItem(itemId);
      const selected = GameState.selectedItem === itemId;

      const tile = this.add
        .rectangle(0, 0, SLOT_SIZE - 24, SLOT_SIZE - 24, Phaser.Display.Color.HexStringToColor(item.color).color)
        .setInteractive({ useHandCursor: true });
      const label = this.add
        .text(0, 0, item.name, {
          fontSize: '26px',
          color: '#1C1A17',
          fontFamily: 'serif',
          backgroundColor: '#E8DCC0CC',
          padding: { x: 6, y: 4 },
          align: 'center',
          wordWrap: { width: SLOT_SIZE - 30 },
        })
        .setOrigin(0.5);

      if (selected) {
        frame.setStrokeStyle(5, 0x7fd4c1, 1);
        tile.setScale(1.08);
      }
      tile.on('pointerdown', () => {
        const cur = GameState.selectedItem;
        // 选中另一物品时点击：先尝试合成
        if (cur && cur !== itemId) {
          const out = GameState.combine(cur, itemId);
          if (out) {
            GameState.select(null);
            GameState.say(`组合出了：${getItem(out).name}`);
            return;
          }
        }
        GameState.select(selected ? null : itemId);
      });
      c.add([tile, label]);
    }
  }

  // ---- 字幕 ----

  private buildSubtitle(): void {
    this.subtitleBg = this.add
      .rectangle(W / 2, H - 110, W * 0.8, 96, 0x000000, 0.55)
      .setVisible(false);
    this.subtitle = this.add
      .text(W / 2, H - 110, '', {
        fontSize: '40px',
        color: COLORS.paper,
        fontFamily: 'serif',
        align: 'center',
        wordWrap: { width: W * 0.75 },
      })
      .setOrigin(0.5)
      .setVisible(false);
  }

  private enqueueSay(text: string): void {
    this.sayQueue.push(text);
    if (!this.sayTimer) this.nextSay();
  }

  private nextSay(): void {
    const text = this.sayQueue.shift();
    if (text === undefined) {
      this.sayTimer = undefined;
      this.subtitle.setVisible(false);
      this.subtitleBg.setVisible(false);
      return;
    }
    this.subtitle.setText(text).setVisible(true);
    this.subtitleBg.setVisible(true);
    // 按文本长度停留：每字 90ms，最少 1.6s
    const ms = Math.max(1600, text.length * 90);
    this.sayTimer = this.time.delayedCall(ms, () => this.nextSay());
  }

  // ---- 章节卡 ----

  private showChapterCard(title: string, subtitle: string): void {
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setDepth(100);
    const t1 = this.add
      .text(W / 2, H / 2 - 50, title, { fontSize: '88px', color: COLORS.paper, fontFamily: 'serif' })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(101);
    const t2 = this.add
      .text(W / 2, H / 2 + 70, subtitle, { fontSize: '44px', color: COLORS.crtCyan, fontFamily: 'serif' })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(101);

    this.tweens.add({ targets: dim, fillAlpha: 0.92, duration: 1200 });
    this.tweens.add({ targets: [t1, t2], alpha: 1, duration: 1500, delay: 900 });

    this.time.delayedCall(2600, () => {
      const hint = this.add
        .text(W / 2, H - 200, '点击继续', { fontSize: '32px', color: '#888', fontFamily: 'serif' })
        .setOrigin(0.5)
        .setDepth(101);
      dim.setInteractive();
      dim.once('pointerdown', () => {
        [dim, t1, t2, hint].forEach((o) => o.destroy());
        this.scene.stop('Room');
        this.scene.stop();
        this.scene.start('Title');
      });
    });
  }
}

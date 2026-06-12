import Phaser from 'phaser';
import { GameState } from '../systems/GameState';
import { getItem, getText } from '../data/registry';
import { W, H, COLORS } from '../ui/theme';
import { Settings } from '../systems/Settings';
import { clearState } from '../systems/SaveSystem';
import { AudioSystem } from '../systems/AudioSystem';

const SLOT_COUNT = 12;
const SLOT_SIZE = 140;
const SLOT_GAP = 16;

/**
 * 常驻覆盖层：物品栏（顶部8格）+ 单行字幕（底部）+ 章节卡。
 * 与 RoomScene 并行运行，通过 GameState 事件通信。
 */
export class UIScene extends Phaser.Scene {
  private slots: Phaser.GameObjects.Container[] = [];
  private itemCaption!: Phaser.GameObjects.Text;
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
    this.buildMenuButton();

    GameState.on('inventory', this.refreshInventory, this);
    GameState.on('select', this.refreshInventory, this);
    GameState.on('say', this.enqueueSay, this);
    GameState.on('chapterCard', this.showChapterCard, this);
    GameState.on('gain', this.onGain, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      GameState.off('inventory', this.refreshInventory, this);
      GameState.off('select', this.refreshInventory, this);
      GameState.off('say', this.enqueueSay, this);
      GameState.off('chapterCard', this.showChapterCard, this);
      GameState.off('gain', this.onGain, this);
    });

    this.refreshInventory();
  }

  private onGain(): void {
    AudioSystem.sfx(this, 'sfx_pickup');
  }

  // ---- 物品栏 ----

  private buildInventory(): void {
    const totalW = SLOT_COUNT * SLOT_SIZE + (SLOT_COUNT - 1) * SLOT_GAP;
    const startX = (W - totalW) / 2 + SLOT_SIZE / 2;
    for (let i = 0; i < SLOT_COUNT; i++) {
      const c = this.add.container(startX + i * (SLOT_SIZE + SLOT_GAP), 40 + SLOT_SIZE / 2);
      this.slots.push(c);
    }
    // 选中物品的名称+描述（物品栏正下方）
    this.itemCaption = this.add
      .text(W / 2, 40 + SLOT_SIZE + 36, '', {
        fontSize: '30px',
        color: COLORS.crtCyan,
        fontFamily: 'serif',
        align: 'center',
        backgroundColor: '#00000088',
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5)
      .setVisible(false);
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

      // 有正式图标用图标，否则回退灰盒色块+名字
      let tile: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
      const iconKey = `item_${itemId}`;
      if (this.textures.exists(iconKey)) {
        tile = this.add
          .image(0, 0, iconKey)
          .setDisplaySize(SLOT_SIZE - 14, SLOT_SIZE - 14)
          .setInteractive({ useHandCursor: true });
        c.add(tile);
      } else {
        tile = this.add
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
        c.add([tile, label]);
      }

      if (selected) {
        frame.setStrokeStyle(5, 0x7fd4c1, 1);
        tile.setScale(tile.scale * 1.08);
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
    }

    // 选中物品说明条
    const sel = GameState.selectedItem;
    if (sel) {
      const item = getItem(sel);
      const desc = item.descTextId ? getText(item.descTextId) : '';
      this.itemCaption.setText(`【${item.name}】${desc}`).setVisible(true);
    } else {
      this.itemCaption.setVisible(false);
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

  // ---- 菜单 / 设置 ----

  private buildMenuButton(): void {
    const btn = this.add
      .text(W - 70, 100, '≡', { fontSize: '64px', color: COLORS.paper, fontFamily: 'serif' })
      .setOrigin(0.5)
      .setAlpha(0.7)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => this.openSettings());
  }

  private openSettings(): void {
    const layer = this.add.container(0, 0).setDepth(200);
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8).setInteractive();
    const panel = this.add
      .rectangle(W / 2, H / 2, 900, 980, 0x26231f)
      .setStrokeStyle(4, 0xe8dcc0, 0.5);
    const title = this.add
      .text(W / 2, H / 2 - 400, '设置', { fontSize: '56px', color: COLORS.paper, fontFamily: 'serif' })
      .setOrigin(0.5);
    layer.add([dim, panel, title]);

    const row = (y: number, label: () => string, onTap: () => void): void => {
      const btn = this.add
        .rectangle(W / 2, y, 700, 110, 0x3e5c4b)
        .setStrokeStyle(3, 0xe8dcc0, 0.6)
        .setInteractive({ useHandCursor: true });
      const t = this.add
        .text(W / 2, y, label(), { fontSize: '38px', color: COLORS.paper, fontFamily: 'serif' })
        .setOrigin(0.5);
      btn.on('pointerdown', () => {
        onTap();
        t.setText(label());
      });
      layer.add([btn, t]);
    };

    row(H / 2 - 240, () => `画面滤镜（颗粒/VHS）：${Settings.get().filters ? '开' : '关'}`, () => {
      Settings.set({ filters: !Settings.get().filters });
      this.scene.get('Room').scene.restart(); // 立即生效
    });
    row(H / 2 - 100, () => `声音：${Settings.get().muted ? '静音' : '开'}`, () => {
      Settings.set({ muted: !Settings.get().muted });
      this.game.sound.mute = Settings.get().muted;
    });
    row(H / 2 + 40, () => `辅助模式（热区微光）：${Settings.get().assist ? '开' : '关'}`, () => {
      Settings.set({ assist: !Settings.get().assist });
      this.scene.get('Room').scene.restart();
    });
    row(H / 2 + 180, () => '回到标题', () => {
      layer.destroy();
      this.scene.stop('Room');
      this.scene.stop();
      this.scene.start('Title');
    });
    row(H / 2 + 320, () => '清除存档并重新开始', () => {
      clearState();
      GameState.resetAll();
      layer.destroy();
      this.scene.stop('Room');
      this.scene.stop();
      this.scene.start('Title');
    });

    const close = this.add
      .text(W / 2 + 400, H / 2 - 430, '✕', { fontSize: '52px', color: COLORS.paper, fontFamily: 'serif' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => layer.destroy());
    layer.add(close);
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

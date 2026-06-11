import Phaser from 'phaser';
import { PuzzleScene } from './PuzzleScene';
import { COLORS } from '../ui/theme';

interface SortCard {
  id: string;
  label: string;
}

/**
 * 卡槽排序谜题（谜题1-2 借阅单整理，6-1 幻灯片复用）。
 * 触控友好：点卡片放入第一个空槽，点槽中卡片退回。全部放满自动判定。
 * config: { prompt, cards: SortCard[], correctOrder: string[] }
 */
export class SortPuzzle extends PuzzleScene {
  private trayCards = new Map<string, Phaser.GameObjects.Container>();
  private slotContents: (string | null)[] = [];
  private slotMarks: Phaser.GameObjects.Container[] = [];

  constructor() {
    super('SortPuzzle');
  }

  protected buildPuzzle(): void {
    const cards = (this.config.cards as SortCard[]) ?? [];
    const correct = (this.config.correctOrder as string[]) ?? [];
    this.slotContents = new Array(correct.length).fill(null);

    this.panelText(0, -460, String(this.config.prompt ?? ''), 36);

    // 上排：卡槽
    const slotW = 200;
    const gap = 28;
    const startX = -((correct.length - 1) * (slotW + gap)) / 2;
    for (let i = 0; i < correct.length; i++) {
      const x = startX + i * (slotW + gap);
      const slot = this.add
        .rectangle(x, -200, slotW, 260, 0x1c1a17)
        .setStrokeStyle(3, 0x7fd4c1, 0.5)
        .setInteractive({ useHandCursor: true });
      const idx = this.add
        .text(x, -200 - 160, `${i + 1}`, { fontSize: '32px', color: '#777', fontFamily: 'monospace' })
        .setOrigin(0.5);
      slot.on('pointerdown', () => this.tapSlot(i));
      const mark = this.add.container(x, -200);
      this.slotMarks.push(mark);
      this.panel.add([slot, idx, mark]);
    }

    // 下排：待排卡片
    const cardStartX = -((cards.length - 1) * (slotW + gap)) / 2;
    cards.forEach((card, i) => {
      const c = this.makeCard(card, cardStartX + i * (slotW + gap), 220);
      this.trayCards.set(card.id, c);
    });
  }

  private makeCard(card: SortCard, x: number, y: number): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const bg = this.add
      .rectangle(0, 0, 190, 250, 0xe8dcc0)
      .setInteractive({ useHandCursor: true });
    const label = this.add
      .text(0, 0, card.label, {
        fontSize: '30px',
        color: '#1C1A17',
        fontFamily: 'serif',
        align: 'center',
        wordWrap: { width: 170 },
      })
      .setOrigin(0.5);
    c.add([bg, label]);
    bg.on('pointerdown', () => this.tapCard(card.id));
    this.panel.add(c);
    c.setData('home', { x, y });
    return c;
  }

  private tapCard(id: string): void {
    const inSlot = this.slotContents.indexOf(id);
    if (inSlot >= 0) {
      // 已在槽中：退回托盘
      this.slotContents[inSlot] = null;
      this.moveCardHome(id);
      return;
    }
    const empty = this.slotContents.indexOf(null);
    if (empty === -1) return;
    this.slotContents[empty] = id;
    const card = this.trayCards.get(id);
    if (!card) return;
    const slotX = this.slotMarks[empty].x;
    this.tweens.add({ targets: card, x: slotX, y: -200, duration: 160 });
    this.time.delayedCall(180, () => this.maybeCheck());
  }

  private tapSlot(i: number): void {
    const id = this.slotContents[i];
    if (id) {
      this.slotContents[i] = null;
      this.moveCardHome(id);
    }
  }

  private moveCardHome(id: string): void {
    const card = this.trayCards.get(id);
    if (!card) return;
    const home = card.getData('home') as { x: number; y: number };
    this.tweens.add({ targets: card, x: home.x, y: home.y, duration: 160 });
  }

  private maybeCheck(): void {
    if (this.slotContents.some((s) => s === null)) return;
    const correct = (this.config.correctOrder as string[]) ?? [];
    const ok = correct.every((id, i) => this.slotContents[i] === id);
    if (ok) {
      this.cameras.main.flash(300, 127, 212, 193);
      this.time.delayedCall(400, () => this.succeed());
    } else {
      this.cameras.main.shake(180, 0.006);
      const text = this.add
        .text(0, 0, '顺序不对……再看看日期。', {
          fontSize: '34px',
          color: COLORS.rustRed,
          fontFamily: 'serif',
        })
        .setOrigin(0.5);
      this.panel.add(text);
      this.time.delayedCall(1200, () => text.destroy());
      // 全部退回
      this.slotContents.forEach((id) => id && this.moveCardHome(id));
      this.slotContents.fill(null);
    }
  }
}

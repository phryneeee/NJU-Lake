import Phaser from 'phaser';
import { PuzzleScene } from './PuzzleScene';
import { COLORS } from '../ui/theme';

interface SortCard {
  id: string;
  label: string;
}

/**
 * 卡槽排序/归位谜题（1-2 借阅单、2-2 书脊、3-4 时间线、6-1 幻灯片复用）。
 * 触控友好：点卡片放入第一个空槽，点槽中卡片退回。全部放满自动判定。
 * config: {
 *   prompt: string,
 *   cards: SortCard[],
 *   correctOrder: string[],
 *   slotLabels?: string[],   // 槽位上方标签（如时间线站点名），缺省显示序号
 *   wrongText?: string,
 * }
 */
export class SortPuzzle extends PuzzleScene {
  private trayCards = new Map<string, Phaser.GameObjects.Container>();
  private slotContents: (string | null)[] = [];
  private slotXs: number[] = [];
  private cardW = 190;

  constructor(key = 'SortPuzzle') {
    super(key);
  }

  protected buildPuzzle(): void {
    const cards = (this.config.cards as SortCard[]) ?? [];
    const correct = (this.config.correctOrder as string[]) ?? [];
    const slotLabels = this.config.slotLabels as string[] | undefined;
    this.slotContents = new Array(correct.length).fill(null);

    this.panelText(0, -460, String(this.config.prompt ?? ''), 36);

    // 按数量自适应卡片宽度
    const n = Math.max(cards.length, correct.length);
    const gap = 24;
    this.cardW = Math.min(190, Math.floor((this.panelWidth() - 140) / n) - gap);

    const startX = -((correct.length - 1) * (this.cardW + gap)) / 2;
    for (let i = 0; i < correct.length; i++) {
      const x = startX + i * (this.cardW + gap);
      this.slotXs.push(x);
      const slot = this.add
        .rectangle(x, -200, this.cardW + 10, 270, 0x1c1a17)
        .setStrokeStyle(3, 0x7fd4c1, 0.5)
        .setInteractive({ useHandCursor: true });
      const labelText = slotLabels?.[i] ?? `${i + 1}`;
      const idx = this.add
        .text(x, -200 - 165, labelText, {
          fontSize: slotLabels ? '26px' : '32px',
          color: '#9a9a8a',
          fontFamily: 'serif',
          align: 'center',
          wordWrap: { width: this.cardW + 20 },
        })
        .setOrigin(0.5);
      slot.on('pointerdown', () => this.tapSlot(i));
      this.panel.add([slot, idx]);
    }

    const cardStartX = -((cards.length - 1) * (this.cardW + gap)) / 2;
    cards.forEach((card, i) => {
      const c = this.makeCard(card, cardStartX + i * (this.cardW + gap), 220);
      this.trayCards.set(card.id, c);
    });
  }

  private makeCard(card: SortCard, x: number, y: number): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const bg = this.add
      .rectangle(0, 0, this.cardW, 250, 0xe8dcc0)
      .setInteractive({ useHandCursor: true });
    const label = this.add
      .text(0, 0, card.label, {
        fontSize: '28px',
        color: '#1C1A17',
        fontFamily: 'serif',
        align: 'center',
        wordWrap: { width: this.cardW - 16 },
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
      this.slotContents[inSlot] = null;
      this.moveCardHome(id);
      return;
    }
    const empty = this.slotContents.indexOf(null);
    if (empty === -1) return;
    this.slotContents[empty] = id;
    this.sfx('sfx_page');
    const card = this.trayCards.get(id);
    if (!card) return;
    this.tweens.add({ targets: card, x: this.slotXs[empty], y: -200, duration: 160 });
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
      this.sfx('sfx_error');
      this.cameras.main.shake(180, 0.006);
      const text = this.add
        .text(0, 0, String(this.config.wrongText ?? '顺序不对……再想想。'), {
          fontSize: '34px',
          color: COLORS.rustRed,
          fontFamily: 'serif',
        })
        .setOrigin(0.5);
      this.panel.add(text);
      this.time.delayedCall(1200, () => text.destroy());
      this.slotContents.forEach((id) => id && this.moveCardHome(id));
      this.slotContents.fill(null);
    }
  }
}

import Phaser from 'phaser';
import { PuzzleScene } from './PuzzleScene';
import { COLORS } from '../ui/theme';

/**
 * 转盘密码锁（谜题1-1，参数化后 3-3 等复用）。
 * config: { answer: "1919", prompt: "..." }
 */
export class DialLockPuzzle extends PuzzleScene {
  private values: number[] = [];
  private digits: Phaser.GameObjects.Text[] = [];

  constructor() {
    super('DialLockPuzzle');
  }

  protected buildPuzzle(): void {
    const answer = String(this.config.answer ?? '0000');
    const n = answer.length;
    this.values = new Array(n).fill(0);
    this.digits = [];

    this.panelText(0, -420, String(this.config.prompt ?? ''), 36);

    const spacing = 220;
    const startX = -((n - 1) * spacing) / 2;
    for (let i = 0; i < n; i++) {
      const x = startX + i * spacing;
      const frame = this.add.rectangle(x, 0, 170, 240, 0x1c1a17).setStrokeStyle(4, 0xe8dcc0, 0.7);
      const digit = this.add
        .text(x, 0, '0', { fontSize: '120px', color: COLORS.paper, fontFamily: 'monospace' })
        .setOrigin(0.5);
      this.digits.push(digit);

      const up = this.makeArrowButton(x, -200, '▲', () => this.bump(i, 1));
      const down = this.makeArrowButton(x, 200, '▼', () => this.bump(i, -1));
      this.panel.add([frame, digit, up, down]);
    }

    const confirm = this.add
      .rectangle(0, 400, 360, 100, 0x3e5c4b)
      .setStrokeStyle(3, 0xe8dcc0, 0.6)
      .setInteractive({ useHandCursor: true });
    const confirmLabel = this.add
      .text(0, 400, '确认', { fontSize: '44px', color: COLORS.paper, fontFamily: 'serif' })
      .setOrigin(0.5);
    confirm.on('pointerdown', () => this.check(answer));
    this.panel.add([confirm, confirmLabel]);
  }

  private makeArrowButton(x: number, y: number, glyph: string, onTap: () => void) {
    const t = this.add
      .text(x, y, glyph, { fontSize: '64px', color: COLORS.crtCyan, fontFamily: 'serif' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    t.on('pointerdown', onTap);
    return t;
  }

  private bump(i: number, d: number): void {
    this.values[i] = (this.values[i] + d + 10) % 10;
    this.digits[i].setText(String(this.values[i]));
  }

  private check(answer: string): void {
    if (this.values.join('') === answer) {
      this.cameras.main.flash(300, 127, 212, 193);
      this.time.delayedCall(350, () => this.succeed());
    } else {
      this.cameras.main.shake(180, 0.006);
    }
  }
}

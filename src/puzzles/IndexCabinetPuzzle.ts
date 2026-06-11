import Phaser from 'phaser';
import { PuzzleScene } from './PuzzleScene';
import { COLORS } from '../ui/theme';

/**
 * 档案柜定位（谜题1-3）：按档号规则在 区×宗 网格中找到正确抽屉。
 * config: { prompt, cols: string[], rows: string[], correct: "叁-丙" }
 */
export class IndexCabinetPuzzle extends PuzzleScene {
  private feedback?: Phaser.GameObjects.Text;

  constructor() {
    super('IndexCabinetPuzzle');
  }

  protected buildPuzzle(): void {
    const cols = (this.config.cols as string[]) ?? [];
    const rows = (this.config.rows as string[]) ?? [];
    const correct = String(this.config.correct ?? '');

    this.panelText(0, -460, String(this.config.prompt ?? ''), 34);

    const cellW = 180;
    const cellH = 110;
    const gap = 14;
    const gridW = cols.length * (cellW + gap);
    const gridH = rows.length * (cellH + gap);
    const ox = -gridW / 2 + cellW / 2;
    const oy = -gridH / 2 + cellH / 2 + 60;

    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < cols.length; c++) {
        const x = ox + c * (cellW + gap);
        const y = oy + r * (cellH + gap);
        const key = `${cols[c]}-${rows[r]}`;
        const drawer = this.add
          .rectangle(x, y, cellW, cellH, 0x3e5c4b)
          .setStrokeStyle(2, 0xe8dcc0, 0.4)
          .setInteractive({ useHandCursor: true });
        const label = this.add
          .text(x, y, key, { fontSize: '30px', color: COLORS.paper, fontFamily: 'serif' })
          .setOrigin(0.5);
        drawer.on('pointerdown', () => this.open(key, correct, drawer));
        this.panel.add([drawer, label]);
      }
    }
  }

  private open(key: string, correct: string, drawer: Phaser.GameObjects.Rectangle): void {
    if (key === correct) {
      this.cameras.main.flash(300, 127, 212, 193);
      this.time.delayedCall(400, () => this.succeed());
      return;
    }
    this.tweens.add({ targets: drawer, scaleY: 0.85, duration: 80, yoyo: true });
    this.feedback?.destroy();
    this.feedback = this.add
      .text(0, 460, '这一格只有灰尘。', { fontSize: '32px', color: '#999', fontFamily: 'serif' })
      .setOrigin(0.5);
    this.panel.add(this.feedback);
  }
}

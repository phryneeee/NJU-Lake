import Phaser from 'phaser';
import { PuzzleScene } from './PuzzleScene';
import { COLORS } from '../ui/theme';

interface MirrorStep {
  prompt: string;
  options: [string, string];
  correct: number;
}

/**
 * 镜像档案室（谜题4-3）：镜中虚掩的柜子只能通过在现实侧做"左右相反"的操作打开。
 * 第一步：在现实侧点中与镜中目标对应的柜门（列号左右翻转）。
 * 之后每步在两个操作里选择"镜像的那一个"。任何一步错 → 全部重来。
 * config: { prompt, cols, rows, targetMirrorCol, targetRow, steps: MirrorStep[] }
 */
export class MirrorRoomPuzzle extends PuzzleScene {
  private body!: Phaser.GameObjects.Container;
  private stepIndex = -1; // -1 = 还在找柜门

  constructor() {
    super('MirrorRoomPuzzle');
  }

  protected override panelWidth(): number {
    return 1800;
  }

  protected buildPuzzle(): void {
    this.panelText(0, -480, String(this.config.prompt ?? ''), 30);
    this.body = this.add.container(0, 0);
    this.panel.add(this.body);
    this.buildGrids();
  }

  private buildGrids(): void {
    this.body.removeAll(true);
    this.stepIndex = -1;

    const cols = Number(this.config.cols ?? 4);
    const rows = Number(this.config.rows ?? 3);
    const targetMirrorCol = Number(this.config.targetMirrorCol ?? 2); // 镜中从左数
    const targetRow = Number(this.config.targetRow ?? 2);
    const correctRealCol = cols + 1 - targetMirrorCol;

    const cellW = 150;
    const cellH = 130;
    const gap = 16;

    // 中缝：镜面
    const mirror = this.add.rectangle(0, 20, 10, 700, 0x7fd4c1, 0.5);
    const realLabel = this.add
      .text(-420, -360, '现实', { fontSize: '30px', color: COLORS.paper, fontFamily: 'serif' })
      .setOrigin(0.5);
    const mirrorLabel = this.add
      .text(420, -360, '镜中', { fontSize: '30px', color: '#9ad4c8', fontFamily: 'serif' })
      .setOrigin(0.5);
    this.body.add([mirror, realLabel, mirrorLabel]);

    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        const y = -240 + (r - 1) * (cellH + gap);

        // 现实侧（可点）
        const rx = -760 + (c - 1) * (cellW + gap);
        const cell = this.add
          .rectangle(rx, y, cellW, cellH, 0x3e5c4b)
          .setStrokeStyle(2, 0xe8dcc0, 0.4)
          .setInteractive({ useHandCursor: true });
        cell.on('pointerdown', () => {
          if (this.stepIndex !== -1) return;
          if (c === correctRealCol && r === targetRow) {
            cell.setStrokeStyle(5, 0x7fd4c1, 1);
            this.stepIndex = 0;
            this.showStep();
          } else {
            this.cameras.main.shake(140, 0.005);
            this.flashText('柜门纹丝不动。镜子里的那扇……在你的哪只手边？');
          }
        });
        this.body.add(cell);

        // 镜中侧（仅展示，列翻转）
        const mc = cols + 1 - c;
        const mx = 160 + (mc - 1) * (cellW + gap);
        const isTarget = c === correctRealCol && r === targetRow;
        const mcell = this.add
          .rectangle(mx, y, cellW, cellH, 0x2c4438, 0.9)
          .setStrokeStyle(isTarget ? 5 : 2, isTarget ? 0xe8c84a : 0x9ad4c8, isTarget ? 1 : 0.3);
        this.body.add(mcell);
        if (isTarget) {
          const tag = this.add
            .text(mx, y, '虚掩', { fontSize: '26px', color: '#e8c84a', fontFamily: 'serif' })
            .setOrigin(0.5);
          this.body.add(tag);
        }
      }
    }
  }

  private showStep(): void {
    const steps = (this.config.steps as MirrorStep[]) ?? [];
    const step = steps[this.stepIndex];
    if (!step) {
      this.cameras.main.flash(300, 127, 212, 193);
      this.time.delayedCall(400, () => this.succeed());
      return;
    }

    const ui = this.add.container(0, 320);
    this.body.add(ui);
    const prompt = this.add
      .text(0, -60, `第${this.stepIndex + 1}步：${step.prompt}`, {
        fontSize: '32px',
        color: COLORS.paper,
        fontFamily: 'serif',
        align: 'center',
        wordWrap: { width: 1500 },
      })
      .setOrigin(0.5);
    ui.add(prompt);

    step.options.forEach((opt, i) => {
      const x = i === 0 ? -360 : 360;
      const btn = this.add
        .rectangle(x, 60, 620, 96, 0x26231f)
        .setStrokeStyle(3, 0xe8dcc0, 0.6)
        .setInteractive({ useHandCursor: true });
      const t = this.add
        .text(x, 60, opt, { fontSize: '32px', color: COLORS.paper, fontFamily: 'serif' })
        .setOrigin(0.5);
      btn.on('pointerdown', () => {
        ui.destroy();
        if (i === step.correct) {
          this.stepIndex++;
          this.showStep();
        } else {
          this.sfx('sfx_error');
          this.cameras.main.shake(220, 0.008);
          this.flashText('镜中的手和你的手反着动——咔，全部弹回了原位。');
          this.time.delayedCall(900, () => this.buildGrids());
        }
      });
      ui.add([btn, t]);
    });
  }

  private flashText(msg: string): void {
    const t = this.add
      .text(0, 470, msg, { fontSize: '28px', color: COLORS.rustRed, fontFamily: 'serif' })
      .setOrigin(0.5);
    this.body.add(t);
    this.time.delayedCall(1300, () => t.destroy());
  }
}

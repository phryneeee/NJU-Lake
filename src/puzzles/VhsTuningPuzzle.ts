import Phaser from 'phaser';
import { PuzzleScene } from './PuzzleScene';
import { COLORS } from '../ui/theme';

/**
 * VHS 跟踪调谐（谜题1-4）：拖动两个滑块，把两条噪声带分别对齐到画面边缘。
 * 共 3 轮（录像逐段播放），每轮对准后显示一段画面描述字幕。
 * config: { prompt, captions: string[3] }
 */
export class VhsTuningPuzzle extends PuzzleScene {
  private values = [0.5, 0.5];
  private targets = [0, 0];
  private round = 0;
  private holdMs = 0;
  private locked = false;

  private noiseBars: Phaser.GameObjects.Rectangle[] = [];
  private screenText!: Phaser.GameObjects.Text;
  private scanlines: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super('VhsTuningPuzzle');
  }

  protected buildPuzzle(): void {
    this.panelText(0, -480, String(this.config.prompt ?? ''), 34);

    // “电视屏幕”
    const screen = this.add.rectangle(-180, 0, 900, 680, 0x10130f).setStrokeStyle(6, 0x444444);
    this.panel.add(screen);
    this.screenText = this.add
      .text(-180, 0, '', {
        fontSize: '34px',
        color: COLORS.crtCyan,
        fontFamily: 'serif',
        align: 'center',
        wordWrap: { width: 800 },
      })
      .setOrigin(0.5);
    this.panel.add(this.screenText);

    // 两条噪声带（位置偏移 = 滑块与目标的差值）
    for (let i = 0; i < 2; i++) {
      const bar = this.add.rectangle(-180, 0, 880, 60, 0x888888, 0.7);
      this.noiseBars.push(bar);
      this.panel.add(bar);
    }

    // 静态扫描线装饰
    for (let i = 0; i < 8; i++) {
      const line = this.add.rectangle(-180, -300 + i * 85, 880, 3, 0x000000, 0.4);
      this.scanlines.push(line);
      this.panel.add(line);
    }

    // 两个竖直滑块
    this.makeSlider(480, 0);
    this.makeSlider(640, 1);

    this.newRound();
  }

  private makeSlider(x: number, index: number): void {
    const track = this.add.rectangle(x, 0, 14, 620, 0x1c1a17).setStrokeStyle(2, 0xe8dcc0, 0.5);
    const label = this.add
      .text(x, 380, index === 0 ? '跟踪·上' : '跟踪·下', {
        fontSize: '28px',
        color: COLORS.paper,
        fontFamily: 'serif',
      })
      .setOrigin(0.5);
    this.panel.add([track, label]);

    // 拖拽对象不放进容器（容器子节点的 drag 坐标系不可靠），用绝对坐标
    const ax = this.panel.x + x;
    const ay = this.panel.y;
    const knob = this.add
      .rectangle(ax, ay, 110, 80, 0x8c3b2e)
      .setStrokeStyle(3, 0xe8dcc0, 0.7)
      .setInteractive({ useHandCursor: true, draggable: true });

    knob.on('drag', (_p: Phaser.Input.Pointer, _dx: number, dragY: number) => {
      const y = Phaser.Math.Clamp(dragY, ay - 310, ay + 310);
      knob.y = y;
      this.values[index] = (y - (ay - 310)) / 620;
    });
  }

  private newRound(): void {
    this.targets = [Phaser.Math.FloatBetween(0.15, 0.85), Phaser.Math.FloatBetween(0.15, 0.85)];
    this.holdMs = 0;
    this.locked = false;
    this.screenText.setText('');
  }

  override update(_t: number, dt: number): void {
    if (this.locked || this.noiseBars.length < 2) return;

    let aligned = true;
    for (let i = 0; i < 2; i++) {
      const diff = this.values[i] - this.targets[i];
      // 偏差映射为噪声带的纵向位置；对准时贴住屏幕上/下边缘
      const edge = i === 0 ? -310 : 310;
      this.noiseBars[i].y = edge + diff * 600 * (i === 0 ? 1 : -1);
      this.noiseBars[i].setAlpha(0.25 + Math.abs(diff) * 1.2);
      if (Math.abs(diff) > 0.05) aligned = false;
    }

    if (aligned) {
      this.holdMs += dt;
      if (this.holdMs > 700) this.advanceRound();
    } else {
      this.holdMs = 0;
    }
  }

  private advanceRound(): void {
    this.locked = true;
    const captions = (this.config.captions as string[]) ?? [];
    this.screenText.setText(captions[this.round] ?? '……');
    this.round++;

    this.time.delayedCall(2600, () => {
      if (this.round >= 3) {
        this.succeed();
      } else {
        // 画面再次劣化，进入下一段
        this.cameras.main.shake(120, 0.004);
        this.newRound();
      }
    });
  }
}

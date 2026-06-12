import Phaser from 'phaser';
import { PuzzleScene } from './PuzzleScene';
import { COLORS } from '../ui/theme';
import { GameState } from '../systems/GameState';

/**
 * 怀安楼电梯（谜题2-4）：在指示灯亮起时按 B1，连续四次，面板裂开露出 B7。
 * B7 需要黄铜钥匙。
 * config: { prompt, requiredItem, missingText }
 */
export class ElevatorPuzzle extends PuzzleScene {
  private lampOn = false;
  private lamp!: Phaser.GameObjects.Arc;
  private progress = 0;
  private dots: Phaser.GameObjects.Arc[] = [];
  private revealed = false;

  constructor() {
    super('ElevatorPuzzle');
  }

  protected buildPuzzle(): void {
    this.panelText(0, -460, String(this.config.prompt ?? ''), 32);

    // 指示灯
    this.lamp = this.add.circle(0, -300, 36, 0x333333);
    this.panel.add(this.lamp);
    this.time.addEvent({
      delay: 650,
      loop: true,
      callback: () => {
        this.lampOn = !this.lampOn;
        this.lamp.setFillStyle(this.lampOn ? 0x7fd4c1 : 0x333333);
      },
    });

    // 进度四点（羽毛刻痕）
    for (let i = 0; i < 4; i++) {
      const d = this.add.circle(-90 + i * 60, -210, 14, 0x1c1a17).setStrokeStyle(2, 0xe8dcc0, 0.6);
      this.dots.push(d);
      this.panel.add(d);
    }

    // 楼层按钮列：5 4 3 2 1 B1
    const floors = ['5', '4', '3', '2', '1', 'B1'];
    floors.forEach((f, i) => {
      const y = -110 + i * 105;
      const btn = this.add
        .circle(0, y, 42, 0x26231f)
        .setStrokeStyle(3, 0xe8dcc0, 0.7)
        .setInteractive({ useHandCursor: true });
      const t = this.add
        .text(0, y, f, { fontSize: '34px', color: COLORS.paper, fontFamily: 'monospace' })
        .setOrigin(0.5);
      btn.on('pointerdown', () => this.press(f, btn));
      this.panel.add([btn, t]);
    });
  }

  private press(floor: string, btn: Phaser.GameObjects.Arc): void {
    if (this.revealed) return;
    this.sfx('sfx_dial');
    this.tweens.add({ targets: btn, scale: 0.9, duration: 70, yoyo: true });

    if (floor === 'B1' && this.lampOn) {
      this.progress++;
      this.dots[this.progress - 1]?.setFillStyle(0x7fd4c1);
      if (this.progress >= 4) this.revealB7();
    } else {
      // 按错或灯灭时按：重置
      if (this.progress > 0) this.cameras.main.shake(150, 0.005);
      this.progress = 0;
      this.dots.forEach((d) => d.setFillStyle(0x1c1a17));
    }
  }

  private revealB7(): void {
    this.revealed = true;
    this.sfx('sfx_bell');
    this.cameras.main.shake(400, 0.012);
    const b7 = this.add
      .circle(220, 420, 52, 0x8c3b2e)
      .setStrokeStyle(4, 0xe8dcc0, 0.9)
      .setInteractive({ useHandCursor: true });
    const t = this.add
      .text(220, 420, 'B7', { fontSize: '40px', color: COLORS.paper, fontFamily: 'monospace' })
      .setOrigin(0.5);
    const hint = this.add
      .text(220, 500, '按钮旁有一个钥匙孔', { fontSize: '24px', color: '#888', fontFamily: 'serif' })
      .setOrigin(0.5);
    this.panel.add([b7, t, hint]);

    b7.on('pointerdown', () => {
      const required = String(this.config.requiredItem ?? '');
      if (!required || GameState.hasItem(required)) {
        this.cameras.main.flash(300, 127, 212, 193);
        this.time.delayedCall(400, () => this.succeed());
      } else {
        GameState.say(String(this.config.missingText ?? '需要一把钥匙。'));
        this.cameras.main.shake(150, 0.005);
      }
    });
  }
}

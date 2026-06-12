import Phaser from 'phaser';
import { GameState } from '../systems/GameState';
import { hasSave, clearState } from '../systems/SaveSystem';
import { AudioSystem } from '../systems/AudioSystem';
import { W, H, COLORS } from '../ui/theme';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    this.add.rectangle(W / 2, H / 2, W, H, 0x1c1a17);
    // 主题曲《归档》（iOS 需首次触摸后才出声，Phaser 会自动排队）
    AudioSystem.setAmbience(this, 'theme_main', 0.45);

    this.add
      .text(W / 2, H / 2 - 220, '第七档案库', {
        fontSize: '140px',
        color: COLORS.paper,
        fontFamily: 'serif',
      })
      .setOrigin(0.5);
    this.add
      .text(W / 2, H / 2 - 80, 'The Seventh Archive', {
        fontSize: '40px',
        color: COLORS.crtCyan,
        fontFamily: 'serif',
      })
      .setOrigin(0.5)
      .setAlpha(0.7);

    const canContinue = hasSave() && GameState.flags.size + GameState.inventory.length > 0;

    this.addButton(H / 2 + 120, canContinue ? '继续' : '开始', () => this.startGame(false));
    if (canContinue) {
      this.addButton(H / 2 + 260, '新游戏', () => this.startGame(true));
    }

    this.add
      .text(W / 2, H - 80, '灰盒开发版 · 基于真实校园的虚构故事', {
        fontSize: '28px',
        color: '#666',
        fontFamily: 'serif',
      })
      .setOrigin(0.5);
  }

  private addButton(y: number, label: string, onTap: () => void): void {
    const btn = this.add
      .rectangle(W / 2, y, 420, 110, 0x3e5c4b, 0.9)
      .setStrokeStyle(3, 0xe8dcc0, 0.6)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(W / 2, y, label, { fontSize: '48px', color: COLORS.paper, fontFamily: 'serif' })
      .setOrigin(0.5);
    btn.on('pointerdown', () => {
      AudioSystem.sfx(this, 'sfx_click');
      onTap();
    });
  }

  private startGame(fresh: boolean): void {
    // 首次触摸：iOS WebAudio 在此解锁
    if (this.sound.locked) this.sound.unlock();
    if (fresh) {
      clearState();
      GameState.resetAll();
    }
    this.scene.start('Room');
  }
}

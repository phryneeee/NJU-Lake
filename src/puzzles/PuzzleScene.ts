import Phaser from 'phaser';
import type { PuzzleConfig, RoomAction } from '../types/room';
import { runActions } from '../systems/actions';
import { W, H, COLORS } from '../ui/theme';

/**
 * 全屏谜题模态基类：暗化背景 + 面板 + 关闭按钮。
 * 子类在 buildPuzzle() 中搭建内容，完成时调用 this.succeed()。
 */
export abstract class PuzzleScene extends Phaser.Scene {
  protected successActions: RoomAction[] = [];
  protected config!: PuzzleConfig;
  protected panel!: Phaser.GameObjects.Container;

  init(config: PuzzleConfig): void {
    this.config = config;
    this.successActions = config.successActions ?? [];
  }

  create(): void {
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setInteractive();
    void dim; // 拦截穿透点击

    this.panel = this.add.container(W / 2, H / 2);
    const bg = this.add
      .rectangle(0, 0, this.panelWidth(), this.panelHeight(), 0x26231f, 1)
      .setStrokeStyle(4, 0xe8dcc0, 0.5);
    this.panel.add(bg);

    // 关闭按钮（右上角）
    const close = this.add
      .text(this.panelWidth() / 2 - 50, -this.panelHeight() / 2 + 50, '✕', {
        fontSize: '56px',
        color: COLORS.paper,
        fontFamily: 'serif',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => this.dismiss());
    this.panel.add(close);

    this.buildPuzzle();
  }

  protected panelWidth(): number {
    return 1500;
  }
  protected panelHeight(): number {
    return 1100;
  }

  protected abstract buildPuzzle(): void;

  /** 谜题完成：关闭模态并在 RoomScene 上执行 successActions */
  protected succeed(): void {
    const room = this.scene.get('Room');
    this.scene.stop();
    this.scene.resume('Room');
    runActions(room, this.successActions);
  }

  /** 玩家主动退出（不算完成） */
  protected dismiss(): void {
    this.scene.stop();
    this.scene.resume('Room');
  }

  /** 工具：面板内文本 */
  protected panelText(
    x: number,
    y: number,
    text: string,
    size = 36,
    color: string = COLORS.paper,
  ): Phaser.GameObjects.Text {
    const t = this.add
      .text(x, y, text, {
        fontSize: `${size}px`,
        color,
        fontFamily: 'serif',
        align: 'center',
        wordWrap: { width: this.panelWidth() - 160 },
      })
      .setOrigin(0.5);
    this.panel.add(t);
    return t;
  }
}

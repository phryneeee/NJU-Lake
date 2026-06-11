import Phaser from 'phaser';
import { PuzzleScene } from './PuzzleScene';
import { GameState } from '../systems/GameState';

/**
 * Win98 风格 OPAC 馆藏检索（谜题2-1）。
 * 流程：选择索书号 → 出示读者证（需要物品栏有借阅证）→ 显示馆藏位置。
 * config: { options: string[], correct: string, requiredItem: string, resultText: string }
 */
export class OpacPuzzle extends PuzzleScene {
  private body!: Phaser.GameObjects.Container;

  constructor() {
    super('OpacPuzzle');
  }

  protected buildPuzzle(): void {
    // Win98 窗体：灰底 + 蓝标题栏
    const win = this.add.rectangle(0, 0, 1300, 900, 0xc0c0c0);
    const titleBar = this.add.rectangle(0, -410, 1280, 64, 0x000082);
    const title = this.add
      .text(-620, -410, '南京大学图书馆 · 馆藏目录检索 OPAC v2.6', {
        fontSize: '30px',
        color: '#ffffff',
        fontFamily: 'monospace',
      })
      .setOrigin(0, 0.5);
    this.panel.add([win, titleBar, title]);

    this.body = this.add.container(0, 40);
    this.panel.add(this.body);
    this.stepCallNumber();
  }

  private clearBody(): void {
    this.body.removeAll(true);
  }

  private winText(x: number, y: number, text: string, size = 30, color = '#000000'): void {
    const t = this.add
      .text(x, y, text, {
        fontSize: `${size}px`,
        color,
        fontFamily: 'monospace',
        align: 'center',
        wordWrap: { width: 1150 },
      })
      .setOrigin(0.5);
    this.body.add(t);
  }

  private winButton(x: number, y: number, label: string, onTap: () => void, w = 560): void {
    const btn = this.add
      .rectangle(x, y, w, 90, 0xdfdfdf)
      .setStrokeStyle(3, 0x808080)
      .setInteractive({ useHandCursor: true });
    const t = this.add
      .text(x, y, label, { fontSize: '30px', color: '#000000', fontFamily: 'monospace' })
      .setOrigin(0.5);
    btn.on('pointerdown', () => {
      this.tweens.add({ targets: [btn, t], y: '+=3', duration: 60, yoyo: true });
      this.time.delayedCall(130, onTap);
    });
    this.body.add([btn, t]);
  }

  private stepCallNumber(): void {
    this.clearBody();
    const options = (this.config.options as string[]) ?? [];
    const correct = String(this.config.correct ?? '');
    this.winText(0, -280, '> 请选择检索方式：[索书号]\n> 最近检索记录：', 30);
    options.forEach((opt, i) => {
      this.winButton(0, -130 + i * 120, opt, () => {
        if (opt === correct) this.stepCard();
        else {
          this.clearBody();
          this.winText(0, -100, `> 检索 ${opt} ……\n> 0 条结果。`, 30, '#820000');
          this.winButton(0, 100, '< 返回', () => this.stepCallNumber());
        }
      });
    });
  }

  private stepCard(): void {
    this.clearBody();
    const required = String(this.config.requiredItem ?? '');
    this.winText(0, -200, '> 检索中……找到 1 条记录。\n> 查看详情需要读者身份验证。', 30);
    this.winButton(0, 0, '[ 出示借阅证 ]', () => {
      if (GameState.hasItem(required)) {
        this.stepResult();
      } else {
        this.winText(0, 140, '> 错误：未检测到有效证件。', 28, '#820000');
      }
    });
  }

  private stepResult(): void {
    this.clearBody();
    this.winText(0, -120, String(this.config.resultText ?? ''), 30);
    this.winButton(0, 220, '[ 确定 ]', () => this.succeed());
  }
}

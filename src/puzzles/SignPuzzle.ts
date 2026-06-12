import Phaser from 'phaser';
import { PuzzleScene } from './PuzzleScene';
import { COLORS } from '../ui/theme';

interface StampDef {
  label: string;
  reaction: string;
}

/**
 * 签署档案（谜题6-3，终局反谜题）：
 * 章盘四枚章（优/良/正确/错误）逐一尝试均失效——印面落纸碎成灰，委员会各有反应。
 * 唯一有效操作：拿起乌鸦递来的羽毛笔，在签名栏写下自己的名字。
 * config: { prompt, stamps: StampDef[], signHint, signedText }
 */
export class SignPuzzle extends PuzzleScene {
  private reaction!: Phaser.GameObjects.Text;
  private signed = false;

  constructor() {
    super('SignPuzzle');
  }

  protected buildPuzzle(): void {
    this.panelText(0, -440, String(this.config.prompt ?? ''), 32);

    // 摊开的空白档案
    const paper = this.add.rectangle(0, -100, 900, 480, 0xe8dcc0).setStrokeStyle(4, 0x8a7550);
    const title = this.add
      .text(0, -260, '档案 · 林晚 - 2026 - ？', { fontSize: '36px', color: '#1C1A17', fontFamily: 'serif' })
      .setOrigin(0.5);
    const signLine = this.add
      .text(0, 40, '签署人：＿＿＿＿＿＿', { fontSize: '34px', color: '#1C1A17', fontFamily: 'serif' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.panel.add([paper, title, signLine]);

    // 章盘：四枚章
    const stamps = (this.config.stamps as StampDef[]) ?? [];
    stamps.forEach((stamp, i) => {
      const x = -420 + i * 280;
      const seal = this.add
        .rectangle(x, 300, 200, 140, 0x8c3b2e)
        .setStrokeStyle(3, 0xe8dcc0, 0.7)
        .setInteractive({ useHandCursor: true });
      const t = this.add
        .text(x, 300, stamp.label, { fontSize: '44px', color: COLORS.paper, fontFamily: 'serif' })
        .setOrigin(0.5);
      seal.on('pointerdown', () => {
        if (this.signed) return;
        // 印面落纸即碎成灰
        this.sfx('sfx_error');
        this.cameras.main.shake(140, 0.004);
        this.tweens.add({
          targets: [seal, t],
          alpha: 0.18,
          y: '+=14',
          duration: 500,
        });
        seal.disableInteractive();
        this.reaction.setText(stamp.reaction);
      });
      this.panel.add([seal, t]);
    });

    // 羽毛笔（乌鸦递来的）
    const quill = this.add
      .rectangle(620, -100, 80, 260, 0x2b2b33)
      .setStrokeStyle(3, 0xe8dcc0, 0.7)
      .setInteractive({ useHandCursor: true });
    const quillLabel = this.add
      .text(620, 80, '乌鸦的\n羽毛笔', { fontSize: '26px', color: COLORS.paper, fontFamily: 'serif', align: 'center' })
      .setOrigin(0.5);
    this.panel.add([quill, quillLabel]);

    this.reaction = this.add
      .text(0, 440, String(this.config.signHint ?? ''), {
        fontSize: '30px',
        color: '#9a9a8a',
        fontFamily: 'serif',
        align: 'center',
        wordWrap: { width: 1300 },
      })
      .setOrigin(0.5);
    this.panel.add(this.reaction);

    const sign = (): void => {
      if (this.signed) return;
      this.signed = true;
      signLine.setText('签署人：林 晚');
      this.reaction.setText(String(this.config.signedText ?? ''));
      this.cameras.main.flash(500, 232, 220, 192);
      this.time.delayedCall(2200, () => this.succeed());
    };
    quill.on('pointerdown', sign);
    signLine.on('pointerdown', sign);
  }
}

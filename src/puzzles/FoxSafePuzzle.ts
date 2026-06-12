import Phaser from 'phaser';
import { PuzzleScene } from './PuzzleScene';
import { COLORS } from '../ui/theme';

/**
 * 狐狸的赌局（谜题4-4）：汉字转盘保险柜。
 * 转出任何具体的人生选项都会失败（狐狸各有一句讥讽）；唯一正解是「无解」。
 * config: { prompt, words: string[], correct: string, responses: Record<string,string>, defaultResponse }
 */
export class FoxSafePuzzle extends PuzzleScene {
  private index = 0;
  private wordText!: Phaser.GameObjects.Text;
  private foxLine!: Phaser.GameObjects.Text;

  constructor() {
    super('FoxSafePuzzle');
  }

  protected buildPuzzle(): void {
    this.panelText(0, -440, String(this.config.prompt ?? ''), 34);

    // 转盘
    const dial = this.add.circle(0, -60, 220, 0x26231f).setStrokeStyle(6, 0x8c3b2e, 0.9);
    this.wordText = this.add
      .text(0, -60, this.words()[0], { fontSize: '88px', color: COLORS.paper, fontFamily: 'serif' })
      .setOrigin(0.5);
    this.panel.add([dial, this.wordText]);

    this.makeArrow(-340, -60, '◀', () => this.spin(-1));
    this.makeArrow(340, -60, '▶', () => this.spin(1));

    const submit = this.add
      .rectangle(0, 260, 360, 100, 0x8c3b2e)
      .setStrokeStyle(3, 0xe8dcc0, 0.6)
      .setInteractive({ useHandCursor: true });
    const submitLabel = this.add
      .text(0, 260, '转出', { fontSize: '42px', color: COLORS.paper, fontFamily: 'serif' })
      .setOrigin(0.5);
    submit.on('pointerdown', () => this.check());
    this.panel.add([submit, submitLabel]);

    this.foxLine = this.add
      .text(0, 410, '', {
        fontSize: '30px',
        color: '#c98a4b',
        fontFamily: 'serif',
        align: 'center',
        wordWrap: { width: 1300 },
      })
      .setOrigin(0.5);
    this.panel.add(this.foxLine);
  }

  private words(): string[] {
    return (this.config.words as string[]) ?? [];
  }

  private makeArrow(x: number, y: number, glyph: string, onTap: () => void): void {
    const t = this.add
      .text(x, y, glyph, { fontSize: '80px', color: COLORS.crtCyan, fontFamily: 'serif' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    t.on('pointerdown', onTap);
    this.panel.add(t);
  }

  private spin(d: number): void {
    this.sfx('sfx_dial');
    const words = this.words();
    this.index = (this.index + d + words.length) % words.length;
    this.wordText.setText(words[this.index]);
    this.foxLine.setText('');
  }

  private check(): void {
    const word = this.words()[this.index];
    if (word === String(this.config.correct ?? '')) {
      this.cameras.main.flash(350, 232, 200, 74);
      this.time.delayedCall(450, () => this.succeed());
      return;
    }
    const responses = (this.config.responses as Record<string, string>) ?? {};
    const line = responses[word] ?? String(this.config.defaultResponse ?? '柜身渗出一滴黑墨。狐狸在暗处轻笑。');
    this.foxLine.setText(`狐狸：「${line}」`);
    this.sfx('sfx_error');
    this.cameras.main.shake(160, 0.005);
  }
}

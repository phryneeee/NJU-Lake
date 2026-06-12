import Phaser from 'phaser';
import { PuzzleScene } from './PuzzleScene';
import { COLORS } from '../ui/theme';
import { runActions } from '../systems/actions';
import type { RoomAction } from '../types/room';

interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
}

/**
 * 猫头鹰三问（谜题2-3）。答错任意一题从头再来（书架再闭环一圈）。
 * 一次都不错 → 额外执行 perfectActions（残缺档案②）。
 * config: { prompt, questions: QuizQuestion[], wrongText, perfectActions?: RoomAction[] }
 */
export class QuizPuzzle extends PuzzleScene {
  private index = 0;
  private missed = false;
  private body!: Phaser.GameObjects.Container;

  constructor() {
    super('QuizPuzzle');
  }

  protected buildPuzzle(): void {
    this.panelText(0, -460, String(this.config.prompt ?? ''), 34);
    this.body = this.add.container(0, 0);
    this.panel.add(this.body);
    this.showQuestion();
  }

  private showQuestion(): void {
    this.body.removeAll(true);
    const questions = (this.config.questions as QuizQuestion[]) ?? [];
    const q = questions[this.index];

    const progress = this.add
      .text(0, -330, `第 ${this.index + 1} / ${questions.length} 问`, {
        fontSize: '28px',
        color: '#888',
        fontFamily: 'serif',
      })
      .setOrigin(0.5);
    const qText = this.add
      .text(0, -220, q.q, {
        fontSize: '40px',
        color: COLORS.paper,
        fontFamily: 'serif',
        align: 'center',
        wordWrap: { width: 1300 },
      })
      .setOrigin(0.5);
    this.body.add([progress, qText]);

    q.options.forEach((opt, i) => {
      const y = -40 + i * 150;
      const btn = this.add
        .rectangle(0, y, 900, 110, 0x3e5c4b)
        .setStrokeStyle(3, 0xe8dcc0, 0.5)
        .setInteractive({ useHandCursor: true });
      const t = this.add
        .text(0, y, opt, { fontSize: '36px', color: COLORS.paper, fontFamily: 'serif' })
        .setOrigin(0.5);
      btn.on('pointerdown', () => this.answer(i === q.correct));
      this.body.add([btn, t]);
    });
  }

  private answer(right: boolean): void {
    const questions = (this.config.questions as QuizQuestion[]) ?? [];
    if (!right) {
      this.missed = true;
      this.sfx('sfx_error');
      this.cameras.main.shake(200, 0.008);
      this.index = 0;
      const t = this.add
        .text(0, 420, String(this.config.wrongText ?? '答错了。书架又转了一圈。'), {
          fontSize: '32px',
          color: COLORS.rustRed,
          fontFamily: 'serif',
        })
        .setOrigin(0.5);
      this.panel.add(t);
      this.time.delayedCall(1400, () => {
        t.destroy();
        this.showQuestion();
      });
      this.body.removeAll(true);
      return;
    }
    this.index++;
    if (this.index < questions.length) {
      this.showQuestion();
      return;
    }
    // 全部答对
    if (!this.missed) {
      const perfect = (this.config.perfectActions as RoomAction[]) ?? [];
      runActions(this.scene.get('Room'), perfect);
    }
    this.cameras.main.flash(300, 127, 212, 193);
    this.time.delayedCall(400, () => this.succeed());
  }
}

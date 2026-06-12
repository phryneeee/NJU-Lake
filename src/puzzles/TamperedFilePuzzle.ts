import Phaser from 'phaser';
import { PuzzleScene } from './PuzzleScene';
import { COLORS } from '../ui/theme';

interface FileLine {
  text: string;
  /** 有 truth 字段 = 这行是狐狸篡改的，truth 为乌鸦底稿原文 */
  truth?: string;
}
interface TamperedFile {
  title: string;
  lines: FileLine[];
}

/**
 * 被篡改的档案（谜题4-1）：对照乌鸦的镜文底稿，标出每份档案中被狐狸改写的行。
 * 底稿默认是镜文（左右反写），点「举到镜前」翻转可读。
 * config: { prompt, files: TamperedFile[] }
 */
export class TamperedFilePuzzle extends PuzzleScene {
  private fileIndex = 0;
  private marked = new Set<number>();
  private body!: Phaser.GameObjects.Container;
  private draft!: Phaser.GameObjects.Text;
  private draftReadable = false;

  constructor() {
    super('TamperedFilePuzzle');
  }

  protected override panelWidth(): number {
    return 1800;
  }

  protected buildPuzzle(): void {
    this.panelText(0, -480, String(this.config.prompt ?? ''), 32);
    this.body = this.add.container(0, 0);
    this.panel.add(this.body);
    this.showFile();
  }

  private files(): TamperedFile[] {
    return (this.config.files as TamperedFile[]) ?? [];
  }

  private showFile(): void {
    this.body.removeAll(true);
    this.marked.clear();
    this.draftReadable = false;
    const file = this.files()[this.fileIndex];

    // 左：待修复档案
    const title = this.add
      .text(-440, -360, `${file.title}（${this.fileIndex + 1}/${this.files().length}）`, {
        fontSize: '34px',
        color: COLORS.crtCyan,
        fontFamily: 'serif',
      })
      .setOrigin(0.5);
    this.body.add(title);

    file.lines.forEach((line, i) => {
      const y = -250 + i * 100;
      const row = this.add
        .rectangle(-440, y, 800, 84, 0x1c1a17)
        .setStrokeStyle(3, 0xe8dcc0, 0.3)
        .setInteractive({ useHandCursor: true });
      const t = this.add
        .text(-440, y, line.text, {
          fontSize: '28px',
          color: COLORS.paper,
          fontFamily: 'serif',
          wordWrap: { width: 760 },
        })
        .setOrigin(0.5);
      row.on('pointerdown', () => {
        if (this.marked.has(i)) {
          this.marked.delete(i);
          row.setStrokeStyle(3, 0xe8dcc0, 0.3);
        } else {
          this.marked.add(i);
          row.setStrokeStyle(4, 0x8c3b2e, 1);
        }
      });
      this.body.add([row, t]);
    });

    // 右：乌鸦底稿（镜文）
    const draftTitle = this.add
      .text(480, -360, '乌鸦的底稿', { fontSize: '30px', color: '#888', fontFamily: 'serif' })
      .setOrigin(0.5);
    const draftText = file.lines.map((l) => l.truth ?? l.text).join('\n\n');
    this.draft = this.add
      .text(480, -40, draftText, {
        fontSize: '26px',
        color: '#9a9a8a',
        fontFamily: 'serif',
        align: 'center',
        wordWrap: { width: 620 },
      })
      .setOrigin(0.5)
      .setScale(-1, 1); // 镜文
    this.body.add([draftTitle, this.draft]);

    this.makeButton(480, 340, '把底稿举到镜前', () => {
      this.draftReadable = !this.draftReadable;
      this.draft.setScale(this.draftReadable ? 1 : -1, 1);
    });
    this.makeButton(-440, 400, '确认修复', () => this.check());
  }

  private makeButton(x: number, y: number, label: string, onTap: () => void): void {
    const btn = this.add
      .rectangle(x, y, 420, 90, 0x3e5c4b)
      .setStrokeStyle(3, 0xe8dcc0, 0.6)
      .setInteractive({ useHandCursor: true });
    const t = this.add
      .text(x, y, label, { fontSize: '32px', color: COLORS.paper, fontFamily: 'serif' })
      .setOrigin(0.5);
    btn.on('pointerdown', onTap);
    this.body.add([btn, t]);
  }

  private check(): void {
    const file = this.files()[this.fileIndex];
    const lies = new Set(file.lines.map((l, i) => (l.truth ? i : -1)).filter((i) => i >= 0));
    const ok = lies.size === this.marked.size && [...lies].every((i) => this.marked.has(i));
    if (!ok) {
      this.sfx('sfx_error');
      this.cameras.main.shake(180, 0.006);
      const t = this.add
        .text(-440, 470, '不对。墨迹未干的句子才是新补上去的谎。', {
          fontSize: '28px',
          color: COLORS.rustRed,
          fontFamily: 'serif',
        })
        .setOrigin(0.5);
      this.body.add(t);
      this.time.delayedCall(1400, () => t.destroy());
      return;
    }
    this.cameras.main.flash(250, 127, 212, 193);
    this.fileIndex++;
    if (this.fileIndex < this.files().length) {
      this.time.delayedCall(400, () => this.showFile());
    } else {
      this.time.delayedCall(400, () => this.succeed());
    }
  }
}

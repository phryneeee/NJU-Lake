import Phaser from 'phaser';
import { PuzzleScene } from './PuzzleScene';
import { COLORS } from '../ui/theme';

/**
 * CRT 烧屏密码（谜题5-1）：
 * 显示器关着时，烧屏残影显示常年停留的用户名；开机后输入工号+节气登录。
 * config: { ghostText, code: "0173", terms: string[], correctTerm, logText }
 */
export class CrtPuzzle extends PuzzleScene {
  private body!: Phaser.GameObjects.Container;
  private powered = false;
  private values = [0, 0, 0, 0];
  private digits: Phaser.GameObjects.Text[] = [];
  private selectedTerm: string | null = null;

  constructor() {
    super('CrtPuzzle');
  }

  protected buildPuzzle(): void {
    this.body = this.add.container(0, 0);
    this.panel.add(this.body);
    this.showOff();
  }

  private clear(): void {
    this.body.removeAll(true);
    this.digits = [];
  }

  private screen(color: number): void {
    const scr = this.add.rectangle(0, -120, 1100, 620, color).setStrokeStyle(8, 0x444444);
    this.body.add(scr);
  }

  private button(x: number, y: number, label: string, onTap: () => void, w = 360): void {
    const btn = this.add
      .rectangle(x, y, w, 90, 0x3e5c4b)
      .setStrokeStyle(3, 0xe8dcc0, 0.6)
      .setInteractive({ useHandCursor: true });
    const t = this.add
      .text(x, y, label, { fontSize: '32px', color: COLORS.paper, fontFamily: 'serif' })
      .setOrigin(0.5);
    btn.on('pointerdown', onTap);
    this.body.add([btn, t]);
  }

  private showOff(): void {
    this.clear();
    this.powered = false;
    this.screen(0x0a0d0a);
    // 烧屏残影：常年停在登录界面的字，比黑更深一点的灰
    const ghost = this.add
      .text(0, -160, String(this.config.ghostText ?? ''), {
        fontSize: '40px',
        color: '#1e241e',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);
    const hint = this.add
      .text(0, 40, '（屏幕是黑的。但黑里好像有什么字——烧屏的残影。）', {
        fontSize: '26px',
        color: '#555',
        fontFamily: 'serif',
      })
      .setOrigin(0.5);
    this.body.add([ghost, hint]);
    this.button(0, 340, '【 开机 】', () => this.showLogin());
  }

  private showLogin(): void {
    this.clear();
    this.powered = true;
    this.screen(0x10241c);

    const user = this.add
      .text(0, -360, `用户名：${String(this.config.ghostText ?? '')}`, {
        fontSize: '32px',
        color: COLORS.crtCyan,
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);
    const label = this.add
      .text(-300, -270, '工号：', { fontSize: '30px', color: COLORS.crtCyan, fontFamily: 'monospace' })
      .setOrigin(0.5);
    this.body.add([user, label]);

    // 4 位工号转轮
    for (let i = 0; i < 4; i++) {
      const x = -140 + i * 130;
      const digit = this.add
        .text(x, -270, '0', { fontSize: '56px', color: COLORS.crtCyan, fontFamily: 'monospace' })
        .setOrigin(0.5);
      this.digits.push(digit);
      const up = this.add
        .text(x, -350, '▲', { fontSize: '34px', color: '#557', fontFamily: 'serif' })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      const down = this.add
        .text(x, -190, '▼', { fontSize: '34px', color: '#557', fontFamily: 'serif' })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      up.on('pointerdown', () => this.bump(i, 1));
      down.on('pointerdown', () => this.bump(i, -1));
      this.body.add([digit, up, down]);
    }

    // 节气选择
    const termLabel = this.add
      .text(0, -90, '口令（节气）：', { fontSize: '30px', color: COLORS.crtCyan, fontFamily: 'monospace' })
      .setOrigin(0.5);
    this.body.add(termLabel);
    const terms = (this.config.terms as string[]) ?? [];
    terms.forEach((term, i) => {
      const x = -420 + (i % 4) * 280;
      const y = 10 + Math.floor(i / 4) * 110;
      const btn = this.add
        .rectangle(x, y, 240, 84, 0x16332a)
        .setStrokeStyle(3, 0x7fd4c1, 0.4)
        .setInteractive({ useHandCursor: true });
      const t = this.add
        .text(x, y, term, { fontSize: '30px', color: COLORS.crtCyan, fontFamily: 'serif' })
        .setOrigin(0.5);
      btn.on('pointerdown', () => {
        this.selectedTerm = term;
        // 重画选中态
        this.body.list
          .filter((o): o is Phaser.GameObjects.Rectangle => o instanceof Phaser.GameObjects.Rectangle)
          .forEach((r) => {
            if (r.width === 240) r.setStrokeStyle(3, 0x7fd4c1, 0.4);
          });
        btn.setStrokeStyle(5, 0x7fd4c1, 1);
      });
      this.body.add([btn, t]);
    });

    this.button(-220, 340, '【 登录 】', () => this.tryLogin());
    this.button(220, 340, '【 关机 】', () => this.showOff());
  }

  private bump(i: number, d: number): void {
    this.sfx('sfx_dial');
    this.values[i] = (this.values[i] + d + 10) % 10;
    this.digits[i].setText(String(this.values[i]));
  }

  private tryLogin(): void {
    const ok =
      this.values.join('') === String(this.config.code ?? '') &&
      this.selectedTerm === String(this.config.correctTerm ?? '');
    if (!ok) {
      this.sfx('sfx_error');
      this.cameras.main.shake(180, 0.006);
      const err = this.add
        .text(0, 430, '> 认证失败。', { fontSize: '28px', color: '#c0392b', fontFamily: 'monospace' })
        .setOrigin(0.5);
      this.body.add(err);
      this.time.delayedCall(1200, () => err.destroy());
      return;
    }
    this.showLog();
  }

  private showLog(): void {
    this.clear();
    this.screen(0x10241c);
    const log = this.add
      .text(0, -120, String(this.config.logText ?? ''), {
        fontSize: '30px',
        color: COLORS.crtCyan,
        fontFamily: 'monospace',
        align: 'left',
        wordWrap: { width: 1000 },
      })
      .setOrigin(0.5);
    this.body.add(log);
    this.button(0, 340, '【 确认 】', () => this.succeed());
  }
}

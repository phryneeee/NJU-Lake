import Phaser from 'phaser';
import { PuzzleScene } from './PuzzleScene';
import { COLORS } from '../ui/theme';
import { runActions } from '../systems/actions';
import type { RoomAction } from '../types/room';

type Side = 2001 | 2026;

/**
 * 双时空联动（谜题5-3，全篇机制高潮）：
 * 上屏=2001鼓楼老图书馆（周韵秋），下屏=2026第七档案库（林晚）。
 * 中间的"还书箱"可以把物品送到另一个时代。
 * 三段式：①送折叠凳→她够到书架 ②她送来缝纫机油→开锈抽屉得钥匙→送回去开铁柜
 * ③按全宗号顺序归位六卷 → 2026侧书架滑开露出夹层。
 * 隐藏：把手电筒送去2001，照亮暗处书架 → bonusActions（残缺档案⑤）。
 */
export class DualTimelinePuzzle extends PuzzleScene {
  private tiles = new Map<string, Phaser.GameObjects.Container>();
  private msg2001!: Phaser.GameObjects.Text;
  private msg2026!: Phaser.GameObjects.Text;

  private phase = 0; // 0=开局 1=凳子已到2001 2=拿到五卷,铁柜出现 3=铁柜已开,排序中 4=排序完成
  private oilAt2026 = false;
  private hasKey2026 = false;
  private keyAt2001 = false;
  private torchAt2001 = false;
  private torchUsed = false;
  private sortNext = 0;
  private arrivals = { 2001: 0, 2026: 0 };

  constructor() {
    super('DualTimelinePuzzle');
  }

  protected override panelWidth(): number {
    return 1860;
  }
  protected override panelHeight(): number {
    return 1240;
  }

  protected buildPuzzle(): void {
    // 两个时代的色带
    const band2001 = this.add.rectangle(0, -330, 1800, 470, 0x4a3d2c);
    const band2026 = this.add.rectangle(0, 330, 1800, 470, 0x24382e);
    const tag2001 = this.add
      .text(-850, -540, '2001 · 鼓楼老图书馆（周韵秋）', { fontSize: '30px', color: '#d8c8a8', fontFamily: 'serif' })
      .setOrigin(0, 0.5);
    const tag2026 = this.add
      .text(-850, 540, '2026 · 第七档案库（林晚）', { fontSize: '30px', color: COLORS.crtCyan, fontFamily: 'serif' })
      .setOrigin(0, 0.5);

    // 还书箱
    const box = this.add.rectangle(0, 0, 260, 130, 0x1c1a17).setStrokeStyle(4, 0xe8c84a, 0.9);
    const boxLabel = this.add
      .text(0, 0, '还书箱', { fontSize: '30px', color: '#e8c84a', fontFamily: 'serif' })
      .setOrigin(0.5);

    this.msg2001 = this.add
      .text(0, -120, '', { fontSize: '28px', color: '#d8c8a8', fontFamily: 'serif', align: 'center', wordWrap: { width: 1600 } })
      .setOrigin(0.5);
    this.msg2026 = this.add
      .text(0, 120, '', { fontSize: '28px', color: COLORS.crtCyan, fontFamily: 'serif', align: 'center', wordWrap: { width: 1600 } })
      .setOrigin(0.5);

    this.panel.add([band2001, band2026, tag2001, tag2026, box, boxLabel, this.msg2001, this.msg2026]);

    // 2001 侧
    this.makeTile('shelf2001', 2001, -600, '高书架', () => this.tapShelf2001());
    this.makeTile('oil', 2001, -150, '缝纫机油', () => this.sendTile('oil', 2026, '缝纫机油', () => {
      this.oilAt2026 = true;
      this.say(2026, '还书箱哐当一响。一瓶崭新的缝纫机油——二十五年前的油，是新的。');
    }));
    this.makeTile('dark', 2001, 550, '暗处的书架', () => this.tapDark());

    // 2026 侧
    this.makeTile('stool', 2026, -600, '折叠凳', () => this.sendTile('stool', 2001, '折叠凳', () => {
      this.phase = 1;
      this.say(2001, '她接住了凳子，愣了一下，朝还书箱的方向轻轻说了声谢谢。');
    }));
    this.makeTile('drawer', 2026, -150, '锈死的抽屉', () => this.tapDrawer());
    this.makeTile('torch', 2026, 150, '手电筒', () => this.sendTile('torch', 2001, '手电筒', () => {
      this.torchAt2001 = true;
      this.say(2001, '手电筒滚进了2001年。光柱扫过她脚边，她吓了一跳。');
    }));
    this.makeTile('shelf2026', 2026, 550, '移不开的书架', () => this.tapShelf2026());

    this.say(2001, '她踮着脚，够不到最上层的卷宗。');
    this.say(2026, '同一排书架。我这边的墙后面是空的——隔着二十五年的空。');
  }

  private makeTile(key: string, side: Side, x: number, label: string, onTap: () => void): void {
    const y = side === 2001 ? -330 : 330;
    const c = this.add.container(x, y);
    const bg = this.add
      .rectangle(0, 0, 240, 150, side === 2001 ? 0x6b5a3f : 0x3e5c4b)
      .setStrokeStyle(3, 0xe8dcc0, 0.6)
      .setInteractive({ useHandCursor: true });
    const t = this.add
      .text(0, 0, label, { fontSize: '28px', color: COLORS.paper, fontFamily: 'serif', align: 'center', wordWrap: { width: 220 } })
      .setOrigin(0.5);
    c.add([bg, t]);
    bg.on('pointerdown', onTap);
    this.panel.add(c);
    this.tiles.set(key, c);
  }

  private retitle(key: string, label: string): void {
    const c = this.tiles.get(key);
    const t = c?.list[1] as Phaser.GameObjects.Text | undefined;
    t?.setText(label);
  }

  private say(side: Side, text: string): void {
    (side === 2001 ? this.msg2001 : this.msg2026).setText(text);
  }

  /** 物品扔进还书箱 → 出现在另一个时代 */
  private sendTile(key: string, toSide: Side, newLabel: string, onArrive: () => void): void {
    const c = this.tiles.get(key);
    if (!c) return;
    this.tiles.delete(key);
    this.tweens.add({
      targets: c,
      x: 0,
      y: 0,
      scale: 0.6,
      duration: 350,
      onComplete: () => {
        const slot = this.arrivals[toSide]++;
        this.tweens.add({
          targets: c,
          y: (toSide === 2001 ? -330 : 330) + slot * 14,
          x: -350 + slot * 56,
          scale: 1,
          duration: 350,
          onComplete: () => {
            this.retitle0(c, newLabel, toSide);
            onArrive();
          },
        });
      },
    });
  }

  private retitle0(c: Phaser.GameObjects.Container, label: string, side: Side): void {
    const bg = c.list[0] as Phaser.GameObjects.Rectangle;
    const t = c.list[1] as Phaser.GameObjects.Text;
    bg.setFillStyle(side === 2001 ? 0x6b5a3f : 0x3e5c4b);
    bg.disableInteractive();
    t.setText(label);
    c.setAlpha(0.7); // 已送达的物品变为场景的一部分
  }

  private tapShelf2001(): void {
    if (this.phase === 0) {
      this.say(2001, '「最上层够不到……要是有个凳子就好了。」她朝四周看了看。');
    } else if (this.phase === 1) {
      this.phase = 2;
      this.say(2001, '她踩上凳子，取下五卷。「还有第六卷——锁在铁柜里。钥匙早就找不到了。」');
      this.makeTile('cabinet', 2001, 150, '铁柜（锁着）', () => this.tapCabinet());
    } else {
      this.say(2001, '五卷已经取下来了，码在桌上。');
    }
  }

  private tapDrawer(): void {
    if (this.hasKey2026) return;
    if (!this.oilAt2026) {
      this.say(2026, '抽屉锈死了。我这个时代的锈，比她那个时代老二十五年。');
      return;
    }
    this.hasKey2026 = true;
    this.retitle('drawer', '抽屉（开了）');
    this.say(2026, '油渗进锈缝，抽屉应声而开。里面是一把铜钥匙——和2001年那把，是同一把。');
    this.makeTile('key', 2026, 150, '铜钥匙', () => this.sendTile('key', 2001, '铜钥匙', () => {
      this.keyAt2001 = true;
      this.say(2001, '钥匙穿过二十五年，落在她掌心。还带着我手心的温度。');
    }));
  }

  private tapCabinet(): void {
    if (this.phase !== 2) return;
    if (!this.keyAt2001) {
      this.say(2001, '铁柜纹丝不动。锁孔的形状……我在2026年的某个抽屉里见过配得上它的钥匙。');
      return;
    }
    this.phase = 3;
    this.retitle('cabinet', '铁柜（开了）');
    this.say(2001, '铁柜开了，第六卷到手。「现在，六卷按全宗号归位——甲、乙、丙、丁、戊、己。」');
    this.spawnVolumes();
  }

  private spawnVolumes(): void {
    const order = ['丙', '己', '甲', '戊', '乙', '丁']; // 打乱的展示顺序
    const correct = ['甲', '乙', '丙', '丁', '戊', '己'];
    order.forEach((zh, i) => {
      const x = -700 + i * 230;
      const c = this.add.container(x, -460);
      const bg = this.add
        .rectangle(0, 0, 200, 110, 0x8a7550)
        .setStrokeStyle(3, 0xe8dcc0, 0.6)
        .setInteractive({ useHandCursor: true });
      const t = this.add
        .text(0, 0, `全宗·${zh}`, { fontSize: '28px', color: '#1C1A17', fontFamily: 'serif' })
        .setOrigin(0.5);
      c.add([bg, t]);
      this.panel.add(c);
      bg.on('pointerdown', () => {
        if (this.phase !== 3) return;
        if (zh === correct[this.sortNext]) {
          this.sortNext++;
          bg.setFillStyle(0x3e5c4b);
          t.setColor('#E8DCC0');
          if (this.sortNext >= correct.length) this.finishSort();
        } else {
          this.cameras.main.shake(150, 0.005);
          this.sortNext = 0;
          this.say(2001, '「不对，乱了。重来——全宗号的顺序，跟档号规则牌上一样。」');
          // 重置颜色
          this.panel.list.forEach((o) => {
            if (o instanceof Phaser.GameObjects.Container && o.y === -460) {
              const b = o.list[0] as Phaser.GameObjects.Rectangle;
              const tt = o.list[1] as Phaser.GameObjects.Text;
              b.setFillStyle(0x8a7550);
              tt.setColor('#1C1A17');
            }
          });
        }
      });
    });
  }

  private finishSort(): void {
    this.phase = 4;
    this.say(2001, '六卷归位。她拍了拍手上的灰，忽然抬头看向天花板——看向我的方向。');
    this.say(2026, '轰。我这一侧的书架自己滑开了。墙里有一个夹层，放着用油纸包好的东西。');
    this.retitle('shelf2026', '夹层（打开）');
  }

  private tapShelf2026(): void {
    if (this.phase < 4) {
      this.say(2026, '书架移不开。后面明明是空的——得让2001年那边先完成什么。');
      return;
    }
    this.cameras.main.flash(300, 127, 212, 193);
    this.time.delayedCall(400, () => this.succeed());
  }

  private tapDark(): void {
    if (!this.torchAt2001) {
      this.say(2001, '书架最里面太暗了，她看不见。我这边倒是有现成的光。');
      return;
    }
    if (this.torchUsed) {
      this.say(2001, '暗处已经照过了，没有别的了。');
      return;
    }
    this.torchUsed = true;
    const bonus = (this.config.bonusActions as RoomAction[]) ?? [];
    runActions(this.scene.get('Room'), bonus);
    this.say(2001, '光柱尽头，书架深处塞着一份蒙尘的档案。她抽出来，放进了还书箱。【残缺档案 5/6】');
  }
}

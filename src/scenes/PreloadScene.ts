import Phaser from 'phaser';
import { bgUrls, audioUrls } from '../data/assets';
import { W, H, COLORS } from '../ui/theme';

/** 按资产清单加载正式美术/音频；清单为空（纯灰盒）时直接进标题。 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    if (bgUrls.size + audioUrls.size > 0) {
      const bar = this.add.rectangle(W / 2, H / 2, 4, 24, 0x7fd4c1);
      this.add
        .text(W / 2, H / 2 - 60, '正在整理档案……', {
          fontSize: '32px',
          color: COLORS.paper,
          fontFamily: 'serif',
        })
        .setOrigin(0.5);
      this.load.on('progress', (p: number) => bar.setSize(Math.max(4, 800 * p), 24));
    }

    for (const [roomId, url] of bgUrls) this.load.image(`bg_${roomId}`, url);
    for (const [key, url] of audioUrls) this.load.audio(key, url);
  }

  create(): void {
    this.scene.start('Title');
  }
}

import Phaser from 'phaser';
import { bgUrls, audioUrls, itemUrls } from '../data/assets';
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

    for (const [roomId, asset] of bgUrls) {
      if (asset.isSvg) {
        // SVG 按逻辑分辨率栅格化（retina 下清晰）
        this.load.svg(`bg_${roomId}`, asset.url, { width: W, height: H });
      } else {
        this.load.image(`bg_${roomId}`, asset.url);
      }
    }
    for (const [key, url] of audioUrls) this.load.audio(key, url);
    // 物品图标：256px 栅格化（物品栏 140px 槽位下依然清晰）
    for (const [id, url] of itemUrls) this.load.svg(`item_${id}`, url, { width: 256, height: 256 });
  }

  create(): void {
    this.scene.start('Title');
  }
}

import Phaser from 'phaser';
import { audioUrls } from '../data/assets';
import { Settings } from './Settings';

/**
 * 音频系统：环境底噪 crossfade + 单次音效。
 * 资产缺失时静默降级（灰盒阶段无音频文件也能跑）。
 */
class AudioSystemImpl {
  private currentAmbience?: Phaser.Sound.BaseSound;
  private currentKey?: string;

  /** 切换环境底噪（淡出旧的、淡入新的）。key 为空则只淡出。 */
  setAmbience(scene: Phaser.Scene, key?: string): void {
    if (key === this.currentKey) return;

    const old = this.currentAmbience;
    if (old) {
      scene.tweens.add({
        targets: old,
        volume: 0,
        duration: 800,
        onComplete: () => old.destroy(),
      });
      this.currentAmbience = undefined;
      this.currentKey = undefined;
    }

    if (!key || !audioUrls.has(key) || !scene.cache.audio.exists(key)) return;

    const snd = scene.sound.add(key, { loop: true, volume: 0 });
    snd.play();
    scene.tweens.add({ targets: snd, volume: 0.6, duration: 1200 });
    this.currentAmbience = snd;
    this.currentKey = key;
  }

  /** 单次音效（缺资产时静默） */
  sfx(scene: Phaser.Scene, key: string): void {
    if (Settings.get().muted) return;
    if (scene.cache.audio.exists(key)) scene.sound.play(key, { volume: 0.8 });
  }

  applyMute(game: Phaser.Game): void {
    game.sound.mute = Settings.get().muted;
  }
}

export const AudioSystem = new AudioSystemImpl();

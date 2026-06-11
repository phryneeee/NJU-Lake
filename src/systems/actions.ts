import Phaser from 'phaser';
import type { RoomAction } from '../types/room';
import { GameState } from './GameState';
import { getText } from '../data/registry';

/**
 * 动作解释器：热区点击 / 谜题成功后统一执行。
 * goRoom / openPuzzle / chapterCard 是场景级动作，必须放在动作序列末尾。
 */
export function runActions(scene: Phaser.Scene, actions: RoomAction[]): void {
  for (const a of actions) {
    switch (a.type) {
      case 'say':
        GameState.say(getText(a.textId ?? ''));
        break;
      case 'give':
        if (a.item) GameState.giveItem(a.item);
        break;
      case 'take':
        if (a.item) GameState.takeItem(a.item);
        break;
      case 'setFlag':
        if (a.flag) GameState.setFlag(a.flag);
        break;
      case 'goRoom':
        if (a.room) {
          GameState.setRoom(a.room);
          scene.scene.get('Room').scene.restart();
        }
        break;
      case 'openPuzzle':
        if (a.puzzle) {
          scene.scene.pause('Room');
          scene.scene.launch(a.puzzle, a.config ?? { successActions: [] });
        }
        break;
      case 'chapterCard':
        GameState.emit('chapterCard', a.title ?? '', a.subtitle ?? '');
        break;
    }
  }
}

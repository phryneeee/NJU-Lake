import Phaser from 'phaser';
import { isKnownFlag } from '../data/flags';
import { saveState, loadState } from './SaveSystem';

export interface SaveData {
  v: number;
  flags: string[];
  inventory: string[];
  currentRoom: string;
}

/**
 * 全局状态机（单一事实源）。
 * 事件：'flag'(flag) / 'inventory' / 'select'(itemId|null) / 'say'(text) / 'chapterCard'(title, subtitle)
 */
class GameStateImpl extends Phaser.Events.EventEmitter {
  flags = new Set<string>();
  inventory: string[] = [];
  selectedItem: string | null = null;
  currentRoom = 'ch1_corridor';

  hasFlag(flag: string): boolean {
    return this.flags.has(flag);
  }

  setFlag(flag: string): void {
    if (!isKnownFlag(flag)) {
      console.warn(`[GameState] 未登记的 flag: ${flag}（请先在 data/flags.ts 登记）`);
    }
    if (this.flags.has(flag)) return;
    this.flags.add(flag);
    this.emit('flag', flag);
    this.persist();
  }

  hasItem(item: string): boolean {
    return this.inventory.includes(item);
  }

  giveItem(item: string): void {
    if (this.hasItem(item)) return;
    this.inventory.push(item);
    this.emit('inventory');
    this.persist();
  }

  takeItem(item: string): void {
    const i = this.inventory.indexOf(item);
    if (i === -1) return;
    this.inventory.splice(i, 1);
    if (this.selectedItem === item) this.select(null);
    this.emit('inventory');
    this.persist();
  }

  select(item: string | null): void {
    this.selectedItem = item;
    this.emit('select', item);
  }

  setRoom(room: string): void {
    this.currentRoom = room;
    this.persist();
  }

  say(text: string): void {
    this.emit('say', text);
  }

  persist(): void {
    saveState({
      v: 1,
      flags: [...this.flags],
      inventory: [...this.inventory],
      currentRoom: this.currentRoom,
    });
  }

  restore(): void {
    const data = loadState();
    if (!data || data.v !== 1) return;
    this.flags = new Set(data.flags);
    this.inventory = [...data.inventory];
    this.currentRoom = data.currentRoom;
  }

  resetAll(): void {
    this.flags.clear();
    this.inventory = [];
    this.selectedItem = null;
    this.currentRoom = 'ch1_corridor';
    this.persist();
  }
}

export const GameState = new GameStateImpl();

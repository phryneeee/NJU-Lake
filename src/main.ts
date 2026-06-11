import Phaser from 'phaser';
import { W, H } from './ui/theme';
import { GameState } from './systems/GameState';
import { TitleScene } from './scenes/TitleScene';
import { RoomScene } from './scenes/RoomScene';
import { UIScene } from './scenes/UIScene';
import { DialLockPuzzle } from './puzzles/DialLockPuzzle';
import { SortPuzzle } from './puzzles/SortPuzzle';
import { IndexCabinetPuzzle } from './puzzles/IndexCabinetPuzzle';
import { VhsTuningPuzzle } from './puzzles/VhsTuningPuzzle';
import { OpacPuzzle } from './puzzles/OpacPuzzle';
import { QuizPuzzle } from './puzzles/QuizPuzzle';
import { ElevatorPuzzle } from './puzzles/ElevatorPuzzle';

GameState.restore();

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    TitleScene,
    RoomScene,
    UIScene,
    DialLockPuzzle,
    SortPuzzle,
    IndexCabinetPuzzle,
    VhsTuningPuzzle,
    OpacPuzzle,
    QuizPuzzle,
    ElevatorPuzzle,
  ],
});

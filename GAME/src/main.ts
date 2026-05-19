import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameBridge } from './bridge/GameBridge';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'app',
    backgroundColor: '#1a1a1a',
    scene: [BootScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0, x: 0 },
            debug: false
        }
    }
};

const game = new Phaser.Game(config);
new GameBridge(game);

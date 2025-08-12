import Phaser from 'phaser';
import { GameManager } from '../managers/GameManager';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    
    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);
    
    // Title
    const title = this.add.text(width / 2, height / 3, 'HEROLL', {
      fontSize: '64px',
      color: '#e74c3c',
      fontFamily: 'Courier New, monospace'
    }).setOrigin(0.5);
    
    // Subtitle
    this.add.text(width / 2, height / 3 + 80, 'Roguelike Board Game RPG', {
      fontSize: '24px',
      color: '#ecf0f1',
      fontFamily: 'Courier New, monospace'
    }).setOrigin(0.5);
    
    // New Game Button
    const newGameBtn = this.add.rectangle(width / 2, height / 2 + 50, 200, 50, 0x27ae60)
      .setInteractive()
      .on('pointerdown', () => this.startNewGame())
      .on('pointerover', () => newGameBtn.setFillStyle(0x2ecc71))
      .on('pointerout', () => newGameBtn.setFillStyle(0x27ae60));
    
    this.add.text(width / 2, height / 2 + 50, 'New Game', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Courier New, monospace'
    }).setOrigin(0.5);
    
    // Load Game Button
    const loadGameBtn = this.add.rectangle(width / 2, height / 2 + 120, 200, 50, 0x3498db)
      .setInteractive()
      .on('pointerdown', () => this.loadGame())
      .on('pointerover', () => loadGameBtn.setFillStyle(0x5dade2))
      .on('pointerout', () => loadGameBtn.setFillStyle(0x3498db));
    
    this.add.text(width / 2, height / 2 + 120, 'Load Game', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Courier New, monospace'
    }).setOrigin(0.5);
    
    // Instructions
    this.add.text(width / 2, height - 100, 'Roll dice to move around the board\nFight enemies, collect treasure, and progress!', {
      fontSize: '16px',
      color: '#bdc3c7',
      fontFamily: 'Courier New, monospace',
      align: 'center'
    }).setOrigin(0.5);
  }
  
  private startNewGame(): void {
    GameManager.getInstance();
    this.scene.start('GameScene');
  }
  
  private loadGame(): void {
    const gameManager = GameManager.getInstance();
    if (gameManager.loadGame()) {
      this.scene.start('GameScene');
    } else {
      // Show "No save found" message
      const { width, height } = this.cameras.main;
      const message = this.add.text(width / 2, height - 50, 'No save file found!', {
        fontSize: '18px',
        color: '#e74c3c',
        fontFamily: 'Courier New, monospace'
      }).setOrigin(0.5);
      
      this.time.delayedCall(2000, () => message.destroy());
    }
  }
}
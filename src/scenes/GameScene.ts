import Phaser from 'phaser';
import { GameManager } from '../managers/GameManager';
import { BoardTile, TileType } from '../types/GameTypes';

export class GameScene extends Phaser.Scene {
  private gameManager!: GameManager;
  private playerSprite!: Phaser.GameObjects.Rectangle;
  private tileSprites: Phaser.GameObjects.Rectangle[] = [];
  private diceButton!: Phaser.GameObjects.Rectangle;
  private uiElements: { [key: string]: Phaser.GameObjects.Text } = {};
  private isMoving: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.gameManager = GameManager.getInstance();
    
    // Background
    this.add.rectangle(512, 384, 1024, 768, 0x2c3e50);
    
    this.createBoard();
    this.createPlayer();
    this.createUI();
    this.updateUI();
  }

  private createBoard(): void {
    this.gameManager.board.forEach((tile, index) => {
      const color = this.getTileColor(tile.type as TileType);
      const tileSprite = this.add.rectangle(tile.x, tile.y, 32, 32, color)
        .setStrokeStyle(2, 0xffffff);
      
      // Add tile number
      this.add.text(tile.x, tile.y - 20, index.toString(), {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'Courier New, monospace'
      }).setOrigin(0.5);
      
      // Add tile type indicator
      const symbol = this.getTileSymbol(tile.type as TileType);
      this.add.text(tile.x, tile.y, symbol, {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Courier New, monospace'
      }).setOrigin(0.5);
      
      this.tileSprites.push(tileSprite as Phaser.GameObjects.Rectangle);
    });
  }

  private createPlayer(): void {
    const startTile = this.gameManager.board[0];
    this.playerSprite = this.add.rectangle(startTile.x, startTile.y - 40, 20, 20, 0xe74c3c)
      .setStrokeStyle(2, 0xffffff);
  }

  private createUI(): void {
    // Player stats panel
    const panelX = 50;
    const panelY = 50;
    
    this.add.rectangle(150, 120, 280, 200, 0x34495e, 0.9)
      .setStrokeStyle(2, 0xecf0f1);
    
    this.uiElements.health = this.add.text(panelX, panelY, '', {
      fontSize: '16px',
      color: '#e74c3c',
      fontFamily: 'Courier New, monospace'
    });
    
    this.uiElements.level = this.add.text(panelX, panelY + 25, '', {
      fontSize: '16px',
      color: '#f39c12',
      fontFamily: 'Courier New, monospace'
    });
    
    this.uiElements.coins = this.add.text(panelX, panelY + 50, '', {
      fontSize: '16px',
      color: '#f1c40f',
      fontFamily: 'Courier New, monospace'
    });
    
    this.uiElements.floor = this.add.text(panelX, panelY + 75, '', {
      fontSize: '16px',
      color: '#9b59b6',
      fontFamily: 'Courier New, monospace'
    });
    
    this.uiElements.position = this.add.text(panelX, panelY + 100, '', {
      fontSize: '16px',
      color: '#3498db',
      fontFamily: 'Courier New, monospace'
    });
    
    // Dice button
    this.diceButton = this.add.rectangle(512, 650, 100, 50, 0x27ae60)
      .setInteractive()
      .on('pointerdown', () => this.rollDice())
      .on('pointerover', () => this.diceButton.setFillStyle(0x2ecc71))
      .on('pointerout', () => this.diceButton.setFillStyle(0x27ae60));
    
    this.add.text(512, 650, 'ROLL DICE', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Courier New, monospace'
    }).setOrigin(0.5);
    
    // Menu button
    const menuBtn = this.add.rectangle(950, 50, 100, 40, 0x95a5a6)
      .setInteractive()
      .on('pointerdown', () => this.scene.start('MenuScene'));
    
    this.add.text(950, 50, 'MENU', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Courier New, monospace'
    }).setOrigin(0.5);
  }

  private rollDice(): void {
    if (this.isMoving) return;
    
    const roll = this.gameManager.rollDice();
    this.showDiceRoll(roll);
    
    this.time.delayedCall(1000, () => {
      this.movePlayer(roll);
    });
  }

  private showDiceRoll(roll: number): void {
    const diceText = this.add.text(512, 550, `Rolled: ${roll}`, {
      fontSize: '24px',
      color: '#e74c3c',
      fontFamily: 'Courier New, monospace'
    }).setOrigin(0.5);
    
    this.time.delayedCall(2000, () => diceText.destroy());
  }

  private movePlayer(steps: number): void {
    this.isMoving = true;
    const startPos = this.gameManager.player.position;
    let currentStep = 0;
    
    const moveStep = () => {
      if (currentStep < steps) {
        currentStep++;
        const newPos = (startPos + currentStep) % this.gameManager.boardSize;
        const tile = this.gameManager.board[newPos];
        
        this.tweens.add({
          targets: this.playerSprite,
          x: tile.x,
          y: tile.y - 40,
          duration: 300,
          onComplete: () => {
            if (currentStep === steps) {
              this.gameManager.movePlayer(steps);
              this.updateUI();
              this.handleTileEvent();
              this.isMoving = false;
            } else {
              moveStep();
            }
          }
        });
      }
    };
    
    moveStep();
  }

  private handleTileEvent(): void {
    const currentTile = this.gameManager.getCurrentTile();
    
    switch (currentTile.type) {
      case TileType.ENEMY:
        this.showMessage('Enemy encountered!', 0xe74c3c);
        this.time.delayedCall(1500, () => {
          this.scene.start('CombatScene');
        });
        break;
        
      case TileType.TREASURE:
        const coins = Math.floor(Math.random() * 30) + 10;
        this.gameManager.player.coins += coins;
        this.showMessage(`Found ${coins} coins!`, 0xf1c40f);
        this.updateUI();
        break;
        
      case TileType.SHOP:
        this.showMessage('Welcome to the shop!', 0x3498db);
        break;
        
      case TileType.EVENT:
        this.handleRandomEvent();
        break;
        
      case TileType.BOSS:
        this.showMessage('Boss fight!', 0x8e44ad);
        this.time.delayedCall(1500, () => {
          this.scene.start('CombatScene');
        });
        break;
    }
    
    this.gameManager.saveGame();
  }

  private handleRandomEvent(): void {
    const events = [
      { text: 'Found a healing potion!', effect: () => {
        this.gameManager.player.health = Math.min(
          this.gameManager.player.maxHealth,
          this.gameManager.player.health + 20
        );
      }},
      { text: 'Trap! Lost some health.', effect: () => {
        this.gameManager.player.health = Math.max(1, this.gameManager.player.health - 15);
      }},
      { text: 'Blessing! Attack increased.', effect: () => {
        this.gameManager.player.attack += 2;
      }}
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    event.effect();
    this.showMessage(event.text, 0x9b59b6);
    this.updateUI();
  }

  private showMessage(text: string, color: number): void {
    const message = this.add.text(512, 300, text, {
      fontSize: '20px',
      color: `#${color.toString(16)}`,
      fontFamily: 'Courier New, monospace',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5);
    
    this.time.delayedCall(2000, () => message.destroy());
  }

  private updateUI(): void {
    const player = this.gameManager.player;
    this.uiElements.health.setText(`Health: ${player.health}/${player.maxHealth}`);
    this.uiElements.level.setText(`Level: ${player.level}`);
    this.uiElements.coins.setText(`Coins: ${player.coins}`);
    this.uiElements.floor.setText(`Floor: ${this.gameManager.currentFloor}`);
    this.uiElements.position.setText(`Position: ${player.position}`);
  }

  private getTileColor(type: TileType): number {
    switch (type) {
      case TileType.START: return 0x2ecc71;
      case TileType.ENEMY: return 0xe74c3c;
      case TileType.TREASURE: return 0xf1c40f;
      case TileType.SHOP: return 0x3498db;
      case TileType.EVENT: return 0x9b59b6;
      case TileType.BOSS: return 0x8e44ad;
      default: return 0x95a5a6;
    }
  }

  private getTileSymbol(type: TileType): string {
    switch (type) {
      case TileType.START: return 'S';
      case TileType.ENEMY: return 'E';
      case TileType.TREASURE: return 'T';
      case TileType.SHOP: return '$';
      case TileType.EVENT: return '?';
      case TileType.BOSS: return 'B';
      default: return '';
    }
  }
}
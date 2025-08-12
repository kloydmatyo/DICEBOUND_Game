import Phaser from 'phaser';
import { Player, BoardTile, TileType, GameState } from '../types/GameTypes';
import { GameManager } from '../managers/GameManager';
import { BoardManager } from '../managers/BoardManager';

export class GameScene extends Phaser.Scene {
  private gameManager!: GameManager;
  private boardManager!: BoardManager;
  private player!: Player;
  private gameState!: GameState;
  private diceButton!: Phaser.GameObjects.Text;
  private playerSprite!: Phaser.GameObjects.Rectangle;
  private uiElements: { [key: string]: Phaser.GameObjects.Text } = {};

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: any) {
    // If game state is passed from another scene (like combat), use it
    if (data && data.gameState) {
      this.gameState = data.gameState;
      this.player = this.gameState.player;
    }
  }

  create() {
    this.gameManager = new GameManager();
    this.boardManager = new BoardManager(this);
    
    // Initialize game state only if not already set
    if (!this.gameState) {
      this.gameState = this.gameManager.initializeGame();
      this.player = this.gameState.player;
    }

    // Create the board
    this.boardManager.createBoard(this.gameState.board);
    
    // Create player sprite
    this.createPlayer();
    
    // Create UI
    this.createUI();
    
    // Create dice button
    this.createDiceButton();
  }

  private createPlayer() {
    const currentTile = this.gameState.board[this.player.position];
    this.playerSprite = this.add.rectangle(currentTile.x, currentTile.y, 20, 20, 0xff6b6b);
  }

  private createUI() {
    const padding = 20;
    
    // Player stats
    this.uiElements.health = this.add.text(padding, padding, '', {
      fontSize: '18px',
      color: '#ff6b6b',
      fontFamily: 'Courier New, monospace'
    });
    
    this.uiElements.coins = this.add.text(padding, padding + 30, '', {
      fontSize: '18px',
      color: '#ffe66d',
      fontFamily: 'Courier New, monospace'
    });
    
    this.uiElements.floor = this.add.text(padding, padding + 60, '', {
      fontSize: '18px',
      color: '#4ecdc4',
      fontFamily: 'Courier New, monospace'
    });
    
    this.updateUI();
  }

  private createDiceButton() {
    const centerX = this.cameras.main.width / 2;
    const bottomY = this.cameras.main.height - 80;
    
    this.diceButton = this.add.text(centerX, bottomY, 'ROLL DICE', {
      fontSize: '24px',
      color: '#ffe66d',
      fontFamily: 'Courier New, monospace',
      backgroundColor: '#16213e',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();

    this.diceButton.on('pointerdown', () => {
      this.rollDice();
    });

    this.diceButton.on('pointerover', () => {
      this.diceButton.setStyle({ color: '#ff6b6b' });
    });

    this.diceButton.on('pointerout', () => {
      this.diceButton.setStyle({ color: '#ffe66d' });
    });
  }

  private rollDice() {
    const diceValue = Math.floor(Math.random() * 6) + 1;
    this.gameState.diceValue = diceValue;
    
    // Disable dice button temporarily
    this.diceButton.setStyle({ color: '#666666' });
    this.diceButton.disableInteractive();
    
    // Show dice result
    const diceText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, `Rolled: ${diceValue}`, {
      fontSize: '48px',
      color: '#ff6b6b',
      fontFamily: 'Courier New, monospace'
    }).setOrigin(0.5);
    
    // Move player after delay
    this.time.delayedCall(1500, () => {
      diceText.destroy();
      this.movePlayer(diceValue);
    });
  }

  private movePlayer(steps: number) {
    const boardSize = this.gameState.board.length;
    let currentStep = 0;
    
    const moveStep = () => {
      if (currentStep < steps) {
        this.player.position = (this.player.position + 1) % boardSize;
        const tile = this.gameState.board[this.player.position];
        
        // Animate player movement
        this.tweens.add({
          targets: this.playerSprite,
          x: tile.x,
          y: tile.y,
          duration: 300,
          ease: 'Power2'
        });
        
        currentStep++;
        this.time.delayedCall(400, moveStep);
      } else {
        // Movement complete, handle tile event
        this.handleTileEvent();
      }
    };
    
    moveStep();
  }

  private handleTileEvent() {
    const currentTile = this.gameState.board[this.player.position];
    
    switch (currentTile.type) {
      case TileType.ENEMY:
        this.handleEnemyTile();
        break;
      case TileType.TREASURE:
        this.handleTreasureTile();
        break;
      case TileType.SHOP:
        this.handleShopTile();
        break;
      case TileType.EVENT:
        this.handleEventTile();
        break;
      case TileType.BOSS:
        this.handleBossTile();
        break;
      default:
        this.endTurn();
        break;
    }
  }

  private handleEnemyTile() {
    // Start combat
    this.scene.start('CombatScene', { 
      player: this.player, 
      enemy: this.gameManager.generateEnemy(this.gameState.currentFloor),
      gameState: this.gameState 
    });
  }

  private handleTreasureTile() {
    const coins = Math.floor(Math.random() * 20) + 10;
    this.player.coins += coins;
    
    this.showMessage(`Found ${coins} coins!`, '#ffe66d');
    this.endTurn();
  }

  private handleShopTile() {
    this.showMessage('Shop coming soon!', '#4ecdc4');
    this.endTurn();
  }

  private handleEventTile() {
    const events = [
      { text: 'Found a healing potion!', effect: () => this.player.health = Math.min(this.player.maxHealth, this.player.health + 20) },
      { text: 'Cursed by a witch! -5 health', effect: () => this.player.health = Math.max(1, this.player.health - 5) },
      { text: 'Lucky find! +15 coins', effect: () => this.player.coins += 15 }
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    event.effect();
    this.showMessage(event.text, '#a8a8a8');
    this.endTurn();
  }

  private handleBossTile() {
    this.showMessage('Boss fight coming soon!', '#ff6b6b');
    this.endTurn();
  }

  private showMessage(text: string, color: string) {
    const message = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 100, text, {
      fontSize: '24px',
      color: color,
      fontFamily: 'Courier New, monospace',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    
    this.time.delayedCall(2000, () => {
      message.destroy();
    });
  }

  private endTurn() {
    this.updateUI();
    
    // Re-enable dice button
    this.time.delayedCall(2500, () => {
      this.diceButton.setStyle({ color: '#ffe66d' });
      this.diceButton.setInteractive();
    });
  }

  private updateUI() {
    this.uiElements.health.setText(`Health: ${this.player.health}/${this.player.maxHealth}`);
    this.uiElements.coins.setText(`Coins: ${this.player.coins}`);
    this.uiElements.floor.setText(`Floor: ${this.gameState.currentFloor}`);
  }
}
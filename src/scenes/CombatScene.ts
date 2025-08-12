import Phaser from 'phaser';
import { GameManager } from '../managers/GameManager';
import { Enemy } from '../types/GameTypes';

export class CombatScene extends Phaser.Scene {
  private gameManager!: GameManager;
  private enemy!: Enemy;
  private playerHealthBar!: Phaser.GameObjects.Rectangle;
  private enemyHealthBar!: Phaser.GameObjects.Rectangle;
  private combatLog: Phaser.GameObjects.Text[] = [];
  private actionButtons: Phaser.GameObjects.Rectangle[] = [];
  private isPlayerTurn: boolean = true;
  private combatEnded: boolean = false;

  constructor() {
    super({ key: 'CombatScene' });
  }

  create(): void {
    this.gameManager = GameManager.getInstance();
    this.enemy = this.gameManager.generateEnemy();
    this.combatEnded = false;
    
    // Background
    this.add.rectangle(512, 384, 1024, 768, 0x2c3e50);
    
    this.createCombatUI();
    this.createActionButtons();
    this.addCombatLog('Combat begins!');
  }

  private createCombatUI(): void {
    const { width, height } = this.cameras.main;
    
    // Player section
    this.add.text(150, 100, 'HERO', {
      fontSize: '24px',
      color: '#e74c3c',
      fontFamily: 'Courier New, monospace'
    }).setOrigin(0.5);
    
    // Player sprite placeholder
    this.add.rectangle(150, 200, 80, 80, 0xe74c3c)
      .setStrokeStyle(3, 0xffffff);
    
    // Player health bar background
    this.add.rectangle(150, 300, 200, 20, 0x34495e)
      .setStrokeStyle(2, 0xffffff);
    
    // Player health bar
    this.playerHealthBar = this.add.rectangle(150, 300, 200, 20, 0x27ae60);
    
    // Player stats
    const player = this.gameManager.player;
    this.add.text(150, 330, `HP: ${player.health}/${player.maxHealth}`, {
      fontSize: '16px',
      color: '#ecf0f1',
      fontFamily: 'Courier New, monospace'
    }).setOrigin(0.5);
    
    this.add.text(150, 350, `ATK: ${player.attack} | DEF: ${player.defense}`, {
      fontSize: '16px',
      color: '#ecf0f1',
      fontFamily: 'Courier New, monospace'
    }).setOrigin(0.5);
    
    // Enemy section
    this.add.text(width - 150, 100, this.enemy.name.toUpperCase(), {
      fontSize: '24px',
      color: '#e74c3c',
      fontFamily: 'Courier New, monospace'
    }).setOrigin(0.5);
    
    // Enemy sprite placeholder
    this.add.rectangle(width - 150, 200, 80, 80, 0x8e44ad)
      .setStrokeStyle(3, 0xffffff);
    
    // Enemy health bar background
    this.add.rectangle(width - 150, 300, 200, 20, 0x34495e)
      .setStrokeStyle(2, 0xffffff);
    
    // Enemy health bar
    this.enemyHealthBar = this.add.rectangle(width - 150, 300, 200, 20, 0x27ae60);
    
    // Enemy stats
    this.add.text(width - 150, 330, `HP: ${this.enemy.health}/${this.enemy.maxHealth}`, {
      fontSize: '16px',
      color: '#ecf0f1',
      fontFamily: 'Courier New, monospace'
    }).setOrigin(0.5);
    
    this.add.text(width - 150, 350, `ATK: ${this.enemy.attack} | DEF: ${this.enemy.defense}`, {
      fontSize: '16px',
      color: '#ecf0f1',
      fontFamily: 'Courier New, monospace'
    }).setOrigin(0.5);
    
    // Combat log background
    this.add.rectangle(512, 500, 600, 200, 0x34495e, 0.9)
      .setStrokeStyle(2, 0xecf0f1);
  }

  private createActionButtons(): void {
    const buttonY = 650;
    const buttonSpacing = 150;
    const startX = 300;
    
    // Attack button
    const attackBtn = this.add.rectangle(startX, buttonY, 120, 50, 0xe74c3c)
      .setInteractive()
      .on('pointerdown', () => this.playerAttack())
      .on('pointerover', () => attackBtn.setFillStyle(0xc0392b))
      .on('pointerout', () => attackBtn.setFillStyle(0xe74c3c));
    
    this.add.text(startX, buttonY, 'ATTACK', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Courier New, monospace'
    }).setOrigin(0.5);
    
    // Defend button
    const defendBtn = this.add.rectangle(startX + buttonSpacing, buttonY, 120, 50, 0x3498db)
      .setInteractive()
      .on('pointerdown', () => this.playerDefend())
      .on('pointerover', () => defendBtn.setFillStyle(0x2980b9))
      .on('pointerout', () => defendBtn.setFillStyle(0x3498db));
    
    this.add.text(startX + buttonSpacing, buttonY, 'DEFEND', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Courier New, monospace'
    }).setOrigin(0.5);
    
    // Run button
    const runBtn = this.add.rectangle(startX + buttonSpacing * 2, buttonY, 120, 50, 0x95a5a6)
      .setInteractive()
      .on('pointerdown', () => this.playerRun())
      .on('pointerover', () => runBtn.setFillStyle(0x7f8c8d))
      .on('pointerout', () => runBtn.setFillStyle(0x95a5a6));
    
    this.add.text(startX + buttonSpacing * 2, buttonY, 'RUN', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Courier New, monospace'
    }).setOrigin(0.5);
    
    this.actionButtons = [attackBtn, defendBtn, runBtn];
  }

  private playerAttack(): void {
    if (!this.isPlayerTurn || this.combatEnded) return;
    
    const player = this.gameManager.player;
    const damage = Math.max(1, player.attack - this.enemy.defense);
    this.enemy.health = Math.max(0, this.enemy.health - damage);
    
    this.addCombatLog(`Hero attacks for ${damage} damage!`);
    this.updateHealthBars();
    
    if (this.enemy.health <= 0) {
      this.enemyDefeated();
      return;
    }
    
    this.isPlayerTurn = false;
    this.disableButtons();
    
    this.time.delayedCall(1500, () => {
      this.enemyTurn();
    });
  }

  private playerDefend(): void {
    if (!this.isPlayerTurn || this.combatEnded) return;
    
    this.addCombatLog('Hero defends, reducing incoming damage!');
    this.isPlayerTurn = false;
    this.disableButtons();
    
    this.time.delayedCall(1500, () => {
      this.enemyTurn(true);
    });
  }

  private playerRun(): void {
    if (!this.isPlayerTurn || this.combatEnded) return;
    
    if (Math.random() < 0.7) {
      this.addCombatLog('Successfully ran away!');
      this.time.delayedCall(1500, () => {
        this.scene.start('GameScene');
      });
    } else {
      this.addCombatLog('Failed to run away!');
      this.isPlayerTurn = false;
      this.disableButtons();
      
      this.time.delayedCall(1500, () => {
        this.enemyTurn();
      });
    }
  }

  private enemyTurn(playerDefending: boolean = false): void {
    const damage = Math.max(1, this.enemy.attack - this.gameManager.player.defense);
    const finalDamage = playerDefending ? Math.floor(damage / 2) : damage;
    
    this.gameManager.player.health = Math.max(0, this.gameManager.player.health - finalDamage);
    
    this.addCombatLog(`${this.enemy.name} attacks for ${finalDamage} damage!`);
    this.updateHealthBars();
    
    if (this.gameManager.player.health <= 0) {
      this.playerDefeated();
      return;
    }
    
    this.isPlayerTurn = true;
    this.enableButtons();
  }

  private enemyDefeated(): void {
    this.combatEnded = true;
    this.addCombatLog(`${this.enemy.name} defeated!`);
    
    // Reward experience and coins
    this.gameManager.player.experience += this.enemy.experience;
    const coinReward = Math.floor(Math.random() * 20) + 10;
    this.gameManager.player.coins += coinReward;
    
    this.addCombatLog(`Gained ${this.enemy.experience} XP and ${coinReward} coins!`);
    
    // Check for level up
    const expNeeded = this.gameManager.player.level * 100;
    if (this.gameManager.player.experience >= expNeeded) {
      this.levelUp();
    }
    
    this.disableButtons();
    
    // Return to game button
    const continueBtn = this.add.rectangle(512, 650, 150, 50, 0x27ae60)
      .setInteractive()
      .on('pointerdown', () => this.scene.start('GameScene'));
    
    this.add.text(512, 650, 'CONTINUE', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Courier New, monospace'
    }).setOrigin(0.5);
  }

  private playerDefeated(): void {
    this.combatEnded = true;
    this.addCombatLog('Hero defeated! Game Over!');
    this.disableButtons();
    
    this.time.delayedCall(3000, () => {
      this.scene.start('MenuScene');
    });
  }

  private levelUp(): void {
    this.gameManager.player.level++;
    this.gameManager.player.experience = 0;
    this.gameManager.player.maxHealth += 20;
    this.gameManager.player.health = this.gameManager.player.maxHealth;
    this.gameManager.player.attack += 3;
    this.gameManager.player.defense += 2;
    
    this.addCombatLog(`LEVEL UP! Now level ${this.gameManager.player.level}!`);
  }

  private updateHealthBars(): void {
    const playerHealthPercent = this.gameManager.player.health / this.gameManager.player.maxHealth;
    const enemyHealthPercent = this.enemy.health / this.enemy.maxHealth;
    
    this.playerHealthBar.scaleX = playerHealthPercent;
    this.enemyHealthBar.scaleX = enemyHealthPercent;
    
    // Change color based on health
    if (playerHealthPercent < 0.3) {
      this.playerHealthBar.setFillStyle(0xe74c3c);
    } else if (playerHealthPercent < 0.6) {
      this.playerHealthBar.setFillStyle(0xf39c12);
    } else {
      this.playerHealthBar.setFillStyle(0x27ae60);
    }
    
    if (enemyHealthPercent < 0.3) {
      this.enemyHealthBar.setFillStyle(0xe74c3c);
    } else if (enemyHealthPercent < 0.6) {
      this.enemyHealthBar.setFillStyle(0xf39c12);
    } else {
      this.enemyHealthBar.setFillStyle(0x27ae60);
    }
  }

  private addCombatLog(message: string): void {
    // Remove old messages if too many
    if (this.combatLog.length >= 8) {
      this.combatLog[0].destroy();
      this.combatLog.shift();
    }
    
    // Move existing messages up
    this.combatLog.forEach((text, index) => {
      text.y = 420 + (index * 20);
    });
    
    // Add new message
    const newMessage = this.add.text(220, 420 + (this.combatLog.length * 20), message, {
      fontSize: '14px',
      color: '#ecf0f1',
      fontFamily: 'Courier New, monospace'
    });
    
    this.combatLog.push(newMessage);
  }

  private disableButtons(): void {
    this.actionButtons.forEach(button => {
      button.setFillStyle(0x7f8c8d);
      button.disableInteractive();
    });
  }

  private enableButtons(): void {
    this.actionButtons[0].setFillStyle(0xe74c3c).setInteractive();
    this.actionButtons[1].setFillStyle(0x3498db).setInteractive();
    this.actionButtons[2].setFillStyle(0x95a5a6).setInteractive();
  }
}
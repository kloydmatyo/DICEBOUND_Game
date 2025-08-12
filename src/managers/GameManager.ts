import { Player, GameState, BoardTile, TileType, Enemy, PlayerStats } from '../types/GameTypes';

export class GameManager {
  private readonly BOARD_SIZE = 20;

  initializeGame(): GameState {
    const player = this.createPlayer();
    const board = this.generateBoard();
    
    return {
      player,
      currentFloor: 1,
      board,
      isPlayerTurn: true,
      diceValue: 0
    };
  }

  private createPlayer(): Player {
    return {
      id: 'player1',
      name: 'Knight',
      level: 1,
      health: 100,
      maxHealth: 100,
      attack: 15,
      defense: 5,
      coins: 50,
      position: 0,
      equipment: {},
      inventory: [],
      stats: {
        gamesPlayed: 0,
        enemiesDefeated: 0,
        coinsEarned: 0,
        floorsCompleted: 0
      }
    };
  }

  generateBoard(): BoardTile[] {
    const board: BoardTile[] = [];
    const centerX = 512;
    const centerY = 300;
    const radius = 200;

    for (let i = 0; i < this.BOARD_SIZE; i++) {
      const angle = (i / this.BOARD_SIZE) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      let tileType: TileType;
      if (i === 0) {
        tileType = TileType.START;
      } else if (i === this.BOARD_SIZE - 1) {
        tileType = TileType.BOSS;
      } else {
        // Random tile distribution
        const rand = Math.random();
        if (rand < 0.4) {
          tileType = TileType.ENEMY;
        } else if (rand < 0.6) {
          tileType = TileType.TREASURE;
        } else if (rand < 0.75) {
          tileType = TileType.EVENT;
        } else if (rand < 0.85) {
          tileType = TileType.SHOP;
        } else {
          tileType = TileType.EMPTY;
        }
      }

      board.push({
        id: i,
        type: tileType,
        x: Math.round(x),
        y: Math.round(y)
      });
    }

    return board;
  }

  generateEnemy(floor: number): Enemy {
    const enemies = [
      { name: 'Goblin', baseHealth: 30, baseAttack: 8, baseDefense: 2, coins: 15 },
      { name: 'Orc', baseHealth: 50, baseAttack: 12, baseDefense: 4, coins: 25 },
      { name: 'Skeleton', baseHealth: 40, baseAttack: 10, baseDefense: 3, coins: 20 },
      { name: 'Troll', baseHealth: 80, baseAttack: 15, baseDefense: 6, coins: 40 }
    ];

    const template = enemies[Math.floor(Math.random() * enemies.length)];
    const floorMultiplier = 1 + (floor - 1) * 0.3;

    return {
      id: `enemy_${Date.now()}`,
      name: template.name,
      health: Math.round(template.baseHealth * floorMultiplier),
      maxHealth: Math.round(template.baseHealth * floorMultiplier),
      attack: Math.round(template.baseAttack * floorMultiplier),
      defense: Math.round(template.baseDefense * floorMultiplier),
      coins: Math.round(template.coins * floorMultiplier)
    };
  }

  saveGame(gameState: GameState): void {
    try {
      localStorage.setItem('knights_gambit_save', JSON.stringify(gameState));
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }

  loadGame(): GameState | null {
    try {
      const saveData = localStorage.getItem('knights_gambit_save');
      return saveData ? JSON.parse(saveData) : null;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }
}
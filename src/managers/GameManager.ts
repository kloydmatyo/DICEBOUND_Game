import { Player, BoardTile, TileType, Enemy } from '../types/GameTypes';

export class GameManager {
  private static instance: GameManager;
  public player!: Player;
  public board!: BoardTile[];
  public currentFloor: number = 1;
  public boardSize: number = 20;

  private constructor() {
    this.initializePlayer();
    this.generateBoard();
  }

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  private initializePlayer(): void {
    this.player = {
      name: 'Hero',
      level: 1,
      health: 100,
      maxHealth: 100,
      attack: 10,
      defense: 5,
      coins: 50,
      position: 0,
      experience: 0,
      equipment: {},
      inventory: []
    };
  }

  public generateBoard(): void {
    this.board = [];
    
    // Create circular board
    for (let i = 0; i < this.boardSize; i++) {
      const angle = (i / this.boardSize) * Math.PI * 2;
      const radius = 250;
      const centerX = 512;
      const centerY = 384;
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      let tileType: TileType;
      
      if (i === 0) {
        tileType = TileType.START;
      } else if (i === this.boardSize - 1) {
        tileType = TileType.BOSS;
      } else {
        const rand = Math.random();
        if (rand < 0.4) tileType = TileType.ENEMY;
        else if (rand < 0.6) tileType = TileType.TREASURE;
        else if (rand < 0.75) tileType = TileType.SHOP;
        else tileType = TileType.EVENT;
      }
      
      this.board.push({
        id: i,
        type: tileType,
        x,
        y
      });
    }
  }

  public rollDice(): number {
    return Math.floor(Math.random() * 6) + 1;
  }

  public movePlayer(steps: number): void {
    this.player.position = (this.player.position + steps) % this.boardSize;
  }

  public getCurrentTile(): BoardTile {
    return this.board[this.player.position];
  }

  public generateEnemy(): Enemy {
    const enemies = [
      { name: 'Goblin', baseHealth: 30, baseAttack: 8 },
      { name: 'Orc', baseHealth: 50, baseAttack: 12 },
      { name: 'Skeleton', baseHealth: 40, baseAttack: 10 },
      { name: 'Wolf', baseHealth: 35, baseAttack: 15 }
    ];
    
    const template = enemies[Math.floor(Math.random() * enemies.length)];
    const floorMultiplier = 1 + (this.currentFloor - 1) * 0.3;
    
    return {
      name: template.name,
      health: Math.floor(template.baseHealth * floorMultiplier),
      maxHealth: Math.floor(template.baseHealth * floorMultiplier),
      attack: Math.floor(template.baseAttack * floorMultiplier),
      defense: Math.floor(2 * floorMultiplier),
      experience: Math.floor(15 * floorMultiplier),
      loot: []
    };
  }

  public saveGame(): void {
    const saveData = {
      player: this.player,
      currentFloor: this.currentFloor
    };
    localStorage.setItem('heroll-save', JSON.stringify(saveData));
  }

  public loadGame(): boolean {
    const saveData = localStorage.getItem('heroll-save');
    if (saveData) {
      const data = JSON.parse(saveData);
      this.player = data.player;
      this.currentFloor = data.currentFloor;
      this.generateBoard();
      return true;
    }
    return false;
  }
}
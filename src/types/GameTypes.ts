export interface Player {
  name: string;
  level: number;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  coins: number;
  position: number;
  experience: number;
  equipment: Equipment;
  inventory: Item[];
}

export interface Equipment {
  weapon?: Weapon;
  armor?: Armor;
  accessory?: Accessory;
}

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory' | 'consumable';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  value: number;
}

export interface Weapon extends Item {
  attack: number;
  critChance: number;
}

export interface Armor extends Item {
  defense: number;
  healthBonus: number;
}

export interface Accessory extends Item {
  effect: string;
  value: number;
}

export interface Enemy {
  name: string;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  experience: number;
  loot: Item[];
}

export interface BoardTile {
  id: number;
  type: TileType;
  x: number;
  y: number;
  data?: any;
}

export enum TileType {
  START = 'start',
  ENEMY = 'enemy',
  TREASURE = 'treasure',
  SHOP = 'shop',
  EVENT = 'event',
  BOSS = 'boss'
}
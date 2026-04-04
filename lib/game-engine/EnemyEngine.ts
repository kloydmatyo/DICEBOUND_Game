import { Enemy, EnemyType } from './types';
import { ENEMY_STATS, ENEMY_TYPES, BOSS_STATS } from './constants';
import { randomInt } from '@/lib/utils';

export class EnemyEngine {
  /**
   * Generate a random enemy scaled to floor
   */
  static generateEnemy(floor: number): Enemy {
    const enemyTypes = Object.keys(ENEMY_STATS) as EnemyType[];
    const randomType = enemyTypes[randomInt(0, enemyTypes.length - 1)];
    
    return this.createEnemy(randomType, floor);
  }

  /**
   * Create an enemy of specific type
   */
  static createEnemy(type: EnemyType, floor: number): Enemy {
    const baseStats = ENEMY_STATS[type];
    const floorMultiplier = 1 + (floor - 1) * 0.2; // 20% increase per floor

    return {
      id: `enemy-${Date.now()}-${Math.random()}`,
      type,
      name: baseStats.name,
      health: Math.floor(baseStats.baseHealth * floorMultiplier),
      maxHealth: Math.floor(baseStats.baseHealth * floorMultiplier),
      attack: Math.floor(baseStats.baseAttack * floorMultiplier),
      defense: Math.floor(baseStats.baseDefense * floorMultiplier),
      coinReward: Math.floor(baseStats.coinReward * floorMultiplier),
      statusEffects: [],
    };
  }

  /**
   * Create a boss enemy for the given floor.
   * Uses named boss stats for floors 5 and 10, falls back to a scaled troll otherwise.
   */
  static createBoss(floor: number): Enemy {
    const defined = BOSS_STATS[floor];
    if (defined) {
      return {
        id: `boss-${floor}-${Date.now()}`,
        type: ENEMY_TYPES.TROLL,
        name: defined.name,
        health: defined.health,
        maxHealth: defined.health,
        attack: defined.attack,
        defense: defined.defense,
        coinReward: defined.coinReward,
        statusEffects: [],
      };
    }
    // Generic fallback for any other floor
    const floorMultiplier = 1 + (floor - 1) * 0.3;
    return {
      id: `boss-${floor}-${Date.now()}`,
      type: ENEMY_TYPES.TROLL,
      name: `Floor ${floor} Boss`,
      health: Math.floor(250 * floorMultiplier),
      maxHealth: Math.floor(250 * floorMultiplier),
      attack: Math.floor(35 * floorMultiplier),
      defense: Math.floor(15 * floorMultiplier),
      coinReward: Math.floor(120 * floorMultiplier),
      statusEffects: [],
    };
  }

  /**
   * Apply damage to enemy
   */
  static damageEnemy(enemy: Enemy, damage: number): Enemy {
    const actualDamage = Math.max(0, damage - enemy.defense);
    const newHealth = Math.max(0, enemy.health - actualDamage);

    return {
      ...enemy,
      health: newHealth,
    };
  }

  /**
   * Check if enemy is alive
   */
  static isAlive(enemy: Enemy): boolean {
    return enemy.health > 0;
  }

  /**
   * Get enemy difficulty rating
   */
  static getDifficulty(enemy: Enemy): 'easy' | 'medium' | 'hard' | 'boss' {
    const totalStats = enemy.health + enemy.attack + enemy.defense;

    if (enemy.name.includes('Boss')) return 'boss';
    if (totalStats < 50) return 'easy';
    if (totalStats < 100) return 'medium';
    return 'hard';
  }
}

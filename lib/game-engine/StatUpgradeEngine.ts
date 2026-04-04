import { Item, StatUpgradeCounts } from './types';
import { ITEM_TYPES } from './constants';

// Base prices for the first purchase of each stat upgrade
const BASE_PRICES: Record<keyof StatUpgradeCounts, number> = {
  attack:  50,
  defense: 50,
  health:  40,
};

// Stat gain per purchase (fixed)
const STAT_GAINS: Record<keyof StatUpgradeCounts, number> = {
  attack:  5,
  defense: 3,
  health:  20,
};

// Exponential scaling: price = base * (1.4 ^ purchases)
const SCALE_FACTOR = 1.4;

/**
 * Calculate the current price for a stat upgrade given how many times
 * it has already been purchased.
 */
export function calcUpgradePrice(stat: keyof StatUpgradeCounts, count: number): number {
  return Math.round(BASE_PRICES[stat] * Math.pow(SCALE_FACTOR, count));
}

/**
 * Build the three stat-upgrade shop items with dynamically scaled prices.
 */
export function getStatUpgradeItems(counts: StatUpgradeCounts): Item[] {
  return [
    {
      id: ITEM_TYPES.STAT_UPGRADE,
      type: ITEM_TYPES.STAT_UPGRADE,
      name: 'Attack Upgrade',
      description: `Permanently +${STAT_GAINS.attack} ATK — applied instantly`,
      price: calcUpgradePrice('attack', counts.attack),
      effect: { type: 'permanent', stat: 'attack', value: STAT_GAINS.attack },
      quantity: 1,
      autoConsume: true,
    },
    {
      id: ITEM_TYPES.STAT_UPGRADE,
      type: ITEM_TYPES.STAT_UPGRADE,
      name: 'Defense Upgrade',
      description: `Permanently +${STAT_GAINS.defense} DEF — applied instantly`,
      price: calcUpgradePrice('defense', counts.defense),
      effect: { type: 'permanent', stat: 'defense', value: STAT_GAINS.defense },
      quantity: 1,
      autoConsume: true,
    },
    {
      id: ITEM_TYPES.HEARTSTONE_AMULET,
      type: ITEM_TYPES.HEARTSTONE_AMULET,
      name: 'Health Upgrade',
      description: `Permanently +${STAT_GAINS.health} Max HP — applied instantly`,
      price: calcUpgradePrice('health', counts.health),
      effect: { type: 'permanent', stat: 'health', value: STAT_GAINS.health },
      quantity: 1,
      autoConsume: true,
    },
  ];
}

/**
 * Increment the count for the stat that was just upgraded.
 * Returns a new counts object (immutable).
 */
export function incrementStatCount(
  counts: StatUpgradeCounts,
  stat: 'health' | 'attack' | 'defense'
): StatUpgradeCounts {
  return { ...counts, [stat]: counts[stat] + 1 };
}

/**
 * Initial zeroed counts.
 */
export function createInitialStatCounts(): StatUpgradeCounts {
  return { attack: 0, defense: 0, health: 0 };
}

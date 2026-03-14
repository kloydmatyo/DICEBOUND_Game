import { Player, Item, ItemType } from './types';
import { ITEM_TYPES, SHOP_PRICES } from './constants';
import { CharacterEngine } from './CharacterEngine';

export class InventoryEngine {
  /**
   * Get all available shop items
   */
  static getShopItems(): Item[] {
    return [
      {
        id: ITEM_TYPES.HEALING_POTION,
        type: ITEM_TYPES.HEALING_POTION,
        name: 'Healing Potion',
        description: 'Restores 30 HP',
        price: SHOP_PRICES.HEALING_POTION,
        effect: { type: 'heal', value: 30 },
      },
      {
        id: ITEM_TYPES.ANTIDOTE,
        type: ITEM_TYPES.ANTIDOTE,
        name: 'Antidote',
        description: 'Cures poison and burn',
        price: SHOP_PRICES.ANTIDOTE,
        effect: { type: 'cure' },
      },
      {
        id: ITEM_TYPES.HOLY_WATER,
        type: ITEM_TYPES.HOLY_WATER,
        name: 'Holy Water',
        description: 'Removes the Curse debuff',
        price: SHOP_PRICES.HOLY_WATER,
        effect: { type: 'cure_curse' },
      },
      {
        id: ITEM_TYPES.BLESSING,
        type: ITEM_TYPES.BLESSING,
        name: 'Blessing',
        description: 'Removes Curse and restores stats',
        price: SHOP_PRICES.BLESSING,
        effect: { type: 'cure_curse' },
      },
      {
        id: ITEM_TYPES.STAT_UPGRADE,
        type: ITEM_TYPES.STAT_UPGRADE,
        name: 'Stat Upgrade',
        description: 'Permanently increases a random stat',
        price: SHOP_PRICES.STAT_UPGRADE,
        effect: { type: 'permanent', stat: 'attack', value: 5 },
      },
      {
        id: ITEM_TYPES.BLESSING_SCROLL,
        type: ITEM_TYPES.BLESSING_SCROLL,
        name: 'Blessing Scroll',
        description: 'Grants blessed status for 5 turns',
        price: SHOP_PRICES.BLESSING_SCROLL,
        effect: { type: 'buff', duration: 5 },
      },
      {
        id: ITEM_TYPES.HEARTSTONE_AMULET,
        type: ITEM_TYPES.HEARTSTONE_AMULET,
        name: 'Heartstone Amulet',
        description: 'Increases max HP by 20',
        price: SHOP_PRICES.HEARTSTONE_AMULET,
        effect: { type: 'permanent', stat: 'health', value: 20 },
      },
    ];
  }

  /**
   * Get special shop items (rare, powerful, expensive)
   */
  static getSpecialShopItems(): Item[] {
    return [
      {
        id: ITEM_TYPES.HEALING_POTION,
        type: ITEM_TYPES.HEALING_POTION,
        name: 'Mega Healing Potion',
        description: 'Fully restores all HP',
        price: 80,
        effect: { type: 'heal', value: 9999 },
      },
      {
        id: ITEM_TYPES.STAT_UPGRADE,
        type: ITEM_TYPES.STAT_UPGRADE,
        name: 'Warrior\'s Tome',
        description: 'Permanently grants +10 ATK',
        price: 120,
        effect: { type: 'permanent', stat: 'attack', value: 10 },
      },
      {
        id: ITEM_TYPES.STAT_UPGRADE,
        type: ITEM_TYPES.STAT_UPGRADE,
        name: 'Iron Skin Scroll',
        description: 'Permanently grants +8 DEF',
        price: 100,
        effect: { type: 'permanent', stat: 'defense', value: 8 },
      },
      {
        id: ITEM_TYPES.HEARTSTONE_AMULET,
        type: ITEM_TYPES.HEARTSTONE_AMULET,
        name: 'Titan\'s Heart',
        description: 'Increases max HP by 50',
        price: 150,
        effect: { type: 'permanent', stat: 'health', value: 50 },
      },
      {
        id: ITEM_TYPES.HOLY_WATER,
        type: ITEM_TYPES.HOLY_WATER,
        name: 'Sacred Holy Water',
        description: 'Removes all debuffs (curse, poison, burn)',
        price: 90,
        effect: { type: 'cure_curse' },
      },
      {
        id: ITEM_TYPES.BLESSING_SCROLL,
        type: ITEM_TYPES.BLESSING_SCROLL,
        name: 'Divine Blessing',
        description: 'Grants blessed status for 10 turns',
        price: 110,
        effect: { type: 'buff', duration: 10 },
      },
    ];
  }
  static addItem(player: Player, item: Item): Player {
    return {
      ...player,
      inventory: [...player.inventory, item],
    };
  }

  /**
   * Remove item from inventory
   */
  static removeItem(player: Player, itemId: string): Player {
    return {
      ...player,
      inventory: player.inventory.filter((item) => item.id !== itemId),
    };
  }

  /**
   * Use an item
   */
  static useItem(player: Player, itemId: string): { player: Player; message: string } {
    const item = player.inventory.find((i) => i.id === itemId);
    
    if (!item) {
      return { player, message: 'Item not found!' };
    }

    let updatedPlayer = player;
    let message = '';

    switch (item.effect.type) {
      case 'heal':
        updatedPlayer = CharacterEngine.healPlayer(player, item.effect.value || 0);
        message = `Used ${item.name}! Restored ${item.effect.value} HP.`;
        break;

      case 'cure':
        updatedPlayer = {
          ...player,
          statusEffects: player.statusEffects.filter(
            (effect) => effect.type !== 'poison' && effect.type !== 'burn'
          ),
        };
        message = `Used ${item.name}! Cured all negative effects.`;
        break;

      case 'cure_curse':
        updatedPlayer = {
          ...player,
          statusEffects: player.statusEffects.filter(
            (effect) => effect.type !== 'cursed'
          ),
        };
        message = `Used ${item.name}! The curse has been lifted!`;
        break;

      case 'buff':
        updatedPlayer = {
          ...player,
          statusEffects: [
            ...player.statusEffects,
            { type: 'blessed', duration: item.effect.duration || 5 },
          ],
        };
        message = `Used ${item.name}! You feel blessed!`;
        break;

      case 'permanent':
        if (item.effect.stat) {
          updatedPlayer = CharacterEngine.upgradeStat(
            player,
            item.effect.stat,
            item.effect.value || 0
          );
          message = `Used ${item.name}! ${item.effect.stat} permanently increased!`;
        }
        break;
    }

    // Remove item after use
    updatedPlayer = this.removeItem(updatedPlayer, itemId);

    return { player: updatedPlayer, message };
  }

  /**
   * Purchase item from shop
   */
  static purchaseItem(
    player: Player,
    item: Item
  ): { player: Player; success: boolean; message: string } {
    if (player.coins < item.price) {
      return {
        player,
        success: false,
        message: 'Not enough coins!',
      };
    }

    const updatedPlayer = CharacterEngine.removeCoins(player, item.price);
    const finalPlayer = this.addItem(updatedPlayer, {
      ...item,
      id: `${item.id}-${Date.now()}`, // Unique ID for each purchase
    });

    return {
      player: finalPlayer,
      success: true,
      message: `Purchased ${item.name} for ${item.price} coins!`,
    };
  }

  /**
   * Get item count
   */
  static getItemCount(player: Player, itemType: ItemType): number {
    return player.inventory.filter((item) => item.type === itemType).length;
  }

  /**
   * Check if player has item
   */
  static hasItem(player: Player, itemType: ItemType): boolean {
    return this.getItemCount(player, itemType) > 0;
  }
}

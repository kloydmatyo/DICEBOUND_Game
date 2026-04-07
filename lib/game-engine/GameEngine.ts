import { GameState, Player, CharacterClass, CombatResult, WeaponUpgradeState, BranchChoice, DiceManipulation, DestinyResult } from './types';
import { CharacterEngine } from './CharacterEngine';
import { BoardEngine } from './BoardEngine';
import { CombatEngine } from './CombatEngine';
import { EnemyEngine } from './EnemyEngine';
import { GAME_CONFIG, roll2d6 } from './constants';
import { createInitialStatCounts } from './StatUpgradeEngine';
import { randomInt } from '@/lib/utils';

const DEFAULT_DICE_MANIPULATION: DiceManipulation = {
  rerolls: 1,
  modifiers: 2,
  doubleRolls: 1,
};

export class GameEngine {
  static initializeGame(characterClass: CharacterClass): GameState {
    const player = CharacterEngine.createPlayer(characterClass);
    const board = BoardEngine.generateBoard(GAME_CONFIG.STARTING_FLOOR);
    return {
      player,
      currentFloor: GAME_CONFIG.STARTING_FLOOR,
      board,
      turnCount: 0,
      isInCombat: false,
      currentEnemy: null,
      statUpgradeCounts: createInitialStatCounts(),
      pendingBranchChoice: null,
      diceManipulation: { ...DEFAULT_DICE_MANIPULATION },
    };
  }

  /**
   * NEW FLOW — Step 1: Show branch options to player (no dice yet).
   * Returns the adjacent tile options the player can choose from.
   */
  static getBranchOptions(state: GameState): { state: GameState; branchChoice: BranchChoice } {
    const tileOptions = BoardEngine.getAdjacentTiles(state.board, state.player.position);
    const branchChoice: BranchChoice = { tileOptions };
    return {
      state: { ...state, pendingBranchChoice: branchChoice },
      branchChoice,
    };
  }

  /**
   * NEW FLOW — Step 2: Player chose a tile, now roll 2d6 for the outcome modifier.
   * Returns the destiny result and updated state with chosen tile + destiny.
   */
  static rollOutcome(state: GameState, chosenTileId: number): { state: GameState; destinyResult: DestinyResult } {
    const destinyResult = roll2d6();
    const branchChoice: BranchChoice = {
      tileOptions: state.pendingBranchChoice?.tileOptions ?? [],
      chosenTileId,
      destinyResult,
      diceValue: destinyResult.total, // legacy compat
    };
    return {
      state: {
        ...state,
        pendingBranchChoice: branchChoice,
        turnCount: state.turnCount + 1,
      },
      destinyResult,
    };
  }

  /**
   * LEGACY — Roll dice (kept for backward compat / debug).
   * @deprecated Use getBranchOptions() + rollOutcome() instead.
   */
  static rollDice(state: GameState): { state: GameState; diceValue: number; branchChoice: BranchChoice } {
    const diceValue = randomInt(1, GAME_CONFIG.DICE_SIDES);
    const tileOptions = BoardEngine.getReachableTiles(state.board, state.player.position, diceValue);
    const branchChoice: BranchChoice = { tileOptions, diceValue };
    return {
      state: { ...state, pendingBranchChoice: branchChoice, turnCount: state.turnCount + 1 },
      diceValue,
      branchChoice,
    };
  }

  /**
   * "Choose 1 of 2 rolls" — roll twice, player picks which roll to use.
   * Costs 1 doubleRolls token.
   */
  static rollDouble(state: GameState): { state: GameState; branchChoice: BranchChoice } | null {
    if (state.diceManipulation.doubleRolls <= 0) return null;

    const d1 = randomInt(1, GAME_CONFIG.DICE_SIDES);
    const d2 = randomInt(1, GAME_CONFIG.DICE_SIDES);
    const opts1 = BoardEngine.getReachableTiles(state.board, state.player.position, d1);
    const opts2 = BoardEngine.getReachableTiles(state.board, state.player.position, d2);

    const branchChoice: BranchChoice = {
      tileOptions: opts1,
      diceValue: d1,
      altDiceValue: d2,
      altTileOptions: opts2,
    };

    return {
      state: {
        ...state,
        pendingBranchChoice: branchChoice,
        turnCount: state.turnCount + 1,
        diceManipulation: {
          ...state.diceManipulation,
          doubleRolls: state.diceManipulation.doubleRolls - 1,
        },
      },
      branchChoice,
    };
  }

  /**
   * Reroll the current pending dice. Costs 1 reroll token.
   */
  static reroll(state: GameState): { state: GameState; diceValue: number; branchChoice: BranchChoice } | null {
    if (state.diceManipulation.rerolls <= 0 || !state.pendingBranchChoice) return null;

    const diceValue = randomInt(1, GAME_CONFIG.DICE_SIDES);
    const tileOptions = BoardEngine.getReachableTiles(state.board, state.player.position, diceValue);
    const branchChoice: BranchChoice = { tileOptions, diceValue };

    return {
      state: {
        ...state,
        pendingBranchChoice: branchChoice,
        diceManipulation: {
          ...state.diceManipulation,
          rerolls: state.diceManipulation.rerolls - 1,
        },
      },
      diceValue,
      branchChoice,
    };
  }

  /**
   * Apply a +1 or -1 modifier to the current pending dice roll.
   * Costs 1 modifier token.
   */
  static applyModifier(state: GameState, delta: 1 | -1): { state: GameState; diceValue: number; branchChoice: BranchChoice } | null {
    if (state.diceManipulation.modifiers <= 0 || !state.pendingBranchChoice) return null;

    const raw = (state.pendingBranchChoice.diceValue ?? 0) + delta;
    const diceValue = Math.max(1, Math.min(GAME_CONFIG.DICE_SIDES, raw));
    const tileOptions = BoardEngine.getReachableTiles(state.board, state.player.position, diceValue);
    const branchChoice: BranchChoice = { tileOptions, diceValue };

    return {
      state: {
        ...state,
        pendingBranchChoice: branchChoice,
        diceManipulation: {
          ...state.diceManipulation,
          modifiers: state.diceManipulation.modifiers - 1,
        },
      },
      diceValue,
      branchChoice,
    };
  }

  /**
   * Player chooses a tile from the pending branch choice and moves there.
   * Optionally applies a destiny modifier to the tile's enemy (if combat).
   */
  static chooseTile(state: GameState, tileId: number): GameState {
    const destiny = state.pendingBranchChoice?.destinyResult;
    let updatedBoard = BoardEngine.visitTile(state.board, tileId);

    // Apply destiny modifier to enemy HP if applicable
    if (destiny && (destiny.state === 'cursed' || destiny.state === 'unlucky' || destiny.state === 'favored' || destiny.state === 'exalted')) {
      updatedBoard = updatedBoard.map(tile => {
        if (tile.id !== tileId || !tile.enemy) return tile;
        let newEnemy = { ...tile.enemy };
        if (destiny.state === 'cursed') {
          // Enemy 2× HP
          newEnemy = { ...newEnemy, health: newEnemy.health * 2, maxHealth: newEnemy.maxHealth * 2 };
        } else if (destiny.state === 'exalted') {
          // Instant win — set enemy HP to 0
          newEnemy = { ...newEnemy, health: 0 };
        }
        return { ...tile, enemy: newEnemy };
      });
    }

    return {
      ...state,
      player: { ...state.player, position: tileId },
      board: updatedBoard,
      pendingBranchChoice: null,
    };
  }

  /**
   * Check if the player has reached the final tile (boss/end) of the board.
   */
  static isFloorComplete(state: GameState): boolean {
    const hasBossFloor = state.board.some((t) => t.type === 'boss');
    if (hasBossFloor) {
      return state.board.some((t) => t.type === 'boss' && t.visited) && !state.isInCombat;
    }
    // Non-boss floor: complete when the final depth tile is visited
    const maxDepth = Math.max(...state.board.map(t => t.depth ?? 0));
    return state.board.some(t => (t.depth ?? 0) === maxDepth && t.visited) && !state.isInCombat;
  }

  static startCombat(state: GameState): GameState {
    const tile = BoardEngine.getTile(state.board, state.player.position);
    if (!tile) return state;
    if (tile.type === 'boss') {
      const boss = EnemyEngine.createBoss(state.currentFloor);
      return { ...state, isInCombat: true, currentEnemy: boss };
    }
    if (!tile.enemy) return state;
    return { ...state, isInCombat: true, currentEnemy: tile.enemy };
  }

  static executeCombatTurn(
    state: GameState,
    useSkillId?: string,
    upgradeState?: WeaponUpgradeState
  ): { state: GameState; result: CombatResult } {
    if (!state.currentEnemy) throw new Error('No enemy in combat!');

    const skill = useSkillId ? state.player.skills.find((s) => s.id === useSkillId) : undefined;
    const result = CombatEngine.executeTurn(state.player, state.currentEnemy, skill, upgradeState);

    let updatedPlayer = {
      ...state.player,
      health: result.playerHealth,
      coins: state.player.coins + result.coinsEarned,
    };

    if (result.updatedPlayerMana !== undefined) {
      updatedPlayer = { ...updatedPlayer, mana: result.updatedPlayerMana };
    }

    if (skill && skill.effect.type === 'heal') {
      const healAmt = skill.effect.value || 0;
      updatedPlayer = { ...updatedPlayer, health: Math.min(updatedPlayer.maxHealth, updatedPlayer.health + healAmt) };
      if (skill.id === 'divine_healing') updatedPlayer = { ...updatedPlayer, statusEffects: [] };
    }

    updatedPlayer = CharacterEngine.updateCooldowns(updatedPlayer);

    if (skill && skill.type === 'active') {
      updatedPlayer = {
        ...updatedPlayer,
        skills: updatedPlayer.skills.map((s) => s.id === skill.id ? { ...s, currentCooldown: s.cooldown } : s),
      };
    }

    const updatedEnemy = result.isEnemyDefeated
      ? null
      : {
          ...state.currentEnemy,
          health: result.enemyHealth,
          statusEffects: result.updatedEnemyStatusEffects ?? state.currentEnemy.statusEffects,
        };

    return {
      state: { ...state, player: updatedPlayer, currentEnemy: updatedEnemy, isInCombat: !result.isEnemyDefeated },
      result,
    };
  }

  static endCombat(state: GameState): GameState {
    return { ...state, isInCombat: false, currentEnemy: null };
  }

  static advanceFloor(state: GameState): GameState {
    const nextFloor = state.currentFloor + 1;
    const newBoard = BoardEngine.generateBoard(nextFloor);
    return {
      ...state,
      currentFloor: nextFloor,
      board: newBoard,
      player: { ...state.player, position: 0 },
      turnCount: 0,
      pendingBranchChoice: null,
      diceManipulation: { ...DEFAULT_DICE_MANIPULATION },
    };
  }

  static isGameOver(state: GameState): boolean {
    return !CharacterEngine.isAlive(state.player);
  }

  static getStatistics(state: GameState) {
    return {
      floor: state.currentFloor,
      turns: state.turnCount,
      health: `${state.player.health}/${state.player.maxHealth}`,
      coins: state.player.coins,
    };
  }
}

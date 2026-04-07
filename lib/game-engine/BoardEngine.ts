import { BoardTile, Enemy, TrapType } from './types';
import { TILE_TYPES, TRAP_TYPES, GAME_CONFIG, getFloorInDungeon } from './constants';
import { EnemyEngine } from './EnemyEngine';

// ─── Layout constants ────────────────────────────────────────────────────────
const CENTER_X = 450;
const CENTER_Y = 300;
const RADIUS = 220;

// Depth layout: tiles per row. Total = 15 tiles across 7 depths.
// Rule: widths only go 1→2→3→2→3→2→1 so adjacent rows never differ by more than 1.
// This guarantees connections are always to immediate neighbors — no crossing lines.
const DEPTH_WIDTHS = [1, 2, 3, 2, 3, 2, 1];

export class BoardEngine {
  static readonly BOSS_FLOOR_INDICES = [5, 10];

  static isBossFloor(floor: number): boolean {
    return this.BOSS_FLOOR_INDICES.includes(getFloorInDungeon(floor));
  }

  // ── Tile type generator ──────────────────────────────────────────────────
  // Ensures no two tiles in the same row share the same type (no clusters).
  private static pickRowTypes(count: number, depth: number): BoardTile['type'][] {
    // Weighted pool — shop only once per row, elite is rare
    const pool: BoardTile['type'][] = [
      TILE_TYPES.ENEMY, TILE_TYPES.ENEMY,
      TILE_TYPES.ELITE,
      TILE_TYPES.EVENT,
      TILE_TYPES.TRAP,
      TILE_TYPES.NORMAL,
    ];
    // Force exactly one shop row at depth 3 (mid-point)
    if (depth === 3) {
      const shopRow: BoardTile['type'][] = [TILE_TYPES.SHOP];
      const rest = pool.filter(t => t !== TILE_TYPES.SHOP);
      while (shopRow.length < count) {
        const pick = rest[Math.floor(Math.random() * rest.length)];
        if (!shopRow.includes(pick)) shopRow.push(pick);
      }
      return shopRow.slice(0, count);
    }
    // Otherwise shuffle pool and pick `count` unique types
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const unique: BoardTile['type'][] = [];
    for (const t of shuffled) {
      if (!unique.includes(t)) unique.push(t);
      if (unique.length === count) break;
    }
    // Pad if needed
    while (unique.length < count) unique.push(TILE_TYPES.NORMAL);
    return unique;
  }

  private static makeTile(id: number, type: BoardTile['type'], x: number, y: number, depth: number, floor: number): BoardTile {
    const trapTypes = Object.values(TRAP_TYPES) as TrapType[];
    return {
      id,
      type,
      x,
      y,
      depth,
      visited: id === 0,
      nextIds: [],
      prevIds: [],
      ...(type === TILE_TYPES.ENEMY && { enemy: EnemyEngine.generateEnemy(floor) }),
      ...(type === TILE_TYPES.ELITE && { enemy: EnemyEngine.generateEliteEnemy(floor) }),
      ...(type === TILE_TYPES.TRAP && {
        trapType: trapTypes[Math.floor(Math.random() * trapTypes.length)],
        trapTriggered: false,
      }),
    };
  }

  /**
   * Generate a clean branching board (DAG).
   *
   * Layout rules:
   *  - DEPTH_WIDTHS controls tiles per row: [1,2,3,2,3,2,1]
   *  - Adjacent rows differ by at most 1 in width → no crossing lines
   *  - Each tile connects only to its immediate column neighbors in the next row
   *  - Each row has unique tile types (no clusters)
   *  - Depth 0 = START, final depth = BOSS (or SHOP on non-boss floors)
   */
  static generateBoard(floor: number): BoardTile[] {
    const isBoss = this.isBossFloor(floor);
    const tiles: BoardTile[] = [];
    let nextId = 0;

    const totalDepths = DEPTH_WIDTHS.length;
    const depthSpacing = (RADIUS * 2) / (totalDepths - 1);
    const startY = CENTER_Y - RADIUS;

    const depthTiles: number[][] = [];

    for (let d = 0; d < totalDepths; d++) {
      const count = DEPTH_WIDTHS[d];
      const y = startY + d * depthSpacing;
      const ids: number[] = [];

      // Determine types for this row
      let rowTypes: BoardTile['type'][];
      if (d === 0) {
        rowTypes = [TILE_TYPES.START];
      } else if (d === totalDepths - 1) {
        rowTypes = [isBoss ? TILE_TYPES.BOSS : TILE_TYPES.SHOP];
      } else {
        rowTypes = this.pickRowTypes(count, d);
      }

      for (let col = 0; col < count; col++) {
        // Evenly space tiles horizontally, centered on CENTER_X
        const totalWidth = RADIUS * 1.5;
        const x = count === 1
          ? CENTER_X
          : CENTER_X - totalWidth / 2 + (col / (count - 1)) * totalWidth;

        const type = rowTypes[col];
        const tile = this.makeTile(nextId, type, x, y, d, floor);
        tiles.push(tile);
        ids.push(nextId);
        nextId++;
      }

      depthTiles.push(ids);
    }

    // Wire connections — strictly adjacent columns only, no crossing
    for (let d = 0; d < totalDepths - 1; d++) {
      const fromIds = depthTiles[d];
      const toIds = depthTiles[d + 1];

      for (let fi = 0; fi < fromIds.length; fi++) {
        const fromId = fromIds[fi];
        const connections = this.adjacentConnections(fi, fromIds.length, toIds);
        const fromTile = tiles.find(t => t.id === fromId)!;
        fromTile.nextIds = connections;
        for (const toId of connections) {
          const toTile = tiles.find(t => t.id === toId)!;
          if (!toTile.prevIds!.includes(fromId)) toTile.prevIds!.push(fromId);
        }
      }
    }

    return tiles;
  }

  /**
   * Connect tile at column `fromCol` (out of `fromCount`) to its immediate
   * neighbors in the next row — strictly no skipping columns.
   *
   * Mapping rules (no crossing guaranteed because widths differ by ≤1):
   *   same width  → connect to same col only (1:1)
   *   narrower→wider (fan out) → left tile gets left+center, right tile gets center+right
   *   wider→narrower (fan in)  → left+center tiles → left, center+right tiles → right
   */
  private static adjacentConnections(fromCol: number, fromCount: number, toIds: number[]): number[] {
    const toCount = toIds.length;

    if (toCount === 1) return [toIds[0]];
    if (fromCount === toCount) return [toIds[fromCol]]; // 1:1 same width

    if (toCount > fromCount) {
      // Fan out: 1→2, 2→3
      if (fromCount === 1) return [...toIds]; // single tile fans to all
      // 2→3: left→[0,1], right→[1,2]
      return fromCol === 0 ? [toIds[0], toIds[1]] : [toIds[toCount - 2], toIds[toCount - 1]];
    } else {
      // Fan in: 3→2, 2→1
      if (toCount === 1) return [toIds[0]];
      // 3→2: col0→[0], col1→[0,1], col2→[1]
      if (fromCount === 3) {
        if (fromCol === 0) return [toIds[0]];
        if (fromCol === 1) return [toIds[0], toIds[1]];
        return [toIds[1]];
      }
      // 2→1 fallback
      return [toIds[Math.min(fromCol, toCount - 1)]];
    }
  }

  /**
   * Get the directly adjacent tiles (1 step forward) from the current position.
   * This is what the player sees as branch options BEFORE rolling.
   */
  static getAdjacentTiles(board: BoardTile[], fromId: number): number[] {
    const tile = board.find(t => t.id === fromId);
    if (!tile || !tile.nextIds || tile.nextIds.length === 0) return [];
    return [...tile.nextIds];
  }

  /**
   * Given a player's current tile and a dice roll, return the set of reachable
   * tile ids (following nextIds chains for `diceValue` steps).
   * Returns unique leaf tile ids the player can choose from.
   * @deprecated Use getAdjacentTiles() for the new branch-choice system.
   */
  static getReachableTiles(board: BoardTile[], fromId: number, diceValue: number): number[] {
    // BFS/DFS exactly `diceValue` steps forward
    let frontier = new Set<number>([fromId]);

    for (let step = 0; step < diceValue; step++) {
      const next = new Set<number>();
      for (const id of frontier) {
        const tile = board.find(t => t.id === id);
        if (!tile) continue;
        if (tile.nextIds && tile.nextIds.length > 0) {
          for (const nid of tile.nextIds) next.add(nid);
        } else {
          // Dead end (boss/final tile) — stay
          next.add(id);
        }
      }
      frontier = next;
    }

    return Array.from(frontier);
  }

  // ── Standard helpers ─────────────────────────────────────────────────────

  static getTile(board: BoardTile[], position: number): BoardTile | undefined {
    return board.find((tile) => tile.id === position);
  }

  static visitTile(board: BoardTile[], position: number): BoardTile[] {
    return board.map((tile) =>
      tile.id === position ? { ...tile, visited: true } : tile
    );
  }

  static triggerTrap(board: BoardTile[], position: number): BoardTile[] {
    return board.map((tile) =>
      tile.id === position ? { ...tile, trapTriggered: true } : tile
    );
  }

  /**
   * Reshuffle non-fixed tiles (called on floor completion / lap).
   * Preserves START and BOSS tiles; re-rolls everything else.
   */
  static reshuffleBoard(board: BoardTile[], floor: number): BoardTile[] {
    const isBoss = this.isBossFloor(floor);
    const trapTypes = Object.values(TRAP_TYPES) as TrapType[];

    // Group tiles by depth so we can re-pick unique types per row
    const maxDepth = Math.max(...board.map(t => t.depth ?? 0));
    const newTypesByDepth: Map<number, BoardTile['type'][]> = new Map();
    for (let d = 1; d < maxDepth; d++) {
      const count = board.filter(t => (t.depth ?? 0) === d).length;
      newTypesByDepth.set(d, this.pickRowTypes(count, d));
    }

    return board.map((tile) => {
      if (tile.type === TILE_TYPES.START) return { ...tile, visited: true };
      if (tile.type === TILE_TYPES.BOSS) return { ...tile, visited: false };

      const depth = tile.depth ?? 1;
      const rowTiles = board.filter(t => (t.depth ?? 0) === depth);
      const colIdx = rowTiles.findIndex(t => t.id === tile.id);
      const rowTypes = newTypesByDepth.get(depth) ?? [TILE_TYPES.NORMAL];
      const type = isBoss ? TILE_TYPES.BOSS : (rowTypes[colIdx] ?? TILE_TYPES.NORMAL);

      return {
        ...tile,
        type,
        visited: false,
        enemy: type === TILE_TYPES.ENEMY ? EnemyEngine.generateEnemy(floor)
          : type === TILE_TYPES.ELITE ? EnemyEngine.generateEliteEnemy(floor)
          : undefined,
        trapType: type === TILE_TYPES.TRAP ? trapTypes[Math.floor(Math.random() * trapTypes.length)] : undefined,
        trapTriggered: type === TILE_TYPES.TRAP ? false : undefined,
      };
    });
  }

  // Legacy helpers kept for compatibility
  static getNextPosition(currentPosition: number, diceRoll: number, boardSize: number): number {
    return (currentPosition + diceRoll) % boardSize;
  }

  static isValidPosition(position: number, boardSize: number): boolean {
    return position >= 0 && position < boardSize;
  }
}

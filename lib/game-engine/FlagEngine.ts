import { GameState, Enemy } from './types';

export type FlagKey = string;
export type Flags = Record<string, boolean | number | string>;

// ── Setters ────────────────────────────────────────────────────────────────

export function setFlag(state: GameState, key: FlagKey, value: boolean | number | string = true): GameState {
  return { ...state, flags: { ...state.flags, [key]: value } };
}

export function getFlag(state: GameState, key: FlagKey): boolean | number | string | undefined {
  return state.flags[key];
}

/** Called when the player successfully flees from an enemy. */
export function onFlee(state: GameState, enemy: Enemy): GameState {
  return setFlag(state, `fled_${enemy.type}_floor${state.currentFloor}`, true);
}

/** Called when the player successfully bribes an enemy. */
export function onBribe(state: GameState, enemy: Enemy): GameState {
  let s = setFlag(state, `bribed_${enemy.type}_floor${state.currentFloor}`, true);
  // Track total bribes for cumulative payoffs
  const total = (getFlag(state, 'total_bribes') as number) || 0;
  s = setFlag(s, 'total_bribes', total + 1);
  return s;
}

/** Called when the player successfully calls a truce with an enemy. */
export function onTruce(state: GameState, enemy: Enemy): GameState {
  let s = setFlag(state, `truce_${enemy.type}_floor${state.currentFloor}`, true);
  const total = (getFlag(state, 'total_truces') as number) || 0;
  s = setFlag(s, 'total_truces', total + 1);
  return s;
}

// ── Payoff checker ─────────────────────────────────────────────────────────

export interface FlagPayoff {
  /** Notification message shown to the player */
  message: string;
  /** Coin reward (positive) or penalty (negative) */
  coins?: number;
  /** HP change (positive = heal, negative = damage) */
  hp?: number;
  /** Flat attack bonus */
  attack?: number;
  /** Extra reroll token */
  reroll?: boolean;
}

/**
 * Check flags on an event tile and return a payoff if one triggers.
 * Returns null if no flag-driven event applies.
 */
export function checkEventPayoff(state: GameState): FlagPayoff | null {
  const flags = state.flags;
  const floor = state.currentFloor;

  // ── Bribe payoffs ──────────────────────────────────────────────────────
  // A goblin you bribed 2+ floors ago tips you off → bonus coins
  const bribedGoblinFloor = Object.keys(flags).find(
    k => k.startsWith('bribed_goblin_floor') && Number(k.replace('bribed_goblin_floor', '')) <= floor - 2
  );
  if (bribedGoblinFloor && !flags[`bribe_payoff_${bribedGoblinFloor}`]) {
    return {
      message: '💰 A goblin you bribed earlier slips you a tip — you find hidden gold!',
      coins: 30,
    };
  }

  // Multiple bribes → merchant reputation: shop discount token (reroll as proxy)
  const totalBribes = (flags['total_bribes'] as number) || 0;
  if (totalBribes >= 3 && !flags['bribe_rep_payoff']) {
    return {
      message: '🤝 Word of your generosity spreads. A merchant leaves you a gift.',
      coins: 50,
      reroll: true,
    };
  }

  // ── Flee payoffs ───────────────────────────────────────────────────────
  // A troll you fled from 3+ floors ago hunts you down → ambush damage
  const fledTrollFloor = Object.keys(flags).find(
    k => k.startsWith('fled_troll_floor') && Number(k.replace('fled_troll_floor', '')) <= floor - 3
  );
  if (fledTrollFloor && !flags[`flee_payoff_${fledTrollFloor}`]) {
    return {
      message: '🔥 The troll you fled found you. It left a parting gift — a scar.',
      hp: -20,
    };
  }

  // Fled any enemy recently → cautious mindset: small defense insight
  const fledRecently = Object.keys(flags).some(
    k => k.startsWith('fled_') && !k.startsWith('fled_payoff') && Number(k.split('floor')[1]) >= floor - 1
  );
  if (fledRecently && !flags['flee_insight_payoff']) {
    return {
      message: '🏃 Running taught you something. You study enemy patterns. +1 ATK.',
      attack: 1,
    };
  }

  // ── Truce payoffs ──────────────────────────────────────────────────────
  // A skeleton you made peace with left a healing charm
  const truceSkeletonFloor = Object.keys(flags).find(
    k => k.startsWith('truce_skeleton_floor') && Number(k.replace('truce_skeleton_floor', '')) <= floor - 2
  );
  if (truceSkeletonFloor && !flags[`truce_payoff_${truceSkeletonFloor}`]) {
    return {
      message: '💀 The skeleton you spared left a bone charm. It pulses with life.',
      hp: 25,
    };
  }

  // Multiple truces → pacifist reputation: enemies slightly less aggressive (reroll token)
  const totalTruces = (flags['total_truces'] as number) || 0;
  if (totalTruces >= 2 && !flags['truce_rep_payoff']) {
    return {
      message: '🕊️ Your reputation for mercy precedes you. An ally leaves a reroll token.',
      reroll: true,
    };
  }

  return null;
}

/**
 * Mark a payoff as consumed so it doesn't fire again.
 * Call this immediately after applying a payoff.
 */
export function consumePayoff(state: GameState, payoff: FlagPayoff): GameState {
  const flags = state.flags;
  let s = state;

  // Mark whichever flag triggered this payoff as consumed
  if (payoff.message.includes('goblin you bribed')) {
    const key = Object.keys(flags).find(k => k.startsWith('bribed_goblin_floor') && Number(k.replace('bribed_goblin_floor', '')) <= state.currentFloor - 2);
    if (key) s = setFlag(s, `bribe_payoff_${key}`, true);
  } else if (payoff.message.includes('generosity spreads')) {
    s = setFlag(s, 'bribe_rep_payoff', true);
  } else if (payoff.message.includes('troll you fled')) {
    const key = Object.keys(flags).find(k => k.startsWith('fled_troll_floor') && Number(k.replace('fled_troll_floor', '')) <= state.currentFloor - 3);
    if (key) s = setFlag(s, `flee_payoff_${key}`, true);
  } else if (payoff.message.includes('Running taught')) {
    s = setFlag(s, 'flee_insight_payoff', true);
  } else if (payoff.message.includes('skeleton you spared')) {
    const key = Object.keys(flags).find(k => k.startsWith('truce_skeleton_floor') && Number(k.replace('truce_skeleton_floor', '')) <= state.currentFloor - 2);
    if (key) s = setFlag(s, `truce_payoff_${key}`, true);
  } else if (payoff.message.includes('mercy precedes')) {
    s = setFlag(s, 'truce_rep_payoff', true);
  }

  return s;
}

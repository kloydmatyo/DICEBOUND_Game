'use client';

import { Player } from '@/lib/game-engine';
import { getDungeonNumber, getFloorInDungeon } from '@/lib/game-engine/constants';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HUDProps {
  player: Player;
  floor: number;
  turnCount: number;
  onInventoryClick: () => void;
  playerSpriteUrl?: string;
}

/** Circular HP ring */
function HpRing({ percent }: { percent: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  return (
    <svg width="72" height="72" className="absolute inset-0">
      {/* track */}
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
      {/* fill */}
      <motion.circle
        cx="36" cy="36" r={r} fill="none"
        stroke={percent > 50 ? '#22c55e' : percent > 25 ? '#f59e0b' : '#ef4444'}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circ}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 0.4 }}
        transform="rotate(-90 36 36)"
      />
    </svg>
  );
}

export default function HUD({ player, floor, turnCount, onInventoryClick, playerSpriteUrl }: HUDProps) {
  const healthPercent = (player.health / player.maxHealth) * 100;
  const manaPercent = player.mana && player.maxMana ? (player.mana / player.maxMana) * 100 : 0;
  const dungeonNum = getDungeonNumber(floor);
  const floorInDungeon = getFloorInDungeon(floor);

  return (
    <>
      {/* ── TOP-LEFT: Player card ── */}
      <div className="fixed top-3 left-3 z-30 flex flex-col gap-1.5" style={{ minWidth: 180 }}>
        <div className="bg-black/70 border border-cyan-500/40 rounded-xl p-2.5 backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-2.5">
            {/* Avatar / sprite */}
            <div className="relative w-[72px] h-[72px] shrink-0">
              <HpRing percent={healthPercent} />
              <div className="absolute inset-0 flex items-center justify-center">
                {playerSpriteUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={playerSpriteUrl} alt="player"
                    style={{ width: 44, height: 44, imageRendering: 'pixelated', objectFit: 'contain' }} />
                ) : (
                  <span className="text-2xl">🛡️</span>
                )}
              </div>
            </div>

            {/* HP / MP text + class */}
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-white font-black text-xs uppercase tracking-wider truncate">
                {player.class}
              </span>
              <span className={cn('text-xs font-bold', healthPercent > 50 ? 'text-green-400' : healthPercent > 25 ? 'text-yellow-400' : 'text-red-400')}>
                ❤️ {player.health}/{player.maxHealth}
              </span>
              {player.mana !== undefined && player.maxMana && (
                <span className="text-blue-400 text-xs font-bold">
                  ✨ {player.mana}/{player.maxMana}
                </span>
              )}
              {/* Mana bar */}
              {player.mana !== undefined && player.maxMana && (
                <div className="h-1.5 bg-black/50 rounded-full overflow-hidden w-full mt-0.5">
                  <motion.div className="h-full bg-blue-500 rounded-full"
                    animate={{ width: `${manaPercent}%` }} transition={{ duration: 0.3 }} />
                </div>
              )}
              {/* Shield bar */}
              {(() => {
                const shield = player.statusEffects.find(e => e.type === 'shield');
                if (!shield?.value) return null;
                const maxShield = shield.value <= 30 ? 30 : 60;
                return (
                  <>
                    <span className="text-cyan-300 text-xs font-bold">🛡 {shield.value}</span>
                    <div className="h-1.5 bg-black/50 rounded-full overflow-hidden w-full mt-0.5">
                      <motion.div className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full"
                        animate={{ width: `${Math.min(100, (shield.value / maxShield) * 100)}%` }}
                        transition={{ duration: 0.3 }} />
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Stat pills */}
          <div className="flex gap-1.5 mt-2">
            <span className="bg-black/50 border border-white/10 rounded-lg px-2 py-0.5 text-xs font-bold text-orange-300">⚔️ {player.attack}</span>
            <span className="bg-black/50 border border-white/10 rounded-lg px-2 py-0.5 text-xs font-bold text-blue-300">🛡️ {player.defense}</span>
            <button onClick={onInventoryClick}
              className="bg-black/50 border border-yellow-500/40 rounded-lg px-2 py-0.5 text-xs font-bold text-yellow-300 hover:border-yellow-400 transition-colors">
              📦 {player.inventory.length}
            </button>
          </div>

          {/* Status effects */}
          {player.statusEffects.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {player.statusEffects.map((e, i) => (
                <span key={i} className="text-[9px] bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-white/70">
                  {e.type === 'poison' ? '🧪' : e.type === 'burn' ? '🔥' : e.type === 'cursed' ? '💀' : e.type === 'blessed' ? '✨' : e.type === 'regen' ? '💚' : '🛡️'}
                  {' '}{e.type} {e.duration}t
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── TOP-RIGHT: Game info card ── */}
      <div className="fixed top-3 right-3 z-30">
        <div className="bg-black/70 border border-cyan-500/40 rounded-xl px-4 py-3 backdrop-blur-sm shadow-xl text-right min-w-[130px]">
          <div className="text-game-gold font-black text-sm">
            D{dungeonNum} · F{floorInDungeon}
          </div>
          <div className="text-gray-400 text-xs mt-0.5">Turn {turnCount}</div>
          <div className="text-yellow-300 font-bold text-sm mt-1.5">
            💰 {player.coins}
          </div>
        </div>
      </div>
    </>
  );
}

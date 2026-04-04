'use client';

import { Player, Enemy } from '@/lib/game-engine';
import { motion, AnimatePresence } from 'framer-motion';
import { ENEMY_SPRITES } from '@/lib/game-engine/constants';
import SpriteAnimator from '@/components/game/SpriteAnimator';

export type EnemyAnimState = 'Idle' | 'Hurt' | 'Attack' | 'Death';

function EnemySprite({ enemy, animState }: { enemy: Enemy; animState: EnemyAnimState }) {
  const sprite = ENEMY_SPRITES[enemy.type];
  if (!sprite) return <div className="text-7xl drop-shadow-lg select-none">👹</div>;

  const frameCount = sprite.frames[animState] ?? sprite.frames['Idle'] ?? 3;
  const fps = animState === 'Idle' ? 4 : 8;
  const frameW = typeof sprite.frameW === 'object' ? (sprite.frameW[animState] ?? 58) : sprite.frameW;
  const frameH = typeof sprite.frameH === 'object' ? (sprite.frameH[animState] ?? 60) : (sprite.frameH ?? 60);

  return (
    <SpriteAnimator
      sheet={sprite.sheet(animState)}
      frameW={frameW}
      frameH={frameH}
      frameCount={frameCount}
      fps={fps}
      loop={animState !== 'Death'}
      scale={4}
      className="drop-shadow-[0_0_16px_rgba(255,80,80,0.7)]"
    />
  );
}

function HealthBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = Math.max(0, (current / max) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs font-bold mb-1">
        <span className="text-white/60 uppercase tracking-widest">HP</span>
        <span className="text-white font-mono">
          {current}<span className="text-white/40">/{max}</span>
        </span>
      </div>
      <div className="h-3 bg-black/60 rounded-full overflow-hidden border border-white/10">
        <motion.div
          className={`h-full rounded-full ${color}`}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}

interface CombatUIProps {
  player: Player;
  enemy: Enemy;
  onAttack: () => void;
  onUseSkill: (skillId: string) => void;
  onFlee?: () => void;
  combatLog: string[];
  isPlayerTurn: boolean;
  enemyAnimState?: EnemyAnimState;
  playerHurt?: boolean;
}

export default function CombatUI({
  player,
  enemy,
  onAttack,
  onUseSkill,
  onFlee,
  combatLog,
  isPlayerTurn,
  enemyAnimState = 'Idle',
  playerHurt = false,
}: CombatUIProps) {
  const isAnimating = enemyAnimState !== 'Idle';
  const actionsDisabled = !isPlayerTurn || isAnimating;
  const activeSkills = player.skills.filter(s => s.type === 'active');

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="relative w-full max-w-5xl rounded-2xl overflow-hidden shadow-[0_12px_80px_rgba(0,0,0,0.9)] flex flex-col"
      >

        {/* ── STAGE: arena background with characters on platforms ── */}
        <div
          className="relative w-full overflow-hidden"
          style={{ height: '450px' }}
        >
          {/* Arena background — positioned so platforms are in the lower half */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'url(/background/Arena_BG.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center 40%',
            }}
          />

          {/* Subtle top-to-transparent gradient so it blends into the UI panel below */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />

          {/* COMBAT title overlay */}
          <div className="absolute top-4 left-0 right-0 text-center z-10">
            <h2 className="text-3xl font-extrabold tracking-[0.25em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,1)]">
              ⚔️ COMBAT ⚔️
            </h2>
            <p className={`text-xs font-bold tracking-[0.3em] mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,1)] ${isPlayerTurn ? 'text-yellow-300' : 'text-red-400'}`}>
              {isPlayerTurn ? '— YOUR TURN —' : '— ENEMY TURN —'}
            </p>
          </div>

          {/* ── Left platform: Player ── */}
          <div
            className="absolute z-10 flex flex-col items-center"
            style={{ left: '30%', bottom: '18%', transform: 'translateX(-50%)' }}
          >
            <motion.div
              animate={playerHurt
                ? { x: [-8, 8, -5, 5, 0], filter: ['brightness(3) saturate(0)', 'brightness(1) saturate(1)'] }
                : {}}
              transition={{ duration: 0.35 }}
              className="text-7xl drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] select-none"
            >
              🛡️
            </motion.div>
            <span className="mt-1 text-xs font-extrabold tracking-widest text-yellow-300 drop-shadow-[0_1px_6px_rgba(0,0,0,1)]">
              {player.class.toUpperCase()}
            </span>
          </div>

          {/* ── Right platform: Enemy ── */}
          <div
            className="absolute z-10 flex flex-col items-center"
            style={{ left: '72%', bottom: '2%', transform: 'translateX(-50%)' }}
          >
            <EnemySprite enemy={enemy} animState={enemyAnimState} />
            <span className="mt-1 text-xs font-extrabold tracking-widest text-red-400 drop-shadow-[0_1px_6px_rgba(0,0,0,1)]">
              {enemy.name.toUpperCase()}
            </span>
          </div>
        </div>

        {/* ── UI PANEL: HP bars, log, actions ── */}
        <div className="bg-[#0f1220] border-t border-white/10 px-8 py-5 flex flex-col gap-4">

          {/* HP bars side by side */}
          <div className="grid grid-cols-2 gap-6">
            {/* Player HP */}
            <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10">
              <p className="text-yellow-300 font-extrabold text-xs tracking-widest mb-2">
                {player.class.toUpperCase()}
              </p>
              <HealthBar current={player.health} max={player.maxHealth} color="bg-emerald-500" />
              {player.class === 'mage' && player.maxMana !== undefined && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-blue-300/60 uppercase tracking-widest">MP</span>
                    <span className="text-blue-200 font-mono">
                      {player.mana ?? 0}<span className="text-white/40">/{player.maxMana}</span>
                    </span>
                  </div>
                  <div className="h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
                    <motion.div
                      className="h-full rounded-full bg-blue-500"
                      animate={{ width: `${Math.max(0, ((player.mana ?? 0) / player.maxMana) * 100)}%` }}
                      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    />
                  </div>
                </div>
              )}
              {player.statusEffects.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {player.statusEffects.map((e, i) => (
                    <span key={i} className="text-[10px] bg-black/40 border border-white/15 rounded px-1.5 py-0.5 text-white/70">
                      {e.type === 'burn' ? '🔥' : e.type === 'poison' ? '🧪' : e.type === 'cursed' ? '💀' : e.type === 'blessed' ? '✨' : '⚡'}
                      {' '}{e.type} {e.duration}t
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Enemy HP */}
            <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10">
              <p className="text-red-400 font-extrabold text-xs tracking-widest mb-2">
                {enemy.name.toUpperCase()}
              </p>
              <HealthBar current={enemy.health} max={enemy.maxHealth} color="bg-red-500" />
            </div>
          </div>

          {/* Combat log */}
          <div className="bg-black/40 rounded-xl border border-white/10 px-4 py-3 h-24 overflow-y-auto">
            <AnimatePresence initial={false}>
              {combatLog.slice(-6).map((msg, i) => (
                <motion.p
                  key={`${msg}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs text-white/75 leading-5"
                >
                  <span className="text-yellow-400 mr-1">›</span>{msg}
                </motion.p>
              ))}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                onClick={onAttack}
                disabled={actionsDisabled}
                className="flex-1 py-3 rounded-xl font-extrabold text-base tracking-wider bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg transition-all active:scale-95"
              >
                ⚔️ Attack
              </button>
              {onFlee && (
                <button
                  onClick={onFlee}
                  disabled={actionsDisabled}
                  className="px-6 py-3 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white border border-white/20 transition-all active:scale-95"
                >
                  🏃 Flee
                </button>
              )}
            </div>

            {activeSkills.length > 0 && (
              <div>
                <p className="text-[10px] text-yellow-300 font-bold tracking-[0.25em] mb-2">⚡ SKILLS</p>
                <div className="grid grid-cols-3 gap-2">
                  {activeSkills.map((skill) => (
                    <button
                      key={skill.id}
                      onClick={() => onUseSkill(skill.id)}
                      disabled={actionsDisabled || skill.currentCooldown > 0}
                      title={skill.description}
                      className="py-2 px-3 rounded-lg text-xs font-bold bg-white/8 hover:bg-yellow-500/25 border border-white/15 hover:border-yellow-400/60 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all active:scale-95 truncate"
                    >
                      {skill.name}
                      {skill.currentCooldown > 0 && (
                        <span className="ml-1 text-red-400">({skill.currentCooldown})</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';

interface DiceRollerProps {
  onRoll: () => void;
  disabled?: boolean;
  lastRoll?: number;
}

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export default function DiceRoller({ onRoll, disabled, lastRoll }: DiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [displayFace, setDisplayFace] = useState<number | null>(null);
  const [highlight, setHighlight] = useState(false);

  // When lastRoll updates (real result from game logic), show it with a highlight
  useEffect(() => {
    if (lastRoll) {
      setDisplayFace(lastRoll);
      setHighlight(true);
      const t = setTimeout(() => setHighlight(false), 800);
      return () => clearTimeout(t);
    }
  }, [lastRoll]);

  const handleRoll = () => {
    if (isRolling || disabled) return;
    setIsRolling(true);
    setHighlight(false);

    // Animate through random faces during the roll
    let ticks = 0;
    const maxTicks = 10;
    const interval = setInterval(() => {
      setDisplayFace(Math.floor(Math.random() * 6) + 1);
      ticks++;
      if (ticks >= maxTicks) {
        clearInterval(interval);
        // Now call the real roll - the useEffect above will sync the final value
        onRoll();
        setIsRolling(false);
      }
    }, 60);
  };

  return (
    <div className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-30">
      <div className="flex flex-col items-center gap-1.5 sm:gap-4">

        {/* Dice face display */}
        <AnimatePresence mode="wait">
          {displayFace && (
            <motion.div
              key={`${displayFace}-${highlight}`}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={`rounded-xl px-4 sm:px-8 py-2 sm:py-4 shadow-2xl border-2 transition-colors duration-200 ${
                highlight
                  ? 'bg-game-gold border-yellow-300 shadow-yellow-400/50'
                  : 'bg-game-primary border-game-gold'
              }`}
            >
              <div className="text-center">
                <div className={`text-[10px] sm:text-xs mb-0.5 sm:mb-1 font-bold uppercase tracking-wider ${highlight ? 'text-black' : 'text-gray-400'}`}>
                  {isRolling ? 'Loading...' : 'Last Roll'}
                </div>
                <div className={`text-3xl sm:text-5xl font-bold drop-shadow-lg ${highlight ? 'text-black' : 'text-game-gold'}`}>
                  {DICE_FACES[(displayFace - 1)]} {displayFace}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Roll button */}
        <motion.div
          animate={isRolling ? { rotate: [0, 180, 360, 540, 720] } : { rotate: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button
            size="lg"
            onClick={handleRoll}
            disabled={disabled || isRolling}
            className="text-base sm:text-2xl px-8 sm:px-16 py-4 sm:py-8 shadow-2xl text-white font-bold uppercase tracking-wider"
          >
          {isRolling ? '🗺️ Loading...' : '🗺️ CHOOSE PATH'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { getSupabase } from '@/lib/supabase';

interface GameOverScreenProps {
  isVictory: boolean;
  floor: number;
  turns: number;
  coinsEarned: number;
  characterClass: string;
  onRestart: () => void;
  onMainMenu: () => void;
}

export default function GameOverScreen({
  isVictory,
  floor,
  turns,
  coinsEarned,
  characterClass,
  onRestart,
  onMainMenu,
}: GameOverScreenProps) {
  const [nickname, setNickname] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitScore = async () => {
    if (!nickname.trim()) return;
    setSubmitting(true);
    setError(null);

    const { error } = await getSupabase().from('leaderboard').insert({
      nickname: nickname.trim(),
      floor_reached: floor,
      character_class: characterClass,
    });

    if (error) {
      setError('Failed to save score. Try again.');
    } else {
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.6 }}
      >
        <Card variant="elevated" className="max-w-2xl w-full p-8 text-center">
          {/* Title */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="text-8xl mb-4"
          >
            {isVictory ? '🏆' : '💀'}
          </motion.div>

          <h1 className={`text-5xl font-bold mb-4 ${isVictory ? 'text-game-gold' : 'text-game-accent'}`}>
            {isVictory ? 'VICTORY!' : 'GAME OVER'}
          </h1>

          <p className="text-gray-400 text-xl mb-8">
            {isVictory ? 'You have conquered the dungeon!' : 'Your adventure has come to an end...'}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-game-bg rounded p-4">
              <div className="text-3xl mb-2">🏰</div>
              <div className="text-gray-400 text-sm">Floor Reached</div>
              <div className="text-game-gold font-bold text-2xl">{floor}</div>
            </div>
            <div className="bg-game-bg rounded p-4">
              <div className="text-3xl mb-2">🎲</div>
              <div className="text-gray-400 text-sm">Total Turns</div>
              <div className="text-game-mana font-bold text-2xl">{turns}</div>
            </div>
            <div className="bg-game-bg rounded p-4">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-gray-400 text-sm">Coins Earned</div>
              <div className="text-game-gold font-bold text-2xl">{coinsEarned}</div>
            </div>
          </div>

          {/* Nickname submission */}
          {!submitted ? (
            <div className="mb-6">
              <p className="text-gray-300 mb-3 text-lg">Enter your name for the leaderboard:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitScore()}
                  placeholder="Your nickname..."
                  maxLength={20}
                  className="flex-1 bg-game-bg border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-game-gold"
                />
                <Button onClick={handleSubmitScore} disabled={!nickname.trim() || submitting}>
                  {submitting ? '...' : '✓ Submit'}
                </Button>
              </div>
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-game-bg rounded-lg p-4"
            >
              <p className="text-game-gold font-bold text-lg">🎉 Score saved, {nickname}!</p>
              <p className="text-gray-400 text-sm">Floor {floor} recorded on the leaderboard.</p>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button size="lg" onClick={onRestart} className="flex-1">
              🔄 Play Again
            </Button>
            <Button size="lg" variant="secondary" onClick={onMainMenu} className="flex-1">
              🏠 Main Menu
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

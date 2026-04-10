'use client';

import { useEffect, useRef, useState } from 'react';
import { BoardTile } from '@/lib/game-engine/types';
import { motion } from 'framer-motion';

interface GameBoardProps {
  tiles: BoardTile[];
  currentPosition: number;
  choosableTileIds?: number[];
  onTileClick?: (tileId: number) => void;
}

const TILE_COLOR: Record<string, string> = {
  start: 'bg-green-500',
  normal: 'bg-gray-500',
  enemy: 'bg-red-500',
  elite: 'bg-purple-700',
  shop: 'bg-yellow-500',
  event: 'bg-blue-500',
  boss: 'bg-red-800',
  trap: 'bg-orange-600',
};

function getTileEmoji(tile: BoardTile): string {
  if (tile.type === 'trap') {
    if (tile.trapTriggered) return String.fromCharCode(10003);
    if (tile.trapType === 'fire') return String.fromCodePoint(0x1F525);
    if (tile.trapType === 'spike') return String.fromCodePoint(0x1F5E1) + String.fromCharCode(0xFE0F);
    if (tile.trapType === 'poison_gas') return String.fromCodePoint(0x1F9EA);
    return String.fromCharCode(0x26A0) + String.fromCharCode(0xFE0F);
  }
  const map: Record<string, string> = {
    start: String.fromCodePoint(0x1F3C1),
    normal: String.fromCharCode(0x2B1C),
    enemy: String.fromCodePoint(0x1F479),
    elite: String.fromCodePoint(0x1F480),
    shop: String.fromCodePoint(0x1F3EA),
    event: String.fromCharCode(0x2753),
    boss: String.fromCharCode(0x2620) + String.fromCharCode(0xFE0F),
  };
  return map[tile.type] ?? String.fromCharCode(0x2B1C);
}

export default function GameBoard({
  tiles,
  currentPosition,
  choosableTileIds = [],
  onTileClick,
}: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const mobile = window.innerWidth < 640;
      const pad = mobile ? 10 : 30;
      const s = Math.min((cw - pad) / 900, (ch - pad) / 600, mobile ? 1.15 : 1.0);
      setScale(s);
      setDimensions({ width: 900 * s, height: 600 * s });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const currentTile = tiles.find(t => t.id === currentPosition);
    if (!currentTile?.nextIds) return;

    // Draw lines from current tile to immediate next tiles
    for (const nextId of currentTile.nextIds) {
      const next = tiles.find(t => t.id === nextId);
      if (!next) continue;
      const highlighted = choosableTileIds.includes(nextId);
      ctx.strokeStyle = highlighted ? 'rgba(255,215,0,0.95)' : 'rgba(78,205,196,0.4)';
      ctx.lineWidth = highlighted ? 3.5 * scale : 2 * scale;
      ctx.setLineDash(highlighted ? [] : [6 * scale, 5 * scale]);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(currentTile.x * scale, currentTile.y * scale);
      ctx.lineTo(next.x * scale, next.y * scale);
      ctx.stroke();
    }

    // Draw visited trail
    const visitedSet = new Set(tiles.filter(t => t.visited).map(t => t.id));
    for (const tile of tiles) {
      if (!visitedSet.has(tile.id) || !tile.nextIds) continue;
      for (const nextId of tile.nextIds) {
        if (!visitedSet.has(nextId)) continue;
        const next = tiles.find(t => t.id === nextId);
        if (!next) continue;
        ctx.strokeStyle = 'rgba(255,215,0,0.25)';
        ctx.lineWidth = 2 * scale;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(tile.x * scale, tile.y * scale);
        ctx.lineTo(next.x * scale, next.y * scale);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);
  }, [tiles, scale, choosableTileIds, currentPosition]);

  const tileSize = 60 * scale;
  const half = tileSize / 2;
  const tokenTile = tiles.find(t => t.id === currentPosition);
  const tokenX = tokenTile ? tokenTile.x * scale : 0;
  const tokenY = tokenTile ? tokenTile.y * scale : 0;

  const currentTileRef = tiles.find(t => t.id === currentPosition);
  const immediateNextIds = new Set<number>(currentTileRef?.nextIds ?? []);
  const visitedIds = new Set<number>(tiles.filter(t => t.visited).map(t => t.id));

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">
      <div className="relative" style={{ width: dimensions.width, height: dimensions.height }}>
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="absolute inset-0 pointer-events-none"
        />
        {tiles.map((tile, idx) => {
          const isCurrent = tile.id === currentPosition;
          const isChoosable = choosableTileIds.includes(tile.id);
          const isVisited = visitedIds.has(tile.id);
          const isImmediateNext = immediateNextIds.has(tile.id);
          if (!isCurrent && !isVisited && !isImmediateNext) return null;
          const tileOpacity = isChoosable ? 1 : isCurrent ? 1 : isVisited ? 0.85 : 0.5;

          return (
            <motion.div
              key={tile.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: tileOpacity }}
              transition={{ delay: idx * 0.02 }}
              className="absolute"
              style={{ left: tile.x * scale - half, top: tile.y * scale - half, width: tileSize, height: tileSize }}
            >
              <div
                onClick={() => isChoosable && onTileClick?.(tile.id)}
                className={[
                  'w-full h-full rounded-full flex items-center justify-center border-4 transition-all relative',
                  TILE_COLOR[tile.type] ?? 'bg-gray-500',
                  isCurrent ? 'border-game-gold shadow-2xl z-10' : '',
                  isChoosable ? 'border-yellow-300 shadow-yellow-400/60 shadow-lg z-20 cursor-pointer scale-110' : 'border-gray-700',
                  tile.trapTriggered ? 'grayscale' : '',
                ].filter(Boolean).join(' ')}
              >
                <span style={{ fontSize: Math.max(24, 32 * scale) }}>{getTileEmoji(tile)}</span>
                {isCurrent && <div className="absolute inset-0 rounded-full bg-game-gold opacity-20 animate-pulse" />}
                {isChoosable && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-yellow-300"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  />
                )}
              </div>
              <div
                className="absolute left-1/2 -translate-x-1/2 text-gray-400 font-bold bg-game-bg px-1.5 py-0.5 rounded whitespace-nowrap"
                style={{ bottom: -(tileSize * 0.35), fontSize: Math.max(9, 11 * scale) }}
              >
                {tile.type === 'elite' ? 'Elite' : tile.id + 1}
              </div>
            </motion.div>
          );
        })}
        <motion.div
          animate={{ x: tokenX, y: tokenY - tileSize * 0.55 }}
          transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
          className="absolute pointer-events-none z-30"
          style={{ marginLeft: -half * 0.5 }}
        >
          <motion.div
            animate={{ y: [-4, 4, -4] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
            style={{ fontSize: Math.max(20, 28 * scale) }}
            className="drop-shadow-lg select-none"
          >
            {String.fromCodePoint(0x1F464)}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, RefObject } from 'react';
import { FRAME_SIZE, ANIMATION_OFFSETS } from './LPCRenderer';

const ANIMATION_CONFIGS: Record<string, { row: number; num: number; cycle: number[] }> = {
  walk:      { row: 8,  num: 4, cycle: [1,2,3,4,5,6,7,8] },
  idle:      { row: 22, num: 4, cycle: [0,0,1] },
  slash:     { row: 12, num: 4, cycle: [0,1,2,3,4,5] },
  spellcast: { row: 0,  num: 4, cycle: [0,1,2,3,4,5,6] },
  run:       { row: 38, num: 4, cycle: [0,1,2,3,4,5,6,7] },
};

interface Props {
  sourceCanvas: RefObject<HTMLCanvasElement>;
  animation?: string;
  scale?: number;
  isRendering?: boolean;
}

export default function LPCPreview({ sourceCanvas, animation = 'walk', scale = 3, isRendering }: Props) {
  const previewRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const config = ANIMATION_CONFIGS[animation] ?? ANIMATION_CONFIGS['walk'];
    const { row, num, cycle } = config;
    const size = FRAME_SIZE * scale;

    const preview = previewRef.current;
    if (!preview) return;
    preview.width = size * num;
    preview.height = size;
    const ctx = preview.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    function draw(now: number) {
      const fps = 8;
      if (now - lastTimeRef.current > 1000 / fps) {
        lastTimeRef.current = now;
        frameRef.current = (frameRef.current + 1) % cycle.length;
      }

      const src = sourceCanvas.current;
      if (!src || !ctx) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, preview!.width, preview!.height);
      const frameCol = cycle[frameRef.current];

      for (let dir = 0; dir < num; dir++) {
        ctx.drawImage(
          src,
          frameCol * FRAME_SIZE, (row + dir) * FRAME_SIZE, FRAME_SIZE, FRAME_SIZE,
          dir * size, 0, size, size
        );
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [sourceCanvas, animation, scale]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded">
            <span className="text-white text-xs">Rendering...</span>
          </div>
        )}
        <canvas
          ref={previewRef}
          className="rounded border border-game-secondary"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
      <p className="text-xs text-gray-400">N · W · S · E</p>
    </div>
  );
}

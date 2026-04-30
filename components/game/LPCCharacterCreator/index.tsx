'use client';

import { useState } from 'react';
import { useLPCState } from './useLPCState';
import LPCPreview from './LPCPreview';
import LPCItemPicker from './LPCItemPicker';
import { extractWalkPreviewFrame } from './LPCRenderer';

interface Props {
  onConfirm: (spriteDataUrl: string, fullSheetDataUrl?: string) => void;
}

const PREVIEW_ANIMATIONS = ['walk', 'idle', 'slash', 'spellcast', 'run'];

export default function LPCCharacterCreator({ onConfirm }: Props) {
  const {
    metadataReady,
    selections,
    bodyType,
    setBodyType,
    selectItem,
    deselectItem,
    resetSelections,
    isRendering,
    canvasRef,
  } = useLPCState();

  const [previewAnim, setPreviewAnim] = useState('walk');

  function handleConfirm() {
    if (!canvasRef.current) return;
    const dataUrl = extractWalkPreviewFrame(canvasRef.current, 1);
    const fullSheet = canvasRef.current.toDataURL('image/png');
    onConfirm(dataUrl, fullSheet);
  }

  if (!metadataReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-game-mana text-sm animate-pulse">Loading character creator...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left: item picker */}
        <div className="flex-1 bg-game-primary rounded-xl p-4 border border-game-secondary">
          <h3 className="text-game-gold font-bold text-sm mb-3">Customize Appearance</h3>
          <LPCItemPicker
            selections={selections}
            bodyType={bodyType}
            onSelect={selectItem}
            onDeselect={deselectItem}
            onBodyTypeChange={setBodyType}
          />
        </div>

        {/* Right: preview */}
        <div className="flex flex-col items-center gap-4 bg-game-primary rounded-xl p-4 border border-game-secondary min-w-[200px]">
          <h3 className="text-game-gold font-bold text-sm">Preview</h3>

          {/* Hidden offscreen canvas used for rendering */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <LPCPreview
            sourceCanvas={canvasRef}
            animation={previewAnim}
            scale={3}
            isRendering={isRendering}
          />

          {/* Animation selector */}
          <div className="flex flex-wrap gap-1 justify-center">
            {PREVIEW_ANIMATIONS.map(anim => (
              <button
                key={anim}
                onClick={() => setPreviewAnim(anim)}
                className={`px-2 py-0.5 text-xs rounded capitalize transition-colors ${
                  previewAnim === anim
                    ? 'bg-game-accent text-black font-bold'
                    : 'bg-game-secondary text-gray-300 hover:bg-game-primary'
                }`}
              >
                {anim}
              </button>
            ))}
          </div>

          {/* Current selections count */}
          <p className="text-xs text-gray-500">{Object.keys(selections).length} items equipped</p>

          <button
            onClick={resetSelections}
            className="text-xs text-red-400 hover:text-red-300 underline"
          >
            Reset all
          </button>
        </div>
      </div>

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={isRendering || Object.keys(selections).length === 0}
        className="w-full py-3 rounded-xl font-bold text-sm bg-game-gold text-black hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isRendering ? 'Rendering...' : '✓ Confirm Appearance'}
      </button>
    </div>
  );
}

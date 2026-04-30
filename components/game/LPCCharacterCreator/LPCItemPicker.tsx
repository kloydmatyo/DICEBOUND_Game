'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { LPCSelections, BodyType, ItemMeta } from './types';
import { getVariantThumbnailUrl, FRAME_SIZE } from './LPCRenderer';

interface Props {
  selections: LPCSelections;
  bodyType: BodyType;
  onSelect: (itemId: string, variant: string) => void;
  onDeselect: (group: string) => void;
  onBodyTypeChange: (bt: BodyType) => void;
}

const EXCLUDED_ITEMS = new Set([
  'wheelchair',
  'wings_lizard_bat',
  'wings_lizard',
  'wings_bat',
  'wings_feathered',
  'wings_lizard_alt',
  'wings_lunar',
  'wings_dragonfly_transparent',
  'wings_dragonfly',
  'wings_monarch_dots',
  'wings_monarch_edge',
  'wings_monarch',
  'wings_pixie_transparent',
  'wings_pixie',
  'hat_accessory_wings',
  'tail_lizard',
  'tail_cat',
  'tail_lizard_alt',
  'tail_wolf_fluffy',
  'tail_wolf',
]);
const BODY_TYPES: BodyType[] = ['male', 'female'];
const TOP_CATEGORIES = ['body', 'head', 'hair', 'headwear', 'torso', 'arms', 'legs', 'feet', 'weapons', 'tools'];

// Idle south frame: row 22 (idle offset / FRAME_SIZE), direction 2 = south, frame 0
const IDLE_ROW = 22;
const SOUTH_DIR = 2;
const THUMB_SIZE = 40; // display px

/**
 * Renders a single idle-south frame from a sprite sheet URL onto a small canvas.
 */
function VariantThumb({
  sheetUrl,
  idleSheetUrl,
  label,
  selected,
  onClick,
}: {
  sheetUrl: string | null;
  idleSheetUrl?: string | null;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!sheetUrl) { setFailed(true); return; }
    setLoaded(false);
    setFailed(false);

    function tryDraw(url: string, onFail: () => void) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.imageSmoothingEnabled = false;

        // Try walk south (row 10, frame 1) first
        const tryRows = [
          { row: 8 + SOUTH_DIR, frame: 1 },   // walk south
          { row: IDLE_ROW + SOUTH_DIR, frame: 0 }, // idle south
          { row: SOUTH_DIR, frame: 0 },         // spellcast south
          { row: 12 + SOUTH_DIR, frame: 0 },    // slash south
        ];

        for (const { row, frame } of tryRows) {
          ctx.clearRect(0, 0, THUMB_SIZE, THUMB_SIZE);
          ctx.drawImage(img, frame * FRAME_SIZE, row * FRAME_SIZE, FRAME_SIZE, FRAME_SIZE, 0, 0, THUMB_SIZE, THUMB_SIZE);
          const pixels = ctx.getImageData(0, 0, THUMB_SIZE, THUMB_SIZE).data;
          const hasContent = pixels.some((v, i) => i % 4 === 3 && v > 10);
          if (hasContent) { setLoaded(true); return; }
        }

        // Nothing rendered — fail so fallback text shows
        onFail();
      };
      img.onerror = onFail;
      img.src = url;
    }

    tryDraw(sheetUrl, () => {
      // walk failed — try idle URL if available
      if (idleSheetUrl && idleSheetUrl !== sheetUrl) {
        tryDraw(idleSheetUrl, () => setFailed(true));
      } else {
        setFailed(true);
      }
    });
  }, [sheetUrl, idleSheetUrl]);

  return (
    <button
      onClick={onClick}
      title={label}
      className={`relative flex flex-col items-center gap-0.5 p-1 rounded-lg border-2 transition-all hover:scale-105 ${
        selected
          ? 'border-game-gold bg-game-primary shadow-[0_0_8px_rgba(255,215,0,0.5)]'
          : 'border-game-secondary bg-game-bg hover:border-gray-500'
      }`}
      style={{ width: THUMB_SIZE + 8, minWidth: THUMB_SIZE + 8 }}
    >
      <canvas
        ref={canvasRef}
        width={THUMB_SIZE}
        height={THUMB_SIZE}
        style={{ imageRendering: 'pixelated', display: loaded ? 'block' : 'none' }}
      />
      {/* Fallback while loading or on error */}
      {(!loaded || failed) && (
        <div
          className="flex items-center justify-center bg-game-secondary rounded text-gray-400 text-[8px] text-center leading-tight"
          style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
        >
          {failed ? label.slice(0, 6) : '…'}
        </div>
      )}
      <span className={`text-[8px] leading-tight text-center truncate w-full ${selected ? 'text-game-gold font-bold' : 'text-gray-400'}`}>
        {label.replaceAll('_', ' ')}
      </span>
    </button>
  );
}

export default function LPCItemPicker({ selections, bodyType, onSelect, onDeselect, onBodyTypeChange }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('body');
  const [search, setSearch] = useState('');

  const metadata: Record<string, ItemMeta> = useMemo(() => (window as any).itemMetadata ?? {}, []);

  const itemsByCategory = useMemo(() => {
    const groups: Record<string, string[]> = {};
    for (const [itemId, meta] of Object.entries(metadata)) {
      const cat = meta.path?.[0] ?? 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(itemId);
    }
    return groups;
  }, [metadata]);

  const currentItems = useMemo(() => {
    const items = itemsByCategory[activeCategory] ?? [];
    const filtered = items.filter(id => !EXCLUDED_ITEMS.has(id));
    if (!search.trim()) return filtered;
    return filtered.filter(id => metadata[id]?.name.toLowerCase().includes(search.toLowerCase()));
  }, [activeCategory, itemsByCategory, search, metadata]);

  function getSelectedVariant(itemId: string): string | null {
    const meta = metadata[itemId];
    if (!meta) return null;
    const sel = selections[meta.type_name];
    return sel?.itemId === itemId ? sel.variant : null;
  }

  function isGroupSelected(itemId: string): boolean {
    const meta = metadata[itemId];
    if (!meta) return false;
    return !!selections[meta.type_name];
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Body type selector */}
      <div className="flex flex-wrap gap-1">
        {BODY_TYPES.map(bt => (
          <button
            key={bt}
            onClick={() => onBodyTypeChange(bt)}
            className={`px-2 py-1 text-xs rounded capitalize transition-colors ${
              bodyType === bt
                ? 'bg-game-gold text-black font-bold'
                : 'bg-game-secondary text-gray-300 hover:bg-game-primary'
            }`}
          >
            {bt}
          </button>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1">
        {TOP_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2 py-1 text-xs rounded capitalize transition-colors ${
              activeCategory === cat
                ? 'bg-game-accent text-black font-bold'
                : 'bg-game-secondary text-gray-300 hover:bg-game-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search items..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-game-primary border border-game-secondary rounded px-3 py-1.5 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-game-gold"
      />

      {/* Item list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ maxHeight: '320px' }}>
        {currentItems.length === 0 && (
          <p className="text-gray-500 text-xs text-center py-4">No items found</p>
        )}
        {currentItems.map(itemId => {
          const meta = metadata[itemId];
          if (!meta) return null;
          if (!meta.required?.includes(bodyType)) return null;

          const selectedVariant = getSelectedVariant(itemId);
          const groupSelected = isGroupSelected(itemId);

          return (
            <ItemRow
              key={itemId}
              itemId={itemId}
              meta={meta}
              bodyType={bodyType}
              selections={selections}
              selectedVariant={selectedVariant}
              groupSelected={groupSelected}
              onSelect={onSelect}
              onDeselect={() => onDeselect(meta.type_name)}
            />
          );
        })}
      </div>
    </div>
  );
}

interface ItemRowProps {
  itemId: string;
  meta: ItemMeta;
  bodyType: BodyType;
  selections: LPCSelections;
  selectedVariant: string | null;
  groupSelected: boolean;
  onSelect: (itemId: string, variant: string) => void;
  onDeselect: () => void;
}

function ItemRow({ itemId, meta, bodyType, selections, selectedVariant, groupSelected, onSelect, onDeselect }: ItemRowProps) {
  const [expanded, setExpanded] = useState(false);
  const isSelected = selectedVariant !== null;
  const hasVariants = meta.variants && meta.variants.length > 0;

  return (
    <div className={`rounded border transition-colors ${
      isSelected ? 'border-game-gold bg-game-primary' : 'border-game-secondary bg-game-bg'
    }`}>
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer"
        onClick={() => {
          if (hasVariants) {
            setExpanded(e => !e);
          } else {
            if (isSelected) onDeselect();
            else onSelect(itemId, '');
          }
        }}
      >
        <span className={`text-xs font-medium ${isSelected ? 'text-game-gold' : 'text-gray-300'}`}>
          {meta.name}
          {isSelected && selectedVariant && (
            <span className="ml-1 text-gray-400 capitalize">({selectedVariant.replaceAll('_', ' ')})</span>
          )}
        </span>
        <div className="flex items-center gap-2">
          {isSelected && (
            <button
              onClick={e => { e.stopPropagation(); onDeselect(); }}
              className="text-red-400 hover:text-red-300 text-xs px-1"
            >
              ✕
            </button>
          )}
          {hasVariants && (
            <span className="text-gray-500 text-xs">{expanded ? '▲' : '▼'}</span>
          )}
        </div>
      </div>

      {expanded && hasVariants && (
        <div className="flex flex-wrap gap-2 px-3 pb-3">
          {meta.variants.map(variant => {
            const sheetUrl = getVariantThumbnailUrl(meta, variant, bodyType, selections);
            const idleSheetUrl = getVariantThumbnailUrl(meta, variant, bodyType, selections, 'idle');
            return (
              <VariantThumb
                key={variant}
                sheetUrl={sheetUrl}
                idleSheetUrl={idleSheetUrl}
                label={variant}
                selected={selectedVariant === variant}
                onClick={() => onSelect(itemId, variant)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { LPCSelections, BodyType, ItemMeta, CategoryNode } from './types';

interface Props {
  selections: LPCSelections;
  bodyType: BodyType;
  onSelect: (itemId: string, variant: string) => void;
  onDeselect: (group: string) => void;
  onBodyTypeChange: (bt: BodyType) => void;
}

const BODY_TYPES: BodyType[] = ['male', 'female', 'teen', 'child', 'muscular', 'pregnant'];

const TOP_CATEGORIES = ['body', 'head', 'hair', 'headwear', 'torso', 'arms', 'legs', 'feet', 'weapons', 'tools'];

export default function LPCItemPicker({ selections, bodyType, onSelect, onDeselect, onBodyTypeChange }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('body');
  const [search, setSearch] = useState('');

  const metadata: Record<string, ItemMeta> = useMemo(() => (window as any).itemMetadata ?? {}, []);

  // Group items by their top-level path category
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
    if (!search.trim()) return items;
    return items.filter(id => metadata[id]?.name.toLowerCase().includes(search.toLowerCase()));
  }, [activeCategory, itemsByCategory, search, metadata]);

  // Get currently selected group for an item
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
  selectedVariant: string | null;
  groupSelected: boolean;
  onSelect: (itemId: string, variant: string) => void;
  onDeselect: () => void;
}

function ItemRow({ itemId, meta, selectedVariant, groupSelected, onSelect, onDeselect }: ItemRowProps) {
  const [expanded, setExpanded] = useState(false);
  const isSelected = selectedVariant !== null;

  return (
    <div className={`rounded border transition-colors ${
      isSelected ? 'border-game-gold bg-game-primary' : 'border-game-secondary bg-game-bg'
    }`}>
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer"
        onClick={() => {
          if (meta.variants && meta.variants.length > 0) {
            setExpanded(e => !e);
          } else {
            if (isSelected) onDeselect();
            else onSelect(itemId, '');
          }
        }}
      >
        <span className={`text-xs font-medium ${isSelected ? 'text-game-gold' : 'text-gray-300'}`}>
          {meta.name}
          {isSelected && <span className="ml-1 text-gray-400">({selectedVariant})</span>}
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
          {meta.variants && meta.variants.length > 0 && (
            <span className="text-gray-500 text-xs">{expanded ? '▲' : '▼'}</span>
          )}
        </div>
      </div>

      {expanded && meta.variants && meta.variants.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 pb-2">
          {meta.variants.map(variant => (
            <button
              key={variant}
              onClick={() => onSelect(itemId, variant)}
              className={`px-2 py-0.5 text-xs rounded capitalize transition-colors ${
                selectedVariant === variant
                  ? 'bg-game-gold text-black font-bold'
                  : 'bg-game-secondary text-gray-300 hover:bg-game-primary'
              }`}
            >
              {variant.replaceAll('_', ' ')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

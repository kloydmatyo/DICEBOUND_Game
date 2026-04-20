'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { LPCSelections, BodyType, ItemMeta } from './types';
import { renderCharacterToCanvas } from './LPCRenderer';

export function useLPCState() {
  const [metadataReady, setMetadataReady] = useState(false);
  const [selections, setSelections] = useState<LPCSelections>({});
  const [bodyType, setBodyType] = useState<BodyType>('male');
  const [isRendering, setIsRendering] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load item-metadata.js as a script tag (sets window.itemMetadata)
  useEffect(() => {
    if ((window as any).itemMetadata) {
      setMetadataReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = '/item-metadata.js';
    script.onload = () => setMetadataReady(true);
    script.onerror = () => console.error('Failed to load item-metadata.js');
    document.head.appendChild(script);
  }, []);

  // Set defaults once metadata is ready
  useEffect(() => {
    if (!metadataReady) return;
    const metadata: Record<string, ItemMeta> = (window as any).itemMetadata;
    const defaults: LPCSelections = {};

    if (metadata['body']) {
      const meta = metadata['body'];
      defaults[meta.type_name] = { itemId: 'body', variant: 'light', name: 'Body color (light)' };
    }
    if (metadata['heads_human_male']) {
      const meta = metadata['heads_human_male'];
      defaults[meta.type_name] = { itemId: 'heads_human_male', variant: 'light', name: 'Human male (light)' };
    }
    if (metadata['face_neutral']) {
      const meta = metadata['face_neutral'];
      defaults[meta.type_name] = { itemId: 'face_neutral', variant: 'light', name: 'Neutral (light)' };
    }
    setSelections(defaults);
  }, [metadataReady]);

  // Re-render whenever selections or bodyType change
  useEffect(() => {
    if (!metadataReady || !canvasRef.current) return;
    setIsRendering(true);
    renderCharacterToCanvas(canvasRef.current, selections, bodyType)
      .finally(() => setIsRendering(false));
  }, [selections, bodyType, metadataReady]);

  const selectItem = useCallback((itemId: string, variant: string) => {
    const metadata: Record<string, ItemMeta> = (window as any).itemMetadata;
    const meta = metadata?.[itemId];
    if (!meta) return;

    const group = meta.type_name;
    setSelections(prev => {
      const next = { ...prev, [group]: { itemId, variant, name: `${meta.name} (${variant})` } };

      // Auto-match body color
      if (meta.matchBodyColor || (meta as any).match_body_color) {
        for (const [g, sel] of Object.entries(next)) {
          const m2 = metadata[sel.itemId];
          if (!m2) continue;
          if ((m2.matchBodyColor || (m2 as any).match_body_color) && m2.variants?.includes(variant)) {
            next[g] = { ...sel, variant, name: `${m2.name} (${variant})` };
          }
        }
      }
      return next;
    });
  }, []);

  const deselectItem = useCallback((group: string) => {
    setSelections(prev => {
      const next = { ...prev };
      delete next[group];
      return next;
    });
  }, []);

  const resetSelections = useCallback(() => {
    setSelections({});
  }, []);

  return {
    metadataReady,
    selections,
    bodyType,
    setBodyType,
    selectItem,
    deselectItem,
    resetSelections,
    isRendering,
    canvasRef,
  };
}

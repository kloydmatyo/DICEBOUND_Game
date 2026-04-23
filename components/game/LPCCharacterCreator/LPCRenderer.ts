// Ported from Universal-LPC-Spritesheet-Character-Generator/sources/canvas/renderer.js
// Stripped of all Mithril dependencies — pure canvas logic

import { LPCSelections, BodyType, ItemMeta } from './types';

const FRAME_SIZE = 64;
const SHEET_WIDTH = 832;
const SHEET_HEIGHT = 3456;

const ANIMATION_OFFSETS: Record<string, number> = {
  spellcast: 0,
  thrust: 4 * FRAME_SIZE,
  walk: 8 * FRAME_SIZE,
  slash: 12 * FRAME_SIZE,
  shoot: 16 * FRAME_SIZE,
  hurt: 20 * FRAME_SIZE,
  climb: 21 * FRAME_SIZE,
  idle: 22 * FRAME_SIZE,
  jump: 26 * FRAME_SIZE,
  sit: 30 * FRAME_SIZE,
  emote: 34 * FRAME_SIZE,
  run: 38 * FRAME_SIZE,
  combat_idle: 42 * FRAME_SIZE,
  backslash: 46 * FRAME_SIZE,
  halfslash: 50 * FRAME_SIZE,
};

const imageCache: Record<string, HTMLImageElement> = {};

function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache[src]) return Promise.resolve(imageCache[src]);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imageCache[src] = img; resolve(img); };
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

function variantToFilename(variant: string): string {
  return variant.replaceAll(' ', '_');
}

function es6DynamicTemplate(template: string, vars: Record<string, string | undefined>): string {
  return template.replace(/\${(.*?)}/g, (_, g) => vars[g] ?? `\${${g}}`);
}

function replaceInPath(path: string, selections: LPCSelections): string {
  if (!path.includes('${')) return path;
  const vars: Record<string, string> = {};
  for (const [group, sel] of Object.entries(selections)) {
    vars[group] = sel.name.split(' (')[0].replaceAll(' ', '_');
  }
  return es6DynamicTemplate(path, vars);
}

function getSpritePath(
  meta: ItemMeta,
  variant: string,
  bodyType: BodyType,
  animName: string,
  layerNum: number,
  selections: LPCSelections
): string | null {
  const layer = meta.layers?.[`layer_${layerNum}`];
  if (!layer) return null;
  let basePath = (layer as any)[bodyType];
  if (!basePath) return null;
  if (basePath.includes('${')) basePath = replaceInPath(basePath, selections);
  const animFolder = animName === 'combat_idle' ? 'combat_idle'
    : animName === 'backslash' ? 'backslash'
    : animName === 'halfslash' ? 'halfslash'
    : animName;
  const variantFile = variantToFilename(variant);
  const base = process.env.NEXT_PUBLIC_SPRITES_BASE_URL || '/spritesheets';
  return `${base}/${basePath}${animFolder}/${variantFile}.png`;
}

function animSupported(meta: ItemMeta, animName: string): boolean {
  if (!meta.animations || meta.animations.length === 0) return false;
  if (animName === 'combat_idle') return meta.animations.includes('combat');
  if (animName === 'backslash') return meta.animations.includes('1h_slash') || meta.animations.includes('1h_backslash');
  if (animName === 'halfslash') return meta.animations.includes('1h_halfslash');
  return meta.animations.includes(animName);
}

export async function renderCharacterToCanvas(
  canvas: HTMLCanvasElement,
  selections: LPCSelections,
  bodyType: BodyType
): Promise<void> {
  const metadata: Record<string, ItemMeta> = (window as any).itemMetadata;
  if (!metadata) return;

  canvas.width = SHEET_WIDTH;
  canvas.height = SHEET_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, SHEET_WIDTH, SHEET_HEIGHT);

  // Build draw list
  type DrawItem = { spritePath: string; zPos: number; yPos: number };
  const drawList: DrawItem[] = [];

  for (const selection of Object.values(selections)) {
    const { itemId, variant } = selection;
    const meta = metadata[itemId];
    if (!meta) continue;
    if (!meta.required.includes(bodyType)) continue;

    for (let layerNum = 1; layerNum < 10; layerNum++) {
      const layer = meta.layers?.[`layer_${layerNum}`];
      if (!layer) break;
      if (layer.custom_animation) continue; // skip custom animations for now

      const zPos = layer.zPos ?? 100;

      for (const [animName, yPos] of Object.entries(ANIMATION_OFFSETS)) {
        if (!animSupported(meta, animName)) continue;
        const spritePath = getSpritePath(meta, variant, bodyType, animName, layerNum, selections);
        if (!spritePath) continue;
        drawList.push({ spritePath, zPos, yPos });
      }
    }
  }

  drawList.sort((a, b) => a.zPos - b.zPos);

  // Load all images in parallel, draw in order
  const loaded = await Promise.all(
    drawList.map(item =>
      loadImage(item.spritePath)
        .then(img => ({ item, img, ok: true }))
        .catch(() => ({ item, img: null as any, ok: false }))
    )
  );

  for (const { item, img, ok } of loaded) {
    if (ok && img) ctx.drawImage(img, 0, item.yPos);
  }
}

// Extract the south-facing (front) walk frame as a data URL for preview
export function extractWalkPreviewFrame(
  canvas: HTMLCanvasElement,
  frameIndex: number = 1
): string {
  const frameSize = FRAME_SIZE;
  const walkRowStart = 8; // walk starts at row 8
  const SOUTH_DIR = 2;   // 0=N, 1=W, 2=S, 3=E

  const out = document.createElement('canvas');
  out.width = frameSize;
  out.height = frameSize;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(
    canvas,
    frameIndex * frameSize, (walkRowStart + SOUTH_DIR) * frameSize, frameSize, frameSize,
    0, 0, frameSize, frameSize
  );
  return out.toDataURL('image/png');
}

/**
 * Extract a single animation row (one direction) as a horizontal sprite strip.
 * Used by PlayerSprite to animate the character in-game.
 *
 * @param sheetDataUrl - full spritesheet data URL
 * @param animName     - animation name (e.g. 'walk', 'slash', 'idle', 'hurt')
 * @param direction    - 0=up, 1=left, 2=down, 3=right
 * @param frameCount   - number of frames in the strip (default 9 for walk, 13 for sheet width)
 */
export function extractAnimationStrip(
  sheetDataUrl: string,
  animName: string,
  direction: number = 2,
  frameCount: number = 9
): Promise<string> {
  const animYOffset = ANIMATION_OFFSETS[animName];
  if (animYOffset === undefined) return Promise.resolve('');

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const rowY = animYOffset + direction * FRAME_SIZE;
      const out = document.createElement('canvas');
      out.width = FRAME_SIZE * frameCount;
      out.height = FRAME_SIZE;
      const ctx = out.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        img,
        0, rowY, FRAME_SIZE * frameCount, FRAME_SIZE,
        0, 0, FRAME_SIZE * frameCount, FRAME_SIZE
      );
      resolve(out.toDataURL('image/png'));
    };
    img.onerror = () => resolve('');
    img.src = sheetDataUrl;
  });
}

/**
 * Export the full rendered spritesheet as a data URL.
 */
export function exportFullSheet(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

export { FRAME_SIZE, SHEET_WIDTH, SHEET_HEIGHT, ANIMATION_OFFSETS };

import { sanitizeExportFilename } from './bannerLayout';

export type WatermarkFormat = 'clip-wide' | 'youtube-square';
export type WatermarkStyle =
  | 'hanko-seal'
  | 'crimson-moon'
  | 'broadcast-bug'
  | 'kinetic-slash';
export type WatermarkTone = 'white-accent' | 'pure-white' | 'pure-black';
export type WatermarkCorner =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';
export type WatermarkPreviewBackdrop = 'video' | 'checkerboard';

export interface WatermarkConfig {
  format: WatermarkFormat;
  style: WatermarkStyle;
  tone: WatermarkTone;
  corner: WatermarkCorner;
  customLabel: string;
  monogram: string;
  subLabel: string;
  accentColor: string;
  opacity: number; // 0.2 to 1.0
  scale: number; // 0.6 to 1.3
}

export interface WatermarkExportSpec {
  width: number;
  height: number;
  label: string;
  suffix: string;
}

export interface WatermarkPlacementRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function clampWatermarkOpacity(value: number): number {
  if (!Number.isFinite(value)) return 0.8;
  return Math.max(0.2, Math.min(1, Math.round(value * 100) / 100));
}

export function clampWatermarkScale(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(0.6, Math.min(1.3, Math.round(value * 100) / 100));
}

/**
 * Returns exact pixel export dimensions for YouTube Branding Watermark (150x150 or 512x512 HD)
 * or Wide Transparent Video Clip Stamp (1200x320).
 */
export function getWatermarkExportSpec(
  format: WatermarkFormat,
  highResSquare: boolean = false
): WatermarkExportSpec {
  if (format === 'youtube-square') {
    return highResSquare
      ? {
          width: 512,
          height: 512,
          label: '512 × 512 px HD Square PNG',
          suffix: 'watermark_badge_512x512',
        }
      : {
          width: 150,
          height: 150,
          label: '150 × 150 px YouTube Studio PNG',
          suffix: 'youtube_watermark_150x150',
        };
  }

  return {
    width: 1200,
    height: 320,
    label: '1200 × 320 px Transparent Clip Stamp PNG',
    suffix: 'clip_watermark_1200x320',
  };
}

/**
 * Computes safe corner placement coordinates inside a 16:9 video preview frame
 * so the watermark stays clear of YouTube's bottom scrub bar and frame edges.
 */
export function computeWatermarkPlacement(
  frameWidth: number,
  frameHeight: number,
  format: WatermarkFormat,
  corner: WatermarkCorner,
  scale: number = 1
): WatermarkPlacementRect {
  const safeScale = clampWatermarkScale(scale);
  const marginX = Math.round(frameWidth * 0.036);
  const marginTop = Math.round(frameHeight * 0.05);
  // Extra bottom margin clears YouTube player scrub bar
  const marginBottom = Math.round(frameHeight * 0.095);

  const baseW =
    format === 'youtube-square'
      ? Math.round(frameWidth * 0.095 * safeScale)
      : Math.round(frameWidth * 0.255 * safeScale);

  const baseH =
    format === 'youtube-square'
      ? baseW
      : Math.round(baseW * (320 / 1200));

  const clampedW = Math.min(baseW, Math.max(40, frameWidth - marginX * 2));
  const clampedH = Math.min(
    baseH,
    Math.max(24, frameHeight - marginTop - marginBottom)
  );

  const isRight = corner === 'top-right' || corner === 'bottom-right';
  const isBottom = corner === 'bottom-left' || corner === 'bottom-right';

  const x = isRight ? frameWidth - marginX - clampedW : marginX;
  const y = isBottom ? frameHeight - marginBottom - clampedH : marginTop;

  return {
    x: Math.max(marginX, x),
    y: Math.max(marginTop, y),
    width: clampedW,
    height: clampedH,
  };
}

export function sanitizeWatermarkFilename(
  handle: string,
  format: WatermarkFormat,
  highResSquare: boolean = false
): string {
  const spec = getWatermarkExportSpec(format, highResSquare);
  return sanitizeExportFilename(handle, spec.suffix);
}

export function createDefaultWatermarkConfig(
  handle: string = '@MaCo_original',
  accentColor: string = '#E11D48'
): WatermarkConfig {
  return {
    format: 'clip-wide',
    style: 'hanko-seal',
    tone: 'white-accent',
    corner: 'bottom-right',
    customLabel: handle,
    monogram: 'MC',
    subLabel: 'ORIGINAL',
    accentColor,
    opacity: 0.82,
    scale: 1,
  };
}

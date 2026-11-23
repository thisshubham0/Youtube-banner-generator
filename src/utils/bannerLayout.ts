export const YT_BANNER_WIDTH = 2560;
export const YT_BANNER_HEIGHT = 1440;
export const YT_DESKTOP_STRIP_HEIGHT = 423;
export const YT_TABLET_WIDTH = 1855;
export const YT_SAFE_WIDTH = 1546;
export const YT_SAFE_HEIGHT = 423;

export type TypographyStyle = 'editorial-impact' | 'cinema-serif' | 'kinetic-street';
export type LayoutAlignment = 'center' | 'left' | 'split';
export type PreviewMode = 'studio' | 'desktop' | 'mobile' | 'tv';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface YouTubeSafeZones {
  tv: Rect;
  desktop: Rect;
  tablet: Rect;
  safe: Rect;
}

export interface BannerConfig {
  editionId: string;
  customImageUrl: string | null;
  handle: string;
  tagline: string;
  japaneseSubtitle: string;
  showJapaneseSubtitle: boolean;
  scheduleNote: string;
  showScheduleNote: boolean;
  typographyStyle: TypographyStyle;
  alignment: LayoutAlignment;
  accentColor: string;
  zoom: number; // 1.0 to 1.6
  offsetX: number; // -50 to 50 (% of extra overflow)
  offsetY: number; // -50 to 50 (% of extra overflow)
  scrimOpacity: number; // 0 to 0.9
  grainIntensity: number; // 0 to 1
  showCinemaMarks: boolean;
}

export interface CoverTransform {
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

export interface TypographyMetrics {
  handleFontSize: number;
  taglineFontSize: number;
  jpFontSize: number;
  scheduleFontSize: number;
  anchorX: number;
  centerY: number;
  textAlign: 'center' | 'left';
  maxTextWidth: number;
}

export interface BannerValidationResult {
  valid: boolean;
  handleError: string | null;
  taglineError: string | null;
}

/**
 * Computes exact pixel rectangles for all YouTube Channel Art display zones
 * scaled proportionally to any target canvas width/height (default 2560x1440).
 */
export function getYouTubeSafeZones(
  canvasWidth: number = YT_BANNER_WIDTH,
  canvasHeight: number = YT_BANNER_HEIGHT
): YouTubeSafeZones {
  const scaleX = canvasWidth / YT_BANNER_WIDTH;
  const scaleY = canvasHeight / YT_BANNER_HEIGHT;

  const stripHeight = YT_DESKTOP_STRIP_HEIGHT * scaleY;
  const stripY = (canvasHeight - stripHeight) / 2;

  const tabletWidth = YT_TABLET_WIDTH * scaleX;
  const tabletX = (canvasWidth - tabletWidth) / 2;

  const safeWidth = YT_SAFE_WIDTH * scaleX;
  const safeX = (canvasWidth - safeWidth) / 2;

  return {
    tv: { x: 0, y: 0, width: canvasWidth, height: canvasHeight },
    desktop: { x: 0, y: stripY, width: canvasWidth, height: stripHeight },
    tablet: { x: tabletX, y: stripY, width: tabletWidth, height: stripHeight },
    safe: { x: safeX, y: stripY, width: safeWidth, height: stripHeight },
  };
}

/**
 * Computes object-cover draw coordinates with zoom and pan percentages
 * clamped so the image always completely covers the destination frame.
 */
export function computeCoverTransform(
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number,
  zoom: number = 1,
  offsetXPercent: number = 0,
  offsetYPercent: number = 0
): CoverTransform {
  const safeZoom = Math.max(1, Math.min(2, zoom));
  const clampedX = Math.max(-50, Math.min(50, offsetXPercent));
  const clampedY = Math.max(-50, Math.min(50, offsetYPercent));

  if (srcWidth <= 0 || srcHeight <= 0 || dstWidth <= 0 || dstHeight <= 0) {
    return { dx: 0, dy: 0, dw: dstWidth, dh: dstHeight };
  }

  const baseScale = Math.max(dstWidth / srcWidth, dstHeight / srcHeight);
  const finalScale = baseScale * safeZoom;

  const dw = srcWidth * finalScale;
  const dh = srcHeight * finalScale;

  const overflowX = Math.max(0, dw - dstWidth);
  const overflowY = Math.max(0, dh - dstHeight);

  const dx = overflowX === 0 ? 0 : -overflowX * ((clampedX + 50) / 100);
  const dy = overflowY === 0 ? 0 : -overflowY * ((clampedY + 50) / 100);

  return { dx, dy, dw, dh };
}

/**
 * Computes adaptive typography sizes and anchor coordinates so the channel handle
 * and metadata stay cleanly inside the 1546x423 all-device safe zone.
 */
export function computeTypographyMetrics(
  handle: string,
  alignment: LayoutAlignment,
  safeRect: Rect
): TypographyMetrics {
  const scale = safeRect.width / YT_SAFE_WIDTH;
  const trimmedHandle = handle.trim();
  const charCount = Math.max(1, trimmedHandle.length);

  // Base handle size for ~14 chars ("@MaCo_original") is 118px at 2560w;
  // gently scale down for longer handles so it never clips outside the safe box.
  const baseHandleAtFull =
    charCount <= 14
      ? 118
      : charCount <= 20
        ? Math.round(118 * (14 / charCount) * 1.08)
        : Math.max(64, Math.round(118 * (14 / charCount) * 1.12));

  const handleFontSize = Math.round(baseHandleAtFull * scale);
  const taglineFontSize = Math.round(27 * scale);
  const jpFontSize = Math.round(23 * scale);
  const scheduleFontSize = Math.round(22 * scale);

  const horizontalPadding = Math.round(84 * scale);
  const maxTextWidth = Math.max(200, safeRect.width - horizontalPadding * 2);
  const centerY = safeRect.y + safeRect.height / 2;

  if (alignment === 'left') {
    return {
      handleFontSize,
      taglineFontSize,
      jpFontSize,
      scheduleFontSize,
      anchorX: safeRect.x + horizontalPadding,
      centerY,
      textAlign: 'left',
      maxTextWidth,
    };
  }

  if (alignment === 'split') {
    return {
      handleFontSize: Math.round(handleFontSize * 0.94),
      taglineFontSize,
      jpFontSize,
      scheduleFontSize,
      anchorX: safeRect.x + horizontalPadding,
      centerY,
      textAlign: 'left',
      maxTextWidth: Math.round(maxTextWidth * 0.72),
    };
  }

  return {
    handleFontSize,
    taglineFontSize,
    jpFontSize,
    scheduleFontSize,
    anchorX: safeRect.x + safeRect.width / 2,
    centerY,
    textAlign: 'center',
    maxTextWidth,
  };
}

/**
 * Validates required banner fields without silently substituting defaults.
 */
export function validateBannerInputs(
  handle: string,
  tagline: string
): BannerValidationResult {
  const cleanHandle = handle.trim();
  const cleanTagline = tagline.trim();

  let handleError: string | null = null;
  let taglineError: string | null = null;

  if (!cleanHandle) {
    handleError = 'Channel handle is required for export.';
  } else if (cleanHandle.length > 32) {
    handleError = 'Keep handle at 32 characters or fewer so it fits mobile screens.';
  }

  if (cleanTagline.length > 64) {
    taglineError = 'Tagline should be 64 characters or fewer.';
  }

  return {
    valid: !handleError && !taglineError,
    handleError,
    taglineError,
  };
}

/**
 * Generates a clean filesystem-safe PNG filename for YouTube banner exports.
 */
export function sanitizeExportFilename(handle: string, suffix: string): string {
  const stripped = handle
    .trim()
    .replace(/^@+/, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const base = stripped.length > 0 ? stripped : 'youtube_channel';
  return `${base}_${suffix}.png`;
}

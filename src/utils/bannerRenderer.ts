import {
  BannerConfig,
  YT_BANNER_HEIGHT,
  YT_BANNER_WIDTH,
  YT_DESKTOP_STRIP_HEIGHT,
  computeCoverTransform,
  computeTypographyMetrics,
  getYouTubeSafeZones,
  sanitizeExportFilename,
} from './bannerLayout';

let cachedGrainCanvas: HTMLCanvasElement | null = null;

function getGrainPatternCanvas(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (cachedGrainCanvas) return cachedGrainCanvas;

  const size = 160;
  const off = document.createElement('canvas');
  off.width = size;
  off.height = size;
  const ctx = off.getContext('2d');
  if (!ctx) return null;

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;
  // Deterministic pseudo-random PRNG so grain never flickers across redraws
  let seed = 133791;
  for (let i = 0; i < data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const val = (seed >>> 24) & 0xff;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    data[i + 3] = 28;
  }
  ctx.putImageData(imgData, 0, 0);
  cachedGrainCanvas = off;
  return off;
}

function drawTrackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacingPx: number,
  align: 'center' | 'left' | 'right' = 'center'
) {
  if (!text) return;
  const chars = Array.from(text);
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const totalWidth =
    widths.reduce((acc, w) => acc + w, 0) +
    Math.max(0, chars.length - 1) * letterSpacingPx;

  let cursorX = x;
  if (align === 'center') {
    cursorX = x - totalWidth / 2;
  } else if (align === 'right') {
    cursorX = x - totalWidth;
  }

  ctx.textAlign = 'left';
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], cursorX, y);
    cursorX += widths[i] + letterSpacingPx;
  }
}

function getHandleFontSpec(style: BannerConfig['typographyStyle'], fontSize: number): string {
  switch (style) {
    case 'cinema-serif':
      return `700 ${fontSize}px "Playfair Display", Georgia, serif`;
    case 'kinetic-street':
      return `800 ${fontSize}px "Bricolage Grotesque", "Outfit", sans-serif`;
    case 'editorial-impact':
    default:
      return `800 ${fontSize}px "Outfit", "Bricolage Grotesque", sans-serif`;
  }
}

export interface RenderOptions {
  showSafeZones?: boolean;
  cropToDesktopStrip?: boolean;
}

/**
 * Renders the complete YouTube channel banner onto a target HTMLCanvasElement.
 * Works cleanly at preview scale (e.g. 1280x720) and full YouTube export spec (2560x1440).
 */
export function renderBannerToCanvas(
  canvas: HTMLCanvasElement,
  config: BannerConfig,
  image: HTMLImageElement | null,
  options: RenderOptions = {}
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const scale = width / YT_BANNER_WIDTH;
  const zones = getYouTubeSafeZones(width, height);

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // 1. Rich obsidian fallback backdrop
  const fallbackGrad = ctx.createLinearGradient(0, 0, width, height);
  fallbackGrad.addColorStop(0, '#09090B');
  fallbackGrad.addColorStop(0.5, '#141418');
  fallbackGrad.addColorStop(1, '#09090B');
  ctx.fillStyle = fallbackGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Background anime artwork with cover transform + pan/zoom
  if (image && image.complete && image.naturalWidth > 0) {
    const transform = computeCoverTransform(
      image.naturalWidth,
      image.naturalHeight,
      width,
      height,
      config.zoom,
      config.offsetX,
      config.offsetY
    );
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, transform.dx, transform.dy, transform.dw, transform.dh);
  }

  // 3. Measured cinematic contrast scrim & vignette for guaranteed WCAG legibility
  const scrimAlpha = Math.max(0, Math.min(0.9, config.scrimOpacity));

  // Subtle top/bottom vertical vignette for TV framing
  const verticalGrad = ctx.createLinearGradient(0, 0, 0, height);
  verticalGrad.addColorStop(0, `rgba(9, 9, 11, ${Math.min(0.82, scrimAlpha + 0.22)})`);
  verticalGrad.addColorStop(0.32, `rgba(9, 9, 11, ${scrimAlpha * 0.45})`);
  verticalGrad.addColorStop(0.5, `rgba(9, 9, 11, ${scrimAlpha * 0.62})`);
  verticalGrad.addColorStop(0.68, `rgba(9, 9, 11, ${scrimAlpha * 0.45})`);
  verticalGrad.addColorStop(1, `rgba(9, 9, 11, ${Math.min(0.86, scrimAlpha + 0.26)})`);
  ctx.fillStyle = verticalGrad;
  ctx.fillRect(0, 0, width, height);

  // Focused soft radial scrim behind the typography anchor
  const typo = computeTypographyMetrics(config.handle, config.alignment, zones.safe);
  const radialCenterX =
    config.alignment === 'center' ? width / 2 : zones.safe.x + zones.safe.width * 0.34;
  const radialCenterY = zones.safe.y + zones.safe.height / 2;
  const radialGrad = ctx.createRadialGradient(
    radialCenterX,
    radialCenterY,
    zones.safe.height * 0.15,
    radialCenterX,
    radialCenterY,
    zones.safe.width * 0.65
  );
  radialGrad.addColorStop(0, `rgba(9, 9, 11, ${Math.min(0.85, scrimAlpha * 0.85)})`);
  radialGrad.addColorStop(0.6, `rgba(9, 9, 11, ${scrimAlpha * 0.38})`);
  radialGrad.addColorStop(1, 'rgba(9, 9, 11, 0)');
  ctx.fillStyle = radialGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle accent atmospheric wash along desktop strip edge
  ctx.save();
  ctx.globalAlpha = 0.12;
  const accentWash = ctx.createLinearGradient(0, zones.desktop.y, width, zones.desktop.y + zones.desktop.height);
  accentWash.addColorStop(0, config.accentColor);
  accentWash.addColorStop(0.5, 'transparent');
  accentWash.addColorStop(1, config.accentColor);
  ctx.fillStyle = accentWash;
  ctx.fillRect(0, zones.desktop.y, width, zones.desktop.height);
  ctx.restore();

  // 4. Optional subtle analog anime cel / 35mm film grain
  if (config.grainIntensity > 0) {
    const grainCanvas = getGrainPatternCanvas();
    if (grainCanvas) {
      const pattern = ctx.createPattern(grainCanvas, 'repeat');
      if (pattern) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.55, config.grainIntensity * 0.5);
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    }
  }

  // 5. Optional 35mm cinema registration frame marks inside safe area
  if (config.showCinemaMarks) {
    const padX = Math.round(38 * scale);
    const padY = Math.round(32 * scale);
    const arm = Math.round(28 * scale);
    const left = zones.safe.x + padX;
    const right = zones.safe.x + zones.safe.width - padX;
    const top = zones.safe.y + padY;
    const bottom = zones.safe.y + zones.safe.height - padY;

    ctx.save();
    ctx.strokeStyle = 'rgba(244, 244, 245, 0.36)';
    ctx.lineWidth = Math.max(1.2, 2.2 * scale);

    // 4 crisp viewfinder L-brackets
    ctx.beginPath();
    // Top-left
    ctx.moveTo(left, top + arm);
    ctx.lineTo(left, top);
    ctx.lineTo(left + arm, top);
    // Top-right
    ctx.moveTo(right - arm, top);
    ctx.lineTo(right, top);
    ctx.lineTo(right, top + arm);
    // Bottom-left
    ctx.moveTo(left, bottom - arm);
    ctx.lineTo(left, bottom);
    ctx.lineTo(left + arm, bottom);
    // Bottom-right
    ctx.moveTo(right - arm, bottom);
    ctx.lineTo(right, bottom);
    ctx.lineTo(right, bottom - arm);
    ctx.stroke();

    // Fine accent registration ticks at midpoints
    ctx.strokeStyle = config.accentColor;
    ctx.lineWidth = Math.max(1.5, 3 * scale);
    ctx.beginPath();
    ctx.moveTo(left, typo.centerY - 14 * scale);
    ctx.lineTo(left, typo.centerY + 14 * scale);
    ctx.moveTo(right, typo.centerY - 14 * scale);
    ctx.lineTo(right, typo.centerY + 14 * scale);
    ctx.stroke();
    ctx.restore();
  }

  // 6. Primary Typography Lockup (guaranteed inside 1546x423 all-device safe area)
  ctx.save();
  ctx.textBaseline = 'middle';

  const displayHandle = config.handle.trim();
  const displayTagline = config.tagline.trim();
  const displayJp = config.showJapaneseSubtitle ? config.japaneseSubtitle.trim() : '';
  const displaySchedule = config.showScheduleNote ? config.scheduleNote.trim() : '';

  // Compute balanced vertical rhythm inside the 423px strip
  const hasTop = Boolean(displayJp);
  const hasBottomTagline = Boolean(displayTagline);
  const hasBottomSchedule = Boolean(displaySchedule);

  const handleY =
    typo.centerY +
    (hasTop ? 4 * scale : -4 * scale) -
    (hasBottomSchedule ? 10 * scale : 0);

  // 6a. Japanese editorial kicker above handle
  if (hasTop) {
    const jpY = handleY - typo.handleFontSize * 0.72;
    ctx.font = `600 ${typo.jpFontSize}px "Noto Sans JP", "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = 'rgba(244, 244, 245, 0.88)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 12 * scale;
    ctx.shadowOffsetY = 2 * scale;

    if (typo.textAlign === 'center') {
      drawTrackedText(ctx, displayJp, typo.anchorX, jpY, 5.5 * scale, 'center');
      // Subtle flanking accent dashes
      const jpWidth =
        ctx.measureText(displayJp).width + Math.max(0, displayJp.length - 1) * 5.5 * scale;
      const dashW = 28 * scale;
      const dashGap = 18 * scale;
      ctx.shadowBlur = 0;
      ctx.fillStyle = config.accentColor;
      ctx.fillRect(
        typo.anchorX - jpWidth / 2 - dashGap - dashW,
        jpY - 1.5 * scale,
        dashW,
        3 * scale
      );
      ctx.fillRect(
        typo.anchorX + jpWidth / 2 + dashGap,
        jpY - 1.5 * scale,
        dashW,
        3 * scale
      );
    } else {
      // Accent bar leading Japanese caption
      const barW = 34 * scale;
      ctx.shadowBlur = 0;
      ctx.fillStyle = config.accentColor;
      ctx.fillRect(typo.anchorX, jpY - 1.5 * scale, barW, 3.5 * scale);
      ctx.fillStyle = 'rgba(244, 244, 245, 0.9)';
      drawTrackedText(
        ctx,
        displayJp,
        typo.anchorX + barW + 14 * scale,
        jpY,
        4.5 * scale,
        'left'
      );
    }
  }

  // 6b. Main Channel Handle ("@MaCo_original")
  if (displayHandle) {
    let actualHandleSize = typo.handleFontSize;
    ctx.font = getHandleFontSpec(config.typographyStyle, actualHandleSize);

    // Measure and auto-fit within safe maxTextWidth
    const measuredWidth = ctx.measureText(displayHandle).width;
    if (measuredWidth > typo.maxTextWidth) {
      actualHandleSize = Math.max(
        Math.round(44 * scale),
        Math.floor(actualHandleSize * (typo.maxTextWidth / measuredWidth))
      );
      ctx.font = getHandleFontSpec(config.typographyStyle, actualHandleSize);
    }

    ctx.textAlign = typo.textAlign;

    if (config.typographyStyle === 'kinetic-street') {
      // Crisp hard graphic offset shadow in accent color
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.fillStyle = config.accentColor;
      ctx.fillText(displayHandle, typo.anchorX + 6 * scale, handleY + 6 * scale);

      ctx.shadowColor = 'rgba(0, 0, 0, 0.72)';
      ctx.shadowBlur = 18 * scale;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 6 * scale;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(displayHandle, typo.anchorX, handleY);
    } else if (config.typographyStyle === 'cinema-serif') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 24 * scale;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 6 * scale;
      ctx.fillStyle = '#FAFAFA';
      ctx.fillText(displayHandle, typo.anchorX, handleY);
    } else {
      // Editorial Impact: ultra-crisp white with subtle highlight on leading '@'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.82)';
      ctx.shadowBlur = 22 * scale;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 5 * scale;

      if (displayHandle.startsWith('@') && displayHandle.length > 1) {
        const atChar = '@';
        const rest = displayHandle.slice(1);
        const fullW = ctx.measureText(displayHandle).width;
        const atW = ctx.measureText(atChar).width;
        const startX =
          typo.textAlign === 'center' ? typo.anchorX - fullW / 2 : typo.anchorX;

        ctx.textAlign = 'left';
        ctx.fillStyle = config.accentColor;
        ctx.fillText(atChar, startX, handleY);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(rest, startX + atW, handleY);
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(displayHandle, typo.anchorX, handleY);
      }
    }
  }

  // 6c. Tagline below handle
  if (hasBottomTagline) {
    const taglineY = handleY + typo.handleFontSize * 0.68;
    ctx.font = `600 ${typo.taglineFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = 'rgba(250, 250, 250, 0.96)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 16 * scale;
    ctx.shadowOffsetY = 3 * scale;

    drawTrackedText(
      ctx,
      displayTagline.toUpperCase(),
      typo.anchorX,
      taglineY,
      5 * scale,
      typo.textAlign
    );
  }

  // 6d. Split-mode right-side metadata OR centered schedule line
  if (hasBottomSchedule) {
    ctx.font = `600 ${typo.scheduleFontSize}px "JetBrains Mono", monospace`;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 14 * scale;
    ctx.shadowOffsetY = 3 * scale;

    if (config.alignment === 'split') {
      const rightEdge = zones.safe.x + zones.safe.width - 84 * scale;
      // Right-aligned vertical editorial stack inside the safe area
      ctx.fillStyle = config.accentColor;
      ctx.fillRect(rightEdge - 48 * scale, typo.centerY - 26 * scale, 48 * scale, 3 * scale);

      ctx.fillStyle = 'rgba(244, 244, 245, 0.88)';
      drawTrackedText(
        ctx,
        displaySchedule.toUpperCase(),
        rightEdge,
        typo.centerY + 4 * scale,
        2.5 * scale,
        'right'
      );

      ctx.fillStyle = 'rgba(161, 161, 170, 0.9)';
      drawTrackedText(
        ctx,
        'YOUTUBE CHANNEL',
        rightEdge,
        typo.centerY + 34 * scale,
        3 * scale,
        'right'
      );
    } else {
      const scheduleY =
        handleY + typo.handleFontSize * (hasBottomTagline ? 1.04 : 0.72);
      ctx.fillStyle = config.accentColor;
      drawTrackedText(
        ctx,
        displaySchedule.toUpperCase(),
        typo.anchorX,
        scheduleY,
        4 * scale,
        typo.textAlign
      );
    }
  }

  ctx.restore();

  // 7. Optional YouTube Safe-Zone Overlay Guides (Preview Only, NEVER on export)
  if (options.showSafeZones) {
    ctx.save();

    // Dim top & bottom TV-only regions gently so the Desktop strip stands out
    ctx.fillStyle = 'rgba(9, 9, 11, 0.48)';
    ctx.fillRect(0, 0, width, zones.desktop.y);
    ctx.fillRect(
      0,
      zones.desktop.y + zones.desktop.height,
      width,
      height - (zones.desktop.y + zones.desktop.height)
    );

    // Desktop strip boundary lines
    ctx.strokeStyle = 'rgba(244, 244, 245, 0.35)';
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.setLineDash([8 * scale, 6 * scale]);
    ctx.strokeRect(
      zones.desktop.x + 1,
      zones.desktop.y,
      zones.desktop.width - 2,
      zones.desktop.height
    );

    // Tablet boundary lines
    ctx.strokeStyle = 'rgba(161, 161, 170, 0.45)';
    ctx.strokeRect(
      zones.tablet.x,
      zones.tablet.y,
      zones.tablet.width,
      zones.tablet.height
    );

    // Mobile & Desktop All-Device Safe Area highlight
    ctx.setLineDash([]);
    ctx.strokeStyle = '#E11D48';
    ctx.lineWidth = Math.max(1.5, 2.5 * scale);
    ctx.strokeRect(zones.safe.x, zones.safe.y, zones.safe.width, zones.safe.height);

    // Quiet precision zone labels
    const labelSize = Math.max(11, Math.round(20 * scale));
    ctx.font = `500 ${labelSize}px "JetBrains Mono", monospace`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    // TV label top-left
    ctx.fillStyle = 'rgba(244, 244, 245, 0.72)';
    ctx.fillText('TV FULL CANVAS · 2560 × 1440', 28 * scale, 24 * scale);

    // Desktop label
    ctx.fillStyle = 'rgba(244, 244, 245, 0.8)';
    ctx.fillText(
      'DESKTOP MAX · 2560 × 423',
      28 * scale,
      zones.desktop.y + 16 * scale
    );

    // Safe area label
    ctx.fillStyle = '#FB7185';
    ctx.fillText(
      'TEXT & LOGO SAFE AREA · 1546 × 423',
      zones.safe.x + 18 * scale,
      zones.safe.y - labelSize - 12 * scale
    );

    ctx.restore();
  }

  ctx.restore();
}

function triggerCanvasDownload(canvas: HTMLCanvasElement, filename: string): void {
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports full YouTube 2560x1440 PNG banner with zero guide overlays.
 */
export function exportFullBannerPng(
  config: BannerConfig,
  image: HTMLImageElement | null
): string {
  const offscreen = document.createElement('canvas');
  offscreen.width = YT_BANNER_WIDTH;
  offscreen.height = YT_BANNER_HEIGHT;
  renderBannerToCanvas(offscreen, config, image, { showSafeZones: false });

  const filename = sanitizeExportFilename(config.handle, 'youtube_banner_2560x1440');
  triggerCanvasDownload(offscreen, filename);
  return filename;
}

/**
 * Exports the exact 2560x423 Desktop Banner Strip crop as PNG.
 */
export function exportDesktopStripPng(
  config: BannerConfig,
  image: HTMLImageElement | null
): string {
  const full = document.createElement('canvas');
  full.width = YT_BANNER_WIDTH;
  full.height = YT_BANNER_HEIGHT;
  renderBannerToCanvas(full, config, image, { showSafeZones: false });

  const zones = getYouTubeSafeZones(YT_BANNER_WIDTH, YT_BANNER_HEIGHT);
  const strip = document.createElement('canvas');
  strip.width = YT_BANNER_WIDTH;
  strip.height = YT_DESKTOP_STRIP_HEIGHT;
  const sCtx = strip.getContext('2d');
  if (sCtx) {
    sCtx.drawImage(
      full,
      0,
      zones.desktop.y,
      YT_BANNER_WIDTH,
      YT_DESKTOP_STRIP_HEIGHT,
      0,
      0,
      YT_BANNER_WIDTH,
      YT_DESKTOP_STRIP_HEIGHT
    );
  }

  const filename = sanitizeExportFilename(config.handle, 'desktop_strip_2560x423');
  triggerCanvasDownload(strip, filename);
  return filename;
}

/**
 * Exports the matching 800x800 YouTube channel profile picture PNG.
 */
export async function exportChannelAvatarPng(
  avatarUrl: string,
  handle: string
): Promise<string> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load avatar image'));
    img.src = avatarUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, 800, 800);
  }

  const filename = sanitizeExportFilename(handle, 'youtube_avatar_800x800');
  triggerCanvasDownload(canvas, filename);
  return filename;
}

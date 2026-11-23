import { computeCoverTransform } from './bannerLayout';
import {
  WatermarkConfig,
  WatermarkTone,
  clampWatermarkOpacity,
  computeWatermarkPlacement,
  getWatermarkExportSpec,
  sanitizeWatermarkFilename,
} from './watermarkLayout';

interface TonePalette {
  primary: string;
  secondary: string;
  accent: string;
  sealBg: string;
  sealFg: string;
  shadow: string;
  stroke: string;
}

function getTonePalette(tone: WatermarkTone, accentColor: string): TonePalette {
  if (tone === 'pure-white') {
    return {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.78)',
      accent: '#FFFFFF',
      sealBg: 'rgba(255, 255, 255, 0.94)',
      sealFg: '#09090B',
      shadow: 'rgba(0, 0, 0, 0.65)',
      stroke: 'rgba(255, 255, 255, 0.72)',
    };
  }

  if (tone === 'pure-black') {
    return {
      primary: '#09090B',
      secondary: 'rgba(9, 9, 11, 0.75)',
      accent: '#09090B',
      sealBg: '#09090B',
      sealFg: '#FAFAFA',
      shadow: 'rgba(255, 255, 255, 0.45)',
      stroke: 'rgba(9, 9, 11, 0.75)',
    };
  }

  return {
    primary: '#FFFFFF',
    secondary: 'rgba(244, 244, 245, 0.82)',
    accent: accentColor,
    sealBg: accentColor,
    sealFg: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.75)',
    stroke: 'rgba(255, 255, 255, 0.68)',
  };
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawTrackedLeft(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number
) {
  let cursor = x;
  ctx.textAlign = 'left';
  for (const ch of Array.from(text)) {
    ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + spacing;
  }
}

function drawSquareWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: WatermarkConfig,
  palette: TonePalette
) {
  const s = Math.min(width, height);
  const cx = width / 2;
  const cy = height / 2;
  const monogram = (config.monogram.trim() || 'MC').slice(0, 3).toUpperCase();
  const handleShort = (config.customLabel.trim() || '@MaCo_original').slice(0, 18);
  const sub = (config.subLabel.trim() || 'ORIGINAL').slice(0, 12).toUpperCase();

  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  if (config.style === 'hanko-seal') {
    const pad = s * 0.08;
    const box = s - pad * 2;
    const radius = s * 0.14;

    ctx.shadowColor = palette.shadow;
    ctx.shadowBlur = s * 0.06;
    ctx.shadowOffsetY = s * 0.02;

    // Outer vermilion hanko stamp square
    drawRoundedRectPath(ctx, pad, pad, box, box, radius);
    ctx.fillStyle = palette.sealBg;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Inner engraved frame border
    const innerPad = pad + s * 0.065;
    const innerBox = s - innerPad * 2;
    drawRoundedRectPath(ctx, innerPad, innerPad, innerBox, innerBox, radius * 0.65);
    ctx.strokeStyle = palette.sealFg;
    ctx.lineWidth = Math.max(2, s * 0.026);
    ctx.stroke();

    // Bold monogram
    ctx.fillStyle = palette.sealFg;
    ctx.font = `800 ${Math.round(s * 0.34)}px "Bricolage Grotesque", "Outfit", sans-serif`;
    ctx.fillText(monogram, cx, cy - s * 0.06);

    // Subtle divider & micro label
    ctx.fillRect(cx - s * 0.16, cy + s * 0.16, s * 0.32, Math.max(1.5, s * 0.016));
    ctx.font = `700 ${Math.round(s * 0.095)}px "JetBrains Mono", monospace`;
    ctx.fillText(sub, cx, cy + s * 0.27);
  } else if (config.style === 'crimson-moon') {
    const r = s * 0.42;

    ctx.shadowColor = palette.shadow;
    ctx.shadowBlur = s * 0.07;

    // Translucent dark disc for crisp contrast over any video frame
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle =
      config.tone === 'pure-black'
        ? 'rgba(255, 255, 255, 0.72)'
        : 'rgba(9, 9, 11, 0.78)';
    ctx.fill();

    ctx.shadowBlur = 0;

    // Outer moon ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = Math.max(3, s * 0.045);
    ctx.stroke();

    // Inner crescent arc highlight
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.82, -Math.PI * 0.75, Math.PI * 0.35);
    ctx.strokeStyle = palette.stroke;
    ctx.lineWidth = Math.max(1.5, s * 0.016);
    ctx.stroke();

    // Monogram
    ctx.fillStyle = palette.primary;
    ctx.font = `800 ${Math.round(s * 0.33)}px "Outfit", sans-serif`;
    ctx.fillText(monogram, cx, cy - s * 0.05);

    ctx.fillStyle = palette.accent;
    ctx.font = `700 ${Math.round(s * 0.09)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText(sub, cx, cy + s * 0.2);
  } else if (config.style === 'broadcast-bug') {
    const pad = s * 0.1;
    const box = s - pad * 2;
    const arm = s * 0.16;

    ctx.shadowColor = palette.shadow;
    ctx.shadowBlur = s * 0.05;

    // Crisp Japanese TV broadcast corner brackets
    ctx.strokeStyle = palette.primary;
    ctx.lineWidth = Math.max(2, s * 0.028);
    ctx.beginPath();
    // TL
    ctx.moveTo(pad, pad + arm);
    ctx.lineTo(pad, pad);
    ctx.lineTo(pad + arm, pad);
    // TR
    ctx.moveTo(pad + box - arm, pad);
    ctx.lineTo(pad + box, pad);
    ctx.lineTo(pad + box, pad + arm);
    // BL
    ctx.moveTo(pad, pad + box - arm);
    ctx.lineTo(pad, pad + box);
    ctx.lineTo(pad + arm, pad + box);
    // BR
    ctx.moveTo(pad + box - arm, pad + box);
    ctx.lineTo(pad + box, pad + box);
    ctx.lineTo(pad + box, pad + box - arm);
    ctx.stroke();

    // Accent top bar
    ctx.fillStyle = palette.accent;
    ctx.fillRect(cx - s * 0.14, pad + s * 0.13, s * 0.28, Math.max(2, s * 0.025));

    // Monogram
    ctx.fillStyle = palette.primary;
    ctx.font = `800 ${Math.round(s * 0.34)}px "Outfit", sans-serif`;
    ctx.fillText(monogram, cx, cy + s * 0.02);

    ctx.fillStyle = palette.secondary;
    ctx.font = `600 ${Math.round(s * 0.085)}px "JetBrains Mono", monospace`;
    ctx.fillText(sub, cx, pad + box - s * 0.13);
  } else {
    // kinetic-slash square
    ctx.shadowColor = palette.shadow;
    ctx.shadowBlur = s * 0.06;

    // Diagonal crimson slash behind monogram
    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = Math.max(4, s * 0.085);
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(s * 0.14, s * 0.84);
    ctx.lineTo(s * 0.86, s * 0.16);
    ctx.stroke();
    ctx.restore();

    // Hard offset monogram
    const fontSize = Math.round(s * 0.38);
    ctx.font = `800 ${fontSize}px "Bricolage Grotesque", sans-serif`;
    ctx.fillStyle =
      config.tone === 'pure-black'
        ? 'rgba(255, 255, 255, 0.8)'
        : 'rgba(9, 9, 11, 0.85)';
    ctx.fillText(monogram, cx + s * 0.03, cy + s * 0.03);

    ctx.fillStyle = palette.primary;
    ctx.fillText(monogram, cx, cy);

    // Compact bottom handle tag
    ctx.font = `700 ${Math.round(s * 0.085)}px "JetBrains Mono", monospace`;
    ctx.fillStyle = palette.primary;
    const compact = handleShort.length > 14 ? `${handleShort.slice(0, 14)}` : handleShort;
    ctx.fillText(compact, cx, s * 0.88);
  }

  ctx.restore();
}

function drawWideWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: WatermarkConfig,
  palette: TonePalette
) {
  const handle = config.customLabel.trim() || '@MaCo_original';
  const monogram = (config.monogram.trim() || 'MC').slice(0, 3).toUpperCase();
  const sub = (config.subLabel.trim() || 'ORIGINAL').slice(0, 24).toUpperCase();
  const scale = height / 320;
  const cy = height / 2;

  ctx.save();
  ctx.textBaseline = 'middle';

  if (config.style === 'hanko-seal') {
    const padX = 48 * scale;
    const sealSize = 154 * scale;
    const sealY = cy - sealSize / 2;

    ctx.shadowColor = palette.shadow;
    ctx.shadowBlur = 22 * scale;
    ctx.shadowOffsetY = 5 * scale;

    // Vermilion Japanese Hanko square seal on left
    drawRoundedRectPath(ctx, padX, sealY, sealSize, sealSize, 22 * scale);
    ctx.fillStyle = palette.sealBg;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    drawRoundedRectPath(
      ctx,
      padX + 12 * scale,
      sealY + 12 * scale,
      sealSize - 24 * scale,
      sealSize - 24 * scale,
      14 * scale
    );
    ctx.strokeStyle = palette.sealFg;
    ctx.lineWidth = 4 * scale;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = palette.sealFg;
    ctx.font = `800 ${Math.round(62 * scale)}px "Bricolage Grotesque", sans-serif`;
    ctx.fillText(monogram, padX + sealSize / 2, cy - 8 * scale);

    ctx.font = `700 ${Math.round(18 * scale)}px "JetBrains Mono", monospace`;
    ctx.fillText('印', padX + sealSize / 2, cy + 44 * scale);

    // Handle typography to the right
    const textX = padX + sealSize + 38 * scale;
    const maxW = width - textX - 42 * scale;
    let handleSize = Math.round(96 * scale);
    ctx.font = `800 ${handleSize}px "Outfit", "Bricolage Grotesque", sans-serif`;
    const measured = ctx.measureText(handle).width;
    if (measured > maxW) {
      handleSize = Math.max(
        Math.round(44 * scale),
        Math.floor(handleSize * (maxW / measured))
      );
      ctx.font = `800 ${handleSize}px "Outfit", "Bricolage Grotesque", sans-serif`;
    }

    ctx.shadowColor = palette.shadow;
    ctx.shadowBlur = 18 * scale;
    ctx.shadowOffsetY = 4 * scale;
    ctx.textAlign = 'left';

    if (handle.startsWith('@') && handle.length > 1 && config.tone === 'white-accent') {
      const atW = ctx.measureText('@').width;
      ctx.fillStyle = palette.accent;
      ctx.fillText('@', textX, cy - 18 * scale);
      ctx.fillStyle = palette.primary;
      ctx.fillText(handle.slice(1), textX + atW, cy - 18 * scale);
    } else {
      ctx.fillStyle = palette.primary;
      ctx.fillText(handle, textX, cy - 18 * scale);
    }

    // Crisp sub-label below
    ctx.font = `600 ${Math.round(24 * scale)}px "JetBrains Mono", monospace`;
    ctx.fillStyle = palette.secondary;
    drawTrackedLeft(ctx, sub, textX + 2 * scale, cy + 52 * scale, 5.5 * scale);
  } else if (config.style === 'crimson-moon') {
    const padX = 56 * scale;
    const r = 74 * scale;
    const moonCx = padX + r;

    ctx.shadowColor = palette.shadow;
    ctx.shadowBlur = 22 * scale;
    ctx.shadowOffsetY = 4 * scale;

    // Moon circle
    ctx.beginPath();
    ctx.arc(moonCx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = palette.accent;
    ctx.fill();

    // Inner crescent cutout effect
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.beginPath();
    ctx.arc(moonCx + r * 0.24, cy - r * 0.08, r * 0.72, 0, Math.PI * 2);
    ctx.fillStyle =
      config.tone === 'pure-black'
        ? 'rgba(255, 255, 255, 0.85)'
        : 'rgba(9, 9, 11, 0.88)';
    ctx.fill();

    // Monogram nestled in crescent
    ctx.textAlign = 'center';
    ctx.fillStyle = palette.primary;
    ctx.font = `800 ${Math.round(42 * scale)}px "Outfit", sans-serif`;
    ctx.fillText(monogram, moonCx + r * 0.14, cy);

    // Editorial Serif handle
    const textX = moonCx + r + 36 * scale;
    const maxW = width - textX - 42 * scale;
    let handleSize = Math.round(96 * scale);
    ctx.font = `700 ${handleSize}px "Playfair Display", Georgia, serif`;
    const measured = ctx.measureText(handle).width;
    if (measured > maxW) {
      handleSize = Math.max(
        Math.round(44 * scale),
        Math.floor(handleSize * (maxW / measured))
      );
      ctx.font = `700 ${handleSize}px "Playfair Display", Georgia, serif`;
    }

    ctx.shadowColor = palette.shadow;
    ctx.shadowBlur = 20 * scale;
    ctx.shadowOffsetY = 4 * scale;
    ctx.textAlign = 'left';
    ctx.fillStyle = palette.primary;
    ctx.fillText(handle, textX, cy - 16 * scale);

    ctx.font = `600 ${Math.round(22 * scale)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = palette.secondary;
    drawTrackedLeft(ctx, sub, textX + 2 * scale, cy + 52 * scale, 6 * scale);
  } else if (config.style === 'broadcast-bug') {
    const padX = 48 * scale;
    const padY = 46 * scale;
    const boxW = width - padX * 2;
    const boxH = height - padY * 2;
    const arm = 34 * scale;

    ctx.shadowColor = palette.shadow;
    ctx.shadowBlur = 16 * scale;
    ctx.shadowOffsetY = 3 * scale;

    // Fine TV broadcast viewfinder corners
    ctx.strokeStyle = palette.stroke;
    ctx.lineWidth = 4 * scale;
    ctx.beginPath();
    // TL
    ctx.moveTo(padX, padY + arm);
    ctx.lineTo(padX, padY);
    ctx.lineTo(padX + arm, padY);
    // TR
    ctx.moveTo(padX + boxW - arm, padY);
    ctx.lineTo(padX + boxW, padY);
    ctx.lineTo(padX + boxW, padY + arm);
    // BL
    ctx.moveTo(padX, padY + boxH - arm);
    ctx.lineTo(padX, padY + boxH);
    ctx.lineTo(padX + arm, padY + boxH);
    // BR
    ctx.moveTo(padX + boxW - arm, padY + boxH);
    ctx.lineTo(padX + boxW, padY + boxH);
    ctx.lineTo(padX + boxW, padY + boxH - arm);
    ctx.stroke();

    // Vertical accent indicator bar
    const barX = padX + 34 * scale;
    ctx.fillStyle = palette.accent;
    ctx.fillRect(barX, cy - 58 * scale, 8 * scale, 116 * scale);

    const textX = barX + 32 * scale;
    const maxW = padX + boxW - textX - 34 * scale;
    let handleSize = Math.round(92 * scale);
    ctx.font = `700 ${handleSize}px "Outfit", sans-serif`;
    const measured = ctx.measureText(handle).width;
    if (measured > maxW) {
      handleSize = Math.max(
        Math.round(44 * scale),
        Math.floor(handleSize * (maxW / measured))
      );
      ctx.font = `700 ${handleSize}px "Outfit", sans-serif`;
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = palette.primary;
    ctx.fillText(handle, textX, cy - 16 * scale);

    ctx.font = `500 ${Math.round(23 * scale)}px "JetBrains Mono", monospace`;
    ctx.fillStyle = palette.secondary;
    drawTrackedLeft(
      ctx,
      `${sub} · アニメクリップ`,
      textX,
      cy + 48 * scale,
      4.5 * scale
    );
  } else {
    // kinetic-slash wide
    const padX = 56 * scale;
    const maxW = width - padX * 2;
    let handleSize = Math.round(112 * scale);
    ctx.font = `800 ${handleSize}px "Bricolage Grotesque", "Outfit", sans-serif`;
    const measured = ctx.measureText(handle).width;
    if (measured > maxW) {
      handleSize = Math.max(
        Math.round(52 * scale),
        Math.floor(handleSize * (maxW / measured))
      );
      ctx.font = `800 ${handleSize}px "Bricolage Grotesque", "Outfit", sans-serif`;
    }

    const textWidth = ctx.measureText(handle).width;
    const startX = (width - textWidth) / 2;

    // Sharp crimson katana slash behind the handle
    ctx.save();
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.moveTo(startX - 24 * scale, cy + 54 * scale);
    ctx.lineTo(startX + textWidth + 32 * scale, cy - 66 * scale);
    ctx.lineTo(startX + textWidth + 36 * scale, cy - 42 * scale);
    ctx.lineTo(startX - 20 * scale, cy + 70 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Graphic offset shadow
    ctx.textAlign = 'center';
    ctx.fillStyle =
      config.tone === 'pure-black'
        ? 'rgba(255, 255, 255, 0.72)'
        : 'rgba(9, 9, 11, 0.9)';
    ctx.fillText(handle, width / 2 + 6 * scale, cy - 8 * scale + 6 * scale);

    ctx.shadowColor = palette.shadow;
    ctx.shadowBlur = 18 * scale;
    ctx.shadowOffsetY = 4 * scale;
    ctx.fillStyle = palette.primary;
    ctx.fillText(handle, width / 2, cy - 8 * scale);

    // Compact tracked sub-label
    ctx.font = `700 ${Math.round(23 * scale)}px "JetBrains Mono", monospace`;
    ctx.fillStyle = palette.secondary;
    ctx.fillText(sub, width / 2, cy + 68 * scale);
  }

  ctx.restore();
}

/**
 * Renders the watermark onto a transparent canvas (no background fill!).
 */
export function renderWatermarkToCanvas(
  canvas: HTMLCanvasElement,
  config: WatermarkConfig
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.globalAlpha = clampWatermarkOpacity(config.opacity);

  const palette = getTonePalette(config.tone, config.accentColor);
  if (config.format === 'youtube-square') {
    drawSquareWatermark(ctx, canvas.width, canvas.height, config, palette);
  } else {
    drawWideWatermark(ctx, canvas.width, canvas.height, config, palette);
  }

  ctx.restore();
}

/**
 * Renders the live 16:9 anime video clip preview with the transparent watermark
 * placed in the chosen corner, or over a crisp alpha transparency checkerboard.
 */
export function renderWatermarkPreviewScene(
  canvas: HTMLCanvasElement,
  config: WatermarkConfig,
  backdropMode: 'video' | 'checkerboard',
  videoFrameImage: HTMLImageElement | null
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  if (backdropMode === 'checkerboard') {
    // Crisp dark alpha grid showing true PNG transparency
    const tile = 20;
    for (let y = 0; y < h; y += tile) {
      for (let x = 0; x < w; x += tile) {
        const isLight = ((x / tile) + (y / tile)) % 2 === 0;
        ctx.fillStyle = isLight ? '#1C1C21' : '#121216';
        ctx.fillRect(x, y, tile, tile);
      }
    }

    // Render watermark centered at high clarity on the alpha grid
    const spec = getWatermarkExportSpec(config.format, true);
    const off = document.createElement('canvas');
    off.width = spec.width;
    off.height = spec.height;
    renderWatermarkToCanvas(off, config);

    const maxDrawW = w * 0.72;
    const maxDrawH = h * 0.62;
    const fitScale = Math.min(maxDrawW / spec.width, maxDrawH / spec.height);
    const drawW = spec.width * fitScale;
    const drawH = spec.height * fitScale;
    const drawX = (w - drawW) / 2;
    const drawY = (h - drawH) / 2;

    // Subtle dashed trim box showing exact transparent PNG bounds
    ctx.save();
    ctx.strokeStyle = 'rgba(244, 244, 245, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(drawX, drawY, drawW, drawH);
    ctx.restore();

    ctx.drawImage(off, drawX, drawY, drawW, drawH);
    return;
  }

  // Video Frame Mode: draw active anime artwork + subtle YouTube player chrome
  ctx.fillStyle = '#09090B';
  ctx.fillRect(0, 0, w, h);

  if (videoFrameImage && videoFrameImage.complete && videoFrameImage.naturalWidth > 0) {
    const transform = computeCoverTransform(
      videoFrameImage.naturalWidth,
      videoFrameImage.naturalHeight,
      w,
      h,
      1,
      0,
      0
    );
    ctx.drawImage(
      videoFrameImage,
      transform.dx,
      transform.dy,
      transform.dw,
      transform.dh
    );
  }

  // Subtle bottom YouTube player gradient + timeline scrub bar
  const barGrad = ctx.createLinearGradient(0, h * 0.8, 0, h);
  barGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  barGrad.addColorStop(1, 'rgba(0, 0, 0, 0.72)');
  ctx.fillStyle = barGrad;
  ctx.fillRect(0, h * 0.8, w, h * 0.2);

  // Player timeline bar
  const trackX = 24;
  const trackY = h - 38;
  const trackW = w - 48;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
  ctx.fillRect(trackX, trackY, trackW, 4);
  ctx.fillStyle = '#E11D48';
  ctx.fillRect(trackX, trackY, trackW * 0.38, 4);

  // Subtle player timecode
  ctx.fillStyle = 'rgba(244, 244, 245, 0.82)';
  ctx.font = '500 13px "JetBrains Mono", monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText('0:42 / 1:54', trackX, h - 18);

  // Render crisp offscreen transparent watermark & composite into chosen corner
  const spec = getWatermarkExportSpec(config.format, true);
  const off = document.createElement('canvas');
  off.width = spec.width;
  off.height = spec.height;
  renderWatermarkToCanvas(off, config);

  const placement = computeWatermarkPlacement(
    w,
    h,
    config.format,
    config.corner,
    config.scale
  );

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(off, placement.x, placement.y, placement.width, placement.height);
}

/**
 * Exports a genuine alpha-transparent PNG watermark directly to disk.
 */
export function exportTransparentWatermarkPng(
  config: WatermarkConfig,
  highResSquare: boolean = false
): string {
  const spec = getWatermarkExportSpec(config.format, highResSquare);
  const off = document.createElement('canvas');
  off.width = spec.width;
  off.height = spec.height;
  renderWatermarkToCanvas(off, config);

  const filename = sanitizeWatermarkFilename(
    config.customLabel || '@MaCo_original',
    config.format,
    highResSquare
  );
  const dataUrl = off.toDataURL('image/png', 1.0);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return filename;
}

import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Film,
  Grid,
  RotateCcw,
} from 'lucide-react';
import { ACCENT_SWATCHES } from '../data/editions';
import {
  WatermarkConfig,
  WatermarkCorner,
  WatermarkFormat,
  WatermarkPreviewBackdrop,
  WatermarkStyle,
  WatermarkTone,
  getWatermarkExportSpec,
} from '../utils/watermarkLayout';
import {
  exportTransparentWatermarkPng,
  renderWatermarkPreviewScene,
} from '../utils/watermarkRenderer';

interface WatermarkStudioProps {
  config: WatermarkConfig;
  onChange: (patch: Partial<WatermarkConfig>) => void;
  onReset: () => void;
  activeVideoFrame: HTMLImageElement | null;
  imageLoaded: boolean;
  fontsReady: boolean;
}

const STYLE_OPTIONS: { id: WatermarkStyle; name: string; detail: string }[] = [
  {
    id: 'hanko-seal',
    name: 'Hanko Seal',
    detail: 'Japanese vermilion stamp + handle',
  },
  {
    id: 'crimson-moon',
    name: 'Crimson Moon',
    detail: 'Crescent emblem + serif wordmark',
  },
  {
    id: 'broadcast-bug',
    name: 'Broadcast Bug',
    detail: 'Late-night anime TV corner frame',
  },
  {
    id: 'kinetic-slash',
    name: 'Kinetic Slash',
    detail: 'Diagonal blade accent + offset type',
  },
];

const TONE_OPTIONS: { id: WatermarkTone; label: string }[] = [
  { id: 'white-accent', label: 'White + Accent' },
  { id: 'pure-white', label: 'Pure White' },
  { id: 'pure-black', label: 'Pure Black' },
];

const CORNER_OPTIONS: { id: WatermarkCorner; label: string }[] = [
  { id: 'top-left', label: 'Top Left' },
  { id: 'top-right', label: 'Top Right' },
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'bottom-right', label: 'Bottom Right' },
];

export function WatermarkStudio({
  config,
  onChange,
  onReset,
  activeVideoFrame,
  imageLoaded,
  fontsReady,
}: WatermarkStudioProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [backdrop, setBackdrop] = useState<WatermarkPreviewBackdrop>('video');
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    renderWatermarkPreviewScene(canvas, config, backdrop, activeVideoFrame);
  }, [config, backdrop, activeVideoFrame, imageLoaded, fontsReady]);

  const primarySpec = getWatermarkExportSpec(config.format, false);

  const handleExportPrimary = () => {
    const filename = exportTransparentWatermarkPng(config, false);
    setExportFeedback(`Exported ${filename} (${primarySpec.label})`);
  };

  const handleExportHdSquare = () => {
    const filename = exportTransparentWatermarkPng(config, true);
    setExportFeedback(`Exported ${filename} (512 × 512 px HD Square PNG)`);
  };

  const handleFormatChange = (format: WatermarkFormat) => {
    onChange({
      format,
      opacity: format === 'youtube-square' ? 0.92 : 0.82,
    });
    setExportFeedback(null);
  };

  return (
    <section
      id="watermark"
      aria-labelledby="watermark-heading"
      className="border-t border-zinc-800/80 py-14"
    >
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h2
            id="watermark-heading"
            className="font-display text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl [text-wrap:balance]"
          >
            Video Watermark Studio
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Generate transparent PNG watermarks for anime clip edits or YouTube
            Studio&apos;s corner branding badge for{' '}
            <span className="text-zinc-200 font-medium">
              {config.customLabel.trim() || '@MaCo_original'}
            </span>
            .
          </p>
        </div>

        {exportFeedback && (
          <div
            role="status"
            data-testid="watermark-export-status"
            className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400 shrink-0"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{exportFeedback}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left: Live Watermark Preview Canvas */}
        <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-4">
          {/* Toolbar: Format Switcher + Backdrop Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label="Watermark format"
              className="grid w-full grid-cols-2 gap-1 rounded-lg border border-zinc-800 bg-[#111114] p-1 sm:inline-flex sm:w-auto"
            >
              <button
                type="button"
                role="tab"
                aria-selected={config.format === 'clip-wide'}
                onClick={() => handleFormatChange('clip-wide')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] ${
                  config.format === 'clip-wide'
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                Clip Stamp (1200×320)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={config.format === 'youtube-square'}
                onClick={() => handleFormatChange('youtube-square')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] ${
                  config.format === 'youtube-square'
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                YouTube Badge (150×150)
              </button>
            </div>

            <div
              role="group"
              aria-label="Watermark preview backdrop"
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-[#111114] p-1"
            >
              <button
                type="button"
                aria-pressed={backdrop === 'video'}
                onClick={() => setBackdrop('video')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] ${
                  backdrop === 'video'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                <Film className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Video Frame</span>
              </button>
              <button
                type="button"
                aria-pressed={backdrop === 'checkerboard'}
                onClick={() => setBackdrop('checkerboard')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] ${
                  backdrop === 'checkerboard'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                <Grid className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Transparent PNG</span>
              </button>
            </div>
          </div>

          {/* 16:9 Live Preview Viewport */}
          <div
            data-testid="watermark-stage"
            data-watermark-style={config.style}
            data-watermark-format={config.format}
            data-watermark-backdrop={backdrop}
            className="overflow-hidden rounded-xl border border-zinc-800 bg-[#111114]"
          >
            <div className="relative aspect-video w-full bg-[#09090B]">
              <canvas
                ref={previewCanvasRef}
                width={1280}
                height={720}
                data-testid="watermark-canvas"
                aria-label={`Live transparent watermark preview for ${config.customLabel || '@MaCo_original'}`}
                className="block h-full w-full object-contain"
              />
            </div>
          </div>

          {/* Clean Unboxed Specs & Export Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-zinc-400">
              <span className="font-medium text-zinc-200">Alpha PNG</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="font-mono-tabular">{primarySpec.label}</span>
              <span aria-hidden="true" className="hidden sm:inline text-zinc-600">·</span>
              <span className="w-full sm:w-auto">
                Opacity {Math.round(config.opacity * 100)}%
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {config.format === 'youtube-square' && (
                <button
                  type="button"
                  onClick={handleExportHdSquare}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-[#111114] px-3.5 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-500 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48]"
                >
                  <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Download 512×512 HD</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleExportPrimary}
                className="inline-flex items-center gap-2 rounded-lg bg-[#E11D48] px-4 py-2 text-xs font-semibold text-white hover:bg-[#BE123C] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48]"
              >
                <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Download Watermark PNG</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Watermark Controls Panel */}
        <aside
          aria-label="Watermark customization controls"
          className="lg:col-span-4 xl:col-span-4 rounded-xl border border-zinc-800 bg-[#111114] p-5 flex flex-col gap-5"
        >
          <div className="flex items-center justify-between gap-4 pb-3.5 border-b border-zinc-800/80">
            <h3 className="font-display text-base font-semibold text-zinc-100">
              Watermark Controls
            </h3>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] rounded-sm"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>

          {/* 4 Curated Anime Watermark Styles */}
          <div>
            <span className="block text-xs font-medium text-zinc-300">
              Mark Style
            </span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {STYLE_OPTIONS.map((opt) => {
                const selected = config.style === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onChange({ style: opt.id })}
                    className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] ${
                      selected
                        ? 'border-[#E11D48] bg-[#E11D48]/10 text-zinc-100'
                        : 'border-zinc-800 bg-[#09090B] text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xs font-semibold">{opt.name}</span>
                    <span className="mt-0.5 text-[11px] leading-snug text-zinc-400">
                      {opt.detail}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Watermark Text & Monogram */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-2">
              <label
                htmlFor="watermark-label-input"
                className="block text-xs font-medium text-zinc-300"
              >
                Watermark Handle
              </label>
              <input
                id="watermark-label-input"
                type="text"
                value={config.customLabel}
                onChange={(e) => onChange({ customLabel: e.target.value })}
                placeholder="@MaCo_original"
                className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-[#09090B] px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#E11D48]"
              />
            </div>
            <div>
              <label
                htmlFor="watermark-monogram-input"
                className="block text-xs font-medium text-zinc-300"
              >
                Stamp
              </label>
              <input
                id="watermark-monogram-input"
                type="text"
                maxLength={3}
                value={config.monogram}
                onChange={(e) => onChange({ monogram: e.target.value })}
                placeholder="MC"
                className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-[#09090B] px-3 py-2 text-xs text-zinc-100 uppercase focus:outline-none focus:ring-2 focus:ring-[#E11D48]"
              />
            </div>
          </div>

          {/* Tone & Accent */}
          <div>
            <span className="block text-xs font-medium text-zinc-300">
              Color Tone
            </span>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {TONE_OPTIONS.map((tone) => {
                const selected = config.tone === tone.id;
                return (
                  <button
                    key={tone.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onChange({ tone: tone.id })}
                    className={`rounded-lg border py-1.5 px-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] ${
                      selected
                        ? 'border-zinc-200 bg-zinc-100 text-zinc-950'
                        : 'border-zinc-800 bg-[#09090B] text-zinc-400 hover:text-zinc-100'
                    }`}
                  >
                    {tone.label}
                  </button>
                );
              })}
            </div>

            {config.tone === 'white-accent' && (
              <div className="mt-3 flex items-center gap-2">
                {ACCENT_SWATCHES.map((swatch) => {
                  const selected =
                    config.accentColor.toLowerCase() === swatch.hex.toLowerCase();
                  return (
                    <button
                      key={swatch.id}
                      type="button"
                      aria-label={`Select watermark ${swatch.name} accent`}
                      aria-pressed={selected}
                      onClick={() => onChange({ accentColor: swatch.hex })}
                      className={`h-7 w-7 rounded-full border-2 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                        selected
                          ? 'border-white scale-110'
                          : 'border-zinc-800 hover:scale-105'
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Opacity & Preview Corner */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="watermark-opacity-slider"
                  className="font-medium text-zinc-300"
                >
                  Opacity
                </label>
                <span className="font-mono-tabular text-zinc-400">
                  {Math.round(config.opacity * 100)}%
                </span>
              </div>
              <input
                id="watermark-opacity-slider"
                type="range"
                min={0.2}
                max={1}
                step={0.05}
                value={config.opacity}
                onChange={(e) =>
                  onChange({ opacity: parseFloat(e.target.value) })
                }
                className="studio-slider mt-2"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="watermark-scale-slider"
                  className="font-medium text-zinc-300"
                >
                  Frame Size
                </label>
                <span className="font-mono-tabular text-zinc-400">
                  {Math.round(config.scale * 100)}%
                </span>
              </div>
              <input
                id="watermark-scale-slider"
                type="range"
                min={0.6}
                max={1.3}
                step={0.05}
                value={config.scale}
                onChange={(e) => onChange({ scale: parseFloat(e.target.value) })}
                className="studio-slider mt-2"
              />
            </div>
          </div>

          {backdrop === 'video' && (
            <div>
              <span className="block text-xs font-medium text-zinc-300">
                Preview Corner Position
              </span>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {CORNER_OPTIONS.map((corner) => {
                  const selected = config.corner === corner.id;
                  return (
                    <button
                      key={corner.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onChange({ corner: corner.id })}
                      className={`rounded-lg border py-1.5 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] ${
                        selected
                          ? 'border-zinc-200 bg-zinc-100 text-zinc-950'
                          : 'border-zinc-800 bg-[#09090B] text-zinc-400 hover:text-zinc-100'
                      }`}
                    >
                      {corner.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Monitor, Smartphone, Tv, LayoutGrid } from 'lucide-react';
import {
  BannerConfig,
  PreviewMode,
  YT_BANNER_HEIGHT,
  YT_BANNER_WIDTH,
  YT_DESKTOP_STRIP_HEIGHT,
  YT_SAFE_HEIGHT,
  YT_SAFE_WIDTH,
  getYouTubeSafeZones,
} from '../utils/bannerLayout';
import { renderBannerToCanvas } from '../utils/bannerRenderer';
import { MACO_AVATAR_URL } from '../data/editions';

interface BannerStageProps {
  config: BannerConfig;
  activeImage: HTMLImageElement | null;
  imageLoaded: boolean;
  editionName: string;
  previewMode: PreviewMode;
  onPreviewModeChange: (mode: PreviewMode) => void;
  showSafeZones: boolean;
  onToggleSafeZones: () => void;
  fontsReady: boolean;
}

const PREVIEW_TABS: {
  id: PreviewMode;
  label: string;
  shortLabel: string;
  icon: typeof LayoutGrid;
}[] = [
  { id: 'studio', label: 'Studio Canvas', shortLabel: 'Studio', icon: LayoutGrid },
  { id: 'desktop', label: 'YouTube Desktop', shortLabel: 'Desktop', icon: Monitor },
  { id: 'mobile', label: 'YouTube Mobile', shortLabel: 'Mobile', icon: Smartphone },
  { id: 'tv', label: 'YouTube TV', shortLabel: 'TV', icon: Tv },
];

export function BannerStage({
  config,
  activeImage,
  imageLoaded,
  editionName,
  previewMode,
  onPreviewModeChange,
  showSafeZones,
  onToggleSafeZones,
  fontsReady,
}: BannerStageProps) {
  const studioCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const desktopStripCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mobileSafeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  // Re-render active preview canvas whenever config, image, mode, guides, or fonts update
  useEffect(() => {
    if (previewMode === 'studio' || previewMode === 'tv') {
      const canvas = studioCanvasRef.current;
      if (!canvas) return;
      renderBannerToCanvas(canvas, config, activeImage, {
        showSafeZones: previewMode === 'studio' && showSafeZones,
      });
      return;
    }

    // For Desktop & Mobile YouTube header mockups, render full banner offscreen then blit exact crop
    const offscreen = document.createElement('canvas');
    offscreen.width = 1600;
    offscreen.height = 900;
    renderBannerToCanvas(offscreen, config, activeImage, { showSafeZones: false });
    const zones = getYouTubeSafeZones(offscreen.width, offscreen.height);

    if (previewMode === 'desktop') {
      const target = desktopStripCanvasRef.current;
      if (!target) return;
      const ctx = target.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, target.width, target.height);
      ctx.drawImage(
        offscreen,
        zones.desktop.x,
        zones.desktop.y,
        zones.desktop.width,
        zones.desktop.height,
        0,
        0,
        target.width,
        target.height
      );
    } else if (previewMode === 'mobile') {
      const target = mobileSafeCanvasRef.current;
      if (!target) return;
      const ctx = target.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, target.width, target.height);
      ctx.drawImage(
        offscreen,
        zones.safe.x,
        zones.safe.y,
        zones.safe.width,
        zones.safe.height,
        0,
        0,
        target.width,
        target.height
      );
    }
  }, [config, activeImage, imageLoaded, previewMode, showSafeZones, fontsReady]);

  const channelDisplayName =
    config.handle.trim().replace(/^@/, '') || 'MaCo_original';

  return (
    <div className="flex flex-col gap-4">
      {/* Workspace Toolbar: Device Preview Tabs + Safe Guide Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Preview device mode"
          className="grid w-full grid-cols-4 gap-1 rounded-lg border border-zinc-800 bg-[#111114] p-1 sm:inline-flex sm:w-auto"
        >
          {PREVIEW_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = previewMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={tab.label}
                onClick={() => onPreviewModeChange(tab.id)}
                className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] sm:px-3 sm:gap-2 ${
                  active
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {previewMode === 'studio' && (
          <button
            type="button"
            onClick={onToggleSafeZones}
            aria-pressed={showSafeZones}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] ${
              showSafeZones
                ? 'border-[#E11D48]/60 bg-[#E11D48]/10 text-rose-200'
                : 'border-zinc-800 bg-[#111114] text-zinc-400 hover:text-zinc-100'
            }`}
          >
            {showSafeZones ? (
              <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>{showSafeZones ? 'Hide Safe Guides' : 'Show Safe Guides'}</span>
          </button>
        )}
      </div>

      {/* Main Preview Viewport */}
      <div
        data-testid="banner-stage"
        data-preview-mode={previewMode}
        data-edition={config.editionId}
        className="overflow-hidden rounded-xl border border-zinc-800 bg-[#111114]"
      >
        {(previewMode === 'studio' || previewMode === 'tv') && (
          <div className="relative w-full aspect-video bg-[#09090B]">
            <canvas
              ref={studioCanvasRef}
              width={1600}
              height={900}
              data-testid="banner-canvas"
              aria-label={`Live YouTube channel banner preview for ${config.handle || '@MaCo_original'}`}
              className="block h-full w-full object-contain"
            />
            {previewMode === 'tv' && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/80 via-black/30 to-transparent px-6 pb-5 pt-12">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 overflow-hidden rounded-full border border-white/25 bg-zinc-900">
                    {!avatarFailed ? (
                      <img
                        src={MACO_AVATAR_URL}
                        alt="MaCo Original channel avatar"
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarFailed(true)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-zinc-200">
                        MC
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {channelDisplayName}
                    </p>
                    <p className="text-xs text-zinc-300">
                      {config.handle || '@MaCo_original'} · YouTube on TV
                    </p>
                  </div>
                </div>
                <span className="font-mono-tabular text-xs text-zinc-300">
                  2560 × 1440
                </span>
              </div>
            )}
          </div>
        )}

        {previewMode === 'desktop' && (
          <div className="bg-[#0F0F0F] p-5 sm:p-7">
            {/* Realistic YouTube Desktop Channel Page Frame */}
            <div className="mx-auto max-w-[960px]">
              <div className="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950">
                <canvas
                  ref={desktopStripCanvasRef}
                  width={1280}
                  height={Math.round(
                    (1280 * YT_DESKTOP_STRIP_HEIGHT) / YT_BANNER_WIDTH
                  )}
                  data-testid="desktop-preview-canvas"
                  aria-label="YouTube Desktop channel banner preview"
                  className="block w-full h-auto"
                />
              </div>

              {/* Channel Header Bar */}
              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-zinc-800 bg-zinc-900">
                    {!avatarFailed ? (
                      <img
                        src={MACO_AVATAR_URL}
                        alt="MaCo Original channel profile"
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarFailed(true)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-bold text-zinc-200">
                        MC
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-2xl font-bold text-white truncate">
                      MaCo Original
                    </h3>
                    <p className="mt-0.5 text-sm text-zinc-400">
                      {config.handle || '@MaCo_original'} · Anime Clips &amp; Sakuga Edits
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {config.tagline || 'Curated high-impact anime scenes and original AMV cuts.'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-zinc-950">
                    Subscribe
                  </span>
                </div>
              </div>

              {/* Mock YouTube Channel Navigation Row */}
              <div className="mt-6 flex items-center gap-6 border-b border-zinc-800 pb-2.5 text-sm font-medium text-zinc-400">
                <span className="border-b-2 border-white pb-2.5 -mb-[11px] text-white">
                  Home
                </span>
                <span>Videos</span>
                <span>Shorts</span>
                <span>Playlists</span>
                <span>Posts</span>
              </div>
            </div>
          </div>
        )}

        {previewMode === 'mobile' && (
          <div className="flex justify-center bg-[#0B0B0D] px-4 py-8">
            <div className="w-full max-w-[360px] overflow-hidden rounded-[28px] border border-zinc-700/80 bg-[#0F0F0F] shadow-2xl">
              {/* Mobile Top Notch Bar */}
              <div className="flex items-center justify-between px-5 py-2.5 text-[11px] font-medium text-zinc-400">
                <span className="font-mono-tabular">9:41</span>
                <span>YouTube</span>
                <span className="font-mono-tabular">5G</span>
              </div>

              {/* Mobile Safe-Area Banner Strip (1546x423 ratio) */}
              <div className="px-3">
                <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                  <canvas
                    ref={mobileSafeCanvasRef}
                    width={928}
                    height={Math.round((928 * YT_SAFE_HEIGHT) / YT_SAFE_WIDTH)}
                    data-testid="mobile-preview-canvas"
                    aria-label="YouTube Mobile channel banner safe-area preview"
                    className="block w-full h-auto"
                  />
                </div>
              </div>

              {/* Mobile Channel Meta */}
              <div className="px-4 py-4">
                <div className="flex items-center gap-3.5">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-zinc-800 bg-zinc-900">
                    {!avatarFailed ? (
                      <img
                        src={MACO_AVATAR_URL}
                        alt="MaCo Original mobile avatar"
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarFailed(true)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-zinc-200">
                        MC
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-lg font-bold text-white truncate">
                      MaCo Original
                    </p>
                    <p className="text-xs text-zinc-400 truncate">
                      {config.handle || '@MaCo_original'}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                  {config.tagline || 'Anime clips, sakuga cuts, and original edits.'}
                </p>
                <div className="mt-3.5 w-full rounded-full bg-white py-2 text-center text-xs font-semibold text-zinc-950">
                  Subscribe
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quiet Unboxed Technical Metadata Strip (Zero-Pill Rule) */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5 text-xs text-zinc-400">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="font-medium text-zinc-200">{editionName}</span>
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <span className="font-mono-tabular">
            {YT_BANNER_WIDTH} × {YT_BANNER_HEIGHT} px
          </span>
          <span aria-hidden="true" className="hidden sm:inline text-zinc-600">·</span>
          <span className="font-mono-tabular w-full sm:w-auto">
            Safe Zone {YT_SAFE_WIDTH} × {YT_SAFE_HEIGHT} px
          </span>
        </div>
        <span>Guides are hidden automatically in exported PNG files</span>
      </div>
    </div>
  );
}

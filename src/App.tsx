import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BannerConfig,
  PreviewMode,
  validateBannerInputs,
} from './utils/bannerLayout';
import {
  BANNER_EDITIONS,
  BannerEdition,
  MACO_AVATAR_URL,
  createConfigFromEdition,
} from './data/editions';
import {
  exportChannelAvatarPng,
  exportDesktopStripPng,
  exportFullBannerPng,
} from './utils/bannerRenderer';
import {
  WatermarkConfig,
  createDefaultWatermarkConfig,
} from './utils/watermarkLayout';
import { exportTransparentWatermarkPng } from './utils/watermarkRenderer';
import { TopBar } from './components/TopBar';
import { BannerStage } from './components/BannerStage';
import { InspectorPanel } from './components/InspectorPanel';
import { WatermarkStudio } from './components/WatermarkStudio';
import { EditionsGallery } from './components/EditionsGallery';
import { ExportAndSpecsSection } from './components/ExportAndSpecsSection';

export default function App() {
  const [config, setConfig] = useState<BannerConfig>(() =>
    createConfigFromEdition(BANNER_EDITIONS[0])
  );
  const [previewMode, setPreviewMode] = useState<PreviewMode>('studio');
  const [showSafeZones, setShowSafeZones] = useState<boolean>(true);
  const [activeImage, setActiveImage] = useState<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [fontsReady, setFontsReady] = useState<boolean>(false);
  const [lastExportMessage, setLastExportMessage] = useState<string | null>(null);
  const [watermarkConfig, setWatermarkConfig] = useState<WatermarkConfig>(() =>
    createDefaultWatermarkConfig(
      BANNER_EDITIONS[0].defaults.accentColor ? '@MaCo_original' : '@MaCo_original',
      BANNER_EDITIONS[0].defaults.accentColor
    )
  );

  const activeEdition = useMemo(
    () =>
      BANNER_EDITIONS.find((ed) => ed.id === config.editionId) ??
      BANNER_EDITIONS[0],
    [config.editionId]
  );

  const imageSourceUrl = config.customImageUrl ?? activeEdition.imageUrl;

  const validation = useMemo(
    () => validateBannerInputs(config.handle, config.tagline),
    [config.handle, config.tagline]
  );

  // Wait for web fonts to load so canvas typography renders in Outfit / Playfair / Bricolage
  useEffect(() => {
    let active = true;
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => {
        if (active) setFontsReady(true);
      });
    } else {
      setFontsReady(true);
    }
    return () => {
      active = false;
    };
  }, []);

  // Load current edition or custom uploaded artwork into HTMLImageElement
  useEffect(() => {
    let cancelled = false;
    setImageLoaded(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!cancelled) {
        setActiveImage(img);
        setImageLoaded(true);
      }
    };
    img.onerror = () => {
      if (!cancelled) {
        setActiveImage(null);
        setImageLoaded(true);
      }
    };
    img.src = imageSourceUrl;

    return () => {
      cancelled = true;
    };
  }, [imageSourceUrl]);

  // Revoke object URL if user uploads a replacement custom image
  useEffect(() => {
    const customUrl = config.customImageUrl;
    return () => {
      if (customUrl && customUrl.startsWith('blob:')) {
        URL.revokeObjectURL(customUrl);
      }
    };
  }, [config.customImageUrl]);

  const handlePatchConfig = useCallback((patch: Partial<BannerConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
    if (typeof patch.handle === 'string') {
      setWatermarkConfig((prev) => ({ ...prev, customLabel: patch.handle! }));
    }
    if (typeof patch.accentColor === 'string') {
      setWatermarkConfig((prev) => ({ ...prev, accentColor: patch.accentColor! }));
    }
  }, []);

  const handlePatchWatermark = useCallback((patch: Partial<WatermarkConfig>) => {
    setWatermarkConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleResetWatermark = useCallback(() => {
    setWatermarkConfig(
      createDefaultWatermarkConfig(config.handle || '@MaCo_original', config.accentColor)
    );
  }, [config.handle, config.accentColor]);

  const handleSelectEdition = useCallback((edition: BannerEdition) => {
    setConfig((prev) => createConfigFromEdition(edition, prev.handle));
    setLastExportMessage(null);
  }, []);

  const handleResetDefaults = useCallback(() => {
    setConfig(createConfigFromEdition(activeEdition));
    setLastExportMessage(null);
  }, [activeEdition]);

  const handleUploadBackground = useCallback((file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setConfig((prev) => ({
      ...prev,
      customImageUrl: objectUrl,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    }));
    setLastExportMessage(null);
  }, []);

  const handleClearCustomBackground = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      customImageUrl: null,
    }));
  }, []);

  const handleDownloadFull = useCallback(() => {
    if (!validation.valid) return;
    const filename = exportFullBannerPng(config, activeImage);
    setLastExportMessage(`Exported ${filename} (2560 × 1440 PNG)`);
  }, [config, activeImage, validation.valid]);

  const handleDownloadDesktopStrip = useCallback(() => {
    if (!validation.valid) return;
    const filename = exportDesktopStripPng(config, activeImage);
    setLastExportMessage(`Exported ${filename} (2560 × 423 PNG)`);
  }, [config, activeImage, validation.valid]);

  const handleDownloadAvatar = useCallback(async () => {
    try {
      const filename = await exportChannelAvatarPng(
        MACO_AVATAR_URL,
        config.handle
      );
      setLastExportMessage(`Exported ${filename} (800 × 800 PNG)`);
    } catch {
      setLastExportMessage('Unable to export avatar image.');
    }
  }, [config.handle]);

  const handleDownloadWatermark = useCallback(() => {
    const filename = exportTransparentWatermarkPng(watermarkConfig, false);
    setLastExportMessage(`Exported ${filename} (Transparent PNG)`);
  }, [watermarkConfig]);

  const editionDisplayName = config.customImageUrl
    ? 'Custom Uploaded Artwork'
    : `${activeEdition.index}. ${activeEdition.name}`;

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F4F4F5]">
      <TopBar
        onDownloadFull={handleDownloadFull}
        canExport={validation.valid}
      />

      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Studio Hero & Interactive Workspace */}
        <section id="studio" className="pt-8 pb-12">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl [text-wrap:balance]">
                YouTube Banner for @MaCo_original
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                Fine-tune typography, framing, and anime artwork inside YouTube&apos;s
                2560 × 1440 specification, then export lossless PNG channel art.
              </p>
            </div>
            {lastExportMessage && (
              <p
                role="status"
                className="text-xs font-medium text-emerald-400 shrink-0"
              >
                {lastExportMessage}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            <div className="lg:col-span-8 xl:col-span-9">
              <BannerStage
                config={config}
                activeImage={activeImage}
                imageLoaded={imageLoaded}
                editionName={editionDisplayName}
                previewMode={previewMode}
                onPreviewModeChange={setPreviewMode}
                showSafeZones={showSafeZones}
                onToggleSafeZones={() => setShowSafeZones((prev) => !prev)}
                fontsReady={fontsReady}
              />
            </div>

            <div className="lg:col-span-4 xl:col-span-3">
              <InspectorPanel
                config={config}
                validation={validation}
                onChange={handlePatchConfig}
                onSelectEdition={handleSelectEdition}
                onResetDefaults={handleResetDefaults}
                onUploadBackground={handleUploadBackground}
                onClearCustomBackground={handleClearCustomBackground}
              />
            </div>
          </div>
        </section>

        {/* Video Watermark Studio */}
        <WatermarkStudio
          config={watermarkConfig}
          onChange={handlePatchWatermark}
          onReset={handleResetWatermark}
          activeVideoFrame={activeImage}
          imageLoaded={imageLoaded}
          fontsReady={fontsReady}
        />

        {/* Curated Anime Editions Selector */}
        <EditionsGallery
          activeEditionId={config.editionId}
          hasCustomImage={Boolean(config.customImageUrl)}
          onSelectEdition={handleSelectEdition}
          onUploadBackground={handleUploadBackground}
        />

        {/* Export Pack & YouTube Technical Spec Table */}
        <ExportAndSpecsSection
          handle={config.handle}
          canExport={validation.valid}
          lastExportMessage={lastExportMessage}
          onDownloadFull={handleDownloadFull}
          onDownloadDesktopStrip={handleDownloadDesktopStrip}
          onDownloadAvatar={handleDownloadAvatar}
          onDownloadWatermark={handleDownloadWatermark}
        />
      </main>

      <footer className="border-t border-zinc-800/80 py-8">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 text-xs text-zinc-500">
          <span>MaCo Studio · Channel Art for @MaCo_original</span>
          <span>Upload 2560 × 1440 PNG via YouTube Studio → Customization → Banner image</span>
        </div>
      </footer>
    </div>
  );
}

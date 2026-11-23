import { useState } from 'react';
import { RotateCcw, Upload, AlertCircle } from 'lucide-react';
import {
  BannerConfig,
  BannerValidationResult,
  LayoutAlignment,
  TypographyStyle,
} from '../utils/bannerLayout';
import { ACCENT_SWATCHES, BANNER_EDITIONS, BannerEdition } from '../data/editions';

type InspectorTab = 'copy' | 'style' | 'framing';

interface InspectorPanelProps {
  config: BannerConfig;
  validation: BannerValidationResult;
  onChange: (patch: Partial<BannerConfig>) => void;
  onSelectEdition: (edition: BannerEdition) => void;
  onResetDefaults: () => void;
  onUploadBackground: (file: File) => void;
  onClearCustomBackground: () => void;
}

const TYPOGRAPHY_OPTIONS: { id: TypographyStyle; label: string; detail: string }[] = [
  {
    id: 'editorial-impact',
    label: 'Editorial Impact',
    detail: 'Geometric sans with accent @ lockup',
  },
  {
    id: 'cinema-serif',
    label: 'Cinema Title',
    detail: 'Theatrical anime feature serif',
  },
  {
    id: 'kinetic-street',
    label: 'Kinetic AMV',
    detail: 'Bold offset graphic shadow',
  },
];

const ALIGNMENT_OPTIONS: { id: LayoutAlignment; label: string }[] = [
  { id: 'center', label: 'Center' },
  { id: 'left', label: 'Left' },
  { id: 'split', label: 'Split' },
];

export function InspectorPanel({
  config,
  validation,
  onChange,
  onSelectEdition,
  onResetDefaults,
  onUploadBackground,
  onClearCustomBackground,
}: InspectorPanelProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>('copy');

  return (
    <aside
      aria-label="Banner customization controls"
      className="flex flex-col rounded-xl border border-zinc-800 bg-[#111114] p-5"
    >
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <h2 className="font-display text-base font-semibold text-zinc-100">
          Banner Controls
        </h2>
        <button
          type="button"
          onClick={onResetDefaults}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] rounded-sm"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Reset</span>
        </button>
      </div>

      {/* 3-Tab Segmented Inspector Switch */}
      <div
        role="tablist"
        aria-label="Inspector sections"
        className="mt-4 grid grid-cols-3 gap-1 rounded-lg border border-zinc-800 bg-[#09090B] p-1"
      >
        {(
          [
            { id: 'copy', label: 'Copy' },
            { id: 'style', label: 'Style' },
            { id: 'framing', label: 'Framing' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] ${
              activeTab === tab.id
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel Body */}
      <div className="mt-5 flex flex-col gap-5">
        {activeTab === 'copy' && (
          <>
            <div>
              <label
                htmlFor="handle-input"
                className="block text-xs font-medium text-zinc-300"
              >
                YouTube Handle
              </label>
              <input
                id="handle-input"
                type="text"
                value={config.handle}
                onChange={(e) => onChange({ handle: e.target.value })}
                placeholder="@MaCo_original"
                aria-invalid={Boolean(validation.handleError)}
                className={`mt-1.5 w-full rounded-lg border bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#E11D48] ${
                  validation.handleError ? 'border-rose-500' : 'border-zinc-800'
                }`}
              />
              {validation.handleError && (
                <p
                  role="alert"
                  className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-400"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{validation.handleError}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="tagline-input"
                className="block text-xs font-medium text-zinc-300"
              >
                Tagline
              </label>
              <input
                id="tagline-input"
                type="text"
                value={config.tagline}
                onChange={(e) => onChange({ tagline: e.target.value })}
                placeholder="ANIME CLIPS · SAKUGA · ORIGINAL EDITS"
                aria-invalid={Boolean(validation.taglineError)}
                className={`mt-1.5 w-full rounded-lg border bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#E11D48] ${
                  validation.taglineError ? 'border-rose-500' : 'border-zinc-800'
                }`}
              />
              {validation.taglineError && (
                <p
                  role="alert"
                  className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-400"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{validation.taglineError}</span>
                </p>
              )}
            </div>

            <div className="pt-1 border-t border-zinc-800/70">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="jp-subtitle-input"
                  className="text-xs font-medium text-zinc-300"
                >
                  Japanese Accent Line
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showJapaneseSubtitle}
                    onChange={(e) =>
                      onChange({ showJapaneseSubtitle: e.target.checked })
                    }
                    className="h-3.5 w-3.5 rounded border-zinc-700 accent-[#E11D48]"
                  />
                  <span>Show</span>
                </label>
              </div>
              <input
                id="jp-subtitle-input"
                type="text"
                value={config.japaneseSubtitle}
                disabled={!config.showJapaneseSubtitle}
                onChange={(e) => onChange({ japaneseSubtitle: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-[#09090B] px-3 py-2 text-sm text-zinc-100 disabled:opacity-45 focus:outline-none focus:ring-2 focus:ring-[#E11D48]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="schedule-input"
                  className="text-xs font-medium text-zinc-300"
                >
                  Schedule Note
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showScheduleNote}
                    onChange={(e) =>
                      onChange({ showScheduleNote: e.target.checked })
                    }
                    className="h-3.5 w-3.5 rounded border-zinc-700 accent-[#E11D48]"
                  />
                  <span>Show</span>
                </label>
              </div>
              <input
                id="schedule-input"
                type="text"
                value={config.scheduleNote}
                disabled={!config.showScheduleNote}
                onChange={(e) => onChange({ scheduleNote: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-[#09090B] px-3 py-2 text-sm text-zinc-100 disabled:opacity-45 focus:outline-none focus:ring-2 focus:ring-[#E11D48]"
              />
            </div>
          </>
        )}

        {activeTab === 'style' && (
          <>
            <div>
              <span className="block text-xs font-medium text-zinc-300">
                Typography Direction
              </span>
              <div className="mt-2 flex flex-col gap-2">
                {TYPOGRAPHY_OPTIONS.map((option) => {
                  const selected = config.typographyStyle === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onChange({ typographyStyle: option.id })}
                      aria-pressed={selected}
                      className={`flex flex-col items-start rounded-lg border px-3.5 py-2.5 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] ${
                        selected
                          ? 'border-[#E11D48] bg-[#E11D48]/10 text-zinc-100'
                          : 'border-zinc-800 bg-[#09090B] text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-sm font-semibold">{option.label}</span>
                      <span className="mt-0.5 text-xs text-zinc-400">
                        {option.detail}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-zinc-300">
                Composition Alignment
              </span>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {ALIGNMENT_OPTIONS.map((option) => {
                  const selected = config.alignment === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onChange({ alignment: option.id })}
                      aria-pressed={selected}
                      className={`rounded-lg border py-2 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] ${
                        selected
                          ? 'border-zinc-200 bg-zinc-100 text-zinc-950'
                          : 'border-zinc-800 bg-[#09090B] text-zinc-400 hover:text-zinc-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-zinc-300">
                Accent Color
              </span>
              <div className="mt-2.5 flex items-center gap-2.5">
                {ACCENT_SWATCHES.map((swatch) => {
                  const selected =
                    config.accentColor.toLowerCase() === swatch.hex.toLowerCase();
                  return (
                    <button
                      key={swatch.id}
                      type="button"
                      aria-label={`Select ${swatch.name} accent`}
                      aria-pressed={selected}
                      onClick={() => onChange({ accentColor: swatch.hex })}
                      className={`h-8 w-8 rounded-full border-2 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                        selected
                          ? 'border-white scale-110'
                          : 'border-zinc-800 hover:scale-105'
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/70">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <span className="block text-xs font-medium text-zinc-200">
                    35mm Frame Marks
                  </span>
                  <span className="block text-xs text-zinc-500">
                    Subtle viewfinder brackets in safe area
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.showCinemaMarks}
                  onChange={(e) =>
                    onChange({ showCinemaMarks: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-zinc-700 accent-[#E11D48]"
                />
              </label>
            </div>
          </>
        )}

        {activeTab === 'framing' && (
          <>
            <div>
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="zoom-slider" className="font-medium text-zinc-300">
                  Artwork Zoom
                </label>
                <span className="font-mono-tabular text-zinc-400">
                  {Math.round(config.zoom * 100)}%
                </span>
              </div>
              <input
                id="zoom-slider"
                type="range"
                min={1}
                max={1.6}
                step={0.02}
                value={config.zoom}
                onChange={(e) => onChange({ zoom: parseFloat(e.target.value) })}
                className="studio-slider mt-2.5"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="offset-y-slider" className="font-medium text-zinc-300">
                  Vertical Framing
                </label>
                <span className="font-mono-tabular text-zinc-400">
                  {config.offsetY > 0 ? `+${config.offsetY}%` : `${config.offsetY}%`}
                </span>
              </div>
              <input
                id="offset-y-slider"
                type="range"
                min={-50}
                max={50}
                step={2}
                value={config.offsetY}
                onChange={(e) => onChange({ offsetY: parseInt(e.target.value, 10) })}
                className="studio-slider mt-2.5"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="scrim-slider" className="font-medium text-zinc-300">
                  Contrast Scrim
                </label>
                <span className="font-mono-tabular text-zinc-400">
                  {Math.round(config.scrimOpacity * 100)}%
                </span>
              </div>
              <input
                id="scrim-slider"
                type="range"
                min={0}
                max={0.85}
                step={0.02}
                value={config.scrimOpacity}
                onChange={(e) =>
                  onChange({ scrimOpacity: parseFloat(e.target.value) })
                }
                className="studio-slider mt-2.5"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="grain-slider" className="font-medium text-zinc-300">
                  Cel Film Grain
                </label>
                <span className="font-mono-tabular text-zinc-400">
                  {Math.round(config.grainIntensity * 100)}%
                </span>
              </div>
              <input
                id="grain-slider"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={config.grainIntensity}
                onChange={(e) =>
                  onChange({ grainIntensity: parseFloat(e.target.value) })
                }
                className="studio-slider mt-2.5"
              />
            </div>

            <div className="pt-2 border-t border-zinc-800/70">
              <span className="block text-xs font-medium text-zinc-300 mb-2">
                Custom Anime Screenshot
              </span>
              <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-[#09090B] px-3 py-2.5 text-xs font-medium text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer">
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onUploadBackground(file);
                      e.target.value = '';
                    }
                  }}
                />
              </label>
              {config.customImageUrl && (
                <button
                  type="button"
                  onClick={onClearCustomBackground}
                  className="mt-2 w-full text-center text-xs text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
                >
                  Revert to curated artwork
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Quick Artwork Switcher */}
      <div className="mt-6 pt-4 border-t border-zinc-800/80">
        <div className="flex items-center justify-between text-xs mb-2.5">
          <span className="font-medium text-zinc-300">Quick Edition Switch</span>
          <a
            href="#editions"
            className="text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            All details
          </a>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {BANNER_EDITIONS.map((edition) => {
            const selected =
              !config.customImageUrl && config.editionId === edition.id;
            return (
              <button
                key={edition.id}
                type="button"
                onClick={() => onSelectEdition(edition)}
                aria-label={`Switch to ${edition.name}`}
                aria-pressed={selected}
                className={`group relative overflow-hidden rounded-lg border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] ${
                  selected
                    ? 'border-[#E11D48]'
                    : 'border-zinc-800 hover:border-zinc-600'
                }`}
              >
                <div className="aspect-video w-full bg-zinc-950">
                  <img
                    src={edition.imageUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent px-2 py-1 absolute inset-x-0 bottom-0">
                  <span className="block truncate text-[11px] font-medium text-zinc-100">
                    {edition.index}. {edition.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

import { useState } from 'react';
import { Download, CheckCircle2 } from 'lucide-react';
import { MACO_AVATAR_URL } from '../data/editions';

interface ExportAndSpecsSectionProps {
  handle: string;
  canExport: boolean;
  lastExportMessage: string | null;
  onDownloadFull: () => void;
  onDownloadDesktopStrip: () => void;
  onDownloadAvatar: () => void;
  onDownloadWatermark: () => void;
}

const YOUTUBE_SPECS = [
  {
    surface: 'Full Upload Canvas (TV)',
    dimensions: '2560 × 1440 px',
    ratio: '16 : 9',
    notes: 'Required upload dimensions for crisp rendering on all displays.',
  },
  {
    surface: 'All-Device Safe Area',
    dimensions: '1546 × 423 px',
    ratio: '3.65 : 1',
    notes: 'Guaranteed visible region on mobile phones, tablets, and desktop.',
  },
  {
    surface: 'Desktop Max Strip',
    dimensions: '2560 × 423 px',
    ratio: '6.05 : 1',
    notes: 'Full horizontal banner strip shown on widescreen desktop browsers.',
  },
  {
    surface: 'Channel Avatar Pair',
    dimensions: '800 × 800 px',
    ratio: '1 : 1',
    notes: 'Matching circular profile mark sized for YouTube Studio upload.',
  },
  {
    surface: 'Video Branding Watermark',
    dimensions: '150 × 150 px',
    ratio: '1 : 1',
    notes: 'Transparent PNG stamp displayed in the bottom-right corner of videos.',
  },
];

export function ExportAndSpecsSection({
  handle,
  canExport,
  lastExportMessage,
  onDownloadFull,
  onDownloadDesktopStrip,
  onDownloadAvatar,
  onDownloadWatermark,
}: ExportAndSpecsSectionProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const displayHandle = handle.trim() || '@MaCo_original';

  return (
    <section
      id="exports"
      aria-labelledby="exports-heading"
      className="border-t border-zinc-800/80 py-14"
    >
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Left: Channel Export Pack */}
        <div className="lg:col-span-6">
          <h2
            id="exports-heading"
            className="font-display text-2xl font-bold tracking-tight text-zinc-100"
          >
            Channel Export Pack
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Export lossless PNG assets sized directly for YouTube Studio customization
            for {displayHandle}.
          </p>

          {lastExportMessage && (
            <div
              role="status"
              data-testid="export-status"
              className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-medium text-emerald-300"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{lastExportMessage}</span>
            </div>
          )}

          <div className="mt-6 flex flex-col divide-y divide-zinc-800/80 rounded-xl border border-zinc-800 bg-[#111114]">
            {/* Item 1: Full 2560x1440 Banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <p className="text-sm font-semibold text-zinc-100">
                  Full YouTube Channel Banner
                </p>
                <p className="mt-0.5 text-xs text-zinc-400 font-mono-tabular">
                  2560 × 1440 px · PNG · Upload this in YouTube Studio
                </p>
              </div>
              <button
                type="button"
                onClick={onDownloadFull}
                disabled={!canExport}
                className="inline-flex items-center gap-2 rounded-lg bg-[#E11D48] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#BE123C] disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48]"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Download 2560×1440</span>
              </button>
            </div>

            {/* Item 2: Desktop Banner Strip */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <p className="text-sm font-semibold text-zinc-100">
                  Desktop Header Crop
                </p>
                <p className="mt-0.5 text-xs text-zinc-400 font-mono-tabular">
                  2560 × 423 px · PNG · Useful for X, Twitch, or web headers
                </p>
              </div>
              <button
                type="button"
                onClick={onDownloadDesktopStrip}
                disabled={!canExport}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-[#09090B] px-3.5 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-500 hover:text-white disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48]"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Download Strip</span>
              </button>
            </div>

            {/* Item 3: Matching Channel Avatar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-zinc-700 bg-zinc-950">
                  {!avatarFailed ? (
                    <img
                      src={MACO_AVATAR_URL}
                      alt="Matching MaCo Original avatar"
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarFailed(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-zinc-300">
                      MC
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">
                    Matching Channel Avatar
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400 font-mono-tabular">
                    800 × 800 px · PNG · Cinnabar Moon Silhouette
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onDownloadAvatar}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-[#09090B] px-3.5 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-500 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48]"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Download Avatar</span>
              </button>
            </div>

            {/* Item 4: Transparent Video Watermark */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <p className="text-sm font-semibold text-zinc-100">
                  Transparent Video Watermark
                </p>
                <p className="mt-0.5 text-xs text-zinc-400 font-mono-tabular">
                  Alpha PNG · Matches active Watermark Studio style
                </p>
              </div>
              <button
                type="button"
                onClick={onDownloadWatermark}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-[#09090B] px-3.5 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-500 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48]"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Download Watermark</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: YouTube Specifications Reference Table */}
        <div id="specs" className="lg:col-span-6">
          <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-100">
            YouTube Banner Specifications
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            All typography and registration marks automatically lock inside the safe
            zone so {displayHandle} stays sharp across every screen.
          </p>

          <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-800 bg-[#111114]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="px-4 py-3 font-medium">Viewport Surface</th>
                  <th className="px-4 py-3 font-medium">Dimensions</th>
                  <th className="px-4 py-3 font-medium">Ratio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70">
                {YOUTUBE_SPECS.map((spec) => (
                  <tr key={spec.surface} className="align-top">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-zinc-100">{spec.surface}</p>
                      <p className="mt-0.5 text-zinc-500">{spec.notes}</p>
                    </td>
                    <td className="px-4 py-3.5 font-mono-tabular text-zinc-200 whitespace-nowrap">
                      {spec.dimensions}
                    </td>
                    <td className="px-4 py-3.5 font-mono-tabular text-zinc-400 whitespace-nowrap">
                      {spec.ratio}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

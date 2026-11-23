import { Download } from 'lucide-react';

interface TopBarProps {
  onDownloadFull: () => void;
  canExport: boolean;
}

export function TopBar({ onDownloadFull, canExport }: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/90 bg-[#09090B]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text wordmark */}
        <a
          href="#studio"
          className="font-display text-lg font-bold tracking-tight text-zinc-100 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] rounded-sm"
        >
          MaCo Studio
        </a>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-400"
        >
          <a
            href="#studio"
            className="hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
          >
            Studio
          </a>
          <a
            href="#watermark"
            className="hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
          >
            Watermark
          </a>
          <a
            href="#editions"
            className="hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
          >
            Editions
          </a>
          <a
            href="#exports"
            className="hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
          >
            Export Pack
          </a>
          <a
            href="#specs"
            className="hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
          >
            YouTube Specs
          </a>
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onDownloadFull}
            disabled={!canExport}
            className="inline-flex items-center gap-2 rounded-lg bg-[#E11D48] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#BE123C] disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090B] cursor-pointer"
          >
            <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Download PNG</span>
          </button>
        </div>
      </div>
    </header>
  );
}

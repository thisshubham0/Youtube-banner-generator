import { useState } from 'react';
import { Check, Upload } from 'lucide-react';
import { BANNER_EDITIONS, BannerEdition } from '../data/editions';

interface EditionsGalleryProps {
  activeEditionId: string;
  hasCustomImage: boolean;
  onSelectEdition: (edition: BannerEdition) => void;
  onUploadBackground: (file: File) => void;
}

export function EditionsGallery({
  activeEditionId,
  hasCustomImage,
  onSelectEdition,
  onUploadBackground,
}: EditionsGalleryProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  return (
    <section
      id="editions"
      aria-labelledby="editions-heading"
      className="border-t border-zinc-800/80 py-14"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="editions-heading"
            className="font-display text-2xl font-bold tracking-tight text-zinc-100"
          >
            Curated Anime Editions
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Four bespoke widescreen compositions framed specifically for YouTube&apos;s
            central banner strip.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 self-start rounded-lg border border-zinc-700 bg-[#111114] px-3.5 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0">
          <Upload className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Upload Custom Frame</span>
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
      </div>

      <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {BANNER_EDITIONS.map((edition) => {
          const isSelected = !hasCustomImage && activeEditionId === edition.id;
          const imgFailed = failedImages[edition.id];

          return (
            <button
              key={edition.id}
              type="button"
              onClick={() => onSelectEdition(edition)}
              aria-pressed={isSelected}
              className={`group flex flex-col overflow-hidden rounded-xl border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] ${
                isSelected
                  ? 'border-[#E11D48] bg-[#161215]'
                  : 'border-zinc-800 bg-[#111114] hover:border-zinc-600'
              }`}
            >
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
                {!imgFailed ? (
                  <img
                    src={edition.imageUrl}
                    alt={`${edition.name} anime banner artwork`}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [edition.id]: true }))
                    }
                    className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 text-xs font-medium text-zinc-400">
                    {edition.name}
                  </div>
                )}

                {isSelected && (
                  <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#E11D48] text-white">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-base font-semibold text-zinc-100">
                    {edition.index}. {edition.name}
                  </h3>
                </div>
                <p className="mt-1 text-xs text-zinc-400">{edition.mood}</p>
                <p className="mt-2.5 text-xs leading-relaxed text-zinc-500">
                  {edition.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

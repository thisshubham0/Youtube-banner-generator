import { BannerConfig, LayoutAlignment, TypographyStyle } from '../utils/bannerLayout';

export interface BannerEdition {
  id: string;
  index: string;
  name: string;
  mood: string;
  description: string;
  imageUrl: string;
  defaults: {
    typographyStyle: TypographyStyle;
    alignment: LayoutAlignment;
    accentColor: string;
    zoom: number;
    offsetX: number;
    offsetY: number;
    scrimOpacity: number;
    grainIntensity: number;
    showCinemaMarks: boolean;
    tagline: string;
    japaneseSubtitle: string;
    scheduleNote: string;
  };
}

export const MACO_AVATAR_URL =
  '/src/assets/images/avatar_maco_original_1795429014857.jpg';

export const ACCENT_SWATCHES = [
  { id: 'cinnabar', name: 'Cinnabar Crimson', hex: '#E11D48' },
  { id: 'vermilion', name: 'Sunset Amber', hex: '#F59E0B' },
  { id: 'ivory', name: 'Pure Ivory', hex: '#F4F4F5' },
  { id: 'cobalt', name: 'Midnight Cobalt', hex: '#3B82F6' },
  { id: 'sakura', name: 'Sakura Rose', hex: '#FB7185' },
] as const;

export const BANNER_EDITIONS: BannerEdition[] = [
  {
    id: 'crimson-sakuga',
    index: '01',
    name: 'Crimson Sakuga',
    mood: 'Action Key-Animation · Moonlit Rooftop',
    description:
      'High-contrast moonlit rain and vermilion blade embers framing the right edge, leaving a crisp focal center for @MaCo_original.',
    imageUrl: '/src/assets/images/banner_crimson_sakuga_1795428932539.jpg',
    defaults: {
      typographyStyle: 'editorial-impact',
      alignment: 'center',
      accentColor: '#E11D48',
      zoom: 1.04,
      offsetX: 0,
      offsetY: -8,
      scrimOpacity: 0.42,
      grainIntensity: 0.25,
      showCinemaMarks: true,
      tagline: 'ANIME CLIPS · SAKUGA · ORIGINAL EDITS',
      japaneseSubtitle: 'アニメクリップ・オリジナル編集',
      scheduleNote: 'NEW CLIPS EVERY WEEK',
    },
  },
  {
    id: 'twilight-shibuya',
    index: '02',
    name: 'Twilight Shibuya',
    mood: 'Atmospheric Film · Tokyo Overpass',
    description:
      'Deep indigo twilight bleeding into golden-crimson clouds over a passing Tokyo commuter train with luminous skyline bokeh.',
    imageUrl: '/src/assets/images/banner_twilight_shibuya_1795428913376.jpg',
    defaults: {
      typographyStyle: 'cinema-serif',
      alignment: 'center',
      accentColor: '#F59E0B',
      zoom: 1.06,
      offsetX: 0,
      offsetY: 14,
      scrimOpacity: 0.52,
      grainIntensity: 0.2,
      showCinemaMarks: true,
      tagline: 'CINEMATIC ANIME SCENES · AMV · 60FPS',
      japaneseSubtitle: '黄昏のシネマ・アニメ名場面',
      scheduleNote: 'CURATED DAILY CUTS',
    },
  },
  {
    id: 'monochrome-manga',
    index: '03',
    name: 'Monochrome Manga',
    mood: 'Sumi Ink & Screentone · Vermilion Slash',
    description:
      'Editorial black-and-white manga clash with hand-brushed speedlines and a razor-sharp crimson blade slash across the composition.',
    imageUrl: '/src/assets/images/banner_monochrome_manga_1795428912156.jpg',
    defaults: {
      typographyStyle: 'kinetic-street',
      alignment: 'center',
      accentColor: '#E11D48',
      zoom: 1.02,
      offsetX: 0,
      offsetY: 0,
      scrimOpacity: 0.62,
      grainIntensity: 0.35,
      showCinemaMarks: false,
      tagline: 'MANGA PANELS IN MOTION · RAW CLIPS',
      japaneseSubtitle: '漫画モーション・アクション切り抜き',
      scheduleNote: 'HIGH-IMPACT EDITS',
    },
  },
  {
    id: 'celestial-mecha',
    index: '04',
    name: 'Celestial Mecha',
    mood: '90s OVA Cel Animation · Orbital Horizon',
    description:
      'Vintage cel-shaded orbital mecha silhouetted on the left edge against deep space and a glowing crimson-gold planetary curve.',
    imageUrl: '/src/assets/images/banner_celestial_mecha_1795428913202.jpg',
    defaults: {
      typographyStyle: 'editorial-impact',
      alignment: 'split',
      accentColor: '#FB7185',
      zoom: 1.05,
      offsetX: -12,
      offsetY: -4,
      scrimOpacity: 0.36,
      grainIntensity: 0.3,
      showCinemaMarks: true,
      tagline: 'CLASSIC OVA · MECHA · ANIME ARCHIVE',
      japaneseSubtitle: '軌道シネマ・アニメクリップ集',
      scheduleNote: '4K REMASTERED CLIPS',
    },
  },
];

export function createConfigFromEdition(
  edition: BannerEdition,
  preserveHandle?: string
): BannerConfig {
  return {
    editionId: edition.id,
    customImageUrl: null,
    handle: preserveHandle?.trim() ? preserveHandle : '@MaCo_original',
    tagline: edition.defaults.tagline,
    japaneseSubtitle: edition.defaults.japaneseSubtitle,
    showJapaneseSubtitle: true,
    scheduleNote: edition.defaults.scheduleNote,
    showScheduleNote: true,
    typographyStyle: edition.defaults.typographyStyle,
    alignment: edition.defaults.alignment,
    accentColor: edition.defaults.accentColor,
    zoom: edition.defaults.zoom,
    offsetX: edition.defaults.offsetX,
    offsetY: edition.defaults.offsetY,
    scrimOpacity: edition.defaults.scrimOpacity,
    grainIntensity: edition.defaults.grainIntensity,
    showCinemaMarks: edition.defaults.showCinemaMarks,
  };
}

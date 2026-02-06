export type TemplateKey = 'classic' | 'moon' | 'sand';

export type CardTemplate = {
  key: TemplateKey;
  label: { en: string; ar: string };
  defaultBgColor?: string;
  artRect: { left: number; top: number; right: number; bottom: number; radius: number };
  title: { x: number; y: number; size: number; letterSpacing?: number };
  desc: { x: number; y: number; size: number; maxLines?: number };
  badge?: { x: number; y: number; text?: string };
};

export const CARD_TEMPLATES: Record<TemplateKey, CardTemplate> = {
  classic: {
    key: 'classic',
    label: { en: 'Classic', ar: 'كلاسيكي' },
    defaultBgColor: '#2b0d16',
    artRect: { left: 20, top: 55, right: 20, bottom: 70, radius: 10 },
    title: { x: 22, y: 16, size: 18 },
    desc: { x: 22, y: 290, size: 12 },
  },
  moon: {
    key: 'moon',
    label: { en: 'Moon', ar: 'قمري' },
    defaultBgColor: '#0b1220',
    artRect: { left: 18, top: 52, right: 18, bottom: 74, radius: 14 },
    title: { x: 22, y: 14, size: 19 },
    desc: { x: 22, y: 288, size: 12 },
    badge: { x: 220, y: 14, text: '✦' },
  },
  sand: {
    key: 'sand',
    label: { en: 'Sand', ar: 'صحراوي' },
    defaultBgColor: '#2a1a10',
    artRect: { left: 22, top: 58, right: 22, bottom: 72, radius: 10 },
    title: { x: 22, y: 16, size: 18 },
    desc: { x: 22, y: 288, size: 12 },
    badge: { x: 216, y: 14, text: '☼' },
  },
};

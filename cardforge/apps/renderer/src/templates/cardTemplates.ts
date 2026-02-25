export type TemplateKey =
  | 'classic'
  | 'moon'
  | 'sand'
  | 'obsidian'
  | 'royal'
  | 'forest'
  | 'ember'
  | 'frost'
  | 'storm'
  | 'modern-dark'
  | 'steampunk'
  | 'blood-ritual'
  | 'eldritch-eye'
  | 'glitch-artifact'
  | 'swamp'
  | 'elven-luxury';

export type CardTemplate = {
  key: TemplateKey;
  label: { en: string; ar: string };
  layout?:
  | 'standard'
  | 'full-bleed'
  | 'steampunk'
  | 'blood-ritual'
  | 'eldritch-eye'
  | 'glitch-artifact'
  | 'swamp'
  | 'elven-luxury';
  titleKey?: string;
  descKey?: string;
  thumbnail?: string;
  defaultBgColor?: string;
  artRect: {
    left: number;
    top: number;
    right: number;
    bottom: number;
    radius: number;
  };
  title: { x: number; y: number; size: number; letterSpacing?: number };
  desc: { x: number; y: number; size: number; maxLines?: number };
  badge?: { x: number; y: number; text?: string };
};

export const CARD_TEMPLATES: Record<TemplateKey, CardTemplate> = {
  classic: {
    key: 'classic',
    label: { en: 'Classic', ar: 'كلاسيكي' },
    titleKey: 'templates.classic.title',
    descKey: 'templates.classic.desc',
    thumbnail: '/assets/backgrounds/template-placeholder.svg',
    defaultBgColor: '#2b0d16',
    artRect: { left: 20, top: 55, right: 20, bottom: 70, radius: 10 },
    title: { x: 22, y: 16, size: 18 },
    desc: { x: 22, y: 290, size: 12 },
  },
  moon: {
    key: 'moon',
    label: { en: 'Moon', ar: 'قمري' },
    titleKey: 'templates.moon.title',
    descKey: 'templates.moon.desc',
    thumbnail: '/assets/backgrounds/template-placeholder.svg',
    defaultBgColor: '#0b1220',
    artRect: { left: 18, top: 52, right: 18, bottom: 74, radius: 14 },
    title: { x: 22, y: 14, size: 19 },
    desc: { x: 22, y: 288, size: 12 },
    badge: { x: 220, y: 14, text: '✦' },
  },
  sand: {
    key: 'sand',
    label: { en: 'Sand', ar: 'صحراوي' },
    titleKey: 'templates.sand.title',
    descKey: 'templates.sand.desc',
    thumbnail: '/assets/backgrounds/template-placeholder.svg',
    defaultBgColor: '#2a1a10',
    artRect: { left: 22, top: 58, right: 22, bottom: 72, radius: 10 },
    title: { x: 22, y: 16, size: 18 },
    desc: { x: 22, y: 288, size: 12 },
    badge: { x: 216, y: 14, text: '☼' },
  },
  obsidian: {
    key: 'obsidian',
    label: { en: 'Obsidian', ar: 'سبج' },
    titleKey: 'templates.obsidian.title',
    descKey: 'templates.obsidian.desc',
    thumbnail: '/assets/backgrounds/template-placeholder.svg',
    defaultBgColor: '#0e0f14',
    artRect: { left: 20, top: 56, right: 20, bottom: 72, radius: 12 },
    title: { x: 22, y: 16, size: 18 },
    desc: { x: 22, y: 288, size: 12 },
  },
  royal: {
    key: 'royal',
    label: { en: 'Royal', ar: 'ملكي' },
    titleKey: 'templates.royal.title',
    descKey: 'templates.royal.desc',
    thumbnail: '/assets/backgrounds/template-placeholder.svg',
    defaultBgColor: '#141a33',
    artRect: { left: 20, top: 56, right: 20, bottom: 72, radius: 12 },
    title: { x: 22, y: 16, size: 18 },
    desc: { x: 22, y: 288, size: 12 },
  },
  forest: {
    key: 'forest',
    label: { en: 'Forest', ar: 'غابة' },
    titleKey: 'templates.forest.title',
    descKey: 'templates.forest.desc',
    thumbnail: '/assets/backgrounds/template-placeholder.svg',
    defaultBgColor: '#122018',
    artRect: { left: 20, top: 56, right: 20, bottom: 72, radius: 12 },
    title: { x: 22, y: 16, size: 18 },
    desc: { x: 22, y: 288, size: 12 },
  },
  ember: {
    key: 'ember',
    label: { en: 'Ember', ar: 'جمرة' },
    titleKey: 'templates.ember.title',
    descKey: 'templates.ember.desc',
    thumbnail: '/assets/backgrounds/template-placeholder.svg',
    defaultBgColor: '#2a0f0f',
    artRect: { left: 20, top: 56, right: 20, bottom: 72, radius: 12 },
    title: { x: 22, y: 16, size: 18 },
    desc: { x: 22, y: 288, size: 12 },
  },
  frost: {
    key: 'frost',
    label: { en: 'Frost', ar: 'صقيع' },
    titleKey: 'templates.frost.title',
    descKey: 'templates.frost.desc',
    thumbnail: '/assets/backgrounds/template-placeholder.svg',
    defaultBgColor: '#0b1a24',
    artRect: { left: 20, top: 56, right: 20, bottom: 72, radius: 12 },
    title: { x: 22, y: 16, size: 18 },
    desc: { x: 22, y: 288, size: 12 },
  },
  storm: {
    key: 'storm',
    label: { en: 'Storm', ar: 'عاصفة' },
    titleKey: 'templates.storm.title',
    descKey: 'templates.storm.desc',
    thumbnail: '/assets/backgrounds/template-placeholder.svg',
    defaultBgColor: '#101726',
    artRect: { left: 20, top: 56, right: 20, bottom: 72, radius: 12 },
    title: { x: 22, y: 16, size: 18 },
    desc: { x: 22, y: 288, size: 12 },
  },
  'modern-dark': {
    key: 'modern-dark',
    label: { en: 'Modern Dark', ar: 'حديث داكن' },
    layout: 'full-bleed',
    thumbnail: '/assets/backgrounds/template-placeholder.svg',
    defaultBgColor: '#0a0a0c',
    artRect: { left: 0, top: 0, right: 0, bottom: 0, radius: 0 },
    title: { x: 0, y: 0, size: 22 },
    desc: { x: 0, y: 0, size: 12 },
  },
  steampunk: {
    key: 'steampunk',
    label: { en: 'Steampunk', ar: 'ستيم بانك' },
    layout: 'steampunk',
    thumbnail: '/assets/backgrounds/template-placeholder.svg',
    defaultBgColor: '#2C1810',
    artRect: { left: 0, top: 0, right: 0, bottom: 0, radius: 0 },
    title: { x: 0, y: 0, size: 22 },
    desc: { x: 0, y: 0, size: 12 },
  },
  'blood-ritual': {
    key: 'blood-ritual',
    label: { en: 'Blood Ritual', ar: 'طقوس الدم' },
    layout: 'blood-ritual',
    thumbnail: '/assets/backgrounds/template-placeholder.svg',
    defaultBgColor: '#100000',
    artRect: { left: 0, top: 0, right: 0, bottom: 0, radius: 0 },
    title: { x: 0, y: 0, size: 22 },
    desc: { x: 0, y: 0, size: 12 },
  },
  'eldritch-eye': {
    key: 'eldritch-eye',
    label: { en: 'Eldritch Eye', ar: 'عين الهاوية' },
    layout: 'eldritch-eye',
    thumbnail: '/assets/backgrounds/template-placeholder.svg',
    defaultBgColor: '#000000',
    artRect: { left: 0, top: 0, right: 0, bottom: 0, radius: 0 },
    title: { x: 0, y: 0, size: 22 },
    desc: { x: 0, y: 0, size: 12 },
  },
  'glitch-artifact': {
    key: 'glitch-artifact',
    label: { en: 'Glitch Artifact', ar: 'كرت الخلل الكوني' },
    layout: 'glitch-artifact',
    thumbnail: '/assets/backgrounds/template-placeholder.svg',
    defaultBgColor: '#050005',
    artRect: { left: 0, top: 0, right: 0, bottom: 0, radius: 0 },
    title: { x: 0, y: 0, size: 22 },
    desc: { x: 0, y: 0, size: 12 },
  },
  swamp: {
    key: 'swamp',
    label: { en: 'Swamp', ar: 'سيد المستنقع' },
    layout: 'swamp',
    thumbnail: '/assets/backgrounds/template-placeholder.svg',
    defaultBgColor: '#001508',
    artRect: { left: 0, top: 0, right: 0, bottom: 0, radius: 0 },
    title: { x: 0, y: 0, size: 22 },
    desc: { x: 0, y: 0, size: 12 },
  },
  'elven-luxury': {
    key: 'elven-luxury',
    label: { en: 'Elven Luxury', ar: 'إيلف فاخر' },
    layout: 'elven-luxury',
    thumbnail: '/assets/backgrounds/template-placeholder.svg',
    defaultBgColor: '#040803',
    artRect: { left: 0, top: 0, right: 0, bottom: 0, radius: 0 },
    title: { x: 0, y: 0, size: 22 },
    desc: { x: 0, y: 0, size: 12 },
  },
};

import type { TFunction } from 'i18next';

function normalize(value?: string) {
  return String(value ?? '').toLowerCase().replace(/[\s\-_]/g, '');
}

export function getCategoryLabel(t: TFunction, category?: string) {
  const key = normalize(category || 'general');
  switch (key) {
    case 'fantasy':
      return t('categories.fantasy');
    case 'scifi':
    case 'sciencefiction':
    case 'sci-fi':
      return t('categories.scifi');
    case 'modern':
      return t('categories.modern');
    case 'boardgame':
    case 'boardgames':
      return t('categories.boardgame');
    case 'tokens':
      return t('categories.tokens');
    case 'blank':
      return t('categories.blank');
    case 'general':
      return t('categories.general');
    default:
      return category || t('categories.general');
  }
}

export function getElementTypeLabel(t: TFunction, type?: string) {
  switch (type) {
    case 'text':
      return t('elementTypes.text');
    case 'image':
      return t('elementTypes.image');
    case 'shape':
      return t('elementTypes.shape');
    case 'icon':
      return t('elementTypes.icon');
    default:
      return type ?? t('elementTypes.shape');
  }
}

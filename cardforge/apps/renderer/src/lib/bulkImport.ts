import Papa from 'papaparse';
import type { CardArt } from '../../../../packages/core/src/index';
import type { TemplateKey } from '../templates/cardTemplates';
import { CARD_TEMPLATES } from '../templates/cardTemplates';
import type { Rarity } from '../shared/cardRarityColors';

export type ParsedRow = Record<string, any>;

export type ImportCard = {
  id: string;
  data: Record<string, any>;
  art?: CardArt;
  quantity: number;
  setName?: string;
  warnings: string[];
};

export type MapOptions = {
  defaultTemplate: TemplateKey;
  hasLanguageColumns: boolean;
};

export async function parseCsvFile(file: File): Promise<ParsedRow[]> {
  const text = await file.text();
  const parsed = Papa.parse<ParsedRow>(text, { header: true, skipEmptyLines: true });
  return (parsed.data ?? []).filter(Boolean);
}

export async function parseXlsxFile(file: File): Promise<ParsedRow[]> {
  const buffer = await file.arrayBuffer();
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<ParsedRow>(sheet, { defval: '' });
}

export function mapRowsToCards(rows: ParsedRow[], options: MapOptions) {
  const cards: ImportCard[] = [];
  const errors: string[] = [];
  const usedIds = new Map<string, number>();

  rows.forEach((row, index) => {
    const normalizedData = normalizeRowData(row);
    const normalized = normalizeRowKeys(row);
    const hasLang = options.hasLanguageColumns;

    const nameValue = getValue(normalized, ['name', 'title']);
    const nameEn = hasLang ? getValue(normalized, ['name_en', 'title_en', 'name.en', 'title.en']) : nameValue;
    const nameAr = hasLang ? getValue(normalized, ['name_ar', 'title_ar', 'name.ar', 'title.ar']) : nameValue;

    const descValue = getValue(normalized, ['desc', 'description']);
    const descEn = hasLang ? getValue(normalized, ['desc_en', 'description_en', 'desc.en', 'description.en']) : descValue;
    const descAr = hasLang ? getValue(normalized, ['desc_ar', 'description_ar', 'desc.ar', 'description.ar']) : descValue;

    const rarityRaw = getValue(normalized, ['rarity']);
    const rarity = normalizeRarity(rarityRaw);

    const templateRaw = getValue(normalized, ['template', 'templatekey', 'template_key']);
    const templateKey = normalizeTemplateKey(templateRaw, options.defaultTemplate);

    const bgColor = getValue(normalized, ['bgcolor', 'bg_color', 'background', 'bg']) || CARD_TEMPLATES[templateKey].defaultBgColor;

    const raceRaw = getValue(normalized, ['race']);
    const race = normalizeRace(raceRaw);
    const traitsRaw = getValue(normalized, ['traits', 'trait']);
    const traits = parseTraits(traitsRaw);

    const idRaw = getValue(normalized, ['id']);
    const fallbackId = slugify(nameEn || nameAr || 'card');
    const id = ensureUniqueId(idRaw || `${fallbackId || 'card'}_${index + 1}`, usedIds);

    const artKind = getValue(normalized, ['art_kind', 'artkind', 'art.type', 'artkind']);
    const artSrc = getValue(normalized, ['art_src', 'art', 'image', 'image_src']);
    const poster = getValue(normalized, ['poster', 'poster_src', 'art_poster']);
    const art = buildArt(artKind, artSrc, poster);

    const quantityRaw = getValue(normalized, ['quantity', 'qty', 'count']);
    const quantity = Number(quantityRaw) > 0 ? Number(quantityRaw) : 1;
    const setName = getValue(normalized, ['set', 'setname', 'set_name']);

    const warnings: string[] = [];
    if (String(artKind || '').toLowerCase().trim() === 'video' && !art) {
      warnings.push('video-unsupported');
    }
    if (art?.kind === 'video' && !art.poster) {
      warnings.push('poster-required');
    }

    const data = {
      ...normalizedData,
      id,
      name: { en: nameEn || '', ar: nameAr || '' },
      desc: { en: descEn || '', ar: descAr || '' },
      rarity,
      templateKey,
      bgColor,
    };
    if (race) {
      data.race = race;
    }
    if (traits.length) {
      data.traits = traits;
    }

    cards.push({ id, data, art, quantity, setName, warnings });
  });

  return { cards, errors };
}

function normalizeRowKeys(row: ParsedRow) {
  const normalized: ParsedRow = {};
  Object.entries(row).forEach(([key, value]) => {
    normalized[key] = value;
    normalized[key.toLowerCase()] = value;
  });
  return normalized;
}

function normalizeRowData(row: ParsedRow) {
  const output: ParsedRow = {};
  Object.entries(row).forEach(([key, value]) => {
    if (key.includes('.')) {
      assignPath(output, key, value);
    } else {
      output[key] = value;
    }
  });
  return output;
}

function assignPath(target: ParsedRow, path: string, value: any) {
  const parts = path.split('.');
  let cursor: ParsedRow = target;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    const next = cursor[part];
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      cursor[part] = {};
    }
    cursor = cursor[part] as ParsedRow;
  }
  cursor[parts[parts.length - 1]] = value;
}

function getValue(row: ParsedRow, keys: string[]) {
  for (const key of keys) {
    if (row[key] != null && String(row[key]).trim() !== '') {
      return row[key];
    }
    const lower = key.toLowerCase();
    if (row[lower] != null && String(row[lower]).trim() !== '') {
      return row[lower];
    }
  }
  return '';
}

function normalizeRarity(value: any): Rarity {
  const cleaned = String(value || '').toLowerCase().trim();
  if (cleaned === 'rare' || cleaned === 'epic' || cleaned === 'legendary') return cleaned as Rarity;
  return 'common';
}

function normalizeTemplateKey(value: any, fallback: TemplateKey): TemplateKey {
  const cleaned = String(value || '').toLowerCase().trim();
  if (cleaned && Object.prototype.hasOwnProperty.call(CARD_TEMPLATES, cleaned)) {
    return cleaned as TemplateKey;
  }
  return fallback;
}

function normalizeRace(value: any) {
  const cleaned = String(value || '').toLowerCase().trim();
  return cleaned || '';
}

function parseTraits(value: any) {
  if (Array.isArray(value)) {
    return value.map((trait) => String(trait).toLowerCase().trim()).filter(Boolean);
  }
  const raw = String(value || '').trim();
  if (!raw) return [];
  return raw
    .split(/[,|]/g)
    .map((trait) => trait.trim().toLowerCase())
    .filter(Boolean);
}

function buildArt(kindRaw: any, srcRaw: any, posterRaw: any): CardArt | undefined {
  if (!srcRaw) return undefined;
  const kind = String(kindRaw || '').toLowerCase().trim();
  const src = String(srcRaw);
  const poster = posterRaw ? String(posterRaw) : undefined;
  if (kind === 'video') {
    if (!isSupportedVideoSrc(src)) return undefined;
    return { kind: 'video', src, poster };
  }
  if (kind === 'image' || !kind) {
    return { kind: 'image', src };
  }
  return undefined;
}

function isSupportedVideoSrc(src: string) {
  const lower = src.toLowerCase();
  if (lower.startsWith('data:video/mp4') || lower.startsWith('data:video/webm')) return true;
  if (lower.endsWith('.mp4') || lower.endsWith('.webm')) return true;
  return false;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ensureUniqueId(id: string, used: Map<string, number>) {
  const base = id || 'card';
  if (!used.has(base)) {
    used.set(base, 1);
    return base;
  }
  const next = (used.get(base) ?? 1) + 1;
  used.set(base, next);
  return `${base}_${next}`;
}

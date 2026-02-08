import type { CardArt, DataRow } from '../../../../packages/core/src/index';
import { CARD_TEMPLATES, type TemplateKey } from '../templates/cardTemplates';

export type GameAsset = {
  kind: 'poster' | 'image';
  name: string;
  dataUrlOrUrl: string;
};

export type GameExport = {
  cardsJson: string;
  assets: GameAsset[];
};

type LocalizedText = { en: string; ar: string };

export function buildGameExport(cards: DataRow[]): GameExport {
  const assets: GameAsset[] = [];
  const seen = new Set<string>();

  const runtimeCards = cards.map((row) => {
    const data = row.data ?? {};
    const art = (row as any).art ?? (data as any).art;

    if (art) {
      collectAssets(row.id, art, assets, seen);
    }

    return {
      id: row.id,
      rarity: normalizeRarity(data.rarity),
      templateKey: normalizeTemplateKey(data.templateKey),
      attack: normalizeNumber(data.attack),
      defense: normalizeNumber(data.defense),
      name: normalizeLocalized(data.name),
      ability: normalizeLocalized(data.desc ?? data.ability),
      art: art ? { kind: art.kind, src: art.src, poster: art.poster, transform: art.transform } : undefined,
    };
  });

  return {
    cardsJson: JSON.stringify({ cards: runtimeCards }, null, 2),
    assets,
  };
}

function collectAssets(id: string, art: CardArt, assets: GameAsset[], seen: Set<string>) {
  if (art.kind === 'video' && art.poster && isDataUrl(art.poster)) {
    pushAsset(assets, seen, {
      kind: 'poster',
      name: buildAssetName(id, 'poster', art.poster),
      dataUrlOrUrl: art.poster,
    });
  }

  if (art.kind === 'image' && art.src && isRemoteUrl(art.src)) {
    pushAsset(assets, seen, {
      kind: 'image',
      name: buildAssetName(id, 'image', art.src),
      dataUrlOrUrl: art.src,
    });
  }
}

function pushAsset(assets: GameAsset[], seen: Set<string>, asset: GameAsset) {
  const key = `${asset.kind}:${asset.name}`;
  if (seen.has(key)) return;
  seen.add(key);
  assets.push(asset);
}

function normalizeLocalized(value: any): LocalizedText {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      en: String(value.en ?? ''),
      ar: String(value.ar ?? ''),
    };
  }
  const text = value == null ? '' : String(value);
  return { en: text, ar: text };
}

function normalizeNumber(value: any) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeRarity(value: any) {
  const cleaned = String(value || '').toLowerCase().trim();
  if (cleaned === 'rare' || cleaned === 'epic' || cleaned === 'legendary') return cleaned;
  return 'common';
}

function normalizeTemplateKey(value: any): TemplateKey {
  const cleaned = String(value || '').toLowerCase().trim();
  if (cleaned && Object.prototype.hasOwnProperty.call(CARD_TEMPLATES, cleaned)) {
    return cleaned as TemplateKey;
  }
  return 'classic';
}

function isDataUrl(value: string) {
  return value.startsWith('data:');
}

function isRemoteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function buildAssetName(id: string, kind: 'poster' | 'image', src?: string) {
  if (src && !src.startsWith('data:')) {
    const trimmed = src.split('?')[0] ?? '';
    const parts = trimmed.split('/');
    const fileName = parts[parts.length - 1];
    if (fileName) return fileName;
  }
  return kind === 'poster' ? `${id}_poster.png` : `${id}_image`;
}

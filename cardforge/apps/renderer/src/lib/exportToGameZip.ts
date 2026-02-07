import type { DataRow } from '../../../../packages/core/src/index';

function dataUrlToBytes(dataUrl: string) {
  const [meta, base64] = dataUrl.split(',');
  const bin = atob(base64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    u8[i] = bin.charCodeAt(i);
  }
  const ext = meta.includes('image/png') ? 'png' : meta.includes('image/jpeg') ? 'jpg' : 'bin';
  return { u8, ext };
}

function normalizeLocalized(value: any, fallbackEn?: string, fallbackAr?: string) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      en: String(value.en ?? fallbackEn ?? ''),
      ar: String(value.ar ?? fallbackAr ?? ''),
    };
  }
  const text = value == null ? '' : String(value);
  return {
    en: text || String(fallbackEn ?? ''),
    ar: text || String(fallbackAr ?? ''),
  };
}

function normalizeNumber(value: any) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveTemplate(data: Record<string, any>) {
  return data.template ?? data.templateKey ?? data.template_key;
}

export async function exportToGameZip(opts: {
  cards: DataRow[] | any[];
  projectName?: string;
}) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const root = zip.folder(opts.projectName || 'game-export')!;

  // Build runtime cards.json (minimal)
  const runtimeCards = (opts.cards ?? []).map((card) => {
    const data = (card && card.data) ? card.data : card ?? {};
    const art = card?.art ?? data.art;
    const name = normalizeLocalized(data.name, data.character_name_en ?? card?.character_name_en, data.character_name_ar ?? card?.character_name_ar);
    const ability = normalizeLocalized(
      data.desc ?? data.ability,
      data.ability_en ?? card?.ability_en,
      data.ability_ar ?? card?.ability_ar,
    );

    return {
      id: card?.id ?? data.id,
      rarity: data.rarity ?? card?.rarity,
      template: resolveTemplate(data),
      bgColor: data.bgColor ?? card?.bgColor,
      attack: normalizeNumber(data.attack ?? data.stats?.attack ?? card?.attack),
      defense: normalizeNumber(data.defense ?? data.stats?.defense ?? card?.defense),
      cost: data.cost ?? card?.cost,
      name,
      ability,
      art: art
        ? {
          kind: art.kind,
          src: art.kind === 'video' ? (art.poster || art.src) : art.src,
          videoSrc: art.kind === 'video' ? art.src : undefined,
          poster: art.kind === 'video' ? art.poster : undefined,
          transform: art.transform,
        }
        : undefined,
      tags: data.tags ?? card?.tags,
    };
  });

  root.file('cards.json', JSON.stringify(runtimeCards, null, 2));

  // Export posters as files if dataURL
  const postersDir = root.folder('posters')!;
  for (const card of opts.cards ?? []) {
    const art = card?.art ?? card?.data?.art;
    if (art?.kind === 'video' && typeof art.poster === 'string' && art.poster.startsWith('data:')) {
      const { u8, ext } = dataUrlToBytes(art.poster);
      postersDir.file(`${card.id}.${ext}`, u8);
    }
  }

  // Export embedded images (dataURL) if any
  const imagesDir = root.folder('images')!;
  for (const card of opts.cards ?? []) {
    const art = card?.art ?? card?.data?.art;
    if (art?.kind === 'image' && typeof art.src === 'string' && art.src.startsWith('data:')) {
      const { u8, ext } = dataUrlToBytes(art.src);
      imagesDir.file(`${card.id}.${ext}`, u8);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
}

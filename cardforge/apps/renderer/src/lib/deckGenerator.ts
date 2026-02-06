import { generateBalancedStats, type Rarity } from './balanceRules';
import { generateAdvancedStats } from './advancedBalance';
import type { AbilityKey } from './abilityRegistry';

const RARITIES = ['common', 'rare', 'epic', 'legendary'] as const;

export type RarityKey = typeof RARITIES[number];

export type DeckDistribution = Record<Rarity, number>;

export type GeneratedCard = {
  id: string;
  data: {
    name: { en: string; ar: string };
    desc: { en: string; ar: string };
    rarity: RarityKey;
    templateKey: string;
    bgColor?: string;
    cost?: number;
    ability_id?: AbilityKey;
    stats: { attack: number; defense: number };
    attack: number;
    defense: number;
  };
};

export type DeckGenerateResult = {
  cards: GeneratedCard[];
  counts: Record<RarityKey, number>;
  normalized: DeckDistribution;
  autoBalanced: boolean;
};

const RARITY_LABELS = {
  common: { en: 'Common', ar: 'عادي' },
  rare: { en: 'Rare', ar: 'نادر' },
  epic: { en: 'Epic', ar: 'ملحمي' },
  legendary: { en: 'Legendary', ar: 'أسطوري' },
} as const;

function toNumber(value: any) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, numberValue) : 0;
}

function normalizeDistribution(distribution: Partial<DeckDistribution>) {
  const raw: DeckDistribution = {
    common: toNumber(distribution.common),
    rare: toNumber(distribution.rare),
    epic: toNumber(distribution.epic),
    legendary: toNumber(distribution.legendary),
  };
  const sum = raw.common + raw.rare + raw.epic + raw.legendary;
  if (sum <= 0) {
    return {
      normalized: { common: 100, rare: 0, epic: 0, legendary: 0 },
      changed: true,
    };
  }
  if (sum === 100) {
    return { normalized: raw, changed: false };
  }
  const factor = 100 / sum;
  return {
    normalized: {
      common: raw.common * factor,
      rare: raw.rare * factor,
      epic: raw.epic * factor,
      legendary: raw.legendary * factor,
    },
    changed: true,
  };
}

function computeCounts(
  size: number,
  normalized: DeckDistribution,
): { counts: Record<RarityKey, number>; autoBalanced: boolean } {
  const counts: Record<RarityKey, number> = { common: 0, rare: 0, epic: 0, legendary: 0 };
  if (size <= 0) {
    return { counts, autoBalanced: false };
  }

  const nonZero = RARITIES.filter((rarity) => normalized[rarity] > 0);
  if (size < nonZero.length) {
    const sorted = [...nonZero].sort((a, b) => normalized[b] - normalized[a]);
    sorted.slice(0, size).forEach((rarity) => {
      counts[rarity] = 1;
    });
    return { counts, autoBalanced: true };
  }

  const rawCounts = RARITIES.map((rarity) => ({
    rarity,
    raw: (size * normalized[rarity]) / 100,
  }));

  rawCounts.forEach((item) => {
    counts[item.rarity] = Math.floor(item.raw);
  });

  let remaining = size - RARITIES.reduce((sum, rarity) => sum + counts[rarity], 0);
  if (remaining > 0) {
    rawCounts
      .sort((a, b) => (b.raw - Math.floor(b.raw)) - (a.raw - Math.floor(a.raw)))
      .forEach((item) => {
        if (remaining <= 0) return;
        counts[item.rarity] += 1;
        remaining -= 1;
      });
  }

  let autoBalanced = false;

  nonZero.forEach((rarity) => {
    if (counts[rarity] > 0) return;
    const donor = RARITIES.reduce<RarityKey | null>((current, candidate) => {
      if (counts[candidate] <= 1) return current;
      if (!current) return candidate;
      return counts[candidate] > counts[current] ? candidate : current;
    }, null);
    if (!donor) {
      autoBalanced = true;
      return;
    }
    counts[donor] -= 1;
    counts[rarity] = 1;
    autoBalanced = true;
  });

  return { counts, autoBalanced };
}

function buildId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `card_${Math.random().toString(36).slice(2, 10)}`;
}

export function generateDeck({
  size,
  distribution,
  templates,
  lang,
  advancedBalance,
  cost,
  abilityKey,
  abilityTextEn,
  abilityTextAr,
}: {
  size: number;
  distribution: Partial<DeckDistribution>;
  templates: string[];
  lang?: 'ar' | 'en';
  advancedBalance?: boolean;
  cost?: number;
  abilityKey?: AbilityKey;
  abilityTextEn?: string;
  abilityTextAr?: string;
}): DeckGenerateResult {
  const safeSize = Number.isFinite(size) ? Math.max(0, Math.floor(size)) : 0;
  const { normalized, changed } = normalizeDistribution(distribution);
  const { counts, autoBalanced: countBalanced } = computeCounts(safeSize, normalized);
  const autoBalanced = changed || countBalanced;
  const templatePool = templates.length ? templates : ['classic'];
  const preferredLang = lang === 'ar' ? 'ar' : 'en';
  const rawCost = cost ?? NaN;
  const safeCost = Number.isFinite(rawCost) ? Math.max(0, rawCost) : undefined;

  const cards: GeneratedCard[] = [];
  RARITIES.forEach((rarity) => {
    const count = counts[rarity] ?? 0;
    for (let i = 0; i < count; i += 1) {
      const advanced = advancedBalance
        ? generateAdvancedStats({
          rarity,
          cost: safeCost,
          abilityKey,
          abilityTextEn,
          abilityTextAr,
        })
        : null;
      const stats = advanced ?? generateBalancedStats(rarity);
      const resolvedAbilityKey = advanced?.abilityKey ?? abilityKey;
      const templateKey = templatePool[Math.floor(Math.random() * templatePool.length)];
      const label = RARITY_LABELS[rarity];
      const index = i + 1;
      const nameEn = `Card ${label.en} ${index}`;
      const nameAr = `بطاقة ${label.ar} ${index}`;
      const descEn = 'Auto ability';
      const descAr = 'قدرة تلقائية';
      const fallbackName = preferredLang === 'ar' ? nameAr : nameEn;
      const fallbackDesc = preferredLang === 'ar' ? descAr : descEn;

      const data: GeneratedCard['data'] = {
        name: { en: nameEn || fallbackName, ar: nameAr || fallbackName },
        desc: { en: descEn || fallbackDesc, ar: descAr || fallbackDesc },
        rarity,
        templateKey,
        stats: { attack: stats.attack, defense: stats.defense },
        attack: stats.attack,
        defense: stats.defense,
      };
      if (safeCost !== undefined) {
        data.cost = safeCost;
      }
      if (resolvedAbilityKey) {
        data.ability_id = resolvedAbilityKey;
      }

      cards.push({
        id: buildId(),
        data,
      });
    }
  });

  return { cards, counts, normalized, autoBalanced };
}

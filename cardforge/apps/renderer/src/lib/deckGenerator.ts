import type { CardRace, CardTrait } from '../../../../packages/core/src/index';
import { generateBalancedStats, type Rarity } from './balanceRules';
import { generateAdvancedStats } from './advancedBalance';
import { ABILITY_POWER, type AbilityKey } from './abilityRegistry';

const RARITIES = ['common', 'rare', 'epic', 'legendary'] as const;

export type RarityKey = typeof RARITIES[number];

export type DeckDistribution = Record<Rarity, number>;

export type NumRange = { min: number; max: number };

export type RarityRanges = {
  enabled: boolean;
  attack: NumRange;
  defense: NumRange;
  cost?: NumRange;
};

export type DeckGenRangesConfig = {
  enabled: boolean;
  perRarity: Record<RarityKey, RarityRanges>;
  lowDuplicate: boolean;
  duplicateBudget: number;
  seed?: string;
};

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
    race?: CardRace;
    traits?: CardTrait[];
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

const DEFAULT_RANGES: Record<RarityKey, { attack: NumRange; defense: NumRange; cost: NumRange }> = {
  common: { attack: { min: 1, max: 6 }, defense: { min: 1, max: 6 }, cost: { min: 0, max: 2 } },
  rare: { attack: { min: 3, max: 9 }, defense: { min: 3, max: 9 }, cost: { min: 1, max: 3 } },
  epic: { attack: { min: 6, max: 12 }, defense: { min: 6, max: 12 }, cost: { min: 2, max: 4 } },
  legendary: { attack: { min: 9, max: 15 }, defense: { min: 9, max: 15 }, cost: { min: 3, max: 6 } },
};

const DEFAULT_RACES: CardRace[] = ['human', 'elf', 'demon', 'beast', 'animal', 'amphibian'];

const DEFAULT_TRAITS: CardTrait[] = ['fire', 'ice', 'swordsman', 'archer', 'tank', 'poison', 'flying'];

export function createDefaultRangesConfig(): DeckGenRangesConfig {
  return {
    enabled: false,
    lowDuplicate: true,
    duplicateBudget: 2,
    seed: '',
    perRarity: {
      common: { enabled: true, ...DEFAULT_RANGES.common },
      rare: { enabled: true, ...DEFAULT_RANGES.rare },
      epic: { enabled: true, ...DEFAULT_RANGES.epic },
      legendary: { enabled: true, ...DEFAULT_RANGES.legendary },
    },
  };
}

const RARITY_LABELS = {
  common: { en: 'Common', ar: 'Ø¹Ø§Ø¯ÙŠ' },
  rare: { en: 'Rare', ar: 'Ù†Ø§Ø¯Ø±' },
  epic: { en: 'Epic', ar: 'Ù…Ù„Ø­Ù…ÙŠ' },
  legendary: { en: 'Legendary', ar: 'Ø£Ø³Ø·ÙˆØ±ÙŠ' },
} as const;

function toNumber(value: any) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, numberValue) : 0;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeRange(range: NumRange | undefined, fallback: NumRange) {
  const rawMin = Number(range?.min);
  const rawMax = Number(range?.max);
  const min = Number.isFinite(rawMin) ? clampNumber(Math.floor(rawMin), 0, 999) : fallback.min;
  const max = Number.isFinite(rawMax) ? clampNumber(Math.floor(rawMax), 0, 999) : fallback.max;
  if (max < min) {
    return { min: max, max: min };
  }
  return { min, max };
}

function normalizeDistribution(distribution: Partial<DeckDistribution>, activeRarities: RarityKey[] = RARITIES) {
  const raw: DeckDistribution = {
    common: toNumber(distribution.common),
    rare: toNumber(distribution.rare),
    epic: toNumber(distribution.epic),
    legendary: toNumber(distribution.legendary),
  };
  const activeSet = new Set(activeRarities);
  const sum = activeRarities.reduce((total, rarity) => total + raw[rarity], 0);
  if (sum <= 0) {
    return {
      normalized: { common: 100, rare: 0, epic: 0, legendary: 0 },
      changed: true,
    };
  }
  const factor = sum === 100 ? 1 : 100 / sum;
  const normalized: DeckDistribution = { common: 0, rare: 0, epic: 0, legendary: 0 };
  let changed = sum !== 100;
  RARITIES.forEach((rarity) => {
    if (!activeSet.has(rarity)) {
      if (raw[rarity] !== 0) changed = true;
      normalized[rarity] = 0;
      return;
    }
    normalized[rarity] = raw[rarity] * factor;
  });
  return {
    normalized,
    changed,
  };
}

function computeCounts(
  size: number,
  normalized: DeckDistribution,
  activeRarities: RarityKey[] = RARITIES,
): { counts: Record<RarityKey, number>; autoBalanced: boolean } {
  const counts: Record<RarityKey, number> = { common: 0, rare: 0, epic: 0, legendary: 0 };
  if (size <= 0 || activeRarities.length === 0) {
    return { counts, autoBalanced: false };
  }

  const nonZero = activeRarities.filter((rarity) => normalized[rarity] > 0);
  if (size < nonZero.length) {
    const sorted = [...nonZero].sort((a, b) => normalized[b] - normalized[a]);
    sorted.slice(0, size).forEach((rarity) => {
      counts[rarity] = 1;
    });
    return { counts, autoBalanced: true };
  }

  const rawCounts = activeRarities.map((rarity) => ({
    rarity,
    raw: (size * normalized[rarity]) / 100,
  }));

  rawCounts.forEach((item) => {
    counts[item.rarity] = Math.floor(item.raw);
  });

  let remaining = size - activeRarities.reduce((sum, rarity) => sum + counts[rarity], 0);
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
    const donor = activeRarities.reduce<RarityKey | null>((current, candidate) => {
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

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let next = t;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function createRng(seed?: string) {
  if (!seed) return Math.random;
  return mulberry32(hashSeed(seed));
}

function randInt(rng: () => number, min: number, max: number) {
  if (min >= max) return min;
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pickWeighted<T>(items: T[], weights: number[], rng: () => number) {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (!Number.isFinite(total) || total <= 0) {
    return items[Math.floor(rng() * items.length)];
  }
  let roll = rng() * total;
  for (let i = 0; i < items.length; i += 1) {
    roll -= weights[i] ?? 0;
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
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
  rangesConfig,
  racePool,
  traitPool,
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
  rangesConfig?: DeckGenRangesConfig;
  racePool?: CardRace[];
  traitPool?: CardTrait[];
}): DeckGenerateResult {
  const safeSize = Number.isFinite(size) ? Math.max(0, Math.floor(size)) : 0;
  const rangesEnabled = Boolean(rangesConfig?.enabled);
  const enabledRarities = rangesEnabled
    ? RARITIES.filter((rarity) => rangesConfig?.perRarity?.[rarity]?.enabled)
    : RARITIES;
  const activeRarities = rangesEnabled && enabledRarities.length > 0 ? enabledRarities : RARITIES;
  const { normalized, changed } = normalizeDistribution(distribution, activeRarities);
  const { counts, autoBalanced: countBalanced } = computeCounts(safeSize, normalized, activeRarities);
  const autoBalanced = changed || countBalanced || (rangesEnabled && enabledRarities.length === 0);
  const templatePool = templates.length ? templates : ['classic'];
  const preferredLang = lang === 'ar' ? 'ar' : 'en';
  const rawCost = cost ?? NaN;
  const safeCost = Number.isFinite(rawCost) ? Math.max(0, rawCost) : undefined;
  const rng = createRng(rangesEnabled ? rangesConfig?.seed?.trim() : undefined);
  const useLowDuplicate = Boolean(rangesEnabled && rangesConfig?.lowDuplicate);
  const maxPerSignature = useLowDuplicate ? Math.max(1, Math.floor(rangesConfig?.duplicateBudget ?? 2)) : Infinity;
  const maxAttempts = useLowDuplicate ? 12 : 1;
  const abilityPool = Object.keys(ABILITY_POWER) as AbilityKey[];
  const resolvedRacePool = racePool && racePool.length ? racePool : DEFAULT_RACES;
  const resolvedTraitPool = traitPool && traitPool.length ? traitPool : DEFAULT_TRAITS;

  const resolvedRanges = rangesEnabled
    ? RARITIES.reduce<Record<RarityKey, RarityRanges>>((acc, rarity) => {
      const config = rangesConfig?.perRarity?.[rarity];
      const defaults = DEFAULT_RANGES[rarity];
      acc[rarity] = {
        enabled: config?.enabled ?? true,
        attack: normalizeRange(config?.attack, defaults.attack),
        defense: normalizeRange(config?.defense, defaults.defense),
        cost: normalizeRange(config?.cost, defaults.cost),
      };
      return acc;
    }, {} as Record<RarityKey, RarityRanges>)
    : null;

  const abilityUsage: Record<RarityKey, Record<AbilityKey, number>> = {
    common: {},
    rare: {},
    epic: {},
    legendary: {},
  };
  const raceUsage = new Map<CardRace, number>();
  const traitUsage = new Map<CardTrait, number>();

  const pickRace = () => {
    if (!resolvedRacePool.length) return undefined;
    const weights = resolvedRacePool.map((race) => 1 / (1 + (raceUsage.get(race) ?? 0)));
    return pickWeighted(resolvedRacePool, weights, rng);
  };

  const pickTraits = () => {
    if (!resolvedTraitPool.length) return [] as CardTrait[];
    const maxTraits = Math.min(2, resolvedTraitPool.length);
    const count = randInt(rng, 1, maxTraits);
    const selected: CardTrait[] = [];
    let available = [...resolvedTraitPool];
    for (let i = 0; i < count; i += 1) {
      if (!available.length) break;
      const weights = available.map((trait) => 1 / (1 + (traitUsage.get(trait) ?? 0)));
      const trait = pickWeighted(available, weights, rng);
      selected.push(trait);
      available = available.filter((item) => item !== trait);
    }
    return selected;
  };

  const cards: GeneratedCard[] = [];
  const signatureCounts = new Map<string, number>();
  RARITIES.forEach((rarity) => {
    const count = counts[rarity] ?? 0;
    for (let i = 0; i < count; i += 1) {
      const label = RARITY_LABELS[rarity];
      const index = i + 1;
      const nameEn = `Card ${label.en} ${index}`;
      const nameAr = `Ø¨Ø·Ø§Ù‚Ø© ${label.ar} ${index}`;
      const descEn = 'Auto ability';
      const descAr = 'Ù‚Ø¯Ø±Ø© ØªÙ„Ù‚Ø§Ø¦ÙŠØ©';
      const fallbackName = preferredLang === 'ar' ? nameAr : nameEn;
      const fallbackDesc = preferredLang === 'ar' ? descAr : descEn;

      let acceptedData: GeneratedCard['data'] | null = null;
      let lastSignature = '';
      let lastData: GeneratedCard['data'] | null = null;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const templateKey = templatePool[Math.floor(rng() * templatePool.length)];
        let resolvedAbilityKey = abilityKey;
        if (rangesEnabled && !abilityKey && abilityPool.length) {
          if (useLowDuplicate) {
            const usage = abilityUsage[rarity];
            const weights = abilityPool.map((key) => 1 / (1 + (usage[key] ?? 0)));
            resolvedAbilityKey = pickWeighted(abilityPool, weights, rng);
          } else {
            resolvedAbilityKey = abilityPool[Math.floor(rng() * abilityPool.length)];
          }
        }

        let nextCost = safeCost;
        let stats: { attack: number; defense: number };

        if (rangesEnabled && resolvedRanges) {
          const range = resolvedRanges[rarity];
          if (range.cost) {
            nextCost = randInt(rng, range.cost.min, range.cost.max);
          }
          if (advancedBalance) {
            const advanced = generateAdvancedStats({
              rarity,
              cost: nextCost,
              abilityKey: resolvedAbilityKey,
              abilityTextEn,
              abilityTextAr,
              rng,
            });
            stats = {
              attack: clampNumber(advanced.attack, range.attack.min, range.attack.max),
              defense: clampNumber(advanced.defense, range.defense.min, range.defense.max),
            };
            resolvedAbilityKey = advanced.abilityKey ?? resolvedAbilityKey;
          } else {
            stats = {
              attack: randInt(rng, range.attack.min, range.attack.max),
              defense: randInt(rng, range.defense.min, range.defense.max),
            };
          }
          if (range.cost && nextCost != null) {
            nextCost = clampNumber(nextCost, range.cost.min, range.cost.max);
          }
        } else {
          const advanced = advancedBalance
            ? generateAdvancedStats({
              rarity,
              cost: safeCost,
              abilityKey,
              abilityTextEn,
              abilityTextAr,
            })
            : null;
          stats = advanced ?? generateBalancedStats(rarity);
          resolvedAbilityKey = advanced?.abilityKey ?? abilityKey;
        }

        const selectedRace = pickRace();
        const selectedTraits = pickTraits();

        const data: GeneratedCard['data'] = {
          name: { en: nameEn || fallbackName, ar: nameAr || fallbackName },
          desc: { en: descEn || fallbackDesc, ar: descAr || fallbackDesc },
          rarity,
          templateKey,
          race: selectedRace,
          traits: selectedTraits.length ? selectedTraits : undefined,
          stats: { attack: stats.attack, defense: stats.defense },
          attack: stats.attack,
          defense: stats.defense,
        };
        if (nextCost !== undefined) {
          data.cost = nextCost;
        }
        if (resolvedAbilityKey) {
          data.ability_id = resolvedAbilityKey;
        }

        const signature = `${rarity}:${stats.attack}:${stats.defense}:${nextCost ?? ''}:${resolvedAbilityKey ?? ''}:${selectedRace ?? ''}:${selectedTraits.join('.')}`;
        lastSignature = signature;
        lastData = data;
        const used = signatureCounts.get(signature) ?? 0;
        if (!useLowDuplicate || used < maxPerSignature) {
          signatureCounts.set(signature, used + 1);
          acceptedData = data;
          if (resolvedAbilityKey) {
            abilityUsage[rarity][resolvedAbilityKey] = (abilityUsage[rarity][resolvedAbilityKey] ?? 0) + 1;
          }
          if (selectedRace) {
            raceUsage.set(selectedRace, (raceUsage.get(selectedRace) ?? 0) + 1);
          }
          selectedTraits.forEach((trait) => {
            traitUsage.set(trait, (traitUsage.get(trait) ?? 0) + 1);
          });
          break;
        }
      }

      const finalData = acceptedData ?? lastData;
      if (!finalData) continue;
      if (!acceptedData) {
        const used = signatureCounts.get(lastSignature) ?? 0;
        signatureCounts.set(lastSignature, used + 1);
        const resolvedAbilityKey = finalData.ability_id;
        if (resolvedAbilityKey) {
          abilityUsage[rarity][resolvedAbilityKey] = (abilityUsage[rarity][resolvedAbilityKey] ?? 0) + 1;
        }
        if (finalData.race) {
          raceUsage.set(finalData.race, (raceUsage.get(finalData.race) ?? 0) + 1);
        }
        if (finalData.traits?.length) {
          finalData.traits.forEach((trait) => {
            traitUsage.set(trait, (traitUsage.get(trait) ?? 0) + 1);
          });
        }
      }

      cards.push({
        id: buildId(),
        data: finalData,
      });
    }
  });

  return { cards, counts, normalized, autoBalanced };
}

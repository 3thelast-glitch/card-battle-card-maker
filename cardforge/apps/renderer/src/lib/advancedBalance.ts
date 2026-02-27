import { BALANCE_RANGES, type Rarity } from './balanceRules';
import {
  ABILITY_POWER,
  inferAbilityKeyFromText,
  type AbilityKey,
} from './abilityRegistry';

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Core idea:
// baseTotal by rarity
// subtract abilityPower (stronger ability => lower stats)
// add costFactor (higher cost => can afford higher stats)
export function generateAdvancedStats(opts: {
  rarity: Rarity;
  cost?: number;
  abilityKey?: AbilityKey;
  abilityTextEn?: string;
  abilityTextAr?: string;
  rng?: () => number;
}) {
  const { rarity } = opts;
  const range = BALANCE_RANGES[rarity];

  const rawCost = opts.cost ?? 0;
  const cost = Number.isFinite(rawCost) ? rawCost : 0;
  const abilityKey =
    opts.abilityKey ??
    inferAbilityKeyFromText(opts.abilityTextEn || opts.abilityTextAr);

  const abilityPower = ABILITY_POWER[abilityKey] ?? 0;

  // base total: pick in range but center-ish
  const base = Math.round((range.min + range.max) / 2);

  // cost factor: +0..+3 typically
  const costBonus = clamp(Math.round(cost * 0.8), 0, 4);

  // ability penalty: 0..-5 typically
  const abilityPenalty = clamp(Math.round(abilityPower), 0, 6);

  let total = base + costBonus - abilityPenalty;

  total = clamp(total, range.min, range.max);

  // Split attack/defense with slight preference depending on ability type
  const prefersDefense =
    abilityKey === 'shield_loss_to_draw' || abilityKey === 'heal_defense';
  const pivotMin = 1;
  const pivotMax = total - 1;

  const rand = opts.rng ?? Math.random;
  let attack = Math.floor(rand() * (pivotMax - pivotMin + 1)) + pivotMin;
  let defense = total - attack;

  if (prefersDefense && defense < attack) {
    // swap to bias defense
    const tmp = attack;
    attack = defense;
    defense = tmp;
  }

  return {
    attack,
    defense,
    total,
    abilityKey,
    abilityPower,
    costBonus,
    abilityPenalty,
  };
}

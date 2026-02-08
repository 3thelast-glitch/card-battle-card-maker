import type { BaseTraitKey, DerivedTraitKey, TraitEffect } from './traits.types';
import { BASE_TRAITS } from './traits.registry';
import { TRAIT_RELATIONS } from './traits.relations';

const toKey = (value: unknown) => String(value ?? '').toLowerCase().trim();

export const normalizeBaseTraits = (input: unknown): BaseTraitKey[] => {
  if (!input) return [];
  const list = Array.isArray(input) ? input : String(input).split(/[,|]/g);
  const unique = new Set<BaseTraitKey>();
  list.forEach((trait) => {
    const key = toKey(trait) as BaseTraitKey;
    if (BASE_TRAITS.includes(key)) {
      unique.add(key);
    }
  });
  return Array.from(unique);
};

export const deriveTraits = (baseTraits: BaseTraitKey[]): DerivedTraitKey[] => {
  const derived = new Set<DerivedTraitKey>();
  baseTraits.forEach((trait) => {
    const relation = TRAIT_RELATIONS[trait];
    if (relation) derived.add(relation.derived);
  });
  return Array.from(derived);
};

export const computeTraitEffect = (baseTraits: BaseTraitKey[]): TraitEffect => {
  return baseTraits.reduce<TraitEffect>(
    (acc, trait) => {
      const relation = TRAIT_RELATIONS[trait];
      if (!relation) return acc;
      acc.attack += relation.effect.attack;
      acc.defense += relation.effect.defense;
      return acc;
    },
    { attack: 0, defense: 0 },
  );
};

export const applyTraitEngine = (params: {
  baseTraits: BaseTraitKey[];
  baseAttack: number;
  baseDefense: number;
}) => {
  const baseTraits = normalizeBaseTraits(params.baseTraits);
  const derivedTraits = deriveTraits(baseTraits);
  const effect = computeTraitEffect(baseTraits);
  const attack = Math.max(0, Math.round(params.baseAttack + effect.attack));
  const defense = Math.max(0, Math.round(params.baseDefense + effect.defense));
  return {
    baseTraits,
    derivedTraits,
    allTraits: [...baseTraits, ...derivedTraits],
    effect,
    attack,
    defense,
  };
};

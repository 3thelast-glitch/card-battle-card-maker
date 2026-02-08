import type { BaseTraitKey, DerivedTraitKey, TraitKey, TraitEffect } from './traits.types';
import { TRAIT_RELATIONS } from './traits.relations';

export type TraitMeta = {
  key: TraitKey;
  labelKey: string;
  icon: string;
  derived?: boolean;
  effect?: TraitEffect;
};

export const BASE_TRAITS: BaseTraitKey[] = ['human', 'animal', 'swordsman'];
export const DERIVED_TRAITS: DerivedTraitKey[] = ['tactical', 'ferocious', 'swift'];

export const TRAIT_META: Record<TraitKey, TraitMeta> = {
  human: {
    key: 'human',
    labelKey: 'traits.human',
    icon: 'H',
  },
  animal: {
    key: 'animal',
    labelKey: 'traits.animal',
    icon: 'A',
  },
  swordsman: {
    key: 'swordsman',
    labelKey: 'traits.swordsman',
    icon: 'S',
  },
  tactical: {
    key: 'tactical',
    labelKey: 'traits.tactical',
    icon: 'T',
    derived: true,
    effect: TRAIT_RELATIONS.human.effect,
  },
  ferocious: {
    key: 'ferocious',
    labelKey: 'traits.ferocious',
    icon: 'F',
    derived: true,
    effect: TRAIT_RELATIONS.animal.effect,
  },
  swift: {
    key: 'swift',
    labelKey: 'traits.swift',
    icon: 'Q',
    derived: true,
    effect: TRAIT_RELATIONS.swordsman.effect,
  },
};

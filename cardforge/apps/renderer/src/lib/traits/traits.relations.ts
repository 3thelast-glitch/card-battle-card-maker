import type {
  BaseTraitKey,
  DerivedTraitKey,
  TraitEffect,
} from './traits.types';

export type TraitRelation = {
  derived: DerivedTraitKey;
  effect: TraitEffect;
};

export const TRAIT_RELATIONS: Record<BaseTraitKey, TraitRelation> = {
  human: { derived: 'tactical', effect: { attack: 0, defense: 1 } },
  animal: { derived: 'ferocious', effect: { attack: 2, defense: 0 } },
  swordsman: { derived: 'swift', effect: { attack: 1, defense: -1 } },
};

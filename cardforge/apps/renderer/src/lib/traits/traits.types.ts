export type BaseTraitKey = 'human' | 'animal' | 'swordsman';

export type DerivedTraitKey = 'tactical' | 'ferocious' | 'swift';

export type TraitKey = BaseTraitKey | DerivedTraitKey;

export type TraitEffect = {
  attack: number;
  defense: number;
};

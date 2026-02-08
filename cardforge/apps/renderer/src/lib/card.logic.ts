import { applyTraitEngine, normalizeBaseTraits } from './traits/traits.engine';
import type { BaseTraitKey } from './traits/traits.types';

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const applyTraitsToData = (data: Record<string, any>) => {
  const baseTraits = normalizeBaseTraits(
    data.baseTraits ?? data.traitsBase ?? data.baseTrait ?? [],
  );
  const baseAttack = toNumber(data.baseAttack ?? data.attack ?? 0);
  const baseDefense = toNumber(data.baseDefense ?? data.defense ?? 0);
  const engine = applyTraitEngine({ baseTraits, baseAttack, baseDefense });

  return {
    ...engine,
    baseAttack,
    baseDefense,
    nextData: {
      ...data,
      baseTraits: engine.baseTraits as BaseTraitKey[],
      derivedTraits: engine.derivedTraits,
      traitsAdvanced: engine.allTraits,
      baseAttack,
      baseDefense,
      attack: engine.attack,
      defense: engine.defense,
    },
  };
};

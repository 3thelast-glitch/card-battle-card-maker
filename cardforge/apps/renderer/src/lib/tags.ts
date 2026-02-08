import type { CardRace, CardTrait } from '../../../../packages/core/src/index';

type TagMeta = {
  labelKey: string;
  icon: string;
  color: string;
};

export const RACES: Record<string, TagMeta> = {
  human: { labelKey: 'races.human', icon: 'H', color: '#4a7bd0' },
  animal: { labelKey: 'races.animal', icon: 'A', color: '#a0a0a0' },
  elf: { labelKey: 'races.elf', icon: 'E', color: '#3fa66a' },
  demon: { labelKey: 'races.demon', icon: 'D', color: '#b03a3a' },
  beast: { labelKey: 'races.beast', icon: 'B', color: '#8b6b35' },
  amphibian: { labelKey: 'races.amphibian', icon: 'Am', color: '#2aa8a8' },
};

export const TRAITS: Record<string, TagMeta> = {
  swordsman: { labelKey: 'traits.swordsman', icon: 'S', color: '#dcdcdc' },
  archer: { labelKey: 'traits.archer', icon: 'A', color: '#6aa84f' },
  mage: { labelKey: 'traits.mage', icon: 'M', color: '#a855f7' },
  fire: { labelKey: 'traits.fire', icon: 'F', color: '#ff6b35' },
  ice: { labelKey: 'traits.ice', icon: 'I', color: '#6bc6ff' },
  poison: { labelKey: 'traits.poison', icon: 'P', color: '#8cff8c' },
  flying: { labelKey: 'traits.flying', icon: 'Fl', color: '#38bdf8' },
  holy: { labelKey: 'traits.holy', icon: 'Ho', color: '#f5d76e' },
  shadow: { labelKey: 'traits.shadow', icon: 'Sh', color: '#8b5cf6' },
};

export const KNOWN_RACES = Object.keys(RACES) as CardRace[];
export const KNOWN_TRAITS = Object.keys(TRAITS) as CardTrait[];

function normalizeKey(value: unknown) {
  return String(value ?? '').toLowerCase().trim();
}

export function normalizeTraits(input: unknown): CardTrait[] {
  if (Array.isArray(input)) {
    return Array.from(
      new Set(
        input
          .map((trait) => normalizeKey(trait))
          .filter(Boolean),
      ),
    ) as CardTrait[];
  }
  const raw = normalizeKey(input);
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(/[,|]/g)
        .map((trait) => normalizeKey(trait))
        .filter(Boolean),
    ),
  ) as CardTrait[];
}

export function hasRace(row: { race?: CardRace }, race: CardRace) {
  return normalizeKey(row.race) === normalizeKey(race);
}

export function hasTrait(row: { traits?: CardTrait[] }, trait: CardTrait) {
  const target = normalizeKey(trait);
  return (row.traits ?? []).some((item) => normalizeKey(item) === target);
}

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export const BALANCE_RANGES: Record<Rarity, { min: number; max: number }> = {
  common: { min: 2, max: 4 },
  rare: { min: 4, max: 7 },
  epic: { min: 7, max: 10 },
  legendary: { min: 10, max: 14 },
};

export function generateBalancedStats(rarity: Rarity) {
  const { min, max } = BALANCE_RANGES[rarity];
  const total = Math.floor(Math.random() * (max - min + 1)) + min;

  const attack = Math.floor(Math.random() * (total - 1)) + 1;
  const defense = total - attack;

  return { attack, defense };
}

export function generateStats(rarity: Rarity) {
  return generateBalancedStats(rarity);
}

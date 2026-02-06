export const RARITY_COLORS = {
  common: '#b0b0b0',
  rare: '#2e86ff',
  epic: '#9b4dff',
  legendary: '#ff9f1c',
} as const;

export type Rarity = keyof typeof RARITY_COLORS;

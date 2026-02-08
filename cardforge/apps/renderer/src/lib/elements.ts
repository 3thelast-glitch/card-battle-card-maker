import type { ElementKey } from '../../../../packages/core/src/index';

export const ELEMENTS: Record<
  ElementKey,
  { labelKey: string; icon: string; color: string }
> = {
  ice: { labelKey: 'elements.ice', icon: '❄', color: '#6ecbff' },
  fire: { labelKey: 'elements.fire', icon: '🔥', color: '#ff6a3d' },
  nature: { labelKey: 'elements.nature', icon: '🌿', color: '#5cff8a' },
  water: { labelKey: 'elements.water', icon: '💧', color: '#4aa3ff' },
  electric: { labelKey: 'elements.electric', icon: '⚡', color: '#ffd34a' },
  shadow: { labelKey: 'elements.shadow', icon: '🌙', color: '#b18cff' },
} as const;

export const ELEMENT_MATCHUPS: Record<
  ElementKey,
  { weakTo: ElementKey[]; strongAgainst: ElementKey[]; resist: ElementKey[] }
> = {
  ice: { weakTo: ['fire'], strongAgainst: ['nature'], resist: ['water'] },
  fire: { weakTo: ['water', 'ice'], strongAgainst: ['nature'], resist: [] },
  nature: { weakTo: ['fire', 'ice'], strongAgainst: ['water'], resist: [] },
  water: { weakTo: ['nature', 'electric'], strongAgainst: ['fire'], resist: ['fire'] },
  electric: { weakTo: ['nature'], strongAgainst: ['water'], resist: [] },
  shadow: { weakTo: ['electric'], strongAgainst: ['nature'], resist: [] },
} as const;

export function getMatchup(element?: ElementKey) {
  if (!element) return { weakTo: [], strongAgainst: [], resist: [] };
  return ELEMENT_MATCHUPS[element] ?? { weakTo: [], strongAgainst: [], resist: [] };
}

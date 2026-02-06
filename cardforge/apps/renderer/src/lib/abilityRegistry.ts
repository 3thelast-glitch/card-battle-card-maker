import type { CardRace, CardTrait } from '../../../../packages/core/src/index';

export type AbilityKey =
  | 'none'
  | 'shield_loss_to_draw'
  | 'predict_two_rounds'
  | 'double_on_win'
  | 'steal_attack'
  | 'heal_defense';

export const ABILITY_POWER: Record<AbilityKey, number> = {
  none: 0,
  shield_loss_to_draw: 3.0,
  predict_two_rounds: 2.0,
  double_on_win: 4.5,
  steal_attack: 3.5,
  heal_defense: 2.5,
};

export function inferAbilityKeyFromText(text?: string): AbilityKey {
  if (!text) return 'none';
  const t = text.toLowerCase();
  if (t.includes('loss') && t.includes('draw')) return 'shield_loss_to_draw';
  if (t.includes('predict') && t.includes('two')) return 'predict_two_rounds';
  if (t.includes('double') && t.includes('win')) return 'double_on_win';
  if (t.includes('steal') && t.includes('attack')) return 'steal_attack';
  if (t.includes('heal') || t.includes('defense')) return 'heal_defense';
  return 'none';
}

export type TargetFilter = {
  race?: CardRace;
  hasTrait?: CardTrait;
  hasTraitsAll?: CardTrait[];
  hasTraitsAny?: CardTrait[];
};

export type TargetCard = {
  race?: CardRace;
  traits?: CardTrait[];
};

export function matchesTarget(card: TargetCard, filter?: TargetFilter) {
  if (!filter) return true;
  if (filter.race && card.race !== filter.race) return false;
  const traits = new Set(card.traits ?? []);
  if (filter.hasTrait && !traits.has(filter.hasTrait)) return false;
  if (filter.hasTraitsAll && !filter.hasTraitsAll.every((trait) => traits.has(trait))) return false;
  if (filter.hasTraitsAny && !filter.hasTraitsAny.some((trait) => traits.has(trait))) return false;
  return true;
}

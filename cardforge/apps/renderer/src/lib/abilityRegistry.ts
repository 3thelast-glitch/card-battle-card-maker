import type { CardRace, CardTrait } from '../../../../packages/core/src/index';

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
  races?: CardRace[];
  traits?: CardTrait[];
};

export type TargetCard = {
  race?: CardRace;
  traits?: CardTrait[];
};

export function matchesTarget(card: TargetCard, filter?: TargetFilter) {
  if (!filter) return true;
  const cardRace = String(card.race ?? '').toLowerCase().trim();
  const cardTraits = new Set((card.traits ?? []).map((trait) => String(trait).toLowerCase().trim()));
  if (filter.races?.length) {
    const allowed = filter.races.map((race) => String(race).toLowerCase().trim());
    if (!allowed.some((race) => race === cardRace)) return false;
  }
  if (filter.traits?.length) {
    const allowedTraits = filter.traits.map((trait) => String(trait).toLowerCase().trim());
    if (!allowedTraits.some((trait) => cardTraits.has(trait))) return false;
  }
  return true;
}

import type { CardRace, CardTrait } from '../../../../packages/core/src/index';
import type { Rarity } from './balanceRules';
import { matchesTarget, type TargetFilter } from './abilityRegistry';

type Card = {
  id: string;
  attack: number;
  defense: number;
  rarity: Rarity;
  abilityKey?: string;
  race?: CardRace;
  traits?: CardTrait[];
};

export type SimResult = {
  runs: number;
  p1Wins: number;
  p2Wins: number;
  draws: number;
};

type SimOptions = {
  target?: TargetFilter;
  bonus?: { attack?: number; defense?: number };
};

function score(card: Card, options?: SimOptions) {
  const bonus =
    options?.target && matchesTarget(card, options.target)
      ? options.bonus
      : undefined;
  const attack = card.attack + (bonus?.attack ?? 0);
  const defense = card.defense + (bonus?.defense ?? 0);
  // Simple scoring: attack has more weight, defense as stability
  return attack * 1.2 + defense * 1.0;
}

export function simulate(
  runs: number,
  p1: Card[],
  p2: Card[],
  options?: SimOptions,
): SimResult {
  let p1Wins = 0;
  let p2Wins = 0;
  let draws = 0;

  for (let r = 0; r < runs; r += 1) {
    const c1 = p1[Math.floor(Math.random() * p1.length)];
    const c2 = p2[Math.floor(Math.random() * p2.length)];

    const s1 = score(c1, options) + (Math.random() - 0.5) * 0.6;
    const s2 = score(c2, options) + (Math.random() - 0.5) * 0.6;

    if (Math.abs(s1 - s2) < 0.25) draws += 1;
    else if (s1 > s2) p1Wins += 1;
    else p2Wins += 1;
  }

  return { runs, p1Wins, p2Wins, draws };
}

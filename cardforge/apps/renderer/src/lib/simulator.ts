import type { Rarity } from './balanceRules';

import type { Rarity } from './balanceRules';

type Card = {
  id: string;
  attack: number;
  defense: number;
  rarity: Rarity;
  abilityKey?: string;
};

export type SimResult = {
  runs: number;
  p1Wins: number;
  p2Wins: number;
  draws: number;
};

function score(card: Card) {
  // Simple scoring: attack has more weight, defense as stability
  return card.attack * 1.2 + card.defense * 1.0;
}

export function simulate(runs: number, p1: Card[], p2: Card[]): SimResult {
  let p1Wins = 0;
  let p2Wins = 0;
  let draws = 0;

  for (let r = 0; r < runs; r += 1) {
    const c1 = p1[Math.floor(Math.random() * p1.length)];
    const c2 = p2[Math.floor(Math.random() * p2.length)];

    const s1 = score(c1) + (Math.random() - 0.5) * 0.6;
    const s2 = score(c2) + (Math.random() - 0.5) * 0.6;

    if (Math.abs(s1 - s2) < 0.25) draws += 1;
    else if (s1 > s2) p1Wins += 1;
    else p2Wins += 1;
  }

  return { runs, p1Wins, p2Wins, draws };
}

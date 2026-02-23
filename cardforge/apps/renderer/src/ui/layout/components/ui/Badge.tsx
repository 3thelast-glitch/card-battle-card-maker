// src/ui/layout/components/ui/Badge.tsx
import { memo } from 'react';
import type { Rarity } from './CardFrame';

interface RarityBadgeProps {
  rarity: Rarity;
  size?: 'sm' | 'md' | 'lg';
}

const RARITY_STYLES: Record<Rarity, string> = {
  Common: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  Uncommon: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
  Rare: 'bg-sky-500/20 text-sky-300 border-sky-500/50',
  Epic: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
  Legendary: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
};

const RARITY_LABELS: Record<Rarity, string> = {
  Common: 'عادي',
  Uncommon: 'غير شائع',
  Rare: 'نادر',
  Epic: 'ملحمي',
  Legendary: 'أسطوري',
};

const SIZES = {
  sm: 'text-[9px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1',
};

export const RarityBadge = memo<RarityBadgeProps>(({ rarity, size = 'sm' }) => (
  <span
    className={`inline-flex items-center font-bold rounded-full border uppercase tracking-wider ${RARITY_STYLES[rarity]} ${SIZES[size]}`}
  >
    {RARITY_LABELS[rarity]}
  </span>
));
RarityBadge.displayName = 'RarityBadge';

/* ── Element badge ── */
interface ElementBadgeProps {
  element: string;
  size?: 'sm' | 'md';
}

const ELEMENT_STYLES: Record<
  string,
  { bg: string; border: string; emoji: string }
> = {
  fire: { bg: 'bg-red-500/20', border: 'border-red-500/40', emoji: '🔥' },
  water: { bg: 'bg-sky-500/20', border: 'border-sky-500/40', emoji: '💧' },
  nature: {
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/40',
    emoji: '🌿',
  },
  dark: { bg: 'bg-purple-500/20', border: 'border-purple-500/40', emoji: '🌑' },
  light: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', emoji: '✨' },
  neutral: {
    bg: 'bg-slate-500/20',
    border: 'border-slate-500/40',
    emoji: '⚪',
  },
};

export const ElementBadge = memo<ElementBadgeProps>(
  ({ element, size = 'sm' }) => {
    const cfg =
      ELEMENT_STYLES[element?.toLowerCase()] ?? ELEMENT_STYLES.neutral;
    return (
      <span
        className={`inline-flex items-center gap-1 font-medium rounded-full border ${cfg.bg} ${cfg.border} ${size === 'sm' ? 'text-[9px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}
      >
        <span>{cfg.emoji}</span>
        <span className="capitalize text-slate-300">{element || 'محايد'}</span>
      </span>
    );
  },
);
ElementBadge.displayName = 'ElementBadge';

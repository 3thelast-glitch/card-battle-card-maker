export type TraitKey =
  | 'swordsman'
  | 'fire'
  | 'ice'
  | 'archer'
  | 'mage'
  | 'tank'
  | 'poison'
  | 'flying'
  | 'holy'
  | 'shadow';

export const TRAIT_META: Record<string, { labelKey: string; tintClass: string }> = {
  swordsman: { labelKey: 'traits.swordsman', tintClass: 'swordsman' },
  fire: { labelKey: 'traits.fire', tintClass: 'fire' },
  ice: { labelKey: 'traits.ice', tintClass: 'ice' },
  archer: { labelKey: 'traits.archer', tintClass: 'archer' },
  mage: { labelKey: 'traits.mage', tintClass: 'mage' },
  tank: { labelKey: 'traits.tank', tintClass: 'tank' },
  poison: { labelKey: 'traits.poison', tintClass: 'poison' },
  flying: { labelKey: 'traits.flying', tintClass: 'flying' },
  holy: { labelKey: 'traits.holy', tintClass: 'holy' },
  shadow: { labelKey: 'traits.shadow', tintClass: 'shadow' },
};

export function TraitIcon({ trait, size = 14 }: { trait: string; size?: number }) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (trait) {
    case 'swordsman':
      return (
        <svg {...props} aria-hidden="true">
          <path d="M6 18l5-5" />
          <path d="M13 11l5-5" />
          <path d="M7 17l-3 3" />
          <path d="M15 9l2 2" />
        </svg>
      );
    case 'fire':
      return (
        <svg {...props} aria-hidden="true">
          <path d="M12 3c2 3 4 4 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8z" />
          <path d="M9 14a3 3 0 0 0 6 0" />
        </svg>
      );
    case 'ice':
      return (
        <svg {...props} aria-hidden="true">
          <path d="M12 3v18" />
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </svg>
      );
    case 'archer':
      return (
        <svg {...props} aria-hidden="true">
          <path d="M4 12h16" />
          <path d="M12 4a8 8 0 1 1 0 16" />
          <path d="M20 12l-3-2 3-2" />
        </svg>
      );
    case 'mage':
      return (
        <svg {...props} aria-hidden="true">
          <path d="M12 3l4 7H8l4-7z" />
          <path d="M8 14h8" />
          <path d="M10 18h4" />
        </svg>
      );
    case 'tank':
      return (
        <svg {...props} aria-hidden="true">
          <path d="M6 12h12v6H6z" />
          <path d="M9 12V8h6v4" />
          <path d="M4 18h16" />
        </svg>
      );
    case 'poison':
      return (
        <svg {...props} aria-hidden="true">
          <path d="M12 4c-3 3-4 5-4 7a4 4 0 0 0 8 0c0-2-1-4-4-7z" />
          <path d="M10 16h4" />
        </svg>
      );
    case 'flying':
      return (
        <svg {...props} aria-hidden="true">
          <path d="M4 14l6-2 4-6 2 4 4 2-6 2-4 6-2-4z" />
        </svg>
      );
    case 'holy':
      return (
        <svg {...props} aria-hidden="true">
          <path d="M12 4v16" />
          <path d="M4 12h16" />
          <path d="M7 7l10 10" />
          <path d="M17 7L7 17" />
        </svg>
      );
    case 'shadow':
      return (
        <svg {...props} aria-hidden="true">
          <path d="M15 3a8 8 0 1 0 6 14A7 7 0 1 1 15 3z" />
        </svg>
      );
    default:
      return (
        <svg {...props} aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
  }
}

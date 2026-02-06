import type { CardRace } from '../../../../../packages/core/src/index';

export type { CardRace };

export const raceTint: Record<CardRace, string> = {
  human: '#4a7bd0',
  animal: '#a0a0a0',
  elf: '#3fa66a',
  demon: '#b03a3a',
  beast: '#8b6b35',
  amphibian: '#2aa8a8',
};

export function RaceIcon({ race, size = 16 }: { race: CardRace; size?: number }) {
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

  switch (race) {
    case 'human':
      return (
        <svg {...props} aria-hidden="true">
          <circle cx="12" cy="7" r="3" />
          <path d="M5 20c1.5-4 12.5-4 14 0" />
        </svg>
      );
    case 'animal':
      return (
        <svg {...props} aria-hidden="true">
          <circle cx="6.5" cy="9" r="1.6" />
          <circle cx="12" cy="7.5" r="1.6" />
          <circle cx="17.5" cy="9" r="1.6" />
          <circle cx="9" cy="14.5" r="2.4" />
          <circle cx="15" cy="14.5" r="2.4" />
        </svg>
      );
    case 'elf':
      return (
        <svg {...props} aria-hidden="true">
          <path d="M12 3c-3 2-5 5-5 8 0 4 3 6 5 9 2-3 5-5 5-9 0-3-2-6-5-8z" />
          <path d="M12 9l3-2" />
        </svg>
      );
    case 'demon':
      return (
        <svg {...props} aria-hidden="true">
          <path d="M6 6l2 4" />
          <path d="M18 6l-2 4" />
          <path d="M7 18c0-4 10-4 10 0" />
          <path d="M8 12c1 2 2 3 4 3s3-1 4-3" />
        </svg>
      );
    case 'beast':
      return (
        <svg {...props} aria-hidden="true">
          <path d="M6 4l-2 7" />
          <path d="M12 3l-1 8" />
          <path d="M18 4l2 7" />
        </svg>
      );
    case 'amphibian':
      return (
        <svg {...props} aria-hidden="true">
          <path d="M12 3c-3 4-5 6-5 9a5 5 0 0 0 10 0c0-3-2-5-5-9z" />
          <path d="M9 18l-2 2" />
          <path d="M15 18l2 2" />
        </svg>
      );
    default:
      return (
        <svg {...props} aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

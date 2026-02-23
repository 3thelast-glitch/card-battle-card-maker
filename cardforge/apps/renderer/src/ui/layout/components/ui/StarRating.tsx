import React, { memo } from 'react';

interface StarRatingProps {
  stars: number;
  scale?: number;
}

const StarIcon = ({
  className = '',
  style = {},
}: {
  className?: string;
  style?: React.CSSProperties;
}) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    style={style}
    fill="currentColor"
    stroke="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const StarRating = memo(({ stars, scale = 1 }: StarRatingProps) => {
  // Clamp stars between 0 and 10
  const clampedStars = Math.max(0, Math.min(10, stars));
  if (clampedStars === 0) return null;

  // Define tier configurations
  let tierClass = '';
  let starColor = '';
  let glowStyle: React.CSSProperties = {};
  let iconSize = 14 * scale;

  if (clampedStars <= 2) {
    // Tier 1: 1-2 Stars (Very Common / Basic)
    tierClass = 'opacity-80';
    starColor = 'text-yellow-100';
    glowStyle = {
      filter: `drop-shadow(0 0 ${3 * scale}px rgba(254,249,195,0.3))`,
    };
    iconSize = 12 * scale;
  } else if (clampedStars <= 4) {
    // Tier 2: 3-4 Stars (Uncommon / Decent)
    tierClass = 'animate-pulse opacity-90';
    starColor = 'text-yellow-300';
    glowStyle = {
      filter: `drop-shadow(0 0 ${4 * scale}px rgba(253,224,71,0.4))`,
    };
    iconSize = 14 * scale;
  } else if (clampedStars <= 6) {
    // Tier 3: 5-6 Stars (Rare / Strong)
    tierClass = 'animate-shimmer';
    starColor = 'text-yellow-500';
    glowStyle = {
      filter: `drop-shadow(0 0 ${6 * scale}px rgba(234,179,8,0.5))`,
    };
    iconSize = 16 * scale;
  } else if (clampedStars <= 8) {
    // Tier 4: 7-8 Stars (Epic / Powerful)
    // BUGFIX: Removed `animate-rarity-pulse` because it applies `box-shadow` which creates a visible rectangle on SVGs.
    tierClass = 'animate-pulse';
    starColor = 'text-orange-500';
    glowStyle = {
      filter: `drop-shadow(0 0 ${8 * scale}px rgba(249,115,22,0.6))`,
    };
    iconSize = 18 * scale;
  } else {
    // Tier 5: 9-10 Stars (Legendary / God-like)
    tierClass = 'animate-pulse'; // Uses unified smooth pulse, avoiding `translateY` physics glitches
    starColor = 'text-red-500';
    // Reduced multi-color plasma glow
    glowStyle = {
      filter: `
                drop-shadow(0 0 ${6 * scale}px rgba(239,68,68,0.8)) 
                drop-shadow(0 0 ${12 * scale}px rgba(234,179,8,0.6))
                drop-shadow(0 0 ${18 * scale}px rgba(168,85,247,0.4))
            `,
    };
    iconSize = 20 * scale;
  }

  // Split stars into two rows if > 5 to fit the card width perfectly
  const topRowStars = Math.min(5, clampedStars);
  const bottomRowStars = Math.max(0, clampedStars - 5);

  return (
    <div
      className="flex flex-col items-center justify-center gap-1 bg-transparent border-none outline-none shadow-none"
      style={{ zIndex: 10 }}
    >
      {/* Top Row */}
      <div className="flex items-center justify-center gap-1 flex-wrap">
        {Array.from({ length: topRowStars }).map((_, i) => (
          <StarIcon
            key={`top-${i}`}
            className={`${starColor} ${tierClass}`}
            style={{ width: iconSize, height: iconSize, ...glowStyle }}
          />
        ))}
      </div>
      {/* Bottom Row */}
      {bottomRowStars > 0 && (
        <div className="flex items-center justify-center gap-1 flex-wrap">
          {Array.from({ length: bottomRowStars }).map((_, i) => (
            <StarIcon
              key={`bottom-${i}`}
              className={`${starColor} ${tierClass}`}
              style={{ width: iconSize, height: iconSize, ...glowStyle }}
            />
          ))}
        </div>
      )}
    </div>
  );
});

StarRating.displayName = 'StarRating';

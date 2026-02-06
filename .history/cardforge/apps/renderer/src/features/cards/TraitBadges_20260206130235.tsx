import React, { useMemo } from 'react';
import { Group, Image } from 'react-konva';
import useImage from 'use-image';

const traitIconMap: Record<string, string> = {
  Fire: '/assets/icons/fire.png',
  Water: '/assets/icons/water.png',
  Nature: '/assets/icons/nature.png',
  Dark: '/assets/icons/dark.png',
  Sword: '/assets/icons/sword.png',
  Shield: '/assets/icons/shield.png',
};

interface TraitBadgesProps {
  /** Array of trait names, e.g. ['Sword', 'Fire'] */
  traits: string[];
  /** X position of the badge group relative to parent */
  x?: number;
  /** Y position of the badge group relative to parent */
  y?: number;
  /** Size of each icon in pixels (width & height). Default: 32 */
  iconSize?: number;
  /** Padding between icons in pixels. Default: 5 */
  padding?: number;
}

/**
 * Renders a horizontal row of trait icons using Konva.
 * Optimized to handle image loading and rendering cycles.
 */
export const TraitBadges: React.FC<TraitBadgesProps> = ({
  traits,
  x = 0,
  y = 0,
  iconSize = 32,
  padding = 5,
}) => {
  // Filter traits to max 4 and log warning if exceeded
  const visibleTraits = useMemo(() => {
    if (!Array.isArray(traits)) return [];
    if (traits.length > 4) {
      console.warn(
        `[TraitBadges] Too many traits provided (${traits.length}). Capping at 4.`,
        traits
      );
      return traits.slice(0, 4);
    }
    return traits;
  }, [traits]);

  if (visibleTraits.length === 0) return null;

  return (
    <Group x={x} y={y}>
      {visibleTraits.map((trait, index) => (
        <TraitIcon
          key={`${trait}-${index}`}
          trait={trait}
          index={index}
          size={iconSize}
          padding={padding}
        />
      ))}
    </Group>
  );
};

const TraitIcon = ({ trait, index, size, padding }: { trait: string; index: number; size: number; padding: number }) => {
  // Assumes assets are served from public/assets/icons/
  // e.g. 'Sword' -> '/assets/icons/Sword.png'
  const [image] = useImage(traitIconMap[trait] || `/assets/icons/${trait}.png`);

  if (!image) return null;

  return (
    <Image
      image={image}
      x={index * (size + padding)}
      y={0}
      width={size}
      height={size}
      listening={false} // Optimization: Disable hit detection for non-interactive icons
    />
  );
};
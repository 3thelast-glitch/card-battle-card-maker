import { useMemo, type FC } from 'react';
import { Group, Rect, Text } from 'react-konva';
import { getElementGradient } from './elementStyles';
import { TraitBadges } from './TraitBadges';
import { StatBadge } from '../../StatBadge';

export { CardFrame } from '../../components/cards/CardFrame';

interface CardFrameProps {
  width: number;
  height: number;
  mainElement: string;
  strokeWidth?: number;
  traits?: string[];
  rarity?: string;
  title?: string;
  stats?: { attack: number; hp: number };
}

export const KonvaCardFrame: FC<CardFrameProps> = ({
  width,
  height,
  mainElement,
  strokeWidth = 0,
  traits = [],
  rarity = 'Common',
  title = '',
  stats,
}) => {
  const gradientConfig = useMemo(
    () => getElementGradient(mainElement, width, height),
    [mainElement, width, height],
  );

  // Calculate badge position (Top-Right)
  const badgePadding = 5;
  const badgeIconSize = 32;
  const padding = 12;
  const visibleCount = Math.min(traits.length, 4);
  const badgesWidth =
    visibleCount > 0
      ? visibleCount * badgeIconSize + (visibleCount - 1) * badgePadding
      : 0;
  const badgesX = width - padding - badgesWidth;

  // Legendary Border Logic
  const isLegendary = rarity === 'Legendary';
  const innerBorderWidth = 3;
  const innerBorderColor = '#FFD700'; // Gold

  return (
    <Group>
      {/* Main Background */}
      <Rect
        width={width}
        height={height}
        strokeWidth={strokeWidth}
        {...gradientConfig}
      />

      {/* Legendary Inner Frame */}
      {isLegendary && (
        <Rect
          x={strokeWidth + innerBorderWidth}
          y={strokeWidth + innerBorderWidth}
          width={width - (strokeWidth + innerBorderWidth) * 2}
          height={height - (strokeWidth + innerBorderWidth) * 2}
          stroke={innerBorderColor}
          strokeWidth={innerBorderWidth}
          shadowColor="black"
          shadowBlur={10}
          shadowOpacity={0.5}
          listening={false}
        />
      )}

      {/* Title Text with Shadow */}
      {title && (
        <Text
          x={20}
          y={20}
          text={title}
          fontSize={24}
          fontFamily="Cinzel, serif"
          fill="white"
          shadowColor="black"
          shadowBlur={2}
          shadowOffset={{ x: 2, y: 2 }}
          shadowOpacity={0.8}
        />
      )}

      <TraitBadges
        traits={traits}
        x={badgesX}
        y={padding}
        iconSize={badgeIconSize}
        padding={badgePadding}
      />

      {/* Stats Badges */}
      {stats && (
        <>
          <StatBadge
            value={stats.attack}
            type="attack"
            x={35}
            y={height - 35}
            radius={24}
          />
          <StatBadge
            value={stats.hp}
            type="hp"
            x={width - 35}
            y={height - 35}
            radius={24}
          />
        </>
      )}
    </Group>
  );
};

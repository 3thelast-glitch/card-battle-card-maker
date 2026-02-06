import React, { useMemo } from 'react';
import { Group, Rect } from 'react-konva';
import { getElementGradient } from '../../utils/elementStyles';
import { TraitBadges } from './TraitBadges';

interface CardFrameProps {
  width: number;
  height: number;
  mainElement: string;
  strokeWidth?: number;
  traits?: string[];
}

export const CardFrame: React.FC<CardFrameProps> = ({
  width,
  height,
  mainElement,
  strokeWidth = 0,
  traits = [],
}) => {
  const gradientConfig = useMemo(
    () => getElementGradient(mainElement, width, height),
    [mainElement, width, height]
  );

  // Calculate badge position (Top-Right)
  const badgePadding = 5;
  const badgeIconSize = 32;
  const padding = 12;
  const visibleCount = Math.min(traits.length, 4);
  const badgesWidth = visibleCount > 0 ? (visibleCount * badgeIconSize) + ((visibleCount - 1) * badgePadding) : 0;
  const badgesX = width - padding - badgesWidth;

  return (
    <Group>
      <Rect
        width={width}
        height={height}
        strokeWidth={strokeWidth}
        {...gradientConfig}
      />
      <TraitBadges traits={traits} x={badgesX} y={padding} iconSize={badgeIconSize} padding={badgePadding} />
    </Group>
  );
};
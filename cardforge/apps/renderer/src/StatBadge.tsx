import React from 'react';
import { Group, Circle, Text, Ring } from 'react-konva';

interface StatBadgeProps {
  value: number;
  type: 'attack' | 'hp';
  x: number;
  y: number;
  radius?: number;
}

export const StatBadge: React.FC<StatBadgeProps> = ({
  value,
  type,
  x,
  y,
  radius = 24,
}) => {
  const isAttack = type === 'attack';
  // AAA Game Style Colors
  const mainColor = isAttack ? '#d32f2f' : '#388e3c';
  const gradientStart = isAttack ? '#ffCDD2' : '#c8e6c9';
  const gradientEnd = isAttack ? '#b71c1c' : '#1b5e20';
  const borderColor = '#ffd700'; // Gold border for premium feel

  return (
    <Group x={x} y={y}>
      {/* Drop Shadow */}
      <Circle
        radius={radius}
        fill="black"
        opacity={0.5}
        offsetX={-2}
        offsetY={-2}
        shadowColor="black"
        shadowBlur={5}
        shadowOpacity={0.3}
      />

      {/* Gold Border Ring */}
      <Ring
        innerRadius={radius - 2}
        outerRadius={radius + 1}
        fill={borderColor}
        shadowColor="black"
        shadowBlur={2}
        shadowOpacity={0.5}
      />

      {/* Main Orb Gradient */}
      <Circle
        radius={radius - 2}
        fillRadialGradientStartPoint={{ x: -radius / 3, y: -radius / 3 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndRadius={radius}
        fillRadialGradientColorStops={[
          0,
          gradientStart,
          0.4,
          mainColor,
          1,
          gradientEnd,
        ]}
      />

      {/* Glass Shine Effect (Top) */}
      <Circle
        x={0}
        y={-radius * 0.4}
        radius={radius * 0.5}
        scaleY={0.6}
        fill="white"
        opacity={0.2}
      />

      {/* Value Text */}
      <Text
        text={value.toString()}
        fontSize={radius * 1.1}
        fontFamily="Cinzel, serif"
        fontStyle="bold"
        fill="white"
        width={radius * 2}
        height={radius * 2}
        offsetX={radius}
        offsetY={radius * 0.8}
        align="center"
        verticalAlign="middle"
        shadowColor="black"
        shadowBlur={3}
        shadowOffset={{ x: 1, y: 1 }}
        shadowOpacity={0.8}
      />

      {/* Label (ATK/HP) */}
      <Text
        text={isAttack ? 'ATK' : 'HP'}
        fontSize={radius * 0.35}
        fontFamily="Arial"
        fontStyle="bold"
        fill="#fff"
        width={radius * 2}
        offsetX={radius}
        y={radius * 0.4}
        align="center"
        opacity={0.9}
        shadowColor="black"
        shadowBlur={2}
      />
    </Group>
  );
};

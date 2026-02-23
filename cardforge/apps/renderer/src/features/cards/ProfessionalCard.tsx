import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import { TraitBadges } from './TraitBadges';
import { CardStats } from './CardStats';

interface ProfessionalCardProps {
  data: {
    name: string;
    main_element: string;
    traits: string[];
    attack: number;
    hp: number;
  };
  width: number;
  height: number;
}

export const ProfessionalCard: React.FC<ProfessionalCardProps> = ({
  data,
  width,
  height,
}) => {
  return (
    <Group>
      {/* 1. الإطار الخارجي المتوهج */}
      <Rect
        width={width}
        height={height}
        cornerRadius={25}
        fill="#0f172a"
        strokeLinearGradientStartPoint={{ x: 0, y: 0 }}
        strokeLinearGradientEndPoint={{ x: width, y: height }}
        strokeLinearGradientColorStops={[
          0,
          '#B38728',
          0.5,
          '#FBF5B7',
          1,
          '#AA771C',
        ]}
        strokeWidth={10}
        shadowBlur={25}
        shadowColor="black"
      />

      {/* 2. نظام السمات (Top-Left) */}
      <TraitBadges traits={data.traits} x={25} y={25} />

      {/* 3. منطقة اسم البطاقة */}
      <Rect
        x={width * 0.15}
        y={35}
        width={width * 0.7}
        height={45}
        fill="rgba(0,0,0,0.6)"
        cornerRadius={12}
        stroke="#FFD700"
        strokeWidth={1}
      />
      <Text
        text={data.name}
        width={width}
        y={45}
        align="center"
        fontSize={24}
        fontStyle="bold"
        fill="white"
        shadowBlur={5}
      />

      {/* 4. لوحة الإحصائيات (Bottom) */}
      <Group x={0} y={height - 85}>
        <CardStats attack={data.attack} hp={data.hp} width={width} />
      </Group>
    </Group>
  );
};

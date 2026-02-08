import React from 'react';
import { Group, Circle, Text } from 'react-konva';

interface StatOrbProps {
  label: string;
  value: number;
  x: number;
  isAttack: boolean;
}

const StatOrb: React.FC<StatOrbProps> = ({ label, value, x, isAttack }) => {
  return (
    <Group x={x}>
      {/* الظل الخارجي لإعطاء عمق */}
      <Circle radius={32} fill="rgba(0,0,0,0.7)" shadowBlur={15} />
      
      {/* الإطار الذهبي الاحترافي */}
      <Circle
        radius={28}
        strokeLinearGradientStartPoint={{ x: -20, y: -20 }}
        strokeLinearGradientEndPoint={{ x: 20, y: 20 }}
        strokeLinearGradientColorStops={[0, '#BF953F', 0.5, '#FCF6BA', 1, '#B38728']}
        strokeWidth={3}
        fill="#1a1a1a"
      />
      
      {/* القيمة الرقمية للهجوم أو الدفاع */}
      <Text
        text={value.toString()}
        fontSize={26}
        fontStyle="bold"
        fill="white"
        align="center"
        verticalAlign="middle"
        width={60}
        height={60}
        x={-30}
        y={-30}
        shadowColor="black"
        shadowBlur={2}
      />

      {/* نص التسمية أسفل الرمز */}
      <Text 
        text={label} 
        y={38} 
        x={-30} 
        width={60} 
        align="center" 
        fill="#FFD700" 
        fontSize={13} 
        fontStyle="bold" 
      />
    </Group>
  );
};

export const CardStats: React.FC<{ attack: number, hp: number, width: number }> = ({ attack, hp, width }) => (
  <Group>
     <StatOrb label="هجوم" value={attack} x={75} isAttack={true} />
     <StatOrb label="دفاع" value={hp} x={width - 75} isAttack={false} />
  </Group>
);
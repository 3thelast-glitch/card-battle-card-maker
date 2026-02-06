import React, { useMemo } from 'react';
import { Rect } from 'react-konva';
import { getElementGradient } from '../../utils/elementStyles';

interface CardFrameProps {
  width: number;
  height: number;
  mainElement: string;
  strokeWidth?: number;
}

export const CardFrame: React.FC<CardFrameProps> = ({
  width,
  height,
  mainElement,
  strokeWidth = 0,
}) => {
  const gradientConfig = useMemo(
    () => getElementGradient(mainElement, width, height),
    [mainElement, width, height]
  );

  return (
    <Rect
      width={width}
      height={height}
      strokeWidth={strokeWidth}
      {...gradientConfig}
    />
  );
};
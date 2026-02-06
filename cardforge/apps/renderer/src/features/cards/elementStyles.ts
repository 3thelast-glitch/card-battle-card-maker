export interface GradientConfig {
  fillLinearGradientStartPoint: { x: number; y: number };
  fillLinearGradientEndPoint: { x: number; y: number };
  fillLinearGradientColorStops: (number | string)[];
}

/**
 * Returns Konva linear gradient properties based on the card's element.
 * Defaults to a neutral gray gradient if the element is not recognized.
 */
export function getElementGradient(
  element: string,
  width: number,
  height: number
): GradientConfig {
  const normalized = String(element || '').toLowerCase().trim();
  let startColor = '#9E9E9E'; // Default Grey
  let endColor = '#616161';

  switch (normalized) {
    case 'fire':
      startColor = '#FF4B2B';
      endColor = '#FF416C';
      break;
    case 'water':
      startColor = '#2193B0';
      endColor = '#6DD5ED';
      break;
    case 'nature':
      startColor = '#11998E';
      endColor = '#38EF7D';
      break;
    case 'dark':
      startColor = '#232526';
      endColor = '#414345';
      break;
  }

  return {
    // Diagonal gradient from top-left to bottom-right
    fillLinearGradientStartPoint: { x: 0, y: 0 },
    fillLinearGradientEndPoint: { x: width, y: height },
    fillLinearGradientColorStops: [0, startColor, 1, endColor],
  };
}
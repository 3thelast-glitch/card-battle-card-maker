export interface BadgeElement {
  id: string;
  type: 'trait' | 'icon' | 'number' | 'orb';
  name: string;
  iconId?: string;
  text?: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  backgroundOpacity: number;
  color: string;
  color2?: string;
  gradient?: boolean;
  gradientType?: 'linear' | 'radial';
  gradientAngle?: number;
  layout?: 'horizontal' | 'vertical' | 'grid';
  borderWidth: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
  borderColor?: string;
  borderRadius?: number;
  shadowIntensity: number;
  glow?: number;
  glowColor?: string;
  zIndex: number;
  customImage?: string;
  animation?: 'none' | 'pulse' | 'spin' | 'float' | 'wiggle' | 'glow' | 'pulse-glow' | 'sparkle' | 'flame' | 'star' | 'crystal';
  animationDuration?: number;
}

export type BadgeModel = BadgeElement;

export interface BadgePreset {
  id: string;
  name: string;
  colors: { primary: string; secondary: string; glow: string };
  layout: 'horizontal' | 'vertical' | 'grid';
  animation: 'pulse' | 'glow' | 'spin' | 'float' | 'wiggle' | 'none' | 'pulse-glow' | 'sparkle' | 'flame' | 'star' | 'crystal';
}
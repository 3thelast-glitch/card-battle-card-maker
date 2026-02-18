import React, { memo } from 'react';
import { 
  Shield, Zap, Star, Heart, Sword, Flame, Moon, Droplets, Diamond, Mic, 
  Skull, Ghost, Anchor, Sun, Crown, ArrowRight, Circle
} from 'lucide-react';
import { BadgeModel } from '../types/badge.types';

export const ICON_LIBRARY = [
  { id: 'shield', icon: Shield, name: 'Shield' },
  { id: 'sword', icon: Sword, name: 'Sword' },
  { id: 'heart', icon: Heart, name: 'Heart' },
  { id: 'zap', icon: Zap, name: 'Zap' },
  { id: 'flame', icon: Flame, name: 'Flame' },
  { id: 'droplets', icon: Droplets, name: 'Water' },
  { id: 'crown', icon: Crown, name: 'Crown' },
  { id: 'star', icon: Star, name: 'Star' },
  { id: 'moon', icon: Moon, name: 'Moon' },
  { id: 'sun', icon: Sun, name: 'Sun' },
  { id: 'diamond', icon: Diamond, name: 'Diamond' },
  { id: 'skull', icon: Skull, name: 'Skull' },
  { id: 'ghost', icon: Ghost, name: 'Ghost' },
  { id: 'anchor', icon: Anchor, name: 'Anchor' },
  { id: 'mic', icon: Mic, name: 'Mic' },
  { id: 'arrowRight', icon: ArrowRight, name: 'Arrow' },
  { id: 'circle', icon: Circle, name: 'Circle' },
];

interface LiveBadgePreviewProps {
  badge: BadgeModel;
  selected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
  className?: string;
}

export const LiveBadgePreview = memo(({ badge, selected, onClick, style, className }: LiveBadgePreviewProps) => {
  const iconItem = ICON_LIBRARY.find(i => i.id === badge.iconId);
  const Icon = iconItem ? iconItem.icon : Star;

  const badgeStyle: React.CSSProperties = {
    backgroundColor: badge.gradient ? undefined : badge.color,
    backgroundImage: badge.gradient 
      ? (badge.gradientType === 'radial' 
          ? `radial-gradient(circle, ${badge.color}, ${badge.color2 || badge.color})`
          : `linear-gradient(${badge.gradientAngle || 135}deg, ${badge.color}, ${badge.color2 || badge.color})`)
      : undefined,
    border: `${badge.borderWidth}px ${badge.borderStyle || 'solid'} ${badge.borderColor || badge.color}`,
    borderRadius: badge.borderRadius ? `${badge.borderRadius}px` : '9999px',
    boxShadow: `0 4px ${badge.shadowIntensity * 20}px rgba(0,0,0,${badge.shadowIntensity * 0.5})`,
    filter: badge.glow ? `drop-shadow(0 0 ${badge.glow}px ${badge.glowColor || badge.color})` : undefined,
    opacity: badge.opacity,
    ...style
  };

  const animationStyle = {
    animation: badge.animation && badge.animation !== 'none' 
      ? `badge-${badge.animation} ${badge.animationDuration || 2}s infinite ease-in-out` 
      : undefined
  };

  return (
    <div 
      className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''} ${className || ''}`}
      style={badgeStyle}
      onClick={onClick}
    >
      <div style={animationStyle} className="w-full h-full flex items-center justify-center">
        {badge.type === 'number' ? (
          <span className="font-black text-lg leading-none" style={{ color: badge.color === '#ffffff' ? '#000' : '#fff' }}>
            {badge.text || '0'}
          </span>
        ) : (
          <Icon className="w-3/5 h-3/5" style={{ color: badge.type === 'orb' ? '#fff' : (badge.gradient ? '#fff' : '#fff') }} />
        )}
      </div>
    </div>
  );
});
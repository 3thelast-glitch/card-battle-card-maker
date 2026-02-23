import React from 'react';
import {
  Flame,
  Snowflake,
  Sword,
  Crosshair,
  Wand2,
  Shield,
  Skull,
  Feather,
  Sparkles,
  Moon,
} from 'lucide-react';

export type TraitKey =
  | 'fire'
  | 'ice'
  | 'swordsman'
  | 'archer'
  | 'mage'
  | 'tank'
  | 'poison'
  | 'flying'
  | 'holy'
  | 'shadow';

export interface TraitOption {
  value: TraitKey;
  label: string;
  icon: React.ReactNode;
}

export const TRAIT_OPTIONS: TraitOption[] = [
  { value: 'fire', label: 'Fire', icon: <Flame size={16} /> },
  { value: 'ice', label: 'Ice', icon: <Snowflake size={16} /> },
  { value: 'swordsman', label: 'Swordsman', icon: <Sword size={16} /> },
  { value: 'archer', label: 'Archer', icon: <Crosshair size={16} /> },
  { value: 'mage', label: 'Mage', icon: <Wand2 size={16} /> },
  { value: 'tank', label: 'Tank', icon: <Shield size={16} /> },
  { value: 'poison', label: 'Poison', icon: <Skull size={16} /> },
  { value: 'flying', label: 'Flying', icon: <Feather size={16} /> },
  { value: 'holy', label: 'Holy', icon: <Sparkles size={16} /> },
  { value: 'shadow', label: 'Shadow', icon: <Moon size={16} /> },
];

export interface TraitMeta {
  label: string;
  icon: React.ReactNode;
  color: string;
}

export const TRAIT_META: Record<TraitKey, TraitMeta> = {
  fire: { label: 'Fire', icon: <Flame size={16} />, color: '#ef4444' },
  ice: { label: 'Ice', icon: <Snowflake size={16} />, color: '#3b82f6' },
  swordsman: {
    label: 'Swordsman',
    icon: <Sword size={16} />,
    color: '#f59e0b',
  },
  archer: { label: 'Archer', icon: <Crosshair size={16} />, color: '#10b981' },
  mage: { label: 'Mage', icon: <Wand2 size={16} />, color: '#8b5cf6' },
  tank: { label: 'Tank', icon: <Shield size={16} />, color: '#6366f1' },
  poison: { label: 'Poison', icon: <Skull size={16} />, color: '#84cc16' },
  flying: { label: 'Flying', icon: <Feather size={16} />, color: '#06b6d4' },
  holy: { label: 'Holy', icon: <Sparkles size={16} />, color: '#fbbf24' },
  shadow: { label: 'Shadow', icon: <Moon size={16} />, color: '#64748b' },
};

interface TraitIconProps {
  trait: TraitKey;
  size?: number;
  className?: string;
}

export const TraitIcon: React.FC<TraitIconProps> = ({
  trait,
  size = 16,
  className = '',
}) => {
  const meta = TRAIT_META[trait];
  if (!meta) return null;

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ color: meta.color }}
    >
      {meta.icon}
    </div>
  );
};

export default TraitIcon;

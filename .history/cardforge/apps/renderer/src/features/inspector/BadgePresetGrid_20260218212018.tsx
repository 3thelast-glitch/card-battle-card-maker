import React, { memo } from 'react';
import { BadgePreset } from '../types/badge.types';

export const PRESETS: BadgePreset[] = [
  {
    id: 'common', name: 'معدن بسيط',
    colors: { primary: '#B8B8B8', secondary: '#909090', glow: '#D8D8D8' },
    layout: 'horizontal',
    animation: 'none'
  },
  {
    id: 'rare', name: 'كريستال أزرق',
    colors: { primary: '#4169E1', secondary: '#1E3A8A', glow: '#87CEEB' },
    layout: 'vertical',
    animation: 'glow'
  },
  {
    id: 'epic', name: 'جوهرة بنفسجية',
    colors: { primary: '#8A2BE2', secondary: '#4B0082', glow: '#DDA0DD' },
    layout: 'grid-2x2',
    animation: 'pulse'
  },
  {
    id: 'legendary', name: '⭐ ذهب ملكي',
    colors: { primary: '#D4AF37', secondary: '#B8860B', glow: '#FFD700' },
    layout: 'grid-3x2',
    animation: 'float'
  },
  {
    id: 'neon', name: 'نيون سايبر',
    colors: { primary: '#00FFFF', secondary: '#00FF00', glow: '#FF00FF' },
    layout: 'circle',
    animation: 'pulse'
  },
  {
    id: 'fire', name: '🔥 تنين نار',
    colors: { primary: '#FF4500', secondary: '#B22222', glow: '#FF8C00' },
    layout: 'triangle',
    animation: 'wiggle'
  },
  {
    id: 'pentagon', name: 'خماسي',
    colors: { primary: '#FF00FF', secondary: '#800080', glow: '#FFC0CB' },
    layout: 'pentagon',
    animation: 'spin'
  },
  {
    id: 'custom', name: 'مخصص',
    colors: { primary: '#FFFFFF', secondary: '#CCCCCC', glow: '#FFFFFF' },
    layout: 'custom',
    animation: 'none'
  },
];

interface BadgePresetGridProps {
  onSelect: (preset: BadgePreset) => void;
}

const PresetItem = memo(({ preset, onClick }: { preset: BadgePreset; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="group relative flex flex-col items-center gap-1 p-2 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all"
  >
    <div 
      className="w-6 h-6 rounded-full shadow-sm transition-transform group-hover:scale-110" 
      style={{ 
        background: `linear-gradient(135deg, ${preset.colors.primary}, ${preset.colors.secondary})`, 
        boxShadow: `0 0 8px ${preset.colors.glow}` 
      }} 
    />
    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">{preset.name}</span>
  </button>
));

export const BadgePresetGrid = memo(({ onSelect }: BadgePresetGridProps) => {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {PRESETS.map(preset => (
        <PresetItem key={preset.id} preset={preset} onClick={() => onSelect(preset)} />
      ))}
    </div>
  );
});
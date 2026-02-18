import React, { memo } from 'react';
import { BadgePreset } from '../types/badge.types';

export const PRESETS: BadgePreset[] = [
  {
    id: 'gf-legendary', name: 'Legendary',
    colors: { primary: '#D4AF37', secondary: '#B8860B', glow: '#FCD34D' },
    layout: 'vertical',
    animation: 'float'
  },
  {
    id: 'gf-epic', name: 'Epic',
    colors: { primary: '#8A2BE2', secondary: '#581C87', glow: '#C084FC' },
    layout: 'vertical',
    animation: 'pulse'
  },
  {
    id: 'gf-rare', name: 'Rare',
    colors: { primary: '#4169E1', secondary: '#1E3A8A', glow: '#60A5FA' },
    layout: 'horizontal',
    animation: 'glow'
  },
  {
    id: 'gf-common', name: 'Common',
    colors: { primary: '#C0C0C0', secondary: '#A0A0A0', glow: '#E0E0E0' },
    layout: 'grid',
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
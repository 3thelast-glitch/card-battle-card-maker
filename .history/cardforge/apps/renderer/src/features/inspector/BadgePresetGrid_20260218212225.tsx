import React, { memo } from 'react';
import { BadgePreset } from '../types/badge.types';

export const PRESETS: BadgePreset[] = [
  {
    id: 'common', name: '🟤 معدن بسيط', primary: '#B8B8B8', glow: '#D8D8D8'
  },
  {
    id: 'rare', name: '🟦 كريستال أزرق', primary: '#4169E1', glow: '#87CEEB'
  },
  {
    id: 'epic', name: '🟣 جوهرة بنفسجية', primary: '#8A2BE2', glow: '#DDA0DD'
  },
  {
    id: 'legendary', name: '⭐ ذهب ملكي', primary: '#D4AF37', glow: '#FFD700'
  },
  {
    id: 'neon', name: '🌈 نيون', primary: '#00FFFF', glow: '#FF00FF'
  },
  {
    id: 'fire', name: '🔥 تنين نار', primary: '#FF4500', glow: '#FF8C00'
  },
];

interface BadgePresetGridProps {
  onSelect: (preset: BadgePreset) => void;
}

const PresetItem = memo(({ preset, onClick }: { preset: BadgePreset; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="group relative flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-slate-200 bg-white hover:scale-105 transition-all shadow-sm"
    style={{
      backgroundColor: preset.primary,
      boxShadow: `0 4px 8px ${preset.glow}66`, // 40% opacity hex
      width: '80px',
      height: '80px'
    }}
  >
    <span className="text-[10px] font-bold text-white text-center leading-tight drop-shadow-md">
      {preset.name}
    </span>
  </button>
));

export const BadgePresetGrid = memo(({ onSelect }: BadgePresetGridProps) => {
  return (
    <div className="flex flex-wrap gap-3 justify-center p-2">
      {PRESETS.map(preset => (
        <PresetItem key={preset.id} preset={preset} onClick={() => onSelect(preset)} />
      ))}
    </div>
  );
});
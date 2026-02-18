import React, { useState, memo } from 'react';
import { HexColorPicker } from 'react-colorful'; import {
  Sliders, Sparkles, Film, Layers, RotateCcw, Layout, Maximize
} from 'lucide-react';

// 🔥 تعريف BadgeModel محلياً (بديل لـ badge.types)
interface BadgeModel {
  id: string;
  type: 'icon' | 'number' | 'text';
  name?: string;
  iconId?: string;
  text?: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  backgroundOpacity: number;
  color: string;
  gradientType?: 'linear' | 'radial';
  gradientAngle?: number;
  borderWidth?: number;
  shadowIntensity?: number;
  zIndex?: number;
  animation?: string;
  layout?: string;
  gradient?: boolean;
}

// 🔥 تعريف BadgePreset محلياً
interface BadgePreset {
  name: string;
  style: Partial<BadgeModel>;
}

interface BadgeStylingPanelProps {
  badge: BadgeModel;
  onChange: (updates: Partial<BadgeModel>) => void;
}

export const BadgeStylingPanel = memo(({ badge, onChange }: BadgeStylingPanelProps) => {
  const [activeTab, setActiveTab] = useState<'style' | 'effects' | 'anim' | 'layers'>('style');

  // 🔥 Preset handler (مبسط)
  const handlePresetSelect = (preset: BadgePreset) => {
    onChange({
      color: preset.style.color,
      layout: preset.style.layout,
      animation: preset.style.animation,
      gradient: preset.style.gradient,
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50">
        {[
          { id: 'style', icon: Sliders, label: 'Style' },
          { id: 'effects', icon: Sparkles, label: 'Effects' },
          { id: 'anim', icon: Film, label: 'Animation' },
          { id: 'layers', icon: Layers, label: 'Layers' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'style' && (
          <>
            {/* Color Picker */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <div className="w-4 h-4 rounded border border-slate-300" style={{ background: badge.color }} />
                Badge Color
              </label>
              <HexColorPicker
                color={badge.color}
                onChange={(color) => onChange({ color })}
              />
            </div>

            {/* Scale Slider */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Maximize className="w-4 h-4" />
                  Scale
                </span>
                <span className="text-xs text-slate-500">{badge.scale.toFixed(2)}x</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={badge.scale}
                onChange={(e) => onChange({ scale: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
            </div>

            {/* Rotation Slider */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Rotation
                </span>
                <span className="text-xs text-slate-500">{badge.rotation}°</span>
              </label>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={badge.rotation}
                onChange={(e) => onChange({ rotation: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Opacity Slider */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                <span>Opacity</span>
                <span className="text-xs text-slate-500">{Math.round(badge.opacity * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={badge.opacity}
                onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </>
        )}

        {activeTab === 'effects' && (
          <>
            {/* Border Width */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                <span>Border Width</span>
                <span className="text-xs text-slate-500">{badge.borderWidth || 0}px</span>
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={badge.borderWidth || 0}
                onChange={(e) => onChange({ borderWidth: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Shadow Intensity */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                <span>Shadow Intensity</span>
                <span className="text-xs text-slate-500">{badge.shadowIntensity || 0}</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={badge.shadowIntensity || 0}
                onChange={(e) => onChange({ shadowIntensity: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Gradient Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm font-semibold text-slate-700">Enable Gradient</span>
              <button
                onClick={() => onChange({ gradient: !badge.gradient })}
                className={`w-12 h-6 rounded-full transition-all ${
                  badge.gradient ? 'bg-blue-500' : 'bg-slate-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  badge.gradient ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </>
        )}

        {activeTab === 'anim' && (
          <>
            {/* Animation Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Animation Style</label>
              <div className="grid grid-cols-2 gap-2">
                {['pulse', 'float', 'spin', 'wiggle', 'glow'].map(anim => (
                  <button
                    key={anim}
                    onClick={() => onChange({ animation: anim })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      badge.animation === anim
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {anim.charAt(0).toUpperCase() + anim.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Animation */}
            <button
              onClick={() => onChange({ animation: undefined })}
              className="w-full px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-all text-sm font-medium"
            >
              Clear Animation
            </button>
          </>
        )}

        {activeTab === 'layers' && (
          <>
            {/* Z-Index Control */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Layer Order (Z-Index)
                </span>
                <span className="text-xs text-slate-500">{badge.zIndex || 0}</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={badge.zIndex || 0}
                onChange={(e) => onChange({ zIndex: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Layout Options */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Layout Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['vertical', 'horizontal', 'circular', 'grid'].map(layout => (
                  <button
                    key={layout}
                    onClick={() => onChange({ layout })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      badge.layout === layout
                        ? 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {layout.charAt(0).toUpperCase() + layout.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

BadgeStylingPanel.displayName = 'BadgeStylingPanel';

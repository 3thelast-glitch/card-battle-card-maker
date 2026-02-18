import React, { useState, memo } from 'react';
import { HexColorPicker } from 'react-colorful';
import {
  Palette, Sliders, Sparkles, Film, Layers, RotateCcw, Layout,
  Maximize, Eye, Zap, Box, Droplet, Sun, Moon, Star, Flame,
  MoveHorizontal, MoveVertical, AlignHorizontalSpaceAround
} from 'lucide-react';

// ... (نفس الـ interfaces السابقة)

export const BadgeStylingPanel = memo(({ badge, onChange }: BadgeStylingPanelProps) => {
  const [activeTab, setActiveTab] = useState<'style' | 'effects' | 'anim' | 'layout'>('style');
  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      
      {/* Modern Tabs */}
      <div className="flex border-b border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm">
        {[
          { id: 'style', icon: Palette, label: 'Style', color: 'blue' },
          { id: 'effects', icon: Sparkles, label: 'Effects', color: 'purple' },
          { id: 'anim', icon: Film, label: 'Animation', color: 'pink' },
          { id: 'layout', icon: Layout, label: 'Layout', color: 'indigo' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-semibold transition-all relative ${
              activeTab === tab.id
                ? `text-${tab.color}-600 bg-white shadow-inner`
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <tab.icon className={`w-5 h-5 transition-transform ${activeTab === tab.id ? 'scale-110' : ''}`} />
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-${tab.color}-400 to-${tab.color}-600`} />
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* STYLE TAB */}
        {activeTab === 'style' && (
          <>
            {/* Color Picker - Improved */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-blue-600" />
                  Badge Color
                </span>
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs flex items-center gap-2 transition-all"
                >
                  <div className="w-5 h-5 rounded border-2 border-white shadow-md" style={{ background: badge.color }} />
                  {badge.color.toUpperCase()}
                </button>
              </label>
              
              {showColorPicker && (
                <div className="p-3 bg-white rounded-xl shadow-lg border border-slate-200">
                  <HexColorPicker
                    color={badge.color}
                    onChange={(color) => onChange({ color })}
                    style={{ width: '100%', height: '180px' }}
                  />
                  
                  {/* Quick Presets */}
                  <div className="mt-3 grid grid-cols-8 gap-1.5">
                    {['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'].map(c => (
                      <button
                        key={c}
                        onClick={() => onChange({ color: c })}
                        className="w-full aspect-square rounded-md border-2 border-white shadow-sm hover:scale-110 transition-transform"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Scale Slider - Enhanced */}
            <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <label className="text-sm font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Maximize className="w-4 h-4 text-emerald-600" />
                  Scale
                </span>
                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-mono">
                  {badge.scale.toFixed(2)}x
                </span>
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={badge.scale}
                onChange={(e) => onChange({ scale: parseFloat(e.target.value) })}
                className="w-full h-3 bg-gradient-to-r from-emerald-200 to-emerald-400 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #86efac 0%, #10b981 ${((badge.scale - 0.5) / 2.5) * 100}%, #e5e7eb ${((badge.scale - 0.5) / 2.5) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-slate-500 px-1">
                <span>0.5x</span>
                <span>3x</span>
              </div>
            </div>

            {/* Rotation Slider - Enhanced */}
            <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <label className="text-sm font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-purple-600" />
                  Rotation
                </span>
                <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-mono">
                  {badge.rotation}°
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={badge.rotation}
                onChange={(e) => onChange({ rotation: parseInt(e.target.value) })}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #c084fc 0%, #9333ea ${(badge.rotation / 360) * 100}%, #e5e7eb ${(badge.rotation / 360) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-slate-500 px-1">
                <span>0°</span>
                <span>180°</span>
                <span>360°</span>
              </div>
            </div>

            {/* Opacity Slider - Enhanced */}
            <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <label className="text-sm font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  Opacity
                </span>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-mono">
                  {Math.round(badge.opacity * 100)}%
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={badge.opacity}
                onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #93c5fd 0%, #3b82f6 ${badge.opacity * 100}%, #e5e7eb ${badge.opacity * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>
          </>
        )}

        {/* EFFECTS TAB */}
        {activeTab === 'effects' && (
          <>
            {/* Border Width */}
            <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <label className="text-sm font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-orange-600" />
                  Border Width
                </span>
                <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-md text-xs font-mono">
                  {badge.borderWidth || 0}px
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={badge.borderWidth || 0}
                onChange={(e) => onChange({ borderWidth: parseInt(e.target.value) })}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #fdba74 0%, #f97316 ${((badge.borderWidth || 0) / 10) * 100}%, #e5e7eb ${((badge.borderWidth || 0) / 10) * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>

            {/* Shadow Intensity */}
            <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <label className="text-sm font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-indigo-600" />
                  Shadow Intensity
                </span>
                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-mono">
                  {badge.shadowIntensity || 0}
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={badge.shadowIntensity || 0}
                onChange={(e) => onChange({ shadowIntensity: parseInt(e.target.value) })}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #a5b4fc 0%, #6366f1 ${((badge.shadowIntensity || 0) / 100) * 100}%, #e5e7eb ${((badge.shadowIntensity || 0) / 100) * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>

            {/* Gradient Toggle - iOS Style */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg">
                  <Sun className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block">Enable Gradient</span>
                  <span className="text-xs text-slate-500">Add color transitions</span>
                </div>
              </div>
              <button
                onClick={() => onChange({ gradient: !badge.gradient })}
                className={`relative w-14 h-8 rounded-full transition-all duration-300 shadow-inner ${
                  badge.gradient ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-slate-300'
                }`}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${
                  badge.gradient ? 'translate-x-6' : 'translate-x-0'
                }`}>
                  {badge.gradient ? <Zap className="w-3 h-3 text-purple-600" /> : <Moon className="w-3 h-3 text-slate-400" />}
                </div>
              </button>
            </div>
          </>
        )}

        {/* ANIMATION TAB */}
        {activeTab === 'anim' && (
          <>
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Film className="w-4 h-4 text-pink-600" />
                Animation Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'pulse', label: 'Pulse', icon: Zap, color: 'blue' },
                  { id: 'float', label: 'Float', icon: Sparkles, color: 'purple' },
                  { id: 'spin', label: 'Spin', icon: RotateCcw, color: 'pink' },
                  { id: 'wiggle', label: 'Wiggle', icon: Star, color: 'orange' },
                  { id: 'glow', label: 'Glow', icon: Sun, color: 'yellow' },
                  { id: 'flame', label: 'Flame', icon: Flame, color: 'red' },
                ].map(anim => (
                  <button
                    key={anim.id}
                    onClick={() => onChange({ animation: anim.id })}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                      badge.animation === anim.id
                        ? `bg-${anim.color}-100 text-${anim.color}-700 border-2 border-${anim.color}-500 shadow-lg scale-105`
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:scale-105'
                    }`}
                  >
                    <anim.icon className="w-4 h-4" />
                    {anim.label}
                  </button>
                ))}
              </div>
            </div>

            {badge.animation && (
              <button
                onClick={() => onChange({ animation: undefined })}
                className="w-full px-4 py-3 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-all text-sm font-semibold border border-red-200 shadow-sm"
              >
                ✕ Clear Animation
              </button>
            )}
          </>
        )}

        {/* LAYOUT TAB */}
        {activeTab === 'layout' && (
          <>
            {/* Position Nudging */}
            <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <label className="text-sm font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MoveHorizontal className="w-4 h-4 text-indigo-600" />
                  Position Offset
                </span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>X</span>
                    <span>{badge.xOffset || 0}</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={badge.xOffset || 0}
                    onChange={(e) => onChange({ xOffset: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Y</span>
                    <span>{badge.yOffset || 0}</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={badge.yOffset || 0}
                    onChange={(e) => onChange({ yOffset: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Spacing / Gap */}
            <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <label className="text-sm font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlignHorizontalSpaceAround className="w-4 h-4 text-indigo-600" />
                  Spacing (Gap)
                </span>
                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-mono">
                  {badge.gap || 0}px
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={badge.gap || 0}
                onChange={(e) => onChange({ gap: parseInt(e.target.value) })}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #a5b4fc 0%, #6366f1 ${((badge.gap || 0) / 50) * 100}%, #e5e7eb ${((badge.gap || 0) / 50) * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>

            {/* Z-Index */}
            <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <label className="text-sm font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  Layer Order (Z-Index)
                </span>
                <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-md text-xs font-mono">
                  {badge.zIndex || 0}
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={badge.zIndex || 0}
                onChange={(e) => onChange({ zIndex: parseInt(e.target.value) })}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #5eead4 0%, #14b8a6 ${((badge.zIndex || 0) / 100) * 100}%, #e5e7eb ${((badge.zIndex || 0) / 100) * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>

            {/* Layout Options */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Layout className="w-4 h-4 text-violet-600" />
                Layout Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['vertical', 'horizontal', 'circular', 'grid'].map(layout => (
                  <button
                    key={layout}
                    onClick={() => onChange({ layout })}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      badge.layout === layout
                        ? 'bg-violet-100 text-violet-700 border-2 border-violet-500 shadow-lg scale-105'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:scale-105'
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

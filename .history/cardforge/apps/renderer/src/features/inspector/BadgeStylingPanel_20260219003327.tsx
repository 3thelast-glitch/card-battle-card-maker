import React, { useState, memo } from 'react';
import { HexColorPicker } from 'react-colorful';
import {
  Palette, Sliders, Sparkles, Magic, Layers, RotateCcw, 
  Maximize2, Eye, Zap, Droplets, Sun, Moon, Star, Flame,
  Circle, Grid, Layout
} from 'lucide-react';

// ... (نفس interfaces)

export const BadgeStylingPanel = memo(({ badge, onChange }: BadgeStylingPanelProps) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'style' | 'effects' | 'anim' | 'advanced'>('presets');

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col shadow-2xl overflow-hidden">
      
      {/* Header */}
      <div className="p-4 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center shadow-xl ring-4 ring-purple-500/20">
            <Sparkles className="w-7 h-7 text-white drop-shadow-2xl animate-pulse" />
          </div>
          <div>
            <h2 className="font-black text-2xl bg-gradient-to-r from-slate-900 via-purple-900 to-slate-700 bg-clip-text text-transparent drop-shadow-lg">
              Ultimate Badge Studio
            </h2>
            <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Professional Controls</p>
          </div>
        </div>
        <button 
          onClick={() => onChange({})} 
          className="p-3 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2 text-slate-700 font-semibold"
          title="Reset All"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-white/70 backdrop-blur-md border-b border-slate-200 shadow-sm">
        {[
          { id: 'presets', icon: Layout, label: 'Presets', color: 'orange' },
          { id: 'style', icon: Palette, label: 'Style', color: 'blue' },
          { id: 'effects', icon: Sparkles, label: 'Effects', color: 'purple' },
          { id: 'anim', icon: Magic, label: 'Motion', color: 'emerald' },
          { id: 'advanced', icon: Sliders, label: 'Advanced', color: 'indigo' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-4 px-3 text-center transition-all duration-300 relative group overflow-hidden ${
              activeTab === tab.id
                ? `text-${tab.color}-600 bg-gradient-to-r from-${tab.color}-50 shadow-lg font-bold`
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <tab.icon className={`w-7 h-7 mx-auto mb-2 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110 rotate-6' : ''}`} />
            <span className="text-sm font-semibold tracking-wide">{tab.label}</span>
            {activeTab === tab.id && (
              <div className={`absolute inset-0 bg-gradient-to-r from-${tab.color}-400/10`} />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-20 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
        
        {/* PRESETS TAB */}
        {activeTab === 'presets' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'Legendary Gold', color: '#D4AF37', style: { color: '#D4AF37', shadowIntensity: 80, glow: 15 } },
                { name: 'Epic Purple', color: '#8A2BE2', style: { color: '#8A2BE2', shadowIntensity: 60, glow: 12 } },
                { name: 'Cyber Blue', color: '#00f2ff', style: { color: '#00f2ff', shadowIntensity: 50, glow: 10 } },
                { name: 'Crimson Rage', color: '#DC143C', style: { color: '#DC143C', shadowIntensity: 40, glow: 8 } },
                { name: 'Forest Elven', color: '#228B22', style: { color: '#228B22', shadowIntensity: 30, glow: 5 } },
                { name: 'Shadow Assassin', color: '#2F4F4F', style: { color: '#2F4F4F', shadowIntensity: 70, glow: 0 } },
              ].map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => onChange(preset.style)}
                  className="group relative overflow-hidden p-4 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-white"
                  style={{ backgroundColor: preset.color }}
                >
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                  <div className="relative z-10 flex flex-col items-center text-white">
                    <Star className="w-8 h-8 mb-2 drop-shadow-md" />
                    <span className="font-bold text-sm drop-shadow-md">{preset.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STYLE TAB */}
        {activeTab === 'style' && (
          <div className="space-y-6 animate-fade-in">
            {/* Color Studio */}
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-200 ring-1 ring-slate-100/50">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                <h3 className="font-black text-2xl flex items-center gap-3 text-slate-900 drop-shadow-lg">
                  <Palette className="w-8 h-8 text-blue-600 shadow-lg" />
                  Color Studio
                </h3>
                <div className="flex items-center gap-3 text-sm font-mono bg-slate-900/10 px-4 py-2 rounded-2xl text-slate-700 font-semibold">
                  <div className="w-6 h-6 rounded-2xl border-4 shadow-md" style={{ backgroundColor: badge.color }} />
                  {badge.color}
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Color Picker */}
                <div>
                  <HexColorPicker
                    color={badge.color}
                    onChange={(color) => onChange({ color })}
                    className="w-full shadow-2xl rounded-2xl overflow-hidden border-4 border-white ring-2 ring-slate-200/50"
                  />
                </div>
                
                {/* Quick Colors */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-2 text-lg">
                    Quick Colors
                  </h4>
                  <div className="grid grid-cols-5 gap-3">
                    {[
                      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
                      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
                    ].map(color => (
                      <button
                        key={color}
                        onClick={() => onChange({ color })}
                        className="group relative w-16 h-16 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 border-4 border-transparent hover:border-white overflow-hidden"
                        style={{ backgroundColor: color }}
                      >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                        <div className="absolute bottom-1 right-1 w-3 h-3 bg-white rounded-full shadow-md border-2 border-slate-200 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Control Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Scale */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-3xl shadow-xl border border-emerald-200 hover:shadow-2xl hover:-translate-y-1 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-xl flex items-center gap-2 text-emerald-800">
                    <Maximize2 className="w-6 h-6" />
                    Scale
                  </h4>
                  <div className="text-3xl font-black text-emerald-700 bg-emerald-200/50 px-3 py-1 rounded-2xl shadow-lg">
                    {badge.scale.toFixed(2)}x
                  </div>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="2.5"
                  step="0.05"
                  value={badge.scale}
                  onChange={(e) => onChange({ scale: parseFloat(e.target.value) })}
                  className="w-full h-5 bg-gradient-to-r from-emerald-300 via-emerald-500 to-emerald-700 rounded-3xl cursor-pointer appearance-none shadow-lg group-hover:shadow-xl"
                />
              </div>

              {/* Rotation */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-3xl shadow-xl border border-purple-200 hover:shadow-2xl hover:-translate-y-1 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-xl flex items-center gap-2 text-purple-800">
                    <RotateCcw className="w-6 h-6 animate-spin-slow" />
                    Rotation
                  </h4>
                  <div className="text-3xl font-black text-purple-700 bg-purple-200/50 px-3 py-1 rounded-2xl shadow-lg">
                    {badge.rotation}°
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={badge.rotation}
                  onChange={(e) => onChange({ rotation: parseInt(e.target.value) })}
                  className="w-full h-5 bg-gradient-to-r from-purple-300 via-purple-500 to-purple-700 rounded-3xl cursor-pointer appearance-none shadow-lg group-hover:shadow-xl"
                />
              </div>

              {/* Opacity */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-3xl shadow-xl border border-blue-200 hover:shadow-2xl hover:-translate-y-1 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-xl flex items-center gap-2 text-blue-800">
                    <Eye className="w-6 h-6" />
                    Opacity
                  </h4>
                  <div className="text-3xl font-black text-blue-700 bg-blue-200/50 px-3 py-1 rounded-2xl shadow-lg">
                    {Math.round(badge.opacity * 100)}%
                  </div>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.01"
                  value={badge.opacity}
                  onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
                  className="w-full h-5 bg-gradient-to-r from-blue-300 via-blue-500 to-blue-700 rounded-3xl cursor-pointer appearance-none shadow-lg group-hover:shadow-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* باقي الـ tabs زي ما هي... */}
        
      </div>

      {/* Footer */}
      <div className="p-4 bg-gradient-to-r from-slate-900/5 to-slate-800/5 backdrop-blur-xl border-t border-slate-200 flex items-center justify-between">
        <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all flex items-center gap-2">
          <Github className="w-5 h-5" />
          Save Changes
        </button>
        <div className="text-xs text-slate-500 font-mono">
          Badge ID: <span className="font-bold text-purple-600">{badge.id}</span>
        </div>
      </div>
    </div>
  );
});

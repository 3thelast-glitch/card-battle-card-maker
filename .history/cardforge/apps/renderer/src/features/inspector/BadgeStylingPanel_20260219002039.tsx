import React, { useState, memo } from 'react';
import { HexColorPicker } from 'react-colorful';
import {
  Palette, SlidersHorizontal, Sparkles, Magic, Layers, RotateCcw, 
  Maximize2, Eye, Zap, Droplets, Droplet, Sun, Moon, Star, Flame, Github
} from 'lucide-react';

export const BadgeStylingPanel = memo(({ badge, onChange }: BadgeStylingPanelProps) => {
  const [activeTab, setActiveTab] = useState<'style' | 'effects' | 'anim' | 'advanced'>('style');
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col shadow-2xl overflow-hidden">
      
      {/* Header */}
      <div className="p-4 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white drop-shadow-lg" />
          </div>
          <div>
            <h2 className="font-black text-xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Ultimate Badge Studio
            </h2>
            <p className="text-xs text-slate-500 font-medium">Advanced styling controls</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onChange({})} 
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all shadow-sm"
            title="Reset to defaults"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <span className="px-2 py-1 bg-slate-100 text-xs font-mono rounded-md text-slate-600">
            {badge.id}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-white/50 backdrop-blur-sm border-b border-slate-200">
        {[
          { id: 'style', icon: Palette, label: 'Style' },
          { id: 'effects', icon: Sparkles, label: 'Effects' },
          { id: 'anim', icon: Magic, label: 'Animation' },
          { id: 'advanced', icon: SlidersHorizontal, label: 'Advanced' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-4 px-2 text-center transition-all relative group ${
              activeTab === tab.id
                ? 'text-purple-600 font-bold shadow-md'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className={`w-6 h-6 mx-auto mb-1 transition-transform ${activeTab === tab.id ? 'scale-110' : ''}`} />
            <span className="text-xs font-semibold block">{tab.label}</span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-t-full shadow-lg" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* STYLE */}
        {activeTab === 'style' && (
          <div className="space-y-6">
            {/* Color Picker */}
            <div className="group">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                  <Palette className="w-5 h-5 text-blue-600" />
                  Primary Color
                </h3>
                <div className="flex items-center gap-2 text-sm text-slate-600 font-mono bg-slate-100 px-3 py-1 rounded-full">
                  <div className="w-4 h-4 rounded-full border-2 shadow-md" style={{ backgroundColor: badge.color }} />
                  {badge.color}
                </div>
              </div>
              
              {/* Gradient Color Picker */}
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200">
                <HexColorPicker
                  color={badge.color}
                  onChange={(color) => onChange({ color })}
                  className="w-full"
                />
                
                {/* Quick Colors */}
                <div className="mt-4 grid grid-cols-10 gap-2 pt-4 border-t border-slate-200">
                  {[
                    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
                    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
                  ].map(color => (
                    <button
                      key={color}
                      onClick={() => onChange({ color })}
                      className="w-10 h-10 rounded-2xl shadow-md hover:shadow-xl hover:scale-110 transition-all border-2 border-transparent hover:border-white"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Scale */}
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                  <Maximize2 className="w-5 h-5 text-emerald-600" />
                  Scale & Size
                </h3>
                <div className="text-2xl font-black text-emerald-600 font-mono">
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
                className="w-full h-4 bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-600 rounded-full cursor-pointer appearance-none shadow-lg"
              />
            </div>

            {/* Rotation */}
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                  <RotateCcw className="w-5 h-5 text-purple-600" />
                  Rotation
                </h3>
                <div className="text-2xl font-black text-purple-600 font-mono">
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
                className="w-full h-4 bg-gradient-to-r from-purple-200 via-purple-400 to-purple-600 rounded-full cursor-pointer appearance-none shadow-lg"
              />
            </div>

            {/* Opacity */}
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Opacity
                </h3>
                <div className="text-2xl font-black text-blue-600 font-mono">
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
                className="w-full h-4 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-600 rounded-full cursor-pointer appearance-none shadow-lg"
              />
            </div>
          </div>
        )}

        {/* EFFECTS */}
        {activeTab === 'effects' && (
          <div className="space-y-6">
            {/* Border */}
            <div className="bg-gradient-to-r from-orange-50 to-rose-50 p-6 rounded-3xl border-2 border-orange-200 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2 text-orange-800">
                  <Droplets className="w-5 h-5" />
                  Border & Shadow
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Border Width</label>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="0.5"
                    value={badge.borderWidth || 0}
                    onChange={(e) => onChange({ borderWidth: parseFloat(e.target.value) })}
                    className="w-full h-3 bg-gradient-to-r from-orange-300 to-orange-500 rounded-full cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Shadow</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={badge.shadowIntensity || 0}
                    onChange={(e) => onChange({ shadowIntensity: parseInt(e.target.value) })}
                    className="w-full h-3 bg-gradient-to-r from-slate-300 to-slate-600 rounded-full cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Gradient Toggle */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-3xl border-2 border-indigo-200 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <Sun className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">Gradient Effect</h3>
                    <p className="text-sm text-slate-600">Enable beautiful color transitions</p>
                  </div>
                </div>
                <button
                  onClick={() => onChange({ gradient: !badge.gradient })}
                  className={`w-16 h-10 rounded-2xl shadow-xl transition-all duration-300 flex items-center p-1 ${
                    badge.gradient 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-purple-500/25' 
                      : 'bg-gradient-to-r from-slate-200 to-slate-300 shadow-slate-200/50'
                  }`}
                >
                  <div className={`w-8 h-8 bg-white rounded-2xl shadow-md transition-transform duration-300 flex items-center justify-center ${
                    badge.gradient ? 'translate-x-6' : 'translate-x-1'
                  }`}>
                    {badge.gradient ? (
                      <Zap className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Moon className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ANIMATION */}
        {activeTab === 'anim' && (
          <div className="space-y-4">
            <h3 className="font-bold text-xl flex items-center gap-2 text-slate-800 p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-3xl border border-pink-200">
              <Magic className="w-6 h-6 text-pink-600" />
              Animation Presets
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'pulse', label: 'Pulse', icon: Zap, color: 'blue' },
                { id: 'float', label: 'Float Up', icon: Sparkles, color: 'emerald' },
                { id: 'spin', label: 'Spin', icon: RotateCcw, color: 'purple' },
                { id: 'wiggle', label: 'Wiggle', icon: Star, color: 'yellow' },
                { id: 'glow', label: 'Glow', icon: Sun, color: 'orange' },
                { id: 'bounce', label: 'Bounce', icon: Flame, color: 'red' },
              ].map(anim => (
                <button
                  key={anim.id}
                  onClick={() => onChange({ animation: anim.id })}
                  className={`group relative overflow-hidden p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 ${
                    badge.animation === anim.id
                      ? `bg-gradient-to-br from-${anim.color}-400 to-${anim.color}-600 text-white shadow-${anim.color}-500/50`
                      : 'bg-white border-2 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r from-${anim.color}-500/20 to-${anim.color}-600/20 opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <anim.icon className={`w-10 h-10 mx-auto mb-3 ${badge.animation === anim.id ? 'drop-shadow-lg' : ''}`} />
                  <div className="font-bold text-lg mb-1">{anim.label}</div>
                  <div className="text-sm opacity-90">Click to apply</div>
                </button>
              ))}
            </div>
            
            {badge.animation && (
              <div className="p-6 bg-gradient-to-r from-red-50 to-rose-50 rounded-3xl border-2 border-red-200 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-xl">
                      <RotateCcw className="w-6 h-6 text-white animate-spin" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-red-800">Active: {badge.animation}</h3>
                      <p className="text-sm text-red-700">Click to clear</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onChange({ animation: undefined })}
                    className="px-6 py-2 bg-white text-red-600 font-bold rounded-2xl shadow-md hover:shadow-lg hover:bg-red-50 transition-all border border-red-200"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADVANCED */}
        {activeTab === 'advanced' && (
          <div className="space-y-6">
            {/* Z-Index */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-6 rounded-3xl border-2 border-teal-200 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2 text-teal-800">
                  <Layers className="w-5 h-5" />
                  Layer Order
                </h3>
                <div className="text-2xl font-black text-teal-600">{badge.zIndex || 1}</div>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={badge.zIndex || 1}
                onChange={(e) => onChange({ zIndex: parseInt(e.target.value) })}
                className="w-full h-4 bg-gradient-to-r from-teal-300 to-emerald-500 rounded-full cursor-pointer shadow-lg"
              />
            </div>

            {/* Layout */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'vertical', label: 'Vertical Stack', icon: Maximize2 },
                { id: 'horizontal', label: 'Horizontal', icon: Maximize2 },
                { id: 'circle', label: 'Circular', icon: Circle },
                { id: 'grid', label: 'Grid Layout', icon: Grid },
              ].map(layout => (
                <button
                  key={layout.id}
                  onClick={() => onChange({ layout: layout.id })}
                  className={`p-6 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all border-2 ${
                    badge.layout === layout.id
                      ? 'bg-gradient-to-br from-sky-400 to-blue-500 text-white border-sky-400 shadow-sky-500/25'
                      : 'bg-white border-slate-200 hover:border-sky-300'
                  }`}
                >
                  <layout.icon className="w-10 h-10 mx-auto mb-3" />
                  <div className="font-bold text-lg">{layout.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

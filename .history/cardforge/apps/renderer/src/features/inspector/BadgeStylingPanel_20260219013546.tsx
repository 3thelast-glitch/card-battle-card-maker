import React, { useState, memo } from 'react';
import { HexColorPicker } from 'react-colorful';
import {
  Palette, Sliders, Sparkles, Wand2, Layers, RotateCcw, 
  Maximize2, Eye, Zap, Droplets, Sun, Moon, Star, Flame,
  Layout, Grid, Circle, Github, Type, Shield, Sword, Heart, Crown, Ghost, Skull
} from 'lucide-react';

export interface BadgeStylingPanelProps {
  badge?: any;
  onChange: (updates: any) => void;
}

// Custom SVG Arrows for Elemental Values
const GreenUpArrow = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 19V5" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 12L12 5L19 12" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RedDownArrow = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5V19" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 12L12 19L5 12" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const BadgeStylingPanel = memo(({ badge, onChange }: BadgeStylingPanelProps) => {
  // Safe access to badge properties to prevent crashes
  const b = badge || {};
  
  const [activeTab, setActiveTab] = useState<'presets' | 'content' | 'style' | 'effects' | 'anim' | 'advanced'>('presets');

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col shadow-2xl overflow-hidden">
      {/* Golden Fantasy Glow Styles */}
      <style>{`
        @keyframes pulse-glow-gold {
          0%, 100% { box-shadow: 0 0 15px rgba(212, 175, 55, 0.4); }
          50% { box-shadow: 0 0 25px rgba(212, 175, 55, 0.8); }
        }
        @keyframes pulse-glow-purple {
          0%, 100% { box-shadow: 0 0 15px rgba(138, 43, 226, 0.4); }
          50% { box-shadow: 0 0 25px rgba(138, 43, 226, 0.8); }
        }
        .glow-gold { animation: pulse-glow-gold 3s infinite; }
        .glow-purple { animation: pulse-glow-purple 3s infinite; }
      `}</style>
      
      {/* Header */}
      <div className="p-4 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center shadow-xl ring-4 ring-purple-500/20">
            <Sparkles className="w-7 h-7 text-white drop-shadow-2xl animate-pulse" />
          </div>
          <div>
            <h2 className="font-black text-2xl bg-gradient-to-r from-purple-900 to-purple-500 bg-clip-text text-transparent drop-shadow-lg">
              Ultimate Badge Studio
            </h2>
            <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Master Your Elements</p>
          </div>
        </div>
        <button 
          onClick={() => onChange({ ...b, style: {} })} 
          className="p-3 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2 text-slate-700 font-semibold"
          title="Reset All"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-white/70 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        {[
          { id: 'presets', icon: Layout, label: 'Presets', color: 'orange' },
          { id: 'content', icon: Type, label: 'Content', color: 'teal' },
          { id: 'style', icon: Palette, label: 'Style', color: 'blue' },
          { id: 'effects', icon: Sparkles, label: 'Effects', color: 'purple' },
          { id: 'anim', icon: Wand2, label: 'Motion', color: 'emerald' },
          { id: 'advanced', icon: Sliders, label: 'Advanced', color: 'indigo' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-4 px-3 text-center transition-all duration-300 relative group overflow-hidden ${
              activeTab === tab.id
                ? 'text-purple-700 bg-purple-50/50 font-bold'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <tab.icon className={`w-6 h-6 mx-auto mb-2 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110 text-purple-600' : ''}`} />
            <span className="text-xs font-bold tracking-wide uppercase">{tab.label}</span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-20 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
        
        {/* PRESETS TAB */}
        {activeTab === 'presets' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-3 gap-4">
              {[
                { name: 'Legendary', bg: 'linear-gradient(135deg, #FFD700, #D4AF37)', class: 'glow-gold', style: { color: '#D4AF37', gradient: true, shadowIntensity: 80, glow: 15 } },
                { name: 'Epic', bg: 'linear-gradient(135deg, #9370DB, #8A2BE2)', class: 'glow-purple', style: { color: '#8A2BE2', gradient: true, shadowIntensity: 60, glow: 12 } },
                { name: 'Rare', bg: 'linear-gradient(135deg, #60A5FA, #2563EB)', class: '', style: { color: '#2563EB', gradient: true, shadowIntensity: 40, glow: 8 } },
                { name: 'Common', bg: 'linear-gradient(135deg, #E5E7EB, #9CA3AF)', class: '', style: { color: '#9CA3AF', gradient: true, shadowIntensity: 20, glow: 0 } },
                { name: 'Tribe (Solid)', bg: '#1a1a1a', class: '', style: { color: '#1a1a1a', gradient: false, opacity: 1, borderWidth: 0 } },
                { name: 'Ember', bg: '#f97316', class: '', style: { color: '#f97316', shadowIntensity: 50, glow: 10 } },
              ].map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => onChange({ ...b, ...preset.style })}
                  className={`group relative overflow-hidden p-4 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-white ${preset.class}`}
                  style={{ background: preset.bg }}
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

        {/* CONTENT TAB */}
        {activeTab === 'content' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-slate-200">
              <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
                <Type className="w-5 h-5 text-teal-600" />
                Badge Content
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Text / Value</label>
                  <input 
                    type="text" 
                    value={b.text || ''} 
                    onChange={(e) => onChange({ ...b, text: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    placeholder="e.g. +5, ATK, 99"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Elemental Icons</label>
                  <div className="grid grid-cols-4 gap-3">
                    <button onClick={() => onChange({ ...b, iconId: 'green-up', text: '' })} className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-xl flex items-center justify-center transition-colors group">
                      <GreenUpArrow />
                    </button>
                    <button onClick={() => onChange({ ...b, iconId: 'red-down', text: '' })} className="p-3 bg-slate-50 hover:bg-red-50 border border-slate-200 rounded-xl flex items-center justify-center transition-colors group">
                      <RedDownArrow />
                    </button>
                    {[
                      { id: 'shield', icon: Shield }, { id: 'sword', icon: Sword }, 
                      { id: 'heart', icon: Heart }, { id: 'crown', icon: Crown },
                      { id: 'skull', icon: Skull }, { id: 'ghost', icon: Ghost }
                    ].map(item => (
                      <button 
                        key={item.id}
                        onClick={() => onChange({ ...b, iconId: item.id })}
                        className={`p-3 border rounded-xl flex items-center justify-center transition-all ${b.iconId === item.id ? 'bg-teal-50 border-teal-500 text-teal-600' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500'}`}
                      >
                        <item.icon className="w-6 h-6" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
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
                  <div className="w-6 h-6 rounded-2xl border-4 shadow-md" style={{ backgroundColor: b.color || '#ffffff' }} />
                  {b.color || '#ffffff'}
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Color Picker */}
                <div>
                  <HexColorPicker
                    color={b.color || '#ffffff'}
                    onChange={(color) => onChange({ ...b, color })}
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
                      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#1a1a1a'
                    ].map(color => (
                      <button
                        key={color}
                        onClick={() => onChange({ ...b, color })}
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
                    {(b.scale || 1).toFixed(2)}x
                  </div>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="2.5"
                  step="0.05"
                  value={b.scale || 1}
                  onChange={(e) => onChange({ ...b, scale: parseFloat(e.target.value) })}
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
                    {(b.rotation || 0)}°
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={b.rotation || 0}
                  onChange={(e) => onChange({ ...b, rotation: parseInt(e.target.value) })}
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
                    {Math.round((b.opacity || 1) * 100)}%
                  </div>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.01"
                  value={b.opacity || 1}
                  onChange={(e) => onChange({ ...b, opacity: parseFloat(e.target.value) })}
                  className="w-full h-5 bg-gradient-to-r from-blue-300 via-blue-500 to-blue-700 rounded-3xl cursor-pointer appearance-none shadow-lg group-hover:shadow-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* EFFECTS TAB */}
        {activeTab === 'effects' && (
          <div className="space-y-6 animate-fade-in">
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
                    value={b.borderWidth || 0}
                    onChange={(e) => onChange({ ...b, borderWidth: parseFloat(e.target.value) })}
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
                    value={b.shadowIntensity || 0}
                    onChange={(e) => onChange({ ...b, shadowIntensity: parseInt(e.target.value) })}
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
                  onClick={() => onChange({ ...b, gradient: !b.gradient })}
                  className={`w-16 h-10 rounded-2xl shadow-xl transition-all duration-300 flex items-center p-1 ${
                    b.gradient 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-purple-500/25' 
                      : 'bg-gradient-to-r from-slate-200 to-slate-300 shadow-slate-200/50'
                  }`}
                >
                  <div className={`w-8 h-8 bg-white rounded-2xl shadow-md transition-transform duration-300 flex items-center justify-center ${
                    b.gradient ? 'translate-x-6' : 'translate-x-1'
                  }`}>
                    {b.gradient ? (
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

        {/* ANIMATION TAB */}
        {activeTab === 'anim' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="font-bold text-xl flex items-center gap-2 text-slate-800 p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-3xl border border-pink-200">
              <Wand2 className="w-6 h-6 text-pink-600" />
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
                  onClick={() => onChange({ ...b, animation: anim.id })}
                  className={`group relative overflow-hidden p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 ${
                    b.animation === anim.id
                      ? `bg-gradient-to-br from-${anim.color}-400 to-${anim.color}-600 text-white shadow-${anim.color}-500/50`
                      : 'bg-white border-2 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r from-${anim.color}-500/20 to-${anim.color}-600/20 opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <anim.icon className={`w-10 h-10 mx-auto mb-3 ${b.animation === anim.id ? 'drop-shadow-lg' : ''}`} />
                  <div className="font-bold text-lg mb-1">{anim.label}</div>
                  <div className="text-sm opacity-90">Click to apply</div>
                </button>
              ))}
            </div>
            
            {b.animation && (
              <div className="p-6 bg-gradient-to-r from-red-50 to-rose-50 rounded-3xl border-2 border-red-200 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-xl">
                      <RotateCcw className="w-6 h-6 text-white animate-spin" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-red-800">Active: {b.animation}</h3>
                      <p className="text-sm text-red-700">Click to clear</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onChange({ ...b, animation: undefined })}
                    className="px-6 py-2 bg-white text-red-600 font-bold rounded-2xl shadow-md hover:shadow-lg hover:bg-red-50 transition-all border border-red-200"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADVANCED TAB */}
        {activeTab === 'advanced' && (
          <div className="space-y-6 animate-fade-in">
            {/* Z-Index */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-6 rounded-3xl border-2 border-teal-200 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2 text-teal-800">
                  <Layers className="w-5 h-5" />
                  Layer Order
                </h3>
                <div className="text-2xl font-black text-teal-600">{b.zIndex || 1}</div>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={b.zIndex || 1}
                onChange={(e) => onChange({ ...b, zIndex: parseInt(e.target.value) })}
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
                  onClick={() => onChange({ ...b, layout: layout.id })}
                  className={`p-6 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all border-2 ${
                    b.layout === layout.id
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

      {/* Footer */}
      <div className="p-4 bg-gradient-to-r from-slate-900/5 to-slate-800/5 backdrop-blur-xl border-t border-slate-200 flex items-center justify-between">
        <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all flex items-center gap-2">
          <Github className="w-5 h-5" />
          Save Changes
        </button>
        <div className="text-xs text-slate-500 font-mono">
          Badge ID: <span className="font-bold text-purple-600">{b.id || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
});

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
    <div className="w-full h-full bg-slate-900 flex flex-col shadow-2xl overflow-hidden relative text-slate-100 font-sans selection:bg-purple-500/30">
      {/* Background Noise Texture for Game Feel */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      {/* Golden Fantasy Glow Styles */}
      <style>{`
        @keyframes pulse-glow-gold { 0%, 100% { box-shadow: 0 0 15px rgba(212, 175, 55, 0.4); } 50% { box-shadow: 0 0 25px rgba(212, 175, 55, 0.8); } }
        @keyframes pulse-glow-purple { 0%, 100% { box-shadow: 0 0 15px rgba(138, 43, 226, 0.4); } 50% { box-shadow: 0 0 25px rgba(138, 43, 226, 0.8); } }
        @keyframes pulse-glow-blue { 0%, 100% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.4); } 50% { box-shadow: 0 0 25px rgba(59, 130, 246, 0.8); } }
        .glow-gold { animation: pulse-glow-gold 3s infinite; }
        .glow-purple { animation: pulse-glow-purple 3s infinite; }
        .glow-blue { animation: pulse-glow-blue 3s infinite; }
        
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
      
      {/* Header */}
      <div className="p-4 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between shadow-lg z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-white/20">
            <Sparkles className="w-7 h-7 text-white drop-shadow-2xl animate-pulse" />
          </div>
          <div>
            <h2 className="font-black text-xl bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent drop-shadow-sm">
              Ultimate Badge Studio
            </h2>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Master Your Elements</p>
          </div>
        </div>
        <button 
          onClick={() => onChange({ ...b, style: {} })} 
          className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all shadow-lg hover:shadow-purple-500/20 flex items-center gap-2 text-slate-300 font-semibold text-xs"
          title="Reset All"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-slate-800/50 backdrop-blur-md border-b border-white/5">
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
            className={`flex-1 py-3 px-2 text-center transition-all duration-300 relative group overflow-hidden ${
              activeTab === tab.id
                ? 'text-white bg-white/5'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            <tab.icon className={`w-5 h-5 mx-auto mb-1 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110 text-purple-400' : ''}`} />
            <span className="text-[10px] font-bold tracking-wider uppercase">{tab.label}</span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-20 space-y-6">
        
        {/* PRESETS TAB */}
        {activeTab === 'presets' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Rarity Tiers</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'Legendary', bg: 'linear-gradient(135deg, #FFD700, #D4AF37)', class: 'glow-gold', icon: Crown, style: { color: '#D4AF37', gradient: true, shadowIntensity: 80, glow: 15, opacity: 1 } },
                { name: 'Epic', bg: 'linear-gradient(135deg, #9370DB, #8A2BE2)', class: 'glow-purple', icon: Sparkles, style: { color: '#8A2BE2', gradient: true, shadowIntensity: 60, glow: 12, opacity: 1 } },
                { name: 'Rare', bg: 'linear-gradient(135deg, #60A5FA, #2563EB)', class: 'glow-blue', icon: Star, style: { color: '#2563EB', gradient: true, shadowIntensity: 40, glow: 8, opacity: 1 } },
                { name: 'Common', bg: 'linear-gradient(135deg, #E5E7EB, #9CA3AF)', class: '', icon: Circle, style: { color: '#9CA3AF', gradient: true, shadowIntensity: 20, glow: 0, opacity: 1 } },
              ].map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => onChange({ ...b, ...preset.style })}
                  className={`group relative overflow-hidden h-24 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-white/10 hover:border-white/30 ${preset.class}`}
                >
                  {/* Card Background */}
                  <div className="absolute inset-0 opacity-80" style={{ background: preset.bg }} />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                  
                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
                    <preset.icon className="w-8 h-8 mb-2 drop-shadow-md" />
                    <span className="font-black text-sm tracking-wider drop-shadow-md uppercase">{preset.name}</span>
                  </div>
                </button>
              ))}
            </div>

            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-6 mb-4">Special Styles</h3>
            <div className="grid grid-cols-3 gap-3">
               {[
                { name: 'Tribe (Solid)', bg: '#1a1a1a', style: { color: '#1a1a1a', gradient: false, opacity: 1, borderWidth: 0 } },
                { name: 'Ember', bg: '#f97316', style: { color: '#f97316', shadowIntensity: 50, glow: 10, opacity: 1 } },
                { name: 'Ghost', bg: '#94a3b8', style: { color: '#94a3b8', shadowIntensity: 30, glow: 5, opacity: 0.8 } },
               ].map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => onChange({ ...b, ...preset.style })}
                  className="group relative overflow-hidden p-3 rounded-xl border border-white/10 hover:border-white/30 transition-all hover:-translate-y-1"
                  style={{ background: preset.bg }}
                >
                  <div className="relative z-10 text-center">
                    <span className="font-bold text-xs text-white drop-shadow-md">{preset.name}</span>
                  </div>
                </button>
               ))}
            </div>
          </div>
        )}

        {/* CONTENT TAB */}
        {activeTab === 'content' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-xl">
              <h3 className="font-bold text-sm mb-4 text-slate-200 flex items-center gap-2 uppercase tracking-wider">
                <Type className="w-4 h-4 text-teal-400" />
                Badge Content
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Text / Value</label>
                  <input 
                    type="text" 
                    value={b.text || ''} 
                    onChange={(e) => onChange({ ...b, text: e.target.value })}
                    className="w-full px-4 py-3 bg-black/20 rounded-xl border border-white/10 text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    placeholder="e.g. +5, ATK, 99"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Elemental Icons</label>
                  <div className="grid grid-cols-4 gap-3">
                    <button onClick={() => onChange({ ...b, iconId: 'green-up', text: '' })} className="p-3 bg-black/20 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/50 rounded-xl flex items-center justify-center transition-all group">
                      <GreenUpArrow />
                    </button>
                    <button onClick={() => onChange({ ...b, iconId: 'red-down', text: '' })} className="p-3 bg-black/20 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 rounded-xl flex items-center justify-center transition-all group">
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
                        className={`p-3 border rounded-xl flex items-center justify-center transition-all ${b.iconId === item.id ? 'bg-teal-500/20 border-teal-500 text-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.3)]' : 'bg-black/20 border-white/10 hover:bg-white/5 text-slate-400'}`}
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
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <h3 className="font-black text-lg flex items-center gap-3 text-slate-200 drop-shadow-lg uppercase tracking-wider">
                  <Palette className="w-5 h-5 text-blue-400" />
                  Color Studio
                </h3>
                <div className="flex items-center gap-3 text-xs font-mono bg-black/30 px-3 py-1.5 rounded-lg text-slate-300 font-semibold border border-white/5">
                  <div className="w-4 h-4 rounded-full border border-white/20 shadow-md" style={{ backgroundColor: b.color || '#ffffff' }} />
                  {b.color || '#ffffff'}
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Color Picker */}
                <div>
                  <HexColorPicker
                    color={b.color || '#ffffff'}
                    onChange={(color) => onChange({ ...b, color })}
                    className="w-full !w-full shadow-2xl rounded-xl overflow-hidden border-2 border-white/10"
                  />
                </div>
                
                {/* Quick Colors */}
                <div className="space-y-4">
                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest">
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
                        className="group relative w-12 h-12 rounded-xl shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 border-2 border-transparent hover:border-white/50 overflow-hidden"
                        style={{ backgroundColor: color }}
                      >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                        <div className="absolute bottom-1 right-1 w-2 h-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Control Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Scale */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-emerald-500/30 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-xs flex items-center gap-2 text-emerald-400 uppercase tracking-wider">
                    <Maximize2 className="w-4 h-4" />
                    Scale
                  </h4>
                  <div className="text-lg font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
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
                  className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Rotation */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-xs flex items-center gap-2 text-purple-400 uppercase tracking-wider">
                    <RotateCcw className="w-4 h-4" />
                    Rotation
                  </h4>
                  <div className="text-lg font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
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
                  className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {/* Opacity */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-xs flex items-center gap-2 text-blue-400 uppercase tracking-wider">
                    <Eye className="w-4 h-4" />
                    Opacity
                  </h4>
                  <div className="text-lg font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
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
                  className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* EFFECTS TAB */}
        {activeTab === 'effects' && (
          <div className="space-y-6 animate-fade-in">
            {/* Border */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm flex items-center gap-2 text-orange-400 uppercase tracking-wider">
                  <Droplets className="w-4 h-4" />
                  Border & Shadow
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Border Width</label>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="0.5"
                    value={b.borderWidth || 0}
                    onChange={(e) => onChange({ ...b, borderWidth: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-slate-700 rounded-full cursor-pointer accent-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Shadow</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={b.shadowIntensity || 0}
                    onChange={(e) => onChange({ ...b, shadowIntensity: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-700 rounded-full cursor-pointer accent-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Gradient Toggle */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Sun className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Gradient Effect</h3>
                    <p className="text-xs text-slate-500">Enable beautiful color transitions</p>
                  </div>
                </div>
                <button
                  onClick={() => onChange({ ...b, gradient: !b.gradient })}
                  className={`w-14 h-8 rounded-full shadow-inner transition-all duration-300 flex items-center p-1 border border-white/10 ${
                    b.gradient 
                      ? 'bg-purple-600' 
                      : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${
                    b.gradient ? 'translate-x-6' : 'translate-x-1'
                  }`}>
                    {b.gradient ? (
                      <Zap className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Moon className="w-3 h-3 text-slate-400" />
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
            <h3 className="font-bold text-sm flex items-center gap-2 text-pink-400 p-4 bg-white/5 rounded-2xl border border-white/10 uppercase tracking-wider">
              <Wand2 className="w-4 h-4" />
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
                  className={`group relative overflow-hidden p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border ${
                    b.animation === anim.id
                      ? `bg-${anim.color}-600/20 border-${anim.color}-500 text-white shadow-[0_0_15px_rgba(var(--color-${anim.color}-500),0.3)]`
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-300'
                  }`}
                >
                  <anim.icon className={`w-8 h-8 mx-auto mb-2 ${b.animation === anim.id ? 'drop-shadow-lg text-white' : 'text-slate-400'}`} />
                  <div className="font-bold text-sm mb-1">{anim.label}</div>
                  <div className="text-[10px] opacity-60 uppercase tracking-wide">Click to apply</div>
                </button>
              ))}
            </div>
            
            {b.animation && (
              <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/30 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                      <RotateCcw className="w-6 h-6 text-white animate-spin" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-red-400 uppercase tracking-wider">Active: {b.animation}</h3>
                      <p className="text-xs text-red-300/70">Click to clear</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onChange({ ...b, animation: undefined })}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold rounded-xl shadow-sm transition-all border border-red-500/30 text-xs uppercase tracking-wider"
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
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm flex items-center gap-2 text-teal-400 uppercase tracking-wider">
                  <Layers className="w-4 h-4" />
                  Layer Order
                </h3>
                <div className="text-lg font-black text-teal-400">{b.zIndex || 1}</div>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={b.zIndex || 1}
                onChange={(e) => onChange({ ...b, zIndex: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-700 rounded-full cursor-pointer accent-teal-500"
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
                  className={`p-4 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all border ${
                    b.layout === layout.id
                      ? 'bg-sky-600/20 border-sky-500 text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.3)]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-400'
                  }`}
                >
                  <layout.icon className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-bold text-xs uppercase tracking-wider">{layout.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        
      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-between z-10">
        <button className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/40 hover:scale-105 transition-all flex items-center gap-2 text-xs uppercase tracking-wider">
          <Github className="w-4 h-4" />
          Save Changes
        </button>
        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
          ID: <span className="font-bold text-purple-400">{b.id || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
});

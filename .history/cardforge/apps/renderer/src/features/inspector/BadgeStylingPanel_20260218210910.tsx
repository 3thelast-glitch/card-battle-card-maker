import React, { useState, memo } from 'react';
import { HexColorPicker } from 'react-colorful';
import { 
  Sliders, Sparkles, Film, Layers, RotateCcw, Layout, Maximize
} from 'lucide-react';
import { BadgeModel, BadgePreset } from '../types/badge.types';
import { BadgePresetGrid } from './BadgePresetGrid';
import { ICON_LIBRARY } from './LiveBadgePreview';

interface BadgeStylingPanelProps {
  badge: BadgeModel;
  onChange: (updates: Partial<BadgeModel>) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export const BadgeStylingPanel = memo(({ badge, onChange, onDelete, onDuplicate }: BadgeStylingPanelProps) => {
  const [activeTab, setActiveTab] = useState<'style' | 'effects' | 'anim' | 'layers'>('style');

  const handlePresetSelect = (preset: BadgePreset) => {
    onChange({
      color: preset.colors.primary,
      color2: preset.colors.secondary,
      glowColor: preset.colors.glow,
      layout: preset.layout,
      animation: preset.animation as any,
      gradient: true,
      shadowIntensity: 0.5,
      glow: 10,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-white">
        {[
          { id: 'style', icon: Sliders, label: 'Style' },
          { id: 'effects', icon: Sparkles, label: 'Effects' },
          { id: 'anim', icon: Film, label: 'Anim' },
          { id: 'layers', icon: Layers, label: 'Layers' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 text-[10px] uppercase font-bold tracking-wider flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === tab.id 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        
        {activeTab === 'style' && (
          <>
            <Section label="Presets">
              <BadgePresetGrid onSelect={handlePresetSelect} />
            </Section>
            <Section label="Layout & Content">
              <div className="grid grid-cols-2 gap-2 mb-3">
                {['icon', 'number', 'trait', 'orb'].map(t => (
                  <button
                    key={t}
                    onClick={() => onChange({ type: t as any })}
                    className={`px-2 py-1.5 text-xs font-medium rounded border transition-all ${
                      badge.type === t ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              {badge.type === 'number' ? (
                <input 
                  type="text" value={badge.text || ''} onChange={e => onChange({ text: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Value..."
                />
              ) : (
                <div className="grid grid-cols-6 gap-1.5">
                  {ICON_LIBRARY.map(item => (
                    <button
                      key={item.id}
                      onClick={() => onChange({ iconId: item.id })}
                      className={`aspect-square flex items-center justify-center rounded border transition-all ${
                        badge.iconId === item.id ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <ControlRow label="Layout">
                  <select value={badge.layout || 'vertical'} onChange={e => onChange({ layout: e.target.value as any })} className="w-full text-xs border-slate-200 rounded p-1"><option value="vertical">Vertical</option><option value="horizontal">Horizontal</option><option value="grid">Grid</option></select>
                </ControlRow>
                <ControlRow label="Z-Index" value={`${badge.zIndex}`}>
                  <input type="number" value={badge.zIndex} onChange={e => onChange({ zIndex: +e.target.value })} className="w-full text-xs border-slate-200 rounded p-1" />
                </ControlRow>
              </div>
            </Section>

            <Section label="Colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-600">Fill Type</label>
                  <div className="flex bg-slate-100 rounded-lg p-0.5">
                    <button onClick={() => onChange({ gradient: false })} className={`px-2 py-0.5 text-[10px] rounded ${!badge.gradient ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Solid</button>
                    <button onClick={() => onChange({ gradient: true })} className={`px-2 py-0.5 text-[10px] rounded ${badge.gradient ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Gradient</button>
                  </div>
                </div>
                
                <HexColorPicker color={badge.color} onChange={(c) => onChange({ color: c })} style={{ width: '100%', height: '80px' }} />
                
                {badge.gradient && (
                  <>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-slate-400">Secondary Color</span>
                      <select 
                        value={badge.gradientType || 'linear'} 
                        onChange={(e) => onChange({ gradientType: e.target.value as any })}
                        className="text-[10px] bg-transparent border-none text-blue-600 focus:ring-0 cursor-pointer"
                      >
                        <option value="linear">Linear</option>
                        <option value="radial">Radial</option>
                      </select>
                    </div>
                    <HexColorPicker color={badge.color2 || badge.color} onChange={(c) => onChange({ color2: c })} style={{ width: '100%', height: '80px' }} />
                    
                    {badge.gradientType !== 'radial' && (
                      <ControlRow label="Angle" value={`${badge.gradientAngle || 135}°`}>
                        <input type="range" min="0" max="360" value={badge.gradientAngle || 135} onChange={e => onChange({ gradientAngle: +e.target.value })} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                      </ControlRow>
                    )}
                  </>
                )}
                
                <div className="pt-2 border-t border-slate-100">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Glow Color</label>
                  <HexColorPicker color={badge.glowColor || badge.color} onChange={(c) => onChange({ glowColor: c })} style={{ width: '100%', height: '60px' }} />
                </div>
              </div>
            </Section>
          </>
        )}

        {activeTab === 'effects' && (
          <>
            <Section label="Transform">
              <ControlRow label="Rotation" value={`${badge.rotation}°`} icon={<RotateCcw className="w-3 h-3" />}>
                <input type="range" min="-180" max="180" step="5" value={badge.rotation} onChange={e => onChange({ rotation: +e.target.value })} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </ControlRow>
            </Section>

            <Section label="Border & Shadow">
              <ControlRow label="Border Width" value={`${badge.borderWidth}px`}>
                <input type="range" min="0" max="6" step="0.5" value={badge.borderWidth} onChange={e => onChange({ borderWidth: +e.target.value })} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </ControlRow>
              {badge.borderWidth > 0 && (
                <div className="flex gap-2 mb-2">
                  <input type="color" value={badge.borderColor || badge.color} onChange={e => onChange({ borderColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                  <select value={badge.borderStyle || 'solid'} onChange={e => onChange({ borderStyle: e.target.value as any })} className="flex-1 text-xs border-slate-200 rounded">
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                    <option value="double">Double</option>
                  </select>
                </div>
              )}
              <ControlRow label="Glow" value={`${badge.glow || 0}px`}>
                <input type="range" min="0" max="30" step="1" value={badge.glow || 0} onChange={e => onChange({ glow: +e.target.value })} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </ControlRow>
              <ControlRow label="Opacity" value={`${Math.round(badge.opacity * 100)}%`}>
                <input type="range" min="0" max="1" step="0.1" value={badge.opacity} onChange={e => onChange({ opacity: +e.target.value })} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </ControlRow>
            </Section>
          </>
        )}

        {activeTab === 'anim' && (
          <Section label="Animation Timeline">
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              {['none', 'pulse', 'float', 'spin', 'wiggle', 'glow'].map(anim => (
                <button
                  key={anim}
                  onClick={() => onChange({ animation: anim as any })}
                  className={`px-2 py-2 text-xs font-medium rounded border transition-all ${
                    badge.animation === anim ? 'border-purple-500 bg-purple-50 text-purple-600' : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {anim.charAt(0).toUpperCase() + anim.slice(1)}
                </button>
              ))}
            </div>
          </Section>
        )}

        {activeTab === 'layers' && (
          <div className="space-y-4">
            <div className="p-4 text-center text-slate-400 text-xs">
              Layer management is handled in the main editor view.
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-slate-100 bg-white space-y-3">
        <div className="grid grid-cols-3 gap-2 text-[10px] font-medium text-slate-500 text-center">
          <span>SIZE</span>
          <span>SHADOW</span>
          <span>ANIM</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input type="range" min="0.4" max="2.5" step="0.1" value={badge.scale} onChange={e => onChange({ scale: +e.target.value })} className="h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600" title={`Size: ${badge.scale}x`} />
          <input type="range" min="0" max="1" step="0.1" value={badge.shadowIntensity} onChange={e => onChange({ shadowIntensity: +e.target.value })} className="h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600" title={`Shadow: ${Math.round(badge.shadowIntensity * 100)}%`} />
          <input type="range" min="0.5" max="5" step="0.5" value={badge.animationDuration || 2} onChange={e => onChange({ animationDuration: +e.target.value })} className="h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-purple-600" title={`Duration: ${badge.animationDuration}s`} />
        </div>
        
        <div className="grid grid-cols-2 gap-2 pt-1">
          {onDuplicate && <button onClick={onDuplicate} className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded transition-colors">Duplicate</button>}
          {onDelete && <button onClick={onDelete} className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors">Delete</button>}
        </div>
      </div>
    </div>
  );
});

function Section({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</h3>
      {children}
    </div>
  );
}

function ControlRow({ label, value, icon, children }: { label: string, value?: string, icon?: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          {icon && <span className="text-slate-400">{icon}</span>}
          <label className="text-xs font-medium text-slate-600">{label}</label>
        </div>
        {value && <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{value}</span>}
      </div>
      {children}
    </div>
  );
}
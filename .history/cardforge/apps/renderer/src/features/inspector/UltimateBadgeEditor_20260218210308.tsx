import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import Draggable from 'react-draggable';
import { 
  Shield, Zap, Star, Heart, Sword, Flame, Moon, Droplets, Diamond, Mic, 
  Skull, Ghost, Anchor, Sun, Crown, ArrowRight, Circle,
  Move, Maximize, RotateCcw, Eye, Palette, Layers, Type, Image as ImageIcon,
  Check, X, ChevronDown, ChevronUp, GripVertical, Plus, Trash2, Sliders,
  MousePointer2, Layout, Sparkles, Undo, Redo, Copy, Download, Upload, Square, Wand2,
  Play, Pause, Film, ArrowUp, ArrowDown, Grid
} from 'lucide-react';

// --- 1) Type Definitions ---

export interface BadgeElement {
  id: string;
  type: 'trait' | 'icon' | 'number' | 'orb';
  name: string;
  iconId?: string;        // from predefined icon library
  text?: string;          // for number badges
  x: number;              // 0‑100%
  y: number;              // 0‑100%
  scale: number;          // 0.4‑2.5
  rotation: number;       // -45 to +45
  opacity: number;        // 0.1‑1.0
  backgroundOpacity: number; // 0.1‑1.0 (NEW)
  color: string;          // hex
  color2?: string;        // hex (for gradients)
  gradient?: boolean;
  gradientType?: 'linear' | 'radial';
  gradientAngle?: number;
  borderWidth: number;    // 0‑4px
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
  borderColor?: string;
  borderRadius?: number;
  shadowIntensity: number; // 0‑1
  glow?: number;
  glowColor?: string;
  zIndex: number;
  customImage?: string;
  animation?: 'none' | 'pulse' | 'spin' | 'float' | 'wiggle';
  animationDuration?: number;
}

export interface BadgePreset {
  id: string;
  name: string;
  colors: { primary: string; secondary: string; glow: string };
  effects?: Partial<BadgeElement>;
}

interface UltimateBadgeEditorProps {
  badges: BadgeElement[];
  onUpdate: (badges: BadgeElement[]) => void;
}

// --- Constants & Config ---

const ICON_LIBRARY = [
  { id: 'shield', icon: Shield, name: 'Shield' },
  { id: 'sword', icon: Sword, name: 'Sword' },
  { id: 'heart', icon: Heart, name: 'Heart' },
  { id: 'zap', icon: Zap, name: 'Zap' },
  { id: 'flame', icon: Flame, name: 'Flame' },
  { id: 'droplets', icon: Droplets, name: 'Water' },
  { id: 'crown', icon: Crown, name: 'Crown' },
  { id: 'star', icon: Star, name: 'Star' },
  { id: 'moon', icon: Moon, name: 'Moon' },
  { id: 'sun', icon: Sun, name: 'Sun' },
  { id: 'diamond', icon: Diamond, name: 'Diamond' },
  { id: 'skull', icon: Skull, name: 'Skull' },
  { id: 'ghost', icon: Ghost, name: 'Ghost' },
  { id: 'anchor', icon: Anchor, name: 'Anchor' },
  { id: 'mic', icon: Mic, name: 'Mic' },
  { id: 'arrowRight', icon: ArrowRight, name: 'Arrow' },
  { id: 'circle', icon: Circle, name: 'Circle' },
];

const PRESETS: BadgePreset[] = [
  // --- Golden Fantasy Theme ---
  {
    id: 'gf-legendary', name: 'Legendary',
    colors: { primary: '#D4AF37', secondary: '#B8860B', glow: '#FCD34D' },
    effects: { gradient: true, gradientType: 'linear', gradientAngle: 135, shadowIntensity: 0.8, glow: 15, borderWidth: 2, borderColor: '#FCD34D', animation: 'float', animationDuration: 3 }
  },
  {
    id: 'gf-epic', name: 'Epic',
    colors: { primary: '#8A2BE2', secondary: '#581C87', glow: '#C084FC' },
    effects: { gradient: true, gradientType: 'radial', shadowIntensity: 0.6, glow: 10, borderWidth: 1, borderColor: '#C084FC', animation: 'pulse', animationDuration: 2 }
  },
  {
    id: 'gf-rare', name: 'Rare',
    colors: { primary: '#4169E1', secondary: '#1E3A8A', glow: '#60A5FA' },
    effects: { gradient: true, gradientType: 'linear', gradientAngle: 45, shadowIntensity: 0.4, glow: 5, borderWidth: 1, borderColor: '#60A5FA' }
  },
  {
    id: 'gf-common', name: 'Common',
    colors: { primary: '#C0C0C0', secondary: '#A0A0A0', glow: '#E0E0E0' },
    effects: { gradient: false, shadowIntensity: 0.3, borderWidth: 1, borderColor: '#A0A0A0' }
  },
];

// --- CSS for Animations ---
const ANIMATION_STYLES = `
  @keyframes badge-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  @keyframes badge-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  @keyframes badge-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes badge-wiggle { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
`;

// --- Components ---

export function UltimateBadgeEditor({ badges, onUpdate }: UltimateBadgeEditorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<BadgeElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize history
  useEffect(() => {
    if (history.length === 0 && badges.length > 0) {
      setHistory([badges]);
      setHistoryIndex(0);
    }
  }, []); // Run once on mount

  const addToHistory = useCallback((newBadges: BadgeElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBadges);
    // Limit history size
    if (newHistory.length > 20) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onUpdate(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onUpdate(history[newIndex]);
    }
  };
  
  const selectedBadge = useMemo(() => badges.find(b => b.id === selectedId) || null, [badges, selectedId]);

  const updateBadge = useCallback((id: string, changes: Partial<BadgeElement>) => {
    const updated = badges.map(b => b.id === id ? { ...b, ...changes } : b);
    onUpdate(updated);
    // Debounce history update in a real app, for now direct
    // addToHistory(updated); 
  }, [badges, onUpdate]);

  // Wrapper for update that adds to history (for discrete actions like button clicks)
  const updateBadgeWithHistory = (id: string, changes: Partial<BadgeElement>) => {
    const updated = badges.map(b => b.id === id ? { ...b, ...changes } : b);
    onUpdate(updated);
    addToHistory(updated);
  };

  const handlePresetApply = (preset: BadgePreset) => {
    if (!selectedId) return;
    updateBadgeWithHistory(selectedId, {
      color: preset.colors.primary,
      color2: preset.colors.secondary,
      glowColor: preset.colors.glow,
      ...preset.effects,
    });
  };

  const addNewBadge = () => {
    const newBadge: BadgeElement = {
      id: `badge-${Date.now()}`,
      type: 'icon',
      name: 'New Badge',
      iconId: 'star',
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      opacity: 1,
      backgroundOpacity: 0.2,
      color: '#ffffff',
      gradientType: 'linear',
      gradientAngle: 135,
      borderWidth: 0,
      shadowIntensity: 0,
      zIndex: badges.length + 1
    };
    const updated = [...badges, newBadge];
    onUpdate(updated);
    addToHistory(updated);
    setSelectedId(newBadge.id);
  };

  const duplicateBadge = () => {
    if (!selectedBadge) return;
    const newBadge = { 
      ...selectedBadge, 
      id: `badge-${Date.now()}`, 
      x: selectedBadge.x + 5, 
      y: selectedBadge.y + 5,
      name: `${selectedBadge.name} (Copy)`
    };
    const updated = [...badges, newBadge];
    onUpdate(updated);
    addToHistory(updated);
    setSelectedId(newBadge.id);
  };

  const deleteBadge = (id: string) => {
    const updated = badges.filter(b => b.id !== id);
    onUpdate(updated);
    addToHistory(updated);
    if (selectedId === id) setSelectedId(null);
  };

  const moveBadge = (id: string, direction: 'up' | 'down') => {
    const index = badges.findIndex(b => b.id === id);
    if (index === -1) return;
    if (direction === 'up' && index < badges.length - 1) {
      const newBadges = [...badges];
      [newBadges[index], newBadges[index + 1]] = [newBadges[index + 1], newBadges[index]];
      onUpdate(newBadges);
    } else if (direction === 'down' && index > 0) {
      const newBadges = [...badges];
      [newBadges[index], newBadges[index - 1]] = [newBadges[index - 1], newBadges[index]];
      onUpdate(newBadges);
    }
  };

  const exportConfig = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(badges, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "badges_config.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedBadges = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedBadges)) {
          onUpdate(importedBadges);
          addToHistory(importedBadges);
        }
      } catch (error) {
        console.error("Failed to import badges", error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-full w-full bg-slate-50 relative overflow-hidden">
      <style>{ANIMATION_STYLES}</style>
      {/* Overlay Layer (Visual Editor) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {badges.map(badge => (
          <Draggable
            key={badge.id}
            position={{ x: badge.x * 4, y: badge.y * 6 }} // Scaling factor for demo (assuming 400x600 canvas)
            onStop={(_, data) => {
              // In a real app, convert px back to % based on container size
              // updateBadgeWithHistory(badge.id, { x: data.x / 4, y: data.y / 6 });
              // For this demo, we just update state to trigger re-render if needed, but Draggable handles visual pos
            }}
            bounds="parent"
          >
            <div 
              className={`absolute pointer-events-auto cursor-move group transition-all duration-200 ${selectedId === badge.id ? 'z-50' : 'z-10'}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(badge.id);
              }}
              style={{
                left: `${badge.x}%`,
                top: `${badge.y}%`,
                transform: `translate(-50%, -50%) rotate(${badge.rotation}deg) scale(${badge.scale})`, // Base transform
                opacity: badge.opacity,
                zIndex: badge.zIndex,
              }}
            >
              {/* Animation Wrapper */}
              <div 
                style={{
                  animation: badge.animation && badge.animation !== 'none' 
                    ? `badge-${badge.animation} ${badge.animationDuration || 2}s infinite ease-in-out` 
                    : undefined
                }}
              >
                <div 
                  className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all ${selectedId === badge.id ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:ring-1 hover:ring-blue-300'}`}
                  style={{
                    backgroundColor: badge.gradient ? undefined : badge.color,
                    backgroundImage: badge.gradient 
                      ? (badge.gradientType === 'radial' 
                          ? `radial-gradient(circle, ${badge.color}, ${badge.color2 || badge.color})`
                          : `linear-gradient(${badge.gradientAngle || 135}deg, ${badge.color}, ${badge.color2 || badge.color})`)
                      : undefined,
                    border: `${badge.borderWidth}px ${badge.borderStyle || 'solid'} ${badge.borderColor || badge.color}`,
                    borderRadius: badge.borderRadius ? `${badge.borderRadius}px` : '9999px',
                    boxShadow: `0 4px ${badge.shadowIntensity * 20}px rgba(0,0,0,${badge.shadowIntensity * 0.5})`,
                    filter: badge.glow ? `drop-shadow(0 0 ${badge.glow}px ${badge.glowColor || badge.color})` : undefined,
                  }}
                >
                  <BadgeContent badge={badge} />
                </div>
              </div>
            </div>
          </Draggable>
        ))}
      </div>

      {/* Editor Panel (Right Sidebar) */}
      <div className="absolute right-4 top-4 bottom-4 w-80 bg-white/95 backdrop-blur-xl shadow-2xl border border-slate-200 rounded-3xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-800">Badge Editor</h2>
          </div>
          <div className="flex gap-1">
            <button onClick={undo} disabled={historyIndex <= 0} className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg disabled:opacity-30" title="Undo">
              <Undo className="w-4 h-4" />
            </button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg disabled:opacity-30" title="Redo">
              <Redo className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1 self-center" />
            <button onClick={addNewBadge} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="Add Badge">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Badge List (Horizontal Scroll) */}
        <div className="px-4 py-3 border-b border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
          {badges.map(b => (
            <button
              key={b.id}
              onClick={() => setSelectedId(b.id)}
              className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedId === b.id 
                  ? 'border-blue-500 bg-blue-50 text-blue-600 scale-110 shadow-sm' 
                  : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
              }`}
            >
              <BadgeIconSmall badge={b} />
            </button>
          ))}
        </div>

        {selectedBadge ? (
          <BadgeStylingPanel 
            badge={selectedBadge}
            allBadges={badges}
            onUpdate={(changes) => updateBadgeWithHistory(selectedBadge.id, changes)}
            onDelete={() => deleteBadge(selectedBadge.id)}
            onDuplicate={duplicateBadge}
            onPresetApply={handlePresetApply}
            onMove={(dir) => moveBadge(selectedBadge.id, dir)}
            onSelect={setSelectedId}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <MousePointer2 className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">Select a badge to edit<br/>or create a new one</p>
            <div className="mt-6 flex gap-2">
              <button onClick={exportConfig} className="p-2 bg-white border rounded-lg hover:bg-slate-50" title="Export JSON">
                <Download className="w-4 h-4" />
              </button>
              <label className="p-2 bg-white border rounded-lg hover:bg-slate-50 cursor-pointer" title="Import JSON">
                <Upload className="w-4 h-4" />
                <input type="file" accept=".json" onChange={importConfig} className="hidden" />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Badge Styling Panel Component ---

interface BadgeStylingPanelProps {
  badge: BadgeElement;
  allBadges: BadgeElement[];
  onUpdate: (changes: Partial<BadgeElement>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onPresetApply: (preset: BadgePreset) => void;
  onMove: (direction: 'up' | 'down') => void;
  onSelect: (id: string) => void;
}

function BadgeStylingPanel({ badge, allBadges, onUpdate, onDelete, onDuplicate, onPresetApply, onMove, onSelect }: BadgeStylingPanelProps) {
  const [activeTab, setActiveTab] = useState<'style' | 'effects' | 'anim' | 'layers'>('style');

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
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => onPresetApply(preset)}
                    className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:shadow-sm transition-all text-left"
                  >
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ background: `linear-gradient(135deg, ${preset.colors.primary}, ${preset.colors.secondary})` }} />
                    <span className="text-xs font-medium text-slate-700">{preset.name}</span>
                  </button>
                ))}
              </div>
            </Section>
            <Section label="Layout & Content">
              <div className="grid grid-cols-2 gap-2 mb-3">
                {['icon', 'number', 'trait', 'orb'].map(t => (
                  <button
                    key={t}
                    onClick={() => onUpdate({ type: t as any })}
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
                  type="text" value={badge.text || ''} onChange={e => onUpdate({ text: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Value..."
                />
              ) : (
                <div className="grid grid-cols-6 gap-1.5">
                  {ICON_LIBRARY.map(item => (
                    <button
                      key={item.id}
                      onClick={() => onUpdate({ iconId: item.id })}
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
                <ControlRow label="X Pos" value={`${Math.round(badge.x)}%`}>
                  <input type="range" min="0" max="100" value={badge.x} onChange={e => onUpdate({ x: +e.target.value })} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                </ControlRow>
                <ControlRow label="Y Pos" value={`${Math.round(badge.y)}%`}>
                  <input type="range" min="0" max="100" value={badge.y} onChange={e => onUpdate({ y: +e.target.value })} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                </ControlRow>
              </div>
            </Section>

            <Section label="Colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-600">Fill Type</label>
                  <div className="flex bg-slate-100 rounded-lg p-0.5">
                    <button onClick={() => onUpdate({ gradient: false })} className={`px-2 py-0.5 text-[10px] rounded ${!badge.gradient ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Solid</button>
                    <button onClick={() => onUpdate({ gradient: true })} className={`px-2 py-0.5 text-[10px] rounded ${badge.gradient ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Gradient</button>
                  </div>
                </div>
                
                <HexColorPicker color={badge.color} onChange={(c) => onUpdate({ color: c })} style={{ width: '100%', height: '80px' }} />
                
                {badge.gradient && (
                  <>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-slate-400">Secondary Color</span>
                      <select 
                        value={badge.gradientType || 'linear'} 
                        onChange={(e) => onUpdate({ gradientType: e.target.value as any })}
                        className="text-[10px] bg-transparent border-none text-blue-600 focus:ring-0 cursor-pointer"
                      >
                        <option value="linear">Linear</option>
                        <option value="radial">Radial</option>
                      </select>
                    </div>
                    <HexColorPicker color={badge.color2 || badge.color} onChange={(c) => onUpdate({ color2: c })} style={{ width: '100%', height: '80px' }} />
                    
                    {badge.gradientType !== 'radial' && (
                      <ControlRow label="Angle" value={`${badge.gradientAngle || 135}°`}>
                        <input type="range" min="0" max="360" value={badge.gradientAngle || 135} onChange={e => onUpdate({ gradientAngle: +e.target.value })} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                      </ControlRow>
                    )}
                  </>
                )}
                
                <div className="pt-2 border-t border-slate-100">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Glow Color</label>
                  <HexColorPicker color={badge.glowColor || badge.color} onChange={(c) => onUpdate({ glowColor: c })} style={{ width: '100%', height: '60px' }} />
                </div>
              </div>
            </Section>
          </>
        )}

        {activeTab === 'effects' && (
          <>
            <Section label="Transform">
              <ControlRow label="Rotation" value={`${badge.rotation}°`} icon={<RotateCcw className="w-3 h-3" />}>
                <input type="range" min="-180" max="180" step="5" value={badge.rotation} onChange={e => onUpdate({ rotation: +e.target.value })} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </ControlRow>
            </Section>

            <Section label="Border & Shadow">
              <ControlRow label="Border Width" value={`${badge.borderWidth}px`}>
                <input type="range" min="0" max="6" step="0.5" value={badge.borderWidth} onChange={e => onUpdate({ borderWidth: +e.target.value })} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </ControlRow>
              {badge.borderWidth > 0 && (
                <div className="flex gap-2 mb-2">
                  <input type="color" value={badge.borderColor || badge.color} onChange={e => onUpdate({ borderColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                  <select value={badge.borderStyle || 'solid'} onChange={e => onUpdate({ borderStyle: e.target.value as any })} className="flex-1 text-xs border-slate-200 rounded">
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                    <option value="double">Double</option>
                  </select>
                </div>
              )}
              <ControlRow label="Glow" value={`${badge.glow || 0}px`}>
                <input type="range" min="0" max="30" step="1" value={badge.glow || 0} onChange={e => onUpdate({ glow: +e.target.value })} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </ControlRow>
              <ControlRow label="Opacity" value={`${Math.round(badge.opacity * 100)}%`}>
                <input type="range" min="0" max="1" step="0.1" value={badge.opacity} onChange={e => onUpdate({ opacity: +e.target.value })} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </ControlRow>
            </Section>
          </>
        )}

        {activeTab === 'anim' && (
          <Section label="Animation Timeline">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['none', 'pulse', 'float', 'spin', 'wiggle'].map(anim => (
                <button
                  key={anim}
                  onClick={() => onUpdate({ animation: anim as any })}
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
            
            <Section label="Layer Order">
              <div className="space-y-1">
                {[...allBadges].reverse().map((b, i) => (
                  <div key={b.id} onClick={() => onSelect(b.id)} className={`flex items-center justify-between p-2 rounded border cursor-pointer ${b.id === badge.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                    <div className="flex items-center gap-2">
                      <BadgeIconSmall badge={b} />
                      <span className="text-xs font-medium truncate w-24 text-slate-700">{b.name}</span>
                    </div>
                    {b.id === badge.id && (
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); onMove('up'); }} className="p-1 hover:bg-blue-100 rounded"><ArrowUp size={12} /></button>
                        <button onClick={(e) => { e.stopPropagation(); onMove('down'); }} className="p-1 hover:bg-blue-100 rounded"><ArrowDown size={12} /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
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
          <input type="range" min="0.4" max="2.5" step="0.1" value={badge.scale} onChange={e => onUpdate({ scale: +e.target.value })} className="h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600" title={`Size: ${badge.scale}x`} />
          <input type="range" min="0" max="1" step="0.1" value={badge.shadowIntensity} onChange={e => onUpdate({ shadowIntensity: +e.target.value })} className="h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600" title={`Shadow: ${Math.round(badge.shadowIntensity * 100)}%`} />
          <input type="range" min="0.5" max="5" step="0.5" value={badge.animationDuration || 2} onChange={e => onUpdate({ animationDuration: +e.target.value })} className="h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-purple-600" title={`Duration: ${badge.animationDuration}s`} />
        </div>
        
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button onClick={onDuplicate} className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded transition-colors"><Copy className="w-3 h-3" /> Duplicate</button>
          <button onClick={onDelete} className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"><Trash2 className="w-3 h-3" /> Delete</button>
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---

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

function BadgeContent({ badge }: { badge: BadgeElement }) {
  if (badge.type === 'number') {
    return <span className="font-black text-lg leading-none" style={{ color: badge.color === '#ffffff' ? '#000' : '#fff' }}>{badge.text || '0'}</span>;
  }
  
  const iconItem = ICON_LIBRARY.find(i => i.id === badge.iconId);
  const Icon = iconItem ? iconItem.icon : Star;
  
  return <Icon className="w-3/5 h-3/5" style={{ color: badge.type === 'orb' ? '#fff' : badge.color }} />;
}

function BadgeIconSmall({ badge }: { badge: BadgeElement }) {
  if (badge.type === 'number') return <span className="text-xs font-bold">{badge.text || '#'}</span>;
  const iconItem = ICON_LIBRARY.find(i => i.id === badge.iconId);
  const Icon = iconItem ? iconItem.icon : Star;
  return <Icon className="w-4 h-4" />;
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0,0,0';
}
import { useState, useCallback, useMemo, useEffect } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { HexColorPicker } from 'react-colorful';
import Draggable from 'react-draggable';
import { 
  Shield, Zap, Star, Heart, Sword, Flame, Moon, Droplets, Diamond, Mic, 
  Skull, Ghost, Anchor, Sun, Crown, ArrowRight, Circle,
  Move, Maximize, RotateCcw, Eye, Palette, Layers, Type, Image as ImageIcon,
  Check, X, ChevronDown, ChevronUp, GripVertical, Plus, Trash2, Sliders,
  MousePointer2, Layout, Sparkles, Undo, Redo, Copy, Download, Upload, Square, Wand2
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
  borderWidth: number;    // 0‑4px
  shadowIntensity: number; // 0‑1
  zIndex: number;
  customImage?: string;
}

export interface BadgeStylePreset {
  id: string;
  name: string;
  category: string;
  previewColor: string;
  colors: Record<string, string>;
  effects: Record<string, any>;
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

const PRESETS: BadgeStylePreset[] = [
  { 
    id: 'neon-blue', name: 'Neon Blue', category: 'Neon', previewColor: '#00f3ff',
    colors: { color: '#00f3ff' }, 
    effects: { borderWidth: 2, shadowIntensity: 0.8, opacity: 1, backgroundOpacity: 0.2 } 
  },
  { 
    id: 'neon-pink', name: 'Neon Pink', category: 'Neon', previewColor: '#ff00ff',
    colors: { color: '#ff00ff' }, 
    effects: { borderWidth: 2, shadowIntensity: 0.8, opacity: 1, backgroundOpacity: 0.2 } 
  },
  { 
    id: 'dark-matter', name: 'Dark Matter', category: 'Dark', previewColor: '#1a1a1a',
    colors: { color: '#1a1a1a' }, 
    effects: { borderWidth: 0, shadowIntensity: 0.9, opacity: 1, backgroundOpacity: 0.9 } 
  },
  { 
    id: 'obsidian', name: 'Obsidian', category: 'Dark', previewColor: '#000000',
    colors: { color: '#000000' }, 
    effects: { borderWidth: 1, shadowIntensity: 0.5, opacity: 0.9, backgroundOpacity: 0.8 } 
  },
  { 
    id: 'glass-white', name: 'Glass', category: 'Minimal', previewColor: '#ffffff',
    colors: { color: '#ffffff' }, 
    effects: { borderWidth: 1, shadowIntensity: 0.2, opacity: 0.9, backgroundOpacity: 0.1 } 
  },
  { 
    id: 'frosted', name: 'Frosted', category: 'Minimal', previewColor: '#e2e8f0',
    colors: { color: '#e2e8f0' }, 
    effects: { borderWidth: 0, shadowIntensity: 0.1, opacity: 0.8, backgroundOpacity: 0.3 } 
  },
  { 
    id: 'gold-rush', name: 'Gold Rush', category: 'Metallic', previewColor: '#ffd700',
    colors: { color: '#ffd700' }, 
    effects: { borderWidth: 2, shadowIntensity: 0.5, opacity: 1, backgroundOpacity: 0.3 } 
  },
  { 
    id: 'silver-lining', name: 'Silver', category: 'Metallic', previewColor: '#c0c0c0',
    colors: { color: '#c0c0c0' }, 
    effects: { borderWidth: 1, shadowIntensity: 0.4, opacity: 1, backgroundOpacity: 0.2 } 
  },
  { 
    id: 'fire-gradient', name: 'Inferno', category: 'Gradient', previewColor: '#ff4500',
    colors: { color: '#ff4500' }, 
    effects: { borderWidth: 0, shadowIntensity: 0.6, opacity: 1, backgroundOpacity: 0.6 } 
  },
  { 
    id: 'ocean-depths', name: 'Ocean', category: 'Gradient', previewColor: '#00bfff',
    colors: { color: '#00bfff' }, 
    effects: { borderWidth: 0, shadowIntensity: 0.5, opacity: 0.9, backgroundOpacity: 0.5 } 
  },
  { 
    id: 'nature-green', name: 'Nature', category: 'Flat', previewColor: '#32cd32',
    colors: { color: '#32cd32' }, 
    effects: { borderWidth: 0, shadowIntensity: 0.2, opacity: 1, backgroundOpacity: 1 } 
  },
  { 
    id: 'royal-purple', name: 'Royal', category: 'Flat', previewColor: '#8a2be2',
    colors: { color: '#8a2be2' }, 
    effects: { borderWidth: 0, shadowIntensity: 0.3, opacity: 1, backgroundOpacity: 1 } 
  },
];

// --- Components ---

export function UltimateBadgeEditor({ badges, onUpdate }: UltimateBadgeEditorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'style' | 'content' | 'presets'>('style');
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

  const handlePresetApply = (preset: BadgeStylePreset) => {
    if (!selectedId) return;
    updateBadgeWithHistory(selectedId, {
      color: preset.colors.color,
      ...preset.effects
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
                transform: `translate(-50%, -50%) rotate(${badge.rotation}deg) scale(${badge.scale})`,
                opacity: badge.opacity,
              }}
            >
              <div 
                className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all ${selectedId === badge.id ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:ring-1 hover:ring-blue-300'}`}
                style={{
                  backgroundColor: badge.color, // Using color as base, opacity handled via rgba in real impl
                  // For demo, we simulate background opacity by applying it to a pseudo or inline style
                  background: `rgba(${hexToRgb(badge.color)}, ${badge.backgroundOpacity})`,
                  border: `${badge.borderWidth}px solid ${badge.color}`,
                  boxShadow: `0 4px ${badge.shadowIntensity * 20}px rgba(0,0,0,${badge.shadowIntensity * 0.5})`
                }}
              >
                <BadgeContent badge={badge} />
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
          <div className="flex-1 flex flex-col min-h-0">
            {/* Tabs */}
            <div className="flex border-b border-slate-100">
              {[
                { id: 'style', icon: Sliders, label: 'Style' },
                { id: 'content', icon: Type, label: 'Content' },
                { id: 'presets', icon: Layout, label: 'Presets' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    activeTab === tab.id 
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
              
              {activeTab === 'style' && (
                <>
                  {/* Position & Transform */}
                  <Section label="Transform">
                    <ControlRow label="Scale" value={`${selectedBadge.scale.toFixed(1)}x`} icon={<Maximize className="w-3 h-3" />}>
                      <input 
                        type="range" min="0.4" max="2.5" step="0.1" 
                        value={selectedBadge.scale}
                        onChange={e => updateBadge(selectedBadge.id, { scale: +e.target.value })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </ControlRow>
                    <ControlRow label="Rotation" value={`${selectedBadge.rotation}°`} icon={<RotateCcw className="w-3 h-3" />}>
                      <input 
                        type="range" min="-45" max="45" step="5" 
                        value={selectedBadge.rotation}
                        onChange={e => updateBadge(selectedBadge.id, { rotation: +e.target.value })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </ControlRow>
                  </Section>

                  {/* Appearance */}
                  <Section label="Appearance">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <Palette className="w-3 h-3 text-slate-400" />
                          <label className="text-xs font-medium text-slate-600">Color</label>
                        </div>
                        <div className="w-6 h-6 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: selectedBadge.color }} />
                      </div>
                      <HexColorPicker 
                        color={selectedBadge.color} 
                        onChange={(c) => updateBadge(selectedBadge.id, { color: c })} 
                        style={{ width: '100%', height: '120px' }}
                      />
                    </div>
                    
                    <div className="mt-4 space-y-4">
                      <ControlRow label="Opacity" value={`${Math.round(selectedBadge.opacity * 100)}%`} icon={<Eye className="w-3 h-3" />}>
                        <input 
                          type="range" min="0.1" max="1" step="0.1" 
                          value={selectedBadge.opacity}
                          onChange={e => updateBadge(selectedBadge.id, { opacity: +e.target.value })}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </ControlRow>
                      <ControlRow label="BG Opacity" value={`${Math.round(selectedBadge.backgroundOpacity * 100)}%`} icon={<Layout className="w-3 h-3" />}>
                        <input 
                          type="range" min="0" max="1" step="0.1" 
                          value={selectedBadge.backgroundOpacity}
                          onChange={e => updateBadge(selectedBadge.id, { backgroundOpacity: +e.target.value })}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </ControlRow>
                    </div>
                  </Section>

                  {/* Effects */}
                  <Section label="Effects">
                    <ControlRow label="Border" value={`${selectedBadge.borderWidth}px`} icon={<Square className="w-3 h-3" />}>
                      <input 
                        type="range" min="0" max="4" step="0.5" 
                        value={selectedBadge.borderWidth}
                        onChange={e => updateBadge(selectedBadge.id, { borderWidth: +e.target.value })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </ControlRow>
                    <ControlRow label="Shadow" value={`${Math.round(selectedBadge.shadowIntensity * 100)}%`} icon={<Wand2 className="w-3 h-3" />}>
                      <input 
                        type="range" min="0" max="1" step="0.1" 
                        value={selectedBadge.shadowIntensity}
                        onChange={e => updateBadge(selectedBadge.id, { shadowIntensity: +e.target.value })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </ControlRow>
                  </Section>
                </>
              )}

              {activeTab === 'content' && (
                <div className="space-y-6">
                  <Section label="Badge Type">
                    <div className="grid grid-cols-2 gap-2">
                      {['icon', 'number', 'trait', 'orb'].map(t => (
                        <button
                          key={t}
                          onClick={() => updateBadgeWithHistory(selectedBadge.id, { type: t as any })}
                          className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                            selectedBadge.type === t 
                              ? 'border-blue-500 bg-blue-50 text-blue-600' 
                              : 'border-slate-200 hover:border-slate-300 text-slate-600'
                          }`}
                        >
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                  </Section>

                  {selectedBadge.type === 'number' && (
                    <Section label="Text Content">
                      <input 
                        type="text" 
                        value={selectedBadge.text || ''}
                        onChange={e => updateBadge(selectedBadge.id, { text: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Enter value..."
                      />
                    </Section>
                  )}

                  {(selectedBadge.type === 'icon' || selectedBadge.type === 'trait') && (
                    <Section label="Icon Library">
                      <div className="grid grid-cols-5 gap-2">
                        {ICON_LIBRARY.map(item => (
                          <button
                            key={item.id}
                            onClick={() => updateBadgeWithHistory(selectedBadge.id, { iconId: item.id })}
                            className={`aspect-square flex items-center justify-center rounded-lg border transition-all ${
                              selectedBadge.iconId === item.id 
                                ? 'border-blue-500 bg-blue-50 text-blue-600' 
                                : 'border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-600'
                            }`}
                            title={item.name}
                          >
                            <item.icon className="w-5 h-5" />
                          </button>
                        ))}
                      </div>
                    </Section>
                  )}
                </div>
              )}

              {activeTab === 'presets' && (
                <div className="grid grid-cols-2 gap-3">
                  {PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetApply(preset)}
                      className="group relative p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all text-left overflow-hidden"
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity" style={{ backgroundColor: preset.previewColor }} />
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-700">{preset.name}</span>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.previewColor }} />
                      </div>
                      <div className="text-[10px] text-slate-400">{preset.category}</div>
                    </button>
                  ))}
                </div>
              )}

            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 grid grid-cols-2 gap-2">
              <button 
                onClick={duplicateBadge}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </button>
              <button 
                onClick={() => deleteBadge(selectedBadge.id)}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
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
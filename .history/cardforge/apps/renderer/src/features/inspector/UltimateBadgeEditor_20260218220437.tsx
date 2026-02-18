import { useState, useCallback, useMemo, useEffect } from 'react';
import Draggable from 'react-draggable';
import { 
  Plus, Sparkles, Undo, Redo, Download, Upload, MousePointer2, Copy, Trash2
} from 'lucide-react';
import { BadgeElement } from './types/badge.types';
import { BadgeStylingPanel } from './components/BadgeStylingPanel';
import { LiveBadgePreview, ICON_LIBRARY } from './components/LiveBadgePreview';

interface UltimateBadgeEditorProps {
  badges: BadgeElement[];
  onUpdate: (badges: BadgeElement[]) => void;
}

// --- CSS for Animations ---
const ANIMATION_STYLES = `
  @keyframes badge-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  @keyframes badge-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  @keyframes badge-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes badge-wiggle { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
  @keyframes badge-glow { 0%, 100% { filter: drop-shadow(0 0 2px currentColor); } 50% { filter: drop-shadow(0 0 10px currentColor); } }
  @keyframes badge-pulse-glow { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); filter: brightness(1.5); } }
  @keyframes badge-sparkle { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); filter: brightness(2); } }
  @keyframes badge-flame { 0%, 100% { transform: scale(1) rotate(0deg); filter: hue-rotate(0deg); } 25% { transform: scale(0.95) rotate(-1deg); } 50% { transform: scale(1.05) rotate(1deg); filter: hue-rotate(15deg); } 75% { transform: scale(0.98) rotate(-1deg); } }
  @keyframes badge-star { 0% { transform: rotate(0deg); opacity: 0.8; } 50% { opacity: 1; filter: brightness(1.5); } 100% { transform: rotate(360deg); opacity: 0.8; } }
  @keyframes badge-crystal { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; filter: brightness(1.2); } 100% { background-position: 0% 50%; } }
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
              <LiveBadgePreview badge={badge} selected={selectedId === badge.id} />
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
            onChange={(changes) => updateBadgeWithHistory(selectedBadge.id, changes)}
            // Extra props for functionality not in the requested interface
            onDelete={() => deleteBadge(selectedBadge.id)}
            onDuplicate={duplicateBadge}
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

function BadgeIconSmall({ badge }: { badge: BadgeElement }) {
  if (badge.type === 'number') return <span className="text-xs font-bold">{badge.text || '#'}</span>;
  const iconItem = ICON_LIBRARY.find(i => i.id === badge.iconId);
  const Icon = iconItem ? iconItem.icon : Sparkles;
  return <Icon className="w-4 h-4" />;
}
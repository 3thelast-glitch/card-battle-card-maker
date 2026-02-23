import { useState, useCallback, useMemo, useEffect } from 'react';
import Draggable from 'react-draggable';
import {
  Plus,
  Sparkles,
  Undo,
  Redo,
  Download,
  Upload,
  MousePointer2,
  Copy,
  Trash2,
} from 'lucide-react';

// 🔥 إنشاء Types محلياً لحل مشكلة badge.types
interface BadgeElement {
  id: string;
  type: 'icon' | 'number' | 'text';
  name: string;
  iconId?: string;
  text?: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  backgroundOpacity: number;
  color: string;
  gradientType: 'linear' | 'radial';
  gradientAngle: number;
  borderWidth: number;
  shadowIntensity: number;
  zIndex: number;
}

// 🔥 ICON_LIBRARY محلياً
const ICON_LIBRARY = [
  { id: 'star', icon: Sparkles },
  { id: 'plus', icon: Plus },
  { id: 'undo', icon: Undo },
  { id: 'redo', icon: Redo },
];

interface UltimateBadgeEditorProps {
  badges: BadgeElement[];
  onUpdate: (badges: BadgeElement[]) => void;
}

const ANIMATION_STYLES = `
  @keyframes badge-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  @keyframes badge-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  @keyframes badge-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes badge-wiggle { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
  @keyframes badge-glow { 0%, 100% { filter: drop-shadow(0 0 2px currentColor); } 50% { filter: drop-shadow(0 0 10px currentColor); } }
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

export function UltimateBadgeEditor({
  badges,
  onUpdate,
}: UltimateBadgeEditorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<BadgeElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize history
  useEffect(() => {
    if (history.length === 0 && badges.length > 0) {
      setHistory([badges]);
      setHistoryIndex(0);
    }
  }, []);

  const addToHistory = useCallback(
    (newBadges: BadgeElement[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newBadges);
      if (newHistory.length > 20) newHistory.shift();
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex],
  );

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

  const selectedBadge = useMemo(
    () => badges.find((b) => b.id === selectedId) || null,
    [badges, selectedId],
  );

  const updateBadgeWithHistory = useCallback(
    (id: string, changes: Partial<BadgeElement>) => {
      const updated = badges.map((b) =>
        b.id === id ? { ...b, ...changes } : b,
      );
      onUpdate(updated);
      addToHistory(updated);
    },
    [badges, onUpdate, addToHistory],
  );

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
      zIndex: badges.length + 1,
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
      name: `${selectedBadge.name} (Copy)`,
    };
    const updated = [...badges, newBadge];
    onUpdate(updated);
    addToHistory(updated);
    setSelectedId(newBadge.id);
  };

  const deleteBadge = (id: string) => {
    const updated = badges.filter((b) => b.id !== id);
    onUpdate(updated);
    addToHistory(updated);
    if (selectedId === id) setSelectedId(null);
  };

  const exportConfig = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(badges, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', 'badges_config.json');
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
        console.error('Failed to import badges', error);
      }
    };
    reader.readAsText(file);
  };

  // 🔥 LiveBadgePreview مبسط (بديل مؤقت)
  const LiveBadgePreview = ({
    badge,
    selected,
  }: {
    badge: BadgeElement;
    selected: boolean;
  }) => (
    <div
      className={`badge-preview p-3 rounded-full border-2 transition-all ${
        selected ? 'border-blue-500 shadow-lg' : 'border-transparent'
      }`}
      style={{
        background: `linear-gradient(135deg, ${badge.color}, ${badge.color}dd)`,
        transform: `scale(${badge.scale}) rotate(${badge.rotation}deg)`,
        opacity: badge.opacity,
      }}
    >
      <Sparkles className="w-6 h-6 text-white drop-shadow-lg" />
      <span className="absolute -bottom-1 -right-1 text-xs bg-black/50 text-white px-1 rounded">
        {badge.name}
      </span>
    </div>
  );

  function BadgeIconSmall({ badge }: { badge: BadgeElement }) {
    if (badge.type === 'number')
      return <span className="text-xs font-bold">{badge.text || '#'}</span>;
    return <Sparkles className="w-4 h-4" />;
  }

  return (
    <div className="flex h-full w-full bg-slate-50 relative overflow-hidden">
      <style>{ANIMATION_STYLES}</style>

      {/* Visual Canvas */}
      <div className="absolute inset-0 z-0 p-8 flex items-center justify-center pointer-events-none">
        {badges.map((badge) => (
          <Draggable
            key={badge.id}
            position={{ x: badge.x * 4, y: badge.y * 6 }}
            bounds="parent"
          >
            <div
              className={`pointer-events-auto cursor-move group transition-all duration-200 ${selectedId === badge.id ? 'z-50 scale-110' : 'z-10'}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(badge.id);
              }}
              style={{
                left: `${badge.x}%`,
                top: `${badge.y}%`,
                transform: `translate(-50%, -50%) rotate(${badge.rotation}deg) scale(${badge.scale})`,
                opacity: badge.opacity,
                zIndex: badge.zIndex,
              }}
            >
              <LiveBadgePreview
                badge={badge}
                selected={selectedId === badge.id}
              />
            </div>
          </Draggable>
        ))}
      </div>

      {/* Control Panel */}
      <div className="absolute right-4 top-4 bottom-4 w-80 bg-white/95 backdrop-blur-xl shadow-2xl border border-slate-200 rounded-3xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-800 text-lg">Badge Editor</h2>
          </div>
          <div className="flex gap-1">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg disabled:opacity-30 transition-colors"
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg disabled:opacity-30 transition-colors"
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1 self-center" />
            <button
              onClick={addNewBadge}
              className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
              title="Add Badge"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Badge List */}
        <div className="px-4 py-3 border-b border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
          {badges.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedId(b.id)}
              className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedId === b.id
                  ? 'border-blue-500 bg-blue-50 text-blue-600 scale-110 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:scale-105'
              }`}
              title={b.name}
            >
              <BadgeIconSmall badge={b} />
            </button>
          ))}
        </div>

        {selectedBadge ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Action Buttons */}
            <div className="px-4 py-3 border-b border-slate-100 flex gap-2 bg-slate-50">
              <button
                onClick={duplicateBadge}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-all text-sm font-medium shadow-sm hover:shadow-md"
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </button>
              <button
                onClick={() => deleteBadge(selectedBadge.id)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-all text-sm font-medium shadow-sm hover:shadow-md"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>

            {/* Placeholder for Styling Panel */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="text-center text-slate-400 py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-600 mb-2">
                  Styling Panel
                </h3>
                <p className="text-sm">Style controls will appear here</p>
                <div className="mt-4 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                  Badge: <strong>{selectedBadge.name}</strong>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <MousePointer2 className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm mb-6">
              Select a badge to edit
              <br />
              or create a new one
            </p>
            <div className="flex gap-2">
              <button
                onClick={exportConfig}
                className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm hover:shadow-md"
                title="Export JSON"
              >
                <Download className="w-5 h-5" />
              </button>
              <label
                className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-all shadow-sm hover:shadow-md"
                title="Import JSON"
              >
                <Upload className="w-5 h-5" />
                <input
                  type="file"
                  accept=".json"
                  onChange={importConfig}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

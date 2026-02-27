import { useState, useCallback } from 'react';
import {
  Group as PanelGroup,
  Panel,
  Separator as PanelResizeHandle,
} from 'react-resizable-panels';
import { HexColorPicker } from 'react-colorful';
import Draggable from 'react-draggable';
import {
  X,
  Maximize2,
  Palette,
  RotateCw,
  Undo,
  Redo,
  Move,
  Zap,
  Shield,
  Crown,
  Star,
  Type,
  Image as ImageIcon,
  Heart,
  Sword,
  Flame,
  Moon,
  Diamond,
  Mic,
  Droplets,
  Ghost,
  Skull,
  Sun,
  Anchor,
} from 'lucide-react';

// --- Types ---
export interface ElementProps {
  id: string;
  type: 'trait' | 'icon' | 'number' | 'orb';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity?: number;
  rotation?: number;
  image?: string;
  fontSize?: number;
  text?: string;
  iconId?: string; // New: To store the selected icon ID
}

interface ElementStudioProps {
  elements: ElementProps[];
  onUpdate: (elements: ElementProps[]) => void;
}

// --- Icon Library Configuration ---
const ICON_LIBRARY = [
  { id: 'shield', icon: Shield, name: 'درع' },
  { id: 'sword', icon: Sword, name: 'سيف' },
  { id: 'heart', icon: Heart, name: 'قلب' },
  { id: 'zap', icon: Zap, name: 'برق' },
  { id: 'flame', icon: Flame, name: 'نار' },
  { id: 'droplets', icon: Droplets, name: 'ماء' },
  { id: 'crown', icon: Crown, name: 'تاج' },
  { id: 'star', icon: Star, name: 'نجمة' },
  { id: 'moon', icon: Moon, name: 'قمر' },
  { id: 'sun', icon: Sun, name: 'شمس' },
  { id: 'diamond', icon: Diamond, name: 'ماسة' },
  { id: 'skull', icon: Skull, name: 'جمجمة' },
  { id: 'ghost', icon: Ghost, name: 'شبح' },
  { id: 'anchor', icon: Anchor, name: 'مرساة' },
  { id: 'mic', icon: Mic, name: 'صوت' },
];

export function ElementStudio({ elements, onUpdate }: ElementStudioProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [history, setHistory] = useState<ElementProps[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'style' | 'icon'>('style'); // Tab state

  const editingElement = elements.find((e) => e.id === editingId) || null;

  const getRenderedIcon = useCallback((element: ElementProps) => {
    const defaultIconId =
      element.type === 'trait'
        ? 'shield'
        : element.type === 'orb'
          ? 'star'
          : element.type === 'icon'
            ? 'zap'
            : undefined;
    const iconId = element.iconId ?? defaultIconId;
    if (!iconId) return null;
    const iconMeta = ICON_LIBRARY.find((item) => item.id === iconId);
    if (!iconMeta) return null;
    const Icon = iconMeta.icon;
    return <Icon className="w-full h-full" />;
  }, []);

  // --- Helpers ---
  const updateElement = useCallback(
    (id: string, updates: Partial<ElementProps>) => {
      const newElements = elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el,
      );
      onUpdate(newElements);
    },
    [elements, onUpdate],
  );

  const addHistory = useCallback(() => {
    const newHistory = [...history.slice(0, historyIndex + 1), elements];
    setHistory(newHistory.slice(-10));
    setHistoryIndex(newHistory.length - 1);
  }, [elements, history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      onUpdate(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      onUpdate(history[historyIndex + 1]);
    }
  };

  return (
    <>
      {/* Floating Studio Panel */}
      <div className="fixed top-4 right-4 w-80 bg-white/95 backdrop-blur-xl shadow-2xl border border-slate-200 rounded-3xl z-50 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              🎨 Element Studio
            </h3>
            <div className="flex gap-1">
              <button
                onClick={undo}
                disabled={historyIndex === 0}
                className="p-2 text-slate-500 hover:text-slate-700 disabled:opacity-50"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex === history.length - 1}
                className="p-2 text-slate-500 hover:text-slate-700 disabled:opacity-50"
              >
                <Redo className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            {elements.map((el) => (
              <button
                key={el.id}
                onClick={() => setEditingId(el.id)}
                className={`p-2 rounded-xl transition-all hover:scale-105 ${editingId === el.id ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-100 hover:bg-slate-200'}`}
              >
                {el.type === 'trait' && (
                  <Shield className="w-4 h-4 mx-auto mb-1" />
                )}
                {el.type === 'icon' && <Zap className="w-4 h-4 mx-auto mb-1" />}
                {el.type === 'number' && (
                  <Crown className="w-4 h-4 mx-auto mb-1" />
                )}
                {el.type === 'orb' && <Star className="w-4 h-4 mx-auto mb-1" />}
                <div>{el.name}</div>
              </button>
            ))}
          </div>
        </div>

        {editingElement && (
          <PanelGroup orientation="vertical" className="h-[calc(90vh-12rem)]">
            <Panel defaultSize={50}>
              <div className="p-4 space-y-4 overflow-y-auto h-full custom-scrollbar">
                {/* Position Controls */}
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-700">
                    <Move className="w-4 h-4" />
                    الموقع والحجم
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label>X</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.5"
                        value={editingElement.x}
                        onChange={(e) =>
                          updateElement(editingElement.id, {
                            x: +e.target.value,
                          })
                        }
                        className="w-full h-2 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full cursor-pointer accent-blue-500"
                      />
                      <span>{editingElement.x.toFixed(1)}%</span>
                    </div>
                    <div>
                      <label>Y</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.5"
                        value={editingElement.y}
                        onChange={(e) =>
                          updateElement(editingElement.id, {
                            y: +e.target.value,
                          })
                        }
                        className="w-full h-2 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full cursor-pointer accent-blue-500"
                      />
                      <span>{editingElement.y.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Size Controls */}
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-700">
                    <Maximize2 className="w-4 h-4" />
                    الحجم
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="2.5"
                    step="0.05"
                    value={editingElement.width}
                    onChange={(e) => {
                      updateElement(editingElement.id, {
                        width: +e.target.value,
                        height: +e.target.value,
                      });
                    }}
                    className="w-full h-2 bg-gradient-to-r from-emerald-200 to-emerald-400 rounded-full cursor-pointer accent-emerald-600"
                  />
                  <span className="text-center block font-mono text-lg">
                    {editingElement.width.toFixed(2)}x
                  </span>
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="h-px bg-gradient-to-r from-slate-300 to-slate-400" />

            {/* Bottom Panel: Appearance */}
            <Panel
              defaultSize={55}
              className="overflow-y-auto custom-scrollbar"
            >
              <div className="p-4 space-y-5">
                {/* Size Controls */}
                <div>
                  <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-700">
                    <Maximize2 className="w-4 h-4" />
                    الحجم ({editingElement.width.toFixed(1)}x)
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="3"
                    step="0.1"
                    value={editingElement.width}
                    onChange={(e) =>
                      updateElement(editingElement.id, {
                        width: +e.target.value,
                        height: +e.target.value,
                      })
                    }
                    className="w-full h-2 bg-gradient-to-r from-emerald-200 to-emerald-400 rounded-full cursor-pointer accent-emerald-600"
                  />
                </div>

                {/* Text Input for Numbers (New Feature) */}
                {editingElement.type === 'number' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      النص / الرقم
                    </label>
                    <input
                      type="text"
                      value={editingElement.text || ''}
                      onChange={(e) =>
                        updateElement(editingElement.id, {
                          text: e.target.value,
                        })
                      }
                      placeholder="e.g. 12"
                      maxLength={4}
                      className="w-full p-2 border border-slate-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                )}

                {/* Color Picker */}
                <div>
                  <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-700">
                    <Palette className="w-4 h-4" />
                    اللون
                  </div>
                  <HexColorPicker
                    color={editingElement.color}
                    onChange={(color) =>
                      updateElement(editingElement.id, { color })
                    }
                    style={{ width: '100%', height: '100px' }}
                  />

                  {/* Opacity */}
                  <div className="mt-3">
                    <label className="block text-xs text-slate-600 mb-1">
                      الشفافية
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={editingElement.opacity || 1}
                      onChange={(e) =>
                        updateElement(editingElement.id, {
                          opacity: +e.target.value,
                        })
                      }
                      className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-purple-500"
                    />
                  </div>
                </div>

                {/* Rotation */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <RotateCw className="w-4 h-4" />
                    الدوران ({editingElement.rotation || 0}°)
                  </label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="5"
                    value={editingElement.rotation || 0}
                    onChange={(e) =>
                      updateElement(editingElement.id, {
                        rotation: +e.target.value,
                      })
                    }
                    className="w-full h-2 bg-gradient-to-r from-orange-200 to-orange-400 rounded-full cursor-pointer accent-orange-500"
                  />
                </div>
              </div>
            </Panel>
          </PanelGroup>
        )}
      </div>

      {/* Draggable Elements Overlay (Updated Render Logic) */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {elements.map((el) => (
          <Draggable
            key={el.id}
            bounds="parent"
            position={{ x: el.x * 3, y: el.y * 5 }} // Temporary visual scaling for demo
            onStop={(e, data) => {
              // Calculation logic would go here to convert px back to %
              addHistory();
            }}
          >
            <div
              className={`absolute cursor-move pointer-events-auto select-none border-2 border-dashed rounded-lg p-2 shadow-lg transform transition-all duration-200 hover:scale-110 hover:shadow-2xl group flex items-center justify-center
                ${el.id === editingId ? 'ring-4 ring-blue-400 ring-opacity-50' : 'border-blue-400/50 group-hover:border-blue-500'}`}
              style={{
                left: `${el.x}%`, // Use percentage for initial render
                top: `${el.y}%`,
                width: `${el.width * 40}px`,
                height: `${el.height * 40}px`,
                backgroundColor: el.type === 'orb' ? 'transparent' : el.color,
                opacity: el.opacity || 1,
                transform: `rotate(${el.rotation || 0}deg)`,
                fontSize: `${el.fontSize || 16}px`,
              }}
              onClick={() => setEditingId(el.id)}
            >
              {/* Dynamic Rendering Based on Type */}
              {el.image ? (
                <img
                  src={el.image}
                  alt={el.name}
                  className="w-full h-full object-contain rounded"
                />
              ) : (
                <>
                  {/* Dynamic Render based on Type & Selected Icon */}
                  {el.type === 'number' ? (
                    <div
                      className="w-full h-full flex items-center justify-center font-black text-white drop-shadow-lg leading-none"
                      style={{ fontSize: '150%' }}
                    >
                      {el.text || '12'}
                    </div>
                  ) : el.type === 'orb' ? (
                    <div
                      className="w-full h-full rounded-full shadow-lg flex items-center justify-center relative overflow-hidden"
                      style={{ backgroundColor: el.color }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-black/10 rounded-full pointer-events-none"></div>
                      <div className="relative z-10 w-1/2 h-1/2 text-white/90 drop-shadow-md">
                        {getRenderedIcon(el)}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full text-white drop-shadow-md p-1">
                      {getRenderedIcon(el)}
                    </div>
                  )}
                </>
              )}
            </div>
          </Draggable>
        ))}
      </div>
    </>
  );
}

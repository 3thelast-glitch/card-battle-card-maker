// src/ui/layout/pages/design/DesignEditor.tsx
// Design page wired to cardEditorStore via useCardEditor hook.
// The left panel shows layers/tools, center shows a live CardFrame preview,
// and the right panel controls all card properties.
import { memo, useState, useCallback } from 'react';
import {
    Layers, ChevronLeft, ChevronRight, Plus, Trash2, Eye, EyeOff,
    GripVertical, Sliders, Type, Sparkles, Palette, Image, Move,
} from 'lucide-react';
import { CardFrame } from '../../components/ui/CardFrame';
import type { Rarity, Element } from '../../components/ui/CardFrame';
import { Button } from '../../components/ui/Button';
import { RarityBadge } from '../../components/ui/Badge';
import { useCardEditor } from '../../../../hooks/useCardEditor';

// ── Constants ───────────────────────────────────────────────
const RARITIES: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const ELEMENTS: Element[] = ['fire', 'water', 'nature', 'dark', 'light', 'neutral'];
const ELEMENT_LABELS: Record<Element, string> = {
    fire: '🔥 نار', water: '💧 ماء', nature: '🌿 طبيعة',
    dark: '🌑 ظلام', light: '✨ نور', neutral: '⚪ محايد',
};
const ALL_TRAITS = ['محارب', 'ساحر', 'طائر', 'أسطوري', 'شيطان', 'ملاك', 'حيوان', 'آلي', 'ماء', 'نار', 'متسلل', 'دفاعي'];

type Layer = { id: string; name: string; type: 'art' | 'text' | 'element' | 'stats'; visible: boolean };
const INITIAL_LAYERS: Layer[] = [
    { id: 'l1', name: 'الفن الرئيسي', type: 'art', visible: true },
    { id: 'l2', name: 'العنوان', type: 'text', visible: true },
    { id: 'l3', name: 'العنصر', type: 'element', visible: true },
    { id: 'l4', name: 'الإحصائيات', type: 'stats', visible: true },
];

// ── Panel wrappers ──────────────────────────────────────────
const Panel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden ${className}`}>{children}</div>
);
const PanelHeader = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.03]">
        <span className="text-purple-400">{icon}</span>
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{title}</span>
    </div>
);

// ── Left Panel ──────────────────────────────────────────────
const LeftPanel = memo(({
    layers, setLayers,
}: { layers: Layer[]; setLayers: React.Dispatch<React.SetStateAction<Layer[]>> }) => {
    const toggleVisible = useCallback((id: string) => {
        setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
    }, [setLayers]);

    const LAYER_ICONS: Record<Layer['type'], React.ReactNode> = {
        art: <Image size={11} />, text: <Type size={11} />,
        element: <Sparkles size={11} />, stats: <Sliders size={11} />,
    };

    return (
        <div className="h-full flex flex-col gap-3 p-3 overflow-y-auto">
            <Panel className="flex-1">
                <PanelHeader title="الطبقات" icon={<Layers size={13} />} />
                <div className="p-2 flex flex-col gap-1">
                    {layers.map((layer) => (
                        <div key={layer.id}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/[0.06] group transition-colors cursor-pointer">
                            <GripVertical size={12} className="text-slate-600 group-hover:text-slate-400 cursor-grab" />
                            <span className="text-slate-500 group-hover:text-slate-400 text-[10px]">{LAYER_ICONS[layer.type]}</span>
                            <span className="flex-1 text-xs text-slate-300 truncate">{layer.name}</span>
                            <button onClick={() => toggleVisible(layer.id)}
                                className="text-slate-600 hover:text-slate-300 transition-colors opacity-0 group-hover:opacity-100">
                                {layer.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                            </button>
                        </div>
                    ))}
                    <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-400 hover:bg-white/[0.04] transition-colors mt-1">
                        <Plus size={11} />
                        <span className="text-xs">إضافة طبقة</span>
                    </button>
                </div>
            </Panel>

            <Panel>
                <PanelHeader title="الأدوات" icon={<Palette size={13} />} />
                <div className="p-3 grid grid-cols-3 gap-2">
                    {[
                        { icon: <Move size={14} />, label: 'تحريك' },
                        { icon: <Type size={14} />, label: 'نص' },
                        { icon: <Image size={14} />, label: 'صورة' },
                        { icon: <Sparkles size={14} />, label: 'تأثير' },
                        { icon: <Sliders size={14} />, label: 'فلتر' },
                        { icon: <Trash2 size={14} />, label: 'حذف' },
                    ].map(({ icon, label }) => (
                        <button key={label}
                            className="flex flex-col items-center gap-1 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/[0.12] transition-all text-slate-400 hover:text-slate-200">
                            {icon}
                            <span className="text-[8px]">{label}</span>
                        </button>
                    ))}
                </div>
            </Panel>
        </div>
    );
});
LeftPanel.displayName = 'LeftPanel';

// ── Center Canvas ───────────────────────────────────────────
const CenterCanvas = memo(({ zoom, setZoom }: { zoom: number; setZoom: (z: number) => void }) => {
    const { cardData } = useCardEditor();

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-center gap-2 py-2 border-b border-white/[0.06] bg-black/20 px-4 shrink-0">
                <Button size="xs" variant="ghost" onClick={() => setZoom(Math.max(0.4, zoom - 0.1))}>−</Button>
                <span className="text-xs text-slate-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
                <Button size="xs" variant="ghost" onClick={() => setZoom(Math.min(2.5, zoom + 0.1))}>+</Button>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <Button size="xs" variant="ghost" onClick={() => setZoom(1)}>تهيئة</Button>
            </div>

            {/* Canvas */}
            <div className="flex-1 flex items-center justify-center overflow-hidden bg-[#070b14] relative">
                <div className="absolute inset-0 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <div style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease' }}
                    className="drop-shadow-2xl">
                    <CardFrame data={cardData} width={280} height={380} showGlow showStats />
                </div>
            </div>
        </div>
    );
});
CenterCanvas.displayName = 'CenterCanvas';

// ── Right Properties Panel ──────────────────────────────────
const RightPanel = memo(() => {
    const [tab, setTab] = useState<'stats' | 'text' | 'traits' | 'template'>('stats');
    const {
        cardData,
        setTitle, setDescription, setElement, setRarity,
        setAttack, setHp, setCost, toggleTrait,
    } = useCardEditor();

    const TABS = [
        { id: 'stats' as const, label: 'إحصائيات' },
        { id: 'text' as const, label: 'نصوص' },
        { id: 'traits' as const, label: 'سمات' },
        { id: 'template' as const, label: 'قالب' },
    ];

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-white/[0.06] bg-black/20 px-2 pt-2 gap-1 shrink-0 flex-wrap">
                {TABS.map(({ id, label }) => (
                    <button key={id} onClick={() => setTab(id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-t-xl transition-all
              ${tab === id ? 'bg-white/[0.08] text-slate-200 border-b-2 border-purple-500' : 'text-slate-500 hover:text-slate-300'}`}>
                        {label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">

                {/* ── Stats tab ── */}
                {tab === 'stats' && (<>
                    <Panel>
                        <PanelHeader title="الندرة" icon={<Sparkles size={13} />} />
                        <div className="p-3 grid grid-cols-1 gap-1.5">
                            {RARITIES.map(r => (
                                <button key={r} onClick={() => setRarity(r)}
                                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all
                    ${cardData.rarity === r
                                            ? 'bg-purple-600/30 border border-purple-500/50 text-purple-200'
                                            : 'bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:bg-white/[0.07] hover:text-slate-200'}`}>
                                    <RarityBadge rarity={r} />
                                    {cardData.rarity === r && <span className="text-purple-400">✓</span>}
                                </button>
                            ))}
                        </div>
                    </Panel>

                    <Panel>
                        <PanelHeader title="القوة" icon={<Sliders size={13} />} />
                        <div className="p-3 flex flex-col gap-3">
                            {([
                                ['attack', '⚔️ هجوم', cardData.attack, setAttack, 100],
                                ['hp', '❤️ صحة', cardData.hp, setHp, 100],
                                ['cost', '💎 تكلفة', cardData.cost, setCost, 10],
                            ] as const).map(([key, label, val, setter, max]) => (
                                <div key={key}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-[10px] text-slate-400">{label}</span>
                                        <span className="text-[10px] font-bold text-slate-200">{val}</span>
                                    </div>
                                    <input type="range" min={0} max={max} value={val}
                                        onChange={e => setter(parseInt(e.target.value))}
                                        className="w-full h-1.5 rounded-full accent-purple-500 cursor-pointer" />
                                </div>
                            ))}
                        </div>
                    </Panel>

                    <Panel>
                        <PanelHeader title="العنصر" icon={<Palette size={13} />} />
                        <div className="p-3 grid grid-cols-3 gap-1.5">
                            {ELEMENTS.map(el => (
                                <button key={el} onClick={() => setElement(el)}
                                    className={`py-2 rounded-xl text-[10px] font-medium transition-all text-center
                    ${cardData.element === el
                                            ? 'bg-purple-600/30 border border-purple-500/50 text-white'
                                            : 'bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:bg-white/[0.07]'}`}>
                                    {ELEMENT_LABELS[el]}
                                </button>
                            ))}
                        </div>
                    </Panel>
                </>)}

                {/* ── Text tab ── */}
                {tab === 'text' && (<>
                    <Panel>
                        <PanelHeader title="الاسم" icon={<Type size={13} />} />
                        <div className="p-3">
                            <input value={cardData.title ?? ''} onChange={e => setTitle(e.target.value)} dir="rtl"
                                placeholder="اسم البطاقة..."
                                className="w-full px-3 py-2 text-sm bg-white/[0.05] border border-white/[0.1] rounded-xl
                  text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all text-right" />
                        </div>
                    </Panel>
                    <Panel>
                        <PanelHeader title="الوصف" icon={<Type size={13} />} />
                        <div className="p-3">
                            <textarea value={cardData.description ?? ''} onChange={e => setDescription(e.target.value)} dir="rtl" rows={4}
                                placeholder="وصف البطاقة..."
                                className="w-full px-3 py-2 text-sm bg-white/[0.05] border border-white/[0.1] rounded-xl
                  text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all text-right resize-none" />
                        </div>
                    </Panel>
                </>)}

                {/* ── Traits tab ── */}
                {tab === 'traits' && (
                    <Panel>
                        <PanelHeader title="السمات" icon={<Layers size={13} />} />
                        <div className="p-3 flex flex-wrap gap-2">
                            {ALL_TRAITS.map(t => {
                                const on = (cardData.traits ?? []).includes(t);
                                return (
                                    <button key={t} onClick={() => toggleTrait(t)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                      ${on ? 'bg-purple-600/40 border-purple-500/60 text-purple-200' : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200'}`}>
                                        {t}
                                    </button>
                                );
                            })}
                        </div>
                    </Panel>
                )}

                {/* ── Template tab ── */}
                {tab === 'template' && (
                    <Panel>
                        <PanelHeader title="القوالب" icon={<Sparkles size={13} />} />
                        <div className="p-3 grid grid-cols-2 gap-2">
                            {['كلاسيك', 'حديث', 'أسطوري', 'سايبربنك', 'عربي', 'طبيعة'].map(tpl => (
                                <button key={tpl}
                                    className="flex items-center justify-center py-3 rounded-xl bg-white/[0.04] border border-white/[0.08]
                    text-xs text-slate-400 hover:bg-purple-600/20 hover:border-purple-500/40 hover:text-purple-300 transition-all">
                                    {tpl}
                                </button>
                            ))}
                        </div>
                    </Panel>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/[0.06] bg-black/20 flex gap-2 shrink-0">
                <Button variant="primary" size="sm" fullWidth icon={<Sparkles size={13} />}>
                    توليد بالذكاء الاصطناعي
                </Button>
            </div>
        </div>
    );
});
RightPanel.displayName = 'RightPanel';

// ══ Main DesignEditor ═══════════════════════════════════════
export const DesignEditor = memo(() => {
    const [layers, setLayers] = useState<Layer[]>(INITIAL_LAYERS);
    const [zoom, setZoom] = useState(1);
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(true);

    return (
        <div className="h-full flex flex-row overflow-hidden bg-[#070a14]">

            {/* ── Left Panel ── */}
            <aside
                className="shrink-0 flex flex-col border-r border-white/[0.06] bg-[#0b0e1a] transition-all duration-300 overflow-hidden"
                style={{ width: leftOpen ? 240 : 0, minWidth: leftOpen ? 220 : 0 }}
            >
                <LeftPanel layers={layers} setLayers={setLayers} />
            </aside>

            {/* Left collapse button */}
            <button onClick={() => setLeftOpen(p => !p)}
                className="z-10 self-center shrink-0 w-5 h-10 flex items-center justify-center
          bg-[#0d1120] border border-white/[0.07] rounded-r-lg
          text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-all">
                {leftOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
            </button>

            {/* ── Center Canvas ── */}
            <main className="flex-1 min-w-0 overflow-hidden">
                <CenterCanvas zoom={zoom} setZoom={setZoom} />
            </main>

            {/* Right collapse button */}
            <button onClick={() => setRightOpen(p => !p)}
                className="z-10 self-center shrink-0 w-5 h-10 flex items-center justify-center
          bg-[#0d1120] border border-white/[0.07] rounded-l-lg
          text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-all">
                {rightOpen ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>

            {/* ── Right Panel ── */}
            <aside
                className="shrink-0 flex flex-col border-l border-white/[0.06] bg-[#0b0e1a] transition-all duration-300 overflow-hidden"
                style={{ width: rightOpen ? 280 : 0, minWidth: rightOpen ? 260 : 0 }}
            >
                <RightPanel />
            </aside>
        </div>
    );
});
DesignEditor.displayName = 'DesignEditor';

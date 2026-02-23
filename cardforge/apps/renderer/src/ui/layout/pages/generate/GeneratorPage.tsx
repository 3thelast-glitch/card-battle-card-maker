// src/ui/layout/pages/generate/GeneratorPage.tsx
// Real Gemini-powered generation page using useGenerator hook.
import { memo, useState, useCallback } from 'react';
import { Zap, Sparkles, RefreshCw, ChevronDown, ChevronUp, Clock, CheckCircle, XCircle, Copy, AlertCircle } from 'lucide-react';
import { CardFrame } from '../../components/ui/CardFrame';
import type { CardFrameData, Rarity, Element } from '../../components/ui/CardFrame';
import { Button } from '../../components/ui/Button';
import { RarityBadge, ElementBadge } from '../../components/ui/Badge';
import { useGenerator } from '../../../../hooks/useGenerator';
import { useCardEditor } from '../../../../hooks/useCardEditor';
import type { GeneratedCard, HistoryEntry } from '../../../../store/generatorStore';

// ── Quick-theme chips ──────────────────────────────────────
const THEMES = [
    '⚔️ المحاربون', '🐉 التنانين', '🧙 السحرة', '🌊 البحر',
    '🔥 الحمم', '🌿 الغابة', '👼 الملائكة', '☠️ الأشباح',
    '🏜️ الصحراء', '❄️ الجليد', '⚡ الرعد', '🌙 الليل',
];

const RARITY_OPTS: { r: Rarity; label: string }[] = [
    { r: 'Common', label: 'عادي' },
    { r: 'Uncommon', label: 'غير شائع' },
    { r: 'Rare', label: 'نادر' },
    { r: 'Epic', label: 'ملحمي' },
    { r: 'Legendary', label: 'أسطوري' },
];

const ELEMENT_OPTS: { e: Element; label: string }[] = [
    { e: 'fire', label: '🔥 نار' },
    { e: 'water', label: '💧 ماء' },
    { e: 'nature', label: '🌿 طبيعة' },
    { e: 'dark', label: '🌑 ظلام' },
    { e: 'light', label: '✨ نور' },
    { e: 'neutral', label: '⚪ محايد' },
];

// ── Card thumbnail (generated result) ─────────────────────
const ResultCard = memo(({ card, onUseInEditor }: {
    card: GeneratedCard;
    onUseInEditor: (card: CardFrameData) => void;
}) => (
    <div className="group flex flex-col items-center gap-2 animate-scale-in">
        <div className="relative">
            <CardFrame data={card} scale={0.45} showGlow showStats />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-200
        bg-black/50 rounded-2xl flex items-center justify-center">
                <Button
                    variant="primary" size="xs"
                    onClick={() => onUseInEditor(card)}
                    icon={<Copy size={11} />}
                >
                    فتح في المحرر
                </Button>
            </div>
        </div>
        <div className="text-center w-full">
            <div className="text-xs font-bold text-slate-200 truncate">{card.title}</div>
            <div className="flex items-center justify-center gap-1 mt-1 flex-wrap">
                <RarityBadge rarity={card.rarity ?? 'Common'} />
                <ElementBadge element={card.element ?? 'neutral'} />
            </div>
        </div>
    </div>
));
ResultCard.displayName = 'ResultCard';

// ── History accordion item ─────────────────────────────────
const HistoryItem = memo(({ entry }: { entry: HistoryEntry }) => {
    const [open, setOpen] = useState(false);
    const isOk = entry.status === 'done';

    return (
        <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] overflow-hidden">
            <button onClick={() => setOpen(p => !p)}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/[0.04] transition-colors">
                {isOk
                    ? <CheckCircle size={12} className="text-emerald-400 shrink-0" />
                    : <XCircle size={12} className="text-red-400 shrink-0" />}
                <div className="flex-1 min-w-0 text-right">
                    <div className="text-xs font-semibold text-slate-200 truncate">{entry.prompt}</div>
                    <div className="text-[9px] text-slate-600 mt-0.5 flex items-center gap-1 justify-end">
                        <Clock size={8} />
                        {new Date(entry.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        {isOk && <span>• {entry.cards.length} بطاقات</span>}
                    </div>
                </div>
                {open ? <ChevronUp size={11} className="text-slate-500 shrink-0" /> : <ChevronDown size={11} className="text-slate-500 shrink-0" />}
            </button>

            {open && isOk && entry.cards.length > 0 && (
                <div className="px-2 pb-2 pt-1 flex flex-wrap gap-1.5 border-t border-white/[0.06]">
                    {entry.cards.map((c) => (
                        <div key={c.id} className="flex-shrink-0">
                            <CardFrame data={c} scale={0.17} showGlow={false} showStats={false} />
                        </div>
                    ))}
                </div>
            )}

            {open && entry.status === 'error' && (
                <div className="px-3 py-2 text-[10px] text-red-400 border-t border-white/[0.06]">
                    {entry.errorMessage}
                </div>
            )}
        </div>
    );
});
HistoryItem.displayName = 'HistoryItem';

// ══ Main GeneratorPage ═════════════════════════════════════
export const GeneratorPage = memo(() => {
    const [selectedTheme, setSelectedTheme] = useState('');
    const { applyCard } = useCardEditor();

    const {
        prompt, setPrompt, status, isGenerating, results, history,
        errorMessage, config, updateConfig, generate, reset, clearHistory,
    } = useGenerator();

    const handleGenerate = useCallback(() => {
        void generate(prompt || selectedTheme, {
            count: config.count,
            rarityFilter: config.rarityFilter,
            elementFilter: config.elementFilter,
            lang: 'ar',
        });
    }, [generate, prompt, selectedTheme, config]);

    const handleTheme = useCallback((theme: string) => {
        setSelectedTheme(theme);
        setPrompt(theme);
    }, [setPrompt]);

    const handleUseInEditor = useCallback((card: CardFrameData) => {
        applyCard(card);
        // Signal to AppShell would go here via a shared store / callback.
        // For now applyCard writes to cardEditorStore which DesignEditor reads.
    }, [applyCard]);

    const canGenerate = (prompt.trim() || selectedTheme) && !isGenerating;

    return (
        <div className="h-full flex overflow-hidden bg-[#070a14]">

            {/* ── Left: Themes ── */}
            <aside className="w-64 shrink-0 border-r border-white/[0.06] bg-[#0b0e1a] flex flex-col overflow-hidden">
                <div className="p-3 border-b border-white/[0.06]">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-semibold">قوالب سريعة</div>
                    <div className="flex flex-wrap gap-1.5">
                        {THEMES.map(t => (
                            <button key={t} onClick={() => handleTheme(t)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all
                  ${selectedTheme === t
                                        ? 'bg-purple-600/40 border-purple-500/60 text-purple-200'
                                        : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200'}`}>
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Element filter chips */}
                <div className="p-3 border-b border-white/[0.06]">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-semibold">عنصر محدد</div>
                    <div className="flex flex-wrap gap-1">
                        <button onClick={() => updateConfig({ elementFilter: 'random' })}
                            className={`px-2 py-1 rounded-lg text-[9px] font-medium border transition-all
                ${config.elementFilter === 'random' ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white/[0.04] border-white/[0.07] text-slate-500 hover:text-slate-200'}`}>
                            عشوائي
                        </button>
                        {ELEMENT_OPTS.map(({ e, label }) => (
                            <button key={e} onClick={() => updateConfig({ elementFilter: e })}
                                className={`px-2 py-1 rounded-lg text-[9px] font-medium border transition-all
                  ${config.elementFilter === e ? 'bg-purple-600/50 border-purple-500/70 text-white' : 'bg-white/[0.04] border-white/[0.07] text-slate-500 hover:text-slate-200'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Rarity filter */}
                <div className="p-3">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-semibold">ندرة محددة</div>
                    <div className="flex flex-wrap gap-1">
                        <button onClick={() => updateConfig({ rarityFilter: 'random' })}
                            className={`px-2 py-1 rounded-lg text-[9px] font-medium border transition-all
                ${config.rarityFilter === 'random' ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white/[0.04] border-white/[0.07] text-slate-500 hover:text-slate-200'}`}>
                            عشوائي
                        </button>
                        {RARITY_OPTS.map(({ r, label }) => (
                            <button key={r} onClick={() => updateConfig({ rarityFilter: r })}
                                className={`px-2 py-1 rounded-lg text-[9px] font-medium border transition-all
                  ${config.rarityFilter === r ? 'bg-purple-600/50 border-purple-500/70 text-white' : 'bg-white/[0.04] border-white/[0.07] text-slate-500 hover:text-slate-200'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* ── Center: Generator ── */}
            <main className="flex-1 flex flex-col overflow-hidden min-w-0">

                {/* Config + prompt */}
                <div className="p-5 border-b border-white/[0.06] bg-black/20 flex flex-col gap-4 shrink-0">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/30">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-white">توليد بطاقات بالذكاء الاصطناعي</h2>
                            <p className="text-xs text-slate-500 mt-0.5">أدخل فكرة أو اختر موضوعًا، وسيُنشئ Gemini بطاقات احترافية لك</p>
                        </div>
                    </div>

                    {/* Textarea */}
                    <div className="relative">
                        <textarea
                            value={prompt}
                            onChange={e => { setPrompt(e.target.value); setSelectedTheme(''); }}
                            placeholder="مثال: محاربو الصحراء الأسطوريون ذوو القوى الخارقة..."
                            dir="rtl" rows={3}
                            className="w-full px-4 py-3 pr-11 text-sm bg-white/[0.05] border border-white/[0.1] rounded-2xl
                text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.07]
                transition-all text-right resize-none"
                        />
                        <Sparkles size={15} className="absolute top-3 right-4 text-purple-400 pointer-events-none" />
                    </div>

                    {/* Count + generate */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2">
                            <span className="text-xs text-slate-500">عدد البطاقات:</span>
                            {[2, 4, 6, 8].map(n => (
                                <button key={n} onClick={() => updateConfig({ count: n })}
                                    className={`w-6 h-6 rounded-lg text-xs font-bold transition-all ${config.count === n ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                                    {n}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 mr-auto">
                            {status !== 'idle' && (
                                <Button variant="ghost" size="sm" onClick={reset}>إعادة تعيين</Button>
                            )}
                            <Button
                                variant="primary" size="md"
                                loading={isGenerating}
                                disabled={!canGenerate}
                                onClick={handleGenerate}
                                icon={!isGenerating ? <Zap size={14} /> : undefined}
                            >
                                {isGenerating ? 'جاري التوليد...' : 'توليد الآن'}
                            </Button>
                        </div>
                    </div>

                    {/* Progress bar */}
                    {isGenerating && (
                        <div className="w-full h-1 rounded-full overflow-hidden bg-white/[0.05]">
                            <div className="h-full w-1/2 rounded-full animate-shimmer"
                                style={{ background: 'linear-gradient(90deg, transparent, rgba(155,77,255,0.8), transparent)', backgroundSize: '200% 100%' }} />
                        </div>
                    )}

                    {/* Error banner */}
                    {status === 'error' && errorMessage && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                            <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-300 text-right">{errorMessage}</p>
                        </div>
                    )}
                </div>

                {/* Results area */}
                <div className="flex-1 overflow-y-auto p-5">
                    {results.length > 0 ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold text-slate-200">النتائج ({results.length})</span>
                                <Button variant="ghost" size="xs" icon={<RefreshCw size={11} />} onClick={handleGenerate} disabled={isGenerating}>
                                    إعادة التوليد
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                                {results.map((c, i) => (
                                    <div key={c.id} style={{ animationDelay: `${i * 80}ms` }}>
                                        <ResultCard card={c} onUseInEditor={handleUseInEditor} />
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : !isGenerating && status === 'idle' ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                <Sparkles size={32} className="text-purple-500/60" />
                            </div>
                            <div>
                                <p className="text-slate-400 font-medium">أدخل موضوعًا وانقر توليد</p>
                                <p className="text-xs text-slate-600 mt-1">يستخدم Gemini AI لإنشاء بطاقات ذات إحصائيات متوازنة</p>
                            </div>
                        </div>
                    ) : isGenerating ? (
                        <div className="h-full flex items-center justify-center gap-3">
                            <div className="w-8 h-8 rounded-full border-2 border-purple-500/40 border-t-purple-400 animate-spin" />
                            <span className="text-sm text-slate-400">Gemini يُنشئ البطاقات...</span>
                        </div>
                    ) : null}
                </div>
            </main>

            {/* ── Right: History ── */}
            <aside className="w-60 shrink-0 border-l border-white/[0.06] bg-[#0b0e1a] flex flex-col overflow-hidden">
                <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock size={13} className="text-purple-400" />
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">السجل</span>
                    </div>
                    {history.length > 0 && (
                        <button onClick={clearHistory} className="text-[9px] text-slate-600 hover:text-red-400 transition-colors">
                            مسح
                        </button>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
                    {history.length === 0 ? (
                        <div className="text-xs text-slate-600 text-center mt-10">لا يوجد سجل بعد</div>
                    ) : (
                        history.map(entry => <HistoryItem key={entry.id} entry={entry} />)
                    )}
                </div>
            </aside>
        </div>
    );
});
GeneratorPage.displayName = 'GeneratorPage';

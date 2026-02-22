import { useEffect, useRef, useState } from 'react';
import { Zap, Layers, Sparkles } from 'lucide-react';

interface GenerationModalProps {
    open: boolean;
    cardCount?: number;
}

const STAGES = [
    'Initializing deck engine…',
    'Calculating rarity distribution…',
    'Generating card stats…',
    'Applying balance algorithms…',
    'Finalizing collection…',
];

export function GenerationModal({ open, cardCount }: GenerationModalProps) {
    const [progress, setProgress] = useState(0);
    const [stageIndex, setStageIndex] = useState(0);
    const [visible, setVisible] = useState(false);
    const rafRef = useRef<number>(0);
    const startRef = useRef<number>(0);

    // Animate in/out
    useEffect(() => {
        if (open) {
            setProgress(0);
            setStageIndex(0);
            setVisible(true);
            startRef.current = performance.now();
        } else {
            // Snap to 100% on completion then fade out
            setProgress(100);
            const t = setTimeout(() => setVisible(false), 500);
            return () => clearTimeout(t);
        }
    }, [open]);

    // Smooth progress animation — eases to ~88% while open, jumps to 100 on done
    useEffect(() => {
        if (!open || !visible) return;
        const DURATION = 2200; // ms to reach ~88%

        const tick = (now: number) => {
            const elapsed = now - startRef.current;
            // Ease-out curve: fast start, slow end — never reaches 100% while running
            const raw = 1 - Math.pow(1 - Math.min(elapsed / DURATION, 1), 3);
            const pct = Math.min(raw * 88, 88);
            setProgress(pct);

            // Cycle stage labels
            const stageStep = Math.floor((pct / 88) * (STAGES.length - 1));
            setStageIndex(Math.min(stageStep, STAGES.length - 1));

            if (pct < 88) {
                rafRef.current = requestAnimationFrame(tick);
            }
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [open, visible]);

    if (!visible) return null;

    return (
        /* Glassmorphism backdrop */
        <div
            className={[
                'fixed inset-0 z-[9000] flex items-center justify-center p-4',
                'bg-[#070A14]/80 backdrop-blur-md',
                'transition-opacity duration-300',
                open ? 'opacity-100' : 'opacity-0 pointer-events-none',
            ].join(' ')}
        >
            {/* Modal card */}
            <div
                className={[
                    'relative w-full max-w-sm rounded-2xl overflow-hidden',
                    'bg-[#0D1117] border border-[#252A3A]',
                    'shadow-[0_32px_80px_rgba(0,0,0,0.80),0_0_0_1px_rgba(59,130,246,0.08)]',
                    'transition-all duration-300',
                    open ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
                ].join(' ')}
            >
                {/* Top blue glow accent */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-blue-500/[0.06] to-transparent pointer-events-none" />

                <div className="relative p-7 flex flex-col items-center text-center gap-5">

                    {/* Icon cluster */}
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                            <Zap size={28} className="text-blue-400 animate-pulse" />
                        </div>
                        {/* Orbiting sparkle */}
                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#0D1117] border border-[#252A3A] flex items-center justify-center">
                            <Sparkles size={12} className="text-amber-400" />
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-1.5">
                        <h2 className="text-base font-semibold text-slate-100 leading-tight">
                            Generating Collection
                        </h2>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-[240px]">
                            Please wait while we compute stats, balance rarities, and finalize your cards.
                        </p>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full space-y-2">
                        <div className="w-full h-1.5 bg-[#1A1F2E] rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full relative overflow-hidden transition-all duration-300 ease-out"
                                style={{
                                    width: `${progress}%`,
                                    background: 'linear-gradient(90deg, #2563eb, #3b82f6, #60a5fa)',
                                }}
                            >
                                {/* Shimmer sweep */}
                                <div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                                    style={{ animation: 'shimmer 1.4s ease-in-out infinite' }}
                                />
                            </div>
                        </div>

                        {/* Stage label + percentage */}
                        <div className="flex items-center justify-between px-0.5">
                            <span className="text-[11px] text-slate-600 truncate max-w-[200px] text-left">
                                {STAGES[stageIndex]}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 flex-shrink-0">
                                {Math.round(progress)}%
                            </span>
                        </div>
                    </div>

                    {/* Card count chip */}
                    {cardCount != null && cardCount > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#12151E] border border-[#1E2435]">
                            <Layers size={11} className="text-slate-500" />
                            <span className="text-[11px] text-slate-500">
                                <span className="font-semibold text-slate-400">{cardCount}</span> cards queued
                            </span>
                        </div>
                    )}
                </div>

                {/* Bottom border line */}
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#252A3A] to-transparent" />
            </div>

            {/* Shimmer keyframe — injected inline so it works without a CSS file */}
            <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
        </div>
    );
}

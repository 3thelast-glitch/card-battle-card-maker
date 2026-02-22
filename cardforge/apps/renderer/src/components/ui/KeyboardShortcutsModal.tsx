import { useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsModalProps {
    open: boolean;
    onClose: () => void;
}

const SHORTCUTS = [
    {
        category: 'Project', items: [
            { keys: ['Ctrl', 'S'], label: 'Save project' },
            { keys: ['Ctrl', 'Z'], label: 'Undo' },
            { keys: ['Ctrl', 'Y'], label: 'Redo' },
        ]
    },
    {
        category: 'Cards', items: [
            { keys: ['Ctrl', 'D'], label: 'Duplicate selected card' },
            { keys: ['Delete'], label: 'Delete selected card' },
            { keys: ['↑ ↓'], label: 'Select previous / next card' },
        ]
    },
    {
        category: 'Canvas', items: [
            { keys: ['Ctrl', '+'], label: 'Zoom in' },
            { keys: ['Ctrl', '−'], label: 'Zoom out' },
            { keys: ['Ctrl', '0'], label: 'Reset zoom to 100 %' },
            { keys: ['Space', 'Drag'], label: 'Pan canvas' },
            { keys: ['Ctrl', 'Scroll'], label: 'Zoom canvas' },
        ]
    },
    {
        category: 'Blueprint Editor', items: [
            { keys: ['←→↑↓'], label: 'Nudge element 1 px' },
            { keys: ['Shift', '←→↑↓'], label: 'Nudge element 10 px' },
            { keys: ['Escape'], label: 'Deselect element' },
        ]
    },
];

function Key({ label }: { label: string }) {
    return (
        <kbd
            className={[
                'inline-flex items-center px-2 py-0.5 rounded',
                'bg-[#12151E] border border-[#252A3A] border-b-[#1A1F2E]',
                'text-[10px] font-mono font-bold text-slate-400',
                'shadow-[0_2px_0_rgba(0,0,0,0.4)]',
                'select-none leading-tight',
            ].join(' ')}
        >
            {label}
        </kbd>
    );
}

export function KeyboardShortcutsModal({ open, onClose }: ShortcutsModalProps) {
    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[8500] flex items-center justify-center p-4 bg-[#070A14]/75 backdrop-blur-md"
            onClick={onClose}
        >
            {/* Modal card */}
            <div
                className={[
                    'relative w-full max-w-md rounded-2xl overflow-hidden',
                    'bg-[#0D1117] border border-[#252A3A]',
                    'shadow-[0_32px_80px_rgba(0,0,0,0.80)]',
                ].join(' ')}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top accent */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A1F2E]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                            <Keyboard size={15} className="text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-slate-200 leading-none">Keyboard Shortcuts</h2>
                            <p className="text-[11px] text-slate-600 mt-0.5">Pro designer hotkeys</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] text-slate-500 hover:text-slate-300 flex items-center justify-center transition-colors"
                    >
                        <X size={13} />
                    </button>
                </div>

                {/* Shortcut list */}
                <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto">
                    {SHORTCUTS.map(({ category, items }) => (
                        <div key={category}>
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-2 px-1">
                                {category}
                            </div>
                            <div className="space-y-1">
                                {items.map(({ keys, label }) => (
                                    <div
                                        key={label}
                                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors"
                                    >
                                        <span className="text-xs text-slate-400">{label}</span>
                                        <div className="flex items-center gap-1">
                                            {keys.map((k, i) => (
                                                <span key={i} className="flex items-center gap-1">
                                                    <Key label={k} />
                                                    {i < keys.length - 1 && (
                                                        <span className="text-[10px] text-slate-700">+</span>
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-[#1A1F2E]">
                    <p className="text-[11px] text-slate-700 text-center">Press <Key label="Escape" /> to close</p>
                </div>
            </div>
        </div>
    );
}

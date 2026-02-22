import React, { memo } from 'react';
import type { CSSProperties } from 'react';
import { StarRating } from './StarRating';

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
export type Element = 'fire' | 'water' | 'nature' | 'dark' | 'light' | 'neutral';

export interface CardFrameData {
    title?: string;
    description?: string;
    element?: Element;
    rarity?: Rarity;
    attack?: number;
    defense?: number;
    hp?: number;
    imageUrl?: string;
    traits?: string[];
    cost?: number;
}

interface CardFrameProps {
    data?: CardFrameData;
    width?: number;
    height?: number;
    scale?: number;
    showStats?: boolean;
    showGlow?: boolean;
    onClick?: () => void;
    className?: string;
    style?: CSSProperties;
}

const ELEMENT_CONFIG: Record<Element, {
    emoji: string; bg: string; accent: string; text: string; border: string;
}> = {
    fire: { emoji: '🔥', bg: 'linear-gradient(145deg,#2d0a0a,#1a0505)', accent: '#ef4444', text: '#fca5a5', border: 'rgba(239,68,68,0.45)' },
    water: { emoji: '💧', bg: 'linear-gradient(145deg,#0a1a2d,#051020)', accent: '#38bdf8', text: '#7dd3fc', border: 'rgba(56,189,248,0.45)' },
    nature: { emoji: '🌿', bg: 'linear-gradient(145deg,#0a2d0a,#051505)', accent: '#4ade80', text: '#86efac', border: 'rgba(74,222,128,0.45)' },
    dark: { emoji: '🌑', bg: 'linear-gradient(145deg,#0f0a1a,#07060f)', accent: '#c084fc', text: '#d8b4fe', border: 'rgba(192,132,252,0.45)' },
    light: { emoji: '✨', bg: 'linear-gradient(145deg,#2d2a0a,#1a1705)', accent: '#fbbf24', text: '#fde68a', border: 'rgba(251,191,36,0.45)' },
    neutral: { emoji: '⚪', bg: 'linear-gradient(145deg,#1a1a2d,#0f0f1a)', accent: '#94a3b8', text: '#cbd5e1', border: 'rgba(148,163,184,0.45)' },
};

const RARITY_CONFIG: Record<Rarity, {
    glow: string; borderColor: string; label: string; textColor: string;
}> = {
    Common: { glow: 'none', borderColor: 'rgba(148,163,184,0.3)', label: 'عادي', textColor: '#94a3b8' },
    Uncommon: { glow: '0 0 18px rgba(74,222,128,0.4)', borderColor: 'rgba(74,222,128,0.5)', label: 'غير شائع', textColor: '#4ade80' },
    Rare: { glow: '0 0 28px rgba(56,189,248,0.5)', borderColor: 'rgba(56,189,248,0.6)', label: 'نادر', textColor: '#38bdf8' },
    Epic: { glow: '0 0 36px rgba(192,132,252,0.5)', borderColor: 'rgba(192,132,252,0.6)', label: 'ملحمي', textColor: '#c084fc' },
    Legendary: { glow: '0 0 50px rgba(251,191,36,0.6)', borderColor: 'rgba(251,191,36,0.75)', label: 'أسطوري', textColor: '#fbbf24' },
};

export const CardFrame = memo<CardFrameProps>(({
    data = {},
    width = 280,
    height = 380,
    scale = 1,
    showStats = true,
    showGlow = true,
    onClick,
    className = '',
    style,
}) => {
    const el = (data.element ?? 'neutral') as Element;
    const rarity = (data.rarity ?? 'Common') as Rarity;
    const elCfg = ELEMENT_CONFIG[el] ?? ELEMENT_CONFIG.neutral;
    const rCfg = RARITY_CONFIG[rarity] ?? RARITY_CONFIG.Common;

    const W = width * scale;
    const H = height * scale;
    const r = 16 * scale;
    const pad = 14 * scale;
    const artTop = 48 * scale;
    const artH = H * 0.42;
    const fs = scale;

    const frameStyle: CSSProperties = {
        width: W,
        height: H,
        borderRadius: r,
        background: elCfg.bg,
        border: `${2 * scale}px solid ${rCfg.borderColor}`,
        boxShadow: showGlow ? rCfg.glow : 'none',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        flexShrink: 0,
        ...style,
    };

    const isLegendary = rarity === 'Legendary';

    return (
        <div
            className={`transition-all duration-300 hover:scale-[1.02] hover:brightness-110 ${onClick ? 'cursor-pointer' : ''} ${className}`}
            style={frameStyle}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
        >
            {/* Legendary shimmer overlay */}
            {isLegendary && (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
                    background: 'linear-gradient(135deg, rgba(251,191,36,0.06) 0%, transparent 50%, rgba(251,191,36,0.06) 100%)',
                    animation: 'rarity-pulse 2.5s ease-in-out infinite',
                }} />
            )}

            {/* Noise texture layer */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
                backgroundSize: 'cover', opacity: 0.5,
            }} />

            {/* ── Top header ── */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: artTop,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: `0 ${pad}px`,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
                zIndex: 5,
            }}>
                {/* Element hex */}
                <div style={{
                    width: 32 * scale, height: 32 * scale, borderRadius: 10 * scale,
                    background: 'rgba(0,0,0,0.5)',
                    border: `1.5px solid ${elCfg.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16 * scale, backdropFilter: 'blur(4px)',
                    boxShadow: `0 0 12px ${elCfg.accent}40`,
                }}>
                    {elCfg.emoji}
                </div>

                {/* Rarity badge */}
                <div style={{
                    padding: `${3 * scale}px ${8 * scale}px`, borderRadius: 999,
                    background: 'rgba(0,0,0,0.5)',
                    border: `1px solid ${rCfg.borderColor}`,
                    fontSize: 9 * scale, fontWeight: 700, letterSpacing: 1,
                    color: rCfg.textColor, backdropFilter: 'blur(4px)',
                    textTransform: 'uppercase',
                }}>
                    {rCfg.label}
                </div>
            </div>

            {/* ── Art area ── */}
            <div style={{
                position: 'absolute', top: artTop, left: pad, right: pad,
                height: artH, borderRadius: 10 * scale, overflow: 'hidden',
                background: data.imageUrl ? undefined : `linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))`,
                border: `1px solid rgba(255,255,255,0.06)`,
                zIndex: 2,
            }}>
                {data.imageUrl ? (
                    <img src={data.imageUrl} alt={data.title} style={{
                        width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                    }} />
                ) : (
                    <div style={{
                        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 6 * scale,
                    }}>
                        <div style={{ fontSize: 36 * scale, opacity: 0.25 }}>{elCfg.emoji}</div>
                        <div style={{ fontSize: 9 * scale, opacity: 0.3, color: '#94a3b8', textAlign: 'center' }}>
                            اسحب صورة هنا
                        </div>
                    </div>
                )}
                {/* Art gradient overlay */}
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.7))',
                }} />
            </div>

            {/* ── Title only (no description here) ── */}
            <div style={{
                position: 'absolute', left: pad, right: pad,
                top: artTop + artH + 10 * scale, zIndex: 5,
            }}>
                {/* Title */}
                <div style={{
                    fontFamily: 'Cairo, sans-serif', fontWeight: 800,
                    fontSize: 14 * scale * fs, color: '#ffffff',
                    textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                    letterSpacing: 0.3, lineHeight: 1.2,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    direction: 'rtl', textAlign: 'center',
                }}>
                    {data.title || 'اسم البطاقة'}
                </div>

                {/* Divider */}
                <div style={{
                    height: 1, margin: `${5 * scale}px 0`,
                    background: `linear-gradient(to right, transparent, ${elCfg.accent}60, transparent)`,
                }} />
            </div>

            {/* ── Description & Stars Container ── */}
            <div style={{
                position: 'absolute',
                left: pad,
                right: pad,
                bottom: showStats ? (58 + (data.traits?.length ? 28 : 8)) * scale : (data.traits?.length ? 32 : 12) * scale,
                zIndex: 5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: `0 ${4 * scale}px`,
            }}>
                {/* Description Text */}
                <div
                    className="whitespace-normal break-words leading-relaxed"
                    style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.45)',
                        backdropFilter: 'blur(6px)',
                        borderRadius: 8 * scale,
                        border: `1px solid rgba(255,255,255,0.07)`,
                        padding: `${6 * scale}px ${8 * scale}px`,
                        fontFamily: 'Cairo, sans-serif',
                        fontWeight: 500,
                        fontSize: Math.max(11, 12 * scale) * fs,
                        color: 'rgba(255,255,255,0.90)',
                        direction: 'rtl',
                        textAlign: 'center',
                        textShadow: '0 1px 6px rgba(0,0,0,0.9)',
                    }}>
                    {data.description || 'نص وصف البطاقة يظهر هنا'}
                </div>
            </div>

            {/* ── Traits row ── */}
            {data.traits && data.traits.length > 0 && (
                <div style={{
                    position: 'absolute', bottom: showStats ? 58 * scale : 10 * scale,
                    left: pad, right: pad, zIndex: 5,
                    display: 'flex', gap: 4 * scale, flexWrap: 'wrap', justifyContent: 'center',
                }}>
                    {data.traits.slice(0, 3).map((t) => (
                        <div key={t} style={{
                            padding: `${2 * scale}px ${6 * scale}px`, borderRadius: 999,
                            background: 'rgba(0,0,0,0.4)',
                            border: `1px solid ${elCfg.border}`,
                            fontSize: 7.5 * scale, color: elCfg.text,
                            fontFamily: 'Cairo, sans-serif', fontWeight: 500,
                        }}>
                            {t}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Stats row ── */}
            {showStats && (
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 52 * scale,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-around',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                    zIndex: 5, padding: `0 ${pad}px`,
                }}>
                    {/* ATK */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 * scale }}>
                        <div style={{
                            width: 36 * scale, height: 36 * scale, borderRadius: 999,
                            background: 'radial-gradient(circle, rgba(239,68,68,0.2), rgba(0,0,0,0.5))',
                            border: '1.5px solid rgba(239,68,68,0.5)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 10px rgba(239,68,68,0.3)',
                        }}>
                            <span style={{ fontSize: 7 * scale, color: '#fca5a5', fontWeight: 600 }}>⚔️</span>
                            <span style={{ fontSize: 11 * scale, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                                {data.attack ?? 0}
                            </span>
                        </div>
                    </div>

                    {/* Cost Placeholder - Stars perfectly centered */}
                    {data.cost !== undefined && data.cost > 0 && (
                        <div className="flex justify-center items-center flex-wrap gap-1 bg-transparent border-none outline-none shadow-none">
                            <StarRating stars={data.cost} scale={scale * 0.9} />
                        </div>
                    )}

                    {/* HP */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 * scale }}>
                        <div style={{
                            width: 36 * scale, height: 36 * scale, borderRadius: 999,
                            background: 'radial-gradient(circle, rgba(74,222,128,0.2), rgba(0,0,0,0.5))',
                            border: '1.5px solid rgba(74,222,128,0.5)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 10px rgba(74,222,128,0.3)',
                        }}>
                            <span style={{ fontSize: 7 * scale, color: '#86efac', fontWeight: 600 }}>❤️</span>
                            <span style={{ fontSize: 11 * scale, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                                {data.hp ?? 0}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Legendary gold inner border */}
            {isLegendary && (
                <div style={{
                    position: 'absolute', inset: 3 * scale,
                    borderRadius: r - 2,
                    border: '1px solid rgba(251,191,36,0.35)',
                    pointerEvents: 'none', zIndex: 10,
                }} />
            )}
        </div>
    );
});

CardFrame.displayName = 'CardFrame';

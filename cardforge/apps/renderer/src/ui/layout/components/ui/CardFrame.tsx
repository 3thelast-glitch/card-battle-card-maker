import React, { memo, useRef, useCallback } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { Heart, Sword } from 'lucide-react';
import { StarRating } from './StarRating';
import type { BadgeKey, BadgePos } from '../../../../store/cardEditorStore';

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
export type Element =
    | 'fire'
    | 'water'
    | 'nature'
    | 'dark'
    | 'light'
    | 'neutral';

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
    name?: string; // Used in some layouts as fallback for title
    icon?: string; // Potentially used for element icon override
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
    // Transform mode props (all optional so the component works standalone too)
    isTransformMode?: boolean;
    badgePositions?: Record<BadgeKey, BadgePos>;
    activeBadgeId?: string | null;
    onBadgeSelect?: (badge: BadgeKey) => void;
    onBadgeMove?: (badge: BadgeKey, pos: BadgePos) => void;
    // Layout props
    showDescription?: boolean;
    artZoneHeight?: number;
    layout?:
    | 'standard'
    | 'full-bleed'
    | 'steampunk'
    | 'blood-ritual'
    | 'eldritch-eye'
    | 'cyber-neon'
    | 'glitch-artifact'
    | 'swamp';
}

const ELEMENT_CONFIG: Record<
    Element,
    {
        emoji: string;
        bg: string;
        accent: string;
        text: string;
        border: string;
        icon?: string;
    }
> = {
    fire: {
        emoji: '🔥',
        bg: 'linear-gradient(145deg,#2d0a0a,#1a0505)',
        accent: '#ef4444',
        text: '#fca5a5',
        border: 'rgba(239,68,68,0.45)',
        icon: '🔥',
    },
    water: {
        emoji: '💧',
        bg: 'linear-gradient(145deg,#0a1a2d,#051020)',
        accent: '#38bdf8',
        text: '#7dd3fc',
        border: 'rgba(56,189,248,0.45)',
        icon: '💧',
    },
    nature: {
        emoji: '🌿',
        bg: 'linear-gradient(145deg,#0a2d0a,#051505)',
        accent: '#4ade80',
        text: '#86efac',
        border: 'rgba(74,222,128,0.45)',
        icon: '🌿',
    },
    dark: {
        emoji: '🌑',
        bg: 'linear-gradient(145deg,#0f0a1a,#07060f)',
        accent: '#c084fc',
        text: '#d8b4fe',
        border: 'rgba(192,132,252,0.45)',
        icon: '🌑',
    },
    light: {
        emoji: '✨',
        bg: 'linear-gradient(145deg,#2d2a0a,#1a1705)',
        accent: '#fbbf24',
        text: '#fde68a',
        border: 'rgba(251,191,36,0.45)',
        icon: '✨',
    },
    neutral: {
        emoji: '⚪',
        bg: 'linear-gradient(145deg,#1a1a2d,#0f0f1a)',
        accent: '#94a3b8',
        text: '#cbd5e1',
        border: 'rgba(148,163,184,0.45)',
        icon: '⚪',
    },
};

const RARITY_CONFIG: Record<
    Rarity,
    {
        glow: string;
        borderColor: string;
        label: string;
        textColor: string;
    }
> = {
    Common: {
        glow: 'none',
        borderColor: 'rgba(148,163,184,0.3)',
        label: 'عادي',
        textColor: '#94a3b8',
    },
    Uncommon: {
        glow: '0 0 18px rgba(74,222,128,0.4)',
        borderColor: 'rgba(74,222,128,0.5)',
        label: 'غير شائع',
        textColor: '#4ade80',
    },
    Rare: {
        glow: '0 0 28px rgba(56,189,248,0.5)',
        borderColor: 'rgba(56,189,248,0.6)',
        label: 'نادر',
        textColor: '#38bdf8',
    },
    Epic: {
        glow: '0 0 36px rgba(192,132,252,0.5)',
        borderColor: 'rgba(192,132,252,0.6)',
        label: 'ملحمي',
        textColor: '#c084fc',
    },
    Legendary: {
        glow: '0 0 50px rgba(251,191,36,0.6)',
        borderColor: 'rgba(251,191,36,0.75)',
        label: 'أسطوري',
        textColor: '#fbbf24',
    },
};

// ── Draggable Badge Wrapper ──────────────────────────────────
interface DraggableBadgeProps {
    badgeKey: BadgeKey;
    pos: BadgePos;
    isTransformMode: boolean;
    isActive: boolean;
    onSelect: (k: BadgeKey) => void;
    onMove: (k: BadgeKey, pos: BadgePos) => void;
    children: React.ReactNode;
    style?: CSSProperties;
}

const DraggableBadge = memo(
    ({
        badgeKey,
        pos,
        isTransformMode,
        isActive,
        onSelect,
        onMove,
        children,
        style = {},
    }: DraggableBadgeProps) => {
        const dragState = useRef<{
            startX: number;
            startY: number;
            origX: number;
            origY: number;
            axis: 'none' | 'x' | 'y';
        } | null>(null);

        const onPointerDown = useCallback(
            (e: ReactPointerEvent<HTMLDivElement>) => {
                if (!isTransformMode) return;
                e.stopPropagation();
                e.currentTarget.setPointerCapture(e.pointerId);
                onSelect(badgeKey);
                dragState.current = {
                    startX: e.clientX,
                    startY: e.clientY,
                    origX: pos.x,
                    origY: pos.y,
                    axis: 'none',
                };
            },
            [isTransformMode, badgeKey, pos, onSelect],
        );

        const onPointerMove = useCallback(
            (e: ReactPointerEvent<HTMLDivElement>) => {
                if (!dragState.current) return;
                const dx = e.clientX - dragState.current.startX;
                const dy = e.clientY - dragState.current.startY;

                // Determine axis lock on first meaningful movement
                if (e.shiftKey && dragState.current.axis === 'none') {
                    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                        dragState.current.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
                    }
                } else if (!e.shiftKey) {
                    dragState.current.axis = 'none';
                }

                let newX = dragState.current.origX + dx;
                let newY = dragState.current.origY + dy;

                if (dragState.current.axis === 'x') newY = dragState.current.origY;
                if (dragState.current.axis === 'y') newX = dragState.current.origX;

                onMove(badgeKey, { x: newX, y: newY });
            },
            [badgeKey, onMove],
        );

        const onPointerUp = useCallback(() => {
            dragState.current = null;
        }, []);

        const baseStyle: CSSProperties = {
            transform: `translate(${pos.x}px, ${pos.y}px)`,
            transition: dragState.current ? 'none' : 'transform 0.05s ease',
            cursor: isTransformMode ? 'grab' : 'default',
            outline: isActive ? '1.5px dashed rgba(168,85,247,0.85)' : 'none',
            outlineOffset: '3px',
            borderRadius: 999,
            userSelect: 'none',
            touchAction: 'none',
            ...style,
        };

        return (
            <div
                style={baseStyle}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
            >
                {children}
            </div>
        );
    },
);
DraggableBadge.displayName = 'DraggableBadge';

// ── CardFrame ────────────────────────────────────────────────
export const CardFrame = memo<CardFrameProps>(
    ({
        data = {},
        scale = 1,
        showStats = true,
        showGlow = true,
        onClick,
        className = '',
        style,
        isTransformMode = false,
        badgePositions,
        activeBadgeId,
        onBadgeSelect,
        onBadgeMove,
        showDescription = true,
        artZoneHeight,
        layout = 'standard',
    }) => {
        const el = (data.element ?? 'neutral') as Element;
        const rarity = (data.rarity ?? 'Common') as Rarity;
        const elCfg = ELEMENT_CONFIG[el] ?? ELEMENT_CONFIG.neutral;
        const rCfg = RARITY_CONFIG[rarity] ?? RARITY_CONFIG.Common;

        const W = 350 * scale;
        const H = 480 * scale;
        const artTop = 48 * scale;
        // artH: use artZoneHeight prop if provided, otherwise default to proportional height
        const artH = artZoneHeight != null ? artZoneHeight * scale : H * 0.42;
        const fs = scale;
        const scaleDown = 1;
        const r = (layout === 'steampunk' ? 8 : layout === 'blood-ritual' ? 0 : 16) * scale;
        const pad = `${12 * scale}px`;

        const bPos = badgePositions || {
            element: { x: 0, y: 0 },
            rarity: { x: 0, y: 0 },
            attack: { x: 0, y: 0 },
            hp: { x: 0, y: 0 },
            title: { x: 0, y: 0 },
            desc: { x: 0, y: 0 },
        };

        const handleSelect = onBadgeSelect ?? (() => { });
        const handleMove = useCallback(
            (badgeKey: BadgeKey, pos: BadgePos) => {
                onBadgeMove?.(badgeKey, pos);
            },
            [onBadgeMove],
        );

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

        if (layout === 'blood-ritual') {
            return (
                <div
                    className={`transition-all duration-300 hover:scale-[1.02] hover:brightness-110 ${onClick ? 'cursor-pointer' : ''} ${className}`}
                    style={{
                        width: W,
                        height: H,
                        borderRadius: 24 * scale,
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: onClick ? 'pointer' : 'default',
                        userSelect: 'none',
                        flexShrink: 0,
                        background: '#100000',
                        border: `${10 * scale}px solid rgba(127,29,29,0.98)`,
                        boxShadow: showGlow ? '0 40px 120px rgba(139,0,0,0.95)' : 'none',
                        ...style,
                    }}
                    onClick={onClick}
                    role={onClick ? 'button' : undefined}
                >
                    {/* Full Bleed Image Background */}
                    {data.imageUrl ? (
                        <div
                            className="absolute inset-0 z-0 bg-cover bg-center mix-blend-luminosity opacity-80"
                            style={{ backgroundImage: `url(${data.imageUrl})` }}
                        />
                    ) : (
                        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#2a0808] to-[#0a0000] flex items-center justify-center">
                            <span style={{ fontSize: 80 * scale, opacity: 0.1 }}>🩸</span>
                        </div>
                    )}

                    {/* Crimson Gradient Overlay */}
                    <div
                        className="absolute inset-0 z-10"
                        style={{
                            background:
                                'linear-gradient(to bottom, rgba(60,0,0,0.6) 0%, transparent 40%, rgba(30,0,0,0.95) 100%)',
                        }}
                    />

                    {/* Animated Drips */}
                    <div
                        className="absolute top-0 right-[20%] w-1 bg-red-700 blur-[1px] z-15 animate-blood-drip-main pointer-events-none"
                        style={{ height: 120 * scale }}
                    />
                    <div
                        className="absolute top-0 left-[15%] w-[2px] bg-red-800 blur-[1px] z-15 animate-blood-drip-side pointer-events-none"
                        style={{ height: 80 * scale }}
                    />

                    {/* Top Corner Elements */}
                    <div
                        className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start pointer-events-none"
                        style={{ padding: `${16 * scale}px` }}
                    >
                        {/* Rarity (Top-Left) */}
                        <DraggableBadge
                            badgeKey="rarity"
                            pos={bPos.rarity}
                            isTransformMode={isTransformMode}
                            isActive={activeBadgeId === 'badge-rarity'}
                            onSelect={() => handleSelect('rarity')}
                            onMove={handleMove}
                        >
                            <div
                                className="pointer-events-auto"
                                style={{
                                    padding: `${4 * scale}px ${10 * scale}px`,
                                    background: 'rgba(20,0,0,0.9)',
                                    border: `${1 * scale}px solid #991b1b`,
                                    color: '#ef4444',
                                    fontSize: 10 * scale,
                                    fontWeight: '900',
                                    textTransform: 'uppercase',
                                    letterSpacing: 1 * scale,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
                                }}
                            >
                                {rCfg.label}
                            </div>
                        </DraggableBadge>

                        {/* Element (Top-Right) */}
                        <DraggableBadge
                            badgeKey="element"
                            pos={bPos.element}
                            isTransformMode={isTransformMode}
                            isActive={activeBadgeId === 'badge-element'}
                            onSelect={() => handleSelect('element')}
                            onMove={handleMove}
                        >
                            <div
                                className="pointer-events-auto"
                                style={{
                                    width: 32 * scale,
                                    height: 32 * scale,
                                    borderRadius: '50%',
                                    background: 'rgba(20,0,0,0.9)',
                                    border: `${2 * scale}px solid #dc2626`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 16 * scale,
                                    boxShadow: '0 0 15px rgba(220,38,38,0.5)',
                                }}
                            >
                                {elCfg.emoji}
                            </div>
                        </DraggableBadge>
                    </div>

                    {/* Bottom Section (Overlaid on Background) */}
                    <div
                        className="absolute bottom-0 w-full flex flex-col items-center z-20 pointer-events-none"
                        style={{
                            paddingBottom: 24 * scale,
                            paddingLeft: 16 * scale,
                            paddingRight: 16 * scale,
                        }}
                    >
                        {/* Title */}
                        <h2
                            className="pointer-events-auto uppercase"
                            style={{
                                color: '#ef4444',
                                fontSize: 26 * scale,
                                fontWeight: 900,
                                textAlign: 'center',
                                textShadow:
                                    '0 4px 16px rgba(0,0,0,0.9), 0 0 10px rgba(220,38,38,0.5)',
                                fontFamily: 'Inter, sans-serif',
                                letterSpacing: 2 * scale,
                                marginBottom: 4 * scale,
                            }}
                        >
                            {data.title || 'بدون اسم'}
                        </h2>

                        {/* Description Panel */}
                        {showDescription && (
                            <div
                                className="pointer-events-auto"
                                style={{
                                    width: '100%',
                                    padding: `${10 * scale}px`,
                                    background: 'rgba(10,0,0,0.85)',
                                    backdropFilter: 'blur(4px)',
                                    borderTop: `1px solid rgba(220,38,38,0.4)`,
                                    borderBottom: `1px solid rgba(220,38,38,0.4)`,
                                    color: '#f87171',
                                    fontSize: 11 * scale,
                                    fontFamily: 'Inter, sans-serif',
                                    textAlign: 'center',
                                    fontWeight: 500,
                                    marginBottom: 8 * scale,
                                    minHeight: 65 * scale,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
                                }}
                            >
                                {data.description || 'وصف طقوس الدم...'}
                            </div>
                        )}

                        {/* Stats (Vials) */}
                        {showStats && (
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    padding: `0 ${10 * scale}px`,
                                    marginTop: 4 * scale,
                                }}
                            >
                                {/* ATK Vial */}
                                <DraggableBadge
                                    badgeKey="attack"
                                    pos={bPos.attack}
                                    isTransformMode={isTransformMode}
                                    isActive={activeBadgeId === 'badge-attack'}
                                    onSelect={() => handleSelect('attack')}
                                    onMove={handleMove}
                                >
                                    <div
                                        className="pointer-events-auto flex flex-col items-center justify-end overflow-hidden relative"
                                        style={{
                                            width: 60 * scale,
                                            height: 60 * scale,
                                            borderRadius: '50%',
                                            background: 'rgba(20,0,0,0.8)',
                                            border: `${2 * scale}px solid #7f1d1d`,
                                            boxShadow: `inset 0 -10px 20px rgba(220,38,38,0.3), 0 0 ${15 * scale}px rgba(220,38,38,0.4)`,
                                        }}
                                    >
                                        <div
                                            className="absolute bottom-0 w-full bg-red-600 blur-[1px] animate-vial-drip pointer-events-none"
                                            style={{ borderTop: '2px solid #fca5a5' }}
                                        />
                                        <div className="flex flex-col items-center justify-center z-10 w-full h-full pb-[2px] pointer-events-none">
                                            <span
                                                style={{
                                                    fontSize: 16 * scale,
                                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                                                    lineHeight: 1,
                                                }}
                                            >
                                                🩸
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 18 * scale,
                                                    fontWeight: 900,
                                                    color: '#f87171',
                                                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                                    lineHeight: 1.1,
                                                }}
                                            >
                                                {data.attack ?? 0}
                                            </span>
                                        </div>
                                    </div>
                                </DraggableBadge>

                                {/* HP Vial */}
                                <DraggableBadge
                                    badgeKey="hp"
                                    pos={bPos.hp}
                                    isTransformMode={isTransformMode}
                                    isActive={activeBadgeId === 'badge-hp'}
                                    onSelect={() => handleSelect('hp')}
                                    onMove={handleMove}
                                >
                                    <div
                                        className="pointer-events-auto flex flex-col items-center justify-end overflow-hidden relative"
                                        style={{
                                            width: 60 * scale,
                                            height: 60 * scale,
                                            borderRadius: '50%',
                                            background: 'rgba(10,10,10,0.8)',
                                            border: `${2 * scale}px solid #3f3f46`,
                                            boxShadow: `inset 0 -10px 20px rgba(0,0,0,0.8), 0 0 ${15 * scale}px rgba(0,0,0,0.8)`,
                                        }}
                                    >
                                        <div
                                            className="absolute bottom-0 w-full bg-zinc-800 blur-[1px] animate-vial-drip pointer-events-none"
                                            style={{ borderTop: '2px solid #a1a1aa' }}
                                        />
                                        <div className="flex flex-col items-center justify-center z-10 w-full h-full pb-[2px] pointer-events-none">
                                            <span
                                                style={{
                                                    fontSize: 16 * scale,
                                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                                                    lineHeight: 1,
                                                }}
                                            >
                                                ☠️
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 18 * scale,
                                                    fontWeight: 900,
                                                    color: '#d4d4d8',
                                                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                                    lineHeight: 1.1,
                                                }}
                                            >
                                                {data.hp ?? 0}
                                            </span>
                                        </div>
                                    </div>
                                </DraggableBadge>
                            </div>
                        )}
                    </div>

                    {/* Cost / Stars (Absolute Bottom Center) */}
                    {data.cost !== undefined && data.cost > 0 && (
                        <div
                            className="absolute left-0 right-0 flex justify-center z-30 pointer-events-none"
                            style={{ bottom: 38 * scale }}
                        >
                            <div
                                className="pointer-events-auto flex justify-center flex-wrap gap-1"
                                style={{
                                    filter:
                                        'drop-shadow(0 0 8px rgba(220,38,38,0.6)) drop-shadow(0 4px 4px rgba(0,0,0,0.8))',
                                }}
                            >
                                <StarRating stars={data.cost} scale={scale * 0.9} />
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        if (layout === 'eldritch-eye') {
            // ── Sub-components (defined inline to keep them co-located) ────────

            // Petal/string SVG background lines
            const StringLines = () => (
                <svg
                    viewBox="0 0 350 480"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0.18,
                        zIndex: 1,
                        pointerEvents: 'none',
                    }}
                >
                    {/* Radiating lines from center */}
                    {Array.from({ length: 24 }).map((_, i) => {
                        const angle = (i / 24) * Math.PI * 2;
                        const cx = 175,
                            cy = 200;
                        const r = 220;
                        return (
                            <line
                                key={i}
                                x1={cx}
                                y1={cy}
                                x2={cx + Math.cos(angle) * r}
                                y2={cy + Math.sin(angle) * r}
                                stroke="rgba(160,0,0,0.8)"
                                strokeWidth="0.5"
                            />
                        );
                    })}
                    {/* Concentric circles */}
                    {[40, 80, 130, 190].map((r, i) => (
                        <circle
                            key={i}
                            cx={175}
                            cy={200}
                            r={r * scale}
                            fill="none"
                            stroke="rgba(120,0,0,0.6)"
                            strokeWidth="0.8"
                            strokeDasharray="4,6"
                        />
                    ))}
                </svg>
            );

            // Rotating occult mandala layer
            const OccultMandala = ({
                size,
                animClass,
                opacity = 0.35,
                isReverse = false,
            }: {
                size: number;
                animClass: string;
                opacity?: number;
                isReverse?: boolean;
            }) => (
                <svg
                    className={animClass}
                    viewBox="0 0 200 200"
                    style={{
                        width: size * scale,
                        height: size * scale,
                        opacity,
                        pointerEvents: 'none',
                        flexShrink: 0,
                    }}
                >
                    {/* Outer decorative ring */}
                    <circle
                        cx="100"
                        cy="100"
                        r="95"
                        fill="none"
                        stroke="rgba(139,0,0,0.9)"
                        strokeWidth="1.5"
                        strokeDasharray="8,5"
                    />
                    {/* Inner ring */}
                    <circle
                        cx="100"
                        cy="100"
                        r="75"
                        fill="none"
                        stroke="rgba(180,50,50,0.7)"
                        strokeWidth="1"
                        strokeDasharray="3,8"
                    />
                    {/* 8-pointed star paths */}
                    {Array.from({ length: 8 }).map((_, i) => {
                        const a1 = (i / 8) * Math.PI * 2;
                        const a2 = ((i + 0.5) / 8) * Math.PI * 2;
                        return (
                            <g key={i}>
                                <line
                                    x1={100 + Math.cos(a1) * 95}
                                    y1={100 + Math.sin(a1) * 95}
                                    x2={100 + Math.cos(a2) * 40}
                                    y2={100 + Math.sin(a2) * 40}
                                    stroke="rgba(160,0,0,0.8)"
                                    strokeWidth="1"
                                />
                                <line
                                    x1={100 + Math.cos(a2) * 40}
                                    y1={100 + Math.sin(a2) * 40}
                                    x2={100 + Math.cos(a1 + Math.PI / 4) * 95}
                                    y2={100 + Math.sin(a1 + Math.PI / 4) * 95}
                                    stroke="rgba(160,0,0,0.8)"
                                    strokeWidth="1"
                                />
                            </g>
                        );
                    })}
                    {/* Rune marks at points */}
                    {Array.from({ length: 8 }).map((_, i) => {
                        const a = (i / 8) * Math.PI * 2 - Math.PI / 8;
                        return (
                            <circle
                                key={i}
                                cx={100 + Math.cos(a) * 85}
                                cy={100 + Math.sin(a) * 85}
                                r="4"
                                fill="rgba(180,0,0,0.7)"
                            />
                        );
                    })}
                </svg>
            );

            // Cosmic eye fallback (shown when no image uploaded)
            const CosmicEye = () => (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2,
                        pointerEvents: 'none',
                    }}
                >
                    {/* Outer slow mandala */}
                    <div
                        style={{
                            position: 'absolute',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <OccultMandala
                            size={280}
                            animClass="animate-spin-reverse-slow"
                            opacity={0.3}
                        />
                    </div>
                    {/* Middle mandala */}
                    <div
                        style={{
                            position: 'absolute',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <OccultMandala
                            size={190}
                            animClass="animate-spin-slow"
                            opacity={0.45}
                        />
                    </div>
                    {/* Inner fast mandala */}
                    <div
                        style={{
                            position: 'absolute',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <OccultMandala
                            size={110}
                            animClass="animate-spin-medium"
                            opacity={0.55}
                        />
                    </div>
                    {/* Eye body */}
                    <div
                        className="animate-eye-iris"
                        style={{
                            position: 'absolute',
                            width: 70 * scale,
                            height: 45 * scale,
                            borderRadius: '50%',
                            background:
                                'radial-gradient(ellipse, #8b0000 0%, #3d0000 40%, #1a0000 70%, #000 100%)',
                            boxShadow:
                                '0 0 30px rgba(139,0,0,0.9), 0 0 60px rgba(100,0,0,0.6), inset 0 0 15px rgba(200,0,0,0.4)',
                            border: '1.5px solid rgba(200,50,50,0.6)',
                        }}
                    >
                        {/* Pupil */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%,-50%)',
                                width: 20 * scale,
                                height: 30 * scale,
                                borderRadius: '50%',
                                background: 'radial-gradient(ellipse, #300 0%, #000 100%)',
                            }}
                        />
                        {/* Highlight */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '25%',
                                left: '35%',
                                width: 8 * scale,
                                height: 6 * scale,
                                borderRadius: '50%',
                                background: 'rgba(255,100,100,0.6)',
                                filter: 'blur(2px)',
                            }}
                        />
                    </div>
                </div>
            );

            // Ornate corner SVGs
            const OrnateCorner = ({ flip }: { flip?: boolean }) => (
                <svg
                    viewBox="0 0 60 60"
                    style={{
                        width: 48 * scale,
                        height: 48 * scale,
                        opacity: 0.65,
                        transform: flip ? 'scaleX(-1)' : undefined,
                        pointerEvents: 'none',
                        flexShrink: 0,
                    }}
                >
                    <path
                        d="M2,2 L20,2 L20,6 L6,6 L6,20 L2,20 Z"
                        fill="rgba(139,0,0,0.8)"
                    />
                    <path
                        d="M2,2 L2,20"
                        stroke="rgba(200,50,50,0.9)"
                        strokeWidth="1.5"
                        fill="none"
                    />
                    <path
                        d="M2,2 L20,2"
                        stroke="rgba(200,50,50,0.9)"
                        strokeWidth="1.5"
                        fill="none"
                    />
                    <circle cx="10" cy="10" r="3" fill="rgba(180,0,0,0.9)" />
                    <path
                        d="M14,2 L14,14 L2,14"
                        stroke="rgba(160,0,0,0.5)"
                        strokeWidth="0.7"
                        fill="none"
                        strokeDasharray="2,3"
                    />
                </svg>
            );

            // Blood drip data
            const drips = [
                { left: '18%', delay: '0s', height: 18 },
                { left: '42%', delay: '1.3s', height: 22 },
                { left: '67%', delay: '2.7s', height: 15 },
                { left: '80%', delay: '0.6s', height: 20 },
            ];

            return (
                <div
                    className={`transition-all duration-300 hover:scale-[1.02] hover:brightness-110 ${onClick ? 'cursor-pointer' : ''} ${className}`}
                    style={{
                        width: 350 * scale,
                        height: 480 * scale,
                        borderRadius: 18 * scale,
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: onClick ? 'pointer' : 'default',
                        userSelect: 'none',
                        flexShrink: 0,
                        background: '#000000',
                        border: `${3 * scale}px solid rgba(80,0,0,0.9)`,
                        boxShadow: showGlow
                            ? '0 50px 120px rgba(80,0,0,0.95), inset 0 0 60px rgba(50,0,0,0.5)'
                            : 'none',
                        ...style,
                    }}
                    onClick={onClick}
                    role={onClick ? 'button' : undefined}
                >
                    {/* ── Layer 0: Void background ─────────────────────────── */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background:
                                'radial-gradient(ellipse at 50% 42%, #1a0000 0%, #0a0000 40%, #000 100%)',
                            zIndex: 0,
                        }}
                    />

                    {/* ── Layer 1: String Lines SVG ───────────────────────── */}
                    <StringLines />

                    {/* ── Layer 2: Full-art image OR Cosmic Eye fallback ──── */}
                    {data.imageUrl ? (
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                zIndex: 2,
                                backgroundImage: `url(${data.imageUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                opacity: 0.6,
                                mixBlendMode: 'luminosity',
                            }}
                        />
                    ) : (
                        <CosmicEye />
                    )}

                    {/* ── Layer 3: Top-to-bottom vignette overlay ──────────── */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: 10,
                            background:
                                'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 30%, transparent 55%, rgba(0,0,0,0.92) 100%)',
                            pointerEvents: 'none',
                        }}
                    />

                    {/* ── Layer 4: Blood Drips ────────────────────────────── */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            zIndex: 12,
                            pointerEvents: 'none',
                        }}
                    >
                        {drips.map((d, i) => (
                            <div
                                key={i}
                                className={
                                    i === 0
                                        ? 'animate-drip'
                                        : i === 1
                                            ? 'animate-drip-delay'
                                            : 'animate-drip-delay-2'
                                }
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: d.left,
                                    width: 3 * scale,
                                    height: d.height * scale,
                                    background:
                                        'linear-gradient(to bottom, #8b0000, #dc2626, rgba(180,0,0,0))',
                                    borderRadius: '0 0 50% 50%',
                                    animationDelay: d.delay,
                                }}
                            />
                        ))}
                    </div>

                    {/* ── Layer 5: Header Zone ─────────────────────────────── */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            zIndex: 20,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            padding: `${14 * scale}px ${14 * scale}px 0`,
                        }}
                    >
                        {/* Ornate Corner Top-Left */}
                        <OrnateCorner />

                        {/* Rarity Badge (top-center) */}
                        <DraggableBadge
                            badgeKey="rarity"
                            pos={bPos.rarity}
                            isTransformMode={isTransformMode}
                            isActive={activeBadgeId === 'badge-rarity'}
                            onSelect={() => handleSelect('rarity')}
                            onMove={handleMove}
                        >
                            <div
                                style={{
                                    padding: `${3 * scale}px ${10 * scale}px`,
                                    background: 'rgba(0,0,0,0.85)',
                                    border: `${1 * scale}px solid rgba(120,0,0,0.9)`,
                                    color: '#c0392b',
                                    fontSize: 9 * scale,
                                    fontWeight: 900,
                                    textTransform: 'uppercase',
                                    letterSpacing: 1.5 * scale,
                                    fontFamily: "'Noto Kufi Arabic', Cairo, sans-serif",
                                    backdropFilter: 'blur(4px)',
                                    boxShadow: '0 2px 12px rgba(80,0,0,0.6)',
                                    clipPath:
                                        'polygon(8px 0%, calc(100% - 8px) 0%, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0% 50%)',
                                    paddingLeft: 16 * scale,
                                    paddingRight: 16 * scale,
                                }}
                            >
                                {rCfg.label}
                            </div>
                        </DraggableBadge>

                        {/* Ornate Corner Top-Right (flipped) */}
                        <OrnateCorner flip />
                    </div>

                    {/* ── Layer 6: Element Badge (top-right corner area) ───── */}
                    <DraggableBadge
                        badgeKey="element"
                        pos={bPos.element}
                        isTransformMode={isTransformMode}
                        isActive={activeBadgeId === 'badge-element'}
                        onSelect={() => handleSelect('element')}
                        onMove={handleMove}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                top: 14 * scale,
                                right: 54 * scale,
                                zIndex: 21,
                                width: 28 * scale,
                                height: 28 * scale,
                                borderRadius: '50%',
                                background: 'rgba(0,0,0,0.9)',
                                border: `${1.5 * scale}px solid rgba(120,0,0,0.8)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 13 * scale,
                                boxShadow: '0 0 12px rgba(80,0,0,0.6)',
                            }}
                        >
                            {elCfg.emoji}
                        </div>
                    </DraggableBadge>

                    {/* ── Layer 7: Bottom Content Zone ─────────────────────── */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            zIndex: 20,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 0,
                            paddingBottom: 12 * scale,
                            paddingLeft: 14 * scale,
                            paddingRight: 14 * scale,
                        }}
                    >
                        {/* Card Name */}
                        <h1
                            style={{
                                color: 'transparent',
                                backgroundImage:
                                    'linear-gradient(90deg, #9b9b9b 0%, #fff 40%, #cc0000 80%, #8b0000 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                fontSize: 22 * scale,
                                fontWeight: 900,
                                textAlign: 'center',
                                fontFamily: "'Noto Kufi Arabic', Cairo, sans-serif",
                                textShadow: 'none',
                                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.9))',
                                marginBottom: 4 * scale,
                                letterSpacing: 1 * scale,
                                lineHeight: 1.15,
                            }}
                        >
                            {data.title || 'عين الهاوية'}
                        </h1>

                        {/* Description Box */}
                        {showDescription && (
                            <div
                                style={{
                                    width: '100%',
                                    padding: `${8 * scale}px ${10 * scale}px`,
                                    background: 'rgba(0,0,0,0.88)',
                                    backdropFilter: 'blur(6px)',
                                    borderTop: `1px solid rgba(120,0,0,0.5)`,
                                    borderBottom: `1px solid rgba(120,0,0,0.5)`,
                                    color: '#c9a0a0',
                                    fontSize: 10.5 * scale,
                                    fontFamily: "'Noto Kufi Arabic', Cairo, sans-serif",
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    minHeight: 56 * scale,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 8 * scale,
                                    lineHeight: 1.5,
                                    boxShadow: 'inset 0 0 18px rgba(0,0,0,0.8)',
                                }}
                            >
                                {data.description ||
                                    'تحدق العين في الهاوية فترى ما وراء الواقع...'}
                            </div>
                        )}

                        {/* Stats + Stars Bar */}
                        {showStats && (
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    width: '100%',
                                    padding: 0,
                                    marginBottom: 4 * scale,
                                }}
                            >
                                {/* ATK Badge (Eye) - LEFT */}
                                <DraggableBadge
                                    badgeKey="attack"
                                    pos={bPos.attack}
                                    isTransformMode={isTransformMode}
                                    isActive={activeBadgeId === 'badge-attack'}
                                    onSelect={() => handleSelect('attack')}
                                    onMove={handleMove}
                                >
                                    <div
                                        style={{
                                            position: 'relative',
                                            width: 88 * scale,
                                            height: 88 * scale,
                                            borderRadius: '50%',
                                            background: 'radial-gradient(circle at 40% 40%, #0A0015, #000000)',
                                            border: `${2 * scale}px solid rgba(100,0,140,0.7)`,
                                            boxShadow: '0 0 25px rgba(100,0,140,0.5), inset 0 0 15px rgba(0,0,0,0.8)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <svg
                                            className="animate-[spin_12s_linear_infinite]"
                                            viewBox="0 0 100 100"
                                            style={{
                                                position: 'absolute',
                                                top: -2 * scale,
                                                left: -2 * scale,
                                                width: 88 * scale,
                                                height: 88 * scale,
                                                pointerEvents: 'none',
                                            }}
                                        >
                                            <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(100,0,140,0.8)" strokeWidth="1.5" strokeDasharray="4 3" />
                                        </svg>
                                        <span style={{ fontSize: 20 * scale, lineHeight: 1, filter: 'drop-shadow(0 0 4px rgba(160,0,255,0.8))' }}>
                                            👁️
                                        </span>
                                        <span
                                            style={{
                                                fontFamily: 'monospace',
                                                fontSize: 18 * scale, // text-lg equivalent
                                                fontWeight: 'bold',
                                                color: '#E8E8E8',
                                                textShadow: '0 0 8px rgba(160,0,255,0.8)',
                                                lineHeight: 1.2,
                                                marginTop: 2 * scale
                                            }}
                                        >
                                            {data.attack ?? 0}
                                        </span>
                                    </div>
                                </DraggableBadge>

                                {/* Center: Stars */}
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 4 * scale,
                                    }}
                                >
                                    {data.cost !== undefined && data.cost > 0 ? (
                                        <div
                                            style={{
                                                filter: 'drop-shadow(0 0 6px rgba(180,0,0,0.7)) drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
                                            }}
                                        >
                                            <StarRating stars={data.cost} scale={scale * 0.9} />
                                        </div>
                                    ) : (
                                        <div style={{ height: 22 * scale }} />
                                    )}
                                </div>

                                {/* HP Badge (Heart) - RIGHT */}
                                <DraggableBadge
                                    badgeKey="hp"
                                    pos={bPos.hp}
                                    isTransformMode={isTransformMode}
                                    isActive={activeBadgeId === 'badge-hp'}
                                    onSelect={() => handleSelect('hp')}
                                    onMove={handleMove}
                                >
                                    <div
                                        style={{
                                            position: 'relative',
                                            width: 88 * scale,
                                            height: 88 * scale,
                                            borderRadius: '50%',
                                            background: 'radial-gradient(circle at 40% 40%, #150000, #000000)',
                                            border: `${2 * scale}px solid rgba(180,0,0,0.7)`,
                                            boxShadow: '0 0 25px rgba(180,0,0,0.5), inset 0 0 15px rgba(0,0,0,0.8)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <svg
                                            className="animate-[spin_12s_linear_infinite_reverse]"
                                            viewBox="0 0 100 100"
                                            style={{
                                                position: 'absolute',
                                                top: -2 * scale,
                                                left: -2 * scale,
                                                width: 88 * scale,
                                                height: 88 * scale,
                                                pointerEvents: 'none',
                                            }}
                                        >
                                            <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(200,0,0,0.8)" strokeWidth="1.5" strokeDasharray="4 3" />
                                        </svg>
                                        <span style={{ fontSize: 20 * scale, lineHeight: 1, filter: 'drop-shadow(0 0 4px rgba(255,0,0,0.8))' }}>
                                            ❤️
                                        </span>
                                        <span
                                            style={{
                                                fontFamily: 'monospace',
                                                fontSize: 18 * scale, // text-lg
                                                fontWeight: 'bold',
                                                color: '#E8E8E8',
                                                textShadow: '0 0 8px rgba(255,0,0,0.8)',
                                                lineHeight: 1.2,
                                                marginTop: 2 * scale
                                            }}
                                        >
                                            {data.hp ?? 0}
                                        </span>
                                    </div>
                                </DraggableBadge>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        if (layout === 'glitch-artifact') {
            // ── Sub-components for Glitch ────────
            const GlitchLine = ({ top, color, delay, height = 2, opacity = 0.7 }: any) => (
                <div
                    className="absolute left-0 right-0 animate-[glitchScan_3s_ease-in-out_infinite]"
                    style={{
                        top, height: height * scale, opacity,
                        background: `linear-gradient(90deg, transparent 0%, ${color} 30%, ${color} 70%, transparent 100%)`,
                        animationDelay: delay,
                        mixBlendMode: 'screen',
                    }}
                />
            );

            const RGBSplit = ({ children, intensity = 2 }: any) => (
                <div className="relative">
                    <div className="absolute inset-0 text-red-500 opacity-70 pointer-events-none select-none"
                        style={{ transform: `translateX(${intensity * scale}px)`, mixBlendMode: 'screen' }}>
                        {children}
                    </div>
                    <div className="absolute inset-0 text-blue-400 opacity-70 pointer-events-none select-none"
                        style={{ transform: `translateX(-${intensity * scale}px)`, mixBlendMode: 'screen' }}>
                        {children}
                    </div>
                    <div className="relative">{children}</div>
                </div>
            );

            const GlitchParticles = () => (
                <>
                    {[...Array(18)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-[glitchFloat_4s_ease-in-out_infinite]"
                            style={{
                                left: `${5 + (i * 5.3) % 90}%`,
                                top: `${8 + (i * 7.1) % 80}%`,
                                width: `${(2 + i % 4) * scale}px`,
                                height: `${(1 + i % 3) * scale}px`,
                                background: ['#FF003C', '#00FFFF', '#FF00FF', '#FFFF00', '#FFFFFF'][i % 5],
                                opacity: 0.3 + (i % 4) * 0.15,
                                animationDelay: `${i * 0.22}s`,
                                mixBlendMode: 'screen',
                            }}
                        />
                    ))}
                </>
            );

            const HoloBorder = () => (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-30"
                    viewBox="0 0 350 480" fill="none">
                    {/* Cut corners */}
                    <path d="M20 0 L350 0 L350 460 L330 480 L0 480 L0 20 Z"
                        fill="none" stroke="url(#holoBorderGrad)" strokeWidth="1.5" />
                    {/* Corner details */}
                    <path d="M0 20 L20 0" stroke="white" strokeWidth="1.5" opacity="0.8" />
                    <path d="M330 480 L350 460" stroke="white" strokeWidth="1.5" opacity="0.8" />
                    {/* Inner decorative lines */}
                    <path d="M8 8 L30 8 L30 14" fill="none" stroke="white" strokeWidth="0.8" opacity="0.4" />
                    <path d="M8 8 L8 30 L14 30" fill="none" stroke="white" strokeWidth="0.8" opacity="0.4" />
                    <path d="M342 8 L320 8 L320 14" fill="none" stroke="white" strokeWidth="0.8" opacity="0.4" />
                    <path d="M342 8 L342 30 L336 30" fill="none" stroke="white" strokeWidth="0.8" opacity="0.4" />
                    <path d="M8 472 L30 472 L30 466" fill="none" stroke="white" strokeWidth="0.8" opacity="0.4" />
                    <path d="M8 472 L8 450 L14 450" fill="none" stroke="white" strokeWidth="0.8" opacity="0.4" />
                    {/* Screws */}
                    {[[12, 12], [338, 12], [12, 468], [338, 468], [12, 240], [338, 240]].map(([cx, cy], i) => (
                        <circle key={i} cx={cx} cy={cy} r="3"
                            fill="#111" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                    ))}
                    {/* Back runic circle */}
                    <circle cx="175" cy="200" r="115" fill="none"
                        stroke="url(#runicGrad)" strokeWidth="0.5" opacity="0.2"
                        strokeDasharray="3 4" />
                    <circle cx="175" cy="200" r="85" fill="none"
                        stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                    <defs>
                        <linearGradient id="holoBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%"
                            gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#FF003C" stopOpacity="0.9" />
                            <stop offset="25%" stopColor="#FF00FF" stopOpacity="0.9" />
                            <stop offset="50%" stopColor="#00FFFF" stopOpacity="0.9" />
                            <stop offset="75%" stopColor="#FFFF00" stopOpacity="0.7" />
                            <stop offset="100%" stopColor="#FF003C" stopOpacity="0.9" />
                        </linearGradient>
                        <linearGradient id="runicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="white" />
                            <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                    </defs>
                </svg>
            );

            return (
                <div
                    className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:brightness-110 ${onClick ? 'cursor-pointer' : ''} ${className}`}
                    style={{
                        width: 350 * scale,
                        height: 480 * scale,
                        clipPath: `polygon(${20 * scale}px 0%, 100% 0%, 100% calc(100% - ${20 * scale}px), calc(100% - ${20 * scale}px) 100%, 0% 100%, 0% ${20 * scale}px)`,
                        background: 'linear-gradient(160deg, #050005 0%, #000A08 35%, #080005 65%, #000000 100%)',
                        boxShadow: showGlow ? `
                            0 0 0 ${1 * scale}px rgba(255,0,60,0.3),
                            0 ${40 * scale}px ${100 * scale}px rgba(255,0,100,0.4),
                            0 0 ${80 * scale}px rgba(0,255,255,0.1),
                            inset 0 0 ${100 * scale}px rgba(0,0,0,0.9)
                        ` : 'none',
                        cursor: onClick ? 'pointer' : 'default',
                        userSelect: 'none',
                        flexShrink: 0,
                        ...style,
                    }}
                    onClick={onClick}
                >
                    {/* Scanlines Layer */}
                    <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.04]"
                        style={{
                            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent ${2 * scale}px, rgba(255,255,255,1) ${2 * scale}px, rgba(255,255,255,1) ${3 * scale}px)`,
                            backgroundSize: `100% ${3 * scale}px`,
                        }} />

                    {/* Glitch Particles */}
                    <GlitchParticles />

                    {/* Scan Lines */}
                    <GlitchLine top="18%" color="rgba(255,0,60,0.6)" delay="0s" height={1} />
                    <GlitchLine top="34%" color="rgba(0,255,255,0.5)" delay="0.7s" height={2} />
                    <GlitchLine top="55%" color="rgba(255,0,255,0.4)" delay="1.4s" height={1} />
                    <GlitchLine top="72%" color="rgba(255,255,0,0.3)" delay="2.1s" height={1} />

                    {/* Image Area */}
                    <div className="absolute top-0 left-0 right-0 overflow-hidden z-0"
                        style={{ height: 270 * scale }}>

                        {/* Background — Digital grid */}
                        <div className="absolute inset-0"
                            style={{
                                backgroundImage: `
                                    linear-gradient(rgba(0,255,200,0.03) ${1 * scale}px, transparent ${1 * scale}px),
                                    linear-gradient(90deg, rgba(0,255,200,0.03) ${1 * scale}px, transparent ${1 * scale}px)
                                `,
                                backgroundSize: `${20 * scale}px ${20 * scale}px`
                            }} />

                        {/* Central Glow */}
                        <div className="absolute inset-0 animate-[pulse_4s_ease-in-out_infinite]"
                            style={{
                                background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(60,0,60,0.35) 0%, rgba(0,30,30,0.2) 50%, transparent 80%)'
                            }} />

                        {data.imageUrl ? (
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    zIndex: 10,
                                    backgroundImage: `url(${data.imageUrl})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    mixBlendMode: 'luminosity',
                                    opacity: 0.85
                                }}
                            />
                        ) : (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                                style={{ width: 130 * scale, height: 130 * scale }}>
                                {/* Outer Aura */}
                                <div className="absolute inset-0 rounded-full animate-[pulse_3s_ease-in-out_infinite]"
                                    style={{
                                        background: 'radial-gradient(circle, rgba(255,0,60,0.15) 0%, transparent 70%)',
                                        filter: `blur(${8 * scale}px)`
                                    }} />

                                {/* Left Half — Digital */}
                                <div className="absolute top-[15px] left-[10px] rounded-full overflow-hidden"
                                    style={{
                                        width: 55 * scale, height: 100 * scale,
                                        background: 'linear-gradient(180deg, #001A10 0%, #000A08 100%)',
                                        border: `${1 * scale}px solid rgba(0,255,150,0.4)`,
                                        boxShadow: `0 0 ${20 * scale}px rgba(0,255,150,0.2)`
                                    }}>
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className="mx-1 my-1 animate-[pulse_2s_ease-in-out_infinite]"
                                            style={{
                                                height: 2 * scale,
                                                background: `rgba(0,255,${100 + i * 20},${0.3 + i * 0.06})`,
                                                animationDelay: `${i * 0.2}s`,
                                                width: `${40 + (i % 3) * 10}%`
                                            }} />
                                    ))}
                                </div>

                                {/* Right Half — Organic */}
                                <div className="absolute top-[15px] right-[10px] rounded-full overflow-hidden"
                                    style={{
                                        width: 55 * scale, height: 100 * scale,
                                        background: 'linear-gradient(180deg, #1A0008 0%, #0A0003 100%)',
                                        border: `${1 * scale}px solid rgba(255,0,60,0.4)`,
                                        boxShadow: `0 0 ${20 * scale}px rgba(255,0,60,0.2)`
                                    }}>
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="absolute rounded-full animate-[pulse_3s_ease-in-out_infinite]"
                                            style={{
                                                width: (30 + i * 4) * scale, height: (30 + i * 4) * scale,
                                                border: `${1 * scale}px solid rgba(255,${30 + i * 15},${i * 20},0.3)`,
                                                top: '50%', left: '50%',
                                                transform: 'translate(-50%,-50%)',
                                                animationDelay: `${i * 0.4}s`
                                            }} />
                                    ))}
                                </div>

                                {/* Central split line */}
                                <div className="absolute z-20"
                                    style={{
                                        top: 10 * scale, left: '50%', width: 2 * scale, bottom: 10 * scale,
                                        background: 'linear-gradient(to bottom, transparent, white, rgba(255,0,60,1), white, transparent)',
                                        boxShadow: `0 0 ${8 * scale}px rgba(255,255,255,0.8)`,
                                        animation: 'glitchScan 2s ease-in-out infinite'
                                    }} />

                                {/* Central Eye */}
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center animate-[pulse_1.5s_ease-in-out_infinite]"
                                    style={{
                                        width: 32 * scale, height: 32 * scale,
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle, #FF003C, #000)',
                                        boxShadow: `0 0 ${20 * scale}px rgba(255,0,60,1), 0 0 ${40 * scale}px rgba(255,0,60,0.4)`,
                                    }}>
                                    <div className="rounded-full bg-white animate-pulse" style={{ width: 8 * scale, height: 8 * scale }} />
                                </div>
                            </div>
                        )}

                        {/* Missing line from lines extending from center */}
                        {!data.imageUrl && (
                            <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.07 }}>
                                {[...Array(20)].map((_, i) => {
                                    const angle = (i * 18 * Math.PI) / 180;
                                    return (
                                        <line key={i}
                                            x1={175 * scale} y1={135 * scale}
                                            x2={(175 + 200 * Math.cos(angle)) * scale}
                                            y2={(135 + 200 * Math.sin(angle)) * scale}
                                            stroke="white" strokeWidth={0.5 * scale} />
                                    );
                                })}
                            </svg>
                        )}

                        {/* Card tear effect */}
                        <div className="absolute top-[35%] left-0 right-0 z-20"
                            style={{
                                height: `${2 * scale}px`,
                                background: 'linear-gradient(90deg, transparent 0%, rgba(255,0,60,0.8) 20%, rgba(0,255,255,0.8) 80%, transparent 100%)',
                                animation: 'glitchTear 4s ease-in-out infinite',
                                boxShadow: `0 0 ${6 * scale}px rgba(255,100,100,0.9)`
                            }} />

                        {/* Bottom Gradient Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none z-15"
                            style={{ background: 'linear-gradient(to top, #000000, transparent)' }} />
                    </div>

                    {/* Holographic Border */}
                    <HoloBorder />

                    {/* Top Zone: Rarity Badge and Element Badge */}
                    <DraggableBadge
                        badgeKey="rarity"
                        pos={bPos.rarity}
                        isTransformMode={isTransformMode}
                        isActive={activeBadgeId === 'badge-rarity'}
                        onSelect={() => handleSelect('rarity')}
                        onMove={handleMove}
                    >
                        <div className="absolute z-40 flex items-center gap-2"
                            style={{ top: 10 * scale, left: 14 * scale }}>
                            <div className="flex items-center gap-1.5 px-3 py-[3px]"
                                style={{
                                    background: 'linear-gradient(90deg, rgba(255,0,60,0.2), rgba(0,255,255,0.1))',
                                    border: `${1 * scale}px solid rgba(255,0,60,0.5)`,
                                    clipPath: 'polygon(0 0, 88% 0, 100% 100%, 0 100%)',
                                    backdropFilter: 'blur(4px)',
                                    color: rCfg.textColor,
                                }}>
                                <div style={{ position: 'relative' }}>
                                    <span className="absolute text-red-500 opacity-70 font-black tracking-[0.2em]"
                                        style={{ transform: 'translateX(1.5px)', fontSize: 10 * scale }}>
                                        {rCfg.label}
                                    </span>
                                    <span className="absolute text-cyan-400 opacity-70 font-black tracking-[0.2em]"
                                        style={{ transform: 'translateX(-1.5px)', fontSize: 10 * scale }}>
                                        {rCfg.label}
                                    </span>
                                    <span className="relative font-black tracking-[0.2em] text-white"
                                        style={{ fontSize: 10 * scale }}>
                                        {rCfg.label}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </DraggableBadge>

                    {/* Element Badge - Right */}
                    <DraggableBadge
                        badgeKey="element"
                        pos={bPos.element}
                        isTransformMode={isTransformMode}
                        isActive={activeBadgeId === 'badge-element'}
                        onSelect={() => handleSelect('element')}
                        onMove={handleMove}
                    >
                        <div className="absolute z-40"
                            style={{ top: 10 * scale, right: 14 * scale }}>
                            <div className="flex items-center justify-center animate-[pulse_1.5s_ease-in-out_infinite]"
                                style={{
                                    width: 24 * scale, height: 24 * scale,
                                    background: elCfg.bg,
                                    borderRadius: '50%',
                                    padding: `${2 * scale}px`,
                                    boxShadow: `0 0 ${15 * scale}px ${elCfg.accent}90`
                                }}>
                                <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: '#000' }}>
                                    <span style={{ fontSize: 12 * scale, filter: `drop-shadow(0 0 2px ${elCfg.accent})` }}>
                                        {elCfg.icon}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </DraggableBadge>

                    {/* Divider with Code Text */}
                    <div className="absolute left-0 right-0 flex items-center z-20" style={{ top: 263 * scale }}>
                        <div className="flex-1" style={{ height: `${1 * scale}px`, background: 'linear-gradient(to right, transparent, rgba(255,0,60,0.6))' }} />
                        <span className="font-mono px-2"
                            style={{ color: 'rgba(0,255,200,0.6)', letterSpacing: '0.2em', fontSize: 8 * scale }}>
                            0xDEAD • CORRUPT
                        </span>
                        <div className="flex-1" style={{ height: `${1 * scale}px`, background: 'linear-gradient(to left, transparent, rgba(0,255,200,0.6))' }} />
                    </div>

                    {/* Card Title — RGB Split */}
                    <DraggableBadge
                        badgeKey="title"
                        pos={bPos.title}
                        isTransformMode={isTransformMode}
                        isActive={activeBadgeId === 'badge-title'}
                        onSelect={() => handleSelect('title')}
                        onMove={handleMove}
                    >
                        <div className="absolute left-0 right-0 text-center z-20" style={{ top: 270 * scale, padding: `0 ${20 * scale}px` }}>
                            <RGBSplit intensity={2.5}>
                                <h1 className="font-black tracking-[0.1em] text-white"
                                    style={{
                                        fontSize: 28 * scale,
                                        fontFamily: "'Noto Kufi Arabic', sans-serif",
                                        textShadow: `0 0 ${25 * scale}px rgba(255,255,255,0.8)`
                                    }}>
                                    {data.title || 'كيان الخلل'}
                                </h1>
                            </RGBSplit>
                            <div className="mt-1 font-mono tracking-[0.3em] animate-[pulse_2s_ease-in-out_infinite]"
                                style={{ color: 'rgba(255, 0, 0, 0.5)', fontSize: 8 * scale }}>
                                ERR_REALITY_OVERFLOW ▸ ENTITY_CLASS_NULL
                            </div>
                        </div>
                    </DraggableBadge>

                    {/* Description Box */}
                    <DraggableBadge
                        badgeKey="desc"
                        pos={bPos.desc}
                        isTransformMode={isTransformMode}
                        isActive={activeBadgeId === 'badge-desc'}
                        onSelect={() => handleSelect('desc')}
                        onMove={handleMove}
                    >
                        <div className="absolute z-20" style={{ top: 326 * scale, left: 16 * scale, right: 16 * scale }}>
                            <div className="relative text-center overflow-hidden"
                                style={{
                                    padding: `${7 * scale}px ${16 * scale}px`,
                                    background: 'rgba(0,0,0,0.8)',
                                    border: `${1 * scale}px solid rgba(255,0,60,0.2)`,
                                    borderLeft: `${2 * scale}px solid rgba(0,255,200,0.5)`,
                                    borderRight: `${2 * scale}px solid rgba(255,0,60,0.5)`
                                }}>
                                {/* Moving Scanline */}
                                <div className="absolute top-0 left-0 right-0 animate-[glitchScan_3s_linear_infinite]"
                                    style={{ height: `${1 * scale}px`, background: 'linear-gradient(90deg, transparent, rgba(0,255,200,0.8), transparent)' }} />
                                <p className="font-bold whitespace-pre-wrap"
                                    style={{
                                        fontFamily: "'Noto Kufi Arabic', sans-serif",
                                        color: 'rgba(150,150,150,0.8)',
                                        letterSpacing: '0.05em',
                                        fontSize: 11 * scale,
                                        lineHeight: 1.4,
                                    }}>
                                    {data.description || 'أدخل وصف البطاقة هنا...'}
                                </p>
                            </div>
                        </div>
                    </DraggableBadge>

                    {/* Stats Bar */}
                    {showStats && (
                        <div className="absolute z-20 flex items-center justify-between" style={{ bottom: 16 * scale, left: 12 * scale, right: 12 * scale }}>
                            {/* ATK - left */}
                            <DraggableBadge
                                badgeKey="attack"
                                pos={bPos.attack}
                                isTransformMode={isTransformMode}
                                isActive={activeBadgeId === 'badge-attack'}
                                onSelect={() => handleSelect('attack')}
                                onMove={handleMove}
                            >
                                <div className="relative" style={{ width: 88 * scale, height: 88 * scale }}>
                                    <svg className="absolute inset-0 animate-[spin_8s_linear_infinite_reverse]"
                                        width="100%" height="100%" viewBox="0 0 88 88">
                                        <defs>
                                            <linearGradient id="atkRing" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#FF003C" stopOpacity="0.9" />
                                                <stop offset="50%" stopColor="#FF00FF" stopOpacity="0.6" />
                                                <stop offset="100%" stopColor="#FF003C" stopOpacity="0.9" />
                                            </linearGradient>
                                        </defs>
                                        <circle cx="44" cy="44" r="40"
                                            fill="none" stroke="url(#atkRing)" strokeWidth="1.5"
                                            strokeDasharray="6 3" />
                                        {[45, 135, 225, 315].map((a, i) => {
                                            const rad = (a * Math.PI) / 180;
                                            return <circle key={i}
                                                cx={44 + 40 * Math.cos(rad)} cy={44 + 40 * Math.sin(rad)}
                                                r="2.5" fill="#FF003C" opacity="0.8" />;
                                        })}
                                    </svg>
                                    <div className="absolute rounded-full flex flex-col items-center justify-center"
                                        style={{
                                            inset: 7 * scale,
                                            background: 'linear-gradient(135deg, #1A0005, #0A0003)',
                                            border: `${1 * scale}px solid rgba(255,0,60,0.4)`,
                                            boxShadow: `0 0 ${20 * scale}px rgba(255,0,60,0.3), inset 0 0 ${12 * scale}px rgba(0,0,0,0.9)`
                                        }}>
                                        <span style={{ fontSize: 18 * scale, filter: `drop-shadow(0 0 ${6 * scale}px rgba(255,0,60,1))` }}>⚔️</span>
                                        <span className="font-black font-mono leading-tight"
                                            style={{ fontSize: 16 * scale, color: '#FF6080', textShadow: `0 0 ${10 * scale}px rgba(255,0,60,0.9)` }}>
                                            {data.attack ?? 0}
                                        </span>
                                    </div>
                                </div>
                            </DraggableBadge>

                            {/* Center StarRating */}
                            <div className="flex flex-col gap-[5px] items-center">
                                {/* Holographic progress bar */}
                                <div className="rounded-full overflow-hidden"
                                    style={{ width: 80 * scale, height: 3 * scale, marginBottom: 4 * scale, background: 'rgba(255,255,255,0.1)' }}>
                                    <div className="h-full w-4/5 rounded-full animate-[pulse_2s_ease-in-out_infinite]"
                                        style={{ background: 'linear-gradient(90deg, #FF003C, #FF00FF, #00FFFF)' }} />
                                </div>
                                <div style={{ filter: 'drop-shadow(0 0 4px rgba(0,255,255,0.8))' }}>
                                    <StarRating stars={data.cost || 0} scale={scale * 0.9} />
                                </div>
                            </div>

                            {/* HP - right */}
                            <DraggableBadge
                                badgeKey="hp"
                                pos={bPos.hp}
                                isTransformMode={isTransformMode}
                                isActive={activeBadgeId === 'badge-hp'}
                                onSelect={() => handleSelect('hp')}
                                onMove={handleMove}
                            >
                                <div className="relative" style={{ width: 88 * scale, height: 88 * scale }}>
                                    {/* Holographic rotating ring */}
                                    <svg className="absolute inset-0 animate-[spin_8s_linear_infinite]"
                                        width="100%" height="100%" viewBox="0 0 88 88">
                                        <defs>
                                            <linearGradient id="hpRing" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#00FF96" stopOpacity="0.9" />
                                                <stop offset="50%" stopColor="#00FFFF" stopOpacity="0.6" />
                                                <stop offset="100%" stopColor="#00FF96" stopOpacity="0.9" />
                                            </linearGradient>
                                        </defs>
                                        <circle cx="44" cy="44" r="40"
                                            fill="none" stroke="url(#hpRing)" strokeWidth="1.5"
                                            strokeDasharray="6 3" />
                                        {[0, 90, 180, 270].map((a, i) => {
                                            const rad = (a * Math.PI) / 180;
                                            return <circle key={i}
                                                cx={44 + 40 * Math.cos(rad)} cy={44 + 40 * Math.sin(rad)}
                                                r="2.5" fill="#00FF96" opacity="0.8" />;
                                        })}
                                    </svg>
                                    <div className="absolute rounded-full flex flex-col items-center justify-center"
                                        style={{
                                            inset: 7 * scale,
                                            background: 'linear-gradient(135deg, #001A0A, #000A05)',
                                            border: `${1 * scale}px solid rgba(0,255,150,0.4)`,
                                            boxShadow: `0 0 ${20 * scale}px rgba(0,255,150,0.3), inset 0 0 ${12 * scale}px rgba(0,0,0,0.9)`
                                        }}>
                                        <span style={{ fontSize: 18 * scale, filter: `drop-shadow(0 0 ${6 * scale}px rgba(0,255,150,1))` }}>❤️</span>
                                        <span className="font-black font-mono leading-tight"
                                            style={{ fontSize: 16 * scale, color: '#00FF96', textShadow: `0 0 ${10 * scale}px rgba(0,255,150,0.9)` }}>
                                            {data.hp ?? 0}
                                        </span>
                                    </div>
                                </div>
                            </DraggableBadge>
                        </div>
                    )}

                    {/* Bottom Info Bar */}
                    <div className="absolute bottom-[2px] left-0 right-0 flex justify-center z-40">
                        <div className="flex items-center justify-center gap-3 px-4 py-[2px]"
                            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <span className="font-mono tracking-[0.35em]" style={{ fontSize: 8 * scale, color: 'rgba(255,0,60,0.5)' }}>GLITCH</span>
                            <div className="rounded-full bg-red-500 animate-pulse" style={{ width: 4 * scale, height: 4 * scale }} />
                            <span className="font-mono tracking-[0.35em]" style={{ fontSize: 8 * scale, color: 'rgba(0,255,200,0.5)' }}>ARTIFACT</span>
                            <div className="rounded-full bg-cyan-400 animate-pulse" style={{ width: 4 * scale, height: 4 * scale }} />
                            <span className="font-mono tracking-[0.35em]" style={{ fontSize: 8 * scale, color: 'rgba(255,0,200,0.5)' }}>v0.0.0</span>
                        </div>
                    </div>
                </div>
            );
        }


        if (layout === 'swamp') {
            const Bubble = ({ size, left, delay, duration }: any) => (
                <div
                    className="absolute rounded-full pointer-events-none z-10"
                    style={{
                        width: size, height: size,
                        bottom: -size,
                        left,
                        animation: `bubbleRise ${duration} ease-in infinite`,
                        animationDelay: delay,
                        background: 'radial-gradient(circle at 35% 35%, rgba(180,255,200,0.6), rgba(0,100,60,0.1))',
                        border: `${1 * scale}px solid rgba(100,255,160,0.4)`,
                        boxShadow: `0 0 ${6 * scale}px rgba(0,255,120,0.3)`
                    }}
                />
            );

            const Ripple = ({ top, left, size, delay, color = 'rgba(0,255,120,0.15)' }: any) => (
                <div
                    className="absolute rounded-full pointer-events-none z-10"
                    style={{
                        width: size, height: size,
                        top, left,
                        transform: 'translate(-50%, -50%)',
                        border: `${1 * scale}px solid ${color}`,
                        animation: `rippleExpand 3s ease-out infinite`,
                        animationDelay: delay
                    }}
                />
            );

            const SwampFrame = () => (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" viewBox="0 0 350 480" fill="none">
                    <rect x="2" y="2" width="346" height="476" rx="16" stroke="url(#swampBorder)" strokeWidth="2" />
                    <path d="M2 40 Q2 16 16 2 L40 2" stroke="rgba(0,200,100,0.5)" strokeWidth="1.5" fill="none" />
                    <path d="M6 24 Q10 10 20 6 Q14 18 6 24Z" fill="rgba(0,150,60,0.35)" stroke="rgba(0,200,80,0.4)" strokeWidth="0.8" />
                    <path d="M348 40 Q348 16 334 2 L310 2" stroke="rgba(0,200,100,0.5)" strokeWidth="1.5" fill="none" />
                    <path d="M344 24 Q340 10 330 6 Q336 18 344 24Z" fill="rgba(0,150,60,0.35)" stroke="rgba(0,200,80,0.4)" strokeWidth="0.8" />
                    <path d="M10 270 Q50 260 90 268 Q130 276 175 266 Q220 256 260 268 Q300 278 340 266" stroke="rgba(0,200,100,0.5)" strokeWidth="1.5" fill="none" />
                    <defs>
                        <linearGradient id="swampBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#003820" stopOpacity="0.9" />
                            <stop offset="50%" stopColor="#00FF90" stopOpacity="0.7" />
                            <stop offset="100%" stopColor="#003820" stopOpacity="0.9" />
                        </linearGradient>
                    </defs>
                </svg>
            );

            const StatOrb = ({ icon, value, side = 'left' }: any) => {
                const isLeft = side === 'left';
                return (
                    <div className="relative flex-shrink-0" style={{ width: 88 * scale, height: 88 * scale }}>
                        <svg className="absolute inset-0" style={{ animation: `spin ${isLeft ? 10 : 14}s linear infinite ${isLeft ? '' : 'reverse'}` }} width="100%" height="100%" viewBox="0 0 92 92">
                            <circle cx="46" cy="46" r="42" fill="none" stroke={isLeft ? '#00FF90' : '#00C8FF'} strokeWidth="1.5" strokeDasharray="5 4" opacity="0.5" />
                            {[0, 120, 240].map((a, i) => (
                                <circle key={i} cx={46 + 42 * Math.cos((a * Math.PI) / 180)} cy={46 + 42 * Math.sin((a * Math.PI) / 180)} r="3" fill={isLeft ? '#00FF90' : '#00C8FF'} />
                            ))}
                        </svg>
                        <div className="absolute rounded-full flex flex-col items-center justify-center shadow-xl"
                            style={{
                                inset: 7 * scale,
                                background: isLeft ? 'radial-gradient(circle at 40% 40%, #001F0A, #000C04)' : 'radial-gradient(circle at 40% 40%, #001520, #000A10)',
                                border: `${2 * scale}px solid ${isLeft ? 'rgba(0,200,100,0.6)' : 'rgba(0,180,220,0.6)'}`,
                                boxShadow: `0 0 ${25 * scale}px ${isLeft ? 'rgba(0,200,100,0.5)' : 'rgba(0,150,220,0.5)'}, inset 0 0 ${15 * scale}px rgba(0,0,0,0.8)`
                            }}>
                            <span style={{ fontSize: 20 * scale, marginBottom: 2 * scale, filter: `drop-shadow(0 0 ${8 * scale}px ${isLeft ? '#00FF90' : '#00C8FF'})` }}>{icon}</span>
                            <span className="font-black font-mono leading-none" style={{ fontSize: 18 * scale, color: isLeft ? '#80FFB8' : '#80E8FF' }}>{value}</span>
                        </div>
                    </div>
                );
            };

            const bubbles = [
                { size: 8 * scale, left: '8%', delay: '0s', duration: '4s' },
                { size: 5 * scale, left: '18%', delay: '1.2s', duration: '3.5s' },
                { size: 10 * scale, left: '30%', delay: '0.5s', duration: '5s' },
                { size: 6 * scale, left: '45%', delay: '2s', duration: '3.8s' },
                { size: 4 * scale, left: '55%', delay: '0.8s', duration: '4.5s' },
                { size: 9 * scale, left: '68%', delay: '1.7s', duration: '4.2s' },
                { size: 5 * scale, left: '78%', delay: '0.3s', duration: '3.2s' },
                { size: 7 * scale, left: '88%', delay: '2.5s', duration: '4.8s' },
            ];

            return (
                <div
                    className={`relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] ${onClick ? 'cursor-pointer' : ''} ${className}`}
                    style={{
                        width: W, height: H, borderRadius: r,
                        background: 'linear-gradient(to bottom, #000D04, #001508, #001E0C)',
                        boxShadow: showGlow ? '0 50px 120px rgba(0,150,60,0.55), 0 0 0 1px rgba(0,100,40,0.4), inset 0 0 100px rgba(0,0,0,0.85)' : 'none',
                        cursor: onClick ? 'pointer' : 'default',
                        userSelect: 'none',
                        flexShrink: 0,
                        ...style,
                    }}
                    onClick={onClick}
                >
                    {/* Bubbles */}
                    {bubbles.map((b, i) => <Bubble key={i} {...b} />)}

                    {/* Image Area */}
                    <div className="absolute top-0 left-0 right-0 overflow-hidden z-0" style={{ height: 272 * scale }}>
                        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(0,60,20,0.9) 0%, transparent 70%)' }} />

                        <Ripple top="50%" left="50%" size={80 * scale} delay="0s" color="rgba(0,200,100,0.12)" />
                        <Ripple top="50%" left="50%" size={140 * scale} delay="0.8s" color="rgba(0,200,100,0.08)" />
                        <Ripple top="50%" left="50%" size={210 * scale} delay="1.6s" color="rgba(0,200,100,0.05)" />

                        <div className="absolute inset-0 z-0">
                            {data.imageUrl ? (
                                <div className="w-full h-full mix-blend-screen opacity-90 transition-all duration-1000 group-hover:scale-110 group-hover:opacity-100"
                                    style={{ backgroundImage: `url('${data.imageUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-black to-[#001E0C]">
                                    <span style={{ fontSize: 60 * scale, filter: 'drop-shadow(0 0 10px rgba(0,255,100,0.8))' }}>🌊</span>
                                </div>
                            )}
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end z-10" style={{ height: 40 * scale, padding: `0 ${12 * scale}px` }}>
                            {[14, 20, 16, 12, 18, 22, 15, 19, 13, 17].map((h, i) => (
                                <div key={i} className="animate-[pulse_3s_ease-in-out_infinite]"
                                    style={{
                                        width: 6 * scale, height: h * scale,
                                        borderRadius: `${3 * scale}px ${3 * scale}px 0 0`,
                                        background: `linear-gradient(to top, rgba(0,${60 + i * 8},${20 + i * 4},0.9), rgba(0,${120 + i * 5},${40 + i * 5},0.5))`,
                                        animationDelay: `${i * 0.3}s`, transformOrigin: 'bottom center', opacity: 0.7
                                    }} />
                            ))}
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 z-20 overflow-hidden" style={{ height: 30 * scale }}>
                            <svg width="100%" height="100%" viewBox="0 0 350 30" preserveAspectRatio="none">
                                <path d="M0 15 Q25 5 50 15 Q75 25 100 15 Q125 5 150 15 Q175 25 200 15 Q225 5 250 15 Q275 25 300 15 Q325 5 350 15 L350 30 L0 30 Z" fill="rgba(0,20,8,0.95)" />
                                <path d="M0 15 Q25 5 50 15 Q75 25 100 15 Q125 5 150 15 Q175 25 200 15 Q225 5 250 15 Q275 25 300 15 Q325 5 350 15" fill="none" stroke="rgba(0,200,100,0.3)" strokeWidth="1" />
                            </svg>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-10" style={{ height: 80 * scale, background: 'linear-gradient(to top, #000D04, transparent)' }} />
                    </div>

                    <SwampFrame />

                    {/* Rarity Badge */}
                    <DraggableBadge
                        badgeKey="rarity"
                        pos={bPos.rarity}
                        isTransformMode={isTransformMode}
                        isActive={activeBadgeId === 'badge-rarity'}
                        onSelect={() => handleSelect('rarity')}
                        onMove={handleMove}
                    >
                        <div className="absolute top-[10px] left-[12px] z-40 flex items-center gap-1.5"
                            style={{
                                padding: `${3 * scale}px ${12 * scale}px`,
                                background: 'linear-gradient(90deg, rgba(0,80,30,0.95), rgba(0,40,15,0.9))',
                                border: `${1 * scale}px solid rgba(0,200,80,0.45)`,
                                clipPath: 'polygon(0 0, 90% 0, 100% 100%, 0 100%)',
                                boxShadow: `0 ${2 * scale}px ${12 * scale}px rgba(0,180,60,0.4)`
                            }}>
                            <div className="rounded-full bg-emerald-400 animate-pulse" style={{ width: 6 * scale, height: 6 * scale }} />
                            <span className="text-emerald-300 font-black tracking-[0.2em] uppercase" style={{ fontSize: 10 * scale, fontFamily: "'Noto Kufi Arabic', sans-serif" }}>
                                {rCfg.label}
                            </span>
                        </div>
                    </DraggableBadge>

                    {/* Element Badge */}
                    <DraggableBadge
                        badgeKey="element"
                        pos={bPos.element}
                        isTransformMode={isTransformMode}
                        isActive={activeBadgeId === 'badge-element'}
                        onSelect={() => handleSelect('element')}
                        onMove={handleMove}
                    >
                        <div className="absolute right-[12px] z-40 flex items-center justify-center"
                            style={{
                                top: 10 * scale,
                                width: 28 * scale, height: 28 * scale,
                                borderRadius: '50%', background: 'rgba(0,40,15,0.95)',
                                border: `${1 * scale}px solid rgba(0,200,80,0.45)`,
                                boxShadow: `0 ${2 * scale}px ${12 * scale}px rgba(0,180,60,0.4)`
                            }}>
                            <span style={{ fontSize: 13 * scale }}>{elCfg.emoji}</span>
                        </div>
                    </DraggableBadge>

                    {/* Card Title */}
                    <DraggableBadge
                        badgeKey="title"
                        pos={bPos.title}
                        isTransformMode={isTransformMode}
                        isActive={activeBadgeId === 'badge-title'}
                        onSelect={() => handleSelect('title')}
                        onMove={handleMove}
                    >
                        <div className="absolute left-0 right-0 text-center z-20" style={{ top: 274 * scale, padding: `0 ${24 * scale}px` }}>
                            <h1 className="font-black tracking-[0.12em] leading-none text-transparent bg-clip-text"
                                style={{
                                    fontFamily: "'Noto Kufi Arabic', sans-serif", fontSize: 27 * scale,
                                    backgroundImage: 'linear-gradient(to right, #80FFB8, #00C864, #006432)',
                                    WebkitTextStroke: `${0.5 * scale}px rgba(0,255,100,0.2)`,
                                    filter: `drop-shadow(0 0 ${10 * scale}px rgba(0,200,80,0.9))`
                                }}>
                                {data.title || 'سيد المستنقع'}
                            </h1>
                        </div>
                    </DraggableBadge>

                    {/* Description Box */}
                    {showDescription && (
                        <DraggableBadge
                            badgeKey="desc"
                            pos={bPos.desc}
                            isTransformMode={isTransformMode}
                            isActive={activeBadgeId === 'badge-desc'}
                            onSelect={() => handleSelect('desc')}
                            onMove={handleMove}
                        >
                            <div className="absolute z-20 left-4 right-4 text-center" style={{ top: 312 * scale }}>
                                <div className="relative border rounded-sm"
                                    style={{
                                        padding: `${7 * scale}px ${16 * scale}px`,
                                        background: 'rgba(0,8,3,0.85)',
                                        borderColor: 'rgba(0,120,50,0.35)',
                                        borderLeft: `${1 * scale}px solid rgba(16,185,129,0.4)`,
                                        borderRight: `${1 * scale}px solid rgba(16,185,129,0.4)`,
                                    }}>
                                    <p className="font-bold leading-tight"
                                        style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", fontSize: 11 * scale, color: 'rgba(16,185,129,0.9)' }}>
                                        {data.description || 'كيان برمائي يسكن أعماق المستنقعات...'}
                                    </p>
                                </div>
                            </div>
                        </DraggableBadge>
                    )}

                    {/* Stats Bar */}
                    {showStats && (
                        <div className="absolute z-30 flex items-center justify-between" style={{ bottom: 16 * scale, left: 12 * scale, right: 12 * scale }}>
                            <DraggableBadge
                                badgeKey="hp"
                                pos={bPos.hp}
                                isTransformMode={isTransformMode}
                                isActive={activeBadgeId === 'badge-hp'}
                                onSelect={() => handleSelect('hp')}
                                onMove={handleMove}
                            >
                                <StatOrb icon="❤️" value={data.hp ?? 0} side="left" />
                            </DraggableBadge>

                            {/* Center Stars */}
                            <div className="flex flex-col items-center gap-[5px]">
                                <div className="animate-[pulse_2s_ease-in-out_infinite]" style={{ fontSize: 16 * scale, filter: `drop-shadow(0 0 ${6 * scale}px rgba(0,200,80,0.8))` }}>🌿</div>
                                <div style={{ filter: `drop-shadow(0 0 ${4 * scale}px rgba(255,50,50,0.9))` }}>
                                    <StarRating stars={data.cost || 0} scale={scale * 0.9} />
                                </div>
                            </div>

                            <DraggableBadge
                                badgeKey="attack"
                                pos={bPos.attack}
                                isTransformMode={isTransformMode}
                                isActive={activeBadgeId === 'badge-attack'}
                                onSelect={() => handleSelect('attack')}
                                onMove={handleMove}
                            >
                                <StatOrb icon="⚔️" value={data.attack ?? 0} side="right" />
                            </DraggableBadge>
                        </div>
                    )}

                    {/* Bottom Info Bar */}
                    <div className="absolute bottom-[5px] left-0 right-0 flex justify-center z-40 pointer-events-none">
                        <div className="flex items-center gap-2 px-4 py-[2px]" style={{ borderTop: `${1 * scale}px solid rgba(0,50,20,0.5)` }}>
                            <span className="font-bold tracking-[0.4em] uppercase" style={{ fontSize: 8 * scale, color: 'rgba(0,100,50,0.8)' }}>برمائي</span>
                            <div className="rounded-full bg-emerald-700" style={{ width: 4 * scale, height: 4 * scale }} />
                            <span className="font-mono tracking-[0.3em]" style={{ fontSize: 8 * scale, color: 'rgba(0,80,40,0.7)' }}>AMPHIBIAN v1.0</span>
                        </div>
                    </div>
                </div>
            );
        }

        if (layout === 'full-bleed') {
            return (
                <div
                    className={`transition-all duration-300 hover:scale-[1.02] hover:brightness-110 ${onClick ? 'cursor-pointer' : ''} ${className}`}
                    style={{
                        width: W,
                        height: H,
                        borderRadius: r,
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: onClick ? 'pointer' : 'default',
                        userSelect: 'none',
                        flexShrink: 0,
                        backgroundColor: '#0a0a0c',
                        border: `${2 * scale}px solid #2a2a35`,
                        boxShadow: showGlow ? '0 0 30px rgba(255,50,0,0.2)' : 'none',
                        ...style,
                    }}
                    onClick={onClick}
                    role={onClick ? 'button' : undefined}
                >
                    {/* Background Image */}
                    {data.imageUrl ? (
                        <div
                            className="absolute inset-0 z-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${data.imageUrl})` }}
                        />
                    ) : (
                        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#2a2a35] to-[#0a0a0c]" />
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#15151a] via-[#15151a]/80 to-transparent" />

                    {/* Top Elements: Rarity and Orb */}
                    <div
                        className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start"
                        style={{ padding: `${16 * scale}px ${16 * scale}px` }}
                    >
                        {/* Rarity */}
                        <DraggableBadge
                            badgeKey="rarity"
                            pos={bPos.rarity}
                            isTransformMode={isTransformMode}
                            isActive={activeBadgeId === 'badge-rarity'}
                            onSelect={() => handleSelect('rarity')}
                            onMove={handleMove}
                        >
                            <div
                                style={{
                                    padding: `${4 * scale}px ${10 * scale}px`,
                                    background: 'rgba(0,0,0,0.6)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: 999,
                                    border: `1px solid ${rCfg.borderColor}`,
                                    color: rCfg.textColor,
                                    fontSize: 10 * scale,
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4 * scale,
                                }}
                            >
                                <span>{rCfg.label}</span>
                            </div>
                        </DraggableBadge>

                        {/* Element Orb */}
                        <DraggableBadge
                            badgeKey="element"
                            pos={bPos.element}
                            isTransformMode={isTransformMode}
                            isActive={activeBadgeId === 'badge-element'}
                            onSelect={() => handleSelect('element')}
                            onMove={handleMove}
                        >
                            <div
                                style={{
                                    width: 32 * scale,
                                    height: 32 * scale,
                                    borderRadius: 999,
                                    background: elCfg.bg,
                                    border: `2px solid ${elCfg.border}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 14 * scale,
                                    boxShadow: `0 0 15px ${elCfg.accent}40`,
                                }}
                            >
                                {elCfg.emoji}
                            </div>
                        </DraggableBadge>
                    </div>

                    {/* Bottom Content */}
                    <div
                        className="absolute bottom-0 w-full flex flex-col items-center z-20"
                        style={{
                            paddingBottom: 24 * scale,
                            paddingLeft: 16 * scale,
                            paddingRight: 16 * scale,
                        }}
                    >
                        {/* Title */}
                        <h2
                            style={{
                                color: 'white',
                                fontSize: 22 * scale,
                                fontWeight: 900,
                                textAlign: 'center',
                                fontFamily: 'Cairo, sans-serif',
                                textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                                marginBottom: 2 * scale,
                            }}
                        >
                            {data.title || 'بدون اسم'}
                        </h2>

                        {/* Traits */}
                        {data.traits && data.traits.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-2 mb-2">
                                {data.traits.map((t) => (
                                    <span
                                        key={t}
                                        style={{
                                            padding: `${2 * scale}px ${8 * scale}px`,
                                            background: 'rgba(255,255,255,0.1)',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            borderRadius: 999,
                                            fontSize: 9 * scale,
                                            color: 'rgba(255,255,255,0.9)',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {t}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Stats */}
                        {showStats && (
                            <div
                                className="flex justify-between w-full mt-2"
                                style={{ padding: `0 ${10 * scale}px` }}
                            >
                                {/* ATK */}
                                <DraggableBadge
                                    badgeKey="attack"
                                    pos={bPos.attack}
                                    isTransformMode={isTransformMode}
                                    isActive={activeBadgeId === 'badge-attack'}
                                    onSelect={() => handleSelect('attack')}
                                    onMove={handleMove}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 1 * scale,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 60 * scale,
                                                height: 60 * scale,
                                                borderRadius: 999,
                                                background:
                                                    'linear-gradient(135deg, rgba(239,68,68,0.3), #0a0a0c)',
                                                border: '1.5px solid rgba(239,68,68,0.5)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 0 15px rgba(239,68,68,0.4)',
                                            }}
                                        >
                                            <Sword
                                                size={24 * scale}
                                                color="#fca5a5"
                                                className="mb-[2px]"
                                            />
                                            <span
                                                style={{
                                                    fontSize: 22 * scale,
                                                    fontWeight: 900,
                                                    color: '#fff',
                                                    lineHeight: 1,
                                                }}
                                            >
                                                {data.attack ?? 0}
                                            </span>
                                        </div>
                                    </div>
                                </DraggableBadge>

                                {/* HP */}
                                <DraggableBadge
                                    badgeKey="hp"
                                    pos={bPos.hp}
                                    isTransformMode={isTransformMode}
                                    isActive={activeBadgeId === 'badge-hp'}
                                    onSelect={() => handleSelect('hp')}
                                    onMove={handleMove}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 1 * scale,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 60 * scale,
                                                height: 60 * scale,
                                                borderRadius: 999,
                                                background:
                                                    'linear-gradient(135deg, rgba(74,222,128,0.3), #0a0a0c)',
                                                border: '1.5px solid rgba(74,222,128,0.5)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 0 15px rgba(74,222,128,0.4)',
                                            }}
                                        >
                                            <Heart
                                                size={24 * scale}
                                                color="#86efac"
                                                className="mb-[2px]"
                                            />
                                            <span
                                                style={{
                                                    fontSize: 22 * scale,
                                                    fontWeight: 900,
                                                    color: '#fff',
                                                    lineHeight: 1,
                                                }}
                                            >
                                                {data.hp ?? 0}
                                            </span>
                                        </div>
                                    </div>
                                </DraggableBadge>
                            </div>
                        )}
                    </div>

                    {/* Cost / Stars (Absolute Bottom Center) */}
                    {data.cost !== undefined && data.cost > 0 && (
                        <div
                            className="absolute left-0 right-0 flex justify-center z-30 pointer-events-none"
                            style={{ bottom: 38 * scale }}
                        >
                            <div className="pointer-events-auto flex justify-center flex-wrap gap-1">
                                <StarRating stars={data.cost} scale={scale * 0.9} />
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        if (layout === 'steampunk') {
            return (
                <div
                    className={`transition-all duration-300 hover:scale-[1.02] hover:brightness-110 ${onClick ? 'cursor-pointer' : ''} ${className}`}
                    style={{
                        width: W,
                        height: H,
                        borderRadius: r,
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: onClick ? 'pointer' : 'default',
                        userSelect: 'none',
                        flexShrink: 0,
                        background: '#1A0F08',
                        border: `${4 * scale}px solid #B5842E`,
                        boxShadow: showGlow ? '0 25px 50px rgba(184,132,46,0.5)' : 'none',
                        ...style,
                    }}
                    onClick={onClick}
                    role={onClick ? 'button' : undefined}
                >
                    {/* Full Bleed Image Background */}
                    {data.imageUrl ? (
                        <div
                            className="absolute inset-0 z-0 bg-cover bg-center"
                            style={{
                                backgroundImage: `url(${data.imageUrl})`,
                                filter: 'sepia(0.35) contrast(1.15) brightness(0.9)',
                            }}
                        />
                    ) : (
                        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#2C1810] to-[#0f0804] flex items-center justify-center">
                            <span style={{ fontSize: 80 * scale, opacity: 0.1 }}>⚙️</span>
                        </div>
                    )}

                    {/* Steampunk Overlay Gradient */}
                    <div
                        className="absolute inset-0 z-10"
                        style={{
                            background:
                                'linear-gradient(to bottom, rgba(44,24,16,0.6) 0%, transparent 35%, rgba(26,15,8,0.95) 100%)',
                        }}
                    />

                    {/* Background Gears (Animated) */}
                    <div
                        style={{
                            position: 'absolute',
                            top: -40 * scale,
                            left: -40 * scale,
                            opacity: 0.25,
                            zIndex: 5,
                            pointerEvents: 'none',
                            animation: 'gear-spin 15s linear infinite',
                        }}
                    >
                        <div
                            style={{
                                width: 150 * scale,
                                height: 150 * scale,
                                background:
                                    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg' fill='%23B5842E'%3E%3Cpath d='M50 0 L58 10 A40 40 0 0 1 80 20 L94 15 L100 28 L88 38 A40 40 0 0 1 90 50 A40 40 0 0 1 88 62 L100 72 L94 85 L80 80 A40 40 0 0 1 58 90 L50 100 L42 90 A40 40 0 0 1 20 80 L6 85 L0 72 L12 62 A40 40 0 0 1 10 50 A40 40 0 0 1 12 38 L0 28 L6 15 L20 20 A40 40 0 0 1 42 10 Z'/%3E%3Ccircle cx='50' cy='50' r='20' fill='%231A0F08'/%3E%3C/svg%3E\")",
                            }}
                        />
                    </div>
                    <div
                        style={{
                            position: 'absolute',
                            bottom: -50 * scale,
                            right: -30 * scale,
                            opacity: 0.25,
                            zIndex: 5,
                            pointerEvents: 'none',
                            animation: 'gear-spin-reverse 20s linear infinite',
                        }}
                    >
                        <div
                            style={{
                                width: 200 * scale,
                                height: 200 * scale,
                                background:
                                    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg' fill='%23B5842E'%3E%3Cpath d='M50 0 L58 10 A40 40 0 0 1 80 20 L94 15 L100 28 L88 38 A40 40 0 0 1 90 50 A40 40 0 0 1 88 62 L100 72 L94 85 L80 80 A40 40 0 0 1 58 90 L50 100 L42 90 A40 40 0 0 1 20 80 L6 85 L0 72 L12 62 A40 40 0 0 1 10 50 A40 40 0 0 1 12 38 L0 28 L6 15 L20 20 A40 40 0 0 1 42 10 Z'/%3E%3Ccircle cx='50' cy='50' r='20' fill='%231A0F08'/%3E%3C/svg%3E\")",
                            }}
                        />
                    </div>

                    {/* Top Corner Elements */}
                    <div
                        className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start"
                        style={{ padding: `${16 * scale}px` }}
                    >
                        {/* Element */}
                        <DraggableBadge
                            badgeKey="element"
                            pos={bPos.element}
                            isTransformMode={isTransformMode}
                            isActive={activeBadgeId === 'badge-element'}
                            onSelect={() => handleSelect('element')}
                            onMove={handleMove}
                        >
                            <div
                                style={{
                                    width: 36 * scale,
                                    height: 36 * scale,
                                    borderRadius: '50%',
                                    background: 'rgba(26,15,8,0.9)',
                                    border: `${2 * scale}px dashed #B5842E`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 16 * scale,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
                                    backdropFilter: 'blur(4px)',
                                }}
                            >
                                {elCfg.emoji}
                            </div>
                        </DraggableBadge>

                        {/* Rarity */}
                        <DraggableBadge
                            badgeKey="rarity"
                            pos={bPos.rarity}
                            isTransformMode={isTransformMode}
                            isActive={activeBadgeId === 'badge-rarity'}
                            onSelect={() => handleSelect('rarity')}
                            onMove={handleMove}
                        >
                            <div
                                style={{
                                    padding: `${4 * scale}px ${10 * scale}px`,
                                    background: 'rgba(44,24,16,0.9)',
                                    border: `${2 * scale}px solid #B5842E`,
                                    color: '#D4AF37',
                                    fontSize: 10 * scale,
                                    fontWeight: '900',
                                    textTransform: 'uppercase',
                                    letterSpacing: 1 * scale,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
                                    backdropFilter: 'blur(4px)',
                                }}
                            >
                                {rCfg.label}
                            </div>
                        </DraggableBadge>
                    </div>

                    {/* Bottom Section (Overlaid on Background) */}
                    <div
                        className="absolute bottom-0 w-full flex flex-col items-center z-20"
                        style={{
                            paddingBottom: 24 * scale,
                            paddingLeft: 16 * scale,
                            paddingRight: 16 * scale,
                        }}
                    >
                        {/* Title */}
                        <h2
                            style={{
                                color: '#E8D499',
                                fontSize: 24 * scale,
                                fontWeight: 900,
                                textAlign: 'center',
                                fontFamily: 'Cairo, sans-serif',
                                textShadow: '0 4px 16px rgba(0,0,0,0.9)',
                                marginBottom: 4 * scale,
                                letterSpacing: 0.5 * scale,
                            }}
                        >
                            {data.title || 'بدون اسم'}
                        </h2>

                        {/* Description Panel (Glassmorphic Steampunk) */}
                        {showDescription && (
                            <div
                                style={{
                                    width: '100%',
                                    padding: `${10 * scale}px`,
                                    background: 'rgba(26,15,8,0.75)',
                                    backdropFilter: 'blur(8px)',
                                    borderTop: `1px solid rgba(181,132,46,0.5)`,
                                    borderBottom: `1px solid rgba(181,132,46,0.5)`,
                                    borderLeft: `1px solid rgba(181,132,46,0.2)`,
                                    borderRight: `1px solid rgba(181,132,46,0.2)`,
                                    borderRadius: 6 * scale,
                                    color: '#E0C097',
                                    fontSize: 11.5 * scale,
                                    fontFamily: 'Cairo, sans-serif',
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    marginBottom: 8 * scale,
                                    minHeight: 65 * scale,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow:
                                        'inset 0 0 20px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.5)',
                                }}
                            >
                                {data.description || 'وصف الآلة...'}
                            </div>
                        )}

                        {/* Stats */}
                        {showStats && (
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    padding: `0 ${10 * scale}px`,
                                    marginTop: 4 * scale,
                                }}
                            >
                                {/* ATK */}
                                <DraggableBadge
                                    badgeKey="attack"
                                    pos={bPos.attack}
                                    isTransformMode={isTransformMode}
                                    isActive={activeBadgeId === 'badge-attack'}
                                    onSelect={() => handleSelect('attack')}
                                    onMove={handleMove}
                                >
                                    <div
                                        style={{
                                            width: 68 * scale,
                                            height: 68 * scale,
                                            borderRadius: '50%',
                                            background:
                                                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg' fill='%238A5A19'%3E%3Cpath d='M50 0 L58 10 A40 40 0 0 1 80 20 L94 15 L100 28 L88 38 A40 40 0 0 1 90 50 A40 40 0 0 1 88 62 L100 72 L94 85 L80 80 A40 40 0 0 1 58 90 L50 100 L42 90 A40 40 0 0 1 20 80 L6 85 L0 72 L12 62 A40 40 0 0 1 10 50 A40 40 0 0 1 12 38 L0 28 L6 15 L20 20 A40 40 0 0 1 42 10 Z'/%3E%3Ccircle cx='50' cy='50' r='35' fill='%231A0F08'/%3E%3C/svg%3E\")",
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: `2px solid #5C1A1A`,
                                            boxShadow:
                                                'inset 0 0 15px #000, 0 8px 20px rgba(0,0,0,0.8)',
                                        }}
                                    >
                                        <Sword
                                            size={24 * scale}
                                            color="#fca5a5"
                                            className="mb-[2px]"
                                        />
                                        <span
                                            style={{
                                                fontSize: 24 * scale,
                                                fontWeight: 900,
                                                color: '#FFB8B8',
                                                lineHeight: 1,
                                            }}
                                        >
                                            {data.attack ?? 0}
                                        </span>
                                    </div>
                                </DraggableBadge>

                                {/* HP */}
                                <DraggableBadge
                                    badgeKey="hp"
                                    pos={bPos.hp}
                                    isTransformMode={isTransformMode}
                                    isActive={activeBadgeId === 'badge-hp'}
                                    onSelect={() => handleSelect('hp')}
                                    onMove={handleMove}
                                >
                                    <div
                                        style={{
                                            width: 68 * scale,
                                            height: 68 * scale,
                                            borderRadius: '50%',
                                            background:
                                                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg' fill='%238A5A19'%3E%3Cpath d='M50 0 L58 10 A40 40 0 0 1 80 20 L94 15 L100 28 L88 38 A40 40 0 0 1 90 50 A40 40 0 0 1 88 62 L100 72 L94 85 L80 80 A40 40 0 0 1 58 90 L50 100 L42 90 A40 40 0 0 1 20 80 L6 85 L0 72 L12 62 A40 40 0 0 1 10 50 A40 40 0 0 1 12 38 L0 28 L6 15 L20 20 A40 40 0 0 1 42 10 Z'/%3E%3Ccircle cx='50' cy='50' r='35' fill='%231A0F08'/%3E%3C/svg%3E\")",
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: `2px solid #1A4D2E`,
                                            boxShadow:
                                                'inset 0 0 15px #000, 0 8px 20px rgba(0,0,0,0.8)',
                                        }}
                                    >
                                        <Heart
                                            size={24 * scale}
                                            color="#86efac"
                                            className="mb-[2px]"
                                        />
                                        <span
                                            style={{
                                                fontSize: 24 * scale,
                                                fontWeight: 900,
                                                color: '#A3D9B1',
                                                lineHeight: 1,
                                            }}
                                        >
                                            {data.hp ?? 0}
                                        </span>
                                    </div>
                                </DraggableBadge>
                            </div>
                        )}
                    </div>

                    {/* Cost / Stars (Absolute Bottom Center) */}
                    {data.cost !== undefined && data.cost > 0 && (
                        <div
                            className="absolute left-0 right-0 flex justify-center z-30 pointer-events-none"
                            style={{ bottom: 42 * scale }}
                        >
                            <div
                                className="pointer-events-auto flex justify-center flex-wrap gap-1"
                                style={{
                                    filter:
                                        'drop-shadow(0 0 8px rgba(212,175,55,0.6)) drop-shadow(0 4px 4px rgba(0,0,0,0.8))',
                                }}
                            >
                                <StarRating stars={data.cost} scale={scale * 0.95} />
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div
                className={`transition-all duration-300 hover:scale-[1.02] hover:brightness-110 ${onClick ? 'cursor-pointer' : ''} ${className}`}
                style={frameStyle}
                onClick={onClick}
                role={onClick ? 'button' : undefined}
            >
                {/* Legendary shimmer overlay */}
                {isLegendary && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: 0,
                            pointerEvents: 'none',
                            background:
                                'linear-gradient(135deg, rgba(251,191,36,0.06) 0%, transparent 50%, rgba(251,191,36,0.06) 100%)',
                            animation: 'rarity-pulse 2.5s ease-in-out infinite',
                        }}
                    />
                )}

                {/* Noise texture layer */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 0,
                        pointerEvents: 'none',
                        backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
                        backgroundSize: 'cover',
                        opacity: 0.5,
                    }}
                />

                {/* ── Top header ── */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: artTop,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: `0 ${pad}px`,
                        background:
                            'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
                        zIndex: 5,
                        overflow: 'visible',
                    }}
                >
                    {/* Element badge (draggable) */}
                    <DraggableBadge
                        badgeKey="element"
                        pos={bPos.element}
                        isTransformMode={isTransformMode}
                        isActive={activeBadgeId === 'badge-element'}
                        onSelect={() => handleSelect('element')}
                        onMove={handleMove}
                    >
                        <div
                            style={{
                                width: 32 * scale,
                                height: 32 * scale,
                                borderRadius: 10 * scale,
                                background: 'rgba(0,0,0,0.5)',
                                border: `1.5px solid ${elCfg.border}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 16 * scale,
                                backdropFilter: 'blur(4px)',
                                boxShadow: `0 0 12px ${elCfg.accent}40`,
                            }}
                        >
                            {elCfg.emoji}
                        </div>
                    </DraggableBadge>

                    {/* Rarity badge (draggable) */}
                    <DraggableBadge
                        badgeKey="rarity"
                        pos={bPos.rarity}
                        isTransformMode={isTransformMode}
                        isActive={activeBadgeId === 'badge-rarity'}
                        onSelect={() => handleSelect('rarity')}
                        onMove={handleMove}
                    >
                        <div
                            style={{
                                padding: `${3 * scale}px ${8 * scale}px`,
                                borderRadius: 999,
                                background: 'rgba(0,0,0,0.5)',
                                border: `1px solid ${rCfg.borderColor}`,
                                fontSize: 9 * scale,
                                fontWeight: 700,
                                letterSpacing: 1,
                                color: rCfg.textColor,
                                backdropFilter: 'blur(4px)',
                                textTransform: 'uppercase',
                            }}
                        >
                            {rCfg.label}
                        </div>
                    </DraggableBadge>
                </div>

                {/* ── Art area ── */}
                <div
                    style={{
                        position: 'absolute',
                        top: artTop,
                        left: pad,
                        right: pad,
                        height: artH,
                        borderRadius: 10 * scale,
                        overflow: 'hidden',
                        background: data.imageUrl
                            ? undefined
                            : `linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))`,
                        border: `1px solid rgba(255,255,255,0.06)`,
                        zIndex: 2,
                    }}
                >
                    {data.imageUrl ? (
                        <img
                            src={data.imageUrl}
                            alt={data.title}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6 * scale,
                            }}
                        >
                            <div style={{ fontSize: 36 * scale, opacity: 0.25 }}>
                                {elCfg.emoji}
                            </div>
                            <div
                                style={{
                                    fontSize: 9 * scale,
                                    opacity: 0.3,
                                    color: '#94a3b8',
                                    textAlign: 'center',
                                }}
                            >
                                اسحب صورة هنا
                            </div>
                        </div>
                    )}
                    {/* Art gradient overlay */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            background:
                                'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.7))',
                        }}
                    />
                </div>

                {/* ── Title only ── */}
                <div
                    style={{
                        position: 'absolute',
                        left: pad,
                        right: pad,
                        top: artTop + artH + 10 * scale,
                        zIndex: 5,
                    }}
                >
                    <div
                        style={{
                            fontFamily: 'Cairo, sans-serif',
                            fontWeight: 800,
                            fontSize: 14 * scale * fs,
                            color: '#ffffff',
                            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                            letterSpacing: 0.3,
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            direction: 'rtl',
                            textAlign: 'center',
                        }}
                    >
                        {data.title || 'اسم البطاقة'}
                    </div>

                    {/* Divider */}
                    <div
                        style={{
                            height: 1,
                            margin: `${5 * scale}px 0`,
                            background: `linear-gradient(to right, transparent, ${elCfg.accent}60, transparent)`,
                        }}
                    />
                </div>

                {/* ── Description & Stars Container ── */}
                {showDescription && (
                    <div
                        style={{
                            position: 'absolute',
                            left: pad,
                            right: pad,
                            bottom: showStats
                                ? (64 + (data.traits?.length ? 28 : 8)) * scale
                                : (data.traits?.length ? 32 : 12) * scale,
                            zIndex: 5,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: `0 ${4 * scale}px`,
                        }}
                    >
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
                            }}
                        >
                            {data.description || 'نص وصف البطاقة يظهر هنا'}
                        </div>
                    </div>
                )}

                {/* ── Traits row ── */}
                {data.traits && data.traits.length > 0 && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: showStats ? 64 * scale : 10 * scale,
                            left: pad,
                            right: pad,
                            zIndex: 5,
                            display: 'flex',
                            gap: 4 * scale,
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                        }}
                    >
                        {data.traits.slice(0, 3).map((t) => (
                            <div
                                key={t}
                                style={{
                                    padding: `${2 * scale}px ${6 * scale}px`,
                                    borderRadius: 999,
                                    background: 'rgba(0,0,0,0.4)',
                                    border: `1px solid ${elCfg.border}`,
                                    fontSize: 7.5 * scale,
                                    color: elCfg.text,
                                    fontFamily: 'Cairo, sans-serif',
                                    fontWeight: 500,
                                }}
                            >
                                {t}
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Stats row ── */}
                {showStats && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 6 * scale,
                            left: 0,
                            right: 0,
                            height: 52 * scale,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'transparent',
                            zIndex: 5,
                            padding: `0 ${pad}px`,
                            overflow: 'visible',
                        }}
                    >
                        {/* ATK badge (draggable) */}
                        <DraggableBadge
                            badgeKey="attack"
                            pos={bPos.attack}
                            isTransformMode={isTransformMode}
                            isActive={activeBadgeId === 'badge-attack'}
                            onSelect={() => handleSelect('attack')}
                            onMove={handleMove}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 1 * scale,
                                }}
                            >
                                <div
                                    style={{
                                        width: 60 * scale,
                                        height: 60 * scale,
                                        borderRadius: 999,
                                        background:
                                            'radial-gradient(circle, rgba(239,68,68,0.2), rgba(0,0,0,0.5))',
                                        border: '1.5px solid rgba(239,68,68,0.5)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 0 10px rgba(239,68,68,0.3)',
                                    }}
                                >
                                    <Sword
                                        size={22 * scale}
                                        color="#fca5a5"
                                        className="mb-[2px]"
                                    />
                                    <span
                                        style={{
                                            fontSize: 22 * scale,
                                            fontWeight: 900,
                                            color: '#fff',
                                            lineHeight: 1,
                                        }}
                                    >
                                        {data.attack ?? 0}
                                    </span>
                                </div>
                            </div>
                        </DraggableBadge>

                        {/* HP badge (draggable) */}
                        <DraggableBadge
                            badgeKey="hp"
                            pos={bPos.hp}
                            isTransformMode={isTransformMode}
                            isActive={activeBadgeId === 'badge-hp'}
                            onSelect={() => handleSelect('hp')}
                            onMove={handleMove}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 1 * scale,
                                }}
                            >
                                <div
                                    style={{
                                        width: 60 * scale,
                                        height: 60 * scale,
                                        borderRadius: 999,
                                        background:
                                            'radial-gradient(circle, rgba(74,222,128,0.2), rgba(0,0,0,0.5))',
                                        border: '1.5px solid rgba(74,222,128,0.5)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 0 10px rgba(74,222,128,0.3)',
                                    }}
                                >
                                    <Heart
                                        size={22 * scale}
                                        color="#86efac"
                                        className="mb-[2px]"
                                    />
                                    <span
                                        style={{
                                            fontSize: 22 * scale,
                                            fontWeight: 900,
                                            color: '#fff',
                                            lineHeight: 1,
                                        }}
                                    >
                                        {data.hp ?? 0}
                                    </span>
                                </div>
                            </div>
                        </DraggableBadge>
                    </div>
                )}
                {/* Legendary gold inner border */}
                {isLegendary && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 3 * scale,
                            borderRadius: r - 2,
                            border: '1px solid rgba(251,191,36,0.35)',
                            pointerEvents: 'none',
                            zIndex: 10,
                        }}
                    />
                )}

                {/* ── Cost / Stars (Absolute Bottom Center) ── */}
                {data.cost !== undefined && data.cost > 0 && (
                    <div
                        className="absolute left-0 right-0 flex justify-center z-30 pointer-events-none"
                        style={{ bottom: 18 * scale }}
                    >
                        <div className="pointer-events-auto flex justify-center flex-wrap gap-1 bg-transparent border-none outline-none shadow-none">
                            <StarRating stars={data.cost} scale={scale * 0.9} />
                        </div>
                    </div>
                )}
            </div>
        );
    },
);

CardFrame.displayName = 'CardFrame';

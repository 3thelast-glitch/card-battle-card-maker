import React, { memo, useRef, useCallback } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { Heart, Sword } from 'lucide-react';
import { StarRating } from './StarRating';
import type { BadgeKey, BadgePos } from '../../../../store/cardEditorStore';

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
    // Transform mode props (all optional so the component works standalone too)
    isTransformMode?: boolean;
    badgePositions?: Record<BadgeKey, BadgePos>;
    activeBadgeId?: string | null;
    onBadgeSelect?: (badge: BadgeKey) => void;
    onBadgeMove?: (badge: BadgeKey, pos: BadgePos) => void;
    // Layout props
    showDescription?: boolean;
    artZoneHeight?: number;
    layout?: 'standard' | 'full-bleed' | 'steampunk';
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

const DraggableBadge = memo(({
    badgeKey, pos, isTransformMode, isActive, onSelect, onMove, children, style = {},
}: DraggableBadgeProps) => {
    const dragState = useRef<{
        startX: number; startY: number;
        origX: number; origY: number;
        axis: 'none' | 'x' | 'y';
    } | null>(null);

    const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
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
    }, [isTransformMode, badgeKey, pos, onSelect]);

    const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
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
    }, [badgeKey, onMove]);

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
});
DraggableBadge.displayName = 'DraggableBadge';

// ── CardFrame ────────────────────────────────────────────────
export const CardFrame = memo<CardFrameProps>(({
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
    const r = 16 * scale;
    const pad = 14 * scale;
    const artTop = 48 * scale;
    // artH: use artZoneHeight prop if provided, otherwise default to proportional height
    const artH = artZoneHeight != null ? artZoneHeight * scale : H * 0.42;
    const fs = scale;

    const defaultPos: BadgePos = { x: 0, y: 0 };
    const bPos = badgePositions ?? {
        element: defaultPos, rarity: defaultPos, attack: defaultPos, hp: defaultPos,
    };

    const handleSelect = onBadgeSelect ?? (() => { });
    const handleMove = onBadgeMove ?? (() => { });

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

    if (layout === 'full-bleed') {
        return (
            <div
                className={`transition-all duration-300 hover:scale-[1.02] hover:brightness-110 ${onClick ? 'cursor-pointer' : ''} ${className}`}
                style={{
                    width: W, height: H, borderRadius: r,
                    position: 'relative', overflow: 'hidden',
                    cursor: onClick ? 'pointer' : 'default',
                    userSelect: 'none', flexShrink: 0,
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
                    <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${data.imageUrl})` }} />
                ) : (
                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#2a2a35] to-[#0a0a0c]" />
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#15151a] via-[#15151a]/80 to-transparent" />

                {/* Top Elements: Rarity and Orb */}
                <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start" style={{ padding: `${16 * scale}px ${16 * scale}px` }}>
                    {/* Rarity */}
                    <DraggableBadge
                        badgeKey="rarity" pos={bPos.rarity} isTransformMode={isTransformMode}
                        isActive={activeBadgeId === 'badge-rarity'} onSelect={() => handleSelect('rarity')} onMove={handleMove}
                    >
                        <div style={{
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
                        }}>
                            <span>{rCfg.label}</span>
                        </div>
                    </DraggableBadge>

                    {/* Element Orb */}
                    <DraggableBadge
                        badgeKey="element" pos={bPos.element} isTransformMode={isTransformMode}
                        isActive={activeBadgeId === 'badge-element'} onSelect={() => handleSelect('element')} onMove={handleMove}
                    >
                        <div style={{
                            width: 32 * scale, height: 32 * scale,
                            borderRadius: 999,
                            background: elCfg.bg,
                            border: `2px solid ${elCfg.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14 * scale,
                            boxShadow: `0 0 15px ${elCfg.accent}40`,
                        }}>
                            {elCfg.emoji}
                        </div>
                    </DraggableBadge>
                </div>

                {/* Bottom Content */}
                <div className="absolute bottom-0 w-full flex flex-col items-center z-20" style={{ paddingBottom: 24 * scale, paddingLeft: 16 * scale, paddingRight: 16 * scale }}>
                    {/* Title */}
                    <h2 style={{
                        color: 'white',
                        fontSize: 22 * scale,
                        fontWeight: 900,
                        textAlign: 'center',
                        fontFamily: 'Cairo, sans-serif',
                        textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                        marginBottom: 2 * scale,
                    }}>
                        {data.title || 'بدون اسم'}
                    </h2>



                    {/* Traits */}
                    {data.traits && data.traits.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2 mb-2">
                            {data.traits.map(t => (
                                <span key={t} style={{
                                    padding: `${2 * scale}px ${8 * scale}px`,
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: 999,
                                    fontSize: 9 * scale,
                                    color: 'rgba(255,255,255,0.9)',
                                    fontWeight: 600,
                                }}>{t}</span>
                            ))}
                        </div>
                    )}

                    {/* Stats */}
                    {showStats && (
                        <div className="flex justify-between w-full mt-2" style={{ padding: `0 ${10 * scale}px` }}>
                            {/* ATK */}
                            <DraggableBadge
                                badgeKey="attack" pos={bPos.attack} isTransformMode={isTransformMode}
                                isActive={activeBadgeId === 'badge-attack'} onSelect={() => handleSelect('attack')} onMove={handleMove}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 * scale }}>
                                    <div style={{
                                        width: 60 * scale, height: 60 * scale, borderRadius: 999,
                                        background: 'linear-gradient(135deg, rgba(239,68,68,0.3), #0a0a0c)',
                                        border: '1.5px solid rgba(239,68,68,0.5)',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 0 15px rgba(239,68,68,0.4)',
                                    }}>
                                        <Sword size={24 * scale} color="#fca5a5" className="mb-[2px]" />
                                        <span style={{ fontSize: 22 * scale, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{data.attack ?? 0}</span>
                                    </div>
                                </div>
                            </DraggableBadge>

                            {/* HP */}
                            <DraggableBadge
                                badgeKey="hp" pos={bPos.hp} isTransformMode={isTransformMode}
                                isActive={activeBadgeId === 'badge-hp'} onSelect={() => handleSelect('hp')} onMove={handleMove}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 * scale }}>
                                    <div style={{
                                        width: 60 * scale, height: 60 * scale, borderRadius: 999,
                                        background: 'linear-gradient(135deg, rgba(74,222,128,0.3), #0a0a0c)',
                                        border: '1.5px solid rgba(74,222,128,0.5)',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 0 15px rgba(74,222,128,0.4)',
                                    }}>
                                        <Heart size={24 * scale} color="#86efac" className="mb-[2px]" />
                                        <span style={{ fontSize: 22 * scale, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{data.hp ?? 0}</span>
                                    </div>
                                </div>
                            </DraggableBadge>
                        </div>
                    )}
                </div>

                {/* Cost / Stars (Absolute Bottom Center) */}
                {data.cost !== undefined && data.cost > 0 && (
                    <div className="absolute left-0 right-0 flex justify-center z-30 pointer-events-none" style={{ bottom: 38 * scale }}>
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
                    width: W, height: H, borderRadius: r,
                    position: 'relative', overflow: 'hidden',
                    cursor: onClick ? 'pointer' : 'default',
                    userSelect: 'none', flexShrink: 0,
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
                    <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${data.imageUrl})`, filter: 'sepia(0.35) contrast(1.15) brightness(0.9)' }} />
                ) : (
                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#2C1810] to-[#0f0804] flex items-center justify-center">
                        <span style={{ fontSize: 80 * scale, opacity: 0.1 }}>⚙️</span>
                    </div>
                )}

                {/* Steampunk Overlay Gradient */}
                <div className="absolute inset-0 z-10" style={{
                    background: 'linear-gradient(to bottom, rgba(44,24,16,0.6) 0%, transparent 35%, rgba(26,15,8,0.95) 100%)',
                }} />

                {/* Background Gears (Animated) */}
                <div style={{ position: 'absolute', top: -40 * scale, left: -40 * scale, opacity: 0.25, zIndex: 5, pointerEvents: 'none', animation: 'gear-spin 15s linear infinite' }}>
                    <div style={{ width: 150 * scale, height: 150 * scale, background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\' fill=\'%23B5842E\'%3E%3Cpath d=\'M50 0 L58 10 A40 40 0 0 1 80 20 L94 15 L100 28 L88 38 A40 40 0 0 1 90 50 A40 40 0 0 1 88 62 L100 72 L94 85 L80 80 A40 40 0 0 1 58 90 L50 100 L42 90 A40 40 0 0 1 20 80 L6 85 L0 72 L12 62 A40 40 0 0 1 10 50 A40 40 0 0 1 12 38 L0 28 L6 15 L20 20 A40 40 0 0 1 42 10 Z\'/%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'20\' fill=\'%231A0F08\'/%3E%3C/svg%3E")' }} />
                </div>
                <div style={{ position: 'absolute', bottom: -50 * scale, right: -30 * scale, opacity: 0.25, zIndex: 5, pointerEvents: 'none', animation: 'gear-spin-reverse 20s linear infinite' }}>
                    <div style={{ width: 200 * scale, height: 200 * scale, background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\' fill=\'%23B5842E\'%3E%3Cpath d=\'M50 0 L58 10 A40 40 0 0 1 80 20 L94 15 L100 28 L88 38 A40 40 0 0 1 90 50 A40 40 0 0 1 88 62 L100 72 L94 85 L80 80 A40 40 0 0 1 58 90 L50 100 L42 90 A40 40 0 0 1 20 80 L6 85 L0 72 L12 62 A40 40 0 0 1 10 50 A40 40 0 0 1 12 38 L0 28 L6 15 L20 20 A40 40 0 0 1 42 10 Z\'/%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'20\' fill=\'%231A0F08\'/%3E%3C/svg%3E")' }} />
                </div>

                {/* Top Corner Elements */}
                <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start" style={{ padding: `${16 * scale}px` }}>
                    {/* Element */}
                    <DraggableBadge
                        badgeKey="element" pos={bPos.element} isTransformMode={isTransformMode}
                        isActive={activeBadgeId === 'badge-element'} onSelect={() => handleSelect('element')} onMove={handleMove}
                    >
                        <div style={{
                            width: 36 * scale, height: 36 * scale, borderRadius: '50%',
                            background: 'rgba(26,15,8,0.9)', border: `${2 * scale}px dashed #B5842E`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 * scale,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(4px)',
                        }}>{elCfg.emoji}</div>
                    </DraggableBadge>

                    {/* Rarity */}
                    <DraggableBadge
                        badgeKey="rarity" pos={bPos.rarity} isTransformMode={isTransformMode}
                        isActive={activeBadgeId === 'badge-rarity'} onSelect={() => handleSelect('rarity')} onMove={handleMove}
                    >
                        <div style={{
                            padding: `${4 * scale}px ${10 * scale}px`, background: 'rgba(44,24,16,0.9)',
                            border: `${2 * scale}px solid #B5842E`, color: '#D4AF37', fontSize: 10 * scale,
                            fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 * scale,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(4px)',
                        }}>{rCfg.label}</div>
                    </DraggableBadge>
                </div>

                {/* Bottom Section (Overlaid on Background) */}
                <div className="absolute bottom-0 w-full flex flex-col items-center z-20" style={{ paddingBottom: 24 * scale, paddingLeft: 16 * scale, paddingRight: 16 * scale }}>
                    {/* Title */}
                    <h2 style={{
                        color: '#E8D499',
                        fontSize: 24 * scale,
                        fontWeight: 900,
                        textAlign: 'center',
                        fontFamily: 'Cairo, sans-serif',
                        textShadow: '0 4px 16px rgba(0,0,0,0.9)',
                        marginBottom: 4 * scale,
                        letterSpacing: 0.5 * scale,
                    }}>
                        {data.title || 'بدون اسم'}
                    </h2>



                    {/* Description Panel (Glassmorphic Steampunk) */}
                    {showDescription && (
                        <div style={{
                            width: '100%', padding: `${10 * scale}px`,
                            background: 'rgba(26,15,8,0.75)',
                            backdropFilter: 'blur(8px)',
                            borderTop: `1px solid rgba(181,132,46,0.5)`,
                            borderBottom: `1px solid rgba(181,132,46,0.5)`,
                            borderLeft: `1px solid rgba(181,132,46,0.2)`,
                            borderRight: `1px solid rgba(181,132,46,0.2)`,
                            borderRadius: 6 * scale,
                            color: '#E0C097',
                            fontSize: 11.5 * scale, fontFamily: 'Cairo, sans-serif', textAlign: 'center', fontWeight: 600,
                            marginBottom: 8 * scale, minHeight: 65 * scale, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.5)',
                        }}>
                            {data.description || 'وصف الآلة...'}
                        </div>
                    )}

                    {/* Stats */}
                    {showStats && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: `0 ${10 * scale}px`, marginTop: 4 * scale }}>
                            {/* ATK */}
                            <DraggableBadge
                                badgeKey="attack" pos={bPos.attack} isTransformMode={isTransformMode}
                                isActive={activeBadgeId === 'badge-attack'} onSelect={() => handleSelect('attack')} onMove={handleMove}
                            >
                                <div style={{
                                    width: 68 * scale, height: 68 * scale, borderRadius: '50%',
                                    background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\' fill=\'%238A5A19\'%3E%3Cpath d=\'M50 0 L58 10 A40 40 0 0 1 80 20 L94 15 L100 28 L88 38 A40 40 0 0 1 90 50 A40 40 0 0 1 88 62 L100 72 L94 85 L80 80 A40 40 0 0 1 58 90 L50 100 L42 90 A40 40 0 0 1 20 80 L6 85 L0 72 L12 62 A40 40 0 0 1 10 50 A40 40 0 0 1 12 38 L0 28 L6 15 L20 20 A40 40 0 0 1 42 10 Z\'/%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'35\' fill=\'%231A0F08\'/%3E%3C/svg%3E")',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    border: `2px solid #5C1A1A`,
                                    boxShadow: 'inset 0 0 15px #000, 0 8px 20px rgba(0,0,0,0.8)',
                                }}>
                                    <Sword size={24 * scale} color="#fca5a5" className="mb-[2px]" />
                                    <span style={{ fontSize: 24 * scale, fontWeight: 900, color: '#FFB8B8', lineHeight: 1 }}>{data.attack ?? 0}</span>
                                </div>
                            </DraggableBadge>

                            {/* HP */}
                            <DraggableBadge
                                badgeKey="hp" pos={bPos.hp} isTransformMode={isTransformMode}
                                isActive={activeBadgeId === 'badge-hp'} onSelect={() => handleSelect('hp')} onMove={handleMove}
                            >
                                <div style={{
                                    width: 68 * scale, height: 68 * scale, borderRadius: '50%',
                                    background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\' fill=\'%238A5A19\'%3E%3Cpath d=\'M50 0 L58 10 A40 40 0 0 1 80 20 L94 15 L100 28 L88 38 A40 40 0 0 1 90 50 A40 40 0 0 1 88 62 L100 72 L94 85 L80 80 A40 40 0 0 1 58 90 L50 100 L42 90 A40 40 0 0 1 20 80 L6 85 L0 72 L12 62 A40 40 0 0 1 10 50 A40 40 0 0 1 12 38 L0 28 L6 15 L20 20 A40 40 0 0 1 42 10 Z\'/%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'35\' fill=\'%231A0F08\'/%3E%3C/svg%3E")',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    border: `2px solid #1A4D2E`,
                                    boxShadow: 'inset 0 0 15px #000, 0 8px 20px rgba(0,0,0,0.8)',
                                }}>
                                    <Heart size={24 * scale} color="#86efac" className="mb-[2px]" />
                                    <span style={{ fontSize: 24 * scale, fontWeight: 900, color: '#A3D9B1', lineHeight: 1 }}>{data.hp ?? 0}</span>
                                </div>
                            </DraggableBadge>
                        </div>
                    )}
                </div>

                {/* Cost / Stars (Absolute Bottom Center) */}
                {data.cost !== undefined && data.cost > 0 && (
                    <div className="absolute left-0 right-0 flex justify-center z-30 pointer-events-none" style={{ bottom: 42 * scale }}>
                        <div className="pointer-events-auto flex justify-center flex-wrap gap-1" style={{ filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.6)) drop-shadow(0 4px 4px rgba(0,0,0,0.8))' }}>
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
                overflow: 'visible',
            }}>
                {/* Element badge (draggable) */}
                <DraggableBadge
                    badgeKey="element"
                    pos={bPos.element}
                    isTransformMode={isTransformMode}
                    isActive={activeBadgeId === 'badge-element'}
                    onSelect={() => handleSelect('element')}
                    onMove={handleMove}
                >
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
                </DraggableBadge>
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

            {/* ── Title only ── */}
            <div style={{
                position: 'absolute', left: pad, right: pad,
                top: artTop + artH + 10 * scale, zIndex: 5,
            }}>
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
            {showDescription && (
                <div style={{
                    position: 'absolute',
                    left: pad,
                    right: pad,
                    bottom: showStats ? (64 + (data.traits?.length ? 28 : 8)) * scale : (data.traits?.length ? 32 : 12) * scale,
                    zIndex: 5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: `0 ${4 * scale}px`,
                }}>
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
            )}

            {/* ── Traits row ── */}
            {data.traits && data.traits.length > 0 && (
                <div style={{
                    position: 'absolute', bottom: showStats ? 64 * scale : 10 * scale,
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
                    position: 'absolute', bottom: 6 * scale, left: 0, right: 0, height: 52 * scale,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'transparent',
                    zIndex: 5, padding: `0 ${pad}px`,
                    overflow: 'visible',
                }}>
                    {/* ATK badge (draggable) */}
                    <DraggableBadge
                        badgeKey="attack"
                        pos={bPos.attack}
                        isTransformMode={isTransformMode}
                        isActive={activeBadgeId === 'badge-attack'}
                        onSelect={() => handleSelect('attack')}
                        onMove={handleMove}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 * scale }}>
                            <div style={{
                                width: 60 * scale, height: 60 * scale, borderRadius: 999,
                                background: 'radial-gradient(circle, rgba(239,68,68,0.2), rgba(0,0,0,0.5))',
                                border: '1.5px solid rgba(239,68,68,0.5)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 10px rgba(239,68,68,0.3)',
                            }}>
                                <Sword size={22 * scale} color="#fca5a5" className="mb-[2px]" />
                                <span style={{ fontSize: 22 * scale, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
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
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 * scale }}>
                            <div style={{
                                width: 60 * scale, height: 60 * scale, borderRadius: 999,
                                background: 'radial-gradient(circle, rgba(74,222,128,0.2), rgba(0,0,0,0.5))',
                                border: '1.5px solid rgba(74,222,128,0.5)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 10px rgba(74,222,128,0.3)',
                            }}>
                                <Heart size={22 * scale} color="#86efac" className="mb-[2px]" />
                                <span style={{ fontSize: 22 * scale, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                                    {data.hp ?? 0}
                                </span>
                            </div>
                        </div>
                    </DraggableBadge>
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

            {/* ── Cost / Stars (Absolute Bottom Center) ── */}
            {data.cost !== undefined && data.cost > 0 && (
                <div className="absolute left-0 right-0 flex justify-center z-30 pointer-events-none" style={{ bottom: 18 * scale }}>
                    <div className="pointer-events-auto flex justify-center flex-wrap gap-1 bg-transparent border-none outline-none shadow-none">
                        <StarRating stars={data.cost} scale={scale * 0.9} />
                    </div>
                </div>
            )}
        </div>
    );
});

CardFrame.displayName = 'CardFrame';

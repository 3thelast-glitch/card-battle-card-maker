const fs = require('fs');
const path = require('path');

const cardFramePath = path.join(__dirname, 'src', 'ui', 'layout', 'components', 'ui', 'CardFrame.tsx');
let content = fs.readFileSync(cardFramePath, 'utf8');

const glitchLayout = `
        if (layout === 'glitch-artifact') {
            // ── Sub-components for Glitch ────────
            const GlitchLine = ({ top, color, delay, height = 2, opacity = 0.7 }: any) => (
                <div
                    className="absolute left-0 right-0 animate-[glitchScan_3s_ease-in-out_infinite]"
                    style={{
                        top, height: height * scale, opacity,
                        background: \`linear-gradient(90deg, transparent 0%, \${color} 30%, \${color} 70%, transparent 100%)\`,
                        animationDelay: delay,
                        mixBlendMode: 'screen',
                    }}
                />
            );

            const RGBSplit = ({ children, intensity = 2 }: any) => (
                <div className="relative">
                    <div className="absolute inset-0 text-red-500 opacity-70 pointer-events-none select-none"
                        style={{ transform: \`translateX(\${intensity * scale}px)\`, mixBlendMode: 'screen' }}>
                        {children}
                    </div>
                    <div className="absolute inset-0 text-blue-400 opacity-70 pointer-events-none select-none"
                        style={{ transform: \`translateX(-\${intensity * scale}px)\`, mixBlendMode: 'screen' }}>
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
                                left: \`\${5 + (i * 5.3) % 90}%\`,
                                top: \`\${8 + (i * 7.1) % 80}%\`,
                                width: \`\${(2 + i % 4) * scale}px\`,
                                height: \`\${(1 + i % 3) * scale}px\`,
                                background: ['#FF003C', '#00FFFF', '#FF00FF', '#FFFF00', '#FFFFFF'][i % 5],
                                opacity: 0.3 + (i % 4) * 0.15,
                                animationDelay: \`\${i * 0.22}s\`,
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
                    className={\`relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:brightness-110 \${onClick ? 'cursor-pointer' : ''} \${className}\`}
                    style={{
                        width: 350 * scale,
                        height: 480 * scale,
                        clipPath: \`polygon(\${20 * scale}px 0%, 100% 0%, 100% calc(100% - \${20 * scale}px), calc(100% - \${20 * scale}px) 100%, 0% 100%, 0% \${20 * scale}px)\`,
                        background: 'linear-gradient(160deg, #050005 0%, #000A08 35%, #080005 65%, #000000 100%)',
                        boxShadow: showGlow ? \`
                            0 0 0 \${1 * scale}px rgba(255,0,60,0.3),
                            0 \${40 * scale}px \${100 * scale}px rgba(255,0,100,0.4),
                            0 0 \${80 * scale}px rgba(0,255,255,0.1),
                            inset 0 0 \${100 * scale}px rgba(0,0,0,0.9)
                        \` : 'none',
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
                            backgroundImage: \`repeating-linear-gradient(0deg, transparent, transparent \${2*scale}px, rgba(255,255,255,1) \${2*scale}px, rgba(255,255,255,1) \${3*scale}px)\`,
                            backgroundSize: \`100% \${3 * scale}px\`,
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
                                backgroundImage: \`
                                    linear-gradient(rgba(0,255,200,0.03) \${1*scale}px, transparent \${1*scale}px),
                                    linear-gradient(90deg, rgba(0,255,200,0.03) \${1*scale}px, transparent \${1*scale}px)
                                \`,
                                backgroundSize: \`\${20 * scale}px \${20 * scale}px\`
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
                                    backgroundImage: \`url(\${data.imageUrl})\`,
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
                                        filter: \`blur(\${8 * scale}px)\`
                                    }} />

                                {/* Left Half — Digital */}
                                <div className="absolute top-[15px] left-[10px] rounded-full overflow-hidden"
                                    style={{
                                        width: 55 * scale, height: 100 * scale,
                                        background: 'linear-gradient(180deg, #001A10 0%, #000A08 100%)',
                                        border: \`\${1 * scale}px solid rgba(0,255,150,0.4)\`,
                                        boxShadow: \`0 0 \${20 * scale}px rgba(0,255,150,0.2)\`
                                    }}>
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className="mx-1 my-1 animate-[pulse_2s_ease-in-out_infinite]"
                                            style={{
                                                height: 2 * scale,
                                                background: \`rgba(0,255,\${100 + i * 20},\${0.3 + i * 0.06})\`,
                                                animationDelay: \`\${i * 0.2}s\`,
                                                width: \`\${40 + (i % 3) * 10}%\`
                                            }} />
                                    ))}
                                </div>

                                {/* Right Half — Organic */}
                                <div className="absolute top-[15px] right-[10px] rounded-full overflow-hidden"
                                    style={{
                                        width: 55 * scale, height: 100 * scale,
                                        background: 'linear-gradient(180deg, #1A0008 0%, #0A0003 100%)',
                                        border: \`\${1 * scale}px solid rgba(255,0,60,0.4)\`,
                                        boxShadow: \`0 0 \${20 * scale}px rgba(255,0,60,0.2)\`
                                    }}>
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="absolute rounded-full animate-[pulse_3s_ease-in-out_infinite]"
                                            style={{
                                                width: (30 + i * 4) * scale, height: (30 + i * 4) * scale,
                                                border: \`\${1 * scale}px solid rgba(255,\${30 + i * 15},\${i * 20},0.3)\`,
                                                top: '50%', left: '50%',
                                                transform: 'translate(-50%,-50%)',
                                                animationDelay: \`\${i * 0.4}s\`
                                            }} />
                                    ))}
                                </div>

                                {/* Central split line */}
                                <div className="absolute z-20"
                                    style={{
                                        top: 10 * scale, left: '50%', width: 2 * scale, bottom: 10 * scale,
                                        background: 'linear-gradient(to bottom, transparent, white, rgba(255,0,60,1), white, transparent)',
                                        boxShadow: \`0 0 \${8 * scale}px rgba(255,255,255,0.8)\`,
                                        animation: 'glitchScan 2s ease-in-out infinite'
                                    }} />

                                {/* Central Eye */}
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center animate-[pulse_1.5s_ease-in-out_infinite]"
                                    style={{
                                        width: 32 * scale, height: 32 * scale,
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle, #FF003C, #000)',
                                        boxShadow: \`0 0 \${20 * scale}px rgba(255,0,60,1), 0 0 \${40 * scale}px rgba(255,0,60,0.4)\`,
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
                                height: \`\${2 * scale}px\`,
                                background: 'linear-gradient(90deg, transparent 0%, rgba(255,0,60,0.8) 20%, rgba(0,255,255,0.8) 80%, transparent 100%)',
                                animation: 'glitchTear 4s ease-in-out infinite',
                                boxShadow: \`0 0 \${6 * scale}px rgba(255,100,100,0.9)\`
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
                                    border: \`\${1 * scale}px solid rgba(255,0,60,0.5)\`,
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
                                    padding: \`\${2 * scale}px\`,
                                    boxShadow: \`0 0 \${15 * scale}px \${elCfg.accent}90\`
                                }}>
                                <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: '#000' }}>
                                    <span style={{ fontSize: 12 * scale, filter: \`drop-shadow(0 0 2px \${elCfg.accent})\` }}>
                                        {elCfg.icon}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </DraggableBadge>

                    {/* Divider with Code Text */}
                    <div className="absolute left-0 right-0 flex items-center z-20" style={{ top: 263 * scale }}>
                        <div className="flex-1" style={{ height: \`\${1 * scale}px\`, background: 'linear-gradient(to right, transparent, rgba(255,0,60,0.6))' }} />
                        <span className="font-mono px-2"
                            style={{ color: 'rgba(0,255,200,0.6)', letterSpacing: '0.2em', fontSize: 8 * scale }}>
                            0xDEAD • CORRUPT
                        </span>
                        <div className="flex-1" style={{ height: \`\${1 * scale}px\`, background: 'linear-gradient(to left, transparent, rgba(0,255,200,0.6))' }} />
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
                        <div className="absolute left-0 right-0 text-center z-20" style={{ top: 270 * scale, padding: \`0 \${20 * scale}px\` }}>
                            <RGBSplit intensity={2.5}>
                                <h1 className="font-black tracking-[0.1em] text-white"
                                    style={{
                                        fontSize: 28 * scale,
                                        fontFamily: "'Noto Kufi Arabic', sans-serif",
                                        textShadow: \`0 0 \${25 * scale}px rgba(255,255,255,0.8)\`
                                    }}>
                                    {data.name || 'كيان الخلل'}
                                </h1>
                            </RGBSplit>
                            <div className="mt-1 font-mono tracking-[0.3em] animate-[pulse_2s_ease-in-out_infinite]"
                                style={{ color: 'rgba(0,255,200,0.5)', fontSize: 8 * scale }}>
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
                                    padding: \`\${7 * scale}px \${16 * scale}px\`,
                                    background: 'rgba(0,0,0,0.8)',
                                    border: \`\${1 * scale}px solid rgba(255,0,60,0.2)\`,
                                    borderLeft: \`\${2 * scale}px solid rgba(0,255,200,0.5)\`,
                                    borderRight: \`\${2 * scale}px solid rgba(255,0,60,0.5)\`
                                }}>
                                {/* Moving Scanline */}
                                <div className="absolute top-0 left-0 right-0 animate-[glitchScan_3s_linear_infinite]"
                                    style={{ height: \`\${1 * scale}px\`, background: 'linear-gradient(90deg, transparent, rgba(0,255,200,0.8), transparent)' }} />
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
                                            border: \`\${1 * scale}px solid rgba(255,0,60,0.4)\`,
                                            boxShadow: \`0 0 \${20 * scale}px rgba(255,0,60,0.3), inset 0 0 \${12 * scale}px rgba(0,0,0,0.9)\`
                                        }}>
                                        <span style={{ fontSize: 18 * scale, filter: \`drop-shadow(0 0 \${6 * scale}px rgba(255,0,60,1))\` }}>⚔️</span>
                                        <span className="font-black font-mono leading-tight"
                                            style={{ fontSize: 16 * scale, color: '#FF6080', textShadow: \`0 0 \${10 * scale}px rgba(255,0,60,0.9)\` }}>
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
                                            border: \`\${1 * scale}px solid rgba(0,255,150,0.4)\`,
                                            boxShadow: \`0 0 \${20 * scale}px rgba(0,255,150,0.3), inset 0 0 \${12 * scale}px rgba(0,0,0,0.9)\`
                                        }}>
                                        <span style={{ fontSize: 18 * scale, filter: \`drop-shadow(0 0 \${6 * scale}px rgba(0,255,150,1))\` }}>❤️</span>
                                        <span className="font-black font-mono leading-tight"
                                            style={{ fontSize: 16 * scale, color: '#00FF96', textShadow: \`0 0 \${10 * scale}px rgba(0,255,150,0.9)\` }}>
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
`;

content = content.replace(
    /\s+if\s*\(layout === 'full-bleed'\)\s*\{/g,
    glitchLayout + '\n\n        if (layout === \'full-bleed\') {'
);

fs.writeFileSync(cardFramePath, content, 'utf8');
console.log('Successfully injected Glitch Artifact block into CardFrame.tsx');

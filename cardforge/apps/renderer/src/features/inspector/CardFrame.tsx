import React, { useRef, useState, useCallback, useEffect } from 'react';

interface CardFrameProps {
  children: React.ReactNode;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  className?: string;
}

export const CardFrame = ({
  children,
  rarity = 'common',
  className = '',
}: CardFrameProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const requestRef = useRef<number>();

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const { clientX, clientY } = e;
    const rect = cardRef.current.getBoundingClientRect();

    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }

    requestRef.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;

      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;

      // Calculate rotation (-15 to 15 degrees)
      const rotateX = (0.5 - y) * 30;
      const rotateY = (x - 0.5) * 30;

      cardRef.current.style.setProperty('--mouse-x', x.toString());
      cardRef.current.style.setProperty('--mouse-y', y.toString());
      cardRef.current.style.setProperty('--rotate-x', `${rotateX}deg`);
      cardRef.current.style.setProperty('--rotate-y', `${rotateY}deg`);
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    if (cardRef.current) {
      cardRef.current.style.setProperty('--rotate-x', '0deg');
      cardRef.current.style.setProperty('--rotate-y', '0deg');
    }
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const isLegendary = rarity === 'legendary';

  return (
    <div
      ref={cardRef}
      className={`relative group perspective-1000 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
      style={
        {
          // Initialize CSS variables
          '--mouse-x': '0.5',
          '--mouse-y': '0.5',
          '--rotate-x': '0deg',
          '--rotate-y': '0deg',
          perspective: '1000px',
        } as React.CSSProperties
      }
    >
      {/* 3D Tilt Container */}
      <div
        className="relative w-full h-full transition-transform duration-300 ease-out transform-gpu"
        style={{
          transform: 'rotateX(var(--rotate-x)) rotateY(var(--rotate-y))',
        }}
      >
        {/* Card Content */}
        {children}

        {/* Refraction / Holographic Overlay */}
        <div
          className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden z-20 transition-opacity duration-500"
          style={{
            opacity: isHovering ? 1 : 0,
            mixBlendMode: 'color-dodge',
            background: `
              linear-gradient(
                115deg,
                transparent 20%,
                rgba(255, 255, 255, 0.4) 40%,
                rgba(255, 255, 255, 0.8) 50%,
                rgba(255, 255, 255, 0.4) 60%,
                transparent 80%
              ),
              radial-gradient(
                farthest-corner at calc(var(--mouse-x) * 100%) calc(var(--mouse-y) * 100%),
                rgba(255, 255, 255, 0.8) 0%,
                transparent 50%
              )
            `,
            backgroundSize: '100% 100%, 200% 200%',
            backgroundPosition:
              'calc(var(--mouse-x) * 100%) calc(var(--mouse-y) * 100%), 0 0',
          }}
        />

        {/* Legendary Sparkle / Noise Layer */}
        {isLegendary && (
          <div
            className="absolute inset-0 pointer-events-none z-30 opacity-0 group-hover:opacity-40 transition-opacity duration-300"
            style={{
              mixBlendMode: 'color-dodge',
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              maskImage:
                'radial-gradient(circle at calc(var(--mouse-x) * 100%) calc(var(--mouse-y) * 100%), black, transparent 60%)',
              WebkitMaskImage:
                'radial-gradient(circle at calc(var(--mouse-x) * 100%) calc(var(--mouse-y) * 100%), black, transparent 60%)',
            }}
          />
        )}

        {/* Border Glow for Active State */}
        <div
          className="absolute inset-0 rounded-xl border border-white/10 group-hover:border-white/40 transition-colors duration-300 pointer-events-none z-40"
          style={{
            boxShadow: isHovering
              ? '0 0 20px rgba(255,255,255,0.2) inset'
              : 'none',
          }}
        />
      </div>
    </div>
  );
};

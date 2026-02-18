import React, { useRef, useState, useCallback, useEffect } from 'react';

interface CardFrameProps {
  children: React.ReactNode;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  className?: string;
}

export const CardFrame = ({ children, rarity = 'common', className = '' }: CardFrameProps) => {
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
      
      // Clamp values between 0 and 1
      const clampedX = Math.max(0, Math.min(1, x));
      const clampedY = Math.max(0, Math.min(1, y));

      cardRef.current.style.setProperty('--mouse-x', clampedX.toString());
      cardRef.current.style.setProperty('--mouse-y', clampedY.toString());
    });
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
      onMouseLeave={() => setIsHovering(false)}
      style={{
        // Initialize CSS variables
        '--mouse-x': '0.5',
        '--mouse-y': '0.5',
        perspective: '1000px',
      } as React.CSSProperties}
    >
      {/* 3D Tilt Container */}
      <div
        className="relative w-full h-full transition-transform duration-100 ease-out transform-gpu"
        style={{
          transform: isHovering
            ? 'rotateX(calc((var(--mouse-y) - 0.5) * -15deg)) rotateY(calc((var(--mouse-x) - 0.5) * 15deg))'
            : 'rotateX(0deg) rotateY(0deg)',
        }}
      >
        {/* Card Content */}
        {children}

        {/* Refraction / Holographic Overlay */}
        <div
          className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden z-20 transition-opacity duration-500"
          style={{
            opacity: isHovering ? 1 : 0.15,
            mixBlendMode: 'overlay',
            background: `
              radial-gradient(
                circle at calc(var(--mouse-x) * 100%) calc(var(--mouse-y) * 100%),
                rgba(255, 255, 255, 0.8) 0%,
                rgba(255, 255, 255, 0.1) 40%,
                transparent 60%
              ),
              linear-gradient(
                115deg,
                transparent 30%,
                rgba(255, 255, 255, 0.3) 45%,
                rgba(255, 255, 255, 0.6) 50%,
                rgba(255, 255, 255, 0.3) 55%,
                transparent 70%
              )
            `,
            backgroundSize: '100% 100%, 200% 200%',
            backgroundPosition: '0 0, calc(var(--mouse-x) * 50%) calc(var(--mouse-y) * 50%)'
          }}
        />

        {/* Legendary Sparkle / Noise Layer */}
        {isLegendary && (
          <div
            className="absolute inset-0 pointer-events-none z-30 opacity-0 group-hover:opacity-40 transition-opacity duration-300"
            style={{
              mixBlendMode: 'color-dodge',
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              maskImage: 'radial-gradient(circle at calc(var(--mouse-x) * 100%) calc(var(--mouse-y) * 100%), black, transparent 60%)',
              WebkitMaskImage: 'radial-gradient(circle at calc(var(--mouse-x) * 100%) calc(var(--mouse-y) * 100%), black, transparent 60%)',
            }}
          />
        )}
        
        {/* Border Glow for Active State */}
        <div 
            className="absolute inset-0 rounded-xl border-2 border-white/0 group-hover:border-white/20 transition-colors duration-300 pointer-events-none z-40"
            style={{
                boxShadow: isHovering ? '0 0 20px rgba(255,255,255,0.1) inset' : 'none'
            }}
        />
      </div>
    </div>
  );
};
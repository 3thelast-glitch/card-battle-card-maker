import { useMemo, useCallback, useEffect, useRef, useState, type FC } from 'react';
import { Group, Rect, Text, Circle, Line } from 'react-konva';
import { motion, useAnimation } from 'framer-motion';
import { getElementGradient } from '../../utils/elementStyles';
import { TraitBadges } from './TraitBadges';
import { StatBadge } from './StatBadge';
import GoldParticles from '../../components/GoldParticles';

export { CardFrame } from '../../components/cards/CardFrame';

interface CardFrameProps {
  width: number;
  height: number;
  mainElement: string;
  strokeWidth?: number;
  traits?: string[];
  rarity?: string;
  title?: string;
  stats?: { attack: number; hp: number };
}

export const KonvaCardFrame: FC<CardFrameProps> = ({
  width,
  height,
  mainElement,
  strokeWidth = 0,
  traits = [],
  rarity = 'Common',
  title = '',
  stats,
}) => {
  const gradientConfig = useMemo(
    () => getElementGradient(mainElement, width, height),
    [mainElement, width, height]
  );

  // Calculate badge position (Top-Right)
  const badgePadding = 5;
  const badgeIconSize = 32;
  const padding = 12;
  const visibleCount = Math.min(traits.length, 4);
  const badgesWidth = visibleCount > 0 ? (visibleCount * badgeIconSize) + ((visibleCount - 1) * badgePadding) : 0;
  const badgesX = width - padding - badgesWidth;

  // Legendary Border Logic
  const isLegendary = rarity === 'Legendary';
  const innerBorderWidth = 3;
  const innerBorderColor = '#FFD700'; // Gold

  // حالة للتحكم في المؤثرات الأسطورية
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [lightningBolts, setLightningBolts] = useState<Array<{x: number, y: number, opacity: number}>>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const controls = useAnimation();

  // إعداد الصوت للمؤثرات
  useEffect(() => {
    if (isLegendary) {
      // إنشاء سياق الصوت
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContext) {
        audioRef.current = new AudioContext();
        console.log('🎵 تم تهيئة سياق الصوت للبطاقة الأسطورية');
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isLegendary]);

  // دالة لتشغيل صوت عند التمرير
  const playHoverSound = useCallback(() => {
    if (!audioRef.current || !isLegendary) return;
    
    try {
      const oscillator = audioRef.current.createOscillator();
      const gainNode = audioRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioRef.current.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioRef.current.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioRef.current.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.05, audioRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioRef.current.currentTime + 0.3);
      
      oscillator.start(audioRef.current.currentTime);
      oscillator.stop(audioRef.current.currentTime + 0.3);
      
      console.log('🎵 تشغيل صوت التمرير');
    } catch (error) {
      console.error('خطأ في تشغيل صوت التمرير:', error);
    }
  }, [isLegendary, audioRef]);

  // دالة لتشغيل صوت عند النقر
  const playClickSound = useCallback(() => {
    if (!audioRef.current || !isLegendary) return;
    
    try {
      const oscillator = audioRef.current.createOscillator();
      const gainNode = audioRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioRef.current.destination);
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(200, audioRef.current.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, audioRef.current.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.1, audioRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioRef.current.currentTime + 0.4);
      
      oscillator.start(audioRef.current.currentTime);
      oscillator.stop(audioRef.current.currentTime + 0.4);
      
      console.log('🎵 تشغيل صوت النقر');
    } catch (error) {
      console.error('خطأ في تشغيل صوت النقر:', error);
    }
  }, [isLegendary, audioRef]);

  // توليد صواعق البرق عند التمرير
  const generateLightningBolts = useCallback(() => {
    if (!isLegendary) return;
    
    const newBolts: Array<{x: number, y: number, opacity: number}> = [];
    const boltCount = Math.floor(Math.random() * 3) + 1; // 1-3 صواعق
    
    for (let i = 0; i < boltCount; i++) {
      newBolts.push({
        x: Math.random() * width,
        y: Math.random() * height,
        opacity: Math.random() * 0.7 + 0.3
      });
    }
    
    setLightningBolts(newBolts);
    console.log(`⚡ تم توليد ${boltCount} صاعق برق`);
  }, [isLegendary, width, height]);

  // معالجة أحداث التمرير
  const handleMouseEnter = useCallback(() => {
    if (!isLegendary) return;
    
    setIsHovered(true);
    playHoverSound();
    generateLightningBolts();
    
    // بدء حركة البطاقة
    controls.start({
      scale: 1.02,
      rotate: 1,
      transition: { duration: 0.3 }
    });
  }, [isLegendary, playHoverSound, generateLightningBolts, controls]);

  // معالجة أحداث مغادرة الماوس
  const handleMouseLeave = useCallback(() => {
    if (!isLegendary) return;
    
    setIsHovered(false);
    setLightningBolts([]);
    
    // إعادة البطاقة لحالتها الطبيعية
    controls.start({
      scale: 1,
      rotate: 0,
      transition: { duration: 0.3 }
    });
  }, [isLegendary, controls]);

  // معالجة أحداث النقر
  const handleClick = useCallback(() => {
    if (!isLegendary) return;
    
    playClickSound();
    
    // تأثير نبض عند النقر
    controls.start({
      scale: 1.05,
      transition: { duration: 0.1 }
    }).then(() => {
      controls.start({
        scale: isHovered ? 1.02 : 1,
        transition: { duration: 0.2 }
      });
    });
  }, [isLegendary, playClickSound, isHovered, controls]);

  return (
    <Group
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Main Background with Unified Gradient */}
      <Rect
        width={width}
        height={height}
        strokeWidth={strokeWidth}
        {...gradientConfig}
        fill={gradientConfig.fill || gradientConfig.stroke}
      />

      {/* Legendary Effects */}
      {isLegendary && (
        <>
          {/* 🌟 Animated Border Glow (neon + pulse) */}
          <Rect
            x={strokeWidth}
            y={strokeWidth}
            width={width - strokeWidth * 2}
            height={height - strokeWidth * 2}
            stroke={innerBorderColor}
            strokeWidth={innerBorderWidth}
            shadowColor={innerBorderColor}
            shadowBlur={isHovered ? 20 : 10}
            shadowOpacity={isHovered ? 0.8 : 0.5}
            listening={false}
          />
          
          {/* 🌈 Iridescent Gradient (chrome effect) */}
          <Rect
            x={strokeWidth + innerBorderWidth}
            y={strokeWidth + innerBorderWidth}
            width={width - (strokeWidth + innerBorderWidth) * 2}
            height={height - (strokeWidth + innerBorderWidth) * 2}
            stroke="url(#chrome-gradient)"
            strokeWidth={2}
            listening={false}
          />
          
          {/* تعريف التدرج اللوني الكرومي */}
          <defs>
            <linearGradient id="chrome-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="25%" stopColor="#FFA500" />
              <stop offset="50%" stopColor="#FF8C00" />
              <stop offset="75%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#FFA500" />
            </linearGradient>
          </defs>
          
          {/* 💎 3D Gem Effects على الزوايا */}
          <GemCorners 
            width={width} 
            height={height} 
            strokeWidth={strokeWidth} 
            innerBorderWidth={innerBorderWidth}
            isHovered={isHovered}
          />
          
          {/* ⚡ Lightning Bolts عند hover */}
          {lightningBolts.map((bolt, index) => (
            <LightningBolt 
              key={index} 
              x={bolt.x} 
              y={bolt.y} 
              opacity={bolt.opacity}
              width={width}
              height={height}
            />
          ))}
          
          {/* 🌟 Starfield خلفية خفيفة */}
          <Starfield 
            width={width} 
            height={height}
            isHovered={isHovered}
          />
          
          {/* ✨ Gold Particles Background */}
          <GoldParticles width={width} height={height} />
        </>
      )}

      {/* Title Text with Shadow */}
      {title && (
        <>
          {/* 🔥 Flame Trails خلف اسم البطاقة */}
          {isLegendary && (
            <FlameTrails 
              x={20} 
              y={20} 
              text={title} 
              fontSize={24}
              isHovered={isHovered}
            />
          )}
          
          {/* 🎭 Holographic Title (shimmer text) */}
          <Text
            x={20}
            y={20}
            text={title}
            fontSize={24}
            fontFamily="Cinzel, serif"
            fill={isLegendary ? "url(#title-gradient)" : "white"}
            shadowColor={isLegendary ? "#FFD700" : "black"}
            shadowBlur={isLegendary ? (isHovered ? 8 : 4) : 2}
            shadowOffset={{ x: 2, y: 2 }}
            shadowOpacity={isLegendary ? (isHovered ? 1 : 0.8) : 0.8}
          />
          
          {/* تعريف التدرج اللوني للعنوان */}
          {isLegendary && (
            <defs>
              <linearGradient id="title-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="25%" stopColor="#FFA500" />
                <stop offset="50%" stopColor="#FF8C00" />
                <stop offset="75%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#FFA500" />
              </linearGradient>
            </defs>
          )}
        </>
      )}

      <TraitBadges traits={traits} x={badgesX} y={padding} iconSize={badgeIconSize} padding={badgePadding} />

      {/* Stats Badges */}
      {stats && (
        <>
          <StatBadge
            value={stats.attack}
            type="attack"
            x={35}
            y={height - 35}
            radius={24}
          />
          <StatBadge
            value={stats.hp}
            type="hp"
            x={width - 35}
            y={height - 35}
            radius={24}
          />
        </>
      )}
      
      {/* 🌀 Floating Icons حول البطاقة */}
      {isLegendary && (
        <FloatingIcons 
          width={width} 
          height={height}
          isHovered={isHovered}
        />
      )}
    </Group>
  );
};

// مكون الجواهر في الزوايا
interface GemCornersProps {
  width: number;
  height: number;
  strokeWidth: number;
  innerBorderWidth: number;
  isHovered: boolean;
}

const GemCorners: FC<GemCornersProps> = ({ width, height, strokeWidth, innerBorderWidth, isHovered }) => {
  const gemSize = 12;
  const padding = 8;
  
  return (
    <Group>
      {/* الزاوية العلوية اليسرى */}
      <Circle
        x={strokeWidth + padding}
        y={strokeWidth + padding}
        radius={gemSize}
        fill="#FFD700"
        shadowColor="#FFD700"
        shadowBlur={isHovered ? 15 : 8}
        shadowOpacity={0.8}
        listening={false}
      />
      
      {/* الزاوية العلوية اليمنى */}
      <Circle
        x={width - strokeWidth - padding}
        y={strokeWidth + padding}
        radius={gemSize}
        fill="#FFD700"
        shadowColor="#FFD700"
        shadowBlur={isHovered ? 15 : 8}
        shadowOpacity={0.8}
        listening={false}
      />
      
      {/* الزاوية السفلية اليسرى */}
      <Circle
        x={strokeWidth + padding}
        y={height - strokeWidth - padding}
        radius={gemSize}
        fill="#FFD700"
        shadowColor="#FFD700"
        shadowBlur={isHovered ? 15 : 8}
        shadowOpacity={0.8}
        listening={false}
      />
      
      {/* الزاوية السفلية اليمنى */}
      <Circle
        x={width - strokeWidth - padding}
        y={height - strokeWidth - padding}
        radius={gemSize}
        fill="#FFD700"
        shadowColor="#FFD700"
        shadowBlur={isHovered ? 15 : 8}
        shadowOpacity={0.8}
        listening={false}
      />
    </Group>
  );
};

// مكون صاعق البرق
interface LightningBoltProps {
  x: number;
  y: number;
  opacity: number;
  width: number;
  height: number;
}

const LightningBolt: FC<LightningBoltProps> = ({ x, y, opacity, width, height }) => {
  // توليد مسار عشوائي للصاعق
  const generateBoltPath = useCallback((startX: number, startY: number, endX: number, endY: number): string => {
    const segments = 5;
    let path = `M ${startX} ${startY}`;
    
    for (let i = 1; i <= segments; i++) {
      const progress = i / segments;
      const currentX = startX + (endX - startX) * progress;
      const currentY = startY + (endY - startY) * progress;
      const offsetX = (Math.random() - 0.5) * 20;
      path += ` L ${currentX + offsetX} ${currentY}`;
    }
    
    return path;
  }, []);
  
  const boltPath = useMemo(
    () => generateBoltPath(x, 0, x + (Math.random() - 0.5) * 40, height),
    [x, height, generateBoltPath]
  );
  
  return (
    <Line
      points={boltPath.split(' ').map(Number).filter((n, i) => i % 2 === 0 || i % 2 === 1)}
      stroke="#FFD700"
      strokeWidth={2}
      opacity={opacity}
      shadowColor="#FFD700"
      shadowBlur={10}
      shadowOpacity={0.8}
      lineCap="round"
      lineJoin="round"
      listening={false}
    />
  );
};

// مكون حقل النجوم
interface StarfieldProps {
  width: number;
  height: number;
  isHovered: boolean;
}

const Starfield: FC<StarfieldProps> = ({ width, height, isHovered }) => {
  const stars = useMemo(() => {
    const starCount = 30;
    const newStars: Array<{x: number, y: number, radius: number, opacity: number}> = [];
    
    for (let i = 0; i < starCount; i++) {
      newStars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.2
      });
    }
    
    return newStars;
  }, [width, height]);
  
  return (
    <Group>
      {stars.map((star, index) => (
        <Circle
          key={index}
          x={star.x}
          y={star.y}
          radius={isHovered ? star.radius * 1.5 : star.radius}
          fill="white"
          opacity={isHovered ? star.opacity * 1.5 : star.opacity}
          listening={false}
        />
      ))}
    </Group>
  );
};

// مكون آثار اللهب خلف العنوان
interface FlameTrailsProps {
  x: number;
  y: number;
  text: string;
  fontSize: number;
  isHovered: boolean;
}

const FlameTrails: FC<FlameTrailsProps> = ({ x, y, text, fontSize, isHovered }) => {
  const flames = useMemo(() => {
    const flameCount = 5;
    const newFlames: Array<{x: number, y: number, scale: number, opacity: number}> = [];
    const textWidth = text.length * fontSize * 0.6;
    
    for (let i = 0; i < flameCount; i++) {
      newFlames.push({
        x: x + (textWidth / flameCount) * i + Math.random() * 10,
        y: y + fontSize + Math.random() * 5,
        scale: Math.random() * 0.5 + 0.5,
        opacity: Math.random() * 0.3 + 0.2
      });
    }
    
    return newFlames;
  }, [x, y, text, fontSize]);
  
  return (
    <Group>
      {flames.map((flame, index) => (
        <Circle
          key={index}
          x={flame.x}
          y={flame.y}
          radius={isHovered ? flame.scale * 8 : flame.scale * 5}
          fill={isHovered ? "#FF4500" : "#FF6347"}
          opacity={isHovered ? flame.opacity * 1.5 : flame.opacity}
          shadowColor="#FF4500"
          shadowBlur={isHovered ? 10 : 5}
          shadowOpacity={0.8}
          listening={false}
        />
      ))}
    </Group>
  );
};

// مكون الأيقونات العائمة حول البطاقة
interface FloatingIconsProps {
  width: number;
  height: number;
  isHovered: boolean;
}

const FloatingIcons: FC<FloatingIconsProps> = ({ width, height, isHovered }) => {
  const icons = useMemo(() => {
    const iconCount = 8;
    const newIcons: Array<{x: number, y: number, rotation: number, scale: number}> = [];
    
    for (let i = 0; i < iconCount; i++) {
      const angle = (i / iconCount) * Math.PI * 2;
      const radius = Math.min(width, height) * 0.45;
      
      newIcons.push({
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        rotation: angle * (180 / Math.PI),
        scale: Math.random() * 0.3 + 0.7
      });
    }
    
    return newIcons;
  }, [width, height]);
  
  return (
    <Group>
      {icons.map((icon, index) => (
        <Circle
          key={index}
          x={icon.x}
          y={icon.y}
          radius={isHovered ? icon.scale * 6 : icon.scale * 4}
          fill="#FFD700"
          opacity={isHovered ? 0.8 : 0.5}
          shadowColor="#FFD700"
          shadowBlur={isHovered ? 15 : 8}
          shadowOpacity={0.8}
          listening={false}
        />
      ))}
    </Group>
  );
};

import React, { useEffect, useRef, useState, useCallback, memo } from 'react';

// تعريف واجهة الجسيمات مع مساراتها
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: number;
  alpha: number;
  decay: number;
  trail: Array<{ x: number; y: number }>;
}

// تعريف خصائص المكون
interface GoldParticlesProps {
  width?: number;
  height?: number;
  particleCount?: number;
  fps?: number;
}

export const GoldParticles = memo(
  ({
    width = 300,
    height = 400,
    particleCount = 150,
    fps = 150,
  }: GoldParticlesProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);
    const [dimensions, setDimensions] = useState({ width, height });
    const isVisibleRef = useRef<boolean>(true);

    // إنشاء جسيمات ذهبية مع مسارات
    const createParticles = useCallback((): void => {
      const particles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * dimensions.width,
          y: Math.random() * dimensions.height,
          vx: (Math.random() - 0.5) * 2, // سرعة عشوائية في الاتجاه الأفقي
          vy: Math.random() * 2 + 1, // سرعة عشوائية في الاتجاه العمودي (لأسفل)
          radius: Math.random() * 3 + 1, // نصف قطر عشوائي بين 1 و 4
          hue: Math.random() * 10 + 50, // تدرج ذهبي بين 50-60
          alpha: Math.random() * 0.5 + 0.5, // شفافية عشوائية بين 0.5-1
          decay: Math.random() * 0.01 + 0.005, // معدل تلاشي عشوائي
          trail: [], // مسار الجسيم
        });
      }
      particlesRef.current = particles;
      console.log(`✨ تم إنشاء ${particleCount} جسيم ذهبي`);
    }, [particleCount, dimensions.width, dimensions.height]);

    // تحديث مواقع الجسيمات مع تطبيع الوقت
    const updateParticles = useCallback(
      (deltaTime: number): void => {
        const particles = particlesRef.current;
        const timeScale = deltaTime / 16.67; // تطبيع الوقت بناءً على 60fps

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // تحديث الموقع بالسرعة
          p.x += p.vx * timeScale;
          p.y += p.vy * timeScale;

          // إضافة الجاذبية
          p.vy += 0.05 * timeScale;

          // حفظ المسار
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 5) p.trail.shift();

          // الارتداد من الحواف
          if (p.x < 0 || p.x > dimensions.width) {
            p.vx *= -0.8; // ارتداد مع فقدان طاقة
            p.x = Math.max(0, Math.min(p.x, dimensions.width));
          }

          if (p.y < 0 || p.y > dimensions.height) {
            p.vy *= -0.6; // ارتداد مع فقدان طاقة أكبر (للأسفل)
            p.y = Math.max(0, Math.min(p.y, dimensions.height));
          }

          // تلاشي الجسيم وإعادة إنشائه
          p.alpha -= p.decay * timeScale;
          if (p.alpha <= 0) {
            p.x = Math.random() * dimensions.width;
            p.y = 0; // إعادة الجسيم من الأعلى
            p.vy = Math.random() * 2 + 1;
            p.alpha = Math.random() * 0.5 + 0.5;
            p.trail = [];
          }
        }
      },
      [dimensions.width, dimensions.height],
    );

    // رسم الجسيمات مع مساراتها
    const drawParticles = useCallback((): void => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // مسح الكانفاس
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // رسم كل جسيم
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // رسم المسار
        if (p.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let j = 1; j < p.trail.length; j++) {
            ctx.lineTo(p.trail[j].x, p.trail[j].y);
          }
          ctx.strokeStyle = `hsla(${p.hue}, 100%, 50%, ${p.alpha * 0.3})`;
          ctx.lineWidth = p.radius * 0.5;
          ctx.stroke();
        }

        // رسم الجسيم
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        // إضافة تأثير الظل
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsla(${p.hue}, 100%, 50%, ${p.alpha})`;

        // تعبئة الجسيم باللون الذهبي
        ctx.fillStyle = `hsla(${p.hue}, 100%, 50%, ${p.alpha})`;
        ctx.fill();
      }
    }, [dimensions.width, dimensions.height]);

    // حلقة التحريك المحسنة
    const animate = useCallback(
      (currentTime: number): void => {
        if (!isVisibleRef.current) return;

        const deltaTime = currentTime - lastTimeRef.current;
        lastTimeRef.current = currentTime;

        // تحديث ورسم الجسيمات
        updateParticles(deltaTime);
        drawParticles();

        // طلب الإطار التالي
        animationRef.current = requestAnimationFrame(animate);
      },
      [updateParticles, drawParticles],
    );

    // إعداد المكون عند التحميل
    useEffect(() => {
      console.log('🎨 GoldParticles: تم تهيئة مكون الجسيمات الذهبية');

      createParticles();
      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current != null) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [createParticles, animate]);

    // استخدام IntersectionObserver لتحسين الأداء
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isVisibleRef.current = entry.isIntersecting;
            if (entry.isIntersecting && animationRef.current == null) {
              animationRef.current = requestAnimationFrame(animate);
            }
          });
        },
        { threshold: 0.1 },
      );

      observer.observe(canvas);

      return () => {
        observer.disconnect();
      };
    }, [animate]);

    // التعامل مع تغيير الأبعاد
    useEffect(() => {
      const handleResize = useCallback((): void => {
        // الحصول على أبعاد الحاوية الأب
        const container = canvasRef.current?.parentElement;
        if (container) {
          const newWidth = container.clientWidth;
          const newHeight = container.clientHeight;

          console.log(
            `📐 GoldParticles: تغيير الأبعاد إلى ${newWidth}x${newHeight}`,
          );

          setDimensions({ width: newWidth, height: newHeight });
        }
      }, []);

      // إضافة مستمع لتغيير الحجم
      window.addEventListener('resize', handleResize);

      // استدعاء مرة واحدة عند التحميل
      handleResize();

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10,
          // تمكين تسريع GPU
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      />
    );
  },
);

export default GoldParticles;

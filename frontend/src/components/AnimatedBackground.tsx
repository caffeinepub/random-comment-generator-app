import { useEffect, useRef, useMemo } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: number;
}

interface FloatingIcon {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  type: 'circle' | 'square' | 'triangle' | 'diamond';
  hue: number;
}

// Green-blue hue range: 160 (emerald) to 210 (cyan/teal)
function randomTealHue() {
  return 160 + Math.random() * 50;
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastFrameTimeRef = useRef<number>(0);
  const isVisibleRef = useRef<boolean>(true);

  const particles = useMemo<Particle[]>(() => {
    const count = 40;
    return Array.from({ length: count }, () => ({
      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
      y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 2.5 + 1,
      hue: randomTealHue(),
    }));
  }, []);

  const floatingIcons = useMemo<FloatingIcon[]>(() => {
    const count = 14;
    const types: ('circle' | 'square' | 'triangle' | 'diamond')[] = ['circle', 'square', 'triangle', 'diamond'];
    return Array.from({ length: count }, () => ({
      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
      y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      size: Math.random() * 22 + 14,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.012,
      type: types[Math.floor(Math.random() * types.length)],
      hue: randomTealHue(),
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targetFPS = prefersReducedMotion ? 20 : 50;
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      if (!isVisibleRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const elapsed = currentTime - lastFrameTimeRef.current;

      if (elapsed > frameInterval) {
        lastFrameTimeRef.current = currentTime - (elapsed % frameInterval);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw particles — teal/cyan/emerald hues only
        particles.forEach((particle) => {
          particle.x += particle.vx;
          particle.y += particle.vy;

          if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
          if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

          // Slowly cycle within teal-cyan range (160–210)
          particle.hue = 160 + ((particle.hue - 160 + 0.3) % 50);

          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${particle.hue}, 80%, 60%, 0.45)`;
          ctx.fill();
        });

        // Draw floating geometric shapes
        floatingIcons.forEach((icon) => {
          icon.x += icon.vx;
          icon.y += icon.vy;
          icon.rotation += icon.rotationSpeed;

          if (icon.x < -icon.size) icon.x = canvas.width + icon.size;
          if (icon.x > canvas.width + icon.size) icon.x = -icon.size;
          if (icon.y < -icon.size) icon.y = canvas.height + icon.size;
          if (icon.y > canvas.height + icon.size) icon.y = -icon.size;

          icon.hue = 160 + ((icon.hue - 160 + 0.4) % 50);

          ctx.save();
          ctx.translate(icon.x, icon.y);
          ctx.rotate(icon.rotation);
          ctx.strokeStyle = `hsla(${icon.hue}, 80%, 65%, 0.28)`;
          ctx.lineWidth = 1.5;

          if (icon.type === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, icon.size / 2, 0, Math.PI * 2);
            ctx.stroke();
          } else if (icon.type === 'square') {
            ctx.strokeRect(-icon.size / 2, -icon.size / 2, icon.size, icon.size);
          } else if (icon.type === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(0, -icon.size / 2);
            ctx.lineTo(icon.size / 2, icon.size / 2);
            ctx.lineTo(-icon.size / 2, icon.size / 2);
            ctx.closePath();
            ctx.stroke();
          } else if (icon.type === 'diamond') {
            ctx.beginPath();
            ctx.moveTo(0, -icon.size / 2);
            ctx.lineTo(icon.size / 2, 0);
            ctx.lineTo(0, icon.size / 2);
            ctx.lineTo(-icon.size / 2, 0);
            ctx.closePath();
            ctx.stroke();
          }

          ctx.restore();
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [particles, floatingIcons]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.55 }}
    />
  );
}

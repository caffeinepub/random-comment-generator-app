import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      hue: number;
    }

    const particles: Particle[] = [];
    const particleCount = 60;

    // Initialize particles with vibrant colors
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 4 + 1,
        speedX: (Math.random() - 0.5) * 0.6,
        speedY: (Math.random() - 0.5) * 0.6,
        opacity: Math.random() * 0.6 + 0.3,
        hue: Math.random() * 360, // Full color spectrum
      });
    }

    // Floating icons
    interface FloatingIcon {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
      type: number;
      hue: number;
    }

    const floatingIcons: FloatingIcon[] = [];
    const iconCount = 20;

    for (let i = 0; i < iconCount; i++) {
      floatingIcons.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 25 + 20,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.03,
        opacity: Math.random() * 0.2 + 0.08,
        type: Math.floor(Math.random() * 3),
        hue: Math.random() * 360,
      });
    }

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw particles with glow effect
      particles.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Wrap around screen
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle with glow
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.shadowBlur = 20;
        ctx.shadowColor = `hsl(${particle.hue}, 85%, 65%)`;
        ctx.fillStyle = `hsl(${particle.hue}, 85%, 65%)`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw floating icons
      floatingIcons.forEach((icon) => {
        icon.x += icon.speedX;
        icon.y += icon.speedY;
        icon.rotation += icon.rotationSpeed;

        // Wrap around screen
        if (icon.x < -50) icon.x = canvas.width + 50;
        if (icon.x > canvas.width + 50) icon.x = -50;
        if (icon.y < -50) icon.y = canvas.height + 50;
        if (icon.y > canvas.height + 50) icon.y = -50;

        ctx.save();
        ctx.globalAlpha = icon.opacity;
        ctx.translate(icon.x, icon.y);
        ctx.rotate(icon.rotation);

        // Draw different icon shapes with vibrant colors
        ctx.strokeStyle = `hsl(${icon.hue}, 75%, 60%)`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        if (icon.type === 0) {
          // Star
          for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * icon.size;
            const y = Math.sin(angle) * icon.size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
        } else if (icon.type === 1) {
          // Circle
          ctx.arc(0, 0, icon.size * 0.6, 0, Math.PI * 2);
        } else {
          // Diamond
          ctx.moveTo(0, -icon.size * 0.7);
          ctx.lineTo(icon.size * 0.7, 0);
          ctx.lineTo(0, icon.size * 0.7);
          ctx.lineTo(-icon.size * 0.7, 0);
          ctx.closePath();
        }

        ctx.stroke();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  );
}

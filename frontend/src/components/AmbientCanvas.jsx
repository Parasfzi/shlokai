import { useRef, useEffect } from 'react';
import './AmbientCanvas.css';

/**
 * Subtle floating gold particle background.
 * Renders on a full-screen fixed canvas behind all content.
 */
export default function AmbientCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    class Particle {
      constructor(w, h) {
        this.w = w;
        this.h = h;
        this.reset();
      }
      reset() {
        this.x = Math.random() * this.w;
        this.y = Math.random() * this.h;
        this.size = Math.random() * 1.4 + 0.3;
        this.vx = (Math.random() - 0.5) * 0.12;
        this.vy = (Math.random() - 0.5) * 0.08;
        this.opacity = Math.random() * 0.25 + 0.04;
        this.fadeDir = Math.random() > 0.5 ? 1 : -1;
        this.fadeSpeed = Math.random() * 0.0015 + 0.0008;
        const hue = 35 + Math.random() * 18;
        const sat = 55 + Math.random() * 35;
        const lit = 48 + Math.random() * 22;
        this.color = `hsla(${hue},${sat}%,${lit}%,`;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.opacity += this.fadeDir * this.fadeSpeed;
        if (this.opacity <= 0.02 || this.opacity >= 0.3) this.fadeDir *= -1;
        if (this.x < -10 || this.x > this.w + 10 || this.y < -10 || this.y > this.h + 10) this.reset();
      }
      draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color + this.opacity + ')';
        ctx.fill();
      }
    }

    function init() {
      resize();
      const count = Math.min(Math.floor((canvas.width * canvas.height) / 14000), 100);
      particles = Array.from({ length: count }, () => new Particle(canvas.width, canvas.height));
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(ctx); });
      animId = requestAnimationFrame(animate);
    }

    init();
    animate();

    const handleResize = () => { init(); };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="ambient-canvas" aria-hidden="true" />;
}

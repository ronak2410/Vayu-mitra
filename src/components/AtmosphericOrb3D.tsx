'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { AQIStatus } from '@/types/vayumitra';
import { AQI_THEME_MAP } from '@/lib/aqiTheme';

interface AtmosphericOrb3DProps {
  aqi: number;
  status: AQIStatus;
  loading?: boolean;
}

/**
 * Interactive 3D glassmorphic AQI sphere with live Canvas particulate density.
 */
export default function AtmosphericOrb3D({ aqi, status, loading }: AtmosphericOrb3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const theme = AQI_THEME_MAP[status];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const size = 160;
    canvas.width = size;
    canvas.height = size;

    const particleCount = Math.min(85, Math.max(16, Math.round(aqi / 5)));
    const speedMult = status === 'Severe' ? 1.55 : status === 'Poor' ? 1.2 : 0.7;

    const particles = Array.from({ length: particleCount }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 58;
      return {
        x: size / 2 + Math.cos(angle) * dist,
        y: size / 2 + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.9 * speedMult,
        vy: (Math.random() - 0.5) * 0.9 * speedMult,
        r: Math.random() * 2.4 + 1.1,
        color: theme.orbParticles[Math.floor(Math.random() * theme.orbParticles.length)],
      };
    });

    const render = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 68, 0, Math.PI * 2);
      ctx.clip();

      for (const p of particles) {
        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          const dx = p.x - size / 2;
          const dy = p.y - size / 2;
          if (Math.hypot(dx, dy) > 64) {
            p.vx *= -1;
            p.vy *= -1;
          }
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
      ctx.restore();

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [aqi, status, theme.orbParticles, prefersReducedMotion]);

  return (
    <div className="relative w-40 h-40 shrink-0 flex items-center justify-center select-none">
      <motion.div
        animate={prefersReducedMotion ? undefined : { scale: [1, 1.07, 1], opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute inset-1 rounded-full bg-gradient-to-tr blur-xl ${theme.orbGradient}`}
      />

      <motion.div
        animate={prefersReducedMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 rounded-full border border-dashed border-slate-400/35"
      />

      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className={`relative w-36 h-36 rounded-full bg-gradient-to-br backdrop-blur-md border shadow-xl flex items-center justify-center overflow-hidden ${theme.orbGradient}`}
        style={{
          boxShadow:
            'inset -10px -12px 24px rgba(15, 23, 42, 0.12), inset 8px 8px 20px rgba(255, 255, 255, 0.75)',
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-85"
        />

        <div className="absolute top-2.5 left-5 w-12 h-5 rounded-full bg-white/55 blur-[2px] -rotate-25 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-xs px-3.5 py-1.5 rounded-2xl border border-white/80 shadow-xs">
          <motion.span
            key={aqi}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-3xl font-extrabold tracking-tight leading-none ${theme.orbText}`}
          >
            {loading ? '...' : aqi}
          </motion.span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">
            US AQI
          </span>
        </div>
      </motion.div>
    </div>
  );
}

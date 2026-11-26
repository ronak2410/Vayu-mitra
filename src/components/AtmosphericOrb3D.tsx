'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AQIStatus } from '@/types/vayumitra';

interface AtmosphericOrb3DProps {
  aqi: number;
  status: AQIStatus;
  loading?: boolean;
}

export default function AtmosphericOrb3D({ aqi, status, loading }: AtmosphericOrb3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    const colorPalette =
      status === 'Severe'
        ? ['rgba(244,63,94,0.85)', 'rgba(251,113,133,0.65)', 'rgba(251,146,60,0.6)']
        : status === 'Poor'
        ? ['rgba(249,115,22,0.85)', 'rgba(251,191,36,0.65)', 'rgba(244,63,94,0.45)']
        : status === 'Moderate'
        ? ['rgba(245,158,11,0.8)', 'rgba(251,191,36,0.6)', 'rgba(16,185,129,0.5)']
        : ['rgba(16,185,129,0.8)', 'rgba(52,211,153,0.6)', 'rgba(56,189,248,0.5)'];

    const particles = Array.from({ length: particleCount }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 58;
      return {
        x: size / 2 + Math.cos(angle) * dist,
        y: size / 2 + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.9 * speedMult,
        vy: (Math.random() - 0.5) * 0.9 * speedMult,
        r: Math.random() * 2.4 + 1.1,
        color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
      };
    });

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      // Clip to sphere
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 68, 0, Math.PI * 2);
      ctx.clip();

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        const dx = p.x - size / 2;
        const dy = p.y - size / 2;
        if (Math.hypot(dx, dy) > 64) {
          p.vx *= -1;
          p.vy *= -1;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [aqi, status]);

  const orbGradient =
    status === 'Severe'
      ? 'from-rose-500/25 via-rose-600/15 to-orange-500/20 border-rose-300/60 shadow-rose-500/25'
      : status === 'Poor'
      ? 'from-orange-500/25 via-amber-500/15 to-rose-500/15 border-orange-300/60 shadow-orange-500/20'
      : status === 'Moderate'
      ? 'from-amber-400/25 via-yellow-400/15 to-emerald-400/15 border-amber-300/60 shadow-amber-500/20'
      : 'from-emerald-400/25 via-teal-400/15 to-sky-400/20 border-emerald-300/60 shadow-emerald-500/25';

  const textColor =
    status === 'Severe'
      ? 'text-rose-700'
      : status === 'Poor'
      ? 'text-orange-700'
      : status === 'Moderate'
      ? 'text-amber-800'
      : 'text-emerald-800';

  return (
    <div className="relative w-40 h-40 shrink-0 flex items-center justify-center select-none">
      {/* Outer pulsing 3D aura */}
      <motion.div
        animate={{ scale: [1, 1.07, 1], opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute inset-1 rounded-full bg-gradient-to-tr blur-xl ${orbGradient}`}
      />

      {/* Orbiting 3D ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 rounded-full border border-dashed border-slate-400/35"
      />

      {/* Glassmorphic 3D Sphere */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className={`relative w-36 h-36 rounded-full bg-gradient-to-br backdrop-blur-md border shadow-xl flex items-center justify-center overflow-hidden ${orbGradient}`}
        style={{
          boxShadow:
            'inset -10px -12px 24px rgba(15, 23, 42, 0.12), inset 8px 8px 20px rgba(255, 255, 255, 0.75)',
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-85"
        />

        {/* Specular 3D glass reflection */}
        <div className="absolute top-2.5 left-5 w-12 h-5 rounded-full bg-white/55 blur-[2px] -rotate-25 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-xs px-3.5 py-1.5 rounded-2xl border border-white/80 shadow-xs">
          <motion.span
            key={aqi}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-3xl font-extrabold tracking-tight leading-none ${textColor}`}
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


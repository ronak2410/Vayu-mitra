'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AQIStatus } from '@/types/vayumitra';

interface DynamicSkyBackgroundProps {
  status: AQIStatus;
  pm25: number;
  windSpeedKmh: number;
}

/**
 * Full-viewport AQI-reactive atmospheric background with drifting particles,
 * wind streamlines, and reduced-motion accessibility support.
 */
export default function DynamicSkyBackground({
  status,
  pm25,
  windSpeedKmh,
}: DynamicSkyBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const count = Math.min(75, Math.max(18, Math.round(pm25 / 4)));
    const windDrift = Math.max(0.25, windSpeedKmh * 0.045);

    const dotColor =
      status === 'Severe'
        ? 'rgba(225, 29, 72, 0.22)'
        : status === 'Poor'
        ? 'rgba(234, 88, 12, 0.20)'
        : status === 'Moderate'
        ? 'rgba(217, 119, 6, 0.16)'
        : 'rgba(16, 185, 129, 0.18)';

    const motes = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 3.2 + 1.2,
      vx: (Math.random() * 0.5 + 0.25) * windDrift,
      vy: (Math.random() - 0.5) * 0.35,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = dotColor;
      for (const m of motes) {
        m.x += m.vx;
        m.y += m.vy;
        if (m.x > canvas.width + 10) m.x = -10;
        if (m.y > canvas.height + 10) m.y = -10;
        if (m.y < -10) m.y = canvas.height + 10;

        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [status, pm25, windSpeedKmh, prefersReducedMotion]);

  const theme =
    status === 'Severe'
      ? {
          base: 'from-rose-100/80 via-slate-200/85 to-orange-100/70',
          orb1: 'bg-rose-400/25',
          orb2: 'bg-amber-500/20',
          orb3: 'bg-slate-400/25',
          wave: 'rgba(244,63,94,0.18)',
          stream: 'rgba(225,29,72,0.22)',
        }
      : status === 'Poor'
      ? {
          base: 'from-orange-100/75 via-amber-50/80 to-slate-200/70',
          orb1: 'bg-orange-400/25',
          orb2: 'bg-amber-400/20',
          orb3: 'bg-rose-300/20',
          wave: 'rgba(249,115,22,0.18)',
          stream: 'rgba(234,88,12,0.22)',
        }
      : status === 'Moderate'
      ? {
          base: 'from-amber-50/80 via-emerald-50/70 to-sky-50/80',
          orb1: 'bg-amber-300/25',
          orb2: 'bg-emerald-300/20',
          orb3: 'bg-sky-300/20',
          wave: 'rgba(245,158,11,0.16)',
          stream: 'rgba(217,119,6,0.18)',
        }
      : {
          base: 'from-emerald-50/90 via-teal-50/75 to-sky-100/80',
          orb1: 'bg-emerald-400/25',
          orb2: 'bg-teal-300/25',
          orb3: 'bg-sky-400/20',
          wave: 'rgba(16,185,129,0.18)',
          stream: 'rgba(16,185,129,0.22)',
        };

  const streamDuration = Math.max(6, 18 - Math.min(12, Math.round(windSpeedKmh / 2)));

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Base AQI-reactive gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br transition-colors duration-1000 ${theme.base}`}
      />

      {/* 3D-depth floating atmospheric clouds */}
      <motion.div
        animate={prefersReducedMotion ? undefined : { x: [0, 35, 0], y: [0, -25, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full blur-3xl ${theme.orb1}`}
      />
      <motion.div
        animate={prefersReducedMotion ? undefined : { x: [0, -40, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute top-1/4 -right-24 w-[480px] h-[480px] rounded-full blur-3xl ${theme.orb2}`}
      />
      <motion.div
        animate={prefersReducedMotion ? undefined : { x: [0, 25, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute -bottom-32 left-1/3 w-[520px] h-[520px] rounded-full blur-3xl ${theme.orb3}`}
      />

      {/* Animated wind-speed streamlines */}
      {!prefersReducedMotion && (
        <svg className="absolute inset-0 w-full h-full opacity-45" preserveAspectRatio="none">
          <motion.path
            d="M -200 180 Q 320 120, 820 200 T 1800 160"
            fill="none"
            stroke={theme.stream}
            strokeWidth="2"
            strokeDasharray="16 24"
            animate={{ strokeDashoffset: [0, -240] }}
            transition={{ duration: streamDuration, repeat: Infinity, ease: 'linear' }}
          />
          <motion.path
            d="M -150 420 Q 420 360, 960 440 T 1900 390"
            fill="none"
            stroke={theme.stream}
            strokeWidth="1.5"
            strokeDasharray="12 28"
            animate={{ strokeDashoffset: [0, -240] }}
            transition={{ duration: streamDuration * 1.2, repeat: Infinity, ease: 'linear' }}
          />
        </svg>
      )}

      {/* Live drifting particulate canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Subtle animated atmospheric air-current waves */}
      <motion.svg
        animate={prefersReducedMotion ? undefined : { x: [0, -60, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-0 left-0 w-[120%] h-48 opacity-30"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          fill={theme.wave}
          d="M0,192L60,186.7C120,181,240,171,360,186.7C480,203,600,245,720,240C840,235,960,181,1080,165.3C1200,149,1320,171,1380,181.3L1440,192L1440,320L0,320Z"
        />
      </motion.svg>
    </div>
  );
}

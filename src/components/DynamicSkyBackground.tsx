'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { AQIStatus } from '@/types/vayumitra';
import { AQI_THEME_MAP } from '@/lib/aqiTheme';

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
  const theme = AQI_THEME_MAP[status];

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

    const motes = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 3.2 + 1.2,
      vx: (Math.random() * 0.5 + 0.25) * windDrift,
      vy: (Math.random() - 0.5) * 0.35,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = theme.dotColor;
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
  }, [theme.dotColor, pm25, windSpeedKmh, prefersReducedMotion]);

  const streamDuration = Math.max(6, 18 - Math.min(12, Math.round(windSpeedKmh / 2)));

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className={`absolute inset-0 bg-gradient-to-br transition-colors duration-1000 ${theme.skyBase}`}
      />

      <motion.div
        animate={prefersReducedMotion ? undefined : { x: [0, 35, 0], y: [0, -25, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full blur-3xl ${theme.skyOrbs[0]}`}
      />
      <motion.div
        animate={prefersReducedMotion ? undefined : { x: [0, -40, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute top-1/4 -right-24 w-[480px] h-[480px] rounded-full blur-3xl ${theme.skyOrbs[1]}`}
      />
      <motion.div
        animate={prefersReducedMotion ? undefined : { x: [0, 25, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute -bottom-32 left-1/3 w-[520px] h-[520px] rounded-full blur-3xl ${theme.skyOrbs[2]}`}
      />

      {!prefersReducedMotion && (
        <svg className="absolute inset-0 w-full h-full opacity-45" preserveAspectRatio="none">
          <motion.path
            d="M -200 180 Q 320 120, 820 200 T 1800 160"
            fill="none"
            stroke={theme.skyStream}
            strokeWidth="2"
            strokeDasharray="16 24"
            animate={{ strokeDashoffset: [0, -240] }}
            transition={{ duration: streamDuration, repeat: Infinity, ease: 'linear' }}
          />
          <motion.path
            d="M -150 420 Q 420 360, 960 440 T 1900 390"
            fill="none"
            stroke={theme.skyStream}
            strokeWidth="1.5"
            strokeDasharray="12 28"
            animate={{ strokeDashoffset: [0, -240] }}
            transition={{ duration: streamDuration * 1.2, repeat: Infinity, ease: 'linear' }}
          />
        </svg>
      )}

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <motion.svg
        animate={prefersReducedMotion ? undefined : { x: [0, -60, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-0 left-0 w-[120%] h-48 opacity-30"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          fill={theme.skyWave}
          d="M0,192L60,186.7C120,181,240,171,360,186.7C480,203,600,245,720,240C840,235,960,181,1080,165.3C1200,149,1320,171,1380,181.3L1440,192L1440,320L0,320Z"
        />
      </motion.svg>
    </div>
  );
}

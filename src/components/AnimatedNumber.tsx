'use client';

import React, { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  durationMs?: number;
  className?: string;
}

/**
 * Smoothly interpolates numeric telemetry values for live AQI and impact counters.
 */
export default function AnimatedNumber({
  value,
  decimals = 0,
  durationMs = 450,
  className = '',
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const startVal = display;
    const diff = value - startVal;
    if (Math.abs(diff) < 0.01) {
      return;
    }

    let frameId: number;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(startVal + diff * eased);
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs]);

  return <span className={className}>{display.toFixed(decimals)}</span>;
}


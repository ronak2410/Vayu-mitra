'use client';

import React, { useEffect, useRef, useState } from 'react';

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
  const currentRef = useRef(value);

  useEffect(() => {
    const startVal = currentRef.current;
    const diff = value - startVal;
    if (Math.abs(diff) < 0.01) {
      return;
    }

    let frameId: number;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = startVal + diff * eased;
      currentRef.current = next;
      setDisplay(next);
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value, durationMs]);

  return <span className={className}>{display.toFixed(decimals)}</span>;
}

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Wind, CheckCircle2 } from 'lucide-react';
import type { AQIData, HouseholdProfile } from '@/types/vayumitra';
import { formatVulnerableGroups } from '@/lib/aqiService';

interface SmogAlertBannerProps {
  aqiData: AQIData;
  profile: HouseholdProfile;
}

/**
 * Displays an immediate, household-specific smog protocol banner when AQI > 150
 * or winter atmospheric inversion risk is High.
 */
export default function SmogAlertBanner({ aqiData, profile }: SmogAlertBannerProps) {
  const isHighAlert = aqiData.aqi > 150 || aqiData.weather.inversionRisk === 'High';
  if (!isHighAlert) return null;

  const groupLabel = formatVulnerableGroups(profile.vulnerableGroups, 'all household members');

  return (
    <motion.div
      role="alert"
      aria-live="polite"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-rose-200/90 bg-gradient-to-r from-rose-50/95 via-amber-50/85 to-white/90 backdrop-blur-md px-4 py-3 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div className="flex items-start sm:items-center gap-2.5">
        <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
          <ShieldAlert className="w-4 h-4" aria-hidden="true" />
        </div>
        <div className="text-xs">
          <p className="font-bold text-rose-950">
            Active Smog Protocol for {groupLabel} ({profile.city})
          </p>
          <p className="text-rose-800 mt-0.5">
            {aqiData.aqi > 300
              ? 'Severe PM2.5 levels: Pause outdoor exercise, run indoor HEPA/box-fan continuously, and wear N95 outdoors.'
              : 'Elevated smog / inversion trap: Keep windows sealed until the afternoon Safe Window and use N95 near traffic.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-800 bg-white/90 border border-emerald-200 px-3 py-1.5 rounded-xl shrink-0 self-start sm:self-center">
        <Wind className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
        <span>Trap Risk: {aqiData.weather.inversionRisk}</span>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
      </div>
    </motion.div>
  );
}


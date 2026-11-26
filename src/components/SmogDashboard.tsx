'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ShieldCheck,
  Clock,
  Wind,
  Activity,
  Droplets,
  Sparkles,
  Thermometer,
  Gauge,
} from 'lucide-react';
import { AQIData, HouseholdProfile, HourlyAQIPoint } from '@/types/vayumitra';
import { formatVulnerableGroups } from '@/lib/aqiService';
import AtmosphericOrb3D from '@/components/AtmosphericOrb3D';
import TiltCard from '@/components/TiltCard';
import AnimatedNumber from '@/components/AnimatedNumber';

interface SmogDashboardProps {
  aqiData: AQIData;
  profile: HouseholdProfile;
  loading: boolean;
}

function getStatusStyles(status: AQIData['status']) {
  switch (status) {
    case 'Good':
      return {
        bg: 'bg-gradient-to-br from-emerald-50/90 via-white/80 to-teal-50/70 border-emerald-200/80',
        text: 'text-emerald-900',
        badge: 'bg-emerald-600 text-white shadow-emerald-500/30',
      };
    case 'Moderate':
      return {
        bg: 'bg-gradient-to-br from-amber-50/90 via-white/80 to-yellow-50/70 border-amber-200/80',
        text: 'text-amber-950',
        badge: 'bg-amber-500 text-white shadow-amber-500/30',
      };
    case 'Poor':
      return {
        bg: 'bg-gradient-to-br from-orange-50/90 via-white/80 to-amber-50/70 border-orange-200/80',
        text: 'text-orange-950',
        badge: 'bg-orange-600 text-white shadow-orange-500/30',
      };
    case 'Severe':
      return {
        bg: 'bg-gradient-to-br from-rose-50/90 via-white/85 to-orange-50/60 border-rose-200/80',
        text: 'text-rose-950',
        badge: 'bg-rose-600 text-white shadow-rose-500/30',
      };
  }
}

function getHouseholdRiskMessage(aqiData: AQIData, profile: HouseholdProfile): string {
  const hasGroups = profile.vulnerableGroups.length > 0;
  const label = formatVulnerableGroups(profile.vulnerableGroups, '');

  if (aqiData.status === 'Severe') {
    return hasGroups
      ? `Critical Risk for ${label} today — stay indoors`
      : 'Severe Smog Alert — avoid outdoor exertion';
  }
  if (aqiData.status === 'Poor') {
    return hasGroups
      ? `High Sensitivity Alert for ${label} — limit outdoor time`
      : 'Poor Air Quality — wear N95 mask outdoors';
  }
  if (aqiData.status === 'Moderate') {
    return hasGroups
      ? `Moderate Caution for ${label} during peak traffic`
      : 'Moderate Air Quality — safe for most activities';
  }
  return 'Good Air Quality — ideal for outdoor ventilation';
}

export default function SmogDashboard({ aqiData, profile, loading }: SmogDashboardProps) {
  const [hoveredHour, setHoveredHour] = useState<HourlyAQIPoint | null>(null);
  const styles = getStatusStyles(aqiData.status);

  const maxPm25 = Math.max(...aqiData.hourly.map((h) => h.pm25), 100);
  const bestHours = [...aqiData.hourly]
    .sort((a, b) => a.pm25 - b.pm25)
    .slice(0, 3)
    .map((h) => h.hour)
    .join(', ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-5"
    >
      {/* Top Row: 3D Atmospheric Orb + Pollutant 3D Tilt Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5">
          <TiltCard
            className={`rounded-3xl border p-5 flex flex-col sm:flex-row items-center gap-5 shadow-lg backdrop-blur-md ${styles.bg}`}
            glowColor="rgba(255,255,255,0.45)"
          >
            <AtmosphericOrb3D aqi={aqiData.aqi} status={aqiData.status} loading={loading} />

            <div className="space-y-2.5 min-w-0 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm ${styles.badge}`}
                >
                  {aqiData.status}
                </span>
              </div>
              <p
                className="text-xs font-semibold text-slate-600 truncate"
                title={aqiData.locationLabel}
              >
                {aqiData.locationLabel}
              </p>
              <div className="flex items-start justify-center sm:justify-start gap-1.5 pt-0.5">
                {aqiData.status === 'Good' ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                )}
                <p className={`text-xs font-bold leading-snug ${styles.text}`}>
                  {getHouseholdRiskMessage(aqiData, profile)}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-[10px] font-semibold text-slate-600">
                <span className="inline-flex items-center gap-1 bg-white/75 px-2 py-0.5 rounded-full border border-slate-200/70">
                  <Thermometer className="w-3 h-3 text-amber-600" />
                  {aqiData.weather.temperatureC}°C • {aqiData.weather.humidityPct}% RH
                </span>
                <span className="inline-flex items-center gap-1 bg-white/75 px-2 py-0.5 rounded-full border border-slate-200/70">
                  <Gauge className="w-3 h-3 text-sky-600" />
                  Wind {aqiData.weather.windSpeedKmh} km/h • Trap:{' '}
                  <strong
                    className={
                      aqiData.weather.inversionRisk === 'High'
                        ? 'text-rose-600'
                        : aqiData.weather.inversionRisk === 'Moderate'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }
                  >
                    {aqiData.weather.inversionRisk}
                  </strong>
                </span>
              </div>
            </div>
          </TiltCard>
        </div>

        {/* 3D Pollutant Tilt Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TiltCard
            className="bg-white/85 backdrop-blur-md rounded-3xl border border-slate-200/80 p-5 shadow-md flex flex-col justify-between"
            glowColor="rgba(16, 185, 129, 0.16)"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold tracking-wide uppercase">PM2.5</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Wind className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <span className="text-3xl font-extrabold text-slate-900">
                <AnimatedNumber value={aqiData.pm25} />
              </span>
              <span className="text-xs font-medium text-slate-500 ml-1">µg/m³</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Fine inhalable particles (WHO limit: 15)
            </p>
          </TiltCard>

          <TiltCard
            className="bg-white/85 backdrop-blur-md rounded-3xl border border-slate-200/80 p-5 shadow-md flex flex-col justify-between"
            glowColor="rgba(245, 158, 11, 0.16)"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold tracking-wide uppercase">PM10</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Droplets className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <span className="text-3xl font-extrabold text-slate-900">
                <AnimatedNumber value={aqiData.pm10} />
              </span>
              <span className="text-xs font-medium text-slate-500 ml-1">µg/m³</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Coarse road & construction dust
            </p>
          </TiltCard>

          <TiltCard
            className="bg-white/85 backdrop-blur-md rounded-3xl border border-slate-200/80 p-5 shadow-md flex flex-col justify-between"
            glowColor="rgba(99, 102, 241, 0.16)"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold tracking-wide uppercase">NO₂</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <span className="text-3xl font-extrabold text-slate-900">
                <AnimatedNumber value={aqiData.no2} />
              </span>
              <span className="text-xs font-medium text-slate-500 ml-1">µg/m³</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Traffic & combustion gas
            </p>
          </TiltCard>
        </div>
      </div>

      {/* Animated Safe Window 24-Hour Timeline */}
      <div className="bg-white/85 backdrop-blur-md rounded-3xl border border-slate-200/80 p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              24-Hour Safe Window Timeline (Hourly PM2.5)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Best ventilation / outdoor windows today:{' '}
              <span className="font-bold text-emerald-700">{bestHours}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-xs" /> Safe
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-xs" /> Caution
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-xs" /> Avoid
            </span>
          </div>
        </div>

        <div className="relative h-32 flex items-end gap-1.5 pt-4">
          {aqiData.hourly.map((point, idx) => {
            const heightPct = Math.max(14, Math.round((point.pm25 / maxPm25) * 100));
            const barColor =
              point.safeLevel === 'safe'
                ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-emerald-500/20'
                : point.safeLevel === 'caution'
                ? 'bg-gradient-to-t from-amber-500 to-amber-300 shadow-amber-500/20'
                : 'bg-gradient-to-t from-rose-600 to-rose-400 shadow-rose-500/20';

            return (
              <div
                key={point.hour}
                onMouseEnter={() => setHoveredHour(point)}
                onMouseLeave={() => setHoveredHour(null)}
                className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
              >
                <motion.div
                  initial={{ height: 0, opacity: 0.4 }}
                  animate={{ height: `${heightPct}%`, opacity: 1 }}
                  transition={{ duration: 0.45, delay: idx * 0.015, ease: 'easeOut' }}
                  whileHover={{ scaleY: 1.06, filter: 'brightness(1.08)' }}
                  style={{ originY: 1 }}
                  className={`w-full rounded-t-lg shadow-sm ${barColor}`}
                />
              </div>
            );
          })}
        </div>

        <div className="flex justify-between text-[10px] font-medium text-slate-400 mt-2 px-0.5">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>

        <div className="mt-2.5 min-h-[22px] text-xs text-slate-600 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          {hoveredHour ? (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <strong>{hoveredHour.hour}</strong> — PM2.5:{' '}
              <strong>{hoveredHour.pm25} µg/m³</strong> (AQI ~{hoveredHour.aqi}) •{' '}
              <span className="capitalize font-bold">{hoveredHour.safeLevel}</span>
            </motion.span>
          ) : (
            <span className="text-slate-400">
              Hover any 3D bar to inspect hourly PM2.5 & outdoor safety
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Car, Bike, Train, Footprints, Route, ShieldAlert, Leaf } from 'lucide-react';
import { AQIData, CommuteMode } from '@/types/vayumitra';
import TiltCard from '@/components/TiltCard';

const MODES: {
  mode: CommuteMode;
  icon: React.ReactNode;
  co2PerKmKg: number;
  exposureMult: number;
  label: string;
}[] = [
  { mode: 'Metro/Bus', icon: <Train className="w-4 h-4" />, co2PerKmKg: 0.04, exposureMult: 0.55, label: 'Metro / AC Bus' },
  { mode: 'Car', icon: <Car className="w-4 h-4" />, co2PerKmKg: 0.19, exposureMult: 0.65, label: 'Private Car (Recirculate)' },
  { mode: 'Two-wheeler', icon: <Bike className="w-4 h-4" />, co2PerKmKg: 0.08, exposureMult: 1.45, label: 'Two-Wheeler (Open Air)' },
  { mode: 'Walk/Cycle', icon: <Footprints className="w-4 h-4" />, co2PerKmKg: 0, exposureMult: 1.7, label: 'Walk / Cycle' },
];

export default function CommutePlanner({ aqiData }: { aqiData: AQIData }) {
  const [distanceKm, setDistanceKm] = useState(8);

  const bestHour = [...aqiData.hourly].sort((a, b) => a.pm25 - b.pm25)[0];
  const needsN95 = aqiData.aqi > 150;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.12 }}
      className="bg-white/85 backdrop-blur-md rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-md space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Route className="w-4 h-4 text-emerald-600" />
            Smart Low-Emission Commute &amp; Exposure Planner
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Live comparison for a <strong>{distanceKm} km</strong> trip • Best departure today:{' '}
            <strong className="text-emerald-700">{bestHour?.hour || '13:00'}</strong> (PM2.5 ~
            {bestHour?.pm25 ?? aqiData.pm25} µg/m³)
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Trip: <strong className="text-emerald-700">{distanceKm} km</strong>
          </span>
          <input
            type="range"
            min={1}
            max={30}
            value={distanceKm}
            aria-label="Trip distance in kilometers"
            onChange={(e) => setDistanceKm(Number(e.target.value))}
            className="w-28 accent-emerald-600 cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {MODES.map((m) => {
          const co2Kg = (m.co2PerKmKg * distanceKm).toFixed(2);
          const effectivePm25 = Math.round(aqiData.pm25 * m.exposureMult);
          const isRecommended =
            m.mode === 'Metro/Bus' || (m.mode === 'Walk/Cycle' && aqiData.aqi <= 100);

          return (
            <TiltCard
              key={m.mode}
              className={`rounded-2xl border p-4 flex flex-col justify-between transition ${
                isRecommended
                  ? 'bg-emerald-50/80 border-emerald-300 shadow-sm'
                  : 'bg-white/80 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <span className="p-1.5 rounded-lg bg-white border border-slate-200 text-emerald-600">
                    {m.icon}
                  </span>
                  {m.label}
                </span>
              </div>

              <div className="space-y-1.5 text-xs my-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">In-transit PM2.5:</span>
                  <strong
                    className={
                      effectivePm25 > 120
                        ? 'text-rose-600'
                        : effectivePm25 > 50
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }
                  >
                    ~{effectivePm25} µg/m³
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trip Emissions:</span>
                  <strong className="text-slate-800">{co2Kg} kg CO₂</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px] font-bold">
                {isRecommended ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <Leaf className="w-3 h-3" /> Best Choice Today
                  </span>
                ) : needsN95 && (m.mode === 'Two-wheeler' || m.mode === 'Walk/Cycle') ? (
                  <span className="inline-flex items-center gap-1 text-rose-600">
                    <ShieldAlert className="w-3 h-3" /> N95 Mask Required
                  </span>
                ) : (
                  <span className="text-slate-500">Use AC Recirculate</span>
                )}
              </div>
            </TiltCard>
          );
        })}
      </div>
    </motion.div>
  );
}


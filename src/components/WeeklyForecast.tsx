'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { DailyForecastPoint } from '@/types/vayumitra';
import TiltCard from '@/components/TiltCard';

export default function WeeklyForecast({
  forecast,
}: {
  forecast?: DailyForecastPoint[];
}) {
  if (!forecast || forecast.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.13 }}
      className="bg-white/85 backdrop-blur-md rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-md space-y-4"
    >
      <div>
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-emerald-600" />
          5-Day Live Smog Forecast &amp; Outdoor Readiness
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Plan school commutes, elderly walks &amp; weekend errands ahead of smog spikes
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {forecast.map((day) => {
          const badgeStyle =
            day.readiness === 'Good'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : day.readiness === 'Caution'
              ? 'bg-amber-100 text-amber-800 border-amber-200'
              : 'bg-rose-100 text-rose-800 border-rose-200';

          const Icon =
            day.readiness === 'Good'
              ? CheckCircle2
              : day.readiness === 'Caution'
              ? AlertTriangle
              : ShieldAlert;

          return (
            <TiltCard
              key={day.dateLabel}
              className="rounded-2xl border border-slate-200/80 bg-white/80 p-3.5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">{day.dateLabel}</span>
                <Icon
                  className={`w-3.5 h-3.5 ${
                    day.readiness === 'Good'
                      ? 'text-emerald-600'
                      : day.readiness === 'Caution'
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}
                  aria-hidden="true"
                />
              </div>
              <div className="my-1">
                <span className="text-xl font-extrabold text-slate-900">{day.avgAqi}</span>
                <span className="text-[10px] text-slate-500 ml-1">avg AQI</span>
              </div>
              <div className="flex items-center justify-between gap-1 mt-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                  {day.readiness}
                </span>
                <span className="text-[10px] text-slate-500">Peak {day.maxPm25}</span>
              </div>
            </TiltCard>
          );
        })}
      </div>
    </motion.div>
  );
}


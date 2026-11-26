'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Wind, ArrowUpRight, Loader2 } from 'lucide-react';
import { AQIData, SavedLocation } from '@/types/vayumitra';
import { fetchLiveAQI } from '@/lib/aqiService';
import TiltCard from '@/components/TiltCard';

interface MultiCityRadarProps {
  savedLocations: SavedLocation[];
  activeCity: string;
  onSelectLocation: (loc: SavedLocation) => void;
}

export default function MultiCityRadar({
  savedLocations,
  activeCity,
  onSelectLocation,
}: MultiCityRadarProps) {
  const [cityData, setCityData] = useState<Record<string, AQIData>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadAll = async () => {
      if (savedLocations.length === 0) return;
      setLoading(true);
      const entries = await Promise.all(
        savedLocations.map(async (loc) => {
          try {
            const data = await fetchLiveAQI(loc.lat, loc.lon, loc.city);
            return [loc.id, data] as const;
          } catch {
            return null;
          }
        })
      );
      if (!cancelled) {
        const map: Record<string, AQIData> = {};
        for (const entry of entries) {
          if (entry) map[entry[0]] = entry[1];
        }
        setCityData(map);
        setLoading(false);
      }
    };
    loadAll();
    return () => {
      cancelled = true;
    };
  }, [savedLocations]);

  if (savedLocations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.14 }}
      className="bg-white/85 backdrop-blur-md rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-md space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600" />
            Multi-City Live Air Quality Radar
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time side-by-side comparison across your saved cities &amp; neighborhoods
          </p>
        </div>
        {loading && <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {savedLocations.map((loc) => {
          const live = cityData[loc.id];
          const isCurrent = loc.city === activeCity;
          const badgeColor =
            !live
              ? 'bg-slate-100 text-slate-600'
              : live.status === 'Good'
              ? 'bg-emerald-100 text-emerald-800'
              : live.status === 'Moderate'
              ? 'bg-amber-100 text-amber-800'
              : live.status === 'Poor'
              ? 'bg-orange-100 text-orange-800'
              : 'bg-rose-100 text-rose-800';

          return (
            <TiltCard
              key={loc.id}
              className={`rounded-2xl border p-4 cursor-pointer transition ${
                isCurrent
                  ? 'bg-emerald-50/80 border-emerald-400 shadow-sm'
                  : 'bg-white/80 border-slate-200/80 hover:border-emerald-300'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectLocation(loc)}
                className="w-full text-left flex flex-col justify-between h-full"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{loc.city}</h4>
                    <p className="text-[10px] text-slate-500 truncate">{loc.neighborhood}</p>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>

                {live ? (
                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <span className="text-2xl font-extrabold text-slate-900">{live.aqi}</span>
                      <span className="text-[10px] text-slate-500 ml-1">AQI</span>
                    </div>
                    <div className="text-right space-y-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                        {live.status}
                      </span>
                      <p className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
                        <Wind className="w-3 h-3" /> {live.weather.windSpeedKmh} km/h
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-10 flex items-center text-xs text-slate-400">
                    Syncing live...
                  </div>
                )}
              </button>
            </TiltCard>
          );
        })}
      </div>
    </motion.div>
  );
}


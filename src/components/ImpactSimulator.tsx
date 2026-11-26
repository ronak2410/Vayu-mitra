'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cigarette, Check, Shield, Leaf, Sparkles } from 'lucide-react';
import { AQIData } from '@/types/vayumitra';
import TiltCard from '@/components/TiltCard';

interface ChoiceItem {
  id: string;
  label: string;
  pm25ReductionPct: number;
  co2SavedKg: number;
  tag: string;
}

const DAILY_CHOICES: ChoiceItem[] = [
  {
    id: 'hepa',
    label: 'Run DIY Box-Fan HEPA / Purifier',
    pm25ReductionPct: 38,
    co2SavedKg: 0.2,
    tag: 'Indoor IAQ',
  },
  {
    id: 'transit',
    label: 'Swap 1 Car/Bike Trip to Metro or Carpool',
    pm25ReductionPct: 16,
    co2SavedKg: 2.4,
    tag: 'Commute',
  },
  {
    id: 'window',
    label: 'Ventilate Only During Safe Window',
    pm25ReductionPct: 18,
    co2SavedKg: 0.3,
    tag: 'Timing',
  },
  {
    id: 'induction',
    label: 'Use Induction / Electric Kettle Today',
    pm25ReductionPct: 14,
    co2SavedKg: 1.5,
    tag: 'Kitchen',
  },
];

export default function ImpactSimulator({ aqiData }: { aqiData: AQIData }) {
  const [selected, setSelected] = useState<string[]>(['hepa', 'window']);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Berkeley Earth rule-of-thumb: ~22 µg/m³ PM2.5 ≈ 1 cigarette/day
  const baselineCigs = +(aqiData.pm25 / 22).toFixed(1);

  const totalReductionPct = Math.min(
    82,
    DAILY_CHOICES.filter((c) => selected.includes(c.id)).reduce(
      (acc, c) => acc + c.pm25ReductionPct,
      0
    )
  );

  const totalCo2Saved = DAILY_CHOICES.filter((c) => selected.includes(c.id))
    .reduce((acc, c) => acc + c.co2SavedKg, 0)
    .toFixed(1);

  const projectedPm25 = Math.max(8, Math.round(aqiData.pm25 * (1 - totalReductionPct / 100)));
  const projectedCigs = +(projectedPm25 / 22).toFixed(1);
  const cigsAvoided = Math.max(0, +(baselineCigs - projectedCigs).toFixed(1));

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.08 }}
      className="bg-white/85 backdrop-blur-md rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-md"
    >
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Left: Interactive Choice Toggles */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Interactive Direct-Impact Simulator
              </h3>
              <p className="text-xs text-slate-500">
                Toggle today&apos;s clean-air habits to see real-time lung &amp; climate savings
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {DAILY_CHOICES.map((choice) => {
              const active = selected.includes(choice.id);
              return (
                <motion.button
                  key={choice.id}
                  type="button"
                  aria-pressed={active}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggle(choice.id)}
                  className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition ${
                    active
                      ? 'bg-emerald-50/90 border-emerald-500 shadow-xs'
                      : 'bg-white/70 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div
                    className={`mt-0.5 w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                      active
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {active && <Check className="w-3 h-3" />}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 block leading-snug">
                      {choice.label}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700">
                      -{choice.pm25ReductionPct}% PM2.5 • -{choice.co2SavedKg} kg CO₂
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Right: 3D-tilted Live Impact Readout */}
        <div className="lg:w-[380px] grid grid-cols-2 gap-3">
          <TiltCard
            className="rounded-2xl bg-gradient-to-br from-rose-50 to-white border border-rose-200/80 p-4 flex flex-col justify-between shadow-sm"
            glowColor="rgba(244, 63, 94, 0.14)"
          >
            <div className="flex items-center justify-between text-rose-700">
              <span className="text-[11px] font-bold uppercase tracking-wide">
                Smog Equivalent
              </span>
              <Cigarette className="w-4 h-4" />
            </div>
            <div className="my-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-rose-700">
                  {projectedCigs}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 line-through">
                  {baselineCigs}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-rose-900">
                cigarettes / day inhaled
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full self-start">
              {cigsAvoided} cigs avoided today
            </span>
          </TiltCard>

          <TiltCard
            className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200/80 p-4 flex flex-col justify-between shadow-sm"
            glowColor="rgba(16, 185, 129, 0.18)"
          >
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-[11px] font-bold uppercase tracking-wide">
                Protected Air
              </span>
              <Shield className="w-4 h-4" />
            </div>
            <div className="my-2">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-emerald-800">
                  {projectedPm25}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">µg/m³</span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-900">
                {totalReductionPct}% lower exposure
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full self-start">
              <Leaf className="w-3 h-3" /> {totalCo2Saved} kg CO₂ saved
            </span>
          </TiltCard>
        </div>
      </div>
    </motion.div>
  );
}


'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BedDouble,
  Utensils,
  Sofa,
  Wind,
  Fan,
  ShieldCheck,
  Sprout,
  Check,
  Home,
} from 'lucide-react';
import { AQIData, HomeType } from '@/types/vayumitra';

interface RoomConfig {
  id: 'bedroom' | 'kitchen' | 'living' | 'balcony';
  name: string;
  icon: React.ReactNode;
  baseIndoorRatio: number; // fraction of outdoor PM2.5 before fixes
  mitigationLabel: string;
  mitigationDropPct: number;
  tip: string;
}

const ROOMS: RoomConfig[] = [
  {
    id: 'bedroom',
    name: 'Master / Kids Bedroom',
    icon: <BedDouble className="w-4 h-4" />,
    baseIndoorRatio: 0.72,
    mitigationLabel: 'Run DIY Box-Fan HEPA (8 hrs)',
    mitigationDropPct: 62,
    tip: 'Keep doors shut at night; place box-fan HEPA 1.5m from bed.',
  },
  {
    id: 'kitchen',
    name: 'Kitchen & Dining',
    icon: <Utensils className="w-4 h-4" />,
    baseIndoorRatio: 0.85,
    mitigationLabel: 'Exhaust Hood + Induction Mode',
    mitigationDropPct: 55,
    tip: 'Cooking without exhaust spikes indoor PM2.5 & NO₂ by 3x.',
  },
  {
    id: 'living',
    name: 'Living Room',
    icon: <Sofa className="w-4 h-4" />,
    baseIndoorRatio: 0.78,
    mitigationLabel: 'Wet-Mop + Snake/Spider Plants',
    mitigationDropPct: 38,
    tip: 'Wet-mopping traps settled heavy dust; avoid dry brooming.',
  },
  {
    id: 'balcony',
    name: 'Balcony / Window Zone',
    icon: <Wind className="w-4 h-4" />,
    baseIndoorRatio: 0.96,
    mitigationLabel: 'Seal Drafts with Damp Towel / Foam',
    mitigationDropPct: 45,
    tip: 'Only open windows for 15 mins during the Safe Window.',
  },
];

export default function HomeIAQVisualizer3D({
  aqiData,
  homeType,
}: {
  aqiData: AQIData;
  homeType: HomeType;
}) {
  const [selectedRoomId, setSelectedRoomId] = useState<RoomConfig['id']>('bedroom');
  const [activeFixes, setActiveFixes] = useState<Record<string, boolean>>({
    bedroom: true,
    kitchen: true,
    living: false,
    balcony: false,
  });

  const toggleFix = (id: string) => {
    setActiveFixes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedRoom = ROOMS.find((r) => r.id === selectedRoomId) || ROOMS[0];

  const getRoomPm25 = (room: RoomConfig) => {
    const raw = aqiData.pm25 * room.baseIndoorRatio;
    const final = activeFixes[room.id]
      ? raw * (1 - room.mitigationDropPct / 100)
      : raw;
    return Math.max(6, Math.round(final));
  };

  const avgIndoorPm25 = Math.round(
    ROOMS.reduce((acc, r) => acc + getRoomPm25(r), 0) / ROOMS.length
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className="bg-white/85 backdrop-blur-md rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-md"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Home className="w-4 h-4 text-emerald-600" />
            Interactive 3D Home IAQ Floorplan ({homeType})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tap any room to inspect live indoor PM2.5 infiltration &amp; toggle low-cost IAQ fixes
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Avg Indoor PM2.5: {avgIndoorPm25} µg/m³
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: 3D Isometric-Style Interactive Floorplan */}
        <div className="lg:col-span-7 perspective-1000 py-2">
          <motion.div
            style={{ transformStyle: 'preserve-3d' }}
            initial={{ rotateX: 16, rotateZ: -3 }}
            whileHover={{ rotateX: 10, rotateZ: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 20 }}
            className="grid grid-cols-2 gap-3 p-4 rounded-3xl bg-gradient-to-br from-slate-100/90 to-emerald-50/60 border-2 border-slate-200/90 shadow-xl"
          >
            {ROOMS.map((room) => {
              const pm25 = getRoomPm25(room);
              const isSelected = room.id === selectedRoomId;
              const isClean = pm25 <= 35;
              const isFixed = activeFixes[room.id];

              return (
                <motion.button
                  key={room.id}
                  type="button"
                  whileHover={{ translateZ: 12, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`relative rounded-2xl p-4 text-left border-2 transition shadow-sm ${
                    isSelected
                      ? 'border-emerald-600 bg-white shadow-md'
                      : 'border-white/80 bg-white/75 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`p-1.5 rounded-lg ${
                        isClean
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {room.icon}
                    </span>
                    <span
                      className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                        isClean
                          ? 'bg-emerald-100 text-emerald-800'
                          : pm25 <= 80
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {pm25} µg/m³
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-900">{room.name}</p>
                  <p className="text-[10px] font-semibold text-slate-500 mt-0.5 flex items-center gap-1">
                    {isFixed ? (
                      <span className="text-emerald-700 inline-flex items-center gap-0.5">
                        <Fan className="w-3 h-3 animate-spin" /> Protected (-{room.mitigationDropPct}%)
                      </span>
                    ) : (
                      <span className="text-amber-700">Unfiltered indoor air</span>
                    )}
                  </p>
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        {/* Right: Selected Room Control Panel */}
        <div className="lg:col-span-5 bg-slate-50/90 rounded-2xl border border-slate-200/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                {selectedRoom.icon}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{selectedRoom.name}</h4>
                <p className="text-[11px] text-slate-500">
                  Live Indoor Estimate: <strong>{getRoomPm25(selectedRoom)} µg/m³</strong>
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/70">
            <Sprout className="w-3.5 h-3.5 text-emerald-600 inline mr-1.5 -mt-0.5" />
            {selectedRoom.tip}
          </p>

          <button
            type="button"
            onClick={() => toggleFix(selectedRoom.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold transition ${
              activeFixes[selectedRoom.id]
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
            }`}
          >
            <span>{selectedRoom.mitigationLabel}</span>
            <span className="flex items-center gap-1">
              {activeFixes[selectedRoom.id] ? (
                <>
                  <Check className="w-4 h-4" /> Active
                </>
              ) : (
                'Enable Fix'
              )}
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}


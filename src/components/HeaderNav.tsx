'use client';

import React from 'react';
import {
  Wind,
  SlidersHorizontal,
  MessageSquareHeart,
  KeyRound,
  RefreshCw,
  Moon,
  Sun,
} from 'lucide-react';

interface HeaderNavProps {
  isLive: boolean;
  timestamp: string;
  aqiLoading: boolean;
  hasApiKey: boolean;
  twilightMode: boolean;
  onSyncLive: () => void;
  onToggleTwilight: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenChat: () => void;
}

/**
 * Sticky eco-tech navigation header with live sync, theme toggle, and drawer triggers.
 */
export default function HeaderNav({
  isLive,
  timestamp,
  aqiLoading,
  hasApiKey,
  twilightMode,
  onSyncLive,
  onToggleTwilight,
  onOpenProfile,
  onOpenSettings,
  onOpenChat,
}: HeaderNavProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/75 backdrop-blur-xl border-b border-white/60 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Wind className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-900 leading-none">
                VayuMitra
              </h1>
              {isLive && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  LIVE • {timestamp}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Real-Time Urban Air Quality &amp; Winter Smog Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSyncLive}
            disabled={aqiLoading}
            aria-label="Sync live air quality data"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white/90 hover:bg-white text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition"
            title="Sync Live Open-Meteo Data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-emerald-600 ${aqiLoading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Sync Live</span>
          </button>

          <button
            type="button"
            onClick={onToggleTwilight}
            aria-pressed={twilightMode}
            aria-label="Toggle twilight smog mode"
            title="Toggle Twilight Smog Mode"
            className="flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white/90 hover:bg-white text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition"
          >
            {twilightMode ? (
              <Sun className="w-4 h-4 text-amber-500" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white/90 hover:bg-white text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span className="hidden sm:inline">Household Profile</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white/90 hover:bg-white text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition"
            title="Configure Gemini API Key"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
            <span className="hidden sm:inline">{hasApiKey ? 'API Key Set' : 'API Key'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenChat}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition"
          >
            <MessageSquareHeart className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">AI Smog Advisor</span>
          </button>
        </div>
      </div>
    </header>
  );
}


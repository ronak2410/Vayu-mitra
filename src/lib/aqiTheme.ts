import type { AQIStatus } from '@/types/vayumitra';

export interface AQIThemeTokens {
  badgeClass: string;
  softBadgeClass: string;
  cardBgClass: string;
  cardTextClass: string;
  strokeHex: string;
  skyBase: string;
  skyOrbs: [string, string, string];
  skyWave: string;
  skyStream: string;
  dotColor: string;
  orbGradient: string;
  orbText: string;
  orbParticles: [string, string, string];
}

/**
 * Single source of truth for AQI status styling across dashboard, 3D orb,
 * atmospheric background, and multi-city radar components.
 */
export const AQI_THEME_MAP: Record<AQIStatus, AQIThemeTokens> = {
  Good: {
    badgeClass: 'bg-emerald-600 text-white shadow-emerald-500/30',
    softBadgeClass: 'bg-emerald-100 text-emerald-800',
    cardBgClass: 'bg-gradient-to-br from-emerald-50/90 via-white/80 to-teal-50/70 border-emerald-200/80',
    cardTextClass: 'text-emerald-900',
    strokeHex: '#059669',
    skyBase: 'from-emerald-50/90 via-teal-50/75 to-sky-100/80',
    skyOrbs: ['bg-emerald-400/25', 'bg-teal-300/25', 'bg-sky-400/20'],
    skyWave: 'rgba(16,185,129,0.18)',
    skyStream: 'rgba(16,185,129,0.22)',
    dotColor: 'rgba(16, 185, 129, 0.18)',
    orbGradient: 'from-emerald-400/25 via-teal-400/15 to-sky-400/20 border-emerald-300/60 shadow-emerald-500/25',
    orbText: 'text-emerald-800',
    orbParticles: ['rgba(16,185,129,0.8)', 'rgba(52,211,153,0.6)', 'rgba(56,189,248,0.5)'],
  },
  Moderate: {
    badgeClass: 'bg-amber-500 text-white shadow-amber-500/30',
    softBadgeClass: 'bg-amber-100 text-amber-800',
    cardBgClass: 'bg-gradient-to-br from-amber-50/90 via-white/80 to-yellow-50/70 border-amber-200/80',
    cardTextClass: 'text-amber-950',
    strokeHex: '#d97706',
    skyBase: 'from-amber-50/80 via-emerald-50/70 to-sky-50/80',
    skyOrbs: ['bg-amber-300/25', 'bg-emerald-300/20', 'bg-sky-300/20'],
    skyWave: 'rgba(245,158,11,0.16)',
    skyStream: 'rgba(217,119,6,0.18)',
    dotColor: 'rgba(217, 119, 6, 0.16)',
    orbGradient: 'from-amber-400/25 via-yellow-400/15 to-emerald-400/15 border-amber-300/60 shadow-amber-500/20',
    orbText: 'text-amber-800',
    orbParticles: ['rgba(245,158,11,0.8)', 'rgba(251,191,36,0.6)', 'rgba(16,185,129,0.5)'],
  },
  Poor: {
    badgeClass: 'bg-orange-600 text-white shadow-orange-500/30',
    softBadgeClass: 'bg-orange-100 text-orange-800',
    cardBgClass: 'bg-gradient-to-br from-orange-50/90 via-white/80 to-amber-50/70 border-orange-200/80',
    cardTextClass: 'text-orange-950',
    strokeHex: '#ea580c',
    skyBase: 'from-orange-100/75 via-amber-50/80 to-slate-200/70',
    skyOrbs: ['bg-orange-400/25', 'bg-amber-400/20', 'bg-rose-300/20'],
    skyWave: 'rgba(249,115,22,0.18)',
    skyStream: 'rgba(234,88,12,0.22)',
    dotColor: 'rgba(234, 88, 12, 0.20)',
    orbGradient: 'from-orange-500/25 via-amber-500/15 to-rose-500/15 border-orange-300/60 shadow-orange-500/20',
    orbText: 'text-orange-700',
    orbParticles: ['rgba(249,115,22,0.85)', 'rgba(251,191,36,0.65)', 'rgba(244,63,94,0.45)'],
  },
  Severe: {
    badgeClass: 'bg-rose-600 text-white shadow-rose-500/30',
    softBadgeClass: 'bg-rose-100 text-rose-800',
    cardBgClass: 'bg-gradient-to-br from-rose-50/90 via-white/85 to-orange-50/60 border-rose-200/80',
    cardTextClass: 'text-rose-950',
    strokeHex: '#e11d48',
    skyBase: 'from-rose-100/80 via-slate-200/85 to-orange-100/70',
    skyOrbs: ['bg-rose-400/25', 'bg-amber-500/20', 'bg-slate-400/25'],
    skyWave: 'rgba(244,63,94,0.18)',
    skyStream: 'rgba(225,29,72,0.22)',
    dotColor: 'rgba(225, 29, 72, 0.22)',
    orbGradient: 'from-rose-500/25 via-rose-600/15 to-orange-500/20 border-rose-300/60 shadow-rose-500/25',
    orbText: 'text-rose-700',
    orbParticles: ['rgba(244,63,94,0.85)', 'rgba(251,113,133,0.65)', 'rgba(251,146,60,0.6)'],
  },
};

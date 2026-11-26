import type { AQIStatus } from '@/types/vayumitra';

export interface AQIThemeTokens {
  badgeClass: string;
  softBadgeClass: string;
  strokeHex: string;
}

/**
 * Single source of truth for AQI status styling across dashboard and radar components.
 */
export const AQI_THEME_MAP: Record<AQIStatus, AQIThemeTokens> = {
  Good: {
    badgeClass: 'bg-emerald-600 text-white shadow-emerald-500/30',
    softBadgeClass: 'bg-emerald-100 text-emerald-800',
    strokeHex: '#059669',
  },
  Moderate: {
    badgeClass: 'bg-amber-500 text-white shadow-amber-500/30',
    softBadgeClass: 'bg-amber-100 text-amber-800',
    strokeHex: '#d97706',
  },
  Poor: {
    badgeClass: 'bg-orange-600 text-white shadow-orange-500/30',
    softBadgeClass: 'bg-orange-100 text-orange-800',
    strokeHex: '#ea580c',
  },
  Severe: {
    badgeClass: 'bg-rose-600 text-white shadow-rose-500/30',
    softBadgeClass: 'bg-rose-100 text-rose-800',
    strokeHex: '#e11d48',
  },
};


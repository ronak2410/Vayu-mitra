'use client';

import React from 'react';
import { MapPin, X, Plus } from 'lucide-react';
import type { HouseholdProfile, SavedLocation } from '@/types/vayumitra';

interface SavedCitiesBarProps {
  savedLocations: SavedLocation[];
  profile: HouseholdProfile;
  onSelectLocation: (loc: SavedLocation | HouseholdProfile) => void;
  onRemoveLocation: (id: string) => void;
}

/**
 * Interactive bar of pinned cities allowing 1-click switching, removal, or saving.
 */
export default function SavedCitiesBar({
  savedLocations,
  profile,
  onSelectLocation,
  onRemoveLocation,
}: SavedCitiesBarProps) {
  const isCurrentSaved = savedLocations.some(
    (s) => s.city.toLowerCase() === profile.city.toLowerCase()
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">
        Saved Cities:
      </span>
      {savedLocations.map((loc) => {
        const isActive =
          profile.city === loc.city && Math.abs(profile.lat - loc.lat) < 0.05;
        return (
          <div
            key={loc.id}
            className={`inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full text-xs font-semibold border transition ${
              isActive
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white/85 backdrop-blur-sm text-slate-700 border-slate-200 hover:border-emerald-300'
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectLocation(loc)}
              className="flex items-center gap-1"
            >
              <MapPin className="w-3 h-3" aria-hidden="true" />
              <span>{loc.city}</span>
            </button>
            <button
              type="button"
              onClick={() => onRemoveLocation(loc.id)}
              className={`p-0.5 rounded-full transition ${
                isActive
                  ? 'hover:bg-emerald-700 text-emerald-100'
                  : 'hover:bg-slate-100 text-slate-400 hover:text-rose-600'
              }`}
              title={`Remove ${loc.city}`}
              aria-label={`Remove ${loc.city}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
      {!isCurrentSaved && (
        <button
          type="button"
          onClick={() => onSelectLocation(profile)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
        >
          <Plus className="w-3 h-3" aria-hidden="true" />
          Save {profile.city}
        </button>
      )}
    </div>
  );
}


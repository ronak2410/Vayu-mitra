'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Baby,
  HeartPulse,
  Wind,
  Dog,
  Car,
  Bike,
  Train,
  Footprints,
  Building2,
  Home,
  Flame,
  X,
  Check,
} from 'lucide-react';
import {
  CommuteMode,
  CookingHabit,
  HomeType,
  HouseholdProfile,
  VulnerableGroup,
} from '@/types/vayumitra';
import { CITY_PRESETS, reverseGeocode } from '@/lib/aqiService';

interface OnboardingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: HouseholdProfile;
  onSave: (updated: HouseholdProfile) => void;
}

const VULNERABLE_OPTIONS: { id: VulnerableGroup; label: string; icon: React.ReactNode }[] = [
  { id: 'infants', label: 'Infants / Toddlers', icon: <Baby className="w-4 h-4" /> },
  { id: 'elderly', label: 'Elderly (60+)', icon: <HeartPulse className="w-4 h-4" /> },
  { id: 'asthma', label: 'Asthma / Respiratory', icon: <Wind className="w-4 h-4" /> },
  { id: 'pets', label: 'Pets', icon: <Dog className="w-4 h-4" /> },
];

const COMMUTE_OPTIONS: { id: CommuteMode; icon: React.ReactNode }[] = [
  { id: 'Car', icon: <Car className="w-4 h-4" /> },
  { id: 'Two-wheeler', icon: <Bike className="w-4 h-4" /> },
  { id: 'Metro/Bus', icon: <Train className="w-4 h-4" /> },
  { id: 'Walk/Cycle', icon: <Footprints className="w-4 h-4" /> },
];

export default function OnboardingDrawer({
  isOpen,
  onClose,
  profile,
  onSave,
}: OnboardingDrawerProps) {
  const [draft, setDraft] = useState<HouseholdProfile>(profile);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleVulnerable = (id: VulnerableGroup) => {
    setDraft((prev) => ({
      ...prev,
      vulnerableGroups: prev.vulnerableGroups.includes(id)
        ? prev.vulnerableGroups.filter((g) => g !== id)
        : [...prev.vulnerableGroups, id],
    }));
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { city, neighborhood } = await reverseGeocode(
          pos.coords.latitude,
          pos.coords.longitude
        );
        setDraft((prev) => ({
          ...prev,
          city,
          neighborhood,
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        }));
        setDetecting(false);
      },
      () => {
        setDetecting(false);
      },
      { timeout: 6000 }
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Household Air Profile"
    >
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Household Air Profile</h2>
            <p className="text-xs text-slate-500">
              Tailors AQI risk alerts & Gemini AI recommendations
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Close profile drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Location */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Location & Neighborhood
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detecting}
                className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md flex items-center gap-1 transition"
              >
                <Navigation className="w-3 h-3" />
                {detecting ? 'Detecting...' : 'Detect Location'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                placeholder="City (e.g. Delhi NCR)"
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="text"
                value={draft.neighborhood}
                onChange={(e) => setDraft({ ...draft, neighborhood: e.target.value })}
                placeholder="Neighborhood / Ward"
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {CITY_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      city: preset.city,
                      neighborhood: preset.neighborhood,
                      lat: preset.lat,
                      lon: preset.lon,
                    })
                  }
                  className={`text-xs px-2.5 py-1 rounded-full border transition ${
                    draft.city === preset.city
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </section>

          {/* Vulnerable Groups */}
          <section className="space-y-2.5">
            <label className="text-sm font-semibold text-slate-800 block">
              Vulnerable Household Members
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {VULNERABLE_OPTIONS.map((opt) => {
                const active = draft.vulnerableGroups.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleVulnerable(opt.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition text-left ${
                      active
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className={active ? 'text-emerald-600' : 'text-slate-400'}>
                      {opt.icon}
                    </span>
                    <span className="flex-1 text-xs">{opt.label}</span>
                    {active && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Commute Mode */}
          <section className="space-y-2.5">
            <label className="text-sm font-semibold text-slate-800 block">
              Primary Commute Mode
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {COMMUTE_OPTIONS.map((opt) => {
                const active = draft.commuteMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDraft({ ...draft, commuteMode: opt.id })}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition ${
                      active
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className={active ? 'text-emerald-600' : 'text-slate-400'}>
                      {opt.icon}
                    </span>
                    {opt.id}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Home Type */}
          <section className="space-y-2.5">
            <label className="text-sm font-semibold text-slate-800 block">Home Type</label>
            <div className="grid grid-cols-2 gap-2.5">
              {(['Apartment', 'Independent house'] as HomeType[]).map((ht) => {
                const active = draft.homeType === ht;
                return (
                  <button
                    key={ht}
                    type="button"
                    onClick={() => setDraft({ ...draft, homeType: ht })}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition ${
                      active
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {ht === 'Apartment' ? (
                      <Building2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Home className="w-4 h-4 text-emerald-600" />
                    )}
                    {ht}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Cooking & Heating */}
          <section className="space-y-2.5">
            <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              Cooking & Heating Habit
            </label>
            <div className="grid grid-cols-1 gap-2">
              {(
                ['Induction/Electric', 'LPG/Piped Gas', 'Solid Fuel/Wood'] as CookingHabit[]
              ).map((habit) => {
                const active = draft.cookingHabit === habit;
                return (
                  <button
                    key={habit}
                    type="button"
                    onClick={() => setDraft({ ...draft, cookingHabit: habit })}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-medium transition ${
                      active
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{habit}</span>
                    {active && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition"
          >
            Save & Update Plan
          </button>
        </div>
      </div>
    </div>
  );
}


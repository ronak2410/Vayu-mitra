'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Wind,
  SlidersHorizontal,
  MessageSquareHeart,
  KeyRound,
  RefreshCw,
  MapPin,
  X,
  Plus,
} from 'lucide-react';
import {
  AQIData,
  ActionEngineResponse,
  HouseholdProfile,
  SavedLocation,
} from '@/types/vayumitra';
import { fetchLiveAQI, getDemoAQIData } from '@/lib/aqiService';
import { getFallbackRecommendations } from '@/lib/fallbackAI';
import DynamicSkyBackground from '@/components/DynamicSkyBackground';
import LocationSearchBar from '@/components/LocationSearchBar';
import SmogAlertBanner from '@/components/SmogAlertBanner';
import SmogDashboard from '@/components/SmogDashboard';
import ImpactSimulator from '@/components/ImpactSimulator';
import HomeIAQVisualizer3D from '@/components/HomeIAQVisualizer3D';
import CommutePlanner from '@/components/CommutePlanner';
import WeeklyForecast from '@/components/WeeklyForecast';
import MultiCityRadar from '@/components/MultiCityRadar';
import ActionEngine from '@/components/ActionEngine';
import CommunityHub from '@/components/CommunityHub';
import OnboardingDrawer from '@/components/OnboardingDrawer';
import ChatDrawer from '@/components/ChatDrawer';
import SettingsModal from '@/components/SettingsModal';

const DEFAULT_PROFILE: HouseholdProfile = {
  city: 'Delhi NCR',
  neighborhood: 'Anand Vihar / East Delhi',
  lat: 28.6469,
  lon: 77.316,
  vulnerableGroups: ['infants', 'elderly'],
  commuteMode: 'Car',
  homeType: 'Apartment',
  cookingHabit: 'LPG/Piped Gas',
};

const DEFAULT_SAVED_LOCATIONS: SavedLocation[] = [
  {
    id: 'delhi-ncr',
    city: 'Delhi NCR',
    neighborhood: 'Anand Vihar / East Delhi',
    lat: 28.6469,
    lon: 77.316,
  },
  {
    id: 'bengaluru',
    city: 'Bengaluru',
    neighborhood: 'Indiranagar',
    lat: 12.9784,
    lon: 77.6408,
  },
];

export default function HomePage() {
  const [profile, setProfile] = useState<HouseholdProfile>(DEFAULT_PROFILE);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>(DEFAULT_SAVED_LOCATIONS);
  const [aqiData, setAqiData] = useState<AQIData>(() => getDemoAQIData('delhi-severe'));
  const [aqiLoading, setAqiLoading] = useState(true);

  const [actionData, setActionData] = useState<ActionEngineResponse>(() =>
    getFallbackRecommendations(DEFAULT_PROFILE, getDemoAQIData('delhi-severe'))
  );
  const [aiLoading, setAiLoading] = useState(false);

  const [apiKey, setApiKey] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const loadRecommendations = useCallback(
    async (prof: HouseholdProfile, aqi: AQIData, key: string) => {
      setAiLoading(true);
      try {
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: prof, aqiData: aqi, apiKey: key }),
        });
        if (res.ok) {
          const data: ActionEngineResponse = await res.json();
          setActionData(data);
        }
      } catch {
        setActionData(getFallbackRecommendations(prof, aqi));
      } finally {
        setAiLoading(false);
      }
    },
    []
  );

  const loadAQI = useCallback(
    async (prof: HouseholdProfile, key: string, bypassCache = false) => {
      setAqiLoading(true);
      try {
        const live = await fetchLiveAQI(
          prof.lat,
          prof.lon,
          `${prof.city} — ${prof.neighborhood}`,
          bypassCache
        );
        setAqiData(live);
        loadRecommendations(prof, live, key);
      } catch {
        // Keep current state if transient network error
      } finally {
        setAqiLoading(false);
      }
    },
    [loadRecommendations]
  );

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const raw = localStorage.getItem('vayumitra_saved_locations');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setSavedLocations(parsed);
        }
      } catch {
        // ignore storage errors
      }
      loadAQI(profile, apiKey);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSavedLocations = (next: SavedLocation[]) => {
    setSavedLocations(next);
    try {
      localStorage.setItem('vayumitra_saved_locations', JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  };

  const handleProfileSave = (updated: HouseholdProfile) => {
    setProfile(updated);
    loadAQI(updated, apiKey);
  };

  const handleSelectLocation = (loc: {
    city: string;
    neighborhood: string;
    lat: number;
    lon: number;
  }) => {
    const updated: HouseholdProfile = {
      ...profile,
      city: loc.city,
      neighborhood: loc.neighborhood,
      lat: loc.lat,
      lon: loc.lon,
    };
    setProfile(updated);
    loadAQI(updated, apiKey);

    const exists = savedLocations.some(
      (s) =>
        s.city.toLowerCase() === loc.city.toLowerCase() &&
        Math.abs(s.lat - loc.lat) < 0.05
    );
    if (!exists) {
      updateSavedLocations([
        ...savedLocations,
        {
          id: `${loc.city.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          city: loc.city,
          neighborhood: loc.neighborhood,
          lat: loc.lat,
          lon: loc.lon,
        },
      ]);
    }
  };

  const handleRemoveLocation = (id: string) => {
    updateSavedLocations(savedLocations.filter((loc) => loc.id !== id));
  };

  const handleApiKeySave = (key: string) => {
    setApiKey(key);
    loadRecommendations(profile, aqiData, key);
  };

  return (
    <div className="relative min-h-screen text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-xl focus:bg-emerald-600 focus:text-white focus:text-xs focus:font-bold focus:shadow-lg"
      >
        Skip to main content
      </a>
      <DynamicSkyBackground
        status={aqiData.status}
        pm25={aqiData.pm25}
        windSpeedKmh={aqiData.weather.windSpeedKmh}
      />

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/75 backdrop-blur-xl border-b border-white/60 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-slate-900 leading-none">
                  VayuMitra
                </h1>
                {!aqiData.isDemo && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                    LIVE • {aqiData.timestamp}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Real-Time Urban Air Quality &amp; Winter Smog Assistant
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadAQI(profile, apiKey, true)}
              disabled={aqiLoading}
              aria-label="Sync live air quality data"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white/90 hover:bg-white text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition"
              title="Sync Live Open-Meteo Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${aqiLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Live</span>
            </button>

            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white/90 hover:bg-white text-slate-700 transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              Household Profile
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white/90 hover:bg-white text-slate-700 transition"
              title="Configure Gemini API Key"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">{apiKey ? 'API Key Set' : 'API Key'}</span>
            </button>

            <button
              onClick={() => setIsChatOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
            >
              <MessageSquareHeart className="w-4 h-4" />
              AI Smog Advisor
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <LocationSearchBar
              currentLabel={`${profile.city}${profile.neighborhood ? `, ${profile.neighborhood}` : ''}`}
              onSelectLocation={handleSelectLocation}
            />
            <p className="text-[11px] font-medium text-slate-600">
              Search any city/area or detect GPS • Click any saved city below to switch live AQI
            </p>
          </div>

          {/* Customizable Saved Cities Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">
              Saved Cities:
            </span>
            {savedLocations.map((loc) => {
              const isActive =
                profile.city === loc.city &&
                Math.abs(profile.lat - loc.lat) < 0.05;
              return (
                <div
                  key={loc.id}
                  className={`inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full text-xs font-semibold border transition ${isActive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white/85 backdrop-blur-sm text-slate-700 border-slate-200 hover:border-emerald-300'
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    className="flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>{loc.city}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveLocation(loc.id)}
                    className={`p-0.5 rounded-full transition ${isActive
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
            {!savedLocations.some(
              (s) => s.city.toLowerCase() === profile.city.toLowerCase()
            ) && (
                <button
                  type="button"
                  onClick={() => handleSelectLocation(profile)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                >
                  <Plus className="w-3 h-3" />
                  Save {profile.city}
                </button>
              )}
          </div>
        </div>
        <SmogAlertBanner aqiData={aqiData} profile={profile} />
        <SmogDashboard aqiData={aqiData} profile={profile} loading={aqiLoading} />
        <ImpactSimulator aqiData={aqiData} />
        <HomeIAQVisualizer3D aqiData={aqiData} homeType={profile.homeType} />
        <CommutePlanner aqiData={aqiData} />
        <WeeklyForecast forecast={aqiData.dailyForecast} />
        <MultiCityRadar
          savedLocations={savedLocations}
          activeCity={profile.city}
          onSelectLocation={handleSelectLocation}
        />
        <ActionEngine
          data={actionData}
          loading={aiLoading}
          onRefresh={() => loadRecommendations(profile, aqiData, apiKey)}
        />
        <CommunityHub neighborhood={profile.neighborhood} />
      </main>

      {/* Drawers & Modals */}
      <OnboardingDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onSave={handleProfileSave}
      />
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        profile={profile}
        aqiData={aqiData}
        apiKey={apiKey}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSave={handleApiKeySave}
      />
    </div>
  );
}

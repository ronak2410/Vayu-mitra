'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  SlidersHorizontal,
  MessageSquareHeart,
  RefreshCw,
  Moon,
  Sun,
} from 'lucide-react';
import type {
  AQIData,
  ActionEngineResponse,
  HouseholdProfile,
  SavedLocation,
} from '@/types/vayumitra';
import { fetchLiveAQI, getDemoAQIData } from '@/lib/aqiService';
import { DEFAULT_PROFILE, DEFAULT_SAVED_LOCATIONS } from '@/lib/constants';
import { getFallbackRecommendations } from '@/lib/fallbackAI';
import DynamicSkyBackground from '@/components/DynamicSkyBackground';
import HeaderNav from '@/components/HeaderNav';
import LocationSearchBar from '@/components/LocationSearchBar';
import SavedCitiesBar from '@/components/SavedCitiesBar';
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
  const [twilightMode, setTwilightMode] = useState(false);

  const initialLoadDone = useRef(false);

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
        // Keep current state on transient network error
      } finally {
        setAqiLoading(false);
      }
    },
    [loadRecommendations]
  );

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem('vayumitra_saved_locations');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setSavedLocations(parsed);
        }
      } catch {
        // ignore storage errors
      }
      loadAQI(DEFAULT_PROFILE, '');
    });
  }, [loadAQI]);

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
    <div
      className={`relative min-h-screen transition-colors duration-500 ${
        twilightMode ? 'bg-slate-950/85 text-slate-100' : 'text-slate-900'
      }`}
    >
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

      <HeaderNav
        isLive={!aqiData.isDemo}
        timestamp={aqiData.timestamp}
        aqiLoading={aqiLoading}
        hasApiKey={Boolean(apiKey)}
        twilightMode={twilightMode}
        onSyncLive={() => loadAQI(profile, apiKey, true)}
        onToggleTwilight={() => setTwilightMode((prev) => !prev)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
      />

      <main
        id="main-content"
        className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-8 space-y-6"
      >
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

          <SavedCitiesBar
            savedLocations={savedLocations}
            profile={profile}
            onSelectLocation={handleSelectLocation}
            onRemoveLocation={handleRemoveLocation}
          />
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

      {/* Mobile Quick-Action Bottom Dock */}
      <nav
        aria-label="Mobile quick actions"
        className="sm:hidden fixed bottom-3 inset-x-3 z-40 bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-xl px-2 py-1.5 flex items-center justify-around"
      >
        <button
          type="button"
          onClick={() => loadAQI(profile, apiKey, true)}
          className="flex flex-col items-center justify-center min-h-[44px] px-3 text-[10px] font-semibold text-slate-700"
        >
          <RefreshCw
            className={`w-4 h-4 text-emerald-600 mb-0.5 ${aqiLoading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          Sync Live
        </button>
        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className="flex flex-col items-center justify-center min-h-[44px] px-3 text-[10px] font-semibold text-slate-700"
        >
          <SlidersHorizontal className="w-4 h-4 text-emerald-600 mb-0.5" aria-hidden="true" />
          Profile
        </button>
        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          className="flex flex-col items-center justify-center min-h-[44px] px-4 rounded-xl bg-emerald-600 text-white text-[10px] font-bold shadow-xs"
        >
          <MessageSquareHeart className="w-4 h-4 mb-0.5" aria-hidden="true" />
          AI Advisor
        </button>
        <button
          type="button"
          onClick={() => setTwilightMode((prev) => !prev)}
          aria-pressed={twilightMode}
          className="flex flex-col items-center justify-center min-h-[44px] px-3 text-[10px] font-semibold text-slate-700"
        >
          {twilightMode ? (
            <Sun className="w-4 h-4 text-amber-500 mb-0.5" aria-hidden="true" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600 mb-0.5" aria-hidden="true" />
          )}
          Theme
        </button>
      </nav>

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

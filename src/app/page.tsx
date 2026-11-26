'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  SlidersHorizontal,
  MessageSquareHeart,
  RefreshCw,
  Moon,
  Sun,
  AlertTriangle,
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
import {
  addSavedLocation,
  loadSavedLocations,
  persistSavedLocations,
  removeSavedLocation,
} from '@/lib/locationStorage';
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
  const [fetchError, setFetchError] = useState<string | null>(null);

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
  const aqiAbortRef = useRef<AbortController | null>(null);
  const aiAbortRef = useRef<AbortController | null>(null);
  const aqiSeqRef = useRef(0);
  const aiSeqRef = useRef(0);

  const loadRecommendations = useCallback(
    async (prof: HouseholdProfile, aqi: AQIData, key: string) => {
      aiAbortRef.current?.abort();
      const controller = new AbortController();
      aiAbortRef.current = controller;
      const reqId = ++aiSeqRef.current;

      setAiLoading(true);
      try {
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: prof, aqiData: aqi, apiKey: key }),
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`Recommendations API returned HTTP ${res.status}`);
        }
        const data: ActionEngineResponse = await res.json();
        if (reqId === aiSeqRef.current) {
          setActionData(data);
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        if (reqId === aiSeqRef.current) {
          setActionData(getFallbackRecommendations(prof, aqi));
          setFetchError(
            'Live AI recommendations could not be refreshed; showing Smart Offline recommendations.'
          );
        }
      } finally {
        if (reqId === aiSeqRef.current) {
          setAiLoading(false);
        }
      }
    },
    []
  );

  const loadAQI = useCallback(
    async (prof: HouseholdProfile, key: string, bypassCache = false) => {
      aqiAbortRef.current?.abort();
      const controller = new AbortController();
      aqiAbortRef.current = controller;
      const reqId = ++aqiSeqRef.current;

      setAqiLoading(true);
      setFetchError(null);
      try {
        const live = await fetchLiveAQI(
          prof.lat,
          prof.lon,
          `${prof.city} — ${prof.neighborhood}`,
          bypassCache,
          controller.signal
        );
        if (reqId !== aqiSeqRef.current) return;
        setAqiData(live);
        loadRecommendations(prof, live, key);
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        if (reqId === aqiSeqRef.current) {
          setFetchError(
            `Unable to fetch live air quality for ${prof.city}. Please check your connection and retry.`
          );
        }
      } finally {
        if (reqId === aqiSeqRef.current) {
          setAqiLoading(false);
        }
      }
    },
    [loadRecommendations]
  );

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    queueMicrotask(() => {
      const stored = loadSavedLocations(
        typeof window !== 'undefined' ? window.localStorage : undefined,
        DEFAULT_SAVED_LOCATIONS
      );
      setSavedLocations(stored);
      loadAQI(DEFAULT_PROFILE, '');
    });
    return () => {
      aqiAbortRef.current?.abort();
      aiAbortRef.current?.abort();
    };
  }, [loadAQI]);

  const updateSavedLocations = (next: SavedLocation[]) => {
    setSavedLocations(next);
    persistSavedLocations(
      typeof window !== 'undefined' ? window.localStorage : undefined,
      next
    );
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
    updateSavedLocations(addSavedLocation(savedLocations, loc));
  };

  const handleRemoveLocation = (id: string) => {
    updateSavedLocations(removeSavedLocation(savedLocations, id));
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

        {fetchError && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-2xl border border-amber-300 bg-amber-50/95 px-4 py-3 flex items-center justify-between gap-3 text-xs text-amber-950 shadow-xs"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
              <span className="font-medium">{fetchError}</span>
            </div>
            <button
              type="button"
              onClick={() => loadAQI(profile, apiKey, true)}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 transition"
            >
              Retry
            </button>
          </div>
        )}

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

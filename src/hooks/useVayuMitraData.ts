'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

/**
 * Coordinates live AQI fetching, Gemini recommendations, race cancellation,
 * error/retry state, and saved-city persistence for the main dashboard.
 */
export function useVayuMitraData() {
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

  return {
    profile,
    savedLocations,
    aqiData,
    aqiLoading,
    fetchError,
    actionData,
    aiLoading,
    apiKey,
    loadAQI,
    loadRecommendations,
    handleProfileSave,
    handleSelectLocation,
    handleRemoveLocation,
    handleApiKeySave,
  };
}

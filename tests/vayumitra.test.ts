import { describe, it, expect } from 'vitest';
import { getAQIStatus, isValidCoordinates, getDemoAQIData } from '../src/lib/aqiService';
import { getFallbackRecommendations, getFallbackChatResponse } from '../src/lib/fallbackAI';
import type { HouseholdProfile } from '../src/types/vayumitra';

const SAMPLE_PROFILE: HouseholdProfile = {
  city: 'Delhi NCR',
  neighborhood: 'Anand Vihar',
  lat: 28.6469,
  lon: 77.316,
  vulnerableGroups: ['infants', 'elderly'],
  commuteMode: 'Car',
  homeType: 'Apartment',
  cookingHabit: 'LPG/Piped Gas',
};

describe('VayuMitra Core Services', () => {
  it('classifies AQI ranges accurately', () => {
    expect(getAQIStatus(35)).toBe('Good');
    expect(getAQIStatus(95)).toBe('Moderate');
    expect(getAQIStatus(220)).toBe('Poor');
    expect(getAQIStatus(420)).toBe('Severe');
  });

  it('rejects out-of-bounds or NaN coordinates', () => {
    expect(isValidCoordinates(28.64, 77.31)).toBe(true);
    expect(isValidCoordinates(95, 77.31)).toBe(false);
    expect(isValidCoordinates(28.64, -190)).toBe(false);
    expect(isValidCoordinates(Number.NaN, 77.31)).toBe(false);
  });

  it('returns 3 cards per category with quantified Direct Impact', () => {
    const aqiData = getDemoAQIData('delhi-severe');
    const res = getFallbackRecommendations(SAMPLE_PROFILE, aqiData);

    expect(res.isFallback).toBe(true);
    expect(res.routines).toHaveLength(3);
    expect(res.iaq).toHaveLength(3);
    expect(res.alternatives).toHaveLength(3);

    for (const card of [...res.routines, ...res.iaq, ...res.alternatives]) {
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.directImpact.personalHealth.length).toBeGreaterThan(0);
      expect(card.directImpact.communityEnvironmental.length).toBeGreaterThan(0);
    }
  });

  it('provides tailored safety advice for outdoor queries', () => {
    const aqiData = getDemoAQIData('delhi-severe');
    const reply = getFallbackChatResponse(
      'Is it safe to take my 3-year-old to the park?',
      SAMPLE_PROFILE,
      aqiData
    );
    expect(reply).toMatch(/not safe/i);
    expect(reply).toMatch(/Direct Impact/i);
  });
});

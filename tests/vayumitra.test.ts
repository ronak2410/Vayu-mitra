import test from 'node:test';
import assert from 'node:assert/strict';
import { getAQIStatus, isValidCoordinates, getDemoAQIData } from '../src/lib/aqiService.ts';
import { getFallbackRecommendations, getFallbackChatResponse } from '../src/lib/fallbackAI.ts';
import type { HouseholdProfile } from '../src/types/vayumitra.ts';

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

test('getAQIStatus classifies AQI ranges accurately', () => {
  assert.equal(getAQIStatus(35), 'Good');
  assert.equal(getAQIStatus(95), 'Moderate');
  assert.equal(getAQIStatus(220), 'Poor');
  assert.equal(getAQIStatus(420), 'Severe');
});

test('isValidCoordinates rejects out-of-bounds or NaN coordinates', () => {
  assert.equal(isValidCoordinates(28.64, 77.31), true);
  assert.equal(isValidCoordinates(95, 77.31), false);
  assert.equal(isValidCoordinates(28.64, -190), false);
  assert.equal(isValidCoordinates(Number.NaN, 77.31), false);
});

test('getFallbackRecommendations returns 3 cards per category with Direct Impact', () => {
  const aqiData = getDemoAQIData('delhi-severe');
  const res = getFallbackRecommendations(SAMPLE_PROFILE, aqiData);

  assert.equal(res.isFallback, true);
  assert.equal(res.routines.length, 3);
  assert.equal(res.iaq.length, 3);
  assert.equal(res.alternatives.length, 3);

  for (const card of [...res.routines, ...res.iaq, ...res.alternatives]) {
    assert.ok(card.title.length > 0);
    assert.ok(card.directImpact.personalHealth.length > 0);
    assert.ok(card.directImpact.communityEnvironmental.length > 0);
  }
});

test('getFallbackChatResponse provides tailored safety advice for outdoor queries', () => {
  const aqiData = getDemoAQIData('delhi-severe');
  const reply = getFallbackChatResponse(
    'Is it safe to take my 3-year-old to the park?',
    SAMPLE_PROFILE,
    aqiData
  );
  assert.match(reply, /not safe/i);
  assert.match(reply, /Direct Impact/i);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAQIStatus,
  isValidCoordinates,
  getDemoAQIData,
  CITY_PRESETS,
  formatVulnerableGroups,
  buildDailyAirBrief,
  getWhoRatioLabel,
  fetchLiveAQI,
  clearAQICache,
} from '../src/lib/aqiService.ts';
import {
  validateAirPayload,
  sanitizeQuestion,
  resolveGeminiKey,
  handleChatRequest,
  handleRecommendationsRequest,
  checkRateLimit,
  clearRateLimits,
} from '../src/lib/geminiServer.ts';
import {
  addSavedLocation,
  removeSavedLocation,
  loadSavedLocations,
  persistSavedLocations,
} from '../src/lib/locationStorage.ts';
import {
  getFallbackRecommendations,
  getFallbackChatResponse,
} from '../src/lib/fallbackAI.ts';
import type {
  CommuteMode,
  CookingHabit,
  HomeType,
  HouseholdProfile,
  VulnerableGroup,
} from '../src/types/vayumitra.ts';

const BASE_PROFILE: HouseholdProfile = {
  city: 'Delhi NCR',
  neighborhood: 'Anand Vihar',
  lat: 28.6469,
  lon: 77.316,
  vulnerableGroups: ['infants', 'elderly'],
  commuteMode: 'Car',
  homeType: 'Apartment',
  cookingHabit: 'LPG/Piped Gas',
};

// 1-8: AQI status boundary tests
test('getAQIStatus returns Good for AQI 0', () => {
  assert.equal(getAQIStatus(0), 'Good');
});

test('getAQIStatus returns Good at upper boundary 50', () => {
  assert.equal(getAQIStatus(50), 'Good');
});

test('getAQIStatus returns Moderate at lower boundary 51', () => {
  assert.equal(getAQIStatus(51), 'Moderate');
});

test('getAQIStatus returns Moderate at upper boundary 150', () => {
  assert.equal(getAQIStatus(150), 'Moderate');
});

test('getAQIStatus returns Poor at lower boundary 151', () => {
  assert.equal(getAQIStatus(151), 'Poor');
});

test('getAQIStatus returns Poor at upper boundary 300', () => {
  assert.equal(getAQIStatus(300), 'Poor');
});

test('getAQIStatus returns Severe at lower boundary 301', () => {
  assert.equal(getAQIStatus(301), 'Severe');
});

test('getAQIStatus returns Severe for extreme AQI 500', () => {
  assert.equal(getAQIStatus(500), 'Severe');
});

// 9-15: Coordinate validation tests
test('isValidCoordinates accepts valid Delhi coordinates', () => {
  assert.equal(isValidCoordinates(28.6469, 77.316), true);
});

test('isValidCoordinates accepts boundary poles and antimeridian', () => {
  assert.equal(isValidCoordinates(90, 180), true);
  assert.equal(isValidCoordinates(-90, -180), true);
});

test('isValidCoordinates rejects latitude above 90', () => {
  assert.equal(isValidCoordinates(90.1, 77.31), false);
});

test('isValidCoordinates rejects latitude below -90', () => {
  assert.equal(isValidCoordinates(-90.1, 77.31), false);
});

test('isValidCoordinates rejects longitude out of [-180, 180]', () => {
  assert.equal(isValidCoordinates(28.64, 181), false);
  assert.equal(isValidCoordinates(28.64, -181), false);
});

test('isValidCoordinates rejects NaN and Infinity', () => {
  assert.equal(isValidCoordinates(Number.NaN, 77.31), false);
  assert.equal(isValidCoordinates(28.64, Number.POSITIVE_INFINITY), false);
});

test('CITY_PRESETS all contain valid coordinates and non-empty labels', () => {
  assert.ok(CITY_PRESETS.length >= 5);
  for (const preset of CITY_PRESETS) {
    assert.ok(preset.city.length > 0);
    assert.ok(preset.neighborhood.length > 0);
    assert.equal(isValidCoordinates(preset.lat, preset.lon), true);
  }
});

// 16-20: AQI data structure tests
test('getDemoAQIData delhi-severe has 24 hourly points and Severe status', () => {
  const data = getDemoAQIData('delhi-severe');
  assert.equal(data.status, 'Severe');
  assert.equal(data.aqi, 420);
  assert.equal(data.hourly.length, 24);
  assert.equal(data.weather.inversionRisk, 'High');
});

test('getDemoAQIData bengaluru-moderate has 24 hourly points and Moderate status', () => {
  const data = getDemoAQIData('bengaluru-moderate');
  assert.equal(data.status, 'Moderate');
  assert.equal(data.aqi, 95);
  assert.equal(data.hourly.length, 24);
  assert.equal(data.weather.inversionRisk, 'Low');
});

test('hourly points have valid hour strings and safeLevel values', () => {
  const data = getDemoAQIData('bengaluru-moderate');
  for (const pt of data.hourly) {
    assert.match(pt.hour, /^\d{2}:\d{2}$/);
    assert.ok(['safe', 'caution', 'avoid'].includes(pt.safeLevel));
    assert.ok(pt.pm25 >= 0);
  }
});

test('getDemoAQIData avoids non-deterministic SSR timestamp', () => {
  const data = getDemoAQIData('delhi-severe');
  assert.equal(data.timestamp, 'Syncing...');
});

// 21-30: Fallback AI Recommendations personalization tests
test('getFallbackRecommendations returns 3 cards per tab', () => {
  const res = getFallbackRecommendations(BASE_PROFILE, getDemoAQIData('delhi-severe'));
  assert.equal(res.isFallback, true);
  assert.equal(res.routines.length, 3);
  assert.equal(res.iaq.length, 3);
  assert.equal(res.alternatives.length, 3);
});

test('every recommendation card includes Direct Impact personal & community metrics', () => {
  const res = getFallbackRecommendations(BASE_PROFILE, getDemoAQIData('delhi-severe'));
  for (const card of [...res.routines, ...res.iaq, ...res.alternatives]) {
    assert.ok(card.id.length > 0);
    assert.ok(card.title.length > 0);
    assert.ok(card.description.length > 0);
    assert.ok(['Quick Win', 'Moderate', 'Lifestyle'].includes(card.effort));
    assert.ok(['Free', 'Low Cost', 'Investment'].includes(card.cost));
    assert.ok(card.directImpact.personalHealth.length > 10);
    assert.ok(card.directImpact.communityEnvironmental.length > 10);
  }
});

test('recommendations adapt commute advice for Two-wheeler users', () => {
  const profile: HouseholdProfile = { ...BASE_PROFILE, commuteMode: 'Two-wheeler' };
  const res = getFallbackRecommendations(profile, getDemoAQIData('delhi-severe'));
  assert.match(res.routines[1].title, /Metro \/ Bus/i);
  assert.match(res.routines[1].directImpact.personalHealth, /65%/);
});

test('recommendations adapt commute advice for Walk/Cycle users', () => {
  const profile: HouseholdProfile = { ...BASE_PROFILE, commuteMode: 'Walk/Cycle' };
  const res = getFallbackRecommendations(profile, getDemoAQIData('delhi-severe'));
  assert.match(res.routines[1].title, /N95/i);
});

test('recommendations adapt commute advice for Metro/Bus users', () => {
  const profile: HouseholdProfile = { ...BASE_PROFILE, commuteMode: 'Metro/Bus' };
  const res = getFallbackRecommendations(profile, getDemoAQIData('delhi-severe'));
  assert.match(res.routines[1].description, /low-emission/i);
});

test('recommendations adapt homeType for Independent house', () => {
  const profile: HouseholdProfile = { ...BASE_PROFILE, homeType: 'Independent house' };
  const res = getFallbackRecommendations(profile, getDemoAQIData('delhi-severe'));
  assert.match(res.iaq[0].description, /independent house/i);
});

test('recommendations adapt cookingHabit for Induction/Electric', () => {
  const profile: HouseholdProfile = { ...BASE_PROFILE, cookingHabit: 'Induction/Electric' };
  const res = getFallbackRecommendations(profile, getDemoAQIData('delhi-severe'));
  assert.match(res.alternatives[0].title, /Exhaust Hood/i);
});

test('recommendations adapt cookingHabit for Solid Fuel/Wood', () => {
  const profile: HouseholdProfile = { ...BASE_PROFILE, cookingHabit: 'Solid Fuel/Wood' };
  const res = getFallbackRecommendations(profile, getDemoAQIData('delhi-severe'));
  assert.match(res.alternatives[0].title, /Induction/i);
  assert.match(res.alternatives[0].description, /Solid Fuel\/Wood/i);
});

test('recommendations handle empty vulnerableGroups gracefully', () => {
  const profile: HouseholdProfile = { ...BASE_PROFILE, vulnerableGroups: [] };
  const res = getFallbackRecommendations(profile, getDemoAQIData('bengaluru-moderate'));
  assert.match(res.routines[0].directImpact.personalHealth, /your household/i);
});

test('recommendations mention asthma & pets when selected', () => {
  const groups: VulnerableGroup[] = ['asthma', 'pets'];
  const profile: HouseholdProfile = { ...BASE_PROFILE, vulnerableGroups: groups };
  const res = getFallbackRecommendations(profile, getDemoAQIData('delhi-severe'));
  assert.match(res.routines[0].directImpact.personalHealth, /asthma/i);
  assert.match(res.routines[0].directImpact.personalHealth, /pets/i);
});

// 31-36: Fallback Chat Advisor tests
test('getFallbackChatResponse warns against 5 PM park visit during Severe smog', () => {
  const reply = getFallbackChatResponse(
    'Is it safe to take my 3-year-old to the park at 5 PM?',
    BASE_PROFILE,
    getDemoAQIData('delhi-severe')
  );
  assert.match(reply, /not safe/i);
  assert.match(reply, /1:30 PM/i);
});

test('getFallbackChatResponse gives cautious approval during Moderate AQI', () => {
  const reply = getFallbackChatResponse(
    'Can I go for a walk in the park?',
    { ...BASE_PROFILE, city: 'Bengaluru' },
    getDemoAQIData('bengaluru-moderate')
  );
  assert.match(reply, /generally okay with caution/i);
});

test('getFallbackChatResponse provides budget DIY purifier steps', () => {
  const reply = getFallbackChatResponse(
    'How do I keep indoor air clean without an expensive purifier?',
    BASE_PROFILE,
    getDemoAQIData('delhi-severe')
  );
  assert.match(reply, /DIY Box-Fan/i);
  assert.match(reply, /Wet-Mop/i);
});

test('getFallbackChatResponse handles window ventilation questions', () => {
  const reply = getFallbackChatResponse(
    'Should I open my window right now?',
    BASE_PROFILE,
    getDemoAQIData('delhi-severe')
  );
  assert.match(reply, /Seal Drafts/i);
});

test('getFallbackChatResponse handles general queries with city context', () => {
  const reply = getFallbackChatResponse(
    'What should I do today?',
    BASE_PROFILE,
    getDemoAQIData('delhi-severe')
  );
  assert.match(reply, /Delhi NCR/);
  assert.match(reply, /420/);
});

test('getFallbackRecommendations supports all valid lifestyle combinations', () => {
  const commutes: CommuteMode[] = ['Car', 'Two-wheeler', 'Metro/Bus', 'Walk/Cycle'];
  const homes: HomeType[] = ['Apartment', 'Independent house'];
  const cookings: CookingHabit[] = ['Induction/Electric', 'LPG/Piped Gas', 'Solid Fuel/Wood'];

  for (const commuteMode of commutes) {
    for (const homeType of homes) {
      for (const cookingHabit of cookings) {
        const res = getFallbackRecommendations(
          { ...BASE_PROFILE, commuteMode, homeType, cookingHabit },
          getDemoAQIData('delhi-severe')
        );
        assert.equal(res.routines.length, 3);
      }
    }
  }
});

// 37-42: Security & Validation helper tests
test('formatVulnerableGroups formats groups and falls back cleanly', () => {
  assert.equal(formatVulnerableGroups(['infants', 'asthma']), 'Infants & Toddlers, Asthma/Respiratory');
  assert.equal(formatVulnerableGroups([], 'everyone'), 'everyone');
});

test('validateAirPayload accepts valid profile and AQI data', () => {
  const res = validateAirPayload(BASE_PROFILE, getDemoAQIData('delhi-severe'));
  assert.equal(res.valid, true);
});

test('validateAirPayload rejects missing profile or out-of-range AQI', () => {
  assert.equal(validateAirPayload(null, getDemoAQIData('delhi-severe')).valid, false);
  assert.equal(validateAirPayload(BASE_PROFILE, { aqi: -5 }).valid, false);
  assert.equal(validateAirPayload(BASE_PROFILE, { aqi: 1500 }).valid, false);
});

test('sanitizeQuestion strips control characters and enforces length limit', () => {
  const ok = sanitizeQuestion('  Is it safe\u0007 today?  ');
  assert.equal(ok.valid, true);
  assert.equal(ok.sanitized, 'Is it safe today?');

  assert.equal(sanitizeQuestion('').valid, false);
  assert.equal(sanitizeQuestion('a'.repeat(501)).valid, false);
});

test('resolveGeminiKey accepts valid client key and rejects oversized input', () => {
  assert.equal(resolveGeminiKey('  AIzaTestKey123  '), 'AIzaTestKey123');
  assert.equal(resolveGeminiKey('x'.repeat(200)), '');
});

// 41-44: Daily Air Brief & Boundary Tests
test('buildDailyAirBrief formats shareable community summary', () => {
  const data = getDemoAQIData('delhi-severe');
  const brief = buildDailyAirBrief(data, 'Delhi NCR', '13:00, 14:00');
  assert.match(brief, /Delhi NCR/);
  assert.match(brief, /AQI 420 \(Severe\)/);
  assert.match(brief, /13:00, 14:00/);
});

test('buildDailyAirBrief includes inversion risk and PM2.5', () => {
  const data = getDemoAQIData('bengaluru-moderate');
  const brief = buildDailyAirBrief(data, 'Bengaluru', '12:00');
  assert.match(brief, /PM2\.5: 33/);
  assert.match(brief, /Trap Risk: Low/);
});

test('sanitizeQuestion rejects non-string types', () => {
  assert.equal(sanitizeQuestion(12345).valid, false);
  assert.equal(sanitizeQuestion(null).valid, false);
  assert.equal(sanitizeQuestion(undefined).valid, false);
});

test('validateAirPayload rejects invalid city length', () => {
  const badProfile = { ...BASE_PROFILE, city: 'x'.repeat(105) };
  assert.equal(validateAirPayload(badProfile, getDemoAQIData('delhi-severe')).valid, false);
});

// 45-48: Additional Edge-Case Tests
test('getAQIStatus handles negative AQI gracefully as Good', () => {
  assert.equal(getAQIStatus(-10), 'Good');
});

test('validateAirPayload rejects non-object aqiData', () => {
  assert.equal(validateAirPayload(BASE_PROFILE, 'invalid').valid, false);
});

test('sanitizeQuestion strips tabs and newlines cleanly', () => {
  const res = sanitizeQuestion('Hello\tWorld\nCheck');
  assert.equal(res.valid, true);
  assert.equal(res.sanitized, 'HelloWorldCheck');
});

test('getDemoAQIData weather includes finite temperature and humidity', () => {
  const d = getDemoAQIData('delhi-severe');
  assert.ok(Number.isFinite(d.weather.temperatureC));
  assert.ok(d.weather.humidityPct >= 0 && d.weather.humidityPct <= 100);
});

// 49-50: WHO Guideline Ratio Tests
test('getWhoRatioLabel reports Within WHO limit when at or below threshold', () => {
  assert.equal(getWhoRatioLabel(15, 15), 'Within WHO limit');
  assert.equal(getWhoRatioLabel(10, 15), 'Within WHO limit');
});

test('getWhoRatioLabel computes exact multiplier above WHO threshold', () => {
  assert.equal(getWhoRatioLabel(45, 15), '3.0× WHO limit');
  assert.equal(getWhoRatioLabel(33, 15), '2.2× WHO limit');
});

// 51-52: Additional Guard Tests
test('getWhoRatioLabel handles zero or negative pollutant values safely', () => {
  assert.equal(getWhoRatioLabel(0, 15), 'Within WHO limit');
  assert.equal(getWhoRatioLabel(-5, 15), 'Within WHO limit');
});

test('getWhoRatioLabel handles invalid zero WHO limit safely', () => {
  assert.equal(getWhoRatioLabel(50, 0), 'Within WHO limit');
});

// 53-60: API Route Tests (/api/chat and /api/recommendations)
function makeJsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

test('POST /api/chat returns 400 for malformed JSON body', async () => {
  const req = makeJsonRequest('http://localhost/api/chat', '{bad-json');
  const res = await handleChatRequest(req, getFallbackChatResponse);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /Malformed JSON/i);
});

test('POST /api/chat returns 400 for invalid commuteMode in profile', async () => {
  const req = makeJsonRequest('http://localhost/api/chat', {
    question: 'Is it safe outside?',
    profile: { ...BASE_PROFILE, commuteMode: 'Helicopter' },
    aqiData: getDemoAQIData('delhi-severe'),
  });
  const res = await handleChatRequest(req, getFallbackChatResponse);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /commuteMode/i);
});

test('POST /api/chat returns 400 for oversized question', async () => {
  const req = makeJsonRequest('http://localhost/api/chat', {
    question: 'a'.repeat(501),
    profile: BASE_PROFILE,
    aqiData: getDemoAQIData('delhi-severe'),
  });
  const res = await handleChatRequest(req, getFallbackChatResponse);
  assert.equal(res.status, 400);
});

test('POST /api/chat returns 200 with fallback reply when no API key is set', async () => {
  const req = makeJsonRequest('http://localhost/api/chat', {
    question: 'Is it safe to take my 3-year-old to the park at 5 PM?',
    profile: BASE_PROFILE,
    aqiData: getDemoAQIData('delhi-severe'),
  });
  const res = await handleChatRequest(req, getFallbackChatResponse);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.isFallback, true);
  assert.match(data.reply, /not safe/i);
});

test('POST /api/recommendations returns 400 for malformed JSON body', async () => {
  const req = makeJsonRequest('http://localhost/api/recommendations', 'not-json');
  const res = await handleRecommendationsRequest(req, getFallbackRecommendations);
  assert.equal(res.status, 400);
});

test('POST /api/recommendations returns 400 for incomplete AQI payload', async () => {
  const req = makeJsonRequest('http://localhost/api/recommendations', {
    profile: BASE_PROFILE,
    aqiData: { aqi: 120 },
  });
  const res = await handleRecommendationsRequest(req, getFallbackRecommendations);
  assert.equal(res.status, 400);
});

test('POST /api/recommendations returns 200 with 3 modules for valid payload', async () => {
  const req = makeJsonRequest('http://localhost/api/recommendations', {
    profile: BASE_PROFILE,
    aqiData: getDemoAQIData('delhi-severe'),
  });
  const res = await handleRecommendationsRequest(req, getFallbackRecommendations);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.routines.length, 3);
  assert.equal(data.iaq.length, 3);
  assert.equal(data.alternatives.length, 3);
});

// 61-64: Real fetchLiveAQI & Caching / Error Behavior Tests
test('fetchLiveAQI throws on non-OK HTTP status from Open-Meteo', async () => {
  clearAQICache();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response('Service Unavailable', { status: 503 })) as typeof fetch;
  try {
    await assert.rejects(
      () => fetchLiveAQI(28.64, 77.31, 'Delhi', true),
      /Open-Meteo Air Quality API error: 503/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetchLiveAQI parses live AQI, weather, and caches subsequent calls', async () => {
  clearAQICache();
  let callCount = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    callCount++;
    const url = String(input);
    if (url.includes('air-quality-api')) {
      return new Response(
        JSON.stringify({
          current: { us_aqi: 185, pm2_5: 92, pm10: 140, nitrogen_dioxide: 48 },
          hourly: {
            time: Array.from({ length: 48 }, (_, i) => `2026-11-27T${(i % 24).toString().padStart(2, '0')}:00`),
            pm2_5: Array.from({ length: 48 }, () => 85),
            us_aqi: Array.from({ length: 48 }, () => 170),
          },
        }),
        { status: 200 }
      );
    }
    return new Response(
      JSON.stringify({
        current: { temperature_2m: 14, relative_humidity_2m: 70, wind_speed_10m: 5 },
      }),
      { status: 200 }
    );
  }) as typeof fetch;

  try {
    const first = await fetchLiveAQI(28.64, 77.31, 'Delhi NCR');
    assert.equal(first.aqi, 185);
    assert.equal(first.status, 'Poor');
    assert.equal(first.weather.inversionRisk, 'High');
    assert.equal(first.dailyForecast?.length, 2);
    assert.equal(callCount, 2);

    // Cached call should not hit network
    const second = await fetchLiveAQI(28.64, 77.31, 'Delhi NCR — Updated Label');
    assert.equal(second.locationLabel, 'Delhi NCR — Updated Label');
    assert.equal(callCount, 2);

    // bypassCache=true forces fresh network fetch
    await fetchLiveAQI(28.64, 77.31, 'Delhi NCR', true);
    assert.equal(callCount, 4);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// 65-68: Saved-City Persistence & Location Switching Tests
test('addSavedLocation adds a new city and prevents duplicates', () => {
  const initial = [
    { id: 'delhi', city: 'Delhi NCR', neighborhood: 'Anand Vihar', lat: 28.64, lon: 77.31 },
  ];
  const added = addSavedLocation(
    initial,
    { city: 'Mumbai', neighborhood: 'BKC', lat: 19.06, lon: 72.86 },
    1
  );
  assert.equal(added.length, 2);
  assert.equal(added[1].city, 'Mumbai');

  const dup = addSavedLocation(
    added,
    { city: 'Mumbai', neighborhood: 'BKC', lat: 19.06, lon: 72.86 },
    2
  );
  assert.equal(dup.length, 2);
});

test('removeSavedLocation removes city by id', () => {
  const list = [
    { id: 'delhi', city: 'Delhi NCR', neighborhood: 'Anand Vihar', lat: 28.64, lon: 77.31 },
    { id: 'blr', city: 'Bengaluru', neighborhood: 'Indiranagar', lat: 12.97, lon: 77.64 },
  ];
  const next = removeSavedLocation(list, 'delhi');
  assert.equal(next.length, 1);
  assert.equal(next[0].id, 'blr');
});

test('loadSavedLocations handles corrupted JSON and missing storage safely', () => {
  const fallback = [
    { id: 'delhi', city: 'Delhi NCR', neighborhood: 'Anand Vihar', lat: 28.64, lon: 77.31 },
  ];
  assert.deepEqual(loadSavedLocations(undefined, fallback), fallback);
  assert.deepEqual(
    loadSavedLocations({ getItem: () => '{broken-json' }, fallback),
    fallback
  );
});

test('persistSavedLocations writes JSON and handles storage errors gracefully', () => {
  let saved = '';
  const ok = persistSavedLocations(
    {
      setItem: (_k, v) => {
        saved = v;
      },
    },
    [{ id: 'mum', city: 'Mumbai', neighborhood: 'BKC', lat: 19.06, lon: 72.86 }]
  );
  assert.equal(ok, true);
  assert.match(saved, /Mumbai/);

  const fail = persistSavedLocations(
    {
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    },
    []
  );
  assert.equal(fail, false);
});

// 66-67: Rate Limiting Security Tests
test('checkRateLimit allows up to 40 requests per window and blocks 41st', () => {
  clearRateLimits();
  for (let i = 0; i < 40; i++) {
    assert.equal(checkRateLimit('test-ip'), true);
  }
  assert.equal(checkRateLimit('test-ip'), false);
});

test('handleChatRequest returns 429 when rate limit is exceeded', async () => {
  clearRateLimits();
  for (let i = 0; i < 40; i++) {
    checkRateLimit('chat:10.0.0.1');
  }
  const req = new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '10.0.0.1',
    },
    body: JSON.stringify({
      question: 'Is it safe?',
      profile: BASE_PROFILE,
      aqiData: getDemoAQIData('delhi-severe'),
    }),
  });
  const res = await handleChatRequest(req, getFallbackChatResponse);
  assert.equal(res.status, 429);
});

import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  AQIData,
  ActionEngineResponse,
  AQIStatus,
  CommuteMode,
  CookingHabit,
  HomeType,
  HouseholdProfile,
  VulnerableGroup,
} from '../types/vayumitra';

const VALID_VULNERABLE_GROUPS = new Set<VulnerableGroup>([
  'infants',
  'elderly',
  'asthma',
  'pets',
]);
const VALID_COMMUTE_MODES = new Set<CommuteMode>([
  'Car',
  'Two-wheeler',
  'Metro/Bus',
  'Walk/Cycle',
]);
const VALID_HOME_TYPES = new Set<HomeType>(['Apartment', 'Independent house']);
const VALID_COOKING_HABITS = new Set<CookingHabit>([
  'Induction/Electric',
  'LPG/Piped Gas',
  'Solid Fuel/Wood',
]);
const VALID_AQI_STATUSES = new Set<AQIStatus>(['Good', 'Moderate', 'Poor', 'Severe']);

export type AirPayloadValidation =
  | { valid: true; profile: HouseholdProfile; aqiData: AQIData }
  | { valid: false; error: string };

function isFiniteInRange(val: unknown, min: number, max: number): val is number {
  return typeof val === 'number' && Number.isFinite(val) && val >= min && val <= max;
}

/**
 * Validates the complete HouseholdProfile shape at runtime.
 */
export function validateHouseholdProfile(profile: unknown): string | null {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    return 'Missing or invalid household profile.';
  }
  const p = profile as Record<string, unknown>;
  if (typeof p.city !== 'string' || !p.city.trim() || p.city.length > 100) {
    return 'Invalid city in household profile.';
  }
  if (typeof p.neighborhood !== 'string' || p.neighborhood.length > 150) {
    return 'Invalid neighborhood in household profile.';
  }
  if (!isFiniteInRange(p.lat, -90, 90) || !isFiniteInRange(p.lon, -180, 180)) {
    return 'Invalid coordinates in household profile.';
  }
  if (
    !Array.isArray(p.vulnerableGroups) ||
    p.vulnerableGroups.some((g) => !VALID_VULNERABLE_GROUPS.has(g as VulnerableGroup))
  ) {
    return 'Invalid vulnerableGroups in household profile.';
  }
  if (!VALID_COMMUTE_MODES.has(p.commuteMode as CommuteMode)) {
    return 'Invalid commuteMode in household profile.';
  }
  if (!VALID_HOME_TYPES.has(p.homeType as HomeType)) {
    return 'Invalid homeType in household profile.';
  }
  if (!VALID_COOKING_HABITS.has(p.cookingHabit as CookingHabit)) {
    return 'Invalid cookingHabit in household profile.';
  }
  return null;
}

/**
 * Validates the complete AQIData shape at runtime.
 */
export function validateAQIData(aqiData: unknown): string | null {
  if (!aqiData || typeof aqiData !== 'object' || Array.isArray(aqiData)) {
    return 'Missing or invalid AQI data.';
  }
  const a = aqiData as Record<string, unknown>;
  if (!isFiniteInRange(a.aqi, 0, 1000)) {
    return 'Invalid AQI numeric value.';
  }
  if (
    !isFiniteInRange(a.pm25, 0, 2000) ||
    !isFiniteInRange(a.pm10, 0, 3000) ||
    !isFiniteInRange(a.no2, 0, 2000)
  ) {
    return 'Invalid pollutant numeric values in AQI data.';
  }
  if (!VALID_AQI_STATUSES.has(a.status as AQIStatus)) {
    return 'Invalid status in AQI data.';
  }
  if (typeof a.locationLabel !== 'string' || !a.locationLabel.trim()) {
    return 'Invalid locationLabel in AQI data.';
  }
  if (!Array.isArray(a.hourly)) {
    return 'Invalid hourly array in AQI data.';
  }
  return null;
}

/**
 * Validates that incoming API payloads contain a complete HouseholdProfile and AQIData.
 */
export function validateAirPayload(
  profile: unknown,
  aqiData: unknown
): AirPayloadValidation {
  const profileErr = validateHouseholdProfile(profile);
  if (profileErr) {
    return { valid: false, error: profileErr };
  }
  const aqiErr = validateAQIData(aqiData);
  if (aqiErr) {
    return { valid: false, error: aqiErr };
  }
  return {
    valid: true,
    profile: profile as HouseholdProfile,
    aqiData: aqiData as AQIData,
  };
}

/**
 * Sanitizes and validates a user chat question for the AI Smog Advisor.
 */
export function sanitizeQuestion(question: unknown): {
  valid: boolean;
  sanitized?: string;
  error?: string;
} {
  if (typeof question !== 'string' || !question.trim()) {
    return { valid: false, error: 'Question must be a non-empty string.' };
  }
  if (question.length > 500) {
    return { valid: false, error: 'Question must be 500 characters or fewer.' };
  }
  const cleaned = question.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (!cleaned) {
    return { valid: false, error: 'Question cannot be empty after sanitization.' };
  }
  return { valid: true, sanitized: cleaned };
}

/**
 * Resolves the Gemini API key from client input or server environment.
 */
export function resolveGeminiKey(clientApiKey?: unknown): string {
  if (typeof clientApiKey === 'string') {
    const trimmed = clientApiKey.trim();
    if (trimmed.length > 0 && trimmed.length <= 160) {
      return trimmed;
    }
  }
  return process.env.GEMINI_API_KEY?.trim() || '';
}

/**
 * Creates a configured Gemini 2.5 Flash model instance.
 */
export function getGeminiFlashModel(apiKey: string, jsonMode = false) {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    ...(jsonMode
      ? { generationConfig: { responseMimeType: 'application/json' } }
      : {}),
  });
}

/**
 * Shared runtime handler for POST /api/chat.
 */
export async function handleChatRequest(
  req: Request,
  fallbackChat: (q: string, p: HouseholdProfile, a: AQIData) => string
): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Malformed JSON request body.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return Response.json({ error: 'Request body must be a JSON object.' }, { status: 400 });
  }

  const { question, profile, aqiData, apiKey: clientApiKey } = body as Record<string, unknown>;

  const qCheck = sanitizeQuestion(question);
  if (!qCheck.valid || !qCheck.sanitized) {
    return Response.json({ error: qCheck.error }, { status: 400 });
  }

  const payloadCheck = validateAirPayload(profile, aqiData);
  if (!payloadCheck.valid) {
    return Response.json({ error: payloadCheck.error }, { status: 400 });
  }

  const validProfile = payloadCheck.profile;
  const validAqi = payloadCheck.aqiData;

  try {
    const apiKey = resolveGeminiKey(clientApiKey);
    if (!apiKey) {
      return Response.json({
        reply: fallbackChat(qCheck.sanitized, validProfile, validAqi),
        isFallback: true,
      });
    }

    const model = getGeminiFlashModel(apiKey);
    const prompt = `You are VayuMitra, a calm, empathetic, science-backed Urban Air Quality & Winter Smog Advisor.
Household Context:
- Location: ${validProfile.city}, ${validProfile.neighborhood}
- Current AQI: ${validAqi.aqi} (${validAqi.status}), PM2.5: ${validAqi.pm25} µg/m³, PM10: ${validAqi.pm10} µg/m³, NO2: ${validAqi.no2} µg/m³
- Vulnerable Members: ${validProfile.vulnerableGroups.length ? validProfile.vulnerableGroups.join(', ') : 'None'}
- Commute: ${validProfile.commuteMode}, Home: ${validProfile.homeType}, Cooking: ${validProfile.cookingHabit}

User Question: "${qCheck.sanitized}"

Respond concisely in markdown (under 140 words). Always give a clear Yes/No/Caution answer first, followed by 2-3 practical steps, and end with a brief "Direct Impact:" line.`;

    const result = await model.generateContent(prompt);
    return Response.json({
      reply: result.response.text(),
      isFallback: false,
    });
  } catch (error) {
    console.error('Gemini chat error:', error);
    return Response.json(
      {
        reply: fallbackChat(qCheck.sanitized, validProfile, validAqi),
        isFallback: true,
      },
      { status: 200 }
    );
  }
}

/**
 * Shared runtime handler for POST /api/recommendations.
 */
export async function handleRecommendationsRequest(
  req: Request,
  fallbackRecs: (p: HouseholdProfile, a: AQIData) => ActionEngineResponse
): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Malformed JSON request body.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return Response.json({ error: 'Request body must be a JSON object.' }, { status: 400 });
  }

  const { profile, aqiData, apiKey: clientApiKey } = body as Record<string, unknown>;

  const payloadCheck = validateAirPayload(profile, aqiData);
  if (!payloadCheck.valid) {
    return Response.json({ error: payloadCheck.error }, { status: 400 });
  }

  const validProfile = payloadCheck.profile;
  const validAqi = payloadCheck.aqiData;

  try {
    const apiKey = resolveGeminiKey(clientApiKey);
    if (!apiKey) {
      return Response.json(fallbackRecs(validProfile, validAqi));
    }

    const model = getGeminiFlashModel(apiKey, true);
    const prompt = `You are VayuMitra, an expert Urban Air Quality & Winter Smog Assistant.
Generate personalized, practical recommendations for this household:
- Location: ${validProfile.city}, ${validProfile.neighborhood}
- Current Air Quality: AQI ${validAqi.aqi} (${validAqi.status}), PM2.5: ${validAqi.pm25} µg/m³, PM10: ${validAqi.pm10} µg/m³, NO2: ${validAqi.no2} µg/m³
- Vulnerable Household Members: ${validProfile.vulnerableGroups.length ? validProfile.vulnerableGroups.join(', ') : 'None specified'}
- Primary Commute: ${validProfile.commuteMode}
- Home Type: ${validProfile.homeType}
- Cooking/Heating Habit: ${validProfile.cookingHabit}

Return a JSON object with this exact structure:
{
  "routines": [3 items],
  "iaq": [3 items],
  "alternatives": [3 items]
}

Each item MUST have:
{
  "id": "unique-string",
  "category": "routines" | "iaq" | "alternatives",
  "title": "Short actionable title (max 8 words)",
  "description": "2-sentence practical advice tailored to their exact home, commute, and city.",
  "effort": "Quick Win" | "Moderate" | "Lifestyle",
  "cost": "Free" | "Low Cost" | "Investment",
  "directImpact": {
    "personalHealth": "Quantified personal health impact (e.g. 'Reduces daily PM2.5 inhalation by ~35% (equivalent to avoiding 2.5 cigarettes worth of smoke today).')",
    "communityEnvironmental": "Quantified community/environmental impact (e.g. 'Cuts ~1.8 kg of CO2 and 4g of tailpipe particulate matter per trip.')"
  }
}`;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());

    return Response.json({
      routines: parsed.routines || [],
      iaq: parsed.iaq || [],
      alternatives: parsed.alternatives || [],
      isFallback: false,
    });
  } catch (error) {
    console.error('Gemini recommendations error:', error);
    return Response.json(fallbackRecs(validProfile, validAqi));
  }
}

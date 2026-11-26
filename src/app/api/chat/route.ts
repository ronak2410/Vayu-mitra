import { NextRequest, NextResponse } from 'next/server';
import type { AQIData, HouseholdProfile } from '@/types/vayumitra';
import { getFallbackChatResponse } from '@/lib/fallbackAI';
import {
  getGeminiFlashModel,
  resolveGeminiKey,
  sanitizeQuestion,
  validateAirPayload,
} from '@/lib/geminiServer';

/**
 * Handles contextual AI Smog Advisor chat requests grounded in live AQI and household profile.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      question,
      profile,
      aqiData,
      apiKey: clientApiKey,
    }: {
      question: unknown;
      profile: HouseholdProfile;
      aqiData: AQIData;
      apiKey?: string;
    } = body;

    const qCheck = sanitizeQuestion(question);
    if (!qCheck.valid || !qCheck.sanitized) {
      return NextResponse.json({ error: qCheck.error }, { status: 400 });
    }

    const payloadCheck = validateAirPayload(profile, aqiData);
    if (!payloadCheck.valid) {
      return NextResponse.json({ error: payloadCheck.error }, { status: 400 });
    }

    const apiKey = resolveGeminiKey(clientApiKey);
    if (!apiKey) {
      return NextResponse.json({
        reply: getFallbackChatResponse(qCheck.sanitized, profile, aqiData),
        isFallback: true,
      });
    }

    const model = getGeminiFlashModel(apiKey);
    const prompt = `You are VayuMitra, a calm, empathetic, science-backed Urban Air Quality & Winter Smog Advisor.
Household Context:
- Location: ${profile.city}, ${profile.neighborhood}
- Current AQI: ${aqiData.aqi} (${aqiData.status}), PM2.5: ${aqiData.pm25} µg/m³, PM10: ${aqiData.pm10} µg/m³, NO2: ${aqiData.no2} µg/m³
- Vulnerable Members: ${profile.vulnerableGroups.length ? profile.vulnerableGroups.join(', ') : 'None'}
- Commute: ${profile.commuteMode}, Home: ${profile.homeType}, Cooking: ${profile.cookingHabit}

User Question: "${qCheck.sanitized}"

Respond concisely in markdown (under 140 words). Always give a clear Yes/No/Caution answer first, followed by 2-3 practical steps, and end with a brief "Direct Impact:" line.`;

    const result = await model.generateContent(prompt);
    return NextResponse.json({
      reply: result.response.text(),
      isFallback: false,
    });
  } catch (error) {
    console.error('Gemini chat error:', error);
    return NextResponse.json(
      {
        reply: 'Unable to reach Gemini right now. Please check your API key in Settings or try again.',
        isFallback: true,
      },
      { status: 200 }
    );
  }
}

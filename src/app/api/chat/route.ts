import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AQIData, HouseholdProfile } from '@/types/vayumitra';
import { getFallbackChatResponse } from '@/lib/fallbackAI';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      question,
      profile,
      aqiData,
      apiKey: clientApiKey,
    }: {
      question: string;
      profile: HouseholdProfile;
      aqiData: AQIData;
      apiKey?: string;
    } = body;

    if (typeof question !== 'string' || !question.trim() || question.length > 500) {
      return NextResponse.json(
        { error: 'Invalid question: must be a non-empty string under 500 characters.' },
        { status: 400 }
      );
    }

    if (!profile || !aqiData || typeof aqiData.aqi !== 'number') {
      return NextResponse.json({ error: 'Missing household or AQI context.' }, { status: 400 });
    }

    const sanitizedQuestion = question.trim().slice(0, 500);
    const apiKey = clientApiKey?.trim() || process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json({
        reply: getFallbackChatResponse(sanitizedQuestion, profile, aqiData),
        isFallback: true,
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are VayuMitra, a calm, empathetic, science-backed Urban Air Quality & Winter Smog Advisor.
Household Context:
- Location: ${profile.city}, ${profile.neighborhood}
- Current AQI: ${aqiData.aqi} (${aqiData.status}), PM2.5: ${aqiData.pm25} µg/m³, PM10: ${aqiData.pm10} µg/m³, NO2: ${aqiData.no2} µg/m³
- Vulnerable Members: ${profile.vulnerableGroups.length ? profile.vulnerableGroups.join(', ') : 'None'}
- Commute: ${profile.commuteMode}, Home: ${profile.homeType}, Cooking: ${profile.cookingHabit}

User Question: "${question}"

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


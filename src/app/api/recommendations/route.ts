import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AQIData, HouseholdProfile } from '@/types/vayumitra';
import { getFallbackRecommendations } from '@/lib/fallbackAI';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      profile,
      aqiData,
      apiKey: clientApiKey,
    }: { profile: HouseholdProfile; aqiData: AQIData; apiKey?: string } = body;

    if (!profile || !aqiData || typeof aqiData.aqi !== 'number') {
      return NextResponse.json({ error: 'Invalid profile or AQI payload.' }, { status: 400 });
    }

    const apiKey = clientApiKey?.trim() || process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(getFallbackRecommendations(profile, aqiData));
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `You are VayuMitra, an expert Urban Air Quality & Winter Smog Assistant.
Generate personalized, practical recommendations for this household:
- Location: ${profile.city}, ${profile.neighborhood}
- Current Air Quality: AQI ${aqiData.aqi} (${aqiData.status}), PM2.5: ${aqiData.pm25} µg/m³, PM10: ${aqiData.pm10} µg/m³, NO2: ${aqiData.no2} µg/m³
- Vulnerable Household Members: ${profile.vulnerableGroups.length ? profile.vulnerableGroups.join(', ') : 'None specified'}
- Primary Commute: ${profile.commuteMode}
- Home Type: ${profile.homeType}
- Cooking/Heating Habit: ${profile.cookingHabit}

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
    const text = result.response.text();
    const parsed = JSON.parse(text);

    return NextResponse.json({
      routines: parsed.routines || [],
      iaq: parsed.iaq || [],
      alternatives: parsed.alternatives || [],
      isFallback: false,
    });
  } catch (error) {
    console.error('Gemini recommendations error:', error);
    try {
      const body = await req.clone().json();
      return NextResponse.json(getFallbackRecommendations(body.profile, body.aqiData));
    } catch {
      return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
    }
  }
}


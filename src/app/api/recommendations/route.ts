import { NextRequest } from 'next/server';
import { getFallbackRecommendations } from '@/lib/fallbackAI';
import { handleRecommendationsRequest } from '@/lib/geminiServer';

/**
 * Generates structured 3-module GenAI recommendations with Direct Impact metrics.
 */
export async function POST(req: NextRequest) {
  return handleRecommendationsRequest(req, getFallbackRecommendations);
}

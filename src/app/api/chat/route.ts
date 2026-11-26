import { NextRequest } from 'next/server';
import { getFallbackChatResponse } from '@/lib/fallbackAI';
import { handleChatRequest } from '@/lib/geminiServer';

/**
 * Handles contextual AI Smog Advisor chat requests grounded in live AQI and household profile.
 */
export async function POST(req: NextRequest) {
  return handleChatRequest(req, getFallbackChatResponse);
}

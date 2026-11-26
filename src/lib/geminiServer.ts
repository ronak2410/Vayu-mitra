import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AQIData, HouseholdProfile } from '../types/vayumitra';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates that incoming API payloads contain a well-formed HouseholdProfile and AQIData.
 */
export function validateAirPayload(
  profile: unknown,
  aqiData: unknown
): ValidationResult {
  if (!profile || typeof profile !== 'object') {
    return { valid: false, error: 'Missing or invalid household profile.' };
  }
  const p = profile as Partial<HouseholdProfile>;
  if (typeof p.city !== 'string' || !p.city.trim() || p.city.length > 100) {
    return { valid: false, error: 'Invalid city in household profile.' };
  }
  if (!aqiData || typeof aqiData !== 'object') {
    return { valid: false, error: 'Missing or invalid AQI data.' };
  }
  const a = aqiData as Partial<AQIData>;
  if (typeof a.aqi !== 'number' || !Number.isFinite(a.aqi) || a.aqi < 0 || a.aqi > 1000) {
    return { valid: false, error: 'Invalid AQI numeric value.' };
  }
  return { valid: true };
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


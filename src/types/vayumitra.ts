export type VulnerableGroup = 'infants' | 'elderly' | 'asthma' | 'pets';

export type CommuteMode = 'Car' | 'Two-wheeler' | 'Metro/Bus' | 'Walk/Cycle';
export type HomeType = 'Apartment' | 'Independent house';
export type CookingHabit = 'Induction/Electric' | 'LPG/Piped Gas' | 'Solid Fuel/Wood';

export interface HouseholdProfile {
  city: string;
  neighborhood: string;
  lat: number;
  lon: number;
  vulnerableGroups: VulnerableGroup[];
  commuteMode: CommuteMode;
  homeType: HomeType;
  cookingHabit: CookingHabit;
}

export interface SavedLocation {
  id: string;
  city: string;
  neighborhood: string;
  lat: number;
  lon: number;
}

export type AQIStatus = 'Good' | 'Moderate' | 'Poor' | 'Severe';

export interface HourlyAQIPoint {
  hour: string;
  hourIndex: number;
  pm25: number;
  aqi: number;
  safeLevel: 'safe' | 'caution' | 'avoid';
}

export interface WeatherContext {
  temperatureC: number;
  humidityPct: number;
  windSpeedKmh: number;
  inversionRisk: 'Low' | 'Moderate' | 'High';
}

export interface DailyForecastPoint {
  dateLabel: string;
  avgAqi: number;
  maxPm25: number;
  readiness: 'Good' | 'Caution' | 'Avoid';
}

export interface AQIData {
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  status: AQIStatus;
  locationLabel: string;
  timestamp: string;
  isDemo: boolean;
  demoScenario?: 'delhi-severe' | 'bengaluru-moderate';
  hourly: HourlyAQIPoint[];
  dailyForecast?: DailyForecastPoint[];
  weather: WeatherContext;
}

export type ActionCategory = 'routines' | 'iaq' | 'alternatives';

export interface DirectImpact {
  personalHealth: string;
  communityEnvironmental: string;
}

export interface RecommendationCard {
  id: string;
  category: ActionCategory;
  title: string;
  description: string;
  effort: 'Quick Win' | 'Moderate' | 'Lifestyle';
  cost: 'Free' | 'Low Cost' | 'Investment';
  directImpact: DirectImpact;
}

export interface ActionEngineResponse {
  routines: RecommendationCard[];
  iaq: RecommendationCard[];
  alternatives: RecommendationCard[];
  isFallback: boolean;
}

export interface CommunityReport {
  id: string;
  author: string;
  ward: string;
  type:
    | 'Garbage Burning'
    | 'Construction Dust'
    | 'Traffic Bottleneck'
    | 'Industrial Smoke'
    | 'Positive Action';
  description: string;
  timestamp: string;
  upvotes: number;
  verified: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

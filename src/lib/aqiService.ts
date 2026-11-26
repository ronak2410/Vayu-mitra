import type {
  AQIData,
  AQIStatus,
  DailyForecastPoint,
  HourlyAQIPoint,
  WeatherContext,
} from '../types/vayumitra';

const aqiCache = new Map<string, { data: AQIData; expiresAt: number }>();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export function isValidCoordinates(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

export interface CityPreset {
  city: string;
  neighborhood: string;
  lat: number;
  lon: number;
  label: string;
}

export interface GeocodedLocation {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  lat: number;
  lon: number;
}

export async function searchLocations(query: string): Promise<GeocodedLocation[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    q
  )}&count=6&language=en&format=json`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || []).map(
    (r: { id: number; name: string; admin1?: string; country?: string; latitude: number; longitude: number }) => ({
      id: r.id,
      name: r.name,
      admin1: r.admin1,
      country: r.country,
      lat: r.latitude,
      lon: r.longitude,
    })
  );
}

export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<{ city: string; neighborhood: string }> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.principalSubdivision || 'Current City';
      const neighborhood = data.locality || `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
      return { city, neighborhood };
    }
  } catch {
    // Fallback to coordinates
  }
  return {
    city: 'Current Location',
    neighborhood: `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`,
  };
}

export const CITY_PRESETS: CityPreset[] = [
  { city: 'Delhi NCR', neighborhood: 'Anand Vihar / East Delhi', lat: 28.6469, lon: 77.316, label: 'Delhi NCR' },
  { city: 'Gurugram', neighborhood: 'DLF Phase 3', lat: 28.4946, lon: 77.0895, label: 'Gurugram' },
  { city: 'Noida', neighborhood: 'Sector 62', lat: 28.6279, lon: 77.3649, label: 'Noida' },
  { city: 'Bengaluru', neighborhood: 'Indiranagar', lat: 12.9784, lon: 77.6408, label: 'Bengaluru' },
  { city: 'Mumbai', neighborhood: 'Bandra Kurla Complex', lat: 19.0653, lon: 72.8676, label: 'Mumbai' },
  { city: 'Kolkata', neighborhood: 'Salt Lake', lat: 22.5867, lon: 88.417, label: 'Kolkata' },
];

export function getAQIStatus(aqi: number): AQIStatus {
  if (aqi <= 50) return 'Good';
  if (aqi <= 150) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  return 'Severe';
}

function getSafeLevel(pm25: number): 'safe' | 'caution' | 'avoid' {
  if (pm25 <= 35) return 'safe';
  if (pm25 <= 90) return 'caution';
  return 'avoid';
}

function pm25ToAqi(pm25: number): number {
  if (pm25 <= 12) return Math.round((pm25 / 12) * 50);
  if (pm25 <= 35.4) return Math.round(50 + ((pm25 - 12) / (35.4 - 12)) * 50);
  if (pm25 <= 55.4) return Math.round(100 + ((pm25 - 35.4) / (55.4 - 35.4)) * 50);
  if (pm25 <= 150.4) return Math.round(150 + ((pm25 - 55.4) / (150.4 - 55.4)) * 100);
  if (pm25 <= 250.4) return Math.round(250 + ((pm25 - 150.4) / (250.4 - 150.4)) * 100);
  return Math.min(500, Math.round(350 + ((pm25 - 250.4) / 250) * 150));
}

function computeInversionRisk(windKmh: number, tempC: number): WeatherContext['inversionRisk'] {
  if (windKmh < 7 && tempC < 20) return 'High';
  if (windKmh < 14) return 'Moderate';
  return 'Low';
}

export function getDemoAQIData(scenario: 'delhi-severe' | 'bengaluru-moderate'): AQIData {
  if (scenario === 'delhi-severe') {
    const baseHourlyPm25 = [
      295, 310, 325, 340, 355, 360, 345, 310,
      260, 215, 180, 145, 125, 115, 120, 135,
      165, 210, 255, 285, 305, 315, 310, 300,
    ];
    const hourly: HourlyAQIPoint[] = baseHourlyPm25.map((pm25, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      hourIndex: i,
      pm25,
      aqi: pm25ToAqi(pm25),
      safeLevel: getSafeLevel(pm25),
    }));

    return {
      aqi: 420,
      pm25: 288,
      pm10: 412,
      no2: 94,
      status: 'Severe',
      locationLabel: 'Delhi NCR — Anand Vihar',
      timestamp: 'Syncing...',
      isDemo: false,
      hourly,
      weather: {
        temperatureC: 11,
        humidityPct: 78,
        windSpeedKmh: 4,
        inversionRisk: 'High',
      },
    };
  }

  const baseHourlyPm25 = [
    34, 32, 30, 29, 28, 31, 38, 46,
    52, 48, 39, 31, 26, 24, 25, 28,
    33, 42, 49, 47, 43, 39, 36, 35,
  ];
  const hourly: HourlyAQIPoint[] = baseHourlyPm25.map((pm25, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    hourIndex: i,
    pm25,
    aqi: pm25ToAqi(pm25),
    safeLevel: getSafeLevel(pm25),
  }));

  return {
    aqi: 95,
    pm25: 33,
    pm10: 68,
    no2: 28,
    status: 'Moderate',
    locationLabel: 'Bengaluru — Indiranagar',
    timestamp: 'Syncing...',
    isDemo: false,
    hourly,
    weather: {
      temperatureC: 23,
      humidityPct: 58,
      windSpeedKmh: 14,
      inversionRisk: 'Low',
    },
  };
}

export async function fetchLiveAQI(
  lat: number,
  lon: number,
  locationLabel: string,
  bypassCache = false
): Promise<AQIData> {
  if (!isValidCoordinates(lat, lon)) {
    throw new Error('Invalid geographic coordinates');
  }

  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = aqiCache.get(cacheKey);
  if (!bypassCache && cached && Date.now() < cached.expiresAt) {
    return { ...cached.data, locationLabel };
  }

  const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,nitrogen_dioxide&hourly=pm2_5,us_aqi&timezone=auto&forecast_days=5`;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`;

  const [aqRes, weatherRes] = await Promise.all([
    fetch(aqUrl, { cache: 'no-store' }),
    fetch(weatherUrl, { cache: 'no-store' }).catch(() => null),
  ]);

  if (!aqRes.ok) {
    throw new Error(`Open-Meteo Air Quality API error: ${aqRes.status}`);
  }
  const data = await aqRes.json();

  let weather: WeatherContext = {
    temperatureC: 18,
    humidityPct: 62,
    windSpeedKmh: 9,
    inversionRisk: 'Moderate',
  };

  if (weatherRes && weatherRes.ok) {
    const wData = await weatherRes.json();
    const wCurr = wData.current || {};
    const temp = Math.round(wCurr.temperature_2m ?? 18);
    const hum = Math.round(wCurr.relative_humidity_2m ?? 62);
    const wind = Math.round(wCurr.wind_speed_10m ?? 9);
    weather = {
      temperatureC: temp,
      humidityPct: hum,
      windSpeedKmh: wind,
      inversionRisk: computeInversionRisk(wind, temp),
    };
  }

  const current = data.current || {};
  const aqi = Math.round(current.us_aqi ?? pm25ToAqi(current.pm2_5 ?? 45));
  const pm25 = Math.round(current.pm2_5 ?? 45);
  const pm10 = Math.round(current.pm10 ?? 75);
  const no2 = Math.round(current.nitrogen_dioxide ?? 25);

  const times: string[] = data.hourly?.time ?? [];
  const hourlyPm25: number[] = data.hourly?.pm2_5 ?? [];
  const hourlyAqi: number[] = data.hourly?.us_aqi ?? [];

  const hourly: HourlyAQIPoint[] = Array.from({ length: 24 }, (_, i) => {
    const p25 = Math.round(hourlyPm25[i] ?? pm25);
    const aq = Math.round(hourlyAqi[i] ?? pm25ToAqi(p25));
    const timeStr = times[i] ? times[i].slice(11, 16) : `${i.toString().padStart(2, '0')}:00`;
    return {
      hour: timeStr,
      hourIndex: i,
      pm25: p25,
      aqi: aq,
      safeLevel: getSafeLevel(p25),
    };
  });

  const dailyForecast: DailyForecastPoint[] = [];
  const dayNames = ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5'];
  for (let d = 0; d < 5; d++) {
    const start = d * 24;
    const slicePm = hourlyPm25.slice(start, start + 24).filter((v) => typeof v === 'number');
    const sliceAqi = hourlyAqi.slice(start, start + 24).filter((v) => typeof v === 'number');
    if (slicePm.length === 0) continue;
    const maxPm25 = Math.round(Math.max(...slicePm));
    const avgAqi = Math.round(
      sliceAqi.length
        ? sliceAqi.reduce((a, b) => a + b, 0) / sliceAqi.length
        : pm25ToAqi(slicePm.reduce((a, b) => a + b, 0) / slicePm.length)
    );
    const readiness: DailyForecastPoint['readiness'] =
      avgAqi <= 100 ? 'Good' : avgAqi <= 200 ? 'Caution' : 'Avoid';
    const dateStr = times[start]?.slice(5, 10);
    dailyForecast.push({
      dateLabel: d < 2 ? dayNames[d] : dateStr || dayNames[d],
      avgAqi,
      maxPm25,
      readiness,
    });
  }

  const result: AQIData = {
    aqi,
    pm25,
    pm10,
    no2,
    status: getAQIStatus(aqi),
    locationLabel,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isDemo: false,
    hourly,
    dailyForecast,
    weather,
  };

  aqiCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}

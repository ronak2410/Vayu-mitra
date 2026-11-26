import { AQIData, ActionEngineResponse, HouseholdProfile } from '@/types/vayumitra';

export function getFallbackRecommendations(
  profile: HouseholdProfile,
  aqiData: AQIData
): ActionEngineResponse {
  const isSevere = aqiData.aqi > 250;
  const hasVulnerable = profile.vulnerableGroups.length > 0;
  const vulnerableLabel = hasVulnerable
    ? profile.vulnerableGroups
        .map((g) =>
          g === 'infants'
            ? 'infants/toddlers'
            : g === 'elderly'
            ? 'elderly members'
            : g === 'asthma'
            ? 'asthma/respiratory patients'
            : 'pets'
        )
        .join(', ')
    : 'your household';

  return {
    isFallback: true,
    routines: [
      {
        id: 'r-1',
        category: 'routines',
        title: isSevere
          ? 'Shift Outdoor Errands to 1:00 PM – 3:30 PM'
          : 'Batch Errands During Midday Dispersion',
        description: `In ${profile.city}, winter inversion traps PM2.5 near the ground until late morning. Schedule grocery runs and school pickups during the afternoon thermal mixing window instead of 7–9 AM.`,
        effort: 'Quick Win',
        cost: 'Free',
        directImpact: {
          personalHealth: `Reduces daily PM2.5 inhalation by ~${isSevere ? '38%' : '22%'} for ${vulnerableLabel} (equivalent to avoiding ${isSevere ? '3.1' : '1.2'} cigarettes worth of smoke today).`,
          communityEnvironmental:
            'Spreading trips away from peak 8–10 AM congestion cuts idling emissions by ~1.4 kg CO2 and 3.5g of tailpipe PM per trip.',
        },
      },
      {
        id: 'r-2',
        category: 'routines',
        title:
          profile.commuteMode === 'Car' || profile.commuteMode === 'Two-wheeler'
            ? 'Switch 2 Weekly Commutes to Metro / Bus'
            : 'Use N95/FFP2 Masking on High-Traffic Corridors',
        description:
          profile.commuteMode === 'Car' || profile.commuteMode === 'Two-wheeler'
            ? `Replacing even 2 ${profile.commuteMode.toLowerCase()} trips per week with public transit dramatically lowers hyperlocal NO2 and brake-dust buildup around ${profile.neighborhood}.`
            : `Your ${profile.commuteMode} commute is already low-emission! Add a well-fitted N95 mask when passing arterial junctions where NO2 spikes.`,
        effort: 'Moderate',
        cost: 'Low Cost',
        directImpact: {
          personalHealth:
            profile.commuteMode === 'Two-wheeler'
              ? 'Cuts direct roadside PM2.5 exposure by ~65% during transit.'
              : 'Lowers commuter NO2 and ultrafine particle intake by ~40% per trip.',
          communityEnvironmental:
            'Eliminates ~2.4 kg of CO2 and 5.2g of tailpipe particulate matter per avoided private vehicle trip.',
        },
      },
      {
        id: 'r-3',
        category: 'routines',
        title: 'Pre-Cool & Recirculate Cabin/Indoor Air',
        description:
          'When traveling by car or bus, keep windows closed and switch HVAC to "Recirculate" mode before entering congested intersections to prevent outside smog from flooding the cabin.',
        effort: 'Quick Win',
        cost: 'Free',
        directImpact: {
          personalHealth:
            'Reduces in-cabin PM2.5 concentration by up to 55% compared to fresh-air intake in heavy traffic.',
          communityEnvironmental:
            'Improves AC thermal efficiency, reducing fuel burn by ~4% and cutting ~0.3 kg CO2 per hour of driving.',
        },
      },
    ],
    iaq: [
      {
        id: 'i-1',
        category: 'iaq',
        title: 'DIY Box-Fan + MERV-13 / HEPA Filter',
        description: `Ideal for your ${profile.homeType.toLowerCase()}: tape a 20"x20" MERV-13 or HEPA filter to the back of a standard box fan. Run it on medium in the main bedroom where ${vulnerableLabel} spend the most time.`,
        effort: 'Quick Win',
        cost: 'Low Cost',
        directImpact: {
          personalHealth:
            'Drops indoor PM2.5 by 50–70% within 45 minutes, protecting developing lungs and seniors overnight.',
          communityEnvironmental:
            'Uses ~45W (less than a ceiling fan) and avoids plastic-heavy commercial purifier waste.',
        },
      },
      {
        id: 'i-2',
        category: 'iaq',
        title: 'Wet-Mop Floors Instead of Dry Sweeping',
        description:
          'Dry brooming re-suspends settled PM2.5 and toxic heavy-metal dust back into breathing height (especially dangerous for toddlers and pets). Damp-mop high-traffic zones every morning.',
        effort: 'Quick Win',
        cost: 'Free',
        directImpact: {
          personalHealth:
            'Prevents ~40% of settled indoor particulate matter from becoming airborne again at floor level.',
          communityEnvironmental:
            'Zero electricity or chemical sprays required—just water and a microfiber cloth.',
        },
      },
      {
        id: 'i-3',
        category: 'iaq',
        title: 'Seal Window Drafts & Strategic Cross-Ventilation',
        description: `Only open windows for 15 minutes around 2:00 PM when outdoor PM2.5 dips. During ${isSevere ? 'severe smog hours' : 'evening peaks'}, place rolled damp towels or weather-stripping along ${profile.homeType.toLowerCase()} window gaps.`,
        effort: 'Moderate',
        cost: 'Free',
        directImpact: {
          personalHealth:
            'Cuts outdoor smog infiltration by ~30% during overnight temperature inversions.',
          communityEnvironmental:
            'Reduces indoor heating/cooling loss by ~15%, lowering household electricity demand.',
        },
      },
    ],
    alternatives: [
      {
        id: 'a-1',
        category: 'alternatives',
        title:
          profile.cookingHabit === 'Induction/Electric'
            ? 'Run Exhaust Hood + Lid Cooking to Cut Indoor Aerosols'
            : 'Shift High-Heat Cooking to Induction / Electric Kettle',
        description:
          profile.cookingHabit === 'Induction/Electric'
            ? 'Your electric cooking setup already avoids indoor NO2! Always use pot lids and your chimney/exhaust fan to capture fine cooking oil aerosols.'
            : `Switching from ${profile.cookingHabit} to induction for tea, boiling, and simmering eliminates indoor NO2 and black carbon spikes in your kitchen.`,
        effort: 'Moderate',
        cost: 'Low Cost',
        directImpact: {
          personalHealth:
            'Eliminates indoor NO2 spikes by up to 80% and reduces kitchen PM2.5 by ~45%.',
          communityEnvironmental:
            'Saves ~1.5 kg CO2 equivalent per day and reduces urban household fossil-gas demand.',
        },
      },
      {
        id: 'a-2',
        category: 'alternatives',
        title: 'Ward Carpool & Electric Last-Mile Rickshaw',
        description: `Coordinate a 3-family school or office carpool in ${profile.neighborhood}, or use e-rickshaws / e-bikes for trips under 3 km instead of cold-starting a petrol engine.`,
        effort: 'Lifestyle',
        cost: 'Free',
        directImpact: {
          personalHealth:
            'Cold-start engines emit 3x more particulates in the first 2 km; avoiding them protects neighborhood air.',
          communityEnvironmental:
            'Cuts ~3.2 kg CO2 and 8g of tailpipe PM per shared or electrified short trip.',
        },
      },
      {
        id: 'a-3',
        category: 'alternatives',
        title: 'Compost Garden/Kitchen Waste Instead of Burning',
        description:
          'Ensure your RWA or household never burns dry winter leaves or garden trimmings. Mulching or community composting prevents toxic dioxin and PM2.5 plumes.',
        effort: 'Lifestyle',
        cost: 'Free',
        directImpact: {
          personalHealth:
            'Prevents acute localized PM2.5 spikes (>500 µg/m³) that trigger immediate asthma attacks.',
          communityEnvironmental:
            'Avoids ~12 kg of CO2 and carcinogenic smoke per 5 kg of dry biomass.',
        },
      },
    ],
  };
}

export function getFallbackChatResponse(
  question: string,
  profile: HouseholdProfile,
  aqiData: AQIData
): string {
  const q = question.toLowerCase();
  const isSevere = aqiData.aqi > 250;

  if (q.includes('park') || q.includes('outside') || q.includes('walk') || q.includes('3-year-old') || q.includes('child')) {
    return isSevere
      ? `Right now in **${profile.city}** (AQI **${aqiData.aqi} — Severe**, PM2.5 **${aqiData.pm25} µg/m³**), it is **not safe** for young children or vulnerable members to play outdoors, especially around 5 PM when evening inversion traps smog.\n\n**What to do instead:**\n- Keep playtime indoors near your DIY HEPA/box-fan zone.\n- If you must step out, aim for **1:30 PM – 3:00 PM** when PM2.5 dips slightly, and keep it under 20 minutes.\n\n*Direct Impact:* Avoiding a 45-minute 5 PM park visit today saves a toddler from inhaling the PM2.5 equivalent of ~2 cigarettes.`
      : `In **${profile.city}** (AQI **${aqiData.aqi} — ${aqiData.status}**), outdoor play is **generally okay with caution**. The best window is **12:00 PM – 4:00 PM**.\n\n- Avoid busy roadsides where NO2 (${aqiData.no2} µg/m³) is highest.\n- Wash hands and face after returning indoors.`;
  }

  if (q.includes('purifier') || q.includes('indoor') || q.includes('clean') || q.includes('window')) {
    return `You don't need an expensive ₹25,000+ purifier to protect your **${profile.homeType}**!\n\n1. **DIY Box-Fan Filter (~₹1,500):** Tape a MERV-13 or HEPA replacement filter to a standard box fan and run it in the bedroom.\n2. **Wet-Mop Daily:** Skip dry brooming so settled PM2.5 doesn't re-enter the air.\n3. **Seal Drafts:** Use damp towels or foam tape on window gaps during morning/evening smog peaks.\n\n*Direct Impact:* Together, these steps cut indoor PM2.5 by **50–65%** at less than 10% of the cost of a commercial purifier.`;
  }

  return `Based on **${profile.city}**'s current AQI of **${aqiData.aqi} (${aqiData.status})** and your **${profile.homeType}** profile:\n\n- **Best outdoor window today:** 1:00 PM – 3:30 PM.\n- **Top priority:** Keep indoor air circulating through a MERV-13/HEPA filter and avoid ${profile.commuteMode === 'Walk/Cycle' ? 'unmasked' : 'peak-hour'} travel near arterial roads.\n\n*Note: Add your Gemini API key in Settings (top right) for live, custom AI responses powered by \`gemini-2.5-flash\`.*`;
}


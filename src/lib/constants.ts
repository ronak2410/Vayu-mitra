import type { HouseholdProfile, SavedLocation } from '@/types/vayumitra';

export const DEFAULT_PROFILE: HouseholdProfile = {
  city: 'Delhi NCR',
  neighborhood: 'Anand Vihar / East Delhi',
  lat: 28.6469,
  lon: 77.316,
  vulnerableGroups: ['infants', 'elderly'],
  commuteMode: 'Car',
  homeType: 'Apartment',
  cookingHabit: 'LPG/Piped Gas',
};

export const DEFAULT_SAVED_LOCATIONS: SavedLocation[] = [
  {
    id: 'delhi-ncr',
    city: 'Delhi NCR',
    neighborhood: 'Anand Vihar / East Delhi',
    lat: 28.6469,
    lon: 77.316,
  },
  {
    id: 'bengaluru',
    city: 'Bengaluru',
    neighborhood: 'Indiranagar',
    lat: 12.9784,
    lon: 77.6408,
  },
];

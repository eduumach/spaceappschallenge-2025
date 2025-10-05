import type { EventCriteria, EventProfile } from "~/lib/types/weather.types";

const eventPresets: Record<string, EventCriteria> = {
  praia: {
    temp_min_ideal: 28,
    temp_max_ideal: 45,
    precipitation_max: 1,
    wind_max: 20,
    humidity_max: 80
  },
  churrasco: {
    temp_min_ideal: 20,
    temp_max_ideal: 40,
    precipitation_max: 1,
    wind_max: 15
  },
  pelada: {
    temp_min_ideal: 20,
    temp_max_ideal: 38,
    precipitation_max: 3,
    wind_max: 15
  },
  festa_junina: {
    temp_min_ideal: 16,
    temp_max_ideal: 32,
    precipitation_max: 1,
    wind_max: 12,
    humidity_min: 35,
    humidity_max: 65
  },
  samba_pagode: {
    temp_min_ideal: 24,
    temp_max_ideal: 36,
    precipitation_max: 2,
    wind_max: 12,
    humidity_max: 80
  },
  carnaval: {
    temp_min_ideal: 24,
    temp_max_ideal: 42,
    precipitation_max: 5,
    wind_max: 15,
    humidity_min: 55,
    humidity_max: 90
  },
  volei_praia: {
    temp_min_ideal: 28,
    temp_max_ideal: 42,
    precipitation_max: 1,
    wind_max: 10,
    humidity_max: 75
  },
  pescaria: {
    temp_min_ideal: 20,
    temp_max_ideal: 32,
    precipitation_max: 2,
    wind_max: 12
  },
  piquenique: {
    temp_min_ideal: 22,
    temp_max_ideal: 30,
    precipitation_max: 0.5,
    wind_max: 10,
    humidity_min: 40,
    humidity_max: 70
  },
  trilha: {
    temp_min_ideal: 18,
    temp_max_ideal: 28,
    precipitation_max: 5,
    wind_max: 12,
    humidity_min: 40,
    humidity_max: 85
  },
  customizavel: {
    temp_min_ideal: 20,
    temp_max_ideal: 30,
    precipitation_max: 2,
    wind_max: 10,
    humidity_min: 40,
    humidity_max: 70
  },
  custom: {},
}


export const EVENT_PROFILES: Record<string, EventProfile> = {};
for (const key of Object.keys(eventPresets)) {
  const criteria = eventPresets[key]
  console.log(criteria)
  EVENT_PROFILES[key] = {
    name: "", // vai ser definido no front mesmo
    description: "",
    criteria
  }
}
  

// Deriva todas as chaves possíveis de criteria dos perfis
export const CRITERIA_KEYS = Array.from(new Set(
  Object.values(EVENT_PROFILES).flatMap(profile => Object.keys(profile.criteria))
));

export class EventProfileService {
  static getProfile(key: string): EventProfile | undefined {
    return EVENT_PROFILES[key];
  }

  static getAllProfiles(): Record<string, EventProfile> {
    return EVENT_PROFILES;
  }

  static getProfileKeys(): string[] {
    return Object.keys(EVENT_PROFILES);
  }

  static isValidProfile(key: string): boolean {
    return key in EVENT_PROFILES;
  }
}

import type { EventProfile } from "~/lib/types/weather.types";

// Centralized event profiles with climate criteria
export const EVENT_PROFILES: Record<string, EventProfile> = {
  praia: {
    name: 'Praia',
    description: 'Sol forte, calor intenso, céu limpo',
    criteria: {
      temp_min_ideal: 28,
      temp_max_ideal: 42,
      precipitation_max: 1,
      wind_max: 10,
      humidity_max: 80
    }
  },
  churrasco: {
    name: 'Churrasco',
    description: 'Sem chuva, calor ou clima agradável',
    criteria: {
      temp_min_ideal: 20,
      temp_max_ideal: 38,
      precipitation_max: 2,
      wind_max: 15
    }
  },
  pelada: {
    name: 'Pelada/Futebol',
    description: 'Brasileiro joga bola em qualquer calor!',
    criteria: {
      temp_min_ideal: 20,
      temp_max_ideal: 38,
      precipitation_max: 3,
      wind_max: 15
    }
  },
  festa_junina: {
    name: 'Festa Junina',
    description: 'Clima de inverno brasileiro, fresquinho à noite',
    criteria: {
      temp_min_ideal: 16,
      temp_max_ideal: 28,
      precipitation_max: 1,
      wind_max: 12,
      humidity_min: 35,
      humidity_max: 65
    }
  },
  samba_pagode: {
    name: 'Samba/Pagode ao Ar Livre',
    description: 'Clima quente e animado para curtir',
    criteria: {
      temp_min_ideal: 24,
      temp_max_ideal: 36,
      precipitation_max: 2,
      wind_max: 12,
      humidity_max: 80
    }
  },
  carnaval: {
    name: 'Carnaval de Rua',
    description: 'Calor ABSURDO de verão brasileiro!',
    criteria: {
      temp_min_ideal: 30,
      temp_max_ideal: 42,
      precipitation_max: 5,
      wind_max: 15,
      humidity_min: 55,
      humidity_max: 90
    }
  },
  volei_praia: {
    name: 'Vôlei de Praia',
    description: 'Areia quente, sol a pino',
    criteria: {
      temp_min_ideal: 28,
      temp_max_ideal: 40,
      precipitation_max: 1,
      wind_max: 10,
      humidity_max: 75
    }
  },
  pescaria: {
    name: 'Pescaria',
    description: 'Manhã tranquila, temperatura moderada',
    criteria: {
      temp_min_ideal: 20,
      temp_max_ideal: 32,
      precipitation_max: 2,
      wind_max: 12
    }
  },
  piquenique: {
    name: 'Piquenique no Parque',
    description: 'Dia agradável sem calor extremo',
    criteria: {
      temp_min_ideal: 22,
      temp_max_ideal: 30,
      precipitation_max: 0.5,
      wind_max: 10,
      humidity_min: 40,
      humidity_max: 70
    }
  },
  trilha: {
    name: 'Trilha/Caminhada',
    description: 'Clima ameno, pode ter chuva leve na mata',
    criteria: {
      temp_min_ideal: 18,
      temp_max_ideal: 28,
      precipitation_max: 5,
      wind_max: 12,
      humidity_min: 40,
      humidity_max: 85
    }
  },
  customizavel: {
    name: 'Customizável',
    description: 'Defina seu próprio tipo de evento',
    criteria: {
      temp_min_ideal: 20,
      temp_max_ideal: 30,
      precipitation_max: 2,
      wind_max: 10,
      humidity_min: 40,
      humidity_max: 70
    }
  }
};

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

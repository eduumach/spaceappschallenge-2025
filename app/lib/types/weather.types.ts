// Centralized types for weather data and analysis

export interface WeatherData {
  year: number;
  temp_max: number;
  temp_min: number;
  precipitation: number;
  wind: number;
  humidity: number;
}

export interface EventCriteria {
  temp_min_ideal?: number;
  temp_max_ideal?: number;
  precipitation_min?: number;
  precipitation_max?: number;
  wind_max?: number;
  humidity_min?: number;
  humidity_max?: number;
}

export interface EventProfile {
  name: string;
  description: string;
  criteria: EventCriteria;
}

export interface DayAnalysis {
  date: Date;
  dateStr: string;
  probability: number;
  idealYears: number;
  totalYears: number;
  details: YearDetail[];
  historicalData: WeatherData[];
  recentProbability: number;
  idealRecentYears: number;
  totalRecentYears: number;
}

export interface YearDetail {
  year: number;
  temp_max: number;
  temp_min: number;
  precipitation: number;
  wind: number;
  humidity: number;
  ideal: boolean;
  reasons: string;
}

export interface AnalysisParams {
  latitude: number;
  longitude: number;
  startDate: Date;
  endDate: Date;
  profileKey: string;
}

export interface AnalysisResult {
  results: DayAnalysis[];
  bestDay: DayAnalysis | null;
  alternativeSuggestions: DayAnalysis[];
}

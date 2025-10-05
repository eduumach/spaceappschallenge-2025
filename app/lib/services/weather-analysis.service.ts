import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { WeatherData, DayAnalysis, YearDetail, EventCriteria } from "~/lib/types/weather.types";

export class WeatherAnalysisService {
  private static readonly RECENT_YEARS_THRESHOLD = 10;

  /**
   * Analyze weather data for a specific day against event criteria
   */
  static analyzeDay(
    data: WeatherData[],
    date: Date,
    criteria: EventCriteria
  ): DayAnalysis {
    let idealYears = 0;
    let idealRecentYears = 0;
    const details: YearDetail[] = [];

    const currentYear = new Date().getFullYear();
    const recentYearLimit = currentYear - this.RECENT_YEARS_THRESHOLD;

    data.forEach(d => {
      let ideal = true;
      const reasons: string[] = [];

      // Check minimum temperature
      if (criteria.temp_min_ideal !== undefined && d.temp_min < criteria.temp_min_ideal) {
        ideal = false;
        reasons.push(`muito frio (${d.temp_min.toFixed(1)}°C)`);
      }

      // Check maximum temperature
      if (criteria.temp_max_ideal !== undefined && d.temp_max > criteria.temp_max_ideal) {
        ideal = false;
        reasons.push(`muito quente (${d.temp_max.toFixed(1)}°C)`);
      }

      // Check minimum precipitation
      if (criteria.precipitation_min !== undefined && d.precipitation < criteria.precipitation_min) {
        ideal = false;
        reasons.push(`chuva insuficiente (${d.precipitation.toFixed(1)}mm)`);
      }

      // Check maximum precipitation
      if (criteria.precipitation_max !== undefined && d.precipitation > criteria.precipitation_max) {
        ideal = false;
        reasons.push(`muita chuva (${d.precipitation.toFixed(1)}mm)`);
      }

      // Check wind
      if (criteria.wind_max !== undefined && d.wind > criteria.wind_max) {
        ideal = false;
        reasons.push(`muito vento (${d.wind.toFixed(1)}m/s)`);
      }

      // Check minimum humidity
      if (criteria.humidity_min !== undefined && d.humidity < criteria.humidity_min) {
        ideal = false;
        reasons.push(`muito seco (${d.humidity.toFixed(1)}%)`);
      }

      // Check maximum humidity
      if (criteria.humidity_max !== undefined && d.humidity > criteria.humidity_max) {
        ideal = false;
        reasons.push(`muito úmido (${d.humidity.toFixed(1)}%)`);
      }

      if (ideal) {
        idealYears++;
        if (d.year >= recentYearLimit) {
          idealRecentYears++;
        }
      }

      details.push({
        ...d,
        year: d.year,
        ideal,
        reasons: reasons.join(', ') || 'OK'
      });
    });

    const recentData = data.filter(d => d.year >= recentYearLimit);
    const probability = (idealYears / data.length) * 100;
    const recentProbability = recentData.length > 0
      ? (idealRecentYears / recentData.length) * 100
      : 0;

    return {
      date,
      dateStr: format(date, "dd 'de' MMMM", { locale: ptBR }),
      probability,
      idealYears,
      totalYears: data.length,
      details,
      historicalData: data,
      recentProbability,
      idealRecentYears,
      totalRecentYears: recentData.length
    };
  }

  /**
   * Calculate average weather metrics from historical data
   */
  static calculateAverages(data: WeatherData[]): {
    avgTempMax: number;
    avgTempMin: number;
    avgPrecipitation: number;
    avgWind: number;
    avgHumidity: number;
  } {
    if (data.length === 0) {
      return {
        avgTempMax: 0,
        avgTempMin: 0,
        avgPrecipitation: 0,
        avgWind: 0,
        avgHumidity: 0
      };
    }

    return {
      avgTempMax: data.reduce((sum, d) => sum + d.temp_max, 0) / data.length,
      avgTempMin: data.reduce((sum, d) => sum + d.temp_min, 0) / data.length,
      avgPrecipitation: data.reduce((sum, d) => sum + d.precipitation, 0) / data.length,
      avgWind: data.reduce((sum, d) => sum + d.wind, 0) / data.length,
      avgHumidity: data.reduce((sum, d) => sum + d.humidity, 0) / data.length
    };
  }

  /**
   * Find the best day from a list of analyzed days
   */
  static findBestDay(analyses: DayAnalysis[]): DayAnalysis | null {
    if (analyses.length === 0) return null;

    return analyses.reduce((prev, current) =>
      current.probability > prev.probability ? current : prev
    );
  }

  /**
   * Calculate trend direction between recent and historical data
   */
  static calculateTrend(recentProbability: number, overallProbability: number): {
    direction: 'positive' | 'negative' | 'stable';
    difference: number;
  } {
    const difference = recentProbability - overallProbability;
    const threshold = 10;

    if (difference > threshold) {
      return { direction: 'positive', difference };
    } else if (difference < -threshold) {
      return { direction: 'negative', difference: Math.abs(difference) };
    } else {
      return { direction: 'stable', difference: 0 };
    }
  }

  /**
   * Get ideal and non-ideal years from analysis details
   */
  static categorizeYears(details: YearDetail[]): {
    idealYears: YearDetail[];
    nonIdealYears: YearDetail[];
  } {
    return {
      idealYears: details.filter(d => d.ideal),
      nonIdealYears: details.filter(d => !d.ideal)
    };
  }
}

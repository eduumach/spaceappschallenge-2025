import type { WeatherData } from "~/lib/types/weather.types";

export interface FetchParams {
  latitude: number;
  longitude: number;
  startDate: Date;
  endDate: Date;
  expansionDays?: number;
}

export interface FetchResult {
  dataByDay: Map<string, WeatherData[]>;
  selectedDays: Date[];
  allDays: Date[];
}

export class NASADataFetcherService {
  private static readonly BASE_URL = 'https://power.larc.nasa.gov/api/temporal/daily/point';
  private static readonly DEFAULT_EXPANSION_DAYS = 30;
  private static readonly HISTORICAL_YEARS = 20;

  /**
   * Fetch historical weather data from NASA POWER API
   */
  static async fetchHistoricalData(params: FetchParams): Promise<FetchResult> {
    const { latitude, longitude, startDate, endDate } = params;
    const expansionDays = params.expansionDays ?? this.DEFAULT_EXPANSION_DAYS;

    // Generate list of selected days
    const selectedDays = this.generateDateRange(startDate, endDate);

    // Expand range for suggestions
    const expandedStart = new Date(startDate);
    expandedStart.setDate(expandedStart.getDate() - expansionDays);
    const expandedEnd = new Date(endDate);
    expandedEnd.setDate(expandedEnd.getDate() + expansionDays);

    const allDays = this.generateDateRange(expandedStart, expandedEnd);

    // Initialize map to group data by day/month (key: MMDD)
    const dataByDay = new Map<string, WeatherData[]>();
    allDays.forEach(day => {
      const key = this.getDayKey(day);
      dataByDay.set(key, []);
    });

    // Fetch data for each historical year
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - this.HISTORICAL_YEARS;

    const fetchPromises = [];

    for (let year = startYear; year < currentYear; year++) {
      const yearlyStartDate = this.formatDateForAPI(year, expandedStart);
      const yearlyEndDate = this.formatDateForAPI(year, expandedEnd);

      const promise = this.fetchYearData(
        latitude,
        longitude,
        yearlyStartDate,
        yearlyEndDate,
        year,
        dataByDay
      );

      fetchPromises.push(promise);
    }

    await Promise.all(fetchPromises);

    return {
      dataByDay,
      selectedDays,
      allDays
    };
  }

  /**
   * Generate array of dates between start and end (inclusive)
   */
  private static generateDateRange(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(start);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  /**
   * Get day key (MMDD format) for grouping historical data
   */
  private static getDayKey(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}${day}`;
  }

  /**
   * Format date for NASA API (YYYYMMDD format)
   */
  private static formatDateForAPI(year: number, date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Fetch data for a specific year from NASA API
   */
  private static async fetchYearData(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
    year: number,
    dataByDay: Map<string, WeatherData[]>
  ): Promise<void> {
    const params = new URLSearchParams({
      start: startDate,
      end: endDate,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      community: 'ag',
      parameters: 'T2M_MAX,T2M_MIN,PRECTOTCORR,WS10M,RH2M',
      format: 'json'
    });

    try {
      const response = await fetch(`${this.BASE_URL}?${params}`);
      const data = await response.json();

      if (data?.properties?.parameter) {
        const p = data.properties.parameter;

        // Process each date returned in the range
        const dates = Object.keys(p.T2M_MAX || {});
        dates.forEach(dateStr => {
          // Extract month/day from date (format YYYYMMDD -> MMDD)
          const mmdd = dateStr.substring(4, 8);

          if (dataByDay.has(mmdd)) {
            const weatherData: WeatherData = {
              year,
              temp_max: p.T2M_MAX?.[dateStr] ?? NaN,
              temp_min: p.T2M_MIN?.[dateStr] ?? NaN,
              precipitation: p.PRECTOTCORR?.[dateStr] ?? NaN,
              wind: p.WS10M?.[dateStr] ?? NaN,
              humidity: p.RH2M?.[dateStr] ?? NaN
            };

            dataByDay.get(mmdd)?.push(weatherData);
          }
        });
      }
    } catch (error) {
      console.error(`Error fetching data for year ${year}:`, error);
      // Continue with other years even if one fails
    }
  }

  /**
   * Check if a date is within the selected range
   */
  static isDateInRange(date: Date, selectedDays: Date[]): boolean {
    return selectedDays.some(d =>
      d.getMonth() === date.getMonth() && d.getDate() === date.getDate()
    );
  }
}

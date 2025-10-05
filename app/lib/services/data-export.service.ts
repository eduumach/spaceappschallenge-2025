// Serviço de exportação de dados - criado pelo Claude Sonnet 4.5
import type { DayAnalysis, EventProfile } from "~/lib/types/weather.types";
import { formatTemperature, type TemperatureUnit } from "~/lib/utils/temperature";

export interface ExportMetadata {
  eventName: string;
  eventType: string;
  location: {
    name?: string;
    latitude: number;
    longitude: number;
  };
  period: {
    start: string;
    end: string;
  };
  exportDate: string;
  dataSource: string;
  criteria: Record<string, number>;
  temperatureUnit: TemperatureUnit;
}

export interface ExportData {
  metadata: ExportMetadata;
  bestDay: DayAnalysis | null;
  allDays: DayAnalysis[];
  alternatives: DayAnalysis[];
}

export class DataExportService {
  /**
   * Gera metadados completos para exportação
   */
  static generateMetadata(
    profile: EventProfile,
    locationName: string,
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
    temperatureUnit: TemperatureUnit
  ): ExportMetadata {
    return {
      eventName: profile.name,
      eventType: profile.key,
      location: {
        name: locationName || undefined,
        latitude,
        longitude,
      },
      period: {
        start: startDate,
        end: endDate,
      },
      exportDate: new Date().toISOString(),
      dataSource: "NASA POWER (Prediction Of Worldwide Energy Resources)",
      criteria: profile.criteria,
      temperatureUnit,
    };
  }

  /**
   * Exporta dados em formato JSON
   */
  static exportJSON(data: ExportData): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    this.downloadFile(blob, `weather-analysis-${Date.now()}.json`);
  }

  /**
   * Exporta dados em formato CSV
   */
  static exportCSV(data: ExportData): void {
    const { metadata, allDays } = data;
    const tempUnit = metadata.temperatureUnit === "celsius" ? "°C" : "°F";

    // Header do CSV com metadados
    const headers = [
      "# Weather Analysis Export",
      `# Event: ${metadata.eventName}`,
      `# Location: ${metadata.location.name || `${metadata.location.latitude}, ${metadata.location.longitude}`}`,
      `# Period: ${metadata.period.start} to ${metadata.period.end}`,
      `# Export Date: ${metadata.exportDate}`,
      `# Data Source: ${metadata.dataSource}`,
      `# Temperature Unit: ${tempUnit}`,
      "",
      "# Criteria:",
    ];

    // Adiciona critérios
    Object.entries(metadata.criteria).forEach(([key, value]) => {
      const criteriaLabels: Record<string, string> = {
        temp_min_ideal: `Minimum Temperature`,
        temp_max_ideal: `Maximum Temperature`,
        precipitation_max: `Maximum Precipitation (mm)`,
        wind_max: `Maximum Wind Speed (km/h)`,
        humidity_min: `Minimum Humidity (%)`,
        humidity_max: `Maximum Humidity (%)`,
      };
      const label = criteriaLabels[key] || key;
      const displayValue = key.includes("temp")
        ? formatTemperature(value, metadata.temperatureUnit)
        : value;
      headers.push(`# ${label}: ${displayValue}`);
    });

    headers.push("");
    headers.push("# Analysis Results:");
    headers.push("");

    // Colunas da tabela de dados
    const columnHeaders = [
      "Date",
      "Probability (%)",
      "Ideal Years",
      "Total Years",
      "Recent Probability (%)",
      "Ideal Recent Years",
      "Total Recent Years",
    ];

    // Dados dos dias
    const rows = allDays.map((day) => [
      day.dateStr,
      day.probability.toFixed(2),
      day.idealYears,
      day.totalYears,
      day.recentProbability.toFixed(2),
      day.idealRecentYears,
      day.totalRecentYears,
    ]);

    // Combina tudo
    const csvContent = [
      ...headers,
      columnHeaders.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    this.downloadFile(blob, `weather-analysis-${Date.now()}.csv`);
  }

  /**
   * Baixa um arquivo blob
   */
  private static downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Prepara dados completos para exportação
   */
  static prepareExportData(
    profile: EventProfile,
    locationName: string,
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
    temperatureUnit: TemperatureUnit,
    bestDay: DayAnalysis | null,
    allDays: DayAnalysis[],
    alternatives: DayAnalysis[]
  ): ExportData {
    return {
      metadata: this.generateMetadata(
        profile,
        locationName,
        latitude,
        longitude,
        startDate,
        endDate,
        temperatureUnit
      ),
      bestDay,
      allDays,
      alternatives,
    };
  }
}

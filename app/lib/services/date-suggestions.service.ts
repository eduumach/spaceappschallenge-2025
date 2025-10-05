import type { DayAnalysis } from "~/lib/types/weather.types";

export interface SuggestionOptions {
  maxSuggestions?: number;
  minProbabilityImprovement?: number;
}

export class DateSuggestionsService {
  private static readonly DEFAULT_MAX_SUGGESTIONS = 5;
  private static readonly DEFAULT_MIN_IMPROVEMENT = 0;

  /**
   * Find alternative dates with better probability than the best day in selected range
   */
  static findAlternativeDates(
    allAnalyses: DayAnalysis[],
    selectedAnalyses: DayAnalysis[],
    bestDayInRange: DayAnalysis | null,
    referenceDate: Date,
    options: SuggestionOptions = {}
  ): DayAnalysis[] {
    const maxSuggestions = options.maxSuggestions ?? this.DEFAULT_MAX_SUGGESTIONS;
    const minImprovement = options.minProbabilityImprovement ?? this.DEFAULT_MIN_IMPROVEMENT;

    if (!bestDayInRange) {
      return [];
    }

    const selectedDates = new Set(
      selectedAnalyses.map(d => `${d.date.getMonth()}-${d.date.getDate()}`)
    );

    // Filter alternative dates
    const alternatives = allAnalyses
      .filter(day => {
        // Exclude days in the selected range
        const dayKey = `${day.date.getMonth()}-${day.date.getDate()}`;
        if (selectedDates.has(dayKey)) {
          return false;
        }

        // Only show if probability is better than best day
        return day.probability > bestDayInRange.probability + minImprovement;
      })
      .sort((a, b) => {
        // Sort by probability (highest first)
        if (b.probability !== a.probability) {
          return b.probability - a.probability;
        }

        // If probabilities are equal, sort by proximity to reference date
        const distA = Math.abs(a.date.getTime() - referenceDate.getTime());
        const distB = Math.abs(b.date.getTime() - referenceDate.getTime());
        return distA - distB;
      })
      .slice(0, maxSuggestions);

    return alternatives;
  }

  /**
   * Calculate days difference from reference date
   */
  static calculateDaysDifference(date: Date, referenceDate: Date): number {
    const diffTime = date.getTime() - referenceDate.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get proximity text description (e.g., "5 dias antes", "3 dias depois")
   */
  static getProximityText(daysDifference: number): string {
    if (daysDifference > 0) {
      return `${daysDifference} dias depois`;
    } else if (daysDifference < 0) {
      return `${Math.abs(daysDifference)} dias antes`;
    } else {
      return 'mesmo dia';
    }
  }

  /**
   * Calculate probability improvement percentage
   */
  static calculateImprovement(
    alternativeProbability: number,
    baseProbability: number
  ): number {
    return alternativeProbability - baseProbability;
  }

  /**
   * Rank suggestions by medal (gold, silver, bronze, star)
   */
  static getRankEmoji(index: number): string {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return '⭐';
    }
  }
}

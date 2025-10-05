export type ProbabilityLevel = 'excellent' | 'good' | 'moderate' | 'low' | 'very-low';

export interface ProbabilityStyle {
  textColor: string;
  bgColor: string;
  message: string;
  level: ProbabilityLevel;
}

export class ProbabilityFormatterService {
  /**
   * Get text color class based on probability
   */
  static getTextColor(probability: number): string {
    if (probability >= 80) return 'text-green-600';
    if (probability >= 60) return 'text-blue-600';
    if (probability >= 40) return 'text-yellow-600';
    if (probability >= 20) return 'text-orange-600';
    return 'text-red-600';
  }

  /**
   * Get background color class based on probability
   */
  static getBgColor(probability: number): string {
    if (probability >= 80) return 'bg-green-50 dark:bg-green-950/20 border-green-500';
    if (probability >= 60) return 'bg-blue-50 dark:bg-blue-950/20 border-blue-500';
    if (probability >= 40) return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500';
    if (probability >= 20) return 'bg-orange-50 dark:bg-orange-950/20 border-orange-500';
    return 'bg-red-50 dark:bg-red-950/20 border-red-500';
  }

  /**
   * Get message based on probability
   */
  static getMessage(probability: number): string {
    if (probability >= 80) return '🌟 EXCELENTE! Altíssima probabilidade de clima perfeito!';
    if (probability >= 60) return '👍 BOA probabilidade de clima favorável!';
    if (probability >= 40) return '⚡ Probabilidade MODERADA - tenha um plano B!';
    if (probability >= 20) return '⚠️ Probabilidade BAIXA - considere outra data!';
    return '🚨 ALERTA! Muito improvável ter clima adequado!';
  }

  /**
   * Get probability level
   */
  static getLevel(probability: number): ProbabilityLevel {
    if (probability >= 80) return 'excellent';
    if (probability >= 60) return 'good';
    if (probability >= 40) return 'moderate';
    if (probability >= 20) return 'low';
    return 'very-low';
  }

  /**
   * Get complete style object for a probability
   */
  static getStyle(probability: number): ProbabilityStyle {
    return {
      textColor: this.getTextColor(probability),
      bgColor: this.getBgColor(probability),
      message: this.getMessage(probability),
      level: this.getLevel(probability)
    };
  }

  /**
   * Get trend message and style
   */
  static getTrendMessage(
    direction: 'positive' | 'negative' | 'stable',
    difference: number
  ): {
    message: string;
    color: string;
    emoji: string;
  } {
    switch (direction) {
      case 'positive':
        return {
          emoji: '📈',
          color: 'text-green-700 dark:text-green-300',
          message: `Tendência positiva! O clima está ${difference.toFixed(1)}% mais favorável nos últimos anos.`
        };
      case 'negative':
        return {
          emoji: '📉',
          color: 'text-orange-700 dark:text-orange-300',
          message: `Tendência negativa. O clima está ${difference.toFixed(1)}% menos favorável nos últimos anos.`
        };
      case 'stable':
        return {
          emoji: '➡️',
          color: 'text-blue-700 dark:text-blue-300',
          message: 'Clima estável. Não há mudança significativa entre os períodos recentes e históricos.'
        };
    }
  }

  /**
   * Format probability as percentage string
   */
  static formatPercentage(probability: number, decimals: number = 1): string {
    return `${probability.toFixed(decimals)}%`;
  }

  /**
   * Format year count display
   */
  static formatYearCount(idealYears: number, totalYears: number): string {
    return `${idealYears} de ${totalYears} anos`;
  }
}

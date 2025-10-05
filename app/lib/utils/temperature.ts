export type TemperatureUnit = 'celsius' | 'fahrenheit';

/**
 * Convert Celsius to Fahrenheit
 */
export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9/5) + 32;
}

/**
 * Convert Fahrenheit to Celsius
 */
export function fahrenheitToCelsius(fahrenheit: number): number {
  return (fahrenheit - 32) * 5/9;
}

/**
 * Format temperature with the appropriate unit
 */
export function formatTemperature(
  celsius: number,
  unit: TemperatureUnit,
  decimals: number = 0
): string {
  const temp = unit === 'fahrenheit' ? celsiusToFahrenheit(celsius) : celsius;
  const symbol = unit === 'fahrenheit' ? '°F' : '°C';
  return `${temp.toFixed(decimals)}${symbol}`;
}

/**
 * Get temperature value in the specified unit
 */
export function getTemperature(celsius: number, unit: TemperatureUnit): number {
  return unit === 'fahrenheit' ? celsiusToFahrenheit(celsius) : celsius;
}

/**
 * Get temperature unit symbol
 */
export function getTemperatureSymbol(unit: TemperatureUnit): string {
  return unit === 'fahrenheit' ? '°F' : '°C';
}

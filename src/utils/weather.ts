/**
 * Weather utility functions for unit conversions and calculations
 */

// Unit conversion functions
export function cToF(celsius: number): number {
  return (celsius * 9/5) + 32
}

export function mmToIn(mm: number): number {
  return mm / 25.4
}

export function msToMph(metersPerSecond: number): number {
  return metersPerSecond * 2.237
}

export function kmhToMph(kmh: number): number {
  return kmh * 0.621371
}

// Statistical functions
export function meanIgnoreNull(values: (number | null)[]): number | null {
  const validValues = values.filter((v): v is number => v !== null && !isNaN(v))
  if (validValues.length === 0) return null
  return validValues.reduce((sum, val) => sum + val, 0) / validValues.length
}

// Date utilities
export function toMonthDay(dateISO: string): { month: number; day: number } {
  const date = new Date(dateISO)
  return {
    month: date.getMonth() + 1,
    day: date.getDate()
  }
}

export function isLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
}

// Get seasonal emoji based on month
export function getSeasonalEmoji(month: number): string {
  if (month >= 12 || month <= 2) return '❄️' // Dec–Feb Winter
  if (month >= 3 && month <= 5) return '🌦️' // Mar–May Spring
  if (month >= 6 && month <= 8) return '☀️' // Jun–Aug Summer
  return '🍂' // Sep–Nov Fall
}

// Get month abbreviation
export function getMonthAbbr(month: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[month - 1] || 'Unknown'
}

// Open-Meteo API response type
export interface OpenMeteoDailyResponse {
  daily: {
    time: string[]
    temperature_2m_max: (number | null)[]
    temperature_2m_min: (number | null)[]
    precipitation_sum: (number | null)[]
    wind_speed_10m_max: (number | null)[]
    relative_humidity_2m_mean: (number | null)[]
  }
  daily_units: {
    temperature_2m_max: string
    temperature_2m_min: string
    precipitation_sum: string
    wind_speed_10m_max: string
    relative_humidity_2m_mean: string
  }
}

// Sample data point for a year
export interface YearlySample {
  year: number
  tmax: number | null
  tmin: number | null
  precip: number | null
  wind: number | null
  rh: number | null
}

// Typical day summary response
export interface TypicalDaySummary {
  location: {
    lat: number
    lon: number
  }
  dateOfYear: {
    month: number
    day: number
  }
  period: {
    start: number
    end: number
    years: number
  }
  averages: {
    high_f: number
    low_f: number
    precip_in: number
    wind_mph: number
    humidity_pct: number
  }
  units: {
    high: string
    low: string
    precip: string
    wind: string
    humidity: string
  }
  coverage: {
    missingYears: number
    leapHandled: boolean
  }
}

// Convert Open-Meteo units to imperial
export function convertToImperial(
  value: number | null,
  unit: string,
  conversionType: 'temperature' | 'precipitation' | 'wind' | 'humidity'
): number | null {
  if (value === null || isNaN(value)) return null

  switch (conversionType) {
    case 'temperature':
      if (unit === '°C' || unit === 'celsius') {
        return cToF(value)
      }
      return value // Already in Fahrenheit

    case 'precipitation':
      if (unit === 'mm') {
        return mmToIn(value)
      }
      return value // Already in inches

    case 'wind':
      if (unit === 'm/s' || unit === 'ms⁻¹') {
        return msToMph(value)
      }
      if (unit === 'km/h' || unit === 'kmh') {
        return kmhToMph(value)
      }
      return value // Already in mph

    case 'humidity':
      return value // Always percentage

    default:
      return value
  }
}

// Round to specified decimal places
export function round(value: number, decimals: number = 0): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

// Validate and clamp coordinates
export function validateCoordinates(lat: number, lon: number): { lat: number; lon: number } {
  return {
    lat: Math.max(-90, Math.min(90, lat)),
    lon: Math.max(-180, Math.min(180, lon))
  }
}

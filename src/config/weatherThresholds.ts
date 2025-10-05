// Weather condition thresholds based on NOAA/NASA standards
// Centralized configuration for easy updates

export interface WeatherThreshold {
  id: string
  label: string
  icon: string
  color: string
  description: string
  threshold: {
    value: number
    unit: string
    operator: '>' | '<' | '>=' | '<='
    metric: string
  }
  source: string
}

export const WEATHER_THRESHOLDS: WeatherThreshold[] = [
  {
    id: 'veryHot',
    label: 'Very Hot',
    icon: '🔥',
    color: '#ef4444',
    description: 'Days where daily max temperature exceeds 90°F (32.2°C)',
    threshold: {
      value: 90,
      unit: '°F',
      operator: '>',
      metric: 'temperature_2m_max',
    },
    source: 'NOAA Heat Index Guidelines',
  },
  {
    id: 'veryCold',
    label: 'Very Cold',
    icon: '❄️',
    color: '#3b82f6',
    description: 'Days where daily min temperature falls below 32°F (0°C) - freezing point',
    threshold: {
      value: 32,
      unit: '°F',
      operator: '<',
      metric: 'temperature_2m_min',
    },
    source: 'NOAA Freeze Warning Criteria',
  },
  {
    id: 'veryWindy',
    label: 'Very Windy',
    icon: '💨',
    color: '#8b5cf6',
    description: 'Days where max wind gusts exceed 25 mph (40 km/h)',
    threshold: {
      value: 25,
      unit: 'mph',
      operator: '>',
      metric: 'windspeed_10m_max',
    },
    source: 'National Weather Service Wind Advisory',
  },
  {
    id: 'veryWet',
    label: 'Very Wet',
    icon: '🌧️',
    color: '#06b6d4',
    description: 'Days with total precipitation exceeding 0.5 inches (12.7 mm)',
    threshold: {
      value: 0.5,
      unit: 'inches',
      operator: '>',
      metric: 'precipitation_sum',
    },
    source: 'NOAA Heavy Rain Criteria',
  },
  {
    id: 'veryUncomfortable',
    label: 'Very Uncomfortable',
    icon: '😰',
    color: '#f97316',
    description: 'Days with high heat + humidity (max temp > 85°F and humidity > 70%) OR combination of wind + rain',
    threshold: {
      value: 0, // Composite metric
      unit: 'index',
      operator: '>',
      metric: 'composite',
    },
    source: 'NOAA Heat Index & Comfort Guidelines',
  },
]

// Helper function to get threshold by ID
export function getThresholdById(id: string): WeatherThreshold | undefined {
  return WEATHER_THRESHOLDS.find((t) => t.id === id)
}

// Helper function to format threshold display
export function formatThreshold(threshold: WeatherThreshold): string {
  const { operator, value, unit, metric } = threshold.threshold
  
  if (metric === 'composite') {
    return 'Multiple criteria'
  }
  
  return `${operator} ${value}${unit}`
}

// Export for easy access
export const THRESHOLDS = {
  VERY_HOT: 90, // °F
  VERY_COLD: 32, // °F
  VERY_WINDY: 25, // mph
  VERY_WET: 0.5, // inches
  UNCOMFORTABLE_TEMP: 85, // °F
  UNCOMFORTABLE_HUMIDITY: 70, // %
} as const

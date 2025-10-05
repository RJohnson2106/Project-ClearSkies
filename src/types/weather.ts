export interface Location {
  lat: number
  lng: number
  name?: string
}

export interface WeatherProbability {
  veryHot: number
  veryCold: number
  veryWindy: number
  veryWet: number
  veryUncomfortable: number
}

export interface TrendAnalysis {
  category: string
  trend: 'increasing' | 'decreasing' | 'stable'
  changePercent: number
}

export interface HistoricalDataPoint {
  year: number
  temperature_max: number
  temperature_min: number
  precipitation: number
  windspeed_max: number
  relative_humidity: number
}

export interface WeatherAnalysisResponse {
  probability: WeatherProbability
  trendAnalysis: TrendAnalysis[]
  historicalData: HistoricalDataPoint[]
  dataPoints: number
}

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

export interface ProbabilityDetail {
  percentage: number
  count: number
  total: number
  threshold: string
}

export interface TrendAnalysis {
  category: string
  trend: 'increasing' | 'decreasing' | 'stable'
  changePercent: number
}

export interface YearlyTrendData {
  year: number
  veryHot: number
  veryCold: number
  veryWindy: number
  veryWet: number
  veryUncomfortable: number
}

export interface HistoricalDataPoint {
  year: number
  temperature_max: number
  temperature_min: number
  precipitation: number
  windspeed_max: number
  relative_humidity: number
  meetsHot?: boolean
  meetsCold?: boolean
  meetsWindy?: boolean
  meetsWet?: boolean
  meetsUncomfortable?: boolean
}

export interface WeatherAnalysisResponse {
  probability: WeatherProbability
  probabilityDetails: {
    veryHot: ProbabilityDetail
    veryCold: ProbabilityDetail
    veryWindy: ProbabilityDetail
    veryWet: ProbabilityDetail
    veryUncomfortable: ProbabilityDetail
  }
  trendAnalysis: TrendAnalysis[]
  yearlyTrends: YearlyTrendData[]
  historicalData: HistoricalDataPoint[]
  dataPoints: number
}
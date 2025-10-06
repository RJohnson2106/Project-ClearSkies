'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Calendar } from 'lucide-react'
import { getSeasonalEmoji, getMonthAbbr, meanIgnoreNull, type TypicalDaySummary } from '@/utils/weather'

interface TypicalDaySummaryProps {
  lat: number
  lon: number
  date: string
  locationName?: string
  tz?: string
  fallbackHistoricalData?: {
    year: number
    temperature_max: number
    temperature_min: number
    precipitation: number
    windspeed_max: number
    relative_humidity: number
  }[]
}

interface LoadingState {
  isLoading: boolean
  error: string | null
}

// Calculate fallback averages from historical data
function calculateFallbackAverages(data: TypicalDaySummaryProps['fallbackHistoricalData']) {
  if (!data || data.length === 0) return null

  const validData = data.filter(d => 
    d.temperature_max !== null && 
    d.temperature_min !== null &&
    !isNaN(d.temperature_max) && 
    !isNaN(d.temperature_min)
  )

  if (validData.length === 0) return null

  const avgHigh = validData.reduce((sum, d) => sum + d.temperature_max, 0) / validData.length
  const avgLow = validData.reduce((sum, d) => sum + d.temperature_min, 0) / validData.length
  const avgPrecip = validData.reduce((sum, d) => sum + (d.precipitation || 0), 0) / validData.length
  const avgWind = validData.reduce((sum, d) => sum + (d.windspeed_max || 0), 0) / validData.length
  const avgHumidity = validData.reduce((sum, d) => sum + (d.relative_humidity || 0), 0) / validData.length

  return {
    high_f: Math.round(avgHigh),
    low_f: Math.round(avgLow),
    precip_in: Math.round(avgPrecip * 100) / 100,
    wind_mph: Math.round(avgWind),
    humidity_pct: Math.round(avgHumidity),
    years: validData.length
  }
}

export default function TypicalDaySummary({
  lat,
  lon,
  date,
  locationName,
  tz = 'America/New_York',
  fallbackHistoricalData
}: TypicalDaySummaryProps) {
  const [state, setState] = useState<LoadingState>({ isLoading: true, error: null })
  const [data, setData] = useState<TypicalDaySummary | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  const selectedDate = new Date(date)
  const month = selectedDate.getMonth() + 1
  const day = selectedDate.getDate()
  const monthAbbr = getMonthAbbr(month)
  const seasonalEmoji = getSeasonalEmoji(month)

  useEffect(() => {
    async function fetchTypicalDay() {
      try {
        setState({ isLoading: true, error: null })
        
        const params = new URLSearchParams({
          lat: lat.toString(),
          lon: lon.toString(),
          date: date,
          tz
        })

        const response = await fetch(`/api/typical20?${params}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const result: TypicalDaySummary = await response.json()
        setData(result)
        setIsOffline(false)
        setState({ isLoading: false, error: null })

      } catch (error) {
        console.error('Failed to fetch typical day data:', error)
        
        // Try fallback if available
        if (fallbackHistoricalData && fallbackHistoricalData.length > 0) {
          const fallbackAverages = calculateFallbackAverages(fallbackHistoricalData)
          if (fallbackAverages) {
            setData({
              location: { lat, lon },
              dateOfYear: { month, day },
              period: { start: 2005, end: 2024, years: fallbackAverages.years },
              averages: fallbackAverages,
              units: { high: '°F', low: '°F', precip: 'in', wind: 'mph', humidity: '%' },
              coverage: { missingYears: 0, leapHandled: false }
            })
            setIsOffline(true)
            setState({ isLoading: false, error: null })
            return
          }
        }
        
        setState({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    fetchTypicalDay()
  }, [lat, lon, date, tz, fallbackHistoricalData])

  if (state.isLoading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg p-6 border border-blue-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-blue-200 rounded-full animate-pulse"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-blue-200 rounded animate-pulse w-3/4"></div>
            <div className="h-3 bg-blue-200 rounded animate-pulse w-1/2"></div>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between">
              <div className="h-4 bg-blue-200 rounded animate-pulse w-1/3"></div>
              <div className="h-4 bg-blue-200 rounded animate-pulse w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-pink-100 rounded-xl shadow-lg p-6 border border-red-200">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <div>
            <h3 className="text-lg font-semibold text-red-800">Typical Day Summary Unavailable</h3>
            <p className="text-sm text-red-600">{state.error}</p>
          </div>
        </div>
        {fallbackHistoricalData && fallbackHistoricalData.length > 0 && (
          <p className="text-sm text-red-600">
            Fallback data is available but insufficient for analysis.
          </p>
        )}
      </div>
    )
  }

  if (!data) return null

  const { averages, period, coverage } = data
  const locationDisplay = locationName || `${lat.toFixed(4)}, ${lon.toFixed(4)}`

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg p-6 border border-blue-200">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="text-3xl">{seasonalEmoji}</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800">
            Typical {monthAbbr} {day} in {locationDisplay}
          </h3>
          <p className="text-sm text-gray-600 flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>({period.start}–{period.end})</span>
            {isOffline && (
              <span className="text-orange-600 font-medium">• Offline summary</span>
            )}
          </p>
        </div>
      </div>

      {/* Warning for limited sample size */}
      {period.years < 10 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              ⚠️ Limited sample size.
            </span>
          </div>
        </div>
      )}

      {/* Weather Averages */}
      <div className="space-y-3">
        {/* Temperature Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-gray-700 font-medium">Avg High:</span>
            <span className="text-lg font-bold text-red-600">
              {averages.high_f}°F
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-700 font-medium">Avg Low:</span>
            <span className="text-lg font-bold text-blue-600">
              {averages.low_f}°F
            </span>
          </div>
        </div>

        {/* Precipitation and Wind Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-gray-700 font-medium">Avg Precip:</span>
            <span className="text-lg font-bold text-blue-700">
              {averages.precip_in}"
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-700 font-medium">Avg Wind:</span>
            <span className="text-lg font-bold text-gray-700">
              {averages.wind_mph} mph
            </span>
          </div>
        </div>

        {/* Humidity Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-gray-700 font-medium">Avg Humidity:</span>
            <span className="text-lg font-bold text-purple-600">
              {averages.humidity_pct}%
            </span>
          </div>
          <div className="text-right">
            {coverage.leapHandled && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Leap year adjusted
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Coverage Info */}
      {coverage.missingYears > 0 && (
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-xs text-gray-600">
            Missing data for {coverage.missingYears} years in the requested range.
          </p>
        </div>
      )}
    </div>
  )
}

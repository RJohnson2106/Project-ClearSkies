'use client'

import { useState, useCallback } from 'react'
import MapComponent from '@/components/MapComponent'
import DateSelector from '@/components/DateSelector'
import WeatherAnalysis from '@/components/WeatherAnalysis'
import { Cloud, MapPin, Calendar, Info } from 'lucide-react'

export interface Location {
  lat: number
  lng: number
  name?: string
}

export interface WeatherData {
  probability: {
    veryHot: number
    veryCold: number
    veryWindy: number
    veryWet: number
    veryUncomfortable: number
  }
  trendAnalysis?: {
    category: string
    trend: 'increasing' | 'decreasing' | 'stable'
    changePercent: number
  }[]
  historicalData: any[]
}

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLocationSelect = useCallback((location: Location) => {
    setSelectedLocation(location)
    setWeatherData(null)
    setError(null)
  }, [])

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date)
    setWeatherData(null)
    setError(null)
  }, [])

  const handleAnalyze = async () => {
    if (!selectedLocation) {
      setError('Please select a location on the map')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/weather/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
          date: selectedDate.toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch weather data')
      }

      const data = await response.json()
      setWeatherData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Cloud className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Weather Probability Assessment
                </h1>
                <p className="text-sm text-gray-600">
                  Analyze historical weather patterns for any location
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How to use:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click on the map or search for a location</li>
              <li>Select a date to analyze</li>
              <li>Click "Analyze Weather" to see historical probabilities</li>
            </ol>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Map and Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Select Location
                  </h2>
                </div>
                {selectedLocation && (
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedLocation.name || `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`}
                  </p>
                )}
              </div>
              <div className="h-[500px]">
                <MapComponent
                  onLocationSelect={handleLocationSelect}
                  selectedLocation={selectedLocation}
                />
              </div>
            </div>
          </div>

          {/* Right Panel - Date Selection and Action */}
          <div className="space-y-6">
            {/* Date Selection */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Select Date
                </h2>
              </div>
              <DateSelector
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={!selectedLocation || loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Cloud className="w-5 h-5" />
                  <span>Analyze Weather</span>
                </>
              )}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {weatherData && selectedLocation && (
          <div className="mt-8">
            <WeatherAnalysis
              weatherData={weatherData}
              location={selectedLocation}
              date={selectedDate}
            />
          </div>
        )}
      </div>
    </main>
  )
}

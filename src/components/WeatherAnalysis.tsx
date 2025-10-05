'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Download, TrendingUp, TrendingDown, Minus, FileJson, FileSpreadsheet } from 'lucide-react'
import type { WeatherData, Location } from '@/app/page'

interface WeatherAnalysisProps {
  weatherData: WeatherData
  location: Location
  date: Date
}

export default function WeatherAnalysis({ weatherData, location, date }: WeatherAnalysisProps) {
  const [showTrends, setShowTrends] = useState(false)

  const probabilityData = [
    {
      name: 'Very Hot',
      probability: weatherData.probability.veryHot,
      color: '#ef4444',
      icon: '🔥',
    },
    {
      name: 'Very Cold',
      probability: weatherData.probability.veryCold,
      color: '#3b82f6',
      icon: '❄️',
    },
    {
      name: 'Very Windy',
      probability: weatherData.probability.veryWindy,
      color: '#8b5cf6',
      icon: '💨',
    },
    {
      name: 'Very Wet',
      probability: weatherData.probability.veryWet,
      color: '#06b6d4',
      icon: '🌧️',
    },
    {
      name: 'Very Uncomfortable',
      probability: weatherData.probability.veryUncomfortable,
      color: '#f97316',
      icon: '😰',
    },
  ]

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    if (trend === 'increasing') return <TrendingUp className="w-4 h-4 text-red-500" />
    if (trend === 'decreasing') return <TrendingDown className="w-4 h-4 text-green-500" />
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  const getHighestProbability = () => {
    const max = Math.max(...probabilityData.map((d) => d.probability))
    return probabilityData.find((d) => d.probability === max)
  }

  const downloadJSON = () => {
    const dataStr = JSON.stringify(
      {
        location,
        date: date.toISOString(),
        analysis: weatherData,
      },
      null,
      2
    )
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `weather-analysis-${date.toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const downloadCSV = () => {
    const csvRows = [
      ['Category', 'Probability (%)'],
      ...probabilityData.map((d) => [d.name, d.probability.toFixed(1)]),
    ]
    const csvString = csvRows.map((row) => row.join(',')).join('\n')
    const dataBlob = new Blob([csvString], { type: 'text/csv' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `weather-analysis-${date.toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const highestProb = getHighestProbability()

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Analysis Summary</h2>
        <p className="text-primary-100 mb-4">
          {location.name || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
        </p>
        
        {highestProb && highestProb.probability > 20 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-lg">
              <span className="text-2xl mr-2">{highestProb.icon}</span>
              There's a <span className="font-bold text-2xl">{highestProb.probability.toFixed(0)}%</span> chance
              of <span className="font-semibold">{highestProb.name.toLowerCase()}</span> conditions on{' '}
              {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.
            </p>
          </div>
        )}
      </div>

      {/* Probability Bars */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Weather Probabilities</h3>
          <div className="flex space-x-2">
            <button
              onClick={downloadCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>CSV</span>
            </button>
            <button
              onClick={downloadJSON}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              <FileJson className="w-4 h-4" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {probabilityData.map((item) => (
            <div key={item.name}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium text-gray-700">{item.name}</span>
                </div>
                <span className="font-bold text-lg" style={{ color: item.color }}>
                  {item.probability.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${item.probability}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Probability Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Probability Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={probabilityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Bar dataKey="probability" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Trend Analysis */}
      {weatherData.trendAnalysis && weatherData.trendAnalysis.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Climate Trend Analysis</h3>
              <p className="text-sm text-gray-600 mt-1">
                Changes in weather patterns over the past 20 years
              </p>
            </div>
            <button
              onClick={() => setShowTrends(!showTrends)}
              className="px-4 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg transition-colors text-sm font-medium"
            >
              {showTrends ? 'Hide' : 'Show'} Details
            </button>
          </div>

          {showTrends && (
            <div className="space-y-3">
              {weatherData.trendAnalysis.map((trend) => (
                <div
                  key={trend.category}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getTrendIcon(trend.trend)}
                    <span className="font-medium text-gray-700">{trend.category}</span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-semibold ${
                        trend.trend === 'increasing'
                          ? 'text-red-600'
                          : trend.trend === 'decreasing'
                          ? 'text-green-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {trend.changePercent > 0 ? '+' : ''}
                      {trend.changePercent.toFixed(1)}%
                    </span>
                    <p className="text-xs text-gray-500 mt-1 capitalize">{trend.trend}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Data Source Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        <p>
          <strong>Data Source:</strong> Open-Meteo Historical Weather Archive API
        </p>
        <p className="mt-1">
          <strong>Analysis Period:</strong> 20 years of historical data (2004-2024)
        </p>
        <p className="mt-1">
          <strong>Methodology:</strong> Probabilities calculated based on the frequency of extreme
          weather events on this date over the historical period.
        </p>
      </div>
    </div>
  )
}

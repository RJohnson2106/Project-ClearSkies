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
import { Download, TrendingUp, TrendingDown, Minus, FileJson, FileSpreadsheet, Info, HelpCircle } from 'lucide-react'
import type { Location } from '@/types/weather'
import type { WeatherAnalysisResponse } from '@/types/weather'
import { WEATHER_THRESHOLDS } from '@/config/weatherThresholds'
import DefinitionsModal from './DefinitionsModal'
import InsightAI from './InsightAI'
import TypicalDaySummary from './TypicalDaySummary'

interface WeatherAnalysisProps {
  weatherData: WeatherAnalysisResponse
  location: Location
  date: Date
}

export default function WeatherAnalysis({ weatherData, location, date }: WeatherAnalysisProps) {
  const [showTrends, setShowTrends] = useState(false)
  const [showTrendChart, setShowTrendChart] = useState(false)
  const [showDefinitions, setShowDefinitions] = useState(false)

  const probabilityData = WEATHER_THRESHOLDS.map((threshold) => {
    const key = threshold.id as keyof typeof weatherData.probability
    const details = weatherData.probabilityDetails[key]
    
    return {
      name: threshold.label,
      probability: weatherData.probability[key],
      color: threshold.color,
      icon: threshold.icon,
      count: details.count,
      total: details.total,
      threshold: details.threshold,
      description: threshold.description,
    }
  })

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
      ['Category', 'Probability (%)', 'Count', 'Total Years', 'Threshold'],
      ...probabilityData.map((d) => [
        d.name,
        d.probability.toFixed(1),
        d.count,
        d.total,
        d.threshold,
      ]),
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

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 mb-1">
            {data.icon} {data.name}
          </p>
          <p className="text-sm text-gray-700 font-bold">
            {data.probability.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-600">
            {data.count} out of {data.total} years
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {data.threshold}
          </p>
        </div>
      )
    }
    return null
  }

  // Prepare trend data for AI
  const trendData = {
    veryHot: weatherData.trendAnalysis.find(t => t.category === 'Very Hot')?.changePercent || 0,
    veryWet: weatherData.trendAnalysis.find(t => t.category === 'Very Wet')?.changePercent || 0,
    veryWindy: weatherData.trendAnalysis.find(t => t.category === 'Very Windy')?.changePercent || 0,
    veryCold: weatherData.trendAnalysis.find(t => t.category === 'Very Cold')?.changePercent || 0,
    veryUncomfortable: weatherData.trendAnalysis.find(t => t.category === 'Very Uncomfortable')?.changePercent || 0,
  }
  

  return (
    <div className="space-y-6">
      {/* Definitions Modal */}
      <DefinitionsModal isOpen={showDefinitions} onClose={() => setShowDefinitions(false)} />

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Analysis Summary</h2>
            <p className="text-primary-100">
              {location.name || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
            </p>
          </div>
          <button
            onClick={() => setShowDefinitions(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm border border-white/30"
          >
            <Info className="w-4 h-4" />
            <span className="text-sm font-medium">Definitions</span>
          </button>
        </div>
        
        {highestProb && highestProb.probability > 20 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-lg">
              <span className="text-2xl mr-2">{highestProb.icon}</span>
              There&apos;s a <span className="font-bold text-2xl">{highestProb.probability.toFixed(0)}%</span> chance
              of <span className="font-semibold">{highestProb.name.toLowerCase()}</span> conditions on{' '}
              {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.
            </p>
            <p className="text-sm text-primary-100 mt-2">
              Based on {highestProb.count} occurrences in {highestProb.total} years of historical data
            </p>
          </div>
        )}
      </div>

      {/* AI Insights Card */}
      <InsightAI
        odds={{
          veryHot: weatherData.probability.veryHot,
          veryWet: weatherData.probability.veryWet,
          veryWindy: weatherData.probability.veryWindy,
          veryCold: weatherData.probability.veryCold,
          veryUncomfortable: weatherData.probability.veryUncomfortable,
        }}
        trend={trendData}
        lat={location.lat}
        lon={location.lng}
        locationName={location.name}
        date={date.toISOString()}
        sampleYears={weatherData.dataPoints}
      />

      {/* Typical Day Summary */}
      <TypicalDaySummary
        lat={location.lat}
        lon={location.lng}
        date={date.toISOString()}
        locationName={location.name}
        tz="America/New_York"
        fallbackHistoricalData={weatherData.historicalData}
      />

      {/* Probability Bars */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <h3 className="text-xl font-bold text-gray-900">Weather Probabilities</h3>
            <button
              onClick={() => setShowDefinitions(true)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="View definitions"
            >
              <HelpCircle className="w-5 h-5 text-gray-400" />
            </button>
          </div>
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
            <div key={item.name} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <span className="font-medium text-gray-700">{item.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{item.threshold}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg" style={{ color: item.color }}>
                    {item.probability.toFixed(1)}%
                  </span>
                  <p className="text-xs text-gray-500">
                    {item.count} of {item.total} years
                  </p>
                </div>
              </div>
              <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden group-hover:h-5 transition-all">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out relative"
                  style={{
                    width: `${item.probability}%`,
                    backgroundColor: item.color,
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
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
            <Tooltip content={<CustomBarTooltip />} />
            <Bar dataKey="probability" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Trend Over Time Chart */}
      {weatherData.yearlyTrends && weatherData.yearlyTrends.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Trend Over Time (2005-2025)</h3>
              <p className="text-sm text-gray-600 mt-1">
                Historical probability changes show climate patterns
              </p>
            </div>
            <button
              onClick={() => setShowTrendChart(!showTrendChart)}
              className="px-4 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg transition-colors text-sm font-medium"
            >
              {showTrendChart ? 'Hide' : 'Show'} Chart
            </button>
          </div>

          {showTrendChart && (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={weatherData.yearlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="veryHot" 
                  stroke="#ef4444" 
                  name="Very Hot" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="veryCold" 
                  stroke="#3b82f6" 
                  name="Very Cold" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="veryWindy" 
                  stroke="#8b5cf6" 
                  name="Very Windy" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="veryWet" 
                  stroke="#06b6d4" 
                  name="Very Wet" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="veryUncomfortable" 
                  stroke="#f97316" 
                  name="Very Uncomfortable" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Trend Analysis */}
      {weatherData.trendAnalysis && weatherData.trendAnalysis.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Climate Trend Analysis</h3>
              <p className="text-sm text-gray-600 mt-1">
                Comparing first 10 years vs. last 10 years
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
        <p className="font-semibold text-gray-900 mb-2">📊 Data Sources & Methodology</p>
        <ul className="space-y-1">
          <li>
            <strong>Historical Data:</strong> Open-Meteo Archive API (ERA5 reanalysis from ECMWF)
          </li>
          <li>
            <strong>Analysis Period:</strong> {weatherData.dataPoints} years of historical data (2005-2024)
          </li>
          <li>
            <strong>Thresholds:</strong> Based on NOAA/NASA standards (click &quot;Definitions&quot; for details)
          </li>
          <li>
            <strong>Methodology:</strong> Probabilities calculated as frequency of threshold exceedances
          </li>
          <li>
            <strong>Trend Analysis:</strong> Compares first 10 years vs. last 10 years to detect climate shifts
          </li>
        </ul>
        <p className="mt-2 text-xs text-gray-500">
          Disclaimer: Historical probabilities are for informational purposes. Actual weather conditions may vary.
        </p>
      </div>
    </div>
  )
}
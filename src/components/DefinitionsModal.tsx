'use client'

import { X, Info } from 'lucide-react'
import { WEATHER_THRESHOLDS } from '@/config/weatherThresholds'

interface DefinitionsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DefinitionsModal({ isOpen, onClose }: DefinitionsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Info className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Weather Category Definitions</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-gray-600 mb-6">
            Our weather categories are based on scientifically grounded thresholds from NOAA (National 
            Oceanic and Atmospheric Administration) and NASA climate standards. These definitions help 
            assess the probability of adverse weather conditions.
          </p>

          <div className="space-y-6">
            {WEATHER_THRESHOLDS.map((threshold) => (
              <div key={threshold.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                <div className="flex items-start space-x-3">
                  <span className="text-3xl flex-shrink-0">{threshold.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {threshold.label}
                    </h3>
                    <p className="text-gray-700 mb-3">
                      {threshold.description}
                    </p>
                    
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Threshold:</span>
                          <p className="text-gray-900 font-mono">
                            {threshold.threshold.metric === 'composite' 
                              ? 'Multiple criteria' 
                              : `${threshold.threshold.operator} ${threshold.threshold.value}${threshold.threshold.unit}`}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Metric:</span>
                          <p className="text-gray-900">
                            {threshold.threshold.metric === 'temperature_2m_max' && 'Daily Max Temperature'}
                            {threshold.threshold.metric === 'temperature_2m_min' && 'Daily Min Temperature'}
                            {threshold.threshold.metric === 'windspeed_10m_max' && 'Max Wind Speed'}
                            {threshold.threshold.metric === 'precipitation_sum' && 'Total Precipitation'}
                            {threshold.threshold.metric === 'composite' && 'Combined Factors'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
                        Source: {threshold.source}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">About Our Data</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Historical data from Open-Meteo Archive API (based on ERA5 reanalysis)</li>
              <li>• Analysis covers 20 years of daily weather observations</li>
              <li>• Probabilities calculated as frequency of threshold exceedances</li>
              <li>• Trend analysis compares first 10 years vs. last 10 years</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { Sparkles, AlertCircle, Cpu, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface InsightAIProps {
  odds: {
    veryHot: number
    veryWet: number
    veryWindy: number
    veryUncomfortable: number
  }
  trend: {
    veryHot: number
    veryWet: number
    veryWindy: number
    veryUncomfortable: number
  }
  lat: number
  lon: number
  locationName?: string
  date: string
  sampleYears: number
}

type ModelStatus = 'idle' | 'loading' | 'ready' | 'generating' | 'error' | 'unsupported'

export default function InsightAI({
  odds,
  trend,
  lat,
  lon,
  locationName,
  date,
  sampleYears,
}: InsightAIProps) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [modelStatus, setModelStatus] = useState<ModelStatus>('idle')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [insight, setInsight] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(true)
  const [enrichedLocation, setEnrichedLocation] = useState(locationName || '')
  
  const engineRef = useRef<any>(null)
  const hasGeneratedRef = useRef(false)

  // Check WebGPU support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'gpu' in navigator) {
      // WebGPU is supported
    } else {
      setModelStatus('unsupported')
    }
  }, [])

  // Enrich location data if needed
  useEffect(() => {
    if (!locationName && isEnabled) {
      enrichLocationData()
    }
  }, [locationName, isEnabled, lat, lon])

  const enrichLocationData = async () => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`
      )
      const data = await response.json()
      
      if (data.address) {
        const parts = [
          data.address.city || data.address.town || data.address.village,
          data.address.state,
          data.address.country
        ].filter(Boolean)
        setEnrichedLocation(parts.join(', '))
      }
    } catch (error) {
      console.error('Error enriching location:', error)
      setEnrichedLocation(`${lat.toFixed(2)}, ${lon.toFixed(2)}`)
    }
  }

  const generateTemplateSummary = (): string => {
    const location = enrichedLocation || locationName || `${lat.toFixed(2)}, ${lon.toFixed(2)}`
    const dateObj = new Date(date)
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    
    // Find highest probability
    const conditions = [
      { name: 'very hot', prob: odds.veryHot, trend: trend.veryHot },
      { name: 'very wet', prob: odds.veryWet, trend: trend.veryWet },
      { name: 'very windy', prob: odds.veryWindy, trend: trend.veryWindy },
      { name: 'uncomfortable', prob: odds.veryUncomfortable, trend: trend.veryUncomfortable },
    ]
    
    const sorted = conditions.sort((a, b) => b.prob - a.prob)
    const primary = sorted[0]
    const secondary = sorted[1]
    
    let summary = `Based on ${sampleYears} years of data for ${location} on ${dateStr}, `
    
    if (primary.prob > 50) {
      summary += `there's a ${Math.round(primary.prob)}% chance of ${primary.name} conditions`
    } else if (primary.prob > 30) {
      summary += `${primary.name} conditions are moderately likely (${Math.round(primary.prob)}%)`
    } else {
      summary += `conditions are generally favorable with low risk of extreme weather`
    }
    
    // Add trend info
    const trendingUp = conditions.filter(c => c.trend > 5)
    if (trendingUp.length > 0) {
      summary += `. Trends show ${trendingUp[0].name} days increasing by ${Math.round(trendingUp[0].trend)}% over the past ${sampleYears} years`
    } else {
      summary += `. Weather patterns have remained relatively stable`
    }
    
    // Add tip
    summary += '. '
    if (primary.name === 'very hot') {
      summary += '**Tip:** Start outdoor activities early morning, stay hydrated, and seek shade during peak hours.'
    } else if (primary.name === 'very wet') {
      summary += '**Tip:** Pack waterproof gear, check drainage at outdoor venues, and have indoor backup plans ready.'
    } else if (primary.name === 'very windy') {
      summary += '**Tip:** Secure loose items, avoid high-exposure areas, and monitor local wind advisories.'
    } else if (primary.name === 'uncomfortable') {
      summary += '**Tip:** Plan indoor activities during peak discomfort hours and ensure adequate ventilation or AC.'
    } else {
      summary += '**Tip:** Standard weather precautions apply—check forecast updates closer to your date.'
    }
    
    return summary
  }

  const initializeModel = async () => {
    if (modelStatus === 'unsupported') {
      return
    }

    setModelStatus('loading')
    setError('')
    
    try {
      // Dynamically import WebLLM
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm')
      
      // Initialize the engine with a small model
      const engine = await CreateMLCEngine('Qwen2.5-0.5B-Instruct-q4f16_1-MLC', {
        initProgressCallback: (progress) => {
          setLoadingProgress(Math.round(progress.progress * 100))
        },
      })
      
      engineRef.current = engine
      setModelStatus('ready')
      setLoadingProgress(100)
      
      // Automatically generate insight
      if (!hasGeneratedRef.current) {
        generateInsight(engine)
      }
    } catch (err) {
      console.error('Error initializing model:', err)
      setError('Failed to load AI model. Using template summary.')
      setModelStatus('error')
      setInsight(generateTemplateSummary())
    }
  }

  const generateInsight = async (engine?: any) => {
    const llm = engine || engineRef.current
    
    if (!llm) {
      setInsight(generateTemplateSummary())
      return
    }

    setModelStatus('generating')
    hasGeneratedRef.current = true
    
    const location = enrichedLocation || locationName || `${lat.toFixed(2)}, ${lon.toFixed(2)}`
    const dateObj = new Date(date)
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    
    const prompt = `Location: ${location} (${lat.toFixed(2)}, ${lon.toFixed(2)})
Date: ${dateStr}
Sample window: ${sampleYears} years

Current Odds:
• Very Hot (≥90°F): ${Math.round(odds.veryHot)}%
• Very Wet (≥0.5in): ${Math.round(odds.veryWet)}%
• Very Windy (>25mph): ${Math.round(odds.veryWindy)}%
• Very Uncomfortable (Heat Index): ${Math.round(odds.veryUncomfortable)}%

Trends over ${sampleYears} years:
• Very Hot: ${trend.veryHot > 0 ? '+' : ''}${Math.round(trend.veryHot)}%
• Very Wet: ${trend.veryWet > 0 ? '+' : ''}${Math.round(trend.veryWet)}%
• Very Windy: ${trend.veryWindy > 0 ? '+' : ''}${Math.round(trend.veryWindy)}%
• Very Uncomfortable: ${trend.veryUncomfortable > 0 ? '+' : ''}${Math.round(trend.veryUncomfortable)}%

Task: Summarize this weather analysis in 2-3 concise sentences focusing on the most significant risks. Then provide 1 concrete, actionable tip for someone planning outdoor activities. Be direct and specific. Don't use hedging language like "might" or "could". Format the tip with "**Tip:**" prefix.`

    try {
      const response = await llm.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a weather analyst providing clear, actionable insights. Be concise and specific.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      })
      
      const generatedText = response.choices[0]?.message?.content || ''
      setInsight(generatedText)
      setModelStatus('ready')
      
      // Cache the insight
      try {
        localStorage.setItem(
          `insight_${lat}_${lon}_${date}`,
          JSON.stringify({ text: generatedText, timestamp: Date.now() })
        )
      } catch (e) {
        // Ignore localStorage errors
      }
    } catch (err) {
      console.error('Error generating insight:', err)
      setError('Failed to generate AI insight. Using template.')
      setInsight(generateTemplateSummary())
      setModelStatus('error')
    }
  }

  const handleToggle = () => {
    if (!isEnabled && modelStatus === 'idle') {
      setIsEnabled(true)
      // Check cache first
      try {
        const cached = localStorage.getItem(`insight_${lat}_${lon}_${date}`)
        if (cached) {
          const { text, timestamp } = JSON.parse(cached)
          // Use cache if less than 1 hour old
          if (Date.now() - timestamp < 3600000) {
            setInsight(text)
            setModelStatus('ready')
            return
          }
        }
      } catch (e) {
        // Ignore cache errors
      }
      
      if (modelStatus === 'unsupported') {
        setInsight(generateTemplateSummary())
      } else {
        initializeModel()
      }
    } else if (!isEnabled) {
      setIsEnabled(true)
      if (modelStatus === 'ready' && !insight) {
        generateInsight()
      }
    } else {
      setIsEnabled(false)
    }
  }

  const handleRegenerate = () => {
    if (modelStatus === 'ready') {
      hasGeneratedRef.current = false
      generateInsight()
    } else if (modelStatus === 'unsupported' || modelStatus === 'error') {
      setInsight(generateTemplateSummary())
    }
  }

  if (!isEnabled) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">AI Weather Insights</h3>
              <p className="text-sm text-gray-600">
                Get personalized analysis powered by local AI
              </p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            Enable AI
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-200 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
            <div>
              <h3 className="text-lg font-bold text-white">AI Weather Insights</h3>
              {modelStatus === 'unsupported' && (
                <p className="text-xs text-purple-100">Template-based summary</p>
              )}
              {modelStatus !== 'unsupported' && (
                <p className="text-xs text-purple-100">Powered by WebLLM (Client-side)</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {modelStatus === 'ready' && (
              <Cpu className="w-4 h-4 text-green-300" />
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-white" />
              ) : (
                <ChevronDown className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-6">
          {/* Loading State */}
          {modelStatus === 'loading' && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                <p className="text-sm text-gray-700">Loading AI model...</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {loadingProgress}% - First load may take 30-60 seconds
              </p>
            </div>
          )}

          {/* Generating State */}
          {modelStatus === 'generating' && (
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
              <p className="text-sm text-gray-700">Generating insights...</p>
            </div>
          )}

          {/* Error State */}
          {modelStatus === 'unsupported' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">WebGPU not supported</p>
                  <p>Using rule-based summary instead. For AI insights, use Chrome/Edge on desktop.</p>
                </div>
              </div>
            </div>
          )}

          {/* Insight Content */}
          {insight && (
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {insight.split('**Tip:**').map((part, idx) => {
                    if (idx === 0) return <p key={idx}>{part}</p>
                    return (
                      <div key={idx} className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-3">
                        <p className="font-semibold text-blue-900 mb-1">💡 Tip:</p>
                        <p className="text-blue-800">{part}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  {modelStatus === 'ready' && (
                    <>
                      <Cpu className="w-3 h-3" />
                      <span>Generated locally on your device</span>
                    </>
                  )}
                  {(modelStatus === 'unsupported' || modelStatus === 'error') && (
                    <span>Rule-based analysis</span>
                  )}
                </div>
                <button
                  onClick={handleRegenerate}
                  disabled={modelStatus === 'loading' || modelStatus === 'generating'}
                  className="px-3 py-1.5 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Regenerate
                </button>
              </div>
            </div>
          )}

          {/* Disable Button */}
          {insight && (
            <button
              onClick={handleToggle}
              className="mt-4 w-full text-sm text-gray-600 hover:text-gray-800 py-2"
            >
              Disable AI Insights
            </button>
          )}
        </div>
      )}
    </div>
  )
}

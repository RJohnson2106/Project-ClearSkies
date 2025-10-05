'use client'

import { useState, useEffect, useRef } from 'react'
import { Sparkles, AlertCircle, Cpu, Loader2, ChevronDown, ChevronUp, Send, MessageSquare, Settings, X } from 'lucide-react'

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

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
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
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [userQuestion, setUserQuestion] = useState('')
  const [isChatExpanded, setIsChatExpanded] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Advanced settings
  const [showSettings, setShowSettings] = useState(false)
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(200)
  
  const engineRef = useRef<any>(null)
  const hasGeneratedRef = useRef(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages])

  // Load chat history from localStorage
  useEffect(() => {
    if (isEnabled) {
      try {
        const cacheKey = `chat_${lat}_${lon}_${date}`
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const { messages, timestamp } = JSON.parse(cached)
          // Use cache if less than 1 hour old
          if (Date.now() - timestamp < 3600000) {
            setChatMessages(messages)
          }
        }
      } catch (e) {
        // Ignore cache errors
      }
    }
  }, [isEnabled, lat, lon, date])

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

  const getSystemMessage = (): string => {
    const location = enrichedLocation || locationName || `${lat.toFixed(2)}, ${lon.toFixed(2)}`
    const dateObj = new Date(date)
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    
    return `You are a concise, helpful weather insights assistant. Use the following historical weather data to inform your answers.

Location: ${location} (${lat.toFixed(2)}, ${lon.toFixed(2)})
Date: ${dateStr}
Analysis Period: ${sampleYears} years of historical data

Current Probabilities (based on historical frequency):
• Very Hot (≥90°F max temp): ${Math.round(odds.veryHot)}%
• Very Wet (≥0.5 inches rain): ${Math.round(odds.veryWet)}%
• Very Windy (>25 mph gusts): ${Math.round(odds.veryWindy)}%
• Very Uncomfortable (high heat+humidity OR wind+rain): ${Math.round(odds.veryUncomfortable)}%

Climate Trends over ${sampleYears} years:
• Very Hot days: ${trend.veryHot > 0 ? '+' : ''}${Math.round(trend.veryHot)}% change
• Very Wet days: ${trend.veryWet > 0 ? '+' : ''}${Math.round(trend.veryWet)}% change
• Very Windy days: ${trend.veryWindy > 0 ? '+' : ''}${Math.round(trend.veryWindy)}% change
• Very Uncomfortable days: ${trend.veryUncomfortable > 0 ? '+' : ''}${Math.round(trend.veryUncomfortable)}% change

Guidelines:
- Answer questions directly and concisely
- Cite specific probabilities when relevant
- Provide actionable recommendations
- Don't use hedging language like "might" or "could"
- If asked about times of day, note that data is for the full day
- Be helpful and conversational`
  }

  const generateTemplateSummary = (): string => {
    const location = enrichedLocation || locationName || `${lat.toFixed(2)}, ${lon.toFixed(2)}`
    const dateObj = new Date(date)
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    
    const conditions = [
      { name: 'very hot', prob: odds.veryHot, trend: trend.veryHot },
      { name: 'very wet', prob: odds.veryWet, trend: trend.veryWet },
      { name: 'very windy', prob: odds.veryWindy, trend: trend.veryWindy },
      { name: 'uncomfortable', prob: odds.veryUncomfortable, trend: trend.veryUncomfortable },
    ]
    
    const sorted = conditions.sort((a, b) => b.prob - a.prob)
    const primary = sorted[0]
    
    let summary = `Based on ${sampleYears} years of data for ${location} on ${dateStr}, `
    
    if (primary.prob > 50) {
      summary += `there's a ${Math.round(primary.prob)}% chance of ${primary.name} conditions`
    } else if (primary.prob > 30) {
      summary += `${primary.name} conditions are moderately likely (${Math.round(primary.prob)}%)`
    } else {
      summary += `conditions are generally favorable with low risk of extreme weather`
    }
    
    const trendingUp = conditions.filter(c => c.trend > 5)
    if (trendingUp.length > 0) {
      summary += `. Trends show ${trendingUp[0].name} days increasing by ${Math.round(trendingUp[0].trend)}% over the past ${sampleYears} years`
    } else {
      summary += `. Weather patterns have remained relatively stable`
    }
    
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
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm')
      
      const engine = await CreateMLCEngine('Qwen2.5-0.5B-Instruct-q4f16_1-MLC', {
        initProgressCallback: (progress) => {
          setLoadingProgress(Math.round(progress.progress * 100))
        },
      })
      
      engineRef.current = engine
      setModelStatus('ready')
      setLoadingProgress(100)
      
      // Generate initial insight
      if (!hasGeneratedRef.current) {
        await generateInitialInsight(engine)
      }
    } catch (err) {
      console.error('Error initializing model:', err)
      setError('Failed to load AI model. Using template summary.')
      setModelStatus('error')
      setInsight(generateTemplateSummary())
    }
  }

  const generateInitialInsight = async (engine?: any) => {
    const llm = engine || engineRef.current
    
    if (!llm) {
      setInsight(generateTemplateSummary())
      return
    }

    setIsGenerating(true)
    hasGeneratedRef.current = true
    
    const systemMsg = getSystemMessage()
    const prompt = `Provide a 2-3 sentence summary of the weather risks for this date, followed by one concrete actionable tip. Format the tip with "**Tip:**" prefix.`

    try {
      const response = await llm.chat.completions.create({
        messages: [
          { role: 'system', content: systemMsg },
          { role: 'user', content: prompt },
        ],
        temperature,
        max_tokens: maxTokens,
      })
      
      const generatedText = response.choices[0]?.message?.content || ''
      setInsight(generatedText)
      
      // Initialize chat with system message
      setChatMessages([{ role: 'system', content: systemMsg }])
      
    } catch (err) {
      console.error('Error generating insight:', err)
      setError('Failed to generate AI insight. Using template.')
      setInsight(generateTemplateSummary())
      setModelStatus('error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAskQuestion = async () => {
    if (!userQuestion.trim() || isGenerating || !engineRef.current) {
      return
    }

    const question = userQuestion.trim()
    setUserQuestion('')
    setIsGenerating(true)

    // Add user message to chat
    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { role: 'user', content: question },
    ]
    setChatMessages(newMessages)

    try {
      const response = await engineRef.current.chat.completions.create({
        messages: newMessages,
        temperature,
        max_tokens: maxTokens,
      })
      
      const answer = response.choices[0]?.message?.content || 'Sorry, I could not generate a response.'
      
      // Add assistant message
      const updatedMessages = [
        ...newMessages,
        { role: 'assistant', content: answer },
      ]
      setChatMessages(updatedMessages)
      
      // Cache chat history
      try {
        const cacheKey = `chat_${lat}_${lon}_${date}`
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ messages: updatedMessages, timestamp: Date.now() })
        )
      } catch (e) {
        // Ignore cache errors
      }
    } catch (err) {
      console.error('Error generating response:', err)
      const errorMsg = [
        ...newMessages,
        { role: 'assistant', content: 'Sorry, I encountered an error generating a response. Please try again.' },
      ]
      setChatMessages(errorMsg)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAskQuestion()
    }
  }

  const handleClearChat = () => {
    const systemMsg = chatMessages.find(m => m.role === 'system')
    setChatMessages(systemMsg ? [systemMsg] : [])
    try {
      localStorage.removeItem(`chat_${lat}_${lon}_${date}`)
    } catch (e) {
      // Ignore
    }
  }

  const handleExportChat = () => {
    const chatText = chatMessages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'user' ? 'You' : 'Assistant'}: ${m.content}`)
      .join('\n\n')
    
    const blob = new Blob([chatText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `weather-chat-${date.split('T')[0]}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleToggle = () => {
    if (!isEnabled && modelStatus === 'idle') {
      setIsEnabled(true)
      if (modelStatus === 'unsupported') {
        setInsight(generateTemplateSummary())
      } else {
        initializeModel()
      }
    } else if (!isEnabled) {
      setIsEnabled(true)
      if (modelStatus === 'ready' && !insight) {
        generateInitialInsight()
      }
    } else {
      setIsEnabled(false)
    }
  }

  const handleRegenerate = () => {
    if (modelStatus === 'ready') {
      hasGeneratedRef.current = false
      generateInitialInsight()
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
              <h3 className="text-lg font-bold text-gray-900">AI Weather Assistant</h3>
              <p className="text-sm text-gray-600">
                Get personalized insights and ask follow-up questions
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
              <h3 className="text-lg font-bold text-white">AI Weather Assistant</h3>
              {modelStatus === 'unsupported' && (
                <p className="text-xs text-purple-100">Template-based summary</p>
              )}
              {modelStatus !== 'unsupported' && (
                <p className="text-xs text-purple-100">Powered by WebLLM • Ask questions!</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {modelStatus === 'ready' && (
              <>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4 text-white" />
                </button>
                <Cpu className="w-4 h-4 text-green-300" />
              </>
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
          {/* Advanced Settings */}
          {showSettings && modelStatus === 'ready' && (
            <div className="mb-4 p-4 bg-white rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Advanced Settings</h4>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                    <span>Temperature: {temperature.toFixed(2)}</span>
                    <span className="text-xs text-gray-500">Creativity</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                    <span>Max Tokens: {maxTokens}</span>
                    <span className="text-xs text-gray-500">Response length</span>
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="50"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

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

          {/* Error State */}
          {modelStatus === 'unsupported' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">WebGPU not supported</p>
                  <p>Your browser does not support local AI chat. Using static insights instead. Try Chrome/Edge on desktop for full chat experience.</p>
                </div>
              </div>
            </div>
          )}

          {/* Initial Insight */}
          {insight && (
            <div className="space-y-4 mb-6">
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

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  {modelStatus === 'ready' && (
                    <>
                      <Cpu className="w-3 h-3" />
                      <span>Generated locally on your device</span>
                    </>
                  )}
                </div>
                <button
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="px-3 py-1.5 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Regenerate
                </button>
              </div>
            </div>
          )}

          {/* Chat Interface */}
          {modelStatus === 'ready' && insight && (
            <div className="border-t pt-6">
              <button
                onClick={() => setIsChatExpanded(!isChatExpanded)}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors mb-4"
              >
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Ask a Question</p>
                    <p className="text-xs text-gray-600">Chat with the AI assistant about this weather data</p>
                  </div>
                </div>
                {isChatExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {isChatExpanded && (
                <div className="space-y-4">
                  {/* Chat History */}
                  {chatMessages.filter(m => m.role !== 'system').length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 max-h-96 overflow-y-auto space-y-4">
                      {chatMessages
                        .filter(m => m.role !== 'system')
                        .map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                msg.role === 'user'
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          </div>
                        ))}
                      <div ref={chatEndRef} />
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <textarea
                      ref={textareaRef}
                      value={userQuestion}
                      onChange={(e) => setUserQuestion(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about the weather (e.g., 'What's the best time for outdoor activities?')"
                      disabled={isGenerating}
                      className="w-full resize-none outline-none text-sm h-20 disabled:opacity-50 text-gray-900"
                    />
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center space-x-2">
                        {isGenerating && (
                          <>
                            <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                            <span className="text-xs text-gray-600">Thinking...</span>
                          </>
                        )}
                        {chatMessages.filter(m => m.role !== 'system').length > 0 && (
                          <>
                            <button
                              onClick={handleClearChat}
                              disabled={isGenerating}
                              className="text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50"
                            >
                              Clear
                            </button>
                            <button
                              onClick={handleExportChat}
                              disabled={isGenerating}
                              className="text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50"
                            >
                              Export
                            </button>
                          </>
                        )}
                      </div>
                      <button
                        onClick={handleAskQuestion}
                        disabled={!userQuestion.trim() || isGenerating}
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="text-sm font-medium">Send</span>
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Press Enter to send, Shift+Enter for new line
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Disable Button */}
          {insight && (
            <button
              onClick={handleToggle}
              className="mt-4 w-full text-sm text-gray-600 hover:text-gray-800 py-2"
            >
              Disable AI Assistant
            </button>
          )}
        </div>
      )}
    </div>
  )
}
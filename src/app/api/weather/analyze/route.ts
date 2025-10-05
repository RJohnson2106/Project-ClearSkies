import { NextRequest, NextResponse } from 'next/server'

interface WeatherRequest {
  latitude: number
  longitude: number
  date: string
}

interface HistoricalDataPoint {
  year: number
  temperature_max: number
  temperature_min: number
  precipitation: number
  windspeed_max: number
  relative_humidity: number
}

export async function POST(request: NextRequest) {
  try {
    const body: WeatherRequest = await request.json()
    const { latitude, longitude, date } = body

    if (!latitude || !longitude || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const selectedDate = new Date(date)
    const month = selectedDate.getMonth() + 1
    const day = selectedDate.getDate()

    // Fetch historical data for the past 20 years
    const currentYear = new Date().getFullYear()
    const startYear = currentYear - 20
    const historicalData: HistoricalDataPoint[] = []

    // Fetch data in chunks (Open-Meteo has limits on date ranges)
    for (let year = startYear; year < currentYear; year++) {
      try {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        
        const response = await fetch(
          `https://archive-api.open-meteo.com/v1/archive?` +
          `latitude=${latitude}&longitude=${longitude}` +
          `&start_date=${dateStr}&end_date=${dateStr}` +
          `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,relative_humidity_2m_mean` +
          `&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch`
        )

        if (!response.ok) {
          console.error(`Failed to fetch data for year ${year}`)
          continue
        }

        const data = await response.json()
        
        if (data.daily && data.daily.time && data.daily.time.length > 0) {
          historicalData.push({
            year,
            temperature_max: data.daily.temperature_2m_max[0],
            temperature_min: data.daily.temperature_2m_min[0],
            precipitation: data.daily.precipitation_sum[0],
            windspeed_max: data.daily.windspeed_10m_max[0],
            relative_humidity: data.daily.relative_humidity_2m_mean[0],
          })
        }
      } catch (error) {
        console.error(`Error fetching data for year ${year}:`, error)
      }
    }

    if (historicalData.length === 0) {
      return NextResponse.json(
        { error: 'No historical data available for this location' },
        { status: 404 }
      )
    }

    // Calculate probabilities
    const probabilities = calculateProbabilities(historicalData)
    
    // Calculate trend analysis
    const trendAnalysis = calculateTrends(historicalData)

    return NextResponse.json({
      probability: probabilities,
      trendAnalysis,
      historicalData,
      dataPoints: historicalData.length,
    })
  } catch (error) {
    console.error('Error in weather analysis:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateProbabilities(data: HistoricalDataPoint[]) {
  const total = data.length

  // Define thresholds for extreme conditions
  const VERY_HOT_THRESHOLD = 95 // °F
  const VERY_COLD_THRESHOLD = 32 // °F
  const VERY_WINDY_THRESHOLD = 25 // mph
  const VERY_WET_THRESHOLD = 0.5 // inches
  const UNCOMFORTABLE_HEAT_INDEX_TEMP = 85 // °F
  const UNCOMFORTABLE_HUMIDITY = 70 // %

  let veryHotCount = 0
  let veryColdCount = 0
  let veryWindyCount = 0
  let veryWetCount = 0
  let veryUncomfortableCount = 0

  data.forEach((point) => {
    if (point.temperature_max >= VERY_HOT_THRESHOLD) {
      veryHotCount++
    }
    if (point.temperature_min <= VERY_COLD_THRESHOLD) {
      veryColdCount++
    }
    if (point.windspeed_max >= VERY_WINDY_THRESHOLD) {
      veryWindyCount++
    }
    if (point.precipitation >= VERY_WET_THRESHOLD) {
      veryWetCount++
    }
    // Uncomfortable: high heat + high humidity or very windy + rain
    if (
      (point.temperature_max >= UNCOMFORTABLE_HEAT_INDEX_TEMP &&
        point.relative_humidity >= UNCOMFORTABLE_HUMIDITY) ||
      (point.windspeed_max >= VERY_WINDY_THRESHOLD &&
        point.precipitation >= VERY_WET_THRESHOLD)
    ) {
      veryUncomfortableCount++
    }
  })

  return {
    veryHot: (veryHotCount / total) * 100,
    veryCold: (veryColdCount / total) * 100,
    veryWindy: (veryWindyCount / total) * 100,
    veryWet: (veryWetCount / total) * 100,
    veryUncomfortable: (veryUncomfortableCount / total) * 100,
  }
}

function calculateTrends(data: HistoricalDataPoint[]) {
  // Split data into two periods: first 10 years and last 10 years
  const midpoint = Math.floor(data.length / 2)
  const firstHalf = data.slice(0, midpoint)
  const secondHalf = data.slice(midpoint)

  const firstHalfProbs = calculateProbabilities(firstHalf)
  const secondHalfProbs = calculateProbabilities(secondHalf)

  const trends = [
    {
      category: 'Very Hot',
      trend: getTrend(firstHalfProbs.veryHot, secondHalfProbs.veryHot),
      changePercent: secondHalfProbs.veryHot - firstHalfProbs.veryHot,
    },
    {
      category: 'Very Cold',
      trend: getTrend(firstHalfProbs.veryCold, secondHalfProbs.veryCold),
      changePercent: secondHalfProbs.veryCold - firstHalfProbs.veryCold,
    },
    {
      category: 'Very Windy',
      trend: getTrend(firstHalfProbs.veryWindy, secondHalfProbs.veryWindy),
      changePercent: secondHalfProbs.veryWindy - firstHalfProbs.veryWindy,
    },
    {
      category: 'Very Wet',
      trend: getTrend(firstHalfProbs.veryWet, secondHalfProbs.veryWet),
      changePercent: secondHalfProbs.veryWet - firstHalfProbs.veryWet,
    },
    {
      category: 'Very Uncomfortable',
      trend: getTrend(
        firstHalfProbs.veryUncomfortable,
        secondHalfProbs.veryUncomfortable
      ),
      changePercent: secondHalfProbs.veryUncomfortable - firstHalfProbs.veryUncomfortable,
    },
  ]

  return trends
}

function getTrend(
  oldValue: number,
  newValue: number
): 'increasing' | 'decreasing' | 'stable' {
  const diff = newValue - oldValue
  if (Math.abs(diff) < 5) return 'stable'
  return diff > 0 ? 'increasing' : 'decreasing'
}

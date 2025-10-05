import { NextRequest, NextResponse } from 'next/server'
import { THRESHOLDS } from '@/config/weatherThresholds'
import type { HistoricalDataPoint, YearlyTrendData, ProbabilityDetail } from '@/types/weather'

interface WeatherRequest {
  latitude: number
  longitude: number
  date: string
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

    // Fetch data in chunks
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
          const dataPoint: HistoricalDataPoint = {
            year,
            temperature_max: data.daily.temperature_2m_max[0],
            temperature_min: data.daily.temperature_2m_min[0],
            precipitation: data.daily.precipitation_sum[0] || 0,
            windspeed_max: data.daily.windspeed_10m_max[0],
            relative_humidity: data.daily.relative_humidity_2m_mean[0],
          }
          
          // Mark which thresholds are met
          dataPoint.meetsHot = dataPoint.temperature_max > THRESHOLDS.VERY_HOT
          dataPoint.meetsCold = dataPoint.temperature_min < THRESHOLDS.VERY_COLD
          dataPoint.meetsWindy = dataPoint.windspeed_max > THRESHOLDS.VERY_WINDY
          dataPoint.meetsWet = dataPoint.precipitation > THRESHOLDS.VERY_WET
          dataPoint.meetsUncomfortable = 
            (dataPoint.temperature_max > THRESHOLDS.UNCOMFORTABLE_TEMP &&
              dataPoint.relative_humidity > THRESHOLDS.UNCOMFORTABLE_HUMIDITY) ||
            (dataPoint.windspeed_max > THRESHOLDS.VERY_WINDY &&
              dataPoint.precipitation > THRESHOLDS.VERY_WET)
          
          historicalData.push(dataPoint)
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

    // Calculate probabilities with detailed information
    const probabilityDetails = calculateProbabilityDetails(historicalData)
    
    // Calculate trend analysis
    const trendAnalysis = calculateTrends(historicalData)
    
    // Calculate yearly trends for line chart
    const yearlyTrends = calculateYearlyTrends(historicalData)

    return NextResponse.json({
      probability: {
        veryHot: probabilityDetails.veryHot.percentage,
        veryCold: probabilityDetails.veryCold.percentage,
        veryWindy: probabilityDetails.veryWindy.percentage,
        veryWet: probabilityDetails.veryWet.percentage,
        veryUncomfortable: probabilityDetails.veryUncomfortable.percentage,
      },
      probabilityDetails,
      trendAnalysis,
      yearlyTrends,
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

function calculateProbabilityDetails(data: HistoricalDataPoint[]) {
  const total = data.length

  const veryHotCount = data.filter((d) => d.meetsHot).length
  const veryColdCount = data.filter((d) => d.meetsCold).length
  const veryWindyCount = data.filter((d) => d.meetsWindy).length
  const veryWetCount = data.filter((d) => d.meetsWet).length
  const veryUncomfortableCount = data.filter((d) => d.meetsUncomfortable).length

  return {
    veryHot: {
      percentage: (veryHotCount / total) * 100,
      count: veryHotCount,
      total,
      threshold: `> ${THRESHOLDS.VERY_HOT}°F max temp`,
    },
    veryCold: {
      percentage: (veryColdCount / total) * 100,
      count: veryColdCount,
      total,
      threshold: `< ${THRESHOLDS.VERY_COLD}°F min temp`,
    },
    veryWindy: {
      percentage: (veryWindyCount / total) * 100,
      count: veryWindyCount,
      total,
      threshold: `> ${THRESHOLDS.VERY_WINDY} mph wind`,
    },
    veryWet: {
      percentage: (veryWetCount / total) * 100,
      count: veryWetCount,
      total,
      threshold: `> ${THRESHOLDS.VERY_WET}" precipitation`,
    },
    veryUncomfortable: {
      percentage: (veryUncomfortableCount / total) * 100,
      count: veryUncomfortableCount,
      total,
      threshold: `High heat+humidity OR wind+rain`,
    },
  }
}

function calculateYearlyTrends(data: HistoricalDataPoint[]): YearlyTrendData[] {
  // Group data by year and calculate probabilities for each year
  const yearMap = new Map<number, HistoricalDataPoint[]>()
  
  data.forEach((point) => {
    if (!yearMap.has(point.year)) {
      yearMap.set(point.year, [])
    }
    yearMap.get(point.year)!.push(point)
  })

  const yearlyTrends: YearlyTrendData[] = []
  
  yearMap.forEach((yearData, year) => {
    const total = yearData.length
    yearlyTrends.push({
      year,
      veryHot: (yearData.filter((d) => d.meetsHot).length / total) * 100,
      veryCold: (yearData.filter((d) => d.meetsCold).length / total) * 100,
      veryWindy: (yearData.filter((d) => d.meetsWindy).length / total) * 100,
      veryWet: (yearData.filter((d) => d.meetsWet).length / total) * 100,
      veryUncomfortable: (yearData.filter((d) => d.meetsUncomfortable).length / total) * 100,
    })
  })

  return yearlyTrends.sort((a, b) => a.year - b.year)
}

function calculateTrends(data: HistoricalDataPoint[]) {
  // Split data into two periods: first 10 years and last 10 years
  const midpoint = Math.floor(data.length / 2)
  const firstHalf = data.slice(0, midpoint)
  const secondHalf = data.slice(midpoint)

  const firstHalfDetails = calculateProbabilityDetails(firstHalf)
  const secondHalfDetails = calculateProbabilityDetails(secondHalf)

  const trends = [
    {
      category: 'Very Hot',
      trend: getTrend(firstHalfDetails.veryHot.percentage, secondHalfDetails.veryHot.percentage),
      changePercent: secondHalfDetails.veryHot.percentage - firstHalfDetails.veryHot.percentage,
    },
    {
      category: 'Very Cold',
      trend: getTrend(firstHalfDetails.veryCold.percentage, secondHalfDetails.veryCold.percentage),
      changePercent: secondHalfDetails.veryCold.percentage - firstHalfDetails.veryCold.percentage,
    },
    {
      category: 'Very Windy',
      trend: getTrend(firstHalfDetails.veryWindy.percentage, secondHalfDetails.veryWindy.percentage),
      changePercent: secondHalfDetails.veryWindy.percentage - firstHalfDetails.veryWindy.percentage,
    },
    {
      category: 'Very Wet',
      trend: getTrend(firstHalfDetails.veryWet.percentage, secondHalfDetails.veryWet.percentage),
      changePercent: secondHalfDetails.veryWet.percentage - firstHalfDetails.veryWet.percentage,
    },
    {
      category: 'Very Uncomfortable',
      trend: getTrend(
        firstHalfDetails.veryUncomfortable.percentage,
        secondHalfDetails.veryUncomfortable.percentage
      ),
      changePercent: secondHalfDetails.veryUncomfortable.percentage - firstHalfDetails.veryUncomfortable.percentage,
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
import { NextRequest, NextResponse } from 'next/server'
import {
  convertToImperial,
  meanIgnoreNull,
  toMonthDay,
  isLeap,
  validateCoordinates,
  round,
  type OpenMeteoDailyResponse,
  type YearlySample,
  type TypicalDaySummary
} from '@/utils/weather'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const lat = parseFloat(searchParams.get('lat') || '')
    const lon = parseFloat(searchParams.get('lon') || '')
    const date = searchParams.get('date') || ''
    const tz = searchParams.get('tz') || 'UTC'

    // Validate required parameters
    if (isNaN(lat) || isNaN(lon) || !date) {
      return NextResponse.json(
        { error: 'Missing or invalid required parameters (lat, lon, date)' },
        { status: 400 }
      )
    }

    // Validate and clamp coordinates
    const { lat: validLat, lon: validLon } = validateCoordinates(lat, lon)
    
    // Derive month/day from date
    const { month, day } = toMonthDay(date)
    
    // Compute 20-year range (last 20 full calendar years)
    const currentYear = new Date().getUTCFullYear()
    const startYear = currentYear - 20  // For 2025: 2005
    const endYear = currentYear - 1     // For 2025: 2024

    // Fetch data from Open-Meteo Archive
    const apiUrl = new URL('https://archive-api.open-meteo.com/v1/archive')
    apiUrl.searchParams.set('latitude', validLat.toString())
    apiUrl.searchParams.set('longitude', validLon.toString())
    apiUrl.searchParams.set('start_date', `${startYear}-01-01`)
    apiUrl.searchParams.set('end_date', `${endYear}-12-31`)
    apiUrl.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_mean')
    apiUrl.searchParams.set('timezone', tz)

    console.log(`Fetching Open-Meteo data for ${startYear}-${endYear} at ${validLat}, ${validLon}`)

    const response = await fetch(apiUrl.toString())
    
    if (!response.ok) {
      console.error(`Open-Meteo API error: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { 
          error: 'Failed to fetch historical weather data',
          hint: 'Open-Meteo Archive API is temporarily unavailable'
        },
        { status: 502 }
      )
    }

    const data: OpenMeteoDailyResponse = await response.json()
    
    if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
      console.error('No daily data in Open-Meteo response:', JSON.stringify(data, null, 2))
      return NextResponse.json(
        { 
          error: 'No historical data available for this location and date range',
          hint: 'Try a different location or date range'
        },
        { status: 404 }
      )
    }

    // Process the data to find matching month/day across years
    const yearlySamples: YearlySample[] = []
    let missingYears = 0
    let leapHandled = false

    // Group data by year and find matching dates
    const yearDataMap = new Map<number, any[]>()
    
    data.daily.time.forEach((dateStr, index) => {
      const date = new Date(dateStr)
      const year = date.getFullYear()
      
      if (!yearDataMap.has(year)) {
        yearDataMap.set(year, [])
      }
      
      yearDataMap.get(year)!.push({
        date,
        index,
        month: date.getMonth() + 1,
        day: date.getDate()
      })
    })

    // Process each year in the 20-year range
    for (let year = startYear; year <= endYear; year++) {
      const yearData = yearDataMap.get(year)
      if (!yearData) {
        missingYears++
        continue
      }

      let targetDate = yearData.find(d => d.month === month && d.day === day)
      
      // Handle leap year edge case for Feb 29
      if (!targetDate && month === 2 && day === 29 && !isLeap(year)) {
        leapHandled = true
        // Look for Feb 28 instead
        targetDate = yearData.find(d => d.month === 2 && d.day === 28)
      }

      if (targetDate) {
        const sample: YearlySample = {
          year,
          tmax: data.daily.temperature_2m_max[targetDate.index],
          tmin: data.daily.temperature_2m_min[targetDate.index],
          precip: data.daily.precipitation_sum[targetDate.index],
          wind: data.daily.wind_speed_10m_max[targetDate.index],
          rh: data.daily.relative_humidity_2m_mean[targetDate.index]
        }
        yearlySamples.push(sample)
      } else {
        missingYears++
      }
    }

    if (yearlySamples.length === 0) {
      console.error(`No yearly samples found for ${month}/${day} in range ${startYear}-${endYear}`)
      console.error(`Total years processed: ${endYear - startYear + 1}, Missing years: ${missingYears}`)
      return NextResponse.json(
        { 
          error: 'No valid data found for the specified date',
          hint: 'Data may not be available for this specific date'
        },
        { status: 404 }
      )
    }

    // Calculate averages with unit conversion
    const avgHigh = meanIgnoreNull(yearlySamples.map(s => 
      convertToImperial(s.tmax, data.daily_units.temperature_2m_max, 'temperature')
    ))
    
    const avgLow = meanIgnoreNull(yearlySamples.map(s => 
      convertToImperial(s.tmin, data.daily_units.temperature_2m_min, 'temperature')
    ))
    
    const avgPrecip = meanIgnoreNull(yearlySamples.map(s => 
      convertToImperial(s.precip, data.daily_units.precipitation_sum, 'precipitation')
    ))
    
    const avgWind = meanIgnoreNull(yearlySamples.map(s => 
      convertToImperial(s.wind, data.daily_units.wind_speed_10m_max, 'wind')
    ))
    
    const avgHumidity = meanIgnoreNull(yearlySamples.map(s => s.rh))

    // Build response
    const result: TypicalDaySummary = {
      location: { lat: validLat, lon: validLon },
      dateOfYear: { month, day },
      period: { start: startYear, end: endYear, years: yearlySamples.length },
      averages: {
        high_f: avgHigh ? round(avgHigh, 0) : 0,
        low_f: avgLow ? round(avgLow, 0) : 0,
        precip_in: avgPrecip ? round(avgPrecip, 2) : 0,
        wind_mph: avgWind ? round(avgWind, 0) : 0,
        humidity_pct: avgHumidity ? round(avgHumidity, 0) : 0
      },
      units: {
        high: '°F',
        low: '°F',
        precip: 'in',
        wind: 'mph',
        humidity: '%'
      },
      coverage: {
        missingYears,
        leapHandled
      }
    }

    console.log(`Successfully processed ${yearlySamples.length} years of data for ${month}/${day}`)

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800'
      }
    })

  } catch (error) {
    console.error('Error in typical20 day API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        hint: 'Please try again later'
      },
      { status: 500 }
    )
  }
}

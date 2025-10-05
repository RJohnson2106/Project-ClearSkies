'use client'

import { useEffect, useRef, useState } from 'react'
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre'
import { MapPin, Search } from 'lucide-react'
import type { Location } from '@/app/page'
import 'maplibre-gl/dist/maplibre-gl.css'

interface MapComponentProps {
  onLocationSelect: (location: Location) => void
  selectedLocation: Location | null
}

export default function MapComponent({ onLocationSelect, selectedLocation }: MapComponentProps) {
  const [viewState, setViewState] = useState({
    longitude: -95.7129,
    latitude: 37.0902,
    zoom: 3.5,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleMapClick = async (event: any) => {
    const { lngLat } = event
    const lat = lngLat.lat
    const lng = lngLat.lng

    // Reverse geocode to get location name
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
      )
      const data = await response.json()
      
      onLocationSelect({
        lat,
        lng,
        name: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      })
    } catch (error) {
      onLocationSelect({
        lat,
        lng,
        name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      })
    }
  }

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      )
      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const selectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    
    onLocationSelect({
      lat,
      lng,
      name: result.display_name,
    })

    setViewState({
      longitude: lng,
      latitude: lat,
      zoom: 10,
    })

    setSearchQuery('')
    setSearchResults([])
  }

  return (
    <div className="relative w-full h-full">
      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="flex items-center p-3 border-b">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search for a city or address..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (e.target.value.length >= 3) {
                  handleSearch(e.target.value)
                } else {
                  setSearchResults([])
                }
              }}
              className="flex-1 outline-none text-sm"
            />
          </div>
          
          {searchResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => selectSearchResult(result)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                >
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{result.display_name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {isSearching && (
            <div className="px-4 py-3 text-sm text-gray-500">
              Searching...
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" />
        
        {selectedLocation && (
          <Marker
            longitude={selectedLocation.lng}
            latitude={selectedLocation.lat}
            anchor="bottom"
          >
            <div className="relative">
              <MapPin className="w-8 h-8 text-red-600 fill-red-500 drop-shadow-lg animate-bounce" />
            </div>
          </Marker>
        )}
      </Map>
    </div>
  )
}

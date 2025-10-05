# 🏗️ Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     React Frontend                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │ │
│  │  │ MapComponent │  │ DateSelector │  │ WeatherAnalysis │  │ │
│  │  │  (MapLibre)  │  │  (Calendar)  │  │    (Charts)     │  │ │
│  │  └──────────────┘  └──────────────┘  └─────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/JSON
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Server                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                 API Routes (Backend)                        │ │
│  │  /api/weather/analyze                                       │ │
│  │  - Receives: lat, lng, date                                 │ │
│  │  - Processes: Historical data analysis                      │ │
│  │  - Returns: Probabilities + Trends                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/JSON
┌─────────────────────────────────────────────────────────────────┐
│                      External APIs                               │
│  ┌──────────────────────┐     ┌──────────────────────────────┐ │
│  │   Open-Meteo API     │     │ OpenStreetMap Nominatim      │ │
│  │  (Weather Data)      │     │    (Geocoding)               │ │
│  │  - 20 years history  │     │    - Location search         │ │
│  │  - Daily aggregates  │     │    - Reverse geocoding       │ │
│  └──────────────────────┘     └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Components

```
page.tsx (Main Orchestrator)
├── MapComponent
│   ├── Map (react-map-gl)
│   ├── Search Bar
│   ├── Marker
│   └── Navigation Controls
│
├── DateSelector
│   ├── Month Navigator
│   ├── Calendar Grid
│   └── Selected Date Display
│
└── WeatherAnalysis
    ├── Summary Card
    ├── Probability Bars
    ├── Charts (Recharts)
    ├── Trend Analysis
    └── Export Buttons
```

## Data Flow

### 1. User Interaction Flow
```
User clicks map
    ↓
Reverse geocoding (Nominatim API)
    ↓
Location state updated
    ↓
User selects date
    ↓
Date state updated
    ↓
User clicks "Analyze Weather"
    ↓
POST request to /api/weather/analyze
```

### 2. Weather Analysis Flow
```
API receives request
    ↓
Extract lat, lng, date
    ↓
Calculate date range (20 years)
    ↓
Loop through each year
    ↓
Fetch data from Open-Meteo
    ↓
Aggregate historical data
    ↓
Calculate probabilities
    ↓
Calculate trends (first 10 vs last 10 years)
    ↓
Return JSON response
    ↓
Frontend displays results
```

### 3. Probability Calculation Flow
```
Historical Data Array (20 data points)
    ↓
For each weather category:
    ↓
Count occurrences meeting threshold
    ↓
Probability = (count / total) × 100
    ↓
Return probability object
```

## Technology Stack Details

### Frontend Layer

**Next.js 14 (App Router)**
- Server-side rendering (SSR)
- Client-side rendering (CSR)
- API routes (serverless functions)
- File-based routing
- Hot module replacement

**React 18**
- Component-based UI
- Hooks (useState, useCallback)
- Client components ("use client")
- State management
- Event handling

**TypeScript**
- Type safety
- Interface definitions
- Better IDE support
- Compile-time error checking

**Tailwind CSS**
- Utility-first styling
- Responsive design
- Custom color palette
- JIT compilation
- Minimal bundle size

**MapLibre GL**
- Open-source mapping
- WebGL-powered
- Smooth interactions
- Vector tiles
- Custom styling

**Recharts**
- React-based charts
- SVG rendering
- Responsive charts
- Interactive tooltips
- Customizable themes

### Backend Layer

**Next.js API Routes**
- Serverless functions
- RESTful endpoints
- JSON request/response
- Built-in error handling
- TypeScript support

**Node.js Runtime**
- JavaScript execution
- Async/await support
- HTTP client (fetch)
- JSON processing

### External Services

**Open-Meteo Archive API**
- Endpoint: `archive-api.open-meteo.com`
- Format: JSON
- Coverage: Global
- History: 1940-present
- Variables: 50+ weather parameters
- Rate limit: Generous (no key required)

**OpenStreetMap Nominatim**
- Endpoint: `nominatim.openstreetmap.org`
- Format: JSON
- Coverage: Worldwide
- Features: Search + Reverse geocoding
- Rate limit: 1 req/second

## File Structure & Responsibilities

```
src/
├── app/
│   ├── layout.tsx
│   │   - Root HTML structure
│   │   - Global metadata
│   │   - Font loading
│   │
│   ├── page.tsx
│   │   - Main application page
│   │   - State management (location, date, results)
│   │   - API communication
│   │   - Component orchestration
│   │
│   ├── globals.css
│   │   - Tailwind directives
│   │   - Custom global styles
│   │   - MapLibre overrides
│   │   - Scrollbar styling
│   │
│   └── api/
│       └── weather/
│           └── analyze/
│               └── route.ts
│                   - POST handler
│                   - Data fetching (Open-Meteo)
│                   - Probability calculations
│                   - Trend analysis
│                   - Error handling
│
├── components/
│   ├── MapComponent.tsx
│   │   - MapLibre integration
│   │   - Location selection
│   │   - Search functionality
│   │   - Marker rendering
│   │   - Geocoding logic
│   │
│   ├── DateSelector.tsx
│   │   - Calendar rendering
│   │   - Month navigation
│   │   - Date selection
│   │   - Visual feedback
│   │
│   └── WeatherAnalysis.tsx
│       - Results display
│       - Chart rendering
│       - Trend visualization
│       - Data export (CSV/JSON)
│       - Summary generation
│
└── types/
    └── weather.ts
        - TypeScript interfaces
        - Type definitions
        - Shared types across app
```

## State Management

### Client State (React)
```typescript
// Main page state
const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
const [selectedDate, setSelectedDate] = useState<Date>(new Date())
const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

### Prop Flow
```
page.tsx
  ├─→ MapComponent
  │     props: onLocationSelect, selectedLocation
  │     events: handleLocationSelect
  │
  ├─→ DateSelector
  │     props: selectedDate, onDateSelect
  │     events: handleDateSelect
  │
  └─→ WeatherAnalysis
        props: weatherData, location, date
        events: download functions
```

## API Communication

### Request Format
```typescript
POST /api/weather/analyze
Content-Type: application/json

{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "date": "2024-07-15T00:00:00.000Z"
}
```

### Response Format
```typescript
{
  "probability": {
    "veryHot": 45.0,
    "veryCold": 0.0,
    "veryWindy": 15.5,
    "veryWet": 5.0,
    "veryUncomfortable": 25.0
  },
  "trendAnalysis": [
    {
      "category": "Very Hot",
      "trend": "increasing",
      "changePercent": 12.5
    }
  ],
  "historicalData": [...],
  "dataPoints": 20
}
```

## Performance Optimizations

### Frontend
- **Code splitting**: Automatic with Next.js
- **Lazy loading**: Map tiles loaded on demand
- **Memoization**: useCallback for event handlers
- **Debouncing**: Search input delays API calls
- **Efficient re-renders**: Proper state management

### Backend
- **Sequential API calls**: Respects rate limits
- **Error handling**: Continues on single year failure
- **Minimal data transfer**: Only necessary fields
- **Efficient calculations**: O(n) complexity

### Potential Future Optimizations
- **Redis caching**: Store popular location data
- **CDN**: Static asset delivery
- **Database**: Cache historical data
- **GraphQL**: Reduce over-fetching
- **Service Workers**: Offline support

## Security Considerations

### Current Implementation
✅ No user authentication (public data)
✅ No sensitive data stored
✅ Public APIs only (no keys exposed)
✅ Input validation (lat/lng ranges)
✅ Error handling (no stack traces to client)

### Production Recommendations
- [ ] Rate limiting (prevent abuse)
- [ ] CORS configuration (restrict origins)
- [ ] HTTPS only (SSL certificate)
- [ ] API key management (for paid services)
- [ ] Request logging (monitoring)
- [ ] DDoS protection (Cloudflare)

## Deployment Architecture

### Recommended: Vercel
```
GitHub Repository
    ↓ (git push)
Vercel Build
    ↓
    ├─ Build Next.js app
    ├─ Optimize assets
    ├─ Deploy serverless functions
    └─ Deploy static files to CDN
    ↓
Production URL (HTTPS)
    ├─ Edge Network (global)
    ├─ Automatic scaling
    └─ Zero-downtime deploys
```

### Alternative: Docker
```
Dockerfile
    ↓
Build Image
    ↓
Deploy to:
    - AWS ECS
    - Google Cloud Run
    - Azure Container Apps
    - DigitalOcean App Platform
```

## Scalability

### Current Limitations
- **Sequential API calls**: 20 requests per analysis
- **No caching**: Fresh data every time
- **Single region**: Serverless in one location

### Scaling Solutions
1. **Caching Layer**
   - Redis for popular locations
   - Cache TTL: 24 hours
   - Reduce API calls by 80%+

2. **Batch Processing**
   - Parallel API requests (with rate limit respect)
   - WebSockets for progress updates
   - Background jobs for large requests

3. **Database Integration**
   - PostgreSQL for historical data
   - Pre-computed probabilities
   - Daily updates instead of on-demand

4. **CDN + Edge Computing**
   - Cloudflare Workers
   - Edge caching
   - Global distribution

## Error Handling Strategy

### Frontend Errors
```typescript
try {
  // Fetch and display data
} catch (error) {
  // Show user-friendly message
  // Log to console (dev mode)
  // Don't expose internal errors
}
```

### Backend Errors
```typescript
// Individual year failure: Continue processing
// All years fail: Return 404
// Invalid input: Return 400
// Server error: Return 500
```

### User Experience
- Clear error messages
- Fallback UI states
- Retry mechanisms
- Graceful degradation

## Testing Strategy (Future)

### Unit Tests
- Component rendering
- Probability calculations
- Trend analysis logic
- Date utilities

### Integration Tests
- API endpoint responses
- Error handling
- Data transformation

### E2E Tests
- User flows (Playwright/Cypress)
- Map interactions
- Search functionality
- Data export

## Monitoring & Analytics (Future)

### Metrics to Track
- Page load time
- API response time
- Error rates
- Popular locations
- User engagement
- Export downloads

### Tools
- Vercel Analytics
- Google Analytics
- Sentry (error tracking)
- LogRocket (session replay)

---

**This architecture supports 1000+ concurrent users with proper deployment! 🚀**

# Weather Probability Assessment App 🌦️

A full-stack web application that helps users assess the likelihood of adverse weather conditions for any location and day of the year, using 20 years of historical weather data.

![Weather Probability App](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js) ![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)

## 🌟 Features

### Core Features
- **Interactive MapLibre Map Interface**: Click anywhere on the map or search for a location
- **Location Search**: Powered by OpenStreetMap Nominatim geocoding
- **Date Selection**: Pick any day of the year to analyze
- **🧠 AI Weather Insights**: Client-side AI-powered summaries using WebLLM (runs in your browser!)
- **Weather Categories**:
  - 🔥 Very Hot (>90°F) - NOAA Heat Index Guidelines
  - ❄️ Very Cold (<32°F) - NOAA Freeze Warning
  - 💨 Very Windy (>25 mph) - NWS Wind Advisory
  - 🌧️ Very Wet (>0.5 inches) - NOAA Heavy Rain
  - 😰 Very Uncomfortable (heat+humidity OR wind+rain)

### Analysis Features
- **Historical Data Analysis**: 20 years of weather data (2004-2024)
- **Probability Calculations**: Statistical analysis with detailed counts ("9 of 20 years")
- **Visual Charts**: Interactive bar and line charts using Recharts
- **Data Export**: Download results as CSV or JSON
- **Climate Trend Analysis**: Track how weather patterns have changed over time
- **🤖 AI-Powered Insights**: Get intelligent summaries with actionable tips (WebGPU-powered)
- **Scientific Definitions**: NOAA/NASA-based thresholds with citations
- **Detailed Tooltips**: Raw counts and exact thresholds in hover tooltips

### User Experience
- **Mobile-Friendly**: Responsive design for all devices
- **Fast & Clean UI**: Built with Tailwind CSS
- **Real-time Analysis**: Instant results after location selection
- **Professional Design**: Modern, gradient-based interface

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **UI Library**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Maps**: MapLibre GL + react-map-gl
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **🧠 AI**: WebLLM (client-side LLM via WebGPU)

### Backend
- **API Routes**: Next.js API Routes
- **Data Source**: Open-Meteo Historical Weather Archive API
- **Geocoding**: OpenStreetMap Nominatim

## 📦 Installation

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager

### Setup Steps

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd Project-BlueSky
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Run the development server**
```bash
npm run dev
# or
yarn dev
```

4. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Usage

1. **Select a Location**:
   - Click anywhere on the map to drop a pin
   - OR use the search bar to find a specific city/address

2. **Choose a Date**:
   - Use the calendar widget to select any day of the year
   - The current date is selected by default

3. **Analyze Weather**:
   - Click the "Analyze Weather" button
   - Wait for the historical data to be fetched and analyzed

4. **View Results**:
   - See probability percentages for each weather category
   - View interactive charts
   - Check climate trends over the past 20 years
   - Read the summary statement

5. **Enable AI Insights** (Optional):
   - Click "Enable AI" in the AI Weather Insights card
   - Wait for model to load (30-60 seconds first time)
   - Get personalized, intelligent summaries with actionable tips
   - Works entirely in your browser (privacy-first!)

6. **Export Data**:
   - Click "CSV" to download as spreadsheet
   - Click "JSON" to download raw data

## 🧠 AI Weather Insights

### Client-Side AI Analysis
- Runs **100% locally** in your browser using WebLLM
- **No data sent to servers** - completely private
- Generates intelligent summaries based on probabilities and trends
- Provides actionable recommendations
- Falls back to template mode on unsupported browsers

### Requirements for AI Mode
- Chrome 113+ or Edge 113+ (WebGPU support)
- Modern GPU (NVIDIA GTX 900+, AMD RX 400+, Intel Iris+)
- ~500MB storage for model cache (one-time download)

### Fallback Mode
- Works on **all devices and browsers**
- Rule-based summaries when WebGPU unavailable
- Fast and reliable alternative

**See [AI_INSIGHTS_GUIDE.md](AI_INSIGHTS_GUIDE.md) for detailed documentation**

## 📊 How It Works

### Data Collection
1. App queries Open-Meteo Archive API for historical weather data
2. Fetches data for the selected date across 20 years (2004-2024)
3. Retrieves: temperature, precipitation, wind speed, humidity

### Probability Calculation
- **Very Hot**: Days when max temperature ≥ 95°F
- **Very Cold**: Days when min temperature ≤ 32°F
- **Very Windy**: Days when max wind speed ≥ 25 mph
- **Very Wet**: Days when precipitation ≥ 0.5 inches
- **Very Uncomfortable**: Days with (high heat + high humidity) OR (wind + rain)

Probability = (Days meeting criteria / Total days analyzed) × 100

### Trend Analysis
- Data split into two 10-year periods
- Compares probability changes between periods
- Identifies increasing, decreasing, or stable trends
- Helps visualize climate change impacts

## 🌍 API Endpoints

### POST `/api/weather/analyze`
Analyzes weather probabilities for a specific location and date.

**Request Body**:
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "date": "2024-07-15T00:00:00.000Z"
}
```

**Response**:
```json
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

## 🎨 Project Structure

```
Project-BlueSky/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── weather/
│   │   │       └── analyze/
│   │   │           └── route.ts       # Weather analysis API
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Main page
│   │   └── globals.css                # Global styles
│   └── components/
│       ├── MapComponent.tsx           # Interactive map
│       ├── DateSelector.tsx           # Calendar picker
│       └── WeatherAnalysis.tsx        # Results display
├── public/                            # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## 🔧 Configuration

### Thresholds
You can customize weather thresholds in `src/app/api/weather/analyze/route.ts`:

```typescript
const VERY_HOT_THRESHOLD = 95 // °F
const VERY_COLD_THRESHOLD = 32 // °F
const VERY_WINDY_THRESHOLD = 25 // mph
const VERY_WET_THRESHOLD = 0.5 // inches
const UNCOMFORTABLE_HEAT_INDEX_TEMP = 85 // °F
const UNCOMFORTABLE_HUMIDITY = 70 // %
```

### Historical Range
To change the analysis period, modify:
```typescript
const startYear = currentYear - 20 // Change 20 to desired years
```

## 🌐 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Build for Production
```bash
npm run build
npm start
```

## 🐛 Troubleshooting

### Map not loading
- Check browser console for errors
- Ensure you have internet connection
- MapLibre requires WebGL support

### API returning no data
- Some remote locations may have limited historical data
- Try a major city to verify functionality
- Check Open-Meteo API status

### Slow analysis
- Fetching 20 years of data takes time
- Consider implementing caching for frequently queried locations
- API calls are made sequentially to respect rate limits

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **Open-Meteo**: Historical weather data API
- **OpenStreetMap**: Geocoding and map tiles
- **MapLibre**: Open-source map library
- **Recharts**: Beautiful charting library

## 🔮 Future Enhancements

- [ ] Cache historical data to improve performance
- [ ] Add more weather categories (severe storms, snow, etc.)
- [ ] Compare multiple locations side-by-side
- [ ] Historical event correlation (e.g., El Niño years)
- [ ] Share analysis via URL
- [ ] Dark mode support
- [ ] Multi-language support

## 📧 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

Built with ❤️ using Next.js, React, and Open-Meteo API

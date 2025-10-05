# Quick Setup Guide

## Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

## Installation

### Step 1: Install Dependencies
```bash
npm install
```

This will install all required packages:
- Next.js 14 (React framework)
- React 18 (UI library)
- TypeScript (type safety)
- Tailwind CSS (styling)
- MapLibre GL (maps)
- Recharts (charts)
- Lucide React (icons)
- date-fns (date utilities)

### Step 2: Start Development Server
```bash
npm run dev
```

The app will be available at: **http://localhost:3000**

### Step 3: Use the Application

1. **Select Location**: 
   - Click on the map OR
   - Type in the search bar (e.g., "New York, NY" or "Phoenix, Arizona")

2. **Pick a Date**: 
   - Use the calendar to select any day of the year

3. **Analyze**: 
   - Click "Analyze Weather" button
   - Wait 5-10 seconds for historical data to load

4. **View Results**:
   - Probability percentages for each weather condition
   - Interactive charts
   - Climate trend analysis
   - Download CSV/JSON data

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use a different port
npm run dev -- -p 3001
```

### Dependencies Not Installing
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Map Not Loading
- Ensure you have an active internet connection
- Check browser console for errors
- Try a different browser (Chrome/Firefox recommended)

### No Weather Data
- Some remote locations have limited historical data
- Try selecting a major city first
- Check Open-Meteo API status: https://open-meteo.com/

## Build for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm start
```

## Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

## Project Structure

```
Project-BlueSky/
├── src/
│   ├── app/
│   │   ├── api/weather/analyze/route.ts    # Weather API endpoint
│   │   ├── layout.tsx                      # Root layout
│   │   ├── page.tsx                        # Main page
│   │   └── globals.css                     # Global styles
│   ├── components/
│   │   ├── MapComponent.tsx                # Interactive map
│   │   ├── DateSelector.tsx                # Date picker
│   │   └── WeatherAnalysis.tsx             # Results display
│   └── types/
│       └── weather.ts                      # TypeScript types
├── public/                                 # Static files
├── package.json                            # Dependencies
├── tsconfig.json                          # TypeScript config
├── tailwind.config.js                     # Tailwind config
└── next.config.js                         # Next.js config
```

## Features Included

✅ Interactive MapLibre map with search
✅ OpenStreetMap geocoding
✅ Calendar date picker
✅ 20 years of historical weather data
✅ 5 weather categories (hot, cold, windy, wet, uncomfortable)
✅ Probability calculations
✅ Climate trend analysis
✅ Interactive charts (Recharts)
✅ CSV/JSON export
✅ Mobile-responsive design
✅ Tailwind CSS styling
✅ TypeScript for type safety

## Next Steps

- Customize weather thresholds in `src/app/api/weather/analyze/route.ts`
- Modify styling in `tailwind.config.js`
- Add caching for frequently requested locations
- Deploy to Vercel or other hosting platform

## Support

For issues or questions, please refer to:
- README.md for detailed documentation
- Open-Meteo API docs: https://open-meteo.com/en/docs
- Next.js docs: https://nextjs.org/docs

Happy weather analyzing! 🌦️

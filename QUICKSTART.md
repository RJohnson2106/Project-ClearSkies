# ⚡ Quick Start Guide

Get up and running in 3 minutes!

## Step 1: Install Everything 📦

```bash
npm run setup
```

That's it! This command will:
- ✅ Install all dependencies
- ✅ Set up the project structure
- ✅ Prepare for development

## Step 2: Start the App 🚀

```bash
npm run dev
```

Open your browser and go to: **http://localhost:3000**

## Step 3: Try It Out! 🌍

### Example 1: Check Phoenix Heat in July
1. Search for "Phoenix, Arizona"
2. Select July 14th
3. Click "Analyze Weather"
4. See the high probability of very hot days! 🔥

### Example 2: Seattle Rain in January
1. Search for "Seattle, Washington"
2. Select January 15th
3. Click "Analyze Weather"
4. Check the wet weather probability! 🌧️

### Example 3: Chicago Cold in February
1. Search for "Chicago, Illinois"
2. Select February 1st
3. Click "Analyze Weather"
4. View the cold weather chances! ❄️

## Common Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)

# Production
npm run build        # Create production build
npm start            # Run production server

# Maintenance
npm run lint         # Check code quality
```

## Tips for Best Experience

### 🎯 Pro Tips
- **Major cities** have the most complete historical data
- **Wait 5-10 seconds** for analysis (fetching 20 years of data!)
- **Try different dates** to see seasonal patterns
- **Download data** for your own analysis (CSV or JSON)

### 🗺️ Map Tips
- **Click anywhere** on the map to drop a pin
- **Search bar** for specific addresses
- **Zoom in/out** using controls or scroll wheel
- **Pan around** by dragging the map

### 📅 Date Tips
- **Any day of the year** works (year doesn't matter for historical analysis)
- **Navigate months** using arrow buttons
- **Selected date** shows below calendar

### 📊 Results Tips
- **Scroll down** to see all analysis sections
- **Click trend analysis** to expand details
- **Download buttons** at top right of charts
- **Color coding**: Red = hot, Blue = cold, etc.

## What Each Feature Does

| Feature | What It Shows | Why It's Useful |
|---------|--------------|-----------------|
| 🔥 Very Hot | Days ≥95°F | Heat wave planning |
| ❄️ Very Cold | Days ≤32°F | Frost/freeze prep |
| 💨 Very Windy | Wind ≥25 mph | Outdoor event safety |
| 🌧️ Very Wet | Rain ≥0.5" | Precipitation planning |
| 😰 Uncomfortable | Heat+humidity or wind+rain | Comfort assessment |

## Troubleshooting

### Map Not Loading
- Check internet connection
- Try refreshing the page
- Make sure WebGL is enabled in browser

### No Results Appearing
- Verify location is selected (red pin on map)
- Try a major city (e.g., New York, Los Angeles)
- Check browser console for errors (F12)

### Analysis Taking Too Long
- Normal wait time is 5-10 seconds
- Fetching 20 years of data takes time
- Remote locations may be slower

### Search Not Working
- Type at least 3 characters
- Try city name only (e.g., "Seattle")
- Use state/country for clarity (e.g., "Paris, France")

## Example Use Cases

### 🏖️ Beach Vacation
**Goal**: Find best time for California beach trip
```
Location: San Diego, California
Dates: Try June vs August
Look at: Very Hot, Very Wet, Uncomfortable
```

### 🎊 Outdoor Wedding
**Goal**: Pick date with best weather odds
```
Location: Your venue address
Dates: Try different months
Look at: All categories, especially Uncomfortable
```

### 🏃 Marathon Planning
**Goal**: Find comfortable running conditions
```
Location: Race city
Dates: Spring/Fall months
Look at: Very Hot, Uncomfortable, Very Windy
```

## Next Steps

Once you're comfortable with the basics:

1. **Read FEATURES.md** - Learn about all features
2. **Check README.md** - Detailed documentation
3. **Customize thresholds** - Edit src/app/api/weather/analyze/route.ts
4. **Deploy** - Use Vercel or other platforms

## Need Help?

- 📖 **Detailed docs**: See README.md
- 🎨 **Features list**: See FEATURES.md
- ⚙️ **Setup issues**: See SETUP.md
- 🐛 **Found a bug**: Check console (F12) for errors

## Quick Reference

### Project Structure
```
src/
├── app/
│   ├── page.tsx              ← Main page
│   ├── layout.tsx            ← Root layout
│   └── api/weather/analyze/  ← Weather API
└── components/
    ├── MapComponent.tsx      ← Map interface
    ├── DateSelector.tsx      ← Calendar
    └── WeatherAnalysis.tsx   ← Results display
```

### Key Files to Customize
- **Weather thresholds**: `src/app/api/weather/analyze/route.ts`
- **Colors**: `tailwind.config.js`
- **Styles**: `src/app/globals.css`

## Have Fun! 🎉

Explore weather patterns, plan your events, and discover climate trends!

---

**Happy weather analyzing!** 🌦️

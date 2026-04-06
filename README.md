# howbusy.is/nyc

How busy is NYC right now? One score, five signals, zero fluff.

Inspired by [12seasons.nyc](https://12seasons.nyc) -- one clever insight, real live data, dead-simple UI.

## What it does

Pulls live data from five sources, computes a 0-100 busy score, and gives you a verdict:

| Score | Verdict |
|-------|---------|
| 0-20 | Dead quiet. Did everyone leave? |
| 21-40 | Chill. NYC is being reasonable today. |
| 41-60 | Buzzing. Normal NYC chaos. |
| 61-80 | Hectic. Touch grass tomorrow. |
| 81-100 | Pure chaos. Godspeed. |

**Data signals:**
- MTA subway alerts (GTFS-RT feed, no key required)
- Weather via OpenWeatherMap
- Events via Ticketmaster Discovery API
- NYC 311 noise complaints (NYC Open Data, no key required)
- Time-of-day heuristic (rush hour, Friday night, etc.)

## Setup

```bash
git clone https://github.com/yashkarthik/howbusyis
cd howbusyis
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

```
OPENWEATHER_API_KEY=   # openweathermap.org/api - free tier
TICKETMASTER_API_KEY=  # developer.ticketmaster.com - free tier
```

MTA and NYC Open Data need no keys.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

```bash
npx vercel --prod
```

Set `OPENWEATHER_API_KEY` and `TICKETMASTER_API_KEY` in your Vercel project environment variables.

## Architecture

```
app/
  page.tsx                  # Client shell, auto-refreshes every 5 min
  api/busy/route.ts         # Server route: fans out to all APIs, returns JSON
  og/route.tsx              # Edge route: generates OG image for sharing
  lib/
    cityConfig.ts           # City config object (extensible to SF, Chicago, etc.)
    types.ts                # Types + verdict mapping
    scoring.ts              # Per-signal scoring functions
  components/
    BusyDashboard.tsx       # Main UI
    ScoreBar.tsx            # Animated score bar
    SignalCard.tsx          # Individual signal cards
    ShareButton.tsx         # Share / copy button
```

## Adding a new city

1. Add an entry to `CITY_CONFIG` in `app/lib/cityConfig.ts`
2. Create `app/[city]/page.tsx` that passes the city key to the API

## License

MIT

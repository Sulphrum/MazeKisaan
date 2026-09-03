import { Router, type Request, type Response } from 'express'
import { db } from '../db/store.ts'

export const mandiRouter = Router()

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || (process.env.VERCEL ? '' : 'http://localhost:8000')
const FESTIVALS = [
  { name: 'Ganesh Chaturthi', start_date: '2026-08-19', end_date: '2026-08-29', impact: 15 },
  { name: 'Navratri', start_date: '2026-10-02', end_date: '2026-10-11', impact: 18 },
  { name: 'Diwali', start_date: '2026-10-19', end_date: '2026-10-23', impact: 25 },
  { name: 'Holi', start_date: '2027-03-14', end_date: '2027-03-14', impact: 12 },
]
const FESTIVAL_CROPS = ['Tomato', 'Green Chilli', 'Onion', 'Potato']

async function callMLService(endpoint: string, body?: Record<string, unknown>): Promise<any | null> {
  // The Python model runs as an optional separate service. On Vercel, use the
  // deterministic market-data fallback unless ML_SERVICE_URL is configured.
  if (!ML_SERVICE_URL) return null

  try {
    const response = await fetch(`${ML_SERVICE_URL}${endpoint}`, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(3000),
    })
    if (!response.ok) throw new Error(`ML service returned ${response.status}`)
    return await response.json()
  } catch (error) {
    console.warn(`[Mandi ML fallback] ${endpoint}:`, error instanceof Error ? error.message : error)
    return null
  }
}

function numberParam(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

const DEMO_CHART_TODAY = new Date('2026-09-03T00:00:00.000Z')

function alignChartToDemoToday(chart: any) {
  const historical = Array.isArray(chart?.historical) ? chart.historical : []
  const forecast = Array.isArray(chart?.forecast) ? chart.forecast : []
  const latestHistoricalPoint = [...historical]
    .reverse()
    .find((point) => point?.date && !Number.isNaN(new Date(point.date).getTime()))

  if (!latestHistoricalPoint) return chart

  const latestDate = new Date(latestHistoricalPoint.date)
  const latestUtcDay = Date.UTC(latestDate.getUTCFullYear(), latestDate.getUTCMonth(), latestDate.getUTCDate())
  const targetUtcDay = Date.UTC(
    DEMO_CHART_TODAY.getUTCFullYear(),
    DEMO_CHART_TODAY.getUTCMonth(),
    DEMO_CHART_TODAY.getUTCDate(),
  )
  const dayShift = Math.round((targetUtcDay - latestUtcDay) / 86_400_000)
  if (dayShift === 0) return chart

  const shiftDate = (dateValue: unknown) => {
    const parsed = new Date(String(dateValue || ''))
    if (Number.isNaN(parsed.getTime())) return dateValue
    parsed.setUTCDate(parsed.getUTCDate() + dayShift)
    return parsed.toISOString().slice(0, 10)
  }

  return {
    ...chart,
    historical: historical.map((point: any) => ({ ...point, date: shiftDate(point.date) })),
    forecast: forecast.map((point: any) => ({ ...point, date: shiftDate(point.date) })),
  }
}

function cropSeed(crop: string): number {
  return [...crop].reduce((total, character) => total + character.charCodeAt(0), 0)
}

function variedHistoryFactors(crop: string, length: number): number[] {
  const phase = (cropSeed(crop) % 19) / 3
  const values = Array.from({ length }, (_, index) => {
    const shortWave = Math.sin((index + phase) * 1.31) * 0.026
    const marketNoise = Math.cos((index + phase * 0.7) * 2.17) * 0.014
    const broadMove = Math.sin((index + phase) * 0.43) * 0.02
    return 1 + shortWave + marketNoise + broadMove
  })
  const last = values[values.length - 1] || 1
  return values.map((value) => value / last)
}

function upcomingFestivals() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return FESTIVALS.filter((festival) => new Date(`${festival.end_date}T23:59:59`) >= today)
    .slice(0, 4)
    .map((festival) => {
      const start = new Date(`${festival.start_date}T00:00:00`)
      const daysAway = Math.max(0, Math.ceil((start.getTime() - today.getTime()) / 86_400_000))
      return {
        name: festival.name,
        start_date: festival.start_date,
        days_away: daysAway,
        expected_price_impact: `+${festival.impact}%`,
        affected_crops: FESTIVAL_CROPS,
        advice: 'Prices typically rise 2 weeks before. Consider holding if shelf life allows.',
      }
    })
}

function seedFestivalContext() {
  const next = upcomingFestivals()[0]
  if (!next) return null
  return {
    next_festival: next.name,
    days_away: next.days_away,
    expected_demand_boost: next.expected_price_impact,
    advice: `${next.name} ${next.days_away === 0 ? 'is underway' : `in ${next.days_away} days`}. Vegetable demand typically rises ${next.expected_price_impact.replace('+', '')} in the week before.`,
  }
}

function buildSeedForecast(crop: string) {
  const current = db.getMarketPrices().find((price) => price.crop.toLowerCase() === crop.toLowerCase())
  const base = current?.modalPrice || 2500
  const projections = [1.0, 1.03, 1.06, 1.09].map((factor, index) => ({
    day: ['Day 1–3', 'Day 4–7', 'Day 8–11', 'Day 12–14'][index],
    projectedModalPrice: Math.round(base * factor),
    trend: index === 0 ? 'stable' : 'up',
  }))
  const expectedPrice = projections[projections.length - 1].projectedModalPrice
  return {
    crop,
    forecastPeriod: 'Next 14 Days',
    trend: expectedPrice >= base ? 'Bullish' : 'Bearish',
    confidenceScore: current ? 86 : 70,
    expectedPrice,
    summary: current
      ? `Seeded market history indicates a ${expectedPrice >= base ? 'gradual increase' : 'softening'} from the current modal price.`
      : 'Insufficient market history; prototype estimate based on a conservative baseline.',
    recommendation:
      expectedPrice >= base
        ? 'Consider forward contracts for lots that are ready soon.'
        : 'Avoid locking the entire lot until prices stabilize.',
    keyDriver: current
      ? `Projection anchored to the latest ${current.mandi} modal price of ₹${base}/Qtl.`
      : 'No matching seeded mandi series was available.',
    priceProjections: projections,
    targetBids: {
      tomato: 'Lock under ₹2,550/Qtl',
      onion: 'Lock under ₹2,380/Qtl',
      grapes: 'Lock under ₹6,800/Qtl',
    },
  }
}

// ─── GET /api/mandi/prices ────────────────────────────────────────────────────
mandiRouter.get('/prices', async (_req: Request, res: Response) => {
  try {
    const official = await callMLService('/latest-prices')
    if (official?.prices?.length) {
      return res.json({
        timestamp: new Date().toISOString(),
        asOf: official.as_of,
        source: official.source,
        isLive: true,
        dataStatus: official.data_status,
        mandiHub: 'Maharashtra AGMARKNET markets',
        prices: official.prices.map((price: any, index: number) => ({
          id: `live_${index + 1}_${String(price.commodity).toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
          crop: price.commodity,
          minPrice: price.min_price,
          maxPrice: price.max_price,
          modalPrice: price.modal_price,
          unit: '₹ / Qtl',
          trend: price.trend,
          trendPct: `${price.trend_pct > 0 ? '+' : ''}${price.trend_pct}%`,
          mandi: price.mandi,
          lastUpdated: price.date,
          district: price.district,
          variety: price.variety,
          grade: price.grade,
          source: price.source,
        })),
      })
    }
    return res.json({
      timestamp: new Date().toISOString(),
      asOf: null,
      source: 'demo-fallback',
      isLive: false,
      dataStatus: official?.data_status || null,
      mandiHub: 'Maharashtra Western Agro Zone (demo)',
      prices: db.getMarketPrices(),
    })
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve mandi prices' })
  }
})

mandiRouter.get('/data-status', async (_req: Request, res: Response) => {
  const status = await callMLService('/data-status')
  return res.json(status || { official_live: { ok: false, error: 'ML service is unavailable' } })
})

// ─── GET /api/mandi/forecast ──────────────────────────────────────────────────
mandiRouter.get('/forecast', async (req: Request, res: Response) => {
  try {
    const crop = (req.query.crop as string) || 'Tomato'
    const mandi = (req.query.mandi as string) || 'Niphad'
    const officialFeed = await callMLService(`/latest-prices?commodity=${encodeURIComponent(crop)}`)
    const officialCurrent = officialFeed?.prices?.find((price: any) => String(price.mandi).toLowerCase() === mandi.toLowerCase()) || officialFeed?.prices?.[0]
    const current = db.getMarketPrices().find((price) => price.crop.toLowerCase() === crop.toLowerCase())
    const requestedCurrentPrice = numberParam(req.query.current_price, 0)
    const currentPrice = requestedCurrentPrice > 0 ? requestedCurrentPrice : Number(officialCurrent?.modal_price) || current?.modalPrice || 2500
    const trendPct = officialCurrent ? Number(officialCurrent.trend_pct || 0) / 100 : Number.parseFloat(current?.trendPct || '0') / 100
    const strategy = await callMLService('/strategy', {
      commodity: crop,
      mandi,
      quantity_qtl: numberParam(req.query.quantity_qtl, 60),
      current_price: currentPrice,
      price_7d_ago: Math.max(1, Math.round(currentPrice / (1 + trendPct))),
      arrivals_tonnes: 45.5,
      shelf_life_days: numberParam(req.query.shelf_life_days, 7),
      storage_cost_per_day: numberParam(req.query.storage_cost_per_day ?? req.query.storage_cost, 18),
      transport_cost: numberParam(req.query.transport_cost, 728),
      cultivation_expense: numberParam(req.query.cultivation_expense, 28000),
      quality_grade: (req.query.quality_grade as string) || 'A',
    })
    if (strategy) {
      return res.json({
        ...strategy,
        model_status: 'active',
        festival_context: strategy.festival_context || seedFestivalContext(),
      })
    }
    return res.json({ forecast: buildSeedForecast(crop), model_status: 'preview', festival_context: seedFestivalContext() })
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to generate mandi forecast' })
  }
})

// ─── GET /api/mandi/festivals ─────────────────────────────────────────────────
mandiRouter.get('/festivals', (_req: Request, res: Response) => {
  return res.json({ upcoming_festivals: upcomingFestivals() })
})

// ─── GET /api/mandi/price-chart/:commodity ───────────────────────────────────
mandiRouter.get('/price-chart/:commodity', async (req: Request, res: Response) => {
  try {
    const commodity = String(req.params.commodity || '')
    const mandi = Array.isArray(req.query.mandi) ? String(req.query.mandi[0] || 'Niphad') : String(req.query.mandi || 'Niphad')
    const chart = await callMLService(
      `/prices/${encodeURIComponent(commodity)}?mandi=${encodeURIComponent(mandi)}`,
    )
    if (chart) return res.json(alignChartToDemoToday(chart))

    const seeded = db
      .getMarketPrices()
      .find((price) => price.crop.toLowerCase() === commodity.toLowerCase())
    const base = seeded?.modalPrice || 2500
    const today = new Date(DEMO_CHART_TODAY)
    const historyFactors = variedHistoryFactors(commodity, 30)
    const isoDate = (offset: number) => {
      const value = new Date(today)
      value.setUTCDate(value.getUTCDate() + offset)
      return value.toISOString().slice(0, 10)
    }
    return res.json({
      commodity,
      mandi: seeded?.mandi || mandi,
      historical: Array.from({ length: 30 }, (_, index) => ({
        date: isoDate(index - 29),
        modal_price: Math.round(base * historyFactors[index]),
        is_forecast: false,
      })),
      forecast: Array.from({ length: 14 }, (_, index) => {
        const modalPrice = Math.round(base * (1 + (index + 1) * 0.006))
        return {
          date: isoDate(index + 1),
          modal_price: modalPrice,
          low: Math.round(modalPrice * 0.94),
          high: Math.round(modalPrice * 1.06),
          is_forecast: true,
        }
      }),
      source: 'seed-fallback',
    })
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve price chart' })
  }
})

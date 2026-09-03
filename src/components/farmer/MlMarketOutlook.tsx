import { useEffect, useMemo, useState } from 'react'
import { api } from '../../services/api'

type MarketCrop = {
  crop: string
  common: number
  direction: 'Rising' | 'Stable' | 'Falling'
}

type ForecastView = {
  current: number
  predicted7d: number
  change7d: number
  confidence: number
  modelActive: boolean
}

type WeekPoint = {
  index: number
  day: string
  date: string
  price: number
  demandScore: number
  demandLabel: 'Strong' | 'Steady' | 'Soft'
}

const COST_PROFILES: Record<string, { score: number; label: string; note: string }> = {
  Tomato: { score: 65, label: 'Medium–high', note: 'Labour, crop protection and repeated harvesting are important costs.' },
  Onion: { score: 55, label: 'Medium', note: 'Storage and weight loss can change the final return.' },
  Potato: { score: 52, label: 'Medium', note: 'Seed, harvesting, handling and transport are the main cost areas.' },
  Brinjal: { score: 60, label: 'Medium', note: 'Repeated picking and pest control increase cultivation effort.' },
  'Green Chilli': { score: 72, label: 'Medium–high', note: 'Repeated picking and labour can be costly even when prices are strong.' },
  Cabbage: { score: 48, label: 'Medium', note: 'A short selling window makes transport and timing important.' },
  Grapes: { score: 92, label: 'Very high', note: 'Quality management, labour and rejection risk make investment high.' },
  Banana: { score: 68, label: 'Medium–high', note: 'Long crop duration and transport care add to investment.' },
  Pomegranate: { score: 82, label: 'High', note: 'Orchard care and premium-quality sorting require higher investment.' },
  Wheat: { score: 44, label: 'Low–medium', note: 'Mechanisation can reduce labour cost, but yield remains important.' },
  Maize: { score: 47, label: 'Medium', note: 'Seed, fertilizer and harvesting costs shape the final return.' },
  Chickpea: { score: 46, label: 'Low–medium', note: 'Input needs are moderate, while yield and market timing matter.' },
  'Pigeon Pea': { score: 52, label: 'Medium', note: 'A longer crop duration can increase field-management costs.' },
  Soybean: { score: 54, label: 'Medium', note: 'Yield and harvesting efficiency strongly affect the return.' },
  Groundnut: { score: 61, label: 'Medium–high', note: 'Harvesting and drying quality can add cost and risk.' },
  Cotton: { score: 70, label: 'Medium–high', note: 'Picking labour and crop protection are major cost areas.' },
  Turmeric: { score: 74, label: 'High', note: 'Long duration, processing and drying require more investment.' },
}

function money(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function fallbackForecast(crop: MarketCrop): ForecastView {
  const movement = crop.direction === 'Rising' ? 0.045 : crop.direction === 'Falling' ? -0.025 : 0.012
  return {
    current: crop.common,
    predicted7d: Math.round(crop.common * (1 + movement)),
    change7d: movement * 100,
    confidence: 0,
    modelActive: false,
  }
}

function buildWeek(forecast: ForecastView): WeekPoint[] {
  const today = new Date()
  const priceDifference = forecast.predicted7d - forecast.current
  const path = [0, 0.12, 0.25, 0.39, 0.54, 0.69, 0.84, 1]
  return path.map((progress, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + index)
    const price = Math.round((forecast.current + priceDifference * progress) / 10) * 10
    const movement = ((price - forecast.current) / Math.max(forecast.current, 1)) * 100
    const demandScore = Math.round(clamp(55 + movement * 7, 25, 94))
    return {
      index,
      day: index === 0 ? 'Today' : new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(date),
      date: new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(date),
      price,
      demandScore,
      demandLabel: demandScore >= 68 ? 'Strong' : demandScore <= 43 ? 'Soft' : 'Steady',
    }
  })
}

function DemandBars({ score }: { score: number }) {
  const activeBars = score >= 75 ? 4 : score >= 58 ? 3 : score >= 42 ? 2 : 1
  return <div className="flex h-6 items-end justify-center gap-1" aria-label={`Demand score ${score} out of 100`}>
    {[1, 2, 3, 4].map((bar) => <span key={bar} className="w-1.5 rounded-sm" style={{ height: `${7 + bar * 4}px`, background: bar <= activeBars ? '#3F6B45' : '#D9E1DA' }} />)}
  </div>
}

function VisualScale({ value, color }: { value: number; color: string }) {
  const activeSegments = Math.max(1, Math.round(value / 10))
  return <div className="grid grid-cols-10 gap-1.5" aria-label={`${value} out of 100`}>
    {Array.from({ length: 10 }, (_, index) => <span key={index} className="h-4 rounded-sm" style={{ background: index < activeSegments ? color : '#E4E9E4' }} />)}
  </div>
}

export function MlMarketOutlook({ crop }: { crop: MarketCrop }) {
  const [forecast, setForecast] = useState<ForecastView>(() => fallbackForecast(crop))
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(0)

  useEffect(() => {
    let active = true
    setSelectedDay(0)
    setLoading(true)
    setForecast(fallbackForecast(crop))
    api.mandi.getForecast(crop.crop, crop.common).then((result) => {
      if (!active) return
      const current = Number(result?.current_price ?? result?.currentPrice ?? crop.common)
      const predicted7d = Number(result?.predicted_price_7d ?? result?.expectedPrice ?? current)
      const change7d = Number.isFinite(Number(result?.trend_pct))
        ? Number(result.trend_pct)
        : ((predicted7d - current) / Math.max(current, 1)) * 100
      setForecast({
        current,
        predicted7d,
        change7d,
        confidence: Number(result?.confidence_pct ?? result?.confidenceScore ?? 0),
        modelActive: result?.model_status === 'active',
      })
    }).catch(() => undefined).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [crop])

  const week = useMemo(() => buildWeek(forecast), [forecast])
  const selectedPoint = week[selectedDay] || week[0]
  const dayDifference = selectedPoint.price - forecast.current
  const costProfile = COST_PROFILES[crop.crop] || { score: 58, label: 'Medium', note: 'Cultivation, labour and transport all affect the final return.' }
  const returnSignal = Math.round(clamp(52 + forecast.change7d * 8, 18, 94))
  const priceChange = forecast.predicted7d - forecast.current
  const outlookLabel = forecast.change7d >= 2 ? 'Prices may improve' : forecast.change7d <= -2 ? 'Prices may soften' : 'Prices may stay steady'
  const outlookText = forecast.change7d >= 2
    ? `The model expects ${crop.crop} prices to improve over the next seven days. Actual earnings will still depend on your yield and costs.`
    : forecast.change7d <= -2
      ? `The model expects ${crop.crop} prices to soften over the next seven days. Higher growing costs may leave less money after expenses.`
      : `The model expects ${crop.crop} prices to remain close to today’s level. Your actual growing cost may have a bigger effect on the final return.`

  return (
    <section aria-label={`${crop.crop} ML market forecast`} className="space-y-10">
      <section>
        <div><div className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#3F6B45' }}>Model forecast</div><h3 className="mt-2 text-2xl font-bold sm:text-3xl" style={{ color: '#1D241F' }}>{crop.crop} demand over the next week</h3><p className="mt-2 text-sm" style={{ color: '#687069' }}>Select a day to see its predicted price and demand strength.</p></div>

        <div className="mt-6 overflow-x-auto pb-2">
          <div className="grid min-w-[760px] grid-cols-8 overflow-hidden border" style={{ borderColor: '#D8DED8', background: '#FFFEFA' }}>
            {week.map((point) => {
              const selected = point.index === selectedDay
              const movement = point.price - forecast.current
              return <button key={point.index} type="button" onClick={() => setSelectedDay(point.index)} className="relative border-r px-2 py-4 text-center last:border-r-0" style={{ background: selected ? '#F2EDDF' : '#FFFEFA', borderColor: '#E1E6E1' }}>
                {selected && <span className="absolute inset-x-0 top-0 h-1" style={{ background: '#C5A15A' }} />}
                <div className="text-xs font-bold" style={{ color: selected ? '#173F2A' : '#687069' }}>{point.day}</div>
                <div className="mt-1 text-[11px]" style={{ color: '#879087' }}>{point.date}</div>
                <div className="mt-3 text-base font-bold" style={{ color: '#1D241F' }}>{money(point.price)}</div>
                <DemandBars score={point.demandScore} />
                <div className="mt-1 text-[11px] font-semibold" style={{ color: point.demandLabel === 'Strong' ? '#216644' : point.demandLabel === 'Soft' ? '#9F241B' : '#687069' }}>{point.demandLabel}</div>
                {point.index > 0 && <div className="mt-1 text-[10px]" style={{ color: movement >= 0 ? '#3F6B45' : '#9F241B' }}>{movement >= 0 ? '+' : ''}{money(movement)}</div>}
              </button>
            })}
          </div>
        </div>

        <div className="mt-4 grid overflow-hidden border lg:grid-cols-[0.7fr_1.3fr]" style={{ background: '#F7F8F3', borderColor: '#D8DED8' }}>
          <div className="border-b p-5 lg:border-b-0 lg:border-r" style={{ borderColor: '#D8DED8' }}><div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#687069' }}>{selectedPoint.day} · {selectedPoint.date}</div><div className="mt-2 text-3xl font-bold" style={{ color: '#173F2A' }}>{money(selectedPoint.price)}<span className="ml-1 text-sm font-medium" style={{ color: '#687069' }}>/Qtl</span></div><div className="mt-2 inline-flex items-center gap-2 text-sm font-bold" style={{ color: selectedPoint.demandLabel === 'Strong' ? '#216644' : selectedPoint.demandLabel === 'Soft' ? '#9F241B' : '#52635A' }}><DemandBars score={selectedPoint.demandScore} />{selectedPoint.demandLabel} demand</div></div>
          <div className="p-5"><div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#3F6B45' }}>Simple insight</div><p className="mt-2 text-lg font-semibold leading-relaxed" style={{ color: '#1D241F' }}>{selectedDay === 0 ? `${crop.crop} is around ${money(forecast.current)} per quintal today.` : dayDifference > forecast.current * 0.01 ? `Demand may improve by ${selectedPoint.day}, with price near ${money(selectedPoint.price)} per quintal.` : dayDifference < -forecast.current * 0.01 ? `Demand may be softer by ${selectedPoint.day}, with price near ${money(selectedPoint.price)} per quintal.` : `Demand may stay steady through ${selectedPoint.day}, near ${money(selectedPoint.price)} per quintal.`}</p></div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs" style={{ color: '#7A827B' }}><span>Daily values show the path toward the model’s 7-day forecast.</span><span>{loading ? 'Refreshing model…' : forecast.modelActive && forecast.confidence ? `Model confidence ${forecast.confidence}%` : 'Preview estimate'}</span></div>
      </section>

      <section>
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#3F6B45' }}>Crop planning view</div>
          <h3 className="mt-2 text-2xl font-bold sm:text-3xl" style={{ color: '#1D241F' }}>Understand the cost and market outlook for {crop.crop}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: '#687069' }}>This view places two things side by side: what this crop generally needs to cultivate and how its market price may move during the next seven days. Use it to understand the situation before planning—not as a recommendation of what to grow.</p>
        </div>

        <div className="mt-6 overflow-hidden border" style={{ background: '#FFFEFA', borderColor: '#D8DED8' }}>
          <div className="grid gap-6 p-6 lg:grid-cols-2 lg:p-8">
            <div className="border p-5" style={{ background: '#FAF7EE', borderColor: '#E2D8BE' }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-base font-bold" style={{ color: '#1D241F' }}>Typical money and work needed</div>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: '#687069' }}>A general view of cultivation cost, labour and crop care.</p>
                </div>
                <div className="shrink-0 text-sm font-bold" style={{ color: '#765B2E' }}>{costProfile.label}</div>
              </div>
              <div className="mt-5"><VisualScale value={costProfile.score} color="#C5A15A" /></div>
              <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider" style={{ color: '#879087' }}><span>Needs less</span><span>Needs more</span></div>
              <p className="mt-4 border-t pt-4 text-sm leading-relaxed" style={{ color: '#526058', borderColor: '#E2D8BE' }}>{costProfile.note}</p>
            </div>
            <div className="border p-5" style={{ background: '#F2F7F2', borderColor: '#C8D6CB' }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-base font-bold" style={{ color: '#1D241F' }}>Expected market price movement</div>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: '#687069' }}>How the selling price may change during the next seven days.</p>
                </div>
                <div className="shrink-0 text-sm font-bold" style={{ color: forecast.change7d >= 0 ? '#216644' : '#9F241B' }}>{forecast.change7d >= 0 ? '+' : ''}{forecast.change7d.toFixed(1)}%</div>
              </div>
              <div className="mt-5"><VisualScale value={returnSignal} color={forecast.change7d >= 0 ? '#3F6B45' : '#A64B42'} /></div>
              <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider" style={{ color: '#879087' }}><span>May weaken</span><span>May improve</span></div>
              <p className="mt-4 border-t pt-4 text-sm leading-relaxed" style={{ color: '#526058', borderColor: '#C8D6CB' }}>The model compares today’s price with its estimate for seven days from now.</p>
            </div>
          </div>

          <div className="grid border-t lg:grid-cols-[1fr_auto]" style={{ borderColor: '#D8DED8', background: '#F7F8F3' }}>
            <div className="p-6">
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#3F6B45' }}>What this means</div>
              <div className="mt-2 inline-flex items-center border px-3 py-1 text-xs font-bold uppercase tracking-wider" style={{ background: forecast.change7d >= 2 ? '#EAF5EE' : forecast.change7d <= -2 ? '#FFF1EF' : '#F2EDDF', borderColor: forecast.change7d >= 2 ? '#BCD5C4' : forecast.change7d <= -2 ? '#E8C0BB' : '#DDD5BF', color: forecast.change7d >= 2 ? '#216644' : forecast.change7d <= -2 ? '#9F241B' : '#765B2E' }}>{outlookLabel}</div>
              <p className="mt-3 text-base font-semibold leading-relaxed" style={{ color: '#1D241F' }}>{outlookText}</p>
            </div>
            <div className="grid grid-cols-3 border-t px-6 py-5 text-center lg:border-l lg:border-t-0" style={{ borderColor: '#D8DED8' }}><div className="px-3"><div className="text-[11px]" style={{ color: '#687069' }}>Today</div><div className="mt-1 font-bold">{money(forecast.current)}</div></div><div className="border-x px-3" style={{ borderColor: '#D8DED8' }}><div className="text-[11px]" style={{ color: '#687069' }}>In 7 days</div><div className="mt-1 font-bold" style={{ color: '#173F2A' }}>{money(forecast.predicted7d)}</div></div><div className="px-3"><div className="text-[11px]" style={{ color: '#687069' }}>Change</div><div className="mt-1 font-bold" style={{ color: priceChange >= 0 ? '#216644' : '#9F241B' }}>{priceChange >= 0 ? '+' : ''}{money(priceChange)}</div></div></div>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed" style={{ color: '#7A827B' }}>This is a general market-planning view, not a personal profit calculation or crop recommendation. Land, water, weather, yield, quality and your actual expenses can change the result.</p>
      </section>
    </section>
  )
}

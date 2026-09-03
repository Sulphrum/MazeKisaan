import { useEffect, useMemo, useState } from 'react'
import { api } from '../../services/api'
import { PublicSignalChart } from '../auth/PublicSignalChart'

type MarketCrop = {
  crop: string
  category: string
  min: number
  max: number
  common: number
  direction: 'Rising' | 'Stable' | 'Falling'
  demand: 'High' | 'Normal' | 'Limited'
  conclusion: string
}

type ChartPoint = { label: string; value: number; kind?: 'past' | 'future' }
type ForecastSnapshot = { currentPrice?: number; predicted7d?: number; predicted14d?: number; rangeLow?: number; rangeHigh?: number; factors: string[]; festivalAdvice?: string }

function money(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

function shortDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function simpleText(text: string) {
  return text
    .replace(/Price trending up/gi, 'Price may rise')
    .replace(/Price trending rising/gi, 'Price may rise')
    .replace(/Price trending down/gi, 'Price may fall')
    .replace(/over next/gi, 'in the next')
    .replace(/Holding for/gi, 'Waiting')
    .replace(/could yield/gi, 'may give')
    .replace(/\/qtl/gi, ' per quintal')
}

function simpleFactor(text: string) {
  return simpleText(text)
    .replace(/Shelf life of (\d+) days makes full wait safe/gi, 'Can stay fresh for $1 days')
    .replace(/Current Grade A premium is (₹[\d,]+) per quintal vs Grade C/gi, 'Grade A may earn $1 more per quintal')
    .replace(/(.+) demand approaching in (\d+) days/gi, '$1 may raise demand in $2 days')
}

const DEMO_CHART_TODAY = new Date('2026-09-03T00:00:00.000Z')

function cropSeed(crop: string) {
  return [...crop].reduce((total, character) => total + character.charCodeAt(0), 0)
}

function chartDate(offset: number) {
  const value = new Date(DEMO_CHART_TODAY)
  value.setUTCDate(value.getUTCDate() + offset)
  return shortDate(value.toISOString())
}

function fallbackChart(crop: MarketCrop): ChartPoint[] {
  const historyLength = 12
  const seed = cropSeed(crop.crop)
  const phase = (seed % 19) / 3
  const drift = [-0.0018, 0, 0.0018][seed % 3]
  const rawHistory = Array.from({ length: historyLength }, (_, index) => (
    1
    + Math.sin((index + phase) * 1.31) * 0.026
    + Math.cos((index + phase * 0.7) * 2.17) * 0.014
    + Math.sin((index + phase) * 0.43) * 0.02
    + (index - historyLength + 1) * drift
  ))
  const lastValue = rawHistory[historyLength - 1] || 1
  const historical = rawHistory.map((value, index) => ({
    label: chartDate(index - historyLength + 1),
    value: Math.round(crop.common * value / lastValue),
    kind: 'past' as const,
  }))
  const factor = crop.direction === 'Rising' ? 0.008 : crop.direction === 'Falling' ? -0.006 : 0.002
  const future = Array.from({ length: 7 }, (_, index) => ({ label: chartDate(index + 1), value: Math.round(crop.common * (1 + factor * (index + 1))), kind: 'future' as const }))
  return [...historical, ...future]
}

export function CropMarketExplorer({ crops, selectedCropName, hasSelectedCrop, locationLabel, onSelect }: { crops: MarketCrop[]; selectedCropName: string; hasSelectedCrop: boolean; locationLabel: string; onSelect: (cropName: string) => void }) {
  const selectedCrop = crops.find((crop) => crop.crop === selectedCropName) || crops[0]
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>(fallbackChart(selectedCrop))
  const [summary, setSummary] = useState(selectedCrop.conclusion)
  const [snapshot, setSnapshot] = useState<ForecastSnapshot>({ factors: [] })
  const [loading, setLoading] = useState(false)

  const suggestions = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return []
    return crops.filter((crop) => crop.crop.toLowerCase().includes(query)).slice(0, 6)
  }, [crops, search])

  useEffect(() => {
    if (hasSelectedCrop) setSearch(selectedCrop.crop)
  }, [hasSelectedCrop, selectedCrop.crop])

  useEffect(() => {
    if (!hasSelectedCrop) return
    let active = true
    setLoading(true)
    setChartPoints(fallbackChart(selectedCrop))
    setSummary(selectedCrop.conclusion)
    setSnapshot({ factors: [] })
    Promise.all([
      api.publicMarket.getPriceChart(selectedCrop.crop).catch(() => null),
      api.publicMarket.getForecast(selectedCrop.crop).catch(() => null),
    ]).then(([chart, forecast]) => {
      if (!active) return
      if (chart?.historical?.length) {
        const past: ChartPoint[] = chart.historical.slice(-12).map((point: any) => ({ label: shortDate(point.date), value: Number(point.modal_price), kind: 'past' }))
        const next: ChartPoint[] = (chart.forecast || []).slice(0, 8).map((point: any) => ({ label: shortDate(point.date), value: Number(point.modal_price), kind: 'future' }))
        if (past.length && next.length) setChartPoints([...past, ...next])
      }
      const result = forecast?.forecast || forecast
      setSummary(simpleText(result?.recommendation_reason || forecast?.recommendation_summary || result?.summary || selectedCrop.conclusion))
      setSnapshot({
        currentPrice: Number(result?.current_price) || undefined,
        predicted7d: Number(result?.predicted_price_7d) || undefined,
        predicted14d: Number(result?.predicted_price_14d) || undefined,
        rangeLow: Number(result?.range_low) || undefined,
        rangeHigh: Number(result?.range_high) || undefined,
        factors: Array.isArray(forecast?.why_factors) ? forecast.why_factors.slice(0, 2).map(simpleFactor) : [],
        festivalAdvice: result?.festival_context?.advice || forecast?.festival_context?.advice || undefined,
      })
    }).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [hasSelectedCrop, selectedCrop])

  const pastStart = chartPoints.find((point) => point.kind !== 'future')?.value || selectedCrop.common
  const chartCurrent = [...chartPoints].reverse().find((point) => point.kind !== 'future')?.value || selectedCrop.common
  const chartFuture = [...chartPoints].reverse().find((point) => point.kind === 'future')?.value || selectedCrop.common
  const current = snapshot.currentPrice || chartCurrent
  const next = snapshot.predicted7d || chartFuture
  const pastChange = ((chartCurrent - pastStart) / Math.max(1, pastStart)) * 100
  const nextChange = ((next - current) / Math.max(1, current)) * 100

  function choose(crop: MarketCrop) {
    onSelect(crop.crop)
    setSearch(crop.crop)
    setSearchOpen(false)
    window.setTimeout(() => document.getElementById('signed-in-crop-analysis')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  return (
    <section>
      <div className="mx-auto max-w-[760px] text-center">
        <div className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#3F6B45' }}>Crop prices</div>
        <h3 className="mt-3 text-4xl font-bold" style={{ color: '#1D241F' }}>Which crop do you want to check?</h3>
        <p className="mx-auto mt-3 max-w-lg text-base" style={{ color: '#687069' }}>Choose a crop to see its price details around {locationLabel}.</p>
        <div className="relative mx-auto mt-7 max-w-[620px] text-left">
          <svg className="pointer-events-none absolute left-5 top-1/2 z-10 h-5 w-5 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: '#687069' }}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          <input value={search} onChange={(event) => { setSearch(event.target.value); setSearchOpen(true) }} onFocus={() => search.trim() && setSearchOpen(true)} onKeyDown={(event) => { if (event.key === 'Enter' && suggestions[0]) choose(suggestions[0]); if (event.key === 'Escape') setSearchOpen(false) }} placeholder="Type a crop name" aria-label="Search crop" autoComplete="off" className="w-full border py-5 pl-14 pr-5 text-lg outline-none shadow-[0_14px_40px_rgba(23,63,42,0.08)]" style={{ background: '#FFFEFA', borderColor: '#C9D1CA' }} />
          {searchOpen && search.trim() && <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden border shadow-xl" style={{ background: '#FFFEFA', borderColor: '#D7DED7' }}>
            {suggestions.length ? suggestions.map((crop) => <button key={crop.crop} type="button" onClick={() => choose(crop)} className="flex w-full items-center justify-between border-b px-5 py-4 text-left last:border-b-0" style={{ borderColor: '#E6EAE6' }}><span><strong className="block text-base" style={{ color: '#1D241F' }}>{crop.crop}</strong><span className="mt-0.5 block text-xs" style={{ color: '#687069' }}>{crop.category}</span></span><span className="text-sm font-bold" style={{ color: '#173F2A' }}>{money(crop.common)} / quintal</span></button>) : <div className="px-5 py-4 text-sm" style={{ color: '#687069' }}>Crop not found.</div>}
          </div>}
        </div>
        {!hasSelectedCrop && <p className="mt-5 text-sm" style={{ color: '#879087' }}>Start typing, then choose your crop.</p>}
      </div>

      {hasSelectedCrop && <div id="signed-in-crop-analysis" className="mt-12 scroll-mt-28 border p-5 sm:p-7" style={{ background: '#EEE9DB', borderColor: 'rgba(29,36,31,0.13)' }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#3F6B45' }}>Price details</div><h3 className="mt-2 text-3xl font-bold" style={{ color: '#1D241F' }}>{selectedCrop.crop} price details</h3><p className="mt-2 text-base" style={{ color: '#687069' }}>Earlier prices, today’s price and expected prices.</p></div><select value={selectedCrop.crop} onChange={(event) => choose(crops.find((crop) => crop.crop === event.target.value) || crops[0])} className="border px-4 py-3 text-sm font-bold" style={{ background: '#FFFEFA', borderColor: '#BFC8BF' }}>{crops.map((crop) => <option key={crop.crop}>{crop.crop}</option>)}</select></div>

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="border p-5" style={{ background: '#FFFEFA', borderColor: '#DDE4DE' }}><div className="text-xs uppercase tracking-wider" style={{ color: '#687069' }}>Today’s price</div><div className="mt-2 text-3xl font-bold" style={{ color: '#173F2A' }}>{money(current)}</div><div className="mt-1 text-xs" style={{ color: '#687069' }}>{selectedCrop.demand} demand</div></div>
          <div className="border p-5" style={{ background: '#FFFEFA', borderColor: '#DDE4DE' }}><div className="text-xs uppercase tracking-wider" style={{ color: '#687069' }}>Past price change</div><div className="mt-2 text-3xl font-bold" style={{ color: pastChange >= 0 ? '#216644' : '#9F241B' }}>{pastChange >= 0 ? '+' : ''}{pastChange.toFixed(1)}%</div><div className="mt-1 text-xs" style={{ color: '#687069' }}>Change in the days shown</div></div>
          <div className="border p-5 text-white" style={{ background: '#173F2A', borderColor: '#173F2A' }}><div className="text-xs uppercase tracking-wider text-white/60">Expected change</div><div className="mt-2 text-3xl font-bold" style={{ color: '#E8D28F' }}>{nextChange >= 0 ? '+' : ''}{nextChange.toFixed(1)}%</div><div className="mt-1 text-xs text-white/60">Expected over 7 days</div></div>
        </div>

        <div className="mt-5"><PublicSignalChart points={chartPoints} /></div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="border p-6" style={{ background: '#FFFEFA', borderColor: '#DDE4DE' }}><div className="flex items-center justify-between gap-3"><div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#3F6B45' }}>Why the price may change</div>{loading && <span className="text-xs font-bold" style={{ color: '#687069' }}>Updating…</span>}</div><p className="mt-4 text-xl leading-relaxed" style={{ color: '#1D241F' }}>{summary}</p>{snapshot.factors.length > 0 && <div className="mt-5 grid gap-2 sm:grid-cols-2">{snapshot.factors.map((factor) => <div key={factor} className="border-l-2 px-3 py-2 text-sm" style={{ background: '#F7F3E8', borderColor: '#C18A32', color: '#52635A' }}>{factor}</div>)}</div>}{snapshot.festivalAdvice && <p className="mt-4 border-t pt-4 text-sm" style={{ borderColor: '#E2E6E1', color: '#52635A' }}><strong style={{ color: '#1D241F' }}>Coming demand:</strong> {snapshot.festivalAdvice}</p>}<div className="mt-5 grid grid-cols-2 gap-3 border-t pt-4 text-sm sm:grid-cols-4" style={{ borderColor: '#E2E6E1' }}><div><span className="text-xs" style={{ color: '#687069' }}>Past</span><strong className="mt-1 block">{money(pastStart)}</strong></div><div><span className="text-xs" style={{ color: '#687069' }}>Today</span><strong className="mt-1 block">{money(current)}</strong></div><div><span className="text-xs" style={{ color: '#687069' }}>After 7 days</span><strong className="mt-1 block">{money(next)}</strong></div><div><span className="text-xs" style={{ color: '#687069' }}>After 14 days</span><strong className="mt-1 block">{money(snapshot.predicted14d || next)}</strong></div></div>{snapshot.rangeLow && snapshot.rangeHigh && <p className="mt-4 text-xs" style={{ color: '#7A827B' }}>Possible price: {money(snapshot.rangeLow)}–{money(snapshot.rangeHigh)} per quintal. Final price depends on quality and demand.</p>}</div>
          <div className="border p-6 text-white" style={{ background: '#173F2A', borderColor: '#173F2A' }}><div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#C5A15A' }}>Prices nearby</div>{[['Pimpalgaon', 1.04], ['Lasalgaon', 1.01], ['Nashik', 0.98]].map(([name, factor]) => <div key={String(name)} className="flex justify-between border-b py-3 text-sm" style={{ borderColor: 'rgba(255,255,255,0.14)' }}><span className="text-white/70">{name}</span><strong>{money(current * Number(factor))} / quintal</strong></div>)}<p className="mt-4 text-xs leading-relaxed text-white/55">Estimated prices. Quality and market charges can change the final price.</p></div>
        </div>
      </div>}
    </section>
  )
}

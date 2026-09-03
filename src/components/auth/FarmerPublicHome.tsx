import { useEffect, useMemo, useState } from 'react'
import type { User } from '../../types'
import { api } from '../../services/api'
import { MARKET_CROPS, type CropMarketOverview } from '../farmer/MarketOverview'
import { PublicSignalChart } from './PublicSignalChart'
import { RoleAuthModal } from './RoleAuthModal'
import heroImage from '../../assets/kisansetu-hero.jpeg'
import storageImage from '../../assets/kisansetu-storage.jpg'
import buyerImage from '../../assets/kisansetu-buyer.jpg'
import { BrandLogo } from '../common/BrandLogo'

type AuthMode = 'login' | 'register'
type ChartPoint = { label: string; value: number; kind?: 'past' | 'future' }
type ForecastSnapshot = { currentPrice?: number; predicted7d?: number; predicted14d?: number; rangeLow?: number; rangeHigh?: number; factors: string[]; festivalAdvice?: string }

function money(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

function shortDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function simpleMarketText(text: string) {
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
  return simpleMarketText(text)
    .replace(/Shelf life of (\d+) days makes full wait safe/gi, 'Can stay fresh for $1 days')
    .replace(/Current Grade A premium is (₹[\d,]+) per quintal vs Grade C/gi, 'Grade A may earn $1 more per quintal')
    .replace(/(.+) demand approaching in (\d+) days/gi, '$1 may raise demand in $2 days')
}

function fallbackChart(crop: CropMarketOverview): ChartPoint[] {
  const historical = Array.from({ length: 11 }, (_, index) => {
    const movement = crop.direction === 'Rising' ? -0.12 + index * 0.012 : crop.direction === 'Falling' ? 0.09 - index * 0.009 : -0.025 + index * 0.0025
    return { label: `-${10 - index}d`, value: Math.round(crop.common * (1 + movement)), kind: 'past' as const }
  })
  const futureFactor = crop.direction === 'Rising' ? 0.008 : crop.direction === 'Falling' ? -0.006 : 0.002
  const future = Array.from({ length: 7 }, (_, index) => ({ label: `+${index + 1}d`, value: Math.round(crop.common * (1 + futureFactor * (index + 1))), kind: 'future' as const }))
  return [...historical, ...future]
}

export function FarmerPublicHome({ onBack, onBuyerHome, onLoginSuccess }: { onBack: () => void; onBuyerHome: () => void; onLoginSuccess: (user: User) => void }) {
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [hasSelectedCrop, setHasSelectedCrop] = useState(false)
  const [selectedCrop, setSelectedCrop] = useState<CropMarketOverview>(MARKET_CROPS[0])
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>(fallbackChart(MARKET_CROPS[0]))
  const [modelSummary, setModelSummary] = useState(MARKET_CROPS[0].conclusion)
  const [forecastSnapshot, setForecastSnapshot] = useState<ForecastSnapshot>({ factors: [] })
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)

  const crops = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return []
    return MARKET_CROPS.filter((crop) => crop.crop.toLowerCase().includes(query)).slice(0, 6)
  }, [search])

  useEffect(() => {
    if (!hasSelectedCrop) return
    let active = true
    setAnalysisLoading(true)
    setChartPoints(fallbackChart(selectedCrop))
    setModelSummary(selectedCrop.conclusion)
    setForecastSnapshot({ factors: [] })
    Promise.all([
      api.publicMarket.getPriceChart(selectedCrop.crop).catch(() => null),
      api.publicMarket.getForecast(selectedCrop.crop).catch(() => null),
    ]).then(([chart, forecast]) => {
      if (!active) return
      if (chart?.historical?.length) {
        const past: ChartPoint[] = chart.historical.slice(-12).map((point: any) => ({ label: shortDate(point.date), value: Number(point.modal_price), kind: 'past' }))
        const future: ChartPoint[] = (chart.forecast || []).slice(0, 8).map((point: any) => ({ label: shortDate(point.date), value: Number(point.modal_price), kind: 'future' }))
        if (past.length && future.length) setChartPoints([...past, ...future])
      }
      const result = forecast?.forecast || forecast
      setModelSummary(simpleMarketText(result?.recommendation_reason || forecast?.recommendation_summary || result?.summary || result?.reason || result?.why || selectedCrop.conclusion))
      setForecastSnapshot({
        currentPrice: Number(result?.current_price) || undefined,
        predicted7d: Number(result?.predicted_price_7d) || undefined,
        predicted14d: Number(result?.predicted_price_14d) || undefined,
        rangeLow: Number(result?.range_low) || undefined,
        rangeHigh: Number(result?.range_high) || undefined,
        factors: Array.isArray(forecast?.why_factors) ? forecast.why_factors.slice(0, 2).map(simpleFactor) : [],
        festivalAdvice: result?.festival_context?.advice || forecast?.festival_context?.advice || undefined,
      })
    }).finally(() => active && setAnalysisLoading(false))
    return () => { active = false }
  }, [selectedCrop, hasSelectedCrop])

  const pastStart = chartPoints.find((point) => point.kind !== 'future')?.value || selectedCrop.common
  const current = [...chartPoints].reverse().find((point) => point.kind !== 'future')?.value || selectedCrop.common
  const future = [...chartPoints].reverse().find((point) => point.kind === 'future')?.value || selectedCrop.common
  const pastChange = ((current - pastStart) / Math.max(1, pastStart)) * 100
  const displayCurrent = forecastSnapshot.currentPrice || current
  const displayFuture = forecastSnapshot.predicted7d || future
  const futureChange = ((displayFuture - displayCurrent) / Math.max(1, displayCurrent)) * 100

  function chooseCrop(crop: CropMarketOverview) {
    setSelectedCrop(crop)
    setSearch(crop.crop)
    setSearchOpen(false)
    setHasSelectedCrop(true)
    window.setTimeout(() => document.getElementById('public-crop-analysis')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  return (
    <div className="min-h-screen bg-[#F7F3E8] text-[#1D241F]">
      <header className="sticky top-0 z-40 border-b bg-[#F7F3E8]/95 backdrop-blur" style={{ borderColor: 'rgba(29,36,31,0.12)' }}>
        <div className="mx-auto flex h-[72px] w-[min(calc(100%-32px),1240px)] items-center justify-between gap-4">
          <button type="button" onClick={onBack} className="flex items-center gap-3 text-left"><BrandLogo className="text-[27px] sm:text-[30px]" /><span className="hidden text-[10px] font-bold uppercase tracking-[0.14em] text-[#3F6B45] lg:inline">Farmer market</span></button>
          <nav className="hidden items-center gap-6 text-xs font-bold md:flex"><a href="#public-market">Crop prices</a>{hasSelectedCrop && <a href="#public-crop-analysis">Price details</a>}<button type="button" onClick={onBuyerHome} className="text-[#52635A]">Buyer view</button></nav>
          <div className="flex gap-2"><button type="button" onClick={() => setAuthMode('login')} className="border px-4 py-2.5 text-xs font-bold" style={{ borderColor: '#173F2A', color: '#173F2A' }}>Farmer login</button><button type="button" onClick={() => setAuthMode('register')} className="hidden bg-[#173F2A] px-4 py-2.5 text-xs font-bold text-white sm:block">Create account</button></div>
        </div>
      </header>

      <section className="relative min-h-[620px] overflow-hidden text-white">
        <img src={heroImage} alt="Farmer reviewing crop conditions in a field" className="absolute inset-0 h-full w-full object-cover object-[62%_center]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,31,19,0.94)_0%,rgba(9,31,19,0.76)_42%,rgba(9,31,19,0.12)_82%)]" />
        <div className="relative mx-auto flex min-h-[620px] w-[min(calc(100%-32px),1240px)] items-end pb-20 pt-24">
          <div className="max-w-[760px]"><div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D8C487]">No login needed</div><h1 className="font-display mt-5 text-[52px] font-normal leading-[0.96] sm:text-[72px] lg:text-[90px]">See the market first.<br /><em className="text-[#E8E2CF]">Decide what comes next.</em></h1><p className="mt-6 max-w-[590px] text-base leading-7 text-white/80">Search a crop to see today’s price, earlier prices and expected prices. Log in only to check your own crop or sell it.</p><a href="#public-market" className="mt-8 inline-block bg-white px-6 py-3.5 text-xs font-bold text-[#173F2A]">Search crop prices</a></div>
        </div>
      </section>

      <section id="public-market" className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-[760px] text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#3F6B45]">Crop prices</div>
          <h2 className="font-display mt-3 text-[44px] font-normal leading-none sm:text-[60px]">Which crop do you<br /><em className="text-[#3F6B45]">want to check?</em></h2>
          <p className="mx-auto mt-4 max-w-[520px] text-sm leading-6 text-[#687069]">Choose a crop to see its price details.</p>

          <div className="relative mx-auto mt-8 max-w-[620px] text-left">
            <svg className="pointer-events-none absolute left-5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#687069]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            <input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setSearchOpen(true) }}
              onFocus={() => search.trim() && setSearchOpen(true)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && crops[0]) chooseCrop(crops[0])
                if (event.key === 'Escape') setSearchOpen(false)
              }}
              placeholder="Type a crop name"
              aria-label="Search crop"
              autoComplete="off"
              className="w-full border bg-[#FFFEFA] py-5 pl-14 pr-5 text-lg outline-none shadow-[0_14px_40px_rgba(23,63,42,0.08)] focus:border-[#3F6B45]"
              style={{ borderColor: '#C9D1CA' }}
            />
            {searchOpen && search.trim() && <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden border bg-[#FFFEFA] shadow-xl" style={{ borderColor: '#D7DED7' }}>
              {crops.length > 0 ? crops.map((crop) => <button key={crop.crop} type="button" onClick={() => chooseCrop(crop)} className="flex w-full items-center justify-between border-b px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-[#EDF4EC]" style={{ borderColor: '#E6EAE6' }}><span><strong className="block text-base text-[#1D241F]">{crop.crop}</strong><span className="mt-0.5 block text-xs text-[#687069]">{crop.category}</span></span><span className="text-sm font-bold text-[#173F2A]">{money(crop.common)} / quintal</span></button>) : <div className="px-5 py-4 text-sm text-[#687069]">Crop not found.</div>}
            </div>}
          </div>
          {!hasSelectedCrop && <p className="mt-5 text-xs text-[#879087]">Start typing, then choose your crop.</p>}
        </div>
      </section>

      {hasSelectedCrop && <section id="public-crop-analysis" className="scroll-mt-24 bg-[#EEE9DB] px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-[1120px]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#3F6B45]">Price details</div><h2 className="font-display mt-3 text-[44px] font-normal leading-none sm:text-[60px]">{selectedCrop.crop} price details</h2><p className="mt-3 max-w-2xl text-base leading-relaxed text-[#687069]">See earlier prices, today’s price and expected prices.</p></div><select value={selectedCrop.crop} onChange={(event) => chooseCrop(MARKET_CROPS.find((crop) => crop.crop === event.target.value) || MARKET_CROPS[0])} className="border bg-white px-4 py-3 text-sm font-bold" style={{ borderColor: '#BFC8BF' }}>{MARKET_CROPS.map((crop) => <option key={crop.crop}>{crop.crop}</option>)}</select></div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="border bg-[#FFFEFA] p-5"><div className="text-xs uppercase tracking-wider text-[#687069]">Today’s price</div><div className="mt-2 text-3xl font-bold text-[#173F2A]">{money(displayCurrent)}</div><div className="mt-1 text-xs text-[#687069]">{selectedCrop.demand} demand</div></div>
            <div className="border bg-[#FFFEFA] p-5"><div className="text-xs uppercase tracking-wider text-[#687069]">Past price change</div><div className="mt-2 text-3xl font-bold" style={{ color: pastChange >= 0 ? '#216644' : '#9F241B' }}>{pastChange >= 0 ? '+' : ''}{pastChange.toFixed(1)}%</div><div className="mt-1 text-xs text-[#687069]">Change in the days shown</div></div>
            <div className="border bg-[#173F2A] p-5 text-white"><div className="text-xs uppercase tracking-wider text-white/60">Expected change</div><div className="mt-2 text-3xl font-bold" style={{ color: '#E8D28F' }}>{futureChange >= 0 ? '+' : ''}{futureChange.toFixed(1)}%</div><div className="mt-1 text-xs text-white/60">Expected over 7 days</div></div>
          </div>

          <div className="mt-5"><PublicSignalChart points={chartPoints} /></div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="border bg-[#FFFEFA] p-6 sm:p-7"><div className="flex items-center justify-between gap-3"><div className="text-xs font-bold uppercase tracking-wider text-[#3F6B45]">Why the price may change</div>{analysisLoading && <span className="text-xs font-bold text-[#687069]">Updating…</span>}</div><p className="mt-4 text-xl leading-relaxed text-[#1D241F]">{modelSummary}</p>{forecastSnapshot.factors.length > 0 && <div className="mt-5 grid gap-2 sm:grid-cols-2">{forecastSnapshot.factors.map((factor) => <div key={factor} className="border-l-2 border-[#C18A32] bg-[#F7F3E8] px-3 py-2 text-sm leading-relaxed text-[#52635A]">{factor}</div>)}</div>}{forecastSnapshot.festivalAdvice && <p className="mt-4 border-t pt-4 text-sm leading-relaxed text-[#52635A]" style={{ borderColor: '#E2E6E1' }}><strong className="text-[#1D241F]">Coming demand:</strong> {forecastSnapshot.festivalAdvice}</p>}<div className="mt-5 grid grid-cols-2 gap-3 border-t pt-4 text-sm sm:grid-cols-4" style={{ borderColor: '#E2E6E1' }}><div><span className="text-xs text-[#687069]">Past</span><strong className="mt-1 block">{money(pastStart)}</strong></div><div><span className="text-xs text-[#687069]">Today</span><strong className="mt-1 block">{money(displayCurrent)}</strong></div><div><span className="text-xs text-[#687069]">After 7 days</span><strong className="mt-1 block">{money(displayFuture)}</strong></div><div><span className="text-xs text-[#687069]">After 14 days</span><strong className="mt-1 block">{money(forecastSnapshot.predicted14d || displayFuture)}</strong></div></div>{forecastSnapshot.rangeLow && forecastSnapshot.rangeHigh && <p className="mt-4 text-xs leading-relaxed text-[#7A827B]">Possible price: {money(forecastSnapshot.rangeLow)}–{money(forecastSnapshot.rangeHigh)} per quintal. Final price depends on quality and demand.</p>}</div>
            <div className="border bg-[#173F2A] p-6 text-white"><div className="text-xs font-bold uppercase tracking-wider text-[#C5A15A]">Prices nearby</div>{[['Pimpalgaon', 1.04], ['Lasalgaon', 1.01], ['Nashik', 0.98]].map(([name, factor]) => <div key={String(name)} className="flex justify-between border-b py-3 text-sm" style={{ borderColor: 'rgba(255,255,255,0.14)' }}><span className="text-white/70">{name}</span><strong>{money(selectedCrop.common * Number(factor))} / quintal</strong></div>)}<p className="mt-4 text-xs leading-relaxed text-white/55">These are estimated prices. Quality and market charges can change the final price.</p></div>
          </div>

          <div className="mt-6 grid gap-5 border bg-[#FFFEFA] p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8"><div><div className="text-xs font-bold uppercase tracking-wider text-[#3F6B45]">Check your own crop</div><h3 className="mt-2 text-2xl font-bold">Add your quantity and quality, then compare places to sell.</h3><p className="mt-2 text-sm leading-relaxed text-[#687069]">Log in only for this step.</p></div><div className="flex flex-col gap-2"><button type="button" onClick={() => setAuthMode('register')} className="bg-[#173F2A] px-5 py-3.5 text-sm font-bold text-white">Create account</button><button type="button" onClick={() => setAuthMode('login')} className="border px-5 py-3 text-sm font-bold text-[#173F2A]" style={{ borderColor: '#173F2A' }}>Farmer login</button></div></div>
        </div>
      </section>}

      <section className="px-4 py-20 sm:px-6"><div className="mx-auto grid max-w-[1120px] gap-4 lg:grid-cols-2"><article className="grid overflow-hidden bg-[#173F2A] text-white sm:grid-cols-2"><img src={storageImage} alt="Harvested produce in organised storage" className="h-full min-h-[260px] w-full object-cover" /><div className="p-7"><div className="text-xs font-bold uppercase tracking-wider text-[#C5A15A]">After harvest</div><h3 className="font-display mt-3 text-3xl">Know whether to sell, wait or use storage.</h3></div></article><article className="grid overflow-hidden bg-[#7A5C3E] text-white sm:grid-cols-2"><img src={buyerImage} alt="Farmer discussing produce with a buyer" className="h-full min-h-[260px] w-full object-cover" /><div className="p-7"><div className="text-xs font-bold uppercase tracking-wider text-[#E9D7AF]">When ready to sell</div><h3 className="font-display mt-3 text-3xl">Compare buyer demand and mandi routes.</h3></div></article></div></section>

      <footer className="bg-[#10291C] px-4 py-8 text-white"><div className="mx-auto flex max-w-[1240px] flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between"><div className="font-bold">माझे Kisan Farmer Market</div><div className="text-white/55">Prices may change with quality, supply and demand.</div></div></footer>

      {authMode && <RoleAuthModal role="farmer" initialMode={authMode} onClose={() => setAuthMode(null)} onLoginSuccess={onLoginSuccess} />}
    </div>
  )
}

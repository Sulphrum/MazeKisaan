import { useEffect, useMemo, useState } from 'react'
import type { User } from '../../types'
import { api } from '../../services/api'
import { MARKET_CROPS } from '../farmer/MarketOverview'
import { RoleAuthModal } from './RoleAuthModal'
import buyerImage from '../../assets/kisansetu-buyer.jpg'
import storageImage from '../../assets/kisansetu-storage.jpg'
import { BrandLogo } from '../common/BrandLogo'

type AuthMode = 'login' | 'register'

interface PublicSupply {
  crop: string
  availableQuantityQtl: number
  averageAskingPricePerQtl: number
  gradeASharePct: number
  originClusters: string[]
  nextReadyDate: string
  activeLots: number
}

interface PublicMandiPrice {
  crop: string
  modalPrice: number
  mandi: string
  lastUpdated?: string
}

const FALLBACK_SUPPLY: PublicSupply[] = [
  { crop: 'Tomato', availableQuantityQtl: 140, averageAskingPricePerQtl: 2580, gradeASharePct: 68, originClusters: ['Niphad', 'Pimpalgaon'], nextReadyDate: 'Available this week', activeLots: 6 },
  { crop: 'Onion', availableQuantityQtl: 310, averageAskingPricePerQtl: 2320, gradeASharePct: 54, originClusters: ['Lasalgaon', 'Niphad'], nextReadyDate: 'Available now', activeLots: 9 },
  { crop: 'Grapes', availableQuantityQtl: 95, averageAskingPricePerQtl: 6650, gradeASharePct: 81, originClusters: ['Dindori', 'Nashik'], nextReadyDate: 'Next 10 days', activeLots: 4 },
  { crop: 'Green Chilli', availableQuantityQtl: 72, averageAskingPricePerQtl: 3420, gradeASharePct: 62, originClusters: ['Nashik', 'Pimpalgaon'], nextReadyDate: 'Available this week', activeLots: 5 },
  { crop: 'Pomegranate', availableQuantityQtl: 60, averageAskingPricePerQtl: 9900, gradeASharePct: 76, originClusters: ['Niphad', 'Sinnar'], nextReadyDate: 'Next 14 days', activeLots: 3 },
  { crop: 'Pigeon Pea', availableQuantityQtl: 180, averageAskingPricePerQtl: 7050, gradeASharePct: 58, originClusters: ['Yeola', 'Nandgaon'], nextReadyDate: 'Next 20 days', activeLots: 7 },
]

function money(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

function fallbackMandiPrice(crop: string): PublicMandiPrice {
  const item = MARKET_CROPS.find((candidate) => candidate.crop === crop)
  return {
    crop,
    modalPrice: item?.common || 0,
    mandi: crop === 'Onion' ? 'Lasalgaon Mandi' : 'Nearby APMC market',
  }
}

export function BuyerPublicHome({
  onBack,
  onFarmerHome,
  onLoginSuccess,
}: {
  onBack: () => void
  onFarmerHome: () => void
  onLoginSuccess: (user: User) => void
}) {
  const [supply, setSupply] = useState<PublicSupply[]>(FALLBACK_SUPPLY)
  const [mandiPrices, setMandiPrices] = useState<PublicMandiPrice[]>([])
  const [selectedCrop, setSelectedCrop] = useState(FALLBACK_SUPPLY[0].crop)
  const [search, setSearch] = useState('')
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)

  useEffect(() => {
    api.publicMarket.getSupply().then((result) => {
      if (!result?.supply?.length) return
      const merged = [...result.supply]
      for (const fallback of FALLBACK_SUPPLY) {
        if (!merged.some((item: PublicSupply) => item.crop === fallback.crop)) merged.push(fallback)
      }
      setSupply(merged)
    }).catch(() => undefined)

    api.publicMarket.getPrices().then((result) => {
      if (Array.isArray(result?.prices)) setMandiPrices(result.prices)
    }).catch(() => undefined)
  }, [])

  const visibleSupply = useMemo(
    () => supply.filter((item) => item.crop.toLowerCase().includes(search.trim().toLowerCase())),
    [search, supply],
  )
  const selected = supply.find((item) => item.crop === selectedCrop) || supply[0]
  const mandi = mandiPrices.find((item) => item.crop.toLowerCase() === selected.crop.toLowerCase())
    || fallbackMandiPrice(selected.crop)
  const difference = mandi.modalPrice - selected.averageAskingPricePerQtl
  const directIsLower = difference > 0

  function selectCrop(crop: string) {
    setSelectedCrop(crop)
    window.setTimeout(() => {
      document.getElementById('buyer-price-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  return (
    <div className="min-h-screen bg-[#F5F2E9] text-[#1D241F]">
      <header className="sticky top-0 z-40 border-b bg-[#F5F2E9]/95 backdrop-blur" style={{ borderColor: 'rgba(29,36,31,0.12)' }}>
        <div className="mx-auto flex h-[72px] w-[min(calc(100%-32px),1240px)] items-center justify-between gap-4">
          <button type="button" onClick={onBack} className="flex items-center gap-3 text-left">
            <BrandLogo className="text-[27px] sm:text-[30px]" />
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A5C3E] lg:inline">Buyer market</span>
          </button>
          <nav className="hidden items-center gap-6 text-xs font-bold md:flex">
            <a href="#farmer-offers">Farmer prices</a>
            <a href="#buyer-price-details">Price comparison</a>
            <button type="button" onClick={onFarmerHome} className="text-[#52635A]">Farmer view</button>
          </nav>
          <div className="flex gap-2">
            <button type="button" onClick={() => setAuthMode('login')} className="border px-4 py-2.5 text-xs font-bold" style={{ borderColor: '#173F2A', color: '#173F2A' }}>Buyer login</button>
            <button type="button" onClick={() => setAuthMode('register')} className="hidden bg-[#173F2A] px-4 py-2.5 text-xs font-bold text-white sm:block">Create account</button>
          </div>
        </div>
      </header>

      <section className="relative min-h-[590px] overflow-hidden text-white">
        <img src={buyerImage} alt="Produce buyer inspecting a farmer's sorted harvest" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,28,21,0.95)_0%,rgba(16,28,21,0.8)_46%,rgba(16,28,21,0.18)_86%)]" />
        <div className="relative mx-auto flex min-h-[590px] w-[min(calc(100%-32px),1240px)] items-end pb-20 pt-24">
          <div className="max-w-[760px]">
            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#E5C98B]">Direct crop sourcing</div>
            <h1 className="font-display mt-5 text-[52px] font-normal leading-[0.96] sm:text-[72px] lg:text-[88px]">
              Compare farmer prices.<br />
              <em className="text-[#E8E2CF]">Then buy directly.</em>
            </h1>
            <p className="mt-6 max-w-[610px] text-base leading-7 text-white/80">
              See approximate crop prices offered by farmers and compare them with nearby mandi rates. No login is needed to check prices.
            </p>
            <a href="#farmer-offers" className="mt-8 inline-block bg-white px-6 py-3.5 text-xs font-bold text-[#173F2A]">See farmer prices</a>
          </div>
        </div>
      </section>

      <section id="farmer-offers" className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-[1240px]">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7A5C3E]">Prices offered by farmers</div>
              <h2 className="font-display mt-3 text-[44px] font-normal leading-none sm:text-[60px]">
                Find the crop<br />
                <em className="text-[#7A5C3E]">you want to buy.</em>
              </h2>
            </div>
            <label>
              <span className="text-xs font-bold uppercase tracking-wider text-[#52635A]">Search crop</span>
              <div className="relative mt-2">
                <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#687069]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search onion, tomato, grapes..." className="w-full border bg-[#FFFEFA] py-4 pl-12 pr-4 text-base outline-none" style={{ borderColor: '#C9D1CA' }} />
              </div>
            </label>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleSupply.map((item) => {
              const cropMandi = mandiPrices.find((price) => price.crop.toLowerCase() === item.crop.toLowerCase())
                || fallbackMandiPrice(item.crop)
              return (
                <button key={item.crop} type="button" onClick={() => selectCrop(item.crop)} className="border bg-[#FFFEFA] p-5 text-left transition-transform hover:-translate-y-0.5" style={{ borderColor: selected.crop === item.crop ? '#7A5C3E' : 'rgba(29,36,31,0.13)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A5C3E]">Farmer offer</div>
                      <h3 className="mt-1 text-xl font-bold">{item.crop}</h3>
                    </div>
                    <span className="bg-[#EEE9DB] px-2.5 py-1 text-[10px] font-bold text-[#735A27]">{item.activeLots} lots</span>
                  </div>
                  <div className="mt-5 text-3xl font-bold text-[#173F2A]">{money(item.averageAskingPricePerQtl)}<span className="ml-1 text-xs font-medium text-[#687069]">/Qtl approx.</span></div>
                  <div className="mt-4 grid grid-cols-2 border-y py-3 text-xs" style={{ borderColor: '#E2E6E1' }}>
                    <div><span className="text-[#687069]">Nearby mandi</span><strong className="mt-1 block">{money(cropMandi.modalPrice)}</strong></div>
                    <div className="border-l pl-3" style={{ borderColor: '#E2E6E1' }}><span className="text-[#687069]">Available</span><strong className="mt-1 block">{item.availableQuantityQtl} Qtl</strong></div>
                  </div>
                  <div className="mt-3 text-xs text-[#52635A]">{item.originClusters.slice(0, 2).join(', ')} · {item.gradeASharePct}% Grade A</div>
                </button>
              )
            })}
          </div>
          {visibleSupply.length === 0 && <div className="mt-8 border border-dashed p-8 text-center text-sm text-[#687069]">No farmer offer matches this crop name.</div>}
          <p className="mt-4 text-xs leading-relaxed text-[#7A827B]">Farmer prices are approximate averages. Exact lot price, farmer identity and contact details become available after buyer login.</p>
        </div>
      </section>

      <section id="buyer-price-details" className="scroll-mt-24 bg-[#EEE9DB] px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-[1120px]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7A5C3E]">Simple price comparison</div>
              <h2 className="font-display mt-3 text-[44px] font-normal leading-none sm:text-[60px]">{selected.crop} prices today</h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#687069]">Compare the approximate direct offer with a nearby mandi rate before you decide to continue.</p>
            </div>
            <select value={selected.crop} onChange={(event) => setSelectedCrop(event.target.value)} className="border bg-white px-4 py-3 text-sm font-bold" style={{ borderColor: '#BFC8BF' }}>
              {supply.map((item) => <option key={item.crop}>{item.crop}</option>)}
            </select>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="border bg-[#173F2A] p-6 text-white sm:p-8">
              <div className="text-xs font-bold uppercase tracking-wider text-[#C5D8C8]">Approximate farmer price</div>
              <div className="mt-4 text-4xl font-bold text-[#F2D79D]">{money(selected.averageAskingPricePerQtl)}<span className="ml-1 text-sm font-medium text-white/60">/Qtl</span></div>
              <p className="mt-4 text-sm leading-relaxed text-white/70">Average of {selected.activeLots} available farmer lots around {selected.originClusters.slice(0, 2).join(' and ')}.</p>
            </article>
            <article className="border bg-[#FFFEFA] p-6 sm:p-8" style={{ borderColor: '#D7D4C8' }}>
              <div className="text-xs font-bold uppercase tracking-wider text-[#7A5C3E]">Nearby mandi rate</div>
              <div className="mt-4 text-4xl font-bold">{money(mandi.modalPrice)}<span className="ml-1 text-sm font-medium text-[#687069]">/Qtl</span></div>
              <p className="mt-4 text-sm leading-relaxed text-[#687069]">{mandi.mandi}. Actual amount may change with grade, fees and transport.</p>
            </article>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="border bg-[#FFFEFA] p-6 sm:p-7" style={{ borderColor: '#D7D4C8' }}>
              <div className="text-xs font-bold uppercase tracking-wider text-[#7A5C3E]">What this means</div>
              <p className="mt-3 text-xl leading-relaxed">
                {directIsLower
                  ? `The direct farmer price is about ${money(difference)} lower per quintal than this mandi rate.`
                  : difference < 0
                    ? `The direct farmer price is about ${money(Math.abs(difference))} higher per quintal. Check grade and delivery terms before deciding.`
                    : 'The direct farmer price and nearby mandi rate are currently close.'}
              </p>
            </article>
            <article className="border bg-[#FFFEFA] p-6" style={{ borderColor: '#D7D4C8' }}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-xs text-[#687069]">Available now</span><strong className="mt-1 block text-lg">{selected.availableQuantityQtl} Qtl</strong></div>
                <div><span className="text-xs text-[#687069]">Grade A share</span><strong className="mt-1 block text-lg">{selected.gradeASharePct}%</strong></div>
                <div className="col-span-2 border-t pt-3" style={{ borderColor: '#E2E6E1' }}><span className="text-xs text-[#687069]">Crop readiness</span><strong className="mt-1 block">{selected.nextReadyDate}</strong></div>
              </div>
            </article>
          </div>

          <div className="mt-6 grid gap-5 bg-[#173F2A] p-6 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#C5A15A]">Continue only when ready</div>
              <h3 className="mt-2 text-2xl font-bold">See farmer requests or publish what you need.</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">Log in to review farmer crop details, approve offers and raise a crop demand.</p>
            </div>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => setAuthMode('register')} className="bg-[#C5A15A] px-5 py-3.5 text-sm font-bold text-[#173F2A]">Create buyer account</button>
              <button type="button" onClick={() => setAuthMode('login')} className="border border-white/50 px-5 py-3 text-sm font-bold">Buyer login</button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-[1120px] items-center gap-10 lg:grid-cols-2">
          <img src={storageImage} alt="Produce prepared in organised storage crates" className="h-[390px] w-full object-cover" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7A5C3E]">A clear buyer journey</div>
            <h2 className="font-display mt-4 text-[46px] leading-none">Compare first.<br /><em className="text-[#7A5C3E]">Trade after login.</em></h2>
            <div className="mt-7 space-y-5">
              {[
                ['01', 'Before login', 'Check approximate farmer prices and nearby mandi rates.'],
                ['02', 'After login', 'See crop photos, grade, quantity and farmer sale requests.'],
                ['03', 'Start buying', 'Approve a farmer offer or publish your own crop demand.'],
              ].map(([number, title, text]) => (
                <div key={number} className="grid grid-cols-[36px_1fr] gap-3 border-t pt-4" style={{ borderColor: '#D7D4C8' }}>
                  <span className="text-xs font-bold text-[#7A5C3E]">{number}</span>
                  <div><strong className="text-sm">{title}</strong><p className="mt-1 text-sm leading-relaxed text-[#687069]">{text}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#10291C] px-4 py-8 text-white">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
          <BrandLogo tone="light" className="text-[24px]" />
          <div className="text-white/55">Public prices are approximate. Farmer identity and trade actions require login.</div>
        </div>
      </footer>

      {authMode && <RoleAuthModal role="buyer" initialMode={authMode} onClose={() => setAuthMode(null)} onLoginSuccess={onLoginSuccess} />}
    </div>
  )
}

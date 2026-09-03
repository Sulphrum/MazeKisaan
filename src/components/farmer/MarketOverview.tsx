import { useEffect, useState } from 'react'
import type { User } from '../../types'
import { api } from '../../services/api'
import { CropMarketExplorer } from './CropMarketExplorer'
import { MarketUpdates } from './MarketUpdates'
import { MlMarketOutlook } from './MlMarketOutlook'

type MarketDirection = 'Rising' | 'Stable' | 'Falling'
type DemandLevel = 'High' | 'Normal' | 'Limited'

export interface CropMarketOverview {
  crop: string
  category: string
  min: number
  max: number
  common: number
  direction: MarketDirection
  demand: DemandLevel
  conclusion: string
}

export const MARKET_CROPS: CropMarketOverview[] = [
  { crop: 'Tomato', category: 'Vegetables', min: 2200, max: 2800, common: 2580, direction: 'Rising', demand: 'High', conclusion: 'Prices are strong because fewer tomatoes are arriving while buyer demand remains high.' },
  { crop: 'Onion', category: 'Vegetables', min: 1800, max: 2600, common: 2250, direction: 'Stable', demand: 'Normal', conclusion: 'Prices are steady because stored onion continues to reach nearby markets.' },
  { crop: 'Potato', category: 'Vegetables', min: 1600, max: 2200, common: 1950, direction: 'Falling', demand: 'Normal', conclusion: 'Prices are slightly softer because today’s arrivals are higher than usual.' },
  { crop: 'Brinjal', category: 'Vegetables', min: 1500, max: 2400, common: 1950, direction: 'Rising', demand: 'High', conclusion: 'Fresh, evenly sized produce is receiving better offers this morning.' },
  { crop: 'Green Chilli', category: 'Vegetables', min: 3000, max: 3800, common: 3350, direction: 'Rising', demand: 'High', conclusion: 'Restaurant and wholesale demand is supporting higher prices this week.' },
  { crop: 'Cabbage', category: 'Vegetables', min: 800, max: 1300, common: 1080, direction: 'Stable', demand: 'Normal', conclusion: 'Supply and demand are balanced, so large price changes are not expected today.' },
  { crop: 'Grapes', category: 'Fruits', min: 5800, max: 7200, common: 6500, direction: 'Rising', demand: 'High', conclusion: 'Better-quality fruit is seeing stronger demand from exporters and city buyers.' },
  { crop: 'Banana', category: 'Fruits', min: 1300, max: 1800, common: 1550, direction: 'Stable', demand: 'Normal', conclusion: 'Prices are steady, with regular demand from retailers and local wholesalers.' },
  { crop: 'Pomegranate', category: 'Fruits', min: 8500, max: 11200, common: 9800, direction: 'Rising', demand: 'High', conclusion: 'Large, clean fruit is receiving better offers because premium supply is limited.' },
  { crop: 'Wheat', category: 'Grains', min: 2100, max: 2400, common: 2250, direction: 'Stable', demand: 'Normal', conclusion: 'Trading is steady and there is no major supply shortage in nearby markets.' },
  { crop: 'Maize', category: 'Grains', min: 1900, max: 2250, common: 2080, direction: 'Rising', demand: 'Normal', conclusion: 'Feed buyers are purchasing regularly, giving prices mild support.' },
  { crop: 'Chickpea', category: 'Pulses', min: 5200, max: 5900, common: 5550, direction: 'Stable', demand: 'Normal', conclusion: 'Prices are holding steady as available supply is meeting current demand.' },
  { crop: 'Pigeon Pea', category: 'Pulses', min: 6800, max: 7400, common: 7100, direction: 'Rising', demand: 'High', conclusion: 'Mills are buying actively while good-quality arrivals remain limited.' },
  { crop: 'Soybean', category: 'Oilseeds', min: 4100, max: 4700, common: 4380, direction: 'Falling', demand: 'Limited', conclusion: 'Prices are under pressure because crushing demand is currently slower.' },
  { crop: 'Groundnut', category: 'Oilseeds', min: 5400, max: 6200, common: 5800, direction: 'Stable', demand: 'Normal', conclusion: 'The market is balanced, with quality having a larger effect than daily movement.' },
  { crop: 'Cotton', category: 'Cash Crops', min: 6800, max: 7450, common: 7120, direction: 'Rising', demand: 'High', conclusion: 'Cleaner cotton with lower moisture is receiving stronger mill interest.' },
  { crop: 'Turmeric', category: 'Spices', min: 11800, max: 13500, common: 12600, direction: 'Rising', demand: 'High', conclusion: 'Good colour and low-moisture lots are attracting stronger offers.' },
]

const MARKET_LOCATIONS = ['Niphad, Nashik', 'Nashik City, Nashik', 'Lasalgaon, Nashik', 'Pimpalgaon Baswant, Nashik']

export function MarketOverview({ user, onCheckCropValue }: { user: User; onCheckCropValue: () => void }) {
  const marketLocation = MARKET_LOCATIONS.includes(user.location) ? user.location : MARKET_LOCATIONS[0]
  const [selectedCropName, setSelectedCropName] = useState('Tomato')
  const [marketCropSelected, setMarketCropSelected] = useState(false)
  const [marketCrops, setMarketCrops] = useState(MARKET_CROPS)

  useEffect(() => {
    let active = true
    api.mandi.getPriceFeed().then((feed) => {
      if (!active || !feed.isLive || !feed.prices.length) return
      const latestByCrop = new Map(feed.prices.map((price) => [price.crop, price]))
      setMarketCrops((current) => {
        const known = new Set(current.map((crop) => crop.crop))
        const updated = current.map((crop) => {
          const live = latestByCrop.get(crop.crop)
          if (!live) return crop
          return {
            ...crop,
            min: live.minPrice,
            max: live.maxPrice,
            common: live.modalPrice,
            direction: live.trend === 'up' ? 'Rising' as const : live.trend === 'down' ? 'Falling' as const : 'Stable' as const,
            conclusion: `Latest reported price from ${live.mandi}. Quality and market charges can change the final amount.`,
          }
        })
        const added = feed.prices.filter((price) => !known.has(price.crop)).map((price) => ({
          crop: price.crop,
          category: 'Vegetables',
          min: price.minPrice,
          max: price.maxPrice,
          common: price.modalPrice,
          direction: price.trend === 'up' ? 'Rising' as const : price.trend === 'down' ? 'Falling' as const : 'Stable' as const,
          demand: 'Normal' as const,
          conclusion: `Latest reported price from ${price.mandi}. Quality and market charges can change the final amount.`,
        }))
        return [...updated, ...added]
      })
    }).catch(() => undefined)
    return () => { active = false }
  }, [])

  const selectedCrop = marketCrops.find((item) => item.crop === selectedCropName) || marketCrops[0]

  return (
    <div className="market-overview space-y-10">
      <header className="market-page-heading">
        <div className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#3F6B45' }}>Local market report</div>
        <h2 className="mt-2 text-4xl font-bold" style={{ color: '#1D241F' }}>Understand today&apos;s market before you sell.</h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed" style={{ color: '#687069' }}>Simple local prices and explanations for crops traded around Nashik. No crop details are required to explore the market.</p>
      </header>

      <CropMarketExplorer
        crops={marketCrops}
        selectedCropName={selectedCrop.crop}
        hasSelectedCrop={marketCropSelected}
        locationLabel={marketLocation.split(',')[0]}
        onSelect={(cropName) => {
          setSelectedCropName(cropName)
          setMarketCropSelected(true)
        }}
      />

      {marketCropSelected && <MlMarketOutlook crop={selectedCrop} />}

      {marketCropSelected && <section className="border p-6 sm:p-8" style={{ background: '#173F2A', borderColor: '#173F2A' }}>
        <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#C5A15A' }}>Personal crop estimate</div>
            <h3 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Check what your crop could earn.</h3>
            <p className="mt-3 max-w-2xl text-base leading-relaxed" style={{ color: '#D6E3DA' }}>Enter a few crop, quality and cost details to see today’s fair value, expected profit, price potential and demand outlook.</p>
          </div>
          <button onClick={onCheckCropValue} className="px-5 py-3.5 text-base font-bold" style={{ background: '#C5A15A', color: '#173F2A' }}>See value and selling options</button>
        </div>
      </section>}

      <MarketUpdates />
    </div>
  )
}

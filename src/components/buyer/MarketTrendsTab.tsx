import { useState, useEffect } from 'react'
import { MarketPriceItem, ProcurementDemand } from '../../types'
import { api } from '../../services/api'

export function MarketTrendsTab({
  demands,
  onOpenPostDemand,
}: {
  demands: ProcurementDemand[]
  onOpenPostDemand: () => void
}) {
  const [selectedMandi, setSelectedMandi] = useState('pune')
  const [marketPrices, setMarketPrices] = useState<MarketPriceItem[]>([])
  const [forecast, setForecast] = useState<any>(null)

  useEffect(() => {
    api.mandi.getPrices().then(setMarketPrices).catch(() => setMarketPrices([]))
    api.mandi.getForecast('Tomato').then(setForecast).catch(() => setForecast(null))
  }, [])

  return (
    <div className="space-y-6">
      {/* Header & Post Demand CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#17221D]">
            Procurement Demands &amp; Mandi Analytics
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Broadcast requirements to farmers and monitor wholesale arrival price trends.
          </p>
        </div>

        <button
          onClick={onOpenPostDemand}
          className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: '#063B2A' }}
        >
          <span>+</span>
          <span>Post Buy Requirement / RFQ</span>
        </button>
      </div>

      {/* Active Demands Posted by Buyer */}
      <div className="bg-white rounded-3xl border shadow-sm p-5 space-y-4" style={{ borderColor: '#E2EBE5' }}>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-sm text-[#17221D]">Your Active Broadcast Demands (RFQs)</h3>
            <p className="text-xs text-gray-500">Live requirements visible to 1,200+ registered farmers</p>
          </div>
          <span className="text-xs font-bold text-[#063B2A] bg-[#EAF5EE] px-2.5 py-1 rounded-full">
            {demands.length} Active Demands
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {demands.map((dem) => (
            <div
              key={dem.id}
              className="p-4 rounded-2xl bg-[#F7F6F1] border border-gray-200/80 space-y-2.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-2xl">{dem.cropName === 'Tomato' ? '🍅' : dem.cropName === 'Onion' ? '🧅' : '🥔'}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF5EE] text-[#238B5B]">
                    {dem.responsesCount} Farmer Bids Received
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#17221D] mt-1">{dem.cropName}</h4>
                <p className="text-[11px] text-gray-500">{dem.variety}</p>

                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quantity Needed:</span>
                    <span className="font-bold text-[#063B2A]">{dem.quantityQtlNeeded} Qtl</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Target Budget:</span>
                    <span className="font-semibold text-gray-800">{dem.targetPricePerQtl}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Required By:</span>
                    <span className="font-medium text-gray-600">{dem.requiredByDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hub:</span>
                    <span className="font-medium text-gray-600 truncate max-w-[120px]">{dem.deliveryLocation}</span>
                  </div>
                </div>
              </div>

              <button className="w-full py-2 rounded-xl text-xs font-bold border border-[#063B2A] text-[#063B2A] bg-white hover:bg-[#EAF5EE] transition-colors">
                View Farmer Responses ({dem.responsesCount}) →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Mandi Arrival Price Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-3xl border shadow-sm p-5 space-y-3" style={{ borderColor: '#E2EBE5' }}>
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-sm text-[#17221D]">Wholesale Mandi Arrivals &amp; Modal Rates</h3>
              <p className="text-xs text-gray-500">Benchmark wholesale prices vs farmgate procurement margins</p>
            </div>
            <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
              🟢 Backend Data
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium">Commodity</th>
                  <th className="pb-2 font-medium">Mandi Hub</th>
                  <th className="pb-2 font-medium">Modal Price</th>
                  <th className="pb-2 font-medium">Procurement Margin</th>
                  <th className="pb-2 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {marketPrices.map((mp) => (
                  <tr key={mp.id} className="hover:bg-gray-50">
                    <td className="py-2.5 font-bold text-[#17221D]">{mp.crop}</td>
                    <td className="py-2.5 text-gray-500">{mp.mandi}</td>
                    <td className="py-2.5 font-extrabold text-[#063B2A]">₹{mp.modalPrice} / Qtl</td>
                    <td className="py-2.5 font-semibold text-[#238B5B]">+8.5% Net Margin</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {mp.trend === 'up' ? '▲ ' : '▼ '} {mp.trendPct}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Forecast Card */}
        <div className="bg-white rounded-3xl border shadow-sm p-5 flex flex-col justify-between" style={{ borderColor: '#E2EBE5' }}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📈</span>
              <div>
                <h3 className="font-bold text-xs text-[#063B2A]">14-Day Price Forecast</h3>
                <p className="text-[10px] text-gray-400">Institutional Advisory</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 bg-[#EAF5EE] p-3 rounded-2xl border border-[#C4DFD0] my-3 leading-relaxed">
              <strong>{forecast?.crop || 'Tomato'}</strong> — {forecast?.summary || 'Use the latest backend price forecast to plan procurement.'}
            </p>
            <div className="text-[11px] text-gray-500 space-y-1">
              <div>🎯 <strong>Expected:</strong> {forecast?.expectedPrice ? `₹${forecast.expectedPrice.toLocaleString('en-IN')}/Qtl` : 'Calculating…'}</div>
              <div>🎯 <strong>Trend:</strong> {forecast?.trend || '—'}</div>
            </div>
          </div>

          <button
            onClick={onOpenPostDemand}
            className="w-full mt-4 py-2.5 rounded-xl font-bold text-xs text-white shadow"
            style={{ background: '#063B2A' }}
          >
            Post Bulk RFQ Now →
          </button>
        </div>
      </div>
    </div>
  )
}

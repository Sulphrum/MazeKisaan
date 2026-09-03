import { useState } from 'react'
import { MarketplaceListing } from '../../types'

export function MarketplaceTab({
  listings,
  onOpenOrderModal,
  onOpenNegotiateModal,
  onOpenQualityReport,
}: {
  listings: MarketplaceListing[]
  onOpenOrderModal: (listing: MarketplaceListing) => void
  onOpenNegotiateModal: (listing: MarketplaceListing) => void
  onOpenQualityReport: (listing: MarketplaceListing) => void
}) {
  const [selectedCrop, setSelectedCrop] = useState<string>('all')
  const [selectedGrade, setSelectedGrade] = useState<string>('all')
  const [maxDistance, setMaxDistance] = useState<number>(100)

  const crops = ['All', 'Tomato', 'Onion', 'Brinjal', 'Grapes', 'Potato']

  const filtered = listings.filter((item) => {
    if (selectedCrop !== 'all' && item.crop.toLowerCase() !== selectedCrop.toLowerCase()) return false
    if (selectedGrade !== 'all' && item.qualityGrade !== selectedGrade) return false
    if (item.distanceKm > maxDistance) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#17221D]">
            Direct Farm Sourcing Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Procure directly from KYC-verified farmers with AI-certified quality assays and 100% escrow safety.
          </p>
        </div>

        {/* Proximity Slider */}
        <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-2xl border text-xs" style={{ borderColor: '#E2EBE5' }}>
          <span className="text-gray-500 font-medium">📍 Farm Radius:</span>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={maxDistance}
            onChange={(e) => setMaxDistance(parseInt(e.target.value))}
            className="w-24 accent-[#063B2A]"
          />
          <span className="font-bold text-[#063B2A]">{maxDistance} km</span>
        </div>
      </div>

      {/* Crop Filter Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-center gap-1.5">
          {crops.map((c) => {
            const isSel = selectedCrop.toLowerCase() === c.toLowerCase()
            return (
              <button
                key={c}
                onClick={() => setSelectedCrop(c.toLowerCase())}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isSel
                    ? 'bg-[#063B2A] text-white border-[#063B2A] shadow-sm'
                    : 'bg-white text-gray-600 border-[#E2EBE5] hover:bg-gray-50'
                }`}
              >
                {c === 'All' ? '🌱 All Crops' : c === 'Tomato' ? '🍅 Tomato' : c === 'Onion' ? '🧅 Onion' : c === 'Brinjal' ? '🍆 Brinjal' : c === 'Grapes' ? '🍇 Grapes' : '🥔 Potato'}
              </button>
            )
          })}
        </div>

        {/* Grade Filter */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-gray-400 font-medium hidden sm:inline">Grade:</span>
          {['all', 'Grade A', 'Grade B'].map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGrade(g)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                selectedGrade === g
                  ? 'bg-[#EAF5EE] text-[#063B2A] border-[#063B2A]'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {g === 'all' ? 'All Grades' : g}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:shadow-md"
              style={{ borderColor: '#E2EBE5' }}
            >
              {/* Photo & Tag overlay */}
              <div className="relative h-44 overflow-hidden bg-gray-100">
                <img
                  src={item.image}
                  alt={item.crop}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#063B2A]/90 text-white backdrop-blur-sm">
                    {item.qualityGrade}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F4C44E] text-[#063B2A]">
                    {item.aiQualityScore}% AI Score
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-gray-800 backdrop-blur-sm">
                    📍 {item.distanceKm} km
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="font-extrabold text-lg leading-tight">
                    {item.crop} — {item.variety}
                  </div>
                  <div className="text-xs text-white/80 mt-0.5 flex items-center justify-between">
                    <span>Available: <strong className="text-[#F4C44E]">{item.quantityQtl} Quintals</strong></span>
                    <span>Ready: {item.harvestReadyDate}</span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                {/* Farmer Info */}
                <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#EAF5EE] text-[#063B2A] font-bold flex items-center justify-center text-[10px]">
                      {item.farmerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 flex items-center gap-1">
                        {item.farmerName}
                        {item.verifiedFarmer && <span className="text-[#238B5B]" title="Verified KYC">🛡️</span>}
                      </div>
                      <div className="text-[10px] text-gray-400">{item.location}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400">Rating</div>
                    <div className="font-bold text-amber-600 text-xs">⭐ {item.farmerRating}</div>
                  </div>
                </div>

                {/* Pricing & Assay Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#EAF5EE] border border-[#C4DFD0]">
                    <div className="text-[10px] text-gray-500">Asking Price</div>
                    <div className="text-base font-extrabold text-[#063B2A]">
                      ₹{item.askingPricePerQtl.toLocaleString('en-IN')}
                      <span className="text-[10px] font-normal text-gray-500">/Qtl</span>
                    </div>
                    <div className="text-[9px] text-[#238B5B] font-semibold mt-0.5">
                      Mandi: ₹{item.mandiBenchmarkPrice}/Qtl
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#F7F6F1] border border-gray-200">
                    <div className="text-[10px] text-gray-500">Lab Telemetry</div>
                    <div className="text-xs font-semibold text-gray-800">
                      Moisture: {item.moisturePct}%
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Defects: {item.defectsPct}% (Within Grade A)
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-1 flex gap-2">
                  <button
                    onClick={() => onOpenOrderModal(item)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: '#063B2A' }}
                  >
                    ⚡ Instant Procurement
                  </button>
                  <button
                    onClick={() => onOpenNegotiateModal(item)}
                    className="px-3 py-2.5 rounded-xl text-xs font-bold border border-[#063B2A] text-[#063B2A] hover:bg-[#EAF5EE] transition-colors"
                    title="Send Counter Offer"
                  >
                    💬 Counter
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

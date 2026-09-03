import { useState, useEffect } from 'react'
import { MarketplaceListing, TransportOption, User } from '../../types'
import { api } from '../../services/api'

export function BuyerOrderModal({
  listing,
  buyerUser,
  isOpen,
  onClose,
  onConfirmOrder,
}: {
  listing: MarketplaceListing | null
  buyerUser: User
  isOpen: boolean
  onClose: () => void
  onConfirmOrder: (order: any) => void
}) {
  const [quantity, setQuantity] = useState<number>(listing ? listing.quantityQtl : 50)
  const [selectedTransportId, setSelectedTransportId] = useState('tata')
  const [transportOptions, setTransportOptions] = useState<TransportOption[]>([])

  useEffect(() => {
    if (!isOpen) return
    api.logistics.getTransport().then(setTransportOptions).catch(() => setTransportOptions([]))
  }, [isOpen])

  if (!isOpen || !listing) return null

  const transport = transportOptions.find((t) => t.id === selectedTransportId) || transportOptions[0]
  const produceAmount = quantity * listing.askingPricePerQtl
  const transportCost = transport ? transport.costNumeric * (quantity > 30 ? 2 : 1) : 0
  const platformFee = Math.round(produceAmount * 0.01) // 1% escrow fee
  const totalEscrowAmount = produceAmount + transportCost + platformFee

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newOrder = {
      id: `KS-${Math.floor(8000 + Math.random() * 1000)}`,
      cropName: listing.crop,
      variety: listing.variety,
      quantityQtl: quantity,
      totalAmount: totalEscrowAmount,
      pricePerQtl: listing.askingPricePerQtl,
      farmerName: listing.farmerName,
      farmerLocation: listing.location,
      farmerPhone: listing.farmerPhone,
      buyerName: buyerUser.name,
      buyerCompany: buyerUser.companyName || 'Institutional Buyer',
      buyerLocation: buyerUser.location,
      transportVehicle: `${transport.name} (Assigned)`,
      status: 'Escrow Funded',
      statusStep: 1,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      qualityGrade: `${listing.qualityGrade} (${listing.aiQualityScore}%)`,
      escrowLocked: true,
      deliveryETA: 'Scheduled 1-Day Pickup',
    }
    onConfirmOrder(newOrder)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border overflow-hidden animate-in slide-in-from-bottom-3"
        style={{ borderColor: '#E2EBE5' }}
      >
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: '#F0F4F2' }}>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#238B5B]">
              Direct Farmgate Sourcing
            </span>
            <h3 className="font-bold text-lg text-[#17221D]">Instant Procurement &amp; Escrow Lock</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4 text-xs">
          {/* Farmer & Crop Header */}
          <div className="p-3.5 rounded-2xl bg-[#F7F6F1] border flex items-center justify-between" style={{ borderColor: '#E2EBE5' }}>
            <div>
              <div className="font-bold text-sm text-[#17221D]">
                {listing.crop} — {listing.variety}
              </div>
              <div className="text-gray-500 mt-0.5">
                Farmer: <strong>{listing.farmerName}</strong> · 📍 {listing.location} ({listing.distanceKm} km)
              </div>
              <div className="flex gap-2 mt-1.5">
                <span className="px-2 py-0.5 rounded-md font-bold bg-[#EAF5EE] text-[#238B5B]">
                  {listing.qualityGrade} ({listing.aiQualityScore}%)
                </span>
                <span className="px-2 py-0.5 rounded-md font-medium bg-white border text-gray-600">
                  Moisture: {listing.moisturePct}%
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-extrabold text-[#063B2A]">
                ₹{listing.askingPricePerQtl.toLocaleString('en-IN')}
              </div>
              <div className="text-gray-400">per Quintal</div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div>
            <div className="flex justify-between items-center mb-1 font-semibold text-gray-600">
              <label>Procurement Quantity (Quintals)</label>
              <span className="text-[#063B2A]">Max Available: {listing.quantityQtl} Qtl</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={listing.minOrderQtl || 5}
                max={listing.quantityQtl}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="flex-1 accent-[#063B2A]"
              />
              <div className="w-20">
                <input
                  type="number"
                  min={listing.minOrderQtl || 5}
                  max={listing.quantityQtl}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 5)}
                  className="w-full py-1.5 px-2.5 rounded-xl border text-center font-bold text-sm outline-none"
                  style={{ borderColor: '#063B2A', color: '#063B2A' }}
                />
              </div>
            </div>
          </div>

          {/* Transport Selection */}
          <div>
            <label className="block font-semibold text-gray-600 mb-1.5">Select Pickup Transport</label>
            <div className="grid grid-cols-2 gap-2">
              {transportOptions.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTransportId(t.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                    selectedTransportId === t.id
                      ? 'border-[#063B2A] bg-[#EAF5EE]'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{t.icon}</span>
                    <div>
                      <div className="font-semibold text-gray-800 text-[11px]">{t.name.split('/')[0]}</div>
                      <div className="text-[10px] text-gray-400">{t.capacity}</div>
                    </div>
                  </div>
                  <span className="font-bold text-[#063B2A]">{t.cost}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Summary Box */}
          <div className="p-3.5 rounded-2xl bg-[#EAF5EE] border border-[#C4DFD0] space-y-1.5">
            <div className="flex justify-between text-gray-600">
              <span>Produce Cost ({quantity} Qtl × ₹{listing.askingPricePerQtl})</span>
              <span className="font-semibold text-[#17221D]">₹{produceAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Logistics &amp; Farmgate Pickup ({transport.name})</span>
              <span className="font-semibold text-[#17221D]">₹{transportCost.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Protected Escrow Handling Fee (1%)</span>
              <span className="font-semibold text-[#17221D]">₹{platformFee.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#C4DFD0] font-extrabold text-sm text-[#063B2A]">
              <span>Total Escrow Deposit</span>
              <span className="text-base font-extrabold text-[#063B2A]">
                ₹{totalEscrowAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Protected escrow statement */}
          <div className="flex items-center gap-2 text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
            <span>🛡️</span>
            <span>
              Funds remain safely held in माझे Kisan Escrow until physical quality assay at warehouse destination.
            </span>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold border text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl font-bold text-white shadow-md hover:opacity-95"
              style={{ background: '#063B2A' }}
            >
              🔒 Lock Escrow &amp; Confirm Buy →
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { MarketplaceListing, User } from '../../types'

export function BuyerNegotiateModal({
  listing,
  buyerUser,
  isOpen,
  onClose,
  onSubmitCounterBid,
}: {
  listing: MarketplaceListing | null
  buyerUser: User
  isOpen: boolean
  onClose: () => void
  onSubmitCounterBid: (bidDetails: any) => void
}) {
  const [counterPrice, setCounterPrice] = useState<number>(listing ? listing.askingPricePerQtl - 80 : 2500)
  const [requestedQuantity, setRequestedQuantity] = useState<number>(listing ? listing.quantityQtl : 50)
  const [paymentTerms, setPaymentTerms] = useState('100% Escrow on Quality Check')
  const [pickupWindow, setPickupWindow] = useState('Within 48 Hours')
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen || !listing) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      onSubmitCounterBid({
        listing,
        counterPrice,
        requestedQuantity,
        paymentTerms,
        pickupWindow,
      })
      setSubmitted(false)
      onClose()
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border overflow-hidden animate-in slide-in-from-bottom-3"
        style={{ borderColor: '#E2EBE5' }}
      >
        <div className="flex items-center justify-between pb-3 border-b mb-3" style={{ borderColor: '#F0F4F2' }}>
          <div>
            <h3 className="font-bold text-base text-[#17221D]">
              Send Counter Offer to {listing.farmerName}
            </h3>
            <p className="text-xs text-gray-500">{listing.crop} ({listing.variety})</p>
          </div>
          <button onClick={onClose} className="text-gray-400 font-bold text-lg">×</button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#EAF5EE] text-[#238B5B] text-2xl flex items-center justify-center mx-auto">
              ✓
            </div>
            <h4 className="font-bold text-sm text-[#063B2A]">Counter Offer Dispatched!</h4>
            <p className="text-xs text-gray-500">
              Notification sent to {listing.farmerName}. You will be alerted upon farmer acceptance.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* Farmer ask vs Mandi benchmark */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#F7F6F1] border border-gray-200">
              <div>
                <div className="text-[10px] text-gray-400">Farmer Asking Price</div>
                <div className="font-bold text-sm text-[#17221D]">₹{listing.askingPricePerQtl}/Qtl</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400">Mandi Benchmark</div>
                <div className="font-bold text-sm text-[#238B5B]">₹{listing.mandiBenchmarkPrice}/Qtl</div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Your Proposed Bid Price (₹ per Quintal)
              </label>
              <input
                type="number"
                required
                value={counterPrice}
                onChange={(e) => setCounterPrice(parseInt(e.target.value) || 0)}
                className="w-full py-2.5 px-3.5 rounded-xl border text-base font-bold outline-none focus:border-[#063B2A]"
                style={{ borderColor: '#063B2A', color: '#063B2A' }}
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Required Quantity (Quintals)
              </label>
              <input
                type="number"
                min={5}
                max={listing.quantityQtl}
                value={requestedQuantity}
                onChange={(e) => setRequestedQuantity(parseInt(e.target.value) || 5)}
                className="w-full py-2 px-3 rounded-xl border text-sm font-semibold outline-none"
                style={{ borderColor: '#E2EBE5' }}
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Pickup Timeline
              </label>
              <select
                value={pickupWindow}
                onChange={(e) => setPickupWindow(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border text-xs outline-none"
                style={{ borderColor: '#E2EBE5' }}
              >
                <option value="Same Day Pickup">Same Day Pickup</option>
                <option value="Within 48 Hours">Within 48 Hours</option>
                <option value="Flexible (Within 5 Days)">Flexible (Within 5 Days)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold text-xs text-white shadow-md transition-opacity hover:opacity-95"
              style={{ background: '#063B2A' }}
            >
              Submit Binding Counter Bid →
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

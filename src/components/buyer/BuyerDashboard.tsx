import { useState, useEffect } from 'react'
import { BuyerTab, OrderItem, ProcurementDemand, User, type NegotiationBid } from '../../types'
import { MarketplaceListing } from '../../types'
import { api } from '../../services/api'
import { MarketplaceTab } from './MarketplaceTab'
import { ActiveOrdersTab } from './ActiveOrdersTab'
import { MarketTrendsTab } from './MarketTrendsTab'
import { BuyerOrderModal } from './BuyerOrderModal'
import { BuyerNegotiateModal } from './BuyerNegotiateModal'
import { PostDemandModal } from './PostDemandModal'

export function BuyerDashboard({
  user,
  onNotify,
}: {
  user: User
  onNotify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void
}) {
  const [activeTab, setActiveTab] = useState<BuyerTab>('marketplace')
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [demands, setDemands] = useState<ProcurementDemand[]>([])
  const [farmerOffers, setFarmerOffers] = useState<NegotiationBid[]>([])

  // Load live data from API
  useEffect(() => {
    // Load listings
    api.marketplace.getListings().then((data) => {
      setListings(data)
    }).catch(console.warn)

    // Load orders
    api.orders.getAll().then((data) => {
      setOrders(data)
    }).catch(console.warn)

    // Load demands
    api.demands.getAll().then((data) => {
      setDemands(data)
    }).catch(console.warn)

    api.demands.getNegotiations().then((data) => {
      setFarmerOffers(data.filter((offer) => offer.senderRole === 'farmer'))
    }).catch(console.warn)
  }, [user.id])

  // Modals
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null)
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [negotiateModalOpen, setNegotiateModalOpen] = useState(false)
  const [postDemandOpen, setPostDemandOpen] = useState(false)

  const handleOpenOrder = (listing: MarketplaceListing) => {
    setSelectedListing(listing)
    setOrderModalOpen(true)
  }

  const handleOpenNegotiate = (listing: MarketplaceListing) => {
    setSelectedListing(listing)
    setNegotiateModalOpen(true)
  }

  const handleConfirmOrder = async (newOrder: OrderItem) => {
    try {
      const created = await api.orders.create({
        listingId: selectedListing?.id,
        quantityQtl: newOrder.quantityQtl,
        pricePerQtl: newOrder.pricePerQtl,
        transportVehicle: newOrder.transportVehicle,
        qualityGrade: newOrder.qualityGrade,
      })
      setOrders((prev) => [created, ...prev])
      onNotify('🔒 Procurement Order Placed & Escrow Funded!', `₹${created.totalAmount.toLocaleString('en-IN')} locked in demo escrow for ${created.quantityQtl} Qtl ${created.cropName}.`, 'success')
      setActiveTab('orders')
    } catch (err: any) {
      onNotify('Order could not be placed', err?.message || 'Please try again.', 'warning')
    }
  }

  const handleSubmitCounterBid = (bid: any) => {
    api.demands.submitNegotiation({
      listingId: bid.listing?.id,
      senderId: user.id,
      senderRole: 'buyer',
      senderName: user.companyName || user.name,
      targetUserId: bid.listing?.farmerId || 'farmer_ramesh',
      cropName: bid.listing?.crop || 'Produce',
      requestedQuantityQtl: bid.requestedQuantity || 50,
      counterPricePerQtl: bid.counterPrice || 2450,
      deliveryTerms: 'Immediate Pickup',
    }).catch(console.warn)

    onNotify(
      '💬 Counter Offer Dispatched',
      `Proposed ₹${bid.counterPrice}/Qtl for ${bid.requestedQuantity} Qtl ${bid.listing.crop} to farmer ${bid.listing.farmerName}.`,
      'info'
    )
  }

  const handleAddDemand = (newDemand: ProcurementDemand) => {
    setDemands([newDemand, ...demands])

    // Persist demand to backend
    api.demands.create({
      buyerId: user.id,
      buyerName: user.name,
      buyerCompany: user.companyName || 'Deccan Fresh Exports',
      cropName: newDemand.cropName,
      variety: newDemand.variety,
      quantityQtlNeeded: newDemand.quantityQtlNeeded,
      targetPricePerQtl: newDemand.targetPricePerQtl,
      requiredByDate: newDemand.requiredByDate,
      deliveryLocation: newDemand.deliveryLocation,
      buyerType: user.buyerType || 'Exporter',
      gradeRequired: newDemand.gradeRequired,
    }).catch((err) => onNotify('Demand could not be posted', err?.message || 'Please try again.', 'warning'))

    onNotify(
      '📢 Demand Broadcasted!',
      `Requirement for ${newDemand.quantityQtlNeeded} Qtl ${newDemand.cropName} broadcasted to 1,200+ local farmers.`,
      'success'
    )
  }

  const handleReleaseEscrow = (orderId: string) => {
    setOrders(
      orders.map((o) =>
        o.id === orderId
          ? { ...o, status: 'Completed', statusStep: 5, escrowLocked: false }
          : o
      )
    )

    api.orders.releaseEscrow(orderId).catch((err) => onNotify('Escrow release failed', err?.message || 'Please try again.', 'warning'))

    onNotify(
      '✅ Escrow Payment Released!',
      `Quality verified. Funds successfully disbursed to farmer bank account for Order #${orderId}.`,
      'success'
    )
  }

  const totalProcuredQtl = orders.reduce((a, b) => a + b.quantityQtl, 0)
  const totalEscrowLocked = orders
    .filter((o) => o.escrowLocked)
    .reduce((a, b) => a + b.totalAmount, 0)

  return (
    <div className="min-h-full pb-20 pt-4 px-3 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Top Buyer Banner & Metrics */}
      <div className="bg-white rounded-3xl border shadow-sm p-5 space-y-4" style={{ borderColor: '#E2EBE5' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold"
              style={{ background: '#063B2A', color: '#F4C44E' }}
            >
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-[#17221D]">
                  {user.companyName || 'Deccan Fresh Exports Pvt Ltd'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF5EE] text-[#238B5B]">
                  🛡️ Verified {user.buyerType || 'Exporter'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Contact: <strong>{user.name}</strong> · 📍 {user.location} · GSTIN: <span className="font-mono">{user.gstin}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="p-2.5 px-4 rounded-2xl bg-[#EAF5EE] border border-[#C4DFD0] text-right">
              <div className="text-[10px] text-gray-500 font-medium">Escrow Wallet Balance</div>
              <div className="text-lg font-extrabold text-[#063B2A]">
                ₹{(user.walletBalance || 485000).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-[#F7F6F1] border border-gray-200">
            <div className="text-gray-400 text-[10px]">Active Orders</div>
            <div className="text-lg font-extrabold text-[#17221D] mt-0.5">
              {orders.filter((o) => o.status !== 'Completed').length} Orders
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-[#F7F6F1] border border-gray-200">
            <div className="text-gray-400 text-[10px]">Total Escrow Locked</div>
            <div className="text-lg font-extrabold text-[#063B2A] mt-0.5">
              ₹{totalEscrowLocked.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-[#F7F6F1] border border-gray-200">
            <div className="text-gray-400 text-[10px]">Volume Sourced</div>
            <div className="text-lg font-extrabold text-emerald-700 mt-0.5">
              {totalProcuredQtl} Quintals
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-[#F7F6F1] border border-gray-200">
            <div className="text-gray-400 text-[10px]">Active Demands (RFQs)</div>
            <div className="text-lg font-extrabold text-gray-800 mt-0.5">
              {demands.length} Broadcasts
            </div>
          </div>
        </div>
      </div>

      {/* Buyer Navigation Tabs */}
      <div className="overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <div className="inline-flex gap-1.5 p-1.5 rounded-2xl bg-white border shadow-sm" style={{ borderColor: '#E2EBE5' }}>
          {[
            { id: 'marketplace', label: 'Direct Farmgate Sourcing', icon: '🌾' },
            { id: 'orders', label: `Active Orders (${orders.length})`, icon: '📦' },
            { id: 'trends', label: 'Post Demand & Market Analytics', icon: '📊' },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as BuyerTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#063B2A] text-white shadow-md'
                    : 'text-[#66736C] hover:text-[#17221D] hover:bg-gray-50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <main>
        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            {farmerOffers.length > 0 && <section className="overflow-hidden rounded-3xl border bg-white shadow-sm" style={{ borderColor: '#D9E4DC' }}>
              <div className="flex flex-col gap-3 border-b px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6" style={{ background: '#F1F5EE', borderColor: '#D9E4DC' }}>
                <div><div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: '#3F6B45' }}>Farmer offers received</div><h2 className="mt-1 text-xl font-extrabold" style={{ color: '#17221D' }}>Crops offered against your demand</h2><p className="mt-1 text-sm" style={{ color: '#66736C' }}>Review the farmer’s crop photos, quantity, grade and proposed price before responding.</p></div>
                <span className="w-fit rounded-full border px-3 py-1 text-xs font-bold" style={{ background: '#FFFEFA', borderColor: '#BED0C2', color: '#294E36' }}>{farmerOffers.length} received</span>
              </div>
              <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">
                {farmerOffers.map((offer) => <article key={offer.id} className="overflow-hidden rounded-2xl border" style={{ borderColor: '#DCE4DE', background: '#FFFEFA' }}>
                  {offer.cropImages?.length ? <div className="grid h-48 grid-cols-4 gap-1 bg-[#E8ECE7]">
                    <img src={offer.cropImages[0]} alt={`${offer.cropName} offered by ${offer.senderName}`} className={`${offer.cropImages.length > 1 ? 'col-span-3' : 'col-span-4'} h-48 w-full object-cover`} />
                    {offer.cropImages.length > 1 && <div className="col-span-1 grid gap-1 overflow-hidden">{offer.cropImages.slice(1, 4).map((image, index) => <img key={index} src={image} alt={`${offer.cropName} detail ${index + 2}`} className="h-full min-h-0 w-full object-cover" />)}</div>}
                  </div> : <div className="flex h-36 items-center justify-center" style={{ background: '#E8EEE8' }}><div className="flex h-16 w-16 items-center justify-center rounded-full border" style={{ borderColor: '#AFC2B3', color: '#3F6B45' }}><svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 17.5 9 12l3.5 3.5L16 12l4 5.5M7.5 8.5h.01" strokeLinecap="round" strokeLinejoin="round" /><rect x="3" y="4" width="18" height="16" rx="2" /></svg></div></div>}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-extrabold" style={{ color: '#17221D' }}>{offer.cropName}{offer.cropVariety ? ` · ${offer.cropVariety}` : ''}</h3><p className="mt-1 text-xs" style={{ color: '#66736C' }}>Offered by {offer.senderName}{offer.cropLocation ? ` · ${offer.cropLocation}` : ''}</p></div><span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: '#FFF3D9', color: '#765B2E' }}>{offer.status}</span></div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm"><div><div className="text-[10px] uppercase tracking-wider" style={{ color: '#879087' }}>Quantity</div><div className="mt-1 font-bold">{offer.requestedQuantityQtl} Qtl</div></div><div><div className="text-[10px] uppercase tracking-wider" style={{ color: '#879087' }}>Price</div><div className="mt-1 font-bold">₹{offer.counterPricePerQtl.toLocaleString('en-IN')}/Qtl</div></div><div><div className="text-[10px] uppercase tracking-wider" style={{ color: '#879087' }}>Grade</div><div className="mt-1 font-bold">{offer.cropGrade || 'Not stated'}</div></div></div>
                    <div className="mt-4 border-t pt-4 text-sm" style={{ borderColor: '#E2E7E2' }}><div className="font-semibold" style={{ color: '#35483B' }}>{offer.deliveryTerms}</div>{offer.harvestStatus && <div className="mt-1" style={{ color: '#66736C' }}>Crop status: {offer.harvestStatus}</div>}{offer.note && <p className="mt-2 leading-relaxed" style={{ color: '#66736C' }}>{offer.note}</p>}</div>
                  </div>
                </article>)}
              </div>
            </section>}
            <MarketplaceTab
              listings={listings}
              onOpenOrderModal={handleOpenOrder}
              onOpenNegotiateModal={handleOpenNegotiate}
              onOpenQualityReport={handleOpenOrder}
            />
          </div>
        )}

        {activeTab === 'orders' && (
          <ActiveOrdersTab
            orders={orders}
            onReleaseEscrow={handleReleaseEscrow}
          />
        )}

        {activeTab === 'trends' && (
          <MarketTrendsTab
            demands={demands}
            onOpenPostDemand={() => setPostDemandOpen(true)}
          />
        )}
      </main>

      {/* Order Modal */}
      {orderModalOpen && selectedListing && (
        <BuyerOrderModal
          listing={selectedListing}
          buyerUser={user}
          isOpen={orderModalOpen}
          onClose={() => setOrderModalOpen(false)}
          onConfirmOrder={handleConfirmOrder}
        />
      )}

      {/* Negotiate Modal */}
      {negotiateModalOpen && selectedListing && (
        <BuyerNegotiateModal
          listing={selectedListing}
          buyerUser={user}
          isOpen={negotiateModalOpen}
          onClose={() => setNegotiateModalOpen(false)}
          onSubmitCounterBid={handleSubmitCounterBid}
        />
      )}

      {/* Post Demand Modal */}
      <PostDemandModal
        isOpen={postDemandOpen}
        onClose={() => setPostDemandOpen(false)}
        onCreateDemand={async (draft) => {
          const created = await api.demands.create(draft)
          setDemands((current) => [created, ...current])
        }}
      />
    </div>
  )
}

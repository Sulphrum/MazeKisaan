import { useEffect, useMemo, useState } from 'react'
import type { ProcurementDemand, User } from '../../types'
import { api } from '../../services/api'

export interface SaleRequestSummary {
  stockId: string
  crop: string
  quantityQtl: number
  price: number
  buyer: string
  status: 'Buyer confirmation pending' | 'Marketplace listing active' | 'Mandi plan prepared'
  routeType?: 'buyer' | 'mandi'
  transportCost?: number
  handlingCost?: number
  marketCharge?: number
  amountInHand?: number
  profit?: number
  deliveryText?: string
  negotiation?: {
    demandId?: string
    senderId: string
    senderRole: 'farmer'
    senderName: string
    targetUserId: string
    cropName: string
    requestedQuantityQtl: number
    counterPricePerQtl: number
    deliveryTerms: string
    note: string
    cropImages?: string[]
    cropGrade?: string
    cropVariety?: string
    cropLocation?: string
    harvestStatus?: string
  }
}

interface BuyerMatch extends ProcurementDemand {
  paymentText: string
  verified: boolean
  trustScore: number
  source: 'live' | 'demo'
}

interface MandiOption {
  name: string
  officialName: string
  distance: number
  multiplier: number
  managedBy: string
  authorityType: string
  phone: string
  phoneDisplay: string
  email?: string
  address: string
  website: string
  contactNote: string
  knownFor: string
}

const MANDI_OPTIONS: MandiOption[] = [
  {
    name: 'Pimpalgaon APMC',
    officialName: 'Agricultural Produce Market Committee, Pimpalgaon Baswant',
    distance: 26,
    multiplier: 1.04,
    managedBy: 'Agricultural Produce Market Committee, Pimpalgaon Baswant',
    authorityType: 'Statutory local market committee under Maharashtra’s regulated agricultural marketing system',
    phone: '+912550251223',
    phoneDisplay: '02550 251223',
    email: 'am_pimpalgaonb@msamb.com',
    address: 'Hon. Sharadchandra Pawar Main Market Yard, Jopul Road, Pimpalgaon Baswant, Tal. Niphad, Dist. Nashik',
    website: 'https://apmcpimpalgaon.com/contact.html',
    contactNote: 'Office contact published by Pimpalgaon Baswant APMC. Confirm the crop auction and arrival time before dispatch.',
    knownFor: 'Onion, tomato, vegetables, pomegranate, raisins and grain auctions',
  },
  {
    name: 'Lasalgaon APMC',
    officialName: 'Agricultural Produce Market Committee, Lasalgaon',
    distance: 22,
    multiplier: 1.01,
    managedBy: 'Agricultural Produce Market Committee, Lasalgaon',
    authorityType: 'Statutory agricultural market committee listed by the Maharashtra Directorate of Marketing',
    phone: '+912550266089',
    phoneDisplay: '02550 266089',
    address: 'Market Committee Yard, Kotamgaon Road, Lasalgaon, Tal. Niphad, Dist. Nashik 422306',
    website: 'https://mahapanan.maharashtra.gov.in/1055/APMC-List',
    contactNote: 'Public market-office directory number. Verify the number, crop auction and arrival time before travel.',
    knownFor: 'Large wholesale onion auctions, along with garlic, vegetables, pulses and grain',
  },
  {
    name: 'Nashik APMC',
    officialName: 'Agricultural Produce Market Committee, Nashik',
    distance: 12,
    multiplier: 0.98,
    managedBy: 'Agricultural Produce Market Committee, Nashik',
    authorityType: 'Statutory local market committee under Maharashtra’s regulated agricultural marketing system',
    phone: '+912532514922',
    phoneDisplay: '0253 2514922',
    email: 'am_nashik@msamb.com',
    address: 'Market Yard, Anand Rishiji Maharaj Road, Dindori Road, Panchavati, Nashik 422003',
    website: 'https://www.apmcnashik.com/apmc_nashik_department.htm',
    contactNote: 'Office contact published by Nashik APMC. Confirm the relevant crop yard and auction schedule before dispatch.',
    knownFor: 'Vegetables, fruit, food grains and other regulated agricultural produce',
  },
]

interface SellingOptionsProps {
  user: User
  cropName: string
  variety: string
  quantityQtl: number
  grade: string
  fairLow: number
  fairHigh: number
  fairRate: number
  cultivationCost: number
  hasTransportVehicle: boolean
  harvestStatus: string
  location: string
  cropImages: string[]
  onSaleRequest: (sale: SaleRequestSummary) => void
  onViewSales: () => void
}

function formatMoney(value: number) {
  return `₹${Math.max(0, Math.round(value)).toLocaleString('en-IN')}`
}

export function estimateTransportCost(distanceKm: number, quantityQtl: number, hasTransportVehicle: boolean) {
  const trips = Math.max(1, Math.ceil(quantityQtl / 40))
  const roundTripKm = Math.max(0, distanceKm) * 2
  const costPerKm = hasTransportVehicle ? 18 : 32
  const minimumCharge = hasTransportVehicle ? 350 : 800
  return Math.max(minimumCharge, Math.round((roundTripKm * costPerKm * trips) / 50) * 50)
}

function createDemoMatches(cropName: string, variety: string, fairRate: number): BuyerMatch[] {
  const offers = [
    { id: 'fresh', buyerId: 'buyer_deccan', company: 'Deccan Fresh Exports', person: 'Sunil Kulkarni', multiplier: 1.03, quantity: 35, distance: 12, pickup: true, type: 'Food Processor', grade: 'Grade A / B', payment: 'Payment protection before pickup', trustScore: 94 },
    { id: 'agro', buyerId: 'buyer_sahyadri', company: 'Sahyadri Agro Network', person: 'Anand More', multiplier: 0.99, quantity: 70, distance: 18, pickup: true, type: 'Retail Network', grade: 'Grade A / B', payment: 'Payment within one working day', trustScore: 91 },
    { id: 'trade', buyerId: 'buyer_lasalgaon', company: 'Lasalgaon Crop Traders', person: 'Sanjay Patil', multiplier: 1.05, quantity: 100, distance: 28, pickup: false, type: 'Wholesale Trader', grade: 'Grade A preferred', payment: 'Payment after delivery confirmation', trustScore: 88 },
  ]
  return offers.map((offer) => {
    const price = Math.round(fairRate * offer.multiplier / 10) * 10
    return {
      id: `demo_${cropName.toLowerCase().replace(/\s+/g, '_')}_${offer.id}`,
      buyerId: offer.buyerId,
      buyerName: offer.person,
      buyerCompany: offer.company,
      cropName,
      variety: variety || 'Standard commercial variety',
      quantityQtlNeeded: offer.quantity,
      targetPricePerQtl: `${formatMoney(price)} / Qtl`,
      targetPriceNumeric: price,
      requiredByDate: 'Within 3–5 days',
      deliveryLocation: `${offer.company} collection point`,
      buyerType: offer.type,
      gradeRequired: offer.grade,
      responsesCount: 2,
      status: 'Active',
      transportProvidedByBuyer: offer.pickup,
      pickupDistanceKm: offer.distance,
      paymentText: offer.payment,
      verified: true,
      trustScore: offer.trustScore,
      source: 'demo',
    }
  })
}

export function SellingOptions({ user, cropName, variety, quantityQtl, grade, fairLow, fairHigh, fairRate, cultivationCost, hasTransportVehicle, harvestStatus, location, cropImages, onSaleRequest, onViewSales }: SellingOptionsProps) {
  const [liveDemands, setLiveDemands] = useState<ProcurementDemand[]>([])
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerMatch | null>(null)
  const [selectedMandi, setSelectedMandi] = useState<MandiOption | null>(null)
  const [dealMode, setDealMode] = useState<'accept' | 'negotiate'>('accept')
  const [counterPrice, setCounterPrice] = useState(String(fairRate))
  const [dealQuantity, setDealQuantity] = useState(String(quantityQtl))
  const [deliveryTerms, setDeliveryTerms] = useState('Farmgate pickup within 3 days')
  const [counterNote, setCounterNote] = useState('')
  const [actionNotice, setActionNotice] = useState('')
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    api.demands.getAll().then(setLiveDemands).catch(() => setLiveDemands([]))
  }, [])

  useEffect(() => {
    setSelectedBuyer(null)
    setSelectedMandi(null)
    setActionNotice('')
    setCounterPrice(String(fairRate))
    setDealQuantity(String(quantityQtl))
  }, [cropName, fairRate, quantityQtl])

  const matches = useMemo(() => {
    const live: BuyerMatch[] = liveDemands
      .filter((demand) => demand.status === 'Active' && demand.cropName.toLowerCase() === cropName.toLowerCase())
      .map((demand) => ({ ...demand, paymentText: 'Payment terms confirmed before dispatch', verified: true, trustScore: 93, source: 'live' as const }))
    const demos = createDemoMatches(cropName, variety, fairRate)
    return [...live, ...demos.filter((demo) => !live.some((item) => item.buyerCompany === demo.buyerCompany))].slice(0, 3)
  }, [cropName, fairHigh, fairLow, fairRate, liveDemands, variety])

  const buyerAmounts = matches.map((buyer) => {
    const matchedQuantity = Math.min(quantityQtl, buyer.quantityQtlNeeded)
    const transport = buyer.transportProvidedByBuyer ? 0 : estimateTransportCost(buyer.pickupDistanceKm, matchedQuantity, hasTransportVehicle)
    const handling = Math.max(250, matchedQuantity * 20)
    const amountInHand = buyer.targetPriceNumeric * matchedQuantity - transport - handling
    const proportionalCultivation = cultivationCost * (matchedQuantity / Math.max(1, quantityQtl))
    return { buyer, matchedQuantity, transport, handling, amountInHand, profit: amountInHand - proportionalCultivation }
  })
  const highestAmount = Math.max(...buyerAmounts.map((item) => item.amountInHand), 0)
  const cropCanSell = harvestStatus !== 'Growing'

  function openBuyerAction(buyer: BuyerMatch, mode: 'accept' | 'negotiate') {
    setSelectedBuyer(buyer)
    setDealMode(mode)
    setCounterPrice(String(mode === 'accept' ? buyer.targetPriceNumeric : Math.max(fairRate, buyer.targetPriceNumeric)))
    setDealQuantity(String(Math.min(quantityQtl, buyer.quantityQtlNeeded)))
    setDeliveryTerms(buyer.transportProvidedByBuyer ? 'Buyer farmgate pickup within 3 days' : 'Farmer delivery within 3 days')
    setCounterNote('')
    setActionNotice('')
    setActionError('')
  }

  function submitBuyerAction() {
    if (!selectedBuyer) return
    const qty = Number(dealQuantity)
    const price = Number(counterPrice)
    if (qty <= 0 || qty > quantityQtl || qty > selectedBuyer.quantityQtlNeeded || price <= 0) {
      setActionError('Enter a valid quantity and price within the available buyer demand.')
      return
    }
    setActionError('')
    const buyerPickup = selectedBuyer.transportProvidedByBuyer && deliveryTerms.startsWith('Buyer')
    const transport = buyerPickup ? 0 : estimateTransportCost(selectedBuyer.pickupDistanceKm, qty, hasTransportVehicle)
    const handling = Math.max(250, qty * 20)
    const amountInHand = price * qty - transport - handling
    const proportionalCultivation = cultivationCost * (qty / Math.max(1, quantityQtl))
    onSaleRequest({
      stockId: `value_${Date.now()}`,
      crop: cropName,
      quantityQtl: qty,
      price,
      buyer: selectedBuyer.buyerCompany,
      status: 'Buyer confirmation pending',
      routeType: 'buyer',
      transportCost: transport,
      handlingCost: handling,
      marketCharge: 0,
      amountInHand,
      profit: amountInHand - proportionalCultivation,
      deliveryText: deliveryTerms,
      negotiation: {
        demandId: selectedBuyer.id,
        senderId: user.id,
        senderRole: 'farmer',
        senderName: user.name,
        targetUserId: selectedBuyer.buyerId || selectedBuyer.id,
        cropName,
        requestedQuantityQtl: qty,
        counterPricePerQtl: price,
        deliveryTerms,
        note: dealMode === 'accept'
          ? 'Farmer accepted the displayed buyer offer. Buyer confirmation and payment protection are still required.'
          : counterNote.trim() || 'Farmer submitted a structured counter offer from the Value & Sell report.',
        cropImages,
        cropGrade: grade,
        cropVariety: variety,
        cropLocation: location,
        harvestStatus,
      },
    })
    setSelectedBuyer(null)
  }

  function selectMandi(name: string, price: number, transport: number, handling: number, marketCharge: number, amountInHand: number, profit: number) {
    onSaleRequest({
      stockId: `mandi_${Date.now()}`,
      crop: cropName,
      quantityQtl,
      price,
      buyer: name,
      status: 'Mandi plan prepared',
      routeType: 'mandi',
      transportCost: transport,
      handlingCost: handling,
      marketCharge,
      amountInHand,
      profit,
      deliveryText: `Farmer delivery to ${name}`,
    })
    setSelectedBuyer(null)
    setSelectedMandi(null)
  }

  return (
    <>
      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><h3 className="mt-2 text-2xl font-bold" style={{ color: '#1D241F' }}>Nearby Buyers looking for {cropName.toLowerCase()}.</h3><p className="mt-2 max-w-3xl text-base leading-relaxed" style={{ color: '#687069' }}>Offers are compared with your fair-value range. The most important figure is the estimated amount you receive after basic selling costs.</p></div>
          <div className="text-sm font-semibold" style={{ color: '#173F2A' }}>Fair range: {formatMoney(fairLow)}–{formatMoney(fairHigh)} / Qtl</div>
        </div>

        {!cropCanSell && <div className="mt-5 border p-4 text-sm leading-relaxed" style={{ background: '#FFF6EA', borderColor: '#E9CCA0', color: '#7A5310' }}>Your crop is still growing. You can review buyer details now, but the final sale action becomes available when the crop is ready to harvest.</div>}
        {actionNotice && <div className="mt-5 flex flex-col gap-3 border p-5 sm:flex-row sm:items-center sm:justify-between" style={{ background: '#F1F5EE', borderColor: '#BED0C2', color: '#29563A' }}><p className="text-sm font-semibold leading-relaxed">{actionNotice}</p><button onClick={onViewSales} className="whitespace-nowrap border px-4 py-2 text-sm font-bold" style={{ borderColor: '#3F6B45', color: '#173F2A' }}>View My Sales</button></div>}

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {buyerAmounts.map(({ buyer, matchedQuantity, amountInHand }) => (
            <article key={buyer.id} className="flex flex-col border p-6" style={{ background: '#FFFEFA', borderColor: amountInHand === highestAmount ? '#3F6B45' : 'rgba(29,36,31,0.13)' }}>
              <div className="flex items-start justify-between gap-3"><div><h4 className="text-lg font-bold" style={{ color: '#1D241F' }}>{buyer.buyerCompany}</h4><p className="mt-1 text-sm" style={{ color: '#687069' }}>{buyer.buyerType} · {buyer.pickupDistanceKm} km away</p></div><span className="inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: '#EAF5EE', color: '#216644' }}><svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m4 10 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" /></svg>{buyer.verified ? 'Verified' : 'Buyer'}</span></div>
              <div className="mt-4 flex items-center justify-between border-y py-3 text-sm" style={{ borderColor: '#E2E6E1' }}><span style={{ color: '#687069' }}>Trust score</span><strong style={{ color: '#173F2A' }}>{buyer.trustScore}/100 · {buyer.trustScore >= 90 ? 'Highly trusted' : 'Trusted'}</strong></div>
              <div className="mt-4 text-3xl font-bold" style={{ color: '#173F2A' }}>{formatMoney(buyer.targetPriceNumeric)}<span className="ml-1 text-sm font-medium" style={{ color: '#687069' }}>/Qtl</span></div>
              <p className="mt-1 text-sm" style={{ color: '#687069' }}>Looking for up to {matchedQuantity} Qtl</p>
              <div className="mt-5 text-xs uppercase tracking-wider" style={{ color: '#687069' }}>Estimated amount in hand</div><div className="mt-1 text-2xl font-bold" style={{ color: '#173F2A' }}>{formatMoney(amountInHand)}</div>
              <button type="button" onClick={() => openBuyerAction(buyer, 'accept')} className="mt-5 w-full border px-3 py-2.5 text-sm font-bold" style={{ borderColor: '#173F2A', color: '#173F2A' }}>View details</button>
            </article>
          ))}
        </div>

        {selectedBuyer && (() => {
          const proposalQty = Number(dealQuantity) || 0
          const proposalPrice = Number(counterPrice) || 0
          const buyerPickup = selectedBuyer.transportProvidedByBuyer && deliveryTerms.startsWith('Buyer')
          const proposalTransport = buyerPickup ? 0 : estimateTransportCost(selectedBuyer.pickupDistanceKm, proposalQty, hasTransportVehicle)
          const proposalHandling = Math.max(250, proposalQty * 20)
          const proposalGross = proposalQty * proposalPrice
          const proposalNet = proposalGross - proposalTransport - proposalHandling
          const proposalCultivation = cultivationCost * (proposalQty / Math.max(1, quantityQtl))
          const proposalProfit = proposalNet - proposalCultivation
          const closeModal = () => {
            setSelectedBuyer(null)
            setActionError('')
          }
          const priceGuidance = proposalPrice < fairLow
            ? `This is below the estimated fair range by ${formatMoney(fairLow - proposalPrice)} per quintal.`
            : proposalPrice > fairHigh
              ? `This is ${formatMoney(proposalPrice - fairHigh)} above the estimated fair range. The buyer may negotiate or decline.`
              : 'This price is inside the estimated fair market range for your crop.'

          return <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-5" role="presentation">
            <button type="button" className="absolute inset-0 bg-[#102018]/60 backdrop-blur-[2px]" onClick={closeModal} aria-label="Close offer window" />
            <div className="relative max-h-[94dvh] w-full overflow-y-auto bg-[#FFFEFA] shadow-2xl sm:max-w-3xl sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="offer-dialog-title">
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b px-5 py-5 sm:px-7" style={{ background: '#FFFEFA', borderColor: '#E1E6E1' }}>
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: '#3F6B45' }}>{dealMode === 'accept' ? 'Buyer details' : 'Negotiation'}</div>
                  <h4 id="offer-dialog-title" className="mt-1 text-2xl font-bold" style={{ color: '#1D241F' }}>{dealMode === 'accept' ? 'Review this buyer and offer' : 'Create a counter offer'}</h4>
                  <p className="mt-1 text-sm" style={{ color: '#687069' }}>{selectedBuyer.buyerCompany} · {selectedBuyer.pickupDistanceKm} km away</p>
                </div>
                <button type="button" onClick={closeModal} className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border text-xl leading-none" aria-label="Close offer window" style={{ borderColor: '#D8DED8', color: '#52635A' }}>×</button>
              </div>

              {dealMode === 'accept' ? <div className="space-y-5 px-5 py-6 sm:px-7">
                <div className="border p-4 sm:p-5" style={{ background: '#F2F6F1', borderColor: '#C8D6CB' }}>
                  <p className="text-sm font-semibold leading-relaxed" style={{ color: '#294E36' }}>Review the buyer, offer and expected costs below. Continuing only takes you to the final summary—nothing is sent to the buyer from this window.</p>
                </div>

                <section className="border p-5" style={{ background: '#FFFEFA', borderColor: '#C8D6CB' }}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div><div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: '#216644' }}><svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m4 10 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" /></svg>Verified buyer</div><h5 className="mt-2 text-lg font-bold" style={{ color: '#1D241F' }}>{selectedBuyer.buyerCompany}</h5><p className="mt-1 text-sm" style={{ color: '#687069' }}>{selectedBuyer.buyerType} · Contact person: {selectedBuyer.buyerName}</p></div>
                    <div className="sm:text-right"><div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#687069' }}>Trust score</div><div className="mt-1 text-3xl font-bold" style={{ color: '#173F2A' }}>{selectedBuyer.trustScore}<span className="text-sm font-medium" style={{ color: '#687069' }}>/100</span></div><div className="text-xs font-semibold" style={{ color: '#3F6B45' }}>{selectedBuyer.trustScore >= 90 ? 'Highly trusted' : 'Trusted'}</div></div>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full" style={{ background: '#E1E7E2' }}><div className="h-full rounded-full" style={{ width: `${selectedBuyer.trustScore}%`, background: '#C5A15A' }} /></div>
                  <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">{['Business identity verified', 'Payment terms recorded', 'Trade activity reviewed'].map((item) => <div key={item} className="flex items-center gap-2"><svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="#3F6B45" strokeWidth="2.2"><path d="m4 10 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" /></svg><span style={{ color: '#52635A' }}>{item}</span></div>)}</div>
                  <p className="mt-4 text-xs leading-relaxed" style={{ color: '#7A827B' }}>Verification improves confidence in the buyer’s identity and activity. Always keep the final quantity, grade, payment and pickup terms inside the confirmed sale record.</p>
                </section>

                <div>
                  <h5 className="text-base font-bold" style={{ color: '#1D241F' }}>Offer details</h5>
                  <dl className="mt-3 divide-y border text-sm" style={{ borderColor: '#E1E6E1' }}>
                    <div className="flex justify-between gap-4 px-4 py-3"><dt style={{ color: '#687069' }}>Crop and quality</dt><dd className="text-right font-bold">{cropName} · {grade}</dd></div>
                    <div className="flex justify-between gap-4 px-4 py-3"><dt style={{ color: '#687069' }}>Buyer requires</dt><dd className="text-right font-bold">{selectedBuyer.gradeRequired}</dd></div>
                    <div className="flex justify-between gap-4 px-4 py-3"><dt style={{ color: '#687069' }}>Quantity</dt><dd className="text-right font-bold">{proposalQty} Qtl</dd></div>
                    <div className="flex justify-between gap-4 px-4 py-3"><dt style={{ color: '#687069' }}>Buyer price</dt><dd className="text-right font-bold">{formatMoney(proposalPrice)} / Qtl</dd></div>
                    <div className="flex justify-between gap-4 px-4 py-3"><dt style={{ color: '#687069' }}>Required by</dt><dd className="text-right font-bold">{selectedBuyer.requiredByDate}</dd></div>
                    <div className="flex justify-between gap-4 px-4 py-3"><dt style={{ color: '#687069' }}>Pickup or delivery</dt><dd className="max-w-[60%] text-right font-bold">{deliveryTerms}</dd></div>
                    <div className="flex justify-between gap-4 px-4 py-3"><dt style={{ color: '#687069' }}>Payment</dt><dd className="max-w-[60%] text-right font-bold">{selectedBuyer.paymentText}</dd></div>
                  </dl>
                </div>

                <div>
                  <h5 className="text-base font-bold" style={{ color: '#1D241F' }}>What you may receive</h5>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="border p-3"><div className="text-xs" style={{ color: '#687069' }}>Crop value</div><div className="mt-1 font-bold">{formatMoney(proposalGross)}</div></div>
                    <div className="border p-3"><div className="text-xs" style={{ color: '#687069' }}>Transport</div><div className="mt-1 font-bold">{proposalTransport ? `−${formatMoney(proposalTransport)}` : 'Buyer pickup'}</div></div>
                    <div className="border p-3"><div className="text-xs" style={{ color: '#687069' }}>Handling estimate</div><div className="mt-1 font-bold">−{formatMoney(proposalHandling)}</div></div>
                    <div className="border p-3" style={{ background: '#EAF5EE', borderColor: '#BCD5C4' }}><div className="text-xs" style={{ color: '#3F6B45' }}>Amount in hand</div><div className="mt-1 font-bold" style={{ color: '#173F2A' }}>{formatMoney(proposalNet)}</div></div>
                  </div>
                  <p className="mt-3 text-sm" style={{ color: proposalProfit >= 0 ? '#3F6B45' : '#9F241B' }}>Estimated profit after your recorded cultivation cost: <strong>{proposalProfit >= 0 ? '+' : '−'}{formatMoney(Math.abs(proposalProfit))}</strong></p>
                </div>

                <div className="border-l-4 px-4 py-3" style={{ background: '#FFF8ED', borderColor: '#C8902E' }}>
                  <div className="text-sm font-bold" style={{ color: '#6D4A12' }}>What happens next</div>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: '#765B2E' }}>The buyer reviews your request, confirms quantity and pickup, and funds payment protection. Final weight and grade are confirmed before settlement.</p>
                </div>

                {actionError && <div className="border p-3 text-sm" style={{ background: '#FEF2F2', borderColor: '#F1B8B2', color: '#9F241B' }}>{actionError}</div>}
                <div className="grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={closeModal} className="order-2 border px-5 py-3.5 text-sm font-bold sm:order-1" style={{ borderColor: '#9EAAA1', color: '#35483B' }}>Close</button>
                  <button type="button" onClick={submitBuyerAction} className="order-1 px-5 py-3.5 text-sm font-bold text-white sm:order-2" style={{ background: '#173F2A' }}>Continue to final review</button>
                </div>
              </div> : <div className="space-y-5 px-5 py-6 sm:px-7">
                <div className="grid grid-cols-2 gap-3">
                  <div className="border p-4"><div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#687069' }}>Buyer currently offers</div><div className="mt-2 text-xl font-bold" style={{ color: '#1D241F' }}>{formatMoney(selectedBuyer.targetPriceNumeric)} / Qtl</div></div>
                  <div className="border p-4" style={{ background: '#F2F6F1', borderColor: '#C8D6CB' }}><div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#3F6B45' }}>Estimated fair range</div><div className="mt-2 text-xl font-bold" style={{ color: '#173F2A' }}>{formatMoney(fairLow)}–{formatMoney(fairHigh)}</div></div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label><span className="text-sm font-bold" style={{ color: '#35483B' }}>Your price per quintal</span><div className="relative mt-2"><span className="absolute left-4 top-3.5 font-bold">₹</span><input type="number" min="1" value={counterPrice} onChange={(event) => setCounterPrice(event.target.value)} className="w-full border bg-white py-3 pl-9 pr-3 text-base" style={{ borderColor: '#BAC5BC' }} /></div></label>
                  <label><span className="text-sm font-bold" style={{ color: '#35483B' }}>Quantity to offer</span><div className="relative mt-2"><input type="number" min="1" max={Math.min(quantityQtl, selectedBuyer.quantityQtlNeeded)} value={dealQuantity} onChange={(event) => setDealQuantity(event.target.value)} className="w-full border bg-white px-3 py-3 pr-14 text-base" style={{ borderColor: '#BAC5BC' }} /><span className="absolute right-4 top-3.5 text-sm font-semibold" style={{ color: '#687069' }}>Qtl</span></div></label>
                </div>

                <label className="block"><span className="text-sm font-bold" style={{ color: '#35483B' }}>Pickup or delivery</span><select value={deliveryTerms} onChange={(event) => setDeliveryTerms(event.target.value)} className="mt-2 w-full border bg-white px-3 py-3 text-base" style={{ borderColor: '#BAC5BC' }}>{selectedBuyer.transportProvidedByBuyer && <option>Buyer farmgate pickup within 3 days</option>}<option>Farmer delivery within 3 days</option><option>Pickup date to be agreed</option></select></label>
                <label className="block"><span className="text-sm font-bold" style={{ color: '#35483B' }}>Message to buyer <span className="font-normal" style={{ color: '#879087' }}>(optional)</span></span><textarea rows={3} value={counterNote} onChange={(event) => setCounterNote(event.target.value)} placeholder="For example: Crop is ready and can be collected tomorrow." className="mt-2 w-full resize-none border bg-white px-3 py-3 text-base" style={{ borderColor: '#BAC5BC' }} /></label>

                <div className="border p-4 sm:p-5" style={{ background: '#F5F2E9', borderColor: '#D9D1BD' }}>
                  <div className="text-sm font-bold" style={{ color: '#1D241F' }}>If the buyer accepts your counter offer</div>
                  <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div><span style={{ color: '#687069' }}>Crop value</span><div className="mt-0.5 font-bold">{formatMoney(proposalGross)}</div></div>
                    <div><span style={{ color: '#687069' }}>Transport + handling</span><div className="mt-0.5 font-bold">−{formatMoney(proposalTransport + proposalHandling)}</div></div>
                    <div><span style={{ color: '#687069' }}>Amount in hand</span><div className="mt-0.5 text-lg font-bold" style={{ color: '#173F2A' }}>{formatMoney(proposalNet)}</div></div>
                    <div><span style={{ color: '#687069' }}>Estimated profit</span><div className="mt-0.5 text-lg font-bold" style={{ color: proposalProfit >= 0 ? '#3F6B45' : '#9F241B' }}>{proposalProfit >= 0 ? '+' : '−'}{formatMoney(Math.abs(proposalProfit))}</div></div>
                  </div>
                </div>

                <p className="border-l-4 px-4 py-3 text-sm font-semibold leading-relaxed" style={{ background: proposalPrice < fairLow ? '#FFF4ED' : '#F2F7F2', borderColor: proposalPrice < fairLow ? '#C96A35' : '#3F6B45', color: proposalPrice < fairLow ? '#81421F' : '#29563A' }}>{priceGuidance}</p>
                {actionError && <div className="border p-3 text-sm" style={{ background: '#FEF2F2', borderColor: '#F1B8B2', color: '#9F241B' }}>{actionError}</div>}
                <div className="grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={closeModal} className="order-2 border px-5 py-3.5 text-sm font-bold sm:order-1" style={{ borderColor: '#9EAAA1', color: '#35483B' }}>Cancel</button>
                  <button type="button" onClick={submitBuyerAction} disabled={proposalQty <= 0 || proposalPrice <= 0} className="order-1 px-5 py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 sm:order-2" style={{ background: '#173F2A' }}>Review counter offer</button>
                </div>
                <p className="text-center text-xs leading-relaxed" style={{ color: '#7A827B' }}>The buyer can accept, decline or send another price. Your crop remains under your control.</p>
              </div>}
            </div>
          </div>
        })()}
      </section>

      <section>
        <h3 className="text-2xl font-bold" style={{ color: '#1D241F' }}>Nearby mandi alternatives</h3>
        <p className="mt-2 max-w-3xl text-base leading-relaxed" style={{ color: '#687069' }}>Compare the likely amount received after transport and mandi charges before choosing a route. Transport is calculated from each mandi’s distance using {hasTransportVehicle ? 'your own vehicle running cost' : 'an estimated hired vehicle rate'}.</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {MANDI_OPTIONS.map((mandi) => {
            const rate = Math.round(fairRate * mandi.multiplier / 10) * 10
            const transport = estimateTransportCost(mandi.distance, quantityQtl, hasTransportVehicle)
            const marketCharge = Math.round(rate * quantityQtl * 0.015)
            const handling = Math.max(250, quantityQtl * 20)
            const net = rate * quantityQtl - transport - marketCharge - handling
            return <article key={mandi.name} className="border p-6" style={{ background: '#FFFEFA', borderColor: 'rgba(29,36,31,0.13)' }}>
              <h4 className="text-lg font-bold" style={{ color: '#1D241F' }}>{mandi.name}</h4>
              <p className="mt-1 text-sm" style={{ color: '#687069' }}>{mandi.distance} km from {location.split(',')[0]}</p>
              <div className="mt-4 text-3xl font-bold" style={{ color: '#173F2A' }}>{formatMoney(rate)}<span className="ml-1 text-sm font-medium" style={{ color: '#687069' }}>/Qtl</span></div>
              <div className="mt-4 border-y py-3 text-sm" style={{ borderColor: '#E2E6E1' }}><div className="flex justify-between"><span style={{ color: '#687069' }}>Transport estimate</span><strong>{formatMoney(transport)}</strong></div><div className="mt-2 flex justify-between"><span style={{ color: '#687069' }}>Mandi + handling</span><strong>{formatMoney(marketCharge + handling)}</strong></div></div>
              <div className="mt-4 text-xs uppercase tracking-wider" style={{ color: '#687069' }}>Estimated amount in hand</div><div className="mt-1 text-2xl font-bold" style={{ color: '#173F2A' }}>{formatMoney(net)}</div>
              <button type="button" onClick={() => setSelectedMandi(mandi)} className="mt-5 w-full border px-3 py-2.5 text-sm font-bold" style={{ borderColor: '#173F2A', color: '#173F2A' }}>View details</button>
            </article>
          })}
        </div>
        <button onClick={() => setActionNotice(`Your ${cropName} valuation has been saved. Buyer demand can be checked again before you decide to sell.`)} className="mt-5 text-sm font-bold" style={{ color: '#173F2A' }}>Save and wait for another offer</button>
      </section>

      {selectedMandi && (() => {
        const rate = Math.round(fairRate * selectedMandi.multiplier / 10) * 10
        const grossValue = rate * quantityQtl
        const transport = estimateTransportCost(selectedMandi.distance, quantityQtl, hasTransportVehicle)
        const marketCharge = Math.round(grossValue * 0.015)
        const handling = Math.max(250, quantityQtl * 20)
        const amountInHand = grossValue - transport - marketCharge - handling
        const estimatedProfit = amountInHand - cultivationCost
        const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedMandi.address)}`
        const closeMandi = () => setSelectedMandi(null)

        return <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-5" role="presentation">
          <button type="button" className="absolute inset-0 bg-[#102018]/60 backdrop-blur-[2px]" onClick={closeMandi} aria-label="Close mandi details" />
          <div className="relative max-h-[94dvh] w-full overflow-y-auto bg-[#FFFEFA] shadow-2xl sm:max-w-3xl sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="mandi-dialog-title">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b px-5 py-5 sm:px-7" style={{ background: '#FFFEFA', borderColor: '#E1E6E1' }}>
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: '#3F6B45' }}>Mandi selling route</div>
                <h4 id="mandi-dialog-title" className="mt-1 text-2xl font-bold" style={{ color: '#1D241F' }}>{selectedMandi.name}</h4>
                <p className="mt-1 text-sm" style={{ color: '#687069' }}>{selectedMandi.distance} km from {location.split(',')[0]} · Estimated {cropName.toLowerCase()} rate {formatMoney(rate)} / Qtl</p>
              </div>
              <button type="button" onClick={closeMandi} className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border text-xl leading-none" aria-label="Close mandi details" style={{ borderColor: '#D8DED8', color: '#52635A' }}>×</button>
            </div>

            <div className="space-y-6 px-5 py-6 sm:px-7">
              <section className="border p-5" style={{ background: '#F2F6F1', borderColor: '#C8D6CB' }}>
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#3F6B45' }}>Owner / managing authority</div>
                <h5 className="mt-2 text-lg font-bold" style={{ color: '#1D241F' }}>{selectedMandi.managedBy}</h5>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: '#52635A' }}>{selectedMandi.authorityType}. It is managed as an APMC market authority—not by an individual trader.</p>
                <div className="mt-4 border-t pt-4 text-sm" style={{ borderColor: '#CDD8CF' }}><span style={{ color: '#687069' }}>Official market name</span><div className="mt-1 font-bold" style={{ color: '#294E36' }}>{selectedMandi.officialName}</div></div>
              </section>

              <section>
                <h5 className="text-lg font-bold" style={{ color: '#1D241F' }}>Complete estimated calculation</h5>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: '#687069' }}>For {quantityQtl} Qtl of {grade} {cropName}. Actual auction price, weighing and deductions can change at the yard.</p>
                <dl className="mt-4 divide-y border text-sm" style={{ borderColor: '#E1E6E1' }}>
                  <div className="flex justify-between gap-4 px-4 py-3"><dt style={{ color: '#687069' }}>Estimated mandi rate</dt><dd className="font-bold">{formatMoney(rate)} / Qtl</dd></div>
                  <div className="flex justify-between gap-4 px-4 py-3"><dt style={{ color: '#687069' }}>Gross crop value</dt><dd className="font-bold">{formatMoney(grossValue)}</dd></div>
                  <div className="flex justify-between gap-4 px-4 py-3"><dt style={{ color: '#687069' }}>Transport ({selectedMandi.distance} km, {hasTransportVehicle ? 'own vehicle' : 'hired vehicle'})</dt><dd className="font-bold">−{formatMoney(transport)}</dd></div>
                  <div className="flex justify-between gap-4 px-4 py-3"><dt style={{ color: '#687069' }}>Estimated loading and handling</dt><dd className="font-bold">−{formatMoney(handling)}</dd></div>
                  <div className="flex justify-between gap-4 px-4 py-3"><dt style={{ color: '#687069' }}>Indicative mandi charges (1.5%)</dt><dd className="font-bold">−{formatMoney(marketCharge)}</dd></div>
                  <div className="flex justify-between gap-4 px-4 py-3" style={{ background: '#F1F5EE' }}><dt className="font-bold" style={{ color: '#294E36' }}>Estimated amount in hand</dt><dd className="text-lg font-bold" style={{ color: '#173F2A' }}>{formatMoney(amountInHand)}</dd></div>
                  <div className="flex justify-between gap-4 px-4 py-3"><dt style={{ color: '#687069' }}>Your cultivation cost</dt><dd className="font-bold">−{formatMoney(cultivationCost)}</dd></div>
                  <div className="flex justify-between gap-4 px-4 py-3"><dt className="font-bold">Estimated profit</dt><dd className="text-lg font-bold" style={{ color: estimatedProfit >= 0 ? '#216644' : '#9F241B' }}>{estimatedProfit >= 0 ? '+' : '−'}{formatMoney(Math.abs(estimatedProfit))}</dd></div>
                </dl>
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                <div className="border p-5" style={{ borderColor: '#E1E6E1' }}>
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#3F6B45' }}>Contact the mandi</div>
                  <div className="mt-3 text-sm leading-relaxed" style={{ color: '#52635A' }}><strong>Office:</strong> {selectedMandi.phoneDisplay}</div>
                  {selectedMandi.email && <div className="mt-1 break-all text-sm" style={{ color: '#52635A' }}><strong>Email:</strong> {selectedMandi.email}</div>}
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: '#687069' }}>{selectedMandi.contactNote}</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <a href={`tel:${selectedMandi.phone}`} className="px-4 py-3 text-center text-sm font-bold text-white" style={{ background: '#173F2A' }}>Call market office</a>
                    {selectedMandi.email ? <a href={`mailto:${selectedMandi.email}?subject=${encodeURIComponent(`${cropName} auction enquiry`)}`} className="border px-4 py-3 text-center text-sm font-bold" style={{ borderColor: '#173F2A', color: '#173F2A' }}>Email enquiry</a> : <a href={selectedMandi.website} target="_blank" rel="noreferrer" className="border px-4 py-3 text-center text-sm font-bold" style={{ borderColor: '#173F2A', color: '#173F2A' }}>Official APMC listing</a>}
                  </div>
                </div>
                <div className="border p-5" style={{ borderColor: '#E1E6E1' }}>
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#3F6B45' }}>Location and produce</div>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: '#52635A' }}>{selectedMandi.address}</p>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: '#687069' }}><strong>Known for:</strong> {selectedMandi.knownFor}</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <a href={directionsUrl} target="_blank" rel="noreferrer" className="border px-4 py-3 text-center text-sm font-bold" style={{ borderColor: '#173F2A', color: '#173F2A' }}>Get directions</a>
                    <a href={selectedMandi.website} target="_blank" rel="noreferrer" className="border px-4 py-3 text-center text-sm font-bold" style={{ borderColor: '#9EAAA1', color: '#35483B' }}>Authority information</a>
                  </div>
                </div>
              </section>

              <section className="border-l-4 px-5 py-4" style={{ background: '#FFF8ED', borderColor: '#C8902E' }}>
                <div className="text-sm font-bold" style={{ color: '#6D4A12' }}>How to sell through this mandi</div>
                <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed" style={{ color: '#765B2E' }}>
                  <li>Call the market office and confirm that {cropName.toLowerCase()} is being accepted, the auction time and required documents.</li>
                  <li>Ask which yard or gate handles your crop and whether advance registration is required.</li>
                  <li>Carry farmer identification, bank details and available crop or vehicle records.</li>
                  <li>At arrival, confirm weighing, grading, auction deductions and payment timing before unloading.</li>
                  <li>Keep the weighment slip and sale receipt, and verify payment before treating the crop as sold.</li>
                </ol>
              </section>

              <div className="border p-4 text-sm leading-relaxed" style={{ background: '#F7F7F3', borderColor: '#D8DED8', color: '#687069' }}>Rates and costs shown by माझे Kisan are planning estimates, not a mandi booking or guaranteed auction price. Contact and authority information was checked in September 2026; confirm it before dispatch.</div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={closeMandi} className="order-2 border px-5 py-3.5 text-sm font-bold sm:order-1" style={{ borderColor: '#9EAAA1', color: '#35483B' }}>Close</button>
                <button type="button" disabled={!cropCanSell} onClick={() => selectMandi(selectedMandi.name, rate, transport, handling, marketCharge, amountInHand, estimatedProfit)} className="order-1 px-5 py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 sm:order-2" style={{ background: '#173F2A' }}>{cropCanSell ? 'Continue to final review' : 'Available when crop is ready'}</button>
              </div>
            </div>
          </div>
        </div>
      })()}
    </>
  )
}

import { useEffect, useState } from 'react'
import type { ProcurementDemand } from '../../types'
import { MARKET_CROPS } from '../farmer/MarketOverview'

interface PostDemandModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateDemand: (demand: Partial<ProcurementDemand>) => Promise<void>
}

const FIELD_STYLE = { borderColor: '#C9D1CA', background: '#FFFFFF' }

export function PostDemandModal({ isOpen, onClose, onCreateDemand }: PostDemandModalProps) {
  const [cropName, setCropName] = useState('Tomato')
  const [variety, setVariety] = useState('')
  const [quantity, setQuantity] = useState('50')
  const [targetPrice, setTargetPrice] = useState('2500')
  const [requiredDate, setRequiredDate] = useState('2026-09-15')
  const [gradeRequired, setGradeRequired] = useState('Grade A / Grade B')
  const [deliveryLocation, setDeliveryLocation] = useState('Nashik Agro Terminal, Maharashtra')
  const [transportProvided, setTransportProvided] = useState(true)
  const [pickupRadius, setPickupRadius] = useState('35')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [isOpen])

  if (!isOpen) return null

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const quantityNumber = Number(quantity)
    const priceNumber = Number(targetPrice)
    if (quantityNumber <= 0 || priceNumber <= 0 || !deliveryLocation.trim()) {
      setError('Enter a valid quantity, price and delivery location.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onCreateDemand({
        cropName,
        variety: variety.trim() || 'Any suitable commercial variety',
        quantityQtlNeeded: quantityNumber,
        targetPricePerQtl: String(priceNumber),
        targetPriceNumeric: priceNumber,
        requiredByDate: requiredDate,
        deliveryLocation: deliveryLocation.trim(),
        gradeRequired,
        transportProvidedByBuyer: transportProvided,
        pickupDistanceKm: Math.max(0, Number(pickupRadius) || 0),
        status: 'Active',
      })
      onClose()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Demand could not be published. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-5" role="presentation">
    <button type="button" className="absolute inset-0 bg-[#0C1D14]/70 backdrop-blur-[2px]" onClick={onClose} aria-label="Close demand form" />
    <div role="dialog" aria-modal="true" aria-labelledby="new-demand-title" className="relative max-h-[94dvh] w-full overflow-y-auto bg-[#F7F6F1] shadow-2xl sm:max-w-3xl">
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b px-5 py-5 sm:px-7" style={{ background: '#F7F6F1', borderColor: '#D8DED8' }}>
        <div><div className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#3F6B45' }}>New procurement demand</div><h2 id="new-demand-title" className="mt-1 text-2xl font-bold" style={{ color: '#1D241F' }}>Tell farmers what you need.</h2><p className="mt-1 text-sm" style={{ color: '#687069' }}>This demand becomes visible to eligible farmers after publishing.</p></div>
        <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xl" style={{ borderColor: '#C9D1CA', color: '#52635A' }} aria-label="Close">×</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-7 px-5 py-6 sm:px-7">
        <section>
          <h3 className="text-base font-bold" style={{ color: '#1D241F' }}>Crop requirement</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label><span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#52635A' }}>Crop</span><select value={cropName} onChange={(event) => setCropName(event.target.value)} className="mt-2 w-full border px-3 py-3 text-base outline-none" style={FIELD_STYLE}>{MARKET_CROPS.map((crop) => <option key={crop.crop}>{crop.crop}</option>)}</select></label>
            <label><span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#52635A' }}>Preferred variety <span className="font-normal normal-case tracking-normal" style={{ color: '#879087' }}>(optional)</span></span><input value={variety} onChange={(event) => setVariety(event.target.value)} placeholder="For example, Nashik Red" className="mt-2 w-full border px-3 py-3 text-base outline-none" style={FIELD_STYLE} /></label>
            <label><span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#52635A' }}>Quantity needed</span><div className="relative mt-2"><input type="number" min="1" required value={quantity} onChange={(event) => setQuantity(event.target.value)} className="w-full border px-3 py-3 pr-16 text-base outline-none" style={FIELD_STYLE} /><span className="absolute right-3 top-3.5 text-sm font-semibold" style={{ color: '#687069' }}>Qtl</span></div></label>
            <label><span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#52635A' }}>Price offered per quintal</span><div className="relative mt-2"><span className="absolute left-3 top-3 font-bold" style={{ color: '#173F2A' }}>₹</span><input type="number" min="1" required value={targetPrice} onChange={(event) => setTargetPrice(event.target.value)} className="w-full border py-3 pl-8 pr-3 text-base outline-none" style={FIELD_STYLE} /></div></label>
            <label><span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#52635A' }}>Quality accepted</span><select value={gradeRequired} onChange={(event) => setGradeRequired(event.target.value)} className="mt-2 w-full border px-3 py-3 text-base outline-none" style={FIELD_STYLE}><option>Grade A only</option><option>Grade A / Grade B</option><option>Any verified grade</option></select></label>
            <label><span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#52635A' }}>Needed by</span><input type="date" required value={requiredDate} onChange={(event) => setRequiredDate(event.target.value)} className="mt-2 w-full border px-3 py-3 text-base outline-none" style={FIELD_STYLE} /></label>
          </div>
        </section>

        <section className="border-t pt-6" style={{ borderColor: '#D8DED8' }}>
          <h3 className="text-base font-bold" style={{ color: '#1D241F' }}>Collection and transport</h3>
          <label className="mt-4 block"><span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#52635A' }}>Delivery or collection hub</span><input required value={deliveryLocation} onChange={(event) => setDeliveryLocation(event.target.value)} className="mt-2 w-full border px-3 py-3 text-base outline-none" style={FIELD_STYLE} /></label>
          <div className="mt-4 grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
            <div><div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#52635A' }}>Who arranges transport?</div><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" onClick={() => setTransportProvided(true)} className="border px-3 py-3 text-sm font-bold" style={{ background: transportProvided ? '#173F2A' : '#FFFFFF', color: transportProvided ? '#FFFFFF' : '#35483B', borderColor: transportProvided ? '#173F2A' : '#C9D1CA' }}>Buyer pickup</button><button type="button" onClick={() => setTransportProvided(false)} className="border px-3 py-3 text-sm font-bold" style={{ background: !transportProvided ? '#173F2A' : '#FFFFFF', color: !transportProvided ? '#FFFFFF' : '#35483B', borderColor: !transportProvided ? '#173F2A' : '#C9D1CA' }}>Farmer delivery</button></div></div>
            <label><span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#52635A' }}>Collection radius</span><div className="relative mt-2"><input type="number" min="0" value={pickupRadius} onChange={(event) => setPickupRadius(event.target.value)} className="w-full border px-3 py-3 pr-12 text-base outline-none" style={FIELD_STYLE} /><span className="absolute right-3 top-3.5 text-sm" style={{ color: '#687069' }}>km</span></div></label>
          </div>
        </section>

        <div className="border-l-2 px-4 py-3 text-sm leading-relaxed" style={{ background: '#F2EDDF', borderColor: '#C5A15A', color: '#52635A' }}>Farmers will see the crop, quantity, price, accepted grade, location and transport responsibility. Your verified business identity is shown with the demand.</div>
        {error && <div className="border p-3 text-sm font-semibold" style={{ background: '#FEF2F2', borderColor: '#E9B8B2', color: '#9F241B' }}>{error}</div>}
        <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={onClose} className="order-2 border px-5 py-3.5 text-sm font-bold sm:order-1" style={{ borderColor: '#9EAAA1', color: '#35483B' }}>Cancel</button><button disabled={submitting} className="order-1 px-5 py-3.5 text-sm font-bold text-white disabled:opacity-50 sm:order-2" style={{ background: '#173F2A' }}>{submitting ? 'Publishing demand…' : 'Publish demand'}</button></div>
      </form>
    </div>
  </div>
}

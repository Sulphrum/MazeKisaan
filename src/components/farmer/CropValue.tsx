import { useMemo, useState } from 'react'
import type { User } from '../../types'
import { MARKET_CROPS } from './MarketOverview'
import { estimateTransportCost, SellingOptions, type SaleRequestSummary } from './SellingOptions'
import { api } from '../../services/api'

type QualityMethod = 'manual' | 'photo'
type GradeChoice = 'Grade A' | 'Grade B' | 'Grade C' | 'Not sure'
type HarvestStatus = 'Growing' | 'Ready to harvest' | 'Harvested' | 'Stored'
type TransportAccess = 'own' | 'hire'
interface CropPhoto { name: string; dataUrl: string }

const DEMAND_OUTLOOK: Record<string, { timing: string; reason: string }> = {
  Tomato: { timing: 'Demand may strengthen during the next 5–8 days.', reason: 'Nearby fresh arrivals are lower while food processors and city buyers continue to purchase regularly.' },
  Onion: { timing: 'Demand is likely to remain steady for the next 7–14 days.', reason: 'Stored onion supply is entering nearby mandis at a normal pace, so buyers have little reason to raise offers quickly.' },
  Potato: { timing: 'Demand may improve after 10–14 days.', reason: 'Current arrivals are high, but retail and food-service buying normally improves as existing market stock clears.' },
  Grapes: { timing: 'Premium demand may remain strong for the next 7–10 days.', reason: 'Exporters and large city buyers are competing for clean, evenly graded fruit.' },
  Cotton: { timing: 'Mill demand may strengthen over the next 10–15 days.', reason: 'Lower-moisture lots are receiving more interest as mills secure dependable quality.' },
}

function formatMoney(value: number) {
  return `₹${Math.max(0, Math.round(value)).toLocaleString('en-IN')}`
}

function FieldLabel({ children, optional = false }: { children: string; optional?: boolean }) {
  return <label className="mb-2 block text-xs font-bold uppercase tracking-wider" style={{ color: '#52635A' }}>{children}{optional && <span className="ml-1 font-medium normal-case tracking-normal" style={{ color: '#879087' }}>(optional)</span>}</label>
}

function prepareCropPhoto(file: File): Promise<CropPhoto> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose image files only.'))
    if (file.size > 8 * 1024 * 1024) return reject(new Error(`${file.name} is larger than 8 MB.`))
    const reader = new FileReader()
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error(`${file.name} is not a valid image.`))
      image.onload = () => {
        const maxSide = 1200
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        const context = canvas.getContext('2d')
        if (!context) return reject(new Error('Image preparation is not supported in this browser.'))
        context.fillStyle = '#FFFFFF'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve({ name: file.name, dataUrl: canvas.toDataURL('image/jpeg', 0.78) })
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

function StepProgress({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = [
    { number: 1, title: 'Crop details', note: 'Crop, quality and transport' },
    { number: 2, title: 'Buyers and mandis', note: 'Compare matching routes' },
    { number: 3, title: 'Review and sell', note: 'Costs and amount in hand' },
  ] as const

  const progressWidth = currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%'
  return <nav className="px-1 py-3 sm:px-4" aria-label={`Step ${currentStep} of 3`}>
    <div className="relative">
      <div className="absolute left-[16.66%] right-[16.66%] top-5 h-0.5" style={{ background: '#D8DED8' }}><div className="h-full transition-all duration-500" style={{ background: '#C5A15A', width: progressWidth }} /></div>
      <div className="relative grid grid-cols-3">
        {steps.map((step) => {
          const active = step.number === currentStep
          const complete = step.number < currentStep
          return <div key={step.number} className="min-w-0 text-center">
            <div className="relative z-10 mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300" style={{ background: active ? '#C5A15A' : complete ? '#173F2A' : '#FFFEFA', borderColor: active ? '#C5A15A' : complete ? '#173F2A' : '#AEB9B0', color: active ? '#173F2A' : complete ? '#FFFFFF' : '#687069' }}>
              {complete ? <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m4 10 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" /></svg> : step.number}
            </div>
            <div className="mt-3 px-1 text-xs font-bold sm:text-sm" style={{ color: active || complete ? '#173F2A' : '#687069' }}>{step.title}</div>
            <div className="mt-1 hidden text-xs sm:block" style={{ color: '#879087' }}>{step.note}</div>
          </div>
        })}
      </div>
    </div>
  </nav>
}

export function CropValue({ user, onBackToMarket, onSaleRequest, onViewSales }: { user: User; onBackToMarket: () => void; onSaleRequest: (sale: SaleRequestSummary) => void; onViewSales: () => void }) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [pendingSale, setPendingSale] = useState<SaleRequestSummary | null>(null)
  const [saleSubmitting, setSaleSubmitting] = useState(false)
  const [saleError, setSaleError] = useState('')
  const [saleSent, setSaleSent] = useState(false)
  const [cropName, setCropName] = useState('Tomato')
  const [variety, setVariety] = useState('')
  const [quantity, setQuantity] = useState('40')
  const [harvestStatus, setHarvestStatus] = useState<HarvestStatus>('Ready to harvest')
  const [location, setLocation] = useState(user.location || 'Niphad, Nashik')
  const [qualityMethod, setQualityMethod] = useState<QualityMethod>('manual')
  const [manualGrade, setManualGrade] = useState<GradeChoice>('Grade A')
  const [cropPhotos, setCropPhotos] = useState<CropPhoto[]>([])
  const [photoError, setPhotoError] = useState('')
  const [cultivationCost, setCultivationCost] = useState('28000')
  const [transportAccess, setTransportAccess] = useState<TransportAccess>('hire')
  const [formError, setFormError] = useState('')

  const selectedMarket = MARKET_CROPS.find((item) => item.crop === cropName) || MARKET_CROPS[0]
  const quantityQtl = Number(quantity) || 0
  const cultivation = Number(cultivationCost) || 0
  const hasTransportVehicle = transportAccess === 'own'
  const referenceMarketDistanceKm = 12
  const estimatedTransportCost = estimateTransportCost(referenceMarketDistanceKm, quantityQtl, hasTransportVehicle)
  const estimatedHandlingCost = Math.max(250, Math.round(quantityQtl * 20))
  const estimatedSellingCost = estimatedTransportCost + estimatedHandlingCost
  const visualGrade: GradeChoice = 'Grade B'
  const appliedGrade = qualityMethod === 'photo' ? visualGrade : manualGrade
  const gradeFactor = appliedGrade === 'Grade A' ? 1.04 : appliedGrade === 'Grade B' ? 0.96 : appliedGrade === 'Grade C' ? 0.86 : 0.92
  const fairRate = Math.round(selectedMarket.common * gradeFactor / 10) * 10
  const fairLow = Math.round(selectedMarket.min * gradeFactor / 10) * 10
  const fairHigh = Math.round(selectedMarket.max * gradeFactor / 10) * 10
  const marketValue = fairRate * quantityQtl
  const amountInHand = marketValue - estimatedSellingCost
  const profit = amountInHand - cultivation

  const forecast = useMemo(() => {
    const factors = selectedMarket.direction === 'Rising' ? [1.04, 1.09] : selectedMarket.direction === 'Falling' ? [0.92, 0.99] : [0.99, 1.04]
    const low = Math.round(fairRate * factors[0] / 10) * 10
    const high = Math.round(fairRate * factors[1] / 10) * 10
    const midpoint = Math.round((low + high) / 20) * 10
    return { low, high, value: midpoint * quantityQtl, profit: midpoint * quantityQtl - estimatedSellingCost - cultivation }
  }, [cultivation, estimatedSellingCost, fairRate, quantityQtl, selectedMarket.direction])

  const demand = DEMAND_OUTLOOK[cropName] || {
    timing: selectedMarket.direction === 'Rising' ? 'Demand may improve during the next 7–10 days.' : 'Demand is expected to remain close to its current level over the next week.',
    reason: selectedMarket.conclusion,
  }

  function generateReport() {
    if (!cropName || quantityQtl <= 0 || !location.trim() || cultivation <= 0) {
      setFormError('Please enter the crop, quantity, location and total cultivation cost.')
      return
    }
    if (qualityMethod === 'photo' && cropPhotos.length === 0) {
      setFormError('Please upload at least one clear crop photograph, or choose your own grade.')
      return
    }
    setFormError('')
    setPendingSale(null)
    setSaleSent(false)
    setCurrentStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function addCropPhotos(files: FileList | null) {
    if (!files?.length) return
    setPhotoError('')
    const availableSlots = 4 - cropPhotos.length
    if (availableSlots <= 0) {
      setPhotoError('You can upload up to four crop photographs.')
      return
    }
    try {
      const prepared = await Promise.all(Array.from(files).slice(0, availableSlots).map(prepareCropPhoto))
      setCropPhotos((current) => [...current, ...prepared].slice(0, 4))
      if (files.length > availableSlots) setPhotoError('Only the first four photographs were added.')
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'One of the photographs could not be prepared.')
    }
  }

  function reviewSale(sale: SaleRequestSummary) {
    setPendingSale(sale)
    setSaleError('')
    setSaleSent(false)
    setCurrentStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function confirmSale() {
    if (!pendingSale) return
    setSaleSubmitting(true)
    setSaleError('')
    try {
      if (pendingSale.negotiation) await api.demands.submitNegotiation(pendingSale.negotiation)
      onSaleRequest(pendingSale)
      setSaleSent(true)
    } catch (error) {
      setSaleError(error instanceof Error ? error.message : 'The sale request could not be sent. Please try again.')
    } finally {
      setSaleSubmitting(false)
    }
  }

  if (currentStep > 1) {
    const growing = harvestStatus === 'Growing'
    const selectedGross = pendingSale ? pendingSale.price * pendingSale.quantityQtl : 0
    const selectedTransport = pendingSale?.transportCost || 0
    const selectedHandling = pendingSale?.handlingCost || 0
    const selectedMarketCharge = pendingSale?.marketCharge || 0
    const selectedAmountInHand = pendingSale?.amountInHand ?? (selectedGross - selectedTransport - selectedHandling - selectedMarketCharge)
    const selectedCultivation = pendingSale ? cultivation * (pendingSale.quantityQtl / Math.max(1, quantityQtl)) : cultivation
    const selectedProfit = pendingSale?.profit ?? (selectedAmountInHand - selectedCultivation)
    return (
      <div className="crop-value-page space-y-8">
        <button onClick={() => { setCurrentStep(currentStep === 3 ? 2 : 1); setSaleError(''); setSaleSent(false) }} className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: '#173F2A' }}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" /></svg>
          {currentStep === 3 ? 'Previous: buyers and mandis' : 'Previous: crop details'}
        </button>

        <StepProgress currentStep={currentStep} />

        <header>
          <div className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#3F6B45' }}>{currentStep === 2 ? 'Choose where to sell' : 'Final sale overview'}</div>
          <h2 className="mt-2 text-4xl font-bold" style={{ color: '#1D241F' }}>{currentStep === 2 ? `Compare buyers and mandis for your ${cropName.toLowerCase()}.` : 'Review every rupee before you continue.'}</h2>
          <p className="mt-3 max-w-3xl text-base leading-relaxed" style={{ color: '#687069' }}>{currentStep === 2 ? 'Private buyers are shown first, followed by nearby mandis. Choose one route to see the complete final calculation.' : 'Check your crop details, deductions and expected amount in hand before sending the sale request.'}</p>
        </header>

        {currentStep === 3 && <>
          <section className="grid overflow-hidden border lg:grid-cols-[1.35fr_1fr]" style={{ background: '#173F2A', borderColor: '#173F2A' }}>
            <div className="p-7 sm:p-9">
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#C5A15A' }}>{growing ? 'Expected value at harvest' : 'Estimated market value today'}</div>
              <div className="mt-3 text-4xl font-bold text-white">{formatMoney(marketValue)}</div>
              <p className="mt-4 text-lg leading-relaxed" style={{ color: '#D6E3DA' }}>Your {quantityQtl} quintals of {appliedGrade} {cropName.toLowerCase()} may currently sell for about {formatMoney(fairRate)} per quintal.</p>
              {growing && <p className="mt-3 text-sm leading-relaxed" style={{ color: '#C5A15A' }}>This crop is still growing, so this is a future estimate—not a price available for immediate sale.</p>}
            </div>
            <div className="grid grid-cols-2 border-t lg:grid-cols-1 lg:border-l lg:border-t-0" style={{ borderColor: 'rgba(255,255,255,0.16)' }}>
              <div className="p-5"><div className="text-xs uppercase tracking-wider" style={{ color: '#AFC5B7' }}>Estimated money in hand via nearby market</div><div className="mt-2 text-2xl font-bold text-white">{formatMoney(amountInHand)}</div><div className="mt-1 text-xs" style={{ color: '#AFC5B7' }}>After estimated transport and handling</div></div>
              <div className="border-l p-5 lg:border-l-0 lg:border-t" style={{ borderColor: 'rgba(255,255,255,0.16)' }}><div className="text-xs uppercase tracking-wider" style={{ color: '#AFC5B7' }}>Estimated profit</div><div className="mt-2 text-2xl font-bold" style={{ color: profit >= 0 ? '#F4D991' : '#FFB4AA' }}>{profit >= 0 ? '+' : '−'}{formatMoney(Math.abs(profit))}</div><div className="mt-1 text-xs" style={{ color: '#AFC5B7' }}>After cultivation, transport and handling</div></div>
            </div>
          </section>



          <section>
            <h3 className="text-2xl font-bold" style={{ color: '#1D241F' }}>Possible price and profit over the next week</h3>
            <p className="mt-2 text-base" style={{ color: '#687069' }}>This is a prediction range, not a guaranteed future price.</p>
            <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="border p-6" style={{ background: '#EEE9DB', borderColor: 'rgba(29,36,31,0.13)' }}>
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#687069' }}>Expected 7-day price</div>
                <div className="mt-3 text-3xl font-bold" style={{ color: '#173F2A' }}>{formatMoney(forecast.low)}–{formatMoney(forecast.high)}<span className="ml-1 text-sm font-medium" style={{ color: '#687069' }}>/Qtl</span></div>
                <div className="mt-5 grid grid-cols-2 gap-3"><div><div className="text-xs" style={{ color: '#687069' }}>Potential crop value</div><div className="mt-1 text-lg font-bold">{formatMoney(forecast.value)}</div></div><div><div className="text-xs" style={{ color: '#687069' }}>Potential profit</div><div className="mt-1 text-lg font-bold" style={{ color: '#173F2A' }}>{forecast.profit >= 0 ? '+' : '−'}{formatMoney(Math.abs(forecast.profit))}</div></div></div>
              </div>
              <div className="border p-6" style={{ background: '#FFFEFA', borderColor: 'rgba(29,36,31,0.13)' }}>
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#3F6B45' }}>Why the price may change</div>
                <p className="mt-3 text-lg leading-relaxed" style={{ color: '#1D241F' }}>{selectedMarket.direction === 'Rising' ? `${cropName} prices may improve slightly if present demand continues.` : selectedMarket.direction === 'Falling' ? `${cropName} prices may remain under pressure while arrivals stay high.` : `${cropName} prices are likely to stay close to their current level.`}</p>
                <p className="mt-3 text-base leading-relaxed" style={{ color: '#687069' }}>{selectedMarket.conclusion}</p>
              </div>
            </div>
          </section>


        </>}

        {currentStep === 2 && <SellingOptions
          user={user}
          cropName={cropName}
          variety={variety}
          quantityQtl={quantityQtl}
          grade={appliedGrade}
          fairLow={fairLow}
          fairHigh={fairHigh}
          fairRate={fairRate}
          cultivationCost={cultivation}
          hasTransportVehicle={hasTransportVehicle}
          harvestStatus={harvestStatus}
          location={location}
          cropImages={cropPhotos.map((photo) => photo.dataUrl)}
          onSaleRequest={reviewSale}
          onViewSales={onViewSales}
        />}

        {currentStep === 2 && <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'rgba(29,36,31,0.13)' }}>
          <button type="button" onClick={() => { setCurrentStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="inline-flex items-center justify-center gap-2 border px-5 py-3 text-sm font-bold" style={{ borderColor: '#9EAAA1', color: '#35483B', background: '#FFFEFA' }}><svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 4-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>Previous: crop details</button>
          <p className="max-w-md text-sm leading-relaxed sm:text-right" style={{ color: '#687069' }}>To continue, choose a private buyer or open a mandi and select it for final review.</p>
        </div>}

        {currentStep === 3 && <>


          {pendingSale ? <section className="overflow-hidden border" style={{ background: '#FFFEFA', borderColor: '#B8C8BB' }}>
            <div className="border-b p-6 sm:p-7" style={{ background: '#F1F5EE', borderColor: '#C8D6CB' }}>
              <div className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: '#3F6B45' }}>Your final sale summary</div>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div><h3 className="text-2xl font-bold" style={{ color: '#1D241F' }}>{pendingSale.buyer}</h3><p className="mt-1 text-sm" style={{ color: '#687069' }}>{pendingSale.routeType === 'mandi' ? 'Nearby mandi route' : 'Private buyer'} · {pendingSale.deliveryText}</p></div>
                <div className="sm:text-right"><div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#687069' }}>Expected amount in hand</div><div className="mt-1 text-3xl font-bold" style={{ color: '#173F2A' }}>{formatMoney(selectedAmountInHand)}</div></div>
              </div>
            </div>

            <div className="grid gap-7 p-6 sm:p-7 lg:grid-cols-2">
              <div>
                <h4 className="text-lg font-bold" style={{ color: '#1D241F' }}>Details you entered</h4>
                <dl className="mt-4 divide-y border text-sm" style={{ borderColor: '#E1E6E1' }}>
                  <div className="flex justify-between gap-4 px-4 py-3"><dt style={{ color: '#687069' }}>Crop</dt><dd className="text-right font-bold">{cropName}{variety ? ` · ${variety}` : ''}</dd></div>
                  <div className="flex justify-between gap-4 px-4 py-3"><dt style={{ color: '#687069' }}>Quantity for this sale</dt><dd className="font-bold">{pendingSale.quantityQtl} Qtl</dd></div>
                  <div className="flex justify-between gap-4 px-4 py-3"><dt style={{ color: '#687069' }}>Quality used</dt><dd className="font-bold">{appliedGrade}</dd></div>
                  <div className="flex justify-between gap-4 px-4 py-3"><dt style={{ color: '#687069' }}>Harvest status</dt><dd className="font-bold">{harvestStatus}</dd></div>
                  <div className="flex justify-between gap-4 px-4 py-3"><dt style={{ color: '#687069' }}>Crop location</dt><dd className="text-right font-bold">{location}</dd></div>
                  <div className="flex justify-between gap-4 px-4 py-3"><dt style={{ color: '#687069' }}>Transport</dt><dd className="text-right font-bold">{pendingSale.deliveryText || (hasTransportVehicle ? 'Own vehicle' : 'Hired vehicle')}</dd></div>
                </dl>
              </div>

              <div>
                <h4 className="text-lg font-bold" style={{ color: '#1D241F' }}>Money calculation</h4>
                <dl className="mt-4 divide-y border text-sm" style={{ borderColor: '#E1E6E1' }}>
                  <div className="flex justify-between gap-4 px-4 py-3"><dt style={{ color: '#687069' }}>{pendingSale.quantityQtl} Qtl × {formatMoney(pendingSale.price)}</dt><dd className="font-bold">{formatMoney(selectedGross)}</dd></div>
                  <div className="flex justify-between gap-4 px-4 py-3"><dt style={{ color: '#687069' }}>Transport</dt><dd className="font-bold">−{formatMoney(selectedTransport)}</dd></div>
                  <div className="flex justify-between gap-4 px-4 py-3"><dt style={{ color: '#687069' }}>Loading and handling</dt><dd className="font-bold">−{formatMoney(selectedHandling)}</dd></div>
                  {selectedMarketCharge > 0 && <div className="flex justify-between gap-4 px-4 py-3"><dt style={{ color: '#687069' }}>Mandi charges</dt><dd className="font-bold">−{formatMoney(selectedMarketCharge)}</dd></div>}
                  <div className="flex justify-between gap-4 px-4 py-3" style={{ background: '#F1F5EE' }}><dt className="font-bold" style={{ color: '#294E36' }}>Expected amount in hand</dt><dd className="text-lg font-bold" style={{ color: '#173F2A' }}>{formatMoney(selectedAmountInHand)}</dd></div>
                  <div className="flex justify-between gap-4 px-4 py-3"><dt style={{ color: '#687069' }}>Cultivation cost for this quantity</dt><dd className="font-bold">−{formatMoney(selectedCultivation)}</dd></div>
                  <div className="flex justify-between gap-4 px-4 py-3"><dt className="font-bold">Expected profit</dt><dd className="text-lg font-bold" style={{ color: selectedProfit >= 0 ? '#216644' : '#9F241B' }}>{selectedProfit >= 0 ? '+' : '−'}{formatMoney(Math.abs(selectedProfit))}</dd></div>
                </dl>
              </div>
            </div>

            <div className="border-t p-6 sm:p-7" style={{ borderColor: '#E1E6E1' }}>
              {saleError && <div className="mb-4 border p-4 text-sm font-semibold" style={{ background: '#FEF2F2', borderColor: '#F1B8B2', color: '#9F241B' }}>{saleError}</div>}
              {saleSent ? <div className="flex flex-col gap-4 border p-5 sm:flex-row sm:items-center sm:justify-between" style={{ background: '#F1F5EE', borderColor: '#BED0C2' }}><div><div className="font-bold" style={{ color: '#173F2A' }}>{pendingSale.routeType === 'mandi' ? 'Mandi plan saved.' : 'Sale request sent to the buyer.'}</div><p className="mt-1 text-sm leading-relaxed" style={{ color: '#52635A' }}>{pendingSale.routeType === 'mandi' ? 'Contact the mandi before dispatch and confirm auction timing.' : 'Your crop remains under your control until the buyer confirms and payment protection is ready.'}</p></div><button type="button" onClick={onViewSales} className="border px-5 py-3 text-sm font-bold" style={{ borderColor: '#173F2A', color: '#173F2A' }}>View My Sales</button></div> : <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => { setCurrentStep(2); setPendingSale(null); setSaleError('') }} className="order-2 border px-5 py-3.5 text-sm font-bold sm:order-1" style={{ borderColor: '#9EAAA1', color: '#35483B' }}>Previous: buyers and mandis</button>
                <button type="button" onClick={confirmSale} disabled={saleSubmitting || growing} className="order-1 px-5 py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 sm:order-2" style={{ background: '#173F2A' }}>{saleSubmitting ? 'Sending…' : pendingSale.routeType === 'mandi' ? 'Save mandi selling plan' : 'Send sale request'}</button>
              </div>}
              {!saleSent && <p className="mt-3 text-center text-xs leading-relaxed" style={{ color: '#7A827B' }}>{pendingSale.routeType === 'mandi' ? 'This saves a selling plan; it does not book an auction or mark the crop as sold.' : 'The buyer must still confirm the quantity, quality, pickup and payment protection.'}</p>}
            </div>
          </section> : <div className="border p-6 text-center" style={{ background: '#FFF8ED', borderColor: '#E9CCA0', color: '#765B2E' }}><p className="font-semibold">Choose a buyer or mandi before reviewing the final sale.</p><button type="button" onClick={() => setCurrentStep(2)} className="mt-4 border px-5 py-2.5 text-sm font-bold" style={{ borderColor: '#765B2E' }}>Back to selling options</button></div>}

          <div className="border-t pt-5 text-sm leading-relaxed" style={{ borderColor: 'rgba(29,36,31,0.13)', color: '#687069' }}>Market prices, demand and visual grades are estimates. Final earnings depend on physical quality, moisture, weighing, deductions and the actual selling agreement.</div>
        </>}
      </div>
    )
  }

  return (
    <div className="crop-value-page space-y-8">
      <header>
        <button onClick={onBackToMarket} className="mb-5 inline-flex items-center gap-2 text-sm font-bold" style={{ color: '#173F2A' }}><svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" /></svg>Back to market</button>
        <StepProgress currentStep={1} />

        <div className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#3F6B45', paddingTop: '20px' }}>Value and sell</div>
        <h2 className="mt-2 text-4xl font-bold" style={{ color: '#1D241F' }}>Tell us about the crop you want to sell.</h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed" style={{ color: '#687069' }}>Enter the crop, quality and transport details once. Nothing is sent to a buyer at this step.</p>
      </header>


      <section className="border p-5 sm:p-7" style={{ background: '#FFFEFA', borderColor: 'rgba(29,36,31,0.13)' }}>
        <h3 className="text-2xl font-bold" style={{ color: '#1D241F' }}>Tell us about the crop</h3>
        <p className="mt-2 text-base" style={{ color: '#687069' }}>The crop, quantity and harvest stage determine which market value is relevant.</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div><FieldLabel>Crop</FieldLabel><select value={cropName} onChange={(event) => setCropName(event.target.value)} className="w-full border px-3 py-3 text-base outline-none" style={{ borderColor: '#D8DDD7' }}>{MARKET_CROPS.map((item) => <option key={item.crop}>{item.crop}</option>)}</select></div>
          <div><FieldLabel optional>Variety</FieldLabel><input value={variety} onChange={(event) => setVariety(event.target.value)} placeholder="For example, Nashik Red" className="w-full border px-3 py-3 text-base outline-none" style={{ borderColor: '#D8DDD7' }} /></div>
          <div><FieldLabel>Quantity in quintals</FieldLabel><input type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="w-full border px-3 py-3 text-base outline-none" style={{ borderColor: '#D8DDD7' }} /></div>
          <div><FieldLabel>Harvest status</FieldLabel><select value={harvestStatus} onChange={(event) => setHarvestStatus(event.target.value as HarvestStatus)} className="w-full border px-3 py-3 text-base outline-none" style={{ borderColor: '#D8DDD7' }}>{['Growing', 'Ready to harvest', 'Harvested', 'Stored'].map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="sm:col-span-2"><FieldLabel>Crop location</FieldLabel><input value={location} onChange={(event) => setLocation(event.target.value)} className="w-full border px-3 py-3 text-base outline-none" style={{ borderColor: '#D8DDD7' }} /></div>
        </div>
      </section>

      <section className="border p-5 sm:p-7" style={{ background: '#FFFEFA', borderColor: 'rgba(29,36,31,0.13)' }}>
        <h3 className="text-2xl font-bold" style={{ color: '#1D241F' }}>Choose how to describe quality</h3>
        <p className="mt-2 text-base" style={{ color: '#687069' }}>Use your own grade, or upload photographs for an approximate visual estimate.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <button onClick={() => setQualityMethod('manual')} className="border p-5 text-left" style={{ background: qualityMethod === 'manual' ? '#F1F5EE' : '#fff', borderColor: qualityMethod === 'manual' ? '#3F6B45' : '#D8DDD7' }}><div className="text-lg font-bold" style={{ color: '#1D241F' }}>I will choose the grade</div><p className="mt-2 text-sm leading-relaxed" style={{ color: '#687069' }}>Use this when you already understand your crop quality.</p></button>
          <button onClick={() => setQualityMethod('photo')} className="border p-5 text-left" style={{ background: qualityMethod === 'photo' ? '#F1F5EE' : '#fff', borderColor: qualityMethod === 'photo' ? '#3F6B45' : '#D8DDD7' }}><div className="text-lg font-bold" style={{ color: '#1D241F' }}>Estimate from photographs</div><p className="mt-2 text-sm leading-relaxed" style={{ color: '#687069' }}>Get a provisional visual grade. It is not a confirmed physical assay.</p></button>
        </div>

        {qualityMethod === 'manual' ? <div className="mt-5 max-w-md"><FieldLabel>Farmer-reported grade</FieldLabel><select value={manualGrade} onChange={(event) => setManualGrade(event.target.value as GradeChoice)} className="w-full border px-3 py-3 text-base outline-none" style={{ borderColor: '#D8DDD7' }}>{['Grade A', 'Grade B', 'Grade C', 'Not sure'].map((item) => <option key={item}>{item}</option>)}</select></div> : <div className="mt-5 border p-5" style={{ background: '#F1F5EE', borderColor: '#BED0C2' }}><div className="text-sm font-bold" style={{ color: '#294E36' }}>The crop photographs below will be used for the approximate visual grade.</div><p className="mt-1 text-sm leading-relaxed" style={{ color: '#687069' }}>This remains a provisional estimate until the crop is physically checked.</p></div>}
      </section>

      <section className="border p-5 sm:p-7" style={{ background: '#FFFEFA', borderColor: 'rgba(29,36,31,0.13)' }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><h3 className="text-2xl font-bold" style={{ color: '#1D241F' }}>Add crop photographs</h3><p className="mt-2 max-w-2xl text-base leading-relaxed" style={{ color: '#687069' }}>Show buyers the actual crop lot. Add a wide photo, a close-up and any visible quality differences.</p></div>
          <span className="w-fit border px-3 py-1 text-xs font-bold uppercase tracking-wider" style={{ background: '#F1F5EE', borderColor: '#BED0C2', color: '#3F6B45' }}>{cropPhotos.length}/4 added</span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cropPhotos.map((photo, index) => <div key={`${photo.name}-${index}`} className="relative overflow-hidden border" style={{ borderColor: '#C8D1C9', background: '#F3F5F1' }}>
            <img src={photo.dataUrl} alt={`${cropName} crop photo ${index + 1}`} className="h-40 w-full object-cover" />
            <div className="flex items-center justify-between gap-2 border-t px-3 py-2" style={{ borderColor: '#D8DED8', background: '#FFFEFA' }}><span className="min-w-0 truncate text-xs font-semibold" style={{ color: '#52635A' }}>{photo.name}</span><button type="button" onClick={() => setCropPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index))} className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border" aria-label={`Remove ${photo.name}`} style={{ borderColor: '#D8DED8', color: '#765B2E' }}><svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 5l10 10M15 5 5 15" strokeLinecap="round" /></svg></button></div>
          </div>)}
          {cropPhotos.length < 4 && <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center border border-dashed px-5 py-8 text-center" style={{ background: '#F8FAF7', borderColor: '#8FA99A' }}>
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="#3F6B45" strokeWidth="1.8"><path d="M4 16.5V19h16v-2.5M12 4v11m0-11L8 8m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" /><rect x="4" y="3" width="16" height="16" rx="2" opacity="0.18" /></svg>
            <span className="mt-3 text-sm font-bold" style={{ color: '#173F2A' }}>Upload crop photos</span><span className="mt-1 text-xs leading-relaxed" style={{ color: '#687069' }}>JPG, PNG or HEIC · up to 8 MB each</span>
            <input type="file" accept="image/*" multiple onChange={(event) => { void addCropPhotos(event.target.files); event.currentTarget.value = '' }} className="sr-only" />
          </label>}
        </div>
        {photoError && <div className="mt-4 border p-3 text-sm font-semibold" style={{ background: '#FFF4ED', borderColor: '#E7B998', color: '#81421F' }}>{photoError}</div>}
        <p className="mt-4 text-sm leading-relaxed" style={{ color: '#687069' }}>These photographs are compressed before upload and shared only with the buyer selected in Step 2. Photos are optional unless you choose photo-based quality estimation.</p>
      </section>

      <section className="border p-5 sm:p-7" style={{ background: '#FFFEFA', borderColor: 'rgba(29,36,31,0.13)' }}>
        <h3 className="text-2xl font-bold" style={{ color: '#1D241F' }}>Cost and transport details</h3>
        <p className="mt-2 text-base" style={{ color: '#687069' }}>Enter your total cultivation cost and tell us whether you have a vehicle. माझे Kisan will calculate transport for every buyer and mandi using its distance.</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div><FieldLabel>Total cultivation cost</FieldLabel><div className="relative"><span className="absolute left-3 top-3 font-bold" style={{ color: '#173F2A' }}>₹</span><input type="number" min="1" value={cultivationCost} onChange={(event) => setCultivationCost(event.target.value)} className="w-full border py-3 pl-8 pr-3 text-base outline-none" style={{ borderColor: '#D8DDD7' }} /></div></div>
          <div>
            <FieldLabel>Do you have a transport vehicle?</FieldLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setTransportAccess('own')} className="border p-4 text-left" style={{ background: transportAccess === 'own' ? '#F1F5EE' : '#FFFFFF', borderColor: transportAccess === 'own' ? '#3F6B45' : '#D8DDD7' }}><div className="font-bold" style={{ color: '#1D241F' }}>Yes, I have a vehicle</div><p className="mt-1 text-sm leading-relaxed" style={{ color: '#687069' }}>We estimate fuel and operating cost from the travel distance.</p></button>
              <button type="button" onClick={() => setTransportAccess('hire')} className="border p-4 text-left" style={{ background: transportAccess === 'hire' ? '#F1F5EE' : '#FFFFFF', borderColor: transportAccess === 'hire' ? '#3F6B45' : '#D8DDD7' }}><div className="font-bold" style={{ color: '#1D241F' }}>No, I will need transport</div><p className="mt-1 text-sm leading-relaxed" style={{ color: '#687069' }}>We estimate a hired vehicle cost from the travel distance.</p></button>
            </div>
          </div>
        </div>
      </section>

      {formError && <div className="border p-4 text-sm font-semibold" style={{ background: '#FEF2F2', borderColor: '#F1B8B2', color: '#9F241B' }}>{formError}</div>}

      <button onClick={generateReport} className="flex w-full items-center justify-center gap-2 px-5 py-4 text-base font-bold text-white" style={{ background: '#173F2A' }}>Next: buyers and mandis<svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="m8 4 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
      <p className="text-center text-sm leading-relaxed" style={{ color: '#687069' }}>माझे Kisan calculates a fair estimate first, then compares relevant buyer and mandi options. Entering these details does not commit you to a sale.</p>
    </div>
  )
}

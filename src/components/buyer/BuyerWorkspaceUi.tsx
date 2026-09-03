import type { NegotiationBid, ProcurementDemand } from '../../types'

export const money = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`

export function formatDate(value?: string) {
  if (!value) return 'Not specified'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export type BuyerIconName = 'overview' | 'demand' | 'response' | 'account' | 'plus' | 'refresh' | 'check' | 'close' | 'crop' | 'calendar' | 'location' | 'truck'

export function BuyerIcon({ name, className = 'w-5 h-5' }: { name: BuyerIconName; className?: string }) {
  const paths = {
    overview: <><path d="M4 13h6V4H4v9Zm10 7h6v-9h-6v9ZM4 20h6v-3H4v3Zm10-13h6V4h-6v3Z" /></>,
    demand: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    response: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.7-3.7 2.5-5.5 5.5-5.5s4.8 1.8 5.5 5.5M16 9h5m-2.5-2.5V11.5" /></>,
    account: <><circle cx="12" cy="8" r="3" /><path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    refresh: <><path d="M20 7v5h-5" /><path d="M19 12a7 7 0 1 0-2 5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    crop: <><path d="M12 21V9" /><path d="M12 13C7 13 4 10 4 5c5 0 8 3 8 8ZM12 9c0-4 3-7 8-7 0 5-3 8-8 8" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    truck: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
  }
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export function BuyerStatus({ value, label }: { value: string; label?: string }) {
  const style = value === 'Accepted' || value === 'Active'
    ? { background: '#EAF5EE', borderColor: '#BDD5C5', color: '#216644' }
    : value === 'Rejected' || value === 'Expired'
      ? { background: '#FEF2F2', borderColor: '#E9B8B2', color: '#9F241B' }
      : { background: '#FFF8ED', borderColor: '#E8C98F', color: '#765B2E' }
  return <span className="inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={style}>{label || value}</span>
}

export function BuyerDemandCard({ demand }: { demand: ProcurementDemand }) {
  return <article className="rounded-2xl border bg-white p-5" style={{ borderColor: '#E2EBE5' }}>
    <div className="flex items-start justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#238B5B' }}>Procurement demand</div><h3 className="mt-1 text-xl font-bold">{demand.cropName}</h3><p className="mt-1 text-xs" style={{ color: '#66736C' }}>{demand.variety}</p></div><BuyerStatus value={demand.status} /></div>
    <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl p-3" style={{ background: '#F7F6F1' }}><div><div className="text-[10px]" style={{ color: '#66736C' }}>Quantity</div><strong className="mt-0.5 block text-sm">{demand.quantityQtlNeeded} Qtl</strong></div><div><div className="text-[10px]" style={{ color: '#66736C' }}>Price</div><strong className="mt-0.5 block text-sm">{money(demand.targetPriceNumeric)}</strong></div><div><div className="text-[10px]" style={{ color: '#66736C' }}>Responses</div><strong className="mt-0.5 block text-sm">{demand.responsesCount}</strong></div></div>
    <div className="mt-4 space-y-2 text-xs leading-relaxed" style={{ color: '#52635A' }}><div className="flex gap-2"><BuyerIcon name="calendar" className="mt-0.5 h-4 w-4 shrink-0" />Needed by {formatDate(demand.requiredByDate)}</div><div className="flex gap-2"><BuyerIcon name="location" className="mt-0.5 h-4 w-4 shrink-0" />{demand.deliveryLocation}</div><div className="flex gap-2"><BuyerIcon name="truck" className="mt-0.5 h-4 w-4 shrink-0" />{demand.transportProvidedByBuyer ? `Buyer pickup · ${demand.pickupDistanceKm} km radius` : 'Farmer delivery to hub'}</div></div>
    <div className="mt-4 border-l-2 px-3 py-2 text-xs" style={{ background: '#FFF8ED', borderColor: '#F4C44E', color: '#7A5310' }}>{demand.gradeRequired}</div>
  </article>
}

export function BuyerResponseCard({ response, onOpen }: { response: NegotiationBid; onOpen: () => void }) {
  return <article className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: '#E2EBE5' }}>
    {response.cropImages?.[0] ? <img src={response.cropImages[0]} alt={`${response.cropName} offered by ${response.senderName}`} className="h-40 w-full object-cover" /> : <div className="flex h-28 items-center justify-center" style={{ background: '#EAF5EE', color: '#238B5B' }}><BuyerIcon name="crop" className="h-10 w-10" /></div>}
    <div className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold">{response.cropName}</h3><p className="mt-1 text-xs" style={{ color: '#66736C' }}>{response.senderName} · {response.cropLocation || response.farmerAccountLocation || 'Location not supplied'}</p></div><BuyerStatus value={response.status} /></div>
      <div className="mt-4 grid grid-cols-3 gap-2 border-y py-3 text-xs" style={{ borderColor: '#E2EBE5' }}><div><span style={{ color: '#66736C' }}>Quantity</span><strong className="mt-1 block">{response.requestedQuantityQtl} Qtl</strong></div><div><span style={{ color: '#66736C' }}>Price</span><strong className="mt-1 block">{money(response.counterPricePerQtl)}</strong></div><div><span style={{ color: '#66736C' }}>Grade</span><strong className="mt-1 block">{response.cropGrade || 'Not stated'}</strong></div></div>
      <button type="button" onClick={onOpen} className="mt-4 w-full rounded-xl border px-4 py-2.5 text-xs font-bold" style={{ borderColor: '#063B2A', color: '#063B2A' }}>{response.status === 'Pending' ? 'Review farmer response' : 'View details'}</button>
    </div>
  </article>
}

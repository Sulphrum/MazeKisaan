import { useCallback, useEffect, useMemo, useState } from 'react'
import type { NegotiationBid, ProcurementDemand, User } from '../../types'
import { api } from '../../services/api'
import { NegotiationChat } from '../common/NegotiationChat'

function money(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

function statusStyle(status: NegotiationBid['status']) {
  if (status === 'Accepted') return { background: '#E8F4EA', color: '#216644', label: 'Buyer approved' }
  if (status === 'Rejected') return { background: '#FCECEA', color: '#9F241B', label: 'Not approved' }
  if (status === 'Countered') return { background: '#FFF2C8', color: '#76520B', label: 'New price offered' }
  return { background: '#FFF2C8', color: '#76520B', label: 'Waiting for buyer' }
}

export function FarmerNegotiations({ user }: { user: User }) {
  const [conversations, setConversations] = useState<NegotiationBid[]>([])
  const [demands, setDemands] = useState<ProcurementDemand[]>([])
  const [selected, setSelected] = useState<NegotiationBid | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    setError('')
    try {
      const [nextConversations, nextDemands] = await Promise.all([api.demands.getNegotiations(), api.demands.getAll()])
      setConversations(nextConversations)
      setDemands(nextDemands)
      setSelected((current) => current ? nextConversations.find((item) => item.id === current.id) || current : null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Buyer conversations could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const refresh = () => void load(true)
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [load, user.id])

  const sorted = useMemo(() => [...conversations].sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()), [conversations])

  function buyerName(item: NegotiationBid) {
    if (item.senderRole === 'buyer') return item.senderName
    return item.targetName || demands.find((demand) => demand.id === item.demandId)?.buyerCompany || 'Selected buyer'
  }

  async function sendMessage(message: string) {
    if (!selected) return
    setSending(true)
    try {
      const updated = await api.demands.sendNegotiationMessage(selected.id, message)
      setConversations((current) => current.map((item) => item.id === updated.id ? updated : item))
      setSelected(updated)
    } finally {
      setSending(false)
    }
  }

  if (loading) return <section className="rounded-2xl border bg-white p-5 text-sm" style={{ borderColor: '#E2EBE5', color: '#687069' }}>Loading buyer conversations…</section>

  return <>
    <section className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: '#DDE6DF' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#3F6B45' }}>Negotiations</div>
          <h3 className="mt-1 text-xl font-bold" style={{ color: '#1D241F' }}>Buyer conversations</h3>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: '#687069' }}>Continue the conversation with the buyer you selected. Confirm the final terms before sending your crop.</p>
        </div>
        <button type="button" onClick={() => void load()} className="shrink-0 rounded-xl border px-3 py-2 text-xs font-bold" style={{ borderColor: '#173F2A', color: '#173F2A' }}>Refresh</button>
      </div>

      {error && <div className="mt-4 rounded-xl px-4 py-3 text-xs font-semibold" style={{ background: '#FCECEA', color: '#9F241B' }}>{error}</div>}
      {!sorted.length && !error ? <div className="mt-5 rounded-xl border border-dashed px-5 py-7 text-center" style={{ borderColor: '#C8D5CD' }}><p className="text-sm font-bold" style={{ color: '#35483B' }}>No buyer conversation yet.</p><p className="mt-1 text-xs" style={{ color: '#687069' }}>Choose a buyer in Value & Sell and send your offer. It will appear here.</p></div> : <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {sorted.map((item) => {
          const style = statusStyle(item.status)
          const messages = item.messages?.length || (item.note ? 1 : 0)
          return <button key={item.id} type="button" onClick={() => setSelected(item)} className="rounded-xl border p-4 text-left transition hover:shadow-md" style={{ borderColor: '#DDE6DF', background: '#FFFEFA' }}>
            <div className="flex items-start justify-between gap-3"><div><div className="text-xs font-bold" style={{ color: '#3F6B45' }}>{buyerName(item)}</div><div className="mt-1 text-lg font-bold" style={{ color: '#1D241F' }}>{item.cropName} · {item.requestedQuantityQtl} Qtl</div></div><span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: style.background, color: style.color }}>{style.label}</span></div>
            <div className="mt-4 flex items-end justify-between gap-3"><div><div className="text-[10px] uppercase tracking-wider" style={{ color: '#879087' }}>Your price</div><div className="mt-0.5 font-bold" style={{ color: '#173F2A' }}>{money(item.counterPricePerQtl)} / Qtl</div></div><div className="text-right text-xs font-bold" style={{ color: '#3F6B45' }}>{messages} message{messages === 1 ? '' : 's'} · Open chat</div></div>
          </button>
        })}
      </div>}
    </section>

    {selected && <div className="fixed inset-0 z-[130] flex items-end justify-center sm:items-center sm:p-5">
      <button type="button" className="absolute inset-0 bg-[#102018]/60 backdrop-blur-[2px]" onClick={() => setSelected(null)} aria-label="Close conversation" />
      <div role="dialog" aria-modal="true" aria-labelledby="farmer-chat-title" className="relative max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-white px-5 py-5 sm:px-7" style={{ borderColor: '#E2EBE5' }}><div><div className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#3F6B45' }}>Buyer negotiation</div><h3 id="farmer-chat-title" className="mt-1 text-2xl font-bold" style={{ color: '#1D241F' }}>{buyerName(selected)}</h3><p className="mt-1 text-xs" style={{ color: '#687069' }}>{selected.cropName} · {selected.requestedQuantityQtl} Qtl · {money(selected.counterPricePerQtl)}/Qtl</p></div><button type="button" onClick={() => setSelected(null)} className="flex h-9 w-9 items-center justify-center rounded-full border text-xl" style={{ borderColor: '#D5DED8', color: '#687069' }} aria-label="Close">×</button></div>
        <div className="space-y-4 px-5 py-6 sm:px-7">
          <div className="flex flex-wrap items-center gap-2"><span className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: statusStyle(selected.status).background, color: statusStyle(selected.status).color }}>{statusStyle(selected.status).label}</span><span className="text-xs" style={{ color: '#687069' }}>{selected.deliveryTerms}</span></div>
          {selected.decisionNote && <div className="rounded-xl px-4 py-3 text-xs leading-relaxed" style={{ background: selected.status === 'Accepted' ? '#E8F4EA' : '#FCECEA', color: selected.status === 'Accepted' ? '#216644' : '#9F241B' }}><strong>Buyer note:</strong> {selected.decisionNote}</div>}
          <NegotiationChat conversation={selected} currentUserId={user.id} sending={sending} onSend={sendMessage} />
          <p className="text-center text-[10px] leading-relaxed" style={{ color: '#879087' }}>Do not dispatch until quantity, physical quality, pickup and protected payment are confirmed.</p>
        </div>
      </div>
    </div>}
  </>
}

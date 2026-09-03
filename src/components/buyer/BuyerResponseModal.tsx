import { useEffect, useState } from 'react'
import type { NegotiationBid, ProcurementDemand } from '../../types'
import { BuyerIcon, BuyerStatus, formatDate, money } from './BuyerWorkspaceUi'
import { NegotiationChat } from '../common/NegotiationChat'

export function BuyerResponseModal({ response, demand, currentUserId, busy, messageBusy, onClose, onDecision, onSendMessage }: {
  response: NegotiationBid
  demand?: ProcurementDemand
  currentUserId: string
  busy: boolean
  messageBusy: boolean
  onClose: () => void
  onDecision: (status: 'Accepted' | 'Rejected', note: string) => Promise<void>
  onSendMessage: (message: string) => Promise<void>
}) {
  const [note, setNote] = useState(response.decisionNote || '')

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [])

  return <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-5">
    <button type="button" className="absolute inset-0 bg-[#102018]/60 backdrop-blur-[2px]" onClick={onClose} aria-label="Close farmer response" />
    <div role="dialog" aria-modal="true" aria-labelledby="buyer-response-title" className="relative max-h-[94dvh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b bg-white px-5 py-5 sm:px-7" style={{ borderColor: '#E2EBE5' }}>
        <div><div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#238B5B' }}>Farmer response</div><h3 id="buyer-response-title" className="mt-1 text-2xl font-bold">{response.senderName} · {response.cropName}</h3><p className="mt-1 text-xs" style={{ color: '#66736C' }}>Received {formatDate(response.createdAt)}{demand ? ` · Against your ${demand.cropName} demand` : ''}</p></div>
        <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border" style={{ borderColor: '#D5DED8', color: '#66736C' }} aria-label="Close"><BuyerIcon name="close" className="h-4 w-4" /></button>
      </div>

      <div className="space-y-5 px-5 py-6 sm:px-7">
        {response.cropImages?.length ? <div className="flex gap-2 overflow-x-auto pb-1">{response.cropImages.slice(0, 4).map((image, index) => <img key={index} src={image} alt={`${response.cropName} crop view ${index + 1}`} className="h-48 w-64 shrink-0 rounded-xl object-cover" />)}</div> : <div className="flex h-32 items-center justify-center rounded-xl" style={{ background: '#EAF5EE', color: '#238B5B' }}><div className="text-center"><BuyerIcon name="crop" className="mx-auto h-8 w-8" /><p className="mt-2 text-xs font-semibold">No crop photographs were added.</p></div></div>}

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-xl border p-4" style={{ borderColor: '#E2EBE5' }}><h4 className="font-bold">Farmer and crop</h4><dl className="mt-3 divide-y text-xs" style={{ borderColor: '#E2EBE5' }}>
            <div className="flex justify-between gap-3 py-2.5"><dt style={{ color: '#66736C' }}>Farmer</dt><dd className="font-bold">{response.senderName}</dd></div>
            <div className="flex justify-between gap-3 py-2.5"><dt style={{ color: '#66736C' }}>Phone</dt><dd className="text-right font-bold">{response.farmerPhone || 'Not supplied'}</dd></div>
            <div className="flex justify-between gap-3 py-2.5"><dt style={{ color: '#66736C' }}>Location</dt><dd className="max-w-[65%] text-right font-bold">{response.cropLocation || response.farmerAccountLocation || 'Not supplied'}</dd></div>
            <div className="flex justify-between gap-3 py-2.5"><dt style={{ color: '#66736C' }}>Variety</dt><dd className="text-right font-bold">{response.cropVariety || 'Not specified'}</dd></div>
            <div className="flex justify-between gap-3 py-2.5"><dt style={{ color: '#66736C' }}>Grade</dt><dd className="font-bold">{response.cropGrade || 'Not stated'}</dd></div>
            <div className="flex justify-between gap-3 py-2.5"><dt style={{ color: '#66736C' }}>Harvest</dt><dd className="font-bold">{response.harvestStatus || 'Not stated'}</dd></div>
          </dl></section>

          <section className="rounded-xl border p-4" style={{ borderColor: '#E2EBE5' }}><h4 className="font-bold">Sale offer</h4><dl className="mt-3 divide-y text-xs" style={{ borderColor: '#E2EBE5' }}>
            <div className="flex justify-between gap-3 py-2.5"><dt style={{ color: '#66736C' }}>Quantity</dt><dd className="font-bold">{response.requestedQuantityQtl} Qtl</dd></div>
            <div className="flex justify-between gap-3 py-2.5"><dt style={{ color: '#66736C' }}>Price</dt><dd className="font-bold">{money(response.counterPricePerQtl)}/Qtl</dd></div>
            <div className="flex justify-between gap-3 py-2.5"><dt style={{ color: '#66736C' }}>Total value</dt><dd className="text-base font-bold" style={{ color: '#063B2A' }}>{money(response.requestedQuantityQtl * response.counterPricePerQtl)}</dd></div>
            <div className="flex justify-between gap-3 py-2.5"><dt style={{ color: '#66736C' }}>Transport</dt><dd className="max-w-[65%] text-right font-bold">{response.deliveryTerms}</dd></div>
            <div className="flex justify-between gap-3 py-2.5"><dt style={{ color: '#66736C' }}>Status</dt><dd><BuyerStatus value={response.status} /></dd></div>
          </dl>{response.note && <p className="mt-3 rounded-xl p-3 text-xs leading-relaxed" style={{ background: '#FFF8ED', color: '#7A5310' }}>{response.note}</p>}</section>
        </div>

        <NegotiationChat conversation={response} currentUserId={currentUserId} sending={messageBusy} onSend={onSendMessage} />

        {response.status === 'Pending' ? <section className="border-t pt-5" style={{ borderColor: '#E2EBE5' }}>
          <label><span className="text-xs font-bold" style={{ color: '#52635A' }}>Decision note <span className="font-normal" style={{ color: '#879087' }}>(optional)</span></span><textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a note that will appear with your decision." className="mt-2 w-full resize-none rounded-xl border px-3 py-3 text-sm outline-none" style={{ borderColor: '#C8D5CD' }} /></label>
          <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" disabled={busy} onClick={() => void onDecision('Rejected', note)} className="rounded-xl border px-4 py-3 text-sm font-bold disabled:opacity-50" style={{ borderColor: '#B96860', color: '#9F241B' }}>Decline</button><button type="button" disabled={busy} onClick={() => void onDecision('Accepted', note)} className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white disabled:opacity-50" style={{ background: '#063B2A' }}><BuyerIcon name="check" className="h-4 w-4" />{busy ? 'Saving…' : 'Approve offer'}</button></div>
          <p className="mt-3 text-center text-[10px] leading-relaxed" style={{ color: '#66736C' }}>Approval confirms your interest. Final weight, physical quality, pickup and protected payment must still be confirmed.</p>
        </section> : <div className="rounded-xl p-4 text-xs leading-relaxed" style={{ background: response.status === 'Accepted' ? '#EAF5EE' : '#FEF2F2', color: response.status === 'Accepted' ? '#216644' : '#9F241B' }}><strong>{response.status === 'Accepted' ? 'You approved this offer.' : 'You declined this offer.'}</strong>{response.decisionNote ? ` ${response.decisionNote}` : ''}</div>}
      </div>
    </div>
  </div>
}

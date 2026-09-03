import { useEffect, useMemo, useState } from 'react'
import type { NegotiationBid, NegotiationMessage } from '../../types'

function timeLabel(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

export function NegotiationChat({ conversation, currentUserId, sending, onSend }: {
  conversation: NegotiationBid
  currentUserId: string
  sending: boolean
  onSend: (message: string) => Promise<void>
}) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setDraft('')
    setError('')
  }, [conversation.id])

  const messages = useMemo<NegotiationMessage[]>(() => {
    if (conversation.messages?.length) return conversation.messages
    if (!conversation.note) return []
    return [{
      id: `${conversation.id}_opening`,
      senderId: conversation.senderId,
      senderRole: conversation.senderRole,
      senderName: conversation.senderName,
      message: conversation.note,
      createdAt: conversation.createdAt,
    }]
  }, [conversation])

  async function submit() {
    const message = draft.trim()
    if (!message || sending) return
    setError('')
    try {
      await onSend(message)
      setDraft('')
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Message could not be sent.')
    }
  }

  return <section className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: '#DDE6DF', background: '#F8FAF8' }}>
    <div className="flex items-center justify-between gap-3">
      <div>
        <h4 className="font-bold" style={{ color: '#1D241F' }}>Talk about this offer</h4>
        <p className="mt-1 text-xs" style={{ color: '#687069' }}>Agree on price, quantity, pickup and payment before dispatch.</p>
      </div>
      <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: '#FFF2C8', color: '#76520B' }}>Private chat</span>
    </div>

    <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1" aria-live="polite">
      {messages.length ? messages.map((item) => {
        const mine = item.senderId === currentUserId
        return <div key={item.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
          <div className="max-w-[86%] rounded-2xl px-4 py-3 text-sm" style={{ background: mine ? '#173F2A' : '#FFFFFF', color: mine ? '#FFFFFF' : '#1D241F', border: mine ? '1px solid #173F2A' : '1px solid #DDE6DF' }}>
            <div className="text-[10px] font-bold" style={{ color: mine ? '#E9C76F' : '#3F6B45' }}>{mine ? 'You' : item.senderName}</div>
            <p className="mt-1 whitespace-pre-wrap leading-relaxed">{item.message}</p>
            <div className="mt-1.5 text-[10px]" style={{ color: mine ? '#C8D6CC' : '#879087' }}>{timeLabel(item.createdAt)}</div>
          </div>
        </div>
      }) : <div className="rounded-xl border border-dashed px-4 py-6 text-center text-xs" style={{ borderColor: '#C8D5CD', color: '#687069' }}>No messages yet. Start with a clear question about the offer.</div>}
    </div>

    <div className="mt-4 flex gap-2">
      <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void submit() } }} rows={2} maxLength={1000} placeholder="Write a message…" className="min-h-[48px] flex-1 resize-none rounded-xl border bg-white px-3 py-3 text-sm outline-none" style={{ borderColor: '#BAC8BE' }} />
      <button type="button" disabled={sending || !draft.trim()} onClick={() => void submit()} className="self-stretch rounded-xl px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50" style={{ background: '#C5A15A', color: '#173F2A' }}>{sending ? 'Sending…' : 'Send'}</button>
    </div>
    {error && <p className="mt-2 text-xs font-semibold" style={{ color: '#A53B32' }}>{error}</p>}
  </section>
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { NegotiationBid, ProcurementDemand, User } from '../../types'
import { api } from '../../services/api'
import { PostDemandModal } from './PostDemandModal'
import { BuyerResponseModal } from './BuyerResponseModal'
import { BuyerDemandCard, BuyerIcon, BuyerResponseCard, BuyerStatus, type BuyerIconName, money } from './BuyerWorkspaceUi'

type BuyerTab = 'overview' | 'demands' | 'responses' | 'account'

export function BuyerWorkspace({ user, onNotify }: { user: User; onNotify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void }) {
  const [activeTab, setActiveTab] = useState<BuyerTab>('overview')
  const [demands, setDemands] = useState<ProcurementDemand[]>([])
  const [responses, setResponses] = useState<NegotiationBid[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [postDemandOpen, setPostDemandOpen] = useState(false)
  const [selectedResponse, setSelectedResponse] = useState<NegotiationBid | null>(null)
  const [decisionBusy, setDecisionBusy] = useState(false)

  const loadWorkspace = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    setLoadError('')
    try {
      const [ownDemands, negotiations] = await Promise.all([api.demands.getAll(), api.demands.getNegotiations()])
      setDemands(ownDemands)
      setResponses(negotiations.filter((response) => response.senderRole === 'farmer'))
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Buyer information could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadWorkspace()
    const refresh = () => void loadWorkspace(true)
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [loadWorkspace, user.id])

  const activeDemands = demands.filter((demand) => demand.status === 'Active')
  const pendingResponses = responses.filter((response) => response.status === 'Pending')
  const acceptedResponses = responses.filter((response) => response.status === 'Accepted')
  const totalQuantity = activeDemands.reduce((total, demand) => total + demand.quantityQtlNeeded, 0)
  const sortedResponses = useMemo(() => [...responses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [responses])

  async function createDemand(draft: Partial<ProcurementDemand>) {
    const created = await api.demands.create(draft)
    setDemands((current) => [created, ...current])
    setActiveTab('demands')
    onNotify('Demand published', `${created.quantityQtlNeeded} Qtl ${created.cropName} is now visible to farmers.`, 'success')
  }

  async function decide(status: 'Accepted' | 'Rejected', note: string) {
    if (!selectedResponse) return
    setDecisionBusy(true)
    try {
      const updated = await api.demands.reviewNegotiation(selectedResponse.id, status, note)
      setResponses((current) => current.map((response) => response.id === updated.id ? updated : response))
      setSelectedResponse(updated)
      onNotify(status === 'Accepted' ? 'Farmer offer approved' : 'Farmer offer declined', `${updated.senderName} will receive your decision.`, status === 'Accepted' ? 'success' : 'info')
    } catch (error) {
      onNotify('Decision could not be saved', error instanceof Error ? error.message : 'Please try again.', 'warning')
    } finally {
      setDecisionBusy(false)
    }
  }

  const navigation: { id: BuyerTab; label: string; icon: BuyerIconName; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: 'overview' },
    { id: 'demands', label: 'My Demands', icon: 'demand', count: activeDemands.length },
    { id: 'responses', label: 'Responses', icon: 'response', count: pendingResponses.length },
    { id: 'account', label: 'Account', icon: 'account' },
  ]

  return <>
    <main className="buyer-workspace max-w-5xl mx-auto px-4 pt-6">
      {loadError && <div className="mb-5 rounded-xl border p-4 text-sm" style={{ background: '#FEF2F2', borderColor: '#E9B8B2', color: '#9F241B' }}>{loadError}<button type="button" onClick={() => void loadWorkspace()} className="ml-2 font-bold">Try again</button></div>}
      {loading ? <div className="rounded-2xl border bg-white p-8 text-center text-sm" style={{ borderColor: '#E2EBE5', color: '#66736C' }}>Loading buyer account…</div> : <BuyerTabContent activeTab={activeTab} user={user} demands={demands} responses={sortedResponses} activeDemands={activeDemands} pendingResponses={pendingResponses} acceptedResponses={acceptedResponses} totalQuantity={totalQuantity} onTab={setActiveTab} onNewDemand={() => setPostDemandOpen(true)} onRefresh={() => void loadWorkspace()} onOpenResponse={setSelectedResponse} />}
    </main>
    <BuyerNavigation items={navigation} activeTab={activeTab} onTab={setActiveTab} />
    <PostDemandModal isOpen={postDemandOpen} onClose={() => setPostDemandOpen(false)} onCreateDemand={createDemand} />
    {selectedResponse && <BuyerResponseModal response={selectedResponse} demand={demands.find((demand) => demand.id === selectedResponse.demandId)} busy={decisionBusy} onClose={() => setSelectedResponse(null)} onDecision={decide} />}
  </>
}

type ContentProps = {
  activeTab: BuyerTab; user: User; demands: ProcurementDemand[]; responses: NegotiationBid[]; activeDemands: ProcurementDemand[]; pendingResponses: NegotiationBid[]; acceptedResponses: NegotiationBid[]; totalQuantity: number
  onTab: (tab: BuyerTab) => void; onNewDemand: () => void; onRefresh: () => void; onOpenResponse: (response: NegotiationBid) => void
}

function BuyerTabContent(props: ContentProps) {
  if (props.activeTab === 'overview') return <BuyerOverview {...props} />
  if (props.activeTab === 'demands') return <BuyerDemands {...props} />
  if (props.activeTab === 'responses') return <BuyerResponses {...props} />
  return <BuyerAccount {...props} />
}

function BuyerOverview(props: ContentProps) {
  return (
    <div className="space-y-7">
      <header>
        <div
          className="text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ color: '#238B5B' }}
        >
          Buyer overview
        </div>
        <h2 className="mt-2 text-3xl font-bold">
          Good to see you, {props.user.name.split(' ')[0]}.
        </h2>
        <p className="mt-2 text-sm" style={{ color: '#66736C' }}>
          Raise crop demand and review the farmers who respond to your business.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Active demands" value={String(props.activeDemands.length)} tone="dark" />
        <Metric label="Quantity needed" value={`${props.totalQuantity} Qtl`} />
        <button type="button" onClick={() => props.onTab('responses')}>
          <Metric
            label="Waiting for review"
            value={String(props.pendingResponses.length)}
            tone="gold"
          />
        </button>
        <Metric label="Approved offers" value={String(props.acceptedResponses.length)} tone="green" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <div
          className="rounded-2xl border bg-white p-5"
          style={{ borderColor: '#E2EBE5' }}
        >
          <div
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: '#238B5B' }}
          >
            Start procurement
          </div>
          <h3 className="mt-2 text-xl font-bold">Tell farmers what your business needs.</h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: '#66736C' }}>
            Add crop, quantity, price, grade, deadline and transport responsibility.
            Matching farmers will see it while selling.
          </p>
          <button
            type="button"
            onClick={props.onNewDemand}
            className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white"
            style={{ background: '#063B2A' }}
          >
            <BuyerIcon name="plus" className="h-4 w-4" />
            Raise new demand
          </button>
        </div>

        <div
          className="rounded-2xl border p-5"
          style={{ background: '#FFF8ED', borderColor: '#F0D9A8' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: '#A96910' }}
              >
                Needs attention
              </div>
              <h3 className="mt-2 text-xl font-bold">Farmer responses</h3>
            </div>
            <button
              type="button"
              onClick={props.onRefresh}
              className="rounded-full border p-2"
              style={{ color: '#7A5310' }}
            >
              <BuyerIcon name="refresh" className="h-4 w-4" />
            </button>
          </div>
          {props.pendingResponses.length ? (
            <div className="mt-4 space-y-2">
              {props.pendingResponses.slice(0, 2).map((item) => (
                <button
                  key={item.id}
                  onClick={() => props.onOpenResponse(item)}
                  className="w-full rounded-xl border bg-white p-3 text-left"
                >
                  <strong className="text-sm">{item.senderName}</strong>
                  <div className="mt-1 text-xs" style={{ color: '#66736C' }}>
                    {item.requestedQuantityQtl} Qtl {item.cropName} · {money(item.counterPricePerQtl)}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm" style={{ color: '#66736C' }}>
              No response is waiting for review.
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="flex justify-between">
          <h3 className="text-xl font-bold">Recent demands</h3>
          <button
            onClick={() => props.onTab('demands')}
            className="text-xs font-bold"
            style={{ color: '#063B2A' }}
          >
            View all
          </button>
        </div>
        {props.demands.length ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {props.demands.slice(0, 2).map((demand) => (
              <BuyerDemandCard key={demand.id} demand={demand} />
            ))}
          </div>
        ) : (
          <EmptyState title="No demand published yet." text="Raise your first crop requirement to begin." />
        )}
      </section>
    </div>
  )
}

function BuyerDemands(props: ContentProps) {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: '#238B5B' }}
          >
            My demands
          </div>
          <h2 className="mt-2 text-3xl font-bold">Requirements visible to farmers.</h2>
          <p className="mt-2 text-sm" style={{ color: '#66736C' }}>
            A response is added when a farmer sends an offer against your demand.
          </p>
        </div>
        <button
          type="button"
          onClick={props.onNewDemand}
          className="inline-flex w-fit items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white"
          style={{ background: '#063B2A' }}
        >
          <BuyerIcon name="plus" className="h-4 w-4" />
          Raise new demand
        </button>
      </header>
      {props.demands.length ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {props.demands.map((demand) => (
            <BuyerDemandCard key={demand.id} demand={demand} />
          ))}
        </section>
      ) : (
        <EmptyState
          title="No demand yet."
          text="Raise a requirement to make it available in the farmer selling flow."
        />
      )}
    </div>
  )
}

function BuyerResponses(props: ContentProps) {
  const reviewedResponses = props.responses.filter((response) => response.status !== 'Pending')

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: '#238B5B' }}
          >
            Farmer responses
          </div>
          <h2 className="mt-2 text-3xl font-bold">Farmers who accepted your demand.</h2>
          <p className="mt-2 text-sm" style={{ color: '#66736C' }}>
            Open a response to see crop photos, grade, quantity, price, location and contact details.
          </p>
        </div>
        <button
          type="button"
          onClick={props.onRefresh}
          className="inline-flex w-fit items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold"
          style={{ borderColor: '#063B2A', color: '#063B2A' }}
        >
          <BuyerIcon name="refresh" className="h-4 w-4" />
          Refresh
        </button>
      </header>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="All responses" value={String(props.responses.length)} tone="dark" />
        <Metric label="Waiting for review" value={String(props.pendingResponses.length)} tone="gold" />
        <Metric label="Approved offers" value={String(props.acceptedResponses.length)} tone="green" />
        <Metric
          label="Other decisions"
          value={String(Math.max(0, reviewedResponses.length - props.acceptedResponses.length))}
        />
      </section>

      {props.pendingResponses.length ? (
        <section>
          <div className="mb-4">
            <h3 className="text-xl font-bold">Needs your review</h3>
            <p className="mt-1 text-xs" style={{ color: '#66736C' }}>
              Check the farmer's crop and terms before you accept or decline.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {props.pendingResponses.map((response) => (
              <BuyerResponseCard
                key={response.id}
                response={response}
                onOpen={() => props.onOpenResponse(response)}
              />
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          title="Nothing is waiting for review."
          text="New farmer offers will appear here as soon as they respond to a demand."
        />
      )}

      {reviewedResponses.length > 0 && (
        <section>
          <div className="mb-4">
            <h3 className="text-xl font-bold">Reviewed responses</h3>
            <p className="mt-1 text-xs" style={{ color: '#66736C' }}>
              A clear record of offers you have already decided on.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {reviewedResponses.map((response) => (
              <BuyerResponseCard
                key={response.id}
                response={response}
                onOpen={() => props.onOpenResponse(response)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function BuyerAccount(props: ContentProps) {
  const { user } = props
  const rows = [
    ['Contact person', user.name],
    ['Buyer type', user.buyerType || 'Agricultural buyer'],
    ['Location', user.location],
    ['Phone', user.phone || 'Not added'],
    ['Email', user.email || 'Not added'],
    ['GSTIN / licence', user.gstin || 'Not added'],
  ]
  return (
    <div className="space-y-7">
      <header>
        <div
          className="text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ color: '#238B5B' }}
        >
          Buyer account
        </div>
        <h2 className="mt-2 text-3xl font-bold">Business details.</h2>
        <p className="mt-2 text-sm" style={{ color: '#66736C' }}>
          This identity is shown to farmers with your crop demands.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Business status" value={user.verifiedBadge ? 'Verified' : 'Pending'} tone="dark" />
        <Metric label="Active demands" value={String(props.activeDemands.length)} />
        <Metric label="Farmer responses" value={String(props.responses.length)} tone="gold" />
        <Metric label="Approved offers" value={String(props.acceptedResponses.length)} tone="green" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <div
          className="rounded-2xl border bg-white p-5 sm:p-6"
          style={{ borderColor: '#E2EBE5' }}
        >
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{ background: '#063B2A' }}
            >
              {user.avatar || user.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-bold">{user.companyName || user.name}</h3>
              <div className="mt-2">
                <BuyerStatus
                  value={user.verifiedBadge ? 'Accepted' : 'Pending'}
                  label={user.verifiedBadge ? 'Verified business' : 'Verification pending'}
                />
              </div>
            </div>
          </div>
          <dl className="mt-5 divide-y text-sm" style={{ borderColor: '#E2EBE5' }}>
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-3">
                <dt style={{ color: '#66736C' }}>{label}</dt>
                <dd className="max-w-[65%] text-right font-bold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div
          className="rounded-2xl border p-5 sm:p-6"
          style={{ background: '#FFF8ED', borderColor: '#F0D9A8' }}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#A96910' }}>
            Farmer-facing identity
          </div>
          <h3 className="mt-2 text-xl font-bold">What farmers can trust.</h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: '#66736C' }}>
            Your company, location, buying price, grade requirement and transport terms are shown with every demand.
          </p>
          <div className="mt-5 space-y-3">
            <AccountCheck label="Business name and contact" complete={Boolean(user.companyName && user.phone)} />
            <AccountCheck label="Procurement location" complete={Boolean(user.location)} />
            <AccountCheck label="GSTIN or trade licence" complete={Boolean(user.gstin)} />
            <AccountCheck label="Verified buyer status" complete={Boolean(user.verifiedBadge)} />
          </div>
          <button
            type="button"
            onClick={props.onNewDemand}
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white"
            style={{ background: '#063B2A' }}
          >
            <BuyerIcon name="plus" className="h-4 w-4" />
            Raise new demand
          </button>
        </div>
      </section>
    </div>
  )
}

function AccountCheck({ label, complete }: { label: string; complete: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-white px-3 py-3" style={{ borderColor: '#E7D4AA' }}>
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{ background: complete ? '#EAF5EE' : '#F7F6F1', color: complete ? '#238B5B' : '#66736C' }}
      >
        <BuyerIcon name={complete ? 'check' : 'close'} className="h-4 w-4" />
      </span>
      <span className="text-xs font-bold">{label}</span>
    </div>
  )
}

function Metric({
  label,
  value,
  tone = 'plain',
}: {
  label: string
  value: string
  tone?: 'plain' | 'dark' | 'gold' | 'green'
}) {
  const style = tone === 'dark'
    ? { background: '#063B2A', borderColor: '#063B2A', color: '#FFFFFF' }
    : tone === 'gold'
      ? { background: '#FFF8ED', borderColor: '#F0D9A8', color: '#7A5310' }
      : tone === 'green'
        ? { background: '#EAF5EE', borderColor: '#C4DFD0', color: '#238B5B' }
        : { background: '#FFFFFF', borderColor: '#E2EBE5', color: '#17221D' }
  return (
    <div className="h-full rounded-2xl border p-4 text-left" style={style}>
      <div className="text-[10px]" style={{ opacity: 0.72 }}>{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  )
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div
      className="mt-4 rounded-2xl border border-dashed p-9 text-center"
      style={{ borderColor: '#C8D5CD' }}
    >
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm" style={{ color: '#66736C' }}>{text}</p>
    </div>
  )
}

function BuyerNavigation({
  items,
  activeTab,
  onTab,
}: {
  items: { id: BuyerTab; label: string; icon: BuyerIconName; count?: number }[]
  activeTab: BuyerTab
  onTab: (tab: BuyerTab) => void
}) {
  return (
    <nav
      className="buyer-portal-navigation fixed bottom-0 left-0 right-0 z-40 px-2 pb-3 pt-2"
      style={{ background: '#FFFFFF', borderTop: '1px solid #E2EBE5' }}
    >
      <div className="mx-auto flex max-w-5xl items-end justify-around">
        {items.map(({ id, label, icon, count }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              onClick={() => onTab(id)}
              className="relative flex min-w-14 flex-col items-center gap-0.5 rounded-xl px-3 py-1"
              style={{ color: active ? '#063B2A' : '#66736C' }}
            >
              <div><BuyerIcon name={icon} /></div>
              <span
                className="text-[10px] font-medium leading-none"
                style={{ fontWeight: active ? 700 : 500 }}
              >
                {label}
              </span>
              {count !== undefined && count > 0 && (
                <span
                  className="absolute right-1 top-0 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold"
                  style={{ background: '#F4C44E', color: '#063B2A' }}
                >
                  {count}
                </span>
              )}
              {active && (
                <span
                  className="mt-0.5 h-0.5 w-4 rounded-full"
                  style={{ background: '#063B2A' }}
                />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

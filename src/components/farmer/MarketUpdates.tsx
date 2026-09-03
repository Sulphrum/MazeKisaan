import { useEffect, useState } from 'react'
import mandiArrivalsImage from '../../assets/market-updates/mandi-arrivals.jpg'
import qualityGradingImage from '../../assets/market-updates/quality-grading.jpg'
import onionStorageImage from '../../assets/market-updates/onion-storage.jpg'
import farmgateTransportImage from '../../assets/market-updates/farmgate-transport.jpg'

type MarketUpdate = {
  id: string
  label: string
  title: string
  summary: string
  detail: string
  whyItMatters: string
  checks: string[]
  image: string
  imageAlt: string
}

const MARKET_UPDATES: MarketUpdate[] = [
  {
    id: 'arrival-watch',
    label: 'Arrival watch',
    title: 'Morning arrivals can change the day’s price quickly',
    summary: 'A strong opening price may soften when more vehicles reach the market. Check the latest reported time before loading your crop.',
    detail: 'Wholesale prices can move during the same day because the available quantity keeps changing. A rate reported early in the morning may not remain available after larger lots arrive. Farmers should compare the reporting time, crop grade and actual buying activity—not only the highest number shown.',
    whyItMatters: 'It reduces the risk of travelling for an old price that is no longer being offered.',
    checks: ['When the rate was reported', 'Whether arrivals are rising or falling', 'Which grade received the quoted price'],
    image: mandiArrivalsImage,
    imageAlt: 'Farmers unloading tomato and onion crates at a Maharashtra wholesale market',
  },
  {
    id: 'quality-watch',
    label: 'Quality watch',
    title: 'Sorting produce before sale can protect the final offer',
    summary: 'Mixing damaged and premium produce can lower the price of the full lot. Keep clear grades before speaking with buyers.',
    detail: 'Buyers usually judge a lot by its overall consistency. Separating damaged, undersized or overripe produce allows the better portion to be valued independently. Take clear photographs after sorting and confirm whether the buyer’s offer is for Grade A, Grade B or a mixed lot.',
    whyItMatters: 'A clear grade makes offers easier to compare and gives the farmer stronger evidence during negotiation.',
    checks: ['Size and colour consistency', 'Visible damage or moisture', 'Whether the offer is grade-specific'],
    image: qualityGradingImage,
    imageAlt: 'Workers grading green chillies and capsicum at a produce market',
  },
  {
    id: 'storage-watch',
    label: 'Storage watch',
    title: 'Good onion storage depends on dryness and airflow',
    summary: 'Waiting for a higher rate only helps when the stored crop remains healthy. Inspect heat, moisture and soft bulbs regularly.',
    detail: 'Storage is not automatically profitable. The possible future price increase must be larger than storage, handling and spoilage losses. Onion lots need ventilation and frequent inspection because one damaged section can affect nearby bags. Sell earlier if quality is falling faster than the expected price is rising.',
    whyItMatters: 'It keeps a possible price gain from being lost through spoilage and weight loss.',
    checks: ['Neck and outer-skin dryness', 'Airflow between bags', 'Soft bulbs, heat or unusual smell'],
    image: onionStorageImage,
    imageAlt: 'Farmer inspecting onions inside a ventilated storage shed',
  },
  {
    id: 'transport-watch',
    label: 'Selling-cost watch',
    title: 'Buyer pickup can make a lower offer worth more',
    summary: 'Compare what remains after transport and handling. The highest price per quintal is not always the best final payment.',
    detail: 'Before selecting a buyer or mandi, compare the amount the farmer will actually receive. Confirm who pays for pickup, loading, unloading, weighing and market charges. A nearby buyer offering a slightly lower rate may leave more money after costs than a distant market with a higher headline price.',
    whyItMatters: 'It helps compare offers using the final amount received instead of only the displayed rate.',
    checks: ['Who provides and pays for transport', 'Loading and weighing charges', 'Payment timing and written quantity confirmation'],
    image: farmgateTransportImage,
    imageAlt: 'Farmer and buyer inspecting vegetable crates before farmgate transport',
  },
]

export function MarketUpdates() {
  const [selected, setSelected] = useState<MarketUpdate | null>(null)

  useEffect(() => {
    if (!selected) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null)
    }
    document.addEventListener('keydown', closeOnEscape)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = previousOverflow
    }
  }, [selected])

  return (
    <section aria-labelledby="market-updates-title">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#3F6B45' }}>Useful before you sell</div>
          <h3 id="market-updates-title" className="mt-2 text-2xl font-bold sm:text-3xl" style={{ color: '#1D241F' }}>Market updates</h3>
          <p className="mt-2 max-w-3xl text-base leading-relaxed" style={{ color: '#687069' }}>Short market alerts and practical checks. Open any update to understand what it means for your sale.</p>
        </div>
        <div className="text-sm font-semibold" style={{ color: '#687069' }}>Scroll to see more</div>
      </div>

      <div className="market-updates-scroll flex snap-x snap-mandatory gap-5 overflow-x-auto pb-5" style={{ scrollbarColor: '#78907D #E4E7DF' }}>
        {MARKET_UPDATES.map((update) => (
          <article key={update.id} className="group min-w-[84%] snap-start overflow-hidden border sm:min-w-[390px] lg:min-w-[410px]" style={{ background: '#FFFEFA', borderColor: 'rgba(29,36,31,0.14)' }}>
            <button type="button" onClick={() => setSelected(update)} className="block h-full w-full text-left">
              <div className="relative h-52 overflow-hidden">
                <img src={update.image} alt={update.imageAlt} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
                <span className="absolute bottom-4 left-4 px-3 py-1.5 text-xs font-bold uppercase tracking-wider" style={{ background: '#F4E5B8', color: '#173F2A' }}>{update.label}</span>
              </div>
              <div className="p-5 sm:p-6">
                <h4 className="text-xl font-bold leading-snug" style={{ color: '#1D241F' }}>{update.title}</h4>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed" style={{ color: '#687069' }}>{update.summary}</p>
                <div className="mt-5 flex items-center justify-between border-t pt-4 text-sm font-bold" style={{ borderColor: '#E1E6E1', color: '#245C3B' }}>
                  <span>Read full update</span>
                  <svg aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </div>
              </div>
            </button>
          </article>
        ))}
      </div>

      <p className="mt-1 text-xs leading-relaxed" style={{ color: '#7A827B' }}>These are practical market guides. Confirm the latest price, reporting time and buyer terms before making a sale.</p>

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#101A14]/70 p-0 sm:items-center sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}>
          <div role="dialog" aria-modal="true" aria-labelledby="market-update-dialog-title" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto border shadow-2xl" style={{ background: '#FFFEFA', borderColor: '#C9D0C9' }}>
            <div className="relative h-56 sm:h-72">
              <img src={selected.image} alt={selected.imageAlt} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101A14]/70 via-transparent to-black/15" />
              <button type="button" onClick={() => setSelected(null)} aria-label="Close market update" className="absolute right-4 top-4 grid h-11 w-11 place-items-center border bg-white/95" style={{ borderColor: 'rgba(29,36,31,0.16)', color: '#173F2A' }}>
                <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
              <span className="absolute bottom-5 left-5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider sm:left-7" style={{ background: '#F4E5B8', color: '#173F2A' }}>{selected.label}</span>
            </div>

            <div className="p-6 sm:p-8">
              <h3 id="market-update-dialog-title" className="text-2xl font-bold leading-tight sm:text-3xl" style={{ color: '#1D241F' }}>{selected.title}</h3>
              <p className="mt-5 text-base leading-7" style={{ color: '#52635A' }}>{selected.detail}</p>

              <div className="mt-7 grid gap-5 sm:grid-cols-[0.9fr_1.1fr]">
                <div className="border p-5" style={{ background: '#F2EDDF', borderColor: '#DDD5BF' }}>
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#735A27' }}>Why this matters</div>
                  <p className="mt-3 text-base leading-relaxed" style={{ color: '#35483B' }}>{selected.whyItMatters}</p>
                </div>
                <div className="border p-5" style={{ background: '#F6F8F3', borderColor: '#DDE4DE' }}>
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#3F6B45' }}>Check before deciding</div>
                  <ul className="mt-3 space-y-3">
                    {selected.checks.map((check) => <li key={check} className="flex gap-3 text-sm leading-relaxed" style={{ color: '#35483B' }}><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: '#C18A32' }} />{check}</li>)}
                  </ul>
                </div>
              </div>

              <button type="button" onClick={() => setSelected(null)} className="mt-7 w-full px-5 py-3.5 text-sm font-bold sm:w-auto" style={{ background: '#173F2A', color: '#FFFFFF' }}>Back to market updates</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}


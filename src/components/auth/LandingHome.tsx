import heroImage from '../../assets/kisansetu-hero.jpg'
import storageImage from '../../assets/kisansetu-storage.jpg'
import buyerImage from '../../assets/kisansetu-buyer.jpg'
import { BrandLogo } from '../common/BrandLogo'

type LandingHomeProps = {
  onFarmerStart: () => void
  onBuyerStart: () => void
}

const journey = [
  {
    number: '01',
    title: 'Track what is growing',
    description: 'Keep your crop, stage and expected quantity together from field to harvest.',
    image: heroImage,
    imageAlt: 'Farmer observing a healthy crop field at sunrise',
  },
  {
    number: '02',
    title: 'Decide: sell or store',
    description: 'See a clear recommendation based on readiness, price, demand and storage risk.',
    image: storageImage,
    imageAlt: 'Freshly harvested tomatoes arranged in ventilated storage crates',
  },
  {
    number: '03',
    title: 'Reach the right buyer',
    description: 'Compare nearby demand and move forward with the option that works for you.',
    image: buyerImage,
    imageAlt: 'Farmer and produce buyer speaking beside sorted vegetable crates',
  },
]

export function LandingHome({
  onFarmerStart,
  onBuyerStart,
}: LandingHomeProps) {
  return (
    <div className="kisansetu-home overflow-hidden bg-[#F7F3E8] text-[#1D241F]">
      <section id="home" className="relative flex min-h-[760px] items-end text-white lg:min-h-screen">
        <img
          src={heroImage}
          alt="Farmer observing a healthy crop field at sunrise"
          className="absolute inset-0 h-full w-full object-cover object-[64%_center]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,29,17,0.92)_0%,rgba(8,29,17,0.72)_38%,rgba(8,29,17,0.18)_76%,rgba(8,29,17,0.08)_100%)]" />

        <header className="absolute inset-x-0 top-0 z-20 border-b border-white/15 bg-[#10291C]/20 backdrop-blur-[2px]">
          <div className="mx-auto flex h-[76px] w-[min(calc(100%-32px),1240px)] items-center justify-between">
            <a href="#home" className="flex items-center" aria-label="माझे Kisan home">
              <BrandLogo tone="light" className="text-[31px] sm:text-[34px]" />
            </a>
            <nav className="hidden items-center gap-7 text-[11px] font-semibold md:flex" aria-label="Homepage navigation">
              <a className="transition-colors hover:text-[#E7D39A]" href="#journey">How it works</a>
              <a className="transition-colors hover:text-[#E7D39A]" href="#guidance">Our guidance</a>
              <a className="transition-colors hover:text-[#E7D39A]" href="#buyers">For buyers</a>
              <button type="button" onClick={onFarmerStart} className="border border-white/65 px-4 py-2.5 font-bold transition-colors hover:bg-white hover:text-[#173F2A]">Farmer market</button>
            </nav>
            <button type="button" onClick={onFarmerStart} className="border border-white/65 px-4 py-2.5 text-[11px] font-bold md:hidden">Farmer market</button>
          </div>
        </header>

        <div className="relative z-10 mx-auto w-[min(calc(100%-32px),1240px)] pb-20 pt-36 sm:pb-24 lg:pb-28">
          <p className="mb-5 text-[10px] font-bold tracking-[0.24em] text-[#D9E3D5]">FIELD TO FAIR SALE</p>
          <h1 className="font-display max-w-[860px] text-[56px] font-normal leading-[0.94] tracking-[-0.035em] sm:text-[76px] lg:text-[104px]">
            Know your crop.<br /><em className="text-[#E8E2CF]">Choose your moment.</em>
          </h1>
          <p className="mt-7 max-w-[590px] text-[15px] leading-7 text-white/82 sm:text-base">
            माझे Kisan helps farmers understand when to harvest, whether to sell or store,
            and who is ready to buy—with clear reasons, not complicated terms.
          </p>
          <div className="mt-9 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <button type="button" onClick={onFarmerStart} className="bg-white px-6 py-3.5 text-xs font-bold text-[#173F2A] transition-transform hover:-translate-y-0.5">Start as a farmer →</button>
            <button type="button" onClick={onBuyerStart} className="border-b border-white/50 pb-1 text-xs font-bold text-white transition-colors hover:border-white">I am a buyer →</button>
          </div>
          <p className="mt-6 text-[10px] tracking-[0.12em] text-white/55">ENGLISH · मराठी · हिंदी</p>
        </div>
      </section>

      <section className="bg-[#173F2A] text-white" aria-label="माझे Kisan benefits">
        <div className="mx-auto grid w-[min(calc(100%-32px),1240px)] grid-cols-2 py-7 sm:grid-cols-4">
          {['Crop guidance', 'Sell or store clarity', 'Nearby buyer demand', 'Relevant scheme support'].map((item, index) => (
            <div key={item} className={`flex min-h-14 items-center gap-3 px-3 py-3 sm:px-6 ${index < 3 ? 'sm:border-r sm:border-white/15' : ''}`}>
              <span className="text-[9px] tracking-[0.15em] text-white/45">0{index + 1}</span>
              <strong className="text-[11px] font-semibold leading-4 sm:text-xs">{item}</strong>
            </div>
          ))}
        </div>
      </section>

      <section id="journey" className="px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="mb-4 text-[10px] font-bold tracking-[0.22em] text-[#3F6B45]">ONE CLEAR JOURNEY</p>
              <h2 className="font-display text-[46px] font-normal leading-[0.98] sm:text-[64px]">From growing crop<br /><em className="text-[#3F6B45]">to confident sale.</em></h2>
            </div>
            <p className="max-w-[390px] text-[13px] leading-6 text-[#687069]">The important decisions stay connected, so you always know what happened and what to do next.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {journey.map((step) => (
              <article key={step.number} className="group overflow-hidden bg-[#EEE9DB]">
                <div className="h-[310px] overflow-hidden sm:h-[360px] lg:h-[300px]">
                  <img src={step.image} alt={step.imageAlt} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]" />
                </div>
                <div className="p-6 sm:p-7">
                  <span className="text-[9px] font-bold tracking-[0.18em] text-[#3F6B45]">{step.number}</span>
                  <h3 className="font-display mt-3 text-[29px] font-normal leading-tight">{step.title}</h3>
                  <p className="mb-0 mt-2 text-[12px] leading-5 text-[#687069]">{step.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="guidance" className="bg-[#EEE9DB] px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto grid max-w-[1120px] items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <p className="mb-4 text-[10px] font-bold tracking-[0.22em] text-[#3F6B45]">GUIDANCE YOU CAN UNDERSTAND</p>
            <h2 className="font-display text-[46px] font-normal leading-[0.98] sm:text-[64px]">Advice that tells you<br /><em className="text-[#3F6B45]">why.</em></h2>
            <p className="mt-6 max-w-[480px] text-[14px] leading-7 text-[#687069]">माझे Kisan turns crop, market and buyer information into a simple explanation. You see the reason and remain in control of the final decision.</p>
            <div className="mt-8 flex gap-8 border-y border-[#1D241F]/12 py-5 text-[10px] font-bold tracking-[0.1em] text-[#3F6B45]"><span>CLEAR REASONS</span><span>FARMER DECIDES</span></div>
          </div>
          <div className="bg-[#173F2A] p-7 text-white sm:p-10 lg:p-12">
            <p className="text-[9px] font-bold tracking-[0.2em] text-[#BFD0BB]">EXAMPLE GUIDANCE</p>
            <p className="font-display mt-7 text-[29px] font-normal leading-[1.25] sm:text-[36px]">“Nearby demand is strong, so selling part of your tomato harvest now is a practical choice.”</p>
            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/15 pt-6">
              <div><small className="block text-[9px] text-white/50">READY</small><strong className="mt-1 block text-sm">60 Qtl</strong></div>
              <div><small className="block text-[9px] text-white/50">DEMAND</small><strong className="mt-1 block text-sm">Strong</strong></div>
              <div><small className="block text-[9px] text-white/50">OFFER</small><strong className="mt-1 block text-sm">₹2,580/Qtl</strong></div>
            </div>
            <p className="mb-0 mt-6 text-[10px] leading-5 text-white/45">Illustrative example. Actual guidance depends on the farmer’s crop and available market data.</p>
          </div>
        </div>
      </section>

      <section id="buyers" className="grid bg-[#173F2A] text-white lg:grid-cols-2">
        <div className="min-h-[420px] lg:min-h-[570px]"><img src={buyerImage} alt="Farmer and produce buyer discussing a farmgate purchase" loading="lazy" className="h-full w-full object-cover" /></div>
        <div className="flex items-center px-7 py-16 sm:px-14 lg:px-[9vw] lg:py-20">
          <div className="max-w-[500px]">
            <p className="mb-4 text-[10px] font-bold tracking-[0.22em] text-[#C8D5C4]">FOR PRODUCE BUYERS</p>
            <h2 className="font-display text-[46px] font-normal leading-[0.98] sm:text-[64px]">Better sourcing starts<br /><em className="text-[#DDE6D8]">closer to the farm.</em></h2>
            <p className="mt-6 text-[14px] leading-7 text-white/68">Share what you need, discover available produce and build direct relationships with farmers.</p>
            <button type="button" onClick={onBuyerStart} className="mt-8 bg-white px-6 py-3.5 text-xs font-bold text-[#173F2A] transition-transform hover:-translate-y-0.5">Continue as a buyer →</button>
          </div>
        </div>
      </section>

      <section className="bg-[#7A5C3E] px-4 py-20 text-center text-white sm:px-6 sm:py-24">
        <div className="mx-auto max-w-[760px]">
          <p className="mb-4 text-[10px] font-bold tracking-[0.22em] text-[#E7DCCF]">BEGIN WITH YOUR CROP</p>
          <h2 className="font-display text-[45px] font-normal leading-none sm:text-[62px]">Better decisions grow<br /><em className="text-[#F2E8D5]">from better information.</em></h2>
          <p className="mx-auto mt-6 max-w-[520px] text-[13px] leading-6 text-white/72">Explore public market and sourcing information first. Sign in only when you are ready for personal analysis or trading.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={onFarmerStart} className="bg-white px-6 py-3.5 text-xs font-bold text-[#173F2A]">Explore farmer market →</button>
            <button type="button" onClick={onBuyerStart} className="border border-white/45 px-6 py-3.5 text-xs font-bold text-white">Explore buyer sourcing</button>
          </div>
        </div>
      </section>
    </div>
  )
}

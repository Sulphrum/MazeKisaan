import { useEffect, useState } from 'react'

type SchemeCategory = 'Income support' | 'Credit and protection' | 'Farm resources' | 'Growth and infrastructure'

type Scheme = {
  id: string
  name: string
  shortName: string
  category: SchemeCategory
  authority: string
  summary: string
  benefit: string
  eligibilityPreview: string
  whatItIs: string
  benefits: string[]
  eligibility: string[]
  documents: string[]
  howToApply: string[]
  officialUrl: string
  applyUrl?: string
  sourceLabel: string
  availabilityNote: string
  colors: { from: string; to: string; accent: string }
}

const SCHEMES: Scheme[] = [
  {
    id: 'pm-kisan',
    name: 'PM-KISAN Samman Nidhi',
    shortName: 'PM-KISAN',
    category: 'Income support',
    authority: 'Government of India',
    summary: 'Income support for eligible landholding farmer families.',
    benefit: '₹6,000 a year in three instalments',
    eligibilityPreview: 'Landholding farmer families, subject to official exclusions and verification.',
    whatItIs: 'PM-KISAN is a Central Sector income-support scheme. Eligible farmer families receive support directly in their registered bank account after the government verifies land, identity, e-KYC and exclusion conditions.',
    benefits: ['₹6,000 per year in three equal instalments', 'Direct transfer to the verified beneficiary bank account', 'Online beneficiary status and e-KYC services'],
    eligibility: ['Landholding farmer families identified by the State or Union Territory', 'The family and land record must satisfy the current PM-KISAN rules', 'Institutional landholders and specified higher-income or professional categories are excluded', 'e-KYC and bank-account verification must be complete'],
    documents: ['Aadhaar and linked mobile number', 'Landholding record', 'Bank account and IFSC details', 'Any additional document requested during official verification'],
    howToApply: ['Open the official PM-KISAN portal', 'Use New Farmer Registration or check an existing beneficiary status', 'Complete e-KYC and correct land or bank details when requested'],
    officialUrl: 'https://pmkisan.gov.in/',
    sourceLabel: 'Official PM-KISAN portal',
    availabilityNote: 'The scheme is current; payment depends on official beneficiary verification.',
    colors: { from: '#195D3A', to: '#0D3925', accent: '#F1C75B' },
  },
  {
    id: 'namo-shetkari',
    name: 'Namo Shetkari Mahasanman Nidhi',
    shortName: 'नमो शेतकरी',
    category: 'Income support',
    authority: 'Government of Maharashtra',
    summary: 'Additional state support for eligible PM-KISAN families in Maharashtra.',
    benefit: 'Additional ₹6,000 a year',
    eligibilityPreview: 'Maharashtra farmer families who are eligible beneficiaries under PM-KISAN.',
    whatItIs: 'Namo Shetkari Mahasanman Nidhi is a Maharashtra state support scheme linked with PM-KISAN beneficiary data. It adds state assistance for eligible farmer families in Maharashtra.',
    benefits: ['₹6,000 per year in three equal instalments', 'Paid in addition to eligible PM-KISAN support', 'Transferred through the government benefit system'],
    eligibility: ['The farmer family must be in Maharashtra', 'The farmer must be eligible under PM-KISAN', 'Identity, bank and PM-KISAN beneficiary records must remain valid', 'Final inclusion is decided by the Maharashtra Government'],
    documents: ['PM-KISAN beneficiary or status details', 'Aadhaar and linked mobile number', 'Verified bank account', 'Land and beneficiary records when requested'],
    howToApply: ['Check PM-KISAN beneficiary and e-KYC status first', 'Use the Maharashtra Agriculture or MahaDBT portal for official information', 'Contact the agriculture department only when beneficiary details require correction'],
    officialUrl: 'https://mahadbt.maharashtra.gov.in/',
    applyUrl: 'https://www.myscheme.gov.in/schemes/namo-shetkari-mahasanman-nidhi-yojana',
    sourceLabel: 'MahaDBT Maharashtra',
    availabilityNote: 'Maharashtra-only scheme linked to PM-KISAN eligibility.',
    colors: { from: '#8C4B21', to: '#552A15', accent: '#F4D18A' },
  },
  {
    id: 'kcc',
    name: 'Kisan Credit Card',
    shortName: 'KCC',
    category: 'Credit and protection',
    authority: 'Ministry of Agriculture and Farmers Welfare',
    summary: 'Bank credit for cultivation, post-harvest and allied farming needs.',
    benefit: 'Flexible agricultural credit through participating banks',
    eligibilityPreview: 'Owner cultivators, tenant farmers, sharecroppers and eligible farmer groups.',
    whatItIs: 'Kisan Credit Card provides timely bank credit for crop cultivation, post-harvest expenses, produce marketing, farm assets and eligible allied activities. The bank decides the sanctioned limit and repayment conditions.',
    benefits: ['Single-window credit for seasonal farm requirements', 'Can cover post-harvest and produce-marketing expenses', 'Eligible borrowers may receive applicable interest support and prompt-repayment benefits'],
    eligibility: ['Individual or joint owner-cultivators', 'Tenant farmers, oral lessees and sharecroppers', 'Eligible Self Help Groups or Joint Liability Groups of farmers', 'The issuing bank must approve repayment capacity and required records'],
    documents: ['Completed bank application', 'Photographs and identity/address proof', 'Landholding or cultivation proof where applicable', 'Crop and acreage information', 'Security documents when required by the bank'],
    howToApply: ['Choose a participating bank', 'Ask for the Kisan Credit Card application', 'Submit crop, cultivation and identity information', 'Review the sanctioned limit, interest and repayment terms before accepting'],
    officialUrl: 'https://www.myscheme.gov.in/schemes/kcc',
    applyUrl: 'https://fasalrin.gov.in/eligibility',
    sourceLabel: 'Government myScheme portal',
    availabilityNote: 'Approval, limit and interest conditions are decided by the issuing bank.',
    colors: { from: '#234E72', to: '#142E45', accent: '#8FC2DC' },
  },
  {
    id: 'pmfby',
    name: 'Pradhan Mantri Fasal Bima Yojana',
    shortName: 'PMFBY',
    category: 'Credit and protection',
    authority: 'Ministry of Agriculture and Farmers Welfare',
    summary: 'Insurance protection for notified crops against specified crop losses.',
    benefit: 'Seasonal crop-risk cover',
    eligibilityPreview: 'Farmers cultivating a notified crop in a notified area and season.',
    whatItIs: 'PMFBY provides insurance protection for notified crops and risks. Crop, village, season, insurer, sum insured and enrolment deadline are defined through current State notifications.',
    benefits: ['Protection against specified prevented sowing, standing-crop and post-harvest losses', 'Farmer premium is supported by government subsidy', 'Online policy, application and claim-related services'],
    eligibility: ['The crop must be notified for the current season', 'The farm area must fall within a notified insurance unit', 'The farmer must have an insurable interest in the crop', 'Enrolment must be completed within the officially announced deadline'],
    documents: ['Identity proof and farmer registration details', 'Bank account information', 'Land or tenancy/cultivation record', 'Sowing or crop declaration', 'Any seasonal documents required by the State notification'],
    howToApply: ['Open the official crop-insurance portal', 'Check the current season, crop and area notification', 'Register or apply before the notified deadline', 'Keep the application acknowledgement and policy details'],
    officialUrl: 'https://pmfby.gov.in/',
    applyUrl: 'https://www.pmfby.gov.in/farmerRegistrationForm/',
    sourceLabel: 'Official PMFBY portal',
    availabilityNote: 'Availability and deadlines differ by crop, district, season and State notification.',
    colors: { from: '#176B72', to: '#0C3E43', accent: '#9CD6D1' },
  },
  {
    id: 'soil-health-card',
    name: 'Soil Health Card',
    shortName: 'SOIL HEALTH',
    category: 'Farm resources',
    authority: 'Department of Agriculture and Farmers Welfare',
    summary: 'Soil testing with nutrient and fertiliser recommendations.',
    benefit: 'Field-specific soil and nutrient guidance',
    eligibilityPreview: 'Farmers with cultivable land that can be sampled and tested.',
    whatItIs: 'The Soil Health Card system records the nutrient condition of a farmer’s soil and provides crop-wise guidance on fertilisers, organic inputs and soil amendments.',
    benefits: ['Soil nutrient-status report', 'Crop-wise fertiliser and amendment guidance', 'Support for more balanced input use and soil management'],
    eligibility: ['The applicant must cultivate or have legal access to cultivable land', 'A valid soil sample must be collected and tested', 'Sampling and local service availability depend on the agriculture department'],
    documents: ['Farmer or identity details', 'Field, survey or plot information', 'Mobile number for status communication', 'Previous soil card, if available'],
    howToApply: ['Ask the local agriculture office or soil-testing laboratory about sampling', 'Provide the field or survey details', 'Track or download the generated card through the official portal when available'],
    officialUrl: 'https://soilhealth.dac.gov.in/',
    sourceLabel: 'Official Soil Health Card portal',
    availabilityNote: 'Sampling schedules and service locations are managed locally.',
    colors: { from: '#756329', to: '#413615', accent: '#E2CF76' },
  },
  {
    id: 'pdmc',
    name: 'Per Drop More Crop — Micro Irrigation',
    shortName: 'PER DROP',
    category: 'Farm resources',
    authority: 'Government of India and State Agriculture Departments',
    summary: 'Support for approved drip and sprinkler irrigation systems.',
    benefit: 'Micro-irrigation financial assistance',
    eligibilityPreview: 'Farmers installing eligible systems under current state targets and rules.',
    whatItIs: 'Per Drop More Crop promotes efficient on-farm water use through drip and sprinkler systems. It is implemented through State plans, so approved equipment, subsidy, targets and application windows can differ.',
    benefits: ['Assistance for eligible drip or sprinkler systems', 'Improved water-use efficiency', 'State top-up support may be available in some locations'],
    eligibility: ['The applicant must be a farmer with eligible agricultural land', 'The proposed system and crop spacing must meet approved norms', 'A suitable water source and required land records may be needed', 'Previous subsidy and repeat-benefit restrictions must be checked'],
    documents: ['Aadhaar and farmer registration', '7/12 or relevant land record', 'Bank account details', 'Water-source and electricity information when applicable', 'Dealer quotation or approved system design'],
    howToApply: ['Open the Maharashtra MahaDBT Farmer portal', 'Select the micro-irrigation component when applications are open', 'Submit land, water-source and equipment details', 'Wait for official selection and pre-sanction before purchase'],
    officialUrl: 'https://mahadbt.maharashtra.gov.in/Farmer/Login/Login',
    sourceLabel: 'MahaDBT Farmer portal',
    availabilityNote: 'Application windows and targets are announced by the State.',
    colors: { from: '#276B8E', to: '#153D57', accent: '#9DD9EF' },
  },
  {
    id: 'pm-kusum',
    name: 'PM-KUSUM',
    shortName: 'PM-KUSUM',
    category: 'Farm resources',
    authority: 'Ministry of New and Renewable Energy',
    summary: 'Solar pumps, pump solarisation and farm-based renewable energy.',
    benefit: 'Support for eligible solar-energy components',
    eligibilityPreview: 'Farmers and eligible groups meeting the selected component and state rules.',
    whatItIs: 'PM-KUSUM supports decentralized renewable-energy plants, standalone solar agricultural pumps and solarisation of eligible grid-connected agricultural pumps through separate components.',
    benefits: ['Standalone solar agricultural pumps under eligible component rules', 'Solarisation of eligible grid-connected pumps', 'Opportunity under Component A to supply renewable power through approved projects'],
    eligibility: ['Individual farmers or eligible farmer groups', 'Cooperatives, panchayats, FPOs and Water User Associations for applicable components', 'The land, pump and electricity connection must meet the chosen component rules', 'Selection depends on State implementation, targets and technical approval'],
    documents: ['Identity and farmer details', 'Land record or land-use permission', 'Pump and electricity-connection details where applicable', 'Bank information', 'Technical or project documents required for the selected component'],
    howToApply: ['Read the official component details first', 'Use the Maharashtra PM-KUSUM portal for the relevant state process', 'Apply only through the designated government portal or implementing agency', 'Confirm beneficiary contribution before making any payment'],
    officialUrl: 'https://pmkusum.mnre.gov.in/landing.html',
    applyUrl: 'https://pmkusum.maharashtra.gov.in/landing.html',
    sourceLabel: 'National PM-KUSUM portal',
    availabilityNote: 'Component availability and beneficiary selection depend on State targets.',
    colors: { from: '#B36B16', to: '#713D0B', accent: '#FFD477' },
  },
  {
    id: 'smam',
    name: 'Sub-Mission on Agricultural Mechanization',
    shortName: 'SMAM',
    category: 'Farm resources',
    authority: 'Ministry of Agriculture and Farmers Welfare',
    summary: 'Assistance and shared access for eligible farm machinery.',
    benefit: 'Machinery support and custom-hiring access',
    eligibilityPreview: 'Farmers, groups, FPOs and eligible machinery centres under state allocations.',
    whatItIs: 'SMAM expands access to agricultural machinery through support for individual equipment, Custom Hiring Centres, Farm Machinery Banks, demonstrations and training.',
    benefits: ['Financial assistance for eligible machinery', 'Custom Hiring Centres and Farm Machinery Banks', 'Training, demonstrations and improved access for small farmers'],
    eligibility: ['Individual farmers under the applicable State component', 'Farmer groups, SHGs, cooperatives and FPOs for eligible group components', 'The machine must appear in the approved implement list', 'Selection depends on annual targets, beneficiary category and physical verification'],
    documents: ['Farmer registration and identity proof', 'Land or cultivation information when required', 'Bank details', 'Category certificate when claiming category-based support', 'Approved machinery quotation or application details'],
    howToApply: ['Check the current State application window', 'Register on the official farm-mechanization or Maharashtra MahaDBT portal', 'Select an approved implement and submit the required records', 'Do not purchase before official approval when pre-sanction is required'],
    officialUrl: 'https://agrimachinery.nic.in/Index/Level',
    applyUrl: 'https://mahadbt.maharashtra.gov.in/Farmer/Login/Login',
    sourceLabel: 'Official Farm Mechanization DBT portal',
    availabilityNote: 'Applications are target-based and may reopen each financial year.',
    colors: { from: '#5E596B', to: '#34313D', accent: '#C6BDD8' },
  },
  {
    id: 'aif',
    name: 'Agriculture Infrastructure Fund',
    shortName: 'AIF',
    category: 'Growth and infrastructure',
    authority: 'Department of Agriculture and Farmers Welfare',
    summary: 'Financing support for viable post-harvest and community-farming projects.',
    benefit: 'Interest support and credit guarantee for eligible loans',
    eligibilityPreview: 'Eligible farmers, collectives and agri-enterprises with a viable infrastructure project.',
    whatItIs: 'Agriculture Infrastructure Fund supports medium- and long-term financing for eligible post-harvest infrastructure and community-farming assets. It is project finance, not a direct cash grant.',
    benefits: ['Interest subvention of 3% per year on eligible loans', 'Credit-guarantee support up to the applicable scheme limit', 'Support for eligible storage, grading, processing, logistics and community assets'],
    eligibility: ['Eligible farmers, PACS, FPOs, SHGs, cooperatives, agri-entrepreneurs and other listed entities', 'The proposal must be an eligible post-harvest or community-farming asset', 'The project must be financially viable and approved by a participating lender', 'Scheme and lender due diligence must be completed'],
    documents: ['Applicant and entity registration records', 'Detailed project report', 'Land or lease documents', 'Project quotations and approvals', 'Bank and financial information requested by the lender'],
    howToApply: ['Review the eligible activities on the official AIF portal', 'Prepare a project report and estimated project cost', 'Apply through the portal and select a participating lending institution', 'Complete lender appraisal and government-scheme verification'],
    officialUrl: 'https://agriinfra.dac.gov.in/',
    sourceLabel: 'Official Agriculture Infrastructure Fund portal',
    availabilityNote: 'Loan sanction depends on project eligibility and lender appraisal.',
    colors: { from: '#3D5F4A', to: '#20392A', accent: '#A7C8AF' },
  },
  {
    id: 'fpo',
    name: 'Formation and Promotion of 10,000 FPOs',
    shortName: '10,000 FPOs',
    category: 'Growth and infrastructure',
    authority: 'Ministry of Agriculture and Farmers Welfare',
    summary: 'Collective support for aggregation, inputs, value addition and market access.',
    benefit: 'FPO formation, handholding and institutional support',
    eligibilityPreview: 'Producer groups and registered FPOs working through designated agencies and CBBOs.',
    whatItIs: 'The Central Sector FPO scheme supports farmer collectives with professional handholding, business planning, market linkage and eligible institutional assistance. Benefits are generally provided to the FPO, not as a direct individual-farmer payment.',
    benefits: ['Professional handholding for eligible FPOs', 'Support for management, market linkage and business development', 'Eligible equity-grant and credit-guarantee facilities for qualifying FPOs'],
    eligibility: ['Farm producers forming or joining a qualifying producer collective', 'The FPO must be registered under an accepted legal structure', 'Membership and cluster requirements must meet current operational guidelines', 'Formation and support are coordinated through designated implementing agencies and CBBOs'],
    documents: ['Member and producer details', 'FPO registration and incorporation records', 'Board and governance records', 'Business plan and cluster information', 'Bank and statutory documents for financial support'],
    howToApply: ['Check existing FPOs and CBBO contacts for the district', 'Farmers may join a suitable existing FPO or discuss formation through a designated agency', 'Registered FPOs should use official SFAC guidance for eligible support'],
    officialUrl: 'https://www.sfacindia.com/FPOS.aspx',
    applyUrl: 'https://sfacindia.com/fpoundercss.aspx',
    sourceLabel: 'Small Farmers’ Agri-Business Consortium',
    availabilityNote: 'Support is routed through registered FPOs and designated implementing agencies.',
    colors: { from: '#6B4130', to: '#3A241B', accent: '#D7B399' },
  },
]

const CATEGORY_ORDER: SchemeCategory[] = ['Income support', 'Credit and protection', 'Farm resources', 'Growth and infrastructure']

function SchemeBanner({ scheme, large = false }: { scheme: Scheme; large?: boolean }) {
  return <div className={`relative overflow-hidden text-white ${large ? 'min-h-[190px] p-7 sm:p-9' : 'h-40 p-5'}`} style={{ background: `linear-gradient(135deg, ${scheme.colors.from}, ${scheme.colors.to})` }}>
    <svg className="absolute -right-8 -top-12 h-56 w-56 opacity-20" viewBox="0 0 220 220" fill="none" aria-hidden="true"><circle cx="110" cy="110" r="82" stroke="currentColor" strokeWidth="2" /><circle cx="110" cy="110" r="56" stroke="currentColor" /><path d="M110 36v148M36 110h148M58 58l104 104M162 58 58 162" stroke="currentColor" /></svg>
    <svg className="absolute bottom-0 right-5 h-24 w-32 opacity-25" viewBox="0 0 140 100" fill="none" aria-hidden="true"><path d="M12 88c19-35 43-52 72-52 21 0 36 11 44 33M44 85c8-23 21-35 40-35 13 0 23 7 31 21" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /><path d="M74 38c-1-14 5-24 18-31-1 15-7 25-18 31Zm0 0c-12-9-24-10-36-3 11 10 23 11 36 3Z" fill="currentColor" /></svg>
    <div className="relative z-10 flex h-full flex-col justify-between">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: scheme.colors.accent }}>{scheme.authority}</div>
      <div>
        <div className={`font-display font-bold leading-none ${large ? 'text-4xl sm:text-5xl' : 'text-3xl'}`}>{scheme.shortName}</div>
        <div className="mt-2 max-w-[80%] text-xs font-semibold text-white/70">{scheme.category}</div>
      </div>
    </div>
  </div>
}

function SchemeCard({ scheme, onOpen }: { scheme: Scheme; onOpen: () => void }) {
  return <article className="flex w-[300px] shrink-0 snap-start flex-col overflow-hidden border sm:w-[340px]" style={{ background: '#FFFEFA', borderColor: '#D8DED8' }}>
    <SchemeBanner scheme={scheme} />
    <div className="flex flex-1 flex-col p-5">
      <div className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: '#3F6B45' }}>Current scheme</div>
      <h4 className="mt-2 text-xl font-bold leading-snug" style={{ color: '#1D241F' }}>{scheme.name}</h4>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: '#687069' }}>{scheme.summary}</p>
      <div className="mt-4 border-l-2 px-3 py-2" style={{ background: '#F7F3E8', borderColor: '#C5A15A' }}>
        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#765B2E' }}>Main benefit</div>
        <div className="mt-1 text-sm font-bold" style={{ color: '#1D241F' }}>{scheme.benefit}</div>
      </div>
      <div className="mt-4">
        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#52635A' }}>Who can check eligibility</div>
        <p className="mt-1.5 text-xs leading-relaxed" style={{ color: '#687069' }}>{scheme.eligibilityPreview}</p>
      </div>
      <button type="button" onClick={onOpen} className="mt-5 w-full border px-4 py-3 text-sm font-bold" style={{ borderColor: '#173F2A', color: '#173F2A' }}>View complete details</button>
    </div>
  </article>
}

function SchemeModal({ scheme, onClose }: { scheme: Scheme; onClose: () => void }) {
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0B1E14]/70 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div role="dialog" aria-modal="true" aria-labelledby="scheme-dialog-title" className="max-h-[92vh] w-full max-w-4xl overflow-y-auto border shadow-2xl" style={{ background: '#F7F6F1', borderColor: 'rgba(255,255,255,0.3)' }}>
      <div className="relative">
        <SchemeBanner scheme={scheme} large />
        <button type="button" onClick={onClose} aria-label="Close scheme details" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border text-white backdrop-blur" style={{ background: 'rgba(0,0,0,0.22)', borderColor: 'rgba(255,255,255,0.35)' }}><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /></svg></button>
      </div>
      <div className="p-5 sm:p-8">
        <div className="flex flex-col gap-3 border-b pb-6 sm:flex-row sm:items-start sm:justify-between" style={{ borderColor: '#D8DED8' }}>
          <div><div className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: '#3F6B45' }}>{scheme.category}</div><h3 id="scheme-dialog-title" className="mt-2 text-3xl font-bold" style={{ color: '#1D241F' }}>{scheme.name}</h3><p className="mt-2 text-sm" style={{ color: '#687069' }}>{scheme.authority}</p></div>
          <div className="shrink-0 border px-3 py-2 text-xs font-bold" style={{ background: '#EAF5EE', borderColor: '#BDD5C5', color: '#216644' }}>Current scheme</div>
        </div>

        <section className="py-6"><h4 className="text-lg font-bold" style={{ color: '#1D241F' }}>What is it?</h4><p className="mt-3 max-w-3xl text-base leading-relaxed" style={{ color: '#52635A' }}>{scheme.whatItIs}</p></section>

        <div className="grid gap-6 border-y py-6 lg:grid-cols-2" style={{ borderColor: '#D8DED8' }}>
          <section><h4 className="text-lg font-bold" style={{ color: '#1D241F' }}>Main benefits</h4><ul className="mt-3 space-y-3">{scheme.benefits.map((item) => <li key={item} className="flex gap-3 text-sm leading-relaxed" style={{ color: '#52635A' }}><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: '#C5A15A' }} />{item}</li>)}</ul></section>
          <section><h4 className="text-lg font-bold" style={{ color: '#1D241F' }}>Eligibility criteria</h4><ul className="mt-3 space-y-3">{scheme.eligibility.map((item) => <li key={item} className="flex gap-3 text-sm leading-relaxed" style={{ color: '#52635A' }}><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: '#3F6B45' }} />{item}</li>)}</ul></section>
        </div>

        <div className="grid gap-6 py-6 lg:grid-cols-2">
          <section className="border p-5" style={{ background: '#FFFEFA', borderColor: '#D8DED8' }}><h4 className="text-base font-bold" style={{ color: '#1D241F' }}>Documents usually required</h4><ul className="mt-3 space-y-2">{scheme.documents.map((item) => <li key={item} className="text-sm leading-relaxed" style={{ color: '#52635A' }}>— {item}</li>)}</ul></section>
          <section className="border p-5" style={{ background: '#FFFEFA', borderColor: '#D8DED8' }}><h4 className="text-base font-bold" style={{ color: '#1D241F' }}>How to apply or learn more</h4><ol className="mt-3 space-y-3">{scheme.howToApply.map((item, index) => <li key={item} className="flex gap-3 text-sm leading-relaxed" style={{ color: '#52635A' }}><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: '#F2EDDF', color: '#765B2E' }}>{index + 1}</span>{item}</li>)}</ol></section>
        </div>

        <div className="border p-4 text-sm leading-relaxed" style={{ background: '#FFF8ED', borderColor: '#E8C98F', color: '#765B2E' }}><strong>Check before applying:</strong> {scheme.availabilityNote} Final eligibility, benefit, documents and deadlines are decided by the official department or participating bank.</div>

        <div className="mt-6 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: '#D8DED8' }}>
          <div className="text-xs leading-relaxed" style={{ color: '#687069' }}>Official information checked 2 September 2026<br /><strong style={{ color: '#35483B' }}>{scheme.sourceLabel}</strong></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a href={scheme.officialUrl} target="_blank" rel="noreferrer" className="border px-4 py-3 text-center text-sm font-bold" style={{ borderColor: '#173F2A', color: '#173F2A' }}>Official information</a>
            {scheme.applyUrl && <a href={scheme.applyUrl} target="_blank" rel="noreferrer" className="px-4 py-3 text-center text-sm font-bold text-white" style={{ background: '#173F2A' }}>Official portal</a>}
          </div>
        </div>
      </div>
    </div>
  </div>
}

export function GovernmentSchemes() {
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null)

  return <div className="scheme-catalogue space-y-12">
    <header className="max-w-3xl">
      <div className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#3F6B45' }}>Government support</div>
      <h2 className="mt-2 text-4xl font-bold" style={{ color: '#1D241F' }}>Schemes currently available for farmers.</h2>
      <p className="mt-3 text-base leading-relaxed" style={{ color: '#687069' }}>Browse major Central and Maharashtra schemes by purpose. Open any scheme to see its benefits, complete eligibility criteria, documents and official application guidance.</p>
      <div className="mt-5 border-l-2 px-4 py-3 text-sm leading-relaxed" style={{ background: '#F7F3E8', borderColor: '#C5A15A', color: '#52635A' }}>Scheme applications can open or close according to season, State targets and government notifications. Always confirm availability on the linked official portal.</div>
    </header>

    {CATEGORY_ORDER.map((category) => {
      const schemes = SCHEMES.filter((scheme) => scheme.category === category)
      return <section key={category} aria-labelledby={`scheme-category-${category.replace(/\s+/g, '-').toLowerCase()}`}>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div><div className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: '#3F6B45' }}>{schemes.length} {schemes.length === 1 ? 'scheme' : 'schemes'}</div><h3 id={`scheme-category-${category.replace(/\s+/g, '-').toLowerCase()}`} className="mt-1 text-2xl font-bold" style={{ color: '#1D241F' }}>{category}</h3></div>
          <div className="hidden items-center gap-2 text-xs font-semibold sm:flex" style={{ color: '#687069' }}><span>Scroll to explore</span><svg className="h-4 w-5" viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 8h19m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
        </div>
        <div className="overflow-x-auto pb-4">
          <div className="flex w-max snap-x snap-mandatory gap-5 pr-4">
            {schemes.map((scheme) => <SchemeCard key={scheme.id} scheme={scheme} onOpen={() => setSelectedScheme(scheme)} />)}
          </div>
        </div>
      </section>
    })}

    <footer className="border-t pt-6 text-xs leading-relaxed" style={{ borderColor: '#D8DED8', color: '#687069' }}>Majhe Kisan provides general scheme information only. It does not submit applications, verify documents or decide government eligibility.</footer>
    {selectedScheme && <SchemeModal scheme={selectedScheme} onClose={() => setSelectedScheme(null)} />}
  </div>
}

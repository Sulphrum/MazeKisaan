import { useState, useEffect, type ReactNode } from 'react'
import type { ProcurementDemand, StorageStockItem, User } from '../../types'
import { api } from '../../services/api'
import { MarketOverview } from './MarketOverview'
import { CropValue } from './CropValue'
import { GovernmentSchemes } from './GovernmentSchemes'

// ─── Types ────────────────────────────────────────────────────────────────────
type NavTab = 'home' | 'crops' | 'storage' | 'market' | 'cropValue' | 'schemes' | 'history' | 'account'
type SmartStep = 1 | 2 | 3 | 4 | 5 | 6

interface ActiveSaleSummary {
  stockId: string
  crop: string
  quantityQtl: number
  price: number
  buyer: string
  status: 'Buyer confirmation pending' | 'Marketplace listing active' | 'Mandi plan prepared'
}

interface SaleReview {
  kind: 'buyer' | 'mandi'
  title: string
  quantityQtl: number
  pricePerQtl: number
  gross: number
  transportCost: number
  otherCosts: number
  net: number
  deliveryText: string
  demand?: ProcurementDemand
}

interface SchemeDocument {
  label: string
  state: 'Ready' | 'Needs verification' | 'Missing'
  note: string
}

interface PersonalizedScheme {
  id: string
  icon: string
  title: string
  category: string
  matchStatus: string
  benefitType: string
  benefitHeadline: string
  cashValue: number | null
  whyMatched: string
  officialCheck: string
  documents: SchemeDocument[]
  officialUrl: string
  sourceLabel: string
  rulesCheckedOn: string
}

interface SchemeGuidance {
  profile: { farmerName: string; location: string; landAcres: number; crops: string[]; irrigation: string[] }
  summary: { matchedCount: number; possibleDirectSupport: number }
  deadlineStatus: { verifiedDeadlines: unknown[]; message: string }
  schemes: PersonalizedScheme[]
  serviceCentre: { title: string; detail: string; officialUrl: string }
  disclaimer: string
}

interface CropData {
  id: string; name: string; variety: string; acres: string; sowing: string
  harvest: string; yieldQtl: number; yield: string; spent: string
  stage: string; health: string; maturity: number; irrigation: string
  img: string; emoji: string
  expenses?: { seeds: number; fertilizers: number; irrigation: number; labour: number; pestControl: number; machinery: number }
}

interface StrategyOption {
  id: 'A' | 'B' | 'C'
  label: string
  description: string
  predicted_price: number
  gross_revenue: number
  deductions: {
    transport: number
    market_commission: number
    packaging: number
    spoilage_loss: number
    storage_cost: number
  }
  total_deductions: number
  cultivation_expense: number
  net_realization: number
  net_per_qtl: number
  risk: string
  risk_color: 'green' | 'yellow' | 'lime' | 'red'
  shelf_life_safe: boolean
}

interface StrategyResult {
  strategies: StrategyOption[]
  recommended_strategy: 'A' | 'B' | 'C'
  recommendation_summary: string
  why_factors: string[]
}

interface FestivalContext {
  next_festival: string
  days_away: number
  expected_demand_boost: string
  advice: string
}

interface UpcomingFestival {
  name: string
  start_date: string
  days_away: number
  expected_price_impact: string
  affected_crops: string[]
  advice: string
}

// ─── Static look-up data ──────────────────────────────────────────────────────
const CROP_EMOJIS: Record<string, string> = {
  Tomato: '🍅', Onion: '🧅', Potato: '🥔', Wheat: '🌾',
  Maize: '🌽', Grapes: '🍇', Soybean: '🌱', Cotton: '☁️',
  'Green Chilli': '🌶️', Other: '🌿',
}
const CROP_IMGS: Record<string, string> = {
  Tomato: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=600&h=280&fit=crop&auto=format',
  Onion: 'https://images.unsplash.com/photo-1565685225009-fc85d9109c80?w=600&h=280&fit=crop&auto=format',
  Grapes: 'https://images.unsplash.com/photo-1474722883778-792e7fb1bd9f?w=600&h=280&fit=crop&auto=format',
  Potato: 'https://images.unsplash.com/photo-1518977676405-d40a08fe0bb3?w=600&h=280&fit=crop&auto=format',
  Wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&h=280&fit=crop&auto=format',
}
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4e6?w=600&h=280&fit=crop&auto=format'

const INITIAL_CROPS: CropData[] = [
  { id: 'tomato', name: 'Tomato', variety: 'Hybrid Table S-31', acres: '2 Acres', sowing: '20 Jun 2026', harvest: '03 Sep 2026', yieldQtl: 60, yield: '60 Quintals', spent: '₹28,000', stage: 'Fruiting / Ripening', health: 'Healthy', maturity: 85, irrigation: 'Drip Irrigation', img: CROP_IMGS.Tomato, emoji: '🍅', expenses: { seeds: 4500, fertilizers: 6200, irrigation: 3800, labour: 8500, pestControl: 2500, machinery: 2500 } },
  { id: 'onion', name: 'Onion', variety: 'Nashik Red Garwa', acres: '3 Acres', sowing: '15 Jul 2026', harvest: '28 Oct 2026', yieldQtl: 85, yield: '85 Quintals', spent: '₹32,000', stage: 'Bulb Development', health: 'Healthy', maturity: 52, irrigation: 'Flood Irrigation', img: CROP_IMGS.Onion, emoji: '🧅', expenses: { seeds: 5200, fertilizers: 7400, irrigation: 4100, labour: 9600, pestControl: 3100, machinery: 2600 } },
]

const BUYERS = [
  { id: 'deccan', name: 'Deccan Fresh Exports', price: '₹2,580 / Qtl', dist: '28 km', grade: 'Grade A Required', transport: true, isAI: true },
  { id: 'sahyadri', name: 'Sahyadri Agro', price: '₹2,340 / Qtl', dist: '35 km', grade: 'Grade A/B', transport: true, isAI: false },
  { id: 'nashik', name: 'Nashik Foods Pvt Ltd', price: '₹2,280 / Qtl', dist: '42 km', grade: 'Grade B', transport: false, isAI: false },
  { id: 'green', name: 'Green Valley Traders', price: '₹2,190 / Qtl', dist: '30 km', grade: 'Grade A', transport: true, isAI: false },
]
const TRANSPORT = [
  { id: 'tata', name: 'Tata Ace / Mini Truck', cost: '₹728', capacity: '1.2 Ton', delivery: '1 Day', icon: '🚛', isAI: true },
  { id: 'bolero', name: 'Bolero Pickup', cost: '₹850', capacity: '1.2 Ton', delivery: '1 Day', icon: '🚐', isAI: false },
  { id: 'tractor', name: 'Tractor Trolley', cost: '₹600', capacity: '1.5 Ton', delivery: '2 Days', icon: '🚜', isAI: false },
  { id: 'reefer', name: 'Reefer Van', cost: '₹1,450', capacity: '1 Ton', delivery: '1 Day', icon: '❄️', isAI: false },
  { id: 'fpo', name: 'FPO Shared Van', cost: '₹520', capacity: '1.0 Ton', delivery: '1–2 Days', icon: '🤝', isAI: false },
]
const STORAGE = [
  { id: 'wdra', name: 'WDRA Godown', cost: '₹18 / Day', dist: '14 km', note: 'Good Facility · Secure', icon: '🏭', isDirect: false, isAI: true },
  { id: 'cold', name: 'Cold Storage', cost: '₹45 / Day', dist: '22 km', note: 'Temperature Controlled', icon: '🧊', isDirect: false, isAI: false },
  { id: 'govt', name: 'Government Warehouse', cost: '₹15 / Day', dist: '18 km', note: 'Subsidised', icon: '🏛️', isDirect: false, isAI: false },
  { id: 'direct', name: 'No Storage — Sell Directly', cost: 'Free', dist: '—', note: 'AI: Direct selling may increase your profit.', icon: '⚡', isDirect: true, isAI: false },
]
const HARVEST_STORAGE = [
  { id: 'farm', name: 'On-Farm Storage (Crates / Room)', facility: 'On-Farm Storage', cost: 0, shelfLife: 5, note: 'Free · Best for immediate sale', icon: '🏡' },
  { id: 'wdra', name: 'WDRA Certified Godown', facility: 'WDRA Godown, Niphad', cost: 18, shelfLife: 12, note: 'Secure · ₹18/day', icon: '🏭' },
  { id: 'cold', name: 'Cold Storage Facility', facility: 'Cold Storage Facility', cost: 45, shelfLife: 25, note: 'Climate controlled · ₹45/day', icon: '🧊' },
]
const STEP_LABELS = ['AI Suggestion', 'Buyer', 'Transport', 'Storage', 'Quality Check', 'Confirm & Sell']

const MARKET_PRICES = [
  { crop: 'Tomato', emoji: '🍅', min: '₹2,200', max: '₹2,800', modal: '₹2,580', change: 6, up: true },
  { crop: 'Onion', emoji: '🧅', min: '₹1,100', max: '₹1,450', modal: '₹1,280', change: 2, up: false },
  { crop: 'Potato', emoji: '🥔', min: '₹1,600', max: '₹2,200', modal: '₹1,950', change: 1, up: true },
  { crop: 'Grapes', emoji: '🍇', min: '₹18,000', max: '₹22,000', modal: '₹19,800', change: 4, up: true },
  { crop: 'Green Chilli', emoji: '🌶️', min: '₹3,000', max: '₹3,800', modal: '₹3,350', change: 8, up: true },
  { crop: 'Wheat', emoji: '🌾', min: '₹2,100', max: '₹2,400', modal: '₹2,250', change: 1, up: false },
  { crop: 'Cotton', emoji: '☁️', min: '₹6,800', max: '₹7,450', modal: '₹7,120', change: 3, up: true },
]
const MARKET_CATEGORIES = ['All Crops', 'Vegetables', 'Fruits', 'Pulses', 'Grains']

const DEMO_BUYER_DEMANDS: ProcurementDemand[] = [
  { id: 'demo_nashik_fresh', buyerName: 'Meera Deshmukh', buyerCompany: 'Nashik Fresh Foods', cropName: 'Tomato', variety: 'Hybrid / Table Grade', quantityQtlNeeded: 30, targetPricePerQtl: '₹2,520 / Qtl', targetPriceNumeric: 2520, requiredByDate: 'Within 3 days', deliveryLocation: 'Nashik Food Park', buyerType: 'Food Processor', gradeRequired: 'Grade A / B', responsesCount: 3, status: 'Active', transportProvidedByBuyer: true, pickupDistanceKm: 12 },
  { id: 'demo_mahavedge', buyerName: 'Rahul Jagtap', buyerCompany: 'MahaVeg Retail Network', cropName: 'Potato', variety: 'Kufri Jyoti', quantityQtlNeeded: 60, targetPricePerQtl: '₹2,050 / Qtl', targetPriceNumeric: 2050, requiredByDate: 'Within 5 days', deliveryLocation: 'Nashik Collection Centre', buyerType: 'Retail Chain', gradeRequired: 'Grade B+', responsesCount: 7, status: 'Active', transportProvidedByBuyer: true, pickupDistanceKm: 18 },
  { id: 'demo_lasalgaon', buyerName: 'Sanjay Patil', buyerCompany: 'Lasalgaon Crop Traders', cropName: 'Onion', variety: 'Nashik Red Garwa', quantityQtlNeeded: 100, targetPricePerQtl: '₹2,350 / Qtl', targetPriceNumeric: 2350, requiredByDate: '10 Sep 2026', deliveryLocation: 'Lasalgaon Trading Yard', buyerType: 'Wholesale Trader', gradeRequired: 'Grade A / B', responsesCount: 9, status: 'Active', transportProvidedByBuyer: false, pickupDistanceKm: 22 },
  { id: 'demo_greenbasket', buyerName: 'Aditi Shah', buyerCompany: 'Green Basket Mumbai', cropName: 'Grapes', variety: 'Thompson Seedless', quantityQtlNeeded: 40, targetPricePerQtl: '₹20,500 / Qtl', targetPriceNumeric: 20500, requiredByDate: '12 Sep 2026', deliveryLocation: 'Vashi Fresh Produce Hub', buyerType: 'Retail Chain', gradeRequired: 'Export Grade A', responsesCount: 5, status: 'Active', transportProvidedByBuyer: true, pickupDistanceKm: 145 },
]

const SCHEMES = [
  { id: 's1', name: 'PM Kisan Samman Nidhi', desc: 'Income support of ₹6,000 per year to eligible farmer families across India.', benefit: '₹6,000 / Year', category: 'Financial Support', icon: '🌱', color: '#238B5B' },
  { id: 's2', name: 'Crop Insurance Scheme (PMFBY)', desc: 'Financial support for crop loss due to natural calamities, pests and diseases.', benefit: 'Upto 75% Cover', category: 'Insurance', icon: '🛡️', color: '#0B4F3A' },
  { id: 's3', name: 'Kisan Credit Card (KCC)', desc: 'Easy and affordable credit access for farmers at subsidised interest rates.', benefit: 'Low Interest', category: 'Financial Support', icon: '💳', color: '#D99A25' },
  { id: 's4', name: 'Soil Health Card Scheme', desc: 'Free soil testing and personalised recommendations for better crop yield.', benefit: 'Free Testing', category: 'Infrastructure', icon: '🧪', color: '#238B5B' },
  { id: 's5', name: 'Agri Infrastructure Fund', desc: 'Financing for post-harvest management and supply chain infrastructure.', benefit: 'Up to ₹2 Crore', category: 'Infrastructure', icon: '🏗️', color: '#0B4F3A' },
  { id: 's6', name: 'eNAM — Online Mandi', desc: 'Sell your produce online across India through the National Agriculture Market.', benefit: 'Better Prices', category: 'Training', icon: '🌐', color: '#063B2A' },
]
const SCHEME_TABS = ['Matched for Me', 'Subsidies', 'Insurance', 'Responsible Credit', 'Farm Services']

const HISTORY_DATA = [
  { id: 'h1', name: 'Tomato', variety: 'Hybrid Table S-31', emoji: '🍅', img: CROP_IMGS.Tomato, acres: '2.0 Acres', quintals: '60 Quintals', sowing: '20 Jun 2025', harvest: '12 Oct 2025', soldOn: '12 Oct 2025', expense: '₹28,000', buyer: 'Deccan Fresh Exports', price: '₹2,580 / Qtl', transport: 'Tata Ace / Mini Truck', transportCost: '₹728', storage: 'WDRA Godown', storageCost: '₹1,100', grade: 'Grade A', confidence: '97.8%', gross: '₹1,54,800', deductions: '₹28,728', net: '₹1,26,072', moisture: '11.4%', size: '58 mm', defects: '1.2%' },
  { id: 'h2', name: 'Grapes', variety: 'Thompson Seedless', emoji: '🍇', img: CROP_IMGS.Grapes, acres: '1.5 Acres', quintals: '60 Quintals', sowing: '15 Jan 2025', harvest: '05 Sep 2025', soldOn: '05 Sep 2025', expense: '₹45,000', buyer: 'Fresh Exports Ltd', price: '₹1,975 / Qtl', transport: 'Reefer Van', transportCost: '₹1,200', storage: 'Cold Storage', storageCost: '₹2,700', grade: 'Grade A', confidence: '96.2%', gross: '₹1,18,500', deductions: '₹20,050', net: '₹98,450', moisture: '12.1%', size: '14 mm', defects: '0.8%' },
  { id: 'h3', name: 'Potato', variety: 'Kufri Pukhraj', emoji: '🥔', img: CROP_IMGS.Potato, acres: '3.0 Acres', quintals: '80 Quintals', sowing: '01 Nov 2024', harvest: '20 Aug 2025', soldOn: '20 Aug 2025', expense: '₹38,000', buyer: 'Nashik Foods Pvt Ltd', price: '₹1,800 / Qtl', transport: 'Tractor Trolley', transportCost: '₹600', storage: 'Government Warehouse', storageCost: '₹900', grade: 'Grade B', confidence: '94.5%', gross: '₹1,44,000', deductions: '₹38,700', net: '₹1,05,300', moisture: '13.2%', size: '55 mm', defects: '2.1%' },
]

// ─── Shared components ────────────────────────────────────────────────────────
function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E2EBE5' }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: '#238B5B' }} />
    </div>
  )
}

function Badge({ children, variant = 'success' }: { children: ReactNode; variant?: 'success' | 'warning' | 'gold' | 'neutral' }) {
  const s = { success: ['#EAF5EE', '#238B5B'], warning: ['#FFF8ED', '#D99A25'], gold: ['#F4C44E', '#063B2A'], neutral: ['#F0F4F2', '#66736C'] }[variant]
  return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap" style={{ background: s[0], color: s[1] }}>{children}</span>
}

function SelectCard({ selected, onClick, children, className = '' }: { selected: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button onClick={onClick} className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all hover:shadow-sm ${selected ? 'border-[#063B2A] bg-[#EAF5EE]' : 'border-[#E2EBE5] bg-white'} ${className}`}>
      {children}
    </button>
  )
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl font-bold" style={{ color: '#17221D' }}>{title}</h2>
      <p className="text-sm mt-0.5" style={{ color: '#66736C' }}>{subtitle}</p>
    </div>
  )
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="block text-xs font-semibold mb-1.5" style={{ color: '#66736C' }}>{children}</label>
}

function Input({ placeholder, value, onChange, type = 'text' }: { placeholder: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full py-2.5 px-3.5 rounded-xl text-sm outline-none"
      style={{ border: '1.5px solid #E2EBE5', color: '#17221D', background: '#fff' }}
      onFocus={(e) => { e.currentTarget.style.borderColor = '#063B2A' }}
      onBlur={(e) => { e.currentTarget.style.borderColor = '#E2EBE5' }}
    />
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full py-2.5 px-3.5 rounded-xl text-sm outline-none appearance-none"
      style={{ border: '1.5px solid #E2EBE5', color: value ? '#17221D' : '#66736C', background: '#fff' }}
      onFocus={(e) => { e.currentTarget.style.borderColor = '#063B2A' }}
      onBlur={(e) => { e.currentTarget.style.borderColor = '#E2EBE5' }}
    >
      {options.map(o => <option key={o} value={o === options[0] && o.startsWith('Select') ? '' : o}>{o}</option>)}
    </select>
  )
}

function generateFallbackStrategies(crop: CropData, qualityDone: boolean, storageCostPerDay = 18, shelfLifeDays = 6, spoilageRiskPct = 3): StrategyResult {
  const qty = crop.yieldQtl || 60
  const basePrice = 2580
  const expense = parseInt(crop.spent?.replace(/[^0-9]/g, '') || '28000')
  const calcNet = (price: number, quantity: number, transport: number, commission: number, packaging: number, spoilage: number, storage: number) => {
    const gross = price * quantity
    const deductions = transport + commission + packaging + spoilage + storage
    return { gross, deductions, net: gross - deductions - expense }
  }
  const futurePrice = Math.round(basePrice * 1.054)
  const splitPrice = Math.round(basePrice * 0.6 + futurePrice * 0.4)
  const a = calcNet(basePrice, qty, 728, Math.round(basePrice * qty * 0.015), 1200, 0, 0)
  const waitSpoilage = Math.round(basePrice * qty * (spoilageRiskPct / 100))
  const fullStorage = Math.round(storageCostPerDay * 7 * (qty / 10))
  const splitStorage = Math.round(storageCostPerDay * 5 * ((qty * 0.4) / 10))
  const b = calcNet(futurePrice, qty, 728, Math.round(futurePrice * qty * 0.015), 1200, waitSpoilage, fullStorage)
  const c = calcNet(splitPrice, qty, 728, Math.round(splitPrice * qty * 0.015), 1200, Math.round(waitSpoilage * 0.4), splitStorage)

  return {
    recommended_strategy: 'C',
    recommendation_summary: 'Strategy C gives the best risk-adjusted return. Prices are rising but shelf life risk makes full waiting risky.',
    why_factors: [
      'Price trending up +5.4% over next 7 days',
      'Shelf life of 6 days makes full wait risky',
      qualityDone ? 'Grade A premium adds ₹180/Qtl advantage' : 'Complete quality check to unlock Grade A pricing',
      'Festival demand approaching — partial hold captures upside',
    ],
    strategies: [
      {
        id: 'A', label: 'Sell Everything Now', description: `Sell all ${qty} quintals today`,
        predicted_price: basePrice, gross_revenue: a.gross,
        deductions: { transport: 728, market_commission: Math.round(basePrice * qty * 0.015), packaging: 1200, spoilage_loss: 0, storage_cost: 0 },
        total_deductions: a.deductions, cultivation_expense: expense, net_realization: a.net,
        net_per_qtl: Math.round(a.net / qty), risk: 'Low', risk_color: 'green', shelf_life_safe: true,
      },
      {
        id: 'B', label: 'Store & Sell in 7 Days', description: 'Wait for price to rise',
        predicted_price: futurePrice, gross_revenue: b.gross,
        deductions: { transport: 728, market_commission: Math.round(futurePrice * qty * 0.015), packaging: 1200, spoilage_loss: waitSpoilage, storage_cost: fullStorage },
        total_deductions: b.deductions, cultivation_expense: expense, net_realization: b.net,
        net_per_qtl: Math.round(b.net / qty), risk: shelfLifeDays >= 7 ? 'Medium' : 'High', risk_color: shelfLifeDays >= 7 ? 'yellow' : 'red', shelf_life_safe: shelfLifeDays >= 7,
      },
      {
        id: 'C', label: 'Sell 60% Now + 40% in 5 Days', description: 'Best risk-adjusted strategy',
        predicted_price: splitPrice, gross_revenue: c.gross,
        deductions: { transport: 728, market_commission: Math.round(splitPrice * qty * 0.015), packaging: 1200, spoilage_loss: Math.round(waitSpoilage * 0.4), storage_cost: splitStorage },
        total_deductions: c.deductions, cultivation_expense: expense, net_realization: c.net,
        net_per_qtl: Math.round(c.net / qty), risk: 'Low–Medium', risk_color: 'lime', shelf_life_safe: true,
      },
    ],
  }
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export function FarmerDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  // Navigation
  const [navTab, setNavTab] = useState<NavTab>('market')

  // Crops (dynamic from backend API)
  const [cropList, setCropList] = useState<CropData[]>(INITIAL_CROPS)
  const [selectedCropId, setSelectedCropId] = useState<string>('tomato')
  const [activeSaleSummary, setActiveSaleSummary] = useState<ActiveSaleSummary | null>(null)
  const [storageStocks, setStorageStocks] = useState<StorageStockItem[]>([])
  const [selectedStock, setSelectedStock] = useState<StorageStockItem | null>(null)
  const [showAddCropForm, setShowAddCropForm] = useState(false)

  // Modals
  const [cropDetailOpen, setCropDetailOpen] = useState(false)
  const [smartSellOpen, setSmartSellOpen] = useState(false)
  const [negotiateOpen, setNegotiateOpen] = useState(false)
  const [historyDetailId, setHistoryDetailId] = useState<string | null>(null)
  const [harvestOpen, setHarvestOpen] = useState(false)
  const [harvestQuantity, setHarvestQuantity] = useState('60')
  const [harvestGrade, setHarvestGrade] = useState<'Grade A' | 'Grade B' | 'Grade C'>('Grade A')
  const [harvestStorageId, setHarvestStorageId] = useState('wdra')
  const [harvestSaving, setHarvestSaving] = useState(false)
  const [harvestError, setHarvestError] = useState('')
  const [lifecycleToast, setLifecycleToast] = useState('')
  const [buyerDemands, setBuyerDemands] = useState<ProcurementDemand[]>([])
  const [traderOffers, setTraderOffers] = useState<Record<string, string>>({})
  const [counterDemand, setCounterDemand] = useState<ProcurementDemand | null>(null)
  const [certificateOpen, setCertificateOpen] = useState(false)

  // Smart Sell state
  const [smartStep, setSmartStep] = useState<SmartStep>(1)
  const [selBuyer, setSelBuyer] = useState('deccan')
  const [selTransport, setSelTransport] = useState('tata')
  const [selStorage, setSelStorage] = useState('wdra')
  const [qualityDone, setQualityDone] = useState(false)
  const [counterPrice, setCounterPrice] = useState('')
  const [sellQuantity, setSellQuantity] = useState('')
  const [saleReview, setSaleReview] = useState<SaleReview | null>(null)
  const [strategies, setStrategies] = useState<StrategyResult | null>(null)
  const [strategiesLoading, setStrategiesLoading] = useState(false)
  const [selectedStrategyId, setSelectedStrategyId] = useState<'A' | 'B' | 'C'>('C')
  const [festivalContext, setFestivalContext] = useState<FestivalContext | null>(null)
  const [upcomingFestival, setUpcomingFestival] = useState<UpcomingFestival | null>(null)

  // Market page
  const [marketCategory, setMarketCategory] = useState('All Crops')
  const [marketSearch, setMarketSearch] = useState('')

  // Schemes page
  const [schemeTab, setSchemeTab] = useState('Matched for Me')
  const [schemeGuidance, setSchemeGuidance] = useState<SchemeGuidance | null>(null)
  const [schemeLoading, setSchemeLoading] = useState(false)
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(null)
  const [creditCropName, setCreditCropName] = useState('Tomato')
  const [creditAmount, setCreditAmount] = useState('50000')
  const [creditResult, setCreditResult] = useState<any>(null)
  const [creditLoading, setCreditLoading] = useState(false)

  // History page
  const [historySearch, setHistorySearch] = useState('')

  // Add Crop form
  const [cropName, setCropName] = useState('')
  const [cropVariety, setCropVariety] = useState('')
  const [cropAcres, setCropAcres] = useState('')
  const [cropSowing, setCropSowing] = useState('')
  const [cropHarvest, setCropHarvest] = useState('')
  const [cropYield, setCropYield] = useState('')
  const [cropExpense, setCropExpense] = useState('')
  const [cropIrrigation, setCropIrrigation] = useState('')
  const [cropSaveMsg, setCropSaveMsg] = useState(false)

  // Fetch live crops from backend on mount
  useEffect(() => {
    api.crops.getAll(user.id).then((crops) => {
      if (crops && crops.length) {
        setCropList(crops.map(c => ({
          id: c.id,
          name: c.name,
          variety: c.variety,
          acres: c.acres,
          sowing: c.sowing,
          harvest: c.harvest,
          yieldQtl: c.yieldQtl,
          yield: c.yield,
          spent: c.spent,
          stage: c.stage,
          health: c.health,
          maturity: c.maturity,
          irrigation: c.irrigation,
          img: c.img,
          emoji: c.emoji,
          expenses: c.expenses,
        })))
      }
    }).catch((err) => {
      console.warn('Crops API fallback:', err)
    })
  }, [user.id])

  useEffect(() => {
    api.logistics.getStocks(user.id)
      .then(setStorageStocks)
      .catch((error) => console.warn('Storage API fallback:', error))
  }, [user.id])

  useEffect(() => {
    api.demands.getAll().then((demands) => setBuyerDemands(demands.map((demand) => {
      if (demand.id === 'dem_101') return { ...demand, cropName: 'Tomato', quantityQtlNeeded: 50, targetPricePerQtl: '₹2,580 / Qtl', targetPriceNumeric: 2580, transportProvidedByBuyer: true, pickupDistanceKm: 28 }
      if (demand.id === 'dem_102') return { ...demand, buyerCompany: 'Sahyadri Agro Terminal', cropName: 'Tomato', variety: 'Hybrid Table S-31 / Arka Rakshak', quantityQtlNeeded: 80, targetPricePerQtl: '₹2,450 / Qtl', targetPriceNumeric: 2450, transportProvidedByBuyer: false, pickupDistanceKm: 35 }
      return demand
    }))).catch((error) => console.warn('Buyer demands unavailable:', error))
  }, [])

  useEffect(() => {
    if (navTab !== 'storage') return
    api.logistics.getStocks(user.id)
      .then(setStorageStocks)
      .catch((error) => console.warn('Storage refresh failed:', error))
  }, [navTab, user.id])

  useEffect(() => {
    const token = localStorage.getItem('kisansetu_auth_token')
    fetch('/api/mandi/festivals', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((response) => {
        if (!response.ok) throw new Error('Festival calendar unavailable')
        return response.json()
      })
      .then((data) => setUpcomingFestival(data.upcoming_festivals?.[0] || null))
      .catch((error) => console.warn('Festival calendar fallback:', error))
  }, [])

  const initials = (user.name || 'RP').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const firstName = (user.name || 'Farmer').trim().split(/\s+/)[0]

  const crop = cropList.find(c => c.id === selectedCropId) || cropList[0]
  const standingCrops = cropList.filter((item) => item.stage !== 'Harvested' && item.stage !== 'In Storage')
  const sellCrop: CropData = selectedStock ? {
    id: selectedStock.cropId || selectedStock.id,
    name: selectedStock.crop,
    variety: selectedStock.variety,
    acres: 'Harvested batch',
    sowing: '—',
    harvest: selectedStock.harvestDate,
    yieldQtl: selectedStock.quantityQtl,
    yield: `${selectedStock.quantityQtl} Quintals`,
    spent: `₹${selectedStock.cultivationExpense.toLocaleString('en-IN')}`,
    stage: 'Harvested', health: 'Healthy', maturity: 100, irrigation: '—',
    img: selectedStock.img, emoji: selectedStock.emoji,
  } : crop
  const buyerData = BUYERS.find(b => b.id === selBuyer)!
  const transportData = TRANSPORT.find(t => t.id === selTransport)!
  const storageData = STORAGE.find(s => s.id === selStorage)!
  const historyDetail = HISTORY_DATA.find(h => h.id === historyDetailId) || null
  const filteredHistory = HISTORY_DATA.filter(h => h.name.toLowerCase().includes(historySearch.toLowerCase()))
  const filteredSchemes = schemeTab === 'All Schemes' ? SCHEMES : SCHEMES.filter(s => s.category === schemeTab)
  const cropModalPrice = Number(MARKET_PRICES.find((price) => price.crop === crop.name)?.modal.replace(/[^0-9]/g, '') || 2580)
  const cropExpenseValue = Number(crop.spent.replace(/[^0-9]/g, '')) || 0
  const cropProjectedGross = crop.yieldQtl * cropModalPrice
  const cropProjectedNet = cropProjectedGross - cropExpenseValue
  const cropSellable = crop.maturity >= 80
  const cropDaysToReady = Math.max(0, Math.round((100 - crop.maturity) / 3))

  useEffect(() => {
    if (!smartSellOpen || !selectedStock) return
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 2800)
    const token = localStorage.getItem('kisansetu_auth_token')
    setStrategiesLoading(true)
    setStrategies(null)
    setSelectedStrategyId('C')
    const params = new URLSearchParams({
      crop: selectedStock.crop,
      mandi: user.location?.split(',')[1]?.trim() || 'Nashik',
      quantity_qtl: String(selectedStock.quantityQtl),
      shelf_life_days: String(selectedStock.shelfLifeLeftDays),
      storage_cost_per_day: String(selectedStock.storageCostPerDay),
      transport_cost: '728',
      cultivation_expense: String(selectedStock.cultivationExpense),
      quality_grade: selectedStock.qualityGrade.replace('Grade ', ''),
    })
    fetch(`/api/mandi/forecast?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error('Strategy service unavailable')
        return response.json()
      })
      .then((data) => {
        if (data.festival_context) setFestivalContext(data.festival_context)
        if (!data.strategies) throw new Error('No live strategies returned')
        setStrategies(data)
      })
      .catch(() => setStrategies(generateFallbackStrategies(sellCrop, true, selectedStock.storageCostPerDay, selectedStock.shelfLifeLeftDays, selectedStock.spoilageRiskPct)))
      .finally(() => {
        window.clearTimeout(timeout)
        setStrategiesLoading(false)
      })
    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [smartSellOpen, selectedStock?.id, user.location])

  function openCrop(id: string) { setSelectedCropId(id); setCropDetailOpen(true) }
  function startSmartSell(stock: StorageStockItem) {
    const reserved = activeSaleSummary?.stockId === stock.id ? activeSaleSummary.quantityQtl : 0
    const available = Math.max(0, Number((stock.quantityQtl - reserved).toFixed(2)))
    setSelectedStock(stock)
    setSellQuantity(String(available))
    setSaleReview(null)
    setQualityDone(true)
    setCertificateOpen(false)
    setSmartStep(1)
    setSmartSellOpen(true)
  }

  function openHarvestModal() {
    setHarvestQuantity(String(crop.yieldQtl || 60))
    setHarvestGrade(qualityDone ? 'Grade A' : 'Grade B')
    setHarvestStorageId('wdra')
    setHarvestError('')
    setCropDetailOpen(false)
    setHarvestOpen(true)
  }

  async function confirmHarvestAndStore() {
    const facility = HARVEST_STORAGE.find((option) => option.id === harvestStorageId) || HARVEST_STORAGE[1]
    const quantity = Number(harvestQuantity)
    const harvestedCrop = crop
    if (!harvestedCrop || !Number.isFinite(quantity) || quantity <= 0) {
      setHarvestError('Please enter a valid harvested quantity.')
      return
    }
    setHarvestError('')
    setHarvestSaving(true)
    try {
      const { stock, crop: updatedFieldCrop } = await api.logistics.createStock({
        farmerId: user.id,
        cropId: harvestedCrop.id,
        crop: harvestedCrop.name,
        variety: harvestedCrop.variety,
        quantityQtl: quantity,
        qualityGrade: harvestGrade,
        aiQualityScore: harvestGrade === 'Grade A' ? 97.8 : harvestGrade === 'Grade B' ? 88 : 72,
        harvestDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        storageFacility: facility.facility,
        storageCostPerDay: facility.cost,
        initialShelfLifeDays: facility.shelfLife,
        shelfLifeLeftDays: facility.shelfLife,
        spoilageRiskPct: facility.shelfLife <= 5 ? 4.2 : facility.shelfLife <= 12 ? 2.5 : 1.2,
        cultivationExpense: parseInt(harvestedCrop.spent.replace(/[^0-9]/g, '')) || 0,
        costOfProductionPerKg: (parseInt(harvestedCrop.spent.replace(/[^0-9]/g, '')) || 0) / Math.max(1, harvestedCrop.yieldQtl * 100),
        fairFarmgateValuationPerQtl: harvestedCrop.name === 'Tomato' ? 2250 : harvestedCrop.name === 'Potato' ? 1750 : 2000,
        emoji: harvestedCrop.emoji,
        img: harvestedCrop.img,
      })
      if (!stock?.id) throw new Error('The storage record was not returned. Please try again.')
      const refreshedStocks = await api.logistics.getStocks(user.id).catch(() => null)
      setStorageStocks(refreshedStocks || ((current) => [stock, ...current]))
      const remainingQuantity = updatedFieldCrop?.yieldQtl ?? Math.max(0, harvestedCrop.yieldQtl - quantity)
      setCropList((current) => current.map((item) => item.id === harvestedCrop.id ? {
        ...item,
        yieldQtl: remainingQuantity,
        yield: updatedFieldCrop?.yield || `${remainingQuantity} Quintals`,
        spent: updatedFieldCrop?.spent || item.spent,
        expenses: updatedFieldCrop?.expenses || item.expenses,
        stage: updatedFieldCrop?.stage || (remainingQuantity <= 0 ? 'Harvested' : item.stage),
        maturity: updatedFieldCrop?.maturity ?? (remainingQuantity <= 0 ? 100 : item.maturity),
      } : item))
      setHarvestOpen(false)
      setLifecycleToast(`🌾 ${quantity} Qtl ${harvestedCrop.name} moved to ${facility.facility}. ${remainingQuantity > 0 ? `${remainingQuantity} Qtl remains in the field.` : 'The field harvest is complete.'}`)
      window.setTimeout(() => setLifecycleToast(''), 3500)
      setNavTab('storage')
    } catch (error) {
      console.error(error)
      setHarvestError(error instanceof Error ? error.message : 'Could not move this crop to storage. Please try again.')
    } finally {
      setHarvestSaving(false)
    }
  }

  async function confirmSale() {
    if (selectedStock) {
      const selectedStrategy = strategies?.strategies.find((strategy) => strategy.id === selectedStrategyId)
      const listingQuantity = selectedStrategyId === 'C' ? Number((selectedStock.quantityQtl * 0.6).toFixed(2)) : selectedStock.quantityQtl
      const timingNote = selectedStrategyId === 'A'
        ? 'Immediate sale — Strategy A'
        : selectedStrategyId === 'B'
          ? 'Deferred 7 days — Strategy B'
          : 'Immediate 60%; remaining 40% deferred 5 days — Strategy C'
      try {
        await api.marketplace.createListing({
          farmerId: user.id, farmerName: user.name, farmerPhone: user.phone, location: user.location,
          crop: selectedStock.crop, variety: selectedStock.variety, quantityQtl: listingQuantity,
          askingPricePerQtl: selectedStrategy?.predicted_price || 2580,
          qualityGrade: selectedStock.qualityGrade, harvestReadyDate: timingNote,
        })
        const result = await api.logistics.deleteStock(selectedStock.id, listingQuantity)
        setStorageStocks((current) => result.removed
          ? current.filter((stock) => stock.id !== selectedStock.id)
          : current.map((stock) => stock.id === selectedStock.id ? { ...stock, quantityQtl: result.remainingQuantityQtl } : stock))
        setActiveSaleSummary({ stockId: selectedStock.id, crop: selectedStock.crop, quantityQtl: listingQuantity, price: selectedStrategy?.predicted_price || 2580, buyer: 'Marketplace buyers', status: 'Marketplace listing active' })
        setSmartSellOpen(false)
        setLifecycleToast(`🔒 ${listingQuantity} Qtl ${selectedStock.crop} listed with escrow protection using Strategy ${selectedStrategyId}.`)
        window.setTimeout(() => setLifecycleToast(''), 3500)
        setNavTab('home')
      } catch (error) {
        console.error(error)
      }
    }
  }

  async function acceptBuyerDemand(demand: ProcurementDemand, requestedQuantity: number) {
    if (!selectedStock) return
    const quantity = Math.min(requestedQuantity, selectedStock.quantityQtl, demand.quantityQtlNeeded)
    try {
      await api.marketplace.createListing({
        farmerId: user.id,
        farmerName: user.name,
        farmerPhone: user.phone,
        location: user.location,
        crop: selectedStock.crop,
        variety: selectedStock.variety,
        quantityQtl: quantity,
        askingPricePerQtl: demand.targetPriceNumeric,
        qualityGrade: selectedStock.qualityGrade,
        harvestReadyDate: `Accepted demand ${demand.id} · ${demand.transportProvidedByBuyer ? 'Buyer farmgate pickup' : 'Farmer delivery'}`,
      })
      setActiveSaleSummary({ stockId: selectedStock.id, crop: selectedStock.crop, quantityQtl: quantity, price: demand.targetPriceNumeric, buyer: demand.buyerCompany, status: 'Buyer confirmation pending' })
      setSmartSellOpen(false)
      setSaleReview(null)
      setLifecycleToast(`📨 Sale request sent to ${demand.buyerCompany} for ${quantity} Qtl. The crop remains safely in storage until the buyer confirms and funds payment.`)
      window.setTimeout(() => setLifecycleToast(''), 4000)
      setNavTab('history')
    } catch (error) {
      setLifecycleToast(error instanceof Error ? error.message : 'Could not lock this trade. Please try again.')
    }
  }

  function openDemandCounter(demand: ProcurementDemand) {
    setCounterDemand(demand)
    setCounterPrice(String(demand.targetPriceNumeric + 70))
    setNegotiateOpen(true)
  }

  function createMandiDispatch(mandiName: string, quantity: number, net: number) {
    setSmartSellOpen(false)
    setSaleReview(null)
    setLifecycleToast(`📄 Dispatch plan prepared for ${quantity} Qtl at ${mandiName}. Estimated amount in hand: ₹${net.toLocaleString('en-IN')}. The crop stays in storage until dispatch is confirmed.`)
    window.setTimeout(() => setLifecycleToast(''), 4500)
  }

  function handleCompleteQualityAssay() {
    setQualityDone(true)
    if (selectedCropId) {
      api.crops.runQualityAssay(selectedCropId).catch(console.error)
    }
  }

  function handleSendCounterOffer() {
    setNegotiateOpen(false)
    if (counterPrice && sellCrop) {
      api.demands.submitNegotiation({
        demandId: counterDemand?.id,
        senderId: user.id,
        senderRole: 'farmer',
        senderName: user.name,
        targetUserId: counterDemand?.buyerId || selBuyer,
        cropName: sellCrop.name,
        requestedQuantityQtl: Math.min(sellCrop.yieldQtl || 60, counterDemand?.quantityQtlNeeded || sellCrop.yieldQtl || 60),
        counterPricePerQtl: parseInt(counterPrice.replace(/[^0-9]/g, '')) || 2650,
        deliveryTerms: 'Immediate Farmgate Dispatch',
      }).catch(console.error)
    }
    setCounterDemand(null)
  }

  async function runCreditSafetyCheck() {
    const selectedCrop = cropList.find((item) => item.name === creditCropName) || cropList[0]
    if (!selectedCrop || Number(creditAmount) <= 0) return
    setCreditLoading(true)
    setCreditResult(null)
    try {
      const result = await api.schemes.calculateLoan({
        landAcres: Number(String(user.landSize || selectedCrop.acres).replace(/[^0-9.]/g, '')) || 2,
        cropType: selectedCrop.name,
        requestedAmount: Number(creditAmount),
        expectedYieldQtl: selectedCrop.yieldQtl,
        cultivationExpense: Number(selectedCrop.spent.replace(/[^0-9]/g, '')) || 0,
      })
      setCreditResult(result)
    } catch (error) {
      setCreditResult({ error: error instanceof Error ? error.message : 'Could not run the safety check.' })
    } finally {
      setCreditLoading(false)
    }
  }

  function saveCrop() {
    if (!cropName || !cropVariety || !cropAcres) return
    const newId = `crop_${Date.now()}`
    const newCrop: CropData = {
      id: newId,
      name: cropName,
      variety: cropVariety,
      acres: `${cropAcres} Acres`,
      sowing: cropSowing || '—',
      harvest: cropHarvest || '—',
      yieldQtl: parseInt(cropYield) || 0,
      yield: cropYield ? `${cropYield} Quintals` : '—',
      spent: cropExpense ? `₹${cropExpense}` : '—',
      stage: 'Seedling',
      health: 'Healthy',
      maturity: 5,
      irrigation: cropIrrigation || 'Not specified',
      img: CROP_IMGS[cropName] || DEFAULT_IMG,
      emoji: CROP_EMOJIS[cropName] || '🌿',
    }

    setCropList(prev => [...prev, newCrop])

    // Save to backend database
    api.crops.create({
      farmerId: user.id,
      name: cropName,
      variety: cropVariety,
      acres: `${cropAcres} Acres`,
      sowing: cropSowing || '—',
      harvest: cropHarvest || '—',
      yieldQtl: parseInt(cropYield) || 0,
      yield: cropYield ? `${cropYield} Quintals` : '—',
      spent: cropExpense ? `₹${cropExpense}` : '—',
      stage: 'Seedling',
      health: 'Healthy',
      maturity: 5,
      irrigation: cropIrrigation || 'Not specified',
      img: CROP_IMGS[cropName] || DEFAULT_IMG,
      emoji: CROP_EMOJIS[cropName] || '🌿',
    }).catch((err) => {
      console.warn('Crop save API fallback:', err)
    })

    setCropName(''); setCropVariety(''); setCropAcres(''); setCropSowing('')
    setCropHarvest(''); setCropYield(''); setCropExpense(''); setCropIrrigation('')
    setCropSaveMsg(true)
    setTimeout(() => { setCropSaveMsg(false); setShowAddCropForm(false); setNavTab('crops') }, 1200)
  }

  // ── Primary farmer navigation ──
  const NAV = [
    { id: 'market' as NavTab, label: 'Market', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 19V9m5 10V5m5 14v-7m5 7V3" /></svg> },
    { id: 'cropValue' as NavTab, label: 'Value & Sell', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m4-10.5C15.2 7.5 14 7 12 7c-2.2 0-3.5 1.1-3.5 2.7 0 4.2 7.5 1.8 7.5 6 0 1.8-1.5 3.3-4 3.3-2 0-3.5-.6-4.5-1.8" /></svg> },
    { id: 'schemes' as NavTab, label: 'Schemes', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg> },
    { id: 'history' as NavTab, label: 'My Sales', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12v18l-3-2-3 2-3-2-3 2V3zm3 5h6M9 12h6" /></svg> },
    { id: 'account' as NavTab, label: 'Account', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="8" r="3" /><path strokeLinecap="round" strokeLinejoin="round" d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6" /></svg> },
  ]
  const showLegacyWizard: boolean = false
  const showLegacySchemes: boolean = false

  return (
    <div className="min-h-full pb-24" style={{ background: '#F7F6F1', fontFamily: "'Inter', sans-serif" }}>
      {lifecycleToast && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[80] w-[calc(100%-2rem)] max-w-md px-4 py-3 rounded-2xl text-sm font-semibold text-white shadow-xl" style={{ background: '#063B2A' }}>{lifecycleToast}</div>}

      {/* ── Header (always visible) ── */}
      <header className="sticky top-0 z-40 px-4 py-3" style={{ background: '#063B2A' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex-shrink-0" aria-hidden="true" />
            <div>
              <div className="text-white font-bold text-base leading-none">माझे Kisan</div>
              <div className="text-xs mt-0.5" style={{ color: '#A8C4B0' }}>Better Markets. Stronger Farmers.</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-white/70 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center" style={{ background: '#F4C44E', color: '#063B2A' }}>3</span>
            </button>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl" style={{ background: '#0B4F3A' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#238B5B' }}>{initials}</div>
              <div className="hidden sm:block">
                <div className="text-white text-xs font-semibold leading-none">{user.name}</div>
                <div className="text-[10px] mt-0.5" style={{ color: '#A8C4B0' }}>Farmer</div>
              </div>
              <button onClick={onLogout} title="Log out" className="ml-1 text-white/60 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="max-w-5xl mx-auto px-4 pt-6">

        {/* ════════ MARKET OVERVIEW ════════ */}
        {navTab === 'market' && <MarketOverview user={user} onCheckCropValue={() => setNavTab('cropValue')} />}

        {/* ════════ CROP VALUE ════════ */}
        <div className={navTab === 'cropValue' ? 'block' : 'hidden'}>
          <CropValue user={user} onBackToMarket={() => setNavTab('market')} onSaleRequest={setActiveSaleSummary} onViewSales={() => setNavTab('history')} />
        </div>

        {/* ════════ SCHEMES ════════ */}
        {navTab === 'schemes' && <GovernmentSchemes />}
        {showLegacySchemes && navTab === 'schemes' && (() => {
          const visibleSchemes = schemeGuidance?.schemes.filter((scheme) => schemeTab === 'Matched for Me' || scheme.category === schemeTab) || []
          const statusStyle = (status: string) => status === 'Likely match'
            ? { background: '#EAF5EE', color: '#216644' }
            : status.includes('official') || status.includes('information') || status.includes('Ask')
              ? { background: '#FFF8ED', color: '#8A5A0A' }
              : { background: '#F0F4F2', color: '#52635A' }
          return <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#17221D' }}>Schemes &amp; Financial Security</h2>
              <p className="text-sm mt-0.5" style={{ color: '#66736C' }}>Personal guidance based on your farm—not a generic loan catalogue.</p>
            </div>

            {schemeLoading && <div className="p-6 rounded-2xl text-center text-sm" style={{ background: '#fff', border: '1px solid #E2EBE5', color: '#66736C' }}>Checking scheme rules against your farm profile…</div>}

            {schemeGuidance && <>
              <div className="p-4 rounded-2xl text-white" style={{ background: '#063B2A' }}>
                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#F4C44E' }}>Matched for {schemeGuidance.profile.farmerName}</div>
                <div className="text-lg font-bold mt-1">{schemeGuidance.profile.landAcres} acres · {schemeGuidance.profile.crops.join(', ')}</div>
                <div className="text-xs mt-1" style={{ color: '#C4D9CD' }}>{schemeGuidance.profile.location} · {schemeGuidance.profile.irrigation.join(', ')}</div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }}><div className="text-xl font-bold">{schemeGuidance.summary.matchedCount}</div><div className="text-[10px]" style={{ color: '#C4D9CD' }}>Possible matches to check</div></div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }}><div className="text-xl font-bold">₹{schemeGuidance.summary.possibleDirectSupport.toLocaleString('en-IN')}</div><div className="text-[10px]" style={{ color: '#C4D9CD' }}>Possible yearly direct support—not verified</div></div>
                </div>
                <div className="text-[10px] mt-3" style={{ color: '#A8C4B0' }}>Subsidies, insurance cover and credit are deliberately not added into one misleading total.</div>
              </div>

              <div className="p-4 rounded-2xl flex items-start gap-3" style={{ background: '#FFF8ED', border: '1px solid #F0D9A8' }}>
                <span className="text-xl">⏳</span><div><div className="text-sm font-bold" style={{ color: '#7A5310' }}>Verified deadline radar</div><p className="text-xs mt-1 leading-relaxed" style={{ color: '#8A6A30' }}>{schemeGuidance.deadlineStatus.message}</p><div className="text-[10px] mt-1.5" style={{ color: '#8A6A30' }}>माझे Kisan will never invent a countdown from an old notification.</div></div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {SCHEME_TABS.map((tab) => <button key={tab} onClick={() => setSchemeTab(tab)} className="px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap" style={{ background: schemeTab === tab ? '#063B2A' : '#fff', color: schemeTab === tab ? '#fff' : '#66736C', border: `1px solid ${schemeTab === tab ? '#063B2A' : '#E2EBE5'}` }}>{tab}</button>)}
              </div>

              <div className="space-y-3">
                {visibleSchemes.length === 0 && <div className="p-5 bg-white rounded-2xl text-sm text-center" style={{ border: '1px solid #E2EBE5', color: '#66736C' }}>No matched guidance in this category yet.</div>}
                {visibleSchemes.map((scheme) => {
                  const expanded = expandedSchemeId === scheme.id
                  const readyCount = scheme.documents.filter((document) => document.state === 'Ready').length
                  return <div key={scheme.id} className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E2EBE5' }}>
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: '#EAF5EE' }}>{scheme.icon}</div>
                        <div className="flex-1 min-w-0"><div className="flex items-start justify-between gap-2"><div className="font-bold text-sm" style={{ color: '#17221D' }}>{scheme.title}</div><span className="text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap" style={statusStyle(scheme.matchStatus)}>{scheme.matchStatus}</span></div><div className="text-xs font-semibold mt-1.5" style={{ color: '#238B5B' }}>{scheme.benefitHeadline}</div><p className="text-xs mt-2 leading-relaxed" style={{ color: '#66736C' }}><strong style={{ color: '#42544A' }}>Why it matched:</strong> {scheme.whyMatched}</p></div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid #EEF2EF' }}><span className="text-[10px]" style={{ color: '#66736C' }}>Documents ready: {readyCount}/{scheme.documents.length}</span><button onClick={() => setExpandedSchemeId(expanded ? null : scheme.id)} className="text-xs font-bold" style={{ color: '#063B2A' }}>{expanded ? 'Hide checklist ↑' : 'Checklist & official link →'}</button></div>
                    </div>
                    {expanded && <div className="px-4 pb-4 space-y-3" style={{ background: '#FAFBFA', borderTop: '1px solid #EEF2EF' }}>
                      <div className="pt-3"><div className="text-xs font-bold mb-2" style={{ color: '#17221D' }}>Documents to prepare</div><div className="space-y-2">{scheme.documents.map((document) => <div key={document.label} className="flex items-start gap-2 text-xs"><span>{document.state === 'Ready' ? '✅' : document.state === 'Missing' ? '❌' : '⚠️'}</span><div><strong style={{ color: '#42544A' }}>{document.label}</strong><div className="text-[10px] mt-0.5" style={{ color: '#66736C' }}>{document.note}</div></div></div>)}</div></div>
                      <div className="p-3 rounded-xl text-xs leading-relaxed" style={{ background: '#FFF8ED', color: '#7A5310' }}><strong>Official verification needed:</strong> {scheme.officialCheck}</div>
                      <div className="flex items-center justify-between gap-3"><span className="text-[10px]" style={{ color: '#66736C' }}>Rules checked {scheme.rulesCheckedOn}</span><a href={scheme.officialUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-xl text-xs font-bold text-white" style={{ background: '#063B2A' }}>Open {scheme.sourceLabel} ↗</a></div>
                    </div>}
                  </div>
                })}
              </div>

              {(schemeTab === 'Matched for Me' || schemeTab === 'Responsible Credit') && <div className="p-4 rounded-2xl" style={{ background: '#EAF5EE', border: '1px solid #C4DFD0' }}>
                <div className="flex items-start gap-3"><span className="text-2xl">🛡️</span><div><div className="text-sm font-bold" style={{ color: '#063B2A' }}>Responsible KCC safety check</div><p className="text-xs mt-1" style={{ color: '#52635A' }}>This does not offer a loan. It checks whether a proposed amount remains manageable if crop prices fall.</p></div></div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div><label className="text-[10px] font-bold" style={{ color: '#52635A' }}>CROP</label><select value={creditCropName} onChange={(event) => { setCreditCropName(event.target.value); setCreditResult(null) }} className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm bg-white outline-none" style={{ border: '1px solid #C4DFD0' }}>{schemeGuidance.profile.crops.map((cropName) => <option key={cropName}>{cropName}</option>)}</select></div>
                  <div><label className="text-[10px] font-bold" style={{ color: '#52635A' }}>AMOUNT TO CHECK</label><div className="relative mt-1"><span className="absolute left-3 top-2.5 font-bold" style={{ color: '#063B2A' }}>₹</span><input type="number" min="1000" step="1000" value={creditAmount} onChange={(event) => { setCreditAmount(event.target.value); setCreditResult(null) }} className="w-full pl-7 pr-3 py-2.5 rounded-xl text-sm bg-white outline-none" style={{ border: '1px solid #C4DFD0' }} /></div></div>
                </div>
                <button disabled={creditLoading || Number(creditAmount) <= 0} onClick={runCreditSafetyCheck} className="w-full mt-3 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50" style={{ background: '#063B2A' }}>{creditLoading ? 'Testing normal and lower-price scenarios…' : 'Run repayment safety check →'}</button>
                {creditResult?.error && <div className="mt-3 p-3 rounded-xl text-xs" style={{ background: '#FEF2F2', color: '#9F241B' }}>{creditResult.error}</div>}
                {creditResult && !creditResult.error && <div className="mt-3 p-4 rounded-xl bg-white" style={{ border: `1px solid ${creditResult.risk === 'Comfortable' ? '#9CC9AD' : creditResult.risk === 'Caution' ? '#E8BE65' : '#E5A6A0'}` }}>
                  <div className="flex justify-between items-start gap-2"><div><div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#66736C' }}>Safety result</div><div className="text-lg font-bold mt-0.5" style={{ color: creditResult.risk === 'Comfortable' ? '#216644' : creditResult.risk === 'Caution' ? '#9B6508' : '#9F241B' }}>{creditResult.risk}</div></div><Badge variant={creditResult.risk === 'Comfortable' ? 'success' : 'gold'}>{creditResult.modelUsed ? 'ML price range used' : 'Conservative fallback'}</Badge></div>
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: '#52635A' }}>{creditResult.explanation}</p>
                  <div className="grid grid-cols-2 gap-2 mt-3"><div className="p-2.5 rounded-xl" style={{ background: '#F7F6F1' }}><div className="text-[10px]" style={{ color: '#66736C' }}>Normal-price cover</div><div className="font-bold" style={{ color: '#17221D' }}>{creditResult.coverageNormal}× repayment</div></div><div className="p-2.5 rounded-xl" style={{ background: '#FFF8ED' }}><div className="text-[10px]" style={{ color: '#66736C' }}>Lower-price cover</div><div className="font-bold" style={{ color: '#7A5310' }}>{creditResult.coverageDownside}× repayment</div></div></div>
                  <div className="mt-3 text-xs" style={{ color: '#52635A' }}>Suggested cautious ceiling: <strong style={{ color: '#063B2A' }}>₹{creditResult.safeAmount.toLocaleString('en-IN')}</strong> · Planning limit: ₹{creditResult.planningLimit.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] mt-2" style={{ color: '#66736C' }}>{creditResult.disclaimer}</div>
                </div>}
              </div>}

              <div className="p-4 rounded-2xl flex items-center gap-3" style={{ background: '#fff', border: '1px solid #E2EBE5' }}><span className="text-2xl">🏢</span><div className="flex-1"><div className="text-sm font-bold" style={{ color: '#17221D' }}>{schemeGuidance.serviceCentre.title}</div><div className="text-xs mt-0.5" style={{ color: '#66736C' }}>{schemeGuidance.serviceCentre.detail}</div></div><a href={schemeGuidance.serviceCentre.officialUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-xl text-xs font-bold" style={{ border: '1px solid #063B2A', color: '#063B2A' }}>Find official centre ↗</a></div>
              <div className="text-[10px] text-center px-3 leading-relaxed" style={{ color: '#66736C' }}>{schemeGuidance.disclaimer}</div>
            </>}
          </div>
        })()}

        {/* ════════ MY SALES ════════ */}
        {navTab === 'history' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#17221D' }}>My Sales</h2>
              <p className="text-sm mt-0.5" style={{ color: '#66736C' }}>Active protected trades and completed sales records</p>
            </div>

            {activeSaleSummary && <div className="p-4 rounded-2xl" style={{ background: '#063B2A' }}>
              <div className="flex items-start justify-between gap-3"><div><div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#F4C44E' }}>● Active Sale Request</div><div className="text-lg font-bold text-white mt-1">{activeSaleSummary.crop} · {activeSaleSummary.quantityQtl} Qtl</div><div className="text-xs mt-1" style={{ color: '#A8C4B0' }}>{activeSaleSummary.buyer} · ₹{activeSaleSummary.price.toLocaleString('en-IN')}/Qtl</div><div className="text-xs mt-1" style={{ color: '#F4C44E' }}>{activeSaleSummary.status}</div></div><Badge variant="gold">Pending</Badge></div>
            </div>}

            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#66736C' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  placeholder="Search crops..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none bg-white"
                  style={{ border: '1px solid #E2EBE5', color: '#17221D' }}
                />
              </div>
              <button className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#fff', border: '1px solid #E2EBE5' }}>
                <svg className="w-4 h-4" style={{ color: '#66736C' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              </button>
            </div>

            {/* History cards */}
            <div className="space-y-3.5">
              {filteredHistory.map(h => (
                <button key={h.id} onClick={() => setHistoryDetailId(h.id)} className="w-full bg-white rounded-2xl overflow-hidden text-left transition-shadow hover:shadow-md" style={{ border: '1px solid #E2EBE5' }}>
                  <div className="flex items-stretch">
                    {/* Crop thumbnail */}
                    <div className="w-28 flex-shrink-0 relative" style={{ background: '#C4DFD0' }}>
                      <img src={h.img} alt={h.name} className="w-full h-full object-cover" style={{ minHeight: 100 }} />
                    </div>
                    {/* Card body */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-base" style={{ color: '#17221D' }}>{h.name}</div>
                          <div className="text-xs mt-0.5" style={{ color: '#66736C' }}>{h.variety}</div>
                        </div>
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#EAF5EE', color: '#238B5B' }}>✓ Completed</span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5">
                        <div className="text-xs" style={{ color: '#66736C' }}>{h.acres}</div>
                        <div className="text-xs" style={{ color: '#66736C' }}>{h.quintals}</div>
                        <div className="text-xs" style={{ color: '#66736C' }}>Sold: {h.soldOn}</div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div>
                          <div className="text-[10px]" style={{ color: '#66736C' }}>Final Profit</div>
                          <div className="text-lg font-bold" style={{ color: '#238B5B' }}>{h.net}</div>
                        </div>
                        <span className="text-xs font-semibold" style={{ color: '#063B2A' }}>View Details →</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ════════ ACCOUNT ════════ */}
        {navTab === 'account' && (
          <div className="space-y-6">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#3F6B45' }}>Farmer profile</div>
              <h2 className="mt-2 text-3xl font-bold" style={{ color: '#1D241F' }}>Account</h2>
              <p className="mt-2 text-sm" style={{ color: '#687069' }}>Your identity, farm location and account access in one place.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <section className="border p-6" style={{ background: '#173F2A', borderColor: '#173F2A' }}>
                <div className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold" style={{ background: '#C5A15A', color: '#173F2A' }}>{user.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div>
                <h3 className="mt-5 text-xl font-bold text-white">{user.name}</h3>
                <p className="mt-1 text-sm" style={{ color: '#D6E3DA' }}>Registered farmer</p>
                <div className="mt-6 border-t pt-4 text-xs" style={{ borderColor: 'rgba(255,255,255,0.18)', color: '#AFC5B7' }}>Kisan ID</div>
                <div className="mt-1 font-semibold text-white">{user.farmerId || user.id}</div>
              </section>
              <section className="border p-6" style={{ background: '#FFFEFA', borderColor: 'rgba(29,36,31,0.13)' }}>
                <h3 className="text-lg font-bold" style={{ color: '#1D241F' }}>Account details</h3>
                <dl className="mt-5 divide-y" style={{ borderColor: '#E2E6E1' }}>
                  {[
                    ['Mobile number', user.phone || 'Not added'],
                    ['Farm location', user.location || 'Not added'],
                    ['Registered land', user.landSize || 'Not added'],
                    ['Primary crops', user.primaryCrops?.join(', ') || 'Not added'],
                    ['Transport access', user.transportVehicle || 'Not added'],
                  ].map(([label, value]) => (
                    <div key={label} className="grid gap-1 py-3 sm:grid-cols-[150px_1fr] sm:items-center">
                      <dt className="text-xs" style={{ color: '#687069' }}>{label}</dt>
                      <dd className="text-sm font-semibold" style={{ color: '#1D241F' }}>{value}</dd>
                    </div>
                  ))}
                </dl>
                <button onClick={onLogout} className="mt-5 border px-4 py-2.5 text-sm font-bold" style={{ borderColor: '#173F2A', color: '#173F2A' }}>Sign out securely</button>
              </section>
            </div>
          </div>
        )}

      </main>

      {/* ── Bottom Navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 px-2 pt-2 pb-3" style={{ background: '#FFFFFF', borderTop: '1px solid #E2EBE5' }}>
        <div className="max-w-5xl mx-auto flex items-end justify-around">
          {NAV.map(({ id, label, icon }) => {
            const active = navTab === id
            return (
              <button key={id} onClick={() => setNavTab(id)} className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all" style={{ color: active ? '#063B2A' : '#66736C', minWidth: 56 }}>
                <div style={{ color: active ? '#063B2A' : '#66736C' }}>{icon}</div>
                <span className="text-[10px] font-medium leading-none" style={{ fontWeight: active ? 700 : 500 }}>{label}</span>
                {active && <span className="mt-0.5 w-4 h-0.5 rounded-full" style={{ background: '#063B2A' }} />}
              </button>
            )
          })}
        </div>
      </nav>

      {/* ════════ CROP DETAIL MODAL ════════ */}
      {cropDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setCropDetailOpen(false)} />
          <div className="relative bg-white w-full sm:w-[90%] max-w-xl flex flex-col shadow-2xl" style={{ borderRadius: '24px 24px 0 0', maxHeight: '92dvh' }}>
            <div className="sticky top-0 bg-white px-5 pt-5 pb-4 z-10" style={{ borderBottom: '1px solid #E2EBE5', borderRadius: '24px 24px 0 0' }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{crop.emoji}</span>
                  <div>
                    <h2 className="text-lg font-bold leading-tight" style={{ color: '#17221D' }}>{crop.name} — {crop.variety}</h2>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#238B5B' }} />
                      <span className="text-xs font-semibold" style={{ color: '#238B5B' }}>{crop.health}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setCropDetailOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-xl leading-none hover:bg-gray-100" style={{ color: '#66736C' }}>×</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl" style={{ background: '#EAF5EE' }}>
                <span className="text-sm font-semibold" style={{ color: '#238B5B' }}>Maturity Progress</span>
                <span className="text-sm font-bold" style={{ color: '#238B5B' }}>{crop.maturity}%</span>
              </div>
              <ProgressBar value={crop.maturity} />
              <div>
                <h3 className="text-base font-bold mb-3" style={{ color: '#17221D' }}>Crop Overview</h3>
                <div className="divide-y" style={{ borderColor: '#F0F4F2' }}>
                  {[['Plot Size', crop.acres], ['Sowing Date', crop.sowing], ['Expected Harvest', crop.harvest], ['Expected Yield', `${crop.yield} (${(crop.yieldQtl * 100).toLocaleString('en-IN')} kg)`], ['Production Breakeven', `₹${(cropExpenseValue / Math.max(1, crop.yieldQtl * 100)).toFixed(2)} / kg`], ['Growth Stage', crop.stage], ['Health Status', crop.health, true], ['Irrigation Type', crop.irrigation], ['Cultivation Expense', crop.spent]].map(([label, value, green]) => (
                    <div key={label as string} className="flex items-center justify-between py-2.5">
                      <span className="text-sm" style={{ color: '#66736C' }}>{label}</span>
                      <span className="text-sm font-semibold" style={{ color: green ? '#238B5B' : '#17221D' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-2xl" style={{ background: '#F7F6F1', border: '1px solid #E2EBE5' }}>
                <div className="flex items-center gap-2 mb-3"><span className="text-lg">₹</span><span className="text-sm font-bold" style={{ color: '#17221D' }}>Cultivation Financials</span></div>
                {Object.entries(crop.expenses || { seeds: 4500, fertilizers: 6200, irrigation: 3800, labour: 8500, pestControl: 2500, machinery: 2500 }).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-1.5 text-xs"><span className="capitalize" style={{ color: '#66736C' }}>{key.replace('pestControl', 'Pest control')}</span><strong style={{ color: '#17221D' }}>₹{value.toLocaleString('en-IN')}</strong></div>
                ))}
                <div className="flex justify-between pt-2 mt-2" style={{ borderTop: '1px solid #DDE6E0' }}><span className="text-sm font-bold" style={{ color: '#17221D' }}>Total spent</span><strong style={{ color: '#063B2A' }}>{crop.spent}</strong></div>
              </div>
              <div className="p-4 rounded-2xl" style={{ background: cropSellable ? '#EAF5EE' : '#FFF8ED', border: `1px solid ${cropSellable ? '#C4DFD0' : '#F0D9A8'}` }}>
                <div className="flex items-center gap-2 mb-2"><span>🤖</span><span className="text-sm font-bold" style={{ color: '#17221D' }}>AI Harvest &amp; Value Guidance</span></div>
                {cropSellable ? <div className="space-y-2 text-sm leading-relaxed" style={{ color: '#435149' }}>
                  <p>At today&apos;s market price, your {crop.yieldQtl} quintals of {crop.name} could be worth about <strong style={{ color: '#063B2A' }}>₹{cropProjectedGross.toLocaleString('en-IN')}</strong>.</p>
                  <p>After the <strong>₹{cropExpenseValue.toLocaleString('en-IN')}</strong> you have spent on cultivation, you may keep around <strong style={{ color: '#063B2A' }}>₹{cropProjectedNet.toLocaleString('en-IN')}</strong> from the crop.</p>
                  <p>Your crop currently costs about <strong style={{ color: '#063B2A' }}>₹{(cropExpenseValue / Math.max(1, crop.yieldQtl * 100)).toFixed(2)} per kg</strong> to produce. Any final price above this is above your cultivation breakeven.</p>
                  <p className="text-xs" style={{ color: '#66736C' }}><strong>Why AI says this:</strong> The crop is {crop.maturity}% mature and has reached a sellable stage. {cropDaysToReady > 0 ? `Waiting about ${cropDaysToReady} more days may improve its size, colour and quality grade before harvest.` : 'It is ready to harvest now, which helps protect its current quality and market value.'}</p>
                </div> : <p className="text-sm leading-relaxed" style={{ color: '#66736C' }}><strong style={{ color: '#17221D' }}>A selling estimate is not shown yet.</strong> Our AI says this crop is only {crop.maturity}% mature and is still in the {crop.stage.toLowerCase()} stage. Wait until it is closer to harvest so the quantity, quality and market value can be estimated reliably.</p>}
              </div>
            </div>
            <div className="sticky bottom-0 bg-white px-5 pt-3 pb-5" style={{ borderTop: '1px solid #E2EBE5' }}>
              <button onClick={openHarvestModal} className="w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 hover:opacity-90" style={{ background: '#063B2A' }}>
                <span className="text-xl">🌾</span> Harvest Crop &amp; Move to Storage →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ HARVEST & STORAGE MODAL ════════ */}
      {harvestOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(5px)' }} onClick={() => setHarvestOpen(false)} />
          <div className="relative bg-white w-full sm:w-[90%] max-w-xl flex flex-col shadow-2xl" style={{ borderRadius: '24px 24px 0 0', maxHeight: '92dvh' }}>
            <div className="px-5 pt-5 pb-4 flex items-start justify-between" style={{ borderBottom: '1px solid #E2EBE5' }}>
              <div><h2 className="text-lg font-bold" style={{ color: '#17221D' }}>Harvest {crop.name}</h2><p className="text-xs mt-1" style={{ color: '#66736C' }}>Record the harvested batch and choose where to keep it.</p></div>
              <button onClick={() => setHarvestOpen(false)} className="w-8 h-8 rounded-full text-xl" style={{ color: '#66736C' }}>×</button>
            </div>
            <div className="overflow-y-auto px-5 py-4 space-y-4">
              <div><FieldLabel>Harvested quantity (Quintals)</FieldLabel><Input type="number" placeholder="e.g. 60" value={harvestQuantity} onChange={setHarvestQuantity} /><div className="mt-2 px-3 py-2 rounded-xl text-xs" style={{ background: '#EAF5EE', color: '#335C49' }}>You have <strong>{crop.yieldQtl} Qtl</strong> in this field. After moving {Math.min(crop.yieldQtl, Math.max(0, Number(harvestQuantity) || 0))} Qtl, <strong>{Math.max(0, crop.yieldQtl - (Number(harvestQuantity) || 0))} Qtl</strong> will remain and its field-value calculations will update automatically.</div></div>
              <div>
                <FieldLabel>Quality grade</FieldLabel>
                <div className="grid grid-cols-3 gap-2">
                  {(['Grade A', 'Grade B', 'Grade C'] as const).map((grade) => <button key={grade} onClick={() => setHarvestGrade(grade)} className="py-2.5 rounded-xl text-sm font-semibold" style={{ border: `2px solid ${harvestGrade === grade ? '#063B2A' : '#E2EBE5'}`, background: harvestGrade === grade ? '#EAF5EE' : '#fff', color: '#17221D' }}>{grade}</button>)}
                </div>
              </div>
              <div>
                <FieldLabel>Storage facility</FieldLabel>
                <div className="space-y-2.5">
                  {HARVEST_STORAGE.map((option) => <SelectCard key={option.id} selected={harvestStorageId === option.id} onClick={() => setHarvestStorageId(option.id)}><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="text-2xl">{option.icon}</span><div><div className="text-sm font-bold" style={{ color: '#17221D' }}>{option.name}</div><div className="text-xs" style={{ color: '#66736C' }}>{option.note}</div></div></div><div className="text-right text-xs font-semibold" style={{ color: '#238B5B' }}>{option.shelfLife} days<br />shelf life</div></div></SelectCard>)}
                </div>
              </div>
            </div>
            <div className="px-5 pt-3 pb-5" style={{ borderTop: '1px solid #E2EBE5' }}>
              {harvestError && <div className="mb-3 px-3 py-2.5 rounded-xl text-xs font-semibold" style={{ background: '#FEF2F2', color: '#B42318', border: '1px solid #FECACA' }}>{harvestError}</div>}
              <button disabled={harvestSaving || Number(harvestQuantity) <= 0} onClick={confirmHarvestAndStore} className="w-full py-4 rounded-2xl font-bold text-white disabled:opacity-50" style={{ background: '#063B2A' }}>{harvestSaving ? 'Saving harvest to inventory…' : 'Confirm Harvest & Store →'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ THREE-CHANNEL SELLING DECISION ════════ */}
      {smartSellOpen && selectedStock && (() => {
        const reservedQuantity = activeSaleSummary?.stockId === selectedStock.id ? activeSaleSummary.quantityQtl : 0
        const maxSellQuantity = Math.max(0, Number((selectedStock.quantityQtl - reservedQuantity).toFixed(2)))
        const enteredQuantity = Number(sellQuantity)
        const quantity = Number.isFinite(enteredQuantity) && enteredQuantity > 0 ? Math.min(enteredQuantity, maxSellQuantity) : 0
        const quantityInvalid = quantity <= 0 || enteredQuantity > maxSellQuantity
        const matchingDemands = buyerDemands.filter((demand) => demand.status === 'Active' && demand.cropName.toLowerCase() === selectedStock.crop.toLowerCase()).slice(0, 3)
        const vehicleOwned = user.transportVehicle && user.transportVehicle !== 'None'
        const buyerChoices = matchingDemands.map((demand) => {
          const matchedQuantity = Math.min(quantity, demand.quantityQtlNeeded)
          const gross = demand.targetPriceNumeric * matchedQuantity
          const transport = demand.transportProvidedByBuyer ? 0 : 850
          const otherCosts = demand.transportProvidedByBuyer ? Math.round(gross * 0.015) : 3000
          return { demand, quantity: matchedQuantity, gross, transport, otherCosts, net: gross - transport - otherCosts }
        })
        const mandiChoices = [
          { name: 'Pune Market Yard', distance: 140, rate: 2820, transport: vehicleOwned ? 1400 : 4200, transportLabel: vehicleOwned ? 'Fuel for your vehicle' : 'Hired tempo' },
          { name: 'Local Niphad APMC', distance: 14, rate: 2480, transport: vehicleOwned ? 250 : 900, transportLabel: vehicleOwned ? 'Fuel for your vehicle' : 'Hired local tractor' },
        ].map((mandi) => {
          const gross = mandi.rate * quantity
          const cess = Math.round(gross * 0.025)
          return { ...mandi, gross, cess, net: gross - mandi.transport - cess }
        })
        const highestMandiNet = Math.max(...mandiChoices.map((mandi) => mandi.net))
        const bestMandi = mandiChoices.reduce((best, option) => option.net > best.net ? option : best, mandiChoices[0])
        const bestBuyer = buyerChoices.reduce<(typeof buyerChoices)[number] | null>((best, option) => !best || option.net > best.net ? option : best, null)
        const urgentPickup = selectedStock.shelfLifeLeftDays <= 5 && bestBuyer?.demand.transportProvidedByBuyer
        const recommendBuyer = Boolean(bestBuyer && (urgentPickup || bestBuyer.net >= bestMandi.net))
        const recommendationTitle = recommendBuyer && bestBuyer ? `Send a sale request to ${bestBuyer.demand.buyerCompany}` : `Prepare a dispatch to ${bestMandi.name}`
        const recommendationReason = urgentPickup
          ? `Your ${selectedStock.crop} has only ${selectedStock.shelfLifeLeftDays} safe days left, and this buyer will collect it without a transport charge.`
          : recommendBuyer && bestBuyer
            ? `This is the strongest direct-buyer return for the selected quantity, with an estimated ₹${bestBuyer.net.toLocaleString('en-IN')} in your hand.`
            : `This mandi currently gives the highest estimated amount in hand: ₹${bestMandi.net.toLocaleString('en-IN')} after transport and mandi charges.`
        const fairQtl = selectedStock.fairFarmgateValuationPerQtl || (selectedStock.crop === 'Tomato' ? 2250 : 2000)
        const currentMandiQtl = Number(MARKET_PRICES.find((price) => price.crop === selectedStock.crop)?.modal.replace(/[^0-9]/g, '') || 2580)
        return <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(6px)' }} onClick={() => setSmartSellOpen(false)} />
          <div className="relative bg-white w-full sm:w-[92%] max-w-3xl flex flex-col shadow-2xl" style={{ borderRadius: '24px 24px 0 0', maxHeight: '95dvh' }}>
            <div className="px-5 pt-5 pb-4 flex items-start justify-between" style={{ borderBottom: '1px solid #E2EBE5' }}>
              <div><div className="text-xs font-bold uppercase tracking-wide" style={{ color: '#238B5B' }}>{saleReview ? 'Final review' : 'Sell from storage'}</div><h2 className="text-lg font-bold" style={{ color: '#17221D' }}>{selectedStock.emoji} {selectedStock.crop} · {maxSellQuantity} Qtl available</h2><p className="text-xs mt-1" style={{ color: '#66736C' }}>{saleReview ? 'Check the money, delivery and payment terms before continuing.' : 'Only choose quantity and selling route. Grade, storage and shelf life are already known.'}</p></div>
              <button onClick={() => setSmartSellOpen(false)} className="w-8 h-8 rounded-full text-xl" style={{ color: '#66736C' }}>×</button>
            </div>
            <div className="px-5 pt-3 flex items-center gap-2 text-[10px] font-bold" style={{ color: '#66736C' }}>
              <span className="px-2 py-1 rounded-full" style={{ background: '#EAF5EE', color: '#238B5B' }}>1 Quantity ✓</span><span>→</span><span className="px-2 py-1 rounded-full" style={{ background: saleReview ? '#EAF5EE' : '#FFF8ED', color: saleReview ? '#238B5B' : '#A96910' }}>2 Route {saleReview ? '✓' : ''}</span><span>→</span><span className="px-2 py-1 rounded-full" style={{ background: saleReview ? '#FFF8ED' : '#F0F4F2', color: saleReview ? '#A96910' : '#66736C' }}>3 Review</span>
            </div>
            {saleReview ? <div className="overflow-y-auto px-5 py-4 space-y-4">
              <div className="p-4 rounded-2xl" style={{ background: '#EAF5EE', border: '1px solid #C4DFD0' }}>
                <div className="text-xs font-bold uppercase tracking-wide" style={{ color: '#238B5B' }}>{saleReview.kind === 'buyer' ? 'Buyer sale request' : 'Mandi dispatch plan'}</div>
                <h3 className="text-lg font-bold mt-1" style={{ color: '#17221D' }}>{saleReview.title}</h3>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: '#42544A' }}>You are preparing to sell <strong>{saleReview.quantityQtl} Qtl</strong> of {selectedStock.qualityGrade} {selectedStock.crop} at <strong>₹{saleReview.pricePerQtl.toLocaleString('en-IN')}/Qtl</strong>.</p>
              </div>
              <div className="p-4 rounded-2xl space-y-2.5" style={{ border: '1px solid #E2EBE5' }}>
                <div className="flex justify-between text-sm"><span style={{ color: '#66736C' }}>Crop value</span><strong>₹{saleReview.gross.toLocaleString('en-IN')}</strong></div>
                <div className="flex justify-between text-sm"><span style={{ color: '#66736C' }}>Transport</span><strong style={{ color: saleReview.transportCost ? '#D99A25' : '#238B5B' }}>{saleReview.transportCost ? `− ₹${saleReview.transportCost.toLocaleString('en-IN')}` : 'Buyer pays'}</strong></div>
                <div className="flex justify-between text-sm"><span style={{ color: '#66736C' }}>Handling and market charges</span><strong style={{ color: '#D99A25' }}>− ₹{saleReview.otherCosts.toLocaleString('en-IN')}</strong></div>
                <div className="flex justify-between pt-3 mt-1" style={{ borderTop: '1px solid #E2EBE5' }}><span className="font-bold" style={{ color: '#17221D' }}>Estimated money in your hand</span><strong className="text-xl" style={{ color: '#063B2A' }}>₹{saleReview.net.toLocaleString('en-IN')}</strong></div>
              </div>
              <div className="p-3 rounded-xl text-xs leading-relaxed" style={{ background: '#FFF8ED', border: '1px solid #F0D9A8', color: '#7A5310' }}><strong>Delivery:</strong> {saleReview.deliveryText}<br /><strong>Inventory:</strong> {Math.max(0, maxSellQuantity - saleReview.quantityQtl)} Qtl will remain available. The selected crop stays recorded in storage until buyer confirmation or physical mandi dispatch.</div>
              {saleReview.kind === 'buyer' && <div className="p-3 rounded-xl text-xs leading-relaxed" style={{ background: '#F7F6F1', color: '#42544A' }}><strong>Payment safety:</strong> Sending this request does not mean payment is locked yet. The buyer must confirm the request and fund the protected payment before pickup.</div>}
              <div className="grid grid-cols-[0.8fr_1.2fr] gap-2">
                <button onClick={() => setSaleReview(null)} className="py-3 rounded-xl text-sm font-bold" style={{ border: '1px solid #063B2A', color: '#063B2A' }}>← Change option</button>
                <button onClick={() => saleReview.kind === 'buyer' && saleReview.demand ? acceptBuyerDemand(saleReview.demand, saleReview.quantityQtl) : createMandiDispatch(saleReview.title, saleReview.quantityQtl, saleReview.net)} className="py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#063B2A' }}>{saleReview.kind === 'buyer' ? 'Send Sale Request →' : 'Prepare Dispatch Plan →'}</button>
              </div>
            </div> : <div className="overflow-y-auto px-5 py-4 space-y-4">
              <section className="p-4 rounded-2xl" style={{ border: '1px solid #E2EBE5', background: '#F8FAF8' }}>
                <div className="flex items-end justify-between gap-3">
                  <div className="flex-1"><label className="text-xs font-bold" style={{ color: '#17221D' }}>How much do you want to sell?</label><div className="flex items-center gap-2 mt-1.5"><input type="number" min="0.01" max={maxSellQuantity} step="0.01" value={sellQuantity} onChange={(event) => setSellQuantity(event.target.value)} className="w-full px-3 py-2.5 rounded-xl text-base font-bold outline-none" style={{ border: `1px solid ${quantityInvalid ? '#C94B4B' : '#C8D5CD'}`, background: '#fff' }} /><span className="text-sm font-semibold" style={{ color: '#66736C' }}>Qtl</span></div></div>
                  <div className="flex gap-1.5"><button onClick={() => setSellQuantity(String(Number((maxSellQuantity / 2).toFixed(2))))} className="px-3 py-2.5 rounded-xl text-xs font-bold" style={{ background: '#fff', border: '1px solid #D5DED8', color: '#063B2A' }}>Half</button><button onClick={() => setSellQuantity(String(maxSellQuantity))} className="px-3 py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: '#063B2A' }}>All</button></div>
                </div>
                {quantityInvalid && <div className="text-xs mt-2" style={{ color: '#B42318' }}>Enter a quantity between 0.01 and {maxSellQuantity} Qtl.</div>}
                <div className="mt-3 text-[11px]" style={{ color: '#66736C' }}>Already checked: {selectedStock.qualityGrade} · {selectedStock.aiQualityScore}% quality score · {selectedStock.storageFacility} · {selectedStock.shelfLifeLeftDays} safe days left</div>
              </section>

              {!quantityInvalid && <section className="p-4 rounded-2xl" style={{ background: '#063B2A' }}>
                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#F4C44E' }}>✨ माझे Kisan recommendation</div><div className="font-bold text-white mt-1">{recommendationTitle}</div><p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#D9E8DF' }}>{recommendationReason}</p>
              </section>}

              <section className="rounded-2xl overflow-hidden" style={{ border: '2px solid #238B5B' }}>
                <div className="px-4 py-2.5 text-white" style={{ background: '#063B2A' }}><div className="text-sm font-bold">Verified buyers</div><div className="text-[10px]" style={{ color: '#A8C4B0' }}>Direct demands matching this stored batch</div></div>
                <div className="p-3 space-y-3" style={{ background: '#F8FCF9' }}>
                  {matchingDemands.length === 0 && <div className="text-sm p-3" style={{ color: '#66736C' }}>No matching buyer demand is open for this crop today.</div>}
                  {buyerChoices.map(({ demand, quantity: matchedQuantity, gross, transport, otherCosts, net }) => {
                    return <div key={demand.id} className="p-3 rounded-xl bg-white" style={{ border: `1px solid ${recommendBuyer && bestBuyer?.demand.id === demand.id ? '#E8BE65' : '#DCE7E0'}` }}>
                      <div className="flex items-start justify-between gap-3"><div><div className="font-bold text-sm" style={{ color: '#17221D' }}>{demand.buyerCompany}</div><div className="text-xs" style={{ color: '#66736C' }}>{demand.gradeRequired} · Needs {demand.quantityQtlNeeded} Qtl · {demand.pickupDistanceKm} km</div></div><strong style={{ color: '#063B2A' }}>₹{demand.targetPriceNumeric.toLocaleString('en-IN')}/Qtl</strong></div>
                      <div className="mt-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold" style={{ background: demand.transportProvidedByBuyer ? '#EAF5EE' : '#FFF8ED', color: demand.transportProvidedByBuyer ? '#238B5B' : '#A96910' }}>{demand.transportProvidedByBuyer ? '🟢 🚚 Free farmgate pickup by buyer' : `🟡 🚜 You deliver to hub (${demand.pickupDistanceKm} km) · ₹${transport}`}</div>
                      <div className="flex justify-between mt-2 text-xs"><span style={{ color: '#66736C' }}>Estimated amount in your hand</span><strong style={{ color: '#063B2A' }}>₹{net.toLocaleString('en-IN')}</strong></div>
                      <div className="grid grid-cols-2 gap-2 mt-3"><button disabled={quantityInvalid || matchedQuantity <= 0} onClick={() => setSaleReview({ kind: 'buyer', title: demand.buyerCompany, quantityQtl: matchedQuantity, pricePerQtl: demand.targetPriceNumeric, gross, transportCost: transport, otherCosts, net, deliveryText: demand.transportProvidedByBuyer ? `Buyer pickup from ${selectedStock.storageFacility}` : `You arrange delivery to ${demand.deliveryLocation}`, demand })} className="py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40" style={{ background: '#063B2A' }}>Review Sale Request</button><button onClick={() => openDemandCounter(demand)} className="py-2 rounded-xl text-xs font-bold" style={{ border: '1px solid #063B2A', color: '#063B2A' }}>Send Counter-Offer</button></div>
                    </div>
                  })}
                </div>
              </section>

              <section className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E2EBE5' }}>
                <div className="px-4 py-3" style={{ background: '#F7F6F1' }}><div className="text-sm font-bold" style={{ color: '#17221D' }}>APMC mandi</div><div className="text-[10px]" style={{ color: '#66736C' }}>Transport calculated for your profile: {user.transportVehicle || 'None — hired vehicle required'}</div></div>
                <div className="p-3 space-y-2.5">
                  {mandiChoices.map((mandi) => <div key={mandi.name} className="p-3 rounded-xl" style={{ border: `1px solid ${mandi.net === highestMandiNet ? '#E8BE65' : '#E2EBE5'}`, background: mandi.net === highestMandiNet ? '#FFFDF6' : '#fff' }}>
                    <div className="flex justify-between gap-2"><div><strong className="text-sm" style={{ color: '#17221D' }}>{mandi.name}</strong><div className="text-[10px]" style={{ color: '#66736C' }}>{mandi.distance} km · Rate ₹{mandi.rate.toLocaleString('en-IN')}/Qtl</div></div>{mandi.net === highestMandiNet && <Badge variant="gold">🏆 Highest Net</Badge>}</div>
                    <div className="grid grid-cols-2 gap-1 mt-2 text-xs"><span style={{ color: '#66736C' }}>Gross market value</span><strong className="text-right">₹{mandi.gross.toLocaleString('en-IN')}</strong><span style={{ color: '#66736C' }}>{mandi.transportLabel}</span><strong className="text-right" style={{ color: '#D99A25' }}>− ₹{mandi.transport.toLocaleString('en-IN')}</strong><span style={{ color: '#66736C' }}>APMC cess</span><strong className="text-right" style={{ color: '#D99A25' }}>− ₹{mandi.cess.toLocaleString('en-IN')}</strong></div>
                    <div className="flex justify-between mt-2 pt-2" style={{ borderTop: '1px solid #E2EBE5' }}><span className="text-xs font-bold">Amount in your hand</span><strong style={{ color: '#063B2A' }}>₹{mandi.net.toLocaleString('en-IN')}</strong></div>
                    <button disabled={quantityInvalid} onClick={() => setSaleReview({ kind: 'mandi', title: mandi.name, quantityQtl: quantity, pricePerQtl: mandi.rate, gross: mandi.gross, transportCost: mandi.transport, otherCosts: mandi.cess, net: mandi.net, deliveryText: `${mandi.transportLabel} for ${mandi.distance} km` })} className="w-full mt-3 py-2 rounded-xl text-xs font-bold disabled:opacity-40" style={{ border: '1px solid #063B2A', color: '#063B2A' }}>Review Mandi Plan</button>
                  </div>)}
                </div>
              </section>

              <section className="p-4 rounded-2xl" style={{ background: '#063B2A' }}>
                <div className="text-sm font-bold text-white">Local trader price check</div><p className="text-xs mt-1" style={{ color: '#A8C4B0' }}>Use this certificate when a trader is offering to buy the crop directly.</p>
                <div className="mt-3 p-4 rounded-xl text-center" style={{ background: '#fff' }}><div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#238B5B' }}>माझे Kisan Fair Price Certificate</div><div className="text-xs mt-2" style={{ color: '#66736C' }}>Government APMC benchmark</div><div className="text-xl font-bold" style={{ color: '#17221D' }}>₹{(currentMandiQtl / 100).toFixed(2)}/kg</div><div className="mt-2"><Badge variant="success">{selectedStock.qualityGrade} · {selectedStock.aiQualityScore}% Assayed</Badge></div><div className="text-xs mt-3" style={{ color: '#66736C' }}>Minimum fair farmgate price</div><div className="text-2xl font-bold" style={{ color: '#063B2A' }}>₹{(fairQtl / 100).toFixed(2)}/kg</div></div>
                <button onClick={() => setCertificateOpen(true)} className="w-full mt-3 py-3 rounded-xl text-sm font-bold" style={{ background: '#F4C44E', color: '#063B2A' }}>📱 Display Certificate to Trader</button>
              </section>
            </div>}
          </div>
          {certificateOpen && <div className="absolute inset-0 z-[70] flex items-center justify-center p-4" style={{ background: '#063B2A' }}><div className="w-full max-w-lg text-center"><div className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: '#F4C44E' }}>Verified Fair Price Certificate</div><div className="text-6xl mt-5">{selectedStock.emoji}</div><div className="text-2xl font-bold text-white mt-3">{selectedStock.crop} · {selectedStock.qualityGrade}</div><div className="text-sm mt-2" style={{ color: '#A8C4B0' }}>APMC benchmark ₹{(currentMandiQtl / 100).toFixed(2)}/kg</div><div className="mt-8 text-sm text-white">DO NOT ACCEPT BELOW</div><div className="text-6xl font-bold mt-2" style={{ color: '#F4C44E' }}>₹{(fairQtl / 100).toFixed(2)}<span className="text-xl">/kg</span></div><div className="mt-5 text-sm" style={{ color: '#A8C4B0' }}>AI-assayed score {selectedStock.aiQualityScore}% · माझे Kisan Farmgate Protection</div><button onClick={() => setCertificateOpen(false)} className="mt-10 px-8 py-3 rounded-xl font-bold" style={{ background: '#fff', color: '#063B2A' }}>Close Certificate</button></div></div>}
        </div>
      })()}

      {/* Legacy wizard retained only for historical UI reference. */}
      {showLegacyWizard && smartSellOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }} />
          <div className="relative bg-white w-full sm:w-[90%] max-w-2xl flex flex-col shadow-2xl" style={{ borderRadius: '24px 24px 0 0', maxHeight: '95dvh' }}>
            {/* Header */}
            <div className="sticky top-0 bg-white px-5 pt-5 pb-0 z-10" style={{ borderRadius: '24px 24px 0 0', borderBottom: '1px solid #E2EBE5' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-bold text-base" style={{ color: '#17221D' }}>Smart Sell</div>
                  <div className="text-xs" style={{ color: '#66736C' }}>{sellCrop.name} • {sellCrop.yield}</div>
                </div>
                <div className="flex items-center gap-2">
                  {smartStep > 1 && <button onClick={() => setSmartStep(s => Math.max(1, s - 1) as SmartStep)} className="text-sm font-medium px-3 py-1.5 rounded-xl hover:bg-gray-50" style={{ color: '#66736C' }}>← Back</button>}
                  <button onClick={() => setSmartSellOpen(false)} className="text-sm px-3 py-1.5 rounded-xl border hover:bg-gray-50" style={{ color: '#66736C', borderColor: '#E2EBE5' }}>Exit</button>
                </div>
              </div>
              {/* Step indicator */}
              <div className="flex items-center gap-0 overflow-x-auto pb-4 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                {STEP_LABELS.map((label, idx) => {
                  const step = (idx + 1) as SmartStep
                  const isActive = step === smartStep
                  const isDone = step < smartStep
                  return (
                    <div key={label} className="flex items-center flex-shrink-0">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2" style={{ background: isActive ? '#063B2A' : isDone ? '#238B5B' : '#fff', borderColor: isActive ? '#063B2A' : isDone ? '#238B5B' : '#E2EBE5', color: isActive || isDone ? '#fff' : '#66736C' }}>{isDone ? '✓' : step}</div>
                        <span className="text-[9px] text-center leading-tight" style={{ width: 52, color: isActive ? '#063B2A' : '#66736C', fontWeight: isActive ? 600 : 400 }}>{label}</span>
                      </div>
                      {idx < STEP_LABELS.length - 1 && <div className="h-px mb-4 flex-shrink-0" style={{ width: 20, background: isDone ? '#238B5B' : '#E2EBE5', margin: '0 2px' }} />}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Step content */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {/* Step 1 — AI Strategy Comparison */}
              {smartStep === 1 && <>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: '#17221D' }}>AI Selling Strategy</h3>
                  <p className="text-xs mt-0.5" style={{ color: '#66736C' }}>Based on real mandi prices, weather forecast &amp; upcoming demand.</p>
                </div>

                {festivalContext && (
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl" style={{ background: '#FFF8ED', border: '1px solid #F0D9A8' }}>
                    <span className="text-2xl flex-shrink-0">🪔</span>
                    <div>
                      <div className="text-xs font-bold" style={{ color: '#D99A25' }}>{festivalContext.next_festival} {festivalContext.days_away === 0 ? 'is underway' : `in ${festivalContext.days_away} days`}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#66736C' }}>{festivalContext.advice}</div>
                      <div className="mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: '#F4C44E', color: '#063B2A' }}>Expected demand boost: {festivalContext.expected_demand_boost}</div>
                    </div>
                  </div>
                )}

                {strategiesLoading && (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#063B2A', borderTopColor: 'transparent' }} />
                    <div className="text-sm font-medium" style={{ color: '#66736C' }}>Analysing market data &amp; weather forecast…</div>
                  </div>
                )}

                {!strategiesLoading && strategies && <>
                  <div className="space-y-3">
                    {strategies.strategies.map((strategy) => {
                      const isRecommended = strategy.id === strategies.recommended_strategy
                      const isSelected = strategy.id === selectedStrategyId
                      const riskColors: Record<string, [string, string]> = {
                        green: ['#EAF5EE', '#238B5B'], yellow: ['#FFF8ED', '#D99A25'],
                        lime: ['#F0FAF2', '#2E7D32'], red: ['#FEF2F2', '#C94B4B'],
                      }
                      const [riskBg, riskText] = riskColors[strategy.risk_color] || riskColors.green
                      const costRows = [
                        ['Gross Revenue', `₹${strategy.gross_revenue.toLocaleString('en-IN')}`, false],
                        ['Transport', `− ₹${strategy.deductions.transport.toLocaleString('en-IN')}`, true],
                        ['Market Commission', `− ₹${strategy.deductions.market_commission.toLocaleString('en-IN')}`, true],
                        ['Packaging', `− ₹${strategy.deductions.packaging.toLocaleString('en-IN')}`, true],
                        ...(strategy.deductions.spoilage_loss > 0 ? [['Expected Spoilage', `− ₹${strategy.deductions.spoilage_loss.toLocaleString('en-IN')}`, true]] : []),
                        ...(strategy.deductions.storage_cost > 0 ? [['Storage Cost', `− ₹${strategy.deductions.storage_cost.toLocaleString('en-IN')}`, true]] : []),
                        ['Cultivation Expense', `− ₹${strategy.cultivation_expense.toLocaleString('en-IN')}`, true],
                      ] as Array<[string, string, boolean]>

                      return (
                        <button key={strategy.id} onClick={() => setSelectedStrategyId(strategy.id)} className="w-full text-left rounded-2xl overflow-hidden transition-all" style={{ border: `2px solid ${isSelected ? '#063B2A' : isRecommended ? '#238B5B' : '#E2EBE5'}`, boxShadow: isSelected ? '0 0 0 3px rgba(6,59,42,0.1)' : 'none' }}>
                          {isRecommended && <div className="px-4 py-1.5 flex items-center gap-2" style={{ background: '#063B2A' }}><span style={{ color: '#F4C44E' }}>⭐</span><span className="text-xs font-bold text-white">AI Recommended</span></div>}
                          <div className="p-4" style={{ background: isSelected ? '#EAF5EE' : '#fff' }}>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2"><span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: isSelected ? '#063B2A' : '#66736C' }}>{strategy.id}</span><span className="font-bold text-sm" style={{ color: '#17221D' }}>{strategy.label}</span></div>
                                <p className="text-xs mt-1 ml-8" style={{ color: '#66736C' }}>{strategy.description}</p>
                              </div>
                              <div className="ml-3 text-right flex-shrink-0"><div className="text-[10px]" style={{ color: '#66736C' }}>Est. Net</div><div className="text-base font-bold" style={{ color: '#063B2A' }}>₹{strategy.net_realization.toLocaleString('en-IN')}</div><div className="text-[10px]" style={{ color: '#66736C' }}>₹{strategy.net_per_qtl.toLocaleString('en-IN')}/Qtl</div></div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <div className="text-center p-2 rounded-xl" style={{ background: '#F7F6F1' }}><div className="text-[10px]" style={{ color: '#66736C' }}>Sell Price</div><div className="text-xs font-bold" style={{ color: '#17221D' }}>₹{strategy.predicted_price.toLocaleString('en-IN')}</div></div>
                              <div className="text-center p-2 rounded-xl" style={{ background: riskBg }}><div className="text-[10px]" style={{ color: '#66736C' }}>Risk</div><div className="text-xs font-bold" style={{ color: riskText }}>{strategy.risk}</div></div>
                              <div className="text-center p-2 rounded-xl" style={{ background: strategy.shelf_life_safe ? '#EAF5EE' : '#FEF2F2' }}><div className="text-[10px]" style={{ color: '#66736C' }}>Shelf Life</div><div className="text-xs font-bold" style={{ color: strategy.shelf_life_safe ? '#238B5B' : '#C94B4B' }}>{strategy.shelf_life_safe ? '✓ Safe' : '⚠ Tight'}</div></div>
                            </div>
                            {isSelected && <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: '1px dashed #C4DFD0' }}>
                              <div className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: '#66736C' }}>Cost Breakdown</div>
                              {costRows.map(([label, value, isDeduction]) => <div key={label} className="flex justify-between items-center"><span className="text-xs" style={{ color: '#66736C' }}>{label}</span><span className="text-xs font-semibold" style={{ color: isDeduction ? '#D99A25' : '#17221D' }}>{value}</span></div>)}
                              <div className="flex justify-between items-center pt-1.5" style={{ borderTop: '1px solid #E2EBE5' }}><span className="text-sm font-bold" style={{ color: '#17221D' }}>Net Realization</span><span className="text-base font-bold" style={{ color: '#063B2A' }}>₹{strategy.net_realization.toLocaleString('en-IN')}</span></div>
                            </div>}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="p-4 rounded-2xl bg-white" style={{ border: '1px solid #E2EBE5' }}>
                    <div className="flex items-center gap-2 mb-3"><span className="text-base">🤖</span><span className="text-sm font-bold" style={{ color: '#17221D' }}>Why Strategy {strategies.recommended_strategy}?</span></div>
                    <p className="text-xs mb-3" style={{ color: '#66736C' }}>{strategies.recommendation_summary}</p>
                    <div className="space-y-1.5">{strategies.why_factors.map((factor) => <div key={factor} className="flex items-start gap-2 text-xs" style={{ color: '#66736C' }}><span className="font-bold flex-shrink-0 mt-0.5" style={{ color: '#238B5B' }}>✓</span>{factor}</div>)}</div>
                  </div>
                  <button className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2" style={{ border: '1px solid #063B2A', color: '#063B2A' }}>⬇ Download AI Advisory Report (PDF)</button>
                </>}
              </>}

              {/* Step 2 — Buyer */}
              {smartStep === 2 && <>
                <h3 className="text-lg font-bold" style={{ color: '#17221D' }}>Choose Buyer</h3>
                <div className="rounded-2xl overflow-hidden" style={{ border: '2px solid #063B2A' }}>
                  <div className="px-4 py-1.5 flex items-center gap-1.5" style={{ background: '#063B2A' }}><span className="text-xs" style={{ color: '#F4C44E' }}>⭐</span><span className="text-xs font-semibold text-white">AI Recommended</span></div>
                  <div className="p-4 cursor-pointer" style={{ background: selBuyer === 'deccan' ? '#EAF5EE' : '#fff' }} onClick={() => setSelBuyer('deccan')}>
                    <div className="flex items-start justify-between mb-3">
                      <div><div className="font-bold" style={{ color: '#17221D' }}>{BUYERS[0].name}</div><div className="text-xl font-bold mt-0.5" style={{ color: '#063B2A' }}>{BUYERS[0].price}</div><div className="flex items-center gap-2 mt-1 flex-wrap"><span className="text-xs" style={{ color: '#66736C' }}>{BUYERS[0].dist}</span><Badge variant="success">{BUYERS[0].grade}</Badge></div></div>
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1" style={{ background: selBuyer === 'deccan' ? '#063B2A' : '#fff', borderColor: selBuyer === 'deccan' ? '#063B2A' : '#E2EBE5' }}>{selBuyer === 'deccan' && <div className="w-2 h-2 rounded-full bg-white" />}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={e => { e.stopPropagation(); setSelBuyer('deccan') }} className="flex-1 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: '#063B2A' }}>{selBuyer === 'deccan' ? '✓ Selected' : 'Select'}</button>
                      <button onClick={e => { e.stopPropagation(); setNegotiateOpen(true) }} className="flex-1 py-2 rounded-xl text-xs font-semibold border" style={{ color: '#66736C', borderColor: '#E2EBE5' }}>Negotiate</button>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold" style={{ color: '#17221D' }}>Other Suitable Buyers</span><button className="text-xs font-semibold" style={{ color: '#063B2A' }}>View More</button></div>
                  <div className="space-y-2.5">
                    {BUYERS.slice(1).map(b => (
                      <SelectCard key={b.id} selected={selBuyer === b.id} onClick={() => setSelBuyer(b.id)}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1"><div className="font-semibold text-sm" style={{ color: '#17221D' }}>{b.name}</div><div className="flex items-center gap-2 mt-0.5"><span className="text-sm font-bold" style={{ color: '#063B2A' }}>{b.price}</span><span className="text-xs" style={{ color: '#66736C' }}>· {b.dist}</span></div><div className="flex gap-1.5 mt-1 flex-wrap"><Badge variant="neutral">{b.grade}</Badge>{b.transport && <Badge variant="neutral">Transport Support</Badge>}</div></div>
                          <div className="flex flex-col gap-1.5 ml-3 flex-shrink-0">
                            <button onClick={e => { e.stopPropagation(); setSelBuyer(b.id) }} className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white" style={{ background: selBuyer === b.id ? '#063B2A' : '#238B5B' }}>{selBuyer === b.id ? '✓' : 'Select'}</button>
                            <button onClick={e => { e.stopPropagation(); setNegotiateOpen(true) }} className="px-3 py-1.5 rounded-xl text-xs border" style={{ color: '#66736C', borderColor: '#E2EBE5' }}>Negotiate</button>
                          </div>
                        </div>
                      </SelectCard>
                    ))}
                  </div>
                </div>
              </>}

              {/* Step 3 — Transport */}
              {smartStep === 3 && <>
                <h3 className="text-lg font-bold" style={{ color: '#17221D' }}>Choose Transport</h3>
                <div className="rounded-2xl overflow-hidden" style={{ border: '2px solid #063B2A' }}>
                  <div className="px-4 py-1.5 flex items-center gap-1.5" style={{ background: '#063B2A' }}><span className="text-xs" style={{ color: '#F4C44E' }}>⭐</span><span className="text-xs font-semibold text-white">AI Recommended</span></div>
                  <SelectCard selected={selTransport === 'tata'} onClick={() => setSelTransport('tata')} className="rounded-none border-0">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-3xl">🚛</span><div><div className="font-bold" style={{ color: '#17221D' }}>Tata Ace / Mini Truck</div><div className="text-xs mt-0.5" style={{ color: '#66736C' }}>28 km · 1.2 Ton · 1 Day</div></div></div><div className="text-right ml-2"><div className="font-bold" style={{ color: '#063B2A' }}>₹728</div>{selTransport === 'tata' && <div className="text-[10px] font-semibold" style={{ color: '#238B5B' }}>✓ Selected</div>}</div></div>
                  </SelectCard>
                </div>
                <div className="space-y-2.5">
                  {TRANSPORT.slice(1).map(t => (
                    <SelectCard key={t.id} selected={selTransport === t.id} onClick={() => setSelTransport(t.id)}>
                      <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-2xl">{t.icon}</span><div><div className="font-semibold text-sm" style={{ color: '#17221D' }}>{t.name}</div><div className="text-xs mt-0.5" style={{ color: '#66736C' }}>{t.capacity} · {t.delivery}</div></div></div><div className="text-right ml-2"><div className="font-bold text-sm" style={{ color: '#17221D' }}>{t.cost}</div>{selTransport === t.id && <div className="text-[10px] font-semibold" style={{ color: '#238B5B' }}>✓ Selected</div>}</div></div>
                    </SelectCard>
                  ))}
                </div>
              </>}

              {/* Step 4 — Storage */}
              {smartStep === 4 && <>
                <h3 className="text-lg font-bold" style={{ color: '#17221D' }}>Choose Storage</h3>
                <div className="rounded-2xl overflow-hidden" style={{ border: '2px solid #063B2A' }}>
                  <div className="px-4 py-1.5 flex items-center gap-1.5" style={{ background: '#063B2A' }}><span className="text-xs" style={{ color: '#F4C44E' }}>⭐</span><span className="text-xs font-semibold text-white">AI Recommended</span></div>
                  <SelectCard selected={selStorage === 'wdra'} onClick={() => setSelStorage('wdra')} className="rounded-none border-0">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-3xl">🏭</span><div><div className="font-bold" style={{ color: '#17221D' }}>WDRA Godown</div><div className="text-xs mt-0.5" style={{ color: '#66736C' }}>14 km · Good Facility · Secure</div></div></div><div className="font-bold" style={{ color: '#063B2A' }}>₹18 / Day</div></div>
                  </SelectCard>
                </div>
                <div className="space-y-2.5">
                  {STORAGE.slice(1).map(s => (
                    <SelectCard key={s.id} selected={selStorage === s.id} onClick={() => setSelStorage(s.id)} className={s.isDirect ? 'border-dashed' : ''}>
                      <div className="flex items-start justify-between"><div className="flex items-start gap-3"><span className="text-2xl mt-0.5">{s.icon}</span><div><div className="font-semibold text-sm" style={{ color: s.isDirect ? '#D99A25' : '#17221D' }}>{s.name}</div><div className="text-xs mt-0.5" style={{ color: '#66736C' }}>{s.note}</div></div></div><div className="font-bold text-sm ml-2" style={{ color: '#17221D' }}>{s.cost}</div></div>
                    </SelectCard>
                  ))}
                </div>
              </>}

              {/* Step 5 — Quality */}
              {smartStep === 5 && <>
                <h3 className="text-lg font-bold" style={{ color: '#17221D' }}>AI Quality Check</h3>
                {qualityDone
                  ? <div className="space-y-4">
                    <div className="p-4 rounded-2xl" style={{ background: '#EAF5EE', border: '1px solid #C4DFD0' }}>
                      <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ background: '#238B5B' }}>✓</div><div><div className="font-bold" style={{ color: '#17221D' }}>Quality Check Completed</div><div className="text-xs font-semibold mt-0.5" style={{ color: '#238B5B' }}>{selectedStock?.qualityGrade || 'Assayed'} · AI score {selectedStock?.aiQualityScore || 97.8}%</div></div></div>
                      {[['Moisture', '11.4%'], ['Size (Avg)', '58 mm'], ['Defects', '1.2%']].map(([l, v]) => <div key={l} className="flex items-center justify-between py-1"><span className="text-sm" style={{ color: '#66736C' }}>{l}</span><span className="text-sm font-semibold" style={{ color: '#17221D' }}>{v}</span></div>)}
                      <div className="mt-2"><div className="flex items-center justify-between mb-1"><span className="text-sm" style={{ color: '#66736C' }}>AI Confidence</span><span className="text-sm font-bold" style={{ color: '#238B5B' }}>{selectedStock?.aiQualityScore || 97.8}%</span></div><div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#C4DFD0' }}><div className="h-full rounded-full" style={{ width: `${selectedStock?.aiQualityScore || 97.8}%`, background: '#238B5B' }} /></div></div>
                    </div>
                    <button className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2" style={{ border: '1px solid #063B2A', color: '#063B2A' }}>📄 View Full Quality Report</button>
                  </div>
                  : <div className="p-6 rounded-2xl text-center" style={{ background: '#FFF8ED', border: '1px solid #F0D9A8' }}>
                    <div className="text-5xl mb-3">📷</div>
                    <div className="font-bold mb-1" style={{ color: '#17221D' }}>Quality Check Not Completed</div>
                    <div className="text-xs mb-4" style={{ color: '#66736C' }}>Upload crop photos and enter parameters for AI grading.</div>
                    <button onClick={handleCompleteQualityAssay} className="w-full py-3 rounded-xl text-sm font-semibold text-white" style={{ background: '#063B2A' }}>Complete AI Quality Check</button>
                  </div>
                }
              </>}

              {/* Step 6 — Final Review */}
              {smartStep === 6 && <>
                <h3 className="text-lg font-bold" style={{ color: '#17221D' }}>Final Trade Summary</h3>
                <div className="px-4 py-2.5 rounded-xl mb-3" style={{ background: '#EAF5EE' }}>
                  <span className="text-xs font-bold" style={{ color: '#063B2A' }}>
                    Executing Strategy {selectedStrategyId}: {strategies?.strategies.find(strategy => strategy.id === selectedStrategyId)?.label || 'Selected selling plan'}
                  </span>
                </div>
                <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E2EBE5' }}>
                  {[[sellCrop.emoji, 'Crop & Quantity', `${sellCrop.name} — ${sellCrop.variety}`, sellCrop.yield], ['🏢', 'Buyer', buyerData.name, buyerData.price], ['🚛', 'Transport', transportData.name, transportData.cost], ['🏭', 'Current Storage', selectedStock?.storageFacility || storageData.name, selectedStock ? `₹${selectedStock.storageCostPerDay}/day` : storageData.cost], ['✅', 'Quality Grade', selectedStock?.qualityGrade || 'Assayed', selectedStock ? `AI: ${selectedStock.aiQualityScore}%` : '—']].map(([icon, label, value, sub], i) => (
                    <div key={label as string} className="flex items-start gap-3 px-4 py-3.5" style={{ borderTop: i > 0 ? '1px solid #F0F4F2' : 'none' }}>
                      <span className="text-xl mt-0.5">{icon}</span>
                      <div className="flex-1"><div className="text-xs" style={{ color: '#66736C' }}>{label}</div><div className="text-sm font-semibold mt-0.5" style={{ color: '#17221D' }}>{value}</div>{sub && <div className="text-xs mt-0.5" style={{ color: '#238B5B' }}>{sub}</div>}</div>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-2xl" style={{ background: '#EAF5EE', border: '1px solid #C4DFD0' }}>
                  <div className="flex justify-between items-center mb-2"><span className="text-sm" style={{ color: '#66736C' }}>Gross Realization</span><span className="font-bold" style={{ color: '#17221D' }}>₹{(strategies?.strategies.find(strategy => strategy.id === selectedStrategyId)?.gross_revenue || 154800).toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between items-center mb-3"><span className="text-sm" style={{ color: '#66736C' }}>Total Costs</span><span className="font-bold" style={{ color: '#D99A25' }}>₹{((strategies?.strategies.find(strategy => strategy.id === selectedStrategyId)?.total_deductions || 728) + (strategies?.strategies.find(strategy => strategy.id === selectedStrategyId)?.cultivation_expense || 28000)).toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid #C4DFD0' }}><span className="font-bold" style={{ color: '#17221D' }}>Est. Net Realization</span><span className="text-2xl font-bold" style={{ color: '#063B2A' }}>₹{(strategies?.strategies.find(strategy => strategy.id === selectedStrategyId)?.net_realization || 126072).toLocaleString('en-IN')}</span></div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: '#F7F6F1', border: '1px solid #E2EBE5' }}>
                  <span className="text-xl flex-shrink-0">🔒</span>
                  <p className="text-xs" style={{ color: '#66736C' }}>Your trade will enter the protected selling / escrow process after confirmation.</p>
                </div>
              </>}
            </div>

            {/* Footer CTA */}
            <div className="sticky bottom-0 bg-white px-5 pt-3 pb-5" style={{ borderTop: '1px solid #E2EBE5' }}>
              {smartStep < 6
                ? <button onClick={() => setSmartStep(s => Math.min(6, s + 1) as SmartStep)} className="w-full py-4 rounded-2xl font-bold text-base hover:opacity-90" style={{ background: '#F4C44E', color: '#063B2A' }}>
                  {smartStep === 1 ? `Continue with Strategy ${selectedStrategyId} →` : ['Continue to Buyer →', 'Next: Transport →', 'Next: Storage →', 'Next: Quality Check →', 'Next: Final Review →'][smartStep - 1]}
                </button>
                : <button onClick={confirmSale} className="w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 hover:opacity-90" style={{ background: '#063B2A' }}>🌾 Confirm &amp; Start Selling →</button>
              }
            </div>
          </div>
        </div>
      )}

      {/* ════════ NEGOTIATE MODAL ════════ */}
      {negotiateOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setNegotiateOpen(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base" style={{ color: '#17221D' }}>Negotiate with {counterDemand?.buyerCompany || 'Buyer'}</h3>
              <button onClick={() => setNegotiateOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-xl hover:bg-gray-100" style={{ color: '#66736C' }}>×</button>
            </div>
            <div className="space-y-3.5">
              <div className="px-4 py-3 rounded-xl" style={{ background: '#EAF5EE' }}><div className="text-xs" style={{ color: '#66736C' }}>Current Buyer Bid</div><div className="text-2xl font-bold mt-0.5" style={{ color: '#063B2A' }}>₹{(counterDemand?.targetPriceNumeric || 2580).toLocaleString('en-IN')} / Qtl</div></div>
              <div><FieldLabel>Your Counter Offer (₹ per Qtl)</FieldLabel><Input placeholder="e.g. ₹2,650" value={counterPrice} onChange={setCounterPrice} /></div>
              <div><FieldLabel>Quantity</FieldLabel><div className="px-3.5 py-2.5 rounded-xl text-sm" style={{ background: '#F7F6F1', color: '#17221D', border: '1px solid #E2EBE5' }}>{Math.min(selectedStock?.quantityQtl || 0, counterDemand?.quantityQtlNeeded || selectedStock?.quantityQtl || 0)} Quintals available for this demand</div></div>
              <div><FieldLabel>Delivery Terms</FieldLabel><Select value="" onChange={() => { }} options={['Delivery within 2 days', 'Delivery within 1 week', 'Flexible']} /></div>
              <button onClick={handleSendCounterOffer} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#063B2A' }}>Submit Counter Offer</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ HISTORY DETAIL MODAL ════════ */}
      {historyDetail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setHistoryDetailId(null)} />
          <div className="relative bg-white w-full sm:w-[90%] max-w-xl flex flex-col shadow-2xl" style={{ borderRadius: '24px 24px 0 0', maxHeight: '92dvh' }}>
            {/* Header */}
            <div className="sticky top-0 bg-white px-5 pt-5 pb-4 z-10" style={{ borderBottom: '1px solid #E2EBE5', borderRadius: '24px 24px 0 0' }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: '#C4DFD0' }}>
                    <img src={historyDetail.img} alt={historyDetail.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold leading-tight" style={{ color: '#17221D' }}>{historyDetail.name}</h2>
                    <div className="text-xs mt-0.5" style={{ color: '#66736C' }}>{historyDetail.variety}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: '#EAF5EE', color: '#238B5B' }}>✓ Completed</span>
                  <button onClick={() => setHistoryDetailId(null)} className="w-8 h-8 flex items-center justify-center rounded-full text-xl hover:bg-gray-100" style={{ color: '#66736C' }}>×</button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Trade Summary grid */}
              <div>
                <h3 className="text-sm font-bold mb-3" style={{ color: '#17221D' }}>Trade Summary</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {[['Crop & Variety', `${historyDetail.name} · ${historyDetail.variety}`], ['Buyer', historyDetail.buyer], ['Quantity Sold', historyDetail.quintals], ['Selling Price', historyDetail.price], ['Plot Size', historyDetail.acres], ['Total Sale Value', historyDetail.gross], ['Sold On', historyDetail.soldOn], ['Final Profit', historyDetail.net]].map(([label, value]) => (
                    <div key={label}>
                      <div className="text-[11px]" style={{ color: '#66736C' }}>{label}</div>
                      <div className="text-sm font-semibold mt-0.5" style={{ color: label === 'Final Profit' ? '#238B5B' : '#17221D' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logistics */}
              <div className="grid grid-cols-3 gap-3">
                {[{ icon: '🚛', label: 'Transport', name: historyDetail.transport, cost: `Cost: ${historyDetail.transportCost}` }, { icon: '🏭', label: 'Storage', name: historyDetail.storage, cost: `Cost: ${historyDetail.storageCost}` }, { icon: '✅', label: 'Quality Grade', name: historyDetail.grade, cost: `(${historyDetail.confidence} Confidence)` }].map(({ icon, label, name, cost }) => (
                  <div key={label} className="p-3 rounded-xl text-center" style={{ background: '#F7F6F1', border: '1px solid #E2EBE5' }}>
                    <div className="text-xl mb-1">{icon}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#66736C' }}>{label}</div>
                    <div className="text-xs font-bold" style={{ color: '#17221D' }}>{name}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: '#66736C' }}>{cost}</div>
                  </div>
                ))}
              </div>

              {/* AI Quality Summary */}
              <div className="p-4 rounded-2xl" style={{ background: '#EAF5EE', border: '1px solid #C4DFD0' }}>
                <div className="text-sm font-bold mb-3" style={{ color: '#17221D' }}>AI Quality Summary</div>
                <div className="grid grid-cols-4 gap-3 text-center">
                  {[['Moisture', historyDetail.moisture], ['Size (Avg)', historyDetail.size], ['Defects', historyDetail.defects], ['AI Confidence', historyDetail.confidence]].map(([label, value]) => (
                    <div key={label}><div className="text-[10px]" style={{ color: '#66736C' }}>{label}</div><div className="text-sm font-bold mt-0.5" style={{ color: '#063B2A' }}>{value}</div></div>
                  ))}
                </div>
              </div>

              {/* Financials */}
              <div className="p-4 rounded-2xl" style={{ background: '#F7F6F1', border: '1px solid #E2EBE5' }}>
                <div className="flex justify-between items-center mb-2"><span className="text-sm" style={{ color: '#66736C' }}>Cultivation Expense</span><span className="font-semibold text-sm" style={{ color: '#17221D' }}>{historyDetail.expense}</span></div>
                <div className="flex justify-between items-center mb-2"><span className="text-sm" style={{ color: '#66736C' }}>Gross Realization</span><span className="font-semibold text-sm" style={{ color: '#17221D' }}>{historyDetail.gross}</span></div>
                <div className="flex justify-between items-center mb-3"><span className="text-sm" style={{ color: '#66736C' }}>Total Deductions</span><span className="font-semibold text-sm" style={{ color: '#D99A25' }}>{historyDetail.deductions}</span></div>
                <div className="flex justify-between items-center pt-2.5" style={{ borderTop: '1px solid #E2EBE5' }}><span className="font-bold" style={{ color: '#17221D' }}>Final Net Profit</span><span className="text-xl font-bold" style={{ color: '#238B5B' }}>{historyDetail.net}</span></div>
              </div>

              {/* Downloads */}
              <div>
                <div className="text-sm font-bold mb-3" style={{ color: '#17221D' }}>Reports</div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button className="py-3 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5" style={{ border: '1px solid #063B2A', color: '#063B2A' }}>⬇ Download Quality Report<span className="text-[10px] opacity-60">PDF</span></button>
                  <button className="py-3 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5" style={{ border: '1px solid #063B2A', color: '#063B2A' }}>⬇ AI Suggestion Report<span className="text-[10px] opacity-60">PDF</span></button>
                </div>
              </div>
            </div>

            {/* Close */}
            <div className="sticky bottom-0 bg-white px-5 pt-3 pb-5" style={{ borderTop: '1px solid #E2EBE5' }}>
              <button onClick={() => setHistoryDetailId(null)} className="w-full py-3.5 rounded-2xl font-semibold text-sm" style={{ border: '1.5px solid #E2EBE5', color: '#66736C' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

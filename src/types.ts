export type UserRole = 'farmer' | 'buyer'

export interface User {
  id: string
  role: UserRole
  name: string
  phone: string
  email?: string
  location: string
  avatar?: string
  // Farmer specific
  landSize?: string
  farmerId?: string
  primaryCrops?: string[]
  transportVehicle?: 'None' | 'Tractor & Trolley' | 'Pickup / Tempo' | 'Two-Wheeler'
  // Buyer specific
  companyName?: string
  buyerType?: 'Wholesale Trader' | 'Food Processor' | 'Exporter' | 'Retail Chain' | 'FPO Aggregator'
  gstin?: string
  verifiedBadge?: boolean
  walletBalance?: number
}

export type CropId = string

export interface CropItem {
  id: CropId
  farmerId?: string
  name: string
  variety: string
  acres: string
  sowing: string
  harvest: string
  yieldQtl: number
  yield: string
  spent: string
  stage: 'Seedling' | 'Planted' | 'Growing' | 'Flowering' | 'Bulb Development' | 'Fruiting / Ripening' | 'Harvesting' | 'Harvested' | 'In Storage'
  health: 'Healthy' | 'Moderate' | 'Attention Needed'
  healthScore: number
  maturity: number
  irrigation: string
  img: string
  emoji: string
  plotSizeAcres: number
  sowingDateRaw: string
  harvestDateRaw: string
  expenses: {
    seeds: number
    fertilizers: number
    irrigation: number
    labour: number
    pestControl: number
    machinery: number
  }
}

export interface MarketplaceListing {
  id: string
  farmerId: string
  farmerName: string
  farmerPhone: string
  location: string
  distanceKm: number
  crop: string
  variety: string
  quantityQtl: number
  minOrderQtl: number
  askingPricePerQtl: number
  mandiBenchmarkPrice: number
  qualityGrade: 'Grade A' | 'Grade B' | 'Grade C'
  aiQualityScore: number
  moisturePct: number
  defectsPct: number
  harvestReadyDate: string
  image: string
  verifiedFarmer: boolean
  farmerRating: number
  escrowProtected: boolean
  status?: 'Active' | 'Under Negotiation' | 'Sold'
}

export interface BuyerItem {
  id: string
  name: string
  company: string
  price: string
  priceNumeric: number
  dist: string
  distNumeric: number
  grade: string
  transport: boolean
  isAI: boolean
  rating: number
  verified: boolean
  location: string
  avatar: string
}

export interface TransportOption {
  id: string
  name: string
  cost: string
  costNumeric: number
  capacity: string
  delivery: string
  icon: string
  isAI: boolean
}

export interface StorageOption {
  id: string
  name: string
  cost: string
  costNumeric: number
  dist: string
  note: string
  icon: string
  isDirect: boolean
  isAI: boolean
}

export interface MarketPriceItem {
  id: string
  crop: string
  minPrice: number
  maxPrice: number
  modalPrice: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  trendPct: string
  mandi: string
}

export interface StorageStockItem {
  id: string
  farmerId: string
  cropId?: string
  crop: string
  variety: string
  quantityQtl: number
  qualityGrade: 'Grade A' | 'Grade B' | 'Grade C'
  aiQualityScore: number
  harvestDate: string
  storedOn: string
  storageFacility: string
  storageCostPerDay: number
  initialShelfLifeDays: number
  shelfLifeLeftDays: number
  spoilageRiskPct: number
  cultivationExpense: number
  costOfProductionPerKg: number
  fairFarmgateValuationPerQtl: number
  status: 'Fresh' | 'Optimal' | 'Near Expiry' | 'Sold'
  emoji: string
  img: string
}

export interface OrderItem {
  id: string
  listingId?: string
  cropName: string
  variety: string
  quantityQtl: number
  totalAmount: number
  pricePerQtl: number
  farmerId?: string
  farmerName: string
  farmerLocation: string
  farmerPhone: string
  buyerId?: string
  buyerName: string
  buyerCompany: string
  buyerLocation: string
  transportVehicle: string
  transportCost?: number
  storageFacility?: string
  status: 'Escrow Funded' | 'Pickup Scheduled' | 'In Transit' | 'Quality Verified' | 'Completed'
  statusStep: number
  date: string
  qualityGrade: string
  escrowLocked: boolean
  deliveryETA: string
}

export interface ProcurementDemand {
  id: string
  buyerId?: string
  buyerName: string
  buyerCompany: string
  cropName: string
  variety: string
  quantityQtlNeeded: number
  targetPricePerQtl: string
  targetPriceNumeric: number
  requiredByDate: string
  deliveryLocation: string
  buyerType: string
  gradeRequired: string
  responsesCount: number
  status: 'Active' | 'Fulfilled' | 'Expired'
  transportProvidedByBuyer: boolean
  pickupDistanceKm: number
}

export interface NegotiationBid {
  id: string
  demandId?: string
  listingId?: string
  senderId: string
  senderRole: 'farmer' | 'buyer'
  senderName: string
  targetUserId: string
  cropName: string
  requestedQuantityQtl: number
  counterPricePerQtl: number
  deliveryTerms: string
  note?: string
  cropImages?: string[]
  cropGrade?: string
  cropVariety?: string
  cropLocation?: string
  harvestStatus?: string
  farmerPhone?: string
  farmerAccountLocation?: string
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Countered'
  createdAt: string
  updatedAt?: string
  decisionNote?: string
}

export interface SchemeItem {
  id: string
  title: string
  category: 'Government Scheme' | 'Loan Recommendation' | 'Insurance'
  benefit: string
  whyEligible: string
  status: 'Eligible' | 'Applied' | 'Approved'
  interestRate?: string
  maxLimit?: string
  tenure?: string
  emi?: string
  suitabilityScore?: string
  logoIcon: string
}

export type FarmerTab = 'overview' | 'crops' | 'storage' | 'market' | 'schemes'
export type BuyerTab = 'marketplace' | 'orders' | 'demands' | 'trends' | 'wallet'

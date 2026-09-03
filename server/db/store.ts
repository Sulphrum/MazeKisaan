import fs from 'node:fs'
import path from 'node:path'
import type {
  User,
  CropItem,
  MarketplaceListing,
  BuyerItem,
  TransportOption,
  StorageOption,
  StorageStockItem,
  MarketPriceItem,
  OrderItem,
  ProcurementDemand,
  NegotiationBid,
  SchemeItem,
  NotificationItem,
} from './types.ts'

export interface DatabaseSchema {
  users: User[]
  crops: CropItem[]
  marketplaceListings: MarketplaceListing[]
  buyers: BuyerItem[]
  transportOptions: TransportOption[]
  storageOptions: StorageOption[]
  storageStocks: StorageStockItem[]
  marketPrices: MarketPriceItem[]
  orders: OrderItem[]
  demands: ProcurementDemand[]
  negotiations: NegotiationBid[]
  schemes: SchemeItem[]
  notifications: NotificationItem[]
}

const DB_DIR = process.env.KISANSETU_DB_DIR
  ? path.resolve(process.env.KISANSETU_DB_DIR)
  : path.resolve(process.cwd(), 'server/data')
const DB_FILE = path.join(DB_DIR, 'db.json')

// ─── Initial Seed Data ────────────────────────────────────────────────────────
const INITIAL_SEED: DatabaseSchema = {
  users: [
    {
      id: 'farmer_ramesh',
      role: 'farmer',
      name: 'Ramesh Patil',
      phone: '98220 14589',
      email: 'ramesh.patil@kisan.in',
      password: 'password123',
      location: 'Niphad, Nashik, Maharashtra',
      avatar: 'RP',
      landSize: '5.2 Acres',
      farmerId: 'MH-NSK-2026-8842',
      primaryCrops: ['Tomato', 'Onion', 'Brinjal'],
      transportVehicle: 'None',
      createdAt: '2026-06-01T08:00:00.000Z',
    },
    {
      id: 'farmer_sunita',
      role: 'farmer',
      name: 'Sunita Jadhav',
      phone: '98909 22461',
      email: 'sunita.jadhav@majhekisan.demo',
      password: 'password123',
      location: 'Pimpalgaon Baswant, Nashik, Maharashtra',
      avatar: 'SJ',
      landSize: '3.8 Acres',
      farmerId: 'MH-NSK-2026-9014',
      primaryCrops: ['Tomato', 'Onion'],
      transportVehicle: 'Pickup / Tempo',
      createdAt: '2026-06-08T09:15:00.000Z',
    },
    {
      id: 'farmer_vijay',
      role: 'farmer',
      name: 'Vijay Shinde',
      phone: '97658 41032',
      email: 'vijay.shinde@majhekisan.demo',
      password: 'password123',
      location: 'Dindori, Nashik, Maharashtra',
      avatar: 'VS',
      landSize: '6.1 Acres',
      farmerId: 'MH-NSK-2026-9072',
      primaryCrops: ['Tomato', 'Brinjal', 'Grapes'],
      transportVehicle: 'Tractor & Trolley',
      createdAt: '2026-06-11T07:45:00.000Z',
    },
    {
      id: 'farmer_meena',
      role: 'farmer',
      name: 'Meena Pawar',
      phone: '94221 67318',
      email: 'meena.pawar@majhekisan.demo',
      password: 'password123',
      location: 'Yeola, Nashik, Maharashtra',
      avatar: 'MP',
      landSize: '4.5 Acres',
      farmerId: 'MH-NSK-2026-9138',
      primaryCrops: ['Potato', 'Onion', 'Maize'],
      transportVehicle: 'None',
      createdAt: '2026-06-14T10:20:00.000Z',
    },
    {
      id: 'buyer_deccan',
      role: 'buyer',
      name: 'Sunil Kulkarni',
      phone: '98450 98211',
      email: 'sunil@deccanfresh.com',
      password: 'password123',
      location: 'Market Yard Hub, Pune, Maharashtra',
      companyName: 'Deccan Fresh Exports Pvt Ltd',
      buyerType: 'Exporter',
      gstin: '27AABCD8921M1Z5',
      verifiedBadge: true,
      walletBalance: 485000,
      avatar: 'DF',
      createdAt: '2026-05-15T10:30:00.000Z',
    },
    {
      id: 'buyer_sahyadri',
      role: 'buyer',
      name: 'Anand More',
      phone: '97664 33120',
      email: 'procure@sahyadriagro.in',
      password: 'password123',
      location: 'Nashik Agro Terminal, Maharashtra',
      companyName: 'Sahyadri Agro Mart',
      buyerType: 'Wholesale Trader',
      gstin: '27AAECS4431P1ZP',
      verifiedBadge: true,
      walletBalance: 320000,
      avatar: 'SA',
      createdAt: '2026-05-20T12:00:00.000Z',
    },
    {
      id: 'buyer_greenroots',
      role: 'buyer',
      name: 'Vikas Sharma',
      phone: '98765 41082',
      email: 'buy@greenroots.in',
      password: 'password123',
      location: 'Vashi Processing Unit, Navi Mumbai, Maharashtra',
      companyName: 'GreenRoots Organics',
      buyerType: 'Food Processor',
      gstin: '27AAGCG4182N1ZR',
      verifiedBadge: true,
      walletBalance: 410000,
      avatar: 'GR',
      createdAt: '2026-05-22T09:00:00.000Z',
    },
    {
      id: 'buyer_lasalgaon',
      role: 'buyer',
      name: 'Sanjay Patil',
      phone: '98602 71450',
      email: 'trade@lasalgaoncrops.in',
      password: 'password123',
      location: 'Lasalgaon Market Yard, Nashik, Maharashtra',
      companyName: 'Lasalgaon Crop Traders',
      buyerType: 'Wholesale Trader',
      gstin: '27AAFCL7250D1Z8',
      verifiedBadge: true,
      walletBalance: 275000,
      avatar: 'LC',
      createdAt: '2026-05-24T11:00:00.000Z',
    },
  ],

  crops: [
    {
      id: 'tomato',
      farmerId: 'farmer_ramesh',
      name: 'Tomato',
      variety: 'Hybrid Table S-31',
      acres: '2 Acres',
      plotSizeAcres: 2.0,
      sowing: '20 Jun 2026',
      sowingDateRaw: '2026-06-20',
      harvest: '03 Sep 2026',
      harvestDateRaw: '2026-09-03',
      yieldQtl: 60,
      yield: '60 Quintals',
      spent: '₹28,000',
      stage: 'Fruiting / Ripening',
      health: 'Healthy',
      healthScore: 82,
      maturity: 85,
      irrigation: 'Drip Irrigation',
      img: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=700&h=380&fit=crop&auto=format',
      emoji: '🍅',
      expenses: {
        seeds: 4500,
        fertilizers: 6200,
        irrigation: 3800,
        labour: 8500,
        pestControl: 2500,
        machinery: 2500,
      },
      qualityAssay: {
        completed: true,
        grade: 'Grade A',
        confidence: 97.8,
        moisturePct: 11.4,
        avgSizeMm: 58,
        defectsPct: 1.2,
        assayedAt: '2026-08-25T14:30:00.000Z',
        certificateNumber: 'KS-QAC-2026-8910',
      },
    },
    {
      id: 'onion',
      farmerId: 'farmer_ramesh',
      name: 'Onion',
      variety: 'Nashik Red Garwa',
      acres: '3 Acres',
      plotSizeAcres: 3.0,
      sowing: '15 Jul 2026',
      sowingDateRaw: '2026-07-15',
      harvest: '28 Oct 2026',
      harvestDateRaw: '2026-11-20',
      yieldQtl: 85,
      yield: '85 Quintals',
      spent: '₹32,000',
      stage: 'Bulb Development',
      health: 'Healthy',
      healthScore: 78,
      maturity: 52,
      irrigation: 'Flood Irrigation',
      img: 'https://images.unsplash.com/photo-1565685225009-fc85d9109c80?w=700&h=380&fit=crop&auto=format',
      emoji: '🧅',
      expenses: {
        seeds: 5200,
        fertilizers: 7400,
        irrigation: 4100,
        labour: 9600,
        pestControl: 3100,
        machinery: 2600,
      },
    },
    {
      id: 'brinjal',
      farmerId: 'farmer_ramesh',
      name: 'Brinjal',
      variety: 'Pusa Purple Long',
      acres: '1.2 Acres',
      plotSizeAcres: 1.2,
      sowing: '10 Aug 2026',
      sowingDateRaw: '2026-08-10',
      harvest: '05 Nov 2026',
      harvestDateRaw: '2026-11-05',
      yieldQtl: 40,
      yield: '40 Quintals',
      spent: '₹18,500',
      stage: 'Growing',
      health: 'Healthy',
      healthScore: 68,
      maturity: 40,
      irrigation: 'Drip Irrigation',
      img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=700&h=380&fit=crop&auto=format',
      emoji: '🍆',
      expenses: {
        seeds: 3100,
        fertilizers: 4200,
        irrigation: 2400,
        labour: 5800,
        pestControl: 1600,
        machinery: 1400,
      },
    },
  ],

  marketplaceListings: [
    {
      id: 'list_101',
      farmerId: 'farmer_ramesh',
      farmerName: 'Ramesh Patil',
      farmerPhone: '98220 14589',
      location: 'Niphad, Nashik',
      distanceKm: 28,
      crop: 'Tomato',
      variety: 'Hybrid Table S-31',
      quantityQtl: 60,
      minOrderQtl: 10,
      askingPricePerQtl: 2580,
      mandiBenchmarkPrice: 2420,
      qualityGrade: 'Grade A',
      aiQualityScore: 97.8,
      moisturePct: 11.4,
      defectsPct: 1.2,
      harvestReadyDate: '10 Sep 2026',
      image: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=600&h=350&fit=crop&auto=format',
      verifiedFarmer: true,
      farmerRating: 4.9,
      escrowProtected: true,
      status: 'Active',
      createdAt: '2026-08-25T10:00:00.000Z',
    },
    {
      id: 'list_102',
      farmerId: 'farmer_anand',
      farmerName: 'Anand Shinde',
      farmerPhone: '98233 44551',
      location: 'Lasalgaon, Nashik',
      distanceKm: 34,
      crop: 'Onion',
      variety: 'Nashik Red Garwa (Export)',
      quantityQtl: 85,
      minOrderQtl: 20,
      askingPricePerQtl: 2400,
      mandiBenchmarkPrice: 2280,
      qualityGrade: 'Grade A',
      aiQualityScore: 96.2,
      moisturePct: 12.1,
      defectsPct: 1.5,
      harvestReadyDate: '15 Sep 2026',
      image: 'https://images.unsplash.com/photo-1565685225009-fc85d9109c80?w=600&h=350&fit=crop&auto=format',
      verifiedFarmer: true,
      farmerRating: 4.8,
      escrowProtected: true,
      status: 'Active',
      createdAt: '2026-08-26T11:00:00.000Z',
    },
    {
      id: 'list_103',
      farmerId: 'farmer_suresh',
      farmerName: 'Suresh Jadhav',
      farmerPhone: '94221 88902',
      location: 'Dindori, Nashik',
      distanceKm: 22,
      crop: 'Brinjal',
      variety: 'Pusa Purple Long',
      quantityQtl: 40,
      minOrderQtl: 5,
      askingPricePerQtl: 1950,
      mandiBenchmarkPrice: 1850,
      qualityGrade: 'Grade B',
      aiQualityScore: 91.5,
      moisturePct: 14.0,
      defectsPct: 2.8,
      harvestReadyDate: '02 Sep 2026',
      image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&h=350&fit=crop&auto=format',
      verifiedFarmer: true,
      farmerRating: 4.7,
      escrowProtected: true,
      status: 'Active',
      createdAt: '2026-08-24T09:00:00.000Z',
    },
    {
      id: 'list_104',
      farmerId: 'farmer_balu',
      farmerName: 'Balasaheb Kadam',
      farmerPhone: '97640 11984',
      location: 'Baramati, Pune',
      distanceKm: 65,
      crop: 'Grapes',
      variety: 'Thompson Seedless (Export)',
      quantityQtl: 120,
      minOrderQtl: 25,
      askingPricePerQtl: 6800,
      mandiBenchmarkPrice: 6400,
      qualityGrade: 'Grade A',
      aiQualityScore: 98.4,
      moisturePct: 9.8,
      defectsPct: 0.8,
      harvestReadyDate: '28 Sep 2026',
      image: 'https://images.unsplash.com/photo-1596363505729-4190a9506133?w=600&h=350&fit=crop&auto=format',
      verifiedFarmer: true,
      farmerRating: 5.0,
      escrowProtected: true,
      status: 'Active',
      createdAt: '2026-08-27T08:00:00.000Z',
    },
    {
      id: 'list_105',
      farmerId: 'farmer_govind',
      farmerName: 'Govind Rathod',
      farmerPhone: '98902 47712',
      location: 'Khed, Pune',
      distanceKm: 48,
      crop: 'Potato',
      variety: 'Kufri Jyoti Table',
      quantityQtl: 150,
      minOrderQtl: 30,
      askingPricePerQtl: 1820,
      mandiBenchmarkPrice: 1750,
      qualityGrade: 'Grade A',
      aiQualityScore: 94.0,
      moisturePct: 13.5,
      defectsPct: 1.9,
      harvestReadyDate: '05 Sep 2026',
      image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&h=350&fit=crop&auto=format',
      verifiedFarmer: true,
      farmerRating: 4.6,
      escrowProtected: true,
      status: 'Active',
      createdAt: '2026-08-27T14:00:00.000Z',
    },
  ],

  buyers: [
    {
      id: 'deccan',
      name: 'Sunil Kulkarni',
      company: 'Deccan Fresh Exports',
      price: '₹2,580 / Qtl',
      priceNumeric: 2580,
      dist: '28 km',
      distNumeric: 28,
      grade: 'Grade A Required',
      transport: true,
      isAI: true,
      rating: 4.9,
      verified: true,
      location: 'Pune Agro SEZ',
      avatar: '🏢',
    },
    {
      id: 'sahyadri',
      name: 'Anand More',
      company: 'Sahyadri Agro',
      price: '₹2,340 / Qtl',
      priceNumeric: 2340,
      dist: '35 km',
      distNumeric: 35,
      grade: 'Grade A/B',
      transport: true,
      isAI: false,
      rating: 4.7,
      verified: true,
      location: 'Nashik MIDC',
      avatar: '🏬',
    },
    {
      id: 'greenroots',
      name: 'Vikas Sharma',
      company: 'GreenRoots Organics',
      price: '₹2,530 / Qtl',
      priceNumeric: 2530,
      dist: '32 km',
      distNumeric: 32,
      grade: 'Grade A Premium',
      transport: true,
      isAI: false,
      rating: 4.8,
      verified: true,
      location: 'Vashi Wholesale Hub',
      avatar: '🌿',
    },
    {
      id: 'nashik_foods',
      name: 'Dilip Rathi',
      company: 'Nashik Foods Pvt Ltd',
      price: '₹2,280 / Qtl',
      priceNumeric: 2280,
      dist: '42 km',
      distNumeric: 42,
      grade: 'Grade B',
      transport: false,
      isAI: false,
      rating: 4.5,
      verified: false,
      location: 'Sinnar Industrial Area',
      avatar: '🏭',
    },
  ],

  transportOptions: [
    {
      id: 'tata',
      name: 'Tata Ace / Mini Truck',
      cost: '₹728',
      costNumeric: 728,
      capacity: '1.2 Ton',
      delivery: 'Same Day',
      icon: '🚛',
      isAI: true,
    },
    {
      id: 'bolero',
      name: 'Bolero Pickup',
      cost: '₹850',
      costNumeric: 850,
      capacity: '1.5 Ton',
      delivery: '1 Day',
      icon: '🚐',
      isAI: false,
    },
    {
      id: 'reefer',
      name: 'Reefer Van (Cold Chain)',
      cost: '₹1,450',
      costNumeric: 1450,
      capacity: '1.0 Ton',
      delivery: 'Same Day (Chilled)',
      icon: '❄️',
      isAI: false,
    },
    {
      id: 'tractor',
      name: 'Tractor Trolley',
      cost: '₹600',
      costNumeric: 600,
      capacity: '2.0 Ton',
      delivery: '1–2 Days',
      icon: '🚜',
      isAI: false,
    },
    {
      id: 'fpo',
      name: 'FPO Shared Van',
      cost: '₹520',
      costNumeric: 520,
      capacity: '1.0 Ton',
      delivery: '1–2 Days',
      icon: '🤝',
      isAI: false,
    },
  ],

  storageOptions: [
    {
      id: 'wdra',
      name: 'WDRA Certified Godown',
      cost: '₹18 / Day',
      costNumeric: 18,
      dist: '14 km',
      note: 'Government e-NWR Receipt · 70% Loan eligible',
      icon: '🏭',
      isDirect: false,
      isAI: true,
    },
    {
      id: 'cold',
      name: 'Sahyadri Cold Storage',
      cost: '₹45 / Day',
      costNumeric: 45,
      dist: '22 km',
      note: 'Temperature & Humidity Controlled (4°C)',
      icon: '🧊',
      isDirect: false,
      isAI: false,
    },
    {
      id: 'govt',
      name: 'Maharashtra State Warehousing',
      cost: '₹15 / Day',
      costNumeric: 15,
      dist: '18 km',
      note: 'Subsidised tariff · Insured stock',
      icon: '🏛️',
      isDirect: false,
      isAI: false,
    },
    {
      id: 'direct',
      name: 'No Storage — Sell Directly',
      cost: '₹0 (Free)',
      costNumeric: 0,
      dist: '—',
      note: 'AI: Direct farmgate dispatch saves storage overhead.',
      icon: '⚡',
      isDirect: true,
      isAI: false,
    },
  ],

  storageStocks: [
    {
      id: 'stk_1',
      farmerId: 'farmer_ramesh',
      cropId: 'tomato',
      crop: 'Tomato',
      variety: 'Hybrid Table S-31',
      quantityQtl: 60,
      qualityGrade: 'Grade A',
      aiQualityScore: 97.8,
      harvestDate: '27 Aug 2026',
      storedOn: '27 Aug 2026',
      storageFacility: 'WDRA Godown, Niphad',
      storageCostPerDay: 18,
      initialShelfLifeDays: 7,
      shelfLifeLeftDays: 5,
      spoilageRiskPct: 4.2,
      cultivationExpense: 28000,
      costOfProductionPerKg: 4.66,
      fairFarmgateValuationPerQtl: 2250,
      status: 'Near Expiry',
      emoji: '🍅',
      img: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=700&h=380&fit=crop&auto=format',
    },
    {
      id: 'stk_2',
      farmerId: 'farmer_ramesh',
      crop: 'Potato',
      variety: 'Kufri Jyoti',
      quantityQtl: 40,
      qualityGrade: 'Grade B',
      aiQualityScore: 88.4,
      harvestDate: '24 Jul 2026',
      storedOn: '24 Jul 2026',
      storageFacility: 'On-Farm Storage',
      storageCostPerDay: 0,
      initialShelfLifeDays: 60,
      shelfLifeLeftDays: 45,
      spoilageRiskPct: 1.8,
      cultivationExpense: 22000,
      costOfProductionPerKg: 5.5,
      fairFarmgateValuationPerQtl: 1750,
      status: 'Fresh',
      emoji: '🥔',
      img: 'https://images.unsplash.com/photo-1518977676405-d40a08fe0bb3?w=700&h=380&fit=crop&auto=format',
    },
  ],

  marketPrices: [
    { id: 'mp_1', crop: 'Tomato', emoji: '🍅', minPrice: 2000, maxPrice: 2800, modalPrice: 2450, unit: '₹ / Qtl', trend: 'up', trendPct: '+8%', mandi: 'Pune APMC', lastUpdated: 'Today, 09:30 AM' },
    { id: 'mp_2', crop: 'Onion', emoji: '🧅', minPrice: 1800, maxPrice: 2600, modalPrice: 2250, unit: '₹ / Qtl', trend: 'up', trendPct: '+3%', mandi: 'Lasalgaon Mandi', lastUpdated: 'Today, 10:15 AM' },
    { id: 'mp_3', crop: 'Potato', emoji: '🥔', minPrice: 1600, maxPrice: 2200, modalPrice: 1950, unit: '₹ / Qtl', trend: 'down', trendPct: '-2%', mandi: 'Nashik Market', lastUpdated: 'Today, 08:45 AM' },
    { id: 'mp_4', crop: 'Brinjal', emoji: '🍆', minPrice: 1500, maxPrice: 2400, modalPrice: 1950, unit: '₹ / Qtl', trend: 'up', trendPct: '+5%', mandi: 'Pune Market Yard', lastUpdated: 'Today, 11:00 AM' },
    { id: 'mp_5', crop: 'Grapes', emoji: '🍇', minPrice: 5800, maxPrice: 7200, modalPrice: 6500, unit: '₹ / Qtl', trend: 'up', trendPct: '+12%', mandi: 'Nashik Export Hub', lastUpdated: 'Today, 09:00 AM' },
  ],

  orders: [
    {
      id: 'KS-8921',
      listingId: 'list_101',
      cropName: 'Tomato',
      variety: 'Hybrid Table S-31',
      quantityQtl: 60,
      totalAmount: 154800,
      pricePerQtl: 2580,
      farmerId: 'farmer_ramesh',
      farmerName: 'Ramesh Patil',
      farmerLocation: 'Niphad, Nashik',
      farmerPhone: '98220 14589',
      buyerId: 'buyer_deccan',
      buyerName: 'Sunil Kulkarni',
      buyerCompany: 'Deccan Fresh Exports',
      buyerLocation: 'Market Yard Hub, Pune',
      transportVehicle: 'Tata Ace (MH-15-AB-4021)',
      transportCost: 728,
      status: 'In Transit',
      statusStep: 3,
      date: '28 Aug 2026',
      qualityGrade: 'Grade A (97.8%)',
      escrowLocked: true,
      deliveryETA: 'Today by 6:00 PM',
      invoiceNumber: 'INV-KS-2026-8921',
      ewayBillNumber: 'EWB-27-891028374',
      createdAt: '2026-08-28T06:00:00.000Z',
    },
    {
      id: 'KS-8904',
      listingId: 'list_102',
      cropName: 'Onion',
      variety: 'Nashik Red Garwa',
      quantityQtl: 85,
      totalAmount: 204000,
      pricePerQtl: 2400,
      farmerId: 'farmer_anand',
      farmerName: 'Anand Shinde',
      farmerLocation: 'Lasalgaon, Nashik',
      farmerPhone: '98233 44551',
      buyerId: 'buyer_deccan',
      buyerName: 'Sunil Kulkarni',
      buyerCompany: 'Deccan Fresh Exports',
      buyerLocation: 'Market Yard Hub, Pune',
      transportVehicle: 'Bolero Pickup (MH-15-CL-8809)',
      transportCost: 850,
      status: 'Quality Verified',
      statusStep: 4,
      date: '26 Aug 2026',
      qualityGrade: 'Grade A (96.2%)',
      escrowLocked: true,
      deliveryETA: 'Delivered · Awaiting Payout',
      invoiceNumber: 'INV-KS-2026-8904',
      ewayBillNumber: 'EWB-27-481920381',
      createdAt: '2026-08-26T08:00:00.000Z',
    },
    {
      id: 'KS-8876',
      listingId: 'list_103',
      cropName: 'Brinjal',
      variety: 'Pusa Purple Long',
      quantityQtl: 40,
      totalAmount: 78000,
      pricePerQtl: 1950,
      farmerId: 'farmer_suresh',
      farmerName: 'Suresh Jadhav',
      farmerLocation: 'Dindori, Nashik',
      farmerPhone: '94221 88902',
      buyerId: 'buyer_sahyadri',
      buyerName: 'Anand More',
      buyerCompany: 'Sahyadri Agro Mart',
      buyerLocation: 'Nashik MIDC',
      transportVehicle: 'FPO Shared Van (MH-15-X-1200)',
      transportCost: 520,
      status: 'Completed',
      statusStep: 5,
      date: '22 Aug 2026',
      qualityGrade: 'Grade B (91.5%)',
      escrowLocked: false,
      deliveryETA: 'Completed & Escrow Settled',
      invoiceNumber: 'INV-KS-2026-8876',
      ewayBillNumber: 'EWB-27-109283746',
      createdAt: '2026-08-22T09:00:00.000Z',
    },
  ],

  demands: [
    {
      id: 'dem_101',
      buyerId: 'buyer_deccan',
      buyerName: 'Sunil Kulkarni',
      buyerCompany: 'Deccan Fresh Exports',
      cropName: 'Tomato',
      variety: 'Hybrid Table S-31 / Arka Rakshak',
      quantityQtlNeeded: 50,
      targetPricePerQtl: '₹2,580 / Qtl',
      targetPriceNumeric: 2580,
      requiredByDate: '05 Sep 2026',
      deliveryLocation: 'Pune Export Packhouse',
      buyerType: 'Exporter',
      gradeRequired: 'Grade A Only',
      responsesCount: 6,
      status: 'Active',
      transportProvidedByBuyer: true,
      pickupDistanceKm: 28,
      createdAt: '2026-08-26T12:00:00.000Z',
    },
    {
      id: 'dem_102',
      buyerId: 'buyer_sahyadri',
      buyerName: 'Anand More',
      buyerCompany: 'Sahyadri Agro Terminal',
      cropName: 'Tomato',
      variety: 'Hybrid Table S-31 / Arka Rakshak',
      quantityQtlNeeded: 80,
      targetPricePerQtl: '₹2,450 / Qtl',
      targetPriceNumeric: 2450,
      requiredByDate: '15 Sep 2026',
      deliveryLocation: 'Nashik Agro Terminal',
      buyerType: 'Wholesale Trader',
      gradeRequired: 'Grade A / Grade B',
      responsesCount: 11,
      status: 'Active',
      transportProvidedByBuyer: false,
      pickupDistanceKm: 35,
      createdAt: '2026-08-25T14:00:00.000Z',
    },
    {
      id: 'dem_103',
      buyerId: 'buyer_greenroots',
      buyerName: 'Vikas Sharma',
      buyerCompany: 'GreenRoots Organics',
      cropName: 'Potato',
      variety: 'Kufri Jyoti / Chipsona',
      quantityQtlNeeded: 200,
      targetPricePerQtl: '₹1,850 – ₹1,950 / Qtl',
      targetPriceNumeric: 1900,
      requiredByDate: '10 Sep 2026',
      deliveryLocation: 'Vashi Processing Unit, Navi Mumbai',
      buyerType: 'Food Processor',
      gradeRequired: 'Grade A',
      responsesCount: 4,
      status: 'Active',
      transportProvidedByBuyer: false,
      pickupDistanceKm: 165,
      createdAt: '2026-08-27T10:00:00.000Z',
    },
    {
      id: 'dem_104',
      buyerId: 'buyer_lasalgaon',
      buyerName: 'Sanjay Patil',
      buyerCompany: 'Lasalgaon Crop Traders',
      cropName: 'Onion',
      variety: 'Nashik Red / Red Garwa',
      quantityQtlNeeded: 120,
      targetPricePerQtl: '₹2,200 / Qtl',
      targetPriceNumeric: 2200,
      requiredByDate: '12 Sep 2026',
      deliveryLocation: 'Lasalgaon Market Yard, Nashik',
      buyerType: 'Wholesale Trader',
      gradeRequired: 'Grade A / Grade B',
      responsesCount: 2,
      status: 'Active',
      transportProvidedByBuyer: true,
      pickupDistanceKm: 45,
      createdAt: '2026-08-29T11:30:00.000Z',
    },
  ],

  negotiations: [
    {
      id: 'demo_offer_deccan_sunita',
      demandId: 'dem_101',
      senderId: 'farmer_sunita',
      senderRole: 'farmer',
      senderName: 'Sunita Jadhav',
      targetUserId: 'buyer_deccan',
      cropName: 'Tomato',
      requestedQuantityQtl: 32,
      counterPricePerQtl: 2560,
      deliveryTerms: 'Buyer pickup from farm',
      note: 'Fresh harvest is ready. Sorting and packing can be completed before pickup.',
      cropImages: ['https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=900&h=520&fit=crop&auto=format'],
      cropGrade: 'Grade A',
      cropVariety: 'Arka Rakshak',
      cropLocation: 'Pimpalgaon Baswant, Nashik',
      harvestStatus: 'Ready to harvest',
      farmerPhone: '98909 22461',
      farmerAccountLocation: 'Pimpalgaon Baswant, Nashik, Maharashtra',
      status: 'Pending',
      createdAt: '2026-09-03T07:20:00.000Z',
    },
    {
      id: 'demo_offer_sahyadri_vijay',
      demandId: 'dem_102',
      senderId: 'farmer_vijay',
      senderRole: 'farmer',
      senderName: 'Vijay Shinde',
      targetUserId: 'buyer_sahyadri',
      cropName: 'Tomato',
      requestedQuantityQtl: 46,
      counterPricePerQtl: 2475,
      deliveryTerms: 'Farmer can deliver to Nashik terminal',
      note: 'Crop is graded and can reach the terminal on the required date.',
      cropImages: ['https://images.unsplash.com/photo-1561136594-7f68413baa99?w=900&h=520&fit=crop&auto=format'],
      cropGrade: 'Grade A',
      cropVariety: 'Hybrid Table S-31',
      cropLocation: 'Dindori, Nashik',
      harvestStatus: 'Harvested',
      farmerPhone: '97658 41032',
      farmerAccountLocation: 'Dindori, Nashik, Maharashtra',
      status: 'Pending',
      createdAt: '2026-09-03T06:45:00.000Z',
    },
    {
      id: 'demo_offer_greenroots_meena',
      demandId: 'dem_103',
      senderId: 'farmer_meena',
      senderRole: 'farmer',
      senderName: 'Meena Pawar',
      targetUserId: 'buyer_greenroots',
      cropName: 'Potato',
      requestedQuantityQtl: 70,
      counterPricePerQtl: 1920,
      deliveryTerms: 'Transport required from buyer',
      note: 'Uniform-size potatoes are stored in a dry, ventilated room.',
      cropImages: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=900&h=520&fit=crop&auto=format'],
      cropGrade: 'Grade A',
      cropVariety: 'Kufri Jyoti',
      cropLocation: 'Yeola, Nashik',
      harvestStatus: 'In storage',
      farmerPhone: '94221 67318',
      farmerAccountLocation: 'Yeola, Nashik, Maharashtra',
      status: 'Pending',
      createdAt: '2026-09-02T13:10:00.000Z',
    },
    {
      id: 'demo_offer_lasalgaon_sunita',
      demandId: 'dem_104',
      senderId: 'farmer_sunita',
      senderRole: 'farmer',
      senderName: 'Sunita Jadhav',
      targetUserId: 'buyer_lasalgaon',
      cropName: 'Onion',
      requestedQuantityQtl: 55,
      counterPricePerQtl: 2180,
      deliveryTerms: 'Buyer pickup within 45 km',
      note: 'Dry red onions are cleaned, cured and ready for loading.',
      cropImages: ['https://images.unsplash.com/photo-1508747703725-719777637510?w=900&h=520&fit=crop&auto=format'],
      cropGrade: 'Grade A',
      cropVariety: 'Nashik Red Garwa',
      cropLocation: 'Pimpalgaon Baswant, Nashik',
      harvestStatus: 'In storage',
      farmerPhone: '98909 22461',
      farmerAccountLocation: 'Pimpalgaon Baswant, Nashik, Maharashtra',
      status: 'Pending',
      createdAt: '2026-09-02T10:30:00.000Z',
    },
  ],

  schemes: [
    {
      id: 'pm_kisan',
      title: 'PM-Kisan Samman Nidhi',
      category: 'Financial Support',
      benefit: '₹6,000 / year direct transfer',
      whyEligible: 'Land holding is under 2.0 ha (Eligible)',
      status: 'Eligible',
      logoIcon: '🌾',
    },
    {
      id: 'pmfby',
      title: 'Pradhan Mantri Fasal Bima (PMFBY)',
      category: 'Insurance',
      benefit: 'Comprehensive Crop Loss Insurance',
      whyEligible: 'Tomato & Onion are notified crops in Nashik',
      status: 'Eligible',
      logoIcon: '🛡️',
    },
    {
      id: 'soil_card',
      title: 'Soil Health Card Scheme',
      category: 'Infrastructure',
      benefit: 'Free soil nutrient testing & advisory',
      whyEligible: 'All registered farmers eligible every 2 years',
      status: 'Approved',
      logoIcon: '🧪',
    },
    {
      id: 'kcc_loan',
      title: 'Kisan Credit Card (KCC)',
      category: 'Financial Support',
      benefit: 'Concessional Interest Rate @ 7% (Subsidised to 4% on prompt repayment)',
      whyEligible: 'Based on your 5.2 Acres cultivated land holding',
      status: 'Eligible',
      interestRate: '7% p.a.',
      maxLimit: '₹3,00,000',
      tenure: '3 Years',
      emi: '₹9,265 / month',
      suitabilityScore: '★★★★★ (98% Match)',
      logoIcon: '💳',
    },
    {
      id: 'gold_loan',
      title: 'Agri Gold Loan (SBI / NABARD)',
      category: 'Financial Support',
      benefit: 'Instant agricultural liquidity with lowest paperwork',
      whyEligible: 'Fast clearance for farm input purchase',
      status: 'Eligible',
      interestRate: '8.5% p.a.',
      maxLimit: '₹2,00,000',
      tenure: '2 Years',
      emi: '₹8,735 / month',
      suitabilityScore: '★★★★☆',
      logoIcon: '🪙',
    },
    {
      id: 'equip_loan',
      title: 'Farm Equipment / Drip Financing',
      category: 'Infrastructure',
      benefit: 'Capital subsidy up to 45% for micro-irrigation',
      whyEligible: 'Qualifies under PMKSY Maharashtra state subsidy',
      status: 'Eligible',
      interestRate: '9% p.a.',
      maxLimit: '₹5,00,000',
      tenure: '5 Years',
      emi: '₹10,380 / month',
      suitabilityScore: '★★★★☆',
      logoIcon: '🚜',
    },
  ],

  notifications: [
    {
      id: 'notif_1',
      role: 'buyer',
      userId: 'buyer_deccan',
      title: 'Order KS-8921 In Transit',
      message: 'Tata Ace (MH-15-AB-4021) departed Niphad farm. ETA 6:00 PM.',
      type: 'order',
      read: false,
      timestamp: '15 mins ago',
    },
    {
      id: 'notif_2',
      role: 'farmer',
      userId: 'farmer_ramesh',
      title: 'Escrow Payment Secured',
      message: '₹1,54,800 locked in escrow for 60 Qtl Tomato order.',
      type: 'escrow',
      read: false,
      timestamp: '2 hours ago',
    },
    {
      id: 'notif_3',
      role: 'all',
      title: 'Mandi Price Alert',
      message: 'Tomato wholesale modal price jumped +8% to ₹2,450/Qtl in Pune APMC.',
      type: 'price',
      read: true,
      timestamp: '5 hours ago',
    },
  ],
}

// ─── Persistent Database Store Class ──────────────────────────────────────────
class DatabaseStore {
  private data: DatabaseSchema

  constructor() {
    this.data = this.loadData()
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true })
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8')
        const parsed = JSON.parse(raw)
        const storageStocks = (parsed.storageStocks?.length ? parsed.storageStocks : INITIAL_SEED.storageStocks).map((stock: any) => ({
          id: stock.id,
          farmerId: stock.farmerId || 'farmer_ramesh',
          cropId: stock.cropId,
          crop: stock.crop,
          variety: stock.variety || 'Standard',
          quantityQtl: Number(stock.quantityQtl ?? (Number(stock.quantityKg || 0) / 10)),
          qualityGrade: stock.qualityGrade || `Grade ${stock.grade || 'B'}`,
          aiQualityScore: Number(stock.aiQualityScore ?? 85),
          harvestDate: stock.harvestDate || stock.storedOn,
          storedOn: stock.storedOn,
          storageFacility: stock.storageFacility || stock.location || 'On-Farm Storage',
          storageCostPerDay: Number(stock.storageCostPerDay ?? 0),
          initialShelfLifeDays: Number(stock.initialShelfLifeDays ?? stock.shelfLifeLeftDays ?? 15),
          shelfLifeLeftDays: Number(stock.shelfLifeLeftDays ?? 15),
          spoilageRiskPct: Number(stock.spoilageRiskPct ?? 3),
          cultivationExpense: Number(stock.cultivationExpense ?? 0),
          costOfProductionPerKg: Number(stock.costOfProductionPerKg ?? (Number(stock.cultivationExpense || 0) / Math.max(1, Number(stock.quantityQtl || 1) * 100))),
          fairFarmgateValuationPerQtl: Number(stock.fairFarmgateValuationPerQtl ?? (stock.crop === 'Tomato' ? 2250 : stock.crop === 'Potato' ? 1750 : 2000)),
          status: stock.status === 'Near Expiry' ? 'Near Expiry' : stock.status === 'Sold' ? 'Sold' : 'Fresh',
          emoji: stock.emoji || '📦',
          img: stock.img || '',
        }))
        return {
          ...INITIAL_SEED,
          ...parsed,
          users: (() => {
            const accounts = (parsed.users?.length ? parsed.users : INITIAL_SEED.users)
              .map((account: any) => account.id === 'farmer_ramesh' ? { ...account, transportVehicle: account.transportVehicle || 'None' } : account)
            for (const seedAccount of INITIAL_SEED.users) {
              if (!accounts.some((account: User) => account.id === seedAccount.id)) accounts.push({ ...seedAccount })
            }
            return accounts
          })(),
          crops: parsed.crops?.length ? parsed.crops : INITIAL_SEED.crops,
          marketplaceListings: parsed.marketplaceListings?.length ? parsed.marketplaceListings : INITIAL_SEED.marketplaceListings,
          orders: parsed.orders?.length ? parsed.orders : INITIAL_SEED.orders,
          demands: (() => {
            const source = parsed.demands?.length ? parsed.demands : INITIAL_SEED.demands
            const demands = source.map((demand: any) => {
              const normalized = {
                ...demand,
                transportProvidedByBuyer: Boolean(demand.transportProvidedByBuyer),
                pickupDistanceKm: Number(demand.pickupDistanceKm || 0),
              }
              if (demand.id === 'dem_101') {
                return {
                  ...normalized,
                  cropName: 'Tomato',
                  quantityQtlNeeded: 50,
                  targetPricePerQtl: '₹2,580 / Qtl',
                  targetPriceNumeric: 2580,
                  transportProvidedByBuyer: true,
                  pickupDistanceKm: 28,
                }
              }
              if (demand.id === 'dem_102') {
                return {
                  ...normalized,
                  buyerCompany: 'Sahyadri Agro Terminal',
                  cropName: 'Tomato',
                  variety: 'Hybrid Table S-31 / Arka Rakshak',
                  quantityQtlNeeded: 80,
                  targetPricePerQtl: '₹2,450 / Qtl',
                  targetPriceNumeric: 2450,
                  transportProvidedByBuyer: false,
                  pickupDistanceKm: 35,
                }
              }
              return normalized
            })
            for (const seedDemand of INITIAL_SEED.demands) {
              if (!demands.some((demand: ProcurementDemand) => demand.id === seedDemand.id)) {
                demands.push({ ...seedDemand })
              }
            }
            return demands
          })(),
          negotiations: (() => {
            const negotiations = parsed.negotiations?.length ? [...parsed.negotiations] : []
            for (const seedOffer of INITIAL_SEED.negotiations) {
              if (!negotiations.some((offer: NegotiationBid) => offer.id === seedOffer.id)) {
                negotiations.push({ ...seedOffer })
              }
            }
            return negotiations
          })(),
          storageStocks,
        }
      } else {
        this.saveData(INITIAL_SEED)
        return JSON.parse(JSON.stringify(INITIAL_SEED))
      }
    } catch (err) {
      console.error('[DatabaseStore] Error loading DB, falling back to memory seed:', err)
      return JSON.parse(JSON.stringify(INITIAL_SEED))
    }
  }

  private saveData(dataToSave: DatabaseSchema = this.data) {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true })
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8')
    } catch (err) {
      console.error('[DatabaseStore] Error saving DB to disk:', err)
    }
  }

  // ─── Users ──────────────────────────────────────────────────────────────────
  getUsers(): User[] {
    return this.data.users
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id)
  }

  getUserByPhoneOrEmail(identifier: string): User | undefined {
    const clean = identifier.trim().toLowerCase().replace(/\s+/g, '')
    return this.data.users.find((u) => {
      const phoneClean = u.phone.replace(/\s+/g, '').toLowerCase()
      const emailClean = u.email?.trim().toLowerCase()
      return phoneClean === clean || (emailClean && emailClean === clean)
    })
  }

  createUser(user: User): User {
    this.data.users.push(user)
    this.saveData()
    return user
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const index = this.data.users.findIndex((u) => u.id === id)
    if (index === -1) return undefined
    this.data.users[index] = { ...this.data.users[index], ...updates }
    this.saveData()
    return this.data.users[index]
  }

  // ─── Crops ──────────────────────────────────────────────────────────────────
  getCrops(farmerId?: string): CropItem[] {
    if (farmerId) {
      return this.data.crops.filter((c) => c.farmerId === farmerId)
    }
    return this.data.crops
  }

  getCropById(id: string): CropItem | undefined {
    return this.data.crops.find((c) => c.id === id)
  }

  createCrop(crop: CropItem): CropItem {
    this.data.crops.push(crop)
    this.saveData()
    return crop
  }

  updateCrop(id: string, updates: Partial<CropItem>): CropItem | undefined {
    const index = this.data.crops.findIndex((c) => c.id === id)
    if (index === -1) return undefined
    this.data.crops[index] = { ...this.data.crops[index], ...updates }
    this.saveData()
    return this.data.crops[index]
  }

  deleteCrop(id: string): boolean {
    const len = this.data.crops.length
    this.data.crops = this.data.crops.filter((c) => c.id !== id)
    if (this.data.crops.length !== len) {
      this.saveData()
      return true
    }
    return false
  }

  // ─── Marketplace Listings ───────────────────────────────────────────────────
  getMarketplaceListings(filters?: {
    crop?: string
    qualityGrade?: string
    maxDistanceKm?: number
    search?: string
  }): MarketplaceListing[] {
    let list = this.data.marketplaceListings.filter((l) => l.status !== 'Sold')

    if (filters) {
      if (filters.crop && filters.crop.toLowerCase() !== 'all') {
        list = list.filter((l) => l.crop.toLowerCase() === filters.crop!.toLowerCase())
      }
      if (filters.qualityGrade && filters.qualityGrade.toLowerCase() !== 'all') {
        list = list.filter((l) => l.qualityGrade.toLowerCase() === filters.qualityGrade!.toLowerCase())
      }
      if (filters.maxDistanceKm) {
        list = list.filter((l) => l.distanceKm <= filters.maxDistanceKm!)
      }
      if (filters.search) {
        const q = filters.search.toLowerCase()
        list = list.filter(
          (l) =>
            l.crop.toLowerCase().includes(q) ||
            l.variety.toLowerCase().includes(q) ||
            l.farmerName.toLowerCase().includes(q) ||
            l.location.toLowerCase().includes(q)
        )
      }
    }

    return list
  }

  getMarketplaceListingById(id: string): MarketplaceListing | undefined {
    return this.data.marketplaceListings.find((l) => l.id === id)
  }

  createMarketplaceListing(listing: MarketplaceListing): MarketplaceListing {
    this.data.marketplaceListings.unshift(listing)
    this.saveData()
    return listing
  }

  updateMarketplaceListing(id: string, updates: Partial<MarketplaceListing>): MarketplaceListing | undefined {
    const index = this.data.marketplaceListings.findIndex((l) => l.id === id)
    if (index === -1) return undefined
    this.data.marketplaceListings[index] = { ...this.data.marketplaceListings[index], ...updates }
    this.saveData()
    return this.data.marketplaceListings[index]
  }

  // ─── Buyers Directory ───────────────────────────────────────────────────────
  getBuyers(): BuyerItem[] {
    return this.data.buyers
  }

  // ─── Logistics & Storage ───────────────────────────────────────────────────
  getTransportOptions(): TransportOption[] {
    return this.data.transportOptions
  }

  getStorageOptions(): StorageOption[] {
    return this.data.storageOptions
  }

  getStorageStocks(farmerId?: string): StorageStockItem[] {
    if (farmerId) {
      return this.data.storageStocks.filter((s) => s.farmerId === farmerId)
    }
    return this.data.storageStocks
  }

  createStorageStock(stock: StorageStockItem): StorageStockItem {
    this.data.storageStocks.unshift(stock)
    this.saveData()
    return stock
  }

  updateStorageStock(id: string, updates: Partial<StorageStockItem>): StorageStockItem | undefined {
    const index = this.data.storageStocks.findIndex((stock) => stock.id === id)
    if (index === -1) return undefined
    this.data.storageStocks[index] = { ...this.data.storageStocks[index], ...updates }
    this.saveData()
    return this.data.storageStocks[index]
  }

  deleteStorageStock(id: string): boolean {
    const before = this.data.storageStocks.length
    this.data.storageStocks = this.data.storageStocks.filter((stock) => stock.id !== id)
    if (this.data.storageStocks.length === before) return false
    this.saveData()
    return true
  }

  // ─── Market Prices ─────────────────────────────────────────────────────────
  getMarketPrices(): MarketPriceItem[] {
    return this.data.marketPrices
  }

  // ─── Orders & Escrow ────────────────────────────────────────────────────────
  getOrders(userId?: string, role?: 'farmer' | 'buyer'): OrderItem[] {
    if (!userId) return this.data.orders
    if (role === 'farmer') {
      return this.data.orders.filter((o) => o.farmerId === userId || o.farmerName.toLowerCase().includes(userId.toLowerCase()))
    }
    if (role === 'buyer') {
      return this.data.orders.filter((o) => o.buyerId === userId || o.buyerName.toLowerCase().includes(userId.toLowerCase()))
    }
    return this.data.orders
  }

  getOrderById(id: string): OrderItem | undefined {
    return this.data.orders.find((o) => o.id === id)
  }

  createOrder(order: OrderItem): OrderItem {
    this.data.orders.unshift(order)

    if (order.buyerId) {
      const buyer = this.getUserById(order.buyerId)
      if (buyer && buyer.walletBalance !== undefined) buyer.walletBalance -= order.totalAmount
    }

    // Add notification for both parties
    this.createNotification({
      id: `notif_${Date.now()}_1`,
      userId: order.farmerId,
      role: 'farmer',
      title: 'New Procurement Order Received',
      message: `${order.buyerCompany} funded ₹${order.totalAmount.toLocaleString('en-IN')} escrow for ${order.quantityQtl} Qtl ${order.cropName}.`,
      type: 'order',
      read: false,
      timestamp: 'Just now',
    })

    this.createNotification({
      id: `notif_${Date.now()}_2`,
      userId: order.buyerId,
      role: 'buyer',
      title: 'Escrow Locked for Order #' + order.id,
      message: `₹${order.totalAmount.toLocaleString('en-IN')} escrow locked for ${order.cropName}. Vehicle ${order.transportVehicle} scheduled for pickup.`,
      type: 'escrow',
      read: false,
      timestamp: 'Just now',
    })

    this.saveData()
    return order
  }

  updateOrder(id: string, updates: Partial<OrderItem>): OrderItem | undefined {
    const index = this.data.orders.findIndex((o) => o.id === id)
    if (index === -1) return undefined
    this.data.orders[index] = { ...this.data.orders[index], ...updates }
    this.saveData()
    return this.data.orders[index]
  }

  releaseEscrowPayout(orderId: string): OrderItem | undefined {
    const order = this.getOrderById(orderId)
    if (!order || !order.escrowLocked) return undefined

    order.status = 'Completed'
    order.statusStep = 5
    order.escrowLocked = false
    order.deliveryETA = 'Delivered & Escrow Settled'

    this.createNotification({
      id: `notif_${Date.now()}_payout`,
      userId: order.farmerId,
      role: 'farmer',
      title: '💰 Escrow Payment Released!',
      message: `₹${order.totalAmount.toLocaleString('en-IN')} successfully transferred to your bank account for Order #${order.id}.`,
      type: 'escrow',
      read: false,
      timestamp: 'Just now',
    })

    this.saveData()
    return order
  }

  // ─── Procurement Demands (RFQs) ─────────────────────────────────────────────
  getDemands(buyerId?: string): ProcurementDemand[] {
    if (buyerId) {
      return this.data.demands.filter((d) => d.buyerId === buyerId)
    }
    return this.data.demands
  }

  getDemandById(id: string): ProcurementDemand | undefined {
    return this.data.demands.find((d) => d.id === id)
  }

  createDemand(demand: ProcurementDemand): ProcurementDemand {
    this.data.demands.unshift(demand)

    this.createNotification({
      id: `notif_${Date.now()}_demand`,
      role: 'farmer',
      title: '📢 New Buyer Demand Broadcasted',
      message: `${demand.buyerCompany} is seeking ${demand.quantityQtlNeeded} Qtl ${demand.cropName} at ${demand.targetPricePerQtl}.`,
      type: 'bid',
      read: false,
      timestamp: 'Just now',
    })

    this.saveData()
    return demand
  }

  incrementDemandResponseCount(demandId: string): boolean {
    const demand = this.getDemandById(demandId)
    if (!demand) return false
    demand.responsesCount += 1
    this.saveData()
    return true
  }

  // ─── Negotiations ──────────────────────────────────────────────────────────
  getNegotiations(targetUserId?: string): NegotiationBid[] {
    if (targetUserId) {
      return this.data.negotiations.filter((n) => n.targetUserId === targetUserId || n.senderId === targetUserId)
    }
    return this.data.negotiations
  }

  createNegotiation(bid: NegotiationBid): NegotiationBid {
    this.data.negotiations.unshift(bid)

    if (bid.demandId) {
      this.incrementDemandResponseCount(bid.demandId)
    }

    this.createNotification({
      id: `notif_${Date.now()}_bid`,
      userId: bid.targetUserId,
      title: '💬 New Counter Offer Received',
      message: `${bid.senderName} proposed ₹${bid.counterPricePerQtl}/Qtl for ${bid.requestedQuantityQtl} Qtl ${bid.cropName}.`,
      type: 'bid',
      read: false,
      timestamp: 'Just now',
    })

    this.saveData()
    return bid
  }

  getNegotiationById(id: string): NegotiationBid | undefined {
    return this.data.negotiations.find((negotiation) => negotiation.id === id)
  }

  updateNegotiation(id: string, updates: Partial<NegotiationBid>): NegotiationBid | undefined {
    const negotiation = this.getNegotiationById(id)
    if (!negotiation) return undefined
    Object.assign(negotiation, updates)
    this.saveData()
    return negotiation
  }

  // ─── Schemes ───────────────────────────────────────────────────────────────
  getSchemes(category?: string): SchemeItem[] {
    if (category && category !== 'All Schemes') {
      return this.data.schemes.filter((s) => s.category === category)
    }
    return this.data.schemes
  }

  // ─── Notifications ─────────────────────────────────────────────────────────
  getNotifications(userId?: string, role?: string): NotificationItem[] {
    return this.data.notifications.filter((n) => {
      if (n.userId && userId && n.userId === userId) return true
      if (n.role === 'all') return true
      if (role && n.role === role) return true
      return false
    })
  }

  createNotification(notif: NotificationItem): NotificationItem {
    this.data.notifications.unshift(notif)
    this.saveData()
    return notif
  }

  markNotificationAsRead(id: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === id)
    if (!notif) return false
    notif.read = true
    this.saveData()
    return true
  }
}

export const db = new DatabaseStore()

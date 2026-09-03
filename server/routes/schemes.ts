import { Router, type Response } from 'express'
import { db } from '../db/store.ts'
import type { AuthenticatedRequest } from '../authMiddleware.ts'

export const schemesRouter = Router()

const OFFICIAL_SOURCES = {
  mahaDbt: 'https://mahadbt.maharashtra.gov.in/Farmer/Login/Login',
  pmKisan: 'https://pmkisan.gov.in/',
  pmfby: 'https://pmfby.gov.in/',
  kcc: 'https://www.myscheme.gov.in/schemes/kcc',
  csc: 'https://findmycsc.nic.in/csc/',
}

const RULES_CHECKED_ON = '30 Aug 2026'

function numberFromText(value: unknown, fallback = 0): number {
  const parsed = Number(String(value ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(parsed) ? parsed : fallback
}

function documentItem(label: string, state: 'Ready' | 'Needs verification' | 'Missing', note: string) {
  return { label, state, note }
}

// Transparent, explainable matching. These are guidance results, not government approvals.
schemesRouter.get('/personalized', (req: AuthenticatedRequest, res: Response) => {
  try {
    const farmer = req.user
    if (!farmer || farmer.role !== 'farmer') return res.status(403).json({ error: 'Farmer account required' })

    const crops = db.getCrops(farmer.id)
    const stocks = db.getStorageStocks(farmer.id)
    const landAcres = numberFromText(farmer.landSize, crops.reduce((sum, crop) => sum + crop.plotSizeAcres, 0))
    const cropNames = [...new Set(crops.map((crop) => crop.name))]
    const horticultureCrops = cropNames.filter((crop) => ['Tomato', 'Onion', 'Potato', 'Grapes', 'Green Chilli', 'Brinjal'].includes(crop))
    const usesMicroIrrigation = crops.some((crop) => /drip|sprinkler/i.test(crop.irrigation))
    const hasWdraStock = stocks.some((stock) => /wdra/i.test(stock.storageFacility))
    const commonDocuments = [
      documentItem('Farmer ID (AgriStack)', farmer.farmerId ? 'Ready' : 'Missing', farmer.farmerId ? `${farmer.farmerId} is saved in your profile` : 'Create it through an authorised CSC'),
      documentItem('7/12 and 8-A land records', 'Needs verification', 'माझे Kisan does not store or verify land records'),
      documentItem('Aadhaar and mobile linkage', 'Needs verification', 'Check securely on the official portal'),
      documentItem('Bank account for DBT', 'Needs verification', 'Confirm Aadhaar/NPCI mapping with your bank'),
    ]

    const schemes = [
      {
        id: 'pmksy_micro', icon: '💧', title: 'PMKSY Micro-Irrigation', category: 'Subsidies',
        matchStatus: usesMicroIrrigation ? 'More information needed' : 'Likely match', benefitType: 'Subsidy',
        benefitHeadline: 'Up to 55% of approved micro-irrigation cost', cashValue: null,
        whyMatched: `${landAcres.toFixed(1)} acres in Maharashtra with ${horticultureCrops.join(', ') || 'active crops'}. ${usesMicroIrrigation ? 'Your profile already shows drip irrigation, so previous subsidy and installation age must be checked.' : 'Micro-irrigation can reduce water use for your active crops.'}`,
        officialCheck: 'MahaDBT decides the approved unit cost and final subsidy after checking land, equipment and prior benefits.',
        documents: [...commonDocuments, documentItem('Electricity bill and supplier design', 'Missing', 'Required when applying for a new eligible system')],
        officialUrl: OFFICIAL_SOURCES.mahaDbt, sourceLabel: 'MahaDBT Maharashtra', rulesCheckedOn: RULES_CHECKED_ON,
      },
      {
        id: 'pmfby', icon: '🛡️', title: 'PM Fasal Bima Yojana', category: 'Insurance',
        matchStatus: horticultureCrops.length ? 'Needs official crop check' : 'More information needed', benefitType: 'Insurance protection',
        benefitHeadline: 'Farmer premium can be up to 5% for notified horticultural crops', cashValue: null,
        whyMatched: `${horticultureCrops.join(', ') || 'Your crops'} may qualify only when the crop and area are notified for the current season. माझे Kisan will not guess the premium or deadline.`,
        officialCheck: 'Check the current Maharashtra notification for crop, village, sum insured, insurer and enrolment deadline.',
        documents: [...commonDocuments, documentItem('Current-season sowing declaration', 'Missing', 'Required crop and survey details vary by notification')],
        officialUrl: OFFICIAL_SOURCES.pmfby, sourceLabel: 'Official PMFBY portal', rulesCheckedOn: RULES_CHECKED_ON,
      },
      {
        id: 'pm_kisan', icon: '🌾', title: 'PM-KISAN Samman Nidhi', category: 'Direct Support',
        matchStatus: 'Check official status', benefitType: 'Direct income support', benefitHeadline: '₹6,000 per year, subject to official eligibility', cashValue: 6000,
        whyMatched: 'Your profile contains a landholding and Farmer ID, but PM-KISAN exclusions and e-KYC status cannot be verified inside माझे Kisan.',
        officialCheck: 'Use Know Your Status on PM-KISAN to confirm beneficiary, e-KYC and bank status.',
        documents: commonDocuments, officialUrl: OFFICIAL_SOURCES.pmKisan, sourceLabel: 'Official PM-KISAN portal', rulesCheckedOn: RULES_CHECKED_ON,
      },
      {
        id: 'kcc', icon: '💳', title: 'Kisan Credit Card safety check', category: 'Responsible Credit',
        matchStatus: 'Planning estimate available', benefitType: 'Affordable working credit',
        benefitHeadline: '7% standard; effective rate may be 4% after eligible prompt repayment', cashValue: null,
        whyMatched: 'माझे Kisan can compare a proposed withdrawal with your crop income under normal and lower-price scenarios. The bank sets the sanctioned limit and repayment schedule.',
        officialCheck: 'This is not a loan offer. Confirm interest, due date, security and prompt-repayment conditions with the issuing bank.',
        documents: [...commonDocuments, documentItem('Crop plan and bank application', 'Missing', 'The bank may request crop-wise scale-of-finance information')],
        officialUrl: OFFICIAL_SOURCES.kcc, sourceLabel: 'Government myScheme portal', rulesCheckedOn: RULES_CHECKED_ON,
      },
      ...(hasWdraStock ? [{
        id: 'enwr', icon: '🏭', title: 'Warehouse-receipt finance (e-NWR)', category: 'Responsible Credit',
        matchStatus: 'Ask warehouse and bank', benefitType: 'Post-harvest liquidity',
        benefitHeadline: 'Use eligible stored produce as security instead of distress-selling', cashValue: null,
        whyMatched: 'You have produce recorded in a WDRA-labelled storage facility. A valid electronic warehouse receipt and participating lender are still required.',
        officialCheck: 'Confirm that the warehouse, commodity, receipt and lender are eligible before relying on finance.',
        documents: [...commonDocuments, documentItem('Valid electronic warehouse receipt', 'Missing', 'Obtain only from an eligible repository/warehouse')],
        officialUrl: 'https://wdra.gov.in/', sourceLabel: 'WDRA official portal', rulesCheckedOn: RULES_CHECKED_ON,
      }] : []),
      {
        id: 'soil_health', icon: '🧪', title: 'Soil Health Card', category: 'Farm Services',
        matchStatus: 'Likely match', benefitType: 'Farm service', benefitHeadline: 'Soil testing and nutrient recommendations', cashValue: null,
        whyMatched: `Useful before the next ${cropNames[0] || 'crop'} cycle to avoid unnecessary fertiliser spending.`,
        officialCheck: 'Availability and sampling schedule are confirmed by the local agriculture office.',
        documents: [documentItem('Farmer ID', farmer.farmerId ? 'Ready' : 'Missing', farmer.farmerId || 'Create through CSC'), documentItem('Field survey details', 'Missing', 'Bring the relevant land/plot information')],
        officialUrl: 'https://soilhealth.dac.gov.in/', sourceLabel: 'Soil Health Card portal', rulesCheckedOn: RULES_CHECKED_ON,
      },
    ]

    return res.json({
      profile: { farmerName: farmer.name, location: farmer.location, landAcres, crops: cropNames, irrigation: [...new Set(crops.map((crop) => crop.irrigation))] },
      summary: { matchedCount: schemes.length, possibleDirectSupport: 6000, subsidyEstimate: null, insuranceEstimate: null, creditEstimate: null },
      deadlineStatus: { verifiedDeadlines: [], message: 'No current deadline is shown until it is verified from an official seasonal notice.' },
      schemes,
      serviceCentre: { title: 'Nearest CSC / Aaple Sarkar Seva Kendra', detail: 'Use the official locator or ask your Gram Panchayat. माझे Kisan does not guess distance.', officialUrl: OFFICIAL_SOURCES.csc },
      disclaimer: 'माझे Kisan provides guidance, not government approval. Final eligibility and benefit amounts come from the official department or bank.',
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to prepare personalised scheme guidance' })
  }
})

// Retains the basic catalogue for other screens.
schemesRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const category = req.query.category as string
    return res.json({ schemes: db.getSchemes(category) })
  } catch {
    return res.status(500).json({ error: 'Failed to retrieve schemes' })
  }
})

// Responsible-credit stress test. It does not estimate official eligibility or sanction.
schemesRouter.post('/calculate-loan', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { landAcres, cropType = 'Tomato', requestedAmount, expectedYieldQtl, cultivationExpense } = req.body
    const acres = Math.max(0.1, numberFromText(landAcres, 2))
    const crop = String(cropType)
    const amount = Math.max(1000, numberFromText(requestedAmount, 50000))
    const yieldQtl = Math.max(1, numberFromText(expectedYieldQtl, 60))
    const expense = Math.max(0, numberFromText(cultivationExpense, 28000))
    const market = db.getMarketPrices().find((item) => item.crop.toLowerCase() === crop.toLowerCase())
    const currentPrice = market?.modalPrice || 2500
    const scaleOfFinancePlanningRate = crop === 'Grapes' ? 120000 : crop === 'Tomato' ? 60000 : 50000
    const planningLimit = Math.min(300000, Math.round(acres * scaleOfFinancePlanningRate))

    let forecastPrice = currentPrice
    let forecastLow = Math.round(currentPrice * 0.8)
    let modelUsed = false
    try {
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(2500),
        body: JSON.stringify({ commodity: crop, mandi: 'Niphad', current_price: currentPrice, price_7d_ago: Math.round(currentPrice / 1.03), price_30d_ago: Math.round(currentPrice / 1.06), arrivals_tonnes: 45.5, forecast_days: 7 }),
      })
      if (response.ok) {
        const forecast = await response.json() as { predicted_price_7d?: number; range_low?: number }
        forecastPrice = numberFromText(forecast.predicted_price_7d, currentPrice)
        forecastLow = numberFromText(forecast.range_low, forecastLow)
        modelUsed = true
      }
    } catch {
      // Conservative scenarios remain available when the optional ML service is offline.
    }

    const effectiveRate = 0.04
    const standardRate = 0.07
    const promptRepaymentDue = Math.round(amount * (1 + effectiveRate))
    const standardDue = Math.round(amount * (1 + standardRate))
    const normalNet = Math.max(0, Math.round(yieldQtl * forecastPrice - expense))
    const lowerPrice = Math.min(forecastLow, Math.round(currentPrice * 0.8))
    const downsideNet = Math.max(0, Math.round(yieldQtl * lowerPrice - expense))
    const repaymentShare = downsideNet > 0 ? promptRepaymentDue / downsideNet : Infinity
    const safeAmount = Math.max(0, Math.min(planningLimit, Math.floor((downsideNet * 0.35) / (1 + effectiveRate) / 1000) * 1000))
    const risk = repaymentShare <= 0.35 ? 'Comfortable' : repaymentShare <= 0.55 ? 'Caution' : 'High risk'

    return res.json({
      crop, requestedAmount: amount, planningLimit, currentPrice, forecastPrice: Math.round(forecastPrice), lowerPrice,
      modelUsed, promptRepaymentDue, standardDue, normalNet, downsideNet, safeAmount, risk,
      coverageNormal: Number((normalNet / Math.max(1, promptRepaymentDue)).toFixed(1)),
      coverageDownside: Number((downsideNet / Math.max(1, promptRepaymentDue)).toFixed(1)),
      explanation: risk === 'Comfortable'
        ? `Even in the lower-price scenario, repayment uses ${Math.round(repaymentShare * 100)}% of estimated crop income after cultivation cost.`
        : `In the lower-price scenario, repayment could use ${Number.isFinite(repaymentShare) ? Math.round(repaymentShare * 100) : 100}% of estimated crop income after cultivation cost. Consider a smaller amount.`,
      disclaimer: 'Planning guidance only. The bank decides sanction, interest, due dates and prompt-repayment eligibility.',
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to calculate responsible-credit guidance' })
  }
})

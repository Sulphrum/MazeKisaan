import { Router, type Response } from 'express'
import { db } from '../db/store.ts'
import type { MarketplaceListing } from '../db/types.ts'
import type { AuthenticatedRequest } from '../authMiddleware.ts'

export const marketplaceRouter = Router()

marketplaceRouter.get('/listings', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { crop, qualityGrade, maxDistanceKm, search } = req.query
    const listings = db.getMarketplaceListings({ crop: crop as string, qualityGrade: qualityGrade as string, maxDistanceKm: maxDistanceKm ? Number(maxDistanceKm) : undefined, search: search as string })
    return res.json({ total: listings.length, listings })
  } catch { return res.status(500).json({ error: 'Failed to retrieve marketplace listings' }) }
})

marketplaceRouter.get('/listings/:id', (req: AuthenticatedRequest, res: Response) => {
  const listing = db.getMarketplaceListingById(String(req.params.id))
  if (!listing) return res.status(404).json({ error: 'Listing not found' })
  return res.json({ listing })
})

marketplaceRouter.post('/listings', (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'farmer') return res.status(403).json({ error: 'Only farmers can publish listings' })
    const { crop, variety, quantityQtl, minOrderQtl, askingPricePerQtl, qualityGrade, image, harvestReadyDate } = req.body
    const qty = Number(quantityQtl), price = Number(askingPricePerQtl), minOrder = Number(minOrderQtl || 5)
    if (!crop || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price <= 0) return res.status(400).json({ error: 'Crop, positive quantity, and positive asking price are required' })
    if (minOrder <= 0 || minOrder > qty) return res.status(400).json({ error: 'Minimum order must be positive and no greater than available quantity' })

    const farmer = req.user
    const existingCrop = db.getCrops(farmer.id).find(c => c.name.toLowerCase() === String(crop).toLowerCase())
    const assay = existingCrop?.qualityAssay
    const listing: MarketplaceListing = {
      id: `list_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      farmerId: farmer.id,
      farmerName: farmer.name,
      farmerPhone: farmer.phone,
      location: farmer.location,
      distanceKm: 0,
      crop: String(crop), variety: variety || existingCrop?.variety || 'Standard Commercial Variety',
      quantityQtl: qty, minOrderQtl: minOrder, askingPricePerQtl: price,
      mandiBenchmarkPrice: Math.round(price * 0.94),
      qualityGrade: assay?.grade || qualityGrade || 'Grade B',
      aiQualityScore: assay?.confidence || 75,
      moisturePct: assay?.moisturePct || 0,
      defectsPct: assay?.defectsPct || 0,
      harvestReadyDate: harvestReadyDate || existingCrop?.harvest || 'To be confirmed',
      image: image || existingCrop?.img || '',
      verifiedFarmer: Boolean(farmer.verifiedBadge),
      farmerRating: 4.5,
      escrowProtected: true,
      status: 'Active',
      createdAt: new Date().toISOString(),
    }
    db.createMarketplaceListing(listing)
    return res.status(201).json({ message: 'Listing published successfully', listing })
  } catch { return res.status(500).json({ error: 'Failed to create marketplace listing' }) }
})

marketplaceRouter.get('/recommendations', (req: AuthenticatedRequest, res: Response) => {
  try {
    const crop = String(req.query.crop || 'Tomato')
    const buyers = db.getBuyers().filter(Boolean)
    const transport = db.getTransportOptions()
    const storage = db.getStorageOptions()
    const listings = db.getMarketplaceListings({ crop })
    const benchmark = db.getMarketPrices().find(p => p.crop.toLowerCase() === crop.toLowerCase())?.modalPrice || 0
    const scoredBuyers = buyers.map(b => ({ ...b, matchScore: Math.round((b.rating * 15) + (b.verified ? 20 : 0) + (b.transport ? 10 : 0) + Math.min(35, Math.max(0, (b.priceNumeric - benchmark) / Math.max(1, benchmark) * 100))) })).sort((a,b) => b.matchScore-a.matchScore)
    const bestBuyer = scoredBuyers[0]
    const bestTransport = transport[0]
    const bestStorage = storage[0]
    const sample = listings[0]
    const price = sample?.askingPricePerQtl || bestBuyer?.priceNumeric || benchmark || 0
    const qty = sample?.quantityQtl || 60
    const gross = qty * price
    const logistics = bestTransport?.costNumeric || 0
    const cultivation = db.getCrops(req.user?.id).find(c => c.name.toLowerCase() === crop.toLowerCase())?.expenses
    const cultivationCost = cultivation ? Object.values(cultivation).reduce((a,b)=>a+b,0) : 0
    const net = gross - logistics - cultivationCost
    return res.json({ crop, recommendedBuyer: bestBuyer, recommendedTransport: bestTransport, recommendedStorage: bestStorage, buyers: scoredBuyers, transportOptions: transport, storageOptions: storage, aiConfidenceScore: bestBuyer ? Math.min(98, Math.max(70, bestBuyer.matchScore)) : 70, reasoning: [`Buyer ranked using price, verification, rating and transport availability`, `Estimated logistics cost ₹${logistics.toLocaleString('en-IN')}`, benchmark ? `Mandi benchmark is ₹${benchmark.toLocaleString('en-IN')}/Qtl` : 'No benchmark price available'], financialBreakdown: { grossRealization: gross, transportCost: logistics, cultivationCost, totalCosts: logistics + cultivationCost, netRealization: net } })
  } catch { return res.status(500).json({ error: 'Failed to generate recommendations' }) }
})

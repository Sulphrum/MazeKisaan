import { Router, type Request, type Response } from 'express'
import { db } from '../db/store.ts'

export const publicMarketRouter = Router()

// Public supply data is deliberately aggregated. Farmer names, phone numbers,
// listing IDs and negotiation details remain behind authenticated routes.
publicMarketRouter.get('/supply', (_req: Request, res: Response) => {
  const active = db.getMarketplaceListings().filter((listing) => listing.status === 'Active')
  const grouped = new Map<string, {
    crop: string
    totalQuantityQtl: number
    weightedPrice: number
    gradeAQuantity: number
    locations: Set<string>
    readyDates: string[]
    listingCount: number
  }>()

  for (const listing of active) {
    const current = grouped.get(listing.crop) || {
      crop: listing.crop,
      totalQuantityQtl: 0,
      weightedPrice: 0,
      gradeAQuantity: 0,
      locations: new Set<string>(),
      readyDates: [],
      listingCount: 0,
    }
    current.totalQuantityQtl += listing.quantityQtl
    current.weightedPrice += listing.askingPricePerQtl * listing.quantityQtl
    if (listing.qualityGrade === 'Grade A') current.gradeAQuantity += listing.quantityQtl
    current.locations.add(listing.location)
    current.readyDates.push(listing.harvestReadyDate)
    current.listingCount += 1
    grouped.set(listing.crop, current)
  }

  const supply = Array.from(grouped.values()).map((item) => ({
    crop: item.crop,
    availableQuantityQtl: item.totalQuantityQtl,
    averageAskingPricePerQtl: Math.round(item.weightedPrice / Math.max(1, item.totalQuantityQtl)),
    gradeASharePct: Math.round((item.gradeAQuantity / Math.max(1, item.totalQuantityQtl)) * 100),
    originClusters: Array.from(item.locations).slice(0, 3),
    nextReadyDate: item.readyDates.sort()[0] || 'Confirm after login',
    activeLots: item.listingCount,
  }))

  return res.json({
    updatedAt: new Date().toISOString(),
    privacy: 'Aggregated public view. Farmer identity and contact details require buyer authentication.',
    supply,
  })
})

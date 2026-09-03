import { Router, type Request, type Response } from 'express'
import { db } from '../db/store.ts'
import type { ProcurementDemand, NegotiationBid } from '../db/types.ts'
import type { AuthenticatedRequest } from '../authMiddleware.ts'

export const demandsRouter = Router()

// ─── GET /api/demands ─────────────────────────────────────────────────────────
demandsRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const buyerId = req.user?.role === 'buyer' ? req.user.id : undefined
    const demands = db.getDemands(buyerId)
    return res.json({ demands })
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve demands' })
  }
})

// ─── POST /api/demands ────────────────────────────────────────────────────────
demandsRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'buyer') return res.status(403).json({ error: 'Only buyer accounts can publish procurement demand' })
    const {
      buyerId,
      buyerName,
      buyerCompany,
      cropName,
      variety,
      quantityQtlNeeded,
      targetPricePerQtl,
      requiredByDate,
      deliveryLocation,
      buyerType,
      gradeRequired,
      transportProvidedByBuyer,
      pickupDistanceKm,
    } = req.body

    if (!cropName || !quantityQtlNeeded || !targetPricePerQtl) {
      return res.status(400).json({ error: 'Crop, quantity, and target budget are required' })
    }

    const targetNumeric = parseInt(String(targetPricePerQtl).replace(/[^0-9]/g, '')) || 2500

    const newDemand: ProcurementDemand = {
      id: `dem_${Date.now()}`,
      buyerId: req.user?.id || buyerId,
      buyerName: req.user?.name || buyerName || 'Buyer',
      buyerCompany: req.user?.companyName || buyerCompany || req.user?.name || 'Buyer',
      cropName,
      variety: variety || 'Standard Commercial Variety',
      quantityQtlNeeded: parseInt(quantityQtlNeeded),
      targetPricePerQtl: `₹${targetNumeric.toLocaleString('en-IN')} / Qtl`,
      targetPriceNumeric: targetNumeric,
      requiredByDate: requiredByDate || 'Within 10 Days',
      deliveryLocation: deliveryLocation || 'Pune Agro Terminal Hub',
      buyerType: req.user?.buyerType || buyerType || 'Exporter',
      gradeRequired: gradeRequired || 'Grade A Only',
      responsesCount: 0,
      status: 'Active',
      transportProvidedByBuyer: Boolean(transportProvidedByBuyer),
      pickupDistanceKm: Number(pickupDistanceKm || 0),
      createdAt: new Date().toISOString(),
    }

    db.createDemand(newDemand)
    return res.status(201).json({ message: 'Procurement demand broadcasted successfully', demand: newDemand })
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to broadcast demand' })
  }
})

// ─── GET /api/demands/negotiations ────────────────────────────────────────────
demandsRouter.get('/negotiations', (req: AuthenticatedRequest, res: Response) => {
  try {
    const negotiations = db.getNegotiations(req.user?.id)
    return res.json({ negotiations })
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve negotiations' })
  }
})

// ─── POST /api/demands/negotiations ───────────────────────────────────────────
demandsRouter.post('/negotiations', (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      demandId,
      listingId,
      senderId,
      senderRole,
      senderName,
      targetUserId,
      cropName,
      requestedQuantityQtl,
      counterPricePerQtl,
      deliveryTerms,
      note,
      cropImages,
      cropGrade,
      cropVariety,
      cropLocation,
      harvestStatus,
    } = req.body

    if (!counterPricePerQtl || !requestedQuantityQtl || !targetUserId) {
      return res.status(400).json({ error: 'Counter price and requested quantity are required' })
    }

    const newBid: NegotiationBid = {
      id: `bid_${Date.now()}`,
      demandId,
      listingId,
      senderId: req.user?.id || senderId,
      senderRole: req.user?.role === 'farmer' ? 'farmer' : 'buyer',
      senderName: req.user?.companyName || req.user?.name || senderName || 'User',
      targetUserId: targetUserId || 'target_' + Date.now(),
      cropName: cropName || 'Produce',
      requestedQuantityQtl: parseInt(requestedQuantityQtl),
      counterPricePerQtl: parseInt(counterPricePerQtl),
      deliveryTerms: deliveryTerms || 'Delivery within 2 days',
      note,
      cropImages: Array.isArray(cropImages) ? cropImages.slice(0, 4) : [],
      cropGrade,
      cropVariety,
      cropLocation,
      harvestStatus,
      farmerPhone: req.user?.role === 'farmer' ? req.user.phone : undefined,
      farmerAccountLocation: req.user?.role === 'farmer' ? req.user.location : undefined,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    }

    db.createNegotiation(newBid)
    return res.status(201).json({ message: 'Counter offer submitted successfully', bid: newBid })
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to submit counter offer' })
  }
})

// ─── PATCH /api/demands/negotiations/:id ─────────────────────────────────────
demandsRouter.patch('/negotiations/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'buyer') return res.status(403).json({ error: 'Only buyer accounts can review farmer responses' })
    const bid = db.getNegotiationById(String(req.params.id))
    if (!bid) return res.status(404).json({ error: 'Farmer response not found' })
    if (bid.targetUserId !== req.user.id || bid.senderRole !== 'farmer') {
      return res.status(403).json({ error: 'You can review only responses sent to your buyer account' })
    }

    const status = req.body.status
    if (status !== 'Accepted' && status !== 'Rejected') {
      return res.status(400).json({ error: 'Decision must be Accepted or Rejected' })
    }

    const decisionNote = String(req.body.decisionNote || '').trim().slice(0, 500)
    const updated = db.updateNegotiation(bid.id, {
      status,
      decisionNote: decisionNote || undefined,
      updatedAt: new Date().toISOString(),
    })
    if (!updated) return res.status(404).json({ error: 'Farmer response not found' })

    db.createNotification({
      id: `notif_${Date.now()}_buyer_decision`,
      userId: bid.senderId,
      title: status === 'Accepted' ? 'Buyer approved your sale request' : 'Buyer did not approve this request',
      message: status === 'Accepted'
        ? `${req.user.companyName || req.user.name} approved ${bid.requestedQuantityQtl} Qtl ${bid.cropName} at ₹${bid.counterPricePerQtl.toLocaleString('en-IN')}/Qtl. Confirm pickup and payment protection before dispatch.`
        : `${req.user.companyName || req.user.name} declined the ${bid.cropName} request.${decisionNote ? ` Reason: ${decisionNote}` : ''}`,
      type: 'bid',
      read: false,
      timestamp: 'Just now',
    })

    return res.json({ message: `Farmer response ${status.toLowerCase()}`, bid: updated })
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to save buyer decision' })
  }
})

import { Router, type Request, type Response } from 'express'
import { db } from '../db/store.ts'
import type { ProcurementDemand, NegotiationBid, NegotiationMessage } from '../db/types.ts'
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
      targetName,
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
      targetName: targetName ? String(targetName).trim().slice(0, 120) : undefined,
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
      messages: note ? [{
        id: `msg_${Date.now()}_opening`,
        senderId: req.user?.id || senderId,
        senderRole: req.user?.role === 'farmer' ? 'farmer' : 'buyer',
        senderName: req.user?.companyName || req.user?.name || senderName || 'User',
        message: String(note).trim().slice(0, 1000),
        createdAt: new Date().toISOString(),
      }] : [],
    }

    db.createNegotiation(newBid)
    return res.status(201).json({ message: 'Counter offer submitted successfully', bid: newBid })
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to submit counter offer' })
  }
})

// ─── POST /api/demands/negotiations/:id/messages ─────────────────────────────
demandsRouter.post('/negotiations/:id/messages', (req: AuthenticatedRequest, res: Response) => {
  try {
    const bid = db.getNegotiationById(String(req.params.id))
    if (!bid) return res.status(404).json({ error: 'Conversation not found' })
    if (!req.user || (bid.senderId !== req.user.id && bid.targetUserId !== req.user.id)) {
      return res.status(403).json({ error: 'You can only message people in your own sale conversation' })
    }

    const message = String(req.body.message || '').trim().slice(0, 1000)
    if (!message) return res.status(400).json({ error: 'Write a message before sending' })

    const existingMessages: NegotiationMessage[] = bid.messages?.length
      ? bid.messages
      : bid.note
        ? [{
            id: `${bid.id}_opening`,
            senderId: bid.senderId,
            senderRole: bid.senderRole,
            senderName: bid.senderName,
            message: bid.note,
            createdAt: bid.createdAt,
          }]
        : []
    const nextMessage: NegotiationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      senderId: req.user.id,
      senderRole: req.user.role === 'farmer' ? 'farmer' : 'buyer',
      senderName: req.user.companyName || req.user.name,
      message,
      createdAt: new Date().toISOString(),
    }
    const updated = db.updateNegotiation(bid.id, {
      messages: [...existingMessages, nextMessage],
      updatedAt: nextMessage.createdAt,
    })
    if (!updated) return res.status(404).json({ error: 'Conversation not found' })

    const recipientId = req.user.id === bid.senderId ? bid.targetUserId : bid.senderId
    db.createNotification({
      id: `notif_${Date.now()}_message`,
      userId: recipientId,
      title: `New message about ${bid.cropName}`,
      message: `${nextMessage.senderName}: ${message.slice(0, 120)}`,
      type: 'bid',
      read: false,
      timestamp: 'Just now',
    })
    return res.status(201).json({ message: 'Message sent', bid: updated })
  } catch (err: any) {
    return res.status(500).json({ error: 'Message could not be sent' })
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

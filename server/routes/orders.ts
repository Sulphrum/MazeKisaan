import { Router, type Response } from 'express'
import { db } from '../db/store.ts'
import type { OrderItem } from '../db/types.ts'
import type { AuthenticatedRequest } from '../authMiddleware.ts'

export const ordersRouter = Router()
const statuses: OrderItem['status'][] = ['Escrow Funded','Pickup Scheduled','In Transit','Quality Verified','Completed','Cancelled']

ordersRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const orders = req.user?.role === 'admin' ? db.getOrders() : db.getOrders(req.user?.id, req.user?.role as 'farmer'|'buyer')
  return res.json({ total: orders.length, orders })
})

ordersRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const order = db.getOrderById(String(req.params.id))
  if (!order) return res.status(404).json({ error: 'Order not found' })
  if (req.user?.role !== 'admin' && order.farmerId !== req.user?.id && order.buyerId !== req.user?.id) return res.status(403).json({ error: 'You cannot access this order' })
  return res.json({ order })
})

ordersRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'buyer') return res.status(403).json({ error: 'Only buyers can create procurement orders' })
    const { listingId, quantityQtl, pricePerQtl, transportVehicle, transportCost = 0, qualityGrade } = req.body
    const listing = listingId ? db.getMarketplaceListingById(String(listingId)) : undefined
    if (!listing) return res.status(404).json({ error: 'Marketplace listing not found' })
    if (listing.status === 'Sold' || listing.quantityQtl <= 0) return res.status(409).json({ error: 'This listing is no longer available' })
    const qty = Number(quantityQtl), price = Number(pricePerQtl || listing.askingPricePerQtl), logistics = Number(transportCost) || 0
    if (!Number.isFinite(qty) || qty <= 0 || qty < listing.minOrderQtl || qty > listing.quantityQtl) return res.status(400).json({ error: `Quantity must be between ${listing.minOrderQtl} and ${listing.quantityQtl} Qtl` })
    if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ error: 'Invalid price' })
    const buyer = req.user
    const farmer = db.getUserById(listing.farmerId)
    if (!farmer) return res.status(409).json({ error: 'Farmer account for this listing no longer exists' })
    const produce = qty * price, fee = Math.round(produce * 0.01), total = produce + logistics + fee
    if (buyer.walletBalance !== undefined && buyer.walletBalance < total) return res.status(402).json({ error: 'Insufficient demo wallet balance to fund escrow' })

    const newOrder: OrderItem = {
      id: `KS-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`,
      listingId: listing.id, cropName: listing.crop, variety: listing.variety, quantityQtl: qty, totalAmount: total, pricePerQtl: price,
      farmerId: farmer.id, farmerName: farmer.name, farmerLocation: farmer.location, farmerPhone: farmer.phone,
      buyerId: buyer.id, buyerName: buyer.name, buyerCompany: buyer.companyName || buyer.name, buyerLocation: buyer.location,
      transportVehicle: transportVehicle || 'Pickup to be assigned', transportCost: logistics, status: 'Escrow Funded', statusStep: 1,
      date: new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}), qualityGrade: qualityGrade || listing.qualityGrade,
      escrowLocked: true, deliveryETA: 'Pickup to be scheduled', invoiceNumber: `INV-${Date.now()}`, ewayBillNumber: `EWB-${Date.now()}`, createdAt: new Date().toISOString()
    }
    db.updateMarketplaceListing(listing.id, { quantityQtl: listing.quantityQtl - qty, status: listing.quantityQtl - qty <= 0 ? 'Sold' : 'Active' })
    db.createOrder(newOrder)
    return res.status(201).json({ message: 'Procurement order placed and escrow locked successfully', order: newOrder })
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Failed to create order' }) }
})

ordersRouter.patch('/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const order = db.getOrderById(String(req.params.id))
  if (!order) return res.status(404).json({ error: 'Order not found' })
  if (req.user?.role !== 'admin' && order.farmerId !== req.user?.id && order.buyerId !== req.user?.id) return res.status(403).json({ error: 'You cannot update this order' })
  const status = req.body.status as OrderItem['status']
  const nextStep = Number(req.body.statusStep)
  if (!statuses.includes(status) || !Number.isInteger(nextStep) || nextStep < 1 || nextStep > 5) return res.status(400).json({ error: 'Invalid order status' })
  if (status === 'Completed' && order.escrowLocked) return res.status(409).json({ error: 'Release escrow before completing the order' })
  if (status !== 'Cancelled' && order.status !== 'Cancelled' && nextStep < order.statusStep) return res.status(409).json({ error: 'Order status cannot move backwards' })
  const updated = db.updateOrder(order.id, { status, statusStep: nextStep })
  if (!updated) return res.status(404).json({ error: 'Order not found' })
  db.createNotification({ id:`notif_${Date.now()}_status`, userId: updated.farmerId === req.user?.id ? updated.buyerId : updated.farmerId, title:'Order Status Updated', message:`Order #${updated.id} is now ${updated.status}.`, type:'order', read:false, timestamp:'Just now' })
  return res.json({ message: 'Order status updated', order: updated })
})

ordersRouter.post('/:id/release-escrow', (req: AuthenticatedRequest, res: Response) => {
  const order = db.getOrderById(String(req.params.id))
  if (!order) return res.status(404).json({ error: 'Order not found' })
  if (req.user?.role !== 'buyer' || order.buyerId !== req.user.id) return res.status(403).json({ error: 'Only the buyer who funded escrow can release it' })
  if (!order.escrowLocked) return res.status(409).json({ error: 'Escrow has already been released' })
  if (order.status !== 'Quality Verified' && order.status !== 'Completed') return res.status(409).json({ error: 'Quality must be verified before escrow release' })
  const updated = db.releaseEscrowPayout(order.id)
  if (!updated) return res.status(409).json({ error: 'Escrow has already been released' })
  return res.json({ message: 'Quality verified and escrow payment released', order: updated })
})

ordersRouter.get('/:id/invoice', (req: AuthenticatedRequest, res: Response) => {
  const order = db.getOrderById(String(req.params.id))
  if (!order) return res.status(404).json({ error: 'Order not found' })
  if (req.user?.role !== 'admin' && order.farmerId !== req.user?.id && order.buyerId !== req.user?.id) return res.status(403).json({ error: 'You cannot access this invoice' })
  return res.json({ invoiceNumber: order.invoiceNumber || `INV-${order.id}`, ewayBillNumber: order.ewayBillNumber, orderId: order.id, date: order.date, consignor: { name: order.farmerName, location: order.farmerLocation, phone: order.farmerPhone }, consignee: { company: order.buyerCompany, contactPerson: order.buyerName, location: order.buyerLocation }, item: { crop: order.cropName, variety: order.variety, quantityQtl: order.quantityQtl, ratePerQtl: order.pricePerQtl, amount: order.quantityQtl * order.pricePerQtl, qualityGrade: order.qualityGrade }, logistics: { vehicleNumber: order.transportVehicle, deliveryETA: order.deliveryETA, status: order.status }, financials: { subtotal: order.totalAmount, taxAmount: 0, grandTotal: order.totalAmount, escrowSettlementStatus: order.escrowLocked ? 'Locked in Demo Escrow Ledger' : 'Settled' } })
})

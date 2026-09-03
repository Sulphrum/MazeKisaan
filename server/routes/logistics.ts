import { Router, type Request, type Response } from 'express'
import { db } from '../db/store.ts'
import type { StorageStockItem } from '../db/types.ts'
import type { AuthenticatedRequest } from '../authMiddleware.ts'

export const logisticsRouter = Router()

// ─── GET /api/logistics/transport ─────────────────────────────────────────────
logisticsRouter.get('/transport', (req: Request, res: Response) => {
  try {
    const transportOptions = db.getTransportOptions()
    return res.json({ transportOptions })
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve transport options' })
  }
})

// ─── GET /api/logistics/storage ───────────────────────────────────────────────
logisticsRouter.get('/storage', (req: Request, res: Response) => {
  try {
    const storageOptions = db.getStorageOptions()
    return res.json({ storageOptions })
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve storage options' })
  }
})

// ─── GET /api/logistics/stocks ────────────────────────────────────────────────
logisticsRouter.get('/stocks', (req: AuthenticatedRequest, res: Response) => {
  try {
    const farmerId = req.user?.role === 'farmer' ? req.user.id : (req.query.farmerId as string)
    const storageStocks = db.getStorageStocks(farmerId)
    return res.json({ storageStocks })
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve storage stocks' })
  }
})

// ─── POST /api/logistics/stocks ───────────────────────────────────────────────
logisticsRouter.post('/stocks', (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      farmerId, cropId, crop, variety, quantityQtl, qualityGrade, aiQualityScore,
      harvestDate, storageFacility, storageCostPerDay, initialShelfLifeDays,
      shelfLifeLeftDays, spoilageRiskPct, cultivationExpense, costOfProductionPerKg,
      fairFarmgateValuationPerQtl, emoji, img,
    } = req.body

    const quantity = Number(quantityQtl)
    const shelfLife = Number(initialShelfLifeDays || shelfLifeLeftDays)
    if (!crop || !Number.isFinite(quantity) || quantity <= 0 || !storageFacility || !Number.isFinite(shelfLife) || shelfLife <= 0) {
      return res.status(400).json({ error: 'Crop, positive quantity, storage facility, and shelf life are required' })
    }

    const grade = ['Grade A', 'Grade B', 'Grade C'].includes(qualityGrade) ? qualityGrade : 'Grade B'
    const storedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const sourceCrop = cropId ? db.getCropById(String(cropId)) : undefined
    if (cropId && !sourceCrop) return res.status(404).json({ error: 'Field crop not found' })
    if (sourceCrop && req.user?.role === 'farmer' && sourceCrop.farmerId !== req.user.id) {
      return res.status(403).json({ error: 'You do not own this field crop' })
    }
    if (sourceCrop && quantity > sourceCrop.yieldQtl) {
      return res.status(400).json({ error: `Only ${sourceCrop.yieldQtl} Qtl remains in this field crop` })
    }
    const sourceExpense = sourceCrop ? Number(String(sourceCrop.spent).replace(/[^0-9]/g, '')) : Number(cultivationExpense || 0)
    const harvestedShare = sourceCrop && sourceCrop.yieldQtl > 0 ? quantity / sourceCrop.yieldQtl : 1
    const harvestedExpense = Math.round(sourceExpense * harvestedShare)

    const newStock: StorageStockItem = {
      id: `stk_${Date.now()}`,
      farmerId: req.user?.id || farmerId,
      cropId,
      crop,
      variety: variety || 'Standard',
      quantityQtl: quantity,
      qualityGrade: grade as StorageStockItem['qualityGrade'],
      aiQualityScore: Number(aiQualityScore || (grade === 'Grade A' ? 97.8 : grade === 'Grade B' ? 88 : 72)),
      harvestDate: harvestDate || storedDate,
      storedOn: storedDate,
      storageFacility,
      storageCostPerDay: Number(storageCostPerDay || 0),
      initialShelfLifeDays: shelfLife,
      shelfLifeLeftDays: Number(shelfLifeLeftDays || shelfLife),
      spoilageRiskPct: Number(spoilageRiskPct || (shelfLife <= 5 ? 4.2 : 2)),
      cultivationExpense: harvestedExpense,
      costOfProductionPerKg: Number(costOfProductionPerKg || (harvestedExpense / Math.max(1, quantity * 100))),
      fairFarmgateValuationPerQtl: Number(fairFarmgateValuationPerQtl || (crop === 'Tomato' ? 2250 : crop === 'Potato' ? 1750 : 2000)),
      status: shelfLife <= 5 ? 'Near Expiry' : shelfLife <= 12 ? 'Optimal' : 'Fresh',
      emoji: emoji || '📦',
      img: img || '',
    }

    db.createStorageStock(newStock)
    let updatedCrop = sourceCrop
    if (sourceCrop) {
      const remainingQuantity = Number((sourceCrop.yieldQtl - quantity).toFixed(2))
      const remainingRatio = sourceCrop.yieldQtl > 0 ? remainingQuantity / sourceCrop.yieldQtl : 0
      const remainingExpense = Math.max(0, sourceExpense - harvestedExpense)
      const remainingExpenses = Object.fromEntries(Object.entries(sourceCrop.expenses || {}).map(([key, value]) => [key, Math.round(Number(value) * remainingRatio)])) as typeof sourceCrop.expenses
      updatedCrop = db.updateCrop(sourceCrop.id, {
        yieldQtl: remainingQuantity,
        yield: `${remainingQuantity} Quintals`,
        spent: `₹${remainingExpense.toLocaleString('en-IN')}`,
        expenses: remainingExpenses,
        stage: remainingQuantity <= 0 ? 'Harvested' : sourceCrop.stage,
        maturity: remainingQuantity <= 0 ? 100 : sourceCrop.maturity,
      })
    }
    return res.status(201).json({ message: 'Crop deposited in storage facility', stock: newStock, crop: updatedCrop })
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create storage stock' })
  }
})

// ─── DELETE /api/logistics/stocks/:id ────────────────────────────────────────
logisticsRouter.delete('/stocks/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const stock = db.getStorageStocks().find((item) => item.id === String(req.params.id))
    if (!stock) return res.status(404).json({ error: 'Storage batch not found' })
    if (req.user?.role === 'farmer' && stock.farmerId !== req.user.id) {
      return res.status(403).json({ error: 'You do not own this storage batch' })
    }
    const requested = Number(req.query.quantity_qtl || stock.quantityQtl)
    if (!Number.isFinite(requested) || requested <= 0 || requested > stock.quantityQtl) {
      return res.status(400).json({ error: 'Sale quantity must be positive and cannot exceed stored stock' })
    }
    const remaining = Number((stock.quantityQtl - requested).toFixed(2))
    if (remaining <= 0) {
      db.deleteStorageStock(stock.id)
      return res.json({ message: 'Storage batch sold and removed', removed: true, remainingQuantityQtl: 0 })
    }
    const updated = db.updateStorageStock(stock.id, { quantityQtl: remaining })
    return res.json({ message: 'Sold quantity deducted from storage batch', removed: false, remainingQuantityQtl: remaining, stock: updated })
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to deduct storage stock' })
  }
})

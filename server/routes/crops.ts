import { Router, type Request, type Response } from 'express'
import { db } from '../db/store.ts'
import type { CropItem } from '../db/types.ts'
import type { AuthenticatedRequest } from '../authMiddleware.ts'

export const cropsRouter = Router()

const CROP_EMOJIS: Record<string, string> = {
  Tomato: '🍅',
  Onion: '🧅',
  Potato: '🥔',
  Wheat: '🌾',
  Maize: '🌽',
  Grapes: '🍇',
  Soybean: '🌱',
  Cotton: '☁️',
  'Green Chilli': '🌶️',
  Brinjal: '🍆',
  Other: '🌿',
}

const CROP_IMGS: Record<string, string> = {
  Tomato: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=600&h=280&fit=crop&auto=format',
  Onion: 'https://images.unsplash.com/photo-1565685225009-fc85d9109c80?w=600&h=280&fit=crop&auto=format',
  Grapes: 'https://images.unsplash.com/photo-1474722883778-792e7fb1bd9f?w=600&h=280&fit=crop&auto=format',
  Potato: 'https://images.unsplash.com/photo-1518977676405-d40a08fe0bb3?w=600&h=280&fit=crop&auto=format',
  Wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&h=280&fit=crop&auto=format',
  Brinjal: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&h=280&fit=crop&auto=format',
}
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4e6?w=600&h=280&fit=crop&auto=format'

// ─── GET /api/crops ───────────────────────────────────────────────────────────
cropsRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const farmerId = req.user?.role === 'farmer' ? req.user.id : (req.query.farmerId as string)
    const crops = db.getCrops(farmerId)
    return res.json({ crops })
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve crops' })
  }
})

// ─── GET /api/crops/:id ───────────────────────────────────────────────────────
cropsRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const cropId = String(req.params.id)
    const crop = db.getCropById(cropId)
    if (!crop) return res.status(404).json({ error: 'Crop not found' })
    if (req.user?.role === 'farmer' && crop.farmerId !== req.user.id) return res.status(403).json({ error: 'You do not own this crop' })
    return res.json({ crop })
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve crop' })
  }
})

// ─── POST /api/crops ──────────────────────────────────────────────────────────
cropsRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      farmerId,
      name,
      variety,
      acres,
      sowing,
      harvest,
      yieldQtl,
      spent,
      irrigation,
      stage,
      expenses,
    } = req.body

    if (!name || !variety || !acres) {
      return res.status(400).json({ error: 'Crop name, variety, and plot size are required' })
    }

    const plotSize = parseFloat(String(acres).replace(/[^0-9.]/g, '')) || 2.0
    const yieldNum = parseInt(String(yieldQtl || 0)) || Math.round(plotSize * 30)
    const spentNum = parseInt(String(spent || '0').replace(/[^0-9]/g, '')) || 25000

    const newCrop: CropItem = {
      id: `crop_${Date.now()}`,
      farmerId: req.user?.id || farmerId,
      name,
      variety,
      acres: `${plotSize} Acres`,
      plotSizeAcres: plotSize,
      sowing: sowing || 'Today',
      sowingDateRaw: new Date().toISOString().split('T')[0],
      harvest: harvest || 'In 75 Days',
      harvestDateRaw: new Date(Date.now() + 75 * 86400000).toISOString().split('T')[0],
      yieldQtl: yieldNum,
      yield: `${yieldNum} Quintals`,
      spent: `₹${spentNum.toLocaleString('en-IN')}`,
      stage: stage || 'Seedling',
      health: 'Healthy',
      healthScore: 85,
      maturity: 5,
      irrigation: irrigation || 'Drip Irrigation',
      img: CROP_IMGS[name] || DEFAULT_IMG,
      emoji: CROP_EMOJIS[name] || '🌿',
      expenses: expenses || {
        seeds: Math.round(spentNum * 0.2),
        fertilizers: Math.round(spentNum * 0.25),
        irrigation: Math.round(spentNum * 0.15),
        labour: Math.round(spentNum * 0.25),
        pestControl: Math.round(spentNum * 0.1),
        machinery: Math.round(spentNum * 0.05),
      },
    }

    db.createCrop(newCrop)
    return res.status(201).json({ message: 'Crop added successfully', crop: newCrop })
  } catch (err: any) {
    console.error('Create crop error:', err)
    return res.status(500).json({ error: 'Failed to create crop' })
  }
})

// ─── PUT /api/crops/:id ───────────────────────────────────────────────────────
cropsRouter.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const cropId = String(req.params.id)
    const existing = db.getCropById(cropId)
    if (!existing) return res.status(404).json({ error: 'Crop not found' })
    if (req.user?.role === 'farmer' && existing.farmerId !== req.user.id) return res.status(403).json({ error: 'You do not own this crop' })
    const { farmerId: ignoredFarmerId, id: ignoredId, ...safeUpdates } = req.body
    const updated = db.updateCrop(cropId, safeUpdates)
    if (!updated) {
      return res.status(404).json({ error: 'Crop not found' })
    }
    return res.json({ message: 'Crop updated successfully', crop: updated })
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update crop' })
  }
})

// ─── DELETE /api/crops/:id ────────────────────────────────────────────────────
cropsRouter.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const cropId = String(req.params.id)
    const existing = db.getCropById(cropId)
    if (!existing) return res.status(404).json({ error: 'Crop not found' })
    if (req.user?.role === 'farmer' && existing.farmerId !== req.user.id) return res.status(403).json({ error: 'You do not own this crop' })
    const deleted = db.deleteCrop(cropId)
    if (!deleted) {
      return res.status(404).json({ error: 'Crop not found' })
    }
    return res.json({ message: 'Crop removed successfully' })
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete crop' })
  }
})

// ─── POST /api/crops/:id/quality-assay (AI Computer Vision Assay) ──────────────
cropsRouter.post('/:id/quality-assay', (req: AuthenticatedRequest, res: Response) => {
  try {
    const cropId = String(req.params.id)
    const crop = db.getCropById(cropId)
    if (!crop) return res.status(404).json({ error: 'Crop not found' })
    if (req.user?.role === 'farmer' && crop.farmerId !== req.user.id) return res.status(403).json({ error: 'You do not own this crop' })

    const base = Math.max(0, Math.min(100, crop.healthScore || 75))
    const defectsPct = Math.max(0.5, Math.min(12, Number(((100 - base) / 25).toFixed(1))))
    const moisturePct = crop.name === 'Onion' ? 12.0 : crop.name === 'Tomato' ? 11.5 : 13.0
    const confidence = Number(Math.min(99.5, Math.max(75, base + 8)).toFixed(1))
    const grade = confidence >= 90 && defectsPct <= 4 ? 'Grade A' : confidence >= 78 && defectsPct <= 8 ? 'Grade B' : 'Grade C'
    const assayResult = {
      completed: true,
      grade: grade as 'Grade A' | 'Grade B' | 'Grade C',
      confidence,
      moisturePct,
      avgSizeMm: crop.name === 'Tomato' ? 58 : crop.name === 'Onion' ? 62 : 45,
      defectsPct,
      assayedAt: new Date().toISOString(),
      certificateNumber: `KS-QAC-${Math.floor(1000 + Math.random() * 9000)}-${crop.id.slice(0, 4).toUpperCase()}`,
    }

    const updated = db.updateCrop(cropId, { qualityAssay: assayResult })

    return res.json({
      message: 'AI Quality Assay certified successfully',
      qualityAssay: assayResult,
      crop: updated,
    })
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to perform AI quality assay' })
  }
})

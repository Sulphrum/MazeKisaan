import express, { type Express, type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth.ts'
import { cropsRouter } from './routes/crops.ts'
import { marketplaceRouter } from './routes/marketplace.ts'
import { demandsRouter } from './routes/demands.ts'
import { ordersRouter } from './routes/orders.ts'
import { logisticsRouter } from './routes/logistics.ts'
import { mandiRouter } from './routes/mandi.ts'
import { schemesRouter } from './routes/schemes.ts'
import { notificationsRouter } from './routes/notifications.ts'
import { publicMarketRouter } from './routes/publicMarket.ts'
import { requireAuth } from './authMiddleware.ts'

export const app: Express = express()

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    service: 'माझे Kisan Agricultural Marketplace Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// Authentication is required for all application data APIs.
app.use('/api/auth', authRouter)

// Safe, read-only discovery endpoints available before login.
app.use('/api/public/mandi', mandiRouter)
app.use('/api/public', publicMarketRouter)

app.use('/api', requireAuth)

// Route Modules
app.use('/api/crops', cropsRouter)
app.use('/api/marketplace', marketplaceRouter)
app.use('/api/demands', demandsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/logistics', logisticsRouter)
app.use('/api/mandi', mandiRouter)
app.use('/api/schemes', schemesRouter)
app.use('/api/notifications', notificationsRouter)

// 404 Handler for unmatched API routes
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` })
})

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Error]:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  })
})

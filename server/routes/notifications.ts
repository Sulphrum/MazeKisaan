import { Router, type Request, type Response } from 'express'
import { db } from '../db/store.ts'
import type { AuthenticatedRequest } from '../authMiddleware.ts'

export const notificationsRouter = Router()

// ─── GET /api/notifications ───────────────────────────────────────────────────
notificationsRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const notifications = db.getNotifications(req.user?.id, req.user?.role)
    const unreadCount = notifications.filter((n) => !n.read).length
    return res.json({ unreadCount, notifications })
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve notifications' })
  }
})

// ─── PATCH /api/notifications/:id/read ────────────────────────────────────────
notificationsRouter.patch('/:id/read', (req: AuthenticatedRequest, res: Response) => {
  try {
    const notifId = String(req.params.id)
    const existing = db.getNotifications(req.user?.id, req.user?.role).find(n => n.id === notifId)
    if (!existing) return res.status(404).json({ error: 'Notification not found' })
    const success = db.markNotificationAsRead(notifId)
    if (!success) {
      return res.status(404).json({ error: 'Notification not found' })
    }
    return res.json({ message: 'Marked as read' })
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update notification' })
  }
})

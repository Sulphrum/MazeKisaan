import crypto from 'node:crypto'
import type { Request, Response, NextFunction } from 'express'
import { db } from './db/store.ts'
import type { User } from './db/types.ts'

export type AuthenticatedRequest = Request & { user?: User }

const sessions = new Map<string, { userId: string; expiresAt: number }>()
const OTP_TTL_MS = 5 * 60 * 1000
const SESSION_TTL_MS = 24 * 60 * 60 * 1000
const SESSION_SECRET = process.env.KISANSETU_SESSION_SECRET || 'kisansetu-local-session-v1-2026'
const otps = new Map<string, { code: string; expiresAt: number }>()

export function hashPassword(password: string) {
  return 'sha256$' + crypto.createHash('sha256').update(password).digest('hex')
}

export function verifyPassword(password: string, stored: string | undefined) {
  if (!stored) return false
  if (stored.startsWith('sha256$')) return stored === hashPassword(password)
  return stored === password
}

export function createSession(userId: string) {
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt: Date.now() + SESSION_TTL_MS })).toString('base64url')
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function getUserFromToken(token?: string) {
  if (!token) return undefined
  const [payload, signature] = token.split('.')
  if (payload && signature) {
    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url')
    const suppliedBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expected)
    if (suppliedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) return undefined
    try {
      const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { userId: string; expiresAt: number }
      if (!session.userId || session.expiresAt < Date.now()) return undefined
      return db.getUserById(session.userId)
    } catch {
      return undefined
    }
  }
  // Keep already-issued in-memory tokens working until the current process ends.
  const session = sessions.get(token)
  if (!session) return undefined
  if (session.expiresAt < Date.now()) {
    sessions.delete(token)
    return undefined
  }
  return db.getUserById(session.userId)
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  const user = getUserFromToken(token)
  if (!user) return res.status(401).json({ error: 'Unauthorized: valid login required' })
  req.user = user
  next()
}

export function requireRole(...roles: User['role'][]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'You do not have permission for this action' })
    next()
  }
}

export function issueOtp(phone: string) {
  const code = String(Math.floor(100000 + Math.random() * 900000))
  otps.set(phone.trim().replace(/\s+/g, ''), { code, expiresAt: Date.now() + OTP_TTL_MS })
  return code
}

export function verifyOtp(phone: string, code: string) {
  const key = phone.trim().replace(/\s+/g, '')
  const record = otps.get(key)
  if (!record || record.expiresAt < Date.now()) {
    otps.delete(key)
    return false
  }
  if (record.code !== code) return false
  otps.delete(key)
  return true
}

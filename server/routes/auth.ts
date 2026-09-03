import { Router, type Request, type Response } from 'express'
import { db } from '../db/store.ts'
import type { User, UserRole } from '../db/types.ts'
import { createSession, getUserFromToken, hashPassword, verifyPassword, issueOtp, verifyOtp } from '../authMiddleware.ts'

export const authRouter = Router()

function sanitizeUser(user: User): Omit<User, 'password'> {
  const { password, ...safe } = user
  return safe
}

function validRole(role: unknown): role is 'farmer' | 'buyer' {
  return role === 'farmer' || role === 'buyer'
}

// POST /api/auth/register
authRouter.post('/register', (req: Request, res: Response) => {
  try {
    const { role, name, phone, email, password, location, landSize, primaryCrops, companyName, buyerType, gstin } = req.body
    if (!validRole(role) || !name || (!phone && !email) || !password || String(password).length < 6) {
      return res.status(400).json({ error: 'Role, name, contact and a password of at least 6 characters are required' })
    }
    if (db.getUserByPhoneOrEmail(phone || email)) return res.status(409).json({ error: 'A user with this mobile number or email already exists.' })

    const userId = `${role}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const newUser: User = {
      id: userId,
      role: role as UserRole,
      name: String(name).trim(),
      phone: phone ? String(phone).trim() : '',
      email: email ? String(email).trim().toLowerCase() : undefined,
      password: hashPassword(String(password)),
      location: location || (role === 'farmer' ? 'Nashik, Maharashtra' : 'Pune, Maharashtra'),
      avatar: String(name).trim().slice(0, 2).toUpperCase(),
      createdAt: new Date().toISOString(),
    }
    if (role === 'farmer') {
      newUser.landSize = landSize || '0 Acres'
      newUser.farmerId = `KS-F-${Date.now().toString().slice(-8)}`
      newUser.primaryCrops = Array.isArray(primaryCrops) ? primaryCrops : []
    } else {
      newUser.companyName = companyName || name
      newUser.buyerType = buyerType || 'Wholesale Trader'
      newUser.gstin = gstin || undefined
      newUser.verifiedBadge = false
      newUser.walletBalance = 500000
    }
    db.createUser(newUser)
    const token = createSession(newUser.id)
    return res.status(201).json({ message: 'Registration successful', user: sanitizeUser(newUser), token })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ error: 'Internal server error during registration' })
  }
})

// POST /api/auth/login
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { identifier, password, role } = req.body
    if (!identifier || !password) return res.status(400).json({ error: 'Mobile/email and password are required' })
    const user = db.getUserByPhoneOrEmail(String(identifier))
    if (!user || (role && user.role !== role) || !verifyPassword(String(password), user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    // Transparently upgrade old seeded plaintext passwords after a successful login.
    if (user.password && !user.password.startsWith('sha256$')) db.updateUser(user.id, { password: hashPassword(user.password) })
    const token = createSession(user.id)
    return res.json({ message: 'Login successful', user: sanitizeUser(user), token })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Internal server error during login' })
  }
})

// POST /api/auth/otp/send — development OTP is returned only outside production.
authRouter.post('/otp/send', (req: Request, res: Response) => {
  const phone = String(req.body.phone || '').trim()
  if (!phone) return res.status(400).json({ error: 'Mobile number is required' })
  const code = issueOtp(phone)
  const payload: { success: boolean; message: string; expiresInSeconds: number; simulatedOtp?: string } = {
    success: true,
    message: `OTP generated for +91 ${phone}`,
    expiresInSeconds: 300,
  }
  if (process.env.NODE_ENV !== 'production') payload.simulatedOtp = code
  return res.json(payload)
})

// POST /api/auth/otp/verify
authRouter.post('/otp/verify', (req: Request, res: Response) => {
  const phone = String(req.body.phone || '').trim()
  const otp = String(req.body.otp || '').trim()
  const role = req.body.role
  if (!phone || !/^\d{6}$/.test(otp)) return res.status(400).json({ error: 'A valid 6-digit OTP is required' })
  if (!verifyOtp(phone, otp)) return res.status(401).json({ error: 'Invalid or expired OTP' })
  const user = db.getUserByPhoneOrEmail(phone)
  if (!user || (role && user.role !== role)) return res.status(404).json({ error: 'No registered account found for this mobile number' })
  const token = createSession(user.id)
  return res.json({ message: 'OTP verified successfully', user: sanitizeUser(user), token })
})

// GET /api/auth/me
authRouter.get('/me', (req: Request, res: Response) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  const user = getUserFromToken(token)
  if (!user) return res.status(401).json({ error: 'Unauthorized: valid login required' })
  return res.json({ user: sanitizeUser(user) })
})

// PUT /api/auth/profile — user can only update their own profile.
authRouter.put('/profile', (req: Request & { user?: User }, res: Response) => {
  const header = req.headers.authorization || ''
  const sessionUser = getUserFromToken(header.startsWith('Bearer ') ? header.slice(7).trim() : '')
  if (!sessionUser) return res.status(401).json({ error: 'Unauthorized' })
  req.user = sessionUser
  const { id: ignoredId, password, role, walletBalance, verifiedBadge, ...updates } = req.body
  if (role || walletBalance !== undefined || verifiedBadge !== undefined) return res.status(403).json({ error: 'Protected account fields cannot be changed here' })
  if (password) updates.password = hashPassword(String(password))
  const updated = db.updateUser(req.user.id, updates)
  if (!updated) return res.status(404).json({ error: 'User not found' })
  return res.json({ message: 'Profile updated', user: sanitizeUser(updated) })
})

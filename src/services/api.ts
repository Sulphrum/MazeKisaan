import {
  User,
  CropItem,
  MarketplaceListing,
  OrderItem,
  ProcurementDemand,
  NegotiationBid,
  SchemeItem,
  StorageStockItem,
  TransportOption,
  StorageOption,
  MarketPriceItem,
} from '../types'

const TOKEN_KEY = 'kisansetu_auth_token'
const USER_KEY = 'kisansetu_auth_user'

const API_BASE = '/api'

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    if (res.status === 401 && endpoint !== '/auth/login') {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      window.dispatchEvent(new Event('kisansetu-auth-expired'))
    }
    let errorMsg = `Request failed: ${res.statusText}`
    try {
      const errJson = await res.json()
      if (errJson && errJson.error) errorMsg = errJson.error
    } catch {
      // ignore
    }
    throw new Error(errorMsg)
  }

  return res.json()
}

export const api = {
  // Public discovery data: no identity, contacts, negotiations or account data.
  publicMarket: {
    async getPrices(): Promise<any> {
      return request<any>('/public/mandi/prices')
    },
    async getPriceChart(crop: string, mandi = 'Niphad'): Promise<any> {
      return request<any>(`/public/mandi/price-chart/${encodeURIComponent(crop)}?mandi=${encodeURIComponent(mandi)}`)
    },
    async getForecast(crop: string, mandi = 'Niphad'): Promise<any> {
      return request<any>(`/public/mandi/forecast?crop=${encodeURIComponent(crop)}&mandi=${encodeURIComponent(mandi)}`)
    },
    async getSupply(): Promise<any> {
      return request<any>('/public/supply')
    },
  },
  // ─── Authentication ─────────────────────────────────────────────────────────
  auth: {
    async register(data: {
      role: 'farmer' | 'buyer'
      name: string
      phone?: string
      email?: string
      password?: string
      location?: string
      landSize?: string
      primaryCrops?: string[]
      companyName?: string
      buyerType?: string
      gstin?: string
    }): Promise<{ user: User; token: string }> {
      const res = await request<{ user: User; token: string; message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      if (res.token) {
        localStorage.setItem(TOKEN_KEY, res.token)
        localStorage.setItem(USER_KEY, JSON.stringify(res.user))
      }
      return res
    },

    async login(data: { identifier: string; password?: string; role?: 'farmer' | 'buyer' }): Promise<{ user: User; token: string }> {
      const res = await request<{ user: User; token: string; message: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      if (res.token) {
        localStorage.setItem(TOKEN_KEY, res.token)
        localStorage.setItem(USER_KEY, JSON.stringify(res.user))
      }
      return res
    },

    async sendOtp(phone: string): Promise<{ success: boolean; simulatedOtp: string; message: string }> {
      return request<{ success: boolean; simulatedOtp: string; message: string }>('/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      })
    },

    async verifyOtp(phone: string, otp: string, role?: 'farmer' | 'buyer'): Promise<{ user: User; token: string }> {
      const res = await request<{ user: User; token: string; message: string }>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, otp, role }),
      })
      if (res.token) {
        localStorage.setItem(TOKEN_KEY, res.token)
        localStorage.setItem(USER_KEY, JSON.stringify(res.user))
      }
      return res
    },

    async getMe(): Promise<User | null> {
      try {
        const res = await request<{ user: User }>('/auth/me')
        if (res.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(res.user))
          return res.user
        }
        return null
      } catch {
        // A cached profile without a valid server session creates a dashboard
        // that looks logged in but fails every protected action.
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        return null
      }
    },

    logout() {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    },
  },

  // ─── Crops ──────────────────────────────────────────────────────────────────
  crops: {
    async getAll(farmerId?: string): Promise<CropItem[]> {
      const query = farmerId ? `?farmerId=${encodeURIComponent(farmerId)}` : ''
      const res = await request<{ crops: CropItem[] }>(`/crops${query}`)
      return res.crops
    },

    async getById(id: string): Promise<CropItem> {
      const res = await request<{ crop: CropItem }>(`/crops/${id}`)
      return res.crop
    },

    async create(cropData: Partial<CropItem>): Promise<CropItem> {
      const res = await request<{ message: string; crop: CropItem }>('/crops', {
        method: 'POST',
        body: JSON.stringify(cropData),
      })
      return res.crop
    },

    async update(id: string, updates: Partial<CropItem>): Promise<CropItem> {
      const res = await request<{ message: string; crop: CropItem }>(`/crops/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      return res.crop
    },

    async delete(id: string): Promise<boolean> {
      await request<{ message: string }>(`/crops/${id}`, { method: 'DELETE' })
      return true
    },

    async runQualityAssay(cropId: string): Promise<any> {
      const res = await request<{ message: string; qualityAssay: any; crop: CropItem }>(`/crops/${cropId}/quality-assay`, {
        method: 'POST',
      })
      return res
    },
  },

  // ─── Marketplace ────────────────────────────────────────────────────────────
  marketplace: {
    async getListings(filters?: {
      crop?: string
      qualityGrade?: string
      maxDistanceKm?: number
      search?: string
    }): Promise<MarketplaceListing[]> {
      const params = new URLSearchParams()
      if (filters?.crop && filters.crop !== 'all') params.append('crop', filters.crop)
      if (filters?.qualityGrade && filters.qualityGrade !== 'all') params.append('qualityGrade', filters.qualityGrade)
      if (filters?.maxDistanceKm) params.append('maxDistanceKm', String(filters.maxDistanceKm))
      if (filters?.search) params.append('search', filters.search)

      const qs = params.toString() ? `?${params.toString()}` : ''
      const res = await request<{ total: number; listings: MarketplaceListing[] }>(`/marketplace/listings${qs}`)
      return res.listings
    },

    async createListing(listingData: Partial<MarketplaceListing>): Promise<MarketplaceListing> {
      const res = await request<{ message: string; listing: MarketplaceListing }>('/marketplace/listings', {
        method: 'POST',
        body: JSON.stringify(listingData),
      })
      return res.listing
    },

    async getRecommendations(crop: string = 'Tomato'): Promise<any> {
      return request<any>(`/marketplace/recommendations?crop=${encodeURIComponent(crop)}`)
    },
  },

  // ─── Demands & Negotiations ─────────────────────────────────────────────────
  demands: {
    async getAll(buyerId?: string): Promise<ProcurementDemand[]> {
      const query = buyerId ? `?buyerId=${encodeURIComponent(buyerId)}` : ''
      const res = await request<{ demands: ProcurementDemand[] }>(`/demands${query}`)
      return res.demands
    },

    async create(data: Partial<ProcurementDemand>): Promise<ProcurementDemand> {
      const res = await request<{ message: string; demand: ProcurementDemand }>('/demands', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return res.demand
    },

    async submitNegotiation(data: {
      demandId?: string
      listingId?: string
      senderId: string
      senderRole: 'farmer' | 'buyer'
      senderName: string
      targetUserId: string
      targetName?: string
      cropName: string
      requestedQuantityQtl: number
      counterPricePerQtl: number
      deliveryTerms?: string
      note?: string
      cropImages?: string[]
      cropGrade?: string
      cropVariety?: string
      cropLocation?: string
      harvestStatus?: string
    }): Promise<any> {
      return request<any>('/demands/negotiations', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    async getNegotiations(): Promise<NegotiationBid[]> {
      const res = await request<{ negotiations: NegotiationBid[] }>('/demands/negotiations')
      return res.negotiations
    },
    async reviewNegotiation(id: string, status: 'Accepted' | 'Rejected', decisionNote?: string): Promise<NegotiationBid> {
      const res = await request<{ message: string; bid: NegotiationBid }>(`/demands/negotiations/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, decisionNote }),
      })
      return res.bid
    },
    async sendNegotiationMessage(id: string, message: string): Promise<NegotiationBid> {
      const res = await request<{ message: string; bid: NegotiationBid }>(`/demands/negotiations/${encodeURIComponent(id)}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      })
      return res.bid
    },
  },

  // ─── Orders & Escrow ────────────────────────────────────────────────────────
  orders: {
    async getAll(userId?: string, role?: 'farmer' | 'buyer'): Promise<OrderItem[]> {
      const params = new URLSearchParams()
      if (userId) params.append('userId', userId)
      if (role) params.append('role', role)
      const qs = params.toString() ? `?${params.toString()}` : ''
      const res = await request<{ total: number; orders: OrderItem[] }>(`/orders${qs}`)
      return res.orders
    },

    async getById(id: string): Promise<OrderItem> {
      const res = await request<{ order: OrderItem }>(`/orders/${id}`)
      return res.order
    },

    async create(orderData: Partial<OrderItem>): Promise<OrderItem> {
      const res = await request<{ message: string; order: OrderItem }>('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      })
      return res.order
    },

    async updateStatus(id: string, status: string, statusStep: number): Promise<OrderItem> {
      const res = await request<{ message: string; order: OrderItem }>(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, statusStep }),
      })
      return res.order
    },

    async releaseEscrow(orderId: string): Promise<OrderItem> {
      const res = await request<{ message: string; order: OrderItem }>(`/orders/${orderId}/release-escrow`, {
        method: 'POST',
      })
      return res.order
    },

    async getInvoice(orderId: string): Promise<any> {
      return request<any>(`/orders/${orderId}/invoice`)
    },
  },

  // ─── Logistics & Storage ───────────────────────────────────────────────────
  logistics: {
    async getTransport(): Promise<TransportOption[]> {
      const res = await request<{ transportOptions: TransportOption[] }>('/logistics/transport')
      return res.transportOptions
    },

    async getStorage(): Promise<StorageOption[]> {
      const res = await request<{ storageOptions: StorageOption[] }>('/logistics/storage')
      return res.storageOptions
    },

    async getStocks(farmerId?: string): Promise<StorageStockItem[]> {
      const q = farmerId ? `?farmerId=${encodeURIComponent(farmerId)}` : ''
      const res = await request<{ storageStocks: StorageStockItem[] }>(`/logistics/stocks${q}`)
      return res.storageStocks
    },

    async createStock(data: Partial<StorageStockItem>): Promise<{ stock: StorageStockItem; crop?: CropItem }> {
      const res = await request<{ message: string; stock: StorageStockItem; crop?: CropItem }>('/logistics/stocks', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return { stock: res.stock, crop: res.crop }
    },

    async deleteStock(id: string, quantityQtl?: number): Promise<{ removed: boolean; remainingQuantityQtl: number }> {
      const query = quantityQtl ? `?quantity_qtl=${encodeURIComponent(String(quantityQtl))}` : ''
      return request<{ removed: boolean; remainingQuantityQtl: number }>(`/logistics/stocks/${encodeURIComponent(id)}${query}`, {
        method: 'DELETE',
      })
    },
  },

  // ─── Mandi Prices & Forecast ───────────────────────────────────────────────
  mandi: {
    async getPrices(): Promise<MarketPriceItem[]> {
      const res = await request<{ prices: MarketPriceItem[] }>('/mandi/prices')
      return res.prices
    },

    async getPriceFeed(): Promise<{ prices: MarketPriceItem[]; isLive: boolean; asOf: string | null; source: string }> {
      return request<{ prices: MarketPriceItem[]; isLive: boolean; asOf: string | null; source: string }>('/mandi/prices')
    },

    async getForecast(crop: string = 'Tomato', currentPrice?: number): Promise<any> {
      const params = new URLSearchParams({ crop })
      if (currentPrice && currentPrice > 0) params.set('current_price', String(currentPrice))
      const res = await request<any>(`/mandi/forecast?${params.toString()}`)
      const forecast = res.forecast || res
      return { ...forecast, model_status: res.model_status || forecast.model_status || 'preview' }
    },
  },

  // ─── Schemes & Loans ───────────────────────────────────────────────────────
  schemes: {
    async getAll(category?: string): Promise<SchemeItem[]> {
      const q = category ? `?category=${encodeURIComponent(category)}` : ''
      const res = await request<{ schemes: SchemeItem[] }>(`/schemes${q}`)
      return res.schemes
    },

    async getPersonalized(): Promise<any> {
      return request<any>('/schemes/personalized')
    },

    async calculateLoan(data: { landAcres: number; cropType?: string; requestedAmount: number; expectedYieldQtl: number; cultivationExpense: number }): Promise<any> {
      return request<any>('/schemes/calculate-loan', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
  },

  // ─── Notifications ─────────────────────────────────────────────────────────
  notifications: {
    async getAll(userId?: string, role?: string): Promise<{ unreadCount: number; notifications: any[] }> {
      const params = new URLSearchParams()
      if (userId) params.append('userId', userId)
      if (role) params.append('role', role)
      const q = params.toString() ? `?${params.toString()}` : ''
      return request<any>(`/notifications${q}`)
    },

    async markRead(id: string): Promise<boolean> {
      await request<any>(`/notifications/${id}/read`, { method: 'PATCH' })
      return true
    },
  },
}

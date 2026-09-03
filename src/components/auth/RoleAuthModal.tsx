import { useEffect, useState } from 'react'
import type { User, UserRole } from '../../types'
import { api } from '../../services/api'
import { BrandLogo } from '../common/BrandLogo'

type AuthMode = 'login' | 'register'

const FARMER_DEMO_ACCOUNTS = [
  { label: 'Ramesh Patil · Niphad', identifier: '98220 14589' },
]

const BUYER_DEMO_ACCOUNTS = [
  { label: 'Deccan Fresh Exports', identifier: 'sunil@deccanfresh.com' },
]

interface RoleAuthModalProps {
  role: Extract<UserRole, 'farmer' | 'buyer'>
  initialMode: AuthMode
  onClose: () => void
  onLoginSuccess: (user: User) => void
}

export function RoleAuthModal({ role, initialMode, onClose, onLoginSuccess }: RoleAuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [farmerPhone, setFarmerPhone] = useState('98220 14589')
  const [farmerPassword, setFarmerPassword] = useState('password123')
  const [farmerName, setFarmerName] = useState('Ramesh Patil')
  const [farmerLocation, setFarmerLocation] = useState('Niphad, Nashik')
  const [farmerLand, setFarmerLand] = useState('5.2 Acres')
  const farmerDemoIdentifier = FARMER_DEMO_ACCOUNTS[0].identifier

  const [buyerIdentifier, setBuyerIdentifier] = useState('sunil@deccanfresh.com')
  const [buyerPassword, setBuyerPassword] = useState('password123')
  const buyerDemoIdentifier = BUYER_DEMO_ACCOUNTS[0].identifier
  const [buyerCompany, setBuyerCompany] = useState('Deccan Fresh Exports Pvt Ltd')
  const [buyerName, setBuyerName] = useState('Sunil Kulkarni')
  const [buyerType, setBuyerType] = useState<'Exporter' | 'Wholesale Trader' | 'Food Processor' | 'Retail Chain'>('Exporter')
  const [buyerGstin, setBuyerGstin] = useState('27AABCD8921M1Z5')
  const [buyerHub, setBuyerHub] = useState('Pune Agro SEZ')

  useEffect(() => setMode(initialMode), [initialMode])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'login') {
        const result = await api.auth.login({
          identifier: role === 'farmer' ? farmerPhone : buyerIdentifier,
          password: role === 'farmer' ? farmerPassword : buyerPassword,
          role,
        })
        onLoginSuccess(result.user)
        return
      }

      if (role === 'farmer') {
        const result = await api.auth.register({
          role: 'farmer',
          name: farmerName,
          phone: farmerPhone,
          password: farmerPassword,
          location: `${farmerLocation}, Maharashtra`,
          landSize: farmerLand,
          primaryCrops: [],
        })
        onLoginSuccess(result.user)
      } else {
        const result = await api.auth.register({
          role: 'buyer',
          name: buyerName,
          email: buyerIdentifier.includes('@') ? buyerIdentifier : undefined,
          phone: buyerIdentifier.includes('@') ? '98450 98211' : buyerIdentifier,
          password: buyerPassword,
          location: `${buyerHub}, Maharashtra`,
          companyName: buyerCompany,
          buyerType,
          gstin: buyerGstin,
        })
        onLoginSuccess(result.user)
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function useDemo() {
    setLoading(true)
    setError('')
    try {
      const result = await api.auth.login({
        identifier: role === 'farmer' ? farmerDemoIdentifier : buyerDemoIdentifier,
        password: 'password123',
        role,
      })
      onLoginSuccess(result.user)
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Demo login failed.')
    } finally {
      setLoading(false)
    }
  }

  const title = role === 'farmer' ? 'Farmer account' : 'Buyer account'
  const dashboard = role === 'farmer' ? 'farmer market and selling tools' : 'buyer sourcing and procurement tools'

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-5" role="presentation">
      <button type="button" className="absolute inset-0 bg-[#0E2117]/65 backdrop-blur-[2px]" onClick={onClose} aria-label="Close account window" />
      <div className="relative max-h-[94dvh] w-full overflow-y-auto bg-[#FFFEFA] shadow-2xl sm:max-w-lg sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="public-auth-title">
        <div className="flex items-start justify-between border-b bg-[#10291C] px-6 py-5" style={{ borderColor: '#294737' }}>
          <div>
            <BrandLogo tone="light" className="text-[28px]" />
            <h2 id="public-auth-title" className="mt-2 text-xl font-bold text-white">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border text-xl text-white" style={{ borderColor: 'rgba(255,255,255,0.35)' }} aria-label="Close account window">×</button>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-2 border p-1" style={{ background: '#F4F3EC', borderColor: '#D8DED8' }}>
            <button type="button" onClick={() => { setMode('login'); setError('') }} className="px-4 py-2.5 text-sm font-bold" style={{ background: mode === 'login' ? '#173F2A' : 'transparent', color: mode === 'login' ? '#FFFFFF' : '#52635A' }}>Log in</button>
            <button type="button" onClick={() => { setMode('register'); setError('') }} className="px-4 py-2.5 text-sm font-bold" style={{ background: mode === 'register' ? '#173F2A' : 'transparent', color: mode === 'register' ? '#FFFFFF' : '#52635A' }}>Create account</button>
          </div>

          <p className="mt-5 text-sm leading-relaxed" style={{ color: '#687069' }}>{mode === 'login' ? `Log in to access your ${dashboard}.` : `Create your ${role} profile to continue beyond public market information.`}</p>

          <form onSubmit={submit} className="mt-5 space-y-4">
            {mode === 'register' && role === 'farmer' && <>
              <label className="block"><span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#52635A' }}>Full name</span><input required value={farmerName} onChange={(event) => setFarmerName(event.target.value)} className="mt-2 w-full border px-3 py-3 text-base outline-none" style={{ borderColor: '#C9D1CA' }} /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label><span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#52635A' }}>Farm location</span><input required value={farmerLocation} onChange={(event) => setFarmerLocation(event.target.value)} className="mt-2 w-full border px-3 py-3 text-base outline-none" style={{ borderColor: '#C9D1CA' }} /></label>
                <label><span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#52635A' }}>Land holding</span><input required value={farmerLand} onChange={(event) => setFarmerLand(event.target.value)} className="mt-2 w-full border px-3 py-3 text-base outline-none" style={{ borderColor: '#C9D1CA' }} /></label>
              </div>
            </>}

            {mode === 'register' && role === 'buyer' && <>
              <label className="block"><span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#52635A' }}>Business name</span><input required value={buyerCompany} onChange={(event) => setBuyerCompany(event.target.value)} className="mt-2 w-full border px-3 py-3 text-base outline-none" style={{ borderColor: '#C9D1CA' }} /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label><span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#52635A' }}>Contact person</span><input required value={buyerName} onChange={(event) => setBuyerName(event.target.value)} className="mt-2 w-full border px-3 py-3 text-base outline-none" style={{ borderColor: '#C9D1CA' }} /></label>
                <label><span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#52635A' }}>Buyer type</span><select value={buyerType} onChange={(event) => setBuyerType(event.target.value as typeof buyerType)} className="mt-2 w-full border px-3 py-3 text-base outline-none" style={{ borderColor: '#C9D1CA' }}><option>Exporter</option><option>Wholesale Trader</option><option>Food Processor</option><option>Retail Chain</option></select></label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label><span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#52635A' }}>GSTIN or licence</span><input value={buyerGstin} onChange={(event) => setBuyerGstin(event.target.value)} className="mt-2 w-full border px-3 py-3 text-base outline-none" style={{ borderColor: '#C9D1CA' }} /></label>
                <label><span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#52635A' }}>Procurement hub</span><input required value={buyerHub} onChange={(event) => setBuyerHub(event.target.value)} className="mt-2 w-full border px-3 py-3 text-base outline-none" style={{ borderColor: '#C9D1CA' }} /></label>
              </div>
            </>}

            <label className="block"><span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#52635A' }}>{role === 'farmer' ? 'Mobile number / Kisan ID' : 'Email or mobile number'}</span><input required value={role === 'farmer' ? farmerPhone : buyerIdentifier} onChange={(event) => role === 'farmer' ? setFarmerPhone(event.target.value) : setBuyerIdentifier(event.target.value)} className="mt-2 w-full border px-3 py-3 text-base outline-none" style={{ borderColor: '#C9D1CA' }} /></label>
            <label className="block"><span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#52635A' }}>Password</span><div className="relative mt-2"><input required minLength={6} type={showPassword ? 'text' : 'password'} value={role === 'farmer' ? farmerPassword : buyerPassword} onChange={(event) => role === 'farmer' ? setFarmerPassword(event.target.value) : setBuyerPassword(event.target.value)} className="w-full border px-3 py-3 pr-16 text-base outline-none" style={{ borderColor: '#C9D1CA' }} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-3 text-sm font-bold" style={{ color: '#3F6B45' }}>{showPassword ? 'Hide' : 'Show'}</button></div></label>

            {error && <div className="border p-3 text-sm" style={{ background: '#FEF2F2', borderColor: '#F1B8B2', color: '#9F241B' }}>{error}</div>}
            <button disabled={loading} className="w-full px-5 py-3.5 text-base font-bold text-white disabled:opacity-50" style={{ background: '#173F2A' }}>{loading ? 'Please wait…' : mode === 'login' ? `Log in as ${role}` : `Create ${role} account`}</button>
          </form>

          {mode === 'login' && role === 'farmer' && <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <div className="border px-3 py-3 text-sm font-semibold" style={{ borderColor: '#9EAAA1', color: '#35483B' }}>{FARMER_DEMO_ACCOUNTS[0].label}</div>
            <button type="button" disabled={loading} onClick={useDemo} className="border px-4 py-3 text-sm font-bold disabled:opacity-50" style={{ borderColor: '#173F2A', color: '#173F2A' }}>Open demo</button>
          </div>}
          {mode === 'login' && role === 'buyer' && <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <div className="border px-3 py-3 text-sm font-semibold" style={{ borderColor: '#9EAAA1', color: '#35483B' }}>{BUYER_DEMO_ACCOUNTS[0].label}</div>
            <button type="button" disabled={loading} onClick={useDemo} className="border px-4 py-3 text-sm font-bold disabled:opacity-50" style={{ borderColor: '#173F2A', color: '#173F2A' }}>Open demo</button>
          </div>}
          <p className="mt-4 text-center text-xs leading-relaxed" style={{ color: '#879087' }}>Public market information remains available without an account.</p>
        </div>
      </div>
    </div>
  )
}

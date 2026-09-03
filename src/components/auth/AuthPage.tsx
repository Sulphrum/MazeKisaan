import { useState } from 'react'
import { User, UserRole } from '../../types'
import { api } from '../../services/api'
import { OTPModal } from './OTPModal'
import { BrandLogo } from '../common/BrandLogo'

export function AuthPage({
  onLoginSuccess,
}: {
  onLoginSuccess: (user: User) => void
}) {
  const [role, setRole] = useState<UserRole>('farmer')
  const [isRegister, setIsRegister] = useState(false)
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [devOtp, setDevOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Farmer Form state
  const [farmerPhone, setFarmerPhone] = useState('98220 14589')
  const [farmerPassword, setFarmerPassword] = useState('password123')
  const [farmerName, setFarmerName] = useState('Ramesh Patil')
  const [farmerDistrict, setFarmerDistrict] = useState('Niphad, Nashik')
  const [farmerLand, setFarmerLand] = useState('5.2 Acres')
  const [selectedCrops, setSelectedCrops] = useState<string[]>(['Tomato', 'Onion', 'Brinjal'])

  // Buyer Form state
  const [buyerEmailOrPhone, setBuyerEmailOrPhone] = useState('sunil@deccanfresh.com')
  const [buyerPassword, setBuyerPassword] = useState('password123')
  const [buyerCompany, setBuyerCompany] = useState('Deccan Fresh Exports Pvt Ltd')
  const [buyerPersonName, setBuyerPersonName] = useState('Sunil Kulkarni')
  const [buyerType, setBuyerType] = useState<'Exporter' | 'Wholesale Trader' | 'Food Processor' | 'Retail Chain'>('Exporter')
  const [buyerGstin, setBuyerGstin] = useState('27AABCD8921M1Z5')
  const [buyerHub, setBuyerHub] = useState('Pune Agro SEZ')

  // Show/hide password
  const [showPassword, setShowPassword] = useState(false)

  const handleToggleCrop = (crop: string) => {
    if (selectedCrops.includes(crop)) {
      setSelectedCrops(selectedCrops.filter((c) => c !== crop))
    } else {
      setSelectedCrops([...selectedCrops, crop])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setAuthError(null)

    try {
      if (isRegister) {
        if (role === 'farmer') {
          const res = await api.auth.register({
            role: 'farmer',
            name: farmerName || 'Ramesh Patil',
            phone: farmerPhone || '98220 14589',
            password: farmerPassword || 'password123',
            location: farmerDistrict ? `${farmerDistrict}, Maharashtra` : 'Niphad, Nashik, Maharashtra',
            landSize: farmerLand || '5.2 Acres',
            primaryCrops: selectedCrops.length ? selectedCrops : ['Tomato', 'Onion'],
          })
          onLoginSuccess(res.user)
        } else {
          const res = await api.auth.register({
            role: 'buyer',
            name: buyerPersonName || 'Sunil Kulkarni',
            phone: buyerEmailOrPhone.includes('@') ? '98450 98211' : buyerEmailOrPhone,
            email: buyerEmailOrPhone.includes('@') ? buyerEmailOrPhone : 'sunil@deccanfresh.com',
            password: buyerPassword || 'password123',
            companyName: buyerCompany || 'Deccan Fresh Exports Pvt Ltd',
            location: buyerHub ? `${buyerHub}, Maharashtra` : 'Market Yard Hub, Pune, Maharashtra',
            buyerType,
            gstin: buyerGstin || '27AABCD8921M1Z5',
          })
          onLoginSuccess(res.user)
        }
      } else {
        const identifier = role === 'farmer' ? farmerPhone : buyerEmailOrPhone
        const res = await api.auth.login({
          identifier,
          password: role === 'farmer' ? farmerPassword : buyerPassword,
          role,
        })
        onLoginSuccess(res.user)
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication failed. Please check your details.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartOtpLogin = async () => {
    setIsLoading(true)
    setAuthError(null)
    try {
      const phone = role === 'farmer' ? farmerPhone : buyerEmailOrPhone
      if (phone.includes('@')) throw new Error('OTP login requires a mobile number')
      const result = await api.auth.sendOtp(phone)
      setDevOtp(result.simulatedOtp || '')
      setShowOtpModal(true)
    } catch (err: any) {
      setAuthError(err?.message || 'Could not send OTP.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpVerify = async (otpCode: string) => {
    setIsLoading(true)
    setShowOtpModal(false)
    try {
      const phone = role === 'farmer' ? farmerPhone : buyerEmailOrPhone
      const res = await api.auth.verifyOtp(phone, otpCode, role)
      onLoginSuccess(res.user)
    } catch (err: any) {
      setAuthError(err?.message || 'Invalid or expired OTP.')
      setShowOtpModal(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (targetRole: UserRole) => {
    setIsLoading(true)
    try {
      const identifier = targetRole === 'farmer' ? '98220 14589' : 'sunil@deccanfresh.com'
      const res = await api.auth.login({ identifier, password: 'password123', role: targetRole })
      onLoginSuccess(res.user)
    } catch (err: any) {
      setAuthError(err?.message || 'Demo account login failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToAuth = (targetRole: UserRole, registerMode = false) => {
    setRole(targetRole)
    setIsRegister(registerMode)
    const el = document.getElementById('auth-section')
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div
      className="min-h-screen flex flex-col justify-between"
      style={{ background: '#F7F6F1', fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Top Navigation Bar ── */}
      <nav className="w-full bg-[#063B2A] text-white py-3 px-4 sm:px-8 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center">
            <BrandLogo tone="light" className="text-[32px]" />
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => handleDemoLogin('farmer')}
              className="bg-[#238B5B] hover:bg-[#2da16b] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>👨‍🌾</span>
              <span className="hidden xs:inline">Demo:</span>
              <span>Farmer Login</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('buyer')}
              className="bg-[#F4C44E] hover:bg-[#f6cd68] text-[#063B2A] text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>🏢</span>
              <span className="hidden xs:inline">Demo:</span>
              <span>Buyer Login</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero & Website Info Section ── */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-8 space-y-12">
        {/* Main Title Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF5EE] border border-[#C4DFD0] text-[#063B2A] text-xs font-bold shadow-xs">
            <span>🌱</span>
            <span>Empowering Indian Agriculture with Fair Trade &amp; AI Intelligence</span>
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight"
            style={{ color: '#063B2A' }}
          >
            माझे Kisan
          </h1>

          <p className="text-base sm:text-lg text-gray-600 font-medium leading-relaxed">
            A smart, direct farm-to-buyer agricultural marketplace connecting hardworking Indian farmers with institutional buyers, food processors, and exporters — with zero middleman exploitation.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => scrollToAuth('farmer')}
              className="px-6 py-3 rounded-2xl font-bold text-sm text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: '#063B2A' }}
            >
              👨‍🌾 Join as Farmer
            </button>
            <button
              onClick={() => scrollToAuth('buyer')}
              className="px-6 py-3 rounded-2xl font-bold text-sm border-2 border-[#063B2A] text-[#063B2A] bg-white shadow-sm transition-all hover:bg-[#EAF5EE] active:scale-[0.98]"
            >
              🏢 Join as Buyer / Trader
            </button>
          </div>
        </div>

        {/* What माझे Kisan Does - Key Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-3xl p-6 border shadow-sm space-y-2.5 transition-all hover:shadow-md" style={{ borderColor: '#E2EBE5' }}>
            <div className="w-12 h-12 rounded-2xl bg-[#EAF5EE] text-2xl flex items-center justify-center text-[#063B2A]">
              🤝
            </div>
            <h3 className="font-bold text-lg text-[#17221D]">Direct Farmgate Trade</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Eliminates predatory commission agents and hidden mandi charges. Buyers purchase directly from the farmer&apos;s field at transparent prices.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border shadow-sm space-y-2.5 transition-all hover:shadow-md" style={{ borderColor: '#E2EBE5' }}>
            <div className="w-12 h-12 rounded-2xl bg-[#EAF5EE] text-2xl flex items-center justify-center text-[#063B2A]">
              🤖
            </div>
            <h3 className="font-bold text-lg text-[#17221D]">AI Market &amp; Quality Assay</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Real-time APMC mandi price telemetry, 14-day price forecasts, and instant computer-vision produce quality grading with Grade A certification.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border shadow-sm space-y-2.5 transition-all hover:shadow-md" style={{ borderColor: '#E2EBE5' }}>
            <div className="w-12 h-12 rounded-2xl bg-[#EAF5EE] text-2xl flex items-center justify-center text-[#063B2A]">
              🔒
            </div>
            <h3 className="font-bold text-lg text-[#17221D]">100% Escrow Protection</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Bank-grade escrow locks buyer payment before produce leaves the farm. Funds are disbursed automatically to the farmer&apos;s bank account on delivery.
            </p>
          </div>
        </div>

        {/* Two Columns: How It Benefits Farmers vs How It Benefits Buyers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Benefits for Farmers */}
          <div className="bg-white rounded-3xl border p-6 sm:p-7 shadow-sm space-y-4" style={{ borderColor: '#C4DFD0', background: 'linear-gradient(180deg, #FFFFFF 0%, #F5FAF6 100%)' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#063B2A] text-white flex items-center justify-center text-2xl">
                👨‍🌾
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#238B5B]">
                  For Indian Growers &amp; FPOs
                </span>
                <h3 className="font-extrabold text-xl text-[#063B2A]">
                  How माझे Kisan Benefits Farmers
                </h3>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-[#EAF5EE] text-[#238B5B] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <strong className="text-gray-900 font-semibold block text-sm">8% to 15% Higher Net Realization</strong>
                  <span className="text-gray-600 leading-relaxed">
                    Sell at wholesale premium directly to food processors and exporters instead of distressed local mandi sales.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-[#EAF5EE] text-[#238B5B] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <strong className="text-gray-900 font-semibold block text-sm">AI Smart Selling Advisory</strong>
                  <span className="text-gray-600 leading-relaxed">
                    Know exact harvest readiness, optimal selling dates, nearest high-paying buyer options, and complete profit breakdown.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-[#EAF5EE] text-[#238B5B] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <strong className="text-gray-900 font-semibold block text-sm">Integrated Transport &amp; Storage</strong>
                  <span className="text-gray-600 leading-relaxed">
                    Book on-demand mini trucks (Tata Ace, Bolero) and access subsidised WDRA cold godowns with electronic pledge receipts.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-[#EAF5EE] text-[#238B5B] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <strong className="text-gray-900 font-semibold block text-sm">Pre-Approved Loans &amp; Subsidy Schemes</strong>
                  <span className="text-gray-600 leading-relaxed">
                    Direct access to PM-KISAN, PMFBY crop loss insurance, and interactive Kisan Credit Card (KCC) cash flow simulators.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => scrollToAuth('farmer')}
                className="w-full py-3 rounded-2xl text-xs font-bold text-white shadow-sm transition-all hover:opacity-90"
                style={{ background: '#063B2A' }}
              >
                Create Free Farmer Account / Login →
              </button>
            </div>
          </div>

          {/* Benefits for Buyers */}
          <div className="bg-white rounded-3xl border p-6 sm:p-7 shadow-sm space-y-4" style={{ borderColor: '#F0D9A8', background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDF8 100%)' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D99A25] text-white flex items-center justify-center text-2xl">
                🏢
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D99A25]">
                  For Exporters, Wholesalers &amp; Processors
                </span>
                <h3 className="font-extrabold text-xl text-[#17221D]">
                  How माझे Kisan Benefits Buyers
                </h3>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-[#FFF8ED] text-[#D99A25] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <strong className="text-gray-900 font-semibold block text-sm">Direct Farmgate Sourcing &amp; Traceability</strong>
                  <span className="text-gray-600 leading-relaxed">
                    Source unadulterated produce straight from verified grower clusters with complete farm telemetry and harvest records.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-[#FFF8ED] text-[#D99A25] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <strong className="text-gray-900 font-semibold block text-sm">AI Certified Quality &amp; Defect Scoring</strong>
                  <span className="text-gray-600 leading-relaxed">
                    Pre-inspected produce telemetry including moisture content, size grading, and defect rates before you commit funds.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-[#FFF8ED] text-[#D99A25] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <strong className="text-gray-900 font-semibold block text-sm">Broadcast Demand &amp; Bulk Procurement (RFQ)</strong>
                  <span className="text-gray-600 leading-relaxed">
                    Post your buying requirement (e.g. 200 Qtl Export Onion) to receive competitive counter-bids from hundreds of farmers.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-[#FFF8ED] text-[#D99A25] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <strong className="text-gray-900 font-semibold block text-sm">Digital Invoicing &amp; E-Way Bills</strong>
                  <span className="text-gray-600 leading-relaxed">
                    Instant automated GST tax invoices, transit insurance, and live truck dispatch tracking from farmgate to destination.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => scrollToAuth('buyer')}
                className="w-full py-3 rounded-2xl text-xs font-bold text-[#063B2A] shadow-sm transition-all hover:bg-[#F4C44E]"
                style={{ background: '#F4C44E' }}
              >
                Access Buyer Procurement Portal →
              </button>
            </div>
          </div>
        </div>

        {/* How It Works - 4 Step Pipeline */}
        <div className="bg-[#063B2A] text-white rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h3 className="font-extrabold text-2xl">How माझे Kisan Works in 4 Simple Steps</h3>
            <p className="text-xs text-[#A8C4B0]">Transparent, hassle-free farm trading from sowing to settlement.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-white/10 rounded-2xl p-4 space-y-2 backdrop-blur-xs border border-white/10">
              <div className="w-8 h-8 rounded-full bg-[#F4C44E] text-[#063B2A] font-extrabold flex items-center justify-center text-sm">
                1
              </div>
              <h4 className="font-bold text-sm text-white">Crop Telemetry</h4>
              <p className="text-white/70 leading-relaxed text-[11px]">
                Farmers track plot size, sowing dates, expenses and growth progress with AI health assistance.
              </p>
            </div>

            <div className="bg-white/10 rounded-2xl p-4 space-y-2 backdrop-blur-xs border border-white/10">
              <div className="w-8 h-8 rounded-full bg-[#F4C44E] text-[#063B2A] font-extrabold flex items-center justify-center text-sm">
                2
              </div>
              <h4 className="font-bold text-sm text-white">AI Quality Assay</h4>
              <p className="text-white/70 leading-relaxed text-[11px]">
                Produces automated Grade A / B certificates with moisture and defect telemetry.
              </p>
            </div>

            <div className="bg-white/10 rounded-2xl p-4 space-y-2 backdrop-blur-xs border border-white/10">
              <div className="w-8 h-8 rounded-full bg-[#F4C44E] text-[#063B2A] font-extrabold flex items-center justify-center text-sm">
                3
              </div>
              <h4 className="font-bold text-sm text-white">Escrow Lock &amp; Logistics</h4>
              <p className="text-white/70 leading-relaxed text-[11px]">
                Buyer locks purchase funds into escrow. Verified mini trucks are dispatched to the farm.
              </p>
            </div>

            <div className="bg-white/10 rounded-2xl p-4 space-y-2 backdrop-blur-xs border border-white/10">
              <div className="w-8 h-8 rounded-full bg-[#F4C44E] text-[#063B2A] font-extrabold flex items-center justify-center text-sm">
                4
              </div>
              <h4 className="font-bold text-sm text-white">Instant Payout</h4>
              <p className="text-white/70 leading-relaxed text-[11px]">
                On delivery verification, escrow funds are released directly to the farmer&apos;s bank account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Login / Register Section (Below Website Info) ── */}
      <section id="auth-section" className="w-full py-12 px-4 sm:px-6 bg-[#EAF5EE]/50 border-t border-[#E2EBE5]">
        <div className="max-w-md mx-auto">
          <div
            className="w-full bg-white rounded-3xl shadow-xl border overflow-hidden transition-all"
            style={{
              borderColor: '#E2EBE5',
              boxShadow: '0 20px 40px -15px rgba(6, 59, 42, 0.12)',
            }}
          >
            {/* Card Header */}
            <div className="pt-8 pb-3 px-6 text-center">
              <div className="mb-3 flex justify-center">
                <BrandLogo className="text-[34px]" />
              </div>

              <h2 className="text-xl font-bold mt-3" style={{ color: '#17221D' }}>
                {isRegister ? 'Create Your Account' : 'Welcome Back!'}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: '#66736C' }}>
                {isRegister
                  ? `Register as a verified ${role === 'farmer' ? 'Farmer' : 'Buyer'} on माझे Kisan`
                  : `Login to access your ${role === 'farmer' ? 'Farmer' : 'Buyer'} Dashboard`}
              </p>
            </div>

            {/* Role Toggle Selector */}
            <div className="px-6 pb-4">
              <div className="p-1 rounded-2xl flex gap-1 border" style={{ background: '#F7F6F1', borderColor: '#E2EBE5' }}>
                <button
                  type="button"
                  onClick={() => setRole('farmer')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    role === 'farmer'
                      ? 'bg-[#063B2A] text-white shadow-md'
                      : 'text-[#66736C] hover:text-[#17221D]'
                  }`}
                >
                  <span>👨‍🌾</span>
                  <span>Farmer</span>
                  {role === 'farmer' && <span className="w-1.5 h-1.5 rounded-full bg-[#F4C44E]" />}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    role === 'buyer'
                      ? 'bg-[#063B2A] text-white shadow-md'
                      : 'text-[#66736C] hover:text-[#17221D]'
                  }`}
                >
                  <span>🏢</span>
                  <span>Buyer / Trader</span>
                  {role === 'buyer' && <span className="w-1.5 h-1.5 rounded-full bg-[#F4C44E]" />}
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3.5">
              {/* FARMER FIELDS */}
              {role === 'farmer' ? (
                <>
                  {isRegister && (
                    <div>
                      <label className="block text-[11px] font-semibold mb-1" style={{ color: '#66736C' }}>
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={farmerName}
                        onChange={(e) => setFarmerName(e.target.value)}
                        placeholder="e.g. Ramesh Patil"
                        className="w-full py-2.5 px-3.5 rounded-xl text-sm font-medium border outline-none transition-all focus:border-[#063B2A] focus:ring-1 focus:ring-[#063B2A]"
                        style={{ borderColor: '#E2EBE5', background: '#FFFFFF', color: '#17221D' }}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: '#66736C' }}>
                      Mobile Number / Kisan ID
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-xs font-bold text-gray-500">+91</span>
                      <input
                        type="tel"
                        required
                        value={farmerPhone}
                        onChange={(e) => setFarmerPhone(e.target.value)}
                        placeholder="98220 14589"
                        className="w-full py-2.5 pl-12 pr-3.5 rounded-xl text-sm font-medium border outline-none transition-all focus:border-[#063B2A] focus:ring-1 focus:ring-[#063B2A]"
                        style={{ borderColor: '#E2EBE5', background: '#FFFFFF', color: '#17221D' }}
                      />
                    </div>
                  </div>

                  {isRegister && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold mb-1" style={{ color: '#66736C' }}>
                          District &amp; State
                        </label>
                        <input
                          type="text"
                          value={farmerDistrict}
                          onChange={(e) => setFarmerDistrict(e.target.value)}
                          placeholder="e.g. Niphad, Nashik"
                          className="w-full py-2.5 px-3 rounded-xl text-xs font-medium border outline-none focus:border-[#063B2A]"
                          style={{ borderColor: '#E2EBE5', color: '#17221D' }}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold mb-1" style={{ color: '#66736C' }}>
                          Land Holding
                        </label>
                        <input
                          type="text"
                          value={farmerLand}
                          onChange={(e) => setFarmerLand(e.target.value)}
                          placeholder="e.g. 5.2 Acres"
                          className="w-full py-2.5 px-3 rounded-xl text-xs font-medium border outline-none focus:border-[#063B2A]"
                          style={{ borderColor: '#E2EBE5', color: '#17221D' }}
                        />
                      </div>
                    </div>
                  )}

                  {isRegister && (
                    <div>
                      <label className="block text-[11px] font-semibold mb-1" style={{ color: '#66736C' }}>
                        Primary Crops Grown
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {['Tomato', 'Onion', 'Brinjal', 'Potato', 'Grapes', 'Wheat'].map((c) => {
                          const isSel = selectedCrops.includes(c)
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => handleToggleCrop(c)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                isSel
                                  ? 'bg-[#EAF5EE] border-[#063B2A] text-[#063B2A]'
                                  : 'bg-white border-[#E2EBE5] text-gray-500 hover:border-gray-400'
                              }`}
                            >
                              {isSel ? '✓ ' : '+ '}{c}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold" style={{ color: '#66736C' }}>
                        Password
                      </label>
                      {!isRegister && (
                        <button
                          type="button"
                          onClick={handleStartOtpLogin}
                          className="text-[11px] font-semibold hover:underline"
                          style={{ color: '#063B2A' }}
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={farmerPassword}
                        onChange={(e) => setFarmerPassword(e.target.value)}
                        placeholder="Enter your secure password"
                        className="w-full py-2.5 pl-3.5 pr-10 rounded-xl text-sm font-medium border outline-none transition-all focus:border-[#063B2A]"
                        style={{ borderColor: '#E2EBE5', background: '#FFFFFF', color: '#17221D' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-gray-400 hover:text-gray-600 text-xs font-medium"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* BUYER FIELDS */
                <>
                  {isRegister && (
                    <>
                      <div>
                        <label className="block text-[11px] font-semibold mb-1" style={{ color: '#66736C' }}>
                          Company / Business Name
                        </label>
                        <input
                          type="text"
                          required
                          value={buyerCompany}
                          onChange={(e) => setBuyerCompany(e.target.value)}
                          placeholder="e.g. Deccan Fresh Exports Pvt Ltd"
                          className="w-full py-2.5 px-3.5 rounded-xl text-sm font-medium border outline-none focus:border-[#063B2A]"
                          style={{ borderColor: '#E2EBE5', color: '#17221D' }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold mb-1" style={{ color: '#66736C' }}>
                            Contact Person
                          </label>
                          <input
                            type="text"
                            value={buyerPersonName}
                            onChange={(e) => setBuyerPersonName(e.target.value)}
                            placeholder="e.g. Sunil Kulkarni"
                            className="w-full py-2.5 px-3 rounded-xl text-xs font-medium border outline-none focus:border-[#063B2A]"
                            style={{ borderColor: '#E2EBE5', color: '#17221D' }}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1" style={{ color: '#66736C' }}>
                            Buyer Category
                          </label>
                          <select
                            value={buyerType}
                            onChange={(e) => setBuyerType(e.target.value as any)}
                            className="w-full py-2.5 px-2 rounded-xl text-xs font-medium border outline-none focus:border-[#063B2A]"
                            style={{ borderColor: '#E2EBE5', color: '#17221D' }}
                          >
                            <option value="Exporter">Exporter</option>
                            <option value="Wholesale Trader">Wholesaler / Mandi Trader</option>
                            <option value="Food Processor">Food Processing Firm</option>
                            <option value="Retail Chain">Retail Chain / D2C</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold mb-1" style={{ color: '#66736C' }}>
                            GSTIN / APMC License
                          </label>
                          <input
                            type="text"
                            value={buyerGstin}
                            onChange={(e) => setBuyerGstin(e.target.value)}
                            placeholder="27AABCD8921M1Z5"
                            className="w-full py-2.5 px-3 rounded-xl text-xs font-mono font-medium border outline-none focus:border-[#063B2A]"
                            style={{ borderColor: '#E2EBE5', color: '#17221D' }}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1" style={{ color: '#66736C' }}>
                            Procurement Hub
                          </label>
                          <input
                            type="text"
                            value={buyerHub}
                            onChange={(e) => setBuyerHub(e.target.value)}
                            placeholder="e.g. Pune / Vashi Hub"
                            className="w-full py-2.5 px-3 rounded-xl text-xs font-medium border outline-none focus:border-[#063B2A]"
                            style={{ borderColor: '#E2EBE5', color: '#17221D' }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: '#66736C' }}>
                      Business Email or Mobile
                    </label>
                    <input
                      type="text"
                      required
                      value={buyerEmailOrPhone}
                      onChange={(e) => setBuyerEmailOrPhone(e.target.value)}
                      placeholder="sunil@deccanfresh.com or 98450 98211"
                      className="w-full py-2.5 px-3.5 rounded-xl text-sm font-medium border outline-none focus:border-[#063B2A]"
                      style={{ borderColor: '#E2EBE5', color: '#17221D' }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold" style={{ color: '#66736C' }}>
                        Password
                      </label>
                      {!isRegister && (
                        <button
                          type="button"
                          onClick={handleStartOtpLogin}
                          className="text-[11px] font-semibold hover:underline"
                          style={{ color: '#063B2A' }}
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={buyerPassword}
                        onChange={(e) => setBuyerPassword(e.target.value)}
                        placeholder="Enter company password"
                        className="w-full py-2.5 pl-3.5 pr-10 rounded-xl text-sm font-medium border outline-none focus:border-[#063B2A]"
                        style={{ borderColor: '#E2EBE5', color: '#17221D' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-gray-400 hover:text-gray-600 text-xs font-medium"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Primary Action Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-95 active:scale-[0.99] shadow-md mt-2"
                style={{ background: '#063B2A' }}
              >
                <span>{role === 'farmer' ? '🌾' : '🏢'}</span>
                <span>
                  {isRegister
                    ? role === 'farmer'
                      ? 'Register & Open Farmer Dashboard →'
                      : 'Register & Open Buyer Portal →'
                    : role === 'farmer'
                    ? 'Login to Farmer Dashboard →'
                    : 'Login to Buyer Portal →'}
                </span>
              </button>

              {/* OTP login option */}
              {!isRegister && (
                <button
                  type="button"
                  onClick={handleStartOtpLogin}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold border transition-all hover:bg-gray-50 flex items-center justify-center gap-1.5"
                  style={{ borderColor: '#E2EBE5', color: '#063B2A' }}
                >
                  <span>📱</span>
                  <span>Continue with Instant OTP Login</span>
                </button>
              )}

              {/* Mode toggle */}
              <div className="pt-2 text-center text-xs" style={{ color: '#66736C' }}>
                {isRegister ? (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setIsRegister(false)}
                      className="font-bold underline hover:opacity-80"
                      style={{ color: '#063B2A' }}
                    >
                      Login here
                    </button>
                  </span>
                ) : (
                  <span>
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setIsRegister(true)}
                      className="font-bold underline hover:opacity-80"
                      style={{ color: '#063B2A' }}
                    >
                      Register as {role === 'farmer' ? 'Farmer' : 'Buyer'}
                    </button>
                  </span>
                )}
              </div>
            </form>

            {/* Bottom Security Badge */}
            <div
              className="px-6 py-3.5 border-t flex items-center justify-between text-[11px]"
              style={{ background: '#EAF5EE', borderColor: '#C4DFD0', color: '#063B2A' }}
            >
              <div className="flex items-center gap-1.5 font-semibold">
                <span>🛡️</span>
                <span>100% Escrow Protected Agri-Trade</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 font-medium">
                <span>AI Assayed</span>
                <span>·</span>
                <span>Direct Farmgate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="w-full bg-[#063B2A] text-white/70 py-6 px-4 text-center text-xs border-t border-white/10">
        <div className="max-w-5xl mx-auto space-y-2">
          <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
            <BrandLogo tone="light" className="text-[24px]" />
            <span className="hidden sm:inline">•</span>
            <span className="font-normal text-white/80">Better Markets. Stronger Farmers.</span>
          </div>
          <p className="text-[11px] text-white/50">
            Direct Farm-to-Buyer Marketplace with AI Quality Grading, Logistics &amp; Escrow Protection.
          </p>
        </div>
      </footer>

      {/* OTP Modal */}
      {showOtpModal && (
        <OTPModal
          phone={role === 'farmer' ? farmerPhone : buyerEmailOrPhone}
          role={role}
          initialOtp={devOtp}
          onVerify={handleOtpVerify}
          onClose={() => setShowOtpModal(false)}
        />
      )}
    </div>
  )
}

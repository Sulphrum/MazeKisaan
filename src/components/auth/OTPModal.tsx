import { useState, useEffect } from 'react'
import { BrandLogo } from '../common/BrandLogo'

export function OTPModal({
  phone,
  role,
  initialOtp,
  onVerify,
  onClose,
}: {
  phone: string
  role: 'farmer' | 'buyer'
  initialOtp?: string
  onVerify: (otp: string) => void
  onClose: () => void
}) {
  const [otp, setOtp] = useState(() => {
    const value = initialOtp || ''
    return Array.from({ length: 6 }, (_, i) => value[i] || '')
  })
  const [timer, setTimer] = useState(30)

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer((prev) => prev - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [timer])

  const handleDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const newOtp = [...otp]
    newOtp[index] = val.slice(-1)
    setOtp(newOtp)
    if (val && index < 3) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`)
      prevInput?.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border" style={{ borderColor: '#E2EBE5' }}>
        <div className="text-center mb-5">
          <BrandLogo className="mb-4 text-[28px]" />
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: '#EAF5EE', color: '#063B2A' }}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="7" y="2.5" width="10" height="19" rx="2" />
              <path d="M10 5h4M11 18.5h2" />
            </svg>
          </div>
          <h3 className="text-xl font-bold" style={{ color: '#17221D' }}>
            Verify Mobile Number
          </h3>
          <p className="text-xs mt-1" style={{ color: '#66736C' }}>
            Enter the 6-digit verification code sent to{' '}
            <span className="font-semibold" style={{ color: '#063B2A' }}>
              +91 {phone || '98220 14589'}
            </span>
          </p>
          <span
            className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: '#FFF8ED', color: '#D99A25' }}
          >
            Logging in as {role === 'farmer' ? 'Farmer' : 'Buyer'}
          </span>
        </div>

        {/* 6-digit input */}
        <div className="flex justify-center gap-3 mb-6">
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-input-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-11 h-14 text-center text-2xl font-bold rounded-2xl border-2 outline-none transition-all focus:scale-105"
              style={{
                borderColor: digit ? '#063B2A' : '#E2EBE5',
                background: digit ? '#EAF5EE' : '#FFFFFF',
                color: '#063B2A',
              }}
            />
          ))}
        </div>

        <div className="text-center text-xs mb-5" style={{ color: '#66736C' }}>
          {timer > 0 ? (
            <span>Resend OTP in <strong style={{ color: '#063B2A' }}>00:{timer < 10 ? `0${timer}` : timer}</strong></span>
          ) : (
            <button
              onClick={() => setTimer(30)}
              className="font-bold underline hover:opacity-80"
              style={{ color: '#063B2A' }}
            >
              Resend OTP Code
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          <button
            onClick={() => onVerify(otp.join(''))}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.99] shadow-md"
            style={{ background: '#063B2A' }}
          >
            Verify &amp; Enter Dashboard →
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-semibold rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

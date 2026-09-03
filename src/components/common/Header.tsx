import { useState } from 'react'
import { User } from '../../types'
import { BrandLogo } from './BrandLogo'

export function Header({
  user,
  onLogout,
  onOpenNotifications,
  unreadCount = 3,
}: {
  user: User
  onLogout: () => void
  onOpenNotifications: () => void
  unreadCount?: number
}) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const isFarmer = user.role === 'farmer'

  return (
    <header className="sticky top-0 z-40 px-4 py-3" style={{ background: '#063B2A' }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <BrandLogo tone="light" className="text-[27px] sm:text-[30px]" />
            <div className="hidden sm:block">
              <span
                className="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: isFarmer ? 'rgba(35, 139, 91, 0.4)' : 'rgba(244, 196, 78, 0.25)',
                  color: isFarmer ? '#A8E6CF' : '#F4C44E',
                  borderColor: isFarmer ? 'rgba(168, 230, 207, 0.3)' : 'rgba(244, 196, 78, 0.4)',
                }}
              >
                {isFarmer ? 'Farmer Hub' : 'Buyer Portal'}
              </span>
              <div className="mt-1 text-[10px]" style={{ color: '#A8C4B0' }}>
                {isFarmer ? 'Farm to buyer market' : 'Direct crop sourcing'}
              </div>
            </div>
          </div>
        </div>

        {/* Center / Right: Quick Actions & Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Location Badge */}
          <div
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
            style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#D4EBD9' }}
          >
            <span className="text-sm">📍</span>
            <span>{user.location.split(',')[0]}</span>
          </div>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-white/80 hover:text-white transition-colors hover:bg-white/10"
            title="Notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center shadow"
                style={{ background: '#F4C44E', color: '#063B2A' }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Profile Menu Chip */}
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-colors hover:bg-white/10"
              style={{ background: '#0B4F3A' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: isFarmer ? '#238B5B' : '#D99A25' }}
              >
                {user.avatar || (user.name ? user.name.slice(0, 2).toUpperCase() : 'U')}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-white text-xs font-semibold leading-tight truncate max-w-[120px]">
                  {user.name}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: '#A8C4B0' }}>
                  {isFarmer ? 'Farmer · ' + (user.landSize || '5.2 Acres') : user.companyName || 'Buyer'}
                </div>
              </div>
              <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Profile Dropdown */}
            {profileMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                <div
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border p-2 z-50 animate-in slide-in-from-top-2"
                  style={{ borderColor: '#E2EBE5' }}
                >
                  <div className="p-3 rounded-xl mb-2" style={{ background: '#EAF5EE' }}>
                    <div className="font-bold text-sm" style={{ color: '#063B2A' }}>
                      {user.name}
                    </div>
                    <div className="text-xs" style={{ color: '#66736C' }}>
                      {user.phone}
                    </div>
                    <div className="text-xs mt-1 font-medium" style={{ color: '#238B5B' }}>
                      📍 {user.location}
                    </div>
                    {user.companyName && (
                      <div className="text-[11px] font-semibold mt-1" style={{ color: '#0B4F3A' }}>
                        🏢 {user.companyName}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false)
                        onLogout()
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 text-red-600 transition-colors hover:bg-red-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Sign Out &amp; Return to Login
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

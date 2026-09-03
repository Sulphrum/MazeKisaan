import { useEffect, useState } from 'react'
import { User } from './types'
import { api } from './services/api'
import { PublicEntry } from './components/auth/PublicEntry'
import { Header } from './components/common/Header'
import { FarmerDashboard } from './components/farmer/FarmerDashboard'
import { FarmerPortalTheme } from './components/farmer/FarmerPortalTheme'
import { BuyerWorkspace } from './components/buyer/BuyerWorkspace'
import { NotificationPanel } from './components/common/NotificationPanel'
import { ToastContainer, ToastMessage } from './components/common/Toast'

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    api.auth.getMe().then((user) => {
      if (user) setCurrentUser(user)
    })
  }, [])

  useEffect(() => {
    const handleExpiredSession = () => setCurrentUser(null)
    window.addEventListener('kisansetu-auth-expired', handleExpiredSession)
    return () => window.removeEventListener('kisansetu-auth-expired', handleExpiredSession)
  }, [])

  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = (title: string, message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = 'toast_' + Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, title, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 4500)
  }

  const removeToast = (id: string) => setToasts((prev) => prev.filter((toast) => toast.id !== id))

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user)
    addToast(
      `Welcome, ${user.name}!`,
      user.role === 'farmer'
        ? 'Redirected to your माझे Kisan Farmer Dashboard.'
        : `Redirected to ${user.companyName || 'Buyer'} Procurement Portal.`,
      'success'
    )
  }

  const handleLogout = () => {
    api.auth.logout()
    setCurrentUser(null)
    addToast('Signed Out', 'You have been safely signed out of माझे Kisan.', 'info')
  }

  if (!currentUser) {
    return (
      <>
        <ToastContainer toasts={toasts} onClose={removeToast} />
        <PublicEntry onLoginSuccess={handleLoginSuccess} />
      </>
    )
  }

  if (currentUser.role === 'farmer') {
    return (
      <>
        <ToastContainer toasts={toasts} onClose={removeToast} />
        <FarmerPortalTheme>
          <FarmerDashboard user={currentUser} onLogout={handleLogout} />
        </FarmerPortalTheme>
      </>
    )
  }

  return (
    <FarmerPortalTheme>
      <div className="min-h-screen" style={{ background: '#F7F6F1', fontFamily: "'Inter', sans-serif" }}>
        <ToastContainer toasts={toasts} onClose={removeToast} />
        <Header user={currentUser} onLogout={handleLogout} onOpenNotifications={() => setNotificationsOpen(true)} />
        <BuyerWorkspace user={currentUser} onNotify={addToast} />
        <NotificationPanel isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      </div>
    </FarmerPortalTheme>
  )
}

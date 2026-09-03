import { useEffect, useState } from 'react'
import { User } from '../../types'
import { BuyerPublicHome } from './BuyerPublicHome'
import { FarmerPublicHome } from './FarmerPublicHome'
import { LandingHome } from './LandingHome'

type PublicView = 'main' | 'farmer' | 'buyer'

function viewFromHash(): PublicView {
  const hash = window.location.hash.replace('#', '')
  if (hash === 'farmer' || hash === 'buyer') return hash
  return 'main'
}

export function PublicEntry({ onLoginSuccess }: { onLoginSuccess: (user: User) => void }) {
  const [view, setView] = useState<PublicView>(viewFromHash)

  useEffect(() => {
    const handleHashChange = () => setView(viewFromHash())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigate = (nextView: PublicView) => {
    if (nextView === 'main') {
      history.pushState(null, '', `${window.location.pathname}${window.location.search}`)
      setView('main')
    } else {
      window.location.hash = nextView
      setView(nextView)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (view === 'farmer') {
    return (
      <FarmerPublicHome
        onBack={() => navigate('main')}
        onBuyerHome={() => navigate('buyer')}
        onLoginSuccess={onLoginSuccess}
      />
    )
  }

  if (view === 'buyer') {
    return (
      <BuyerPublicHome
        onBack={() => navigate('main')}
        onFarmerHome={() => navigate('farmer')}
        onLoginSuccess={onLoginSuccess}
      />
    )
  }

  return (
    <LandingHome
      onFarmerStart={() => navigate('farmer')}
      onBuyerStart={() => navigate('buyer')}
    />
  )
}

import { useState } from 'react'

export interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  unread: boolean
  category: 'trade' | 'price' | 'scheme' | 'system'
  icon: string
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'New Bid Received for Tomato',
    description: 'Deccan Fresh Exports has offered ₹2,580/Qtl for 60 Quintals.',
    time: '10 mins ago',
    unread: true,
    category: 'trade',
    icon: '💰',
  },
  {
    id: 'n2',
    title: 'Market Alert: Onion Prices Up 3%',
    description: 'Lasalgaon Mandi modal price reached ₹2,250/Qtl today.',
    time: '1 hour ago',
    unread: true,
    category: 'price',
    icon: '📈',
  },
  {
    id: 'n3',
    title: 'Escrow Payment Protected',
    description: '₹1,54,800 secured in माझे Kisan Escrow for Order #KS-8921.',
    time: '3 hours ago',
    unread: true,
    category: 'trade',
    icon: '🔒',
  },
  {
    id: 'n4',
    title: 'PM-KISAN 17th Installment',
    description: 'Application eligible for upcoming direct benefit transfer.',
    time: '1 day ago',
    unread: false,
    category: 'scheme',
    icon: '🌾',
  },
]

export function NotificationPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)

  if (!isOpen) return null

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const unreadCount = notifications.filter((n) => n.unread).length

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="fixed top-16 right-4 sm:right-8 z-50 w-[92vw] max-w-sm bg-white rounded-2xl shadow-2xl border overflow-hidden animate-in slide-in-from-top-2"
        style={{ borderColor: '#E2EBE5' }}
      >
        {/* Header */}
        <div className="px-4 py-3.5 flex items-center justify-between border-b" style={{ borderColor: '#F0F4F2', background: '#F7F6F1' }}>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm" style={{ color: '#17221D' }}>Notifications</span>
            {unreadCount > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: '#F4C44E', color: '#063B2A' }}
              >
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold hover:underline"
                style={{ color: '#063B2A' }}
              >
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none p-1">
              ×
            </button>
          </div>
        </div>

        {/* List */}
        <div className="max-h-[380px] overflow-y-auto divide-y" style={{ borderColor: '#F0F4F2' }}>
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 transition-colors hover:bg-gray-50 flex items-start gap-3 ${
                item.unread ? 'bg-[#EAF5EE]/40' : 'bg-white'
              }`}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{ background: item.unread ? '#C4DFD0' : '#F0F4F2' }}
              >
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-xs truncate" style={{ color: '#17221D' }}>
                    {item.title}
                  </span>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">{item.time}</span>
                </div>
                <p className="text-[11px] mt-0.5 leading-snug line-clamp-2" style={{ color: '#66736C' }}>
                  {item.description}
                </p>
              </div>
              {item.unread && (
                <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#238B5B' }} />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-2.5 text-center border-t bg-gray-50/70" style={{ borderColor: '#F0F4F2' }}>
          <span className="text-[11px] font-medium" style={{ color: '#66736C' }}>
            🔔 Live push updates enabled via माझे Kisan Network
          </span>
        </div>
      </div>
    </>
  )
}

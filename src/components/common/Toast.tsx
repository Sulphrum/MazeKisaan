export interface ToastMessage {
  id: string
  title: string
  message: string
  type?: 'success' | 'info' | 'warning'
}

export function ToastContainer({ toasts, onClose }: { toasts: ToastMessage[]; onClose: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto p-3.5 rounded-2xl shadow-xl border flex items-start gap-3 bg-white transition-all animate-in slide-in-from-top-3"
          style={{
            borderColor: t.type === 'warning' ? '#F0D9A8' : t.type === 'info' ? '#C4DFD0' : '#238B5B',
            boxShadow: '0 8px 24px -4px rgba(6, 59, 42, 0.15)',
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
            style={{
              background: t.type === 'warning' ? '#FFF8ED' : t.type === 'info' ? '#EAF5EE' : '#EAF5EE',
              color: t.type === 'warning' ? '#D99A25' : '#238B5B',
            }}
          >
            {t.type === 'warning' ? '⚠️' : t.type === 'info' ? 'ℹ️' : '✓'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm" style={{ color: '#17221D' }}>{t.title}</div>
            <div className="text-xs mt-0.5" style={{ color: '#66736C' }}>{t.message}</div>
          </div>
          <button
            onClick={() => onClose(t.id)}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none p-1"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

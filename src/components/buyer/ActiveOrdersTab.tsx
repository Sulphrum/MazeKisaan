import { useState } from 'react'
import { OrderItem } from '../../types'

export function ActiveOrdersTab({
  orders,
  onReleaseEscrow,
}: {
  orders: OrderItem[]
  onReleaseEscrow: (orderId: string) => void
}) {
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null)

  const steps = ['Escrow Funded', 'Pickup Scheduled', 'In Transit', 'Quality Verified', 'Completed']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#17221D]">
          Procurement Contracts &amp; Escrow Orders
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Track live vehicle dispatches, quality inspections and release payments to farmers upon verification.
        </p>
      </div>

      {/* Active Orders List */}
      <div className="space-y-4">
        {orders.map((ord) => {
          const isCompleted = ord.status === 'Completed'
          return (
            <div
              key={ord.id}
              className="bg-white rounded-3xl border shadow-sm p-5 space-y-4 transition-all hover:shadow-md"
              style={{ borderColor: '#E2EBE5' }}
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm"
                    style={{ background: '#EAF5EE', color: '#063B2A' }}
                  >
                    {ord.cropName === 'Tomato' ? '🍅' : ord.cropName === 'Onion' ? '🧅' : '🍆'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-[#17221D]">
                        Order #{ord.id}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isCompleted
                            ? 'bg-[#EAF5EE] text-[#238B5B]'
                            : 'bg-[#FFF8ED] text-[#D99A25]'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {ord.cropName} ({ord.variety}) • <strong>{ord.quantityQtl} Quintals</strong> • Farmer: {ord.farmerName} ({ord.farmerLocation})
                    </div>
                  </div>
                </div>

                <div className="text-right self-end sm:self-auto">
                  <div className="text-xs text-gray-400">Total Contract Value</div>
                  <div className="text-xl font-extrabold text-[#063B2A]">
                    ₹{ord.totalAmount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-[#238B5B] font-semibold">
                    {ord.escrowLocked ? '🔒 100% Escrow Protected' : '✓ Settled to Farmer'}
                  </div>
                </div>
              </div>

              {/* Progress Stepper (As in Image 2 Screen 2 timeline) */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2">
                  <span>Logistics: <strong>{ord.transportVehicle}</strong></span>
                  <span>ETA: <strong className="text-[#063B2A]">{ord.deliveryETA}</strong></span>
                </div>

                <div className="grid grid-cols-5 gap-1 text-center">
                  {steps.map((st, i) => {
                    const stepNum = i + 1
                    const isDone = ord.statusStep > stepNum
                    const isCurrent = ord.statusStep === stepNum
                    return (
                      <div key={st} className="flex flex-col items-center gap-1.5">
                        <div
                          className={`w-full h-2 rounded-full transition-all ${
                            isDone || isCurrent ? (isDone ? 'bg-[#238B5B]' : 'bg-[#F4C44E]') : 'bg-gray-100'
                          }`}
                        />
                        <span
                          className={`text-[10px] leading-tight ${
                            isCurrent
                              ? 'font-bold text-[#063B2A]'
                              : isDone
                              ? 'font-semibold text-gray-700'
                              : 'text-gray-400'
                          }`}
                        >
                          {st}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-gray-500">
                  <span>Quality Assay: <strong className="text-gray-800">{ord.qualityGrade}</strong></span>
                  <span>•</span>
                  <span>Ordered on: {ord.date}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedOrder(ord)}
                    className="px-3 py-1.5 rounded-xl font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    📄 View E-Way Bill &amp; Invoice
                  </button>

                  {!isCompleted && ord.statusStep >= 4 && (
                    <button
                      onClick={() => onReleaseEscrow(ord.id)}
                      className="px-4 py-1.5 rounded-xl font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                      style={{ background: '#238B5B' }}
                    >
                      ✓ Approve Quality &amp; Release Escrow Payout
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* E-Way Bill Modal Preview */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border" style={{ borderColor: '#E2EBE5' }}>
            <div className="flex items-center justify-between pb-3 border-b mb-3" style={{ borderColor: '#F0F4F2' }}>
              <div>
                <h3 className="font-bold text-base text-[#17221D]">Digital E-Way Bill &amp; Invoice</h3>
                <p className="text-xs text-gray-400">Order #{selectedOrder.id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 font-bold text-lg">×</button>
            </div>

            <div className="space-y-3 text-xs bg-[#F7F6F1] p-4 rounded-2xl border border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-500">Consignor (Farmer):</span>
                <span className="font-bold">{selectedOrder.farmerName} ({selectedOrder.farmerLocation})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Consignee (Buyer):</span>
                <span className="font-bold">{selectedOrder.buyerCompany}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Commodity:</span>
                <span className="font-semibold">{selectedOrder.cropName} ({selectedOrder.variety})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Assigned Vehicle:</span>
                <span className="font-mono font-semibold">{selectedOrder.transportVehicle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Quality Certified:</span>
                <span className="font-bold text-[#238B5B]">{selectedOrder.qualityGrade}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-300 font-extrabold text-[#063B2A] text-sm">
                <span>Invoice Total:</span>
                <span>₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full mt-4 py-2.5 rounded-xl font-bold text-xs text-white"
              style={{ background: '#063B2A' }}
            >
              Download PDF Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

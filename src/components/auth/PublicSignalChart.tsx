import { useState, type PointerEvent } from 'react'

interface SignalPoint {
  label: string
  value: number
  kind?: 'past' | 'future'
}

export function PublicSignalChart({ points, valueLabel = '₹' }: { points: SignalPoint[]; valueLabel?: string }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const width = 760
  const height = 260
  const padX = 52
  const padTop = 24
  const padBottom = 42
  const values = points.map((point) => point.value)
  const min = Math.min(...values) * 0.97
  const max = Math.max(...values) * 1.03
  const range = Math.max(1, max - min)
  const plotWidth = width - padX * 2
  const xFor = (index: number) => padX + index * (plotWidth / Math.max(1, points.length - 1))
  const yFor = (value: number) => padTop + (max - value) * ((height - padTop - padBottom) / range)
  const past = points.filter((point) => point.kind !== 'future')
  const future = points.filter((point) => point.kind === 'future')
  const lastPastIndex = Math.max(0, past.length - 1)
  const pastPoints = points.slice(0, lastPastIndex + 1).map((point, index) => `${xFor(index)},${yFor(point.value)}`).join(' ')
  const futurePoints = points.slice(lastPastIndex).map((point, offset) => `${xFor(lastPastIndex + offset)},${yFor(point.value)}`).join(' ')
  const axisLabels = [
    { index: 0, label: points[0]?.label },
    { index: lastPastIndex, label: `Today · ${points[lastPastIndex]?.label}` },
    { index: points.length - 1, label: points[points.length - 1]?.label },
  ]
  const gridValues = [max, min + range / 2, min]
  const activePoint = activeIndex === null ? null : points[activeIndex]
  const activeX = activeIndex === null ? 0 : xFor(activeIndex)
  const activeY = activePoint ? yFor(activePoint.value) : 0
  const tooltipWidth = 152
  const tooltipHeight = 58
  const tooltipX = activeX > width - padX - tooltipWidth - 10 ? activeX - tooltipWidth - 12 : activeX + 12
  const tooltipY = Math.max(padTop + 2, Math.min(height - padBottom - tooltipHeight - 4, activeY - tooltipHeight / 2))

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const viewX = (event.clientX - rect.left) * (width / Math.max(1, rect.width))
    const rawIndex = Math.round(((viewX - padX) / Math.max(1, plotWidth)) * Math.max(1, points.length - 1))
    setActiveIndex(Math.max(0, Math.min(points.length - 1, rawIndex)))
  }

  return (
    <div className="overflow-hidden border" style={{ background: '#FFFEFA', borderColor: '#DDE4DE' }}>
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3 text-xs" style={{ borderColor: '#E5E9E5', color: '#687069' }}>
        <div className="flex items-center gap-4"><span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-[#173F2A]" />Past and today</span><span className="flex items-center gap-2"><span className="h-0.5 w-5 border-t-2 border-dashed border-[#C18A32]" />Expected next</span></div>
        <span className="hidden sm:inline">Move over the line to see prices</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full select-none"
        role="img"
        aria-label="Interactive past and expected price chart"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setActiveIndex(null)}
        style={{ cursor: 'crosshair', touchAction: 'pan-y' }}
      >
        {gridValues.map((value) => {
          const y = yFor(value)
          return <g key={value}><line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#E5E9E5" /><text x={8} y={y + 4} fontSize="11" fill="#7A827B">{valueLabel}{Math.round(value).toLocaleString('en-IN')}</text></g>
        })}
        {future.length > 0 && <line x1={xFor(lastPastIndex)} y1={padTop} x2={xFor(lastPastIndex)} y2={height - padBottom} stroke="#C9CFC9" strokeDasharray="4 5" />}
        <polyline points={pastPoints} fill="none" stroke="#173F2A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {future.length > 0 && <polyline points={futurePoints} fill="none" stroke="#C18A32" strokeWidth="4" strokeDasharray="8 7" strokeLinecap="round" strokeLinejoin="round" />}
        <circle cx={xFor(lastPastIndex)} cy={yFor(points[lastPastIndex]?.value || 0)} r="4.5" fill="#173F2A" stroke="#FFFEFA" strokeWidth="2" />
        {axisLabels.map(({ index, label }) => <text key={index} x={xFor(index)} y={height - 16} textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'} fontSize="11" fontWeight={index === lastPastIndex ? '700' : '400'} fill={index === lastPastIndex ? '#173F2A' : '#7A827B'}>{label}</text>)}

        {activePoint && <g pointerEvents="none">
          <line x1={activeX} y1={padTop} x2={activeX} y2={height - padBottom} stroke="#7B8C80" strokeWidth="1.2" strokeDasharray="4 4" />
          <circle cx={activeX} cy={activeY} r="7" fill="#FFFEFA" stroke={activePoint.kind === 'future' ? '#C18A32' : '#173F2A'} strokeWidth="3" />
          <g transform={`translate(${tooltipX} ${tooltipY})`}>
            <rect width={tooltipWidth} height={tooltipHeight} rx="7" fill="#173F2A" />
            <text x="12" y="19" fontSize="11" fontWeight="600" fill="#C8D8CC">{activePoint.kind === 'future' ? 'Expected price' : activeIndex === lastPastIndex ? 'Today’s price' : 'Recorded price'} · {activePoint.label}</text>
            <text x="12" y="43" fontSize="18" fontWeight="700" fill="#FFFFFF">{valueLabel}{Math.round(activePoint.value).toLocaleString('en-IN')}</text>
          </g>
        </g>}
        <rect x={padX} y={padTop} width={plotWidth} height={height - padTop - padBottom} fill="transparent" />
      </svg>
    </div>
  )
}

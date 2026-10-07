import type { NamedSeries, SeriesPoint } from '../../data/executiveDashboard.ts'
import type { ReactNode } from 'react'

const cardClass = 'rounded-lg border border-line bg-canvas p-4 shadow-card'

export function ChartCard({
  title,
  hint,
  action,
  children,
}: {
  title: string
  hint?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-sans text-sm font-semibold text-ink">{title}</h3>
          {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

type Tone = 'indigo' | 'danger' | 'warning' | 'muted' | 'success'

function strokeClass(tone: Tone) {
  if (tone === 'danger') return 'stroke-danger'
  if (tone === 'success') return 'stroke-success'
  if (tone === 'warning') return 'stroke-warning'
  if (tone === 'muted') return 'stroke-outline'
  return 'stroke-indigo'
}

function fillClass(tone: Tone) {
  if (tone === 'danger') return 'fill-danger'
  if (tone === 'success') return 'fill-success'
  if (tone === 'warning') return 'fill-warning'
  if (tone === 'muted') return 'fill-outline'
  return 'fill-indigo'
}

function formatTick(value: number) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}k`
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function layout(points: SeriesPoint[], width: number, height: number, pad = { l: 44, r: 12, t: 16, b: 32 }, floorZero = false) {
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  const values = points.map((point) => point.value)
  const min = floorZero ? 0 : Math.min(...values)
  const max = Math.max(...values, min + 1)
  const span = max - min || 1
  const x = (index: number) => pad.l + (points.length <= 1 ? innerW / 2 : (index / (points.length - 1)) * innerW)
  const y = (value: number) => pad.t + innerH - ((value - min) / span) * innerH
  const ticks = [min, min + span / 2, max]
  return { pad, innerW, innerH, min, max, span, x, y, ticks, width, height }
}

function linePath(points: SeriesPoint[], x: (index: number) => number, y: (value: number) => number) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(point.value)}`).join(' ')
}

function Axis({
  points,
  x,
  y,
  ticks,
  width,
  height,
  pad,
  sparse = 4,
}: {
  points: SeriesPoint[]
  x: (index: number) => number
  y: (value: number) => number
  ticks: number[]
  width: number
  height: number
  pad: { l: number; r: number; t: number; b: number }
  sparse?: number
}) {
  const step = Math.max(1, Math.ceil(points.length / sparse))
  return (
    <>
      {ticks.map((tick, index) => (
        <g key={`tick-${index}`}>
          <line x1={pad.l} x2={width - pad.r} y1={y(tick)} y2={y(tick)} className="stroke-line" strokeWidth="1" />
          <text x={pad.l - 8} y={y(tick) + 3} textAnchor="end" className="fill-muted font-mono" fontSize="9">
            {formatTick(tick)}
          </text>
        </g>
      ))}
      {points.map((point, index) =>
        index % step === 0 || index === points.length - 1 ? (
          <text key={point.label} x={x(index)} y={height - 10} textAnchor="middle" className="fill-muted font-mono" fontSize="9">
            {point.label}
          </text>
        ) : null,
      )}
    </>
  )
}

export function AreaLineChart({
  points,
  height = 220,
  tone = 'indigo',
  label,
  current,
}: {
  points: SeriesPoint[]
  height?: number
  tone?: Tone
  label: string
  current?: string
}) {
  const width = 920
  const geo = layout(points, width, height, { l: 44, r: 48, t: 20, b: 32 })
  const line = linePath(points, geo.x, geo.y)
  const last = points[points.length - 1]
  const lastX = geo.x(points.length - 1)
  const lastY = last ? geo.y(last.value) : 0
  const area = `${line} L ${lastX} ${height - geo.pad.b} L ${geo.pad.l} ${height - geo.pad.b} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 w-full" role="img" aria-label={label}>
      <Axis points={points} {...geo} sparse={6} />
      <path d={area} className={fillClass(tone)} opacity="0.12" />
      <path d={line} fill="none" className={strokeClass(tone)} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {last ? (
        <>
          <circle cx={lastX} cy={lastY} r="4.5" className={`${fillClass(tone)} stroke-canvas`} strokeWidth="2" />
          {current ? (
            <text x={lastX - 6} y={lastY - 10} textAnchor="end" className="fill-ink font-mono" fontSize="11">
              {current}
            </text>
          ) : null}
        </>
      ) : null}
    </svg>
  )
}

export function LineChart({
  points,
  height = 200,
  tone = 'indigo',
  label,
  spikeFrom,
}: {
  points: SeriesPoint[]
  height?: number
  tone?: Tone
  label: string
  spikeFrom?: number
}) {
  const width = 520
  const geo = layout(points, width, height, { l: 40, r: 12, t: 12, b: 32 }, true)
  const line = linePath(points, geo.x, geo.y)
  const spikeIndex = spikeFrom ?? -1
  const areaPoints = spikeIndex >= 0 ? points.slice(spikeIndex) : []
  const area =
    areaPoints.length > 1
      ? `${areaPoints
          .map((point, index) => `${index === 0 ? 'M' : 'L'} ${geo.x(spikeIndex + index)} ${geo.y(point.value)}`)
          .join(' ')} L ${geo.x(points.length - 1)} ${geo.y(0)} L ${geo.x(spikeIndex)} ${geo.y(0)} Z`
      : null

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 w-full" role="img" aria-label={label}>
      <Axis points={points} {...geo} sparse={5} />
      {area ? <path d={area} className="fill-danger" opacity="0.12" /> : null}
      <path d={line} fill="none" className={strokeClass(tone)} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function ColumnChart({
  points,
  height = 200,
  tone = 'indigo',
  label,
}: {
  points: SeriesPoint[]
  height?: number
  tone?: Tone
  label: string
}) {
  const width = 520
  const pad = { l: 40, r: 16, t: 12, b: 32 }
  const geo = layout(points, width, height, pad, true)
  const gap = geo.innerW / points.length
  const bar = Math.max(8, gap * 0.55)
  const cx = (index: number) => pad.l + gap * index + gap / 2

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 w-full" role="img" aria-label={label}>
      {geo.ticks.map((tick, index) => (
        <g key={`tick-${index}`}>
          <line x1={pad.l} x2={width - pad.r} y1={geo.y(tick)} y2={geo.y(tick)} className="stroke-line" strokeWidth="1" />
          <text x={pad.l - 8} y={geo.y(tick) + 3} textAnchor="end" className="fill-muted font-mono" fontSize="9">
            {formatTick(tick)}
          </text>
        </g>
      ))}
      {points.map((point, index) => {
        const top = geo.y(point.value)
        const bottom = geo.y(0)
        const show = index % Math.max(1, Math.ceil(points.length / 5)) === 0 || index === points.length - 1
        return (
          <g key={point.label}>
            <rect
              x={cx(index) - bar / 2}
              y={top}
              width={bar}
              height={Math.max(1, bottom - top)}
              rx="2"
              className={fillClass(tone)}
              opacity="0.9"
            />
            {show ? (
              <text x={cx(index)} y={height - 10} textAnchor="middle" className="fill-muted font-mono" fontSize="9">
                {point.label}
              </text>
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}

export function MultiLineChart({
  series,
  height = 200,
  label,
}: {
  series: NamedSeries[]
  height?: number
  label: string
}) {
  const points = series[0]?.points ?? []
  const width = 520
  const values = series.flatMap((item) => item.points.map((point) => point.value))
  const geo = layout(
    points.map((point, index) => ({ label: point.label, value: values[index] ?? point.value })),
    width,
    height,
    { l: 36, r: 12, t: 12, b: 32 },
    true,
  )
  const max = Math.max(...values, 1)
  const y = (value: number) => geo.pad.t + geo.innerH - (value / max) * geo.innerH
  const ticks = [0, max / 2, max]

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 w-full" role="img" aria-label={label}>
        {ticks.map((tick, index) => (
          <g key={index}>
            <line x1={geo.pad.l} x2={width - geo.pad.r} y1={y(tick)} y2={y(tick)} className="stroke-line" strokeWidth="1" />
            <text x={geo.pad.l - 8} y={y(tick) + 3} textAnchor="end" className="fill-muted font-mono" fontSize="9">
              {formatTick(tick)}
            </text>
          </g>
        ))}
        {points.map((point, index) =>
          index % 2 === 0 || index === points.length - 1 ? (
            <text key={point.label} x={geo.x(index)} y={height - 10} textAnchor="middle" className="fill-muted font-mono" fontSize="9">
              {point.label}
            </text>
          ) : null,
        )}
        {series.map((item) => (
          <path
            key={item.key}
            d={item.points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${geo.x(index)} ${y(point.value)}`).join(' ')}
            fill="none"
            className={strokeClass(item.tone)}
            strokeWidth="1.75"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {series.map((item) => (
          <li key={item.key} className="flex items-center gap-2 text-xs text-muted">
            <span className={`h-px w-5 border-t-2 ${legendBorder(item.tone)}`} />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

function legendBorder(tone: Tone) {
  if (tone === 'danger') return 'border-danger'
  if (tone === 'success') return 'border-success'
  if (tone === 'warning') return 'border-warning'
  if (tone === 'muted') return 'border-outline'
  return 'border-indigo'
}

export function HorizontalStack({
  segments,
  caption,
}: {
  segments: { label: string; value: number; tone: Tone }[]
  caption: string
}) {
  const total = segments.reduce((sum, item) => sum + item.value, 0) || 1
  return (
    <div className="mt-6">
      <p className="sr-only">{caption}</p>
      <div className="flex h-8 overflow-hidden rounded-md border border-line">
        {segments.map((item) => (
          <div
            key={item.label}
            className={item.tone === 'success' ? 'bg-success' : item.tone === 'danger' ? 'bg-danger' : 'bg-warning'}
            style={{ width: `${(item.value / total) * 100}%` }}
            title={`${item.label}: ${item.value}`}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {segments.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-xs text-muted">
            <span
              className={`size-2 rounded-full ${
                item.tone === 'success' ? 'bg-success' : item.tone === 'danger' ? 'bg-danger' : 'bg-warning'
              }`}
            />
            {item.label}
            <span className="font-mono tabular-nums text-ink">
              {item.value} · {((item.value / total) * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function RingChart({
  title,
  value,
  total,
  tone = 'indigo',
  caption,
}: {
  title: string
  value: number
  total: number
  tone?: Tone
  caption: string
}) {
  const size = 132
  const cx = 66
  const cy = 66
  const r = 46
  const length = 2 * Math.PI * r
  const fraction = total === 0 ? 0 : Math.max(0, Math.min(value / total, 1))

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={caption} className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" className="stroke-line" strokeWidth="10" />
        {fraction > 0 ? (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            className={strokeClass(tone)}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${length * fraction} ${length}`}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ) : null}
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-ink font-mono" fontSize="18">
          {value}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-muted font-label" fontSize="9">
          {title}
        </text>
      </svg>
      <p className="text-sm leading-6 text-muted">{caption}</p>
    </div>
  )
}

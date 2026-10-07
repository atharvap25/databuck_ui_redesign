import { useEffect, useMemo, useState } from 'react'
import { useWorkspaceAi } from '../ai/WorkspaceAiContext.tsx'
import { resultsFor, type CellValue, type ChartKind, type CheckResultsModel, type SeriesKey } from '../data/checkResults.ts'
import type { ValidationRun } from '../data/validations.ts'
import { AiAction } from './ai/AiKit.tsx'
import { BackIcon, ExpandIcon, PencilIcon } from './icons.tsx'
import StatusBadge from './StatusBadge.tsx'
import { secondaryButton } from './wizard/ui.tsx'

const headClass =
  'sticky top-0 z-10 bg-canvas px-3 py-2.5 text-left font-label text-xs font-medium tracking-[0.08em] text-muted uppercase shadow-[inset_0_-1px_0_var(--db-border)]'

const iconButton =
  'inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors duration-150 ease-databuck hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo'

type DistMode = 'mean' | 'sd' | 'sum'

export default function CheckResults({
  run,
  checkName,
  onBack,
  onConfigure,
}: {
  run: ValidationRun
  checkName: string
  onBack: () => void
  onConfigure: () => void
}) {
  const model = useMemo(() => resultsFor(run, checkName), [run, checkName])
  const { enabled, askAgent } = useWorkspaceAi()
  const [expanded, setExpanded] = useState(false)
  const [historyId, setHistoryId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(model.rows[0]?.id ?? null)
  const [thresholds, setThresholds] = useState<Record<string, number>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [mode, setMode] = useState<DistMode>('mean')

  useEffect(() => {
    setHistoryId(null)
    setSelectedId(model.rows[0]?.id ?? null)
    setEditingId(null)
    setExpanded(false)
    setThresholds({})
    setMode('mean')
  }, [model])

  useEffect(() => {
    if (!expanded) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setExpanded(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [expanded])

  const selected = model.rows.find((row) => row.id === (historyId ?? selectedId)) ?? model.rows[0]
  const seriesKeys = visibleKeys(model, mode)

  function openHistory(id: string) {
    setSelectedId(id)
    setHistoryId(id)
  }

  function saveThreshold(id: string) {
    const value = Number(draft)
    if (Number.isFinite(value) && value >= 0) {
      setThresholds((current) => ({ ...current, [id]: value }))
    }
    setEditingId(null)
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-line px-6 py-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 w-fit items-center gap-1 rounded-md px-2 font-sans text-sm font-medium text-ink transition-colors duration-150 ease-databuck hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
        >
          <BackIcon />
          Back
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-label text-[0.6875rem] font-medium tracking-[0.08em] text-indigo uppercase">Check results</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <h2 className="truncate font-sans text-base font-semibold tracking-[-0.02em] text-ink">{checkName}</h2>
            <StatusBadge tone={model.passed ? 'success' : 'danger'} label={model.passed ? 'PASSED' : 'FAILED'} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {model.catalogId ? (
            <button type="button" className={secondaryButton} onClick={onConfigure}>
              Configure check
            </button>
          ) : null}
          {enabled ? (
            <AiAction onClick={() => askAgent(`Explain this ${checkName} check on ${run.tableName}`)}>
              Explain this check
            </AiAction>
          ) : null}
        </div>
      </div>

      <div className="db-scroll min-h-0 flex-1 overflow-auto p-6">
        <div className="flex flex-col gap-6">
          <section className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(16rem,2fr)]">
            <article className="rounded-lg border border-line bg-canvas p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-sans text-sm font-semibold text-ink">{chartTitle(model.kind)}</h3>
                  <p className="mt-0.5 text-xs text-muted">Last {model.series.length} runs · {run.tableName}</p>
                </div>
                <div className="flex items-center gap-2">
                  {model.distributionModes ? (
                    <div className="flex rounded-md border border-line p-0.5">
                      {model.distributionModes.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setMode(item)}
                          className={`h-7 rounded px-2 font-label text-[10px] tracking-[0.08em] uppercase transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                            mode === item ? 'bg-secondary-fixed text-indigo' : 'text-muted hover:text-ink'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <button type="button" className={iconButton} aria-label="Expand graph" onClick={() => setExpanded(true)}>
                    <ExpandIcon />
                  </button>
                </div>
              </div>
              <CheckChart series={model.series} keys={seriesKeys} kind={model.kind} height={240} />
              <ChartLegend keys={seriesKeys} />
            </article>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {model.kpis.map((kpi) => (
                <article key={kpi.label} className="rounded-lg border border-line bg-canvas px-4 py-3 shadow-card">
                  <p className="font-label text-[0.6875rem] tracking-[0.08em] text-muted uppercase">{kpi.label}</p>
                  <p
                    className={`mt-1 font-mono text-xl font-medium tabular-nums ${
                      kpi.tone === 'danger' ? 'text-danger' : kpi.tone === 'success' ? 'text-success-ink' : 'text-ink'
                    }`}
                  >
                    {kpi.value}
                  </p>
                  {kpi.hint ? <p className="mt-1 text-xs text-muted">{kpi.hint}</p> : null}
                </article>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-line bg-canvas shadow-card">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div>
                <h3 className="font-sans text-sm font-semibold text-ink">{model.custom ? 'Rules on this run' : 'Columns on this run'}</h3>
                <p className="text-xs text-muted">
                  {model.rows.length} {model.custom ? 'rules' : 'columns'} · {run.ranOn} · run {run.run}
                </p>
              </div>
            </div>
            <div className="db-scroll overflow-x-auto">
              <table className="w-full min-w-[44rem] border-collapse text-left">
                <caption className="sr-only">Current run results</caption>
                <thead>
                  <tr>
                    <th scope="col" className={headClass}>
                      {model.custom ? 'Rule' : 'Column'}
                    </th>
                    {model.columnHeaders.map((header) => (
                      <th key={header.key} scope="col" className={`${headClass} ${header.align === 'right' ? 'text-right' : ''}`}>
                        {header.label}
                      </th>
                    ))}
                    <th scope="col" className={headClass}>
                      Status
                    </th>
                    {model.custom ? null : (
                      <th scope="col" className={headClass}>
                        Edit threshold
                      </th>
                    )}
                    <th scope="col" className={headClass}>
                      History
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {model.rows.map((row) => {
                    const threshold = thresholds[row.id] ?? row.threshold
                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedId(row.id)}
                        className={`border-b border-line last:border-0 ${
                          selectedId === row.id ? 'bg-secondary-fixed' : 'even:bg-surface'
                        }`}
                      >
                        <td className={`border-l-[3px] px-3 py-2.5 font-sans text-sm font-medium text-ink ${row.passed ? 'border-l-success' : 'border-l-danger'}`}>
                          {row.name}
                        </td>
                        {model.columnHeaders.map((header) => {
                          if (header.key === 'threshold' && threshold != null) {
                            return (
                              <td key={header.key} className="px-3 py-2.5 text-right font-mono text-sm tabular-nums text-ink">
                                {threshold.toFixed(1)}%
                              </td>
                            )
                          }
                          const cell = row.cells.find((item) => item.key === header.key)
                          return <ResultCell key={header.key} cell={cell} align={header.align} />
                        })}
                        <td className="px-3 py-2.5">
                          <StatusBadge tone={row.passed ? 'success' : 'danger'} label={row.passed ? 'PASSED' : 'FAILED'} />
                        </td>
                        {model.custom ? null : (
                          <td className="relative px-3 py-2.5">
                            {row.threshold == null ? (
                              <span className="text-xs text-muted">—</span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className={iconButton}
                                  aria-label={`Edit threshold for ${row.name}`}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setSelectedId(row.id)
                                    setEditingId(row.id)
                                    setDraft(String(thresholds[row.id] ?? row.threshold ?? ''))
                                  }}
                                >
                                  <PencilIcon />
                                </button>
                                {editingId === row.id ? (
                                  <div
                                    className="absolute top-10 left-3 z-20 w-52 rounded-lg border border-line bg-canvas p-3 shadow-overlay"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <label className="font-label text-[10px] tracking-[0.12em] text-muted uppercase">
                                      Threshold {row.thresholdUnit ?? '%'}
                                      <input
                                        value={draft}
                                        onChange={(event) => setDraft(event.target.value)}
                                        className="mt-1 h-9 w-full rounded-md border border-line bg-canvas px-2 font-mono text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
                                      />
                                    </label>
                                    <div className="mt-2 flex justify-end gap-2">
                                      <button type="button" className="h-8 rounded-md px-2 text-xs text-muted hover:text-ink" onClick={() => setEditingId(null)}>
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        className="inline-flex h-8 items-center rounded-md bg-indigo px-2 font-sans text-xs font-medium text-white hover:bg-indigo-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                                        onClick={() => saveThreshold(row.id)}
                                      >
                                        Save
                                      </button>
                                    </div>
                                  </div>
                                ) : null}
                              </>
                            )}
                          </td>
                        )}
                        <td className="px-3 py-2.5">
                          <button
                            type="button"
                            className="font-sans text-sm font-medium text-indigo hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
                            onClick={(event) => {
                              event.stopPropagation()
                              openHistory(row.id)
                            }}
                          >
                            View history
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {historyId && selected ? (
            <section className="overflow-hidden rounded-lg border border-line bg-canvas shadow-card">
              <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
                <div>
                  <h3 className="font-sans text-sm font-semibold text-ink">History · {selected.name}</h3>
                  <p className="text-xs text-muted">Prior runs for the selected {model.custom ? 'rule' : 'column'}</p>
                </div>
                <button type="button" className={iconButton} aria-label="Close history" onClick={() => setHistoryId(null)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="db-scroll overflow-x-auto">
                <table className="w-full min-w-[40rem] border-collapse text-left">
                  <caption className="sr-only">Historic results</caption>
                  <thead>
                    <tr>
                      <th scope="col" className={headClass}>
                        Date
                      </th>
                      <th scope="col" className={headClass}>
                        Hour
                      </th>
                      <th scope="col" className={`${headClass} text-right`}>
                        Run
                      </th>
                      {model.historyHeaders.map((header) => (
                        <th key={header.key} scope="col" className={`${headClass} ${header.align === 'right' ? 'text-right' : ''}`}>
                          {header.label}
                        </th>
                      ))}
                      <th scope="col" className={headClass}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.history.map((row) => (
                      <tr key={row.id} className="border-b border-line even:bg-surface last:border-0">
                        <td className="px-3 py-2 font-mono text-sm tabular-nums text-ink">{row.date}</td>
                        <td className="px-3 py-2 font-mono text-sm tabular-nums text-muted">{row.hour}</td>
                        <td className="px-3 py-2 text-right font-mono text-sm tabular-nums text-ink">{row.run}</td>
                        {model.historyHeaders.map((header) => (
                          <ResultCell key={header.key} cell={row.cells.find((item) => item.key === header.key)} align={header.align} />
                        ))}
                        <td className="px-3 py-2">
                          <StatusBadge tone={row.passed ? 'success' : 'danger'} label={row.passed ? 'PASSED' : 'FAILED'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {expanded ? (
        <div className="absolute inset-0 z-20 flex flex-col bg-canvas p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-sans text-base font-semibold text-ink">{chartTitle(model.kind)}</h3>
              <p className="text-sm text-muted">{checkName} · {run.tableName}</p>
            </div>
            <button type="button" className={iconButton} aria-label="Close expanded graph" onClick={() => setExpanded(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          {model.distributionModes ? (
            <div className="mt-3 flex rounded-md border border-line p-0.5 w-fit">
              {model.distributionModes.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={`h-8 rounded px-3 font-label text-[10px] tracking-[0.08em] uppercase ${
                    mode === item ? 'bg-secondary-fixed text-indigo' : 'text-muted hover:text-ink'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}
          <div className="mt-4 min-h-0 flex-1 rounded-lg border border-line p-4">
            <CheckChart series={model.series} keys={seriesKeys} kind={model.kind} height={420} />
            <ChartLegend keys={seriesKeys} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ResultCell({ cell, align }: { cell?: CellValue; align?: 'left' | 'right' }) {
  return (
    <td className={`px-3 py-2.5 text-sm ${align === 'right' ? 'text-right' : ''} ${cell?.mono ? 'font-mono tabular-nums' : 'font-sans'} ${cell?.danger ? 'text-danger' : 'text-ink'}`}>
      {cell?.value ?? '—'}
    </td>
  )
}

function chartTitle(kind: ChartKind) {
  if (kind === 'band') return 'Count versus mean band'
  if (kind === 'drift') return 'Unique, missing, and new values'
  if (kind === 'distribution') return 'Distribution over runs'
  if (kind === 'failed') return 'Failed records over runs'
  return 'Fail rate versus threshold'
}

function visibleKeys(model: CheckResultsModel, mode: DistMode): SeriesKey[] {
  if (model.kind !== 'distribution') return model.seriesKeys
  return model.seriesKeys.filter((key) => key.key === mode || key.key.startsWith(`${mode}`))
}

function CheckChart({
  series,
  keys,
  kind,
  height,
}: {
  series: CheckResultsModel['series']
  keys: SeriesKey[]
  kind: ChartKind
  height: number
}) {
  const width = 720
  const pad = { l: 56, r: 16, t: 16, b: 36 }
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  const values = series.flatMap((point) => keys.map((key) => point.values[key.key] ?? 0))
  const min = Math.min(0, ...values)
  const max = Math.max(...values, 1)
  const span = max - min || 1
  const x = (index: number) => pad.l + (series.length <= 1 ? innerW / 2 : (index / (series.length - 1)) * innerW)
  const y = (value: number) => pad.t + innerH - ((value - min) / span) * innerH
  const ticks = [min, min + span / 2, max]
  const bandLower = keys.find((key) => key.key === 'lower' || key.key.endsWith('Lower'))
  const bandUpper = keys.find((key) => key.key === 'upper' || key.key.endsWith('Upper'))
  const area =
    bandLower && bandUpper
      ? `${series.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(point.values[bandUpper.key] ?? 0)}`).join(' ')} ${series
          .slice()
          .reverse()
          .map((point, index) => `L ${x(series.length - 1 - index)} ${y(point.values[bandLower.key] ?? 0)}`)
          .join(' ')} Z`
      : null

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 w-full" role="img" aria-label={chartTitle(kind)}>
      {ticks.map((tick, index) => (
        <g key={`tick-${index}`}>
          <line x1={pad.l} x2={width - pad.r} y1={y(tick)} y2={y(tick)} className="stroke-line" strokeWidth="1" />
          <text x={pad.l - 8} y={y(tick) + 4} textAnchor="end" className="fill-muted font-mono" fontSize="10">
            {formatTick(tick)}
          </text>
        </g>
      ))}
      {area ? <path d={area} className="fill-indigo" opacity="0.12" /> : null}
      {keys.map((key) => {
        const d = series.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(point.values[key.key] ?? 0)}`).join(' ')
        return (
          <path
            key={key.key}
            d={d}
            fill="none"
            className={strokeClass(key.tone)}
            strokeWidth={key.dashed ? 1.5 : 2}
            strokeDasharray={key.dashed ? '5 4' : undefined}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )
      })}
      {series.map((point, index) => (
        <text key={`${point.label}-${index}`} x={x(index)} y={height - 10} textAnchor="middle" className="fill-muted font-mono" fontSize="9">
          {point.label.slice(5)}
        </text>
      ))}
    </svg>
  )
}

function ChartLegend({ keys }: { keys: SeriesKey[] }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
      {keys.map((key) => (
        <li key={key.key} className="flex items-center gap-2 text-xs text-muted">
          <span className={`h-px w-5 ${key.dashed ? 'border-t border-dashed' : 'border-t-2'} ${legendBorder(key.tone)}`} />
          {key.label}
        </li>
      ))}
    </ul>
  )
}

function strokeClass(tone: SeriesKey['tone']) {
  if (tone === 'danger') return 'stroke-danger'
  if (tone === 'success') return 'stroke-success'
  if (tone === 'muted') return 'stroke-outline'
  return 'stroke-indigo'
}

function legendBorder(tone: SeriesKey['tone']) {
  if (tone === 'danger') return 'border-danger'
  if (tone === 'success') return 'border-success'
  if (tone === 'muted') return 'border-outline'
  return 'border-indigo'
}

function formatTick(value: number) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}k`
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

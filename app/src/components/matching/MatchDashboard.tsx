import { useEffect, useId, useMemo, useState } from 'react'
import {
  aggregateMetrics,
  columnStats,
  drillRows,
  formatCount,
  formatPct,
  matchKind,
  matchSnapshot,
  recordBreakdown,
  recordCountRows,
  segmentRows,
  type AggregateMetric,
  type ColumnPairStat,
  type DrillKind,
  type MatchKind,
  type RecordCountRow,
} from '../../data/matchResults.ts'
import type { MatchingJob } from '../../data/matchings.ts'
import { matchBriefingFor, mismatchReason } from '../../data/aiMocks.ts'
import { ChevronIcon, SearchIcon } from '../icons.tsx'
import { AiBanner, AiDrawer, aiSecondaryButton } from '../ai/AiKit.tsx'
import StatusBadge from '../StatusBadge.tsx'
import DatasetSummary from './DatasetSummary.tsx'
import MatchingChart from './MatchingChart.tsx'
import RecordBreakdown from './RecordBreakdown.tsx'
import { matchViz } from './viz.ts'

export type ViewId =
  | 'dashboard'
  | 'row-mismatches'
  | 'column-mismatches'
  | 'mismatched'
  | 'fuzzy'
  | 'only-source'
  | 'only-target'
  | 'dup-source'
  | 'dup-target'
  | 'details'
  | 'groups'

export type ViewDef = { id: ViewId; label: string }

const migrationViews: ViewDef[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'row-mismatches', label: 'Row mismatches' },
  { id: 'column-mismatches', label: 'Column mismatches' },
  { id: 'only-source', label: 'Only in source' },
  { id: 'only-target', label: 'Only in target' },
  { id: 'dup-source', label: 'Duplicates in source' },
  { id: 'dup-target', label: 'Duplicates in target' },
]

const cellViews: ViewDef[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'mismatched', label: 'Mismatched' },
  { id: 'fuzzy', label: 'Fuzzy matched' },
  { id: 'only-source', label: 'Only in source' },
  { id: 'only-target', label: 'Only in target' },
  { id: 'dup-source', label: 'Duplicates in source' },
  { id: 'dup-target', label: 'Duplicates in target' },
]

const aggregateViews: ViewDef[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'details', label: 'Details' },
  { id: 'only-source', label: 'Only in source' },
  { id: 'only-target', label: 'Only in target' },
  { id: 'groups', label: 'Mismatched / matched' },
]

const headClass =
  'sticky top-0 z-10 bg-canvas px-3 py-2 font-label text-xs font-medium tracking-[0.08em] text-muted uppercase shadow-[inset_0_-1px_0_var(--db-border)]'

const cardClass = 'rounded-lg border border-line bg-canvas shadow-card'

const viewsFor: Record<MatchKind, ViewDef[]> = {
  migration: migrationViews,
  cell: cellViews,
  aggregate: aggregateViews,
}

const drillForView: Partial<Record<ViewId, { kind: DrillKind; title: string; empty: string }>> = {
  'row-mismatches': {
    kind: 'mismatch',
    title: 'Row mismatches',
    empty: 'No mismatched rows on this run.',
  },
  mismatched: {
    kind: 'mismatch',
    title: 'Mismatched cells',
    empty: 'No cell mismatches on this run.',
  },
  'only-source': {
    kind: 'only-source',
    title: 'Only in source',
    empty: 'Every source key is present on the target.',
  },
  'only-target': {
    kind: 'only-target',
    title: 'Only in target',
    empty: 'Every target key is present on the source.',
  },
  'dup-source': {
    kind: 'dup-source',
    title: 'Duplicates in source',
    empty: 'No duplicate keys in the source.',
  },
  'dup-target': {
    kind: 'dup-target',
    title: 'Duplicates in target',
    empty: 'No duplicate keys in the target.',
  },
}

export function viewsForJob(job: MatchingJob): ViewDef[] {
  return viewsFor[matchKind(job)]
}

export default function MatchDashboard({ job, view }: { job: MatchingJob; view: ViewId }) {
  const kind = matchKind(job)
  const [explain, setExplain] = useState<{ key: string; reason: string } | null>(null)
  const [acceptedFuzzy, setAcceptedFuzzy] = useState(false)
  const snap = useMemo(() => matchSnapshot(job), [job])
  const breakdown = useMemo(() => recordBreakdown(snap), [snap])
  const columns = useMemo(() => columnStats(job, snap), [job, snap])
  const brief = matchBriefingFor(job.id)

  useEffect(() => {
    setExplain(null)
    setAcceptedFuzzy(false)
  }, [job.id])

  const drill = drillForView[view]

  return (
    <div className="@container relative flex flex-col gap-5">

      {view === 'dashboard' && kind === 'aggregate' ? <AggregateDashboard job={job} /> : null}

      {view === 'dashboard' && kind !== 'aggregate' ? (
        <>
          <AiBanner title="Key recommendation">{brief.keyHint}</AiBanner>
          <p className="text-sm text-muted">{brief.impact}</p>
          <div className="grid items-stretch gap-4 @[52rem]:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.85fr)]">
            <MatchingChart job={job} snap={snap} />
            <RecordBreakdown rows={breakdown} />
          </div>
          <DatasetSummary job={job} snap={snap} />
          {kind === 'cell' ? <ColumnBreakdown sourceName={job.source.tableName} targetName={job.target.tableName} rows={columns} /> : null}
        </>
      ) : null}

      {drill ? (
        <DrillTable
          job={job}
          kind={drill.kind}
          title={drill.title}
          empty={drill.empty}
          snap={snap}
          onExplain={(key, index, note) => setExplain({ key, reason: mismatchReason(note, index) })}
        />
      ) : null}

      {view === 'column-mismatches' ? (
        <ColumnTable
          title="Column mismatches"
          sourceName={job.source.tableName}
          targetName={job.target.tableName}
          rows={columns}
          mode="mismatched"
        />
      ) : null}

      {view === 'fuzzy' ? (
        <>
          <AiBanner
            title="Fuzzy matches"
            actions={
              <button type="button" className={aiSecondaryButton} onClick={() => setAcceptedFuzzy(true)}>
                {acceptedFuzzy ? 'Accepted' : 'Accept as match'}
              </button>
            }
          >
            {acceptedFuzzy
              ? 'These pairs are marked as matches for this prototype session.'
              : 'These pairs look like the same customer. Accept is visual only.'}
          </AiBanner>
        <ColumnTable
          title="Fuzzy matched"
          sourceName={job.source.tableName}
          targetName={job.target.tableName}
          rows={columns.filter((row) => row.fuzzy > 0)}
          mode="fuzzy"
        />
        </>
      ) : null}

      {view === 'details' ? <SegmentTable job={job} /> : null}
      {view === 'groups' ? <GroupsTable job={job} /> : null}
      {explain ? (
        <AiDrawer title={`Explain ${explain.key}`} onClose={() => setExplain(null)}>
          <p className="text-sm leading-6 text-ink">{explain.reason}</p>
        </AiDrawer>
      ) : null}
    </div>
  )
}

function AggregateDashboard({ job }: { job: MatchingJob }) {
  const snap = matchSnapshot(job)
  const metrics = aggregateMetrics(job, snap)
  const counts = recordCountRows(job, snap)
  const gaps = metrics.filter((metric) => metric.id === 'src-gap' || metric.id === 'tgt-gap' || metric.id === 'seg')
  const total = snap.sourceTotal + snap.targetTotal
  const sourceShare = total > 0 ? (snap.sourceTotal / total) * 100 : 50

  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-3 @[40rem]:grid-cols-2">
        <CountTile
          label={job.source.tableName}
          caption="Source"
          value={snap.sourceTotal}
          fill={matchViz.sourceFill}
          ink={matchViz.sourceInk}
          line={matchViz.sourceDot}
        />
        <CountTile
          label={job.target.tableName}
          caption="Target"
          value={snap.targetTotal}
          fill={matchViz.targetFill}
          ink={matchViz.targetInk}
          line={matchViz.targetDot}
        />
      </section>

      <section className={cardClass + ' p-5'}>
        <p className="font-label text-[10px] font-medium tracking-[0.12em] text-muted uppercase">Relative size</p>
        <div className="mt-3 flex h-3 overflow-hidden rounded-full">
          <span className="h-full" style={{ width: `${sourceShare}%`, background: matchViz.sourceDot }} />
          <span className="h-full flex-1" style={{ background: matchViz.targetDot }} />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted">
          <span>Source {formatPct(sourceShare)}</span>
          <span>Target {formatPct(100 - sourceShare)}</span>
        </div>
      </section>

      <section className="grid gap-3 @[40rem]:grid-cols-3">
        {gaps.map((metric) => (
          <StatusTile key={metric.id} metric={metric} />
        ))}
      </section>

      <section className={cardClass}>
        <header className="border-b border-line px-5 py-3">
          <h3 className="font-sans text-sm font-semibold tracking-[-0.02em] text-ink">Key metrics</h3>
          <p className="mt-0.5 text-xs text-muted">Counts and thresholds for this aggregate comparison.</p>
        </header>
        <div className="db-scroll overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left">
            <thead>
              <tr>
                {['Metric', 'Records', 'Segments', 'Status', 'Percentage', 'Threshold', ''].map((label) => (
                  <th key={label || 'expand'} className={headClass}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, index) => (
                <MetricRow key={metric.id} metric={metric} zebra={index % 2 === 1} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={cardClass}>
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-5 py-3">
          <div>
            <h3 className="font-sans text-sm font-semibold tracking-[-0.02em] text-ink">Record count</h3>
            <p className="mt-0.5 text-xs text-muted">Source vs target totals for each run in this series.</p>
          </div>
          <CountSparkline rows={counts} />
        </header>
        <div className="db-scroll overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left">
            <thead>
              <tr>
                {['Date', 'Run', 'Process date', 'Source total', 'Target total', 'Difference', 'Status', 'Metric threshold', 'Count threshold'].map(
                  (label) => (
                    <th key={label} className={headClass}>
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {counts.map((row, index) => (
                <tr key={`${row.date}-${row.run}`} className={`border-b border-line last:border-b-0 ${index % 2 === 1 ? 'bg-surface' : 'bg-canvas'}`}>
                  <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-ink">{row.date}</td>
                  <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-ink">{row.run}</td>
                  <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-muted">{row.processDate}</td>
                  <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-ink">{formatCount(row.sourceTotal)}</td>
                  <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-ink">{formatCount(row.targetTotal)}</td>
                  <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-ink">
                    {row.difference.toLocaleString('en-US')} ({formatPct(row.differencePct)})
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge tone={row.passed ? 'success' : 'danger'} label={row.passed ? 'Passed' : 'Failed'} />
                  </td>
                  <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-muted">{formatPct(row.metricThreshold)}</td>
                  <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-muted">{formatPct(row.recordThreshold)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="border-t border-line px-5 py-2">
          <p className="font-sans text-xs text-muted">
            Showing {counts.length} of {counts.length} {counts.length === 1 ? 'run' : 'runs'}
          </p>
        </footer>
      </section>
    </div>
  )
}

function CountTile({
  label,
  caption,
  value,
  fill,
  ink,
  line,
}: {
  label: string
  caption: string
  value: number
  fill: string
  ink: string
  line: string
}) {
  return (
    <section className="rounded-lg border p-5 shadow-card" style={{ background: fill, borderColor: line }}>
      <p className="font-label text-[10px] font-medium tracking-[0.12em] text-muted uppercase">{caption}</p>
      <p className="mt-2 font-sans text-[clamp(1.5rem,4cqi,2rem)] leading-none font-extrabold tracking-[-0.04em] tabular-nums text-ink">
        {formatCount(value)}
      </p>
      <p className="mt-2 truncate font-sans text-sm font-medium" style={{ color: ink }}>
        {label}
      </p>
    </section>
  )
}

function StatusTile({ metric }: { metric: AggregateMetric }) {
  const passed = metric.status !== 'failed'
  return (
    <section className={`rounded-lg border border-line p-4 shadow-card ${passed ? 'bg-success-tint' : 'bg-danger-tint'}`}>
      <StatusBadge tone={passed ? 'success' : 'danger'} label={passed ? 'Passed' : 'Failed'} />
      <p className={`mt-3 font-sans text-2xl leading-none font-extrabold tracking-[-0.04em] tabular-nums ${passed ? 'text-success-ink' : 'text-danger'}`}>
        {formatCount(metric.records)}
      </p>
      <p className="mt-2 font-sans text-xs leading-5 text-ink">{metric.label}</p>
    </section>
  )
}

function CountSparkline({ rows }: { rows: RecordCountRow[] }) {
  if (rows.length < 2) return null
  const width = 168
  const height = 40
  const max = Math.max(...rows.flatMap((row) => [row.sourceTotal, row.targetTotal]), 1)
  const points = (pick: (row: RecordCountRow) => number) =>
    rows
      .map((row, index) => {
        const x = (index / (rows.length - 1)) * width
        const y = height - 4 - (pick(row) / max) * (height - 8)
        return `${x},${y}`
      })
      .join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="shrink-0">
      <polyline fill="none" stroke={matchViz.sourceDot} strokeWidth="2" points={points((row) => row.sourceTotal)} />
      <polyline fill="none" stroke={matchViz.targetDot} strokeWidth="2" points={points((row) => row.targetTotal)} />
    </svg>
  )
}

function MetricRow({ metric, zebra }: { metric: AggregateMetric; zebra: boolean }) {
  const [open, setOpen] = useState(false)
  const expandable = Boolean(metric.summary)

  return (
    <>
      <tr className={`border-b border-line ${zebra ? 'bg-surface' : 'bg-canvas'}`}>
        <td className="px-3 py-2.5 font-sans text-sm text-ink">{metric.label}</td>
        <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-ink">{formatCount(metric.records)}</td>
        <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-ink">{metric.segments}</td>
        <td className="px-3 py-2.5">
          {metric.status === 'idle' ? (
            <span className="font-sans text-sm text-tagline">—</span>
          ) : (
            <StatusBadge tone={metric.status === 'passed' ? 'success' : 'danger'} label={metric.status === 'passed' ? 'Passed' : 'Failed'} />
          )}
        </td>
        <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-ink">{formatPct(metric.percentage)}</td>
        <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-muted">{formatPct(metric.threshold)}</td>
        <td className="px-3 py-2.5 text-right">
          {expandable ? (
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
              className="inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors duration-150 ease-databuck hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
            >
              <span className={`inline-flex transition-transform duration-150 ease-databuck ${open ? 'rotate-180' : ''}`}>
                <ChevronIcon size={16} />
              </span>
              <span className="sr-only">{open ? 'Hide summary' : 'Show summary'}</span>
            </button>
          ) : null}
        </td>
      </tr>
      {open && metric.summary ? (
        <tr className={zebra ? 'bg-surface' : 'bg-canvas'}>
          <td colSpan={7} className="px-3 pb-3 font-sans text-sm text-muted">
            {metric.summary}
          </td>
        </tr>
      ) : null}
    </>
  )
}

function ColumnBreakdown({
  sourceName,
  targetName,
  rows,
}: {
  sourceName: string
  targetName: string
  rows: ColumnPairStat[]
}) {
  return (
    <section>
      <h3 className="mb-3 font-sans text-sm font-semibold tracking-[-0.02em] text-ink">Column breakdown</h3>
      <p className="sr-only">Counts by mapped source and target columns.</p>
      <div className="grid items-start gap-4 @[52rem]:grid-cols-2">
        <ColumnTable title="Mismatched count by column" sourceName={sourceName} targetName={targetName} rows={rows} mode="mismatched" />
        <ColumnTable
          title="Fuzzy matched count by column"
          sourceName={sourceName}
          targetName={targetName}
          rows={rows.filter((row) => row.fuzzy > 0)}
          mode="fuzzy"
        />
      </div>
    </section>
  )
}

function ColumnTable({
  title,
  sourceName,
  targetName,
  rows,
  mode,
}: {
  title: string
  sourceName: string
  targetName: string
  rows: ColumnPairStat[]
  mode: 'mismatched' | 'fuzzy'
}) {
  const searchId = useId()
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const filtered = needle
    ? rows.filter((row) => `${row.sourceColumn} ${row.targetColumn}`.toLowerCase().includes(needle))
    : rows
  const countLabel = mode === 'fuzzy' ? 'Fuzzy matched records' : 'Mismatched records'

  return (
    <section className={cardClass}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <h4 className="font-sans text-sm font-semibold tracking-[-0.02em] text-ink">{title}</h4>
          <p className="mt-0.5 text-xs text-muted">
            {mode === 'fuzzy' ? 'Approximate matches on mapped columns.' : 'Common keys with different values.'}
          </p>
        </div>
        <div className="relative w-full max-w-[16rem]">
          <label htmlFor={searchId} className="sr-only">
            Search columns
          </label>
          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-outline">
            <SearchIcon />
          </span>
          <input
            id={searchId}
            type="search"
            value={query}
            placeholder="Search columns"
            onChange={(event) => setQuery(event.target.value)}
            className="h-9 w-full rounded-md border border-line bg-canvas pr-3 pl-9 font-sans text-sm text-ink transition-colors duration-150 ease-databuck focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
          />
        </div>
      </header>
      {filtered.length === 0 ? (
        <p className="px-4 py-10 text-center font-sans text-sm text-muted">No records found.</p>
      ) : (
        <div className="db-scroll overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left">
            <thead>
              <tr>
                <th className={headClass}>Columns of {sourceName}</th>
                <th className={headClass}>Columns of {targetName}</th>
                <th className={`${headClass} text-right`}>{countLabel}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, index) => (
                <tr key={`${row.sourceColumn}-${row.targetColumn}`} className={`border-b border-line last:border-b-0 ${index % 2 === 1 ? 'bg-surface' : 'bg-canvas'}`}>
                  <td className="px-3 py-2 font-mono text-xs text-ink">{row.sourceColumn}</td>
                  <td className="px-3 py-2 font-mono text-xs text-ink">{row.targetColumn}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-ink">
                    {formatCount(mode === 'fuzzy' ? row.fuzzy : row.mismatched)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <footer className="border-t border-line px-4 py-2">
        <p className="font-sans text-xs text-muted">
          Showing {filtered.length} of {rows.length} {rows.length === 1 ? 'column' : 'columns'}
        </p>
      </footer>
    </section>
  )
}

function DrillTable({
  job,
  kind,
  title,
  empty,
  snap,
  onExplain,
}: {
  job: MatchingJob
  kind: DrillKind
  title: string
  empty: string
  snap: ReturnType<typeof matchSnapshot>
  onExplain?: (key: string, index: number, note: string) => void
}) {
  const searchId = useId()
  const [query, setQuery] = useState('')
  const rows = useMemo(() => drillRows(job, kind, snap), [job, kind, snap])
  const needle = query.trim().toLowerCase()
  const filtered = needle
    ? rows.filter((row) => `${row.key} ${row.sourceValue} ${row.targetValue} ${row.note}`.toLowerCase().includes(needle))
    : rows

  return (
    <section className={cardClass}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <h3 className="font-sans text-sm font-semibold tracking-[-0.02em] text-ink">{title}</h3>
          <p className="mt-0.5 text-xs text-muted">Sample keys from the latest run.</p>
        </div>
        {rows.length > 0 ? (
          <div className="relative w-full max-w-[16rem]">
            <label htmlFor={searchId} className="sr-only">
              Search keys
            </label>
            <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-outline">
              <SearchIcon />
            </span>
            <input
              id={searchId}
              type="search"
              value={query}
              placeholder="Search keys"
              onChange={(event) => setQuery(event.target.value)}
              className="h-9 w-full rounded-md border border-line bg-canvas pr-3 pl-9 font-sans text-sm text-ink transition-colors duration-150 ease-databuck focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
            />
          </div>
        ) : null}
      </header>
      {filtered.length === 0 ? (
        <p className="px-4 py-10 text-center font-sans text-sm text-muted">{rows.length === 0 ? empty : 'No matching keys.'}</p>
      ) : (
        <div className="db-scroll overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left">
            <thead>
              <tr>
                {['Key', 'Source value', 'Target value', 'Note', ''].map((label) => (
                  <th key={label} className={headClass}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, index) => (
                <tr key={row.id} className={`border-b border-line last:border-b-0 ${index % 2 === 1 ? 'bg-surface' : 'bg-canvas'}`}>
                  <td className="px-3 py-2.5 font-mono text-xs text-ink">{row.key}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-ink">{row.sourceValue}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-ink">{row.targetValue}</td>
                  <td className="px-3 py-2.5 font-sans text-sm text-muted">{row.note}</td>
                  <td className="px-3 py-2.5 text-right">
                    {onExplain ? (
                      <button
                        type="button"
                        className="font-sans text-xs font-medium text-indigo"
                        onClick={() => onExplain(row.key, index, row.note)}
                      >
                        Explain
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length > 0 ? (
        <footer className="border-t border-line px-4 py-2">
          <p className="font-sans text-xs text-muted">
            Showing {filtered.length} of {rows.length} sample {rows.length === 1 ? 'row' : 'rows'}
          </p>
        </footer>
      ) : null}
    </section>
  )
}

function SegmentTable({ job }: { job: MatchingJob }) {
  const rows = segmentRows(job, matchSnapshot(job))
  return (
    <section className={cardClass}>
      <header className="border-b border-line px-5 py-3">
        <h3 className="font-sans text-sm font-semibold tracking-[-0.02em] text-ink">Segment detail</h3>
        <p className="mt-0.5 text-xs text-muted">Source and target counts for each compared group.</p>
      </header>
      <table className="w-full text-left">
        <thead>
          <tr>
            {['Segment', 'Source', 'Target', 'Difference', 'Status'].map((label) => (
              <th key={label} className={headClass}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.name} className={`border-b border-line last:border-b-0 ${index % 2 === 1 ? 'bg-surface' : 'bg-canvas'}`}>
              <td className="px-3 py-2.5 font-sans text-sm text-ink">{row.name}</td>
              <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-ink">{formatCount(row.source)}</td>
              <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-ink">{formatCount(row.target)}</td>
              <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-ink">{row.difference.toLocaleString('en-US')}</td>
              <td className="px-3 py-2.5">
                <StatusBadge tone={row.passed ? 'success' : 'danger'} label={row.passed ? 'Passed' : 'Failed'} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function GroupsTable({ job }: { job: MatchingJob }) {
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all')
  const rows = segmentRows(job, matchSnapshot(job))
  const shown = rows.filter((row) => (filter === 'all' ? true : filter === 'passed' ? row.passed : !row.passed))

  return (
    <section className={cardClass}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
        <div>
          <h3 className="font-sans text-sm font-semibold tracking-[-0.02em] text-ink">Mismatched / matched</h3>
          <p className="mt-0.5 text-xs text-muted">Groups that passed or failed the record-count check.</p>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-md bg-surface p-1" role="group" aria-label="Group status">
          {(
            [
              ['all', 'All'],
              ['failed', 'Mismatched'],
              ['passed', 'Matched'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`h-8 cursor-pointer rounded-sm px-3 font-label text-[11px] font-medium tracking-[0.08em] uppercase transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                filter === id ? 'bg-canvas text-ink shadow-card' : 'text-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>
      {shown.length === 0 ? (
        <p className="px-5 py-10 text-center font-sans text-sm text-muted">No groups in this filter.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr>
              {['Group', 'Source', 'Target', 'Difference', 'Status'].map((label) => (
                <th key={label} className={headClass}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, index) => (
              <tr key={row.name} className={`border-b border-line last:border-b-0 ${index % 2 === 1 ? 'bg-surface' : 'bg-canvas'}`}>
                <td className="px-3 py-2.5 font-sans text-sm text-ink">{row.name}</td>
                <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-ink">{formatCount(row.source)}</td>
                <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-ink">{formatCount(row.target)}</td>
                <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-ink">{row.difference.toLocaleString('en-US')}</td>
                <td className="px-3 py-2.5">
                  <StatusBadge tone={row.passed ? 'success' : 'danger'} label={row.passed ? 'Matched' : 'Mismatched'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

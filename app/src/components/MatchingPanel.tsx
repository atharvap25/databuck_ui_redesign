import { useEffect, useMemo, useState } from 'react'
import {
  jobMatchesQuery,
  matchingJobs,
  matchingSummaryId,
  matchingTitle,
  matchTypes,
  type MatchEndpoint,
  type MatchingJob,
  type MatchType,
} from '../data/matchings.ts'
import { matchViz } from './matching/viz.ts'
import { ChevronIcon, SwapIcon } from './icons.tsx'
import IconBox from './IconBox.tsx'

const pageSize = 12
const summaryId = matchingSummaryId

export { matchingSummaryId }

export default function MatchingPanel({
  selectedId,
  onSelect,
  collapsed,
  onCollapsedChange,
  query = '',
}: {
  selectedId: string
  onSelect: (id: string) => void
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  query?: string
}) {
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<'All' | MatchType>('All')

  const filtered = useMemo(() => {
    return matchingJobs.filter((job) => {
      if (typeFilter !== 'All' && job.type !== typeFilter) return false
      return jobMatchesQuery(job, query)
    })
  }, [query, typeFilter])

  useEffect(() => {
    setPage(1)
  }, [query, typeFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const selected = matchingJobs.find((job) => job.id === selectedId)
  const collapsedLabel = selected ? matchingTitle(selected) : 'Summary'

  return (
    <aside
      className={`flex min-h-16 shrink-0 flex-col overflow-hidden rounded-lg border border-line bg-canvas shadow-card transition-[width] duration-150 ease-databuck lg:h-auto ${
        collapsed ? 'lg:w-14' : 'min-h-64 lg:w-[360px]'
      }`}
    >
      {collapsed ? (
        <div className="flex h-14 items-center gap-3 px-3 lg:h-full lg:flex-col lg:items-center lg:px-0 lg:py-3">
          <button
            type="button"
            aria-label="Expand matchings"
            onClick={() => onCollapsedChange(false)}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors duration-150 ease-databuck hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
          >
            <span className="inline-flex -rotate-90">
              <ChevronIcon size={16} />
            </span>
          </button>
          <span className="truncate font-sans text-sm font-medium text-ink lg:[writing-mode:vertical-lr]">
            {collapsedLabel}
          </span>
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3">
            <div className="min-w-0 shrink-0">
              <h2 className="truncate font-sans text-sm font-semibold text-ink">Matchings</h2>
            </div>
            <label className="sr-only" htmlFor="matching-type-filter">
              Match type
            </label>
            <select
              id="matching-type-filter"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as 'All' | MatchType)}
              className="h-8 min-w-0 flex-1 rounded-md border border-line bg-canvas px-2 font-sans text-xs text-ink transition-colors duration-150 ease-databuck hover:border-line-strong focus:outline-none focus-visible:border-indigo focus-visible:ring-2 focus-visible:ring-indigo"
            >
              <option value="All">All</option>
              {matchTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <button
              type="button"
              aria-label="Collapse matchings"
              onClick={() => onCollapsedChange(true)}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors duration-150 ease-databuck hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
            >
              <span className="inline-flex rotate-90">
                <ChevronIcon size={16} />
              </span>
            </button>
          </div>

          <div className="db-scroll min-h-0 flex-1 overflow-y-auto px-2 py-2">
            <SummaryRow selected={selectedId === summaryId} onSelect={() => onSelect(summaryId)} />
            <div className="my-2 border-t border-line" role="presentation" />
            <ul className="flex flex-col gap-2">
              {visible.map((job) => (
                <li key={job.id}>
                  <MatchingRow job={job} selected={selectedId === job.id} onSelect={() => onSelect(job.id)} />
                </li>
              ))}
            </ul>
            {filtered.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted">No matchings match this filter.</p>
            ) : null}
          </div>

          <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-t border-line px-3">
            <p className="font-mono text-xs text-muted tabular-nums">{filtered.length} matchings</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={safePage === 1}
                className="inline-flex h-8 items-center rounded-md px-2 font-sans text-sm text-ink transition-colors duration-150 ease-databuck hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo disabled:text-outline"
              >
                Prev
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                <button
                  key={number}
                  type="button"
                  aria-current={number === safePage ? 'page' : undefined}
                  onClick={() => setPage(number)}
                  className={`inline-flex size-8 items-center justify-center rounded-md font-sans text-sm tabular-nums transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                    number === safePage ? 'bg-indigo text-white' : 'text-ink hover:bg-surface'
                  }`}
                >
                  {number}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                disabled={safePage === pageCount}
                className="inline-flex h-8 items-center rounded-md px-2 font-sans text-sm text-ink transition-colors duration-150 ease-databuck hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo disabled:text-outline"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

function SummaryRow({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      aria-current={selected ? 'true' : undefined}
      onClick={onSelect}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border px-2.5 py-2.5 text-left transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
        selected ? 'border-indigo bg-secondary-fixed' : 'border-transparent hover:bg-surface'
      }`}
    >
      <IconBox size="sm">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
          <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      </IconBox>
      <span className="min-w-0">
        <span className="block truncate font-sans text-sm font-medium text-ink">Summary</span>
        <span className="mt-0.5 block truncate text-xs text-muted">Portfolio overview</span>
      </span>
    </button>
  )
}

function MatchingRow({
  job,
  selected,
  onSelect,
}: {
  job: MatchingJob
  selected: boolean
  onSelect: () => void
}) {
  const later = job.type === 'Aggregate (multiple segments)'

  return (
    <button
      type="button"
      aria-current={selected ? 'true' : undefined}
      onClick={onSelect}
      className={`flex w-full cursor-pointer flex-col gap-2 rounded-lg border px-2.5 py-2.5 text-left transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
        selected ? 'border-indigo bg-secondary-fixed' : 'border-transparent hover:bg-surface'
      }`}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0 truncate font-sans text-sm font-semibold tracking-[-0.02em] text-ink">{matchingTitle(job)}</span>
        <span className="flex shrink-0 items-center gap-1">
          {later ? (
            <span className="rounded-md bg-surface px-1.5 py-0.5 font-label text-[10px] tracking-[0.08em] text-muted uppercase">
              Later
            </span>
          ) : null}
          <span className="rounded-md bg-surface px-1.5 py-0.5 font-label text-[10px] font-medium tracking-[0.08em] text-muted uppercase">
            {later ? 'Multi-segment' : job.type}
          </span>
        </span>
      </span>
      <span className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-1.5">
        <EndpointTile role="Source" endpoint={job.source} side="source" />
        <span className="flex flex-col items-center justify-center px-0.5 text-muted" aria-hidden="true">
          <span className="w-px flex-1 bg-line" />
          <SwapIcon size={12} />
          <span className="w-px flex-1 bg-line" />
        </span>
        <EndpointTile role="Target" endpoint={job.target} side="target" />
      </span>
    </button>
  )
}

function EndpointTile({
  role,
  endpoint,
  side,
}: {
  role: 'Source' | 'Target'
  endpoint: MatchEndpoint
  side: 'source' | 'target'
}) {
  const accent = side === 'source' ? matchViz.sourceDot : matchViz.targetDot

  return (
    <span className="min-w-0 rounded-md border border-line bg-canvas py-2 pr-2 pl-2.5" style={{ borderLeftWidth: 3, borderLeftColor: accent }}>
      <span className="block font-label text-[10px] font-medium tracking-[0.08em] text-muted uppercase">{role}</span>
      <span className="mt-1 block truncate font-sans text-sm font-medium text-ink">{endpoint.tableName}</span>
      <span className="mt-0.5 block truncate text-xs text-muted">{endpoint.sourceName}</span>
    </span>
  )
}

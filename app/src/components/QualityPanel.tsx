import { useState } from 'react'
import { scoreTone, validationRuns, type ValidationRun } from '../data/validations.ts'
import { ChevronIcon, TableIcon } from './icons.tsx'
import IconBox from './IconBox.tsx'

const pageSize = 12
const summaryId = 'summary'

const toneText = {
  success: 'text-success-ink',
  warning: 'text-warning-ink',
  danger: 'text-danger',
}

export const qualitySummaryId = summaryId

export default function QualityPanel({
  selectedId,
  onSelect,
}: {
  selectedId: string
  onSelect: (id: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [page, setPage] = useState(1)

  const pageCount = Math.max(1, Math.ceil(validationRuns.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visible = validationRuns.slice((safePage - 1) * pageSize, safePage * pageSize)
  const selected = validationRuns.find((run) => run.id === selectedId)
  const collapsedLabel = selected ? selected.tableName : 'Summary'

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
            aria-label="Expand validations"
            onClick={() => setCollapsed(false)}
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
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-sans text-sm font-semibold text-ink">Validations</h2>
            </div>
            <button
              type="button"
              aria-label="Collapse validations"
              onClick={() => setCollapsed(true)}
              className="inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors duration-150 ease-databuck hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
            >
              <span className="inline-flex rotate-90">
                <ChevronIcon size={16} />
              </span>
            </button>
          </div>

          <div className="db-scroll min-h-0 flex-1 overflow-y-auto px-2 py-2">
            <SummaryRow selected={selectedId === summaryId} onSelect={() => onSelect(summaryId)} />
            <div className="my-2 border-t border-line" role="presentation" />
            <ul className="flex flex-col gap-1">
              {visible.map((run) => (
                <li key={run.id}>
                  <ValidationRow run={run} selected={selectedId === run.id} onSelect={() => onSelect(run.id)} />
                </li>
              ))}
            </ul>
          </div>

          <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-t border-line px-3">
            <p className="font-mono text-xs text-muted tabular-nums">
              {validationRuns.length} tables
            </p>
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
      className={`flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
        selected ? 'bg-secondary-fixed' : 'hover:bg-surface'
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

function ValidationRow({
  run,
  selected,
  onSelect,
}: {
  run: ValidationRun
  selected: boolean
  onSelect: () => void
}) {
  const tone = scoreTone(run)
  return (
    <button
      type="button"
      aria-current={selected ? 'true' : undefined}
      onClick={onSelect}
      className={`flex w-full cursor-pointer flex-col gap-2 rounded-md px-2 py-2 text-left transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
        selected ? 'bg-secondary-fixed' : 'hover:bg-surface'
      }`}
    >
      <span className="flex items-start gap-3">
        <IconBox size="sm" className="mt-0.5">
          <TableIcon size={15} />
        </IconBox>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-3">
            <span className="truncate font-sans text-sm font-medium text-ink">{run.tableName}</span>
            <span className={`font-mono text-sm tabular-nums ${toneText[tone]}`}>{run.score.toFixed(1)}%</span>
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {run.sourceType}
            <span className="font-mono"> · {run.schema}</span>
          </span>
          <span className="mt-0.5 block text-xs text-muted">
            Run {run.run} · {run.ranOn}
          </span>
        </span>
      </span>
      {run.failedChecks > 0 ? (
        <span className="ml-10 w-fit rounded-md bg-danger-tint px-2 py-1 font-label text-xs font-medium tracking-[0.06em] text-danger uppercase">
          {run.failedChecks} {run.failedChecks === 1 ? 'check' : 'checks'} failed
        </span>
      ) : null}
    </button>
  )
}

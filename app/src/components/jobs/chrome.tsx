import type { ReactNode } from 'react'
import { jobStatusLabel, type JobRun } from '../../data/jobs.ts'
import StatusBadge from '../StatusBadge.tsx'

export const headClass =
  'sticky top-0 z-10 bg-canvas px-3 py-2 text-left font-label text-xs font-medium tracking-[0.08em] text-muted uppercase shadow-[inset_0_-1px_0_var(--db-border)]'

export const searchFieldClass =
  'h-11 w-full rounded-md border border-line bg-canvas pr-10 pl-10 font-sans text-sm text-ink transition-colors duration-150 ease-databuck placeholder:text-tagline hover:border-line-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo'

export function JobStatus({ job }: { job: JobRun }) {
  if (job.status === 'running') {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="size-2 rounded-full bg-stable" style={{ animation: 'db-live-dot 1.2s var(--db-ease) infinite' }} />
        <span className="font-label text-xs font-medium tracking-[0.08em] text-ink uppercase">Running</span>
      </span>
    )
  }
  if (job.status === 'queued') return <StatusBadge tone="warning" label="Queued" />
  return <StatusBadge tone={job.result === 'failed' ? 'danger' : 'success'} label={jobStatusLabel(job)} />
}

export function KindBadge({ label }: { label: string }) {
  return <span className="rounded-full bg-surface px-2.5 py-1 font-sans text-xs font-medium text-ink">{label}</span>
}

export function PageBar({
  page,
  pageCount,
  countLabel,
  onPage,
}: {
  page: number
  pageCount: number
  countLabel: string
  onPage: (page: number) => void
}) {
  const safe = Math.min(page, pageCount)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-2">
      <p className="font-mono text-xs text-muted">{countLabel}</p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={safe === 1}
          onClick={() => onPage(safe - 1)}
          className="inline-flex h-8 items-center rounded-md px-2 font-sans text-sm text-ink transition-colors duration-150 ease-databuck hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo disabled:text-outline"
        >
          Prev
        </button>
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onPage(item)}
            className={`inline-flex size-8 items-center justify-center rounded-md font-mono text-xs transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
              item === safe ? 'bg-secondary-fixed text-indigo' : 'text-ink hover:bg-surface'
            }`}
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          disabled={safe === pageCount}
          onClick={() => onPage(safe + 1)}
          className="inline-flex h-8 items-center rounded-md px-2 font-sans text-sm text-ink transition-colors duration-150 ease-databuck hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo disabled:text-outline"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export function KpiCard({
  label,
  value,
  live,
  children,
}: {
  label: string
  value: number
  live?: boolean
  children?: ReactNode
}) {
  return (
    <div className="rounded-lg border border-line bg-canvas p-4 shadow-card">
      <div className="flex items-center gap-2">
        {live && value > 0 ? (
          <span className="size-1.5 rounded-full bg-stable" style={{ animation: 'db-live-dot 1.2s var(--db-ease) infinite' }} />
        ) : null}
        <p className="font-label text-[10px] tracking-[0.14em] text-muted uppercase">{label}</p>
      </div>
      <p className="mt-2 font-sans text-2xl font-bold tracking-[-0.04em] text-ink">{value}</p>
      {children}
    </div>
  )
}

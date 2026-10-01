import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { kindLabel } from '../data/jobs.ts'
import { JOB_AUTO_COLLAPSE_MS, type LiveJob } from '../jobs/jobStore.ts'
import { ChevronIcon } from './icons.tsx'
import StatusBadge from './StatusBadge.tsx'

export default function JobDeck({
  jobs,
  wave,
  agentOpen,
  onOpenJobs,
}: {
  jobs: LiveJob[]
  wave: number
  agentOpen: boolean
  onOpenJobs: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    if (wave > 0) setExpanded(true)
  }, [wave])

  useEffect(() => {
    if (jobs.length === 0) setExpanded(true)
  }, [jobs.length])

  useEffect(() => {
    if (!expanded || hovering || jobs.length === 0) return
    const timer = window.setTimeout(() => setExpanded(false), JOB_AUTO_COLLAPSE_MS)
    return () => window.clearTimeout(timer)
  }, [expanded, hovering, jobs.length, wave])

  if (jobs.length === 0) return null

  const running = jobs.filter((job) => job.status === 'running')
  const queued = jobs.filter((job) => job.status === 'queued')
  const lead = running[running.length - 1] ?? queued[queued.length - 1] ?? jobs[jobs.length - 1]
  const live = running.length > 0

  return createPortal(
    <div
      className={`fixed bottom-4 z-50 flex flex-col items-end gap-2 ${agentOpen ? 'right-4 md:right-[416px]' : 'right-4'}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{ animation: 'db-job-in 300ms ease-out' }}
    >
      {expanded ? (
        <aside
          aria-label="Jobs"
          className="w-80 overflow-hidden rounded-lg border border-line bg-canvas shadow-overlay"
          style={{ animation: 'db-job-in 150ms var(--db-ease)' }}
        >
          <div className="flex items-center gap-3 border-b border-line py-2.5 pr-2 pl-4">
            <LiveDot active={live} />
            <div className="min-w-0 flex-1">
              <p className="font-label text-[0.6875rem] font-medium tracking-[0.14em] text-muted uppercase">Jobs</p>
              <p className="truncate font-sans text-sm font-medium text-ink">
                {live
                  ? `${running.length} running${queued.length ? ` · ${queued.length} queued` : ''}`
                  : queued.length
                    ? `${queued.length} queued`
                    : 'Complete'}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenJobs}
              className="h-8 rounded-md px-2 font-sans text-xs font-medium text-indigo transition-colors duration-150 ease-databuck hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
            >
              View all
            </button>
            <button
              type="button"
              aria-label="Collapse jobs"
              onClick={() => setExpanded(false)}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors duration-150 ease-databuck hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
            >
              <ChevronIcon size={16} />
            </button>
          </div>
          <ul className="max-h-64 overflow-auto py-1" aria-live="polite">
            {jobs.map((job) => (
              <li key={job.id} className="px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sans text-sm text-ink">{job.name}</p>
                    <p className="mt-0.5 font-label text-[10px] tracking-[0.14em] text-muted uppercase">{kindLabel(job.kind)}</p>
                  </div>
                  {job.status === 'complete' ? (
                    <StatusBadge tone="success" label="Complete" />
                  ) : job.status === 'failed' ? (
                    <StatusBadge tone="danger" label="Failed" />
                  ) : job.status === 'queued' ? (
                    <span className="font-sans text-xs text-muted">Waiting</span>
                  ) : (
                    <span className="font-mono text-xs tabular-nums text-muted">{job.progress}%</span>
                  )}
                </div>
                {job.status === 'queued' ? null : <Track value={job.progress} className="mt-2" />}
              </li>
            ))}
          </ul>
        </aside>
      ) : null}

      <button
        type="button"
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse jobs' : `Expand jobs. ${lead.name} ${lead.progress} percent`}
        onClick={() => setExpanded((current) => !current)}
        className="relative grid size-12 place-items-center rounded-full border border-line bg-canvas shadow-overlay transition-[box-shadow] duration-150 ease-databuck hover:shadow-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
      >
        <ProgressRing value={lead.status === 'queued' ? 0 : lead.progress} />
        <span
          className={`relative grid size-7 place-items-center rounded-full ${live ? 'bg-stable' : queued.length ? 'bg-warning' : 'bg-success'}`}
          style={live ? { animation: 'db-live-dot 1.2s var(--db-ease) infinite' } : undefined}
        >
          {live || queued.length ? null : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12.5 9.5 17 19 7.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        {jobs.length > 1 ? (
          <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-indigo font-mono text-[10px] text-white">
            {jobs.length}
          </span>
        ) : null}
      </button>
    </div>,
    document.body,
  )
}

function ProgressRing({ value }: { value: number }) {
  const radius = 20
  const length = 2 * Math.PI * radius
  const offset = length - (Math.min(100, Math.max(0, value)) / 100) * length
  return (
    <svg className="absolute inset-0 size-12 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r={radius} fill="none" className="stroke-container-high" strokeWidth="3" />
      <circle
        cx="24"
        cy="24"
        r={radius}
        fill="none"
        className="stroke-indigo"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={length}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 150ms var(--db-ease)' }}
      />
    </svg>
  )
}

function LiveDot({ active }: { active: boolean }) {
  return (
    <span
      className={`size-1.5 shrink-0 rounded-full ${active ? 'bg-stable' : 'bg-success'}`}
      style={active ? { animation: 'db-live-dot 1.2s var(--db-ease) infinite' } : undefined}
      aria-hidden="true"
    />
  )
}

function Track({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`h-1 w-full overflow-hidden rounded-full bg-container-high ${className}`} aria-hidden="true">
      <div
        className="h-full bg-indigo transition-[width] duration-150 ease-databuck"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

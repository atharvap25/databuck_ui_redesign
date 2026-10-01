import { useEffect } from 'react'
import { kindLabel, type JobRun } from '../../data/jobs.ts'
import { Fact, Glyph, primaryButton, secondaryButton } from '../wizard/ui.tsx'
import { JobStatus, KindBadge } from './chrome.tsx'

export default function JobDrawer({
  job,
  onClose,
  onCancel,
  onRerun,
}: {
  job: JobRun
  onClose: () => void
  onCancel: () => void
  onRerun: () => void
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const active = job.status === 'running' || job.status === 'queued'

  return (
    <div className="absolute inset-0 z-20 flex justify-end bg-[rgba(15,23,42,0.5)] backdrop-blur-[4px]" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={job.name}
        onClick={(event) => event.stopPropagation()}
        className="flex h-full w-full max-w-[400px] flex-col border-l border-line bg-canvas shadow-overlay"
        style={{ animation: 'db-modal-in 200ms var(--db-ease)' }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="font-label text-[10px] tracking-[0.14em] text-muted uppercase">Job</p>
            <h2 className="mt-1 truncate font-sans text-base font-semibold tracking-[-0.02em] text-ink">{job.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <KindBadge label={kindLabel(job.kind)} />
              <JobStatus job={job} />
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-md text-muted transition-colors duration-150 ease-databuck hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
          >
            <Glyph>
              <path d="M7 7l10 10M17 7 7 17" />
            </Glyph>
          </button>
        </div>

        <div className="db-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <dl className="grid grid-cols-2 gap-4">
            <Fact label="Started by" value={job.originLabel} />
            <Fact label="Started" value={job.startedAt} />
            <Fact label="Duration" value={job.duration} mono />
            <Fact label="Progress" value={`${job.progress}%`} mono />
          </dl>

          {job.status === 'running' ? (
            <div className="mt-5 h-1 overflow-hidden rounded-full bg-container-high">
              <div className="h-full bg-indigo transition-[width] duration-150 ease-databuck" style={{ width: `${job.progress}%` }} />
            </div>
          ) : null}

          {job.members && job.members.length > 0 ? (
            <div className="mt-6">
              <p className="font-label text-[10px] tracking-[0.14em] text-muted uppercase">Members</p>
              <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
                {job.members.map((member) => (
                  <li key={`${member.kind}-${member.id}`} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="truncate font-sans text-sm text-ink">{member.name}</span>
                    <KindBadge label={kindLabel(member.kind)} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {job.validationId || job.matchingId ? (
            <p className="mt-6 font-mono text-xs text-muted">
              {job.validationId ? `Validation · ${job.validationId}` : `Matching · ${job.matchingId}`}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
          {active ? (
            <button type="button" className={secondaryButton} onClick={onCancel}>
              Cancel
            </button>
          ) : (
            <button type="button" className={primaryButton} onClick={onRerun}>
              Rerun
            </button>
          )}
        </div>
      </aside>
    </div>
  )
}

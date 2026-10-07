import { useEffect, useMemo, useState } from 'react'
import { kindLabel, type JobRun } from '../../data/jobs.ts'
import { mergeBoardJobs, useJobs } from '../../jobs/jobStore.ts'
import { jobBriefFor } from '../../data/aiMocks.ts'
import { Segment, Segmented } from '../wizard/ui.tsx'
import { headClass, JobStatus, KindBadge, KpiCard, PageBar } from './chrome.tsx'
import JobDrawer from './JobDrawer.tsx'

const pageSize = 12
type Filter = 'all' | 'running' | 'queued' | 'complete'

export default function JobsBoard({ query }: { query: string }) {
  const { history, liveJobs, enqueue, dismissActive } = useJobs()
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState<string | null>(null)

  const jobs = useMemo(() => mergeBoardJobs(history, liveJobs), [history, liveJobs])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return jobs.filter((job) => {
      if (filter !== 'all' && job.status !== filter) return false
      if (!needle) return true
      return `${job.name} ${kindLabel(job.kind)} ${job.originLabel}`.toLowerCase().includes(needle)
    })
  }, [jobs, filter, query])

  useEffect(() => {
    setPage(1)
  }, [filter, query])

  const running = jobs.filter((job) => job.status === 'running').length
  const queued = jobs.filter((job) => job.status === 'queued').length
  const completedToday = jobs.filter((job) => job.status === 'complete' && job.startedAt.startsWith('Today')).length
  const failedToday = jobs.filter((job) => job.result === 'failed' && job.startedAt.startsWith('Today')).length

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const open = jobs.find((job) => job.id === openId) ?? null

  function targetOf(job: JobRun) {
    return job.groupId ?? job.matchingId ?? job.validationId ?? job.id
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Running" value={running} live />
        <KpiCard label="Queued" value={queued} />
        <KpiCard label="Completed today" value={completedToday} />
        <KpiCard label="Failed today" value={failedToday} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-canvas shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <Segmented>
            {(
              [
                ['all', 'All'],
                ['running', 'Running'],
                ['queued', 'Queued'],
                ['complete', 'Completed'],
              ] as const
            ).map(([id, label]) => (
              <Segment key={id} pressed={filter === id} onClick={() => setFilter(id)}>
                {label}
              </Segment>
            ))}
          </Segmented>
        </div>

        <div className="db-scroll min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[52rem] border-collapse text-sm">
            <thead>
              <tr>
                <th className={headClass}>Job</th>
                <th className={headClass}>Kind</th>
                <th className={headClass}>Started by</th>
                <th className={headClass}>Started</th>
                <th className={`${headClass} text-right`}>Duration</th>
                <th className={headClass}>Status</th>
                <th className={`${headClass} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((job) => (
                <tr
                  key={job.id}
                  className="cursor-pointer border-t border-line transition-colors duration-150 ease-databuck hover:bg-surface"
                  onClick={() => setOpenId(job.id)}
                >
                  <td className="px-3 py-3 font-sans font-medium text-ink">
                    {job.name}
                    {job.result === 'failed' && jobBriefFor(job.name, true) ? (
                      <p className="mt-1 text-xs font-normal leading-5 text-muted">{jobBriefFor(job.name, true)?.title}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">
                    <KindBadge label={kindLabel(job.kind)} />
                  </td>
                  <td className="px-3 py-3 text-muted">{job.originLabel}</td>
                  <td className="px-3 py-3 font-mono text-xs text-ink">{job.startedAt}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs tabular-nums text-ink">{job.duration}</td>
                  <td className="px-3 py-3">
                    <JobStatus job={job} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    {job.status === 'running' || job.status === 'queued' ? (
                      <button
                        type="button"
                        className="font-sans text-sm text-muted hover:text-ink"
                        onClick={(event) => {
                          event.stopPropagation()
                          dismissActive(job.id)
                        }}
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="font-sans text-sm text-indigo hover:text-indigo-hover"
                        onClick={(event) => {
                          event.stopPropagation()
                          enqueue(targetOf(job), job.name, job.kind)
                        }}
                      >
                        Rerun
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PageBar
          page={safePage}
          pageCount={pageCount}
          countLabel={`${filtered.length} ${filtered.length === 1 ? 'job' : 'jobs'}`}
          onPage={setPage}
        />
      </div>

      {open ? (
        <JobDrawer
          job={open}
          onClose={() => setOpenId(null)}
          onCancel={() => {
            dismissActive(open.id)
            setOpenId(null)
          }}
          onRerun={() => {
            enqueue(targetOf(open), open.name, open.kind)
            setOpenId(null)
          }}
        />
      ) : null}
    </div>
  )
}

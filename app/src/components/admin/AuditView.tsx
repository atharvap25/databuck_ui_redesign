import { useEffect, useMemo, useState } from 'react'
import { useAdmin } from '../../admin/adminStore.ts'
import EmptyState from '../EmptyState.tsx'
import { ClockIcon } from '../icons.tsx'
import { Segment, Segmented } from '../wizard/ui.tsx'
import { headClass, PageBar } from '../jobs/chrome.tsx'
import { cellClass, rowClass } from './fields.tsx'

const pageSize = 10
type Filter = 'all' | 'application' | 'login'

export default function AuditView({ query }: { query: string }) {
  const { audit } = useAdmin()
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return audit.filter((event) => {
      if (filter !== 'all' && event.kind !== filter) return false
      if (!needle) return true
      return `${event.actor} ${event.action} ${event.target} ${event.ip}`.toLowerCase().includes(needle)
    })
  }, [audit, filter, query])

  useEffect(() => setPage(1), [filter, query])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-canvas shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <Segmented>
          <Segment pressed={filter === 'all'} onClick={() => setFilter('all')}>
            All
          </Segment>
          <Segment pressed={filter === 'application'} onClick={() => setFilter('application')}>
            Application
          </Segment>
          <Segment pressed={filter === 'login'} onClick={() => setFilter('login')}>
            Login
          </Segment>
        </Segmented>
      </div>
      <div className="db-scroll min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[56rem] border-collapse text-sm">
          <thead>
            <tr>
              <th className={headClass}>Time</th>
              <th className={headClass}>Actor</th>
              <th className={headClass}>Action</th>
              <th className={headClass}>Target</th>
              <th className={headClass}>IP</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((event) => (
              <tr key={event.id} className={rowClass}>
                <td className={`${cellClass} whitespace-nowrap font-mono text-xs text-ink`}>{event.at}</td>
                <td className={`${cellClass} font-sans font-medium text-ink`}>{event.actor}</td>
                <td className={`${cellClass} text-ink`}>{event.action}</td>
                <td className={`${cellClass} text-muted`}>{event.target}</td>
                <td className={`${cellClass} font-mono text-xs text-muted`}>{event.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <EmptyState icon={<ClockIcon />} title="No audit events" description="Activity and sign-in events will appear here." />
        ) : null}
      </div>
      <PageBar page={safePage} pageCount={pageCount} countLabel={`${filtered.length} events`} onPage={setPage} />
    </div>
  )
}

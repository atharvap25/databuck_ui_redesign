import { useEffect, useMemo, useState } from 'react'
import { cadenceSummary, defaultCadence, scheduleUsedBy, type Cadence, type JobSchedule } from '../../data/jobs.ts'
import { createSchedule, useJobs } from '../../jobs/jobStore.ts'
import EmptyState from '../EmptyState.tsx'
import { ClockIcon } from '../icons.tsx'
import { Field, fieldClass, Modal, primaryButton, secondaryButton, SwitchControl } from '../wizard/ui.tsx'
import { headClass, PageBar } from './chrome.tsx'
import FrequencyBuilder from './FrequencyBuilder.tsx'

const pageSize = 12

export default function SchedulesView({
  query,
  creating,
  onCreatingChange,
}: {
  query: string
  creating: boolean
  onCreatingChange: (open: boolean) => void
}) {
  const { schedules, groups, upsertSchedule, removeSchedule, toggleSchedule } = useJobs()
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<JobSchedule | null>(null)
  const [blocked, setBlocked] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return schedules.filter((item) => !needle || `${item.name} ${cadenceSummary(item.cadence)}`.toLowerCase().includes(needle))
  }, [schedules, query])

  useEffect(() => {
    setPage(1)
  }, [query])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-canvas shadow-card">
      {blocked ? (
        <p className="border-b border-line bg-warning-tint px-4 py-2 text-sm text-warning-ink">{blocked}</p>
      ) : null}
      <div className="db-scroll min-h-0 flex-1 overflow-auto">
        {visible.length === 0 ? (
          <EmptyState icon={<ClockIcon />} title="No schedules" description="Create a repeating calendar to reuse across job groups." />
        ) : (
          <table className="w-full min-w-[48rem] border-collapse text-sm">
            <thead>
              <tr>
                <th className={headClass}>Name</th>
                <th className={headClass}>Cadence</th>
                <th className={headClass}>Used by</th>
                <th className={headClass}>Next run</th>
                <th className={headClass}>Enabled</th>
                <th className={`${headClass} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((schedule) => {
                const used = scheduleUsedBy(schedule.id, groups)
                return (
                  <tr key={schedule.id} className="border-t border-line">
                    <td className="px-3 py-3 font-sans font-medium text-ink">{schedule.name}</td>
                    <td className="px-3 py-3 text-muted">{cadenceSummary(schedule.cadence)}</td>
                    <td className="px-3 py-3 font-mono text-xs text-ink">{used.length}</td>
                    <td className="px-3 py-3 font-mono text-xs text-ink">{schedule.nextRun}</td>
                    <td className="px-3 py-3">
                      <SwitchControl checked={schedule.enabled} onChange={(enabled) => toggleSchedule(schedule.id, enabled)} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button type="button" className="mr-3 font-sans text-sm text-indigo" onClick={() => setEditing(schedule)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="font-sans text-sm text-muted hover:text-danger"
                        onClick={() => {
                          const reason = removeSchedule(schedule.id)
                          setBlocked(reason ? `In use by ${reason}.` : null)
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      <PageBar page={safePage} pageCount={pageCount} countLabel={`${filtered.length} schedules`} onPage={setPage} />

      {creating || editing ? (
        <ScheduleModal
          schedule={editing}
          onClose={() => {
            onCreatingChange(false)
            setEditing(null)
          }}
          onSave={(name, cadence, current) => {
            upsertSchedule(
              current
                ? { ...current, name, cadence }
                : createSchedule(name, cadence),
            )
            onCreatingChange(false)
            setEditing(null)
          }}
        />
      ) : null}
    </div>
  )
}

function ScheduleModal({
  schedule,
  onClose,
  onSave,
}: {
  schedule: JobSchedule | null
  onClose: () => void
  onSave: (name: string, cadence: Cadence, current: JobSchedule | null) => void
}) {
  const [name, setName] = useState(schedule?.name ?? '')
  const [cadence, setCadence] = useState<Cadence>(schedule?.cadence ?? defaultCadence())

  return (
    <Modal
      title={schedule ? 'Edit schedule' : 'New schedule'}
      size="xl"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={primaryButton} disabled={!name.trim()} onClick={() => onSave(name.trim(), cadence, schedule)}>
            Save schedule
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Field label="Name" required>
          <input value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
        </Field>
        <FrequencyBuilder cadence={cadence} onChange={setCadence} />
      </div>
    </Modal>
  )
}

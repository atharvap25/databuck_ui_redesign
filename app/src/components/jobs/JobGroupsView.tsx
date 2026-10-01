import { useMemo, useState } from 'react'
import {
  cadenceSummary,
  defaultCadence,
  jobTargetLabel,
  memberCatalog,
  newEntityId,
  type Cadence,
  type JobGroup,
  type JobMember,
} from '../../data/jobs.ts'
import { createSchedule, useJobs } from '../../jobs/jobStore.ts'
import EmptyState from '../EmptyState.tsx'
import { ClockIcon, JobsIcon } from '../icons.tsx'
import IconBox from '../IconBox.tsx'
import { CheckControl, Field, fieldClass, Modal, primaryButton, secondaryButton, SwitchControl } from '../wizard/ui.tsx'
import { KindBadge } from './chrome.tsx'
import FrequencyBuilder from './FrequencyBuilder.tsx'

export default function JobGroupsView({
  query,
  creating,
  onCreatingChange,
}: {
  query: string
  creating: boolean
  onCreatingChange: (open: boolean) => void
}) {
  const { groups, schedules, triggers, upsertGroup, toggleGroup, enqueue, upsertSchedule } = useJobs()
  const [selectedId, setSelectedId] = useState(groups[0]?.id ?? '')
  const [editing, setEditing] = useState<JobGroup | null>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return groups.filter((group) => !needle || group.name.toLowerCase().includes(needle))
  }, [groups, query])

  const selected = groups.find((group) => group.id === selectedId) ?? filtered[0] ?? null
  const schedule = selected ? schedules.find((item) => item.id === selected.scheduleId) : null
  const trigger = selected ? triggers.find((item) => item.id === selected.triggerId) : null
  const modalGroup = creating ? null : editing

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
      <aside className="flex min-h-64 shrink-0 flex-col overflow-hidden rounded-lg border border-line bg-canvas shadow-card lg:w-[360px]">
        <div className="border-b border-line px-4 py-3">
          <h2 className="font-sans text-sm font-semibold text-ink">Job groups</h2>
          <p className="mt-0.5 text-xs text-muted">{filtered.length} bundles</p>
        </div>
        <ul className="db-scroll min-h-0 flex-1 overflow-auto p-2">
          {filtered.map((group) => {
            const on = selected?.id === group.id
            return (
              <li key={group.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(group.id)}
                  className={`flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                    on ? 'bg-secondary-fixed' : 'hover:bg-surface'
                  }`}
                >
                  <IconBox size="sm">
                    <JobsIcon />
                  </IconBox>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-sans text-sm font-medium text-ink">{group.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {group.members.length} members · {schedules.find((item) => item.id === group.scheduleId)?.name ?? 'On demand'}
                    </span>
                  </span>
                  <span onClick={(event) => event.stopPropagation()}>
                    <SwitchControl checked={group.enabled} onChange={(enabled) => toggleGroup(group.id, enabled)} />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      <section className="flex min-h-80 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-canvas shadow-card">
        {selected ? (
          <>
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-6 py-4">
              <div>
                <h2 className="font-sans text-base font-semibold tracking-[-0.02em] text-ink">{selected.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {schedule ? cadenceSummary(schedule.cadence) : 'On demand'}
                  {trigger ? ` · ${trigger.name}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" className={secondaryButton} onClick={() => setEditing(selected)}>
                  Edit
                </button>
                <button
                  type="button"
                  className={primaryButton}
                  onClick={() => enqueue(selected.id, selected.name, 'group')}
                >
                  Run now
                </button>
              </div>
            </header>
            <div className="db-scroll min-h-0 flex-1 overflow-auto p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <FactCard label="Schedule" value={schedule?.name ?? 'On demand'} />
                <FactCard label="Trigger" value={trigger?.name ?? 'None'} />
                <FactCard label="Next run" value={selected.nextRun} />
              </div>
              <h3 className="mt-6 font-label text-[10px] tracking-[0.14em] text-muted uppercase">Members</h3>
              <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
                {selected.members.map((member) => (
                  <li key={`${member.kind}-${member.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="truncate font-sans text-sm text-ink">{member.name}</span>
                    <KindBadge label={member.kind === 'matching' ? 'Matching' : 'Quality'} />
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <EmptyState icon={<ClockIcon />} title="No job groups" description="Create a group to run validations together." />
        )}
      </section>

      {creating || editing ? (
        <GroupModal
          group={modalGroup}
          onClose={() => {
            onCreatingChange(false)
            setEditing(null)
          }}
          onSave={(group, cadence, createNamed) => {
            if (createNamed) {
              const next = createSchedule(createNamed, cadence)
              upsertSchedule(next)
              upsertGroup({ ...group, scheduleId: next.id })
            } else {
              upsertGroup(group)
            }
            setSelectedId(group.id)
            onCreatingChange(false)
            setEditing(null)
          }}
        />
      ) : null}
    </div>
  )
}

function FactCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3">
      <p className="font-label text-[10px] tracking-[0.14em] text-muted uppercase">{label}</p>
      <p className="mt-1 truncate font-sans text-sm font-medium text-ink">{value}</p>
    </div>
  )
}

function GroupModal({
  group,
  onClose,
  onSave,
}: {
  group: JobGroup | null
  onClose: () => void
  onSave: (group: JobGroup, cadence: Cadence, createNamed: string | null) => void
}) {
  const { schedules, triggers, groups } = useJobs()
  const catalog = memberCatalog()
  const [name, setName] = useState(group?.name ?? '')
  const [members, setMembers] = useState<JobMember[]>(group?.members ?? [])
  const [scheduleMode, setScheduleMode] = useState<'existing' | 'new' | 'none'>(
    group?.scheduleId ? 'existing' : 'none',
  )
  const [scheduleId, setScheduleId] = useState(group?.scheduleId ?? schedules[0]?.id ?? '')
  const [cadence, setCadence] = useState<Cadence>(
    schedules.find((item) => item.id === group?.scheduleId)?.cadence ?? defaultCadence(),
  )
  const [scheduleName, setScheduleName] = useState('')
  const [triggerId, setTriggerId] = useState(group?.triggerId ?? '')

  function toggleMember(member: JobMember) {
    setMembers((current) =>
      current.some((item) => item.id === member.id && item.kind === member.kind)
        ? current.filter((item) => !(item.id === member.id && item.kind === member.kind))
        : [...current, member],
    )
  }

  return (
    <Modal
      title={group ? 'Edit job group' : 'New job group'}
      size="xl"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryButton}
            disabled={!name.trim() || members.length === 0}
            onClick={() =>
              onSave(
                {
                  id: group?.id ?? newEntityId('grp'),
                  name: name.trim(),
                  members,
                  scheduleId: scheduleMode === 'existing' ? scheduleId : scheduleMode === 'new' ? null : null,
                  triggerId: triggerId || null,
                  enabled: group?.enabled ?? true,
                  lastRun: group?.lastRun ?? '—',
                  nextRun: scheduleMode === 'none' ? 'On demand' : group?.nextRun ?? 'Next run pending',
                },
                cadence,
                scheduleMode === 'new' ? scheduleName.trim() || name.trim() : null,
              )
            }
          >
            Save group
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <Field label="Name" required>
          <input value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
        </Field>
        <div>
          <p className="mb-2 font-sans text-xs font-medium text-ink">Members</p>
          <div className="grid max-h-56 gap-1 overflow-auto rounded-lg border border-line p-2 sm:grid-cols-2">
            {catalog.map((member) => (
              <CheckControl
                key={`${member.kind}-${member.id}`}
                checked={members.some((item) => item.id === member.id && item.kind === member.kind)}
                label={member.name}
                hint={member.kind === 'matching' ? 'Matching' : 'Quality'}
                onChange={() => toggleMember(member)}
              />
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ['none', 'On demand'],
              ['existing', 'Use existing schedule'],
              ['new', 'Create new schedule'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={scheduleMode === id}
              onClick={() => setScheduleMode(id)}
              className={`rounded-lg border px-3 py-3 text-left text-sm font-medium transition-colors duration-150 ease-databuck ${
                scheduleMode === id ? 'border-indigo bg-secondary-fixed' : 'border-line hover:bg-surface'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {scheduleMode === 'existing' ? (
          <Field label="Schedule">
            <select value={scheduleId} onChange={(event) => setScheduleId(event.target.value)} className={fieldClass}>
              {schedules.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
        {scheduleMode === 'new' ? (
          <div className="flex flex-col gap-4">
            <Field label="Schedule name" required>
              <input value={scheduleName} onChange={(event) => setScheduleName(event.target.value)} className={fieldClass} />
            </Field>
            <FrequencyBuilder cadence={cadence} onChange={setCadence} />
          </div>
        ) : null}
        <Field label="Trigger">
          <select value={triggerId} onChange={(event) => setTriggerId(event.target.value)} className={fieldClass}>
            <option value="">None</option>
            {triggers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {jobTargetLabel(item.targetType, item.targetId, groups)}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </Modal>
  )
}

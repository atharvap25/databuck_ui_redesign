import { useEffect, useMemo, useState } from 'react'
import {
  apiEndpointFor,
  jobTargetLabel,
  jobTargetOptions,
  newEntityId,
  triggerKindLabel,
  triggerSummary,
  type AfterJobWhen,
  type JobTargetType,
  type JobTrigger,
  type TriggerKind,
} from '../../data/jobs.ts'
import { useJobs } from '../../jobs/jobStore.ts'
import EmptyState from '../EmptyState.tsx'
import { ClockIcon } from '../icons.tsx'
import { Field, fieldClass, Modal, primaryButton, secondaryButton, SwitchControl } from '../wizard/ui.tsx'
import { headClass, KindBadge, PageBar } from './chrome.tsx'

const pageSize = 12

export default function TriggersView({
  query,
  creating,
  onCreatingChange,
}: {
  query: string
  creating: boolean
  onCreatingChange: (open: boolean) => void
}) {
  const { triggers, groups, upsertTrigger, toggleTrigger } = useJobs()
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<JobTrigger | null>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return triggers.filter((item) => {
      if (!needle) return true
      return `${item.name} ${triggerKindLabel(item.kind)} ${jobTargetLabel(item.targetType, item.targetId, groups)}`.toLowerCase().includes(needle)
    })
  }, [triggers, groups, query])

  useEffect(() => {
    setPage(1)
  }, [query])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-canvas shadow-card">
      <div className="db-scroll min-h-0 flex-1 overflow-auto">
        {visible.length === 0 ? (
          <EmptyState icon={<ClockIcon />} title="No triggers" description="Start a job when an API is called, a file lands, or another job finishes." />
        ) : (
          <table className="w-full min-w-[52rem] border-collapse text-sm">
            <thead>
              <tr>
                <th className={headClass}>Name</th>
                <th className={headClass}>Type</th>
                <th className={headClass}>Target</th>
                <th className={headClass}>Last fired</th>
                <th className={headClass}>Enabled</th>
                <th className={`${headClass} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((trigger) => (
                <tr key={trigger.id} className="border-t border-line">
                  <td className="px-3 py-3">
                    <p className="font-sans font-medium text-ink">{trigger.name}</p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-muted">{triggerSummary(trigger)}</p>
                  </td>
                  <td className="px-3 py-3">
                    <KindBadge label={triggerKindLabel(trigger.kind)} />
                  </td>
                  <td className="px-3 py-3 text-sm text-ink">{jobTargetLabel(trigger.targetType, trigger.targetId, groups)}</td>
                  <td className="px-3 py-3 font-mono text-xs text-ink">{trigger.lastFired}</td>
                  <td className="px-3 py-3">
                    <SwitchControl checked={trigger.enabled} onChange={(enabled) => toggleTrigger(trigger.id, enabled)} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button type="button" className="font-sans text-sm text-indigo" onClick={() => setEditing(trigger)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <PageBar page={safePage} pageCount={pageCount} countLabel={`${filtered.length} triggers`} onPage={setPage} />

      {creating || editing ? (
        <TriggerModal
          trigger={editing}
          onClose={() => {
            onCreatingChange(false)
            setEditing(null)
          }}
          onSave={(next) => {
            upsertTrigger(next)
            onCreatingChange(false)
            setEditing(null)
          }}
        />
      ) : null}
    </div>
  )
}

function TriggerModal({
  trigger,
  onClose,
  onSave,
}: {
  trigger: JobTrigger | null
  onClose: () => void
  onSave: (trigger: JobTrigger) => void
}) {
  const { groups } = useJobs()
  const targets = jobTargetOptions(groups)
  const [name, setName] = useState(trigger?.name ?? '')
  const [kind, setKind] = useState<TriggerKind>(trigger?.kind ?? 'api')
  const [targetKey, setTargetKey] = useState(
    trigger ? `${trigger.targetType}:${trigger.targetId}` : targets[0] ? `${targets[0].type}:${targets[0].id}` : '',
  )
  const [path, setPath] = useState(trigger?.path ?? '')
  const [debounceSeconds, setDebounceSeconds] = useState(String(trigger?.debounceSeconds ?? 60))
  const [afterGroupId, setAfterGroupId] = useState(trigger?.afterGroupId ?? groups[0]?.id ?? '')
  const [afterWhen, setAfterWhen] = useState<AfterJobWhen>(trigger?.afterWhen ?? 'success')

  const [targetType, targetId] = (targetKey.split(':') as [JobTargetType, string]) ?? ['group', '']

  return (
    <Modal
      title={trigger ? 'Edit trigger' : 'New trigger'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryButton}
            disabled={!name.trim() || !targetId}
            onClick={() =>
              onSave({
                id: trigger?.id ?? newEntityId('trg'),
                name: name.trim(),
                kind,
                targetType,
                targetId,
                enabled: trigger?.enabled ?? true,
                lastFired: trigger?.lastFired ?? 'Never',
                endpoint: apiEndpointFor(targetType, targetId),
                path: kind === 'file' ? path : undefined,
                debounceSeconds: kind === 'file' ? Number(debounceSeconds) || 60 : undefined,
                afterGroupId: kind === 'after-job' ? afterGroupId : undefined,
                afterWhen: kind === 'after-job' ? afterWhen : undefined,
              })
            }
          >
            Save trigger
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Field label="Name" required>
          <input value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
        </Field>
        <Field label="Type">
          <select value={kind} onChange={(event) => setKind(event.target.value as TriggerKind)} className={fieldClass}>
            <option value="api">API call</option>
            <option value="file">File arrival</option>
            <option value="after-job">After job</option>
          </select>
        </Field>
        <Field label="Target" required>
          <select value={targetKey} onChange={(event) => setTargetKey(event.target.value)} className={fieldClass}>
            {targets.map((item) => (
              <option key={`${item.type}:${item.id}`} value={`${item.type}:${item.id}`}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        {kind === 'api' ? (
          <Field label="Endpoint">
            <input readOnly value={apiEndpointFor(targetType, targetId || 'target')} className={`${fieldClass} font-mono`} />
          </Field>
        ) : null}
        {kind === 'file' ? (
          <>
            <Field label="Watched path">
              <input value={path} onChange={(event) => setPath(event.target.value)} placeholder="s3://bucket/path/" className={`${fieldClass} font-mono`} />
            </Field>
            <Field label="Wait after last change (seconds)">
              <input value={debounceSeconds} onChange={(event) => setDebounceSeconds(event.target.value)} className={fieldClass} />
            </Field>
          </>
        ) : null}
        {kind === 'after-job' ? (
          <>
            <Field label="After job group">
              <select value={afterGroupId} onChange={(event) => setAfterGroupId(event.target.value)} className={fieldClass}>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="When">
              <select value={afterWhen} onChange={(event) => setAfterWhen(event.target.value as AfterJobWhen)} className={fieldClass}>
                <option value="success">On success</option>
                <option value="always">Always</option>
              </select>
            </Field>
          </>
        ) : null}
      </div>
    </Modal>
  )
}

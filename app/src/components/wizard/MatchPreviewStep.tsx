import type { ReactNode } from 'react'
import { frequencyLabel, type AlertState, type MatchAdditionalState, type MatchFlagState, type MatchMappingRow, type ScheduleState, type WizardMatchType } from './model.ts'
import { cardClass, Glyph, primaryButton, secondaryButton } from './ui.tsx'

export default function MatchPreviewStep({
  matchType,
  name,
  description,
  sourceName,
  sourceTable,
  targetName,
  targetTable,
  flags,
  additional,
  rows,
  alerts,
  schedule,
  visitedAlerts,
  visitedSchedule,
  onJump,
  onRun,
}: {
  matchType: WizardMatchType | ''
  name: string
  description: string
  sourceName: string
  sourceTable: string
  targetName: string
  targetTable: string
  flags: MatchFlagState
  additional: MatchAdditionalState
  rows: MatchMappingRow[]
  alerts: AlertState
  schedule: ScheduleState
  visitedAlerts: boolean
  visitedSchedule: boolean
  onJump: (step: number) => void
  onRun: () => void
}) {
  const mapped = rows.filter((row) => row.targetColumn).length
  const pk = rows.filter((row) => row.pk).length
  const matchFields = rows.filter((row) => row.matchField).length
  const options =
    matchType === 'Migration'
      ? [
          flags.autoMapPrimaryKeys ? 'Auto map primary keys' : null,
          flags.autoMapMatchValues ? 'Auto map match values' : null,
          flags.removeCaseSensitivity ? 'Case insensitive' : null,
          flags.applyTrim ? 'Trim match fields' : null,
          flags.addressNulls ? 'Address nulls' : null,
          flags.castNumbers ? 'Cast numbers' : null,
        ]
      : matchType === 'Aggregate'
        ? [
            flags.autoMapAggregateKeys ? 'Auto map keys' : null,
            flags.autoMapAggregateField ? 'Auto map aggregate field' : null,
            flags.removeCaseSensitivity ? 'Case insensitive' : null,
            flags.matchRecordCount ? 'Match record count' : null,
          ]
        : []

  return (
    <div className="flex flex-col gap-4">
      <PreviewCard
        title="Type and tables"
        step={1}
        onJump={onJump}
        facts={[
          ['Type', matchType || '—'],
          ['Name', name || '—'],
          ['Join', `${sourceTable || '—'} → ${targetTable || '—'}`],
          ['Systems', `${sourceName} · ${targetName}`],
        ]}
      />
      <PreviewCard
        title="Configuration"
        step={2}
        onJump={onJump}
        facts={[
          ['Description', description || '—'],
          ['Options', options.filter(Boolean).join(', ') || 'None'],
        ]}
      />
      <PreviewCard
        title="Additional settings"
        step={3}
        onJump={onJump}
        facts={[
          ['Domain', additional.domain || '—'],
          ['Job size', additional.jobSize],
          ['Metric threshold', `${additional.metricThreshold}%`],
          ['Record count', `${additional.recordCountThreshold}%`],
        ]}
      />
      <PreviewCard
        title="Mapping"
        step={4}
        onJump={onJump}
        facts={[
          ['Primary keys', String(pk)],
          ['Match fields', String(matchFields)],
          ['Mapped', `${mapped} of ${rows.length}`],
        ]}
      />
      <PreviewCard
        title="Notifications"
        step={6}
        onJump={onJump}
        facts={
          visitedAlerts
            ? [
                ['Email', alerts.email || '—'],
                ['Slack', alerts.slack || '—'],
                ['Trigger', `${alerts.severity} · ${alerts.trigger}`],
              ]
            : [['Status', 'Not set yet']]
        }
      />
      <PreviewCard
        title="Schedule"
        step={7}
        onJump={onJump}
        facts={
          visitedSchedule
            ? [
                ['Frequency', frequencyLabel(schedule.frequency)],
                ['Start', `${schedule.startDate} ${schedule.startTime}`],
                ['Job', schedule.validationName],
              ]
            : [['Status', 'Not set yet']]
        }
      />

      <section className={`${cardClass} flex flex-wrap items-center justify-between gap-4 px-5 py-4`}>
        <div>
          <h2 className="font-sans text-sm font-semibold text-ink">Test matching</h2>
          <p className="mt-1 text-sm text-muted">Compare source and target on the current mappings, then continue to notifications.</p>
        </div>
        <button type="button" onClick={onRun} className={primaryButton}>
          Test matching
          <Glyph>
            <path d="M7 4v16l12-8z" />
          </Glyph>
        </button>
      </section>
    </div>
  )
}

function PreviewCard({
  title,
  step,
  onJump,
  facts,
  children,
}: {
  title: string
  step: number
  onJump: (step: number) => void
  facts: [string, string][]
  children?: ReactNode
}) {
  return (
    <section className={`${cardClass} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-sans text-sm font-semibold text-ink">{title}</h2>
        <button type="button" onClick={() => onJump(step)} className={`${secondaryButton} h-8 px-2.5 text-xs`}>
          Edit
        </button>
      </div>
      <dl className="mt-4 grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="font-label text-[10px] tracking-[0.14em] text-muted uppercase">{label}</dt>
            <dd className="mt-1 truncate font-sans text-sm font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      {children}
    </section>
  )
}

import type { ReactNode } from 'react'
import { catalogSummary, type CatalogColumn, type CatalogState } from '../../data/ruleCatalog.ts'
import type { CustomRule } from '../../data/customRules.ts'
import type { AlertState, ConfigureState, ScheduleState } from './model.ts'
import { frequencyLabel } from './model.ts'
import { cardClass, Glyph, primaryButton, secondaryButton } from './ui.tsx'

export default function PreviewStep({
  sourceName,
  tableName,
  configure,
  domain,
  description,
  columns,
  catalog,
  customRules,
  selectedCustomIds,
  alerts,
  schedule,
  visitedAlerts,
  visitedSchedule,
  onJump,
  onRun,
}: {
  sourceName: string
  tableName: string
  configure: ConfigureState
  domain: string
  description: string
  columns: CatalogColumn[]
  catalog: CatalogState
  customRules: CustomRule[]
  selectedCustomIds: string[]
  alerts: AlertState
  schedule: ScheduleState
  visitedAlerts: boolean
  visitedSchedule: boolean
  onJump: (step: number) => void
  onRun: () => void
}) {
  const summary = catalogSummary(catalog, columns)
  const selectedCustom = customRules.filter((rule) => selectedCustomIds.includes(rule.id))

  return (
    <div className="flex flex-col gap-4">
      <PreviewCard
        title="Source and table"
        step={2}
        onJump={onJump}
        facts={[
          ['Source', sourceName],
          ['Table', tableName || '—'],
          ['Description', description || '—'],
        ]}
      />
      <PreviewCard
        title="Foundation"
        step={3}
        onJump={onJump}
        facts={[
          ['Application', configure.applicationType],
          ['Domain', domain || '—'],
          ['Priority', configure.priority],
          ['Cyclicality', configure.cyclicality],
        ]}
      />
      <PreviewCard
        title="Rule catalog"
        step={4}
        onJump={onJump}
        facts={[
          ['Essential', String(summary.essential)],
          ['Advanced', String(summary.advanced)],
          ['Applied', String(summary.total)],
        ]}
      >
        {summary.names.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {summary.names.slice(0, 8).map((name) => (
              <span key={name} className="rounded-md bg-surface px-2 py-1 font-sans text-xs text-ink">
                {name}
              </span>
            ))}
            {summary.names.length > 8 ? (
              <span className="rounded-md bg-surface px-2 py-1 font-sans text-xs text-muted">+{summary.names.length - 8}</span>
            ) : null}
          </div>
        ) : null}
      </PreviewCard>
      <PreviewCard
        title="Custom rules"
        step={5}
        onJump={onJump}
        facts={[['Selected', String(selectedCustom.length)]]}
      >
        {selectedCustom.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-1.5">
            {selectedCustom.map((rule) => (
              <li key={rule.id} className="font-mono text-xs text-ink">
                {rule.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">No custom rules selected.</p>
        )}
      </PreviewCard>
      <PreviewCard
        title="Notifications"
        step={7}
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
        step={8}
        onJump={onJump}
        facts={
          visitedSchedule
            ? [
                ['Frequency', frequencyLabel(schedule.frequency)],
                ['Start', `${schedule.startDate} ${schedule.startTime}`],
                ['Validation', schedule.validationName],
              ]
            : [['Status', 'Not set yet']]
        }
      />

      <section className={`${cardClass} flex flex-wrap items-center justify-between gap-4 px-5 py-4`}>
        <div>
          <h2 className="font-sans text-sm font-semibold text-ink">Run this validation</h2>
          <p className="mt-1 text-sm text-muted">Profile the table, apply selected rules, and score the first run.</p>
        </div>
        <button type="button" onClick={onRun} className={primaryButton}>
          Run validation
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

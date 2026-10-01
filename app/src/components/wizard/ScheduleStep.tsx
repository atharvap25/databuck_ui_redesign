import { useJobs } from '../../jobs/jobStore.ts'
import {
  apiEndpointFor,
  cadenceSummary,
  triggerKindLabel,
  type TriggerKind,
} from '../../data/jobs.ts'
import FrequencyBuilder from '../jobs/FrequencyBuilder.tsx'
import { scheduleCadence, scheduleTips, type RunMode, type ScheduleState } from './model.ts'
import { cardClass, CheckControl, Field, fieldClass, Glyph } from './ui.tsx'

const modes: { id: RunMode; label: string; hint: string }[] = [
  { id: 'on-demand', label: 'On demand', hint: 'Run from the UI when you need it' },
  { id: 'schedule', label: 'On a schedule', hint: 'Repeat on a named calendar' },
  { id: 'trigger', label: 'On an event', hint: 'API, file arrival, or after a job' },
]

const triggerKinds: { id: TriggerKind; label: string; hint: string }[] = [
  { id: 'api', label: 'API call', hint: 'Airflow, ADF, Glue, dbt' },
  { id: 'file', label: 'File arrival', hint: 'Watched path or bucket' },
  { id: 'after-job', label: 'After job', hint: 'Chain from another group' },
]

export default function ScheduleStep({
  schedule,
  onChange,
}: {
  schedule: ScheduleState
  onChange: (schedule: ScheduleState) => void
}) {
  const { schedules, groups, triggers } = useJobs()

  function patch(partial: Partial<ScheduleState>) {
    onChange({ ...schedule, ...partial })
  }

  const selectedSchedule = schedules.find((item) => item.id === schedule.scheduleId)
  const selectedTrigger = triggers.find((item) => item.id === schedule.triggerId)
  const creatingSchedule = schedule.mode === 'schedule' && (schedule.scheduleId === 'new' || !schedule.scheduleId)
  const creatingTrigger = schedule.mode === 'trigger' && (schedule.triggerId === 'new' || !schedule.triggerId)

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(16rem,0.7fr)]">
      <div className="flex flex-col gap-4">
        <section className={`${cardClass} p-5`}>
          <h2 className="font-sans text-sm font-semibold text-ink">When should this run?</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {modes.map((item) => {
              const on = schedule.mode === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => patch({ mode: item.id })}
                  className={`rounded-lg border px-3 py-4 text-left transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                    on ? 'border-indigo bg-secondary-fixed text-ink' : 'border-line bg-canvas text-ink hover:border-line-strong hover:bg-surface'
                  }`}
                >
                  <span className="block font-sans text-sm font-semibold">{item.label}</span>
                  <span className="mt-1 block font-sans text-[11px] leading-4 text-muted">{item.hint}</span>
                </button>
              )
            })}
          </div>
        </section>

        {schedule.mode === 'schedule' ? (
          <section className={`${cardClass} p-5`}>
            <h2 className="font-sans text-sm font-semibold text-ink">Schedule</h2>
            <div className="mt-4">
              <Field label="Named schedule">
                <select
                  value={schedule.scheduleId || 'new'}
                  onChange={(event) => patch({ scheduleId: event.target.value })}
                  className={fieldClass}
                >
                  <option value="new">Create a new schedule</option>
                  {schedules.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {creatingSchedule ? (
              <div className="mt-4">
                <FrequencyBuilder
                  cadence={scheduleCadence(schedule)}
                  onChange={(cadence) =>
                    patch({
                      frequency: cadence.frequency,
                      startDate: cadence.startDate,
                      startTime: cadence.startTime,
                      cron: cadence.cron,
                      weekdays: cadence.weekdays,
                      monthDay: cadence.monthDay,
                    })
                  }
                />
              </div>
            ) : selectedSchedule ? (
              <p className="mt-4 rounded-md bg-surface px-3 py-2 text-sm text-ink">{cadenceSummary(selectedSchedule.cadence)} UTC</p>
            ) : null}
          </section>
        ) : null}

        {schedule.mode === 'trigger' ? (
          <section className={`${cardClass} p-5`}>
            <h2 className="font-sans text-sm font-semibold text-ink">Trigger</h2>
            <div className="mt-4">
              <Field label="Named trigger">
                <select
                  value={schedule.triggerId || 'new'}
                  onChange={(event) => patch({ triggerId: event.target.value })}
                  className={fieldClass}
                >
                  <option value="new">Create a new trigger</option>
                  {triggers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {creatingTrigger ? (
              <div className="mt-4 flex flex-col gap-4">
                <div className="grid gap-2 sm:grid-cols-3">
                  {triggerKinds.map((item) => {
                    const on = schedule.triggerKind === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => patch({ triggerKind: item.id })}
                        className={`rounded-lg border px-3 py-3 text-left transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                          on ? 'border-indigo bg-secondary-fixed' : 'border-line hover:border-line-strong hover:bg-surface'
                        }`}
                      >
                        <span className="block font-sans text-sm font-semibold text-ink">{item.label}</span>
                        <span className="mt-1 block text-[11px] text-muted">{item.hint}</span>
                      </button>
                    )
                  })}
                </div>
                {schedule.triggerKind === 'api' ? (
                  <Field label="Endpoint">
                    <input readOnly value={apiEndpointFor('quality', 'new')} className={`${fieldClass} font-mono`} />
                  </Field>
                ) : null}
                {schedule.triggerKind === 'file' ? (
                  <Field label="Watched path">
                    <input
                      value={schedule.filePath}
                      placeholder="s3://bucket/path/"
                      onChange={(event) => patch({ filePath: event.target.value })}
                      className={`${fieldClass} font-mono`}
                    />
                  </Field>
                ) : null}
                {schedule.triggerKind === 'after-job' ? (
                  <Field label="After job group">
                    <select
                      value={schedule.afterGroupId}
                      onChange={(event) => patch({ afterGroupId: event.target.value })}
                      className={fieldClass}
                    >
                      <option value="">Select a job group</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : null}
              </div>
            ) : selectedTrigger ? (
              <p className="mt-4 rounded-md bg-surface px-3 py-2 text-sm text-ink">
                {triggerKindLabel(selectedTrigger.kind)}
                {selectedTrigger.path ? ` · ${selectedTrigger.path}` : ''}
              </p>
            ) : null}
          </section>
        ) : null}

        <section className={`${cardClass} p-5`}>
          <CheckControl
            checked={schedule.jobGroupId !== ''}
            label="Also add to a job group"
            hint="Run this with a bundle of other validations or matching jobs."
            onChange={(checked) => patch({ jobGroupId: checked ? (groups[0]?.id ?? 'new') : '', jobGroupName: '' })}
          />
          {schedule.jobGroupId ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Job group">
                <select
                  value={schedule.jobGroupId}
                  onChange={(event) => patch({ jobGroupId: event.target.value })}
                  className={fieldClass}
                >
                  <option value="new">Create a new group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </Field>
              {schedule.jobGroupId === 'new' ? (
                <Field label="Group name">
                  <input
                    value={schedule.jobGroupName}
                    onChange={(event) => patch({ jobGroupName: event.target.value })}
                    className={fieldClass}
                    placeholder="Finance nightly"
                  />
                </Field>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>

      <div className="flex flex-col gap-4">
        <section className={`${cardClass} p-5`}>
          <h2 className="flex items-center gap-2 font-sans text-sm font-semibold text-ink">
            <span className="grid size-5 place-items-center rounded-full border border-indigo text-indigo">
              <Glyph size={12}>
                <circle cx="12" cy="12" r="8" />
                <path d="M12 11v5" />
                <path d="M12 8h.01" />
              </Glyph>
            </span>
            Tips
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {scheduleTips.map((tip) => (
              <li key={tip} className="flex gap-2.5 text-sm leading-5 text-muted">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-indigo" />
                {tip}
              </li>
            ))}
          </ul>
        </section>
        <section className={`${cardClass} p-5`}>
          <h2 className="font-sans text-sm font-semibold text-ink">Summary</h2>
          <dl className="mt-4 flex flex-col gap-3">
            <SummaryRow
              label="Run plan"
              value={schedule.mode === 'on-demand' ? 'On demand' : schedule.mode === 'schedule' ? 'Schedule' : 'Event'}
              pill
            />
            {schedule.mode === 'schedule' ? (
              <SummaryRow
                label="Cadence"
                value={selectedSchedule ? cadenceSummary(selectedSchedule.cadence) : cadenceSummary(scheduleCadence(schedule))}
              />
            ) : null}
            {schedule.mode === 'trigger' ? (
              <SummaryRow label="Event" value={selectedTrigger ? triggerKindLabel(selectedTrigger.kind) : triggerKindLabel(schedule.triggerKind)} pill />
            ) : null}
            {schedule.jobGroupId ? (
              <SummaryRow
                label="Job group"
                value={schedule.jobGroupId === 'new' ? schedule.jobGroupName || 'New group' : groups.find((group) => group.id === schedule.jobGroupId)?.name ?? 'Group'}
              />
            ) : null}
          </dl>
        </section>
      </div>
    </div>
  )
}

function SummaryRow({ label, value, pill }: { label: string; value: string; pill?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="font-sans text-sm text-muted">{label}</dt>
      <dd>
        {pill ? (
          <span className="rounded-full bg-surface px-2.5 py-1 font-sans text-xs font-medium text-ink">{value}</span>
        ) : (
          <span className="text-right font-sans text-sm text-ink">{value}</span>
        )}
      </dd>
    </div>
  )
}

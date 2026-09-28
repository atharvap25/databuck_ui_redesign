import { frequencyLabel, scheduleTips, schedulers, triggerTypes, type Frequency, type ScheduleState } from './model.ts'
import { cardClass, Field, fieldClass, Glyph } from './ui.tsx'

const frequencies: { id: Frequency; label: string; hint: string; icon: 'hour' | 'day' | 'week' | 'cron' }[] = [
  { id: 'hourly', label: 'Hourly', hint: 'Every hour', icon: 'hour' },
  { id: 'daily', label: 'Daily', hint: 'Once a day', icon: 'day' },
  { id: 'weekly', label: 'Weekly', hint: 'Once a week', icon: 'week' },
  { id: 'custom', label: 'Custom', hint: 'Cron expression', icon: 'cron' },
]

export default function ScheduleStep({
  schedule,
  onChange,
}: {
  schedule: ScheduleState
  onChange: (schedule: ScheduleState) => void
}) {
  function patch(partial: Partial<ScheduleState>) {
    onChange({ ...schedule, ...partial })
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(16rem,0.7fr)]">
      <div className="flex flex-col gap-4">
        <section className={`${cardClass} p-5`}>
          <h2 className="flex items-center gap-2 font-sans text-sm font-semibold text-ink">
            <span className="text-indigo">
              <Glyph>
                <path d="M13 3 6 14h6l-1 7 8-12h-6z" />
              </Glyph>
            </span>
            Trigger Configuration
          </h2>
          <div className="mt-5 grid gap-x-4 gap-y-4 sm:grid-cols-2">
            <Field label="Scheduler" required>
              <select value={schedule.scheduler} onChange={(event) => patch({ scheduler: event.target.value })} className={fieldClass}>
                {schedulers.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="Trigger Type" required>
              <select value={schedule.triggerType} onChange={(event) => patch({ triggerType: event.target.value })} className={fieldClass}>
                {triggerTypes.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Validation" required>
                <input
                  value={schedule.validationName}
                  onChange={(event) => patch({ validationName: event.target.value })}
                  className={fieldClass}
                />
              </Field>
            </div>
          </div>
        </section>

        <section className={`${cardClass} p-5`}>
          <h2 className="flex items-center gap-2 font-sans text-sm font-semibold text-ink">
            <span className="text-indigo">
              <Glyph>
                <path d="M4 12a8 8 0 1 0 8-8" />
                <path d="M12 8v4l2.5 1.5" />
              </Glyph>
            </span>
            Frequency
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {frequencies.map((item) => {
              const on = schedule.frequency === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => patch({ frequency: item.id })}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-4 text-center transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                    on ? 'border-indigo bg-secondary-fixed text-ink' : 'border-line bg-canvas text-ink hover:border-line-strong hover:bg-surface'
                  }`}
                >
                  <span className={on ? 'text-indigo' : 'text-muted'}>
                    <FreqGlyph kind={item.icon} />
                  </span>
                  <span className="font-sans text-sm font-semibold">{item.label}</span>
                  <span className="font-sans text-[11px] text-muted">{item.hint}</span>
                </button>
              )
            })}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Start Date">
              <input type="date" value={schedule.startDate} onChange={(event) => patch({ startDate: event.target.value })} className={fieldClass} />
            </Field>
            <Field label="Start Time">
              <input type="time" value={schedule.startTime} onChange={(event) => patch({ startTime: event.target.value })} className={fieldClass} />
            </Field>
            {schedule.frequency === 'custom' ? (
              <div className="sm:col-span-2">
                <Field label="Cron expression">
                  <input
                    value={schedule.cron}
                    placeholder="0 9 * * *"
                    onChange={(event) => patch({ cron: event.target.value })}
                    className={`${fieldClass} font-mono`}
                  />
                </Field>
              </div>
            ) : null}
          </div>
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
            <SummaryRow label="Trigger Type" value={schedule.triggerType} pill />
            <SummaryRow label="Frequency" value={frequencyLabel(schedule.frequency)} pill />
            <SummaryRow label="Start Time" value={schedule.startTime} />
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
          <span className="font-mono text-sm text-ink">{value}</span>
        )}
      </dd>
    </div>
  )
}

function FreqGlyph({ kind }: { kind: 'hour' | 'day' | 'week' | 'cron' }) {
  if (kind === 'hour') {
    return (
      <Glyph size={20}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l2.5 1.5" />
      </Glyph>
    )
  }
  if (kind === 'day') {
    return (
      <Glyph size={20}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </Glyph>
    )
  }
  if (kind === 'week') {
    return (
      <Glyph size={20}>
        <path d="M4 12a8 8 0 1 0 3-6.3" />
        <path d="M4 4v5h5" />
      </Glyph>
    )
  }
  return (
    <Glyph size={20}>
      <path d="M13 3 6 14h6l-1 7 8-12h-6z" />
    </Glyph>
  )
}

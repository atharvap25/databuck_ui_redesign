import { cadenceSummary, frequencyLabel, weekdayLabels, type Cadence, type Frequency } from '../../data/jobs.ts'
import { Field, fieldClass, Glyph } from '../wizard/ui.tsx'

const frequencies: { id: Frequency; label: string; hint: string; icon: 'hour' | 'day' | 'week' | 'month' | 'cron' }[] = [
  { id: 'hourly', label: 'Hourly', hint: 'Every hour', icon: 'hour' },
  { id: 'daily', label: 'Daily', hint: 'Once a day', icon: 'day' },
  { id: 'weekly', label: 'Weekly', hint: 'Specific days', icon: 'week' },
  { id: 'monthly', label: 'Monthly', hint: 'Day of month', icon: 'month' },
  { id: 'custom', label: 'Custom', hint: 'Cron expression', icon: 'cron' },
]

export default function FrequencyBuilder({
  cadence,
  onChange,
}: {
  cadence: Cadence
  onChange: (cadence: Cadence) => void
}) {
  function patch(partial: Partial<Cadence>) {
    onChange({ ...cadence, ...partial })
  }

  function toggleDay(day: Cadence['weekdays'][number]) {
    const on = cadence.weekdays.includes(day)
    patch({
      weekdays: on ? cadence.weekdays.filter((item) => item !== day) : [...cadence.weekdays, day],
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {frequencies.map((item) => {
          const on = cadence.frequency === item.id
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={on}
              onClick={() => patch({ frequency: item.id })}
              className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-center transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
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

      {cadence.frequency === 'weekly' ? (
        <div>
          <p className="mb-1.5 font-sans text-xs font-medium text-ink">Days</p>
          <div className="flex flex-wrap gap-1.5">
            {weekdayLabels.map((day) => {
              const on = cadence.weekdays.includes(day.id)
              return (
                <button
                  key={day.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleDay(day.id)}
                  className={`h-8 min-w-10 rounded-md border px-2.5 font-sans text-xs font-medium transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                    on ? 'border-indigo bg-secondary-fixed text-indigo' : 'border-line bg-canvas text-muted hover:border-line-strong hover:text-ink'
                  }`}
                >
                  {day.short}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {cadence.frequency === 'monthly' ? (
        <Field label="Day of month">
          <input
            type="number"
            min={1}
            max={31}
            value={cadence.monthDay}
            onChange={(event) => patch({ monthDay: Math.min(31, Math.max(1, Number(event.target.value) || 1)) })}
            className={fieldClass}
          />
        </Field>
      ) : null}

      {cadence.frequency === 'custom' ? (
        <Field label="Cron expression">
          <input
            value={cadence.cron}
            placeholder="0 9 * * *"
            onChange={(event) => patch({ cron: event.target.value })}
            className={`${fieldClass} font-mono`}
          />
        </Field>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date">
            <input type="date" value={cadence.startDate} onChange={(event) => patch({ startDate: event.target.value })} className={fieldClass} />
          </Field>
          <Field label="Start time">
            <input type="time" value={cadence.startTime} onChange={(event) => patch({ startTime: event.target.value })} className={fieldClass} />
          </Field>
        </div>
      )}

      <p className="rounded-md bg-surface px-3 py-2 font-sans text-sm text-ink">
        <span className="font-label text-[10px] tracking-[0.14em] text-muted uppercase">{frequencyLabel(cadence.frequency)}</span>
        <span className="mt-1 block">{cadenceSummary(cadence)} UTC</span>
      </p>
    </div>
  )
}

function FreqGlyph({ kind }: { kind: 'hour' | 'day' | 'week' | 'month' | 'cron' }) {
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
  if (kind === 'month') {
    return (
      <Glyph size={20}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
        <path d="M8 14h3v3H8z" />
      </Glyph>
    )
  }
  return (
    <Glyph size={20}>
      <path d="M13 3 6 14h6l-1 7 8-12h-6z" />
    </Glyph>
  )
}

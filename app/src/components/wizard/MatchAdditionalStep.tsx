import { domains, jobSizes, type MatchAdditionalState } from './model.ts'
import { cardClass, Field, fieldClass } from './ui.tsx'

export default function MatchAdditionalStep({
  value,
  onChange,
}: {
  value: MatchAdditionalState
  onChange: (next: MatchAdditionalState) => void
}) {
  function patch(partial: Partial<MatchAdditionalState>) {
    onChange({ ...value, ...partial })
  }

  return (
    <section className={`${cardClass} p-5`}>
      <h2 className="font-sans text-sm font-semibold text-ink">Additional settings</h2>
      <div className="mt-5 grid gap-x-4 gap-y-4 sm:grid-cols-2">
        <Field label="Data domain" required>
          <select value={value.domain} onChange={(event) => patch({ domain: event.target.value })} className={fieldClass}>
            <option value="">Select domain</option>
            {domains.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Job size">
          <select value={value.jobSize} onChange={(event) => patch({ jobSize: event.target.value as MatchAdditionalState['jobSize'] })} className={fieldClass}>
            {jobSizes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Metric threshold (%)">
          <input
            value={value.metricThreshold}
            inputMode="decimal"
            onChange={(event) => patch({ metricThreshold: event.target.value })}
            className={`${fieldClass} font-mono`}
          />
        </Field>
        <Field label="Record count threshold (%)">
          <input
            value={value.recordCountThreshold}
            inputMode="decimal"
            onChange={(event) => patch({ recordCountThreshold: event.target.value })}
            className={`${fieldClass} font-mono`}
          />
        </Field>
      </div>
    </section>
  )
}

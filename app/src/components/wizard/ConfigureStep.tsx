import { configureHint } from '../../data/aiMocks.ts'
import {
  anomalyTypes,
  applicationTypes,
  cyclicalityOptions,
  domains,
  priorities,
  type ConfigureState,
  type Cyclicality,
} from './model.ts'
import { cardClass, Field, fieldClass, Glyph, Segment, Segmented, SwitchControl } from './ui.tsx'
import { AiBanner } from '../ai/AiKit.tsx'

export default function ConfigureStep({
  configure,
  onConfigure,
  domain,
  onDomain,
  description,
  onDescription,
  schema = [],
}: {
  configure: ConfigureState
  onConfigure: (next: ConfigureState) => void
  domain: string
  onDomain: (value: string) => void
  description: string
  onDescription: (value: string) => void
  schema?: { name: string; format: string }[]
}) {
  function patch(partial: Partial<ConfigureState>) {
    onConfigure({ ...configure, ...partial })
  }

  const hint = configureHint(schema)

  return (
    <div className="flex flex-col gap-4">
      {hint ? <AiBanner title="Anomaly hint">{hint}</AiBanner> : null}
    <section className={`${cardClass} p-5`}>
      <h2 className="flex items-center gap-2 font-sans text-sm font-semibold text-ink">
        <span className="text-indigo">
          <Glyph>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.2 6.2l1.4 1.4M16.4 16.4l1.4 1.4M17.8 6.2l-1.4 1.4M7.6 16.4l-1.4 1.4" />
          </Glyph>
        </span>
        Foundation Settings
      </h2>
      <div className="mt-5 grid gap-x-4 gap-y-4 sm:grid-cols-2">
        <Field label="Type of Application">
          <select
            value={configure.applicationType}
            onChange={(event) => patch({ applicationType: event.target.value })}
            className={fieldClass}
          >
            {applicationTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Date Format">
          <input
            value={configure.dateFormat}
            placeholder="e.g. YYYY-MM-DD"
            onChange={(event) => patch({ dateFormat: event.target.value })}
            className={`${fieldClass} font-mono`}
          />
        </Field>
        <Field label="Record Count Anomaly Type">
          <select value={configure.anomalyType} onChange={(event) => patch({ anomalyType: event.target.value })} className={fieldClass}>
            {anomalyTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Std Dev from Mean">
          <input
            value={configure.stdDev}
            inputMode="decimal"
            onChange={(event) => patch({ stdDev: event.target.value })}
            className={`${fieldClass} font-mono`}
          />
        </Field>
        <Field label="Validity Threshold">
          <input
            value={configure.validityThreshold}
            inputMode="decimal"
            onChange={(event) => patch({ validityThreshold: event.target.value })}
            className={`${fieldClass} font-mono`}
          />
        </Field>
        <Field label="Data Domain" required>
          <select value={domain} onChange={(event) => onDomain(event.target.value)} className={fieldClass}>
            <option value="">Select domain</option>
            {domains.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Priority">
          <select value={configure.priority} onChange={(event) => patch({ priority: event.target.value })} className={fieldClass}>
            {priorities.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Description">
          <input
            value={description}
            placeholder="Enter description"
            onChange={(event) => onDescription(event.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field label="Sigma Calculation Days">
          <input
            value={configure.sigmaDays}
            inputMode="numeric"
            placeholder="Enter number of days"
            onChange={(event) => patch({ sigmaDays: event.target.value })}
            className={`${fieldClass} font-mono`}
          />
        </Field>
        <div className="hidden sm:block" aria-hidden="true" />
        <div className="sm:col-span-2">
          <Field label="Data Cyclicality">
            <Segmented>
              {cyclicalityOptions.map((item) => (
                <Segment key={item} pressed={configure.cyclicality === item} onClick={() => patch({ cyclicality: item as Cyclicality })}>
                  {item}
                </Segment>
              ))}
            </Segmented>
          </Field>
        </div>
        <div className="sm:col-span-2 border-t border-line pt-4">
          <SwitchControl
            checked={configure.reprofiling}
            label="Enable Reprofiling"
            onChange={(reprofiling) => patch({ reprofiling })}
          />
          <p className="mt-1.5 max-w-xl text-xs leading-5 text-muted">
            When on, Databuck refreshes the table profile on each run before applying checks.
          </p>
        </div>
      </div>
    </section>
    </div>
  )
}

import { useState } from 'react'
import {
  metricFunctions,
  ruleDimensions,
  type DistributionMetric,
  type MetricFunction,
  type RuleDimension,
} from '../../data/customRules.ts'
import { BackIcon } from '../icons.tsx'
import type { SchemaColumn } from './model.ts'
import { Field, fieldClass, primaryButton, secondaryButton } from './ui.tsx'

type Draft = {
  name: string
  tableName: string
  column: string
  fn: MetricFunction
  microsegment: string
  threshold: string
  dimension: RuleDimension
  filter: string
}

export default function DdmCreate({
  tableName,
  tableOptions,
  schema,
  microsegments,
  onCancel,
  onAdd,
}: {
  tableName: string
  tableOptions: string[]
  schema: SchemaColumn[]
  microsegments: string[]
  onCancel: () => void
  onAdd: (metric: DistributionMetric) => void
}) {
  const [draft, setDraft] = useState<Draft>(() => ({
    name: '',
    tableName: tableName || tableOptions[0] || '',
    column: schema[0]?.name ?? '',
    fn: 'Record Count',
    microsegment: microsegments[0] ?? '',
    threshold: '10',
    dimension: 'Completeness',
    filter: '',
  }))

  function patch(next: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...next }))
  }

  function save() {
    const name = draft.name.trim()
    if (!name || !draft.tableName || !draft.column) return
    const threshold = Number(draft.threshold)
    onAdd({
      id: `ddm-local-${Date.now()}`,
      name,
      tableName: draft.tableName,
      column: draft.column,
      fn: draft.fn,
      microsegment: draft.microsegment,
      threshold: Number.isFinite(threshold) ? threshold : 0,
      dimension: draft.dimension,
      filter: draft.filter.trim(),
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button type="button" onClick={onCancel} className={`${secondaryButton} h-8 px-2.5 text-xs`}>
            <BackIcon />
            Back to metrics
          </button>
          <h2 className="mt-3 font-sans text-base font-semibold tracking-[-0.02em] text-ink">Add distribution metric</h2>
          <p className="mt-1 text-sm text-muted">Track a column statistic and flag when it drifts past the threshold.</p>
        </div>
        <button type="button" onClick={save} disabled={!draft.name.trim() || !draft.column} className={primaryButton}>
          Add metric
        </button>
      </div>

      <section className="rounded-lg border border-line bg-canvas p-5 shadow-card">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Metric Name" required>
            <input value={draft.name} onChange={(event) => patch({ name: event.target.value })} placeholder="e.g. Average invoice amount" className={fieldClass} />
          </Field>
          <Field label="Metric Function" required>
            <select value={draft.fn} onChange={(event) => patch({ fn: event.target.value as MetricFunction })} className={fieldClass}>
              {metricFunctions.map((fn) => (
                <option key={fn}>{fn}</option>
              ))}
            </select>
          </Field>
          <Field label="Data Table" required>
            <select value={draft.tableName} onChange={(event) => patch({ tableName: event.target.value })} className={fieldClass}>
              {(tableOptions.includes(draft.tableName) ? tableOptions : [draft.tableName, ...tableOptions].filter(Boolean)).map((table) => (
                <option key={table}>{table}</option>
              ))}
            </select>
          </Field>
          <Field label="Data Table Column" required>
            <select value={draft.column} onChange={(event) => patch({ column: event.target.value })} className={fieldClass}>
              <option value="">Select column</option>
              {schema.map((column) => (
                <option key={column.name}>{column.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Microsegment">
            <select value={draft.microsegment} onChange={(event) => patch({ microsegment: event.target.value })} className={fieldClass}>
              <option value="">None</option>
              {microsegments.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Threshold">
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={draft.threshold}
              onChange={(event) => patch({ threshold: event.target.value })}
              className={`${fieldClass} font-mono tabular-nums`}
            />
          </Field>
          <Field label="Dimension">
            <select
              value={draft.dimension}
              onChange={(event) => patch({ dimension: event.target.value as RuleDimension })}
              className={fieldClass}
            >
              {ruleDimensions.map((dimension) => (
                <option key={dimension}>{dimension}</option>
              ))}
            </select>
          </Field>
          <Field label="Filter">
            <input
              value={draft.filter}
              onChange={(event) => patch({ filter: event.target.value })}
              placeholder="Optional SQL filter"
              className={`${fieldClass} font-mono`}
            />
          </Field>
        </div>
      </section>
    </div>
  )
}

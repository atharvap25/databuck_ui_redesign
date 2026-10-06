import { useCallback, useEffect, useMemo, useState } from 'react'
import { buildLogLines, type LogSource } from '../../data/admin.ts'
import { validationRuns } from '../../data/validations.ts'
import EmptyState from '../EmptyState.tsx'
import { ListIcon } from '../icons.tsx'
import { Field, fieldClass, primaryButton } from '../wizard/ui.tsx'

const presets = [50, 100, 250, 500] as const

export default function LogsView({
  query,
  fetchSignal,
}: {
  query: string
  fetchSignal: number
}) {
  const [source, setSource] = useState<LogSource>('validation')
  const [validationId, setValidationId] = useState(validationRuns[0]?.id ?? '')
  const [preset, setPreset] = useState<(typeof presets)[number] | 'custom'>(100)
  const [customLines, setCustomLines] = useState('80')
  const [lines, setLines] = useState<string[] | null>(null)

  const lineCount = preset === 'custom' ? Math.max(1, Math.min(2000, Number(customLines) || 1)) : preset

  const fetchLogs = useCallback(() => {
    setLines(buildLogLines(source, lineCount, validationId))
  }, [source, lineCount, validationId])

  useEffect(() => {
    if (fetchSignal === 0) return
    fetchLogs()
  }, [fetchSignal, fetchLogs])

  const visible = useMemo(() => {
    if (!lines) return []
    const needle = query.trim().toLowerCase()
    if (!needle) return lines
    return lines.filter((line) => line.toLowerCase().includes(needle))
  }, [lines, query])

  const sourceLabel = source === 'validation' ? 'Validation' : source === 'catalina' ? 'catalina.out' : 'Databuck error'

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-canvas shadow-card">
      <div className="flex flex-wrap items-end gap-3 border-b border-line px-4 py-3">
        <div className="min-w-40 flex-1">
          <Field label="Source">
            <select value={source} onChange={(event) => setSource(event.target.value as LogSource)} className={fieldClass}>
              <option value="validation">Validation</option>
              <option value="catalina">catalina.out</option>
              <option value="error">Databuck error</option>
            </select>
          </Field>
        </div>
        {source === 'validation' ? (
          <div className="min-w-56 flex-1">
            <Field label="Validation">
              <select value={validationId} onChange={(event) => setValidationId(event.target.value)} className={fieldClass}>
                {validationRuns.map((run) => (
                  <option key={run.id} value={run.id}>
                    {run.validationName}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        ) : null}
        <div className="min-w-36">
          <Field label="Lines">
            <select
              value={preset}
              onChange={(event) => {
                const next = event.target.value
                setPreset(next === 'custom' ? 'custom' : (Number(next) as (typeof presets)[number]))
              }}
              className={fieldClass}
            >
              {presets.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
          </Field>
        </div>
        {preset === 'custom' ? (
          <div className="w-28">
            <Field label="Count">
              <input value={customLines} onChange={(event) => setCustomLines(event.target.value)} className={fieldClass} />
            </Field>
          </div>
        ) : null}
        <button type="button" className={`${primaryButton} mb-0.5`} onClick={fetchLogs}>
          Fetch logs
        </button>
      </div>

      {lines ? (
        <div className="db-scroll min-h-0 flex-1 overflow-auto bg-canvas">
          <pre className="min-h-full px-4 py-4 font-mono text-[12px] leading-6 text-ink">
            {visible.length === 0 ? (
              <span className="text-muted">No lines match this search.</span>
            ) : (
              visible.join('\n')
            )}
          </pre>
        </div>
      ) : (
        <EmptyState
          icon={<ListIcon />}
          title="No logs fetched"
          description={`Select ${sourceLabel.toLowerCase()} and fetch the last ${lineCount} lines.`}
        />
      )}
    </div>
  )
}

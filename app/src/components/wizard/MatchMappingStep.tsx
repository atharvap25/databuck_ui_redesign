import { useMemo, useState } from 'react'
import type { SchemaColumn } from './model.ts'
import { mappingSqlPreview, type MatchMappingRow } from './model.ts'
import { cardClass, Glyph, primaryButton, secondaryButton } from './ui.tsx'
import StatusBadge from '../StatusBadge.tsx'

const pageSize = 8

export default function MatchMappingStep({
  sourceName,
  sourceTable,
  targetName,
  targetTable,
  targetSchema,
  rows,
  onRows,
}: {
  sourceName: string
  sourceTable: string
  targetName: string
  targetTable: string
  targetSchema: SchemaColumn[]
  rows: MatchMappingRow[]
  onRows: (rows: MatchMappingRow[]) => void
}) {
  const [tab, setTab] = useState<'criteria' | 'code'>('criteria')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [saved, setSaved] = useState(false)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter(
      (row) =>
        row.sourceColumn.toLowerCase().includes(needle) ||
        row.targetColumn.toLowerCase().includes(needle) ||
        row.sourceType.toLowerCase().includes(needle),
    )
  }, [query, rows])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pages)
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize)
  const pkCount = rows.filter((row) => row.pk).length
  const matchCount = rows.filter((row) => row.matchField).length
  const mappedCount = rows.filter((row) => row.targetColumn).length

  function patch(id: string, partial: Partial<MatchMappingRow>) {
    setSaved(false)
    onRows(rows.map((row) => (row.id === id ? { ...row, ...partial } : row)))
  }

  function remove(id: string) {
    setSaved(false)
    onRows(rows.filter((row) => row.id !== id))
  }

  function validate() {
    onRows(
      rows.map((row) => {
        const sourceOpen = row.showSourceExpression
        const targetOpen = row.showTargetExpression
        const invalid =
          (sourceOpen && !isValidExpression(row.sourceExpression)) || (targetOpen && !isValidExpression(row.targetExpression))
        return { ...row, expressionError: invalid }
      }),
    )
  }

  const sql = mappingSqlPreview(sourceName, sourceTable, targetName, targetTable, rows)

  return (
    <section className={`${cardClass} overflow-hidden`}>
      <div className="flex border-b border-line">
        <TabButton pressed={tab === 'criteria'} onClick={() => setTab('criteria')}>
          Configure Matching Criteria
        </TabButton>
        <TabButton pressed={tab === 'code'} onClick={() => setTab('code')}>
          Preview Generated Code
        </TabButton>
      </div>

      {tab === 'code' ? (
        <pre className="db-scroll max-h-[32rem] overflow-auto bg-ink p-5 font-mono text-xs leading-6 text-white">{sql}</pre>
      ) : (
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
            <input
              value={query}
              placeholder="Search columns"
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              className="h-9 w-full max-w-xs rounded-md border border-line bg-canvas px-3 font-sans text-sm text-ink placeholder:text-tagline focus:outline-none focus-visible:border-indigo focus-visible:ring-2 focus-visible:ring-indigo"
            />
            <div className="flex flex-wrap gap-2">
              <CountPill label="Primary Key" value={pkCount} />
              <CountPill label="Match Field" value={matchCount} />
              <StatusBadge tone={mappedCount > 0 ? 'success' : 'neutral'} label={`${mappedCount} mapped`} />
            </div>
          </div>

          <div className="db-scroll overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-left">
              <thead>
                <tr className="sticky top-0 z-10 border-b border-line bg-canvas">
                  {['Source column', 'PK', 'Match Field', 'Target column', 'Source transform', 'Target transform', 'Status', ''].map((label) => (
                    <th key={label} className="px-4 py-2.5 font-label text-[10px] tracking-[0.14em] text-muted uppercase">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((row, index) => {
                  const mapped = Boolean(row.targetColumn)
                  return (
                    <tr key={row.id} className={`border-b border-line ${index % 2 === 1 ? 'bg-surface' : 'bg-canvas'}`}>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs text-ink">{row.sourceColumn}</span>
                        <span className="ml-2 font-label text-[10px] tracking-[0.08em] text-muted uppercase">{row.sourceType}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={row.pk}
                          onChange={(event) => patch(row.id, { pk: event.target.checked })}
                          className="size-4 rounded-[2px] accent-indigo"
                          aria-label={`Primary key ${row.sourceColumn}`}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={row.matchField}
                          onChange={(event) => patch(row.id, { matchField: event.target.checked })}
                          className="size-4 rounded-[2px] accent-indigo"
                          aria-label={`Match field ${row.sourceColumn}`}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <select
                          value={row.targetColumn}
                          onChange={(event) => patch(row.id, { targetColumn: event.target.value })}
                          className="h-8 w-full min-w-[8rem] rounded-md border border-line bg-canvas px-2 font-sans text-xs text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
                        >
                          <option value="">Select column</option>
                          {targetSchema.map((column) => (
                            <option key={column.name} value={column.name}>
                              {column.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2.5">
                        <ExpressionCell
                          open={row.showSourceExpression}
                          value={row.sourceExpression}
                          error={row.expressionError && row.showSourceExpression}
                          onOpen={() => patch(row.id, { showSourceExpression: true })}
                          onChange={(value) => patch(row.id, { sourceExpression: value, expressionError: false })}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <ExpressionCell
                          open={row.showTargetExpression}
                          value={row.targetExpression}
                          error={row.expressionError && row.showTargetExpression}
                          onOpen={() => patch(row.id, { showTargetExpression: true })}
                          onChange={(value) => patch(row.id, { targetExpression: value, expressionError: false })}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 font-sans text-[11px] font-medium ${
                            mapped ? 'bg-success-tint text-success-ink' : 'bg-container-high text-muted'
                          }`}
                        >
                          {mapped ? 'Mapped' : 'Unmapped'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => remove(row.id)}
                          aria-label={`Remove ${row.sourceColumn}`}
                          className="grid size-8 place-items-center rounded-md text-muted transition-colors duration-150 ease-databuck hover:bg-surface hover:text-ink"
                        >
                          <Glyph>
                            <path d="M6 7h12" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                            <path d="M8 7V6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1" />
                            <path d="M7 7l1 12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-12" />
                          </Glyph>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <p className="font-sans text-xs text-muted">
              {filtered.length === 0 ? 'No columns' : `Showing ${(current - 1) * pageSize + 1}–${Math.min(current * pageSize, filtered.length)} of ${filtered.length}`}
            </p>
            <div className="flex items-center gap-2">
              <button type="button" disabled={current <= 1} onClick={() => setPage(current - 1)} className={`${secondaryButton} h-8 px-2.5 text-xs disabled:opacity-40`}>
                Previous
              </button>
              <span className="font-mono text-xs text-muted">
                {current} / {pages}
              </span>
              <button type="button" disabled={current >= pages} onClick={() => setPage(current + 1)} className={`${secondaryButton} h-8 px-2.5 text-xs disabled:opacity-40`}>
                Next
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3">
            {saved ? <span className="mr-auto font-sans text-xs text-success-ink">Mappings saved</span> : null}
            <button type="button" onClick={validate} className={secondaryButton}>
              Validate Expression
            </button>
            <button
              type="button"
              onClick={() => setSaved(true)}
              className={primaryButton}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function TabButton({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 px-5 font-sans text-sm font-medium transition-colors duration-150 ease-databuck ${
        pressed ? 'border-b-2 border-indigo text-ink' : 'text-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function CountPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-surface px-2 py-1 font-sans text-xs text-ink">
      {label}
      <span className="font-mono text-muted">{value}</span>
    </span>
  )
}

function ExpressionCell({
  open,
  value,
  error,
  onOpen,
  onChange,
}: {
  open: boolean
  value: string
  error: boolean
  onOpen: () => void
  onChange: (value: string) => void
}) {
  if (!open) {
    return (
      <button type="button" onClick={onOpen} className="font-sans text-xs font-medium text-indigo hover:text-indigo-hover">
        Add expression
      </button>
    )
  }
  return (
    <input
      value={value}
      placeholder="trim(col)"
      onChange={(event) => onChange(event.target.value)}
      className={`h-8 w-full min-w-[7rem] rounded-md border bg-canvas px-2 font-mono text-xs text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo ${
        error ? 'border-danger' : 'border-line'
      }`}
    />
  )
}

function isValidExpression(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.includes(';')) return false
  let depth = 0
  for (const char of trimmed) {
    if (char === '(') depth += 1
    if (char === ')') depth -= 1
    if (depth < 0) return false
  }
  return depth === 0
}

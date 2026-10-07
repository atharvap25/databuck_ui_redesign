import { useEffect, useId, useRef, useState } from 'react'
import {
  catalogChecks,
  columnsFor,
  criticalCount,
  seedCatalog,
  selectedColumns,
  type CatalogColumn,
  type CatalogState,
  type CheckConfig,
  type CheckDefinition,
  type CheckField,
} from '../data/ruleCatalog.ts'
import { SearchIcon } from './icons.tsx'
import { Modal, primaryButton, secondaryButton } from './wizard/ui.tsx'

const headClass =
  'sticky top-0 z-10 bg-canvas px-3 py-3 text-left font-label text-xs font-medium tracking-[0.08em] text-muted uppercase shadow-[inset_0_-1px_0_var(--db-border)]'

const fieldClass =
  'h-8 w-full rounded-md border border-line bg-canvas px-2 font-mono text-sm text-ink transition-colors duration-150 ease-databuck focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo disabled:bg-surface disabled:text-outline'

function cloneCatalog(state: CatalogState): CatalogState {
  return JSON.parse(JSON.stringify(state)) as CatalogState
}

function catalogDiff(saved: CatalogState, draft: CatalogState, columns: CatalogColumn[]) {
  const lines: string[] = []
  for (const def of catalogChecks) {
    const previous = saved.checks[def.id]
    const next = draft.checks[def.id]
    if (!previous || !next) continue
    if (def.enableOnly) {
      if (previous.enabled !== next.enabled) lines.push(`${def.name}: ${next.enabled ? 'turned on' : 'turned off'}`)
      if (previous.critical !== next.critical) lines.push(`${def.name}: critical ${next.critical ? 'on' : 'off'}`)
      continue
    }
    const previousCount = selectedColumns(previous, columns).length
    const nextCount = selectedColumns(next, columns).length
    if (previousCount !== nextCount) lines.push(`${def.name}: ${previousCount} → ${nextCount} columns`)
    const previousCritical = criticalCount(previous, columns)
    const nextCritical = criticalCount(next, columns)
    if (previousCritical !== nextCritical) {
      lines.push(`${def.name}: ${previousCritical} → ${nextCritical} critical columns`)
    }
    for (const column of columns) {
      const previousColumn = previous.columns[column.id]
      const nextColumn = next.columns[column.id]
      if (!previousColumn || !nextColumn) continue
      for (const field of def.fields) {
        const from = previousColumn.values[field.id] ?? ''
        const to = nextColumn.values[field.id] ?? ''
        if (from !== to) lines.push(`${def.name} · ${column.name} ${field.label}: ${from || '—'} → ${to || '—'}`)
      }
    }
  }
  if (saved.segmentColumnIds.join() !== draft.segmentColumnIds.join()) {
    lines.push('Microsegment columns updated')
  }
  return lines
}

export default function RuleCatalog({
  validationId,
  columns: columnsProp,
  state: stateProp,
  onChange,
  shown = true,
  onOpen,
  onRun,
  suggestionWhy,
  focusCheckId,
}: {
  validationId?: string
  columns?: CatalogColumn[]
  state?: CatalogState
  onChange?: (state: CatalogState) => void
  shown?: boolean
  onOpen?: (name: string) => void
  onRun?: () => void
  suggestionWhy?: (checkId: string) => string
  focusCheckId?: string | null
}) {
  const searchId = useId()
  const columnSearchId = useId()
  const columns = columnsProp ?? columnsFor(validationId ?? 'customers')
  const [internal, setInternal] = useState<CatalogState>(() => stateProp ?? seedCatalog(columns))
  const [saved, setSaved] = useState<CatalogState>(() => cloneCatalog(stateProp ?? seedCatalog(columns)))
  const [review, setReview] = useState<null | 'save' | 'run'>(null)
  const [activeId, setActiveId] = useState(catalogChecks[0].id)
  const [group, setGroup] = useState<'Essential' | 'Advanced'>('Essential')
  const [checkQuery, setCheckQuery] = useState('')
  const [columnQuery, setColumnQuery] = useState('')
  const controlled = stateProp !== undefined
  const state = controlled ? stateProp : internal

  function setCatalog(update: CatalogState | ((current: CatalogState) => CatalogState)) {
    const current = controlled ? stateProp : internal
    const next = typeof update === 'function' ? update(current) : update
    if (onChange) onChange(next)
    if (!controlled) setInternal(next)
  }

  const active = catalogChecks.find((check) => check.id === activeId) ?? catalogChecks[0]
  const config = state.checks[active.id]

  useEffect(() => {
    setColumnQuery('')
  }, [activeId])

  useEffect(() => {
    if (!focusCheckId) return
    const check = catalogChecks.find((item) => item.id === focusCheckId)
    if (!check) return
    setGroup(check.group)
    setActiveId(check.id)
    window.requestAnimationFrame(() => {
      document.querySelector(`[data-check-id="${check.id}"]`)?.scrollIntoView({ block: 'nearest' })
    })
  }, [focusCheckId])

  const checkQueryText = checkQuery.trim().toLowerCase()
  const visibleChecks = catalogChecks.filter(
    (check) => check.group === group && Boolean(state.checks[check.id]) && check.name.toLowerCase().includes(checkQueryText),
  )

  function chooseGroup(next: 'Essential' | 'Advanced') {
    setGroup(next)
    const match = (check: (typeof catalogChecks)[number]) =>
      check.group === next && check.name.toLowerCase().includes(checkQueryText)
    const first = catalogChecks.find(match) ?? catalogChecks.find((check) => check.group === next)
    if (first) setActiveId(first.id)
  }
  const columnQueryText = columnQuery.trim().toLowerCase()
  const visibleColumns = columns.filter(
    (column) =>
      column.name.toLowerCase().includes(columnQueryText) || column.format.toLowerCase().includes(columnQueryText),
  )

  function updateCheck(checkId: string, update: (check: CheckConfig) => CheckConfig) {
    setCatalog((current) => ({
      ...current,
      checks: { ...current.checks, [checkId]: update(current.checks[checkId]) },
    }))
  }

  function toggleColumn(columnId: string) {
    updateCheck(active.id, (check) => {
      const column = check.columns[columnId]
      const turningOn = !column.selected
      return {
        ...check,
        columns: {
          ...check.columns,
          [columnId]: {
            ...column,
            selected: turningOn,
            critical: turningOn ? column.critical : false,
          },
        },
      }
    })
  }

  function toggleVisible(visible: CatalogColumn[]) {
    updateCheck(active.id, (check) => {
      const everySelected = visible.every((column) => check.columns[column.id].selected)
      const next = { ...check.columns }
      for (const column of visible) {
        const current = next[column.id]
        if (everySelected) next[column.id] = { ...current, selected: false, critical: false }
        else if (!current.selected) next[column.id] = { ...current, selected: true, critical: false }
      }
      return { ...check, columns: next }
    })
  }

  function toggleVisibleCritical(visible: CatalogColumn[]) {
    updateCheck(active.id, (check) => {
      const allCritical =
        visible.length > 0 && visible.every((column) => check.columns[column.id].selected && check.columns[column.id].critical)
      const next = { ...check.columns }
      for (const column of visible) {
        const current = next[column.id]
        next[column.id] = allCritical
          ? { ...current, critical: false }
          : { ...current, selected: true, critical: true }
      }
      return { ...check, columns: next }
    })
  }

  function toggleColumnCritical(columnId: string) {
    updateCheck(active.id, (check) => {
      const column = check.columns[columnId]
      return {
        ...check,
        columns: {
          ...check.columns,
          [columnId]: { ...column, critical: !column.critical },
        },
      }
    })
  }

  function setCell(columnId: string, fieldId: string, value: string) {
    updateCheck(active.id, (check) => {
      const column = check.columns[columnId]
      return {
        ...check,
        columns: {
          ...check.columns,
          [columnId]: { ...column, values: { ...column.values, [fieldId]: value } },
        },
      }
    })
  }

  function toggleSegment(columnId: string) {
    setCatalog((current) => ({
      ...current,
      segmentColumnIds: current.segmentColumnIds.includes(columnId)
        ? current.segmentColumnIds.filter((id) => id !== columnId)
        : [...current.segmentColumnIds, columnId],
    }))
  }

  if (!config) {
    return shown ? <p className="p-6 text-sm text-muted">Select a table to configure checks.</p> : null
  }

  const selected = selectedColumns(config, columns)
  const dirty = JSON.stringify(state) !== JSON.stringify(saved)
  const changes = dirty ? catalogDiff(saved, state, columns) : []

  function commit() {
    setSaved(cloneCatalog(state))
    setReview(null)
  }

  return (
    <div className={shown ? 'flex h-full min-h-0 flex-1 flex-col' : 'hidden'}>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <aside className="flex max-h-72 min-h-0 shrink-0 flex-col border-b border-line lg:max-h-none lg:w-[280px] lg:border-r lg:border-b-0">
        <div className="shrink-0 border-b border-line p-3">
          <label htmlFor={searchId} className="sr-only">
            Search checks
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-outline">
              <SearchIcon />
            </span>
            <input
              id={searchId}
              type="text"
              value={checkQuery}
              placeholder="Search checks"
              onChange={(event) => setCheckQuery(event.target.value)}
              className="h-9 w-full rounded-md border border-line bg-canvas pr-3 pl-9 font-sans text-sm text-ink transition-colors duration-150 ease-databuck focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1 rounded-md bg-surface p-1" role="group" aria-label="Check group">
            {(['Essential', 'Advanced'] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={group === item}
                onClick={() => chooseGroup(item)}
                className={`h-8 cursor-pointer rounded-md font-label text-xs font-medium tracking-[0.08em] uppercase transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                  group === item ? 'bg-indigo text-white' : 'text-muted hover:text-ink'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="db-scroll min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {visibleChecks.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted">No checks match.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {visibleChecks.map((check) => (
                <li key={check.id}>
                  <CheckListButton
                    check={check}
                    config={state.checks[check.id]}
                    columns={columns}
                    selected={check.id === active.id}
                    why={suggestionWhy?.(check.id)}
                    onSelect={() => setActiveId(check.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <div className="db-scroll min-h-0 flex-1 overflow-auto">
        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-sans text-lg font-semibold tracking-[-0.02em] text-ink">{active.name}</h3>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">{active.summary}</p>
            </div>
            {onOpen ? (
              <button
                type="button"
                onClick={() => onOpen(active.name)}
                className="inline-flex h-8 shrink-0 items-center rounded-md border border-line-strong bg-canvas px-3 font-sans text-sm font-medium text-ink transition-colors duration-150 ease-databuck hover:border-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
              >
                See results
              </button>
            ) : null}
          </div>

          {active.enableOnly ? (
            <div className="flex flex-col gap-3">
              <Switch
                checked={config.enabled}
                label="Enabled"
                onChange={(enabled) =>
                  updateCheck(active.id, (check) => ({
                    ...check,
                    enabled,
                    critical: enabled ? check.critical : false,
                  }))
                }
              />
              <Switch
                checked={config.enabled && config.critical}
                disabled={!config.enabled}
                label="Critical check"
                onChange={(criticalOn) => updateCheck(active.id, (check) => ({ ...check, critical: criticalOn }))}
              />
            </div>
          ) : (
            <>
              {active.segment ? (
                <SegmentPicker columns={columns} selectedIds={state.segmentColumnIds} onToggle={toggleSegment} />
              ) : null}

              {active.composite ? (
                <p className="text-sm leading-6 text-muted">A row fails when the selected values repeat together.</p>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted">
                  {selected.length === 0
                    ? 'Select at least one column to run this check.'
                    : `${selected.length} ${selected.length === 1 ? 'column' : 'columns'} selected`}
                </p>
                <div className="relative w-full max-w-xs">
                  <label htmlFor={columnSearchId} className="sr-only">
                    Filter columns
                  </label>
                  <input
                    id={columnSearchId}
                    type="text"
                    value={columnQuery}
                    placeholder="Filter columns"
                    onChange={(event) => setColumnQuery(event.target.value)}
                    className="h-9 w-full rounded-md border border-line bg-canvas px-3 font-sans text-sm text-ink transition-colors duration-150 ease-databuck focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
                  />
                </div>
              </div>

              <ColumnTable
                check={active}
                config={config}
                columns={visibleColumns}
                onToggleVisible={() => toggleVisible(visibleColumns)}
                onToggleCriticalColumn={toggleColumnCritical}
                onToggleVisibleCritical={() => toggleVisibleCritical(visibleColumns)}
                onToggleColumn={toggleColumn}
                onValue={setCell}
              />
            </>
          )}
        </div>
      </div>
      </div>
      {dirty && !controlled ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-line bg-canvas px-4 py-3">
          <button type="button" className={secondaryButton} onClick={() => setCatalog(cloneCatalog(saved))}>
            Cancel
          </button>
          <button type="button" className={secondaryButton} onClick={() => setReview('save')}>
            Save
          </button>
          <button type="button" className={primaryButton} onClick={() => setReview('run')}>
            Save and run
          </button>
        </div>
      ) : null}
      {review ? (
        <Modal
          title="Review changes"
          size="md"
          onClose={() => setReview(null)}
          footer={
            <>
              <button type="button" className={secondaryButton} onClick={() => setReview(null)}>
                Close
              </button>
              <button
                type="button"
                className={primaryButton}
                onClick={() => {
                  commit()
                  if (review === 'run') onRun?.()
                }}
              >
                {review === 'run' ? 'Save and run' : 'Save'}
              </button>
            </>
          }
        >
          {changes.length === 0 ? (
            <p className="text-sm leading-6 text-muted">No visible field changes.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {changes.slice(0, 12).map((line) => (
                <li key={line} className="text-sm leading-6 text-ink">
                  {line}
                </li>
              ))}
              {changes.length > 12 ? (
                <li className="text-sm text-muted">{changes.length - 12} more</li>
              ) : null}
            </ul>
          )}
        </Modal>
      ) : null}
    </div>
  )
}

function CheckListButton({
  check,
  config,
  columns,
  selected,
  onSelect,
  why,
}: {
  check: CheckDefinition
  config: CheckConfig
  columns: CatalogColumn[]
  selected: boolean
  onSelect: () => void
  why?: string
}) {
  const count = check.enableOnly ? 0 : selectedColumns(config, columns).length
  const critical = check.enableOnly ? 0 : criticalCount(config, columns)
  const status = check.enableOnly ? (config.enabled ? 'On' : 'Off') : count === 0 ? 'Off' : `${count} ${count === 1 ? 'column' : 'columns'}`
  const showCritical = check.enableOnly ? config.enabled && config.critical : critical > 0
  const criticalLabel = check.enableOnly ? 'Critical' : `${critical} critical`

  const quiet = check.enableOnly ? !config.enabled : count === 0

  return (
    <button
      type="button"
      data-check-id={check.id}
      aria-current={selected ? 'true' : undefined}
      title={why}
      onClick={onSelect}
      className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
        selected ? 'bg-secondary-fixed' : 'hover:bg-surface'
      }`}
    >
      <span
        className={`inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-line ${
          selected ? 'bg-canvas text-indigo' : 'bg-surface text-muted'
        }`}
      >
        <CheckGlyph id={check.id} />
      </span>
      <span className="min-w-0 flex-1 truncate font-sans text-sm font-medium text-ink">
        {check.name}
        {why && !quiet ? (
          <span className="ml-2 font-label text-[0.625rem] tracking-[0.08em] text-indigo uppercase">Suggested</span>
        ) : null}
      </span>
      <span className="shrink-0 text-right">
        <span className={`block font-mono text-xs tabular-nums ${quiet ? 'text-muted' : 'text-ink'}`}>{status}</span>
        {showCritical ? <span className="block font-mono text-[11px] text-danger">{criticalLabel}</span> : null}
      </span>
    </button>
  )
}

function CheckGlyph({ id }: { id: string }) {
  const kind = glyphKind(id)
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === 'null' ? <path d="M7 12h10" /> : null}
      {kind === 'duplicate' ? (
        <>
          <rect x="4" y="8" width="10" height="10" rx="1.5" />
          <path d="M10 8V6.5A1.5 1.5 0 0 1 11.5 5H18a1.5 1.5 0 0 1 1.5 1.5V14a1.5 1.5 0 0 1-1.5 1.5H16" />
        </>
      ) : null}
      {kind === 'pattern' ? <path d="M5 16c2-6 4 6 6 0s4 6 6 0 2-6 2-6" /> : null}
      {kind === 'length' ? (
        <>
          <path d="M4 8h16" />
          <path d="M4 8v3M20 8v3M12 8v3" />
        </>
      ) : null}
      {kind === 'date' ? (
        <>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M8 3v4M16 3v4M4 10h16" />
        </>
      ) : null}
      {kind === 'type' ? <path d="M6 18 12 6l6 12M9 13h6" /> : null}
      {kind === 'drift' ? <path d="M3 16c2-1 3-6 5-6s3 8 5 8 3-5 5-5 3 4 3 4" /> : null}
      {kind === 'distribution' ? (
        <>
          <path d="M5 18V10" />
          <path d="M10 18V6" />
          <path d="M15 18v-5" />
          <path d="M20 18V9" />
        </>
      ) : null}
      {kind === 'rules' ? (
        <>
          <path d="M8 7h11" />
          <path d="M8 12h11" />
          <path d="M8 17h11" />
          <path d="m4 7 1.2 1.2L7.5 6" />
        </>
      ) : null}
    </svg>
  )
}

function glyphKind(id: string) {
  if (id === 'null' || id === 'micro-null') return 'null'
  if (id === 'duplicate') return 'duplicate'
  if (id === 'regex' || id === 'default-pattern' || id === 'default-value') return 'pattern'
  if (id === 'length' || id === 'max-length') return 'length'
  if (id === 'date-consistency' || id === 'micro-date') return 'date'
  if (id === 'data-type') return 'type'
  if (id === 'data-drift' || id === 'micro-drift' || id === 'value-anomaly') return 'drift'
  if (id === 'distribution' || id === 'distribution-metric') return 'distribution'
  return 'rules'
}

function Switch({
  checked,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean
  disabled?: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex w-fit cursor-pointer items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 ease-databuck ${checked ? 'bg-indigo' : 'bg-container-high'}`}>
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-canvas shadow-card transition-transform duration-150 ease-databuck ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </span>
      <span className="font-sans text-sm text-ink">{label}</span>
    </button>
  )
}

function SegmentPicker({
  columns,
  selectedIds,
  onToggle,
}: {
  columns: CatalogColumn[]
  selectedIds: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div>
      <p className="font-label text-[0.6875rem] font-medium tracking-[0.08em] text-muted uppercase">Segment by</p>
      <p className="mt-1 text-sm text-muted">Segment columns are shared by every microsegment check.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {columns.map((column) => {
          const on = selectedIds.includes(column.id)
          return (
            <button
              key={column.id}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(column.id)}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                on ? 'border-indigo bg-secondary-fixed' : 'border-line bg-canvas hover:border-line-strong hover:bg-surface'
              }`}
            >
              <span className="font-mono text-sm text-ink">{column.name}</span>
              <span className="font-mono text-xs text-muted">{column.format}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ColumnTable({
  check,
  config,
  columns,
  onToggleVisible,
  onToggleColumn,
  onToggleCriticalColumn,
  onToggleVisibleCritical,
  onValue,
}: {
  check: CheckDefinition
  config: CheckConfig
  columns: CatalogColumn[]
  onToggleVisible: () => void
  onToggleColumn: (columnId: string) => void
  onToggleCriticalColumn: (columnId: string) => void
  onToggleVisibleCritical: () => void
  onValue: (columnId: string, fieldId: string, value: string) => void
}) {
  const every = columns.length > 0 && columns.every((column) => config.columns[column.id].selected)
  const some = columns.some((column) => config.columns[column.id].selected)
  const everyCritical =
    columns.length > 0 && columns.every((column) => config.columns[column.id].selected && config.columns[column.id].critical)
  const someCritical = columns.some((column) => config.columns[column.id].critical)

  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse text-left ${check.fields.some((field) => field.kind === 'text') ? 'min-w-[680px]' : ''}`}>
        <caption className="sr-only">{check.name} columns</caption>
        <thead>
          <tr>
            <th scope="col" className={`${headClass} w-10`}>
              <SelectBox
                checked={every}
                indeterminate={!every && some}
                label="Select visible columns"
                onChange={onToggleVisible}
              />
            </th>
            <th scope="col" className={headClass}>
              Column
            </th>
            <th scope="col" className={headClass}>
              Format
            </th>
            {check.fields.map((field) => (
              <th key={field.id} scope="col" className={headClass}>
                {field.label}
              </th>
            ))}
            <th scope="col" className={headClass}>
              <span className="inline-flex items-center gap-2">
                <SelectBox
                  checked={everyCritical}
                  indeterminate={!everyCritical && someCritical}
                  disabled={columns.length === 0}
                  label="Mark visible columns critical"
                  onChange={onToggleVisibleCritical}
                />
                Critical
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {columns.length === 0 ? (
            <tr>
              <td colSpan={4 + check.fields.length} className="px-3 py-6 text-sm text-muted">
                No columns match.
              </td>
            </tr>
          ) : (
            columns.map((column) => {
              const row = config.columns[column.id]
              return (
                <tr key={column.id} className="border-b border-line last:border-0">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={row.selected}
                      aria-label={`Select ${column.name}`}
                      onChange={() => onToggleColumn(column.id)}
                      className="size-4 accent-indigo"
                    />
                  </td>
                  <td className="px-3 py-2 font-mono text-sm text-ink">{column.name}</td>
                  <td className="px-3 py-2 font-mono text-sm text-muted">{column.format}</td>
                  {check.fields.map((field) => (
                    <td key={field.id} className="px-3 py-2">
                      <FieldInput
                        field={field}
                        value={row.values[field.id] ?? ''}
                        disabled={!row.selected}
                        onChange={(value) => onValue(column.id, field.id, value)}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={row.selected && row.critical}
                      disabled={!row.selected}
                      aria-label={`Critical for ${column.name}`}
                      onChange={() => onToggleCriticalColumn(column.id)}
                      className="size-4 accent-indigo disabled:opacity-40"
                    />
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

function FieldInput({
  field,
  value,
  disabled,
  onChange,
}: {
  field: CheckField
  value: string
  disabled: boolean
  onChange: (value: string) => void
}) {
  return (
    <div className="relative w-full min-w-0">
      <input
        type="text"
        inputMode={field.kind === 'text' ? 'text' : 'decimal'}
        value={value}
        disabled={disabled}
        placeholder={field.placeholder}
        aria-label={field.label}
        onChange={(event) => onChange(event.target.value)}
        className={`${fieldClass} ${field.kind === 'percent' ? 'pr-7' : ''}`}
      />
      {field.kind === 'percent' ? (
        <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 font-mono text-xs text-muted">%</span>
      ) : null}
    </div>
  )
}

function SelectBox({
  checked,
  indeterminate,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean
  indeterminate: boolean
  disabled?: boolean
  label: string
  onChange: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      aria-label={label}
      onChange={onChange}
      className="size-4 accent-indigo disabled:opacity-40"
    />
  )
}

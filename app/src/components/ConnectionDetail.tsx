import { useEffect, useState, type ReactNode } from 'react'
import {
  fieldGroupsFor,
  formatFieldValue,
  isYes,
  typeLabels,
  type ConnectionField,
} from '../data/connectionFields.ts'
import {
  tableMetadata,
  tableMetrics,
  columnProfiles,
  type DataSource,
  type SourceTable,
} from '../data/sources.ts'
import type { SourceSelection } from './ConnectionsPanel.tsx'
import EmptyState from './EmptyState.tsx'
import { BackIcon, DatabaseIcon, InboxIcon, TableIcon } from './icons.tsx'
import IconBox from './IconBox.tsx'
import StatusBadge from './StatusBadge.tsx'
import TableProfile from './TableProfile.tsx'
import {
  Field,
  fieldClass,
  Modal,
  primaryButton,
  secondaryButton,
  SwitchControl,
} from './wizard/ui.tsx'

type SourceTab = 'details' | 'tables'
type TableTab = 'overview' | 'configure' | 'profile' | 'validations'

const dangerButton =
  'inline-flex h-10 items-center rounded-md px-3 font-sans text-sm font-medium text-danger transition-colors duration-150 ease-databuck hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo'

function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[]
  active: string
  onChange: (id: string) => void
}) {
  return (
    <div
      role="tablist"
      className="flex shrink-0 gap-6 border-b border-line px-6"
      onKeyDown={(event) => {
        const index = tabs.findIndex((tab) => tab.id === active)
        if (event.key === 'ArrowRight') {
          event.preventDefault()
          onChange(tabs[(index + 1) % tabs.length].id)
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          onChange(tabs[(index - 1 + tabs.length) % tabs.length].id)
        }
      }}
    >
      {tabs.map((tab) => {
        const selected = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`-mb-px cursor-pointer border-b-2 py-3 font-label text-xs font-medium tracking-[0.08em] uppercase transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
              selected ? 'border-indigo text-indigo' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export default function ConnectionDetail({
  sources,
  selection,
  onSaveSource,
  onSaveTable,
  onCopySource,
  onToggleActive,
  editSignal = 0,
  onCreateValidation,
}: {
  sources: DataSource[]
  selection: SourceSelection
  onSaveSource: (source: DataSource) => void
  onSaveTable: (sourceId: string, table: SourceTable) => void
  onCopySource?: (source: DataSource) => void
  onToggleActive?: (source: DataSource) => void
  editSignal?: number
  onCreateValidation?: () => void
}) {
  const source =
    selection.kind === 'source'
      ? sources.find((item) => item.id === selection.id)
      : sources.find((item) => item.tables.some((table) => table.id === selection.id))
  const table = source?.tables.find((item) => selection.kind === 'table' && item.id === selection.id)
  const [tab, setTab] = useState<SourceTab | TableTab>(selection.kind === 'table' ? 'overview' : 'details')
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    setTab(selection.kind === 'table' ? 'overview' : 'details')
    setEditing(false)
  }, [selection.kind, selection.id])

  useEffect(() => {
    if (editSignal && selection.kind === 'source') {
      setTab('details')
      setEditing(true)
    }
  }, [editSignal, selection.kind])

  if (!source) return null

  return (
    <div className="flex h-full min-h-0 flex-col">
      {table ? (
        <TableHeader table={table} sourceName={source.name} />
      ) : (
        <SourceHeader
          source={source}
          editing={editing}
          onEdit={() => {
            setTab('details')
            setEditing(true)
          }}
          onCancel={() => setEditing(false)}
          onCopy={() => onCopySource?.(source)}
        />
      )}
      {!table && source.type === 'BigQuery' ? (
        <div className="flex shrink-0 flex-wrap gap-2 border-b border-line px-6 py-3">
          <button type="button" className={secondaryButton} onClick={() => setNotice('CDE updated for this source.')}>
            Update CDE
          </button>
          <button
            type="button"
            className={secondaryButton}
            aria-label="Discover/Update Cross-table relationships"
            onClick={() => setNotice('Cross-table relationships were refreshed.')}
          >
            Cross-table relationships
          </button>
        </div>
      ) : null}
      <Tabs
        active={tab}
        onChange={(id) => setTab(id as SourceTab | TableTab)}
        tabs={
          table
            ? [
                { id: 'overview', label: 'Overview' },
                { id: 'configure', label: 'Configure' },
                { id: 'profile', label: 'Profile' },
                { id: 'validations', label: 'Validations' },
              ]
            : [
                { id: 'details', label: 'Details' },
                { id: 'tables', label: 'Tables' },
              ]
        }
      />
      <div className="db-scroll min-h-0 flex-1 overflow-auto p-6">
        {table ? (
          <TableBody
            tab={tab as TableTab}
            table={table}
            onSave={(next) => onSaveTable(source.id, next)}
            onCreateValidation={onCreateValidation}
          />
        ) : tab === 'tables' ? (
          <TablesTab source={source} />
        ) : (
          <SourceDetails
            source={source}
            editing={editing}
            onSave={(next) => {
              onSaveSource(next)
              setEditing(false)
            }}
            onToggleActive={() => onToggleActive?.(source)}
          />
        )}
      </div>
      {notice ? (
        <Modal
          title="Done"
          onClose={() => setNotice(null)}
          footer={
            <button type="button" className={primaryButton} onClick={() => setNotice(null)}>
              Close
            </button>
          }
        >
          <p className="text-sm leading-6 text-muted">{notice}</p>
        </Modal>
      ) : null}
    </div>
  )
}

function SourceHeader({
  source,
  editing,
  onEdit,
  onCancel,
  onCopy,
}: {
  source: DataSource
  editing: boolean
  onEdit: () => void
  onCancel: () => void
  onCopy: () => void
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <IconBox size="lg">
          <DatabaseIcon size={18} />
        </IconBox>
        <div className="min-w-0">
          <h2 className="truncate font-sans text-lg font-semibold tracking-[-0.02em] text-ink">{source.name}</h2>
          <div className="mt-1 flex items-center gap-3">
            <span className="font-sans text-sm text-muted">{typeLabels[source.type]}</span>
            <StatusBadge tone={source.active ? 'success' : 'danger'} label={source.active ? 'Active' : 'Inactive'} />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {editing ? (
          <>
            <button type="button" className={secondaryButton} onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" form="source-details-form" className={primaryButton}>
              Save
            </button>
          </>
        ) : (
          <>
            <button type="button" className={secondaryButton} onClick={onEdit}>
              Edit
            </button>
            <button type="button" className={secondaryButton} onClick={onCopy}>
              Copy
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function SourceDetails({
  source,
  editing,
  onSave,
  onToggleActive,
}: {
  source: DataSource
  editing: boolean
  onSave: (source: DataSource) => void
  onToggleActive: () => void
}) {
  const [name, setName] = useState(source.name)
  const [schema, setSchema] = useState(source.schema)
  const [values, setValues] = useState<Record<string, string>>(source.properties)
  const groups = fieldGroupsFor(source.type)

  useEffect(() => {
    setName(source.name)
    setSchema(source.schema)
    setValues(source.properties)
  }, [source, editing])

  function setValue(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  return (
    <form
      id="source-details-form"
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        onSave({
          ...source,
          name: name.trim() || source.name,
          schema: schema.trim() || values.datasetName || values.databaseSchema || source.schema,
          properties: values,
        })
      }}
    >
      {groups.map((group) => (
        <Panel key={group.id} title={group.label}>
          {editing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {group.fields.map((field) => (
                <div key={field.key} className={field.kind === 'boolean' ? 'sm:col-span-2' : undefined}>
                  {field.key === '_name' ? (
                    <Field label={field.label}>
                      <input value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
                    </Field>
                  ) : field.key === '_schema' ? (
                    <Field label={field.label}>
                      <input value={schema} onChange={(event) => setSchema(event.target.value)} className={fieldClass} />
                    </Field>
                  ) : (
                    <PropertyField field={field} value={values[field.key] ?? ''} onChange={(value) => setValue(field.key, value)} />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {group.fields.map((field) => {
                const value = field.key === '_name' ? name : field.key === '_schema' ? schema : values[field.key] ?? ''
                return (
                  <div key={field.key}>
                    <dt className="font-label text-xs font-medium tracking-[0.08em] text-muted uppercase">{field.label}</dt>
                    <dd className="mt-1 font-mono text-sm break-all text-ink">{formatFieldValue(field, value)}</dd>
                  </div>
                )
              })}
            </dl>
          )}
        </Panel>
      ))}
      {editing ? null : (
        <div className="flex justify-end">
          <button type="button" className={dangerButton} onClick={onToggleActive}>
            {source.active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      )}
    </form>
  )
}

function PropertyField({
  field,
  value,
  onChange,
}: {
  field: ConnectionField
  value: string
  onChange: (value: string) => void
}) {
  if (field.kind === 'readonly') {
    return (
      <div>
        <p className="mb-2 font-label text-xs font-medium tracking-[0.08em] text-muted uppercase">{field.label}</p>
        <p className="font-mono text-sm text-ink">{value || '—'}</p>
      </div>
    )
  }
  if (field.kind === 'boolean') {
    return (
      <div className="flex h-10 items-center justify-between gap-3 rounded-md border border-line px-3">
        <span className="font-sans text-sm text-ink">{field.label}</span>
        <SwitchControl checked={isYes(value)} onChange={(on) => onChange(on ? 'Y' : 'N')} />
      </div>
    )
  }
  if (field.kind === 'enum' && field.options) {
    return (
      <Field label={field.label}>
        <select value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass}>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>
    )
  }
  return (
    <Field label={field.label}>
      <input
        type={field.kind === 'password' ? 'password' : field.kind === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
      />
    </Field>
  )
}

function TablesTab({ source }: { source: DataSource }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const selected = source.tables.find((table) => table.id === openId) ?? null

  useEffect(() => {
    setOpenId(null)
  }, [source.id])

  if (source.tables.length === 0) {
    return <p className="text-sm text-muted">No tables in this data source.</p>
  }

  if (selected) {
    const meta = tableMetadata(selected, source.type)
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors duration-150 ease-databuck hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
            aria-label="Back to tables"
            onClick={() => setOpenId(null)}
          >
            <BackIcon />
          </button>
          <div className="min-w-0">
            <h3 className="truncate font-sans text-base font-semibold tracking-[-0.02em] text-ink">{selected.nickname}</h3>
            <p className="mt-0.5 font-mono text-xs text-muted">
              {selected.name} · {selected.columns} columns
            </p>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-line">
          <table className="w-full min-w-[28rem] border-collapse text-sm">
            <thead>
              <tr>
                {meta.headers.map((header) => (
                  <th
                    key={header}
                    className="bg-canvas px-4 py-2 text-left font-label text-xs font-medium tracking-[0.08em] text-muted uppercase"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meta.rows.map((row) => (
                <tr key={row[0]} className="border-t border-line">
                  {row.map((cell, index) => (
                    <td key={`${row[0]}-${index}`} className="px-4 py-2.5 font-mono text-ink">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-line rounded-lg border border-line">
      {source.tables.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => setOpenId(item.id)}
            className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors duration-150 ease-databuck hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
          >
            <span className="min-w-0">
              <span className="block truncate font-sans text-sm font-medium text-ink">{item.nickname}</span>
              <span className="mt-0.5 block truncate font-mono text-xs text-muted">{item.name}</span>
            </span>
            <span className="shrink-0 font-mono text-xs text-muted tabular-nums">{item.columns} columns</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function seed(value: string) {
  return [...value].reduce((total, character) => total + character.charCodeAt(0), 0)
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-line bg-canvas">
      <h3 className="border-b border-line bg-surface px-5 py-3.5 font-sans text-sm font-semibold text-ink">{title}</h3>
      <div className="p-5">{children}</div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-4">
      <p className="font-label text-xs font-medium tracking-[0.08em] text-muted uppercase">{label}</p>
      <p className="mt-2 font-sans text-3xl font-bold tracking-[-0.03em] text-ink tabular-nums">{value}</p>
    </div>
  )
}

function TableHeader({ table, sourceName }: { table: SourceTable; sourceName: string }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <IconBox size="lg">
          <TableIcon size={18} />
        </IconBox>
        <div className="min-w-0">
          <h2 className="truncate font-sans text-lg font-semibold tracking-[-0.02em] text-ink">{table.nickname}</h2>
          <p className="mt-1 truncate text-sm text-muted">
            <span className="font-mono">{table.name}</span>
            <span> · {sourceName}</span>
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={secondaryButton}>
          Rediscover Rules
        </button>
        <button type="button" className={secondaryButton}>
          Refresh Metadata
        </button>
        <button type="button" className={secondaryButton}>
          Rerun Profile
        </button>
      </div>
    </div>
  )
}

function TableBody({
  tab,
  table,
  onSave,
  onCreateValidation,
}: {
  tab: TableTab
  table: SourceTable
  onSave: (table: SourceTable) => void
  onCreateValidation?: () => void
}) {
  if (tab === 'validations') {
    return (
      <EmptyState
        icon={<InboxIcon />}
        title="No validations yet."
        action={
          onCreateValidation ? (
            <button type="button" onClick={onCreateValidation} className={primaryButton}>
              Create validation
            </button>
          ) : undefined
        }
        className="min-h-48"
      />
    )
  }
  if (tab === 'configure') return <TableForm table={table} onSave={onSave} />
  if (tab === 'profile') return <TableProfile table={table} />
  return <TableOverview table={table} />
}

function TableOverview({ table }: { table: SourceTable }) {
  const metrics = tableMetrics(table)
  const value = seed(table.id)
  const cards = [
    { label: 'Columns', value: String(table.columns) },
    { label: 'Rows', value: metrics.rows.toLocaleString('en-US') },
    { label: 'Missing', value: `${metrics.missingPct}%` },
    { label: 'Last profiled', value: '5h ago' },
  ]
  const watched = [...columnProfiles(table)].sort((left, right) => Number(right.missingPct) - Number(left.missingPct)).slice(0, 3)
  const counts = ['Today', 'Yesterday', '18 Sep', '17 Sep'].map((label, index) => ({
    label,
    rows: Math.max(metrics.rows - index * (180 + (value % 90)), 0),
  }))
  const runs = [
    { name: 'Profile', when: 'Today, 05:40', result: 'Completed' },
    { name: 'Metadata refresh', when: 'Today, 05:12', result: 'Completed' },
    { name: 'Freshness check', when: 'Yesterday, 18:04', result: 'Completed' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Metric key={card.label} label={card.label} value={card.value} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Columns to watch">
          <ul className="flex flex-col gap-3">
            {watched.map((column) => (
              <li key={column.name} className="flex items-center justify-between gap-4">
                <span>
                  <span className="block font-mono text-sm text-ink">{column.name}</span>
                  <span className="mt-0.5 block text-xs text-muted">{column.dataType}</span>
                </span>
                <span className="font-mono text-sm text-ink tabular-nums">{column.missingPct}% missing</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Freshness">
          <p className="text-sm text-muted">Last profiled today at 05:40.</p>
          <ul className="mt-4 flex flex-col gap-3">
            {counts.map((count) => (
              <li key={count.label} className="flex items-center justify-between gap-4">
                <span className="font-sans text-sm text-ink">{count.label}</span>
                <span className="font-mono text-sm text-ink tabular-nums">{count.rows.toLocaleString('en-US')}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <Panel title="Recent runs">
        <ul className="divide-y divide-line">
          {runs.map((run) => (
            <li key={run.name} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <span>
                <span className="block font-sans text-sm text-ink">{run.name}</span>
                <span className="mt-0.5 block text-xs text-muted">{run.when}</span>
              </span>
              <StatusBadge tone={run.result === 'Attention' ? 'danger' : 'success'} label={run.result} />
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}

function TableForm({ table, onSave }: { table: SourceTable; onSave: (table: SourceTable) => void }) {
  const [draft, setDraft] = useState(table)

  useEffect(() => {
    setDraft(table)
  }, [table])

  return (
    <form
      className="flex max-w-lg flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSave(draft)
      }}
    >
      <Field label="Nickname">
        <input
          value={draft.nickname}
          onChange={(event) => setDraft((current) => ({ ...current, nickname: event.target.value }))}
          className={fieldClass}
        />
      </Field>
      <Field label="Description">
        <textarea
          value={draft.description}
          rows={3}
          onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
          className="w-full rounded-md border border-line bg-canvas px-3 py-2 font-sans text-sm leading-6 text-ink transition-colors duration-150 ease-databuck focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
        />
      </Field>
      <Field label="Row filter">
        <input
          value={draft.rowFilter}
          onChange={(event) => setDraft((current) => ({ ...current, rowFilter: event.target.value }))}
          className={fieldClass}
        />
      </Field>
      <button type="submit" className={`${primaryButton} mt-2 w-fit`}>
        Save
      </button>
    </form>
  )
}

import { useEffect, useState, type ReactNode } from 'react'
import {
  columnProfiles,
  correlations,
  microsegments,
  previewRows,
  tableMetrics,
  type DataSource,
  type SourceConnection,
  type SourceTable,
} from '../data/sources.ts'
import type { SourceSelection } from './ConnectionsPanel.tsx'
import EmptyState from './EmptyState.tsx'
import { DatabaseIcon, InboxIcon, TableIcon } from './icons.tsx'
import IconBox from './IconBox.tsx'
import StatusBadge from './StatusBadge.tsx'

type SourceTab = 'overview' | 'configure'
type TableTab = 'overview' | 'configure' | 'profile' | 'validations'

const inputClass =
  'h-11 w-full rounded-md border border-line bg-canvas px-3 font-sans text-sm text-ink transition-colors duration-150 ease-databuck focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo'

const secondaryButton =
  'inline-flex h-10 items-center rounded-md border border-line-strong bg-canvas px-3 font-sans text-sm font-medium text-ink transition-colors duration-150 ease-databuck hover:border-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo'

const primaryButton =
  'inline-flex h-10 items-center rounded-md bg-indigo px-4 font-sans text-sm font-medium text-white transition-colors duration-150 ease-databuck hover:bg-indigo-hover active:bg-indigo-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink'

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

function DetailGrid({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label}>
          <dt className="font-label text-xs font-medium tracking-[0.08em] text-muted uppercase">{row.label}</dt>
          <dd className="mt-1 font-mono text-sm break-all text-ink">{row.value || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

function sourceRows(source: DataSource) {
  const connection = source.connection
  const created = { label: 'Created on', value: connection.createdOn }
  const username = { label: 'Username', value: connection.username }
  if (source.type === 'BigQuery') {
    return [
      { label: 'Project', value: connection.project },
      { label: 'Dataset', value: source.schema },
      { label: 'Location', value: connection.location },
      { label: 'Service account', value: connection.serviceAccount },
      username,
      created,
    ]
  }
  if (source.type === 'Databricks') {
    return [
      { label: 'Workspace URL', value: connection.workspaceUrl },
      { label: 'Catalog', value: connection.catalog },
      { label: 'Schema', value: source.schema },
      { label: 'Warehouse', value: connection.warehouse },
      username,
      created,
    ]
  }
  if (source.type === 'Teradata') {
    return [
      { label: 'Host', value: connection.host },
      { label: 'Port', value: connection.port },
      { label: 'Database', value: source.schema },
      username,
      { label: 'Logon mechanism', value: connection.logon },
      created,
    ]
  }
  return [
    { label: 'Host', value: connection.host },
    { label: 'Port', value: connection.port },
    { label: 'Database', value: source.schema },
    username,
    { label: 'Encrypt', value: connection.encrypt },
    created,
  ]
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, '-')
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block font-label text-xs font-medium tracking-[0.08em] text-muted uppercase">{label}</span>
      <input id={id} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} />
    </label>
  )
}

export default function ConnectionDetail({
  sources,
  selection,
  onSaveSource,
  onSaveTable,
  onAddTable,
  onCreateValidation,
}: {
  sources: DataSource[]
  selection: SourceSelection
  onSaveSource: (source: DataSource) => void
  onSaveTable: (sourceId: string, table: SourceTable) => void
  onAddTable: () => void
  onCreateValidation?: () => void
}) {
  const source =
    selection.kind === 'source'
      ? sources.find((item) => item.id === selection.id)
      : sources.find((item) => item.tables.some((table) => table.id === selection.id))
  const table = source?.tables.find((item) => selection.kind === 'table' && item.id === selection.id)
  const [tab, setTab] = useState<SourceTab | TableTab>('overview')

  useEffect(() => {
    setTab('overview')
  }, [selection.kind, selection.id])

  if (!source) return null

  return (
    <div className="flex h-full min-h-0 flex-col">
      {table ? (
        <TableHeader table={table} sourceName={source.name} />
      ) : (
        <SourceHeader source={source} onAddTable={onAddTable} />
      )}
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
                { id: 'overview', label: 'Overview' },
                { id: 'configure', label: 'Configure' },
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
        ) : tab === 'configure' ? (
          <SourceForm source={source} onSave={onSaveSource} />
        ) : (
          <SourceOverview source={source} />
        )}
      </div>
    </div>
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

function SourceOverview({ source }: { source: DataSource }) {
  const value = seed(source.id)
  const onboarded = source.tables.length
  const approved = source.tables.filter((item) => item.approved).length
  const latency = source.active ? `${18 + (value % 40)} ms` : '—'
  const syncs = [
    { when: 'Today, 06:12', result: source.active ? 'Succeeded' : 'Failed', detail: `${onboarded} tables` },
    { when: 'Yesterday, 06:11', result: 'Succeeded', detail: 'Schema unchanged' },
    { when: '20 Sep, 06:08', result: 'Succeeded', detail: `${Math.max(onboarded - 1, 0)} tables` },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Onboarded tables" value={String(onboarded)} />
        <Metric label="Approved" value={`${approved}/${onboarded || 0}`} />
        <Metric label="Last sync" value={source.active ? '2h ago' : '14d ago'} />
        <Metric label="Latency" value={latency} />
      </div>
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <Panel title="Connection details">
            <DetailGrid rows={sourceRows(source)} />
          </Panel>
        </div>
        <div className="xl:col-span-2">
          <Panel title="Recent syncs">
            <ul className="flex flex-col gap-3">
              {syncs.map((sync) => (
                <li key={sync.when} className="flex items-start justify-between gap-4">
                  <span>
                    <span className="block font-sans text-sm text-ink">{sync.when}</span>
                    <span className="mt-0.5 block text-xs text-muted">{sync.detail}</span>
                  </span>
                  <StatusBadge tone={sync.result === 'Failed' ? 'danger' : 'success'} label={sync.result} />
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
      <Panel title="Onboarded tables">
        {source.tables.length === 0 ? (
          <p className="text-sm text-muted">No tables onboarded.</p>
        ) : (
          <ul className="divide-y divide-line">
            {source.tables.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <span className="min-w-0">
                  <span className="block truncate font-sans text-sm font-medium text-ink">{item.nickname}</span>
                  <span className="mt-0.5 block truncate font-mono text-xs text-muted">{item.name}</span>
                </span>
                <span className="shrink-0 font-mono text-xs text-muted tabular-nums">{item.columns} columns</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}

function SourceHeader({ source, onAddTable }: { source: DataSource; onAddTable: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-line px-6 py-4">
      <IconBox size="lg">
        <DatabaseIcon size={18} />
      </IconBox>
      <div className="min-w-0">
        <h2 className="truncate font-sans text-lg font-semibold tracking-[-0.02em] text-ink">{source.name}</h2>
        <div className="mt-1 flex items-center gap-3">
          <span className="font-sans text-sm text-muted">{source.type}</span>
          <StatusBadge tone={source.active ? 'success' : 'danger'} label={source.active ? 'Active' : 'Inactive'} />
        </div>
      </div>
      <button type="button" onClick={onAddTable} className={`${primaryButton} ml-auto shrink-0`}>
        Add Table
      </button>
    </div>
  )
}

function SourceForm({ source, onSave }: { source: DataSource; onSave: (source: DataSource) => void }) {
  const [draft, setDraft] = useState(source)

  useEffect(() => {
    setDraft(source)
  }, [source])

  function setConnection(key: keyof SourceConnection, value: string) {
    setDraft((current) => ({ ...current, connection: { ...current.connection, [key]: value } }))
  }

  const fields = sourceRows(draft).filter((row) => row.label !== 'Created on')

  return (
    <form
      className="flex max-w-lg flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSave(draft)
      }}
    >
      <Field label="Name" value={draft.name} onChange={(name) => setDraft((current) => ({ ...current, name }))} />
      {fields.map((field) => (
        <Field
          key={field.label}
          label={field.label}
          value={field.value}
          onChange={(value) => {
            if (field.label === 'Database' || field.label === 'Dataset' || field.label === 'Schema') {
              setDraft((current) => ({ ...current, schema: value }))
              return
            }
            const key = connectionKey(field.label)
            if (key) setConnection(key, value)
          }}
        />
      ))}
      <div>
        <span className="mb-2 block font-label text-xs font-medium tracking-[0.08em] text-muted uppercase">
          Created on
        </span>
        <p className="font-mono text-sm text-ink">{draft.connection.createdOn}</p>
      </div>
      <button type="submit" className={`${primaryButton} mt-2 w-fit`}>
        Save
      </button>
    </form>
  )
}

function connectionKey(label: string): keyof SourceConnection | null {
  const keys: Record<string, keyof SourceConnection> = {
    Host: 'host',
    Port: 'port',
    Username: 'username',
    Encrypt: 'encrypt',
    'Logon mechanism': 'logon',
    Project: 'project',
    Location: 'location',
    'Service account': 'serviceAccount',
    'Workspace URL': 'workspaceUrl',
    Catalog: 'catalog',
    Warehouse: 'warehouse',
  }
  return keys[label] ?? null
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
  if (tab === 'profile') return <Profile table={table} />
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
      <Field
        label="Nickname"
        value={draft.nickname}
        onChange={(nickname) => setDraft((current) => ({ ...current, nickname }))}
      />
      <label htmlFor="table-description" className="block">
        <span className="mb-2 block font-label text-xs font-medium tracking-[0.08em] text-muted uppercase">
          Description
        </span>
        <textarea
          id="table-description"
          value={draft.description}
          rows={3}
          onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
          className="w-full rounded-md border border-line bg-canvas px-3 py-2 font-sans text-sm leading-6 text-ink transition-colors duration-150 ease-databuck focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
        />
      </label>
      <Field
        label="Row filter"
        value={draft.rowFilter}
        onChange={(rowFilter) => setDraft((current) => ({ ...current, rowFilter }))}
      />
      <button type="submit" className={`${primaryButton} mt-2 w-fit`}>
        Save
      </button>
    </form>
  )
}

function Profile({ table }: { table: SourceTable }) {
  const columns = columnProfiles(table)
  const segments = microsegments(table)
  const pairs = correlations(table)
  const rows = previewRows(table)

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h3 className="mb-4 font-sans text-sm font-semibold text-ink">Column profile</h3>
        <div className="db-scroll overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead className="sticky top-0 bg-canvas">
              <tr className="border-b border-line">
                {[
                  ['Column', 'text-left'],
                  ['Data type', 'text-left'],
                  ['Missing count', 'text-right'],
                  ['Missing %', 'text-right'],
                  ['Unique %', 'text-right'],
                  ['Mean', 'text-right'],
                  ['Std dev', 'text-right'],
                ].map(([heading, align]) => (
                  <th
                    key={heading}
                    className={`px-4 py-2 font-label text-xs font-medium tracking-[0.08em] text-muted uppercase ${align}`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {columns.map((column) => (
                <tr key={column.name} className="border-b border-line transition-colors duration-150 ease-databuck last:border-0 even:bg-surface hover:bg-container">
                  <td className="px-4 py-2 font-mono text-sm text-ink">{column.name}</td>
                  <td className="px-4 py-2 font-mono text-sm text-muted">{column.dataType}</td>
                  <td className="px-4 py-2 text-right font-mono text-sm text-ink tabular-nums">{column.missingCount.toLocaleString('en-US')}</td>
                  <td className="px-4 py-2 text-right font-mono text-sm text-ink tabular-nums">{column.missingPct}</td>
                  <td className="px-4 py-2 text-right font-mono text-sm text-ink tabular-nums">{column.uniquePct}</td>
                  <td className="px-4 py-2 text-right font-mono text-sm text-ink tabular-nums">{column.mean}</td>
                  <td className="px-4 py-2 text-right font-mono text-sm text-ink tabular-nums">{column.stdDev}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="mb-4 font-sans text-sm font-semibold text-ink">Microsegments</h3>
        <ul className="divide-y divide-line rounded-lg border border-line">
          {segments.map((segment) => (
            <li key={segment.name} className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="font-sans text-sm text-ink">{segment.name}</span>
              <span className="font-mono text-sm text-muted tabular-nums">
                {segment.rows.toLocaleString('en-US')} · {segment.share}%
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-4 font-sans text-sm font-semibold text-ink">Column correlation</h3>
        <ul className="divide-y divide-line rounded-lg border border-line">
          {pairs.map((pair) => (
            <li key={`${pair.left}-${pair.right}`} className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="font-mono text-sm text-ink">
                {pair.left} · {pair.right}
              </span>
              <span className="font-mono text-sm text-muted tabular-nums">{pair.coefficient}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-4 font-sans text-sm font-semibold text-ink">Data view</h3>
        <div className="db-scroll overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead className="sticky top-0 bg-canvas">
              <tr className="border-b border-line">
                {columns.map((column) => (
                  <th
                    key={column.name}
                    className="px-4 py-2 font-label text-xs font-medium tracking-[0.08em] text-muted uppercase"
                  >
                    {column.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-b border-line transition-colors duration-150 ease-databuck last:border-0 even:bg-surface hover:bg-container">
                  {columns.map((column) => (
                    <td key={column.name} className="px-4 py-2 font-mono text-sm text-ink tabular-nums">
                      {row[column.name]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

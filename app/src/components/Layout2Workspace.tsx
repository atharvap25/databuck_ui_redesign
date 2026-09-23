import { useCallback, useEffect, useId, useRef, useState, type ReactNode, type Ref } from 'react'
import { createPortal } from 'react-dom'
import {
  dataSources as initialSources,
  tableMetrics,
  type DataSource,
  type SourceType,
} from '../data/sources.ts'
import { scoreTone, validationRuns, type ValidationRun } from '../data/validations.ts'
import ConnectionDetail from './ConnectionDetail.tsx'
import type { SourceSelection } from './ConnectionsPanel.tsx'
import EmptyState from './EmptyState.tsx'
import IconBox from './IconBox.tsx'
import QualityDetail from './QualityDetail.tsx'
import StatusBadge from './StatusBadge.tsx'
import UnderDevelopmentDialog from './UnderDevelopmentDialog.tsx'
import {
  BackIcon,
  CardIcon,
  ChevronIcon,
  ClockIcon,
  DatabaseIcon,
  EllipsisIcon,
  ExportIcon,
  FilterIcon,
  ListIcon,
  PlusIcon,
  SearchIcon,
  TableIcon,
} from './icons.tsx'

export type Layout2Screen = 'data-sources' | 'tables' | 'data-quality'

type ViewMode = 'list' | 'card'
type FilterKey = 'status' | 'type' | 'approved' | 'connection' | 'result' | 'schema'
type Filters = Record<FilterKey, string[]>
type MenuItem = { id: string; label: string; tone?: 'danger' }
type Chip = { group: FilterKey; id: string; label: string }
type FilterOption = { id: string; label: string; count: number }
type FilterGroup = { id: FilterKey; legend: string; options: FilterOption[] }
type TableRecord = { source: DataSource; table: DataSource['tables'][number] }

const sourceTypes: SourceType[] = ['BigQuery', 'Databricks', 'MSSQL', 'Teradata']
const validationSchemas = Array.from(new Set(validationRuns.map((run) => run.schema))).sort()

const sourceMenu: MenuItem[] = [
  { id: 'add-table', label: 'Add Table' },
  { id: 'copy', label: 'Copy' },
  { id: 'edit', label: 'Edit' },
  { id: 'deactivate', label: 'Deactivate' },
]

const tableMenu: MenuItem[] = [
  { id: 'create-validation', label: 'Create validation' },
  { id: 'copy', label: 'Copy' },
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Delete', tone: 'danger' },
]

const validationMenu: MenuItem[] = [
  { id: 'bucks-review', label: "Buck's Review" },
  { id: 'root-cause', label: 'Root Cause Analysis' },
]

const pageCopy = {
  'data-sources': {
    title: 'Data Sources',
    description: 'Manage database and data source connections.',
    action: 'Add Data Source',
    singular: 'source',
    plural: 'sources',
    empty: 'No data sources match.',
  },
  tables: {
    title: 'Tables',
    description: 'Explore and manage onboarded tables.',
    action: 'Add Table',
    singular: 'table',
    plural: 'tables',
    empty: 'No tables match.',
  },
  'data-quality': {
    title: 'Data Quality',
    description: 'Review validation results across onboarded tables.',
    action: 'New Validation',
    singular: 'validation',
    plural: 'validations',
    empty: 'No validations match.',
  },
} as const

const fieldClass =
  'h-11 rounded-md border border-line bg-canvas px-3 font-sans text-sm text-ink transition-colors duration-150 ease-databuck focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo'

const toolbarButton =
  'inline-flex h-11 cursor-pointer items-center gap-2 rounded-md border border-line-strong bg-canvas px-3 font-sans text-sm font-medium text-ink transition-colors duration-150 ease-databuck hover:border-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo'

const primaryButton =
  'inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-indigo px-4 font-sans text-sm font-medium whitespace-nowrap text-white transition-colors duration-150 ease-databuck hover:bg-indigo-hover active:scale-[0.98] active:bg-indigo-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink'

const nudgeButton =
  'inline-flex h-9 cursor-pointer items-center rounded-md border border-line-strong bg-canvas px-2.5 font-sans text-sm font-medium whitespace-nowrap text-indigo transition-colors duration-150 ease-databuck hover:border-indigo hover:bg-secondary-fixed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo'

const nameButton =
  'block max-w-full cursor-pointer truncate text-left font-sans text-sm font-medium text-ink transition-colors duration-150 ease-databuck hover:text-indigo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo'

const cardTitle =
  'block max-w-full cursor-pointer truncate text-left font-sans text-base font-semibold tracking-[-0.02em] text-ink transition-colors duration-150 ease-databuck hover:text-indigo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo'

const headClass =
  'sticky top-0 z-10 bg-canvas px-4 py-3 font-label text-xs font-medium tracking-[0.08em] text-muted uppercase shadow-[inset_0_-1px_0_var(--db-border)]'

const cellClass = 'px-4 py-3 align-middle'

const scoreToneText: Record<'success' | 'warning' | 'danger', string> = {
  success: 'text-success-ink',
  warning: 'text-warning-ink',
  danger: 'text-danger',
}

function clearedFilters(): Filters {
  return { status: [], type: [], approved: [], connection: [], result: [], schema: [] }
}

function selectedCount(screen: Layout2Screen, filters: Filters) {
  if (screen === 'data-sources') return filters.status.length + filters.type.length
  if (screen === 'tables') return filters.approved.length + filters.type.length + filters.connection.length
  return filters.result.length + filters.type.length + filters.schema.length
}

function endpointOf(source: DataSource) {
  if (source.type === 'BigQuery') return { label: 'Project', value: source.connection.project }
  if (source.type === 'Databricks') return { label: 'Workspace URL', value: source.connection.workspaceUrl }
  return { label: 'Host', value: source.connection.host }
}

function matchesQuery(value: string, query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return value.toLowerCase().includes(needle)
}

function sourceText(source: DataSource) {
  const endpoint = endpointOf(source)
  return [source.name, source.type, source.schema, endpoint.label, endpoint.value].join(' ')
}

function sourcePasses(source: DataSource, filters: Filters, query: string, omit?: FilterKey) {
  if (!matchesQuery(sourceText(source), query)) return false
  if (omit !== 'status' && filters.status.length > 0) {
    const status = source.active ? 'active' : 'inactive'
    if (!filters.status.includes(status)) return false
  }
  if (omit !== 'type' && filters.type.length > 0 && !filters.type.includes(source.type)) return false
  return true
}

function tableText(record: TableRecord) {
  const endpoint = endpointOf(record.source)
  return [
    record.table.nickname,
    record.table.name,
    record.source.name,
    record.source.type,
    record.source.schema,
    endpoint.label,
    endpoint.value,
  ].join(' ')
}

function tablePasses(record: TableRecord, filters: Filters, query: string, omit?: FilterKey) {
  if (!matchesQuery(tableText(record), query)) return false
  if (omit !== 'approved' && filters.approved.length > 0) {
    const approval = record.table.approved ? 'approved' : 'pending'
    if (!filters.approved.includes(approval)) return false
  }
  if (omit !== 'type' && filters.type.length > 0 && !filters.type.includes(record.source.type)) return false
  if (omit !== 'connection' && filters.connection.length > 0 && !filters.connection.includes(record.source.id)) {
    return false
  }
  return true
}

function validationText(run: ValidationRun) {
  return [run.tableName, run.sourceType, run.schema].join(' ')
}

function validationPasses(run: ValidationRun, filters: Filters, query: string, omit?: FilterKey) {
  if (!matchesQuery(validationText(run), query)) return false
  if (omit !== 'result' && filters.result.length > 0 && !filters.result.includes(scoreTone(run))) return false
  if (omit !== 'type' && filters.type.length > 0 && !filters.type.includes(run.sourceType)) return false
  if (omit !== 'schema' && filters.schema.length > 0 && !filters.schema.includes(run.schema)) return false
  return true
}

function resultLabel(id: string) {
  if (id === 'success') return 'Passed'
  if (id === 'warning') return 'Needs Attention'
  return 'Failed'
}

function qualityResult(run: ValidationRun) {
  const tone = scoreTone(run)
  if (run.failedChecks > 0) {
    return { tone, label: `${run.failedChecks} ${run.failedChecks === 1 ? 'check' : 'checks'} failed` }
  }
  return { tone, label: resultLabel(tone) }
}

function useNarrow() {
  const query = '(max-width: 767px)'
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setNarrow(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return narrow
}

function CloseGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function BackButton({ onClick, buttonRef }: { onClick: () => void; buttonRef?: Ref<HTMLButtonElement> }) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      className="inline-flex h-11 w-fit shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 font-sans text-sm font-medium text-ink transition-colors duration-150 ease-databuck hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
    >
      <BackIcon />
      Back
    </button>
  )
}

function Meta({
  label,
  value,
  mono = false,
  wide = false,
}: {
  label: string
  value: string
  mono?: boolean
  wide?: boolean
}) {
  return (
    <div className={wide ? 'col-span-2 min-w-0' : 'min-w-0'}>
      <dt className="font-label text-xs font-medium tracking-[0.08em] text-muted uppercase">{label}</dt>
      <dd className={`mt-1 truncate text-sm text-ink ${mono ? 'font-mono' : 'font-sans'}`} title={value}>
        {value || '—'}
      </dd>
    </div>
  )
}

function ActionsMenu({ label, items, onSelect }: { label: string; items: MenuItem[]; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return
      setOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    function onScroll() {
      setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onScroll)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  function toggle() {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    const menuHeight = items.length * 36 + 8
    const top = rect.bottom + 4 + menuHeight > window.innerHeight ? rect.top - menuHeight - 4 : rect.bottom + 4
    setPosition({ top, left: rect.right })
    setOpen((current) => !current)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation()
          toggle()
        }}
        className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition-colors duration-150 ease-databuck hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
      >
        <EllipsisIcon size={16} />
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              className="fixed z-50 min-w-44 rounded-md border border-line bg-canvas p-1 shadow-overlay"
              style={{ top: position.top, left: position.left, transform: 'translateX(-100%)' }}
            >
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  onClick={(event) => {
                    event.stopPropagation()
                    setOpen(false)
                    onSelect(item.id)
                  }}
                  className={`flex h-9 w-full cursor-pointer items-center rounded-md px-3 text-left font-sans text-sm transition-colors duration-150 ease-databuck hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                    item.tone === 'danger' ? 'text-danger' : 'text-ink'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

function FilterOverlay({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const panel = panelRef.current
    panel?.querySelector<HTMLElement>('[data-filter-close]')?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const focusable = [...panel.querySelectorAll<HTMLElement>('button, input')].filter(
        (element) => !element.hasAttribute('disabled'),
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus()
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-[rgba(15,23,42,0.5)]"
        aria-label="Close filters"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-filters-title"
        className="absolute inset-y-0 left-0 flex w-72 max-w-[calc(100%-3rem)]"
      >
        {children}
      </div>
    </div>
  )
}

function FilterRail({
  groups,
  selected,
  canClear,
  closeLabel,
  applyLabel,
  onToggle,
  onClear,
  onClose,
}: {
  groups: FilterGroup[]
  selected: Filters
  canClear: boolean
  closeLabel: string
  applyLabel?: string
  onToggle: (group: FilterKey, id: string) => void
  onClear: () => void
  onClose: () => void
}) {
  const [collapsed, setCollapsed] = useState<string[]>([])

  function toggleGroup(id: string) {
    setCollapsed((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  return (
    <aside
      id="catalog-filters"
      className={`flex h-full min-h-0 w-full flex-col bg-canvas ${
        applyLabel ? 'shadow-overlay' : 'rounded-lg border border-line shadow-card'
      }`}
    >
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3">
        <h2 id="catalog-filters-title" className="min-w-0 flex-1 truncate font-sans text-sm font-semibold text-ink">
          Filters
        </h2>
        {canClear ? (
          <button
            type="button"
            onClick={onClear}
            className="cursor-pointer font-sans text-sm font-medium text-indigo transition-colors duration-150 ease-databuck hover:text-indigo-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
          >
            Clear
          </button>
        ) : null}
        <button
          type="button"
          data-filter-close
          aria-label={closeLabel}
          onClick={onClose}
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted transition-colors duration-150 ease-databuck hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
        >
          <span className="inline-flex rotate-90">
            <ChevronIcon size={16} />
          </span>
        </button>
      </div>
      <div className="db-scroll min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {groups.map((group) => {
          const isCollapsed = collapsed.includes(group.id)
          return (
            <div key={group.id} className="border-b border-line last:border-b-0">
              <fieldset className="min-w-0 border-0 px-1 py-2">
                <legend className="sr-only">{group.legend}</legend>
                <button
                  type="button"
                  aria-expanded={!isCollapsed}
                  onClick={() => toggleGroup(group.id)}
                  className="flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 font-sans text-sm font-semibold text-ink transition-colors duration-150 ease-databuck hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
                >
                  {group.legend}
                  <span
                    className={`inline-flex text-muted transition-transform duration-150 ease-databuck ${
                      isCollapsed ? '-rotate-90' : ''
                    }`}
                  >
                    <ChevronIcon size={16} />
                  </span>
                </button>
                {isCollapsed ? null : (
                  <div className="mt-1 flex flex-col">
                    {group.options.map((option) => {
                      const checked = selected[group.id].includes(option.id)
                      const disabled = option.count === 0 && !checked
                      return (
                        <label
                          key={option.id}
                          className={`flex min-h-11 items-center gap-3 rounded-md px-2 md:min-h-9 ${
                            disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-surface'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={() => onToggle(group.id, option.id)}
                            className="size-4 shrink-0 accent-indigo"
                          />
                          <span className={`min-w-0 flex-1 truncate font-sans text-sm ${disabled ? 'text-outline' : 'text-ink'}`}>
                            {option.label}
                          </span>
                          <span className="font-mono text-xs text-muted tabular-nums">{option.count}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </fieldset>
            </div>
          )
        })}
      </div>
      {applyLabel ? (
        <div className="shrink-0 border-t border-line p-3">
          <button type="button" onClick={onClose} className={`${primaryButton} w-full`}>
            {applyLabel}
          </button>
        </div>
      ) : null}
    </aside>
  )
}

function ColumnHead({ children, align = 'left' }: { children: string; align?: 'left' | 'right' }) {
  return (
    <th scope="col" className={`${headClass} ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  )
}

function SourceList({
  sources,
  onOpen,
  onAction,
}: {
  sources: DataSource[]
  onOpen: (id: string) => void
  onAction: (id: string) => void
}) {
  return (
    <div className="db-scroll min-h-0 flex-1 overflow-auto">
      <table className="w-full min-w-[1080px] border-collapse text-left">
        <caption className="sr-only">Data sources</caption>
        <thead>
          <tr>
            <ColumnHead>Name</ColumnHead>
            <ColumnHead>Type</ColumnHead>
            <ColumnHead>Schema</ColumnHead>
            <ColumnHead>Endpoint</ColumnHead>
            <ColumnHead align="right">Tables</ColumnHead>
            <ColumnHead>Status</ColumnHead>
            <ColumnHead align="right">Actions</ColumnHead>
          </tr>
        </thead>
        <tbody>
          {sources.map((source) => {
            const endpoint = endpointOf(source)
            return (
              <tr key={source.id} className="border-b border-line transition-colors duration-150 ease-databuck last:border-0 hover:bg-surface">
                <td className={cellClass}>
                  <button type="button" onClick={() => onOpen(source.id)} className={nameButton}>
                    {source.name}
                  </button>
                  {source.tables.length === 0 ? (
                    <span className="mt-0.5 block text-xs text-muted">No tables onboarded.</span>
                  ) : null}
                </td>
                <td className={`${cellClass} font-sans text-sm text-ink`}>{source.type}</td>
                <td className={`${cellClass} max-w-[12rem]`}>
                  <span className="block truncate font-mono text-sm text-ink" title={source.schema}>
                    {source.schema}
                  </span>
                </td>
                <td className={`${cellClass} max-w-[16rem]`}>
                  <span className="block font-label text-xs font-medium tracking-[0.08em] text-muted uppercase">
                    {endpoint.label}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-sm text-ink" title={endpoint.value}>
                    {endpoint.value || '—'}
                  </span>
                </td>
                <td className={`${cellClass} text-right font-mono text-sm text-ink tabular-nums`}>{source.tables.length}</td>
                <td className={cellClass}>
                  <StatusBadge tone={source.active ? 'success' : 'danger'} label={source.active ? 'Active' : 'Inactive'} />
                </td>
                <td className={`${cellClass} whitespace-nowrap`}>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onAction('add-table')
                      }}
                      className={nudgeButton}
                    >
                      Add Table
                    </button>
                    <ActionsMenu label={`Actions for ${source.name}`} items={sourceMenu} onSelect={onAction} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SourceCards({
  sources,
  onOpen,
  onAction,
}: {
  sources: DataSource[]
  onOpen: (id: string) => void
  onAction: (id: string) => void
}) {
  return (
    <div className="db-scroll min-h-0 flex-1 overflow-auto p-4">
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {sources.map((source) => {
          const endpoint = endpointOf(source)
          const empty = source.tables.length === 0
          return (
            <li key={source.id} className="min-w-0">
              <article className="flex h-full flex-col rounded-lg border border-line bg-canvas p-4 shadow-card transition-[border-color,box-shadow] duration-150 ease-databuck hover:border-line-strong hover:shadow-hover">
                <div className="flex items-start gap-3">
                  <IconBox size="md">
                    <DatabaseIcon size={16} />
                  </IconBox>
                  <div className="min-w-0 flex-1">
                    <button type="button" onClick={() => onOpen(source.id)} className={cardTitle}>
                      {source.name}
                    </button>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-sans text-sm text-muted">{source.type}</span>
                      <StatusBadge tone={source.active ? 'success' : 'danger'} label={source.active ? 'Active' : 'Inactive'} />
                    </div>
                  </div>
                  <ActionsMenu label={`Actions for ${source.name}`} items={sourceMenu} onSelect={onAction} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                  <Meta label="Schema" value={source.schema} mono wide />
                  <Meta label={endpoint.label} value={endpoint.value} mono wide />
                  <Meta label="Tables" value={String(source.tables.length)} mono />
                  <Meta label="Created on" value={source.connection.createdOn} mono />
                </dl>
                <div className="flex flex-1 flex-col">
                  {empty ? <p className="mt-3 text-sm text-muted">No tables onboarded.</p> : null}
                  <div className="mt-auto pt-3">
                    <div className="border-t border-line pt-3">
                      <button type="button" onClick={() => onAction('add-table')} className={nudgeButton}>
                        Add Table
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function TableList({
  records,
  onOpen,
  onAction,
}: {
  records: TableRecord[]
  onOpen: (id: string) => void
  onAction: (id: string) => void
}) {
  return (
    <div className="db-scroll min-h-0 flex-1 overflow-auto">
      <table className="w-full min-w-[1180px] border-collapse text-left">
        <caption className="sr-only">Tables</caption>
        <thead>
          <tr>
            <ColumnHead>Nickname</ColumnHead>
            <ColumnHead>Table name</ColumnHead>
            <ColumnHead>Connection</ColumnHead>
            <ColumnHead>Schema</ColumnHead>
            <ColumnHead align="right">Columns</ColumnHead>
            <ColumnHead align="right">Rows</ColumnHead>
            <ColumnHead>Approved</ColumnHead>
            <ColumnHead align="right">Actions</ColumnHead>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const rows = tableMetrics(record.table).rows
            return (
              <tr
                key={record.table.id}
                className="border-b border-line transition-colors duration-150 ease-databuck last:border-0 hover:bg-surface"
              >
                <td className={cellClass}>
                  <button type="button" onClick={() => onOpen(record.table.id)} className={nameButton}>
                    {record.table.nickname}
                  </button>
                </td>
                <td className={`${cellClass} max-w-[12rem]`}>
                  <span className="block truncate font-mono text-sm text-ink" title={record.table.name}>
                    {record.table.name}
                  </span>
                </td>
                <td className={`${cellClass} max-w-[12rem]`}>
                  <span className="block truncate font-sans text-sm text-ink" title={record.source.name}>
                    {record.source.name}
                  </span>
                </td>
                <td className={`${cellClass} max-w-[12rem]`}>
                  <span className="block truncate font-mono text-sm text-ink" title={record.source.schema}>
                    {record.source.schema}
                  </span>
                </td>
                <td className={`${cellClass} text-right font-mono text-sm text-ink tabular-nums`}>{record.table.columns}</td>
                <td className={`${cellClass} text-right font-mono text-sm text-ink tabular-nums`}>
                  {rows.toLocaleString('en-US')}
                </td>
                <td className={cellClass}>
                  <StatusBadge
                    tone={record.table.approved ? 'success' : 'neutral'}
                    label={record.table.approved ? 'Approved' : 'Pending'}
                  />
                </td>
                <td className={`${cellClass} whitespace-nowrap`}>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onAction('create-validation')
                      }}
                      className={nudgeButton}
                    >
                      Create validation
                    </button>
                    <ActionsMenu label={`Actions for ${record.table.nickname}`} items={tableMenu} onSelect={onAction} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function TableCards({
  records,
  onOpen,
  onAction,
}: {
  records: TableRecord[]
  onOpen: (id: string) => void
  onAction: (id: string) => void
}) {
  return (
    <div className="db-scroll min-h-0 flex-1 overflow-auto p-4">
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {records.map((record) => {
          const rows = tableMetrics(record.table).rows
          return (
            <li key={record.table.id} className="min-w-0">
              <article className="flex h-full flex-col rounded-lg border border-line bg-canvas p-4 shadow-card transition-[border-color,box-shadow] duration-150 ease-databuck hover:border-line-strong hover:shadow-hover">
                <div className="flex items-start gap-3">
                  <IconBox size="md">
                    <TableIcon size={16} />
                  </IconBox>
                  <div className="min-w-0 flex-1">
                    <button type="button" onClick={() => onOpen(record.table.id)} className={cardTitle}>
                      {record.table.nickname}
                    </button>
                    <p className="mt-1 truncate font-mono text-sm text-muted" title={record.table.name}>
                      {record.table.name}
                    </p>
                  </div>
                  <ActionsMenu label={`Actions for ${record.table.nickname}`} items={tableMenu} onSelect={onAction} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                  <Meta label="Connection" value={record.source.name} wide />
                  <Meta label="Schema" value={record.source.schema} mono wide />
                  <Meta label="Columns" value={String(record.table.columns)} mono />
                  <Meta label="Rows" value={rows.toLocaleString('en-US')} mono />
                </dl>
                <div className="mt-3">
                  <StatusBadge
                    tone={record.table.approved ? 'success' : 'neutral'}
                    label={record.table.approved ? 'Approved' : 'Pending'}
                  />
                </div>
                <div className="mt-auto pt-3">
                  <div className="border-t border-line pt-3">
                    <button type="button" onClick={() => onAction('create-validation')} className={nudgeButton}>
                      Create validation
                    </button>
                  </div>
                </div>
              </article>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ValidationList({
  runs,
  onOpen,
  onAction,
}: {
  runs: ValidationRun[]
  onOpen: (id: string) => void
  onAction: (id: string) => void
}) {
  return (
    <div className="db-scroll min-h-0 flex-1 overflow-auto">
      <table className="w-full min-w-[1080px] border-collapse text-left">
        <caption className="sr-only">Validations</caption>
        <thead>
          <tr>
            <ColumnHead>Table</ColumnHead>
            <ColumnHead>Source type</ColumnHead>
            <ColumnHead>Schema</ColumnHead>
            <ColumnHead align="right">Run</ColumnHead>
            <ColumnHead>Ran on</ColumnHead>
            <ColumnHead align="right">Score</ColumnHead>
            <ColumnHead>Result</ColumnHead>
            <ColumnHead align="right">Actions</ColumnHead>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => {
            const result = qualityResult(run)
            return (
              <tr key={run.id} className="border-b border-line transition-colors duration-150 ease-databuck last:border-0 hover:bg-surface">
                <td className={cellClass}>
                  <button type="button" onClick={() => onOpen(run.id)} className={nameButton}>
                    {run.tableName}
                  </button>
                </td>
                <td className={`${cellClass} font-sans text-sm text-ink`}>{run.sourceType}</td>
                <td className={`${cellClass} max-w-[12rem]`}>
                  <span className="block truncate font-mono text-sm text-ink" title={run.schema}>
                    {run.schema}
                  </span>
                </td>
                <td className={`${cellClass} text-right font-mono text-sm text-ink tabular-nums`}>{run.run}</td>
                <td className={`${cellClass} font-sans text-sm text-ink`}>{run.ranOn}</td>
                <td className={`${cellClass} text-right font-mono text-sm tabular-nums ${scoreToneText[scoreTone(run)]}`}>
                  {run.score.toFixed(1)}%
                </td>
                <td className={cellClass}>
                  <StatusBadge tone={result.tone} label={result.label} />
                </td>
                <td className={`${cellClass} whitespace-nowrap`}>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onAction('run')
                      }}
                      className={nudgeButton}
                    >
                      Run
                    </button>
                    <ActionsMenu label={`Actions for ${run.tableName}`} items={validationMenu} onSelect={onAction} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ValidationCards({
  runs,
  onOpen,
  onAction,
}: {
  runs: ValidationRun[]
  onOpen: (id: string) => void
  onAction: (id: string) => void
}) {
  return (
    <div className="db-scroll min-h-0 flex-1 overflow-auto p-4">
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {runs.map((run) => {
          const result = qualityResult(run)
          return (
            <li key={run.id} className="min-w-0">
              <article className="flex h-full flex-col rounded-lg border border-line bg-canvas p-4 shadow-card transition-[border-color,box-shadow] duration-150 ease-databuck hover:border-line-strong hover:shadow-hover">
                <div className="flex items-start gap-3">
                  <IconBox size="md">
                    <TableIcon size={16} />
                  </IconBox>
                  <div className="min-w-0 flex-1">
                    <button type="button" onClick={() => onOpen(run.id)} className={cardTitle}>
                      {run.tableName}
                    </button>
                    <p className="mt-1 truncate text-sm text-muted">
                      {run.sourceType}
                      <span className="font-mono"> · {run.schema}</span>
                    </p>
                  </div>
                  <ActionsMenu label={`Actions for ${run.tableName}`} items={validationMenu} onSelect={onAction} />
                </div>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-label text-[0.6875rem] font-medium tracking-[0.14em] text-muted uppercase">
                      Match Score
                    </p>
                    <p className={`mt-1 font-mono text-2xl font-medium tracking-[-0.03em] tabular-nums ${scoreToneText[scoreTone(run)]}`}>
                      {run.score.toFixed(1)}%
                    </p>
                  </div>
                  <StatusBadge tone={result.tone} label={result.label} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                  <Meta label="Run" value={String(run.run)} mono />
                  <Meta label="Ran on" value={run.ranOn} />
                </dl>
                <div className="mt-auto pt-3">
                  <div className="border-t border-line pt-3">
                    <button type="button" onClick={() => onAction('run')} className={nudgeButton}>
                      Run
                    </button>
                  </div>
                </div>
              </article>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function Layout2Workspace({ screen }: { screen: Layout2Screen }) {
  const copy = pageCopy[screen]
  const searchId = useId()
  const searchRef = useRef<HTMLInputElement>(null)
  const backRef = useRef<HTMLButtonElement>(null)
  const narrow = useNarrow()
  const [sources, setSources] = useState<DataSource[]>(initialSources)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>(clearedFilters)
  const [view, setView] = useState<ViewMode>('list')
  const [filtersOpen, setFiltersOpen] = useState(() =>
    typeof window !== 'undefined' ? !window.matchMedia('(max-width: 767px)').matches : true,
  )
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selection, setSelection] = useState<SourceSelection | null>(null)
  const [validationId, setValidationId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState(false)
  const [trackedScreen, setTrackedScreen] = useState(screen)
  const [trackedNarrow, setTrackedNarrow] = useState(narrow)

  if (screen !== trackedScreen) {
    setTrackedScreen(screen)
    setQuery('')
    setFilters(clearedFilters())
    setSelection(null)
    setValidationId(null)
    setCreating(false)
    setNotice(false)
    setStartDate('')
    setEndDate('')
  }

  if (narrow !== trackedNarrow) {
    setTrackedNarrow(narrow)
    setFiltersOpen(!narrow)
  }

  const closeFilters = useCallback(() => setFiltersOpen(false), [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (creating || selection || validationId) backRef.current?.focus()
  }, [creating, selection, validationId])

  const tableRecords = sources.flatMap((source) => source.tables.map((table) => ({ source, table })))
  const visibleSources = sources.filter((source) => sourcePasses(source, filters, query))
  const visibleTables = tableRecords.filter((record) => tablePasses(record, filters, query))
  const visibleValidations = validationRuns.filter((run) => validationPasses(run, filters, query))
  const shown =
    screen === 'data-sources' ? visibleSources.length : screen === 'tables' ? visibleTables.length : visibleValidations.length
  const resultCountLabel = `${shown.toLocaleString('en-US')} ${shown === 1 ? copy.singular : copy.plural}`
  const filtersOn = selectedCount(screen, filters)
  const hasFilters = filtersOn > 0

  const sourceGroups: FilterGroup[] = [
    {
      id: 'status',
      legend: 'Status',
      options: [
        { id: 'active', label: 'Active' },
        { id: 'inactive', label: 'Inactive' },
      ].map((option) => ({
        ...option,
        count: sources.filter(
          (source) =>
            sourcePasses(source, filters, query, 'status') && (source.active ? 'active' : 'inactive') === option.id,
        ).length,
      })),
    },
    {
      id: 'type',
      legend: 'Type',
      options: sourceTypes.map((type) => ({
        id: type,
        label: type,
        count: sources.filter((source) => sourcePasses(source, filters, query, 'type') && source.type === type).length,
      })),
    },
  ]

  const tableGroups: FilterGroup[] = [
    {
      id: 'approved',
      legend: 'Approved',
      options: [
        { id: 'approved', label: 'Approved' },
        { id: 'pending', label: 'Pending' },
      ].map((option) => ({
        ...option,
        count: tableRecords.filter(
          (record) =>
            tablePasses(record, filters, query, 'approved') &&
            (record.table.approved ? 'approved' : 'pending') === option.id,
        ).length,
      })),
    },
    {
      id: 'type',
      legend: 'Type',
      options: sourceTypes.map((type) => ({
        id: type,
        label: type,
        count: tableRecords.filter(
          (record) => tablePasses(record, filters, query, 'type') && record.source.type === type,
        ).length,
      })),
    },
    {
      id: 'connection',
      legend: 'Connection',
      options: sources.map((source) => ({
        id: source.id,
        label: source.name,
        count: tableRecords.filter(
          (record) => tablePasses(record, filters, query, 'connection') && record.source.id === source.id,
        ).length,
      })),
    },
  ]

  const validationGroups: FilterGroup[] = [
    {
      id: 'result',
      legend: 'Result',
      options: (['success', 'warning', 'danger'] as const).map((tone) => ({
        id: tone,
        label: resultLabel(tone),
        count: validationRuns.filter(
          (run) => validationPasses(run, filters, query, 'result') && scoreTone(run) === tone,
        ).length,
      })),
    },
    {
      id: 'type',
      legend: 'Type',
      options: sourceTypes.map((type) => ({
        id: type,
        label: type,
        count: validationRuns.filter((run) => validationPasses(run, filters, query, 'type') && run.sourceType === type)
          .length,
      })),
    },
    {
      id: 'schema',
      legend: 'Schema',
      options: validationSchemas.map((schema) => ({
        id: schema,
        label: schema,
        count: validationRuns.filter((run) => validationPasses(run, filters, query, 'schema') && run.schema === schema)
          .length,
      })),
    },
  ]

  const groups = screen === 'data-sources' ? sourceGroups : screen === 'tables' ? tableGroups : validationGroups
  const chips: Chip[] = []
  if (screen === 'data-sources') {
    for (const id of filters.status) chips.push({ group: 'status', id, label: id === 'active' ? 'Active' : 'Inactive' })
    for (const id of filters.type) chips.push({ group: 'type', id, label: id })
  } else if (screen === 'tables') {
    for (const id of filters.approved) {
      chips.push({ group: 'approved', id, label: id === 'approved' ? 'Approved' : 'Pending' })
    }
    for (const id of filters.type) chips.push({ group: 'type', id, label: id })
    for (const id of filters.connection) {
      chips.push({
        group: 'connection',
        id,
        label: sources.find((source) => source.id === id)?.name ?? id,
      })
    }
  } else {
    for (const id of filters.result) chips.push({ group: 'result', id, label: resultLabel(id) })
    for (const id of filters.type) chips.push({ group: 'type', id, label: id })
    for (const id of filters.schema) chips.push({ group: 'schema', id, label: id })
  }

  function toggleFilter(group: FilterKey, id: string) {
    setFilters((current) => {
      const list = current[group]
      const next = list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
      return { ...current, [group]: next }
    })
  }

  function clearFilters() {
    setFilters(clearedFilters())
  }

  function onSourceAction(actionId: string) {
    if (actionId === 'add-table') setCreating(true)
    else setNotice(true)
  }

  function onTableAction(actionId: string) {
    if (actionId === 'create-validation') setCreating(true)
    else setNotice(true)
  }

  function onValidationAction() {
    setNotice(true)
  }

  function clearConstraints() {
    setFilters(clearedFilters())
    setQuery('')
  }

  const rail = (
    <FilterRail
      key={screen}
      groups={groups}
      selected={filters}
      canClear={hasFilters}
      closeLabel={narrow ? 'Close filters' : 'Collapse filters'}
      applyLabel={narrow ? `Show ${resultCountLabel}` : undefined}
      onToggle={toggleFilter}
      onClear={clearFilters}
      onClose={closeFilters}
    />
  )

  if (creating) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-surface p-4 lg:p-8">
        <BackButton buttonRef={backRef} onClick={() => setCreating(false)} />
        <EmptyState
          icon={<ClockIcon />}
          title="Under Development"
          description="This area is not available yet."
          className="flex-1"
        />
      </div>
    )
  }

  if (selection) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden bg-surface p-4 lg:p-8">
        <BackButton buttonRef={backRef} onClick={() => setSelection(null)} />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-canvas shadow-card">
          <ConnectionDetail
            sources={sources}
            selection={selection}
            onAddTable={() => setCreating(true)}
            onCreateValidation={selection.kind === 'table' ? () => setCreating(true) : undefined}
            onSaveSource={(next) => {
              setSources((current) => current.map((item) => (item.id === next.id ? next : item)))
            }}
            onSaveTable={(sourceId, table) => {
              setSources((current) =>
                current.map((item) =>
                  item.id === sourceId
                    ? { ...item, tables: item.tables.map((entry) => (entry.id === table.id ? table : entry)) }
                    : item,
                ),
              )
            }}
          />
        </div>
      </div>
    )
  }

  if (validationId) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden bg-surface p-4 lg:p-8">
        <BackButton buttonRef={backRef} onClick={() => setValidationId(null)} />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-canvas shadow-card">
          <QualityDetail validationId={validationId} />
        </div>
      </div>
    )
  }

  const emptyTitle = copy.empty
  const emptyDescription = hasFilters ? 'Nothing matches these filters.' : 'Nothing matches this search.'
  const emptyAction =
    hasFilters && query.trim() ? 'Clear search and filters' : hasFilters ? 'Clear filters' : 'Clear search'
  const showFiltersButton = narrow || !filtersOpen

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden bg-surface p-4 lg:p-8">
      <div className="flex shrink-0 flex-col gap-4">
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-[-0.02em] text-ink">{copy.title}</h1>
          <p className="mt-1 text-sm leading-6 text-muted">{copy.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] max-w-md flex-1">
            <label htmlFor={searchId} className="sr-only">
              Search {copy.title.toLowerCase()}
            </label>
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-outline">
              <SearchIcon />
            </span>
            <input
              ref={searchRef}
              id={searchId}
              type="text"
              value={query}
              placeholder="Search"
              onChange={(event) => setQuery(event.target.value)}
              className={`${fieldClass} w-full pr-10 pl-10`}
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQuery('')
                  searchRef.current?.focus()
                }}
                className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted transition-colors duration-150 ease-databuck hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
              >
                <CloseGlyph />
              </button>
            ) : null}
          </div>
          <p aria-live="polite" className="shrink-0 font-mono text-xs text-muted">
            {resultCountLabel}
          </p>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {showFiltersButton ? (
              <button
                type="button"
                aria-expanded={filtersOpen}
                aria-controls="catalog-filters"
                onClick={() => setFiltersOpen((current) => !current)}
                className={`${toolbarButton} ${filtersOpen ? 'border-indigo bg-secondary-fixed text-indigo' : ''}`}
              >
                <FilterIcon />
                Filters
                {filtersOn > 0 ? (
                  <span
                    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1 font-mono text-xs tabular-nums ${
                      filtersOpen ? 'bg-indigo text-white' : 'bg-secondary-fixed text-indigo'
                    }`}
                  >
                    {filtersOn}
                  </span>
                ) : null}
              </button>
            ) : null}
            <div
              role="group"
              aria-label="Date range"
              className="flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-3 transition-colors duration-150 ease-databuck focus-within:border-line-strong focus-within:bg-canvas focus-within:ring-2 focus-within:ring-indigo sm:gap-3"
            >
              <span className="hidden shrink-0 font-label text-xs font-medium tracking-[0.08em] text-muted uppercase sm:inline">
                Date range
              </span>
              <span className="hidden h-5 w-px shrink-0 bg-line sm:block" aria-hidden="true" />
              <input
                type="date"
                aria-label="Start date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => setStartDate(event.target.value)}
                className="h-8 w-[7.5rem] bg-transparent font-sans text-sm text-ink focus:outline-none"
              />
              <span className="text-outline" aria-hidden="true">
                –
              </span>
              <input
                type="date"
                aria-label="End date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
                className="h-8 w-[7.5rem] bg-transparent font-sans text-sm text-ink focus:outline-none"
              />
            </div>
            <button type="button" onClick={() => setNotice(true)} className={toolbarButton}>
              <ExportIcon />
              Export
            </button>
            <div role="group" aria-label="View" className="inline-flex h-11 items-center rounded-md border border-line bg-canvas p-0.5">
              <button
                type="button"
                aria-pressed={view === 'list'}
                onClick={() => setView('list')}
                className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-md px-3 font-sans text-sm font-medium transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                  view === 'list' ? 'bg-secondary-fixed text-indigo' : 'text-muted hover:text-ink'
                }`}
              >
                <ListIcon />
                List
              </button>
              <button
                type="button"
                aria-pressed={view === 'card'}
                onClick={() => setView('card')}
                className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-md px-3 font-sans text-sm font-medium transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                  view === 'card' ? 'bg-secondary-fixed text-indigo' : 'text-muted hover:text-ink'
                }`}
              >
                <CardIcon />
                Card
              </button>
            </div>
            <button type="button" onClick={() => setCreating(true)} className={primaryButton}>
              <PlusIcon size={16} />
              {copy.action}
            </button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        {!narrow && filtersOpen ? <div className="flex w-60 shrink-0">{rail}</div> : null}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          {chips.length > 0 ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <ul className="flex flex-wrap gap-2" aria-label="Active filters">
                {chips.map((chip) => (
                  <li key={`${chip.group}-${chip.id}`}>
                    <button
                      type="button"
                      aria-label={`Remove ${chip.label}`}
                      onClick={() => toggleFilter(chip.group, chip.id)}
                      className="inline-flex h-7 max-w-56 cursor-pointer items-center gap-1 rounded-md border border-line bg-canvas pr-1.5 pl-2 font-sans text-sm text-ink transition-colors duration-150 ease-databuck hover:border-line-strong hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
                    >
                      <span className="truncate">{chip.label}</span>
                      <CloseGlyph />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={clearFilters}
                className="cursor-pointer font-sans text-sm font-medium text-indigo transition-colors duration-150 ease-databuck hover:text-indigo-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
              >
                Clear
              </button>
            </div>
          ) : null}
          <section
            aria-label={copy.title}
            className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-canvas shadow-card"
          >
            {shown === 0 ? (
              <EmptyState
                icon={<SearchIcon />}
                title={emptyTitle}
                description={emptyDescription}
                className="flex-1"
                action={
                  <button type="button" onClick={clearConstraints} className={toolbarButton}>
                    {emptyAction}
                  </button>
                }
              />
            ) : screen === 'data-sources' ? (
              view === 'list' ? (
                <SourceList sources={visibleSources} onOpen={(id) => setSelection({ kind: 'source', id })} onAction={onSourceAction} />
              ) : (
                <SourceCards sources={visibleSources} onOpen={(id) => setSelection({ kind: 'source', id })} onAction={onSourceAction} />
              )
            ) : screen === 'tables' ? (
              view === 'list' ? (
                <TableList records={visibleTables} onOpen={(id) => setSelection({ kind: 'table', id })} onAction={onTableAction} />
              ) : (
                <TableCards records={visibleTables} onOpen={(id) => setSelection({ kind: 'table', id })} onAction={onTableAction} />
              )
            ) : view === 'list' ? (
              <ValidationList runs={visibleValidations} onOpen={setValidationId} onAction={onValidationAction} />
            ) : (
              <ValidationCards runs={visibleValidations} onOpen={setValidationId} onAction={onValidationAction} />
            )}
          </section>
        </div>
      </div>
      {narrow && filtersOpen ? <FilterOverlay onClose={closeFilters}>{rail}</FilterOverlay> : null}
      {notice ? <UnderDevelopmentDialog onClose={() => setNotice(false)} /> : null}
    </div>
  )
}

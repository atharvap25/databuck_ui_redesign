import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { typeLabels } from '../data/connectionFields.ts'
import { type DataSource } from '../data/sources.ts'
import { ChevronIcon, DatabaseIcon, EllipsisIcon } from './icons.tsx'
import IconBox from './IconBox.tsx'
import StatusBadge from './StatusBadge.tsx'

const pageSize = 14

export type SourceSelection = { kind: 'source'; id: string } | { kind: 'table'; id: string }

function RowMenu({
  label,
  items,
  onSelect,
}: {
  label: string
  items: string[]
  onSelect?: (item: string) => void
}) {
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

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function toggle() {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    const menuHeight = items.length * 36 + 8
    const top =
      rect.bottom + 4 + menuHeight > window.innerHeight ? rect.top - menuHeight - 4 : rect.bottom + 4
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
        onKeyDown={(event) => event.stopPropagation()}
        className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition-colors duration-150 ease-databuck hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
      >
        <EllipsisIcon size={16} />
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              className="fixed z-50 min-w-36 rounded-md border border-line bg-canvas p-1 shadow-overlay"
              style={{ top: position.top, left: position.left, transform: 'translateX(-100%)' }}
            >
              {items.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="menuitem"
                  onClick={(event) => {
                    event.stopPropagation()
                    setOpen(false)
                    onSelect?.(item)
                  }}
                  className={`flex h-9 w-full items-center rounded-md px-3 text-left font-sans text-sm transition-colors duration-150 ease-databuck hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                    item === 'Delete' || item === 'Deactivate' ? 'text-danger' : 'text-ink'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

function isSelected(selection: SourceSelection | null, next: SourceSelection) {
  return selection?.kind === next.kind && selection.id === next.id
}

const rowGrid =
  'grid cursor-pointer grid-cols-[1.75rem_minmax(0,1fr)_auto_2rem] items-center gap-x-2 rounded-md px-2 py-2 select-none [&_*]:cursor-pointer'

export default function ConnectionsPanel({
  sources,
  selection,
  onSelect,
  revealId,
  onAction,
}: {
  sources: DataSource[]
  selection: SourceSelection | null
  onSelect: (selection: SourceSelection) => void
  revealId?: string | null
  onAction?: (source: DataSource, action: 'Copy' | 'Edit' | 'Deactivate') => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!revealId) return
    const index = sources.findIndex(
      (source) => source.id === revealId || source.tables.some((table) => table.id === revealId),
    )
    if (index < 0) return
    setCollapsed(false)
    setPage(Math.floor(index / pageSize) + 1)
  }, [revealId, sources])

  const pageCount = Math.max(1, Math.ceil(sources.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visible = sources.slice((safePage - 1) * pageSize, safePage * pageSize)
  const countLabel = `${sources.length} ${sources.length === 1 ? 'source' : 'sources'}`
  const collapsedLabel = selectionLabel(sources, selection)

  return (
    <aside
      className={`flex min-h-16 shrink-0 flex-col overflow-hidden rounded-lg border border-line bg-canvas shadow-card transition-[width] duration-150 ease-databuck lg:h-auto ${
        collapsed ? 'lg:w-14' : 'min-h-64 lg:w-[360px]'
      }`}
    >
      {collapsed ? (
        <div className="flex h-14 items-center gap-3 px-3 lg:h-full lg:flex-col lg:items-center lg:px-0 lg:py-3">
          <button
            type="button"
            aria-label="Expand data sources"
            onClick={() => setCollapsed(false)}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors duration-150 ease-databuck hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
          >
            <span className="inline-flex -rotate-90">
              <ChevronIcon size={16} />
            </span>
          </button>
          <span className="truncate font-sans text-sm font-medium text-ink lg:[writing-mode:vertical-lr]">
            {collapsedLabel}
          </span>
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3">
            <h2 className="min-w-0 flex-1 truncate font-sans text-sm font-semibold text-ink">Data Sources</h2>
            <button
              type="button"
              aria-label="Collapse data sources"
              onClick={() => setCollapsed(true)}
              className="inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors duration-150 ease-databuck hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
            >
              <span className="inline-flex rotate-90">
                <ChevronIcon size={16} />
              </span>
            </button>
          </div>

          <div className="db-scroll min-h-0 flex-1 overflow-y-auto px-2 py-2">
            <ul className="flex flex-col">
              {visible.map((source) => (
                <SourceRow
                  key={source.id}
                  source={source}
                  selection={selection}
                  highlightId={revealId}
                  onSelect={onSelect}
                  onAction={onAction}
                />
              ))}
            </ul>
          </div>

          <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-t border-line px-3">
            <p className="font-mono text-xs text-muted">{countLabel}</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={safePage === 1}
                className="inline-flex h-8 items-center rounded-md px-2 font-sans text-sm text-ink transition-colors duration-150 ease-databuck hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo disabled:text-outline"
              >
                Prev
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                <button
                  key={number}
                  type="button"
                  aria-current={number === safePage ? 'page' : undefined}
                  onClick={() => setPage(number)}
                  className={`inline-flex size-8 items-center justify-center rounded-md font-sans text-sm tabular-nums transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                    number === safePage ? 'bg-indigo text-white' : 'text-ink hover:bg-surface'
                  }`}
                >
                  {number}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                disabled={safePage === pageCount}
                className="inline-flex h-8 items-center rounded-md px-2 font-sans text-sm text-ink transition-colors duration-150 ease-databuck hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo disabled:text-outline"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

function selectionLabel(sources: DataSource[], selection: SourceSelection | null) {
  if (!selection) return 'Connections'
  if (selection.kind === 'source') {
    return sources.find((source) => source.id === selection.id)?.name ?? 'Connections'
  }
  for (const source of sources) {
    const table = source.tables.find((item) => item.id === selection.id)
    if (table) return table.nickname
  }
  return 'Connections'
}

function rowTone(selected: boolean, highlighted: boolean) {
  if (highlighted) return 'bg-info-tint'
  if (selected) return 'bg-secondary-fixed'
  return 'hover:bg-surface'
}

function SourceRow({
  source,
  selection,
  highlightId,
  onSelect,
  onAction,
}: {
  source: DataSource
  selection: SourceSelection | null
  highlightId?: string | null
  onSelect: (selection: SourceSelection) => void
  onAction?: (source: DataSource, action: 'Copy' | 'Edit' | 'Deactivate') => void
}) {
  const selected = isSelected(selection, { kind: 'source', id: source.id })
  const highlighted = highlightId === source.id || source.tables.some((table) => table.id === highlightId)

  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        aria-current={selected ? 'true' : undefined}
        onClick={() => onSelect({ kind: 'source', id: source.id })}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onSelect({ kind: 'source', id: source.id })
          }
        }}
        className={`${rowGrid} transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${rowTone(selected, highlighted)}`}
      >
        <IconBox size="sm">
          <DatabaseIcon size={15} />
        </IconBox>
        <span className="min-w-0">
          <span className="block truncate font-sans text-sm font-medium text-ink">{source.name}</span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {typeLabels[source.type]}
            <span className="font-mono"> · {source.schema}</span>
          </span>
        </span>
        <StatusBadge
          tone={source.active ? 'success' : 'danger'}
          label={source.active ? 'Active' : 'Inactive'}
          hideLabel
        />
        <RowMenu
          label={`Actions for ${source.name}`}
          items={['Copy', 'Edit', source.active ? 'Deactivate' : 'Activate']}
          onSelect={(item) => {
            const action = item === 'Activate' ? 'Deactivate' : item
            if (action === 'Copy' || action === 'Edit' || action === 'Deactivate') onAction?.(source, action)
          }}
        />
      </div>
    </li>
  )
}

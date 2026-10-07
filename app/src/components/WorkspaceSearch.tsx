import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { searchIntents } from '../data/aiMocks.ts'
import { type DataSource } from '../data/sources.ts'
import { validationRuns } from '../data/validations.ts'
import { SearchIcon } from './icons.tsx'

const fieldClass =
  'h-11 rounded-md border border-line bg-canvas px-3 font-sans text-sm text-ink transition-colors duration-150 ease-databuck focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo'

const resultLimit = 8

type ConnectionPill = 'source' | 'table' | 'schema' | 'type' | 'status'
type QualityPill = 'validation' | 'table' | 'source' | 'schema' | 'dts'
type SearchHit = {
  id: string
  group: 'sources' | 'tables' | 'validations'
  title: string
  detail: string
}

const connectionPills: { id: ConnectionPill; label: string }[] = [
  { id: 'source', label: 'Data source' },
  { id: 'table', label: 'Table' },
  { id: 'schema', label: 'Schema' },
  { id: 'type', label: 'Type' },
  { id: 'status', label: 'Status' },
]

const qualityPills: { id: QualityPill; label: string }[] = [
  { id: 'validation', label: 'Validation name' },
  { id: 'table', label: 'Table name' },
  { id: 'source', label: 'Data source' },
  { id: 'schema', label: 'Schema' },
  { id: 'dts', label: 'DTS' },
]

function has(value: string, needle: string) {
  return value.toLowerCase().includes(needle)
}

function connectionHits(sources: DataSource[], query: string, pill: ConnectionPill | null): SearchHit[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return []
  const hits: SearchHit[] = []
  const matchSource = (source: DataSource) => {
    if (!pill) {
      return (
        has(source.name, needle) ||
        has(source.schema, needle) ||
        has(source.type, needle) ||
        has(source.active ? 'active' : 'inactive', needle)
      )
    }
    if (pill === 'source') return has(source.name, needle)
    if (pill === 'schema') return has(source.schema, needle)
    if (pill === 'type') return has(source.type, needle)
    if (pill === 'status') return has(source.active ? 'active' : 'inactive', needle)
    return false
  }
  const matchTable = (source: DataSource, table: DataSource['tables'][number]) => {
    if (!pill) {
      return has(table.nickname, needle) || has(table.name, needle) || has(source.name, needle) || has(source.schema, needle)
    }
    if (pill === 'table') return has(table.nickname, needle) || has(table.name, needle)
    if (pill === 'source') return has(source.name, needle)
    if (pill === 'schema') return has(source.schema, needle)
    if (pill === 'type') return has(source.type, needle)
    if (pill === 'status') return has(source.active ? 'active' : 'inactive', needle)
    return false
  }

  if (pill !== 'table') {
    for (const source of sources) {
      if (!matchSource(source)) continue
      hits.push({
        id: `source:${source.id}`,
        group: 'sources',
        title: source.name,
        detail: `${source.type} · ${source.schema}`,
      })
      if (hits.filter((hit) => hit.group === 'sources').length >= resultLimit) break
    }
  }

  if (pill !== 'source') {
    let tables = 0
    for (const source of sources) {
      for (const table of source.tables) {
        if (!matchTable(source, table)) continue
        hits.push({
          id: `table:${table.id}`,
          group: 'tables',
          title: table.nickname,
          detail: `${source.name} · ${table.name}`,
        })
        tables += 1
        if (tables >= resultLimit) break
      }
      if (tables >= resultLimit) break
    }
  }

  return hits
}

function qualityHits(query: string, pill: QualityPill | null): SearchHit[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return []
  const hits: SearchHit[] = []
  for (const run of validationRuns) {
    const dts = `${run.score.toFixed(1)}%`
    const match = pill
      ? pill === 'validation'
        ? has(run.validationName, needle) || has(run.validationId, needle)
        : pill === 'table'
          ? has(run.tableName, needle)
          : pill === 'source'
            ? has(run.sourceType, needle)
            : pill === 'schema'
              ? has(run.schema, needle)
              : has(dts, needle) || has(String(run.score), needle)
      : has(run.validationName, needle) ||
        has(run.validationId, needle) ||
        has(run.tableName, needle) ||
        has(run.sourceType, needle) ||
        has(run.schema, needle) ||
        has(dts, needle)
    if (!match) continue
    hits.push({
      id: `validation:${run.id}`,
      group: 'validations',
      title: run.tableName,
      detail: `${run.validationId} · ${run.validationName} · ${dts}`,
    })
    if (hits.length >= resultLimit) break
  }
  return hits
}

export default function WorkspaceSearch({
  screen,
  sources,
  query,
  onQuery,
  searchId,
  inputRef,
  onPickSource,
  onPickTable,
  onPickValidation,
}: {
  screen: 'connections' | 'data-quality'
  sources: DataSource[]
  query: string
  onQuery: (value: string) => void
  searchId: string
  inputRef: RefObject<HTMLInputElement | null>
  onPickSource: (id: string) => void
  onPickTable: (id: string) => void
  onPickValidation: (id: string) => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [connectionPill, setConnectionPill] = useState<ConnectionPill | null>(null)
  const [qualityPill, setQualityPill] = useState<QualityPill | null>(null)
  const [active, setActive] = useState(0)
  const [box, setBox] = useState({ top: 0, left: 0, width: 0 })

  function place() {
    const rect = inputRef.current?.getBoundingClientRect()
    if (!rect) return
    setBox({ top: rect.bottom + 4, left: rect.left, width: rect.width })
  }

  const hits = useMemo(
    () => (screen === 'connections' ? connectionHits(sources, query, connectionPill) : qualityHits(query, qualityPill)),
    [screen, sources, query, connectionPill, qualityPill],
  )

  useEffect(() => {
    setActive(0)
  }, [query, connectionPill, qualityPill, screen])

  useEffect(() => {
    setConnectionPill(null)
    setQualityPill(null)
    setOpen(false)
  }, [screen])

  useEffect(() => {
    if (!open) return
    place()

    function onPointerDown(event: MouseEvent) {
      if (wrapRef.current?.contains(event.target as Node) || panelRef.current?.contains(event.target as Node)) return
      setOpen(false)
    }

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }

    function onReposition() {
      place()
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open, inputRef])

  function pick(hit: SearchHit) {
    const sep = hit.id.indexOf(':')
    const kind = hit.id.slice(0, sep)
    const id = hit.id.slice(sep + 1)
    if (kind === 'source') onPickSource(id)
    if (kind === 'table') onPickTable(id)
    if (kind === 'validation') onPickValidation(id)
    onQuery('')
    setOpen(false)
  }

  function onInputKey(event: KeyboardEvent<HTMLInputElement>) {
    if (!open) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((current) => Math.min(hits.length - 1, current + 1))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((current) => Math.max(0, current - 1))
    }
    if (event.key === 'Enter' && hits[active]) {
      event.preventDefault()
      pick(hits[active])
    }
  }

  const pills = screen === 'connections' ? connectionPills : qualityPills
  const currentPill = screen === 'connections' ? connectionPill : qualityPill
  const groups =
    screen === 'connections'
      ? [
          { id: 'sources' as const, label: 'Data sources' },
          { id: 'tables' as const, label: 'Tables' },
        ]
      : [{ id: 'validations' as const, label: 'Validations' }]

  return (
    <div ref={wrapRef} className="relative min-w-0 flex-1">
      <label htmlFor={searchId} className="sr-only">
        Search
      </label>
      <span className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-outline">
        <SearchIcon />
      </span>
      <input
        ref={inputRef}
        id={searchId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${searchId}-panel`}
        aria-autocomplete="list"
        value={query}
        placeholder="Search"
        onFocus={() => {
          place()
          setOpen(true)
        }}
        onChange={(event) => {
          onQuery(event.target.value)
          place()
          setOpen(true)
        }}
        onKeyDown={onInputKey}
        className={`${fieldClass} w-full pr-10 pl-10`}
      />
      {query ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onQuery('')
            setOpen(false)
          }}
          className="absolute top-1/2 right-2 z-10 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors duration-150 ease-databuck hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>
      ) : null}

      {open
        ? createPortal(
            <div
              ref={panelRef}
              id={`${searchId}-panel`}
              className="fixed z-40 overflow-hidden rounded-lg border border-line bg-canvas shadow-overlay"
              style={{ top: box.top, left: box.left, width: box.width }}
            >
              {screen === 'data-quality' ? (
                <div className="border-b border-line px-3 py-3">
                  <p className="mb-2 font-label text-[0.6875rem] font-medium tracking-[0.14em] text-muted uppercase">
                    Intents
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {searchIntents.map((intent) => (
                      <button
                        key={intent.id}
                        type="button"
                        onClick={() => {
                          onQuery(intent.query)
                          place()
                        }}
                        className="h-8 rounded-full border border-line px-3 font-label text-xs font-medium tracking-[0.06em] text-muted uppercase transition-colors duration-150 ease-databuck hover:border-line-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
                      >
                        {intent.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="border-b border-line px-3 py-3">
                <p className="mb-2 font-label text-[0.6875rem] font-medium tracking-[0.14em] text-muted uppercase">
                  Search by
                </p>
                <div className="flex flex-wrap gap-2">
                  {pills.map((pill) => {
                    const pressed = currentPill === pill.id
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        aria-pressed={pressed}
                        onClick={() => {
                          if (screen === 'connections') {
                            setConnectionPill((current) => (current === pill.id ? null : (pill.id as ConnectionPill)))
                          } else {
                            setQualityPill((current) => (current === pill.id ? null : (pill.id as QualityPill)))
                          }
                        }}
                        className={`h-8 rounded-full border px-3 font-label text-xs font-medium tracking-[0.06em] uppercase transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                          pressed
                            ? 'border-indigo bg-secondary-fixed text-indigo'
                            : 'border-line text-muted hover:border-line-strong hover:text-ink'
                        }`}
                      >
                        {pill.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              {query.trim() ? (
                <div className="db-scroll max-h-80 overflow-y-auto py-2" role="listbox">
                  {hits.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-muted">No matches.</p>
                  ) : (
                    groups.map((group) => {
                      const rows = hits.filter((hit) => hit.group === group.id)
                      if (rows.length === 0) return null
                      return (
                        <div key={group.id} className="px-2 pb-2">
                          {screen === 'connections' ? (
                            <p className="px-2 py-1.5 font-label text-[0.6875rem] font-medium tracking-[0.14em] text-muted uppercase">
                              {group.label}
                            </p>
                          ) : null}
                          <ul>
                            {rows.map((hit) => {
                              const index = hits.indexOf(hit)
                              return (
                                <li key={hit.id}>
                                  <button
                                    type="button"
                                    role="option"
                                    aria-selected={index === active}
                                    onMouseEnter={() => setActive(index)}
                                    onClick={() => pick(hit)}
                                    className={`flex w-full flex-col rounded-md px-2 py-2 text-left transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                                      index === active ? 'bg-secondary-fixed' : 'hover:bg-surface'
                                    }`}
                                  >
                                    <span className="truncate font-sans text-sm font-medium text-ink">{hit.title}</span>
                                    <span className="mt-0.5 truncate font-mono text-xs text-muted">{hit.detail}</span>
                                  </button>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      )
                    })
                  )}
                </div>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

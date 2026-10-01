import { useEffect, useId, useRef, useState } from 'react'
import type { JobKind } from '../data/jobs.ts'
import { dataSources, type DataSource } from '../data/sources.ts'
import ConnectionDetail from './ConnectionDetail.tsx'
import ConnectionsPanel, { type SourceSelection } from './ConnectionsPanel.tsx'
import EmptyState from './EmptyState.tsx'
import { ExportIcon, InboxIcon, PlusIcon, SearchIcon } from './icons.tsx'
import MatchingDetail from './MatchingDetail.tsx'
import MatchingPanel, { matchingSummaryId } from './MatchingPanel.tsx'
import QualityDetail from './QualityDetail.tsx'
import QualityPanel, { qualitySummaryId } from './QualityPanel.tsx'
import ValidationWizard from './ValidationWizard.tsx'
import WorkspaceSearch from './WorkspaceSearch.tsx'

const screens = {
  connections: { title: 'Connections', action: 'Add Data Source' },
  'data-quality': { title: 'Data Quality', action: 'New Validation' },
  matching: { title: 'Data Matching', action: 'New Matching' },
} as const

export type WorkspaceId = keyof typeof screens

const fieldClass =
  'h-11 rounded-md border border-line bg-canvas px-3 font-sans text-sm text-ink transition-colors duration-150 ease-databuck focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo'

export default function Layout1Workspace({
  screen,
  onCollapseSidebar,
  onRunValidation,
  isValidationRunning,
}: {
  screen: WorkspaceId
  onCollapseSidebar: () => void
  onRunValidation: (validationId: string, name: string, kind?: JobKind) => void
  isValidationRunning: (validationId: string) => boolean
}) {
  const { title, action } = screens[screen]
  const searchId = useId()
  const searchRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [creating, setCreating] = useState(false)
  const [selection, setSelection] = useState<SourceSelection | null>(null)
  const [sources, setSources] = useState<DataSource[]>(dataSources)
  const [revealId, setRevealId] = useState<string | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [validationId, setValidationId] = useState(qualitySummaryId)
  const [validationsCollapsed, setValidationsCollapsed] = useState(false)
  const [matchingId, setMatchingId] = useState(matchingSummaryId)
  const [matchingsCollapsed, setMatchingsCollapsed] = useState(false)

  useEffect(() => {
    setQuery('')
    setStartDate('')
    setEndDate('')
    setCreating(false)
    setSelection(null)
    setRevealId(null)
    setHighlightId(null)
    setValidationId(qualitySummaryId)
    setValidationsCollapsed(false)
    setMatchingId(matchingSummaryId)
    setMatchingsCollapsed(false)
  }, [screen])

  useEffect(() => {
    if (!revealId) return
    const timer = window.setTimeout(() => setRevealId(null), 2000)
    return () => window.clearTimeout(timer)
  }, [revealId])

  useEffect(() => {
    if (!highlightId) return
    const timer = window.setTimeout(() => setHighlightId(null), 2000)
    return () => window.clearTimeout(timer)
  }, [highlightId])

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

  if (creating && (screen === 'data-quality' || screen === 'connections' || screen === 'matching')) {
    return (
      <ValidationWizard
        entry={screen === 'connections' ? 'connections' : screen === 'matching' ? 'matching' : 'quality'}
        sources={sources}
        onSourceCreated={(next) => {
          setSources((current) => (current.some((item) => item.id === next.id) ? current : [...current, next]))
          setRevealId(next.id)
          setSelection({ kind: 'source', id: next.id })
        }}
        onExit={() => setCreating(false)}
      />
    )
  }

  return (
    <div className="db-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-auto bg-surface p-8 lg:overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <h1 className="shrink-0 font-sans text-2xl font-bold tracking-[-0.02em] text-ink">
          {title}
        </h1>

        {screen === 'connections' || screen === 'data-quality' ? (
          <WorkspaceSearch
            screen={screen}
            sources={sources}
            query={query}
            onQuery={setQuery}
            searchId={searchId}
            inputRef={searchRef}
            onPickSource={(id) => {
              setSelection({ kind: 'source', id })
              setRevealId(id)
            }}
            onPickTable={(id) => {
              setSelection({ kind: 'table', id })
              setRevealId(id)
            }}
            onPickValidation={(id) => {
              setValidationId(id)
              setHighlightId(id)
              setValidationsCollapsed(false)
            }}
          />
        ) : (
          <div className="relative min-w-0 flex-1">
            <label htmlFor={searchId} className="sr-only">
              Search
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
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Date range"
            className="flex h-11 items-center gap-3 rounded-md border border-line bg-surface px-3 transition-colors duration-150 ease-databuck focus-within:border-line-strong focus-within:bg-canvas focus-within:ring-2 focus-within:ring-indigo"
          >
            <span className="shrink-0 font-label text-xs font-medium tracking-[0.08em] text-muted uppercase">
              Date range
            </span>
            <span className="h-5 w-px shrink-0 bg-line" aria-hidden="true" />
            <input
              type="date"
              aria-label="Start date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-8 bg-transparent font-sans text-sm text-ink focus:outline-none"
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
              className="h-8 bg-transparent font-sans text-sm text-ink focus:outline-none"
            />
          </div>

          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-md border border-line-strong bg-canvas px-3 font-sans text-sm font-medium text-ink transition-colors duration-150 ease-databuck hover:border-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
          >
            <ExportIcon />
            Export
          </button>
          <button
            type="button"
            onClick={() => {
              setSelection(null)
              setCreating(true)
            }}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-indigo px-4 font-sans text-sm font-medium whitespace-nowrap text-white transition-colors duration-150 ease-databuck hover:bg-indigo-hover active:scale-[0.98] active:bg-indigo-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <PlusIcon size={16} />
            {action}
          </button>
        </div>
      </div>

      <div className="flex min-h-[32rem] flex-1 flex-col gap-4 lg:min-h-0 lg:flex-row">
        {screen === 'data-quality' ? (
          <QualityPanel
            selectedId={validationId}
            onSelect={setValidationId}
            collapsed={validationsCollapsed}
            onCollapsedChange={setValidationsCollapsed}
            highlightId={highlightId}
          />
        ) : screen === 'connections' ? (
          <ConnectionsPanel
            sources={sources}
            selection={selection}
            onSelect={setSelection}
            revealId={revealId}
          />
        ) : (
          <MatchingPanel
            selectedId={matchingId}
            onSelect={setMatchingId}
            collapsed={matchingsCollapsed}
            onCollapsedChange={setMatchingsCollapsed}
            query={query}
          />
        )}
        <div
          className={`flex min-h-80 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-canvas shadow-card ${
            (screen === 'connections' && selection) || screen === 'data-quality' || screen === 'matching' ? '' : 'items-center justify-center p-8'
          }`}
        >
          {screen === 'data-quality' ? (
            <QualityDetail
              validationId={validationId}
              onOpenCatalog={() => {
                setValidationsCollapsed(true)
                onCollapseSidebar()
              }}
              onRun={onRunValidation}
              runBusy={isValidationRunning(validationId)}
            />
          ) : null}
          {screen === 'connections' && selection ? (
            <ConnectionDetail
              sources={sources}
              selection={selection}
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
          ) : null}
          {screen === 'connections' && selection === null ? (
            <EmptyState icon={<InboxIcon />} title="Select a data source." />
          ) : null}
          {screen === 'matching' ? (
            <MatchingDetail
              matchingId={matchingId}
              onRun={onRunValidation}
              runBusy={isValidationRunning(matchingId)}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

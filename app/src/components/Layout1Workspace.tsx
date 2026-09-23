import { useEffect, useId, useRef, useState } from 'react'
import { ExportIcon, SearchIcon } from './icons.tsx'

const screens = {
  connections: { title: 'Connections', action: 'Add connection' },
  'data-quality': { title: 'Data Quality', action: 'Add rule' },
  matching: { title: 'Data Matching', action: 'Add match' },
} as const

export type WorkspaceId = keyof typeof screens

const fieldClass =
  'h-11 rounded-md border border-line bg-canvas px-3 font-sans text-sm text-ink transition-colors duration-150 ease-databuck focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo'

export default function Layout1Workspace({ screen }: { screen: WorkspaceId }) {
  const { title, action } = screens[screen]
  const searchId = useId()
  const searchRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    setQuery('')
    setStartDate('')
    setEndDate('')
  }, [screen])

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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto bg-surface p-8 lg:overflow-hidden">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <h1 className="shrink-0 font-sans text-2xl font-bold tracking-[-0.02em] text-ink">
          {title}
        </h1>

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
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery('')
                searchRef.current?.focus()
              }}
              className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors duration-150 ease-databuck hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Date range"
            className="flex h-11 items-center gap-2 rounded-md border border-line bg-canvas px-3 focus-within:ring-2 focus-within:ring-indigo"
          >
            <span className="font-label text-xs font-medium tracking-[0.08em] text-muted uppercase">
              Date range
            </span>
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
            className="inline-flex h-11 items-center rounded-md bg-indigo px-4 font-sans text-sm font-medium text-white transition-colors duration-150 ease-databuck hover:bg-indigo-hover active:bg-indigo-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {action}
          </button>
        </div>
      </div>

      <div className="flex min-h-[32rem] flex-1 flex-col gap-4 lg:min-h-0 lg:flex-row">
        <div className="min-h-64 rounded-lg border border-line bg-canvas shadow-card lg:w-80 lg:shrink-0" />
        <div className="min-h-80 flex-1 rounded-lg border border-line bg-canvas shadow-card" />
      </div>
    </div>
  )
}

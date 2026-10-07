import { useId, useRef, useState, useEffect } from 'react'
import { useWorkspaceAi } from '../../ai/WorkspaceAiContext.tsx'
import { PlusIcon, SearchIcon } from '../icons.tsx'
import { primaryButton } from '../wizard/ui.tsx'
import { searchFieldClass } from '../jobs/chrome.tsx'
import AccessView, { type AccessSection } from './AccessView.tsx'
import AuditView from './AuditView.tsx'
import LogsView from './LogsView.tsx'
import ReportsView from './ReportsView.tsx'
import SettingsView from './SettingsView.tsx'
import TokensView from './TokensView.tsx'

export const adminTabs = [
  ['access', 'Access'],
  ['tokens', 'Tokens'],
  ['reports', 'Reports'],
  ['settings', 'Settings'],
  ['audit', 'Audit'],
  ['logs', 'Logs'],
] as const

export type AdminTab = (typeof adminTabs)[number][0]

const accessPills: [AccessSection, string][] = [
  ['users', 'Users'],
  ['roles', 'Roles'],
  ['groups', 'Login groups'],
]

const searchPlaceholder: Record<AdminTab, string> = {
  access: 'Search users, roles, or groups',
  tokens: 'Search tokens',
  reports: 'Search reports',
  settings: 'Search properties',
  audit: 'Search audit trail',
  logs: 'Filter log lines',
}

export default function AdminWorkspace({
  tab,
  onTabChange,
}: {
  tab: AdminTab
  onTabChange: (tab: AdminTab) => void
}) {
  const searchId = useId()
  const searchRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [accessSection, setAccessSection] = useState<AccessSection>('users')
  const [logFetch, setLogFetch] = useState(0)
  const { setFocus } = useWorkspaceAi()

  useEffect(() => {
    setFocus({ screen: 'admin' })
  }, [setFocus])

  const cta =
    tab === 'access'
      ? accessSection === 'users'
        ? 'New user'
        : accessSection === 'roles'
          ? 'New role'
          : 'New login group'
      : tab === 'tokens'
        ? 'New token'
        : tab === 'reports'
          ? 'New report'
          : tab === 'logs'
            ? 'Fetch logs'
            : null

  function onCta() {
    if (tab === 'logs') {
      setLogFetch((current) => current + 1)
      return
    }
    setCreating(true)
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-4 overflow-auto bg-surface p-8 lg:overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <h1 className="shrink-0 font-sans text-2xl font-bold tracking-[-0.02em] text-ink">Administration</h1>
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
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder[tab]}
            className={searchFieldClass}
          />
        </div>
        {cta ? (
          <button type="button" className={primaryButton} onClick={onCta}>
            {tab === 'logs' ? null : <PlusIcon size={16} />}
            {cta}
          </button>
        ) : null}
      </div>

      <div role="tablist" className="flex shrink-0 gap-6 border-b border-line">
        {adminTabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => {
              onTabChange(id)
              setCreating(false)
              setQuery('')
            }}
            className={`-mb-px shrink-0 cursor-pointer border-b-2 py-3 font-label text-xs font-medium tracking-[0.08em] uppercase transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
              tab === id ? 'border-indigo text-indigo' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'access' ? (
        <div className="flex shrink-0 flex-wrap gap-1.5" role="group" aria-label="Access section">
          {accessPills.map(([id, label]) => {
            const pressed = accessSection === id
            return (
              <button
                key={id}
                type="button"
                aria-pressed={pressed}
                onClick={() => {
                  setAccessSection(id)
                  setCreating(false)
                }}
                className={`h-8 shrink-0 whitespace-nowrap rounded-full border px-2.5 font-label text-[0.6875rem] font-medium tracking-[0.04em] transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                  pressed ? 'border-indigo bg-secondary-fixed text-indigo' : 'border-line text-muted hover:border-line-strong hover:text-ink'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      ) : null}

      {tab === 'access' ? (
        <AccessView query={query} section={accessSection} creating={creating} onCreatingChange={setCreating} />
      ) : null}
      {tab === 'tokens' ? <TokensView query={query} creating={creating} onCreatingChange={setCreating} /> : null}
      {tab === 'reports' ? <ReportsView query={query} creating={creating} onCreatingChange={setCreating} /> : null}
      {tab === 'settings' ? <SettingsView query={query} /> : null}
      {tab === 'audit' ? <AuditView query={query} /> : null}
      {tab === 'logs' ? <LogsView query={query} fetchSignal={logFetch} /> : null}
    </div>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { linkedPairs, pairKey, pairLabel } from '../data/workspaces.ts'
import { useWorkspaceSession } from '../workspace/WorkspaceSession.tsx'
import DomainProjectDialog from './DomainProjectDialog.tsx'
import AlertPopover from './ai/AlertPopover.tsx'
import Mark from './Mark.tsx'
import {
  BackIcon,
  BellIcon,
  CheckIcon,
  ChevronIcon,
  LogoutIcon,
  SparkIcon,
  SunIcon,
} from './icons.tsx'

const iconButtonClass =
  'relative inline-flex size-11 shrink-0 items-center justify-center rounded-md text-ink transition-colors duration-150 ease-databuck hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo active:scale-[0.97]'

const dividerClass = 'hidden h-6 w-px shrink-0 bg-line sm:block'

export default function Header({
  onLogout,
  agentOpen,
  onToggleAgent,
  agentWorkspace = false,
  onLeaveAgent,
  onOpenSettings,
  aiEnabled = true,
}: {
  onLogout: () => void
  agentOpen: boolean
  onToggleAgent: () => void
  agentWorkspace?: boolean
  onLeaveAgent?: () => void
  onOpenSettings?: () => void
  aiEnabled?: boolean
}) {
  const { domains, projects, selected, setSelected, applyCatalog, selectedLabel } = useWorkspaceSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [noticeOpen, setNoticeOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const closeNotice = useCallback(() => setNoticeOpen(false), [])
  const pairs = linkedPairs(domains, projects)
  const selectedMeta = pairs.find((pair) => selected && pairKey(pair) === pairKey(selected)) ?? pairs[0] ?? null
  const triggerLabel = selectedLabel

  useEffect(() => {
    if (!menuOpen) return

    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  return (
    <header className="relative z-20 flex h-16 shrink-0 items-center gap-4 border-b border-line bg-canvas px-4">
      <div className="flex h-full min-w-0 flex-1 items-center gap-4">
        {agentWorkspace ? (
          <>
            <div className="flex min-w-0 items-center gap-3">
              <Mark />
              <span className="hidden font-sans text-lg font-bold tracking-[-0.04em] whitespace-nowrap text-ink sm:block">
                Databuck
              </span>
            </div>
            <span className={dividerClass} aria-hidden="true" />
          </>
        ) : null}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            className="inline-flex h-11 max-w-36 items-center gap-2 rounded-md px-2 font-sans text-sm font-medium text-ink transition-colors duration-150 ease-databuck hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo md:max-w-none md:px-3"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="truncate">{triggerLabel}</span>
            <span className={`shrink-0 text-muted transition-transform duration-150 ease-databuck ${menuOpen ? 'rotate-180' : ''}`}>
              <ChevronIcon />
            </span>
          </button>
          {menuOpen ? (
            <div
              role="menu"
              aria-label="Domain and project"
              className="absolute top-full left-0 z-40 mt-1 min-w-64 rounded-md border border-line bg-canvas p-1 shadow-overlay"
            >
              {pairs.map((pair) => {
                const domain = domains.find((item) => item.id === pair.domainId)
                const project = projects.find((item) => item.id === pair.projectId)
                if (!domain || !project) return null
                const current = selectedMeta ? pairKey(pair) === pairKey(selectedMeta) : false
                const label = pairLabel(domain.name, project.name)
                return (
                  <button
                    key={pairKey(pair)}
                    type="button"
                    role="menuitem"
                    aria-current={current ? 'true' : undefined}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left font-sans text-sm transition-colors duration-150 ease-databuck ${
                      current ? 'bg-secondary-fixed text-indigo' : 'text-ink hover:bg-surface'
                    }`}
                    onClick={() => {
                      setSelected(pair)
                      setMenuOpen(false)
                    }}
                  >
                    {current ? <CheckIcon /> : <span className="inline-block w-4 shrink-0" />}
                    {label}
                  </button>
                )
              })}
              <div className="my-1 border-t border-line" />
              <button
                type="button"
                role="menuitem"
                className="flex h-10 w-full items-center rounded-md px-3 text-left font-sans text-sm font-medium text-ink transition-colors duration-150 ease-databuck hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
                onClick={() => {
                  setMenuOpen(false)
                  setManageOpen(true)
                }}
              >
                Manage domain-project
              </button>
            </div>
          ) : null}
        </div>

        <span className={dividerClass} aria-hidden="true" />

        <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="ml-auto flex w-max items-center gap-2">
          <button
            type="button"
            className={iconButtonClass}
            aria-label="Notifications, unread"
            onClick={() => setNoticeOpen(true)}
          >
            <BellIcon />
            <span className="absolute top-2 right-2 size-2 rounded-full bg-danger ring-2 ring-canvas" />
          </button>
          <button
            type="button"
            className={iconButtonClass}
            aria-label="Settings"
            onClick={() => (onOpenSettings ? onOpenSettings() : setNoticeOpen(true))}
          >
            <SunIcon />
          </button>
          <span className={`mx-1 ${dividerClass}`} aria-hidden="true" />
          {agentWorkspace ? (
            <button
              type="button"
              onClick={onLeaveAgent}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md border border-line-strong bg-canvas px-3 font-sans text-sm font-medium text-ink transition-colors duration-150 ease-databuck hover:border-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
            >
              <BackIcon />
              Back to workspace
            </button>
          ) : aiEnabled ? (
          <button
            type="button"
            aria-pressed={agentOpen}
            onClick={onToggleAgent}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-indigo px-3 font-label text-xs font-medium tracking-[0.08em] text-white uppercase transition-colors duration-150 ease-databuck hover:bg-indigo-hover active:scale-[0.97] active:bg-indigo-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <SparkIcon />
            Data Trust Agent
          </button>
          ) : null}
          <button
            type="button"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md px-2 transition-colors duration-150 ease-databuck hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
            aria-label="Alex Rivera, Data Steward"
          >
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-indigo font-sans text-xs font-semibold text-white">
              AR
            </span>
            <span className="text-left">
              <span className="block font-sans text-sm leading-tight font-semibold text-ink">
                Alex Rivera
              </span>
              <span className="block font-label text-xs leading-tight font-medium tracking-[0.12em] text-muted uppercase">
                Data Steward
              </span>
            </span>
          </button>
          <button type="button" className={iconButtonClass} aria-label="Log out" onClick={onLogout}>
            <LogoutIcon />
          </button>
          </div>
        </div>
      </div>
      {noticeOpen ? <AlertPopover onClose={closeNotice} /> : null}
      {manageOpen ? (
        <DomainProjectDialog
          domains={domains}
          projects={projects}
          onChange={applyCatalog}
          onClose={() => setManageOpen(false)}
        />
      ) : null}
    </header>
  )
}

import type { ReactNode } from 'react'
import Mark from './Mark.tsx'
import {
  AdminIcon,
  ConnectionsIcon,
  DashboardIcon,
  JobsIcon,
  MatchingIcon,
  ObservabilityIcon,
  QualityIcon,
} from './icons.tsx'

const items: { id: string; label: string; icon: ReactNode }[] = [
  { id: 'executive-dashboard', label: 'Executive Dashboard', icon: <DashboardIcon /> },
  { id: 'connections', label: 'Connections', icon: <ConnectionsIcon /> },
  { id: 'data-quality', label: 'Data Quality', icon: <QualityIcon /> },
  { id: 'matching', label: 'Matching', icon: <MatchingIcon /> },
  { id: 'observability', label: 'Observability', icon: <ObservabilityIcon /> },
  { id: 'jobs', label: 'Jobs & Tasks', icon: <JobsIcon /> },
  { id: 'administration', label: 'Administration', icon: <AdminIcon /> },
]

export default function Sidebar({
  expanded,
  narrow,
  activeId,
  onSelect,
  onToggle,
  onHoverChange,
}: {
  expanded: boolean
  narrow: boolean
  activeId: string
  onSelect: (id: string) => void
  onToggle: () => void
  onHoverChange: (hovered: boolean) => void
}) {
  return (
    <div className="relative z-30 h-full w-[72px] shrink-0">
      <aside
        className={`absolute inset-y-0 left-0 flex h-full flex-col overflow-hidden border-r border-line bg-canvas transition-[width] duration-150 ease-databuck ${
          expanded ? 'w-60' : 'w-[72px]'
        }`}
        onMouseEnter={() => {
          if (!narrow) onHoverChange(true)
        }}
        onMouseLeave={() => {
          if (!narrow) onHoverChange(false)
        }}
      >
        <div
          className={`flex h-16 shrink-0 items-center border-b border-line ${
            expanded ? 'gap-3 px-4' : 'justify-center'
          }`}
        >
          {narrow ? (
            <button
              type="button"
              className={`flex items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                expanded ? 'gap-3' : ''
              }`}
              aria-expanded={expanded}
              aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}
              onClick={onToggle}
            >
              <Mark />
              {expanded ? (
                <span className="font-sans text-lg font-bold tracking-[-0.04em] text-ink">
                  Databuck
                </span>
              ) : null}
            </button>
          ) : (
            <div className={`flex items-center ${expanded ? 'gap-3' : ''}`}>
              <Mark />
              {expanded ? (
                <span className="font-sans text-lg font-bold tracking-[-0.04em] whitespace-nowrap text-ink">
                  Databuck
                </span>
              ) : null}
            </div>
          )}
        </div>

        <nav className="db-scroll flex-1 overflow-y-auto px-2 py-3" aria-label="Primary">
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const active = item.id === activeId
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-label={item.label}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => onSelect(item.id)}
                    className={`relative flex h-11 w-full items-center rounded-md transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo md:h-10 ${
                      expanded ? 'gap-3 px-3' : 'justify-center'
                    } ${
                      active
                        ? 'bg-secondary-fixed text-indigo'
                        : 'text-muted hover:bg-surface hover:text-ink'
                    }`}
                  >
                    {active ? (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-indigo"
                      />
                    ) : null}
                    <span className="shrink-0">{item.icon}</span>
                    {expanded ? (
                      <span className="font-label text-xs font-medium tracking-[0.08em] whitespace-nowrap uppercase">
                        {item.label}
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {expanded ? (
          <p className="border-t border-line px-4 py-4 font-sans text-xs whitespace-nowrap text-outline">
            2026 © FirstEigen
          </p>
        ) : null}
      </aside>
    </div>
  )
}

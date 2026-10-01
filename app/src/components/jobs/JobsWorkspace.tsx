import { useId, useMemo, useRef, useState } from 'react'
import { memberCatalog } from '../../data/jobs.ts'
import { useJobs } from '../../jobs/jobStore.ts'
import { PlusIcon, SearchIcon } from '../icons.tsx'
import { Field, fieldClass, Modal, primaryButton, secondaryButton } from '../wizard/ui.tsx'
import { searchFieldClass } from './chrome.tsx'
import JobGroupsView from './JobGroupsView.tsx'
import JobsBoard from './JobsBoard.tsx'
import SchedulesView from './SchedulesView.tsx'
import TriggersView from './TriggersView.tsx'

const tabs = [
  ['jobs', 'Jobs'],
  ['groups', 'Job Groups'],
  ['schedules', 'Schedules'],
  ['triggers', 'Triggers'],
] as const

type Tab = (typeof tabs)[number][0]

const cta: Record<Tab, string> = {
  jobs: 'Run now',
  groups: 'New job group',
  schedules: 'New schedule',
  triggers: 'New trigger',
}

export default function JobsWorkspace() {
  const searchId = useId()
  const searchRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<Tab>('jobs')
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [runOpen, setRunOpen] = useState(false)

  function onCta() {
    if (tab === 'jobs') setRunOpen(true)
    else setCreating(true)
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-4 overflow-auto bg-surface p-8 lg:overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <h1 className="shrink-0 font-sans text-2xl font-bold tracking-[-0.02em] text-ink">Jobs & Tasks</h1>
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
            placeholder="Search"
            className={searchFieldClass}
          />
        </div>
        <button type="button" className={primaryButton} onClick={onCta}>
          <PlusIcon size={16} />
          {cta[tab]}
        </button>
      </div>

      <div role="tablist" className="flex shrink-0 gap-6 border-b border-line">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => {
              setTab(id)
              setCreating(false)
              setQuery('')
            }}
            className={`-mb-px cursor-pointer border-b-2 py-3 font-label text-xs font-medium tracking-[0.08em] uppercase transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
              tab === id ? 'border-indigo text-indigo' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'jobs' ? <JobsBoard query={query} /> : null}
      {tab === 'groups' ? <JobGroupsView query={query} creating={creating} onCreatingChange={setCreating} /> : null}
      {tab === 'schedules' ? <SchedulesView query={query} creating={creating} onCreatingChange={setCreating} /> : null}
      {tab === 'triggers' ? <TriggersView query={query} creating={creating} onCreatingChange={setCreating} /> : null}

      {runOpen ? <RunNowModal onClose={() => setRunOpen(false)} /> : null}
    </div>
  )
}

function RunNowModal({ onClose }: { onClose: () => void }) {
  const { groups, enqueue } = useJobs()
  const members = useMemo(() => memberCatalog(), [])
  const [target, setTarget] = useState(groups[0] ? `group:${groups[0].id}` : members[0] ? `${members[0].kind}:${members[0].id}` : '')

  return (
    <Modal
      title="Run now"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryButton}
            disabled={!target}
            onClick={() => {
              const [kind, id] = target.split(':')
              if (kind === 'group') {
                const group = groups.find((item) => item.id === id)
                if (group) enqueue(group.id, group.name, 'group')
              } else {
                const member = members.find((item) => item.id === id && item.kind === kind)
                if (member) enqueue(member.id, member.name, member.kind)
              }
              onClose()
            }}
          >
            Run
          </button>
        </>
      }
    >
      <Field label="Job">
        <select value={target} onChange={(event) => setTarget(event.target.value)} className={fieldClass}>
          {groups.map((group) => (
            <option key={group.id} value={`group:${group.id}`}>
              {group.name}
            </option>
          ))}
          {members.map((member) => (
            <option key={`${member.kind}-${member.id}`} value={`${member.kind}:${member.id}`}>
              {member.name}
            </option>
          ))}
        </select>
      </Field>
    </Modal>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { useJobQueue } from '../jobs/jobStore.ts'
import AgentPanel from './AgentPanel.tsx'
import AgentWorkspace from './AgentWorkspace.tsx'
import EmptyState from './EmptyState.tsx'
import Header from './Header.tsx'
import { ClockIcon } from './icons.tsx'
import JobDeck from './JobDeck.tsx'
import Layout1Workspace, { type WorkspaceId } from './Layout1Workspace.tsx'
import Layout2Workspace, { type Layout2Screen } from './Layout2Workspace.tsx'
import Sidebar from './Sidebar.tsx'

export type LayoutId = 'layout-1' | 'layout-2'

const layoutTitle: Record<LayoutId, string> = {
  'layout-1': 'Layout 1',
  'layout-2': 'Layout 2',
}

const underDevelopment = new Set([
  'executive-dashboard',
  'observability',
  'jobs',
  'administration',
])

const layout1Workspaces = new Set<WorkspaceId>(['connections', 'data-quality', 'matching'])

function isWorkspace(id: string): id is WorkspaceId {
  return layout1Workspaces.has(id as WorkspaceId)
}

function isLayout2Screen(id: string): id is Layout2Screen {
  return id === 'data-sources' || id === 'tables' || id === 'data-quality'
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

export default function AppShell({
  layout,
  onLogout,
}: {
  layout: LayoutId
  onLogout: () => void
}) {
  const narrow = useNarrow()
  const [hovered, setHovered] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [held, setHeld] = useState(false)
  const heldRef = useRef(false)
  const holdTimer = useRef<number | null>(null)
  const [open, setOpen] = useState(false)
  const [agentOpen, setAgentOpen] = useState(false)
  const [agentWorkspace, setAgentWorkspace] = useState(false)
  const [activeId, setActiveId] = useState('executive-dashboard')
  const { jobs, wave, enqueue, isRunning } = useJobQueue()

  const expanded = narrow ? open : !held && (pinned || hovered)

  const collapseSidebar = useCallback(() => {
    setPinned(false)
    setOpen(false)
    setHovered(false)
    heldRef.current = true
    setHeld(true)
    if (holdTimer.current) window.clearTimeout(holdTimer.current)
    holdTimer.current = window.setTimeout(() => {
      heldRef.current = false
      setHeld(false)
    }, 450)
  }, [])

  function onHoverChange(next: boolean) {
    if (heldRef.current) return
    setHovered(next)
  }

  function toggleAgent() {
    if (agentWorkspace) return
    setAgentOpen((current) => {
      if (!current) collapseSidebar()
      return !current
    })
  }

  function openAgentWorkspace() {
    setAgentOpen(false)
    setAgentWorkspace(true)
  }

  function closeAgentWorkspace() {
    setAgentWorkspace(false)
  }

  useEffect(() => {
    if (!narrow) setOpen(false)
  }, [narrow])

  useEffect(() => {
    if (!narrow || !open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [narrow, open])

  useEffect(() => {
    if (!agentOpen) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setAgentOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [agentOpen])

  return (
    <div className="flex h-svh overflow-hidden bg-surface">
      {agentWorkspace ? (
        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            onLogout={onLogout}
            agentOpen={false}
            agentWorkspace
            onToggleAgent={toggleAgent}
            onLeaveAgent={closeAgentWorkspace}
          />
          <AgentWorkspace />
        </div>
      ) : (
        <>
      {narrow && open ? (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-[rgba(15,23,42,0.5)]"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <Sidebar
        layout={layout}
        expanded={expanded}
        pinned={pinned}
        narrow={narrow}
        activeId={activeId}
        onSelect={setActiveId}
        onToggle={() => setOpen((current) => !current)}
        onPinToggle={() => {
          heldRef.current = false
          setHeld(false)
          if (holdTimer.current) window.clearTimeout(holdTimer.current)
          setPinned((current) => !current)
        }}
        onHoverChange={onHoverChange}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onLogout={onLogout} agentOpen={agentOpen} onToggleAgent={toggleAgent} />
        <div className="relative flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            {layout === 'layout-1' && isWorkspace(activeId) ? (
              <Layout1Workspace
                screen={activeId}
                onCollapseSidebar={collapseSidebar}
                onRunValidation={enqueue}
                isValidationRunning={isRunning}
              />
            ) : layout === 'layout-2' && isLayout2Screen(activeId) ? (
              <Layout2Workspace screen={activeId} />
            ) : (
              <div className="flex flex-1 items-center justify-center overflow-auto bg-surface p-8">
                <EmptyState
                  icon={<ClockIcon />}
                  title={underDevelopment.has(activeId) ? 'Under Development' : layoutTitle[layout]}
                  description="This area is not available yet."
                />
              </div>
            )}
          </div>
          {agentOpen ? (
            <AgentPanel onClose={() => setAgentOpen(false)} onOpenWorkspace={openAgentWorkspace} />
          ) : null}
        </div>
      </div>
      <JobDeck jobs={jobs} wave={wave} agentOpen={agentOpen} />
        </>
      )}
    </div>
  )
}

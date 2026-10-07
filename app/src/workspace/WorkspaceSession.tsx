import { createContext, createElement, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  copyToProject,
  libraryCustomRules,
  libraryDistributionMetrics,
  type CustomRule,
  type DistributionMetric,
} from '../data/customRules.ts'
import {
  cloneCatalog,
  firstPair,
  linkedPairs,
  pairKey,
  pairLabel,
  type WorkspaceDomain,
  type WorkspacePair,
  type WorkspaceProject,
} from '../data/workspaces.ts'

type WorkspaceSessionValue = {
  domains: WorkspaceDomain[]
  projects: WorkspaceProject[]
  selected: WorkspacePair | null
  setSelected: (pair: WorkspacePair) => void
  applyCatalog: (domains: WorkspaceDomain[], projects: WorkspaceProject[]) => void
  selectedLabel: string
  labelFor: (pair: Pick<CustomRule, 'domainId' | 'projectId'>) => string
  rules: CustomRule[]
  ddms: DistributionMetric[]
  addRules: (next: CustomRule[]) => void
  importGlobalRule: (id: string) => CustomRule | null
  addDdms: (next: DistributionMetric[]) => void
}

const WorkspaceSessionContext = createContext<WorkspaceSessionValue | null>(null)

function labelOf(
  domains: WorkspaceDomain[],
  projects: WorkspaceProject[],
  pair: Pick<CustomRule, 'domainId' | 'projectId'>,
) {
  const domain = domains.find((item) => item.id === pair.domainId)?.name ?? pair.domainId
  const project = projects.find((item) => item.id === pair.projectId)?.name ?? pair.projectId
  return pairLabel(domain, project)
}

export function WorkspaceSessionProvider({ children }: { children: ReactNode }) {
  const catalog = useMemo(() => cloneCatalog(), [])
  const [domains, setDomains] = useState(catalog.domains)
  const [projects, setProjects] = useState(catalog.projects)
  const [selected, setSelectedState] = useState<WorkspacePair | null>(() => firstPair(catalog.domains, catalog.projects))
  const [rules, setRules] = useState<CustomRule[]>(() => libraryCustomRules.map((rule) => ({ ...rule })))
  const [ddms, setDdms] = useState<DistributionMetric[]>(() => libraryDistributionMetrics.map((item) => ({ ...item })))

  const applyCatalog = useCallback((nextDomains: WorkspaceDomain[], nextProjects: WorkspaceProject[]) => {
    setDomains(nextDomains)
    setProjects(nextProjects)
    const nextPairs = linkedPairs(nextDomains, nextProjects)
    setSelectedState((current) => {
      const stillSelected = current && nextPairs.some((pair) => pairKey(pair) === pairKey(current))
      return stillSelected ? current : (nextPairs[0] ?? null)
    })
  }, [])

  const setSelected = useCallback((pair: WorkspacePair) => {
    setSelectedState(pair)
  }, [])

  const addRules = useCallback((next: CustomRule[]) => {
    setRules((current) => {
      const seen = new Set(current.map((rule) => rule.id))
      const incoming = next.filter((rule) => !seen.has(rule.id))
      return incoming.length > 0 ? [...incoming, ...current] : current
    })
  }, [])

  const importGlobalRule = useCallback(
    (id: string) => {
      if (!selected) return null
      const source = rules.find((rule) => rule.id === id)
      if (!source) return null
      const copied = copyToProject(source, selected)
      setRules((current) => [copied, ...current])
      return copied
    },
    [rules, selected],
  )

  const addDdms = useCallback((next: DistributionMetric[]) => {
    setDdms((current) => {
      const seen = new Set(current.map((item) => item.id))
      const incoming = next.filter((item) => !seen.has(item.id))
      return incoming.length > 0 ? [...incoming, ...current] : current
    })
  }, [])

  const selectedLabel = selected ? labelOf(domains, projects, selected) : 'Select domain-project'

  const value = useMemo<WorkspaceSessionValue>(
    () => ({
      domains,
      projects,
      selected,
      setSelected,
      applyCatalog,
      selectedLabel,
      labelFor: (pair) => labelOf(domains, projects, pair),
      rules,
      ddms,
      addRules,
      importGlobalRule,
      addDdms,
    }),
    [addDdms, addRules, applyCatalog, ddms, domains, importGlobalRule, projects, rules, selected, selectedLabel, setSelected],
  )

  return createElement(WorkspaceSessionContext.Provider, { value }, children)
}

export function useWorkspaceSession() {
  const value = useContext(WorkspaceSessionContext)
  if (!value) throw new Error('useWorkspaceSession must be used within WorkspaceSessionProvider')
  return value
}

export function useWorkspaceSessionOptional() {
  return useContext(WorkspaceSessionContext)
}

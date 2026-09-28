export type WorkspaceDomain = {
  id: string
  name: string
  global: boolean
  projectIds: string[]
}

export type WorkspaceProject = {
  id: string
  name: string
  description: string
  domainIds: string[]
}

export type WorkspacePair = {
  domainId: string
  projectId: string
}

export const workspaceDomains: WorkspaceDomain[] = [
  { id: 'acme-corp', name: 'Acme Corp', global: false, projectIds: ['production'] },
  { id: 'meridian-health', name: 'Meridian Health', global: false, projectIds: ['claims-desk'] },
  { id: 'harbor-retail', name: 'Harbor Retail', global: false, projectIds: ['catalog-hub'] },
]

export const workspaceProjects: WorkspaceProject[] = [
  { id: 'production', name: 'Production', description: 'Live quality workspace', domainIds: ['acme-corp'] },
  { id: 'claims-desk', name: 'Claims Desk', description: 'Claims monitoring workspace', domainIds: ['meridian-health'] },
  { id: 'catalog-hub', name: 'Catalog Hub', description: 'Catalog freshness workspace', domainIds: ['harbor-retail'] },
]

export function cloneCatalog(): { domains: WorkspaceDomain[]; projects: WorkspaceProject[] } {
  return {
    domains: workspaceDomains.map((domain) => ({ ...domain, projectIds: [...domain.projectIds] })),
    projects: workspaceProjects.map((project) => ({ ...project, domainIds: [...project.domainIds] })),
  }
}

export function pairKey(pair: WorkspacePair) {
  return `${pair.domainId}:${pair.projectId}`
}

export function pairLabel(domainName: string, projectName: string) {
  return `${domainName} — ${projectName}`
}

export function linkedPairs(domains: WorkspaceDomain[], projects: WorkspaceProject[]): WorkspacePair[] {
  const known = new Set(projects.map((project) => project.id))
  const pairs: WorkspacePair[] = []
  const seen = new Set<string>()
  for (const domain of domains) {
    for (const projectId of domain.projectIds) {
      if (!known.has(projectId)) continue
      const key = `${domain.id}:${projectId}`
      if (seen.has(key)) continue
      seen.add(key)
      pairs.push({ domainId: domain.id, projectId })
    }
  }
  return pairs
}

export function firstPair(domains: WorkspaceDomain[], projects: WorkspaceProject[]): WorkspacePair | null {
  return linkedPairs(domains, projects)[0] ?? null
}

export function slugId(name: string, taken: Iterable<string>): string {
  const used = new Set(taken)
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item'
  let id = base
  let suffix = 2
  while (used.has(id)) {
    id = `${base}-${suffix}`
    suffix += 1
  }
  return id
}

export function saveDomain(
  domains: WorkspaceDomain[],
  projects: WorkspaceProject[],
  next: WorkspaceDomain,
): { domains: WorkspaceDomain[]; projects: WorkspaceProject[] } {
  const exists = domains.some((domain) => domain.id === next.id)
  const domainsNext = exists
    ? domains.map((domain) => (domain.id === next.id ? next : domain))
    : [...domains, next]
  return {
    domains: domainsNext,
    projects: projects.map((project) => ({
      ...project,
      domainIds: next.projectIds.includes(project.id)
        ? project.domainIds.includes(next.id)
          ? project.domainIds
          : [...project.domainIds, next.id]
        : project.domainIds.filter((id) => id !== next.id),
    })),
  }
}

export function saveProject(
  domains: WorkspaceDomain[],
  projects: WorkspaceProject[],
  next: WorkspaceProject,
): { domains: WorkspaceDomain[]; projects: WorkspaceProject[] } {
  const exists = projects.some((project) => project.id === next.id)
  const projectsNext = exists
    ? projects.map((project) => (project.id === next.id ? next : project))
    : [...projects, next]
  return {
    projects: projectsNext,
    domains: domains.map((domain) => ({
      ...domain,
      projectIds: next.domainIds.includes(domain.id)
        ? domain.projectIds.includes(next.id)
          ? domain.projectIds
          : [...domain.projectIds, next.id]
        : domain.projectIds.filter((id) => id !== next.id),
    })),
  }
}

export function deleteDomain(domains: WorkspaceDomain[], projects: WorkspaceProject[], id: string) {
  return {
    domains: domains.filter((domain) => domain.id !== id),
    projects: projects.map((project) => ({
      ...project,
      domainIds: project.domainIds.filter((item) => item !== id),
    })),
  }
}

export function deleteProject(domains: WorkspaceDomain[], projects: WorkspaceProject[], id: string) {
  return {
    projects: projects.filter((project) => project.id !== id),
    domains: domains.map((domain) => ({
      ...domain,
      projectIds: domain.projectIds.filter((item) => item !== id),
    })),
  }
}

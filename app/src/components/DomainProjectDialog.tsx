import { useMemo, useState, type ReactNode } from 'react'
import {
  deleteDomain,
  deleteProject,
  saveDomain,
  saveProject,
  slugId,
  type WorkspaceDomain,
  type WorkspaceProject,
} from '../data/workspaces.ts'
import { PlusIcon, SearchIcon } from './icons.tsx'
import StatusBadge from './StatusBadge.tsx'
import {
  Field,
  fieldClass,
  Modal,
  primaryButton,
  secondaryButton,
  Segment,
  Segmented,
  SwitchControl,
} from './wizard/ui.tsx'

type CatalogTab = 'domains' | 'projects'
type View =
  | { kind: 'list' }
  | { kind: 'domain-form'; id: string | null }
  | { kind: 'project-form'; id: string | null }
  | { kind: 'delete-domain'; id: string }
  | { kind: 'delete-project'; id: string }

const headClass =
  'bg-canvas px-3 py-2.5 text-left font-label text-xs font-medium tracking-[0.08em] text-muted uppercase'

const dangerButton =
  'inline-flex h-10 items-center rounded-md bg-danger px-4 font-sans text-sm font-medium text-white transition-colors duration-150 ease-databuck hover:bg-danger-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink'

const rowAction =
  'inline-flex h-8 items-center rounded-md px-2 font-sans text-sm transition-colors duration-150 ease-databuck hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo'

export default function DomainProjectDialog({
  domains,
  projects,
  onChange,
  onClose,
}: {
  domains: WorkspaceDomain[]
  projects: WorkspaceProject[]
  onChange: (domains: WorkspaceDomain[], projects: WorkspaceProject[]) => void
  onClose: () => void
}) {
  const [tab, setTab] = useState<CatalogTab>('domains')
  const [query, setQuery] = useState('')
  const [view, setView] = useState<View>({ kind: 'list' })
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [global, setGlobal] = useState(false)
  const [linkedIds, setLinkedIds] = useState<string[]>([])

  const text = query.trim().toLowerCase()
  const domainRows = useMemo(
    () =>
      domains.filter((domain) => {
        if (!text) return true
        const projectNames = domain.projectIds
          .map((id) => projects.find((project) => project.id === id)?.name ?? '')
          .join(' ')
        return `${domain.name} ${projectNames}`.toLowerCase().includes(text)
      }),
    [domains, projects, text],
  )
  const projectRows = useMemo(
    () =>
      projects.filter((project) => {
        if (!text) return true
        const domainNames = project.domainIds
          .map((id) => domains.find((domain) => domain.id === id)?.name ?? '')
          .join(' ')
        return `${project.name} ${project.description} ${domainNames}`.toLowerCase().includes(text)
      }),
    [domains, projects, text],
  )

  function openDomainForm(id: string | null) {
    const current = id ? domains.find((domain) => domain.id === id) : null
    setName(current?.name ?? '')
    setGlobal(current?.global ?? false)
    setLinkedIds(current?.projectIds ?? [])
    setView({ kind: 'domain-form', id })
  }

  function openProjectForm(id: string | null) {
    const current = id ? projects.find((project) => project.id === id) : null
    setName(current?.name ?? '')
    setDescription(current?.description ?? '')
    setLinkedIds(current?.domainIds ?? [])
    setView({ kind: 'project-form', id })
  }

  function backToList() {
    setView({ kind: 'list' })
    setName('')
    setDescription('')
    setGlobal(false)
    setLinkedIds([])
  }

  function requestClose() {
    if (view.kind === 'list') onClose()
    else backToList()
  }

  function toggleLink(id: string) {
    setLinkedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  function saveDomainForm() {
    const trimmed = name.trim()
    if (!trimmed) return
    const next: WorkspaceDomain = {
      id: view.kind === 'domain-form' && view.id ? view.id : slugId(trimmed, domains.map((domain) => domain.id)),
      name: trimmed,
      global,
      projectIds: linkedIds,
    }
    const catalog = saveDomain(domains, projects, next)
    onChange(catalog.domains, catalog.projects)
    backToList()
  }

  function saveProjectForm() {
    const trimmed = name.trim()
    if (!trimmed) return
    const next: WorkspaceProject = {
      id: view.kind === 'project-form' && view.id ? view.id : slugId(trimmed, projects.map((project) => project.id)),
      name: trimmed,
      description: description.trim(),
      domainIds: linkedIds,
    }
    const catalog = saveProject(domains, projects, next)
    onChange(catalog.domains, catalog.projects)
    backToList()
  }

  function confirmDelete() {
    const catalog =
      view.kind === 'delete-domain'
        ? deleteDomain(domains, projects, view.id)
        : view.kind === 'delete-project'
          ? deleteProject(domains, projects, view.id)
          : null
    if (!catalog) return
    onChange(catalog.domains, catalog.projects)
    backToList()
  }

  const title =
    view.kind === 'domain-form'
      ? view.id
        ? 'Edit domain'
        : 'Add domain'
      : view.kind === 'project-form'
        ? view.id
          ? 'Edit project'
          : 'Add project'
        : view.kind === 'delete-domain'
          ? 'Delete domain'
          : view.kind === 'delete-project'
            ? 'Delete project'
            : 'Manage domain-project'

  const footer =
    view.kind === 'domain-form' || view.kind === 'project-form' ? (
      <>
        <button type="button" onClick={backToList} className={secondaryButton}>
          Cancel
        </button>
        <button
          type="button"
          disabled={name.trim() === ''}
          onClick={view.kind === 'domain-form' ? saveDomainForm : saveProjectForm}
          className={primaryButton}
        >
          Save
        </button>
      </>
    ) : view.kind === 'delete-domain' || view.kind === 'delete-project' ? (
      <>
        <button type="button" onClick={backToList} className={secondaryButton}>
          Cancel
        </button>
        <button type="button" onClick={confirmDelete} className={dangerButton}>
          Delete
        </button>
      </>
    ) : undefined

  const deleteTarget =
    view.kind === 'delete-domain'
      ? domains.find((domain) => domain.id === view.id)
      : view.kind === 'delete-project'
        ? projects.find((project) => project.id === view.id)
        : null

  return (
    <Modal title={title} size="xl" onClose={requestClose} footer={footer}>
      {view.kind === 'list' ? (
        <ListView
          tab={tab}
          onTab={setTab}
          query={query}
          onQuery={setQuery}
          domains={domainRows}
          projects={projectRows}
          allDomains={domains}
          allProjects={projects}
          onAdd={() => (tab === 'domains' ? openDomainForm(null) : openProjectForm(null))}
          onEditDomain={(id) => openDomainForm(id)}
          onEditProject={(id) => openProjectForm(id)}
          onDeleteDomain={(id) => setView({ kind: 'delete-domain', id })}
          onDeleteProject={(id) => setView({ kind: 'delete-project', id })}
        />
      ) : null}
      {view.kind === 'domain-form' ? (
        <DomainForm name={name} onName={setName} global={global} onGlobal={setGlobal} linkedIds={linkedIds} onToggle={toggleLink} projects={projects} />
      ) : null}
      {view.kind === 'project-form' ? (
        <ProjectForm
          name={name}
          onName={setName}
          description={description}
          onDescription={setDescription}
          linkedIds={linkedIds}
          onToggle={toggleLink}
          domains={domains}
        />
      ) : null}
      {view.kind === 'delete-domain' || view.kind === 'delete-project' ? (
        <p className="text-sm leading-6 text-muted">
          Delete {deleteTarget?.name ?? 'this record'}? Linked {view.kind === 'delete-domain' ? 'projects' : 'domains'} stay, but this link is removed.
        </p>
      ) : null}
    </Modal>
  )
}

function ListView({
  tab,
  onTab,
  query,
  onQuery,
  domains,
  projects,
  allDomains,
  allProjects,
  onAdd,
  onEditDomain,
  onEditProject,
  onDeleteDomain,
  onDeleteProject,
}: {
  tab: CatalogTab
  onTab: (tab: CatalogTab) => void
  query: string
  onQuery: (value: string) => void
  domains: WorkspaceDomain[]
  projects: WorkspaceProject[]
  allDomains: WorkspaceDomain[]
  allProjects: WorkspaceProject[]
  onAdd: () => void
  onEditDomain: (id: string) => void
  onEditProject: (id: string) => void
  onDeleteDomain: (id: string) => void
  onDeleteProject: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented>
          <Segment pressed={tab === 'domains'} count={allDomains.length} onClick={() => onTab('domains')}>
            Domains
          </Segment>
          <Segment pressed={tab === 'projects'} count={allProjects.length} onClick={() => onTab('projects')}>
            Projects
          </Segment>
        </Segmented>
        <div className="relative min-w-48 flex-1">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-outline">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            placeholder="Search"
            onChange={(event) => onQuery(event.target.value)}
            className={`${fieldClass} pl-10`}
          />
        </div>
        <button type="button" onClick={onAdd} className={primaryButton}>
          <PlusIcon size={16} />
          Add
        </button>
      </div>

      {tab === 'domains' ? (
        <CatalogTable empty={domains.length === 0 ? 'No domains match this search.' : undefined}>
          <thead>
            <tr>
              <th scope="col" className={headClass}>
                Domain name
              </th>
              <th scope="col" className={headClass}>
                Global
              </th>
              <th scope="col" className={headClass}>
                Projects
              </th>
              <th scope="col" className={`${headClass} w-32 text-right`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {domains.map((domain) => (
              <tr key={domain.id} className="border-t border-line">
                <td className="px-3 py-3 font-sans text-sm font-medium text-ink">{domain.name}</td>
                <td className="px-3 py-3">
                  <StatusBadge tone={domain.global ? 'success' : 'neutral'} label={domain.global ? 'Yes' : 'No'} />
                </td>
                <td className="px-3 py-3">
                  <NameChips
                    names={domain.projectIds
                      .map((id) => allProjects.find((project) => project.id === id)?.name)
                      .filter((item): item is string => Boolean(item))}
                  />
                </td>
                <td className="px-3 py-3 text-right">
                  <button type="button" onClick={() => onEditDomain(domain.id)} className={rowAction}>
                    Edit
                  </button>
                  <button type="button" onClick={() => onDeleteDomain(domain.id)} className={`${rowAction} text-danger`}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </CatalogTable>
      ) : (
        <CatalogTable empty={projects.length === 0 ? 'No projects match this search.' : undefined}>
          <thead>
            <tr>
              <th scope="col" className={headClass}>
                Project name
              </th>
              <th scope="col" className={headClass}>
                Description
              </th>
              <th scope="col" className={headClass}>
                Domains
              </th>
              <th scope="col" className={`${headClass} w-32 text-right`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-t border-line">
                <td className="px-3 py-3 font-sans text-sm font-medium text-ink">{project.name}</td>
                <td className="max-w-xs px-3 py-3 font-sans text-sm text-muted">{project.description || '—'}</td>
                <td className="px-3 py-3">
                  <NameChips
                    names={project.domainIds
                      .map((id) => allDomains.find((domain) => domain.id === id)?.name)
                      .filter((item): item is string => Boolean(item))}
                  />
                </td>
                <td className="px-3 py-3 text-right">
                  <button type="button" onClick={() => onEditProject(project.id)} className={rowAction}>
                    Edit
                  </button>
                  <button type="button" onClick={() => onDeleteProject(project.id)} className={`${rowAction} text-danger`}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </CatalogTable>
      )}
    </div>
  )
}

function CatalogTable({ children, empty }: { children: ReactNode; empty?: string }) {
  if (empty) {
    return <p className="rounded-lg border border-line px-4 py-8 text-center text-sm text-muted">{empty}</p>
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[36rem] border-collapse text-left">{children}</table>
    </div>
  )
}

function NameChips({ names }: { names: string[] }) {
  if (names.length === 0) return <span className="text-sm text-muted">—</span>
  return (
    <span className="flex flex-wrap gap-1.5">
      {names.map((name) => (
        <span key={name} className="rounded-md bg-surface px-2 py-0.5 font-sans text-xs text-ink">
          {name}
        </span>
      ))}
    </span>
  )
}

function DomainForm({
  name,
  onName,
  global,
  onGlobal,
  linkedIds,
  onToggle,
  projects,
}: {
  name: string
  onName: (value: string) => void
  global: boolean
  onGlobal: (value: boolean) => void
  linkedIds: string[]
  onToggle: (id: string) => void
  projects: WorkspaceProject[]
}) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Domain name" required>
        <input value={name} onChange={(event) => onName(event.target.value)} placeholder="e.g. Northwind Analytics" className={fieldClass} />
      </Field>
      <SwitchControl checked={global} label="Global domain" onChange={onGlobal} />
      <LinkSet label="Projects" items={projects} linkedIds={linkedIds} onToggle={onToggle} empty="No projects yet." />
    </div>
  )
}

function ProjectForm({
  name,
  onName,
  description,
  onDescription,
  linkedIds,
  onToggle,
  domains,
}: {
  name: string
  onName: (value: string) => void
  description: string
  onDescription: (value: string) => void
  linkedIds: string[]
  onToggle: (id: string) => void
  domains: WorkspaceDomain[]
}) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Project name" required>
        <input value={name} onChange={(event) => onName(event.target.value)} placeholder="e.g. Ledger Watch" className={fieldClass} />
      </Field>
      <Field label="Description">
        <input
          value={description}
          onChange={(event) => onDescription(event.target.value)}
          placeholder="What this project is used for"
          className={fieldClass}
        />
      </Field>
      <LinkSet label="Domains" items={domains} linkedIds={linkedIds} onToggle={onToggle} empty="No domains yet." />
    </div>
  )
}

function LinkSet({
  label,
  items,
  linkedIds,
  onToggle,
  empty,
}: {
  label: string
  items: { id: string; name: string }[]
  linkedIds: string[]
  onToggle: (id: string) => void
  empty: string
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 font-sans text-xs font-medium text-ink">{label}</legend>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-2.5 rounded-md border border-line px-3 py-2.5 text-sm text-ink transition-colors duration-150 ease-databuck hover:border-line-strong hover:bg-surface"
            >
              <input
                type="checkbox"
                checked={linkedIds.includes(item.id)}
                onChange={() => onToggle(item.id)}
                className="size-4 accent-indigo"
              />
              {item.name}
            </label>
          ))}
        </div>
      )}
    </fieldset>
  )
}

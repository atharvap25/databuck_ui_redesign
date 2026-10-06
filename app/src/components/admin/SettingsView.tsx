import { useEffect, useMemo, useState } from 'react'
import {
  categoryById,
  isBooleanYes,
  projectLabel,
  settingDefaultMap,
  settingGroups,
  settingProperties,
  type SettingProperty,
  type SettingsScope,
} from '../../data/admin.ts'
import { workspaceProjects } from '../../data/workspaces.ts'
import { useAdmin } from '../../admin/adminStore.ts'
import { fieldClass, primaryButton, secondaryButton, Segment, Segmented, SwitchControl } from '../wizard/ui.tsx'

const defaults = settingDefaultMap()

export default function SettingsView({ query }: { query: string }) {
  const { applicationValues, projectValues, saveApplicationSettings, saveProjectSettings } = useAdmin()
  const [scope, setScope] = useState<SettingsScope>('application')
  const [projectId, setProjectId] = useState(workspaceProjects[0]?.id ?? 'production')
  const [categoryId, setCategoryId] = useState(settingGroups[0].categories[0].id)
  const [draftApp, setDraftApp] = useState<Record<string, string>>(applicationValues)
  const [draftProjects, setDraftProjects] = useState<Record<string, Record<string, string>>>(projectValues)

  useEffect(() => {
    setDraftApp(applicationValues)
  }, [applicationValues])

  useEffect(() => {
    setDraftProjects(projectValues)
  }, [projectValues])

  const needle = query.trim().toLowerCase()
  const matched = useMemo(() => {
    if (!needle) return settingProperties
    return settingProperties.filter((property) => {
      const category = categoryById(property.categoryId)?.label ?? ''
      return `${property.label} ${property.hint} ${property.id} ${category}`.toLowerCase().includes(needle)
    })
  }, [needle])

  const matchedCategories = useMemo(() => new Set(matched.map((property) => property.categoryId)), [matched])

  useEffect(() => {
    if (!needle) return
    if (!matchedCategories.has(categoryId) && matched[0]) setCategoryId(matched[0].categoryId)
  }, [needle, matched, matchedCategories, categoryId])

  const visible = matched.filter((property) => property.categoryId === categoryId)
  const category = categoryById(categoryId)
  const storedApp = applicationValues
  const storedProject = projectValues[projectId] ?? {}
  const draftProject = draftProjects[projectId] ?? {}

  const dirty =
    scope === 'application'
      ? JSON.stringify(draftApp) !== JSON.stringify(storedApp)
      : JSON.stringify(draftProject) !== JSON.stringify(storedProject)

  function applicationValue(property: SettingProperty) {
    return draftApp[property.id] ?? storedApp[property.id] ?? property.defaultValue
  }

  function currentValue(property: SettingProperty) {
    if (scope === 'application') return applicationValue(property)
    if (property.id in draftProject) return draftProject[property.id]
    return applicationValue(property)
  }

  function setValue(property: SettingProperty, value: string) {
    if (scope === 'application') {
      setDraftApp((current) => ({ ...current, [property.id]: value }))
      return
    }
    setDraftProjects((current) => ({
      ...current,
      [projectId]: { ...(current[projectId] ?? {}), [property.id]: value },
    }))
  }

  function resetProperty(property: SettingProperty) {
    if (scope === 'application') {
      setDraftApp((current) => {
        const next = { ...current }
        delete next[property.id]
        return next
      })
      return
    }
    setDraftProjects((current) => {
      const row = { ...(current[projectId] ?? {}) }
      delete row[property.id]
      return { ...current, [projectId]: row }
    })
  }

  function discard() {
    setDraftApp(applicationValues)
    setDraftProjects(projectValues)
  }

  function save() {
    if (scope === 'application') {
      saveApplicationSettings(draftApp)
      return
    }
    saveProjectSettings(projectId, draftProject)
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-canvas shadow-card">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        <Segmented>
          <Segment pressed={scope === 'application'} onClick={() => setScope('application')}>
            Application
          </Segment>
          <Segment pressed={scope === 'project'} onClick={() => setScope('project')}>
            Project
          </Segment>
        </Segmented>
        {scope === 'project' ? (
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className={`${fieldClass} max-w-56`}>
            {workspaceProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        ) : null}
        <p className="text-sm text-muted">
          {scope === 'application'
            ? 'Defaults for every project. Projects can override individual properties.'
            : `Overrides for ${projectLabel(projectId)}. Unset properties inherit application values.`}
        </p>
      </div>

      <div className="flex min-h-0 flex-1">
        <nav className="db-scroll hidden w-56 shrink-0 overflow-auto border-r border-line lg:block" aria-label="Setting categories">
          {settingGroups.map((group) => (
            <div key={group.id} className="px-2 py-3">
              <p className="px-2 pb-1 font-label text-[10px] tracking-[0.14em] text-muted uppercase">{group.label}</p>
              <ul>
                {group.categories.map((item) => {
                  const on = item.id === categoryId
                  const hit = !needle || matchedCategories.has(item.id)
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setCategoryId(item.id)}
                        className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left font-sans text-sm transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                          on ? 'bg-secondary-fixed font-medium text-indigo' : hit ? 'text-ink hover:bg-surface' : 'text-outline'
                        }`}
                      >
                        {item.label}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-line px-5 py-4 lg:hidden">
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className={fieldClass}>
              {settingGroups.map((group) => (
                <optgroup key={group.id} label={group.label}>
                  {group.categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-sans text-base font-semibold tracking-[-0.02em] text-ink">{category?.label}</h2>
            <p className="mt-1 text-sm text-muted">
              {visible.length} {visible.length === 1 ? 'property' : 'properties'}
              {needle ? ' matching this search' : ''}
            </p>
          </div>
          <div className="db-scroll min-h-0 flex-1 overflow-auto px-5">
            {visible.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted">No properties match this search.</p>
            ) : (
              visible.map((property) => {
                const value = currentValue(property)
                const inherited = scope === 'project' && !(property.id in draftProject)
                const usingDefault = scope === 'application' && (draftApp[property.id] ?? storedApp[property.id] ?? property.defaultValue) === defaults[property.id]
                return (
                  <div key={property.id} className="flex flex-col gap-3 border-b border-line py-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 max-w-md">
                      <p className="font-sans text-sm font-medium text-ink">{property.label}</p>
                      <p className="mt-1 text-xs leading-5 text-muted">{property.hint}</p>
                      <p className="mt-2 font-label text-[10px] tracking-[0.14em] text-muted uppercase">
                        {inherited ? 'Using application value' : usingDefault ? 'Using default' : scope === 'project' ? 'Project override' : 'Custom'}
                      </p>
                    </div>
                    <div className="flex w-full max-w-sm flex-col items-end gap-2 sm:w-80">
                      <PropertyControl property={property} value={value} onChange={(next) => setValue(property, next)} />
                      {!inherited && (scope === 'project' ? property.id in draftProject : value !== property.defaultValue) ? (
                        <button type="button" className="font-sans text-xs text-muted hover:text-ink" onClick={() => resetProperty(property)}>
                          Reset
                        </button>
                      ) : null}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {dirty ? (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas px-5 py-3">
          <p className="font-sans text-sm text-ink">Unsaved changes</p>
          <div className="flex gap-2">
            <button type="button" className={secondaryButton} onClick={discard}>
              Discard
            </button>
            <button type="button" className={primaryButton} onClick={save}>
              Save changes
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function PropertyControl({
  property,
  value,
  onChange,
}: {
  property: SettingProperty
  value: string
  onChange: (value: string) => void
}) {
  if (property.type === 'boolean') {
    return <SwitchControl checked={isBooleanYes(value)} onChange={(on) => onChange(on ? 'Y' : 'N')} />
  }
  if (property.type === 'enum' && property.options) {
    return (
      <select value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass}>
        {property.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    )
  }
  if (property.type === 'number') {
    return <input type="number" value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass} />
  }
  if (property.type === 'secret') {
    return <input type="password" value={value} onChange={(event) => onChange(event.target.value)} className={`${fieldClass} font-mono text-xs`} />
  }
  return (
    <input
      type={property.type === 'url' ? 'url' : 'text'}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={fieldClass}
    />
  )
}

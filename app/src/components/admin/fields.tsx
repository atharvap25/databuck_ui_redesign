import { workspaceProjects } from '../../data/workspaces.ts'
import { CheckControl, fieldClass } from '../wizard/ui.tsx'

export const rowClass = 'border-t border-line transition-colors duration-150 ease-databuck hover:bg-surface'
export const cellClass = 'px-3 py-3'
export const ghostButton =
  'font-sans text-sm text-indigo transition-colors duration-150 ease-databuck hover:text-indigo-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo'
export const dangerButton =
  'font-sans text-sm text-danger transition-colors duration-150 ease-databuck hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo'

export function ProjectChecks({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  return (
    <div className="rounded-md border border-line">
      {workspaceProjects.map((project) => (
        <CheckControl
          key={project.id}
          checked={selected.includes(project.id)}
          label={project.name}
          hint={project.description}
          onChange={(checked) => {
            onChange(checked ? [...selected, project.id] : selected.filter((id) => id !== project.id))
          }}
        />
      ))}
    </div>
  )
}

export function SecretBox({ value, label = 'Token' }: { value: string; label?: string }) {
  return (
    <div className="flex gap-2">
      <input readOnly value={value} aria-label={label} className={`${fieldClass} font-mono text-xs`} />
      <button
        type="button"
        className="inline-flex h-10 shrink-0 items-center rounded-md border border-line bg-canvas px-3 font-sans text-sm font-medium text-ink shadow-card transition-colors duration-150 ease-databuck hover:border-line-strong hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
        onClick={() => void navigator.clipboard.writeText(value)}
      >
        Copy
      </button>
    </div>
  )
}

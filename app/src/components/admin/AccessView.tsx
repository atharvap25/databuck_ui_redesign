import { useEffect, useMemo, useState } from 'react'
import {
  crudActions,
  crudLabel,
  emptyPermissions,
  extraActions,
  extraLabel,
  fullName,
  newAdminId,
  permissionModules,
  projectLabel,
  roleName,
  type AdminUser,
  type ExtraAction,
  type LoginGroup,
  type ModulePermissions,
  type PermissionAction,
  type Role,
} from '../../data/admin.ts'
import { useAdmin } from '../../admin/adminStore.ts'
import EmptyState from '../EmptyState.tsx'
import { AdminIcon } from '../icons.tsx'
import StatusBadge from '../StatusBadge.tsx'
import { Field, fieldClass, Modal, primaryButton, secondaryButton, SwitchControl } from '../wizard/ui.tsx'
import { headClass, KindBadge, PageBar } from '../jobs/chrome.tsx'
import { cellClass, dangerButton, ghostButton, ProjectChecks, rowClass } from './fields.tsx'

export type AccessSection = 'users' | 'roles' | 'groups'

const pageSize = 8

export default function AccessView({
  query,
  section,
  creating,
  onCreatingChange,
}: {
  query: string
  section: AccessSection
  creating: boolean
  onCreatingChange: (open: boolean) => void
}) {
  if (section === 'roles') {
    return <RolesPanel query={query} creating={creating} onCreatingChange={onCreatingChange} />
  }
  if (section === 'groups') {
    return <GroupsPanel query={query} creating={creating} onCreatingChange={onCreatingChange} />
  }
  return <UsersPanel query={query} creating={creating} onCreatingChange={onCreatingChange} />
}

function UsersPanel({
  query,
  creating,
  onCreatingChange,
}: {
  query: string
  creating: boolean
  onCreatingChange: (open: boolean) => void
}) {
  const { users, roles, upsertUser, removeUser } = useAdmin()
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<AdminUser | null>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return users.filter((user) => {
      if (!needle) return true
      return `${fullName(user)} ${user.email} ${roleName(user.roleId, roles)}`.toLowerCase().includes(needle)
    })
  }, [users, roles, query])

  useEffect(() => setPage(1), [query])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-canvas shadow-card">
      <div className="db-scroll min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[52rem] border-collapse text-sm">
          <thead>
            <tr>
              <th className={headClass}>User</th>
              <th className={headClass}>Email</th>
              <th className={headClass}>Role</th>
              <th className={headClass}>Last login</th>
              <th className={headClass}>Status</th>
              <th className={`${headClass} text-right`}>Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((user) => (
              <tr key={user.id} className={rowClass}>
                <td className={`${cellClass} font-sans font-medium text-ink`}>{fullName(user)}</td>
                <td className={`${cellClass} text-muted`}>{user.email}</td>
                <td className={cellClass}>
                  <KindBadge label={roleName(user.roleId, roles)} />
                </td>
                <td className={`${cellClass} whitespace-nowrap font-mono text-xs text-ink`}>{user.lastLogin}</td>
                <td className={cellClass}>
                  <StatusBadge tone={user.status === 'active' ? 'success' : 'neutral'} label={user.status === 'active' ? 'Active' : 'Inactive'} />
                </td>
                <td className={`${cellClass} text-right`}>
                  <div className="flex justify-end gap-3">
                    <button type="button" className={ghostButton} onClick={() => setEditing(user)}>
                      Edit
                    </button>
                    {user.status === 'active' && user.id !== 'u-alex' ? (
                      <button type="button" className={dangerButton} onClick={() => removeUser(user.id)}>
                        Deactivate
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <EmptyState icon={<AdminIcon />} title="No users" description="Try a different search, or create a user." />
        ) : null}
      </div>
      <PageBar page={safePage} pageCount={pageCount} countLabel={`${filtered.length} users`} onPage={setPage} />

      {creating || editing ? (
        <UserModal
          user={creating ? null : editing}
          roles={roles}
          onClose={() => {
            onCreatingChange(false)
            setEditing(null)
          }}
          onSave={(user) => {
            upsertUser(user)
            onCreatingChange(false)
            setEditing(null)
          }}
        />
      ) : null}
    </div>
  )
}

function UserModal({
  user,
  roles,
  onClose,
  onSave,
}: {
  user: AdminUser | null
  roles: Role[]
  onClose: () => void
  onSave: (user: AdminUser) => void
}) {
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState(user?.roleId ?? roles[0]?.id ?? '')
  const [status, setStatus] = useState(user?.status ?? 'active')
  const canSave = firstName.trim() && lastName.trim() && email.trim() && roleId && (user || password.length >= 8)

  return (
    <Modal
      title={user ? 'Edit user' : 'New user'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryButton}
            disabled={!canSave}
            onClick={() =>
              onSave({
                id: user?.id ?? newAdminId('u'),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                roleId,
                lastLogin: user?.lastLogin ?? '—',
                status,
              })
            }
          >
            {user ? 'Save user' : 'Create user'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" required>
          <input value={firstName} onChange={(event) => setFirstName(event.target.value)} className={fieldClass} />
        </Field>
        <Field label="Last name" required>
          <input value={lastName} onChange={(event) => setLastName(event.target.value)} className={fieldClass} />
        </Field>
      </div>
      <Field label="Email" required>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} />
      </Field>
      <Field label="Password" required={!user}>
        <input
          type="password"
          value={password}
          placeholder={user ? 'Leave blank to keep current' : 'At least 8 characters'}
          onChange={(event) => setPassword(event.target.value)}
          className={fieldClass}
        />
      </Field>
      <Field label="Role" required>
        <select value={roleId} onChange={(event) => setRoleId(event.target.value)} className={fieldClass}>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </Field>
      {user ? (
        <div className="flex items-center justify-between rounded-md border border-line px-3 py-2.5">
          <span className="font-sans text-sm text-ink">Active</span>
          <SwitchControl checked={status === 'active'} onChange={(on) => setStatus(on ? 'active' : 'inactive')} />
        </div>
      ) : null}
      </div>
    </Modal>
  )
}

function RolesPanel({
  query,
  creating,
  onCreatingChange,
}: {
  query: string
  creating: boolean
  onCreatingChange: (open: boolean) => void
}) {
  const { roles, upsertRole } = useAdmin()
  const [selectedId, setSelectedId] = useState(roles[0]?.id ?? '')
  const [draft, setDraft] = useState<Role | null>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return roles.filter((role) => !needle || `${role.name} ${role.description}`.toLowerCase().includes(needle))
  }, [roles, query])

  const selected = roles.find((role) => role.id === selectedId) ?? filtered[0] ?? null
  const working = draft && draft.id === selected?.id ? draft : selected
  const dirty = Boolean(draft && selected && JSON.stringify(draft.permissions) !== JSON.stringify(selected.permissions))

  useEffect(() => {
    setDraft(null)
  }, [selectedId])

  function updatePerm(moduleId: string, action: PermissionAction, value: boolean) {
    if (!working) return
    const next: Role = {
      ...working,
      permissions: {
        ...working.permissions,
        [moduleId]: { ...working.permissions[moduleId], [action]: value },
      },
    }
    setDraft(next)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
      <aside className="flex min-h-64 shrink-0 flex-col overflow-hidden rounded-lg border border-line bg-canvas shadow-card lg:w-[300px]">
        <div className="border-b border-line px-4 py-3">
          <h2 className="font-sans text-sm font-semibold text-ink">Roles</h2>
          <p className="mt-0.5 text-xs text-muted">{filtered.length} roles</p>
        </div>
        <ul className="db-scroll min-h-0 flex-1 overflow-auto p-2">
          {filtered.map((role) => {
            const on = selected?.id === role.id
            return (
              <li key={role.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(role.id)}
                  className={`flex w-full flex-col rounded-md px-3 py-2.5 text-left transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                    on ? 'bg-secondary-fixed' : 'hover:bg-surface'
                  }`}
                >
                  <span className="font-sans text-sm font-medium text-ink">{role.name}</span>
                  <span className="mt-0.5 line-clamp-2 text-xs text-muted">{role.description}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      <section className="flex min-h-80 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-canvas shadow-card">
        {working ? (
          <>
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-6 py-4">
              <div>
                <h2 className="font-sans text-base font-semibold tracking-[-0.02em] text-ink">{working.name}</h2>
                <p className="mt-1 text-sm text-muted">{working.description}</p>
              </div>
              <button
                type="button"
                className={primaryButton}
                disabled={!dirty}
                onClick={() => {
                  upsertRole(working)
                  setDraft(null)
                }}
              >
                Save permissions
              </button>
            </header>
            <div className="db-scroll min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[44rem] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className={headClass}>Module</th>
                    {crudActions.map((action) => (
                      <th key={action} className={`${headClass} text-center`}>
                        {crudLabel(action)}
                      </th>
                    ))}
                    {extraActions.map((action) => (
                      <th key={action} className={`${headClass} text-center`}>
                        {extraLabel(action)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissionModules.map((module) => {
                    const perms: ModulePermissions = working.permissions[module.id] ?? {}
                    return (
                      <tr key={module.id} className={rowClass}>
                        <td className={`${cellClass} font-sans font-medium text-ink`}>{module.label}</td>
                        {crudActions.map((action) => (
                          <td key={action} className={`${cellClass} text-center`}>
                            <PermCheck
                              checked={Boolean(perms[action])}
                              label={`${crudLabel(action)} ${module.label}`}
                              onChange={(value) => updatePerm(module.id, action, value)}
                            />
                          </td>
                        ))}
                        {extraActions.map((action) => (
                          <td key={action} className={`${cellClass} text-center`}>
                            {module.extras?.includes(action as ExtraAction) ? (
                              <PermCheck
                                checked={Boolean(perms[action])}
                                label={`${extraLabel(action as ExtraAction)} ${module.label}`}
                                onChange={(value) => updatePerm(module.id, action, value)}
                              />
                            ) : (
                              <span className="text-outline">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <EmptyState icon={<AdminIcon />} title="No roles" description="Create a role to define module access." />
        )}
      </section>

      {creating ? (
        <RoleModal
          roles={roles}
          onClose={() => onCreatingChange(false)}
          onSave={(role) => {
            upsertRole(role)
            setSelectedId(role.id)
            onCreatingChange(false)
          }}
        />
      ) : null}
    </div>
  )
}

function PermCheck({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (value: boolean) => void
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      aria-label={label}
      onChange={(event) => onChange(event.target.checked)}
      className="size-4 rounded-[2px] border-line text-indigo accent-indigo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
    />
  )
}

function RoleModal({
  roles,
  onClose,
  onSave,
}: {
  roles: Role[]
  onClose: () => void
  onSave: (role: Role) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [cloneId, setCloneId] = useState('')

  return (
    <Modal
      title="New role"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryButton}
            disabled={!name.trim()}
            onClick={() => {
              const clone = roles.find((role) => role.id === cloneId)
              onSave({
                id: newAdminId('role'),
                name: name.trim(),
                description: description.trim() || 'Custom role',
                permissions: clone ? structuredClone(clone.permissions) : emptyPermissions(),
              })
            }}
          >
            Create role
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
      <Field label="Role name" required>
        <input value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
      </Field>
      <Field label="Description">
        <input value={description} onChange={(event) => setDescription(event.target.value)} className={fieldClass} />
      </Field>
      <Field label="Copy permissions from">
        <select value={cloneId} onChange={(event) => setCloneId(event.target.value)} className={fieldClass}>
          <option value="">Empty (read none)</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </Field>
      </div>
    </Modal>
  )
}

function GroupsPanel({
  query,
  creating,
  onCreatingChange,
}: {
  query: string
  creating: boolean
  onCreatingChange: (open: boolean) => void
}) {
  const { loginGroups, roles, upsertGroup, removeGroup } = useAdmin()
  const [editing, setEditing] = useState<LoginGroup | null>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return loginGroups.filter((group) => {
      if (!needle) return true
      const hay = `${group.name} ${roleName(group.roleId, roles)} ${group.projectIds.map(projectLabel).join(' ')}`
      return hay.toLowerCase().includes(needle)
    })
  }, [loginGroups, roles, query])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-canvas shadow-card">
      <div className="db-scroll min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[48rem] border-collapse text-sm">
          <thead>
            <tr>
              <th className={headClass}>Login group</th>
              <th className={headClass}>Role</th>
              <th className={headClass}>Projects</th>
              <th className={`${headClass} text-right`}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((group) => (
              <tr key={group.id} className={rowClass}>
                <td className={`${cellClass} font-sans font-medium text-ink`}>{group.name}</td>
                <td className={cellClass}>
                  <KindBadge label={roleName(group.roleId, roles)} />
                </td>
                <td className={cellClass}>
                  <span className="flex flex-wrap gap-1.5">
                    {group.projectIds.map((id) => (
                      <KindBadge key={id} label={projectLabel(id)} />
                    ))}
                  </span>
                </td>
                <td className={`${cellClass} text-right`}>
                  <div className="flex justify-end gap-3">
                    <button type="button" className={ghostButton} onClick={() => setEditing(group)}>
                      Edit
                    </button>
                    <button type="button" className={dangerButton} onClick={() => removeGroup(group.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <EmptyState icon={<AdminIcon />} title="No login groups" description="Map a role to the projects it may enter." />
        ) : null}
      </div>

      {creating || editing ? (
        <GroupModal
          group={creating ? null : editing}
          roles={roles}
          onClose={() => {
            onCreatingChange(false)
            setEditing(null)
          }}
          onSave={(group) => {
            upsertGroup(group)
            onCreatingChange(false)
            setEditing(null)
          }}
        />
      ) : null}
    </div>
  )
}

function GroupModal({
  group,
  roles,
  onClose,
  onSave,
}: {
  group: LoginGroup | null
  roles: Role[]
  onClose: () => void
  onSave: (group: LoginGroup) => void
}) {
  const [name, setName] = useState(group?.name ?? '')
  const [roleId, setRoleId] = useState(group?.roleId ?? roles[0]?.id ?? '')
  const [projectIds, setProjectIds] = useState<string[]>(group?.projectIds ?? [])

  return (
    <Modal
      title={group ? 'Edit login group' : 'New login group'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryButton}
            disabled={!name.trim() || !roleId || projectIds.length === 0}
            onClick={() =>
              onSave({
                id: group?.id ?? newAdminId('lg'),
                name: name.trim(),
                roleId,
                projectIds,
              })
            }
          >
            {group ? 'Save group' : 'Create group'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
      <Field label="Group name" required>
        <input value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
      </Field>
      <Field label="Role" required>
        <select value={roleId} onChange={(event) => setRoleId(event.target.value)} className={fieldClass}>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Projects" required>
        <ProjectChecks selected={projectIds} onChange={setProjectIds} />
      </Field>
      </div>
    </Modal>
  )
}

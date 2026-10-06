import { createContext, createElement, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  apiTokens as seedTokens,
  applicationSettingValues as seedAppSettings,
  auditEvents as seedAudit,
  currentActor,
  currentActorIp,
  formatNow,
  fullName,
  loginGroups as seedGroups,
  mcpToken as seedMcp,
  newAdminId,
  projectLabel,
  projectSettingValues as seedProjectSettings,
  reports as seedReports,
  roles as seedRoles,
  tokenPrefix,
  users as seedUsers,
  type AdminUser,
  type ApiToken,
  type AuditEvent,
  type AuditKind,
  type LoginGroup,
  type McpToken,
  type Report,
  type Role,
} from '../data/admin.ts'

type AdminContextValue = {
  users: AdminUser[]
  roles: Role[]
  loginGroups: LoginGroup[]
  tokens: ApiToken[]
  mcp: McpToken
  reports: Report[]
  applicationValues: Record<string, string>
  projectValues: Record<string, Record<string, string>>
  audit: AuditEvent[]
  upsertUser: (user: AdminUser, action?: string) => void
  removeUser: (id: string) => void
  upsertRole: (role: Role) => void
  upsertGroup: (group: LoginGroup) => void
  removeGroup: (id: string) => void
  addToken: (token: ApiToken) => void
  revokeToken: (id: string) => void
  rotateMcp: (prefix: string) => void
  upsertReport: (report: Report) => void
  removeReport: (id: string) => void
  saveApplicationSettings: (values: Record<string, string>) => void
  saveProjectSettings: (projectId: string, values: Record<string, string>) => void
}

const AdminContext = createContext<AdminContextValue | null>(null)

function nextAudit(action: string, target: string, kind: AuditKind = 'application'): AuditEvent {
  const atMs = Date.now()
  return {
    id: newAdminId('aud'),
    kind,
    atMs,
    at: formatNow(new Date(atMs)),
    actor: currentActor,
    action,
    target,
    ip: currentActorIp,
  }
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AdminUser[]>(() => seedUsers)
  const [roles, setRoles] = useState<Role[]>(() => seedRoles.map((role) => ({ ...role, permissions: structuredClone(role.permissions) })))
  const [loginGroups, setLoginGroups] = useState<LoginGroup[]>(() => seedGroups.map((group) => ({ ...group, projectIds: [...group.projectIds] })))
  const [tokens, setTokens] = useState<ApiToken[]>(() => seedTokens)
  const [mcp, setMcp] = useState<McpToken>(() => seedMcp)
  const [reports, setReports] = useState<Report[]>(() => seedReports.map((report) => ({ ...report, projectIds: [...report.projectIds] })))
  const [applicationValues, setApplicationValues] = useState<Record<string, string>>(() => ({ ...seedAppSettings }))
  const [projectValues, setProjectValues] = useState<Record<string, Record<string, string>>>(() =>
    Object.fromEntries(Object.entries(seedProjectSettings).map(([id, values]) => [id, { ...values }])),
  )
  const [audit, setAudit] = useState<AuditEvent[]>(() => seedAudit)
  const usersRef = useRef(users)
  const rolesRef = useRef(roles)
  const groupsRef = useRef(loginGroups)
  const tokensRef = useRef(tokens)
  const reportsRef = useRef(reports)
  usersRef.current = users
  rolesRef.current = roles
  groupsRef.current = loginGroups
  tokensRef.current = tokens
  reportsRef.current = reports

  const record = useCallback((action: string, target: string, kind: AuditKind = 'application') => {
    setAudit((current) => [nextAudit(action, target, kind), ...current])
  }, [])

  const upsertUser = useCallback((user: AdminUser, action?: string) => {
    const exists = usersRef.current.some((item) => item.id === user.id)
    setUsers((current) => (exists ? current.map((item) => (item.id === user.id ? user : item)) : [user, ...current]))
    record(action ?? (exists ? 'Updated user' : 'Created user'), fullName(user))
  }, [record])

  const removeUser = useCallback((id: string) => {
    const user = usersRef.current.find((item) => item.id === id)
    setUsers((current) => current.map((item) => (item.id === id ? { ...item, status: 'inactive' as const } : item)))
    if (user) record('Deactivated user', fullName(user))
  }, [record])

  const upsertRole = useCallback((role: Role) => {
    const exists = rolesRef.current.some((item) => item.id === role.id)
    setRoles((current) => (exists ? current.map((item) => (item.id === role.id ? role : item)) : [...current, role]))
    record(exists ? 'Updated role permissions' : 'Created role', role.name)
  }, [record])

  const upsertGroup = useCallback((group: LoginGroup) => {
    const exists = groupsRef.current.some((item) => item.id === group.id)
    setLoginGroups((current) => (exists ? current.map((item) => (item.id === group.id ? group : item)) : [group, ...current]))
    record(exists ? 'Updated login group' : 'Created login group', group.name)
  }, [record])

  const removeGroup = useCallback((id: string) => {
    const group = groupsRef.current.find((item) => item.id === id)
    setLoginGroups((current) => current.filter((item) => item.id !== id))
    if (group) record('Deleted login group', group.name)
  }, [record])

  const addToken = useCallback((token: ApiToken) => {
    setTokens((current) => [token, ...current])
    record('Generated API token', token.name)
  }, [record])

  const revokeToken = useCallback((id: string) => {
    const token = tokensRef.current.find((item) => item.id === id)
    setTokens((current) => current.filter((item) => item.id !== id))
    if (token) record('Revoked API token', token.name)
  }, [record])

  const rotateMcp = useCallback((prefix: string) => {
    setMcp({ prefix, lastRotated: formatNow() })
    record('Rotated MCP token', 'MCP')
  }, [record])

  const upsertReport = useCallback((report: Report) => {
    const exists = reportsRef.current.some((item) => item.id === report.id)
    setReports((current) => (exists ? current.map((item) => (item.id === report.id ? report : item)) : [report, ...current]))
    record(exists ? 'Updated report' : 'Published report', report.name)
  }, [record])

  const removeReport = useCallback((id: string) => {
    const report = reportsRef.current.find((item) => item.id === id)
    setReports((current) => current.filter((item) => item.id !== id))
    if (report) record('Deleted report', report.name)
  }, [record])

  const saveApplicationSettings = useCallback((values: Record<string, string>) => {
    setApplicationValues(values)
    record('Saved application settings', 'Application')
  }, [record])

  const saveProjectSettings = useCallback((projectId: string, values: Record<string, string>) => {
    setProjectValues((current) => ({ ...current, [projectId]: values }))
    record('Saved project settings', projectLabel(projectId))
  }, [record])

  const value = useMemo<AdminContextValue>(
    () => ({
      users,
      roles,
      loginGroups,
      tokens,
      mcp,
      reports,
      applicationValues,
      projectValues,
      audit,
      upsertUser,
      removeUser,
      upsertRole,
      upsertGroup,
      removeGroup,
      addToken,
      revokeToken,
      rotateMcp,
      upsertReport,
      removeReport,
      saveApplicationSettings,
      saveProjectSettings,
    }),
    [
      users,
      roles,
      loginGroups,
      tokens,
      mcp,
      reports,
      applicationValues,
      projectValues,
      audit,
      upsertUser,
      removeUser,
      upsertRole,
      upsertGroup,
      removeGroup,
      addToken,
      revokeToken,
      rotateMcp,
      upsertReport,
      removeReport,
      saveApplicationSettings,
      saveProjectSettings,
    ],
  )

  return createElement(AdminContext.Provider, { value }, children)
}

export function useAdmin() {
  const value = useContext(AdminContext)
  if (!value) throw new Error('useAdmin must be used within AdminProvider')
  return value
}

export { tokenPrefix }

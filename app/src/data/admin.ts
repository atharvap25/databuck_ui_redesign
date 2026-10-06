import { validationRuns } from './validations.ts'
import { workspaceProjects } from './workspaces.ts'

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'download' | 'approve' | 'clearQueue'
export type ExtraAction = 'download' | 'approve' | 'clearQueue'
export type UserStatus = 'active' | 'inactive'
export type SettingType = 'boolean' | 'number' | 'string' | 'secret' | 'enum' | 'url'
export type AuditKind = 'application' | 'login'
export type LogSource = 'validation' | 'catalina' | 'error'
export type SettingsScope = 'application' | 'project'

export const crudActions: PermissionAction[] = ['create', 'read', 'update', 'delete']
export const extraActions: ExtraAction[] = ['download', 'approve', 'clearQueue']

export type PermissionModule = {
  id: string
  label: string
  extras?: ExtraAction[]
}

export const permissionModules: PermissionModule[] = [
  { id: 'data-quality', label: 'Data Quality', extras: ['download', 'approve'] },
  { id: 'matching', label: 'Matching', extras: ['download', 'approve'] },
  { id: 'profiling', label: 'Data Profiling', extras: ['download'] },
  { id: 'observability', label: 'Observability', extras: ['download'] },
  { id: 'connections', label: 'Connections' },
  { id: 'templates', label: 'Templates' },
  { id: 'custom-rules', label: 'Custom Rules' },
  { id: 'jobs', label: 'Jobs', extras: ['clearQueue'] },
  { id: 'administration', label: 'Administration' },
  { id: 'global-filters', label: 'Global Filters' },
  { id: 'reports', label: 'Reports' },
]

export type ModulePermissions = Partial<Record<PermissionAction, boolean>>
export type RolePermissions = Record<string, ModulePermissions>

export type Role = {
  id: string
  name: string
  description: string
  permissions: RolePermissions
}

export type AdminUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  roleId: string
  lastLogin: string
  status: UserStatus
}

export type LoginGroup = {
  id: string
  name: string
  roleId: string
  projectIds: string[]
}

export type ApiToken = {
  id: string
  name: string
  createdBy: string
  createdAt: string
  lastUsed: string
  prefix: string
}

export type McpToken = {
  prefix: string
  lastRotated: string
}

export type Dashboard = {
  id: string
  name: string
  description: string
}

export type Report = {
  id: string
  name: string
  dashboardId: string
  projectIds: string[]
  lastPublished: string
}

export type SettingProperty = {
  id: string
  categoryId: string
  label: string
  hint: string
  type: SettingType
  defaultValue: string
  options?: string[]
}

export type SettingCategory = {
  id: string
  label: string
}

export type SettingCategoryGroup = {
  id: string
  label: string
  categories: SettingCategory[]
}

export type AuditEvent = {
  id: string
  kind: AuditKind
  at: string
  atMs: number
  actor: string
  action: string
  target: string
  ip: string
}

export const currentActor = 'Alex Rivera'
export const currentActorIp = '10.4.12.18'

export const settingGroups: SettingCategoryGroup[] = [
  {
    id: 'core',
    label: 'Core',
    categories: [
      { id: 'general', label: 'General' },
      { id: 'ai', label: 'AI Configuration' },
      { id: 'template', label: 'Template' },
      { id: 'recommending-rules', label: 'Recommending Rules' },
      { id: 'profiling', label: 'Profiling' },
      { id: 'validation-level', label: 'Validation Level' },
      { id: 'validation-job', label: 'Validation Job Level' },
      { id: 'exception-data', label: 'Exception Data' },
      { id: 'policy-document', label: 'Policy Document' },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    categories: [
      { id: 'url-security', label: 'URL Security' },
      { id: 'api', label: 'API' },
      { id: 'authentication', label: 'Authentication' },
      { id: 'active-directory', label: 'Active Directory' },
      { id: 'license-key', label: 'License Key' },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    categories: [
      { id: 'sns', label: 'SNS Notification' },
      { id: 'sqs', label: 'SQS Notification' },
      { id: 'smtp', label: 'SMTP Notification' },
      { id: 'file-monitor-notification', label: 'File Monitor Notification' },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    categories: [
      { id: 'jira', label: 'Jira Integration' },
      { id: 'alation', label: 'Alation Integration' },
      { id: 'slack', label: 'Slack Integration' },
      { id: 'servicenow', label: 'ServiceNow Integration' },
      { id: 'dataplex', label: 'Dataplex Integration' },
      { id: 'github', label: 'Github Integration' },
      { id: 'gitlab', label: 'GitLab Integration' },
    ],
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    categories: [
      { id: 'file-monitor', label: 'File Monitor' },
      { id: 'cluster', label: 'Cluster' },
      { id: 'mapr', label: 'Mapr' },
      { id: 'gcp', label: 'GCP' },
      { id: 'cdp', label: 'CDP' },
      { id: 'azure', label: 'Azure' },
      { id: 'databricks', label: 'Databricks' },
    ],
  },
]

type SeedProp = [string, string, string, SettingType, string, string[]?]

function props(categoryId: string, rows: SeedProp[]): SettingProperty[] {
  return rows.map(([id, label, hint, type, defaultValue, options]) => ({
    id: `${categoryId}.${id}`,
    categoryId,
    label,
    hint,
    type,
    defaultValue,
    options,
  }))
}

export const settingProperties: SettingProperty[] = [
  ...props('general', [
    ['app-name', 'Application name', 'Shown in the header and notification footers.', 'string', 'Databuck'],
    ['session-timeout', 'Session timeout (minutes)', 'Idle users are signed out after this interval.', 'number', '30'],
    ['date-format', 'Date format', 'Display format for run timestamps.', 'enum', 'DD MMM YYYY', ['DD MMM YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY']],
    ['telemetry', 'Product telemetry', 'Share anonymized usage to improve Databuck.', 'boolean', 'Y'],
    ['timezone', 'Default timezone', 'Fallback timezone for schedules and audit.', 'enum', 'UTC', ['UTC', 'America/New_York', 'America/Chicago', 'Europe/London', 'Asia/Kolkata']],
    ['ui-row-cap', 'UI row cap', 'Maximum rows rendered in result tables.', 'number', '500'],
  ]),
  ...props('ai', [
    ['enabled', 'Enable AI assistant', 'Allow the Data Trust Agent in this environment.', 'boolean', 'Y'],
    ['model', 'Model', 'Model used for rule recommendations and summaries.', 'enum', 'gpt-4o', ['gpt-4o', 'claude-sonnet', 'gemini-flash']],
    ['temperature', 'Temperature', 'Lower values keep recommendations conservative.', 'number', '0.2'],
    ['max-tokens', 'Max tokens', 'Cap on generated explanation length.', 'number', '2048'],
    ['table-context', 'Include table context', 'Send schema and recent scores with prompts.', 'boolean', 'Y'],
  ]),
  ...props('template', [
    ['default', 'Default DQ template', 'Applied when a new validation is created.', 'string', 'Standard'],
    ['auto-apply', 'Auto-apply on create', 'Attach the default template without a prompt.', 'boolean', 'Y'],
    ['version-lock', 'Lock template version', 'Prevent jobs from picking newer template revisions.', 'boolean', 'N'],
    ['max-per-project', 'Max templates per project', 'Hard cap to keep catalogs scannable.', 'number', '50'],
  ]),
  ...props('recommending-rules', [
    ['auto', 'Auto recommend', 'Suggest rules after profiling completes.', 'boolean', 'Y'],
    ['min-confidence', 'Minimum confidence', 'Hide suggestions below this score (0–1).', 'number', '0.8'],
    ['max-suggestions', 'Max suggestions', 'Cap recommendations shown per table.', 'number', '12'],
    ['statistical', 'Include statistical rules', 'Recommend distribution and drift checks.', 'boolean', 'Y'],
  ]),
  ...props('profiling', [
    ['sample-size', 'Sample size', 'Rows sampled for column statistics.', 'number', '100000'],
    ['histogram', 'Enable histograms', 'Compute value distribution buckets.', 'boolean', 'Y'],
    ['distinct-cap', 'Distinct count cap', 'Stop cardinality scans after this many values.', 'number', '10000'],
    ['on-register', 'Profile on register', 'Run a profile when a table is first connected.', 'boolean', 'Y'],
  ]),
  ...props('validation-level', [
    ['fail-threshold', 'Fail score threshold', 'Overall score at or below this is Failed.', 'number', '70'],
    ['warn-threshold', 'Warning score threshold', 'Scores below this are Watch.', 'number', '90'],
    ['stop-first', 'Stop on first fail', 'Abort remaining checks after a hard fail.', 'boolean', 'N'],
    ['metadata-checks', 'Include metadata checks', 'Validate schema, nullability, and types.', 'boolean', 'Y'],
  ]),
  ...props('validation-job', [
    ['max-parallel', 'Max parallel jobs', 'Concurrent validation workers on the cluster.', 'number', '4'],
    ['retry-count', 'Retry count', 'Automatic retries after a worker failure.', 'number', '2'],
    ['retry-delay', 'Retry delay (seconds)', 'Wait between retries.', 'number', '30'],
    ['timeout', 'Job timeout (minutes)', 'Kill a validation that exceeds this duration.', 'number', '60'],
    ['capture-failed', 'Capture failed records', 'Persist exception rows for download.', 'boolean', 'Y'],
  ]),
  ...props('exception-data', [
    ['retain-days', 'Retain exceptions (days)', 'Purge exception files after this many days.', 'number', '90'],
    ['max-export', 'Max export rows', 'Hard limit for exception CSV downloads.', 'number', '100000'],
    ['mask-pii', 'Mask PII', 'Redact identified PII columns in exports.', 'boolean', 'Y'],
    ['storage-path', 'Storage path', 'Object prefix for exception payloads.', 'string', 's3://databuck-exceptions/prod'],
  ]),
  ...props('policy-document', [
    ['require-approval', 'Require approval', 'Policy edits need a second approver.', 'boolean', 'Y'],
    ['retention-years', 'Retention (years)', 'How long signed policies are kept.', 'number', '7'],
    ['classification', 'Default classification', 'Label applied to new policy docs.', 'enum', 'Internal', ['Public', 'Internal', 'Confidential']],
    ['watermark', 'Watermark exports', 'Stamp downloads with user and time.', 'boolean', 'Y'],
  ]),
  ...props('url-security', [
    ['iframe', 'Allow iframe embed', 'Permit Databuck inside third-party frames.', 'boolean', 'N'],
    ['origins', 'Allowed origins', 'Comma-separated origins for embed and CORS.', 'string', 'https://app.databuck.io'],
    ['https', 'Enforce HTTPS', 'Redirect all HTTP traffic.', 'boolean', 'Y'],
    ['csrf', 'CSRF protection', 'Reject state changes without a valid token.', 'boolean', 'Y'],
  ]),
  ...props('api', [
    ['rate-limit', 'Rate limit (per minute)', 'Requests allowed per token each minute.', 'number', '120'],
    ['version', 'API version', 'Default version for generated clients.', 'enum', 'v2', ['v1', 'v2']],
    ['require-token', 'Require API token', 'Block anonymous API access.', 'boolean', 'Y'],
    ['cors', 'CORS origins', 'Origins allowed to call the REST API.', 'string', 'https://app.databuck.io'],
  ]),
  ...props('authentication', [
    ['sso', 'SSO enabled', 'Require identity provider login.', 'boolean', 'N'],
    ['mfa', 'MFA required', 'Prompt for a second factor at sign-in.', 'boolean', 'Y'],
    ['password-min', 'Password min length', 'Enforced on local accounts.', 'number', '12'],
    ['idle-minutes', 'Session idle (minutes)', 'Idle timeout independent of absolute session.', 'number', '20'],
  ]),
  ...props('active-directory', [
    ['enabled', 'Enable Active Directory', 'Sync users and groups from AD.', 'boolean', 'N'],
    ['domain', 'Domain', 'AD domain used for binds.', 'string', 'corp.acme.local'],
    ['bind-dn', 'Bind DN', 'Service account distinguished name.', 'string', 'CN=Databuck,OU=Services,DC=corp,DC=acme,DC=local'],
    ['sync-hours', 'Sync interval (hours)', 'How often group membership is refreshed.', 'number', '6'],
  ]),
  ...props('license-key', [
    ['key', 'License key', 'Enterprise entitlement token.', 'secret', 'DBK-ENT-7F3A-91C2-44BE'],
    ['seats', 'Seats', 'Named-user allotment.', 'number', '25'],
    ['expires', 'Expires', 'License end date.', 'string', '2027-03-31'],
    ['edition', 'Edition', 'Feature pack unlocked by this key.', 'enum', 'Enterprise', ['Team', 'Enterprise']],
  ]),
  ...props('sns', [
    ['enabled', 'Enable SNS', 'Publish job events to AWS SNS.', 'boolean', 'N'],
    ['topic', 'Topic ARN', 'Destination topic for notifications.', 'string', 'arn:aws:sns:us-east-1:000000000000:databuck-dq'],
    ['region', 'Region', 'AWS region of the topic.', 'enum', 'us-east-1', ['us-east-1', 'us-west-2', 'eu-west-1']],
    ['subject-prefix', 'Subject prefix', 'Prepended to SNS subjects.', 'string', '[Databuck]'],
  ]),
  ...props('sqs', [
    ['enabled', 'Enable SQS', 'Enqueue job events for downstream consumers.', 'boolean', 'N'],
    ['queue-url', 'Queue URL', 'SQS queue that receives job payloads.', 'url', 'https://sqs.us-east-1.amazonaws.com/000000000000/databuck-dq'],
    ['visibility', 'Visibility timeout (seconds)', 'How long a received message stays hidden.', 'number', '30'],
    ['region', 'Region', 'AWS region of the queue.', 'enum', 'us-east-1', ['us-east-1', 'us-west-2', 'eu-west-1']],
  ]),
  ...props('smtp', [
    ['enabled', 'Enable SMTP', 'Send email for failures and digests.', 'boolean', 'Y'],
    ['host', 'Host', 'SMTP relay hostname.', 'string', 'smtp.databuck.internal'],
    ['port', 'Port', 'SMTP port.', 'number', '587'],
    ['from', 'From address', 'Envelope sender for notifications.', 'string', 'alerts@databuck.io'],
    ['tls', 'Use TLS', 'Wrap the SMTP session in TLS.', 'boolean', 'Y'],
  ]),
  ...props('file-monitor-notification', [
    ['enabled', 'Enable notifications', 'Alert when a watched file arrives or stalls.', 'boolean', 'Y'],
    ['channel', 'Channel', 'Where file-monitor events are sent.', 'enum', 'email', ['email', 'slack', 'both']],
    ['digest', 'Digest cadence', 'Roll up quiet periods into a digest.', 'enum', 'hourly', ['immediate', 'hourly', 'daily']],
    ['stall-minutes', 'Stall threshold (minutes)', 'Alert if an expected file is late.', 'number', '45'],
  ]),
  ...props('jira', [
    ['enabled', 'Enable Jira', 'Open issues from failed validations.', 'boolean', 'N'],
    ['site', 'Site URL', 'Jira Cloud or Server base URL.', 'url', 'https://acme.atlassian.net'],
    ['project-key', 'Project key', 'Issues are created in this project.', 'string', 'DQ'],
    ['issue-type', 'Issue type', 'Type used for auto-created tickets.', 'string', 'Bug'],
    ['auto-create', 'Auto-create on fail', 'Open a ticket when a job fails.', 'boolean', 'N'],
  ]),
  ...props('alation', [
    ['enabled', 'Enable Alation', 'Push quality scores to the catalog.', 'boolean', 'N'],
    ['base-url', 'Base URL', 'Alation instance URL.', 'url', 'https://alation.acme.internal'],
    ['sync-scores', 'Sync quality scores', 'Write Databuck scores onto table pages.', 'boolean', 'Y'],
    ['api-version', 'API version', 'Alation REST version.', 'enum', 'v2', ['v1', 'v2']],
  ]),
  ...props('slack', [
    ['enabled', 'Enable Slack', 'Post job outcomes to Slack.', 'boolean', 'Y'],
    ['webhook', 'Webhook URL', 'Incoming webhook for the default channel.', 'secret', 'https://hooks.slack.com/services/T000/B000/XXXX'],
    ['channel', 'Default channel', 'Fallback channel when a project has none.', 'string', '#data-quality'],
    ['notify-fail', 'Notify on fail', 'Always post when a job fails.', 'boolean', 'Y'],
  ]),
  ...props('servicenow', [
    ['enabled', 'Enable ServiceNow', 'Open incidents from failed jobs.', 'boolean', 'N'],
    ['instance', 'Instance URL', 'ServiceNow instance.', 'url', 'https://acme.service-now.com'],
    ['table', 'Table', 'Target table for created records.', 'string', 'incident'],
    ['assignment', 'Assignment group', 'Group that owns new incidents.', 'string', 'Data Quality'],
  ]),
  ...props('dataplex', [
    ['enabled', 'Enable Dataplex', 'Publish quality aspects to Dataplex.', 'boolean', 'N'],
    ['project-id', 'GCP project ID', 'Project that owns the lake.', 'string', 'acme-analytics'],
    ['location', 'Location', 'Dataplex region.', 'enum', 'us-central1', ['us-central1', 'us-east1', 'europe-west1']],
    ['lake-id', 'Lake ID', 'Dataplex lake identifier.', 'string', 'enterprise-lake'],
  ]),
  ...props('github', [
    ['enabled', 'Enable GitHub', 'Sync rule packs with a GitHub repo.', 'boolean', 'N'],
    ['org', 'Organization', 'GitHub org that owns the rules repo.', 'string', 'acme-corp'],
    ['repo', 'Repository', 'Rules repository name.', 'string', 'databuck-rules'],
    ['branch', 'Branch', 'Branch used for pulls and PRs.', 'string', 'main'],
    ['token', 'Access token', 'Fine-grained PAT for the rules repo.', 'secret', 'ghp_****************'],
  ]),
  ...props('gitlab', [
    ['enabled', 'Enable GitLab', 'Sync rule packs with GitLab.', 'boolean', 'N'],
    ['host', 'Host', 'GitLab base URL.', 'url', 'https://gitlab.acme.internal'],
    ['project-id', 'Project ID', 'Numeric GitLab project id.', 'string', '4821'],
    ['branch', 'Branch', 'Branch used for sync.', 'string', 'main'],
  ]),
  ...props('file-monitor', [
    ['enabled', 'Enable file monitor', 'Watch landing zones for arriving files.', 'boolean', 'Y'],
    ['poll', 'Poll interval (seconds)', 'How often directories are scanned.', 'number', '60'],
    ['max-mb', 'Max file size (MB)', 'Skip files larger than this.', 'number', '512'],
    ['recursive', 'Recursive watch', 'Include nested folders.', 'boolean', 'Y'],
  ]),
  ...props('cluster', [
    ['mode', 'Cluster mode', 'Run jobs on the Spark cluster.', 'boolean', 'Y'],
    ['workers', 'Worker count', 'Spark worker nodes.', 'number', '8'],
    ['driver-memory', 'Driver memory', 'Driver heap allocation.', 'string', '8g'],
    ['max-executors', 'Max executors', 'Upper bound for dynamic allocation.', 'number', '16'],
  ]),
  ...props('mapr', [
    ['enabled', 'Enable MapR', 'Use MapR as a Hadoop distribution.', 'boolean', 'N'],
    ['cluster-name', 'Cluster name', 'MapR cluster identifier.', 'string', 'mapr-prod'],
    ['cldb', 'CLDB hosts', 'Comma-separated CLDB hostnames.', 'string', 'cldb1.mapr.local,cldb2.mapr.local'],
    ['ticket', 'Ticket path', 'Path to the MapR ticket file.', 'string', '/opt/mapr/conf/mapruserticket'],
  ]),
  ...props('gcp', [
    ['project-id', 'Project ID', 'GCP project for jobs and Dataplex.', 'string', 'acme-analytics'],
    ['region', 'Region', 'Default GCP region.', 'enum', 'us-central1', ['us-central1', 'us-east1', 'europe-west1']],
    ['service-account', 'Service account key', 'JSON key used when ADC is off.', 'secret', '-----BEGIN PRIVATE KEY-----'],
    ['adc', 'Use ADC', 'Prefer application default credentials.', 'boolean', 'Y'],
  ]),
  ...props('cdp', [
    ['enabled', 'Enable CDP', 'Run jobs on Cloudera Data Platform.', 'boolean', 'N'],
    ['environment', 'Environment', 'CDP environment name.', 'string', 'prod-cdp'],
    ['ranger-url', 'Ranger URL', 'Ranger admin endpoint.', 'url', 'https://ranger.cdp.acme.internal'],
    ['kerberos', 'Kerberos', 'Authenticate Spark jobs with Kerberos.', 'boolean', 'Y'],
  ]),
  ...props('azure', [
    ['subscription', 'Subscription ID', 'Azure subscription for Databricks and storage.', 'string', '00000000-0000-0000-0000-000000000000'],
    ['resource-group', 'Resource group', 'Default resource group.', 'string', 'rg-databuck-prod'],
    ['region', 'Region', 'Azure region.', 'enum', 'eastus', ['eastus', 'westus2', 'westeurope']],
    ['tenant', 'Tenant ID', 'Entra ID tenant.', 'string', '11111111-1111-1111-1111-111111111111'],
  ]),
  ...props('databricks', [
    ['workspace', 'Workspace URL', 'Databricks workspace used for jobs.', 'url', 'https://adb-1234567890123456.7.azuredatabricks.net'],
    ['cluster-id', 'Cluster ID', 'Interactive or job cluster.', 'string', '1001-092233-beam123'],
    ['token', 'Access token', 'PAT used by the Databuck worker.', 'secret', 'dapi****************'],
    ['catalog', 'Unity Catalog', 'Default catalog for reads.', 'string', 'main'],
  ]),
]

function emptyPerms(): RolePermissions {
  const next: RolePermissions = {}
  for (const module of permissionModules) {
    const row: ModulePermissions = { create: false, read: false, update: false, delete: false }
    for (const extra of module.extras ?? []) row[extra] = false
    next[module.id] = row
  }
  return next
}

function fillPerms(value: boolean, readOnly = false): RolePermissions {
  const next = emptyPerms()
  for (const module of permissionModules) {
    const row = next[module.id]
    row.read = true
    if (readOnly) continue
    row.create = value
    row.update = value
    row.delete = value
    for (const extra of module.extras ?? []) row[extra] = value
  }
  return next
}

function patchPerms(base: RolePermissions, updates: RolePermissions): RolePermissions {
  const next = structuredClone(base)
  for (const [moduleId, row] of Object.entries(updates)) {
    next[moduleId] = { ...next[moduleId], ...row }
  }
  return next
}

export const roles: Role[] = [
  {
    id: 'super-admin',
    name: 'Super Admin',
    description: 'Full platform access including administration, tokens, and settings.',
    permissions: fillPerms(true),
  },
  {
    id: 'data-steward',
    name: 'Data Steward',
    description: 'Owns quality, matching, and jobs. Can approve results and manage reports.',
    permissions: patchPerms(fillPerms(true), {
      administration: { create: false, delete: false },
    }),
  },
  {
    id: 'analyst',
    name: 'Analyst',
    description: 'Runs validations and matching, downloads results, cannot change access.',
    permissions: patchPerms(fillPerms(false), {
      'data-quality': { create: true, read: true, update: true, delete: false, download: true, approve: false },
      matching: { create: true, read: true, update: true, delete: false, download: true, approve: false },
      profiling: { create: true, read: true, update: true, download: true },
      observability: { read: true, download: true },
      connections: { read: true },
      templates: { read: true },
      'custom-rules': { create: true, read: true, update: true },
      jobs: { create: true, read: true, update: true, clearQueue: false },
      reports: { read: true },
      'global-filters': { read: true, update: true },
    }),
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to quality, matching, observability, and reports.',
    permissions: fillPerms(false, true),
  },
]

export const users: AdminUser[] = [
  { id: 'u-alex', firstName: 'Alex', lastName: 'Rivera', email: 'alex@databuck.app', roleId: 'data-steward', lastLogin: '6 Oct 2026, 7:12 PM', status: 'active' },
  { id: 'u-priya', firstName: 'Priya', lastName: 'Shah', email: 'priya.shah@acme.io', roleId: 'super-admin', lastLogin: '6 Oct 2026, 4:03 PM', status: 'active' },
  { id: 'u-marcus', firstName: 'Marcus', lastName: 'Chen', email: 'marcus.chen@acme.io', roleId: 'analyst', lastLogin: '5 Oct 2026, 11:41 AM', status: 'active' },
  { id: 'u-jordan', firstName: 'Jordan', lastName: 'Blake', email: 'jordan.blake@harbor.io', roleId: 'viewer', lastLogin: '3 Oct 2026, 9:18 AM', status: 'active' },
  { id: 'u-sam', firstName: 'Sam', lastName: 'Okonkwo', email: 'sam.okonkwo@meridian.health', roleId: 'data-steward', lastLogin: '28 Sep 2026, 6:22 PM', status: 'inactive' },
]

export const loginGroups: LoginGroup[] = [
  { id: 'lg-admins', name: 'Global Admins', roleId: 'super-admin', projectIds: ['production', 'claims-desk', 'catalog-hub'] },
  { id: 'lg-stewards', name: 'Production Stewards', roleId: 'data-steward', projectIds: ['production'] },
  { id: 'lg-claims', name: 'Claims Analysts', roleId: 'analyst', projectIds: ['claims-desk'] },
  { id: 'lg-catalog', name: 'Catalog Viewers', roleId: 'viewer', projectIds: ['catalog-hub'] },
]

export const apiTokens: ApiToken[] = [
  { id: 'tok-ci', name: 'CI quality runner', createdBy: 'Priya Shah', createdAt: '12 Sep 2026', lastUsed: '6 Oct 2026, 6:40 PM', prefix: 'dbk_live_9c2a' },
  { id: 'tok-match', name: 'Matching API', createdBy: 'Alex Rivera', createdAt: '22 Aug 2026', lastUsed: '5 Oct 2026, 1:14 PM', prefix: 'dbk_live_b71e' },
  { id: 'tok-obs', name: 'Observability export', createdBy: 'Marcus Chen', createdAt: '4 Jul 2026', lastUsed: '1 Oct 2026, 8:02 AM', prefix: 'dbk_live_e04f' },
]

export const mcpToken: McpToken = {
  prefix: 'dbk_mcp_7f3a',
  lastRotated: '18 Sep 2026',
}

export const dashboards: Dashboard[] = [
  { id: 'dash-dq', name: 'DQ Overview', description: 'Score trends, failed checks, and run volume.' },
  { id: 'dash-drift', name: 'Schema Drift', description: 'Column adds, drops, and type changes by source.' },
  { id: 'dash-match', name: 'Matching Outcomes', description: 'Match rates, unresolved pairs, and steward queues.' },
  { id: 'dash-exceptions', name: 'Exception Heatmap', description: 'Failed records by rule, table, and day.' },
  { id: 'dash-profile', name: 'Profiling Coverage', description: 'Profiled columns, freshness, and sample health.' },
]

export const reports: Report[] = [
  { id: 'rpt-weekly', name: 'Weekly Quality Board', dashboardId: 'dash-dq', projectIds: ['production'], lastPublished: '6 Oct 2026' },
  { id: 'rpt-claims', name: 'Claims Exception Watch', dashboardId: 'dash-exceptions', projectIds: ['claims-desk'], lastPublished: '5 Oct 2026' },
  { id: 'rpt-catalog', name: 'Catalog Drift Digest', dashboardId: 'dash-drift', projectIds: ['catalog-hub'], lastPublished: '2 Oct 2026' },
  { id: 'rpt-match', name: 'Matching Stewardship', dashboardId: 'dash-match', projectIds: ['production', 'claims-desk'], lastPublished: '29 Sep 2026' },
]

function stamp(atMs: number) {
  return new Date(atMs).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).replace(' am', ' AM').replace(' pm', ' PM')
}

const auditSeedMs = Date.parse('2026-10-06T12:00:00+05:30')

const auditSeed: Omit<AuditEvent, 'at'>[] = [
  { id: 'aud-1', kind: 'application', atMs: auditSeedMs + 18_600_000, actor: 'Alex Rivera', action: 'Saved application settings', target: 'Slack Integration', ip: '10.4.12.18' },
  { id: 'aud-2', kind: 'login', atMs: auditSeedMs + 18_000_000, actor: 'Alex Rivera', action: 'Signed in', target: 'Layout 1', ip: '10.4.12.18' },
  { id: 'aud-3', kind: 'application', atMs: auditSeedMs + 14_400_000, actor: 'Priya Shah', action: 'Generated API token', target: 'CI quality runner', ip: '10.2.8.41' },
  { id: 'aud-4', kind: 'application', atMs: auditSeedMs + 10_800_000, actor: 'Priya Shah', action: 'Updated role permissions', target: 'Data Steward', ip: '10.2.8.41' },
  { id: 'aud-5', kind: 'login', atMs: auditSeedMs + 9_000_000, actor: 'Priya Shah', action: 'Signed in', target: 'Layout 2', ip: '10.2.8.41' },
  { id: 'aud-6', kind: 'application', atMs: auditSeedMs - 3_600_000, actor: 'Marcus Chen', action: 'Published report', target: 'Claims Exception Watch', ip: '10.9.21.7' },
  { id: 'aud-7', kind: 'application', atMs: auditSeedMs - 7_200_000, actor: 'Alex Rivera', action: 'Updated login group', target: 'Production Stewards', ip: '10.4.12.18' },
  { id: 'aud-8', kind: 'login', atMs: auditSeedMs - 86_400_000, actor: 'Marcus Chen', action: 'Signed out', target: 'Session timeout', ip: '10.9.21.7' },
  { id: 'aud-9', kind: 'login', atMs: auditSeedMs - 90_000_000, actor: 'Marcus Chen', action: 'Signed in', target: 'Layout 1', ip: '10.9.21.7' },
  { id: 'aud-10', kind: 'application', atMs: auditSeedMs - 172_800_000, actor: 'Priya Shah', action: 'Rotated MCP token', target: 'MCP', ip: '10.2.8.41' },
  { id: 'aud-11', kind: 'login', atMs: auditSeedMs - 259_200_000, actor: 'Jordan Blake', action: 'Signed in', target: 'Layout 2', ip: '10.14.3.22' },
  { id: 'aud-12', kind: 'application', atMs: auditSeedMs - 345_600_000, actor: 'Alex Rivera', action: 'Created user', target: 'Jordan Blake', ip: '10.4.12.18' },
  { id: 'aud-13', kind: 'login', atMs: auditSeedMs - 432_000_000, actor: 'Sam Okonkwo', action: 'Signed out', target: 'Manual', ip: '10.18.6.9' },
  { id: 'aud-14', kind: 'application', atMs: auditSeedMs - 518_400_000, actor: 'Priya Shah', action: 'Saved project settings', target: 'Claims Desk · Validation Job Level', ip: '10.2.8.41' },
]

export const auditEvents: AuditEvent[] = auditSeed.map((event) => ({ ...event, at: stamp(event.atMs) }))

export const applicationSettingValues: Record<string, string> = {
  'general.app-name': 'Databuck',
  'slack.enabled': 'Y',
  'slack.channel': '#data-quality',
  'smtp.enabled': 'Y',
  'smtp.from': 'alerts@databuck.io',
  'validation-job.max-parallel': '4',
  'ai.model': 'gpt-4o',
}

export const projectSettingValues: Record<string, Record<string, string>> = {
  production: {
    'validation-job.max-parallel': '8',
    'validation-job.timeout': '90',
    'slack.channel': '#dq-production',
  },
  'claims-desk': {
    'slack.channel': '#claims-quality',
    'jira.enabled': 'Y',
    'jira.project-key': 'CLM',
    'exception-data.retain-days': '180',
  },
  'catalog-hub': {
    'profiling.sample-size': '250000',
    'slack.channel': '#catalog-ops',
  },
}

export function newAdminId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`
}

export function fullName(user: Pick<AdminUser, 'firstName' | 'lastName'>) {
  return `${user.firstName} ${user.lastName}`
}

export function roleName(roleId: string, list: Role[]) {
  return list.find((role) => role.id === roleId)?.name ?? 'Unknown'
}

export function projectLabel(id: string) {
  return workspaceProjects.find((project) => project.id === id)?.name ?? id
}

export function dashboardName(id: string, list: Dashboard[] = dashboards) {
  return list.find((item) => item.id === id)?.name ?? 'Dashboard'
}

export function extraLabel(action: ExtraAction) {
  if (action === 'clearQueue') return 'Clear queue'
  if (action === 'download') return 'Download'
  return 'Approve'
}

export function crudLabel(action: PermissionAction) {
  if (action === 'create') return 'Create'
  if (action === 'read') return 'Read'
  if (action === 'update') return 'Update'
  return 'Delete'
}

export function isBooleanYes(value: string) {
  return value === 'Y' || value === 'y' || value === 'true'
}

export function formatNow(date = new Date()) {
  return stamp(date.getTime())
}

export function randomSecret(kind: 'live' | 'mcp' = 'live') {
  const body = Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join('')
  return `dbk_${kind}_${body}`
}

export function tokenPrefix(secret: string) {
  return secret.slice(0, 12)
}

export function emptyPermissions(): RolePermissions {
  return emptyPerms()
}

export function settingDefaultMap() {
  return Object.fromEntries(settingProperties.map((property) => [property.id, property.defaultValue]))
}

export function categoryById(id: string) {
  for (const group of settingGroups) {
    const match = group.categories.find((category) => category.id === id)
    if (match) return match
  }
  return undefined
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function logTime(index: number, start = new Date('2026-10-06T13:40:00')) {
  const date = new Date(start.getTime() + index * 1400)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function buildLogLines(source: LogSource, lineCount: number, validationId?: string) {
  const run = validationRuns.find((item) => item.id === validationId) ?? validationRuns[0]
  const lines: string[] = []

  if (source === 'catalina') {
    const base = [
      '06-Oct-2026 13:40:11.412 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log Server version: Apache Tomcat/9.0.89',
      '06-Oct-2026 13:40:11.418 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log OS Name: Linux',
      '06-Oct-2026 13:40:11.419 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log Architecture: amd64',
      '06-Oct-2026 13:40:11.421 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log Java Home: /usr/lib/jvm/java-17',
      '06-Oct-2026 13:40:12.104 INFO [main] org.apache.catalina.core.AprLifecycleListener.lifecycleEvent Loaded Apache Tomcat Native library [1.2.39]',
      '06-Oct-2026 13:40:12.882 INFO [main] org.apache.coyote.AbstractProtocol.init Initializing ProtocolHandler ["http-nio-8080"]',
      '06-Oct-2026 13:40:13.441 INFO [main] org.apache.catalina.startup.Catalina.load Server initialization in [2,029] milliseconds',
      '06-Oct-2026 13:40:13.908 INFO [main] org.apache.catalina.core.StandardService.startInternal Starting service [Catalina]',
      '06-Oct-2026 13:40:14.112 INFO [main] org.apache.catalina.core.StandardEngine.startInternal Starting Servlet engine: [Apache Tomcat/9.0.89]',
      '06-Oct-2026 13:40:16.774 INFO [main] org.apache.jasper.servlet.TldScanner.scanJars At least one JAR was scanned for TLDs yet contained no TLDs',
      '06-Oct-2026 13:40:18.201 INFO [main] org.apache.catalina.startup.HostConfig.deployWAR Deploying web application archive [/opt/tomcat/webapps/databuck.war]',
      '06-Oct-2026 13:40:24.663 INFO [main] org.apache.catalina.startup.HostConfig.deployWAR Deployment of web application archive [/opt/tomcat/webapps/databuck.war] has finished in [6,462] ms',
      '06-Oct-2026 13:40:24.701 INFO [main] org.apache.coyote.AbstractProtocol.start Starting ProtocolHandler ["http-nio-8080"]',
      '06-Oct-2026 13:40:24.718 INFO [main] org.apache.catalina.startup.Catalina.start Server startup in [10,794] milliseconds',
    ]
    lines.push(...base)
    for (let i = lines.length; i < lineCount; i += 1) {
      lines.push(`06-Oct-2026 13:4${i % 10}:${pad(i % 60)}.${100 + (i % 800)} INFO [http-nio-8080-exec-${(i % 12) + 1}] com.databuck.web.RequestLog ${i % 7 === 0 ? 'GET /health 200' : i % 5 === 0 ? 'POST /api/jobs/run 202' : 'GET /api/validations 200'}`)
    }
    return lines.slice(0, lineCount)
  }

  if (source === 'error') {
    const base = [
      `ERROR ${logTime(0)} [job-pool-3] com.databuck.validation.RuleEngine - Rule RC-441 failed on column claim_amount`,
      `WARN  ${logTime(1)} [job-pool-3] com.databuck.validation.RuleEngine - Continuing remaining checks after soft fail`,
      `ERROR ${logTime(2)} [spark-driver] org.apache.spark.scheduler.TaskSetManager - Lost task 12.0 in stage 4.0: java.io.IOException: Slow HDFS write`,
      `ERROR ${logTime(3)} [http-nio-8080-exec-5] com.databuck.api.TokenFilter - Rejected expired token prefix dbk_live_e04f`,
      `WARN  ${logTime(4)} [file-monitor] com.databuck.monitor.LandingZone - Expected file claims_daily.csv late by 12m`,
      `ERROR ${logTime(5)} [mailer] com.databuck.notify.SmtpClient - SMTP 421 from smtp.databuck.internal, retry scheduled`,
      `ERROR ${logTime(6)} [matching-2] com.databuck.match.Blocker - Block key overflow on member_id (2.1M pairs)`,
      `WARN  ${logTime(7)} [scheduler] com.databuck.jobs.Queue - Queue depth 14 exceeds warn threshold 10`,
    ]
    lines.push(...base)
    for (let i = lines.length; i < lineCount; i += 1) {
      const level = i % 4 === 0 ? 'ERROR' : 'WARN '
      lines.push(`${level} ${logTime(i)} [worker-${(i % 6) + 1}] com.databuck.runtime.Worker - ${i % 3 === 0 ? 'Spill to disk on shuffle' : 'Retrying downstream write'}`)
    }
    return lines.slice(0, lineCount)
  }

  const name = run?.validationName ?? 'Validation'
  const table = run?.tableName ?? 'Table'
  const schema = run?.schema ?? 'schema'
  const base = [
    `INFO  ${logTime(0)} Validation ${name} started`,
    `INFO  ${logTime(1)} Connecting to ${run?.sourceType ?? 'source'} · ${schema}`,
    `INFO  ${logTime(2)} Loaded 1,204,331 rows from ${schema}.${table.replace(/ /g, '_')}`,
    `INFO  ${logTime(3)} Applied template Standard (v14)`,
    `INFO  ${logTime(4)} Running 28 rules across 41 columns`,
    `INFO  ${logTime(5)} Null check passed on customer_id (0 nulls)`,
    `INFO  ${logTime(6)} Uniqueness passed on customer_id`,
    `WARN  ${logTime(7)} Length check flagged 14 values on email`,
    `INFO  ${logTime(8)} Pattern check passed on phone`,
    `INFO  ${logTime(9)} Score ${run?.score ?? 98.4} · failed checks ${run?.failedChecks ?? 0}`,
    `INFO  ${logTime(10)} Exception file written (${run?.failedChecks ? 128 : 0} rows)`,
    `INFO  ${logTime(11)} Validation ${name} complete in 4m 12s`,
  ]
  lines.push(...base)
  for (let i = lines.length; i < lineCount; i += 1) {
    lines.push(`INFO  ${logTime(i)} Column ${['email', 'status', 'updated_at', 'amount'][i % 4]} · rule ${['null', 'type', 'range', 'regex'][i % 4]} · ${i % 9 === 0 ? 'warn' : 'pass'}`)
  }
  return lines.slice(0, lineCount)
}

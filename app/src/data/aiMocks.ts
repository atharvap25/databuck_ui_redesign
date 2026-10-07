import { sqlName, type CustomRule, type RuleDimension } from './customRules.ts'
import type { WorkspacePair } from './workspaces.ts'
import { matchingJobs } from './matchings.ts'
import { columnProfiles, type DataSource, type SourceTable } from './sources.ts'
import { validationRuns, type ValidationRun } from './validations.ts'
import type { AiFocus } from '../ai/WorkspaceAiContext.tsx'
import type { CatalogColumn } from './ruleCatalog.ts'
import { resolveCheckName, resultsFor } from './checkResults.ts'
import { executiveSnapshot } from './executiveDashboard.ts'

export type Confidence = number

export type Citation = { label: string; hint?: string }

export type InsightItem = { title: string; body: string }

export type AgentAction = { id: 'review' | 'rca' | 'agent'; label: string; target?: string }

export type AgentReply = {
  text: string
  citations?: Citation[]
  insights?: InsightItem[]
  actions?: AgentAction[]
}

export type ScoreDriver = { label: string; delta: string; tone: 'danger' | 'warning' | 'success' }

export type BuckReview = {
  headline: string
  summary: string
  confidence: Confidence
  owner: string
  drivers: ScoreDriver[]
  failures: string[]
  actions: string[]
  priorDelta: string
}

export type RcaHypothesis = {
  title: string
  likelihood: string
  evidence: string
  next: string
}

export type RootCause = {
  headline: string
  confidence: Confidence
  hypotheses: RcaHypothesis[]
}

export type CheckExplain = {
  why: string
  actual: string
  threshold: string
  columns: string[]
  suggestion: string
}

export type PiiColumn = {
  name: string
  label: 'Restricted' | 'Direct PII' | 'Financial' | 'Internal' | 'Public'
  confidence: Confidence
}

export type ExceptionCluster = {
  title: string
  body: string
}

export type ProfileInsight = {
  title: string
  body: string
}

export type MappingHint = {
  source: string
  target: string
  confidence: Confidence
  why: string
  transform?: string
}

export type WizardIntent = {
  phrase: string
  summary: string
  tableHint: string
  domain: string
  slack: string
  onlyOnFailure: boolean
  scheduleHint: string
  matching?: boolean
}

export type HeaderAlert = {
  id: string
  title: string
  body: string
  when: string
  tone: 'danger' | 'warning' | 'info'
  action?: AgentAction
}

export type JobBrief = {
  title: string
  body: string
  next: string
}

export type MatchBriefing = {
  headline: string
  summary: string
  confidence: Confidence
  drivers: string[]
  keyHint: string
  impact: string
}

export type AnomalyEvent = {
  id: string
  when: string
  title: string
  body: string
  table: string
  tone: 'danger' | 'warning' | 'info'
}

export type SearchIntent = {
  id: string
  label: string
  query: string
}

function hash(value: string) {
  return [...value].reduce((total, character) => total + character.charCodeAt(0), 0)
}

function pick<T>(items: T[], seed: number) {
  return items[Math.abs(seed) % items.length]
}

export const agentGreeting = 'Ask about a check, a threshold, or a failing column.'

export const agentPrompts = [
  'Why did a check fail?',
  'Which columns are critical?',
  'Explain this DTS score',
  'Summarize sensitive columns',
]

export function buckReviewFor(run: ValidationRun): BuckReview {
  if (run.id === 'campaigns') {
    return {
      headline: 'Campaigns DTS fell to 62.4% on the last run.',
      summary: 'Five checks failed. Nulls on email and drift on spend account for most of the drop versus the 12 Sep baseline.',
      confidence: 0.91,
      owner: 'Customer stewards',
      priorDelta: 'DTS −18.2 pts vs prior run',
      drivers: [
        { label: 'Null check · email', delta: '−9.4', tone: 'danger' },
        { label: 'Data drift · spend', delta: '−5.1', tone: 'danger' },
        { label: 'Regex · campaign_code', delta: '−2.8', tone: 'warning' },
      ],
      failures: ['email null rate 11.4% vs 0% threshold', 'spend drifted 22% vs last profile', 'campaign_code failed AAAA pattern on 318 rows'],
      actions: ['Raise email null threshold to 2% only if marketing confirms optional emails', 'Reprofile after the 18:00 event load', 'Ask matching to pause Campaigns by Channel until DTS > 80'],
    }
  }
  if (run.id === 'ledger') {
    return {
      headline: 'General Ledger did not complete a usable run.',
      summary: 'Score is 0 with six failed checks. The load looks truncated — row count is far below the 30-day median.',
      confidence: 0.88,
      owner: 'Finance stewards',
      priorDelta: 'DTS −76.5 pts vs 3 Sep',
      drivers: [
        { label: 'Record count anomaly', delta: '−40', tone: 'danger' },
        { label: 'Null check · account_code', delta: '−18', tone: 'danger' },
        { label: 'Date consistency · posted_on', delta: '−12', tone: 'danger' },
      ],
      failures: ['Row count 12% of median', 'account_code blank on 61% of rows', 'posted_on contains future dates'],
      actions: ['Confirm Teradata extract finished', 'Do not publish this run', 'Rerun after the 02:00 finance load'],
    }
  }
  if (run.failedChecks === 0 && run.score >= 95) {
    return {
      headline: `${run.tableName} is healthy at ${run.score.toFixed(1)}%.`,
      summary: `No failed checks on run ${run.run}. Keep the current catalog; watch uniqueness on identifier columns.`,
      confidence: 0.86,
      owner: pick(['Finance stewards', 'Operations stewards', 'Customer stewards'], hash(run.id)),
      priorDelta: `DTS ${run.score >= 98 ? '+0.4' : '+1.1'} pts vs prior run`,
      drivers: [
        { label: 'Null check', delta: '+0.2', tone: 'success' },
        { label: 'Data type', delta: '0.0', tone: 'success' },
      ],
      failures: [],
      actions: ['Keep nightly schedule', 'No catalog changes needed'],
    }
  }
  if (run.failedChecks === 0) {
    return {
      headline: `${run.tableName} is on watch at ${run.score.toFixed(1)}%.`,
      summary: 'No hard failures, but distribution and drift are close to threshold. A small volume change would fail the next run.',
      confidence: 0.82,
      owner: 'Operations stewards',
      priorDelta: `DTS −${(100 - run.score).toFixed(1)} pts from the 95 target`,
      drivers: [
        { label: 'Distribution', delta: '−3.2', tone: 'warning' },
        { label: 'Value anomaly', delta: '−1.8', tone: 'warning' },
      ],
      failures: [],
      actions: ['Review numeric thresholds after the next profile', 'Keep alerts on failure only'],
    }
  }
  return {
    headline: `${run.tableName} failed ${run.failedChecks} ${run.failedChecks === 1 ? 'check' : 'checks'} (${run.score.toFixed(1)}% DTS).`,
    summary: `Run ${run.run} on ${run.ranOn} dropped below the project fail line. Nulls and duplicates on key columns are the main drivers.`,
    confidence: 0.84,
    owner: pick(['Finance stewards', 'Operations stewards', 'Inventory stewards'], hash(run.id)),
    priorDelta: `DTS −${Math.max(4, (95 - run.score)).toFixed(1)} pts vs prior run`,
    drivers: [
      { label: 'Null check', delta: '−4.6', tone: 'danger' },
      { label: 'Duplicate check', delta: '−2.1', tone: 'warning' },
    ],
    failures: [`${run.failedChecks} catalog checks below threshold`, 'Critical columns include identifier and amount fields'],
    actions: ['Open root cause analysis', 'Hold downstream matching until DTS recovers', 'Notify the table owner'],
  }
}

export function rcaFor(run: ValidationRun): RootCause {
  if (run.id === 'campaigns') {
    return {
      headline: 'Late event load plus optional email collection.',
      confidence: 0.87,
      hypotheses: [
        {
          title: 'Upstream file arrived after the 06:00 cutoff',
          likelihood: 'High',
          evidence: 'Row count is 18% below the 7-day median; spend nulls cluster after 18:00.',
          next: 'Confirm the GCS landing time for campaigns_*.psv.',
        },
        {
          title: 'Email became optional in the source form',
          likelihood: 'Medium',
          evidence: 'email null rate jumped from 0.4% to 11.4% on the same day as the form change.',
          next: 'If confirmed, raise the threshold to 2% and mark email non-critical.',
        },
        {
          title: 'Join key drift versus Clickstream',
          likelihood: 'Low',
          evidence: 'campaign_code pattern failures overlap with the matching job 3150 unmatched set.',
          next: 'Pause Campaigns by Channel until codes stabilize.',
        },
      ],
    }
  }
  if (run.id === 'ledger') {
    return {
      headline: 'Truncated Teradata extract.',
      confidence: 0.9,
      hypotheses: [
        {
          title: 'Extract job stopped after header rows',
          likelihood: 'High',
          evidence: '12% of expected rows; account_code blank on most remaining records.',
          next: 'Rerun the claims_reader extract and skip publishing this score.',
        },
        {
          title: 'Wrong schema pointer (edw_prod vs edw_stage)',
          likelihood: 'Medium',
          evidence: 'posted_on contains future dates typical of staging clocks.',
          next: 'Confirm databaseSchema on Claims Mart.',
        },
      ],
    }
  }
  if (run.failedChecks === 0) {
    return {
      headline: 'No hard failure to diagnose.',
      confidence: 0.7,
      hypotheses: [
        {
          title: 'Score is within noise of the last three runs',
          likelihood: 'High',
          evidence: `DTS ${run.score.toFixed(1)}% with zero failed checks.`,
          next: 'Keep the current catalog and watch the next scheduled run.',
        },
      ],
    }
  }
  return {
    headline: 'Nulls and duplicates on key columns after the last load.',
    confidence: 0.8,
    hypotheses: [
      {
        title: 'Late or partial source load',
        likelihood: 'High',
        evidence: `${run.failedChecks} failed checks clustered on identifier and amount columns.`,
        next: 'Compare row count to the 7-day median and reprofile.',
      },
      {
        title: 'Threshold tighter than the current process',
        likelihood: 'Medium',
        evidence: 'Fail line is 70; this run sits near the watch band on related tables.',
        next: 'Review the suggested 2% null threshold before changing production.',
      },
    ],
  }
}

export function checkExplainFor(run: ValidationRun, checkName: string): CheckExplain {
  const failed = run.failedChecks > 0
  if (/null/i.test(checkName)) {
    return {
      why: failed
        ? `Null rate on key columns exceeded the 0% catalog limit on ${run.tableName}.`
        : `Null check passed. Remaining nulls are inside the 0% allowance.`,
      actual: failed ? '11.4% null' : '0.1% null',
      threshold: '0%',
      columns: ['email', 'customer_id', 'status'].slice(0, failed ? 3 : 1),
      suggestion: 'Suggested threshold 2% from the 3-run median. Accept only if the owner confirms optional values.',
    }
  }
  if (/drift|anomal/i.test(checkName)) {
    return {
      why: `Distribution on numeric columns moved versus the last profile for ${run.tableName}.`,
      actual: '22% drift',
      threshold: '10%',
      columns: ['amount', 'spend', 'balance'],
      suggestion: 'Reprofile after the next full load before widening the band.',
    }
  }
  if (/regex|pattern|length/i.test(checkName)) {
    return {
      why: 'Values left the expected format on a subset of rows.',
      actual: '318 rows mismatched',
      threshold: 'AAAA (100%)',
      columns: ['campaign_code', 'status'],
      suggestion: 'Trim whitespace in the mapping or add a default-pattern check.',
    }
  }
  return {
    why: failed
      ? `${checkName} failed on ${run.tableName} run ${run.run}.`
      : `${checkName} is within threshold on ${run.tableName}.`,
    actual: failed ? `${8 + (hash(checkName) % 40)} defects` : '0 defects',
    threshold: '0%',
    columns: ['id'],
    suggestion: failed ? 'Open root cause analysis for load timing and key uniqueness.' : 'No change suggested.',
  }
}

export function exceptionClusterFor(run: ValidationRun): ExceptionCluster | null {
  if (run.failedChecks <= 0) return null
  const share = 12 + (hash(run.id) % 8)
  return {
    title: `${share} of ${18 + run.failedChecks} exceptions share the same load batch`,
    body: `Most ${run.tableName} failures land after 18:00 on ${run.ranOn}. Treat them as one incident, not ${run.failedChecks} separate rule bugs.`,
  }
}

export function piiColumnsFor(table: SourceTable): PiiColumn[] {
  const columns = columnProfiles(table)
  const labeled: PiiColumn[] = columns.slice(0, 8).map((column) => {
    const key = column.name.toLowerCase()
    if (/email|phone|ssn|name|address/.test(key)) return { name: column.name, label: 'Direct PII', confidence: 0.94 }
    if (/amount|balance|salary|price|spend|payment/.test(key)) return { name: column.name, label: 'Financial', confidence: 0.9 }
    if (/id|key|code/.test(key)) return { name: column.name, label: 'Internal', confidence: 0.78 }
    if (/status|region|country/.test(key)) return { name: column.name, label: 'Public', confidence: 0.72 }
    return { name: column.name, label: 'Internal', confidence: 0.64 }
  })
  if (labeled.length === 0) {
    return [
      { name: 'email', label: 'Direct PII', confidence: 0.93 },
      { name: 'amount', label: 'Financial', confidence: 0.88 },
    ]
  }
  return labeled
}

export function profileInsightsFor(table: SourceTable): ProfileInsight[] {
  const columns = columnProfiles(table)
  const unique = columns.find((column) => /id|email|code/.test(column.name.toLowerCase()))
  const numeric = columns.find((column) => column.mean !== '—')
  const insights: ProfileInsight[] = []
  if (unique) {
    insights.push({
      title: `${unique.name} uniqueness ${unique.uniquePct}%`,
      body: Number.parseFloat(unique.uniquePct) < 80 ? 'Unlikely to be a reliable join key. Prefer a composite if matching this table.' : 'Looks unique enough to use as a matching key.',
    })
  }
  if (numeric) {
    insights.push({
      title: `${numeric.name} tracks nearby amounts`,
      body: `Mean ${numeric.mean}. Correlation with sibling amount columns is high — a single anomaly check may cover both.`,
    })
  }
  if (insights.length === 0) {
    insights.push({
      title: 'Profile is thin',
      body: 'Run a full profile before accepting catalog suggestions on this table.',
    })
  }
  return insights
}

export function schemaDigestFor(table: SourceTable) {
  const seed = hash(table.id)
  if (seed % 3 !== 0) return null
  return `+2 columns since last profile (discount_code, channel). Refresh metadata before the next validation.`
}

export function onboardSuggestionsFor(source: DataSource) {
  const risky = source.tables.filter((table) => /customer|campaign|worker|invoice|payment/i.test(table.nickname)).slice(0, 3)
  if (risky.length === 0) return null
  return {
    title: `${risky.length} tables look unprofiled and high-risk`,
    body: risky.map((table) => table.nickname).join(', ') + ' — PII or financial names, no recent validation.',
    tables: risky.map((table) => table.nickname),
  }
}

export function nicknameSuggestion(type: string, host: string, database: string) {
  const hostBit = host.trim().split('.')[0]
  const dbBit = database.trim().split('.')[0]
  if (!hostBit && !dbBit) return `${type} source`
  if (dbBit && hostBit) return `${dbBit} (${type})`
  return `${hostBit || dbBit} (${type})`
}

export function catalogWhy(checkId: string, columns: CatalogColumn[]) {
  const names = columns.map((column) => column.name.toLowerCase())
  if (checkId === 'null' || checkId === 'data-type') return 'Applied to every column from the schema.'
  if (checkId === 'regex') return names.some((name) => name.includes('email')) ? 'String column name contains email.' : 'String columns often need a format pattern.'
  if (checkId === 'duplicate') return 'Identifier-like column names (id, code, key).'
  if (checkId === 'date-consistency') return 'Date-typed columns present on this table.'
  if (checkId === 'value-anomaly' || checkId === 'distribution') return 'Numeric columns that are not keys.'
  if (checkId === 'data-drift') return 'Table name looks like a fact or event table.'
  if (checkId === 'length' || checkId === 'max-length' || checkId === 'default-pattern') return 'String columns from the profile.'
  if (checkId === 'default-value') return 'Status / region / country style columns.'
  return 'Suggested from column types and names.'
}

export function enrichRuleProposals(rules: CustomRule[]): (CustomRule & { confidence: Confidence; why: string })[] {
  return rules.map((rule) => {
    const key = rule.name.toLowerCase()
    if (key.includes('email')) return { ...rule, confidence: 0.94, why: 'Column name contains email — format check is standard for Customer tables.' }
    if (key.includes('positive') || key.includes('amount')) return { ...rule, confidence: 0.9, why: 'Numeric amount columns should not go negative on finance tables.' }
    if (key.includes('future') || key.includes('date')) return { ...rule, confidence: 0.86, why: 'Date-typed column should not sit in the future relative to the load day.' }
    if (key.includes('blank') || key.includes('status')) return { ...rule, confidence: 0.81, why: 'Status columns are used in filters; blank values hide failed rows.' }
    return { ...rule, confidence: 0.72, why: 'Fallback presence check on the first column when no stronger signal exists.' }
  })
}

function pickColumn(columns: { name: string }[], pattern: RegExp, fallback: string) {
  return columns.find((column) => pattern.test(column.name.toLowerCase()))?.name ?? fallback
}

function draftRule(
  pair: WorkspacePair,
  tableName: string,
  fields: {
    id: string
    name: string
    description: string
    expression: string
    anchorColumn: string
    dimension?: RuleDimension
  },
): CustomRule {
  return {
    id: fields.id,
    name: fields.name,
    description: fields.description,
    category: 'direct query',
    threshold: 0,
    dimension: fields.dimension ?? 'Validity',
    anchorColumn: fields.anchorColumn,
    expression: fields.expression,
    domainId: pair.domainId,
    projectId: pair.projectId,
    sourceValidation: tableName || 'This validation',
    usedIn: 0,
  }
}

export function englishToRule(
  phrase: string,
  tableName: string,
  pair: WorkspacePair,
  columns: { name: string; format: string }[] = [],
): CustomRule | null {
  const text = phrase.trim()
  if (!text) return null
  const lower = text.toLowerCase()
  const table = sqlName(tableName)
  const fallback = columns[0]?.name ?? 'id'
  if (/email/.test(lower)) {
    const column = pickColumn(columns, /email/, 'email')
    return draftRule(pair, tableName, {
      id: `nl-email-${Date.now()}`,
      name: `${column}_format_check`,
      description: 'Email addresses must contain a valid mailbox pattern.',
      anchorColumn: column,
      dimension: 'Validity',
      expression: `SELECT * FROM ${table} WHERE ${column} NOT LIKE '%_@_%.__%'`,
    })
  }
  if (/positive|greater than 0|not negative|not be negative/.test(lower)) {
    const column = pickColumn(columns, /amount|total|balance|price|salary|spend|limit/, 'amount')
    return draftRule(pair, tableName, {
      id: `nl-amount-${Date.now()}`,
      name: `${column}_positive_check`,
      description: `${column} must be greater than zero.`,
      anchorColumn: column,
      dimension: 'Accuracy',
      expression: `SELECT * FROM ${table} WHERE ${column} <= 0`,
    })
  }
  if (/future|not in the future/.test(lower)) {
    const column = columns.find((item) => item.format === 'Date')?.name ?? pickColumn(columns, /date/, 'event_date')
    return draftRule(pair, tableName, {
      id: `nl-date-${Date.now()}`,
      name: `${column}_not_future`,
      description: `${column} should not be in the future.`,
      anchorColumn: column,
      dimension: 'Timeliness',
      expression: `SELECT * FROM ${table} WHERE ${column} > CURRENT_DATE`,
    })
  }
  if (/not blank|populated|not null|missing|complete/.test(lower)) {
    const column = pickColumn(columns, /status|name|code/, fallback)
    return draftRule(pair, tableName, {
      id: `nl-present-${Date.now()}`,
      name: `${column}_not_blank`,
      description: `${column} should always be populated.`,
      anchorColumn: column,
      dimension: 'Completeness',
      expression: `SELECT * FROM ${table} WHERE ${column} IS NULL OR TRIM(CAST(${column} AS VARCHAR)) = ''`,
    })
  }
  if (/duplicate|unique/.test(lower)) {
    const column = pickColumn(columns, /id|key|code/, fallback)
    return draftRule(pair, tableName, {
      id: `nl-dup-${Date.now()}`,
      name: `${column}_unique_check`,
      description: `${column} values must be unique.`,
      anchorColumn: column,
      dimension: 'Uniqueness',
      expression: `SELECT ${column} FROM ${table} GROUP BY ${column} HAVING COUNT(*) > 1`,
    })
  }
  const slug = lower.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 32) || 'custom'
  return draftRule(pair, tableName, {
    id: `nl-${slug}-${Date.now()}`,
    name: `${slug}_check`,
    description: text,
    anchorColumn: fallback,
    dimension: 'Validity',
    expression: `SELECT * FROM ${table} WHERE /* ${text.replace(/\*\//g, '')} */ 1 = 1`,
  })
}

export function rulesFromDocument(
  fileName: string,
  tableName: string,
  pair: WorkspacePair,
  columns: { name: string; format: string }[],
): CustomRule[] {
  const table = sqlName(tableName)
  const idColumn = pickColumn(columns, /id|key|code/, columns[0]?.name ?? 'id')
  const amount = columns.find((column) => /amount|total|balance|price/.test(column.name.toLowerCase()))
  const date = columns.find((column) => column.format === 'Date')
  const status = columns.find((column) => column.name.toLowerCase().includes('status'))
  const stem = fileName.replace(/\.[^.]+$/, '')
  const rules: CustomRule[] = [
    draftRule(pair, tableName, {
      id: `doc-${idColumn}-${Date.now()}`,
      name: `${idColumn}_required_from_${sqlName(stem)}`,
      description: `Extracted from ${fileName}: ${idColumn} must be present on every row.`,
      anchorColumn: idColumn,
      dimension: 'Completeness',
      expression: `SELECT * FROM ${table} WHERE ${idColumn} IS NULL`,
    }),
  ]
  if (amount) {
    rules.push(
      draftRule(pair, tableName, {
        id: `doc-${amount.name}-${Date.now()}`,
        name: `${amount.name}_range_from_${sqlName(stem)}`,
        description: `Extracted from ${fileName}: ${amount.name} should stay non-negative.`,
        anchorColumn: amount.name,
        dimension: 'Accuracy',
        expression: `SELECT * FROM ${table} WHERE ${amount.name} < 0`,
      }),
    )
  }
  if (date) {
    rules.push(
      draftRule(pair, tableName, {
        id: `doc-${date.name}-${Date.now()}`,
        name: `${date.name}_window_from_${sqlName(stem)}`,
        description: `Extracted from ${fileName}: ${date.name} cannot sit in the future.`,
        anchorColumn: date.name,
        dimension: 'Timeliness',
        expression: `SELECT * FROM ${table} WHERE ${date.name} > CURRENT_DATE`,
      }),
    )
  }
  if (status) {
    rules.push(
      draftRule(pair, tableName, {
        id: `doc-${status.name}-${Date.now()}`,
        name: `${status.name}_allowed_from_${sqlName(stem)}`,
        description: `Extracted from ${fileName}: ${status.name} must stay in the approved set.`,
        anchorColumn: status.name,
        dimension: 'Validity',
        expression: `SELECT * FROM ${table} WHERE ${status.name} IS NULL OR TRIM(${status.name}) = ''`,
      }),
    )
  }
  return rules.slice(0, 4)
}

export const wizardIntents: WizardIntent[] = [
  {
    phrase: 'Nightly null + email checks on Customers, Slack on fail',
    summary: 'Customer Master · null and regex on email · Slack #data-quality · daily 06:30',
    tableHint: 'Customer Master',
    domain: 'Customer',
    slack: '#data-quality',
    onlyOnFailure: true,
    scheduleHint: 'Daily at 06:30 after the ERP load',
  },
  {
    phrase: 'Finance invoices: amount must be positive, email on fail',
    summary: 'AR Invoices · amount_positive_check · email dq.alerts@acme.com · on failure',
    tableHint: 'AR Invoices',
    domain: 'Finance',
    slack: '#finance-dq',
    onlyOnFailure: true,
    scheduleHint: 'Finance nightly at 02:00',
  },
  {
    phrase: 'Compare Orders to Order Facts and flag mismatches',
    summary: 'Matching · Orders → Order Facts · auto-map keys · Slack on unmatched',
    tableHint: 'Orders',
    domain: 'Operations',
    slack: '#data-quality',
    onlyOnFailure: true,
    scheduleHint: 'Weekday morning checks',
    matching: true,
  },
]

export function parseWizardIntent(text: string): WizardIntent | null {
  const needle = text.trim().toLowerCase()
  if (!needle) return null
  const exact = wizardIntents.find((item) => item.phrase.toLowerCase() === needle)
  if (exact) return exact
  if (/customer|email/.test(needle)) return wizardIntents[0]
  if (/invoice|finance|amount/.test(needle)) return wizardIntents[1]
  if (/match|compare|order/.test(needle)) return wizardIntents[2]
  return wizardIntents[0]
}

export function suggestedValidationName(tableName: string, domain: string) {
  const table = tableName.trim() ? tableName.trim().replace(/\s+/g, '_') : 'New_Table'
  const prefix = domain.trim() ? `${domain.trim().replace(/\s+/g, '_')}_` : ''
  return `${table}_${prefix}dq`.replace(/__+/g, '_')
}

export function configureHint(schema: { name: string; format: string }[]) {
  const numeric = schema.filter((column) => column.format === 'Integer' || column.format === 'Decimal')
  if (numeric.length === 0) return null
  return `Anomaly detection recommended — ${numeric.length} numeric ${numeric.length === 1 ? 'column' : 'columns'} present (${numeric.slice(0, 3).map((column) => column.name).join(', ')}).`
}

export function scheduleHintFor(tableName: string) {
  if (/campaign|event|click/i.test(tableName)) return 'This table looks intra-day. Hourly CDC after the event load is a better fit than nightly.'
  if (/invoice|ledger|payment|journal/i.test(tableName)) return 'Finance tables usually land overnight. 02:00 after the upstream load.'
  return 'This table looks daily. 06:30 after the upstream load.'
}

export function notificationDraft(tableName: string, failedChecks: number) {
  const fail = failedChecks > 0
  return {
    subject: fail ? `${tableName} DTS alert` : `${tableName} validation complete`,
    body: fail
      ? `${tableName} failed ${failedChecks} ${failedChecks === 1 ? 'check' : 'checks'} on the latest run. Open Buck's Review before publishing downstream jobs.`
      : `${tableName} completed within threshold. No steward action required.`,
  }
}

export const mappingHints: MappingHint[] = [
  { source: 'cust_id', target: 'customer_id', confidence: 0.93, why: 'Alias of customer identifier across ERP and warehouse.' },
  { source: 'customerid', target: 'customer_id', confidence: 0.9, why: 'Same identifier without separator.' },
  { source: 'order_dt', target: 'order_date', confidence: 0.88, why: 'Date vs timestamp naming.', transform: 'CAST(src.order_dt AS TIMESTAMP)' },
  { source: 'amt', target: 'amount', confidence: 0.86, why: 'Abbreviated amount column.' },
  { source: 'email_addr', target: 'email', confidence: 0.91, why: 'Mailbox field under a longer name.' },
]

export function mappingHintFor(sourceColumn: string, targetNames: string[]): MappingHint | null {
  const key = sourceColumn.toLowerCase()
  const hint = mappingHints.find((item) => item.source === key)
  if (hint && targetNames.some((name) => name.toLowerCase() === hint.target.toLowerCase())) return hint
  const fuzzy = targetNames.find((name) => {
    const target = name.toLowerCase().replace(/_/g, '')
    const source = key.replace(/_/g, '')
    return target.includes(source) || source.includes(target)
  })
  if (fuzzy && fuzzy.toLowerCase() !== key) {
    return { source: sourceColumn, target: fuzzy, confidence: 0.74, why: 'Name overlap after ignoring underscores.' }
  }
  return null
}

export function matchBriefingFor(matchingId: string): MatchBriefing {
  const job = matchingJobs.find((item) => item.id === matchingId)
  const name = job ? `${job.source.tableName} → ${job.target.tableName}` : 'This matching job'
  if (!job || (job.unmatched === 0 && job.matchRate >= 95)) {
    return {
      headline: `${name} is stable.`,
      summary: 'Match rate is inside the success band. No join-key change suggested.',
      confidence: 0.83,
      drivers: ['Keys align on exact names', 'Unmatched count is zero'],
      keyHint: 'Keep the current primary key.',
      impact: 'No downstream quality jobs are blocked.',
    }
  }
  if (job.id === '3150') {
    return {
      headline: 'Campaigns by Channel dropped to 62.4%.',
      summary: '318 unmatched keys. campaign_code format drift is the likely join break versus Clickstream events.',
      confidence: 0.89,
      drivers: ['campaign_code pattern failures', 'Late event file after 18:00', 'Channel grain differs on 2 segments'],
      keyHint: 'id is a poor key (41% unique). Prefer campaign_code + channel after the format is cleaned.',
      impact: 'This mismatch set blocks 2 downstream quality jobs on Campaigns and Customer 360.',
    }
  }
  return {
    headline: `${name} needs review (${job.matchRate.toFixed(1)}% match, ${job.unmatched} unmatched).`,
    summary: 'Most unmatched keys look like padding or case differences, not missing entities.',
    confidence: 0.81,
    drivers: ['Leading zeros on source keys', 'Case mismatch on names', 'Late arriving target rows'],
    keyHint: job.source.tableName.toLowerCase().includes('order')
      ? 'id is a poor key. Prefer order_id + line_no.'
      : 'Prefer a composite business key over a generated id.',
    impact: 'This mismatch set blocks 2 downstream quality jobs.',
  }
}

export function mismatchReason(note: string, index: number) {
  if (/pad|zero/i.test(note)) return 'Source pads the key with leading zeros; target stores the trimmed value.'
  if (/case|upper|lower/i.test(note)) return 'Case difference only — likely the same entity.'
  if (/late|missing/i.test(note)) return 'Target row had not landed when this run started.'
  return pick(
    [
      'Whitespace on the source value.',
      'Type coercion (string vs integer key).',
      'Same entity with a renamed code in the target.',
    ],
    index,
  )
}

export function jobBriefFor(name: string, failed?: boolean): JobBrief | null {
  const key = name.toLowerCase()
  if (failed || /campaign/.test(key)) {
    return {
      title: 'Email nulls and spend drift',
      body: 'Campaigns failed five checks. The 06:00 run started before the event file landed.',
      next: 'Open RCA on Campaigns before rerunning the group.',
    }
  }
  if (/invoice|3120|gl/.test(key)) {
    return {
      title: 'Cell mismatches on amount',
      body: 'AR Invoices to GL unmatched 24 keys. Rounding on currency conversion is the likely cause.',
      next: 'Open the matching briefing and confirm the amount transform.',
    }
  }
  if (/ledger/.test(key)) {
    return {
      title: 'Truncated extract',
      body: 'General Ledger row count is 12% of median. Do not publish this score.',
      next: 'Open RCA and rerun after the Teradata extract.',
    }
  }
  return null
}

export const headerAlerts: HeaderAlert[] = [
  {
    id: 'campaigns-dts',
    title: 'Campaigns DTS dropped to 62.4%',
    body: 'Five checks failed after the 12 Sep run. Email nulls are the top driver.',
    when: '2h ago',
    tone: 'danger',
    action: { id: 'review', label: "Open Buck's Review" },
  },
  {
    id: 'schema-drift',
    title: 'Shipments picked up 2 columns',
    body: 'discount_code and channel appeared since last profile.',
    when: '5h ago',
    tone: 'warning',
  },
  {
    id: 'match-rate',
    title: 'Campaigns by Channel unmatched 318',
    body: 'Match rate 62.4%. Likely campaign_code format drift versus Clickstream.',
    when: 'Yesterday',
    tone: 'danger',
    action: { id: 'agent', label: 'Ask the agent' },
  },
]

export const searchIntents: SearchIntent[] = [
  { id: 'dts-low', label: 'DTS below 70', query: '62' },
  { id: 'failed', label: 'Failed last run', query: 'fail' },
  { id: 'pii', label: 'PII tables', query: 'customer' },
]

export const observabilityEvents: AnomalyEvent[] = [
  {
    id: 'vol-campaigns',
    when: '18:00',
    title: 'Volume drop on Campaigns',
    body: 'Row count 18% below the 7-day median after the event load window.',
    table: 'Campaigns',
    tone: 'danger',
  },
  {
    id: 'null-email',
    when: '18:12',
    title: 'Null spike on email',
    body: 'email null rate moved from 0.4% to 11.4% in one run.',
    table: 'Campaigns',
    tone: 'danger',
  },
  {
    id: 'schema-ship',
    when: '05:40',
    title: 'Schema change on Shipments',
    body: 'Two new columns detected on profile.',
    table: 'Shipments',
    tone: 'warning',
  },
  {
    id: 'match-gl',
    when: '08:14',
    title: 'Match rate watch on AR Invoices to GL',
    body: '24 unmatched keys, amounts differ by rounding.',
    table: 'AR Invoices',
    tone: 'warning',
  },
  {
    id: 'healthy',
    when: '09:00',
    title: 'Workers stayed at 100% DTS',
    body: 'No anomaly. Included so the timeline is not only failures.',
    table: 'Workers',
    tone: 'info',
  },
]

export const briefingMetrics = [
  { label: 'Project DTS', value: '91.2%', hint: '−1.4 vs yesterday', tone: 'warning' as const },
  { label: 'Failed checks', value: '22', hint: 'Across 7 tables', tone: 'danger' as const },
  { label: 'Match jobs on watch', value: '3', hint: 'Campaigns, AR, Order Lines', tone: 'warning' as const },
  { label: 'Healthy tables', value: '11', hint: 'DTS ≥ 95', tone: 'success' as const },
]

export const briefingActions = [
  'Open Buck’s Review on Campaigns before the 09:00 matching pack.',
  'Hold General Ledger publish — extract looks truncated.',
  'Accept suggested campaign_code mapping after the format is cleaned.',
]

export const reportNarrative =
  'This week in data trust: Campaigns and General Ledger drove most of the DTS loss. Eleven tables stayed at or above 95%. Matching watch concentrated on Campaigns by Channel and AR Invoices to GL. Recommended focus for Monday: late event loads and the Teradata extract.'

export function auditPlain(action: string, actor: string, target: string) {
  const text = action.toLowerCase()
  if (/rotat/.test(text)) return `${actor} rotated a token for ${target}.`
  if (/created|added/.test(text)) return `${actor} created ${target}.`
  if (/updated|saved|changed/.test(text)) return `${actor} updated ${target}.`
  if (/revok|deactiv|remov|delet/.test(text)) return `${actor} removed access to ${target}.`
  if (/sign/.test(text)) return `${actor} signed in.`
  return `${actor} ran “${action}” on ${target}.`
}

export function replyFor(question: string, focus: AiFocus): AgentReply {
  const text = question.trim().toLowerCase()
  const table = focus.tableName ?? 'the open table'
  const dts = focus.dts != null ? `${focus.dts.toFixed(1)}%` : 'the current DTS'
  const run = focus.validationId ? validationRuns.find((item) => item.id === focus.validationId) : undefined

  if (/daily briefing|get the daily/.test(text)) {
    const snap = executiveSnapshot()
    const jobs = snap.failedJobs.map((job) => `${job.name} (${job.when})`).join('; ')
    const watch = snap.matchingWatch.map((job) => `${job.name} · ${job.unmatched} unmatched`).join('; ')
    return {
      text: `Overnight on ${snap.asOf}: enterprise DTS is ${snap.dts.toFixed(1)}% (${snap.dtsDelta30.toFixed(1)} vs 30 days). ${snap.healthyCount} tables stayed high-trust. Failed jobs — ${jobs || 'none'}. Campaigns is at 62.4% after a late event load; General Ledger is at 0% on a truncated Teradata extract. Journals (76.5%) is still on the watch-to-fail line. Matching watch: ${watch}. Stewards recovered ${snap.hoursSaved} hours this month by leaving the healthy tables on autopilot. Next: hold GL publish and open RCA; review Campaigns before the 09:00 matching pack; confirm campaign_code padding before accepting the mapping.`,
      citations: [
        { label: 'Jobs · Campaigns' },
        { label: 'Jobs · General Ledger' },
        { label: 'Matching · Campaigns by Channel' },
        { label: 'Matching · AR Invoices to GL' },
      ],
      actions: [
        { id: 'review', label: "Open Buck's Review · Campaigns", target: 'campaigns' },
        { id: 'rca', label: 'Open RCA · General Ledger', target: 'ledger' },
      ],
    }
  }

  if (/explain this/.test(text)) {
    const match = question.match(/explain this (.+?)(?: check)? on /i) ?? question.match(/explain this (.+)/i)
    const checkName = resolveCheckName(match?.[1] ?? 'this check')
    const model = run ? resultsFor(run, checkName) : null
    const failed = model?.rows.filter((row) => !row.passed) ?? []
    const failedList = failed.slice(0, 3).map((row) => row.name).join(', ') || 'none'
    const threshold = model?.kpis.find((kpi) => kpi.label === 'Threshold')?.value ?? 'the configured threshold'
    return {
      text: model
        ? `The ${checkName} on ${table} is ${model.passed ? 'passing' : 'failing'}. ${failed.length} failed ${failed.length === 1 ? 'column' : 'columns'} (${failedList}). Threshold is ${threshold}. Next: inspect those columns, then Configure check if the limit is wrong.`
        : `I can walk through ${checkName} on ${table}: failed columns, the threshold, and whether to retune or fix the load.`,
      citations: [{ label: `${checkName} · results` }, { label: 'Check summary' }],
      actions: run ? [{ id: 'review', label: "Open Buck's Review" }] : undefined,
    }
  }

  if (/sensitive|pii|classif/.test(text)) {
    return {
      text: `${table} has Direct PII on email-style columns and Financial labels on amount fields. Restricted share is the slice to review before export.`,
      citations: [{ label: 'Sensitive data · column list' }, { label: 'Direct PII · email' }],
      actions: [{ id: 'agent', label: 'Stay on this summary' }],
    }
  }
  if (/critical/.test(text)) {
    return {
      text: `Critical columns on ${table} are the identifier and amount fields used in null, duplicate, and anomaly checks. Treat those failures as publish blockers.`,
      citations: [{ label: 'Null check · customer_id' }, { label: 'Duplicate check · id' }],
    }
  }
  if (/mismatch|match rate|unmatched|fuzzy|join key/.test(text)) {
    const rate = focus.matchRate != null ? `${focus.matchRate.toFixed(1)}%` : 'the latest match rate'
    return {
      text: `${focus.matchingName ?? table} is at ${rate} with ${focus.unmatched ?? 0} unmatched keys. Most look like padding or case, not missing entities.`,
      citations: [{ label: 'Row mismatches' }, { label: 'Join key' }],
      insights: [{ title: 'Key hint', body: 'Prefer a composite business key over a generated id.' }],
    }
  }
  if (/drift|schema/.test(text)) {
    return {
      text: `${table} picked up new columns or a distribution shift versus the last profile. Refresh metadata before widening thresholds.`,
      citations: [{ label: 'Profile · schema digest' }],
    }
  }
  if (/threshold/.test(text)) {
    return {
      text: `Suggested null threshold on ${table} is 2% (from 0%), based on the 3-run median. Accept only if optional values are confirmed.`,
      citations: [{ label: 'Null check' }],
      actions: run ? [{ id: 'review', label: "Open Buck's Review" }] : undefined,
    }
  }
  if (/dts|score|explain/.test(text)) {
    return {
      text: run
        ? `${run.tableName} is at ${dts} with ${run.failedChecks} failed ${run.failedChecks === 1 ? 'check' : 'checks'} on run ${run.run}.`
        : `The open validation is at ${dts}. Open Buck's Review for drivers.`,
      citations: [{ label: 'DTS' }, { label: 'Check summary' }],
      actions: run ? [{ id: 'review', label: "Open Buck's Review" }] : undefined,
    }
  }
  if (/fail|why|root|rca/.test(text)) {
    if (focus.screen === 'matching') {
      const rate = focus.matchRate != null ? `${focus.matchRate.toFixed(1)}%` : 'the latest match rate'
      return {
        text: `${focus.matchingName ?? table} is at ${rate} with ${focus.unmatched ?? 0} unmatched keys. Padding and case on the join key are the usual cause, not missing entities.`,
        citations: [{ label: 'Row mismatches' }, { label: 'Join key' }],
      }
    }
    return {
      text: run && run.failedChecks > 0
        ? `${run.tableName} failed ${run.failedChecks} checks. The working theory is a late or partial load, with nulls on key columns as the visible symptom.`
        : `${table} has no hard failures on the open run. I can still walk through watch-band drift.`,
      citations: [{ label: 'Null check' }, { label: 'Last run' }],
      actions: run ? [{ id: 'rca', label: 'Open root cause analysis' }] : undefined,
    }
  }
  if (/job|schedule/.test(text) || focus.screen === 'jobs') {
    return {
      text: 'Failed jobs this morning cluster on Campaigns and AR Invoices to GL. Open the job brief before rerunning the group.',
      citations: [{ label: 'Jobs · Campaigns' }],
    }
  }
  return {
    text: focus.validationId
      ? `${table} is in focus at ${dts}. Ask about a failed check, a threshold, or sensitive columns.`
      : focus.matchingId
        ? `${focus.matchingName ?? 'This matching job'} is in focus. Ask about unmatched keys or the join key.`
        : 'Pick a validation or matching job, then ask about a check, a DTS drop, or a column.',
    citations: focus.tableName ? [{ label: table }] : undefined,
  }
}

export function runById(id: string) {
  return validationRuns.find((item) => item.id === id)
}

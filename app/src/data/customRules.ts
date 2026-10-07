import type { WorkspacePair } from './workspaces.ts'

export type RuleCategory =
  | 'referential'
  | 'orphan'
  | 'cross referential'
  | 'conditional cross referential'
  | 'conditional orphan'
  | 'conditional referential'
  | 'conditional sql internal rule'
  | 'conditional duplicate check'
  | 'conditional completeness check'
  | 'direct query'
  | 'sql internal rule'
  | 'push down query'

export type RuleDimension =
  | 'Accuracy'
  | 'Completeness'
  | 'Consistency'
  | 'Integrity'
  | 'Uniqueness'
  | 'Validity'
  | 'Timeliness'

export type MetricFunction = 'Distinct Count' | 'Record Count' | 'Average' | 'Sum'

export type TableColumnMapping = {
  table: string
  column: string
}

export type CustomRule = {
  id: string
  name: string
  description: string
  category: RuleCategory
  threshold: number
  dimension: RuleDimension
  anchorColumn: string
  expression: string
  domainId: string
  projectId: string
  sourceValidation: string
  usedIn: number
  referenceTable?: string
  referenceColumn?: string
  parentTable?: string
  parentColumn?: string
  mappings?: TableColumnMapping[]
  condition?: string
  checkColumns?: string[]
}

export type DistributionMetric = {
  id: string
  name: string
  tableName: string
  column: string
  fn: MetricFunction
  microsegment: string
  threshold: number
  dimension: RuleDimension
  filter: string
}

export const ruleCategories: RuleCategory[] = [
  'direct query',
  'sql internal rule',
  'push down query',
  'referential',
  'orphan',
  'cross referential',
  'conditional referential',
  'conditional orphan',
  'conditional cross referential',
  'conditional sql internal rule',
  'conditional duplicate check',
  'conditional completeness check',
]

export const ruleDimensions: RuleDimension[] = [
  'Accuracy',
  'Completeness',
  'Consistency',
  'Integrity',
  'Uniqueness',
  'Validity',
  'Timeliness',
]

export const metricFunctions: MetricFunction[] = ['Distinct Count', 'Record Count', 'Average', 'Sum']

export const categoryCopy: Record<RuleCategory, string> = {
  referential: 'Checks for referential integrity, ensuring valid relationships between data in different tables.',
  orphan: 'Identifies records with invalid or missing links to a parent table.',
  'cross referential': 'Checks data consistency and relationships across multiple related data tables.',
  'conditional cross referential': 'Cross Referential check performed only when a specific condition is met.',
  'conditional orphan': 'Orphan check applied only when a defined condition is true.',
  'conditional referential': 'Referential check applied only when a defined condition is true.',
  'conditional sql internal rule': 'Executes a custom SQL query rule only when a specific condition is met.',
  'conditional duplicate check': 'Checks for duplicate records only when a defined condition is true.',
  'conditional completeness check': 'Checks for missing or incomplete data only when a defined condition is true.',
  'direct query': 'Executes a direct query against the data source to validate data.',
  'sql internal rule': "Executes a custom SQL query within the application's processing engine.",
  'push down query': 'Validation query executed directly on the data source system.',
}

export function categoryLabel(category: RuleCategory) {
  return category.replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export type CategoryExtras = {
  reference: boolean
  parent: boolean
  mappings: boolean
  condition: boolean
  checkColumns: boolean
}

export function extrasFor(category: RuleCategory): CategoryExtras {
  return {
    reference: category === 'referential' || category === 'conditional referential',
    parent: category === 'orphan' || category === 'conditional orphan',
    mappings: category === 'cross referential' || category === 'conditional cross referential',
    condition: category.startsWith('conditional'),
    checkColumns: category === 'conditional duplicate check' || category === 'conditional completeness check',
  }
}

const ACME: WorkspacePair = { domainId: 'acme-corp', projectId: 'production' }
const HEALTH: WorkspacePair = { domainId: 'meridian-health', projectId: 'claims-desk' }
const RETAIL: WorkspacePair = { domainId: 'harbor-retail', projectId: 'catalog-hub' }

function base(
  pair: WorkspacePair,
  fields: Omit<CustomRule, 'domainId' | 'projectId' | 'threshold' | 'usedIn'> & {
    threshold?: number
    usedIn?: number
  },
): CustomRule {
  return {
    domainId: pair.domainId,
    projectId: pair.projectId,
    threshold: fields.threshold ?? 0,
    usedIn: fields.usedIn ?? 1,
    ...fields,
  }
}

export const libraryCustomRules: CustomRule[] = [
  base(ACME, {
    id: 'amount-positive',
    name: 'amount_positive_check',
    description: 'Invoice and payment amounts must be greater than zero.',
    category: 'direct query',
    dimension: 'Validity',
    anchorColumn: 'amount',
    expression: 'SELECT * FROM invoices WHERE amount <= 0',
    sourceValidation: 'AR Invoices',
    usedIn: 4,
  }),
  base(ACME, {
    id: 'currency-combo',
    name: 'currency_amount_combo',
    description: 'Currency and amount must be present together.',
    category: 'direct query',
    dimension: 'Completeness',
    anchorColumn: 'currency',
    expression: 'SELECT * FROM payments WHERE (currency IS NULL) <> (amount IS NULL)',
    sourceValidation: 'AR Payments',
    usedIn: 3,
  }),
  base(ACME, {
    id: 'future-sale-date',
    name: 'future_sale_date',
    description: 'Sale dates cannot be in the future.',
    category: 'direct query',
    dimension: 'Timeliness',
    anchorColumn: 'order_date',
    expression: 'SELECT * FROM orders WHERE order_date > CURRENT_DATE',
    sourceValidation: 'Orders',
    usedIn: 2,
  }),
  base(ACME, {
    id: 'duplicate-sale-id',
    name: 'duplicate_sale_id',
    description: 'Order identifiers must be unique.',
    category: 'sql internal rule',
    dimension: 'Uniqueness',
    anchorColumn: 'order_id',
    expression: 'SELECT order_id FROM orders GROUP BY order_id HAVING COUNT(*) > 1',
    sourceValidation: 'Orders',
    usedIn: 5,
  }),
  base(ACME, {
    id: 'discount-auth',
    name: 'discount_auth_check',
    description: 'Discounts above 40% require authorization.',
    category: 'conditional sql internal rule',
    dimension: 'Accuracy',
    anchorColumn: 'discount_pct',
    expression: 'SELECT * FROM order_lines WHERE discount_pct > 40 AND authorized = 0',
    condition: 'discount_pct IS NOT NULL',
    sourceValidation: 'Order Lines',
    usedIn: 1,
  }),
  base(ACME, {
    id: 'journal-balanced',
    name: 'journal_debit_credit_balance',
    description: 'Posted journal lines must balance debit and credit.',
    category: 'push down query',
    dimension: 'Accuracy',
    anchorColumn: 'debit',
    expression: 'SELECT * FROM journals WHERE posted = 1 AND ABS(debit - credit) >= 0.01',
    sourceValidation: 'Journals',
    usedIn: 3,
  }),
  base(ACME, {
    id: 'invoice-customer-ref',
    name: 'invoice_customer_referential',
    description: 'Every invoice customer_id must exist on customer master.',
    category: 'referential',
    dimension: 'Integrity',
    anchorColumn: 'customer_id',
    expression: 'customer_id NOT IN (SELECT customer_id FROM customers)',
    referenceTable: 'customers',
    referenceColumn: 'customer_id',
    sourceValidation: 'AR Invoices',
    usedIn: 2,
  }),
  base(ACME, {
    id: 'payment-invoice-orphan',
    name: 'payment_without_invoice',
    description: 'Payments must link to an existing invoice.',
    category: 'orphan',
    dimension: 'Integrity',
    anchorColumn: 'invoice_id',
    expression: 'invoice_id IS NULL OR invoice_id NOT IN (SELECT invoice_id FROM invoices)',
    parentTable: 'invoices',
    parentColumn: 'invoice_id',
    sourceValidation: 'AR Payments',
    usedIn: 2,
  }),
  base(ACME, {
    id: 'order-status-complete',
    name: 'shipped_order_completeness',
    description: 'Shipped orders must have ship_date and tracking_id.',
    category: 'conditional completeness check',
    dimension: 'Completeness',
    anchorColumn: 'status',
    expression: "status = 'Shipped' AND (ship_date IS NULL OR tracking_id IS NULL)",
    condition: "status = 'Shipped'",
    checkColumns: ['ship_date', 'tracking_id'],
    sourceValidation: 'Orders',
    usedIn: 1,
  }),
  base(HEALTH, {
    id: 'claim-status-values',
    name: 'claim_status_allowed',
    description: 'Claim status must be one of the approved workflow values.',
    category: 'direct query',
    dimension: 'Validity',
    anchorColumn: 'status',
    expression: "SELECT * FROM claims WHERE status NOT IN ('Open', 'Adjudicated', 'Denied', 'Paid')",
    sourceValidation: 'Claims',
    usedIn: 3,
  }),
  base(HEALTH, {
    id: 'claim-member-ref',
    name: 'claim_member_referential',
    description: 'Claim member_id must resolve to an active member.',
    category: 'conditional referential',
    dimension: 'Integrity',
    anchorColumn: 'member_id',
    expression: 'member_id NOT IN (SELECT member_id FROM members WHERE active = 1)',
    condition: "claim_type <> 'Dummy'",
    referenceTable: 'members',
    referenceColumn: 'member_id',
    sourceValidation: 'Claims',
    usedIn: 2,
  }),
  base(HEALTH, {
    id: 'claim-dup-id',
    name: 'duplicate_claim_id',
    description: 'Claim identifiers must be unique when the claim is submitted.',
    category: 'conditional duplicate check',
    dimension: 'Uniqueness',
    anchorColumn: 'claim_id',
    expression: "SELECT claim_id FROM claims WHERE submitted = 1 GROUP BY claim_id HAVING COUNT(*) > 1",
    condition: 'submitted = 1',
    checkColumns: ['claim_id'],
    sourceValidation: 'Claims',
    usedIn: 4,
  }),
  base(RETAIL, {
    id: 'product-region',
    name: 'product_region_valid',
    description: 'Product region must match the approved list.',
    category: 'direct query',
    dimension: 'Validity',
    anchorColumn: 'region',
    expression: "SELECT * FROM products WHERE region NOT IN ('NA', 'EMEA', 'APAC', 'LATAM')",
    sourceValidation: 'Products',
    usedIn: 2,
  }),
  base(RETAIL, {
    id: 'on-hand-nonneg',
    name: 'on_hand_non_negative',
    description: 'On-hand inventory cannot be negative.',
    category: 'push down query',
    dimension: 'Accuracy',
    anchorColumn: 'on_hand',
    expression: 'SELECT * FROM balances WHERE on_hand < 0',
    sourceValidation: 'Balances',
    usedIn: 3,
  }),
  base(RETAIL, {
    id: 'sku-warehouse-cross',
    name: 'sku_warehouse_cross_ref',
    description: 'SKU and warehouse keys must exist together in catalog and location tables.',
    category: 'cross referential',
    dimension: 'Consistency',
    anchorColumn: 'sku_id',
    expression: 'sku_id AND warehouse_id must exist on sku_master and warehouses',
    mappings: [
      { table: 'sku_master', column: 'sku_id' },
      { table: 'warehouses', column: 'warehouse_id' },
    ],
    sourceValidation: 'Inventory Facts',
    usedIn: 1,
  }),
]

export const libraryDistributionMetrics: DistributionMetric[] = [
  {
    id: 'ddm-invoice-amount-avg',
    name: 'Average invoice amount',
    tableName: 'AR Invoices',
    column: 'amount',
    fn: 'Average',
    microsegment: 'Current',
    threshold: 15,
    dimension: 'Accuracy',
    filter: 'status <> \'Void\'',
  },
  {
    id: 'ddm-order-count',
    name: 'Daily order volume',
    tableName: 'Orders',
    column: 'order_id',
    fn: 'Record Count',
    microsegment: 'Current',
    threshold: 20,
    dimension: 'Completeness',
    filter: '',
  },
  {
    id: 'ddm-customer-distinct',
    name: 'Distinct customers billed',
    tableName: 'AR Invoices',
    column: 'customer_id',
    fn: 'Distinct Count',
    microsegment: 'Prior period',
    threshold: 10,
    dimension: 'Uniqueness',
    filter: 'amount > 0',
  },
]

export function samePair(rule: Pick<CustomRule, 'domainId' | 'projectId'>, pair: WorkspacePair | null) {
  if (!pair) return false
  return rule.domainId === pair.domainId && rule.projectId === pair.projectId
}

export function projectRules(rules: CustomRule[], pair: WorkspacePair | null) {
  return rules.filter((rule) => samePair(rule, pair))
}

export function globalRules(rules: CustomRule[], pair: WorkspacePair | null) {
  return rules.filter((rule) => !samePair(rule, pair))
}

export function suggestedCustomRuleIds(rules: CustomRule[], pair: WorkspacePair | null, tableName: string) {
  const table = tableName.toLowerCase()
  const pool = pair ? projectRules(rules, pair) : rules
  const ranked = pool
    .map((rule) => {
      let score = 0
      if (rule.sourceValidation.toLowerCase().includes(table) || table.includes(rule.sourceValidation.toLowerCase())) {
        score += 3
      }
      if (rule.category === 'direct query') score += 1
      return { id: rule.id, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
  const picked = ranked.slice(0, 2).map((item) => item.id)
  if (picked.length > 0) return picked
  return pool.slice(0, 2).map((rule) => rule.id)
}

function firstColumn(columns: { name: string; format: string }[], fallback = 'id') {
  return columns[0]?.name ?? fallback
}

export function proposeCustomRules(
  columns: { name: string; format: string }[],
  tableName: string,
  pair: WorkspacePair,
): CustomRule[] {
  const proposals: CustomRule[] = []
  const email = columns.find((column) => column.name.toLowerCase().includes('email'))
  if (email) {
    proposals.push(
      base(pair, {
        id: `ai-${email.name}`,
        name: `${email.name}_format_check`,
        description: `Generated from ${tableName}: ${email.name} should look like an email.`,
        category: 'direct query',
        dimension: 'Validity',
        anchorColumn: email.name,
        expression: `SELECT * FROM ${sqlName(tableName)} WHERE ${email.name} NOT LIKE '%_@_%.__%'`,
        sourceValidation: tableName,
        usedIn: 0,
      }),
    )
  }
  const amount = columns.find((column) => /amount|total|balance|price|salary|spend|limit/.test(column.name.toLowerCase()))
  if (amount) {
    proposals.push(
      base(pair, {
        id: `ai-${amount.name}`,
        name: `${amount.name}_positive_check`,
        description: `Generated from ${tableName}: ${amount.name} should not be negative.`,
        category: 'direct query',
        dimension: 'Accuracy',
        anchorColumn: amount.name,
        expression: `SELECT * FROM ${sqlName(tableName)} WHERE ${amount.name} < 0`,
        sourceValidation: tableName,
        usedIn: 0,
      }),
    )
  }
  const date = columns.find((column) => column.format === 'Date')
  if (date) {
    proposals.push(
      base(pair, {
        id: `ai-${date.name}`,
        name: `${date.name}_not_future`,
        description: `Generated from ${tableName}: ${date.name} should not be in the future.`,
        category: 'direct query',
        dimension: 'Timeliness',
        anchorColumn: date.name,
        expression: `SELECT * FROM ${sqlName(tableName)} WHERE ${date.name} > CURRENT_DATE`,
        sourceValidation: tableName,
        usedIn: 0,
      }),
    )
  }
  const status = columns.find((column) => column.name.toLowerCase().includes('status'))
  if (status && proposals.length < 3) {
    proposals.push(
      base(pair, {
        id: `ai-${status.name}`,
        name: `${status.name}_not_blank`,
        description: `Generated from ${tableName}: ${status.name} should always be populated.`,
        category: 'sql internal rule',
        dimension: 'Completeness',
        anchorColumn: status.name,
        expression: `SELECT * FROM ${sqlName(tableName)} WHERE ${status.name} IS NULL OR TRIM(${status.name}) = ''`,
        sourceValidation: tableName,
        usedIn: 0,
      }),
    )
  }
  if (proposals.length === 0) {
    const first = firstColumn(columns)
    proposals.push(
      base(pair, {
        id: `ai-${first}`,
        name: `${first}_present`,
        description: `Generated from ${tableName}: ${first} should be present on every row.`,
        category: 'direct query',
        dimension: 'Completeness',
        anchorColumn: first,
        expression: `SELECT * FROM ${sqlName(tableName)} WHERE ${first} IS NULL`,
        sourceValidation: tableName,
        usedIn: 0,
      }),
    )
  }
  return proposals.slice(0, 3)
}

export function proposeDistributionMetrics(
  columns: { name: string; format: string }[],
  tableName: string,
  microsegmentNames: string[],
): DistributionMetric[] {
  const numeric = columns.find((column) => column.format === 'Integer' || column.format === 'Decimal')
  const idColumn = columns.find((column) => /id|key|code/.test(column.name.toLowerCase())) ?? columns[0]
  const segment = microsegmentNames[0] ?? 'Current'
  const proposals: DistributionMetric[] = []
  if (idColumn) {
    proposals.push({
      id: `ddm-ai-${idColumn.name}-count`,
      name: `Record count on ${idColumn.name}`,
      tableName,
      column: idColumn.name,
      fn: 'Record Count',
      microsegment: segment,
      threshold: 15,
      dimension: 'Completeness',
      filter: '',
    })
    proposals.push({
      id: `ddm-ai-${idColumn.name}-distinct`,
      name: `Distinct ${idColumn.name}`,
      tableName,
      column: idColumn.name,
      fn: 'Distinct Count',
      microsegment: segment,
      threshold: 10,
      dimension: 'Uniqueness',
      filter: '',
    })
  }
  if (numeric) {
    proposals.push({
      id: `ddm-ai-${numeric.name}-avg`,
      name: `Average ${numeric.name}`,
      tableName,
      column: numeric.name,
      fn: 'Average',
      microsegment: microsegmentNames[1] ?? segment,
      threshold: 20,
      dimension: 'Accuracy',
      filter: `${numeric.name} IS NOT NULL`,
    })
  }
  return proposals.slice(0, 3)
}

export function sqlName(value: string) {
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
  return slug || 'table'
}

export function copyToProject(rule: CustomRule, pair: WorkspacePair): CustomRule {
  return {
    ...rule,
    id: `${rule.id}-${pair.domainId}-${pair.projectId}-${Date.now()}`,
    domainId: pair.domainId,
    projectId: pair.projectId,
    usedIn: 1,
    mappings: rule.mappings?.map((item) => ({ ...item })),
    checkColumns: rule.checkColumns ? [...rule.checkColumns] : undefined,
  }
}

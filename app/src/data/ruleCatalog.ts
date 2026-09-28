export type ColumnFormat = 'String' | 'Integer' | 'Decimal' | 'Date'

export type CatalogColumn = {
  id: string
  name: string
  format: ColumnFormat
}

export type FieldKind = 'percent' | 'number' | 'text'

export type CheckField = {
  id: string
  label: string
  kind: FieldKind
  placeholder: string
}

export type CheckDefinition = {
  id: string
  name: string
  group: 'Essential' | 'Advanced'
  summary: string
  fields: CheckField[]
  composite?: boolean
  segment?: boolean
  enableOnly?: boolean
}

export type ColumnConfig = {
  selected: boolean
  critical: boolean
  values: Record<string, string>
}

export type CheckConfig = {
  enabled: boolean
  critical: boolean
  columns: Record<string, ColumnConfig>
}

export type CatalogState = {
  checks: Record<string, CheckConfig>
  segmentColumnIds: string[]
}

const percent = (id: string, label: string): CheckField => ({
  id,
  label,
  kind: 'percent',
  placeholder: '0',
})

const numberField = (id: string, label: string): CheckField => ({
  id,
  label,
  kind: 'number',
  placeholder: '0',
})

const textField = (id: string, label: string, placeholder: string): CheckField => ({
  id,
  label,
  kind: 'text',
  placeholder,
})

export const catalogChecks: CheckDefinition[] = [
  {
    id: 'null',
    name: 'Null Check',
    group: 'Essential',
    summary: 'Flags columns whose null rate is above the allowed limit.',
    fields: [percent('threshold', 'Null threshold (%)')],
  },
  {
    id: 'duplicate',
    name: 'Duplicate Check',
    group: 'Essential',
    summary: 'Finds repeated values across the selected columns.',
    fields: [],
    composite: true,
  },
  {
    id: 'default-value',
    name: 'Default Value Check',
    group: 'Essential',
    summary: 'Detects columns still holding a placeholder default.',
    fields: [textField('values', 'Default values', '0, N/A, TBD')],
  },
  {
    id: 'regex',
    name: 'Regex Pattern Check',
    group: 'Essential',
    summary: 'Tests values against the expected pattern.',
    fields: [textField('patterns', 'Regex patterns', '^[A-Z]{2}\\d+$'), percent('threshold', 'Regex threshold (%)')],
  },
  {
    id: 'length',
    name: 'Length Check',
    group: 'Essential',
    summary: 'Checks that text stays inside the allowed length.',
    fields: [numberField('length', 'Length value'), percent('threshold', 'Length threshold (%)')],
  },
  {
    id: 'date-consistency',
    name: 'Date Consistency Check',
    group: 'Essential',
    summary: 'Finds dates that fall outside a valid range.',
    fields: [textField('format', 'Date format', 'yyyy-MM-dd HH:mm:ss')],
  },
  {
    id: 'micro-null',
    name: 'Microsegment Null Check',
    group: 'Essential',
    summary: 'Looks for nulls inside a microsegment.',
    fields: [percent('threshold', 'Null threshold (%)')],
    segment: true,
  },
  {
    id: 'data-type',
    name: 'Data Type Check',
    group: 'Essential',
    summary: 'Confirms values match the declared type.',
    fields: [percent('threshold', 'Data type threshold (%)')],
  },
  {
    id: 'default-pattern',
    name: 'Default Pattern Check',
    group: 'Essential',
    summary: 'Matches values to the default format.',
    fields: [textField('patterns', 'Default patterns', 'AAAA (100%)')],
  },
  {
    id: 'max-length',
    name: 'Max Length Check',
    group: 'Essential',
    summary: 'Flags values longer than the column limit.',
    fields: [numberField('length', 'Length value')],
  },
  {
    id: 'micro-date',
    name: 'Microsegment Date Consistency Check',
    group: 'Essential',
    summary: 'Checks date ranges inside a microsegment.',
    fields: [textField('format', 'Date format', 'yyyy-MM-dd HH:mm:ss')],
    segment: true,
  },
  {
    id: 'value-anomaly',
    name: 'Value Anomaly',
    group: 'Advanced',
    summary: 'Finds values that sit far from the usual range.',
    fields: [percent('threshold', 'Value anomaly threshold (%)')],
  },
  {
    id: 'micro-drift',
    name: 'Microsegment Based Data Drift',
    group: 'Advanced',
    summary: 'Compares a microsegment with its prior profile.',
    fields: [percent('threshold', 'Drift threshold (%)')],
    segment: true,
  },
  {
    id: 'distribution-metric',
    name: 'Data Distribution Metric Check',
    group: 'Advanced',
    summary: 'Tracks whether the distribution stays stable.',
    fields: [percent('threshold', 'Distribution threshold (%)')],
  },
  {
    id: 'data-drift',
    name: 'Data Drift Check',
    group: 'Advanced',
    summary: 'Compares the current profile with the last run.',
    fields: [percent('threshold', 'Drift threshold (%)')],
  },
  {
    id: 'distribution',
    name: 'Distribution Check',
    group: 'Advanced',
    summary: 'Checks the spread of values in a column.',
    fields: [percent('threshold', 'Distribution threshold (%)')],
  },
]

function column(name: string, format: ColumnFormat): CatalogColumn {
  return { id: name, name, format }
}

const columnSets: Record<string, CatalogColumn[]> = {
  customers: [
    column('customer_id', 'Integer'),
    column('customer_name', 'String'),
    column('email', 'String'),
    column('phone', 'String'),
    column('country', 'String'),
    column('region', 'String'),
    column('status', 'String'),
    column('created_at', 'Date'),
    column('credit_limit', 'Decimal'),
    column('segment', 'String'),
  ],
  orders: [
    column('order_id', 'Integer'),
    column('customer_id', 'Integer'),
    column('order_date', 'Date'),
    column('status', 'String'),
    column('currency', 'String'),
    column('order_total', 'Decimal'),
    column('ship_country', 'String'),
    column('channel', 'String'),
    column('requested_date', 'Date'),
  ],
  'order-lines': [
    column('order_id', 'Integer'),
    column('line_number', 'Integer'),
    column('sku', 'String'),
    column('product_name', 'String'),
    column('quantity', 'Integer'),
    column('unit_price', 'Decimal'),
    column('discount_pct', 'Decimal'),
    column('line_amount', 'Decimal'),
    column('ship_date', 'Date'),
  ],
  shipments: [
    column('shipment_id', 'String'),
    column('order_id', 'Integer'),
    column('carrier', 'String'),
    column('tracking_number', 'String'),
    column('ship_date', 'Date'),
    column('delivered_at', 'Date'),
    column('weight_kg', 'Decimal'),
    column('status', 'String'),
    column('destination_country', 'String'),
  ],
  invoices: [
    column('invoice_number', 'String'),
    column('customer_id', 'Integer'),
    column('invoice_date', 'Date'),
    column('due_date', 'Date'),
    column('currency', 'String'),
    column('amount', 'Decimal'),
    column('tax_amount', 'Decimal'),
    column('balance_due', 'Decimal'),
    column('status', 'String'),
  ],
  payments: [
    column('payment_id', 'String'),
    column('invoice_number', 'String'),
    column('payment_date', 'Date'),
    column('method', 'String'),
    column('amount', 'Decimal'),
    column('currency', 'String'),
    column('status', 'String'),
    column('reference', 'String'),
  ],
  workers: [
    column('worker_id', 'Integer'),
    column('full_name', 'String'),
    column('email', 'String'),
    column('department', 'String'),
    column('job_title', 'String'),
    column('hire_date', 'Date'),
    column('salary', 'Decimal'),
    column('status', 'String'),
    column('location', 'String'),
  ],
  balances: [
    column('sku', 'String'),
    column('warehouse', 'String'),
    column('on_hand', 'Integer'),
    column('reserved', 'Integer'),
    column('available', 'Integer'),
    column('unit_cost', 'Decimal'),
    column('as_of_date', 'Date'),
    column('lot_number', 'String'),
  ],
  ledger: [
    column('account_code', 'String'),
    column('account_name', 'String'),
    column('fiscal_period', 'Date'),
    column('debit', 'Decimal'),
    column('credit', 'Decimal'),
    column('balance', 'Decimal'),
    column('currency', 'String'),
    column('cost_center', 'String'),
    column('posted', 'String'),
  ],
  accounts: [
    column('account_id', 'String'),
    column('account_name', 'String'),
    column('industry', 'String'),
    column('owner_name', 'String'),
    column('country', 'String'),
    column('annual_revenue', 'Decimal'),
    column('created_at', 'Date'),
    column('status', 'String'),
    column('website', 'String'),
  ],
  positions: [
    column('position_id', 'String'),
    column('worker_id', 'Integer'),
    column('job_title', 'String'),
    column('department', 'String'),
    column('start_date', 'Date'),
    column('end_date', 'Date'),
    column('fte', 'Decimal'),
    column('location', 'String'),
    column('status', 'String'),
  ],
  returns: [
    column('return_id', 'String'),
    column('order_id', 'Integer'),
    column('sku', 'String'),
    column('reason', 'String'),
    column('quantity', 'Integer'),
    column('refund_amount', 'Decimal'),
    column('return_date', 'Date'),
    column('status', 'String'),
  ],
  movements: [
    column('movement_id', 'String'),
    column('sku', 'String'),
    column('warehouse', 'String'),
    column('movement_type', 'String'),
    column('quantity', 'Integer'),
    column('movement_date', 'Date'),
    column('unit_cost', 'Decimal'),
    column('reference', 'String'),
  ],
  journals: [
    column('journal_id', 'String'),
    column('journal_date', 'Date'),
    column('account_code', 'String'),
    column('description', 'String'),
    column('debit', 'Decimal'),
    column('credit', 'Decimal'),
    column('currency', 'String'),
    column('posted', 'String'),
  ],
  products: [
    column('sku', 'String'),
    column('product_name', 'String'),
    column('category', 'String'),
    column('brand', 'String'),
    column('unit_price', 'Decimal'),
    column('currency', 'String'),
    column('status', 'String'),
    column('launched_on', 'Date'),
  ],
  'customer-360': [
    column('customer_id', 'Integer'),
    column('full_name', 'String'),
    column('email', 'String'),
    column('lifetime_value', 'Decimal'),
    column('order_count', 'Integer'),
    column('last_order_date', 'Date'),
    column('segment', 'String'),
    column('country', 'String'),
  ],
  campaigns: [
    column('campaign_id', 'String'),
    column('campaign_name', 'String'),
    column('channel', 'String'),
    column('start_date', 'Date'),
    column('end_date', 'Date'),
    column('spend', 'Decimal'),
    column('impressions', 'Integer'),
    column('status', 'String'),
  ],
  vendors: [
    column('vendor_id', 'Integer'),
    column('vendor_name', 'String'),
    column('country', 'String'),
    column('payment_terms', 'String'),
    column('email', 'String'),
    column('tax_id', 'String'),
    column('status', 'String'),
    column('since', 'Date'),
  ],
}

export function columnsFor(validationId: string) {
  return columnSets[validationId] ?? columnSets.customers
}

function emptyColumn(fields: CheckField[]): ColumnConfig {
  return {
    selected: false,
    critical: false,
    values: Object.fromEntries(fields.map((field) => [field.id, ''])),
  }
}

function emptyCheck(check: CheckDefinition, columns: CatalogColumn[]): CheckConfig {
  return {
    enabled: false,
    critical: false,
    columns: Object.fromEntries(columns.map((column) => [column.id, emptyColumn(check.fields)])),
  }
}

function withColumn(check: CheckConfig, columnId: string, values: Record<string, string>): CheckConfig {
  const current = check.columns[columnId]
  return {
    ...check,
    columns: {
      ...check.columns,
      [columnId]: {
        selected: true,
        critical: false,
        values: { ...current.values, ...values },
      },
    },
  }
}

function lengthFor(name: string) {
  const key = name.toLowerCase()
  if (key.includes('email')) return '254'
  if (key.includes('phone')) return '20'
  if (key.includes('name') || key.includes('description')) return '80'
  if (key.includes('id') || key.includes('code') || key.includes('sku')) return '32'
  return '40'
}

export function seedCatalog(columns: CatalogColumn[]): CatalogState {
  const checks = Object.fromEntries(catalogChecks.map((check) => [check.id, emptyCheck(check, columns)]))

  for (const column of columns) {
    checks.null = withColumn(checks.null, column.id, { threshold: '0' })
  }

  const textColumns = columns.filter((column) => column.format === 'String').slice(0, 3)
  for (const column of textColumns) {
    checks.length = withColumn(checks.length, column.id, { length: lengthFor(column.name), threshold: '0' })
    checks['default-pattern'] = withColumn(checks['default-pattern'], column.id, { patterns: 'AAAA (100%)' })
  }

  return { checks, segmentColumnIds: [] }
}

function isIdLike(name: string) {
  const key = name.toLowerCase()
  return /(^id$|_id$|id$|code|sku|number|key)/.test(key)
}

function isFactTable(tableName: string) {
  const key = tableName.toLowerCase()
  return /order|invoice|payment|shipment|return|ledger|journal|movement|sale/.test(key)
}

export function suggestCatalog(columns: CatalogColumn[], tableName: string): CatalogState {
  const checks = Object.fromEntries(catalogChecks.map((check) => [check.id, emptyCheck(check, columns)]))

  for (const column of columns) {
    checks.null = withColumn(checks.null, column.id, { threshold: '0' })
    checks['data-type'] = withColumn(checks['data-type'], column.id, { threshold: '0' })
  }

  const strings = columns.filter((column) => column.format === 'String')
  for (const column of strings) {
    checks.length = withColumn(checks.length, column.id, { length: lengthFor(column.name), threshold: '0' })
    checks['max-length'] = withColumn(checks['max-length'], column.id, { length: lengthFor(column.name) })
    checks['default-pattern'] = withColumn(checks['default-pattern'], column.id, { patterns: 'AAAA (100%)' })
    const key = column.name.toLowerCase()
    if (key.includes('email')) {
      checks.regex = withColumn(checks.regex, column.id, { patterns: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$', threshold: '0' })
    }
    if (key.includes('status') || key.includes('country') || key === 'posted' || key.includes('region')) {
      checks['default-value'] = withColumn(checks['default-value'], column.id, { values: 'N/A, TBD, unknown' })
    }
  }

  for (const column of columns.filter((column) => column.format === 'Date')) {
    checks['date-consistency'] = withColumn(checks['date-consistency'], column.id, { format: 'YYYY-MM-DD' })
  }

  for (const column of columns.filter((column) => isIdLike(column.name))) {
    checks.duplicate = withColumn(checks.duplicate, column.id, {})
  }

  const numeric = columns.filter((column) => column.format === 'Integer' || column.format === 'Decimal')
  for (const column of numeric) {
    if (isIdLike(column.name) && column.format === 'Integer') continue
    checks['value-anomaly'] = withColumn(checks['value-anomaly'], column.id, { threshold: '5' })
    checks.distribution = withColumn(checks.distribution, column.id, { threshold: '10' })
  }

  if (isFactTable(tableName)) {
    for (const column of columns) {
      checks['data-drift'] = withColumn(checks['data-drift'], column.id, { threshold: '10' })
    }
  }

  return { checks, segmentColumnIds: [] }
}

export function appliedChecks(state: CatalogState, columns: CatalogColumn[]) {
  return catalogChecks.filter((check) => {
    const config = state.checks[check.id]
    if (!config) return false
    return check.enableOnly ? config.enabled : selectedColumns(config, columns).length > 0
  })
}

export function catalogSummary(state: CatalogState, columns: CatalogColumn[]) {
  const applied = appliedChecks(state, columns)
  return {
    essential: applied.filter((check) => check.group === 'Essential').length,
    advanced: applied.filter((check) => check.group === 'Advanced').length,
    total: applied.length,
    names: applied.map((check) => check.name),
  }
}

export function selectedColumns(check: CheckConfig, columns: CatalogColumn[]) {
  return columns.filter((column) => check.columns[column.id]?.selected)
}

export function criticalCount(check: CheckConfig, columns: CatalogColumn[]) {
  return selectedColumns(check, columns).filter((column) => check.columns[column.id]?.critical).length
}

import { schemaFamily, type SourceType } from './connectionFields.ts'

export type { SourceType }

export type SourceTable = {
  id: string
  nickname: string
  name: string
  columns: number
  approved: boolean
  description: string
  rowFilter: string
}

export type DataSource = {
  id: string
  name: string
  type: SourceType
  schema: string
  active: boolean
  properties: Record<string, string>
  tables: SourceTable[]
}

function props(partial: Record<string, string>): Record<string, string> {
  return {
    createdByUser: 'Admin User',
    projectName: 'Production',
    sslEnb: 'N',
    ...partial,
  }
}

function table(
  id: string,
  nickname: string,
  name: string,
  columns: number,
  approved: boolean,
): SourceTable {
  return { id, nickname, name, columns, approved, description: '', rowFilter: '' }
}

const discoveredCatalog: Record<string, { nickname: string; name: string; columns: number }[]> = {
  'acme-erp': [
    { nickname: 'Vendors', name: 'vendors', columns: 18 },
    { nickname: 'Invoices', name: 'invoices', columns: 26 },
  ],
  'analytics-warehouse': [
    { nickname: 'Sessions', name: 'sessions', columns: 20 },
    { nickname: 'Conversions', name: 'conversions', columns: 14 },
  ],
  'finance-mart': [
    { nickname: 'GL Accounts', name: 'gl_accounts', columns: 22 },
    { nickname: 'Cost Centers', name: 'cost_centers', columns: 12 },
  ],
  'marketing-events': [
    { nickname: 'Impressions', name: 'impressions', columns: 15 },
    { nickname: 'Clicks', name: 'clicks', columns: 11 },
  ],
  'staging-sandbox': [
    { nickname: 'Customers', name: 'customers', columns: 24 },
    { nickname: 'Orders', name: 'orders', columns: 18 },
  ],
  'peoplesoft-hr': [
    { nickname: 'Departments', name: 'departments', columns: 16 },
    { nickname: 'Job Codes', name: 'job_codes', columns: 13 },
  ],
  'inventory-facts': [
    { nickname: 'Warehouses', name: 'warehouses', columns: 14 },
    { nickname: 'SKU Master', name: 'sku_master', columns: 31 },
  ],
  'crm-sync': [
    { nickname: 'Contacts', name: 'contacts', columns: 28 },
    { nickname: 'Opportunities', name: 'opportunities', columns: 21 },
  ],
  'teradata-core': [
    { nickname: 'Cost Centers', name: 'cost_centers', columns: 12 },
    { nickname: 'Fiscal Periods', name: 'fiscal_periods', columns: 9 },
  ],
  'lakehouse-gold': [
    { nickname: 'Orders 360', name: 'orders_360', columns: 44 },
    { nickname: 'Inventory 360', name: 'inventory_360', columns: 29 },
  ],
  'billing-ledger': [
    { nickname: 'Subscriptions', name: 'subscriptions', columns: 19 },
    { nickname: 'Dunning', name: 'dunning', columns: 13 },
  ],
  'claims-mart': [
    { nickname: 'Claim Lines', name: 'claim_lines', columns: 33 },
    { nickname: 'Providers', name: 'providers', columns: 17 },
  ],
  clickstream: [
    { nickname: 'Sessions', name: 'sessions', columns: 18 },
    { nickname: 'Page Views', name: 'page_views', columns: 12 },
  ],
  'supplier-hub': [
    { nickname: 'Purchase Orders', name: 'purchase_orders', columns: 24 },
    { nickname: 'Receipts', name: 'receipts', columns: 16 },
  ],
  payroll: [
    { nickname: 'Pay Items', name: 'pay_items', columns: 21 },
    { nickname: 'Deductions', name: 'deductions', columns: 14 },
  ],
  'risk-store': [
    { nickname: 'Limits', name: 'limits', columns: 15 },
    { nickname: 'Ratings', name: 'ratings', columns: 11 },
  ],
}

const genericDiscovered = [
  { nickname: 'Customers', name: 'customers', columns: 24 },
  { nickname: 'Orders', name: 'orders', columns: 18 },
  { nickname: 'Audit Log', name: 'audit_log', columns: 12 },
]

export function discoverableTables(source: DataSource): SourceTable[] {
  const onboarded = new Set(source.tables.map((table) => table.name.toLowerCase()))
  const catalog = [...(discoveredCatalog[source.id] ?? []), ...genericDiscovered]
  const unique: { nickname: string; name: string; columns: number }[] = []
  const seen = new Set<string>()
  for (const entry of catalog) {
    const key = entry.name.toLowerCase()
    if (seen.has(key) || onboarded.has(key)) continue
    seen.add(key)
    unique.push(entry)
  }
  return unique.slice(0, 4).map((entry) => ({
    id: `${source.id}-${entry.name}`,
    nickname: entry.nickname,
    name: entry.name,
    columns: entry.columns,
    approved: false,
    description: '',
    rowFilter: '',
  }))
}

export const dataSources: DataSource[] = [
  {
    id: 'acme-erp',
    name: 'Acme ERP',
    type: 'MSSQL',
    schema: 'erp.dbo',
    active: true,
    properties: props({
      ipAddress: 'sql-erp.internal',
      port: '1433',
      databaseSchema: 'erp.dbo',
      username: 'erp_reader',
      password: 'erp_reader',
      sslEnb: 'Y',
      createdAtStr: '12 Mar 2024',
      domainName: 'Operations',
    }),
    tables: [
      table('acme-erp-customers', 'Customer Master', 'customers', 42, true),
      table('acme-erp-orders', 'Orders', 'orders', 38, true),
      table('acme-erp-lines', 'Order Lines', 'order_lines', 24, false),
    ],
  },
  {
    id: 'analytics-warehouse',
    name: 'Analytics Warehouse',
    type: 'BigQuery',
    schema: 'acme.analytics',
    active: true,
    properties: props({
      username: 'analytics-job',
      createdAtStr: '3 Jan 2025',
      bigQueryProjectName: 'acme-analytics',
      datasetName: 'acme.analytics',
      clientEmail: 'analytics@acme-analytics.iam.gserviceaccount.com',
      clientId: '1029384756',
      privatekeyId: 'a1b2c3',
      privatekey: '-----BEGIN PRIVATE KEY-----',
      dataplex_integration_enabled: 'N',
      pushDownQueryEnabled: 'Y',
      domainName: 'Customer',
    }),
    tables: [
      table('analytics-shipments', 'Shipments', 'shipments', 21, true),
      table('analytics-returns', 'Returns', 'returns', 16, true),
      table('analytics-customer-dim', 'Customer Dim', 'customer_dim', 28, true),
      table('analytics-order-facts', 'Order Facts', 'order_facts', 34, true),
    ],
  },
  {
    id: 'finance-mart',
    name: 'Finance Mart',
    type: 'MSSQL',
    schema: 'finance.dbo',
    active: true,
    properties: props({
      ipAddress: 'sql-finance.internal',
      port: '1433',
      databaseSchema: 'finance.dbo',
      username: 'finance_reader',
      password: 'finance_reader',
      sslEnb: 'Y',
      createdAtStr: '18 Jun 2024',
      domainName: 'Finance',
    }),
    tables: [
      table('finance-invoices', 'AR Invoices', 'ar_invoices', 29, true),
      table('finance-payments', 'AR Payments', 'ar_payments', 16, false),
      table('finance-gl-entries', 'GL Entries', 'gl_entries', 22, true),
    ],
  },
  {
    id: 'marketing-events',
    name: 'Marketing Events',
    type: 'BigQuery',
    schema: 'acme.events',
    active: false,
    properties: props({
      username: 'events-job',
      createdAtStr: '9 Sep 2023',
      bigQueryProjectName: 'acme-marketing',
      datasetName: 'acme.events',
      clientEmail: 'events@acme-marketing.iam.gserviceaccount.com',
      domainName: 'Customer',
    }),
    tables: [table('marketing-campaigns', 'Campaigns', 'campaigns', 18, false)],
  },
  {
    id: 'staging-sandbox',
    name: 'Staging Sandbox',
    type: 'MSSQL',
    schema: 'stage.sandbox',
    active: true,
    properties: props({
      ipAddress: 'sql-stage.internal',
      port: '1433',
      databaseSchema: 'stage.sandbox',
      username: 'stage_reader',
      password: 'stage_reader',
      createdAtStr: '2 Feb 2025',
    }),
    tables: [],
  },
  {
    id: 'peoplesoft-hr',
    name: 'PeopleSoft HR',
    type: 'MSSQL',
    schema: 'hr.dbo',
    active: true,
    properties: props({
      ipAddress: 'sql-hr.internal',
      port: '1433',
      databaseSchema: 'hr.dbo',
      username: 'hr_reader',
      password: 'hr_reader',
      sslEnb: 'Y',
      createdAtStr: '21 Nov 2023',
      domainName: 'People',
    }),
    tables: [
      table('hr-workers', 'Workers', 'workers', 54, true),
      table('hr-positions', 'Positions', 'positions', 22, true),
    ],
  },
  {
    id: 'inventory-facts',
    name: 'Inventory Facts',
    type: 'DatabricksDeltaLake',
    schema: 'inventory.gold',
    active: true,
    properties: props({
      username: 'inventory-job',
      password: 'dapi****************',
      createdAtStr: '14 Apr 2025',
      httpPath: 'https://acme.cloud.databricks.com',
      databaseSchema: 'inventory.gold',
      clusterPropertyCategory: 'cluster',
      azureAuthenticationType: 'PAT',
      sslEnb: 'Y',
      domainName: 'Inventory',
    }),
    tables: [
      table('inventory-balances', 'Balances', 'item_balances', 19, true),
      table('inventory-moves', 'Movements', 'item_moves', 27, false),
    ],
  },
  {
    id: 'crm-sync',
    name: 'CRM Sync',
    type: 'MSSQL',
    schema: 'crm.dbo',
    active: true,
    properties: props({
      ipAddress: 'sql-crm.internal',
      port: '1433',
      databaseSchema: 'crm.dbo',
      username: 'crm_reader',
      password: 'crm_reader',
      sslEnb: 'Y',
      createdAtStr: '7 Aug 2024',
      domainName: 'Customer',
    }),
    tables: [table('crm-accounts', 'Accounts', 'accounts', 33, true)],
  },
  {
    id: 'teradata-core',
    name: 'Teradata Core',
    type: 'Teradata',
    schema: 'edw_prod',
    active: false,
    properties: props({
      ipAddress: 'td-edw.internal',
      port: '1025',
      databaseSchema: 'edw_prod',
      username: 'edw_reader',
      password: 'edw_reader',
      createdAtStr: '30 May 2022',
      domainName: 'Finance',
    }),
    tables: [
      table('teradata-ledger', 'General Ledger', 'gl_balances', 41, false),
      table('teradata-journals', 'Journals', 'gl_journals', 28, true),
    ],
  },
  {
    id: 'lakehouse-gold',
    name: 'Lakehouse Gold',
    type: 'DatabricksDeltaLake',
    schema: 'lakehouse.gold',
    active: true,
    properties: props({
      username: 'lakehouse-job',
      password: 'dapi****************',
      createdAtStr: '11 Dec 2024',
      httpPath: 'https://acme-gold.cloud.databricks.com',
      databaseSchema: 'lakehouse.gold',
      clusterPropertyCategory: 'cluster',
      azureAuthenticationType: 'PAT',
      sslEnb: 'Y',
    }),
    tables: [
      table('lake-customers', 'Customer 360', 'customer_360', 63, true),
      table('lake-products', 'Products', 'products', 25, true),
    ],
  },
  {
    id: 'billing-ledger',
    name: 'Billing Ledger',
    type: 'MSSQL',
    schema: 'billing.dbo',
    active: true,
    properties: props({
      ipAddress: 'sql-billing.internal',
      port: '1433',
      databaseSchema: 'billing.dbo',
      username: 'billing_reader',
      password: 'billing_reader',
      sslEnb: 'Y',
      createdAtStr: '4 May 2025',
      domainName: 'Finance',
    }),
    tables: [
      table('billing-invoices', 'Billing Invoices', 'billing_invoices', 31, true),
      table('billing-credits', 'Credits', 'credits', 14, false),
    ],
  },
  {
    id: 'claims-mart',
    name: 'Claims Mart',
    type: 'Teradata',
    schema: 'claims_prod',
    active: true,
    properties: props({
      ipAddress: 'td-claims.internal',
      port: '1025',
      databaseSchema: 'claims_prod',
      username: 'claims_reader',
      password: 'claims_reader',
      createdAtStr: '16 Jan 2024',
      domainName: 'Finance',
    }),
    tables: [table('claims-headers', 'Claim Headers', 'claim_headers', 47, true)],
  },
  {
    id: 'clickstream',
    name: 'Clickstream',
    type: 'BigQuery',
    schema: 'acme.clickstream',
    active: true,
    properties: props({
      username: 'clickstream-job',
      createdAtStr: '28 Jul 2025',
      bigQueryProjectName: 'acme-product',
      datasetName: 'acme.clickstream',
      clientEmail: 'clickstream@acme-product.iam.gserviceaccount.com',
      domainName: 'Customer',
    }),
    tables: [table('click-events', 'Events', 'events', 22, true)],
  },
  {
    id: 'supplier-hub',
    name: 'Supplier Hub',
    type: 'DatabricksDeltaLake',
    schema: 'supplier.silver',
    active: false,
    properties: props({
      username: 'supplier-job',
      password: 'dapi****************',
      createdAtStr: '9 Oct 2023',
      httpPath: 'https://acme-supply.cloud.databricks.com',
      databaseSchema: 'supplier.silver',
      clusterPropertyCategory: 'cluster',
      azureAuthenticationType: 'PAT',
    }),
    tables: [table('supplier-master', 'Supplier Master', 'suppliers', 36, false)],
  },
  {
    id: 'payroll',
    name: 'Payroll',
    type: 'MSSQL',
    schema: 'payroll.dbo',
    active: true,
    properties: props({
      ipAddress: 'sql-payroll.internal',
      port: '1433',
      databaseSchema: 'payroll.dbo',
      username: 'payroll_reader',
      password: 'payroll_reader',
      sslEnb: 'Y',
      createdAtStr: '22 Feb 2024',
      domainName: 'People',
    }),
    tables: [table('payroll-runs', 'Pay Runs', 'pay_runs', 28, true)],
  },
  {
    id: 'risk-store',
    name: 'Risk Store',
    type: 'Teradata',
    schema: 'risk_mart',
    active: true,
    properties: props({
      ipAddress: 'td-risk.internal',
      port: '1025',
      databaseSchema: 'risk_mart',
      username: 'risk_reader',
      password: 'risk_reader',
      createdAtStr: '1 Aug 2025',
      domainName: 'Finance',
    }),
    tables: [table('risk-exposure', 'Exposure', 'exposure', 39, true)],
  },
  {
    id: 'snowflake-finance',
    name: 'Snowflake Finance',
    type: 'SnowFlake',
    schema: 'ANALYTICS.PUBLIC',
    active: true,
    properties: props({
      ipAddress: 'acme.snowflakecomputing.com',
      port: '443',
      databaseSchema: 'ANALYTICS.PUBLIC',
      username: 'finance_reader',
      password: 'snowflake_reader',
      sslEnb: 'Y',
      createdAtStr: '8 Mar 2026',
      domainName: 'Finance',
      projectName: 'Production',
    }),
    tables: [table('snow-gl', 'GL Balances', 'gl_balances', 36, true)],
  },
  {
    id: 's3-landing',
    name: 'S3 Landing',
    type: 'S3 Batch',
    schema: 'landing',
    active: true,
    properties: props({
      bucketName: 'acme-landing',
      folderPath: 's3://acme-landing/raw',
      fileNamePattern: '*.parquet',
      fileDataFormat: 'Parquet',
      headerPresent: 'Y',
      accessKey: 'AKIA****************',
      secretKey: '****************',
      partitionedFolders: 'Y',
      enableFileMonitoring: 'Y',
      kmsAuthDisabled: 'Y',
      createdAtStr: '2 Apr 2026',
      domainName: 'Operations',
    }),
    tables: [table('s3-orders', 'Orders Drop', 'orders_drop', 22, true)],
  },
  {
    id: 'files-claims',
    name: 'Claims Files',
    type: 'FileSystem Batch',
    schema: 'claims',
    active: true,
    properties: props({
      folderPath: '/data/claims/landing',
      bucketName: 'claims',
      fileNamePattern: 'claims_*.psv',
      fileDataFormat: 'PSV(Pipe Delimited)',
      headerPresent: 'Y',
      enableFileMonitoring: 'Y',
      createdAtStr: '19 May 2026',
      domainName: 'Finance',
    }),
    tables: [table('files-claims-daily', 'Daily Claims', 'daily_claims', 31, true)],
  },
  {
    id: 'hive-lake',
    name: 'Hive Lake',
    type: 'Hive Kerberos',
    schema: 'lake.default',
    active: true,
    properties: props({
      ipAddress: 'hive.internal',
      port: '10000',
      databaseSchema: 'lake.default',
      username: 'hive_reader',
      password: 'hive_reader',
      domain: 'CORP.ACME.LOCAL',
      keytab: '/opt/security/hive.keytab',
      krb5conf: '/etc/krb5.conf',
      hivejdbchost: 'hive-jdbc.internal',
      hivejdbcport: '10000',
      zookeeperUrl: 'zk1:2181,zk2:2181',
      createdAtStr: '11 Jan 2026',
      domainName: 'Operations',
    }),
    tables: [table('hive-sessions', 'Sessions', 'sessions', 18, true)],
  },
  {
    id: 'kafka-events',
    name: 'Kafka Events',
    type: 'ApacheKafka',
    schema: 'events.*',
    active: true,
    properties: props({
      ipAddress: 'kafka-1.internal:9092,kafka-2.internal:9092',
      port: '9092',
      databaseSchema: 'events.*',
      sslEnb: 'Y',
      username: 'events_reader',
      password: 'events_reader',
      createdAtStr: '6 Jun 2026',
      domainName: 'Customer',
    }),
    tables: [table('kafka-pageviews', 'Page Views', 'page_views', 12, true)],
  },
]

export function duplicateSource(source: DataSource, existing: DataSource[]): DataSource {
  const base = `${source.id}-copy`
  const taken = new Set(existing.map((item) => item.id))
  let id = base
  let suffix = 2
  while (taken.has(id)) {
    id = `${base}-${suffix}`
    suffix += 1
  }
  return {
    ...source,
    id,
    name: `${source.name} copy`,
    tables: source.tables.map((item) => ({ ...item, id: `${id}-${item.name}` })),
    properties: { ...source.properties },
  }
}

function hash(value: string) {
  return [...value].reduce((total, character) => total + character.charCodeAt(0), 0)
}

const profileColumns = [
  { name: 'id', dataType: 'int', numeric: true },
  { name: 'name', dataType: 'varchar', numeric: false },
  { name: 'status', dataType: 'varchar', numeric: false },
  { name: 'amount', dataType: 'decimal', numeric: true },
  { name: 'created_at', dataType: 'timestamp', numeric: false },
  { name: 'region', dataType: 'varchar', numeric: false },
  { name: 'quantity', dataType: 'int', numeric: true },
  { name: 'email', dataType: 'varchar', numeric: false },
]

export type ColumnProfile = {
  name: string
  dataType: string
  missingCount: number
  missingPct: string
  uniquePct: string
  mean: string
  stdDev: string
}

export function tableMetrics(table: SourceTable) {
  const seed = hash(table.id)
  const rows = 12000 + (seed % 88000)
  const missingPct = ((seed % 70) / 10).toFixed(1)
  const rules = (seed % 12) + 1
  return { rows, missingPct, rules }
}

export function columnProfiles(table: SourceTable): ColumnProfile[] {
  const start = hash(table.id) % 3
  const { rows } = tableMetrics(table)
  return profileColumns.slice(start, start + 6).map((column) => {
    const seed = hash(`${table.id}:${column.name}`)
    const missingPct = (seed % 120) / 10
    const uniquePct = column.numeric ? 80 + (seed % 20) : 15 + (seed % 50)
    return {
      name: column.name,
      dataType: column.dataType,
      missingCount: Math.round((rows * missingPct) / 100),
      missingPct: missingPct.toFixed(1),
      uniquePct: uniquePct.toFixed(1),
      mean: column.numeric ? ((seed % 5000) / 10).toFixed(1) : '—',
      stdDev: column.numeric ? ((seed % 800) / 10).toFixed(1) : '—',
    }
  })
}

export function tableMetadata(table: SourceTable, type: SourceType) {
  const family = schemaFamily(type)
  const columns = columnProfiles(table)
  if (family === 'bigquery') {
    return {
      headers: ['Column', 'Type', 'Mode'],
      rows: columns.map((column, index) => [
        column.name,
        column.dataType === 'int' ? 'INT64' : column.dataType === 'decimal' ? 'NUMERIC' : column.dataType === 'timestamp' ? 'TIMESTAMP' : 'STRING',
        index === 0 ? 'REQUIRED' : index === 3 ? 'REPEATED' : 'NULLABLE',
      ]),
    }
  }
  if (family === 'file') {
    return {
      headers: ['Column', 'Inferred type', 'Position'],
      rows: columns.map((column, index) => [column.name, column.dataType, String(index + 1)]),
    }
  }
  if (family === 'kafka') {
    return {
      headers: ['Field', 'Type'],
      rows: columns.map((column) => [column.name, column.dataType === 'int' ? 'int32' : column.dataType === 'decimal' ? 'double' : 'string']),
    }
  }
  if (family === 'document') {
    return {
      headers: ['Field', 'Native type'],
      rows: columns.map((column) => [
        column.name,
        column.dataType === 'int' ? 'int' : column.dataType === 'decimal' ? 'double' : column.dataType === 'timestamp' ? 'date' : 'string',
      ]),
    }
  }
  if (family === 'microstrategy') {
    return {
      headers: ['Name', 'Type'],
      rows: columns.map((column) => [column.name, column.dataType === 'decimal' || column.dataType === 'int' ? 'Metric' : 'Attribute']),
    }
  }
  return {
    headers: ['Column', 'Data type', 'Nullable', 'Length'],
    rows: columns.map((column, index) => {
      const length =
        column.dataType === 'varchar' ? String(20 + (hash(`${table.id}:${column.name}`) % 80)) : column.dataType === 'decimal' ? '18,2' : '—'
      return [column.name, column.dataType, index === 0 ? 'No' : 'Yes', length]
    }),
  }
}

export function microsegments(table: SourceTable) {
  const seed = hash(table.id)
  const { rows } = tableMetrics(table)
  const shares = [52 + (seed % 10), 28 + (seed % 8), 0]
  shares[2] = 100 - shares[0] - shares[1]
  const names = ['Current', 'Prior period', 'Unassigned']
  return names.map((name, index) => ({
    name,
    rows: Math.round((rows * shares[index]) / 100),
    share: shares[index],
  }))
}

export function correlations(table: SourceTable) {
  const columns = columnProfiles(table)
  const pairs = [
    [0, 3],
    [0, 5],
    [3, 5],
    [1, 2],
  ] as const
  return pairs.map(([left, right], index) => {
    const seed = hash(`${table.id}:corr:${index}`)
    return {
      left: columns[left]?.name ?? 'id',
      right: columns[right]?.name ?? 'amount',
      coefficient: (0.35 + (seed % 55) / 100).toFixed(2),
    }
  })
}

export function tableForNickname(nickname: string): SourceTable {
  for (const source of dataSources) {
    const match = source.tables.find((item) => item.nickname === nickname)
    if (match) return match
  }
  const slug = nickname.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'table'
  return table(`profile-${slug}`, nickname, slug.replace(/-/g, '_'), 12, true)
}

export function previewRows(table: SourceTable) {
  const columns = columnProfiles(table)
  return [1, 2, 3, 4].map((row) => {
    const record: Record<string, string> = {}
    for (const column of columns) {
      const seed = hash(`${table.id}:${column.name}:${row}`)
      if (column.dataType === 'int' || column.dataType === 'decimal') record[column.name] = String(1000 + seed)
      else if (column.dataType === 'timestamp') record[column.name] = `2026-0${row}-14`
      else if (column.name === 'status') record[column.name] = row % 2 === 0 ? 'Active' : 'Pending'
      else if (column.name === 'region') record[column.name] = ['East', 'West', 'North', 'South'][row - 1]
      else record[column.name] = `${column.name}-${row}`
    }
    return record
  })
}

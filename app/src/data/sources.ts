export type SourceType = 'BigQuery' | 'Teradata' | 'MSSQL' | 'Databricks'

export type SourceTable = {
  id: string
  nickname: string
  name: string
  columns: number
  approved: boolean
  description: string
  rowFilter: string
}

export type SourceConnection = {
  host: string
  port: string
  username: string
  createdOn: string
  encrypt: string
  logon: string
  project: string
  location: string
  serviceAccount: string
  workspaceUrl: string
  catalog: string
  warehouse: string
}

export type DataSource = {
  id: string
  name: string
  type: SourceType
  schema: string
  active: boolean
  connection: SourceConnection
  tables: SourceTable[]
}

function connection(partial: Partial<SourceConnection> & Pick<SourceConnection, 'username' | 'createdOn'>): SourceConnection {
  return {
    host: '',
    port: '',
    encrypt: '',
    logon: '',
    project: '',
    location: '',
    serviceAccount: '',
    workspaceUrl: '',
    catalog: '',
    warehouse: '',
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

export const dataSources: DataSource[] = [
  {
    id: 'acme-erp',
    name: 'Acme ERP',
    type: 'MSSQL',
    schema: 'erp.dbo',
    active: true,
    connection: connection({
      host: 'sql-erp.internal',
      port: '1433',
      username: 'erp_reader',
      createdOn: '12 Mar 2024',
      encrypt: 'Yes',
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
    connection: connection({
      username: 'analytics-job',
      createdOn: '3 Jan 2025',
      project: 'acme-analytics',
      location: 'US',
      serviceAccount: 'analytics@acme-analytics.iam.gserviceaccount.com',
    }),
    tables: [
      table('analytics-shipments', 'Shipments', 'shipments', 21, true),
      table('analytics-returns', 'Returns', 'returns', 16, true),
    ],
  },
  {
    id: 'finance-mart',
    name: 'Finance Mart',
    type: 'MSSQL',
    schema: 'finance.dbo',
    active: true,
    connection: connection({
      host: 'sql-finance.internal',
      port: '1433',
      username: 'finance_reader',
      createdOn: '18 Jun 2024',
      encrypt: 'Yes',
    }),
    tables: [
      table('finance-invoices', 'AR Invoices', 'ar_invoices', 29, true),
      table('finance-payments', 'AR Payments', 'ar_payments', 16, false),
    ],
  },
  {
    id: 'marketing-events',
    name: 'Marketing Events',
    type: 'BigQuery',
    schema: 'acme.events',
    active: false,
    connection: connection({
      username: 'events-job',
      createdOn: '9 Sep 2023',
      project: 'acme-marketing',
      location: 'EU',
      serviceAccount: 'events@acme-marketing.iam.gserviceaccount.com',
    }),
    tables: [table('marketing-campaigns', 'Campaigns', 'campaigns', 18, false)],
  },
  {
    id: 'staging-sandbox',
    name: 'Staging Sandbox',
    type: 'MSSQL',
    schema: 'stage.sandbox',
    active: true,
    connection: connection({
      host: 'sql-stage.internal',
      port: '1433',
      username: 'stage_reader',
      createdOn: '2 Feb 2025',
      encrypt: 'No',
    }),
    tables: [],
  },
  {
    id: 'peoplesoft-hr',
    name: 'PeopleSoft HR',
    type: 'MSSQL',
    schema: 'hr.dbo',
    active: true,
    connection: connection({
      host: 'sql-hr.internal',
      port: '1433',
      username: 'hr_reader',
      createdOn: '21 Nov 2023',
      encrypt: 'Yes',
    }),
    tables: [
      table('hr-workers', 'Workers', 'workers', 54, true),
      table('hr-positions', 'Positions', 'positions', 22, true),
    ],
  },
  {
    id: 'inventory-facts',
    name: 'Inventory Facts',
    type: 'Databricks',
    schema: 'inventory.gold',
    active: true,
    connection: connection({
      username: 'inventory-job',
      createdOn: '14 Apr 2025',
      workspaceUrl: 'https://acme.cloud.databricks.com',
      catalog: 'inventory',
      warehouse: 'ops-warehouse',
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
    connection: connection({
      host: 'sql-crm.internal',
      port: '1433',
      username: 'crm_reader',
      createdOn: '7 Aug 2024',
      encrypt: 'Yes',
    }),
    tables: [table('crm-accounts', 'Accounts', 'accounts', 33, true)],
  },
  {
    id: 'teradata-core',
    name: 'Teradata Core',
    type: 'Teradata',
    schema: 'edw_prod',
    active: false,
    connection: connection({
      host: 'td-edw.internal',
      port: '1025',
      username: 'edw_reader',
      createdOn: '30 May 2022',
      logon: 'TD2',
    }),
    tables: [
      table('teradata-ledger', 'General Ledger', 'gl_balances', 41, false),
      table('teradata-journals', 'Journals', 'gl_journals', 28, true),
    ],
  },
  {
    id: 'lakehouse-gold',
    name: 'Lakehouse Gold',
    type: 'Databricks',
    schema: 'lakehouse.gold',
    active: true,
    connection: connection({
      username: 'lakehouse-job',
      createdOn: '11 Dec 2024',
      workspaceUrl: 'https://acme-gold.cloud.databricks.com',
      catalog: 'lakehouse',
      warehouse: 'gold-warehouse',
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
    connection: connection({
      host: 'sql-billing.internal',
      port: '1433',
      username: 'billing_reader',
      createdOn: '4 May 2025',
      encrypt: 'Yes',
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
    connection: connection({
      host: 'td-claims.internal',
      port: '1025',
      username: 'claims_reader',
      createdOn: '16 Jan 2024',
      logon: 'LDAP',
    }),
    tables: [table('claims-headers', 'Claim Headers', 'claim_headers', 47, true)],
  },
  {
    id: 'clickstream',
    name: 'Clickstream',
    type: 'BigQuery',
    schema: 'acme.clickstream',
    active: true,
    connection: connection({
      username: 'clickstream-job',
      createdOn: '28 Jul 2025',
      project: 'acme-product',
      location: 'US',
      serviceAccount: 'clickstream@acme-product.iam.gserviceaccount.com',
    }),
    tables: [table('click-events', 'Events', 'events', 22, true)],
  },
  {
    id: 'supplier-hub',
    name: 'Supplier Hub',
    type: 'Databricks',
    schema: 'supplier.silver',
    active: false,
    connection: connection({
      username: 'supplier-job',
      createdOn: '9 Oct 2023',
      workspaceUrl: 'https://acme-supply.cloud.databricks.com',
      catalog: 'supplier',
      warehouse: 'silver-warehouse',
    }),
    tables: [table('supplier-master', 'Supplier Master', 'suppliers', 36, false)],
  },
  {
    id: 'payroll',
    name: 'Payroll',
    type: 'MSSQL',
    schema: 'payroll.dbo',
    active: true,
    connection: connection({
      host: 'sql-payroll.internal',
      port: '1433',
      username: 'payroll_reader',
      createdOn: '22 Feb 2024',
      encrypt: 'Yes',
    }),
    tables: [table('payroll-runs', 'Pay Runs', 'pay_runs', 28, true)],
  },
  {
    id: 'risk-store',
    name: 'Risk Store',
    type: 'Teradata',
    schema: 'risk_mart',
    active: true,
    connection: connection({
      host: 'td-risk.internal',
      port: '1025',
      username: 'risk_reader',
      createdOn: '1 Aug 2025',
      logon: 'TD2',
    }),
    tables: [table('risk-exposure', 'Exposure', 'exposure', 39, true)],
  },
]

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

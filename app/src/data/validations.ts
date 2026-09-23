export type ValidationRun = {
  id: string
  tableName: string
  sourceType: string
  schema: string
  run: number
  ranOn: string
  score: number
  failedChecks: number
}

export const validationRuns: ValidationRun[] = [
  { id: 'customers', tableName: 'Customer Master', sourceType: 'MSSQL', schema: 'erp.dbo', run: 7, ranOn: '19 Sep 2026', score: 98.4, failedChecks: 0 },
  { id: 'orders', tableName: 'Orders', sourceType: 'MSSQL', schema: 'erp.dbo', run: 7, ranOn: '19 Sep 2026', score: 91.9, failedChecks: 0 },
  { id: 'order-lines', tableName: 'Order Lines', sourceType: 'MSSQL', schema: 'erp.dbo', run: 6, ranOn: '18 Sep 2026', score: 86.6, failedChecks: 4 },
  { id: 'shipments', tableName: 'Shipments', sourceType: 'BigQuery', schema: 'acme.analytics', run: 5, ranOn: '19 Sep 2026', score: 99.7, failedChecks: 0 },
  { id: 'invoices', tableName: 'AR Invoices', sourceType: 'MSSQL', schema: 'finance.dbo', run: 5, ranOn: '19 Sep 2026', score: 88.3, failedChecks: 1 },
  { id: 'payments', tableName: 'AR Payments', sourceType: 'MSSQL', schema: 'finance.dbo', run: 5, ranOn: '18 Sep 2026', score: 84.6, failedChecks: 1 },
  { id: 'workers', tableName: 'Workers', sourceType: 'MSSQL', schema: 'hr.dbo', run: 4, ranOn: '17 Sep 2026', score: 100, failedChecks: 0 },
  { id: 'balances', tableName: 'Balances', sourceType: 'Databricks', schema: 'inventory.gold', run: 3, ranOn: '19 Sep 2026', score: 96.2, failedChecks: 0 },
  { id: 'ledger', tableName: 'General Ledger', sourceType: 'Teradata', schema: 'edw_prod', run: 5, ranOn: '10 Sep 2026', score: 0, failedChecks: 6 },
  { id: 'accounts', tableName: 'Accounts', sourceType: 'MSSQL', schema: 'crm.dbo', run: 8, ranOn: '19 Sep 2026', score: 93.1, failedChecks: 0 },
  { id: 'positions', tableName: 'Positions', sourceType: 'MSSQL', schema: 'hr.dbo', run: 4, ranOn: '17 Sep 2026', score: 97.2, failedChecks: 0 },
  { id: 'returns', tableName: 'Returns', sourceType: 'BigQuery', schema: 'acme.analytics', run: 5, ranOn: '19 Sep 2026', score: 90.4, failedChecks: 0 },
  { id: 'movements', tableName: 'Movements', sourceType: 'Databricks', schema: 'inventory.gold', run: 3, ranOn: '16 Sep 2026', score: 81.2, failedChecks: 2 },
  { id: 'journals', tableName: 'Journals', sourceType: 'Teradata', schema: 'edw_prod', run: 5, ranOn: '10 Sep 2026', score: 76.5, failedChecks: 3 },
  { id: 'products', tableName: 'Products', sourceType: 'Databricks', schema: 'lakehouse.gold', run: 6, ranOn: '19 Sep 2026', score: 99.1, failedChecks: 0 },
  { id: 'customer-360', tableName: 'Customer 360', sourceType: 'Databricks', schema: 'lakehouse.gold', run: 6, ranOn: '19 Sep 2026', score: 94.8, failedChecks: 0 },
  { id: 'campaigns', tableName: 'Campaigns', sourceType: 'BigQuery', schema: 'acme.events', run: 2, ranOn: '12 Sep 2026', score: 62.4, failedChecks: 5 },
  { id: 'vendors', tableName: 'Vendors', sourceType: 'MSSQL', schema: 'erp.dbo', run: 7, ranOn: '19 Sep 2026', score: 97.8, failedChecks: 0 },
]

export function scoreTone(run: ValidationRun) {
  if (run.failedChecks > 0 || run.score < 50) return 'danger' as const
  if (run.score >= 95) return 'success' as const
  return 'warning' as const
}

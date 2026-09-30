export type TableKind = 'direct' | 'derived' | 'reference'

export type ValidationRun = {
  id: string
  validationId: string
  validationName: string
  tableName: string
  tableKind: TableKind
  sourceType: string
  schema: string
  run: number
  ranOn: string
  score: number
  failedChecks: number
}

export const validationRuns: ValidationRun[] = [
  { id: 'customers', validationId: 'VAL-0001', validationName: 'Customer_Master_Validation', tableName: 'Customer Master', tableKind: 'direct', sourceType: 'MSSQL', schema: 'erp.dbo', run: 7, ranOn: '19 Sep 2026', score: 98.4, failedChecks: 0 },
  { id: 'orders', validationId: 'VAL-0002', validationName: 'Orders_Validation', tableName: 'Orders', tableKind: 'direct', sourceType: 'MSSQL', schema: 'erp.dbo', run: 7, ranOn: '19 Sep 2026', score: 91.9, failedChecks: 0 },
  { id: 'order-lines', validationId: 'VAL-0003', validationName: 'Order_Lines_Validation', tableName: 'Order Lines', tableKind: 'direct', sourceType: 'MSSQL', schema: 'erp.dbo', run: 6, ranOn: '18 Sep 2026', score: 86.6, failedChecks: 4 },
  { id: 'shipments', validationId: 'VAL-0004', validationName: 'Shipments_Validation', tableName: 'Shipments', tableKind: 'direct', sourceType: 'BigQuery', schema: 'acme.analytics', run: 5, ranOn: '19 Sep 2026', score: 99.7, failedChecks: 0 },
  { id: 'invoices', validationId: 'VAL-0005', validationName: 'AR_Invoices_Validation', tableName: 'AR Invoices', tableKind: 'direct', sourceType: 'MSSQL', schema: 'finance.dbo', run: 5, ranOn: '19 Sep 2026', score: 88.3, failedChecks: 1 },
  { id: 'payments', validationId: 'VAL-0006', validationName: 'AR_Payments_Validation', tableName: 'AR Payments', tableKind: 'direct', sourceType: 'MSSQL', schema: 'finance.dbo', run: 5, ranOn: '18 Sep 2026', score: 84.6, failedChecks: 1 },
  { id: 'workers', validationId: 'VAL-0007', validationName: 'Workers_Validation', tableName: 'Workers', tableKind: 'direct', sourceType: 'MSSQL', schema: 'hr.dbo', run: 4, ranOn: '17 Sep 2026', score: 100, failedChecks: 0 },
  { id: 'balances', validationId: 'VAL-0008', validationName: 'Balances_Validation', tableName: 'Balances', tableKind: 'direct', sourceType: 'Databricks', schema: 'inventory.gold', run: 3, ranOn: '19 Sep 2026', score: 96.2, failedChecks: 0 },
  { id: 'ledger', validationId: 'VAL-0009', validationName: 'General_Ledger_Validation', tableName: 'General Ledger', tableKind: 'direct', sourceType: 'Teradata', schema: 'edw_prod', run: 5, ranOn: '10 Sep 2026', score: 0, failedChecks: 6 },
  { id: 'accounts', validationId: 'VAL-0010', validationName: 'Accounts_Validation', tableName: 'Accounts', tableKind: 'reference', sourceType: 'MSSQL', schema: 'crm.dbo', run: 8, ranOn: '19 Sep 2026', score: 93.1, failedChecks: 0 },
  { id: 'positions', validationId: 'VAL-0011', validationName: 'Positions_Validation', tableName: 'Positions', tableKind: 'reference', sourceType: 'MSSQL', schema: 'hr.dbo', run: 4, ranOn: '17 Sep 2026', score: 97.2, failedChecks: 0 },
  { id: 'returns', validationId: 'VAL-0012', validationName: 'Returns_Validation', tableName: 'Returns', tableKind: 'direct', sourceType: 'BigQuery', schema: 'acme.analytics', run: 5, ranOn: '19 Sep 2026', score: 90.4, failedChecks: 0 },
  { id: 'movements', validationId: 'VAL-0013', validationName: 'Movements_Validation', tableName: 'Movements', tableKind: 'derived', sourceType: 'Databricks', schema: 'inventory.gold', run: 3, ranOn: '16 Sep 2026', score: 81.2, failedChecks: 2 },
  { id: 'journals', validationId: 'VAL-0014', validationName: 'Journals_Validation', tableName: 'Journals', tableKind: 'direct', sourceType: 'Teradata', schema: 'edw_prod', run: 5, ranOn: '10 Sep 2026', score: 76.5, failedChecks: 3 },
  { id: 'products', validationId: 'VAL-0015', validationName: 'Products_Validation', tableName: 'Products', tableKind: 'reference', sourceType: 'Databricks', schema: 'lakehouse.gold', run: 6, ranOn: '19 Sep 2026', score: 99.1, failedChecks: 0 },
  { id: 'customer-360', validationId: 'VAL-0016', validationName: 'Customer_360_Validation', tableName: 'Customer 360', tableKind: 'derived', sourceType: 'Databricks', schema: 'lakehouse.gold', run: 6, ranOn: '19 Sep 2026', score: 94.8, failedChecks: 0 },
  { id: 'campaigns', validationId: 'VAL-0017', validationName: 'Campaigns_Validation', tableName: 'Campaigns', tableKind: 'derived', sourceType: 'BigQuery', schema: 'acme.events', run: 2, ranOn: '12 Sep 2026', score: 62.4, failedChecks: 5 },
  { id: 'vendors', validationId: 'VAL-0018', validationName: 'Vendors_Validation', tableName: 'Vendors', tableKind: 'reference', sourceType: 'MSSQL', schema: 'erp.dbo', run: 7, ranOn: '19 Sep 2026', score: 97.8, failedChecks: 0 },
]

export function scoreTone(run: ValidationRun) {
  if (run.failedChecks > 0 || run.score < 50) return 'danger' as const
  if (run.score >= 95) return 'success' as const
  return 'warning' as const
}

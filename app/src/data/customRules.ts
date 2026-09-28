export type CustomRule = {
  id: string
  name: string
  expression: string
  description: string
  domain: string
  sourceValidation: string
  usedIn: number
}

export const libraryCustomRules: CustomRule[] = [
  {
    id: 'amount-positive',
    name: 'amount_positive_check',
    expression: 'amount > 0',
    description: 'Invoice and payment amounts must be greater than zero.',
    domain: 'Finance',
    sourceValidation: 'AR Invoices',
    usedIn: 4,
  },
  {
    id: 'currency-combo',
    name: 'currency_amount_combo',
    expression: 'currency IS NOT NULL AND amount IS NOT NULL',
    description: 'Currency and amount must be present together.',
    domain: 'Finance',
    sourceValidation: 'AR Payments',
    usedIn: 3,
  },
  {
    id: 'future-sale-date',
    name: 'future_sale_date',
    expression: 'order_date <= CURRENT_DATE',
    description: 'Sale dates cannot be in the future.',
    domain: 'Finance',
    sourceValidation: 'Orders',
    usedIn: 2,
  },
  {
    id: 'duplicate-sale-id',
    name: 'duplicate_sale_id',
    expression: 'COUNT(*) OVER (PARTITION BY order_id) = 1',
    description: 'Order identifiers must be unique.',
    domain: 'Customer',
    sourceValidation: 'Orders',
    usedIn: 5,
  },
  {
    id: 'product-region',
    name: 'product_region_valid',
    expression: "region IN ('NA', 'EMEA', 'APAC', 'LATAM')",
    description: 'Product region must match the approved list.',
    domain: 'Inventory',
    sourceValidation: 'Products',
    usedIn: 2,
  },
  {
    id: 'discount-auth',
    name: 'discount_auth_check',
    expression: 'discount_pct <= 40 OR authorized = 1',
    description: 'Discounts above 40% require authorization.',
    domain: 'Finance',
    sourceValidation: 'Order Lines',
    usedIn: 1,
  },
  {
    id: 'email-format',
    name: 'email_format_check',
    expression: "email LIKE '%_@_%.__%'",
    description: 'Email addresses must contain a valid mailbox pattern.',
    domain: 'Customer',
    sourceValidation: 'Customer Master',
    usedIn: 6,
  },
  {
    id: 'status-open-closed',
    name: 'status_allowed_values',
    expression: "status IN ('Open', 'Closed', 'Pending', 'Cancelled')",
    description: 'Status must be one of the allowed workflow values.',
    domain: 'Operations',
    sourceValidation: 'Shipments',
    usedIn: 4,
  },
  {
    id: 'hire-before-end',
    name: 'hire_before_end_date',
    expression: 'end_date IS NULL OR end_date >= start_date',
    description: 'Position end date cannot precede the start date.',
    domain: 'People',
    sourceValidation: 'Positions',
    usedIn: 2,
  },
  {
    id: 'on-hand-nonneg',
    name: 'on_hand_non_negative',
    expression: 'on_hand >= 0',
    description: 'On-hand inventory cannot be negative.',
    domain: 'Inventory',
    sourceValidation: 'Balances',
    usedIn: 3,
  },
  {
    id: 'credit-limit',
    name: 'credit_limit_positive',
    expression: 'credit_limit >= 0',
    description: 'Customer credit limit cannot be negative.',
    domain: 'Customer',
    sourceValidation: 'Customer Master',
    usedIn: 2,
  },
  {
    id: 'journal-balanced',
    name: 'journal_debit_credit_balance',
    expression: 'ABS(debit - credit) < 0.01 OR posted = 0',
    description: 'Posted journal lines must balance debit and credit.',
    domain: 'Finance',
    sourceValidation: 'Journals',
    usedIn: 3,
  },
]

export function suggestedCustomRuleIds(domain: string, tableName: string) {
  const table = tableName.toLowerCase()
  const ranked = libraryCustomRules
    .map((rule) => {
      let score = 0
      if (domain && rule.domain === domain) score += 2
      if (rule.sourceValidation.toLowerCase().includes(table) || table.includes(rule.sourceValidation.toLowerCase())) score += 3
      return { id: rule.id, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
  const picked = ranked.slice(0, 2).map((item) => item.id)
  if (picked.length > 0) return picked
  return libraryCustomRules.slice(0, 2).map((rule) => rule.id)
}

export function proposeCustomRules(
  columns: { name: string; format: string }[],
  tableName: string,
  domain: string,
): CustomRule[] {
  const proposals: CustomRule[] = []
  const email = columns.find((column) => column.name.toLowerCase().includes('email'))
  if (email) {
    proposals.push({
      id: `ai-${email.name}`,
      name: `${email.name}_format_check`,
      expression: `${email.name} LIKE '%_@_%.__%'`,
      description: `Generated from ${tableName}: ${email.name} should look like an email.`,
      domain: domain || 'Customer',
      sourceValidation: tableName,
      usedIn: 0,
    })
  }
  const amount = columns.find((column) => /amount|total|balance|price|salary|spend|limit/.test(column.name.toLowerCase()))
  if (amount) {
    proposals.push({
      id: `ai-${amount.name}`,
      name: `${amount.name}_positive_check`,
      expression: `${amount.name} >= 0`,
      description: `Generated from ${tableName}: ${amount.name} should not be negative.`,
      domain: domain || 'Finance',
      sourceValidation: tableName,
      usedIn: 0,
    })
  }
  const date = columns.find((column) => column.format === 'Date')
  if (date) {
    proposals.push({
      id: `ai-${date.name}`,
      name: `${date.name}_not_future`,
      expression: `${date.name} <= CURRENT_DATE`,
      description: `Generated from ${tableName}: ${date.name} should not be in the future.`,
      domain: domain || 'Operations',
      sourceValidation: tableName,
      usedIn: 0,
    })
  }
  const status = columns.find((column) => column.name.toLowerCase().includes('status'))
  if (status && proposals.length < 3) {
    proposals.push({
      id: `ai-${status.name}`,
      name: `${status.name}_not_blank`,
      expression: `${status.name} IS NOT NULL AND TRIM(${status.name}) <> ''`,
      description: `Generated from ${tableName}: ${status.name} should always be populated.`,
      domain: domain || 'Operations',
      sourceValidation: tableName,
      usedIn: 0,
    })
  }
  if (proposals.length === 0) {
    const first = columns[0]
    if (first) {
      proposals.push({
        id: `ai-${first.name}`,
        name: `${first.name}_present`,
        expression: `${first.name} IS NOT NULL`,
        description: `Generated from ${tableName}: ${first.name} should be present on every row.`,
        domain: domain || 'Operations',
        sourceValidation: tableName,
        usedIn: 0,
      })
    }
  }
  return proposals.slice(0, 3)
}

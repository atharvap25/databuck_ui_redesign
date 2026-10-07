import { replyFor, type AgentAction, type Citation, type InsightItem } from './aiMocks.ts'
import type { AiFocus } from '../ai/WorkspaceAiContext.tsx'

export type AgentRole = 'agent' | 'user'

export type AgentMessage = {
  id: string
  role: AgentRole
  text: string
  pending?: boolean
  citations?: Citation[]
  insights?: InsightItem[]
  actions?: AgentAction[]
}

export type AgentThread = {
  id: string
  title: string
  group: 'Today' | 'Yesterday' | 'Last 7 days' | 'Earlier'
  messages: AgentMessage[]
}

export { agentGreeting, agentPrompts } from './aiMocks.ts'

export const agentHistory: AgentThread[] = [
  {
    id: 'null-rate',
    title: 'Null rate on customer_id',
    group: 'Today',
    messages: [
      { id: 'n1', role: 'user', text: 'Why is customer_id failing the null check?' },
      {
        id: 'n2',
        role: 'agent',
        text: 'Customer Master is at 98.4% DTS with no failed checks on the open run. customer_id is marked critical; treat a future null miss as a publish blocker.',
        citations: [{ label: 'Null check · customer_id' }],
      },
    ],
  },
  {
    id: 'dts-drop',
    title: 'DTS drop on Campaigns',
    group: 'Today',
    messages: [
      { id: 'd1', role: 'user', text: 'Campaigns DTS fell to 62%. What changed?' },
      {
        id: 'd2',
        role: 'agent',
        text: 'Campaigns is at 62.4% with five failed checks. Email nulls and spend drift versus the 12 Sep baseline account for most of the drop.',
        citations: [{ label: 'Null check · email' }, { label: 'Data drift · spend' }],
        actions: [{ id: 'review', label: "Open Buck's Review" }],
      },
    ],
  },
  {
    id: 'critical-flags',
    title: 'Critical flags on Orders',
    group: 'Yesterday',
    messages: [
      { id: 'c1', role: 'user', text: 'Which columns are marked critical on Orders?' },
      {
        id: 'c2',
        role: 'agent',
        text: 'Critical columns on Orders are the identifier and amount fields used in null, duplicate, and anomaly checks.',
        citations: [{ label: 'Duplicate check · order_id' }],
      },
    ],
  },
  {
    id: 'reprofile',
    title: 'When to enable reprofiling',
    group: 'Last 7 days',
    messages: [
      { id: 'r1', role: 'user', text: 'Should I enable reprofiling for Finance Mart?' },
      {
        id: 'r2',
        role: 'agent',
        text: 'Enable reprofiling after a schema change or a truncated extract. Finance nightly at 02:00 is the usual window.',
        citations: [{ label: 'Configure · reprofiling' }],
      },
    ],
  },
  {
    id: 'schema-drift',
    title: 'Schema drift on Shipments',
    group: 'Earlier',
    messages: [
      { id: 's1', role: 'user', text: 'Did Shipments pick up a new column this week?' },
      {
        id: 's2',
        role: 'agent',
        text: 'Yes. discount_code and channel appeared since the last profile. Refresh metadata before the next validation.',
        citations: [{ label: 'Profile · schema digest' }],
      },
    ],
  },
]

export const agentHistoryGroups: AgentThread['group'][] = ['Today', 'Yesterday', 'Last 7 days', 'Earlier']

let nextChatId = 1

export function nextAgentMessageId() {
  return `msg-${nextChatId++}`
}

export function appendUserTurn(messages: AgentMessage[], text: string): { messages: AgentMessage[]; pendingId: string } {
  const question = text.trim()
  if (!question) return { messages, pendingId: '' }
  const pendingId = nextAgentMessageId()
  return {
    pendingId,
    messages: [
      ...messages,
      { id: nextAgentMessageId(), role: 'user', text: question },
      { id: pendingId, role: 'agent', text: '', pending: true },
    ],
  }
}

export function settleAgentTurn(messages: AgentMessage[], pendingId: string, focus: AiFocus, question: string): AgentMessage[] {
  const reply = replyFor(question, focus)
  return messages.map((message) => (message.id === pendingId ? { ...message, ...reply, pending: false } : message))
}

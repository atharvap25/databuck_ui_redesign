export type AgentRole = 'agent' | 'user'

export type AgentMessage = {
  id: string
  role: AgentRole
  text: string
}

export type AgentThread = {
  id: string
  title: string
  group: 'Today' | 'Yesterday' | 'Last 7 days' | 'Earlier'
  messages: AgentMessage[]
}

export const agentGreeting = 'Ask about a check, a threshold, or a failing column.'

export const agentPreviewReply =
  'This preview cannot analyze the open validation. The question stays here for when a live model is connected.'

export const agentPrompts = [
  'Why did a check fail?',
  'Which columns are critical?',
  'Explain this DTS score',
  'Summarize sensitive columns',
]

export const agentHistory: AgentThread[] = [
  {
    id: 'null-rate',
    title: 'Null rate on customer_id',
    group: 'Today',
    messages: [
      { id: 'n1', role: 'user', text: 'Why is customer_id failing the null check?' },
      { id: 'n2', role: 'agent', text: agentPreviewReply },
    ],
  },
  {
    id: 'dts-drop',
    title: 'DTS drop on Campaigns',
    group: 'Today',
    messages: [
      { id: 'd1', role: 'user', text: 'Campaigns DTS fell to 62%. What changed?' },
      { id: 'd2', role: 'agent', text: agentPreviewReply },
    ],
  },
  {
    id: 'critical-flags',
    title: 'Critical flags on Orders',
    group: 'Yesterday',
    messages: [
      { id: 'c1', role: 'user', text: 'Which columns are marked critical on Orders?' },
      { id: 'c2', role: 'agent', text: agentPreviewReply },
    ],
  },
  {
    id: 'reprofile',
    title: 'When to enable reprofiling',
    group: 'Last 7 days',
    messages: [
      { id: 'r1', role: 'user', text: 'Should I enable reprofiling for Finance Mart?' },
      { id: 'r2', role: 'agent', text: agentPreviewReply },
    ],
  },
  {
    id: 'schema-drift',
    title: 'Schema drift on Shipments',
    group: 'Earlier',
    messages: [
      { id: 's1', role: 'user', text: 'Did Shipments pick up a new column this week?' },
      { id: 's2', role: 'agent', text: agentPreviewReply },
    ],
  },
]

export const agentHistoryGroups: AgentThread['group'][] = ['Today', 'Yesterday', 'Last 7 days', 'Earlier']

let nextChatId = 1

export function nextAgentMessageId() {
  return `msg-${nextChatId++}`
}

export function appendPreviewTurn(messages: AgentMessage[], text: string): AgentMessage[] {
  const question = text.trim()
  if (!question) return messages
  return [
    ...messages,
    { id: nextAgentMessageId(), role: 'user', text: question },
    { id: nextAgentMessageId(), role: 'agent', text: agentPreviewReply },
  ]
}

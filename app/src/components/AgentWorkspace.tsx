import { useState } from 'react'
import { useWorkspaceAi } from '../ai/WorkspaceAiContext.tsx'
import type { AgentAction } from '../data/aiMocks.ts'
import {
  agentHistory,
  agentHistoryGroups,
  appendUserTurn,
  settleAgentTurn,
  type AgentMessage,
  type AgentThread,
} from '../data/agentChat.ts'
import { ChatComposer, ChatMessage, PromptCards } from './AgentChat.tsx'
import { PlusIcon } from './icons.tsx'
import Mark from './Mark.tsx'

function lastUserSnippet(thread: AgentThread, overlay?: AgentMessage[]) {
  const messages = overlay ?? thread.messages
  const last = [...messages].reverse().find((message) => message.role === 'user')
  return last?.text ?? ''
}

export default function AgentWorkspace() {
  const { focus, requestReview, requestRca } = useWorkspaceAi()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, AgentMessage[]>>({})
  const active = activeId ? agentHistory.find((thread) => thread.id === activeId) ?? null : null
  const messages = activeId ? (drafts[activeId] ?? active?.messages ?? []) : []
  const started = messages.some((message) => message.role === 'user')
  const threadTitle = active && activeId !== 'draft' ? active.title : null

  function onAction(action: AgentAction) {
    if (action.id === 'review') requestReview(action.target ?? focus.validationId ?? 'campaigns')
    if (action.id === 'rca') requestRca(action.target ?? focus.validationId ?? 'campaigns')
  }

  function openNew() {
    setActiveId(null)
    setDrafts((current) => {
      const next = { ...current }
      delete next.draft
      return next
    })
  }

  function send(text: string) {
    const question = text.trim()
    if (!question) return
    const key = activeId ?? 'draft'
    if (!activeId) setActiveId('draft')
    let pendingId = ''
    setDrafts((current) => {
      const base =
        current[key] ??
        (key === 'draft' ? [] : (agentHistory.find((thread) => thread.id === key)?.messages ?? []))
      const next = appendUserTurn(base, question)
      pendingId = next.pendingId
      return { ...current, [key]: next.messages }
    })
    window.setTimeout(() => {
      setDrafts((current) => {
        const base = current[key]
        if (!base) return current
        return { ...current, [key]: settleAgentTurn(base, pendingId, focus, question) }
      })
    }, 700)
  }

  return (
    <div className="flex min-h-0 flex-1 bg-surface">
      <aside className="flex w-72 shrink-0 flex-col border-r border-line bg-canvas">
        <div className="flex shrink-0 flex-col gap-3 border-b border-line px-3 py-3">
          <h2 className="px-1 font-sans text-sm font-semibold text-ink">Chats</h2>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-indigo font-sans text-sm font-medium text-white transition-colors duration-150 ease-databuck hover:bg-indigo-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <PlusIcon size={16} />
            New chat
          </button>
        </div>
        <div className="db-scroll min-h-0 flex-1 overflow-y-auto px-2 py-3">
          {agentHistoryGroups.map((group) => {
            const rows = agentHistory.filter((thread) => thread.group === group)
            if (rows.length === 0) return null
            return (
              <div key={group} className="mb-4">
                <p className="px-2 pb-1.5 font-label text-[0.6875rem] font-medium tracking-[0.08em] text-muted uppercase">
                  {group}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {rows.map((thread) => {
                    const selected = activeId === thread.id
                    const snippet = lastUserSnippet(thread, drafts[thread.id])
                    return (
                      <li key={thread.id}>
                        <button
                          type="button"
                          aria-current={selected ? 'true' : undefined}
                          onClick={() => setActiveId(thread.id)}
                          className={`w-full rounded-md px-2 py-2 text-left transition-colors duration-150 ease-databuck focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ${
                            selected ? 'bg-secondary-fixed' : 'hover:bg-surface'
                          }`}
                        >
                          <span className={`block truncate font-sans text-sm ${selected ? 'font-medium text-indigo' : 'text-ink'}`}>
                            {thread.title}
                          </span>
                          {snippet ? (
                            <span className="mt-0.5 block truncate text-xs text-muted">{snippet}</span>
                          ) : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-canvas">
        {started ? (
          <ChatThread title={threadTitle} messages={messages} onAction={onAction} />
        ) : (
          <EmptyChat onSend={send} />
        )}
        <div className="shrink-0 px-6 py-4">
          <div className="mx-auto max-w-3xl">
            <ChatComposer onSend={send} />
          </div>
        </div>
      </section>
    </div>
  )
}

function EmptyChat({ onSend }: { onSend: (text: string) => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-xl">
        <div className="flex flex-col items-center text-center">
          <Mark className="size-12" />
          <h1 className="mt-4 font-sans text-2xl font-bold tracking-[-0.02em] text-ink">What should we look at?</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted">
            Ask about a failing check, a DTS drop, or a column. Suggestions start a chat.
          </p>
        </div>
        <div className="mt-8">
          <PromptCards onSend={onSend} />
        </div>
      </div>
    </div>
  )
}

function ChatThread({
  title,
  messages,
  onAction,
}: {
  title: string | null
  messages: AgentMessage[]
  onAction: (action: AgentAction) => void
}) {
  return (
    <div className="db-scroll min-h-0 flex-1 overflow-y-auto px-6 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {title ? (
          <h1 className="font-sans text-base font-semibold tracking-[-0.02em] text-ink">{title}</h1>
        ) : null}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} onAction={onAction} />
        ))}
      </div>
    </div>
  )
}

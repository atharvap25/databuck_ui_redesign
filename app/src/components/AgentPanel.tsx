import { useRef, useState } from 'react'
import { agentGreeting, appendPreviewTurn, type AgentMessage } from '../data/agentChat.ts'
import { ChatComposer, ChatMessage, PromptCards } from './AgentChat.tsx'
import { ExpandIcon } from './icons.tsx'
import Mark from './Mark.tsx'

export default function AgentPanel({
  onClose,
  onOpenWorkspace,
}: {
  onClose: () => void
  onOpenWorkspace: () => void
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<AgentMessage[]>([
    { id: 'panel-hello', role: 'agent', text: agentGreeting },
  ])
  const started = messages.some((message) => message.role === 'user')

  function send(text: string) {
    const question = text.trim()
    if (!question) return
    setMessages((current) => appendPreviewTurn(current, question))
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
    })
  }

  return (
    <aside className="absolute inset-0 z-30 flex min-h-0 flex-col border-l border-line bg-canvas shadow-overlay md:static md:w-[400px] md:shrink-0">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-4">
        <Mark className="size-8" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-sans text-sm font-semibold text-ink">Data Trust Agent</h2>
          <p className="truncate text-xs text-muted">Ask about data trust</p>
        </div>
        <button
          type="button"
          onClick={onOpenWorkspace}
          aria-label="Open Data Trust Agent window"
          className="inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors duration-150 ease-databuck hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
        >
          <ExpandIcon />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Data Trust Agent"
          className="inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors duration-150 ease-databuck hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div ref={listRef} className="db-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {started ? null : <PromptCards onSend={send} columns={1} />}
        </div>
      </div>

      <div className="shrink-0 px-4 py-3">
        <ChatComposer onSend={send} />
      </div>
    </aside>
  )
}

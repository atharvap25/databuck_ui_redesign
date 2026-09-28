import { useId, useRef, useState, type FormEvent } from 'react'
import { SparkIcon } from './icons.tsx'

type ChatMessage = {
  id: number
  role: 'agent' | 'user'
  text: string
}

const prompts = ['Why did a check fail?', 'Which columns are critical?', 'Explain this DTS score']

const greeting = 'Ask about a check, a threshold, or a failing column.'

const previewReply =
  'This preview cannot analyze the open validation. The question stays here for when a live model is connected.'

let nextMessageId = 1

export default function AgentPanel({ onClose }: { onClose: () => void }) {
  const inputId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: nextMessageId++, role: 'agent', text: greeting }])

  function send(text: string) {
    const question = text.trim()
    if (!question) return
    setMessages((current) => [
      ...current,
      { id: nextMessageId++, role: 'user', text: question },
      { id: nextMessageId++, role: 'agent', text: previewReply },
    ])
    setDraft('')
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
    })
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    send(draft)
  }

  return (
    <aside className="absolute inset-0 z-30 flex min-h-0 flex-col border-l border-line bg-canvas shadow-overlay md:static md:w-[400px] md:shrink-0">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-4">
        <span className="inline-flex size-8 items-center justify-center rounded-md bg-indigo text-white">
          <SparkIcon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-sans text-sm font-semibold text-ink">Data Trust Agent</h2>
          <p className="truncate text-xs text-muted">Ask about data trust</p>
        </div>
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

      <div ref={listRef} className="db-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <p
            key={message.id}
            className={
              message.role === 'user'
                ? 'ml-8 rounded-lg bg-indigo px-3 py-2 text-sm leading-6 text-white'
                : 'mr-8 rounded-lg border border-line bg-surface px-3 py-2 text-sm leading-6 text-ink'
            }
          >
            {message.text}
          </p>
        ))}
      </div>

      <div className="shrink-0 border-t border-line px-4 py-3">
        <div className="mb-3 flex flex-wrap gap-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => send(prompt)}
              className="rounded-md border border-line bg-canvas px-2 py-1 text-left font-sans text-xs text-ink transition-colors duration-150 ease-databuck hover:border-line-strong hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
            >
              {prompt}
            </button>
          ))}
        </div>
        <form onSubmit={onSubmit} className="flex items-end gap-2">
          <label htmlFor={inputId} className="sr-only">
            Message
          </label>
          <textarea
            id={inputId}
            rows={2}
            value={draft}
            placeholder="Ask a question"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                send(draft)
              }
            }}
            className="min-h-11 flex-1 resize-none rounded-md border border-line bg-canvas px-3 py-2 font-sans text-sm text-ink transition-colors duration-150 ease-databuck focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
          />
          <button
            type="submit"
            disabled={draft.trim() === ''}
            className="inline-flex h-11 items-center rounded-md bg-indigo px-3 font-sans text-sm font-medium text-white transition-colors duration-150 ease-databuck hover:bg-indigo-hover disabled:bg-container-high disabled:text-outline"
          >
            Send
          </button>
        </form>
      </div>
    </aside>
  )
}

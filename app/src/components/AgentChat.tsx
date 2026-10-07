import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { AgentAction } from '../data/aiMocks.ts'
import { agentPrompts, type AgentMessage } from '../data/agentChat.ts'
import { SendIcon } from './icons.tsx'
import Mark from './Mark.tsx'

export function ChatMessage({
  message,
  onAction,
}: {
  message: AgentMessage
  onAction?: (action: AgentAction) => void
}) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-lg bg-secondary-fixed px-3 py-2 font-sans text-sm leading-6 text-ink">
          {message.text}
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <Mark className="size-8" />
      <div className="min-w-0 flex-1">
        <p className="font-label text-[0.6875rem] font-medium tracking-[0.08em] text-muted uppercase">Data Trust Agent</p>
        <div className="mt-1.5 rounded-lg border border-line bg-surface px-3 py-2">
          {message.pending ? (
            <p className="animate-pulse font-sans text-sm leading-6 text-muted">Reviewing the open table…</p>
          ) : (
            <p className="font-sans text-sm leading-6 text-ink">{message.text}</p>
          )}
          {message.citations && message.citations.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {message.citations.map((citation) => (
                <span
                  key={citation.label}
                  title={citation.hint}
                  className="rounded-full border border-line bg-canvas px-2 py-0.5 font-label text-[0.625rem] tracking-[0.06em] text-muted uppercase"
                >
                  {citation.label}
                </span>
              ))}
            </div>
          ) : null}
          {message.insights?.map((insight) => (
            <div key={insight.title} className="mt-2 rounded-md border border-line bg-canvas px-2.5 py-2">
              <p className="font-sans text-xs font-semibold text-ink">{insight.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-muted">{insight.body}</p>
            </div>
          ))}
          {message.actions && onAction ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.actions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => onAction(action)}
                  className="font-sans text-xs font-medium text-indigo hover:text-indigo-hover"
                >
                  {action.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function PromptCards({
  onSend,
  columns = 2,
}: {
  onSend: (text: string) => void
  columns?: 1 | 2
}) {
  return (
    <div className={`grid gap-2 ${columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
      {agentPrompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSend(prompt)}
          className="rounded-lg border border-line bg-canvas px-3 py-3 text-left font-sans text-sm leading-5 text-ink transition-colors duration-150 ease-databuck hover:border-line-strong hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
        >
          {prompt}
        </button>
      ))}
    </div>
  )
}

export function ChatComposer({ onSend }: { onSend: (text: string) => void }) {
  const inputId = useId()
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    const area = areaRef.current
    if (!area) return
    area.style.height = 'auto'
    area.style.height = `${Math.min(area.scrollHeight, 160)}px`
  }, [draft])

  function submit() {
    const text = draft.trim()
    if (!text) return
    onSend(text)
    setDraft('')
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    submit()
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="rounded-lg border border-line bg-canvas shadow-card focus-within:border-line-strong focus-within:ring-2 focus-within:ring-indigo">
        <label htmlFor={inputId} className="sr-only">
          Message
        </label>
        <textarea
          ref={areaRef}
          id={inputId}
          rows={1}
          value={draft}
          placeholder="Ask about a check, a DTS drop, or a column"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              submit()
            }
          }}
          className="block max-h-40 min-h-11 w-full resize-none bg-transparent px-3 py-2.5 font-sans text-sm leading-6 text-ink focus:outline-none"
        />
        <div className="flex items-center justify-between gap-3 px-2 pb-2">
          <p className="px-1 font-sans text-xs text-muted">Enter to send · Shift+Enter for a new line</p>
          <button
            type="submit"
            aria-label="Send"
            disabled={draft.trim() === ''}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-indigo text-white transition-colors duration-150 ease-databuck hover:bg-indigo-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:bg-container-high disabled:text-outline"
          >
            <SendIcon size={16} />
          </button>
        </div>
      </div>
    </form>
  )
}

import { createContext, createElement, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useAdmin } from '../admin/adminStore.ts'

export type AiScreen =
  | 'connections'
  | 'quality'
  | 'matching'
  | 'jobs'
  | 'admin'
  | 'dashboard'
  | 'observability'
  | 'agent'
  | 'other'

export type AiFocus = {
  screen: AiScreen
  sourceName?: string
  tableName?: string
  validationId?: string
  validationName?: string
  dts?: number
  failedChecks?: number
  matchingId?: string
  matchingName?: string
  matchRate?: number
  unmatched?: number
}

const idleFocus: AiFocus = { screen: 'other' }

type WorkspaceAiValue = {
  enabled: boolean
  focus: AiFocus
  setFocus: (focus: AiFocus) => void
  openAgent: () => void
  askAgent: (text: string) => void
  pendingAsk: string | null
  clearPendingAsk: () => void
  requestReview: (validationId: string) => void
  requestRca: (validationId: string) => void
  reviewId: string | null
  rcaId: string | null
  clearReview: () => void
  clearRca: () => void
}

const WorkspaceAiContext = createContext<WorkspaceAiValue | null>(null)

export function WorkspaceAiProvider({
  children,
  onOpenAgent,
}: {
  children: ReactNode
  onOpenAgent: () => void
}) {
  const { applicationValues } = useAdmin()
  const enabled = (applicationValues['ai.enabled'] ?? 'Y') !== 'N'
  const [focus, setFocus] = useState<AiFocus>(idleFocus)
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [rcaId, setRcaId] = useState<string | null>(null)
  const [pendingAsk, setPendingAsk] = useState<string | null>(null)

  const requestReview = useCallback((validationId: string) => {
    setRcaId(null)
    setReviewId(validationId)
  }, [])

  const requestRca = useCallback((validationId: string) => {
    setReviewId(null)
    setRcaId(validationId)
  }, [])

  const askAgent = useCallback(
    (text: string) => {
      setPendingAsk(text)
      onOpenAgent()
    },
    [onOpenAgent],
  )

  const clearPendingAsk = useCallback(() => setPendingAsk(null), [])

  const value = useMemo<WorkspaceAiValue>(
    () => ({
      enabled,
      focus,
      setFocus,
      openAgent: onOpenAgent,
      askAgent,
      pendingAsk,
      clearPendingAsk,
      requestReview,
      requestRca,
      reviewId,
      rcaId,
      clearReview: () => setReviewId(null),
      clearRca: () => setRcaId(null),
    }),
    [enabled, focus, onOpenAgent, askAgent, pendingAsk, clearPendingAsk, requestReview, requestRca, reviewId, rcaId],
  )

  return createElement(WorkspaceAiContext.Provider, { value }, children)
}

export function useWorkspaceAi() {
  const value = useContext(WorkspaceAiContext)
  if (!value) throw new Error('useWorkspaceAi must be used within WorkspaceAiProvider')
  return value
}

export function useWorkspaceAiOptional() {
  return useContext(WorkspaceAiContext)
}

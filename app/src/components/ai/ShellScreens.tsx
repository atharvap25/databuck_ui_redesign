import { useEffect } from 'react'
import { useWorkspaceAi } from '../../ai/WorkspaceAiContext.tsx'
import { ClockIcon } from '../icons.tsx'
import EmptyState from '../EmptyState.tsx'

export function ObservabilityView() {
  const { setFocus } = useWorkspaceAi()

  useEffect(() => {
    setFocus({ screen: 'observability' })
  }, [setFocus])

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-surface p-8">
      <EmptyState icon={<ClockIcon />} title="Under Development" description="This area is not available yet." />
    </div>
  )
}
